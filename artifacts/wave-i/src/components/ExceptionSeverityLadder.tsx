import type { HarvestRunState } from "@/block2/truth/canonical-types";
import type { Quote, QuoteRefreshStatus } from "@/lib/market";
import type { Holding } from "@/lib/portfolio";

const STALE_QUOTE_MS = 24 * 60 * 60 * 1000;

type Severity = "P0" | "P1" | "P2" | "P3";

interface ExceptionSeverityLadderProps {
  holdings: Holding[];
  quotesByTicker: Record<string, Quote | undefined>;
  refreshStatuses: QuoteRefreshStatus[];
  harvestState: HarvestRunState;
  nowMs: number;
}

interface SeverityRow {
  severity: Severity;
  label: string;
  count: number;
  detail: string;
  action: string;
}

function hasUsableQuote(quote: Quote | undefined): boolean {
  return Boolean(quote && quote.price != null && quote.timestamp > 0);
}

function isStale(quote: Quote | undefined, nowMs: number): boolean {
  return hasUsableQuote(quote) && nowMs - quote.timestamp > STALE_QUOTE_MS;
}

function tone(severity: Severity): string {
  switch (severity) {
    case "P0":
      return "border-red-300 bg-red-50 text-red-900";
    case "P1":
      return "border-orange-300 bg-orange-50 text-orange-900";
    case "P2":
      return "border-amber-300 bg-amber-50 text-amber-900";
    case "P3":
      return "border-slate-200 bg-slate-50 text-slate-700";
  }
}

export default function ExceptionSeverityLadder({
  holdings,
  quotesByTicker,
  refreshStatuses,
  harvestState,
  nowMs,
}: ExceptionSeverityLadderProps) {
  const uniqueHoldingTickers = [...new Set(holdings.map((holding) => holding.ticker.toUpperCase()))];
  const failedStatuses = refreshStatuses.filter((status) => status.status === "failed");
  const missingTickers = uniqueHoldingTickers.filter((ticker) => !hasUsableQuote(quotesByTicker[ticker]));
  const staleTickers = uniqueHoldingTickers.filter((ticker) => isStale(quotesByTicker[ticker], nowMs));
  const reusedStatuses = refreshStatuses.filter((status) => status.status === "reused-local");

  const rows: SeverityRow[] = [
    {
      severity: "P0",
      label: "Blocking",
      count: holdings.length > 0 && missingTickers.length === uniqueHoldingTickers.length ? missingTickers.length : 0,
      detail: "No tracked holding has a usable quote mark.",
      action: "Do not rely on capital totals until quote coverage recovers.",
    },
    {
      severity: "P1",
      label: "Degraded",
      count: failedStatuses.length + missingTickers.length,
      detail: "Refresh failure or missing quote data affects tracked holdings.",
      action: "Treat affected rows as untrusted and inspect exceptions before sizing.",
    },
    {
      severity: "P2",
      label: "Stale",
      count: staleTickers.length + reusedStatuses.length,
      detail: "Cached or reused data is still usable but no longer fresh.",
      action: "Use as fallback context only; refresh before committing capital.",
    },
    {
      severity: "P3",
      label: "Informational",
      count: harvestState === "idle" || holdings.length === 0 ? 1 : 0,
      detail: "No active exception, or no holdings exist yet.",
      action: "Add positions or run refresh to generate stronger telemetry.",
    },
  ];

  const activeRows = rows.filter((row) => row.count > 0);
  const highestSeverity = activeRows[0]?.severity ?? "P3";

  return (
    <section className="rounded-2xl border border-border bg-card p-4 shadow-sm">
      <div className="flex flex-col gap-1 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Exception severity ladder</h2>
          <div className="mt-1 text-sm font-semibold text-foreground">Highest active severity: {highestSeverity}</div>
        </div>
        <span className="text-[11px] text-muted-foreground md:text-right">
          Severity is derived from missing quotes, failed refreshes, stale cache, and current holding coverage.
        </span>
      </div>

      <div className="mt-3 grid gap-2 md:grid-cols-2 xl:grid-cols-4">
        {rows.map((row) => (
          <div key={row.severity} className={`rounded-xl border p-3 text-xs ${row.count > 0 ? tone(row.severity) : "border-border bg-background/60 text-muted-foreground"}`}>
            <div className="flex items-center justify-between gap-2">
              <span className="text-sm font-bold">{row.severity}</span>
              <span className="uppercase tracking-wider">{row.label}</span>
            </div>
            <div className="mt-2 text-lg font-semibold">{row.count}</div>
            <div className="mt-1 text-[11px] opacity-85">{row.detail}</div>
            <div className="mt-2 text-[11px] font-medium opacity-90">{row.action}</div>
          </div>
        ))}
      </div>
    </section>
  );
}
