import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { fetchQuote, type Quote } from "@/lib/market";
import { loadHoldings, type Holding } from "@/lib/portfolio";
import MarketTape from "@/components/MarketTape";
import BucketQuoteBoard from "@/components/BucketQuoteBoard";
import MovementStats from "@/components/MovementStats";
import Calculators from "@/components/Calculators";
import ResearchLinks from "@/components/ResearchLinks";
import Header from "@/components/Header";
import AddHoldingForm from "@/components/AddHoldingForm";
import PortfolioTable from "@/components/PortfolioTable";

type Tab = "warroom" | "portfolio";

export default function WarRoom() {
  const qc = useQueryClient();
  const [tab, setTab] = useState<Tab>("warroom");
  const [holdings, setHoldings] = useState<Holding[]>(() => loadHoldings());
  const [refreshKey, setRefreshKey] = useState(0);

  const { data: blueQuote, isLoading: blueLoading, dataUpdatedAt: blueUpdated } = useQuery<Quote>({
    queryKey: ["quote", "ARCC", refreshKey],
    queryFn: () => fetchQuote("ARCC"),
    refetchInterval: 90_000,
    staleTime: 60_000,
    retry: 2,
  });

  const { data: greenQuote, isLoading: greenLoading, dataUpdatedAt: greenUpdated } = useQuery<Quote>({
    queryKey: ["quote", "AGNC", refreshKey],
    queryFn: () => fetchQuote("AGNC"),
    refetchInterval: 90_000,
    staleTime: 60_000,
    retry: 2,
  });

  const lastUpdated = Math.max(blueUpdated ?? 0, greenUpdated ?? 0) || null;
  const isRefreshing = blueLoading || greenLoading;

  function handleRefresh() {
    setRefreshKey((k) => k + 1);
    qc.invalidateQueries({ queryKey: ["tape"] });
    qc.invalidateQueries({ queryKey: ["quote"] });
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header
        tab={tab}
        onTabChange={setTab}
        onRefresh={handleRefresh}
        isRefreshing={isRefreshing}
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
            Wave-I · truth-first · Blue (BDC) &amp; Green (mREIT) · data via Yahoo Finance · not financial advice
            <br />
            <span className="opacity-60">Coming: dividend calendar, ex-dates, pay dates, dip events, Mint DRiP counter, payout history</span>
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
            Wave-I · portfolio data stored locally · not financial advice
          </footer>
        </main>
      )}
    </div>
  );
}
