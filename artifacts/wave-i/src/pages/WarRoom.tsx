import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { loadHoldings, type Holding } from "@/lib/portfolio";
import { listWaveIInstruments } from "@/lib/loadInstruments";
import { refreshQuotes } from "@/lib/market";
import type { HarvestRunState } from "@/block2/truth/canonical-types";
import BucketQuoteBoard from "@/components/BucketQuoteBoard";
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
  const queryClient = useQueryClient();
  const [tab, setTab] = useState<Tab>("warroom");
  const [holdings, setHoldings] = useState<Holding[]>(() => loadHoldings());
  const [harvestState, setHarvestState] = useState<HarvestRunState>("idle");
  const [harvestReport, setHarvestReport] = useState<LocalHarvestReport | null>(null);
  const [lastUpdated, setLastUpdated] = useState<number | null>(null);

  const harvestSummary = harvestReport?.finishedAt
    ? `refreshed ${harvestReport.updated} | skipped ${harvestReport.skippedDuplicate} | failed ${harvestReport.failed}`
    : null;

  async function handleHarvest() {
    if (harvestState === "running") return;
    setHarvestState("running");

    const sourceTickers = [
      ...listWaveIInstruments().map((instrument) => instrument.ticker),
      ...holdings.map((holding) => holding.ticker),
    ]
      .map((ticker) => ticker.trim().toUpperCase())
      .filter(Boolean);

    const uniqueTickers = Array.from(new Set(sourceTickers));
    const skippedDuplicate = sourceTickers.length - uniqueTickers.length;

    try {
      const refreshed = uniqueTickers.length > 0
        ? await refreshQuotes(uniqueTickers)
        : { quotes: {}, failed: [] as string[] };

      Object.entries(refreshed.quotes).forEach(([symbol, quote]) => {
        queryClient.setQueryData(["quote", symbol], quote);
      });

      const now = Date.now();
      setLastUpdated(now);
      setHarvestReport({
        updated: Object.keys(refreshed.quotes).length,
        skippedDuplicate,
        failed: refreshed.failed.length,
        finishedAt: new Date(now).toISOString(),
      });
      setHarvestState("completed");
    } catch {
      const now = Date.now();
      setLastUpdated(now);
      setHarvestReport({
        updated: 0,
        skippedDuplicate,
        failed: uniqueTickers.length || 1,
        finishedAt: new Date(now).toISOString(),
      });
      setHarvestState("completed");
    }
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

      {tab === "warroom" && (
        <main className="flex-1 p-4 md:p-6 space-y-5 max-w-7xl mx-auto w-full">
          <section className="rounded-lg border border-border bg-card p-4">
            <div className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
              Wave-I core shell
            </div>
            <div className="mt-2 text-sm text-foreground">
              Core runtime restored. Advanced panels are temporarily quarantined while the mounted render loop is isolated.
            </div>
            <div className="mt-2 text-xs text-muted-foreground">
              Active runtime scope: |M| Mint · |W| White · [B] Blue · [G] Green
            </div>
            <div className="mt-3 text-xs text-muted-foreground">
              Quote refresh is manual only. One press equals one refresh pass. No background polling.
            </div>
          </section>

          <section>
            <h2 className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-3">Quote Board</h2>
            <BucketQuoteBoard />
          </section>

          <footer className="py-4 text-center text-[10px] text-muted-foreground border-t border-border/40">
            Wave-I | core shell recovery mode | frontend-only operator surface
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
            Wave-I | portfolio data stored locally | M/W/B/G container semantics active
          </footer>
        </main>
      )}
    </div>
  );
}
