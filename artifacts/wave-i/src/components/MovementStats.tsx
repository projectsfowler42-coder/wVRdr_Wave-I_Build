import { type Quote } from "@/lib/market";
import { fmtDollar, fmtPct, fmt } from "@/lib/utils";

interface MovementStatsProps {
  blueQuote?: Quote;
  greenQuote?: Quote;
}

function MovBar({ pct, color }: { pct: number; color: "blue" | "green" }) {
  const fill = Math.max(0, Math.min(100, pct));
  const barClass = color === "blue" ? "bg-blue" : "bg-green";
  return (
    <div className="w-full h-1.5 rounded-full bg-muted mt-1">
      <div className={`h-full rounded-full ${barClass}`} style={{ width: `${fill}%` }} />
    </div>
  );
}

function QuotePosition({ quote, color }: { quote: Quote; color: "blue" | "green" }) {
  const labelClass = color === "blue" ? "text-blue" : "text-green";
  const label = color === "blue" ? "BLUE · ARCC" : "GREEN · AGNC";

  const price = quote.price;
  const lo52 = quote.fiftyTwoWeekLow;
  const hi52 = quote.fiftyTwoWeekHigh;
  const lo = quote.dayLow;
  const hi = quote.dayHigh;

  let pos52: number | null = null;
  if (price != null && lo52 != null && hi52 != null && hi52 > lo52) {
    pos52 = ((price - lo52) / (hi52 - lo52)) * 100;
  }

  let posDay: number | null = null;
  if (price != null && lo != null && hi != null && hi > lo) {
    posDay = ((price - lo) / (hi - lo)) * 100;
  }

  const chgFromLo52 = price != null && lo52 != null ? ((price - lo52) / lo52) * 100 : null;
  const chgFromHi52 = price != null && hi52 != null ? ((price - hi52) / hi52) * 100 : null;

  return (
    <div>
      <div className={`text-xs font-bold uppercase tracking-widest mb-2 ${labelClass}`}>{label}</div>
      <div className="space-y-3">
        <div>
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground">Day range position</span>
            <span className="num text-foreground">{posDay != null ? `${fmt(posDay, 0)}%` : "—"}</span>
          </div>
          {posDay != null && <MovBar pct={posDay} color={color} />}
          <div className="flex justify-between text-[10px] text-muted-foreground mt-0.5">
            <span>{fmtDollar(lo)}</span>
            <span>{fmtDollar(hi)}</span>
          </div>
        </div>
        <div>
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground">52W range position</span>
            <span className="num text-foreground">{pos52 != null ? `${fmt(pos52, 0)}%` : "—"}</span>
          </div>
          {pos52 != null && <MovBar pct={pos52} color={color} />}
          <div className="flex justify-between text-[10px] text-muted-foreground mt-0.5">
            <span>{fmtDollar(lo52)}</span>
            <span>{fmtDollar(hi52)}</span>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div className="rounded bg-muted/40 border border-border/40 px-2 py-1.5">
            <div className="text-muted-foreground text-[10px]">From 52W low</div>
            <div className={`num font-semibold ${chgFromLo52 != null && chgFromLo52 >= 0 ? "text-up" : "text-down"}`}>
              {fmtPct(chgFromLo52)}
            </div>
          </div>
          <div className="rounded bg-muted/40 border border-border/40 px-2 py-1.5">
            <div className="text-muted-foreground text-[10px]">From 52W high</div>
            <div className={`num font-semibold ${chgFromHi52 != null && chgFromHi52 >= 0 ? "text-up" : "text-down"}`}>
              {fmtPct(chgFromHi52)}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function MovementStats({ blueQuote, greenQuote }: MovementStatsProps) {
  const hasData = blueQuote?.price != null || greenQuote?.price != null;

  return (
    <div className="rounded-lg border border-border bg-card p-4">
      <h2 className="text-sm font-semibold text-foreground mb-4">Movement</h2>
      {!hasData ? (
        <div className="text-xs text-muted-foreground">Awaiting quote data…</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {blueQuote?.price != null && <QuotePosition quote={blueQuote} color="blue" />}
          {greenQuote?.price != null && <QuotePosition quote={greenQuote} color="green" />}
        </div>
      )}
    </div>
  );
}
