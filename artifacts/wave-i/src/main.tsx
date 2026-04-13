import { createRoot } from "react-dom/client";
import "./index.css";
import {
  installGlobalErrorHandlers,
  recordRuntimeError,
  snapshotRuntimeErrors,
} from "@/runtime/governance/ErrorCatalog";

const rootElement = document.getElementById("root");

if (!rootElement) {
  throw new Error("Wave-I root mount element was not found.");
}

const root = createRoot(rootElement);

function createBootProbe() {
  const container = document.createElement("div");
  container.id = "wavei-boot-probe";
  container.setAttribute(
    "style",
    [
      "position:fixed",
      "right:12px",
      "bottom:12px",
      "z-index:2147483647",
      "background:rgba(15,23,42,0.96)",
      "color:#e5f0ff",
      "border:1px solid rgba(125,211,252,0.45)",
      "border-radius:14px",
      "padding:10px 12px",
      "font-family:ui-monospace, SFMono-Regular, Menlo, monospace",
      "box-shadow:0 12px 40px rgba(0,0,0,0.45)",
      "width:min(92vw,420px)",
      "backdrop-filter:blur(10px)",
    ].join(";"),
  );

  container.innerHTML = [
    '<div style="display:flex;align-items:center;justify-content:space-between;gap:12px;">',
    '<div style="font-size:11px;letter-spacing:0.18em;text-transform:uppercase;color:#7dd3fc;">Wave-I boot probe</div>',
    '<button id="wavei-boot-probe-toggle" type="button" style="border:1px solid rgba(148,163,184,0.35);background:rgba(15,23,42,0.65);color:#cbd5e1;border-radius:999px;padding:4px 8px;font-size:10px;cursor:pointer;">minimize</button>',
    "</div>",
    '<div id="wavei-boot-probe-body" style="margin-top:8px;white-space:pre-wrap;">',
    '<div id="wavei-boot-probe-stage" style="font-size:14px;font-weight:700;">initializing…</div>',
    '<div id="wavei-boot-probe-detail" style="margin-top:6px;font-size:12px;color:#cbd5e1;">The UI should not be able to fail silently after this patch.</div>',
    "</div>",
  ].join("");

  document.body.appendChild(container);

  const stage = container.querySelector("#wavei-boot-probe-stage") as HTMLDivElement | null;
  const detail = container.querySelector("#wavei-boot-probe-detail") as HTMLDivElement | null;
  const body = container.querySelector("#wavei-boot-probe-body") as HTMLDivElement | null;
  const toggle = container.querySelector("#wavei-boot-probe-toggle") as HTMLButtonElement | null;

  let collapsed = false;

  const syncCollapsed = () => {
    if (body) body.style.display = collapsed ? "none" : "block";
    if (toggle) toggle.textContent = collapsed ? "expand" : "minimize";
    container.style.width = collapsed ? "auto" : "min(92vw,420px)";
    container.style.padding = collapsed ? "8px 10px" : "10px 12px";
  };

  toggle?.addEventListener("click", () => {
    collapsed = !collapsed;
    syncCollapsed();
  });

  syncCollapsed();

  return {
    set(stageText: string, detailText?: string) {
      if (stage) stage.textContent = stageText;
      if (detail && detailText) detail.textContent = detailText;
    },
    fail(stageText: string, detailText?: string) {
      container.style.borderColor = "rgba(248,113,113,0.65)";
      container.style.background = "rgba(37,10,10,0.96)";
      collapsed = false;
      syncCollapsed();
      if (stage) stage.textContent = stageText;
      if (detail && detailText) detail.textContent = detailText;
    },
    collapse() {
      collapsed = true;
      syncCollapsed();
    },
    expand() {
      collapsed = false;
      syncCollapsed();
    },
  };
}

const probe = createBootProbe();
probe.set("root located", "Wave-I found the mount target and is starting boot.");

function BootFailureSurface() {
  const errors = snapshotRuntimeErrors();
  const latest = errors[0] ?? null;

  return (
    <div className="min-h-screen bg-background text-foreground flex items-center justify-center p-4">
      <div className="w-full max-w-3xl rounded-xl border border-border bg-card p-5 shadow-2xl shadow-black/30">
        <div className="text-[11px] uppercase tracking-[0.24em] text-muted-foreground">
          Wave-I Boot Fault Surface
        </div>
        <h1 className="mt-2 text-xl font-semibold">Wave-I failed before the shell mounted</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          The app did not boot cleanly. The failure is now logged locally instead of collapsing into a silent black page.
        </p>

        {latest ? (
          <div className="mt-4 rounded-lg border border-border bg-background/70 p-4">
            <div className="text-xs font-semibold text-foreground">Latest fault</div>
            <div className="mt-2 text-sm text-foreground">{latest.message}</div>
            <div className="mt-2 text-xs text-muted-foreground">{latest.explanation}</div>
            <div className="mt-3 text-[10px] text-muted-foreground">id: {latest.id}</div>
            <div className="text-[10px] text-muted-foreground">source: {latest.source}</div>
            {latest.detail ? (
              <pre className="mt-3 whitespace-pre-wrap break-words rounded-md border border-border/70 bg-card p-3 text-[10px] text-muted-foreground">
                {latest.detail}
              </pre>
            ) : null}
            {latest.stack ? (
              <pre className="mt-3 max-h-52 overflow-auto whitespace-pre-wrap break-words rounded-md border border-border/70 bg-card p-3 text-[10px] text-muted-foreground">
                {latest.stack}
              </pre>
            ) : null}
          </div>
        ) : null}
      </div>
    </div>
  );
}

installGlobalErrorHandlers();
probe.set("global handlers installed", "Window errors and unhandled promise rejections are now being cataloged.");

async function boot() {
  try {
    probe.set("importing App module", "If the screen stays blank after this, the probe should still remain visible.");
    const { default: App } = await import("./App");
    probe.set("App imported", "Rendering the Wave-I shell now.");
    root.render(<App />);
    window.setTimeout(() => {
      probe.set(
        "render committed",
        "Tap expand if you need diagnostics. The app mounted and the probe is now minimized by default.",
      );
      probe.collapse();
    }, 150);
  } catch (error) {
    const resolved = error instanceof Error ? error : new Error(String(error));
    const record = recordRuntimeError({
      kind: "boot",
      message: resolved.message,
      detail: "Wave-I failed during boot or module import before the shell could mount.",
      source: "src/main.tsx",
      stack: resolved.stack ?? null,
    });
    probe.fail("boot failed", `${record.message} | ${record.source}`);
    root.render(<BootFailureSurface />);
  }
}

void boot();
