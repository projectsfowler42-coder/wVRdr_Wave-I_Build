import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { fetchQuote, loadRefreshStatus, type Quote } from "@/lib/market";
import { getBucketScopedInstruments, getInstrumentRecord } from "@/lib/loadInstruments";
import type { ActiveContainerClass } from "@/lib/portfolio";
import { ACTIVE_CONTAINERS, containerAccent, containerLabel } from "@/lib/containerModel";
import QuoteCard from "@/components/QuoteCard";
import { ChevronDown } from "lucide-react";

interface ContainerPanelProps {
  container: ActiveContainerClass;
  defaultTicker: string;
}

function ContainerPanel({ container, defaultTicker }: ContainerPanelProps) {
  const instruments = getBucketScopedInstruments(container);
  const [selected, setSelected] = useState(defaultTicker);
  const accent = containerAccent(container);

  useEffect(() => {
    if (!selected && defaultTicker) {
      setSelected(defaultTicker);
    }
  }, [defaultTicker, selected]);

  const { data: quote, isLoading, isError } = useQuery<Quote>({
    queryKey: ["quote", selected],
    queryFn: () => fetchQuote(selected),
    staleTime: Infinity,
    retry: 0,
    enabled: Boolean(selected),
  });

  const instrument = getInstrumentRecord(selected);
  const status = selected ? loadRefreshStatus(selected) : null;

  if (instruments.length === 0) {
    return (
      <div className="flex flex-col gap-3">
        <div className={`flex items-center gap-2 rounded-lg border ${accent.border} ${accent.dim} px-3 py-2`}>
          <span className={`text-[10px] font-bold uppercase tracking-widest w-16 shrink-0 ${accent.text}`}>
            {containerLabel(container)}
          </span>
          <span className="text-xs text-muted-foreground">No scoped instruments loaded.</span>
        </div>
        <QuoteCard
          container={container}
          ticker=""
          quote={undefined}
          loading={false}
          error={true}
          status={null}
        />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      <div className={`flex items-center gap-2 rounded-lg border ${accent.border} ${accent.dim} px-3 py-2`}>
        <span className={`text-[10px] font-bold uppercase tracking-widest w-16 shrink-0 ${accent.text}`}>
          {containerLabel(container)}
        </span>
        <div className="relative flex-1">
          <select
            value={selected}
            onChange={(event) => setSelected(event.target.value)}
            className="w-full bg-transparent text-sm font-semibold text-foreground appearance-none pr-6 focus:outline-none cursor-pointer"
          >
            {instruments.map((entry) => (
              <option key={entry.ticker} value={entry.ticker} className="bg-card text-foreground">
                {entry.ticker} — {entry.name}
              </option>
            ))}
          </select>
          <ChevronDown size={13} className="absolute right-0 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
        </div>
        {instrument ? (
          <div className="flex items-center gap-2 shrink-0">
            <span className="text-[10px] text-muted-foreground uppercase tracking-wider">{instrument.subtype}</span>
            <span className="text-[10px] text-muted-foreground">{instrument.payoutFrequency ?? "varies"}</span>
          </div>
        ) : null}
      </div>

      <QuoteCard
        container={container}
        ticker={selected}
        quote={quote}
        loading={isLoading}
        error={isError}
        status={status}
      />
    </div>
  );
}

export default function BucketQuoteBoard() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
      {ACTIVE_CONTAINERS.map((container) => (
        <ContainerPanel
          key={container}
          container={container}
          defaultTicker={getBucketScopedInstruments(container)[0]?.ticker ?? ""}
        />
      ))}
    </div>
  );
}
