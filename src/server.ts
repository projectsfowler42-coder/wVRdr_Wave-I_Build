import express from "express";
import cors from "cors";
import { z } from "zod";
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";

const PORT = Number(process.env.PORT ?? 8787);
const DATA_DIR = path.join(process.cwd(), "wave-i-data");
const REFRESH_PATH = path.join(DATA_DIR, "latest-refresh.json");
const HARVEST_PATH = path.join(DATA_DIR, "harvests.json");

type Container = "|M|" | "[B]" | "[G]";
type TruthClass = "RAW_MARKET" | "RAW_USER" | "RAW_OFFICIAL" | "TRANSFORMED" | "STALE" | "DEGRADED" | "FAILED" | "UNRESOLVED" | "QUARANTINED";
type RowStatus = "VALID" | "VALID_WITH_WATCH" | "WATCH" | "DEGRADED" | "FAILED" | "UNRESOLVED";
type InstrumentType = "ETF" | "CEF" | "BDC" | "REIT" | "Stock" | "Cash";
type SelectedYieldType = "SEC_YIELD" | "DISTRIBUTION_YIELD" | "TTM_DISTRIBUTION" | "OPERATOR_SELECTED" | "UNRESOLVED";
type DistributionTrend = "RISING" | "STABLE" | "FALLING" | "CUT_DETECTED" | "UNKNOWN";

type Instrument = {
  ticker: string;
  name: string;
  issuer: string;
  allowedContainers: Container[];
  instrumentType: InstrumentType;
  role: string;
  expenseRatioPct: number | null;
  distributionFrequency: "monthly" | "quarterly" | "unknown";
  requiresNavCheck: boolean;
  requiresDistributionCheck: boolean;
  active: boolean;
};

type PositionInput = {
  shares?: number;
  costBasis?: number;
  allocationAmount?: number;
};

type QuoteBlock = {
  price: number | null;
  previousClose: number | null;
  changeDollar: number | null;
  changePct: number | null;
  bid: number | null;
  ask: number | null;
  spreadPct: number | null;
  volume: number | null;
  avgVolume30d: number | null;
  volumeRatio: number | null;
  observedAt: string | null;
  source: string;
  truthClass: TruthClass;
  stale: boolean;
  degraded: boolean;
  failed: boolean;
};

type IncomeBlock = {
  secYieldPct: number | null;
  distributionYieldPct: number | null;
  trailing12mDistributionYieldPct: number | null;
  selectedYieldPct: number | null;
  selectedYieldType: SelectedYieldType;
  lastDistribution: number | null;
  nextExDate: string | null;
  nextPayDate: string | null;
  distributionFrequency: "monthly" | "quarterly" | "unknown";
  distributionTrend: DistributionTrend;
  observedAt: string | null;
  source: string;
  truthClass: TruthClass;
  stale: boolean;
  degraded: boolean;
  failed: boolean;
};

type NavBlock = {
  nav: number | null;
  premiumDiscountPct: number | null;
  navDistributionRatePct: number | null;
  priceDistributionRatePct: number | null;
  leveragePct: number | null;
  observedAt: string | null;
  source: string;
  truthClass: TruthClass;
  stale: boolean;
  degraded: boolean;
  failed: boolean;
};

type ComparableNumbers = {
  expenseRatioPct: number | null;
  return1mPct: number | null;
  return3mPct: number | null;
  return12mPct: number | null;
  maxDrawdown1yPct: number | null;
  volatility90dPct: number | null;
  downsideDeviation90dPct: number | null;
  monthlyIncomePer1000: number | null;
  annualIncomePer1000: number | null;
};

type PositionBlock = {
  shares: number | null;
  costBasis: number | null;
  marketValue: number | null;
  allocationPct: number | null;
  unrealizedDollar: number | null;
  unrealizedPct: number | null;
  yieldOnCost: number | null;
  currentYield: number | null;
  source: string;
  truthClass: TruthClass;
};

