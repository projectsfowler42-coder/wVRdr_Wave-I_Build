import { useMemo, useState } from "react";
import type { HarvestRunState } from "@/block2/truth/canonical-types";
import Header from "@/components/Header";
import AddHoldingForm from "@/components/AddHoldingForm";
import PortfolioTable from "@/components/PortfolioTable";
import CapitalSummary from "@/components/CapitalSummary";
import DataQualityLedger from "@/components/DataQualityLedger";
import ExceptionSeverityLadder from "@/components/ExceptionSeverityLadder";
import { listWaveIInstruments } from "@/lib/loadInstruments";
import { buildCapitalSummary } from "@/lib/capital-summary";
import { deriveHoldingContext } from "@/lib/decision-model";
import { loadLocalQuote, refreshQuotes, type Quote, type QuoteRefreshStatus } from "@/lib/market";
import { loadHoldings, type Holding } from "@/lib/portfolio";
import { fmt, fmtDollar, fmtPct } from "@/lib/utils";

type Tab = "warroom" | "portfolio";

type LocalHarvestReport = {
  updated: number;
  failed: number;
  statuses: QuoteRefreshStatus[];
  finishedAt: string | null;
};

const REFRESH_TIMEOUT_MS = 8000;

function Stat({ label, value, detail }: { label: string; value: string; detail?: string }) {
  return (
    <div className="rounded-2xl border border-border bg-card p-3 shadow-sm">
      <div className="text-[10px] uppercase tracking-widest text-muted-foreground">{label}</div>
      <div className="mt-1 text-lg font-semibold text-foreground num">{value}</div>
      {detail ? <div className="mt-1 text-[11px] text-muted-foreground">{detail}</div> : null}
    </div>
  );
}

function ReadinessMetric({ label, value, detail }: { label: string; value: string; detail: string }) {
  return (
    <div className="rounded-xl border border-border bg-background/60 p-3">
      <div className="text-[10px] uppercase tracking-widest text-muted-foreground">{label}</div>
      <div className="mt-1 text-sm font-semibold text-foreground">{value}</div>
      <div className="mt-1 text-[11px] text-muted-foreground">{detail}</div>
    </div>
  );
}

function timeoutStatus(tickers: string[]): QuoteRefreshStatus[] {
  const timestamp = Date.now();
  return tickers.map((symbol): QuoteRefreshStatus => ({
    symbol,
    status: "failed",
    source: "none",
    timestamp,
    observedAt: null,
    connectionStatus: "FAILED",
    ageSeconds: null,
    truthClass: "FAILED",
    reason: `Refresh exceeded ${REFRESH_TIMEOUT_MS / 1000}s guardrail and was released back to the operator.`,
  }));
}

