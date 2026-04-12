import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { fetchQuote, type Quote } from "@/lib/market";
import { BLUE_INSTRUMENTS, GREEN_INSTRUMENTS, type Instrument } from "@/lib/instruments";
import QuoteCard from "@/components/QuoteCard";
import { ChevronDown } from "lucide-react";

interface BucketPanelProps {
  bucket: "BLUE" | "GREEN";
  instruments: Instrument[];
  defaultTicker: string;
}

function BucketPanel({ bucket, instruments, defaultTicker }: BucketPanelProps) {
  const [selected, setSelected] = useState(defaultTicker);
  const isBlue = bucket === "BLUE";
  const accentClass = isBlue ? "text-blue" : "text-green";
  const borderClass = isBlue ? "border-blue/40" : "border-green/40";
  const dimClass = isBlue ? "bg-blue-dim" : "bg-green-dim";

  const { data: quote, isLoading, isError } = useQuery<Quote>({
    queryKey: ["quote", selected],
    queryFn: () => fetchQuote(selected),
    refetchInterval: 90_000,
    staleTime: 60_000,
    retry: 2,
  });

  const instr = instruments.find((instrument) => instrument.ticker === selected);

  return (
    <div className="flex flex-col gap-3">
      <div className={`flex items-center gap-2 rounded-lg border ${borderClass} ${dimClass} px-3 py-2`}>
        <span className={`text-[10px] font-bold uppercase tracking-widest w-12 shrink-0 ${accentClass}`}>
          {bucket}
        </span>
        <div className="relative flex-1">
          <select
            value={selected}
            onChange={(e) => setSelected(e.target.value)}
            className="w-full bg-transparent text-sm font-semibold text-foreground appearance-none pr-6 focus:outline-none cursor-pointer"
          >
            {instruments.map((instrument) => (
              <option
                key={instrument.ticker}
                value={instrument.ticker}
                className="bg-card text-foreground"
              >
                {instrument.ticker} — {instrument.name}
              </option>
            ))}
          </select>
          <ChevronDown
            size={13}
            className="absolute right-0 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none"
          />
        </div>
        {instr && (
          <div className="flex items-center gap-2 shrink-0">
            <span className="text-[10px] text-muted-foreground uppercase tracking-wider">
              {instr.type}
            </span>
            <span className="text-[10px] text-muted-foreground">{instr.divFreq}</span>
          </div>
        )}
      </div>

      <QuoteCard
        label={bucket}
        ticker={selected}
        quote={quote}
        loading={isLoading}
        error={isError}
      />
    </div>
  );
}

export default function BucketQuoteBoard() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <BucketPanel
        bucket="BLUE"
        instruments={BLUE_INSTRUMENTS}
        defaultTicker={BLUE_INSTRUMENTS[0]?.ticker ?? ""}
      />
      <BucketPanel
        bucket="GREEN"
        instruments={GREEN_INSTRUMENTS}
        defaultTicker={GREEN_INSTRUMENTS[0]?.ticker ?? ""}
      />
    </div>
  );
}
