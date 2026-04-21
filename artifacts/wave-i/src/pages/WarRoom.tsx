import { useMemo, useState } from "react";
import type { HarvestRunState } from "@/block2/truth/canonical-types";
import Header from "@/components/Header";
import AddHoldingForm from "@/components/AddHoldingForm";
import PortfolioTable from "@/components/PortfolioTable";
import { evaluateBridgeGate } from "@/lib/bridge-comparability";
import {
  BRIDGE_BLUE_AMOUNT,
  BRIDGE_DEPLOYABLE_CAPITAL,
  BRIDGE_GREEN_AMOUNT,
  BRIDGE_LINES,
  BRIDGE_M_WALLET_PRELOAD,
  BRIDGE_MONTHLY_FUEL,
  BRIDGE_STARTING_CAPITAL,
  bridgeMonthlyFuel,
  bridgeYearlyFuel,
} from "@/lib/bridge-mode";
import {
  createHarvestSnapshot,
  loadLocalQuote,
  refreshQuotes,
  type Quote,
  type QuoteRefreshStatus,
  type RefreshQuotesResult,
} from "@/lib/market";
import { calcCostBasis, loadHoldings, type Holding } from "@/lib/portfolio";
import { fmtDollar, fmtPct } from "@/lib/utils";

type Tab = "warroom" | "portfolio";
type RefreshState = "idle" | "running" | "completed" | "failed";

type RefreshReport = {
  updated: number;
  failed: number;
  statuses: QuoteRefreshStatus[];
  finishedAt: string | null;
};

const REFRESH_TIMEOUT_MS = 8_000;

function Stat({ label, value, detail }: { label: string; value: string; detail?: string }) {
  return (
    <div className="rounded-2xl border border-border bg-card p-3 shadow-sm">
      <div className="text-[10px] uppercase tracking-widest text-muted-foreground">{label}</div>
      <div className="mt-1 text-lg font-semibold text-foreground num">{value}</div>
      {detail ? <div className="mt-1 text-[11px] text-muted-foreground">{detail}</div> : null}
    </div>
  );
}

function timeoutResult(tickers: string[]): RefreshQuotesResult {
  const timestamp = Date.now();
  return {
    quotes: {},
    failed: tickers,
    statuses: tickers.map((symbol) => ({
      symbol,
      status: "failed",
      source: "none",
      timestamp,
      observedAt: null,
      connectionStatus: "FAILED",
      ageSeconds: null,
      truthClass: "FAILED",
      reason: `Refresh exceeded ${REFRESH_TIMEOUT_MS / 1000}s guardrail and returned control to the operator.`,
    })),
  };
}

function latestHoldingForTicker(holdings: Holding[], ticker: string): Holding | undefined {
  return holdings.find((holding) => holding.ticker === ticker);
}

