import { spawn } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

const repoRoot = process.cwd();
const port = Number(process.env.WAVE_I_SMOKE_PORT ?? 8797);
const baseUrl = `http://127.0.0.1:${port}`;
const dataDir = path.join(repoRoot, "wave-i-data");
const latestRefreshPath = path.join(dataDir, "latest-refresh.json");
const harvestPath = path.join(dataDir, "harvests.json");
const timeoutMs = 20_000;

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function waitForHealth() {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    try {
      const response = await fetch(`${baseUrl}/api/wave-i/health`);
      if (response.ok) return await response.json();
    } catch {
      // wait and retry
    }
    await sleep(250);
  }
  throw new Error("backend did not become healthy before timeout");
}

async function request(pathname, init) {
  const response = await fetch(`${baseUrl}${pathname}`, init);
  let body;
  try {
    body = await response.json();
  } catch {
    body = await response.text();
  }
  return { status: response.status, body };
}

function resetRuntimeFiles() {
  fs.mkdirSync(dataDir, { recursive: true });
  fs.writeFileSync(harvestPath, "[]", "utf8");
  try {
    fs.rmSync(latestRefreshPath, { force: true });
  } catch {
    // no-op
  }
}

function writeBlockedLatestRefresh() {
  const latest = {
    refreshRunId: "refresh_smoke_blocked",
    requestedAt: new Date().toISOString(),
    refreshedAt: new Date().toISOString(),
    status: "DEGRADED",
    rows: [
      {
        ticker: "BKLN",
        container: "[G]",
        name: "Smoke Test Row",
        issuer: "Smoke",
        instrumentType: "ETF",
        role: "smoke",
        quote: {},
        income: {},
        nav: {},
        comparable: {},
        position: {},
        status: "UNRESOLVED",
        requiredChecksPassed: false,
        comparableReady: false,
        failedChecks: [],
        watchChecks: [],
        unresolvedChecks: ["NAV missing"],
      },
    ],
    errors: [],
    rules: {
      selectedTickersOnly: true,
      timedRefresh: false,
      polling: false,
      autonomousRefresh: false,
      autonomousExecution: false,
      secretFetchDuringHarvest: false,
    },
  };
  fs.writeFileSync(latestRefreshPath, JSON.stringify(latest, null, 2), "utf8");
}

function readHarvestCount() {
  try {
    const harvests = JSON.parse(fs.readFileSync(harvestPath, "utf8"));
    return Array.isArray(harvests) ? harvests.length : 0;
  } catch {
    return 0;
  }
}

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

async function main() {
  resetRuntimeFiles();

  const child = spawn("pnpm", ["start:wave-i-backend"], {
    cwd: repoRoot,
    env: { ...process.env, PORT: String(port) },
    stdio: ["ignore", "pipe", "pipe"],
  });

  let output = "";
  child.stdout.on("data", (chunk) => { output += chunk.toString(); });
  child.stderr.on("data", (chunk) => { output += chunk.toString(); });

  try {
    const health = await waitForHealth();
    assert(health.status === "OK", "health endpoint did not return OK");
    assert(health.rules?.timedRefresh === false, "timed refresh must remain false");
    assert(health.rules?.polling === false, "polling must remain false");
    assert(health.rules?.autonomousExecution === false, "autonomous execution must remain false");

    const instruments = await request("/api/wave-i/instruments");
    assert(instruments.status === 200, "instruments endpoint failed");
    assert(Array.isArray(instruments.body.instruments), "instruments payload missing list");
    assert(instruments.body.instruments.some((item) => item.ticker === "BKLN"), "BKLN missing from instruments");

    writeBlockedLatestRefresh();
    const before = readHarvestCount();
    const harvest = await request("/api/wave-i/harvest", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refreshRunId: "refresh_smoke_blocked" }),
    });
    const after = readHarvestCount();

    assert(harvest.status === 409, `harvest should be blocked with 409, got ${harvest.status}`);
    assert(harvest.body?.status === "FAILED", "blocked harvest should report FAILED");
    assert(harvest.body?.blockedRows === 1, "blocked harvest should report one blocked row");
    assert(after === before, "blocked harvest must not append a snapshot");

    console.log(JSON.stringify({ ok: true, mode: "wave_i_backend_smoke", port, health: health.status, blockedHarvestStatus: harvest.status }, null, 2));
  } finally {
    child.kill("SIGTERM");
    await sleep(500);
    if (!child.killed) child.kill("SIGKILL");
    if (process.env.WAVE_I_KEEP_SMOKE_DATA !== "1") {
      fs.rmSync(dataDir, { recursive: true, force: true });
    }
    if (output.includes("EADDRINUSE")) {
      console.error(output);
    }
  }
}

main().catch((error) => {
  console.error(JSON.stringify({ ok: false, error: error instanceof Error ? error.message : String(error) }, null, 2));
  process.exit(1);
});