export default function WarRoom() {
  const [tab, setTab] = useState<Tab>("warroom");
  const [holdings, setHoldings] = useState<Holding[]>(() => loadHoldings());
  const [harvestState, setHarvestState] = useState<HarvestRunState>("idle");
  const [harvestReport, setHarvestReport] = useState<LocalHarvestReport | null>(null);
  const [lastUpdated, setLastUpdated] = useState<number | null>(null);
  const [quoteEpoch, setQuoteEpoch] = useState(0);

  const quotesByTicker = useMemo(() => {
    void quoteEpoch;
    const quotes: Record<string, Quote | undefined> = {};
    [...new Set(holdings.map((holding) => holding.ticker).filter(Boolean))].forEach((ticker) => {
      quotes[ticker] = loadLocalQuote(ticker);
    });
    return quotes;
  }, [holdings, quoteEpoch]);

  const summary = useMemo(() => buildCapitalSummary(holdings, quotesByTicker), [holdings, quotesByTicker]);
  const contexts = useMemo(
    () => holdings.map((holding) => deriveHoldingContext({ holding, quote: quotesByTicker[holding.ticker] })),
    [holdings, quotesByTicker],
  );

  const refreshIssues = harvestReport?.statuses.filter((status) => status.status !== "refreshed") ?? [];
  const coveredHoldings = holdings.filter((holding) => Boolean(quotesByTicker[holding.ticker])).length;
  const quoteCoveragePct = holdings.length > 0 ? Math.round((coveredHoldings / holdings.length) * 100) : 0;
  const nowMs = lastUpdated ?? Date.now();
  const readinessState =
    harvestState === "running"
      ? "refreshing"
      : refreshIssues.length > 0
        ? "degraded"
        : holdings.length === 0
          ? "no positions"
          : coveredHoldings < holdings.length
            ? "partial coverage"
            : "ready";
  const readinessDetail =
    readinessState === "ready"
      ? "All tracked holdings have cached quote coverage."
      : readinessState === "partial coverage"
        ? "Some holdings are missing local quote coverage."
        : readinessState === "degraded"
          ? "Last refresh returned unresolved ticker exceptions."
          : readinessState === "refreshing"
            ? "Refresh is currently inside the guarded execution window."
            : "Add positions before relying on capital telemetry.";
  const harvestSummary = harvestReport?.finishedAt
    ? harvestReport.failed > 0
      ? `refresh finished · ${harvestReport.updated} updated · ${harvestReport.failed} unresolved`
      : `refresh finished · ${harvestReport.updated} updated`
    : null;

  async function handleHarvest() {
    if (harvestState === "running") return;
    setHarvestState("running");

    const tickers = [...new Set([
      ...listWaveIInstruments().map((instrument) => instrument.ticker),
      ...holdings.map((holding) => holding.ticker),
    ].filter(Boolean))];

    try {
      const result = await Promise.race([
        refreshQuotes(tickers),
        new Promise<{ statuses: QuoteRefreshStatus[]; failed: string[] }>((resolve) => {
          window.setTimeout(() => resolve({ statuses: timeoutStatus(tickers), failed: tickers }), REFRESH_TIMEOUT_MS);
        }),
      ]);

      const now = Date.now();
      setLastUpdated(now);
      setHarvestReport({
        updated: result.statuses.filter((status) => status.status === "refreshed").length,
        failed: result.failed.length,
        statuses: result.statuses,
        finishedAt: new Date(now).toISOString(),
      });
      setQuoteEpoch((value) => value + 1);
    } catch (error) {
      const now = Date.now();
      setLastUpdated(now);
      setHarvestReport({ updated: 0, failed: 1, statuses: [], finishedAt: new Date(now).toISOString() });
      console.error("Wave-I refresh failed", error);
    } finally {
      setHarvestState("completed");
    }
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

      {tab === "warroom" ? (
        <main className="mx-auto flex w-full max-w-7xl flex-1 flex-col gap-5 px-4 py-4 md:px-6 md:py-6">
          <section className="grid gap-3 md:grid-cols-2 xl:grid-cols-6">
            <Stat label="Total capital" value={fmtDollar(summary.currentMarketValue ?? summary.deployedCostBasis)} detail="Market value when covered · cost basis fallback otherwise" />
            <Stat label="Deployed" value={fmtDollar(summary.currentMarketValue ?? summary.deployedCostBasis)} detail="Best available marked position value" />
            <Stat label="Unrealized" value={fmtDollar(summary.unrealizedGL)} detail={fmtPct(summary.unrealizedGLPct)} />
            <Stat label="Cash / reserve" value={fmtDollar(0)} detail="Secondary panels staged off live surface during hotfix" />
            <Stat label="Refresh issues" value={String(refreshIssues.length)} detail={refreshIssues.length ? "See exceptions below" : "No unresolved ticker failures in last pass"} />
            <Stat label="Last refresh" value={lastUpdated ? new Date(lastUpdated).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "—"} detail={lastUpdated ? "Manual on-demand snapshot" : "No refresh pass yet"} />
          </section>

          <section className="rounded-2xl border border-border bg-card p-4 shadow-sm">
            <div className="flex flex-col gap-1 md:flex-row md:items-center md:justify-between">
              <div>
                <h2 className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Operator readiness</h2>
                <div className="mt-1 text-sm font-semibold capitalize text-foreground">{readinessState}</div>
              </div>
              <span className="text-[11px] text-muted-foreground md:text-right">{readinessDetail}</span>
            </div>
            <div className="mt-3 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
              <ReadinessMetric label="Refresh state" value={harvestState} detail="Guarded manual refresh loop" />
              <ReadinessMetric label="Quote coverage" value={`${coveredHoldings}/${holdings.length}`} detail={`${quoteCoveragePct}% of tracked holdings covered`} />
              <ReadinessMetric label="Exceptions" value={String(refreshIssues.length)} detail="Unresolved ticker refresh statuses" />
              <ReadinessMetric label="Telemetry cards" value={String(contexts.length)} detail="Position contexts computed this render" />
            </div>
          </section>

          <ExceptionSeverityLadder
            holdings={holdings}
            quotesByTicker={quotesByTicker}
            refreshStatuses={harvestReport?.statuses ?? []}
            harvestState={harvestState}
            nowMs={nowMs}
          />

          <DataQualityLedger
            holdings={holdings}
            quotesByTicker={quotesByTicker}
            refreshStatuses={harvestReport?.statuses ?? []}
            nowMs={nowMs}
          />

          <CapitalSummary summary={summary} />

          <section className="rounded-2xl border border-border bg-card p-4 shadow-sm">
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Position telemetry</h2>
              <span className="text-[10px] text-muted-foreground">Holdings first · market wrapped around them</span>
            </div>
            {contexts.length === 0 ? (
              <div className="mt-3 text-xs text-muted-foreground">No holdings yet. Add positions to start building personal telemetry.</div>
            ) : (
              <div className="mt-3 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                {contexts.slice(0, 4).map((ctx) => (
                  <div key={ctx.holdingId} className="rounded-xl border border-border bg-background/60 p-3 text-xs">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="font-bold uppercase tracking-widest text-foreground">{ctx.ticker}</div>
                        <div className="text-[10px] text-muted-foreground">{ctx.container}</div>
                      </div>
                      <div className="text-right">
                        <div className="font-semibold num text-foreground">{fmtDollar(ctx.currentPrice)}</div>
                        <div className="text-[10px] text-muted-foreground">{ctx.snapshotAt ? "Best available snapshot" : "Awaiting coverage"}</div>
                      </div>
                    </div>
                    <div className="mt-2 space-y-1">
                      <div className="flex items-center justify-between gap-2"><span className="text-muted-foreground">vs basis</span><span className="num text-foreground">{fmtPct(ctx.distanceToCostBasisPct)}</span></div>
                      <div className="flex items-center justify-between gap-2"><span className="text-muted-foreground">vs add band</span><span className="num text-foreground">{fmtPct(ctx.distanceToAddBandPct)}</span></div>
                      <div className="flex items-center justify-between gap-2"><span className="text-muted-foreground">vs trim band</span><span className="num text-foreground">{fmtPct(ctx.distanceToTrimBandPct)}</span></div>
                      <div className="flex items-center justify-between gap-2"><span className="text-muted-foreground">Ex</span><span className="num text-foreground">{ctx.daysToEx != null ? `${fmt(ctx.daysToEx, 0)}d` : "—"}</span></div>
                      <div className="flex items-center justify-between gap-2"><span className="text-muted-foreground">Pay</span><span className="num text-foreground">{ctx.daysToPay != null ? `${fmt(ctx.daysToPay, 0)}d` : "—"}</span></div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

          {refreshIssues.length > 0 ? (
            <section className="rounded-2xl border border-amber-300/50 bg-amber-50 p-4 shadow-sm">
              <div className="text-xs font-bold uppercase tracking-widest text-amber-800">Refresh exceptions</div>
              <div className="mt-2 grid gap-2 md:grid-cols-2 xl:grid-cols-3">
                {refreshIssues.map((status) => (
                  <div key={`${status.symbol}-${status.timestamp}`} className="rounded-xl border border-amber-200 bg-white p-3">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs font-semibold text-foreground">{status.symbol}</span>
                      <span className="text-[10px] uppercase tracking-wider text-amber-700">{status.connectionStatus}</span>
                    </div>
                    <div className="mt-1 text-[10px] text-muted-foreground">source: {status.source} · truth: {status.truthClass}</div>
                    {status.reason ? <div className="mt-2 text-[11px] text-muted-foreground">{status.reason}</div> : null}
                  </div>
                ))}
              </div>
            </section>
          ) : null}
        </main>
      ) : (
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