type RefreshedInstrumentRow = {
  ticker: string;
  container: Container;
  name: string;
  issuer: string;
  instrumentType: InstrumentType;
  role: string;
  quote: QuoteBlock;
  income: IncomeBlock;
  nav: NavBlock;
  comparable: ComparableNumbers;
  position: PositionBlock;
  status: RowStatus;
  requiredChecksPassed: boolean;
  comparableReady: boolean;
  failedChecks: string[];
  watchChecks: string[];
  unresolvedChecks: string[];
};

type RefreshError = {
  ticker: string;
  container: Container;
  errorType: "UNSUPPORTED_TICKER" | "BAD_SELECTION";
  message: string;
};

type DataRefreshResponse = {
  refreshRunId: string;
  requestedAt: string;
  refreshedAt: string;
  status: "VALID" | "DEGRADED" | "FAILED";
  rows: RefreshedInstrumentRow[];
  errors: RefreshError[];
  rules: {
    selectedTickersOnly: true;
    timedRefresh: false;
    polling: false;
    autonomousRefresh: false;
    autonomousExecution: false;
    secretFetchDuringHarvest: false;
  };
};

type HarvestSnapshot = {
  harvestRunId: string;
  sourceRefreshRunId: string;
  harvestedAt: string;
  status: "VALID" | "DEGRADED" | "FAILED";
  rows: RefreshedInstrumentRow[];
  operatorNote?: string;
};

const INSTRUMENTS: Instrument[] = [
  { ticker: "MINT", name: "MINT ETF - PIMCO Enhanced Short Maturity Active ETF", issuer: "PIMCO", allowedContainers: ["|M|", "[B]"], instrumentType: "ETF", role: "short-duration cash proxy / bridge staging option", expenseRatioPct: null, distributionFrequency: "monthly", requiresNavCheck: true, requiresDistributionCheck: true, active: true },
  { ticker: "SGOV", name: "iShares 0-3 Month Treasury Bond ETF", issuer: "BlackRock iShares", allowedContainers: ["|M|", "[B]"], instrumentType: "ETF", role: "near-cash Treasury reserve", expenseRatioPct: null, distributionFrequency: "monthly", requiresNavCheck: true, requiresDistributionCheck: true, active: true },
  { ticker: "BIL", name: "SPDR Bloomberg 1-3 Month T-Bill ETF", issuer: "State Street SPDR", allowedContainers: ["|M|", "[B]"], instrumentType: "ETF", role: "near-cash Treasury reserve", expenseRatioPct: null, distributionFrequency: "monthly", requiresNavCheck: true, requiresDistributionCheck: true, active: true },
  { ticker: "JAAA", name: "Janus Henderson AAA CLO ETF", issuer: "Janus Henderson", allowedContainers: ["[B]"], instrumentType: "ETF", role: "Blue AAA CLO anchor", expenseRatioPct: null, distributionFrequency: "monthly", requiresNavCheck: true, requiresDistributionCheck: true, active: true },
  { ticker: "FLOT", name: "iShares Floating Rate Bond ETF", issuer: "BlackRock iShares", allowedContainers: ["[B]"], instrumentType: "ETF", role: "Blue investment-grade floater", expenseRatioPct: null, distributionFrequency: "monthly", requiresNavCheck: true, requiresDistributionCheck: true, active: true },
  { ticker: "XFLT", name: "XAI Octagon Floating Rate & Alternative Income Trust", issuer: "XAI Octagon", allowedContainers: ["[G]"], instrumentType: "CEF", role: "Green bridge-mode high-output accelerator", expenseRatioPct: null, distributionFrequency: "monthly", requiresNavCheck: true, requiresDistributionCheck: true, active: true },
  { ticker: "SRLN", name: "State Street Blackstone Senior Loan ETF", issuer: "State Street", allowedContainers: ["[G]"], instrumentType: "ETF", role: "Green senior-loan ballast", expenseRatioPct: null, distributionFrequency: "monthly", requiresNavCheck: true, requiresDistributionCheck: true, active: true },
  { ticker: "JBBB", name: "Janus Henderson B-BBB CLO ETF", issuer: "Janus Henderson", allowedContainers: ["[G]"], instrumentType: "ETF", role: "Green CLO debt income", expenseRatioPct: null, distributionFrequency: "monthly", requiresNavCheck: true, requiresDistributionCheck: true, active: true },
  { ticker: "BKLN", name: "Invesco Senior Loan ETF", issuer: "Invesco", allowedContainers: ["[G]"], instrumentType: "ETF", role: "Green senior-loan anchor", expenseRatioPct: null, distributionFrequency: "monthly", requiresNavCheck: true, requiresDistributionCheck: true, active: true },
];

