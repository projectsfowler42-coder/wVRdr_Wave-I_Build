import { type Quote, type QuoteRefreshStatus } from "@/lib/market";
import { containerAccent, containerLabel } from "@/lib/containerModel";
import type { ActiveContainerClass } from "@/lib/portfolio";
import { fmtDollar, fmtMillions, fmtPct, signClass } from "@/lib/utils";
import { ArrowUpRight, ArrowDownRight, Minus } from "lucide-react";

interface QuoteCardProps {
  container: ActiveContainerClass;
  ticker: string;
  quote: Quote | undefined;
  loading: boolean;
  error: boolean;
  status?: QuoteRefreshStatus | null;
}

function StatRow({ label, value, valueClass }: { label: string; value: string; valueClass?: string }) {
  return (
    <div className="flex items-center justify-between py-1.5 border-b border-border/40 last:border-0">
      <span className="text-xs text-muted-foreground">{label}</span>
      <span className={`text-xs num font-medium ${valueClass ?? "text-foreground"}`}>{value}</span>
    </div>
  );
}

function freshnessLabel(status?: QuoteRefreshStatus | null, quote?: Quote): string {
  if (!status) return quote?.timestamp ? "local-snapshot" : "missing";
  switch (status.status) {
    case "refreshed":
      return "fresh";
    case "reused-local":
      return "reused-local";
    case "failed":
      return quote?.timestamp ? "stale" : "missing";
  }
}

export default function QuoteCard({ container, ticker, quote, loading, error, status }: QuoteCardProps) {
  const accent = containerAccent(container);
  const heading = containerLabel(container);
  const freshness = freshnessLabel(status, quote);

  if (loading) {
    return (
      <div className={`rounded-lg border ${accent.border} ${accent.dim} p-4 animate-pulse`}>
        <div className="h-4 bg-muted rounded w-24 mb-3" />
        <div className="h-10 bg-muted rounded w-40 mb-2" />
        <div className="h-3 bg-muted rounded w-20" />
      </div>
    );
  }

  if (error || !quote || quote.price == null) {
    return (
      <div className={`rounded-lg border ${accent.border} ${accent.dim} p-4`}>
        <div className={`text-xs font-bold tracking-widest uppercase mb-2 ${accent.text}`}>{heading} · {ticker || "—"}</div>
        <div className="text-muted-foreground text-sm">No local quote snapshot available.</div>
        <div className="mt-2 text-[10px] uppercase tracking-widest text-muted-foreground">
          {freshness} · {status?.source ?? "none"}
        </div>
      </div>
    );
  }

  const chgClass = signClass(quote.changePct);
  const Arrow = quote.changePct == null ? Minus : quote.changePct > 0 ? ArrowUpRight : quote.changePct < 0 ? ArrowDownRight : Minus;
  const ts = quote.timestamp ? new Date(quote.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "—";

  return (
    <div className={`rounded-lg border ${accent.border} ${accent.dim} p-4`}>
      <div className="flex items-start justify-between mb-3">
        <div>
          <div className={`text-xs font-bold tracking-widest uppercase ${accent.text}`}>{heading}</div>
          <div className="text-xs text-muted-foreground">{ticker}</div>
        </div>
        <div className="text-right">
          <div className="text-[10px] text-muted-foreground">Snapshot {ts}</div>
          <div className="text-[10px] text-muted-foreground uppercase tracking-widest">
            {freshness} · {status?.source ?? "local"}
          </div>
        </div>
      </div>

      <div className="flex items-end gap-3 mb-4">
        <div className="text-4xl font-bold num text-foreground">{fmtDollar(quote.price)}</div>
        <div className={`flex items-center gap-0.5 text-sm font-semibold num mb-1 ${chgClass}`}>
          <Arrow size={14} />
          <span>{fmtDollar(quote.change)}</span>
          <span className="ml-1">({fmtPct(quote.changePct)})</span>
        </div>
      </div>

      {quote.isAfterHours && quote.afterHoursPrice != null && (
        <div className="flex items-center gap-2 mb-3 px-2 py-1.5 rounded bg-muted/40 border border-border/40">
          <span className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">After-Hrs</span>
          <span className={`text-sm num font-semibold ${signClass(quote.afterHoursChangePct)}`}>
            {fmtDollar(quote.afterHoursPrice)}
          </span>
          <span className={`text-xs num ${signClass(quote.afterHoursChangePct)}`}>
            {fmtDollar(quote.afterHoursChange)} ({fmtPct(quote.afterHoursChangePct)})
          </span>
        </div>
      )}

      <div className="space-y-0">
        <StatRow label="Prev Close" value={fmtDollar(quote.previousClose)} />
        <StatRow label="Open" value={fmtDollar(quote.open)} />
        <StatRow label="Day Range" value={`${fmtDollar(quote.dayLow)} – ${fmtDollar(quote.dayHigh)}`} />
        <StatRow label="52W Range" value={`${fmtDollar(quote.fiftyTwoWeekLow)} – ${fmtDollar(quote.fiftyTwoWeekHigh)}`} />
        <StatRow label="Volume" value={quote.volume != null ? Number(quote.volume).toLocaleString() : "—"} />
        <StatRow label="Avg Volume" value={quote.avgVolume != null ? Number(quote.avgVolume).toLocaleString() : "—"} />
        <StatRow label="Market Cap" value={fmtMillions(quote.marketCap)} />
      </div>
    </div>
  );
}