export default function WarRoom() {
  const [tab, setTab] = useState<Tab>("warroom");
  const [holdings, setHoldings] = useState<Holding[]>(() => loadHoldings());
  const [selectedTickers, setSelectedTickers] = useState<string[]>(() => BRIDGE_LINES.map((line) => line.ticker));
  const [refreshState, setRefreshState] = useState<RefreshState>("idle");
  const [harvestState, setHarvestState] = useState<HarvestRunState>("idle");
  const [refreshReport, setRefreshReport] = useState<RefreshReport | null>(null);
  const [lastUpdated, setLastUpdated] = useState<number | null>(null);
  const [lastHarvestAt, setLastHarvestAt] = useState<string | null>(null);
  const [quoteEpoch, setQuoteEpoch] = useState(0);

  const quotesByTicker = useMemo(() => {
    void quoteEpoch;
    const quotes: Record<string, Quote | undefined> = {};
    BRIDGE_LINES.forEach((line) => {
      quotes[line.ticker] = loadLocalQuote(line.ticker);
    });
    return quotes;
  }, [quoteEpoch]);

  const refreshIssues = refreshReport?.statuses.filter((status) => status.status !== "refreshed") ?? [];
  const canHarvest = Boolean(refreshReport?.statuses.length && selectedTickers.length);
  const harvestSummary = lastHarvestAt
    ? `harvest snapshot ${new Date(lastHarvestAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`
    : refreshReport?.finishedAt
      ? `refresh finished · ${refreshReport.updated} updated · ${refreshReport.failed} unresolved`
      : null;

  const bridgeRows = useMemo(
    () => BRIDGE_LINES.map((line) => {
      const holding = latestHoldingForTicker(holdings, line.ticker);
      const quote = quotesByTicker[line.ticker];
      const costBasis = holding ? calcCostBasis(holding) : line.amount;
      const gate = evaluateBridgeGate({
        ticker: line.ticker,
        quote,
        shares: holding?.shares ?? null,
        costBasis,
        nextExDate: holding?.nextExDate ?? null,
        nextPayDate: holding?.nextPayDate ?? null,
        thesis: holding?.thesis ?? null,
      });
      return { line, holding, quote, costBasis, gate };
    }),
    [holdings, quotesByTicker],
  );

  function toggleTicker(ticker: string) {
    setSelectedTickers((current) => current.includes(ticker) ? current.filter((item) => item !== ticker) : [...current, ticker]);
  }

  async function handleDataRefresh() {
    if (refreshState === "running" || selectedTickers.length === 0) return;
    setRefreshState("running");
    setHarvestState("idle");

    try {
      const result = await Promise.race([
        refreshQuotes(selectedTickers),
        new Promise<RefreshQuotesResult>((resolve) => {
          window.setTimeout(() => resolve(timeoutResult(selectedTickers)), REFRESH_TIMEOUT_MS);
        }),
      ]);
      const now = Date.now();
      setLastUpdated(now);
      setRefreshReport({
        updated: result.statuses.filter((status) => status.status === "refreshed").length,
        failed: result.failed.length,
        statuses: result.statuses,
        finishedAt: new Date(now).toISOString(),
      });
      setQuoteEpoch((value) => value + 1);
      setRefreshState(result.failed.length ? "failed" : "completed");
    } catch (error) {
      const now = Date.now();
      console.error("Wave-I bridge refresh failed", error);
      setLastUpdated(now);
      setRefreshReport({ updated: 0, failed: selectedTickers.length, statuses: timeoutResult(selectedTickers).statuses, finishedAt: new Date(now).toISOString() });
      setRefreshState("failed");
    }
  }

  function handleHarvestData() {
    if (harvestState === "running" || !canHarvest) return;
    setHarvestState("running");
    const snapshot = createHarvestSnapshot(selectedTickers);
    if (!snapshot) {
      setHarvestState("failed");
      return;
    }
    setLastHarvestAt(snapshot.createdAt);
    setHarvestState("completed");
  }

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <Header
        tab={tab}
        onTabChange={setTab}
        onDataRefresh={handleDataRefresh}
        onHarvestData={handleHarvestData}
        refreshState={refreshState}
        harvestState={harvestState}
        harvestSummary={harvestSummary}
        lastUpdated={lastUpdated}
        holdingsCount={holdings.length}
        canHarvest={canHarvest}
      />

      {tab === "warroom" ? (
        <main className="mx-auto flex w-full max-w-7xl flex-1 flex-col gap-5 px-4 py-4 md:px-6 md:py-6">
          <section className="grid gap-3 md:grid-cols-2 xl:grid-cols-6">
            <Stat label="Starting capital" value={fmtDollar(BRIDGE_STARTING_CAPITAL, 0)} detail="Manual bridge paper" />
            <Stat label="|M| D3 wallet" value={fmtDollar(BRIDGE_M_WALLET_PRELOAD, 0)} detail="Fixed preload · not MINT ETF" />
            <Stat label="Deployable" value={fmtDollar(BRIDGE_DEPLOYABLE_CAPITAL, 0)} detail="After |M| preload" />
            <Stat label="[G] Green" value={fmtDollar(BRIDGE_GREEN_AMOUNT, 0)} detail="65% of deployable" />
            <Stat label="[B] Blue" value={fmtDollar(BRIDGE_BLUE_AMOUNT, 0)} detail="35% of deployable" />
            <Stat label="Monthly fuel" value={fmtDollar(BRIDGE_MONTHLY_FUEL)} detail="Bridge estimate before tax/costs" />
          </section>

          <section className="rounded-2xl border border-border bg-card p-4 shadow-sm">
            <div className="flex flex-col gap-1 md:flex-row md:items-center md:justify-between">
              <div>
                <h2 className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Operator-triggered refresh scope</h2>
                <div className="mt-1 text-sm font-semibold text-foreground">Selected tickers only · no timers · no secret harvest fetch</div>
              </div>
              <span className="text-[11px] text-muted-foreground md:text-right">[Harvest Data] stores the latest already-refreshed state as an immutable local snapshot.</span>
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              {BRIDGE_LINES.map((line) => (
                <button
                  key={line.ticker}
                  type="button"
                  onClick={() => toggleTicker(line.ticker)}
                  className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors ${
                    selectedTickers.includes(line.ticker)
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-border bg-background text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {line.displayTicker}
                </button>
              ))}
            </div>
          </section>

          <section className="rounded-2xl border border-border bg-card p-4 shadow-sm">
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Bridge comparability grid</h2>
              <span className="text-[10px] text-muted-foreground">Missing required metrics block or degrade the row; they are not sell signals.</span>
            </div>
            <div className="mt-3 overflow-x-auto">
              <table className="w-full min-w-[1180px] text-xs">
                <thead>
                  <tr className="border-b border-border/60 bg-muted/20">
                    <th className="px-2 py-2 text-left uppercase tracking-widest text-muted-foreground">Ticker</th>
                    <th className="px-2 py-2 text-left uppercase tracking-widest text-muted-foreground">Bucket</th>
                    <th className="px-2 py-2 text-left uppercase tracking-widest text-muted-foreground">Amount</th>
                    <th className="px-2 py-2 text-left uppercase tracking-widest text-muted-foreground">Fuel</th>
                    <th className="px-2 py-2 text-left uppercase tracking-widest text-muted-foreground">Price</th>
                    <th className="px-2 py-2 text-left uppercase tracking-widest text-muted-foreground">Truth</th>
                    <th className="px-2 py-2 text-left uppercase tracking-widest text-muted-foreground">NAV / spread</th>
                    <th className="px-2 py-2 text-left uppercase tracking-widest text-muted-foreground">Status</th>
                    <th className="px-2 py-2 text-left uppercase tracking-widest text-muted-foreground">Gate reason</th>
                  </tr>
                </thead>
                <tbody>
                  {bridgeRows.map(({ line, quote, gate }) => (
                    <tr key={line.ticker} className="border-b border-border/20 hover:bg-muted/10">
                      <td className="px-2 py-2.5 font-bold text-foreground">{line.displayTicker}</td>
                      <td className="px-2 py-2.5">[{line.bucket[0]}]</td>
                      <td className="px-2 py-2.5 num">{fmtDollar(line.amount, 0)} · {fmtPct(line.weight * 100)}</td>
                      <td className="px-2 py-2.5 num">{fmtDollar(bridgeMonthlyFuel(line))}/mo · {fmtDollar(bridgeYearlyFuel(line), 0)}/yr</td>
                      <td className="px-2 py-2.5 num">{fmtDollar(quote?.price)}</td>
                      <td className="px-2 py-2.5">{quote?.source ?? "none"} · {quote?.truthClass ?? "FAILED"}</td>
                      <td className="px-2 py-2.5 num">NAV {fmtDollar(quote?.nav)} · spread {fmtPct(quote?.spreadPct)}</td>
                      <td className="px-2 py-2.5">
                        <span className={`rounded-full px-2 py-1 text-[10px] font-bold uppercase ${gate.status === "comparable" ? "bg-emerald-100 text-emerald-800" : gate.status === "blocked" ? "bg-red-100 text-red-800" : "bg-amber-100 text-amber-800"}`}>
                          {gate.status}
                        </span>
                      </td>
                      <td className="px-2 py-2.5 text-muted-foreground">{gate.reasons[0] ?? "All required visible metrics present."}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
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
            <span className="text-[10px] text-muted-foreground">Bridge containers only: |M|, [B], [G]</span>
          </div>
          <AddHoldingForm holdings={holdings} onHoldingsChange={setHoldings} />
          <PortfolioTable holdings={holdings} onHoldingsChange={setHoldings} />
        </main>
      )}
    </div>
  );
}