const INSTRUMENT_BY_TICKER = new Map(INSTRUMENTS.map((instrument) => [instrument.ticker, instrument]));

const INCOME_HINTS: Record<string, { selectedYieldPct: number; lastDistribution: number | null; nextExDate: string | null; nextPayDate: string | null; trend: DistributionTrend }> = {
  XFLT: { selectedYieldPct: 15.72, lastDistribution: 0.225, nextExDate: "2026-04-15", nextPayDate: "2026-05-01", trend: "CUT_DETECTED" },
  SRLN: { selectedYieldPct: 7.63, lastDistribution: 0.24802, nextExDate: "2026-04-01", nextPayDate: "2026-04-06", trend: "UNKNOWN" },
  JBBB: { selectedYieldPct: 7.19, lastDistribution: 0.22084, nextExDate: "2026-03-31", nextPayDate: "2026-04-07", trend: "UNKNOWN" },
  BKLN: { selectedYieldPct: 7.01, lastDistribution: 0.11551, nextExDate: "2026-03-23", nextPayDate: "2026-03-27", trend: "UNKNOWN" },
  JAAA: { selectedYieldPct: 5.13, lastDistribution: 0.20243, nextExDate: "2026-03-31", nextPayDate: "2026-04-07", trend: "UNKNOWN" },
  FLOT: { selectedYieldPct: 4.67, lastDistribution: 0.17933, nextExDate: "2026-04-01", nextPayDate: "2026-04-07", trend: "UNKNOWN" },
  MINT: { selectedYieldPct: 4.49, lastDistribution: 0.34, nextExDate: "2026-04-01", nextPayDate: "2026-04-03", trend: "UNKNOWN" },
  SGOV: { selectedYieldPct: 4.0, lastDistribution: null, nextExDate: null, nextPayDate: null, trend: "UNKNOWN" },
  BIL: { selectedYieldPct: 4.0, lastDistribution: null, nextExDate: null, nextPayDate: null, trend: "UNKNOWN" },
};

const PositionInputSchema = z.object({
  shares: z.number().finite().nonnegative().optional(),
  costBasis: z.number().finite().nonnegative().optional(),
  allocationAmount: z.number().finite().nonnegative().optional(),
}).optional();

const DataRefreshRequestSchema = z.object({
  requestedAt: z.string().optional(),
  totalBridgeCapital: z.number().finite().positive().optional(),
  selections: z.array(z.object({
    container: z.union([z.literal("|M|"), z.literal("[B]"), z.literal("[G]")]),
    ticker: z.string().min(1),
    position: PositionInputSchema,
  })).min(1),
});

const HarvestRequestSchema = z.object({
  refreshRunId: z.string().min(1),
  operatorNote: z.string().optional(),
});

function ensureDataDir(): void {
  fs.mkdirSync(DATA_DIR, { recursive: true });
  if (!fs.existsSync(HARVEST_PATH)) fs.writeFileSync(HARVEST_PATH, "[]", "utf8");
}

function nowIso(): string { return new Date().toISOString(); }
function uuid(prefix: string): string { return `${prefix}_${crypto.randomUUID()}`; }
function finite(value: unknown): number | null { return typeof value === "number" && Number.isFinite(value) ? value : null; }
function round(value: number | null, digits = 4): number | null { return value == null || !Number.isFinite(value) ? null : Math.round(value * 10 ** digits) / 10 ** digits; }
function annualIncomePer1000(yieldPct: number | null): number | null { return yieldPct == null ? null : round(1000 * yieldPct / 100, 4); }
function monthlyIncomePer1000(yieldPct: number | null): number | null { const annual = annualIncomePer1000(yieldPct); return annual == null ? null : round(annual / 12, 4); }
function pct(numerator: number | null, denominator: number | null): number | null { return numerator == null || denominator == null || denominator === 0 ? null : round((numerator / denominator) * 100, 6); }

