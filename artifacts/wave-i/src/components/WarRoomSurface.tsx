import { useEffect, useMemo, useState } from "react";
import AddHoldingForm from "@/components/AddHoldingForm";
import PortfolioTable from "@/components/PortfolioTable";
import WarRoomSevenTileGrid, { type SevenTileItem } from "@/components/WarRoomSevenTileGrid";
import { buildCapitalSummary } from "@/lib/capital-summary";
import { captureWarRoomSnapshot, loadLatestWarRoomCapture, type WarRoomCapture } from "@/lib/data-scrape";
import { listWaveIInstruments } from "@/lib/loadInstruments";
import { loadLocalQuote, refreshQuotes, type Quote, type QuoteRefreshStatus } from "@/lib/market";
import { loadHoldings, type Holding } from "@/lib/portfolio";
import { installThemeShield } from "@/lib/theme-shield";
import { fmtDollar, fmtPct } from "@/lib/utils";

type Tab = "warroom" | "portfolio";
type RunState = "idle" | "running" | "completed";
type ForcedTheme = "dark" | "frost";
type TileTruth = "LIVE" | "DEGRADED" | "STALE" | "FAILED";

type RefreshReport = {
  updated: number;
  failed: number;
  statuses: QuoteRefreshStatus[];
  finishedAt: string | null;
};

const REFRESH_TIMEOUT_MS = 8000;

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
    reason: `Refresh exceeded ${REFRESH_TIMEOUT_MS / 1000}s guardrail.`,
  }));
}

function aggregateTruth(statuses: QuoteRefreshStatus[], fallback: TileTruth): TileTruth {
  if (statuses.some((status) => status.connectionStatus === "FAILED")) return "FAILED";
  if (statuses.some((status) => status.connectionStatus === "STALE")) return "STALE";
  if (statuses.some((status) => status.connectionStatus === "DEGRADED")) return "DEGRADED";
  return fallback;
}

