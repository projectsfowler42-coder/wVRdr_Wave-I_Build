import express from "express";
import cors from "cors";
import { z } from "zod";
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";

const PORT = Number(process.env.PORT ?? 8787);
const DATA_DIR = path.join(process.cwd(), "wave-i-data");
const REFRESH_PATH = path.join(DATA_DIR, "latest-refresh.json");
const HARVEST_PATH = path.join(DATA_DIR, "harvests.json");

type Container = "|M|" | "[B]" | "[G]";
type TruthClass = "RAW_MARKET" | "RAW_USER" | "UNRESOLVED" | "FAILED";
type RowStatus = "VALID" | "WATCH" | "FAILED";

type Instrument = {
  ticker: string;
  name: string;
  allowedContainers: Container[];
  instrumentType: "ETF" | "CEF";
  role: string;
  requiresNavCheck: boolean;
  requiresDistributionCheck: boolean;
  active: boolean;
};

type QuoteBlock = {
  price: number | null;
  previousClose: number | null;
  changeDollar: number | null;
  changePct: number | null;
  volume: number | null;
  avgVolume30d: number | null;
  volumeRatio: number | null;
  observedAt: string | null;
  source: string;
  truthClass: TruthClass;
};

type IncomeBlock = {
  selectedYieldPct: number | null;
  selectedYieldType: "DISTRIBUTION_YIELD" | "UNRESOLVED";
  distributionFrequency: "monthly" | "quarterly" | "unknown";
  distributionTrend: "RISING" | "STABLE" | "FALLING" | "CUT_DETECTED" | "UNKNOWN";
  source: string;
  truthClass: TruthClass;
};

type NavBlock = {
  nav: number | null;
  premiumDiscountPct: number | null;
  observedAt: string | null;
  source: string;
  truthClass: TruthClass;
};

type RefreshedInstrumentRow = {
  ticker: string;
  container: Container;
  name: string;
  instrumentType: Instrument["instrumentType"];
  role: string;
  quote: QuoteBlock;
  income: IncomeBlock;
  nav: NavBlock;
  comparable: {
    monthlyIncomePer1000: number | null;
    annualIncomePer1000: number | null;
  };
  status: RowStatus;
  requiredChecksPassed: boolean;
  failedChecks: string[];
  watchChecks: string[];
};

type RefreshError = {
  ticker: string;
  container: Container;
  errorType: "UNSUPPORTED_TICKER" | "BAD_SELECTION";
  message: string;
};

type DataRefreshResponse = {
  refreshRunId: string;
  requestedAt: string;
  refreshedAt: string;
  status: "VALID" | "DEGRADED" | "FAILED";
  rows: RefreshedInstrumentRow[];
  errors: RefreshError[];
};

const INSTRUMENTS: Instrument[] = [
  { ticker: "MINT", name: "PIMCO Enhanced Short Maturity Active ETF", allowedContainers: ["|M|", "[B]"], instrumentType: "ETF", role: "short-duration cash proxy", requiresNavCheck: true, requiresDistributionCheck: true, active: true },
  { ticker: "SGOV", name: "iShares 0-3 Month Treasury Bond ETF", allowedContainers: ["|M|", "[B]"], instrumentType: "ETF", role: "near-cash Treasury reserve", requiresNavCheck: true, requiresDistributionCheck: true, active: true },
  { ticker: "BIL", name: "SPDR Bloomberg 1-3 Month T-Bill ETF", allowedContainers: ["|M|", "[B]"], instrumentType: "ETF", role: "near-cash Treasury reserve", requiresNavCheck: true, requiresDistributionCheck: true, active: true },
  { ticker: "JAAA", name: "Janus Henderson AAA CLO ETF", allowedContainers: ["[B]"], instrumentType: "ETF", role: "Blue AAA CLO anchor", requiresNavCheck: true, requiresDistributionCheck: true, active: true },
  { ticker: "FLOT", name: "iShares Floating Rate Bond ETF", allowedContainers: ["[B]"], instrumentType: "ETF", role: "Blue investment-grade floater", requiresNavCheck: true, requiresDistributionCheck: true, active: true },
  { ticker: "XFLT", name: "XAI Octagon Floating Rate & Alternative Income Trust", allowedContainers: ["[G]"], instrumentType: "CEF", role: "Green bridge-mode high-output accelerator", requiresNavCheck: true, requiresDistributionCheck: true, active: true },
  { ticker: "SRLN", name: "State Street Blackstone Senior Loan ETF", allowedContainers: ["[G]"], instrumentType: "ETF", role: "Green senior-loan ballast", requiresNavCheck: true, requiresDistributionCheck: true, active: true },
  { ticker: "JBBB", name: "Janus Henderson B-BBB CLO ETF", allowedContainers: ["[G]"], instrumentType: "ETF", role: "Green CLO debt income", requiresNavCheck: true, requiresDistributionCheck: true, active: true },
  { ticker: "BKLN", name: "Invesco Senior Loan ETF", allowedContainers: ["[G]"], instrumentType: "ETF", role: "Green senior-loan anchor", requiresNavCheck: true, requiresDistributionCheck: true, active: true },
];