function returnPct(closes: number[], sessionsBack: number): number | null {
  if (closes.length <= sessionsBack) return null;
  const start = closes[closes.length - 1 - sessionsBack];
  const end = closes[closes.length - 1];
  return start > 0 ? round(((end - start) / start) * 100, 6) : null;
}

function maxDrawdownPct(closes: number[]): number | null {
  if (closes.length < 2) return null;
  let peak = closes[0];
  let maxDrawdown = 0;
  for (const close of closes) {
    if (close > peak) peak = close;
    if (peak > 0) maxDrawdown = Math.min(maxDrawdown, (close - peak) / peak);
  }
  return round(maxDrawdown * 100, 6);
}

function volatilityPct(closes: number[], lookback: number, downsideOnly: boolean): number | null {
  if (closes.length < lookback + 1) return null;
  const returns: number[] = [];
  for (let i = closes.length - lookback; i < closes.length; i += 1) {
    const prev = closes[i - 1];
    const next = closes[i];
    if (prev > 0) {
      const value = (next - prev) / prev;
      if (!downsideOnly || value < 0) returns.push(value);
    }
  }
  if (!returns.length) return null;
  const mean = downsideOnly ? 0 : returns.reduce((sum, item) => sum + item, 0) / returns.length;
  const variance = returns.reduce((sum, item) => sum + (item - mean) ** 2, 0) / returns.length;
  return round(Math.sqrt(variance) * Math.sqrt(252) * 100, 6);
}

