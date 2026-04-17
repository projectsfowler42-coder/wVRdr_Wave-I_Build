import { useMemo, useState } from "react";
import { useQueries, useQueryClient } from "@tanstack/react-query";
import { loadHoldings, type Holding } from "@/lib/portfolio";
import { listWaveIInstruments } from "@/lib/loadInstruments";
import type { HarvestRunState } from "@/block2/truth/canonical-types";
import AuditPanels from "@/block2/ui/AuditPanels";
import BucketQuoteBoard from "@/components/BucketQuoteBoard";
import Header from "@/components/Header";
import AddHoldingForm from "@/components/AddHoldingForm";
import PortfolioTable from "@/components/PortfolioTable";
import CapitalSummary from "@/components/CapitalSummary";
import TreasuryPanel from "@/components/TreasuryPanel";
import InspectorPanel from "@/inspection/InspectorPanel";
import { buildCapitalSummary } from "@/lib/capital-summary";
import { fetchQuote, refreshQuotes, type Quote, type QuoteRefreshStatus } from "@/lib/market";
import { deriveHoldingContext } from "@/lib/decision-model";
import { loadTreasuryState, saveTreasuryState } from "@/lib/treasury";
import { fmtDollar, fmtPct, fmt } from "@/lib/utils";

type Tab = "warroom" | "portfolio";

interface LocalHarvestReport {
  updated: number;
  skippedDuplicate: number;
  failed: number;
  statuses: QuoteRefreshStatus[];
  finishedAt: string | null;
}

function TelemetryCard({ label, value, detail }: { label: string; value: string; detail?: string }) {
  return (
    <div className="rounded-2xl border border-border bg-card p-3 shadow-sm">
      <div className="text-[10px] uppercase tracking-widest text-muted-foreground">{label}</div>
      <div className="mt-1 text-lg font-semibold text-foreground num">{value}</div>
      {detail ? <div className="mt-1 text-[11px] text-muted-foreground">{detail}</div> : null}
    </div>
  );
}

function PositionTelemetry({ contexts }: { contexts: ReturnType<typeof deriveHoldingContext>[] }) {
  const top = contexts.slice(0, 4);
  if (top.length === 0) {
    return (
      <div className="rounded-2xl border border-border bg-card p-4 text-xs text-muted-foreground shadow-sm">
        No holdings yet. Add positions to start building personal telemetry.
      </div>
    );
  }

  return (
    <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
      {top.map((ctx) => (
        <div key={ctx.holdingId} className="rounded-2xl border border-border bg-card p-4 shadow-sm">
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="text-xs font-bold uppercase tracking-widest text-foreground">{ctx.ticker}</div>
              <div className="text-[10px] text-muted-foreground">{ctx.container}</div>
            </div>
            <div className="text-right">
              <div className="text-sm font-semibold num text-foreground">{fmtDollar(ctx.currentPrice)}</div>
              <div className="text-[10px] text-muted-foreground">{ctx.snapshotAt ? "Best available snapshot" : "Awaiting coverage"}</div>
            </div>
          </div>
          <div className="mt-3 space-y-1 text-xs">
            <div className="flex items-center justify-between gap-3"><span className="text-muted-foreground">vs basis</span><span className="num text-foreground">{fmtPct(ctx.distanceToCostBasisPct)}</span></div>
            <div className="flex items-center justify-between gap-3"><span className="text-muted-foreground">vs add band</span><span className="num text-foreground">{fmtPct(ctx.distanceToAddBandPct)}</span></div>
            <div className="flex items-center justify-between gap-3"><span className="text-muted-foreground">vs trim band</span><span className="num text-foreground">{fmtPct(ctx.distanceToTrimBandPct)}</span></div>
            <div className="flex items-center justify-between gap-3"><span className="text-muted-foreground">Ex window</span><span className="num text-foreground">{ctx.daysToEx != null ? `${fmt(ctx.daysToEx, 0)}d` : "—"}</span></div>
            <div className="flex items-center justify-between gap-3"><span className="text-muted-foreground">Pay window</span><span className="num text-foreground">{ctx.daysToPay != null ? `${fmt(ctx.daysToPay, 0)}d` : "—"}</span></div>
            <div className="flex items-center justify-between gap-3"><span className="text-muted-foreground">Trigger</span><span className="text-foreground">{ctx.triggerState}</span></div>
          </div>
        </div>
      ))}
    </div>
  );
}

function RefreshFailures({ report }: { report: LocalHarvestReport | null }) {
  if (!report || report.statuses.length === 0) return null;
  const problems = report.statuses.filter((status) => status.status !== "refreshed");
  if (problems.length === 0) return null;

  return (
    <section className="rounded-2xl border border-amber-300/50 bg-amber-50 p-4 shadow-sm">
      <div className="text-xs font-bold uppercase tracking-widest text-amber-800">Refresh exceptions</div>
      <div className="mt-2 grid gap-2 md:grid-cols-2 xl:grid-cols-3">
        {problems.map((status) => (
          <div key={`${status.symbol}-${status.timestamp}`} className="rounded-xl border border-amber-200 bg-white p-3">
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs font-semibold text-foreground">{status.symbol}</span>
              <span className="text-[10px] uppercase tracking-wider text-amber-700">{status.status}</span>
            </div>
            <div className="mt-1 text-[10px] text-muted-foreground">source: {status.source}</div>
            {status.reason ? <div className="mt-2 text-[11px] text-muted-foreground">{status.reason}</div> : null}
          </div>
        ))}
      </div>
    </section>
  );
}