const INSTRUMENT_BY_TICKER = new Map(INSTRUMENTS.map((instrument) => [instrument.ticker, instrument]));
const INCOME_HINTS: Record<string, number> = { XFLT: 15.46, SRLN: 7.63, JBBB: 7.19, BKLN: 7.01, JAAA: 5.13, FLOT: 4.67, MINT: 4.49, SGOV: 4.0, BIL: 4.0 };

const DataRefreshRequestSchema = z.object({
  requestedAt: z.string().optional(),
  selections: z.array(z.object({
    container: z.union([z.literal("|M|"), z.literal("[B]"), z.literal("[G]")]),
    ticker: z.string().min(1),
  })),
});

const HarvestRequestSchema = z.object({
  refreshRunId: z.string().min(1),
  operatorNote: z.string().optional(),
});

function ensureDataDir(): void {
  fs.mkdirSync(DATA_DIR, { recursive: true });
  if (!fs.existsSync(HARVEST_PATH)) fs.writeFileSync(HARVEST_PATH, "[]", "utf8");
}

function nowIso(): string { return new Date().toISOString(); }
function uuid(prefix: string): string { return `${prefix}_${crypto.randomUUID()}`; }
function round(value: number | null, digits = 4): number | null { return value == null || !Number.isFinite(value) ? null : Math.round(value * 10 ** digits) / 10 ** digits; }
function annualIncomePer1000(yieldPct: number | null): number | null { return yieldPct == null ? null : round(1000 * yieldPct / 100, 4); }
function monthlyIncomePer1000(yieldPct: number | null): number | null { const annual = annualIncomePer1000(yieldPct); return annual == null ? null : round(annual / 12, 4); }
function finite(value: unknown): number | null { return typeof value === "number" && Number.isFinite(value) ? value : null; }

async function fetchQuote(ticker: string): Promise<QuoteBlock> {
  const host = "query1.finance.yahoo.com";
  const endpoint = `https://${host}/v8/finance/chart/${encodeURIComponent(ticker)}?interval=1d&range=3mo&includePrePost=true`;
  try {
    const started = Date.now();
    const response = await fetch(endpoint, { headers: { accept: "application/json", "user-agent": "Wave-I-Minimal-Backend/1.0" }, signal: AbortSignal.timeout(12000) });
    if (!response.ok) throw new Error(`http ${response.status}`);
    const payload = await response.json() as any;
    const result = payload?.chart?.result?.[0];
    const meta = result?.meta ?? {};
    const quote = result?.indicators?.quote?.[0] ?? {};
    const closes = (quote.close ?? []).filter((item: unknown) => typeof item === "number") as number[];
    const volumes = (quote.volume ?? []).filter((item: unknown) => typeof item === "number") as number[];
    const price = finite(meta.regularMarketPrice) ?? (closes.length ? closes[closes.length - 1] : null);
    const previousClose = finite(meta.previousClose) ?? finite(meta.chartPreviousClose) ?? (closes.length > 1 ? closes[closes.length - 2] : null);
    const changeDollar = price != null && previousClose != null ? round(price - previousClose, 6) : null;
    const changePct = changeDollar != null && previousClose ? round((changeDollar / previousClose) * 100, 6) : null;
    const volume = finite(meta.regularMarketVolume) ?? (volumes.length ? volumes[volumes.length - 1] : null);
    const recentVolumes = volumes.slice(-30);
    const avgVolume30d = recentVolumes.length ? round(recentVolumes.reduce((sum, item) => sum + item, 0) / recentVolumes.length, 0) : null;
    const volumeRatio = volume != null && avgVolume30d != null && avgVolume30d > 0 ? round(volume / avgVolume30d, 6) : null;
    const marketTime = finite(meta.regularMarketTime);
    return { price, previousClose, changeDollar, changePct, volume, avgVolume30d, volumeRatio, observedAt: marketTime ? new Date(marketTime * 1000).toISOString() : nowIso(), source: `yahoo-chart latencyMs=${Date.now() - started}`, truthClass: price != null ? "RAW_MARKET" : "FAILED" };
  } catch (error) {
    return { price: null, previousClose: null, changeDollar: null, changePct: null, volume: null, avgVolume30d: null, volumeRatio: null, observedAt: nowIso(), source: `yahoo-chart failed: ${error instanceof Error ? error.message : String(error)}`, truthClass: "FAILED" };
  }
}

