import { useQuery } from "@tanstack/react-query";
import { fetchTape, type TapeItem } from "@/lib/market";
import { signClass, fmt } from "@/lib/utils";

function TapeChip({ item }: { item: TapeItem }) {
  const cls = signClass(item.changePct);
  const sign = item.changePct >= 0 ? "+" : "";
  return (
    <span className="inline-flex items-center gap-1.5 px-3 text-xs num whitespace-nowrap">
      <span className="font-semibold text-foreground/80">{item.symbol}</span>
      <span className="text-foreground">${fmt(item.price)}</span>
      <span className={cls}>{sign}{item.changePct.toFixed(2)}%</span>
    </span>
  );
}

export default function MarketTape() {
  const { data: items = [], isLoading } = useQuery<TapeItem[]>({
    queryKey: ["tape"],
    queryFn: fetchTape,
    refetchInterval: 90_000,
    staleTime: 60_000,
  });

  const doubled = [...items, ...items];

  return (
    <div className="h-9 border-b border-border bg-card/60 overflow-hidden flex items-center relative">
      <div className="absolute left-0 top-0 bottom-0 w-8 z-10 bg-gradient-to-r from-card/80 to-transparent pointer-events-none" />
      <div className="absolute right-0 top-0 bottom-0 w-8 z-10 bg-gradient-to-l from-card/80 to-transparent pointer-events-none" />

      {isLoading ? (
        <div className="px-4 text-xs text-muted-foreground">Loading market data…</div>
      ) : items.length === 0 ? (
        <div className="px-4 text-xs text-muted-foreground">Market data unavailable</div>
      ) : (
        <div className="flex tape-track">
          {doubled.map((item, i) => (
            <TapeChip key={`${item.symbol}-${i}`} item={item} />
          ))}
        </div>
      )}

      <div className="absolute right-3 flex items-center gap-1.5 z-20 bg-card/80 pl-2">
        <span className="pulse-dot w-1.5 h-1.5 rounded-full bg-up" />
        <span className="text-[10px] text-muted-foreground uppercase tracking-wider">Live</span>
      </div>
    </div>
  );
}