export default function WarRoomSurface() {
  const [tab, setTab] = useState<Tab>("warroom");
  const [theme, setTheme] = useState<ForcedTheme>("dark");
  const [holdings, setHoldings] = useState<Holding[]>(() => loadHoldings());
  const [refreshState, setRefreshState] = useState<RunState>("idle");
  const [refreshReport, setRefreshReport] = useState<RefreshReport | null>(null);
  const [latestCapture, setLatestCapture] = useState<WarRoomCapture | null>(() => loadLatestWarRoomCapture());
  const [quoteEpoch, setQuoteEpoch] = useState(0);

  useEffect(() => {
    installThemeShield(theme);
  }, [theme]);

  const quotesByTicker = useMemo(() => {
    void quoteEpoch;
    const quotes: Record<string, Quote | undefined> = {};
    holdings.forEach((holding) => {
      quotes[holding.ticker] = loadLocalQuote(holding.ticker);
    });
    return quotes;
  }, [holdings, quoteEpoch]);

  const summary = useMemo(() => buildCapitalSummary(holdings, quotesByTicker), [holdings, quotesByTicker]);
  const statuses = refreshReport?.statuses ?? [];
  const issues = statuses.filter((status) => status.status !== "refreshed");
  const covered = holdings.filter((holding) => Boolean(quotesByTicker[holding.ticker])).length;
  const coveragePct = holdings.length > 0 ? Math.round((covered / holdings.length) * 100) : 0;
  const truth = aggregateTruth(statuses, holdings.length === 0 ? "STALE" : "LIVE");

  const tiles = useMemo<SevenTileItem[]>(() => [
    { id: "total", label: "Total capital", value: fmtDollar(summary.currentMarketValue ?? summary.deployedCostBasis), movement: fmtPct(summary.unrealizedGLPct), truthClass: truth, sourceId: "WAR_ROOM_CAPITAL_SUMMARY", detail: "Market value where quote state permits; cost basis fallback otherwise.", tone: "cyan" },
    { id: "deployed", label: "Deployed", value: fmtDollar(summary.deployedCostBasis), movement: "0.00%", truthClass: "LIVE", sourceId: "WAR_ROOM_DEPLOYED_COST_BASIS", detail: "Raw deployed cost basis from holdings.", tone: "mint" },
    { id: "unrealized", label: "Unrealized", value: fmtDollar(summary.unrealizedGL), movement: fmtPct(summary.unrealizedGLPct), truthClass: summary.currentMarketValue == null ? "STALE" : truth, sourceId: "WAR_ROOM_UNREALIZED_GL", detail: "Marked gain or loss using available quote state.", tone: "cyan" },
    { id: "reserve", label: "Cash / reserve", value: fmtDollar(0), movement: "0.00%", truthClass: "STALE", sourceId: "WAR_ROOM_MANUAL_RESERVE_EXCLUDED", detail: "Manual bridge excludes |W| from active runtime.", tone: "neutral" },
    { id: "issues", label: "Refresh issues", value: String(issues.length), movement: "0.00%", truthClass: issues.length > 0 ? "DEGRADED" : "LIVE", sourceId: "WAR_ROOM_REFRESH_STATUS", detail: "Unresolved ticker refresh statuses from the latest pass.", tone: issues.length > 0 ? "amber" : "mint" },
    { id: "coverage", label: "Quote coverage", value: `${covered}/${holdings.length}`, movement: `${coveragePct}%`, truthClass: holdings.length === 0 ? "STALE" : covered < holdings.length ? "DEGRADED" : "LIVE", sourceId: "WAR_ROOM_QUOTE_COVERAGE", detail: "Tracked holdings with cached quote state.", tone: "cyan" },
    { id: "sheets", label: "Google Sheets", value: latestCapture ? `${latestCapture.data.length} rows` : "Ready", movement: "APPEND_ROWS", truthClass: "LIVE", sourceId: "WaveRider_Archive/Telemetry_Logs", detail: "Payload mapped to the archive headers.", tone: "mint" },
  ], [covered, coveragePct, holdings.length, issues.length, latestCapture, summary, truth]);

  const surface = theme === "dark"
    ? "min-h-screen bg-slate-950 text-slate-100 wavei-theme-shield"
    : "min-h-screen bg-slate-100 text-slate-950 wavei-theme-shield";

  async function scrape(statusesForPayload: QuoteRefreshStatus[] = statuses) {
    const payload = await captureWarRoomSnapshot({
      readinessState: issues.length > 0 ? "degraded" : "ready",
      refreshState,
      holdings,
      quotesByTicker,
      refreshStatuses: statusesForPayload,
      capitalSummary: summary,
    });
    setLatestCapture(payload);
    console.log("[DATA_SCRAPE] Google Sheets append payload", payload);
  }

  async function refreshData() {
    if (refreshState === "running") return;
    setRefreshState("running");
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
      setRefreshReport({
        updated: result.statuses.filter((status) => status.status === "refreshed").length,
        failed: result.failed.length,
        statuses: result.statuses,
        finishedAt: new Date().toISOString(),
      });
      setQuoteEpoch((value) => value + 1);
      await scrape(result.statuses);
    } catch (error) {
      setRefreshReport({ updated: 0, failed: 1, statuses: [], finishedAt: new Date().toISOString() });
      await scrape([]);
      console.error("Wave-I refresh failed", error);
    } finally {
      setRefreshState("completed");
    }
  }

  return (
    <div className={surface}>
      <div className="mx-auto flex min-h-screen w-full max-w-7xl flex-col gap-5 px-4 py-4 md:px-6 md:py-6">
        <header className="wavei-liquid-glass flex flex-col gap-3 rounded-3xl p-4 shadow-[0_0_38px_rgba(34,211,238,0.18)] md:flex-row md:items-center md:justify-between">
          <div>
            <div className="text-[10px] font-bold uppercase tracking-[0.28em] text-cyan-300">Wave-I War Room</div>
            <h1 className="mt-1 text-3xl font-semibold">Truth Spine Dashboard</h1>
            <div className="mt-1 text-xs opacity-70">{refreshReport?.finishedAt ? `updated ${new Date(refreshReport.finishedAt).toLocaleTimeString()}` : "no refresh pass yet"}</div>
          </div>
          <div className="flex flex-wrap gap-2">
            <button type="button" onClick={() => setTab(tab === "warroom" ? "portfolio" : "warroom")} className="rounded-2xl border border-white/20 bg-white/10 px-4 py-2 text-xs font-semibold uppercase tracking-widest">{tab === "warroom" ? "Portfolio" : "War Room"}</button>
            <button type="button" onClick={() => setTheme(theme === "dark" ? "frost" : "dark")} className="rounded-2xl border border-cyan-200/50 bg-cyan-300/10 px-4 py-2 text-xs font-semibold uppercase tracking-widest shadow-[0_0_18px_rgba(34,211,238,0.22)]">Theme: {theme}</button>
            <button type="button" onClick={refreshData} disabled={refreshState === "running"} className="rounded-2xl border border-cyan-200/70 bg-cyan-300/20 px-4 py-2 text-xs font-bold uppercase tracking-widest shadow-[0_0_24px_rgba(34,211,238,0.45)] disabled:opacity-60">[Data Refresh]</button>
          </div>
        </header>

        {tab === "warroom" ? (
          <main className="flex flex-1 flex-col gap-5">
            <WarRoomSevenTileGrid tiles={tiles} />
            <button type="button" onClick={() => void scrape()} className="fixed bottom-5 right-5 z-20 rounded-2xl border border-emerald-200/80 bg-emerald-200/40 px-4 py-3 text-xs font-bold uppercase tracking-widest text-emerald-950 shadow-[0_0_30px_rgba(52,211,153,0.55)] backdrop-blur-xl">[Data Scrape]</button>
          </main>
        ) : (
          <main className="wavei-liquid-glass flex flex-1 flex-col gap-4 rounded-3xl p-4">
            <AddHoldingForm holdings={holdings} onHoldingsChange={setHoldings} />
            <PortfolioTable holdings={holdings} onHoldingsChange={setHoldings} />
          </main>
        )}
      </div>
    </div>
  );
}