async function fetchIncome(ticker: string): Promise<IncomeBlock> {
  const selectedYieldPct = INCOME_HINTS[ticker] ?? null;
  return { selectedYieldPct, selectedYieldType: selectedYieldPct == null ? "UNRESOLVED" : "DISTRIBUTION_YIELD", distributionFrequency: selectedYieldPct == null ? "unknown" : "monthly", distributionTrend: ticker === "XFLT" ? "CUT_DETECTED" : "UNKNOWN", source: selectedYieldPct == null ? "no income adapter available" : "operator-seed; verify issuer before use", truthClass: "UNRESOLVED" };
}

async function fetchNav(ticker: string): Promise<NavBlock> {
  return { nav: null, premiumDiscountPct: null, observedAt: null, source: ticker === "XFLT" ? "nav adapter missing; XFLT blocked until issuer NAV wired" : "nav adapter not wired", truthClass: "UNRESOLVED" };
}

function validateSelection(container: Container, ticker: string): RefreshError | null {
  const instrument = INSTRUMENT_BY_TICKER.get(ticker);
  if (!instrument || !instrument.active) return { ticker, container, errorType: "UNSUPPORTED_TICKER", message: `${ticker} is not in the active Wave-I bridge instrument list.` };
  if (!instrument.allowedContainers.includes(container)) return { ticker, container, errorType: "BAD_SELECTION", message: `${ticker} is not allowed in ${container}.` };
  return null;
}

function runChecks(row: Omit<RefreshedInstrumentRow, "status" | "requiredChecksPassed" | "failedChecks" | "watchChecks">): Pick<RefreshedInstrumentRow, "status" | "requiredChecksPassed" | "failedChecks" | "watchChecks"> {
  const failed: string[] = [];
  const watch: string[] = [];
  if (row.quote.truthClass === "FAILED" || row.quote.price == null || row.quote.price <= 0) failed.push("quote price missing or failed");
  if (!row.quote.observedAt) failed.push("quote timestamp missing");
  if (row.income.selectedYieldPct == null || row.income.selectedYieldPct < 0) failed.push("selected yield missing");
  if (row.income.truthClass !== "RAW_MARKET") watch.push("income facts are not official-wired yet");
  if (row.ticker === "XFLT" && row.nav.nav == null) failed.push("XFLT requires NAV and NAV is missing");
  else if (row.nav.nav == null) watch.push("NAV missing");
  if (row.income.distributionTrend === "CUT_DETECTED") watch.push("distribution cut detected");
  if (failed.length) return { status: "FAILED", requiredChecksPassed: false, failedChecks: failed, watchChecks: watch };
  if (watch.length) return { status: "WATCH", requiredChecksPassed: true, failedChecks: failed, watchChecks: watch };
  return { status: "VALID", requiredChecksPassed: true, failedChecks: failed, watchChecks: watch };
}

async function refreshOne(container: Container, ticker: string): Promise<{ row?: RefreshedInstrumentRow; error?: RefreshError }> {
  const upper = ticker.toUpperCase().trim();
  const selectionError = validateSelection(container, upper);
  if (selectionError) return { error: selectionError };
  const instrument = INSTRUMENT_BY_TICKER.get(upper)!;
  const quote = await fetchQuote(upper);
  const income = await fetchIncome(upper);
  const nav = await fetchNav(upper);
  const baseRow = { ticker: upper, container, name: instrument.name, instrumentType: instrument.instrumentType, role: instrument.role, quote, income, nav, comparable: { monthlyIncomePer1000: monthlyIncomePer1000(income.selectedYieldPct), annualIncomePer1000: annualIncomePer1000(income.selectedYieldPct) } };
  return { row: { ...baseRow, ...runChecks(baseRow) } };
}

function overallStatus(rows: RefreshedInstrumentRow[], errors: RefreshError[]): DataRefreshResponse["status"] {
  if (!rows.length || errors.length || rows.some((row) => row.status === "FAILED")) return "FAILED";
  if (rows.some((row) => row.status === "WATCH")) return "DEGRADED";
  return "VALID";
}

