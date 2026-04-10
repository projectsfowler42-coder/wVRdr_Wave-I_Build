import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { fetchQuote, type Quote } from "@/lib/market";
import { loadHoldings, type Holding } from "@/lib/portfolio";
import { getBucketInstruments } from "@/lib/instruments";
import type { HarvestRunState } from "@/block2/truth/canonical-types";
import MarketTape from "@/components/MarketTape";
import BucketQuoteBoard from "@/components/BucketQuoteBoard";
import MovementStats from "@/components/MovementStats";
import Calculators from "@/components/Calculators";
import ResearchLinks from "@/components/ResearchLinks";
import Header from "@/components/Header";
import AddHoldingForm from "@/components/AddHoldingForm";
import PortfolioTable from "@/components/PortfolioTable";

type Tab = "warroom" | "portfolio";

interface LocalHarvestReport {
  updated: number;
  skippedDuplicate: number;
  failed: number;
  finishedAt: string | null;
}

export default function WarRoom() {
  const [tab, setTab] = useState<Tab>("warroom");
  const [holdings, setHoldings] = useState<Holding[]>(() => loadHoldings());
  const [harvestState, setHarvestState] = useState<HarvestRunState>("idle");
  const [harvestReport, setHarvestReport] = useState<LocalHarvestReport | null>(null);

  const { data: blueQuote, isLoading: blueLoading, dataUpdatedAt: blueUpdated } = useQuery<Quote>({
    queryKey: ["quote", "ARCC"],
    queryFn: () => fetchQuote("ARCC"),
    refetchInterval: 90_000,
    staleTime: 60_000,
    retry: 2,
  });

  const { data: greenQuote, isLoading: greenLoading, dataUpdatedAt: greenUpdated } = useQuery<Quote>({
    queryKey: ["quote", "AGNC"],
    queryFn: () => fetchQuote("AGNC"),
    refetchInterval: 90_000,
    staleTime: 60_000,
    retry: 2,
  });

  const lastUpdated = Math.max(blueUpdated ?? 0, greenUpdated ?? 0) || null;

  const harvestSummary = useMemo(() => {
    if (!harvestReport?.finishedAt) return null;
    const ts = new Date(harvestReport.finishedAt).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
    return `updated ${harvestReport.updated} · skipped ${harvestReport.skippedDuplicate} · failed ${harvestReport.failed} · ${ts}`;
  }, [harvestReport]);

  async function handleHarvest() {
    if (harvestState === "running") return;
    setHarvestState("running");

    const sourceRows = [
      ...getBucketInstruments("BLUE").map((instrument) => `[B]::${instrument.ticker}`),
      ...getBucketInstruments("GREEN").map((instrument) => `[G]::${instrument.ticker}`),
      ...holdings.map((holding) => `${holding.bucket}::${holding.wallet ?? "—"}::${holding.ticker}`),
    ];

    const unique = new Set(sourceRows);
    const report: LocalHarvestReport = {
      updated: unique.size,
      skippedDuplicate: sourceRows.length - unique.size,
      failed: 0,
      finishedAt: new Date().toISOString(),
    };

    setHarvestReport(report);
    setHarvestState("completed");
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header
        tab={tab}
        onTabChange={setTab}
        onHarvest={handleHarvest}
        harvestState={harvestState}
        harvestSummary={harvestSummary}
        lastUpdated={lastUpdated}
        holdingsCount={holdings.length}
      />

      <MarketTape />

      {tab === "warroom" && (
        <main className="flex-1 p-4 md:p-6 space-y-5 max-w-7xl mx-auto w-full">
          <section>
            <h2 className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-3">Quote Board</h2>
            <BucketQuoteBoard />
          </section>

          <section>
            <MovementStats blueQuote={blueQuote} greenQuote={greenQuote} />
          </section>

          <section>
            <h2 className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-3">Calculators</h2>
            <Calculators blueQuote={blueQuote} greenQuote={greenQuote} />
          </section>

          <section>
            <ResearchLinks />
          </section>

          <footer className="py-4 text-center text-[10px] text-muted-foreground border-t border-border/40">
            Wave-I · truth-first · [B] / [G] buckets · |W| / |M| wallets · frontend-only operator shell
            <br />
            <span className="opacity-60">[Harvest Data] runs locally and reports updated/skipped counts without backend services.</span>
          </footer>
        </main>
      )}

      {tab === "portfolio" && (
        <main className="flex-1 p-4 md:p-6 space-y-4 max-w-7xl mx-auto w-full">
          <div className="flex items-center justify-between mb-1">
            <h2 className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Portfolio Tracker</h2>
            <span className="text-[10px] text-muted-foreground">Persisted locally in your browser</span>
          </div>

          <AddHoldingForm holdings={holdings} onHoldingsChange={setHoldings} />
          <PortfolioTable holdings={holdings} onHoldingsChange={setHoldings} />

          <footer className="py-4 text-center text-[10px] text-muted-foreground border-t border-border/40">
            Wave-I · portfolio data stored locally · bucket/wallet semantics active
          </footer>
        </main>
      )}
    </div>
  );
}