export default function WarRoom() {
  const queryClient = useQueryClient();
  const [tab, setTab] = useState<Tab>("warroom");
  const [holdings, setHoldings] = useState<Holding[]>(() => loadHoldings());
  const [harvestState, setHarvestState] = useState<HarvestRunState>("idle");
  const [harvestReport, setHarvestReport] = useState<LocalHarvestReport | null>(null);
  const [lastUpdated, setLastUpdated] = useState<number | null>(null);
  const [treasury, setTreasury] = useState(() => loadTreasuryState());

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
      out[holding.ticker] = quoteQueries[index]?.data;
    });
    return out;
  }, [holdings, quoteQueries]);

  const capitalSummary = useMemo(() => buildCapitalSummary(holdings, quotesByTicker), [holdings, quotesByTicker]);
  const holdingContexts = useMemo(
    () => holdings.map((holding) => deriveHoldingContext({ holding, quote: quotesByTicker[holding.ticker] })),
    [holdings, quotesByTicker],
  );

  const harvestSummary = harvestReport?.finishedAt
    ? harvestReport.failed > 0
      ? `refresh finished · ${harvestReport.updated} updated · ${harvestReport.failed} unresolved`
      : `refresh finished · ${harvestReport.updated} updated`
    : null;

  async function handleHarvest() {
    if (harvestState === "running") return;
    setHarvestState("running");

    try {
      const sourceRows = [
        ...listWaveIInstruments().map((instrument) => instrument.ticker),
        ...holdings.map((holding) => holding.ticker),
      ];
      const unique = [...new Set(sourceRows.filter(Boolean))];
      const result = await refreshQuotes(unique);
      await queryClient.invalidateQueries({ queryKey: ["quote"] });

      const now = Date.now();
      setLastUpdated(now);
      setHarvestReport({
        updated: result.statuses.filter((status) => status.status === "refreshed").length,
        skippedDuplicate: sourceRows.length - unique.length,
        failed: result.failed.length,
        statuses: result.statuses,
        finishedAt: new Date(now).toISOString(),
      });
      setHarvestState("completed");
    } catch (error) {
      const now = Date.now();
      setLastUpdated(now);
      setHarvestReport({
        updated: 0,
        skippedDuplicate: 0,
        failed: 1,
        statuses: [],
        finishedAt: new Date(now).toISOString(),
      });
      setHarvestState("completed");
      console.error("Wave-I refresh failed", error);
    }
  }

  const totalCapital = (capitalSummary.currentMarketValue ?? capitalSummary.deployedCostBasis) + treasury.cash + treasury.reserve;
  const deployed = capitalSummary.currentMarketValue ?? capitalSummary.deployedCostBasis;
  const refreshDelta = capitalSummary.unrealizedGL;
  const unresolvedCount = harvestReport?.statuses.filter((status) => status.status !== "refreshed").length ?? 0;

  function handleTreasurySave(next: { cash: number; reserve: number }) {
    setTreasury(saveTreasuryState(next));
  }

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
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
        <main className="mx-auto flex w-full max-w-7xl flex-1 flex-col gap-5 px-4 py-4 md:px-6 md:py-6">
          <section className="grid gap-3 md:grid-cols-2 xl:grid-cols-6">
            <TelemetryCard label="Total capital" value={fmtDollar(totalCapital)} detail="Deployed market value plus local treasury balances" />
            <TelemetryCard label="Deployed" value={fmtDollar(deployed)} detail="Best available marked position value" />
            <TelemetryCard label="Unrealized" value={fmtDollar(refreshDelta)} detail={fmtPct(capitalSummary.unrealizedGLPct)} />
            <TelemetryCard label="Cash / reserve" value={`${fmtDollar(treasury.cash)} / ${fmtDollar(treasury.reserve)}`} detail={treasury.updatedAt ? "Local treasury snapshot persisted" : "Treasury now editable and persistent"} />
            <TelemetryCard label="Refresh issues" value={String(unresolvedCount)} detail={unresolvedCount > 0 ? "See per-ticker exceptions below" : "No unresolved ticker failures in last pass"} />
            <TelemetryCard label="Last refresh" value={lastUpdated ? new Date(lastUpdated).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "—"} detail={lastUpdated ? "Manual on-demand snapshot" : "No refresh pass yet"} />
          </section>

          <CapitalSummary summary={capitalSummary} />
          <TreasuryPanel treasury={treasury} onSave={handleTreasurySave} />
          <AuditPanels holdingsCount={holdings.length} lastUpdated={lastUpdated} harvestState={harvestState} harvestSummary={harvestSummary} />

          <section className="space-y-3">
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Position telemetry</h2>
              <span className="text-[10px] text-muted-foreground">Holdings first · market wrapped around them</span>
            </div>
            <PositionTelemetry contexts={holdingContexts} />
          </section>

          <RefreshFailures report={harvestReport} />

          <section className="space-y-3">
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Supporting market context</h2>
              <span className="text-[10px] text-muted-foreground">The quote board is support, not the page identity</span>
            </div>
            <BucketQuoteBoard />
          </section>

          <InspectorPanel />
        </main>
      )}

      {tab === "portfolio" && (
        <main className="mx-auto flex w-full max-w-7xl flex-1 flex-col gap-4 px-4 py-4 md:px-6 md:py-6">
          <div className="mb-1 flex items-center justify-between">
            <h2 className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Portfolio tracker</h2>
            <span className="text-[10px] text-muted-foreground">Persisted locally in your browser</span>
          </div>
          <AddHoldingForm holdings={holdings} onHoldingsChange={setHoldings} />
          <PortfolioTable holdings={holdings} onHoldingsChange={setHoldings} />
        </main>
      )}
    </div>
  );
}