function saveLatest(refresh: DataRefreshResponse): void { ensureDataDir(); fs.writeFileSync(REFRESH_PATH, JSON.stringify(refresh, null, 2), "utf8"); }
function loadLatest(): DataRefreshResponse | null { ensureDataDir(); if (!fs.existsSync(REFRESH_PATH)) return null; try { return JSON.parse(fs.readFileSync(REFRESH_PATH, "utf8")) as DataRefreshResponse; } catch { return null; } }
function loadHarvests(): unknown[] { ensureDataDir(); try { return JSON.parse(fs.readFileSync(HARVEST_PATH, "utf8")) as unknown[]; } catch { return []; } }
function saveHarvests(harvests: unknown[]): void { ensureDataDir(); fs.writeFileSync(HARVEST_PATH, JSON.stringify(harvests, null, 2), "utf8"); }

const app = express();
app.use(cors());
app.use(express.json({ limit: "2mb" }));

app.get("/api/wave-i/health", (_req, res) => res.json({ status: "OK", checkedAt: nowIso(), mode: "OPERATOR_TRIGGERED_MINIMAL_LIVE_BACKEND", rules: { timedRefresh: false, polling: false, autonomousExecution: false, tradeExecution: false }, storage: { dataDir: DATA_DIR, latestRefreshExists: Boolean(loadLatest()), harvestCount: loadHarvests().length } }));
app.get("/api/wave-i/instruments", (_req, res) => res.json({ status: "VALID", instruments: INSTRUMENTS, namingRule: { MINT: "ETF ticker", "|M|": "wallet" } }));
app.get("/api/wave-i/latest-refresh", (_req, res) => { const latest = loadLatest(); if (!latest) res.status(404).json({ status: "FAILED", message: "No refresh has been run yet." }); else res.json(latest); });
app.get("/api/wave-i/harvests", (_req, res) => res.json({ status: "VALID", harvests: loadHarvests() }));

app.post("/api/wave-i/data-refresh", async (req, res) => {
  const parsed = DataRefreshRequestSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ refreshRunId: uuid("refresh_failed"), requestedAt: nowIso(), refreshedAt: nowIso(), status: "FAILED", rows: [], errors: [{ ticker: "(request)", container: "|M|", errorType: "BAD_SELECTION", message: parsed.error.message }] } satisfies DataRefreshResponse);
  const rows: RefreshedInstrumentRow[] = [];
  const errors: RefreshError[] = [];
  const unique = new Map<string, { container: Container; ticker: string }>();
  for (const selection of parsed.data.selections) unique.set(`${selection.container}:${selection.ticker.toUpperCase().trim()}`, { container: selection.container, ticker: selection.ticker.toUpperCase().trim() });
  for (const selection of unique.values()) { const result = await refreshOne(selection.container, selection.ticker); if (result.row) rows.push(result.row); if (result.error) errors.push(result.error); }
  const response: DataRefreshResponse = { refreshRunId: uuid("refresh"), requestedAt: parsed.data.requestedAt ?? nowIso(), refreshedAt: nowIso(), status: overallStatus(rows, errors), rows, errors };
  saveLatest(response);
  return res.json(response);
});

app.post("/api/wave-i/harvest", (req, res) => {
  const parsed = HarvestRequestSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ status: "FAILED", message: parsed.error.message });
  const latest = loadLatest();
  if (!latest) return res.status(409).json({ status: "FAILED", message: "No latest refresh exists." });
  if (latest.refreshRunId !== parsed.data.refreshRunId) return res.status(409).json({ status: "FAILED", message: "Harvest blocked. refreshRunId does not match latest refreshed state.", latestRefreshRunId: latest.refreshRunId, requestedRefreshRunId: parsed.data.refreshRunId });
  const failedRows = latest.rows.filter((row) => row.status === "FAILED").length;
  if (failedRows > 0) return res.status(409).json({ status: "FAILED", message: "Harvest blocked because one or more rows failed required checks.", failedRows });
  const snapshot = { harvestRunId: uuid("harvest"), sourceRefreshRunId: latest.refreshRunId, harvestedAt: nowIso(), status: latest.status === "VALID" ? "VALID" : "DEGRADED", rows: latest.rows, operatorNote: parsed.data.operatorNote };
  const harvests = loadHarvests();
  harvests.push(snapshot);
  saveHarvests(harvests);
  return res.json({ harvestRunId: snapshot.harvestRunId, sourceRefreshRunId: snapshot.sourceRefreshRunId, harvestedAt: snapshot.harvestedAt, status: snapshot.status, totalRows: latest.rows.length, snapshotStored: true });
});

app.get("/", (_req, res) => res.type("text/plain").send("Wave-I minimal backend. Operator-triggered refresh only. No timers. No polling. No trading."));

ensureDataDir();
app.listen(PORT, () => console.log(`Wave-I minimal backend listening on http://localhost:${PORT}`));
