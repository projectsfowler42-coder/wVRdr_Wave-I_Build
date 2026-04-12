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

        {errors.length > 1 ? (
          <div className="mt-4 rounded-lg border border-border bg-background/50 p-4">
            <div className="text-xs font-semibold text-foreground">Catalog</div>
            <div className="mt-2 grid gap-2">
              {errors.slice(1, 5).map((error) => (
                <div key={error.id} className="rounded-md border border-border/60 bg-card/70 p-3">
                  <div className="text-[10px] text-muted-foreground">{error.kind} · {error.source}</div>
                  <div className="mt-1 text-xs text-foreground">{error.message}</div>
                </div>
              ))}
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}

installGlobalErrorHandlers();

async function boot() {
  try {
    const { default: App } = await import("./App");
    root.render(<App />);
  } catch (error) {
    const resolved = error instanceof Error ? error : new Error(String(error));
    recordRuntimeError({
      kind: "boot",
      message: resolved.message,
      detail: "Wave-I failed during boot or module import before the shell could mount.",
      source: "src/main.tsx",
      stack: resolved.stack ?? null,
    });
    root.render(<BootFailureSurface />);
  }
}

void boot();
