import type { Quote, QuoteRefreshStatus } from "@/lib/market";
import type { Holding } from "@/lib/portfolio";

const STALE_QUOTE_MS = 24 * 60 * 60 * 1000;

type QualityState = "fresh" | "stale" | "missing" | "failed";

interface DataQualityLedgerProps {
  holdings: Holding[];
  quotesByTicker: Record<string, Quote | undefined>;
  refreshStatuses: QuoteRefreshStatus[];
  nowMs: number;
}

function classifyQuality(
  quote: Quote | undefined,
  status: QuoteRefreshStatus | undefined,
  nowMs: number,
): QualityState {
  if (status?.status === "failed") return "failed";
  if (!quote || quote.price == null || quote.timestamp <= 0) return "missing";
  if (nowMs - quote.timestamp > STALE_QUOTE_MS) return "stale";
  return "fresh";
}

function formatAge(timestamp: number | undefined, nowMs: number): string {
  if (!timestamp || timestamp <= 0) return "no timestamp";
  const ageHours = Math.max(0, Math.round((nowMs - timestamp) / (60 * 60 * 1000)));
  if (ageHours < 1) return "under 1h";
  if (ageHours < 48) return `${ageHours}h`;
  return `${Math.round(ageHours / 24)}d`;
}

function stateTone(state: QualityState): string {
  switch (state) {
    case "fresh":
      return "border-emerald-200 bg-emerald-50 text-emerald-800";
    case "stale":
      return "border-amber-200 bg-amber-50 text-amber-800";
    case "failed":
      return "border-red-200 bg-red-50 text-red-800";
    case "missing":
      return "border-slate-200 bg-slate-50 text-slate-700";
  }
}

export default function DataQualityLedger({
  holdings,
  quotesByTicker,
  refreshStatuses,
  nowMs,
}: DataQualityLedgerProps) {
  const statusByTicker = new Map(refreshStatuses.map((status) => [status.symbol, status]));
  const rows = holdings.map((holding) => {
    const ticker = holding.ticker.toUpperCase();
    const quote = quotesByTicker[ticker];
    const status = statusByTicker.get(ticker);
    const quality = classifyQuality(quote, status, nowMs);
    return {
      id: holding.id,
      ticker,
      container: holding.container,
      quality,
      source: status?.source ?? "local-cache",
      age: formatAge(quote?.timestamp, nowMs),
      reason: status?.reason ?? (quote?.price == null ? "No cached quote price" : "Cached quote available"),
    };
  });

  const counts = rows.reduce<Record<QualityState, number>>(
    (acc, row) => {
      acc[row.quality] += 1;
      return acc;
    },
    { fresh: 0, stale: 0, missing: 0, failed: 0 },
  );

  return (
    <section className="rounded-2xl border border-border bg-card p-4 shadow-sm">
      <div className="flex flex-col gap-1 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Data-quality ledger</h2>
          <div className="mt-1 text-sm font-semibold text-foreground">
            {counts.fresh} fresh · {counts.stale} stale · {counts.missing} missing · {counts.failed} failed
          </div>
        </div>
        <span className="text-[11px] text-muted-foreground md:text-right">
          Quote freshness gate: 24h. Failed refreshes override cached comfort.
        </span>
      </div>

      {rows.length === 0 ? (
        <div className="mt-3 rounded-xl border border-border bg-background/60 p-3 text-xs text-muted-foreground">
          No holdings loaded. The ledger will activate after positions exist.
        </div>
      ) : (
        <div className="mt-3 grid gap-2 md:grid-cols-2 xl:grid-cols-4">
          {rows.slice(0, 8).map((row) => (
            <div key={row.id} className={`rounded-xl border p-3 text-xs ${stateTone(row.quality)}`}>
              <div className="flex items-center justify-between gap-2">
                <span className="font-bold uppercase tracking-widest">{row.ticker}</span>
                <span className="uppercase tracking-wider">{row.quality}</span>
              </div>
              <div className="mt-2 grid grid-cols-2 gap-2 text-[11px]">
                <span>container</span>
                <span className="text-right font-semibold">{row.container}</span>
                <span>source</span>
                <span className="text-right font-semibold">{row.source}</span>
                <span>age</span>
                <span className="text-right font-semibold">{row.age}</span>
              </div>
              <div className="mt-2 text-[11px] opacity-80">{row.reason}</div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