async function fetchQuoteAndRisk(ticker: string): Promise<{ quote: QuoteBlock; risk: Pick<ComparableNumbers, "return1mPct" | "return3mPct" | "return12mPct" | "maxDrawdown1yPct" | "volatility90dPct" | "downsideDeviation90dPct"> }> {
  const endpoint = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(ticker)}?interval=1d&range=1y&includePrePost=true`;
  try {
    const started = Date.now();
    const response = await fetch(endpoint, { headers: { accept: "application/json", "user-agent": "Wave-I-Minimal-Backend/1.0" }, signal: AbortSignal.timeout(12000) });
    if (!response.ok) throw new Error(`http ${response.status}`);
    const payload = await response.json() as any;
    const result = payload?.chart?.result?.[0];
    const meta = result?.meta ?? {};
    const quote = result?.indicators?.quote?.[0] ?? {};
    const closes = (quote.close ?? []).filter((item: unknown) => typeof item === "number" && Number.isFinite(item)) as number[];
    const volumes = (quote.volume ?? []).filter((item: unknown) => typeof item === "number" && Number.isFinite(item)) as number[];
    const price = finite(meta.regularMarketPrice) ?? (closes.length ? closes[closes.length - 1] : null);
    const previousClose = finite(meta.previousClose) ?? finite(meta.chartPreviousClose) ?? (closes.length > 1 ? closes[closes.length - 2] : null);
    const changeDollar = price != null && previousClose != null ? round(price - previousClose, 6) : null;
    const changePct = changeDollar != null && previousClose ? round((changeDollar / previousClose) * 100, 6) : null;
    const bid = finite(meta.bid);
    const ask = finite(meta.ask);
    const midpoint = bid != null && ask != null ? (bid + ask) / 2 : null;
    const spreadPct = bid != null && ask != null && midpoint != null && midpoint > 0 ? round(((ask - bid) / midpoint) * 100, 6) : null;
    const volume = finite(meta.regularMarketVolume) ?? (volumes.length ? volumes[volumes.length - 1] : null);
    const recentVolumes = volumes.slice(-30);
    const avgVolume30d = recentVolumes.length ? round(recentVolumes.reduce((sum, item) => sum + item, 0) / recentVolumes.length, 0) : null;
    const volumeRatio = volume != null && avgVolume30d != null && avgVolume30d > 0 ? round(volume / avgVolume30d, 6) : null;
    const marketTime = finite(meta.regularMarketTime);
    const observedAt = marketTime ? new Date(marketTime * 1000).toISOString() : nowIso();
    return {
      quote: { price, previousClose, changeDollar, changePct, bid, ask, spreadPct, volume, avgVolume30d, volumeRatio, observedAt, source: `yahoo-chart latencyMs=${Date.now() - started}`, truthClass: price != null ? "RAW_MARKET" : "FAILED", stale: false, degraded: price == null, failed: price == null },
      risk: { return1mPct: returnPct(closes, 21), return3mPct: returnPct(closes, 63), return12mPct: returnPct(closes, 252), maxDrawdown1yPct: maxDrawdownPct(closes), volatility90dPct: volatilityPct(closes, 90, false), downsideDeviation90dPct: volatilityPct(closes, 90, true) },
    };
  } catch (error) {
    return {
      quote: { price: null, previousClose: null, changeDollar: null, changePct: null, bid: null, ask: null, spreadPct: null, volume: null, avgVolume30d: null, volumeRatio: null, observedAt: nowIso(), source: `yahoo-chart failed: ${error instanceof Error ? error.message : String(error)}`, truthClass: "FAILED", stale: false, degraded: true, failed: true },
      risk: { return1mPct: null, return3mPct: null, return12mPct: null, maxDrawdown1yPct: null, volatility90dPct: null, downsideDeviation90dPct: null },
    };
  }
}

async function fetchIncomeFacts(ticker: string, instrument: Instrument): Promise<IncomeBlock> {
  const hint = INCOME_HINTS[ticker];
  if (!hint) {
    return { secYieldPct: null, distributionYieldPct: null, trailing12mDistributionYieldPct: null, selectedYieldPct: null, selectedYieldType: "UNRESOLVED", lastDistribution: null, nextExDate: null, nextPayDate: null, distributionFrequency: "unknown", distributionTrend: "UNKNOWN", observedAt: null, source: "income adapter not wired", truthClass: "UNRESOLVED", stale: false, degraded: true, failed: false };
  }
  return { secYieldPct: null, distributionYieldPct: hint.selectedYieldPct, trailing12mDistributionYieldPct: null, selectedYieldPct: hint.selectedYieldPct, selectedYieldType: "DISTRIBUTION_YIELD", lastDistribution: hint.lastDistribution, nextExDate: hint.nextExDate, nextPayDate: hint.nextPayDate, distributionFrequency: instrument.distributionFrequency, distributionTrend: hint.trend, observedAt: null, source: "static paper context only; issuer refresh required before execution", truthClass: "UNRESOLVED", stale: true, degraded: true, failed: false };
}

async function fetchNavFacts(ticker: string, quote: QuoteBlock, income: IncomeBlock): Promise<NavBlock> {
  const annualDistribution = income.lastDistribution != null ? income.lastDistribution * 12 : null;
  const priceDistributionRatePct = quote.price != null && annualDistribution != null ? round((annualDistribution / quote.price) * 100, 6) : null;
  return { nav: null, premiumDiscountPct: null, navDistributionRatePct: null, priceDistributionRatePct, leveragePct: null, observedAt: null, source: ticker === "XFLT" ? "NAV adapter missing; XFLT blocked until issuer NAV is present" : "NAV adapter not wired", truthClass: "UNRESOLVED", stale: false, degraded: true, failed: false };
}

function buildComparable(instrument: Instrument, income: IncomeBlock, risk: Pick<ComparableNumbers, "return1mPct" | "return3mPct" | "return12mPct" | "maxDrawdown1yPct" | "volatility90dPct" | "downsideDeviation90dPct">): ComparableNumbers {
  return { expenseRatioPct: instrument.expenseRatioPct, ...risk, monthlyIncomePer1000: monthlyIncomePer1000(income.selectedYieldPct), annualIncomePer1000: annualIncomePer1000(income.selectedYieldPct) };
}

function buildPosition(position: PositionInput | undefined, quote: QuoteBlock, income: IncomeBlock, totalBridgeCapital: number | undefined): PositionBlock {
  const shares = finite(position?.shares) ?? null;
  const costBasis = finite(position?.costBasis) ?? null;
  const allocationAmount = finite(position?.allocationAmount) ?? null;
  const marketValue = shares != null && quote.price != null ? round(shares * quote.price, 2) : allocationAmount;
  const unrealizedDollar = marketValue != null && costBasis != null ? round(marketValue - costBasis, 2) : null;
  const unrealizedPct = unrealizedDollar != null && costBasis != null && costBasis > 0 ? round((unrealizedDollar / costBasis) * 100, 6) : null;
  const yieldOnCost = income.selectedYieldPct != null && marketValue != null && costBasis != null && costBasis > 0 ? round((marketValue * (income.selectedYieldPct / 100) / costBasis) * 100, 6) : null;
  const allocationPct = marketValue != null && totalBridgeCapital != null && totalBridgeCapital > 0 ? round((marketValue / totalBridgeCapital) * 100, 6) : null;
  return { shares, costBasis, marketValue, allocationPct, unrealizedDollar, unrealizedPct, yieldOnCost, currentYield: income.selectedYieldPct, source: position ? "operator request input" : "not supplied", truthClass: position ? "RAW_USER" : "UNRESOLVED" };
}

function validateSelection(container: Container, ticker: string): RefreshError | null {
  const instrument = INSTRUMENT_BY_TICKER.get(ticker);
  if (!instrument || !instrument.active) return { ticker, container, errorType: "UNSUPPORTED_TICKER", message: `${ticker} is not in the active Wave-I bridge instrument list.` };
  if (!instrument.allowedContainers.includes(container)) return { ticker, container, errorType: "BAD_SELECTION", message: `${ticker} is not allowed in ${container}.` };
  return null;
}

function runChecks(row: Omit<RefreshedInstrumentRow, "status" | "requiredChecksPassed" | "comparableReady" | "failedChecks" | "watchChecks" | "unresolvedChecks">): Pick<RefreshedInstrumentRow, "status" | "requiredChecksPassed" | "comparableReady" | "failedChecks" | "watchChecks" | "unresolvedChecks"> {
  const failed: string[] = [];
  const watch: string[] = [];
  const unresolved: string[] = [];
  if (row.quote.failed || row.quote.price == null || row.quote.price <= 0) failed.push("quote price missing or failed");
  if (!row.quote.observedAt) failed.push("quote timestamp missing");
  if (row.quote.bid == null || row.quote.ask == null || row.quote.spreadPct == null) watch.push("bid/ask spread unavailable");
  if (row.income.selectedYieldPct == null || row.income.selectedYieldPct < 0) failed.push("selected yield missing");
  if (row.income.truthClass !== "RAW_OFFICIAL") watch.push("income facts are not issuer-wired yet");
  if (row.income.nextExDate == null) watch.push("next ex-date unresolved");
  if (row.income.nextPayDate == null) watch.push("next pay-date unresolved");
  if (row.income.distributionTrend === "CUT_DETECTED") watch.push("distribution cut detected");
  if (row.nav.nav == null) unresolved.push("NAV missing");
  if (row.nav.premiumDiscountPct == null) unresolved.push("premium/discount missing");
  if (row.nav.leveragePct == null) watch.push("leverage unresolved");
  if (row.ticker === "XFLT" && row.nav.nav == null) failed.push("XFLT requires NAV and NAV is missing");
  if (row.comparable.return1mPct == null) watch.push("1-month return unresolved");
  if (row.comparable.return3mPct == null) watch.push("3-month return unresolved");
  if (row.comparable.return12mPct == null) watch.push("12-month return unresolved");
  if (row.comparable.maxDrawdown1yPct == null) watch.push("1-year max drawdown unresolved");
  if (row.comparable.volatility90dPct == null) watch.push("90-day volatility unresolved");
  if (row.comparable.downsideDeviation90dPct == null) watch.push("90-day downside deviation unresolved");
  const comparableReady = failed.length === 0 && unresolved.length === 0;
  if (failed.length) return { status: "FAILED", requiredChecksPassed: false, comparableReady, failedChecks: failed, watchChecks: watch, unresolvedChecks: unresolved };
  if (unresolved.length) return { status: "UNRESOLVED", requiredChecksPassed: false, comparableReady, failedChecks: failed, watchChecks: watch, unresolvedChecks: unresolved };
  if (watch.length) return { status: "WATCH", requiredChecksPassed: true, comparableReady, failedChecks: failed, watchChecks: watch, unresolvedChecks: unresolved };
  return { status: "VALID", requiredChecksPassed: true, comparableReady, failedChecks: failed, watchChecks: watch, unresolvedChecks: unresolved };
}

async function refreshOne(container: Container, ticker: string, position: PositionInput | undefined, totalBridgeCapital: number | undefined): Promise<{ row?: RefreshedInstrumentRow; error?: RefreshError }> {
  const upper = ticker.toUpperCase().trim();
  const selectionError = validateSelection(container, upper);
  if (selectionError) return { error: selectionError };
  const instrument = INSTRUMENT_BY_TICKER.get(upper)!;
  const { quote, risk } = await fetchQuoteAndRisk(upper);
  const income = await fetchIncomeFacts(upper, instrument);
  const nav = await fetchNavFacts(upper, quote, income);
  const comparable = buildComparable(instrument, income, risk);
  const positionBlock = buildPosition(position, quote, income, totalBridgeCapital);
  const baseRow = { ticker: upper, container, name: instrument.name, issuer: instrument.issuer, instrumentType: instrument.instrumentType, role: instrument.role, quote, income, nav, comparable, position: positionBlock };
  return { row: { ...baseRow, ...runChecks(baseRow) } };
}

function overallStatus(rows: RefreshedInstrumentRow[], errors: RefreshError[]): DataRefreshResponse["status"] {
  if (!rows.length || errors.length || rows.some((row) => row.status === "FAILED")) return "FAILED";
  if (rows.some((row) => row.status !== "VALID")) return "DEGRADED";
  return "VALID";
}

function saveLatest(refresh: DataRefreshResponse): void { ensureDataDir(); fs.writeFileSync(REFRESH_PATH, JSON.stringify(refresh, null, 2), "utf8"); }
function loadLatest(): DataRefreshResponse | null { ensureDataDir(); if (!fs.existsSync(REFRESH_PATH)) return null; try { return JSON.parse(fs.readFileSync(REFRESH_PATH, "utf8")) as DataRefreshResponse; } catch { return null; } }
function loadHarvests(): HarvestSnapshot[] { ensureDataDir(); try { return JSON.parse(fs.readFileSync(HARVEST_PATH, "utf8")) as HarvestSnapshot[]; } catch { return []; } }
function saveHarvests(harvests: HarvestSnapshot[]): void { ensureDataDir(); fs.writeFileSync(HARVEST_PATH, JSON.stringify(harvests, null, 2), "utf8"); }

const app = express();
app.use(cors());
app.use(express.json({ limit: "2mb" }));

app.get("/api/wave-i/health", (_req, res) => res.json({ status: "OK", checkedAt: nowIso(), mode: "OPERATOR_TRIGGERED_MINIMAL_LIVE_BACKEND", activeContainers: ["|M|", "[B]", "[G]"], excludedContainers: ["|W|"], rules: { selectedTickersOnly: true, timedRefresh: false, polling: false, autonomousRefresh: false, autonomousExecution: false, secretFetchDuringHarvest: false }, storage: { dataDir: DATA_DIR, latestRefreshExists: Boolean(loadLatest()), harvestCount: loadHarvests().length } }));
app.get("/api/wave-i/instruments", (_req, res) => res.json({ status: "VALID", instruments: INSTRUMENTS, namingRule: { MINT: "MINT ETF ticker", "|M|": "D3 staging wallet", bareMint: "forbidden in system labels" } }));
app.get("/api/wave-i/latest-refresh", (_req, res) => { const latest = loadLatest(); if (!latest) res.status(404).json({ status: "FAILED", message: "No refresh has been run yet. Press [Data Refresh] first." }); else res.json(latest); });
app.get("/api/wave-i/harvests", (_req, res) => res.json({ status: "VALID", harvests: loadHarvests() }));

app.post("/api/wave-i/data-refresh", async (req, res) => {
  const parsed = DataRefreshRequestSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ refreshRunId: uuid("refresh_failed"), requestedAt: nowIso(), refreshedAt: nowIso(), status: "FAILED", rows: [], errors: [{ ticker: "(request)", container: "|M|", errorType: "BAD_SELECTION", message: parsed.error.message }], rules: { selectedTickersOnly: true, timedRefresh: false, polling: false, autonomousRefresh: false, autonomousExecution: false, secretFetchDuringHarvest: false } } satisfies DataRefreshResponse);
  const rows: RefreshedInstrumentRow[] = [];
  const errors: RefreshError[] = [];
  const unique = new Map<string, { container: Container; ticker: string; position?: PositionInput }>();
  for (const selection of parsed.data.selections) unique.set(`${selection.container}:${selection.ticker.toUpperCase().trim()}`, { container: selection.container, ticker: selection.ticker.toUpperCase().trim(), position: selection.position });
  for (const selection of unique.values()) {
    const result = await refreshOne(selection.container, selection.ticker, selection.position, parsed.data.totalBridgeCapital);
    if (result.row) rows.push(result.row);
    if (result.error) errors.push(result.error);
  }
  const response: DataRefreshResponse = { refreshRunId: uuid("refresh"), requestedAt: parsed.data.requestedAt ?? nowIso(), refreshedAt: nowIso(), status: overallStatus(rows, errors), rows, errors, rules: { selectedTickersOnly: true, timedRefresh: false, polling: false, autonomousRefresh: false, autonomousExecution: false, secretFetchDuringHarvest: false } };
  saveLatest(response);
  return res.json(response);
});

app.post("/api/wave-i/harvest", (req, res) => {
  const parsed = HarvestRequestSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ status: "FAILED", message: parsed.error.message });
  const latest = loadLatest();
  if (!latest) return res.status(409).json({ status: "FAILED", message: "No latest refresh exists. Press [Data Refresh] before [Harvest Data]." });
  if (latest.refreshRunId !== parsed.data.refreshRunId) return res.status(409).json({ status: "FAILED", message: "Harvest blocked. refreshRunId does not match latest refreshed state.", latestRefreshRunId: latest.refreshRunId, requestedRefreshRunId: parsed.data.refreshRunId });
  const failedRows = latest.rows.filter((row) => row.status === "FAILED").length;
  if (failedRows > 0) return res.status(409).json({ status: "FAILED", message: "Harvest blocked because one or more rows failed required checks.", failedRows });
  const snapshot: HarvestSnapshot = { harvestRunId: uuid("harvest"), sourceRefreshRunId: latest.refreshRunId, harvestedAt: nowIso(), status: latest.status === "VALID" ? "VALID" : "DEGRADED", rows: latest.rows, operatorNote: parsed.data.operatorNote };
  const harvests = loadHarvests();
  harvests.push(snapshot);
  saveHarvests(harvests);
  return res.json({ harvestRunId: snapshot.harvestRunId, sourceRefreshRunId: snapshot.sourceRefreshRunId, harvestedAt: snapshot.harvestedAt, status: snapshot.status, totalRows: snapshot.rows.length, watchRows: snapshot.rows.filter((row) => row.status !== "VALID").length, snapshotStored: true });
});

app.get("/", (_req, res) => res.type("text/plain").send("Wave-I minimal backend. Operator-triggered refresh only. No timers. No polling. No autonomous execution."));

ensureDataDir();
app.listen(PORT, () => console.log(`Wave-I minimal backend listening on http://localhost:${PORT}`));
