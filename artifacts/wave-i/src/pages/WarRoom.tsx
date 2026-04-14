import { useMemo, useState } from "react";
import { useQueries, useQueryClient } from "@tanstack/react-query";
import { loadHoldings, type Holding } from "@/lib/portfolio";
import { listWaveIInstruments } from "@/lib/loadInstruments";
import { fetchQuote, refreshQuotes, type Quote } from "@/lib/market";
import type { HarvestRunState } from "@/block2/truth/canonical-types";
import BucketQuoteBoard from "@/components/BucketQuoteBoard";
import Header from "@/components/Header";
import AddHoldingForm from "@/components/AddHoldingForm";
import PortfolioTable from "@/components/PortfolioTable";
import CapitalSummary from "@/components/CapitalSummary";
import { buildCapitalSummary } from "@/lib/capital-summary";
import { deriveHoldingContext } from "@/lib/decision-model";
import { fmt, fmtDollar, fmtPct } from "@/lib/utils";

type Tab = "warroom" | "portfolio";

interface LocalHarvestReport {
  updated: number;
  skippedDuplicate: number;
  failed: number;
  finishedAt: string | null;
}

function TelemetryCard({
  label,
  value,
  detail,
}: {
  label: string;
  value: string;
  detail?: string;
}) {
  return (
    <div className="rounded-lg border border-border bg-card p-3">
      <div className="text-[10px] uppercase tracking-widest text-muted-foreground">{label}</div>
      <div className="mt-1 text-lg font-semibold text-foreground num">{value}</div>
      {detail ? <div className="mt-1 text-[11px] text-muted-foreground">{detail}</div> : null}
    </div>
  );
}

function PositionTelemetry({
  contexts,
}: {
  contexts: ReturnType<typeof deriveHoldingContext>[];
}) {
  const top = contexts.slice(0, 4);

  if (top.length === 0) {
    return (
      <div className="rounded-lg border border-border bg-card p-4 text-xs text-muted-foreground">
        No holdings yet. Add positions to start building personal capital telemetry.
      </div>
    );
  }

  return (
    <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
      {top.map((ctx) => (
        <div key={ctx.holdingId} className="rounded-lg border border-border bg-card p-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="text-xs font-bold uppercase tracking-widest text-foreground">
                {ctx.ticker}
              </div>
              <div className="text-[10px] text-muted-foreground">{ctx.container}</div>
            </div>
            <div className="text-right">
              <div className="text-sm font-semibold num text-foreground">
                {fmtDollar(ctx.currentPrice)}
              </div>
              <div className="text-[10px] text-muted-foreground">
                {ctx.snapshotAt ? "Refreshed" : "Awaiting refresh"}
              </div>
            </div>
          </div>

          <div className="mt-3 space-y-1 text-xs">
            <div className="flex items-center justify-between gap-3">
              <span className="text-muted-foreground">vs basis</span>
              <span className="num text-foreground">{fmtPct(ctx.distanceToCostBasisPct)}</span>
            </div>
            <div className="flex items-center justify-between gap-3">
              <span className="text-muted-foreground">vs add band</span>
              <span className="num text-foreground">{fmtPct(ctx.distanceToAddBandPct)}</span>
            </div>
            <div className="flex items-center justify-between gap-3">
              <span className="text-muted-foreground">vs trim band</span>
              <span className="num text-foreground">{fmtPct(ctx.distanceToTrimBandPct)}</span>
            </div>
            <div className="flex items-center justify-between gap-3">
              <span className="text-muted-foreground">Pay window</span>
              <span className="num text-foreground">
                {ctx.daysToPay != null ? `${fmt(ctx.daysToPay, 0)}d` : "—"}
              </span>
            </div>
            <div className="flex items-center justify-between gap-3">
              <span className="text-muted-foreground">Trigger</span>
              <span className="text-foreground">{ctx.triggerState}</span>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

export default function WarRoom() {
  const queryClient = useQueryClient();
  const [tab, setTab] = useState<Tab>("warroom");
  const [holdings, setHoldings] = useState<Holding[]>(() => loadHoldings());
  const [harvestState, setHarvestState] = useState<HarvestRunState>("idle");
  const [harvestReport, setHarvestReport] = useState<LocalHarvestReport | null>(null);
  const [lastUpdated, setLastUpdated] = useState<number | null>(null);

  const quoteQueries = useQueries({
    queries: holdings.map((holding) => ({
      queryKey: ["quote", holding.ticker],
      queryFn: () => fetchQuote(holding.ticker),
      staleTime: Infinity,
      retry: 0,
      enabled: Boolean(holding.ticker),
    })),
  });

  const quotesByTicker = useMemo(() => {
    const out: Record<string, Quote | undefined> = {};
    holdings.forEach((holding, index) => {
      out[holding.ticker] = quoteQueries[index]?.data as Quote | undefined;
    });
    return out;
  }, [holdings, quoteQueries]);

  const capitalSummary = useMemo(
    () => buildCapitalSummary(holdings, quotesByTicker),
    [holdings, quotesByTicker],
  );

  const holdingContexts = useMemo(
    () => holdings.map((holding) => deriveHoldingContext({ holding, quote: quotesByTicker[holding.ticker] })),
    [holdings, quotesByTicker],
  );

  const harvestSummary = harvestReport?.finishedAt
    ? harvestReport.failed > 0
      ? `refresh finished with ${harvestReport.failed} failure`
      : `refresh checked ${harvestReport.updated} tracked symbols`
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

  const deployed = capitalSummary.currentMarketValue ?? capitalSummary.deployedCostBasis;
  const reserve = 0;
  const transfersInFlight = 0;

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
          <section className="grid gap-3 md:grid-cols-2 xl:grid-cols-6">
            <TelemetryCard
              label="Total capital"
              value={fmtDollar(deployed + reserve)}
              detail="Capital surface anchored to local holdings and snapshots"
            />
            <TelemetryCard
              label="Deployed"
              value={fmtDollar(deployed)}
              detail="Current marked position value or cost-basis fallback"
            />
            <TelemetryCard
              label="Unrealized"
              value={fmtDollar(capitalSummary.unrealizedGL)}
              detail={fmtPct(capitalSummary.unrealizedGLPct)}
            />
            <TelemetryCard
              label="Cash / reserve"
              value={fmtDollar(reserve)}
              detail="Treasury layer remains manual-first"
            />
            <TelemetryCard
              label="Transfers"
              value={fmtDollar(transfersInFlight)}
              detail="Pending transfer tracker follows next"
            />
            <TelemetryCard
              label="Refresh state"
              value={lastUpdated ? new Date(lastUpdated).toLocaleTimeString() : "Manual"}
              detail={harvestSummary ?? "One press = one refresh pass"}
            />
          </section>

          <CapitalSummary summary={capitalSummary} />

          <section className="space-y-3">
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
                Position telemetry
              </h2>
              <span className="text-[10px] text-muted-foreground">
                Capital first · market wrapped around holdings
              </span>
            </div>
            <PositionTelemetry contexts={holdingContexts} />
          </section>

          <section className="rounded-lg border border-border bg-card p-4">
            <div className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
              Block-4B shell state
            </div>
            <div className="mt-2 text-sm text-foreground">
              The recovery shell has been replaced with a capital-first surface. Quotes are supporting context only and the page must stay useful even when refresh is blank or partial.
            </div>
            <div className="mt-2 text-xs text-muted-foreground">
              Next home-page expansions belong to treasury, transfers, dates, and decision memory — not more quote-board theater.
            </div>
          </section>

          <section>
            <div className="flex items-center justify-between gap-3 mb-3">
              <h2 className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
                Supporting market context
              </h2>
              <span className="text-[10px] text-muted-foreground">
                Secondary to capital, still manually refreshed
              </span>
            </div>
            <BucketQuoteBoard />
          </section>

          <footer className="py-4 text-center text-[10px] text-muted-foreground border-t border-border/40">
            Wave-I | capital-first shell active | quotes secondary | frontend-only operator surface
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
