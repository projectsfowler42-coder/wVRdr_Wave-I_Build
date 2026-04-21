import { BRIDGE_TICKERS, bridgeLineForTicker } from "@/lib/bridge-mode";

export type QuoteConnectionStatus = "LIVE" | "DEGRADED" | "STALE" | "FAILED";
export type QuoteTruthClass = "RAW_MARKET" | "TRANSFORMED" | "UNRESOLVED" | "FAILED";
export type QuoteSource = "stooq-direct" | "yahoo-direct" | "quarantined-proxy" | "local-cache" | "manual" | "none";

export interface Quote {
  symbol: string;
  price: number | null;
  previousClose: number | null;
  change: number | null;
  changePct: number | null;
  bid: number | null;
  ask: number | null;
  spreadPct: number | null;
  open: number | null;
  dayHigh: number | null;
  dayLow: number | null;
  fiftyTwoWeekHigh: number | null;
  fiftyTwoWeekLow: number | null;
  volume: number | null;
  avgVolume: number | null;
  marketCap: number | null;
  afterHoursPrice: number | null;
  afterHoursChange: number | null;
  afterHoursChangePct: number | null;
  isAfterHours: boolean;
  selectedYieldPct: number | null;
  yieldType: string | null;
  lastDistribution: number | null;
  monthlyIncomePer1000: number | null;
  annualIncomePer1000: number | null;
  nav: number | null;
  premiumDiscountPct: number | null;
  navDistributionRatePct: number | null;
  priceDistributionRatePct: number | null;
  leveragePct: number | null;
  distributionTrend: "stable" | "cut" | "raised" | "unresolved" | null;
  liquidityStatus: "acceptable" | "watch" | "poor" | "unresolved" | null;
  oneMonthReturnPct: number | null;
  threeMonthReturnPct: number | null;
  twelveMonthReturnPct: number | null;
  oneYearMaxDrawdownPct: number | null;
  ninetyDayVolatilityPct: number | null;
  downsideDeviationPct: number | null;
  timestamp: number;
  observedAt: string | null;
  source: QuoteSource;
  connectionStatus: QuoteConnectionStatus;
  ageSeconds: number | null;
  truthClass: QuoteTruthClass;
  stale: boolean;
  degraded: boolean;
  conflicted: boolean;
}

export interface TapeItem {
  symbol: string;
  price: number;
  change: number;
  changePct: number;
}

export interface QuoteRefreshStatus {
  symbol: string;
  status: "refreshed" | "reused-local" | "failed";
  source: QuoteSource;
  reason: string | null;
  timestamp: number;
  observedAt: string | null;
  connectionStatus: QuoteConnectionStatus;
  ageSeconds: number | null;
  truthClass: QuoteTruthClass;
}

export interface RefreshQuotesResult {
  quotes: Record<string, Quote>;
  failed: string[];
  statuses: QuoteRefreshStatus[];
}

export interface HarvestSnapshot {
  id: string;
  createdAt: string;
  tickers: string[];
  quotes: Record<string, Quote>;
  statuses: QuoteRefreshStatus[];
}

type StoredQuoteMap = Record<string, Partial<Quote>>;
type StoredStatusMap = Record<string, QuoteRefreshStatus>;
type YahooChartResult = {
  meta?: Record<string, unknown>;
  indicators?: { quote?: Array<Record<string, Array<number | null> | undefined>> };
};

const STORAGE_KEY = "wavei_bridge_market_snapshots_v1";
const STATUS_KEY = "wavei_bridge_refresh_status_v1";
const HARVEST_KEY = "wavei_bridge_harvest_snapshots_v1";
const YAHOO_CHART_BASE = "https://query1.finance.yahoo.com/v8/finance/chart/";
const STOOQ_BASE = "https://stooq.com/q/l/";
const LIVE_QUOTE_MAX_AGE_MS = 60 * 1000;

function safeStorageGet(key: string): string | null {
  try {
    return typeof localStorage === "undefined" ? null : localStorage.getItem(key);
  } catch {
    return null;
  }
}

function safeStorageSet(key: string, value: string): void {
  try {
    if (typeof localStorage !== "undefined") localStorage.setItem(key, value);
  } catch {
    return;
  }
}

function parseJson<T>(raw: string | null): T | null {
  if (!raw) return null;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

function normalizeSymbol(symbol: string): string {
  return symbol.trim().toUpperCase();
}

function asNumber(value: unknown): number | null {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function csvNumber(value: string | undefined): number | null {
  if (!value || value === "N/D") return null;
  const parsed = Number(value.replace(/,/g, ""));
  return Number.isFinite(parsed) ? parsed : null;
}

function observedAtFromTimestamp(timestamp: number): string | null {
  return timestamp > 0 ? new Date(timestamp).toISOString() : null;
}

function ageSecondsFromTimestamp(timestamp: number, nowMs = Date.now()): number | null {
  if (timestamp <= 0) return null;
  return Math.max(0, Math.round((nowMs - timestamp) / 1000));
}

function readStoredSnapshots(): StoredQuoteMap {
  return parseJson<StoredQuoteMap>(safeStorageGet(STORAGE_KEY)) ?? {};
}

function readStoredStatuses(): StoredStatusMap {
  return parseJson<StoredStatusMap>(safeStorageGet(STATUS_KEY)) ?? {};
}

function writeStoredStatuses(statuses: QuoteRefreshStatus[]): void {
  const current = readStoredStatuses();
  statuses.forEach((status) => {
    current[normalizeSymbol(status.symbol)] = status;
  });
  safeStorageSet(STATUS_KEY, JSON.stringify(current));
}

function firstFinite(values?: Array<number | null>): number | null {
  if (!values) return null;
  for (const value of values) {
    const next = asNumber(value);
    if (next != null) return next;
  }
  return null;
}

function lastFinite(values?: Array<number | null>): number | null {
  if (!values) return null;
  for (let index = values.length - 1; index >= 0; index -= 1) {
    const next = asNumber(values[index]);
    if (next != null) return next;
  }
  return null;
}

function minFinite(values?: Array<number | null>): number | null {
  const finite = values?.map(asNumber).filter((value): value is number => value != null) ?? [];
  return finite.length ? Math.min(...finite) : null;
}

function maxFinite(values?: Array<number | null>): number | null {
  const finite = values?.map(asNumber).filter((value): value is number => value != null) ?? [];
  return finite.length ? Math.max(...finite) : null;
}

function calcSpreadPct(bid: number | null, ask: number | null): number | null {
  if (bid == null || ask == null || bid <= 0 || ask <= 0) return null;
  return ((ask - bid) / ((ask + bid) / 2)) * 100;
}

function bridgeDefaults(symbol: string): Partial<Quote> {
  const line = bridgeLineForTicker(symbol);
  if (!line) return {};
  return {
    selectedYieldPct: line.rate,
    yieldType: symbol === "XFLT" ? "issuer label / live check required" : "bridge-paper working estimate",
    monthlyIncomePer1000: (1000 * line.rate) / 100 / 12,
    annualIncomePer1000: (1000 * line.rate) / 100,
    distributionTrend: "unresolved",
    liquidityStatus: "unresolved",
  };
}

function emptyQuote(symbol: string): Quote {
  return normalizeQuote(symbol, {
    symbol,
    price: null,
    previousClose: null,
    change: null,
    changePct: null,
    bid: null,
    ask: null,
    spreadPct: null,
    open: null,
    dayHigh: null,
    dayLow: null,
    fiftyTwoWeekHigh: null,
    fiftyTwoWeekLow: null,
    volume: null,
    avgVolume: null,
    marketCap: null,
    afterHoursPrice: null,
    afterHoursChange: null,
    afterHoursChangePct: null,
    isAfterHours: false,
    timestamp: 0,
    source: "none",
    connectionStatus: "FAILED",
    truthClass: "FAILED",
  });
}

function normalizeQuote(symbol: string, partial?: Partial<Quote> | null): Quote {
  const normalizedSymbol = normalizeSymbol(symbol);
  const timestamp = typeof partial?.timestamp === "number" ? partial.timestamp : 0;
  const defaults = bridgeDefaults(normalizedSymbol);
  const connectionStatus = partial?.connectionStatus ?? "FAILED";
  const truthClass = partial?.truthClass ?? "FAILED";
  const bid = partial?.bid ?? null;
  const ask = partial?.ask ?? null;
  const spreadPct = partial?.spreadPct ?? calcSpreadPct(bid, ask);
  return {
    symbol: normalizedSymbol,
    price: partial?.price ?? null,
    previousClose: partial?.previousClose ?? null,
    change: partial?.change ?? null,
    changePct: partial?.changePct ?? null,
    bid,
    ask,
    spreadPct,
    open: partial?.open ?? null,
    dayHigh: partial?.dayHigh ?? null,
    dayLow: partial?.dayLow ?? null,
    fiftyTwoWeekHigh: partial?.fiftyTwoWeekHigh ?? null,
    fiftyTwoWeekLow: partial?.fiftyTwoWeekLow ?? null,
    volume: partial?.volume ?? null,
    avgVolume: partial?.avgVolume ?? null,
    marketCap: partial?.marketCap ?? null,
    afterHoursPrice: partial?.afterHoursPrice ?? null,
    afterHoursChange: partial?.afterHoursChange ?? null,
    afterHoursChangePct: partial?.afterHoursChangePct ?? null,
    isAfterHours: Boolean(partial?.isAfterHours && partial.afterHoursPrice != null),
    selectedYieldPct: partial?.selectedYieldPct ?? defaults.selectedYieldPct ?? null,
    yieldType: partial?.yieldType ?? defaults.yieldType ?? null,
    lastDistribution: partial?.lastDistribution ?? null,
    monthlyIncomePer1000: partial?.monthlyIncomePer1000 ?? defaults.monthlyIncomePer1000 ?? null,
    annualIncomePer1000: partial?.annualIncomePer1000 ?? defaults.annualIncomePer1000 ?? null,
    nav: partial?.nav ?? null,
    premiumDiscountPct: partial?.premiumDiscountPct ?? null,
    navDistributionRatePct: partial?.navDistributionRatePct ?? null,
    priceDistributionRatePct: partial?.priceDistributionRatePct ?? defaults.selectedYieldPct ?? null,
    leveragePct: partial?.leveragePct ?? null,
    distributionTrend: partial?.distributionTrend ?? defaults.distributionTrend ?? null,
    liquidityStatus: partial?.liquidityStatus ?? defaults.liquidityStatus ?? null,
    oneMonthReturnPct: partial?.oneMonthReturnPct ?? null,
    threeMonthReturnPct: partial?.threeMonthReturnPct ?? null,
    twelveMonthReturnPct: partial?.twelveMonthReturnPct ?? null,
    oneYearMaxDrawdownPct: partial?.oneYearMaxDrawdownPct ?? null,
    ninetyDayVolatilityPct: partial?.ninetyDayVolatilityPct ?? null,
    downsideDeviationPct: partial?.downsideDeviationPct ?? null,
    timestamp,
    observedAt: partial?.observedAt ?? observedAtFromTimestamp(timestamp),
    source: partial?.source ?? "none",
    connectionStatus,
    ageSeconds: partial?.ageSeconds ?? ageSecondsFromTimestamp(timestamp),
    truthClass,
    stale: partial?.stale ?? connectionStatus === "STALE",
    degraded: partial?.degraded ?? connectionStatus === "DEGRADED",
    conflicted: Boolean(partial?.conflicted),
  };
}

function isUsableQuote(quote: Quote): boolean {
  return quote.price != null && quote.timestamp > 0;
}

function annotateQuote(quote: Quote, source: QuoteSource, connectionStatus: QuoteConnectionStatus, truthClass: QuoteTruthClass): Quote {
  return normalizeQuote(quote.symbol, {
    ...quote,
    source,
    connectionStatus,
    truthClass,
    stale: connectionStatus === "STALE",
    degraded: connectionStatus === "DEGRADED",
    observedAt: observedAtFromTimestamp(quote.timestamp),
    ageSeconds: ageSecondsFromTimestamp(quote.timestamp),
  });
}

function buildRefreshStatus(symbol: string, status: QuoteRefreshStatus["status"], source: QuoteSource, connectionStatus: QuoteConnectionStatus, truthClass: QuoteTruthClass, reason: string | null, quote?: Quote): QuoteRefreshStatus {
  const timestamp = Date.now();
  return {
    symbol: normalizeSymbol(symbol),
    status,
    source,
    reason,
    timestamp,
    observedAt: quote ? observedAtFromTimestamp(quote.timestamp) : null,
    connectionStatus,
    ageSeconds: quote ? ageSecondsFromTimestamp(quote.timestamp, timestamp) : null,
    truthClass,
  };
}

function classifyRemoteQuote(source: QuoteSource, quote: Quote): { connectionStatus: QuoteConnectionStatus; truthClass: QuoteTruthClass; note: string | null } {
  if (!isUsableQuote(quote)) return { connectionStatus: "FAILED", truthClass: "FAILED", note: "remote source returned no usable numeric quote" };
  if (source === "quarantined-proxy") return { connectionStatus: "DEGRADED", truthClass: "UNRESOLVED", note: "proxy source is degraded and not release-grade" };
  const ageMs = Date.now() - quote.timestamp;
  if (ageMs > LIVE_QUOTE_MAX_AGE_MS) return { connectionStatus: "DEGRADED", truthClass: "UNRESOLVED", note: "direct feed timestamp is outside live freshness window" };
  return { connectionStatus: "LIVE", truthClass: "RAW_MARKET", note: null };
}

function buildRemoteQuote(symbol: string, result: YahooChartResult): Partial<Quote> {
  const meta = result.meta ?? {};
  const series = result.indicators?.quote?.[0];
  const price = asNumber(meta.regularMarketPrice) ?? lastFinite(series?.close);
  const previousClose = asNumber(meta.previousClose) ?? asNumber(meta.regularMarketPreviousClose) ?? asNumber(meta.chartPreviousClose);
  const change = asNumber(meta.regularMarketChange) ?? (price != null && previousClose != null ? price - previousClose : null);
  const changePct = asNumber(meta.regularMarketChangePercent) ?? (change != null && previousClose != null && previousClose !== 0 ? (change / previousClose) * 100 : null);
  const bid = asNumber(meta.bid);
  const ask = asNumber(meta.ask);
  const afterHoursPrice = asNumber(meta.postMarketPrice) ?? asNumber(meta.preMarketPrice);
  const remoteTimestamp = asNumber(meta.postMarketTime) ?? asNumber(meta.preMarketTime) ?? asNumber(meta.regularMarketTime);
  const timestamp = remoteTimestamp != null ? (remoteTimestamp < 1_000_000_000_000 ? remoteTimestamp * 1000 : remoteTimestamp) : Date.now();

  return {
    symbol: normalizeSymbol(symbol),
    price,
    previousClose,
    change,
    changePct,
    bid,
    ask,
    spreadPct: calcSpreadPct(bid, ask),
    open: asNumber(meta.regularMarketOpen) ?? firstFinite(series?.open),
    dayHigh: asNumber(meta.regularMarketDayHigh) ?? maxFinite(series?.high),
    dayLow: asNumber(meta.regularMarketDayLow) ?? minFinite(series?.low),
    fiftyTwoWeekHigh: asNumber(meta.fiftyTwoWeekHigh),
    fiftyTwoWeekLow: asNumber(meta.fiftyTwoWeekLow),
    volume: asNumber(meta.regularMarketVolume) ?? lastFinite(series?.volume),
    avgVolume: asNumber(meta.averageDailyVolume10Day) ?? asNumber(meta.averageDailyVolume3Month),
    marketCap: asNumber(meta.marketCap),
    afterHoursPrice,
    afterHoursChange: asNumber(meta.postMarketChange) ?? asNumber(meta.preMarketChange),
    afterHoursChangePct: asNumber(meta.postMarketChangePercent) ?? asNumber(meta.preMarketChangePercent),
    isAfterHours: afterHoursPrice != null,
    timestamp,
  };
}

async function fetchText(url: string): Promise<string> {
  const controller = new AbortController();
  const timer = window.setTimeout(() => controller.abort(), 12_000);
  try {
    const response = await fetch(url, { headers: { accept: "application/json,text/plain,*/*" }, signal: controller.signal });
    if (!response.ok) throw new Error(`http ${response.status}`);
    return await response.text();
  } finally {
    window.clearTimeout(timer);
  }
}

function parseYahooQuote(symbol: string, text: string): Partial<Quote> {
  const payload = JSON.parse(text) as { chart?: { result?: YahooChartResult[] } };
  const result = payload.chart?.result?.[0];
  if (!result) throw new Error("no yahoo result");
  const quote = buildRemoteQuote(symbol, result);
  if (quote.price == null) throw new Error("no yahoo price");
  return quote;
}

function parseStooqQuote(symbol: string, text: string): Partial<Quote> {
  const normalized = text.replace(/\r/g, "");
  const [headerLine, valueLine] = normalized.trim().split("\n");
  if (!headerLine || !valueLine) throw new Error("no stooq csv");
  const headers = headerLine.split(",");
  const values = valueLine.split(",");
  const row = Object.fromEntries(headers.map((header, index) => [header, values[index]])) as Record<string, string>;
  const price = csvNumber(row.Close);
  const open = csvNumber(row.Open);
  const previousClose = open;
  const change = price != null && previousClose != null ? price - previousClose : null;
  const changePct = change != null && previousClose != null && previousClose !== 0 ? (change / previousClose) * 100 : null;
  if (price == null) throw new Error("no stooq price");
  return {
    symbol: normalizeSymbol(symbol),
    price,
    previousClose,
    change,
    changePct,
    open,
    dayHigh: csvNumber(row.High),
    dayLow: csvNumber(row.Low),
    volume: csvNumber(row.Volume),
    timestamp: Date.now(),
  };
}

async function requestStooqDirect(symbol: string): Promise<Partial<Quote>> {
  const targetUrl = `${STOOQ_BASE}?s=${encodeURIComponent(normalizeSymbol(symbol).toLowerCase())}&f=sd2t2ohlcvn&e=csv`;
  return parseStooqQuote(symbol, await fetchText(targetUrl));
}

async function requestYahooDirect(symbol: string): Promise<Partial<Quote>> {
  const targetUrl = `${YAHOO_CHART_BASE}${encodeURIComponent(normalizeSymbol(symbol))}?interval=1d&range=5d&includePrePost=true`;
  return parseYahooQuote(symbol, await fetchText(targetUrl));
}

export function loadLocalQuote(symbol: string): Quote {
  const normalizedSymbol = normalizeSymbol(symbol);
  const stored = readStoredSnapshots()[normalizedSymbol];
  const quote = normalizeQuote(normalizedSymbol, stored ?? null);
  return isUsableQuote(quote) ? annotateQuote(quote, "local-cache", "STALE", "UNRESOLVED") : quote;
}

export function saveLocalQuote(symbol: string, partial: Partial<Quote>): Quote {
  const normalizedSymbol = normalizeSymbol(symbol);
  const current = readStoredSnapshots();
  const next = normalizeQuote(normalizedSymbol, { ...current[normalizedSymbol], ...partial, symbol: normalizedSymbol, timestamp: typeof partial.timestamp === "number" ? partial.timestamp : Date.now() });
  current[normalizedSymbol] = next;
  safeStorageSet(STORAGE_KEY, JSON.stringify(current));
  return next;
}

export function loadRefreshStatus(symbol: string): QuoteRefreshStatus | null {
  return readStoredStatuses()[normalizeSymbol(symbol)] ?? null;
}

export function listRefreshStatuses(): QuoteRefreshStatus[] {
  return Object.values(readStoredStatuses()).sort((left, right) => right.timestamp - left.timestamp);
}

export async function fetchQuote(symbol: string): Promise<Quote> {
  return loadLocalQuote(symbol);
}

export async function fetchQuotes(symbols?: string[]): Promise<Record<string, Quote>> {
  const unique = [...new Set((symbols?.length ? symbols : BRIDGE_TICKERS).map(normalizeSymbol))];
  const out: Record<string, Quote> = {};
  unique.forEach((symbol) => {
    out[symbol] = loadLocalQuote(symbol);
  });
  return out;
}

async function refreshOne(symbol: string): Promise<{ quote: Quote; status: QuoteRefreshStatus }> {
  const normalizedSymbol = normalizeSymbol(symbol);
  const local = loadLocalQuote(normalizedSymbol);
  const errors: string[] = [];
  const attempts: Array<() => Promise<{ source: QuoteSource; quote: Partial<Quote> }>> = [
    async () => ({ source: "stooq-direct", quote: await requestStooqDirect(normalizedSymbol) }),
    async () => ({ source: "yahoo-direct", quote: await requestYahooDirect(normalizedSymbol) }),
  ];

  for (const attempt of attempts) {
    try {
      const result = await attempt();
      const saved = saveLocalQuote(normalizedSymbol, result.quote);
      const classification = classifyRemoteQuote(result.source, saved);
      const quote = annotateQuote(saved, result.source, classification.connectionStatus, classification.truthClass);
      return { quote, status: buildRefreshStatus(normalizedSymbol, "refreshed", result.source, classification.connectionStatus, classification.truthClass, classification.note, quote) };
    } catch (error) {
      errors.push(error instanceof Error ? error.message : String(error));
    }
  }

  if (isUsableQuote(local)) {
    return { quote: local, status: buildRefreshStatus(normalizedSymbol, "reused-local", "local-cache", "STALE", "UNRESOLVED", errors.join(" | ") || "remote refresh failed; reusing stale local snapshot", local) };
  }

  return { quote: local, status: buildRefreshStatus(normalizedSymbol, "failed", "none", "FAILED", "FAILED", errors.join(" | ") || "all refresh transports failed", local) };
}

export async function refreshQuotes(symbols?: string[]): Promise<RefreshQuotesResult> {
  const unique = [...new Set((symbols?.length ? symbols : BRIDGE_TICKERS).map(normalizeSymbol))].filter((symbol) => BRIDGE_TICKERS.includes(symbol));
  const quotes: Record<string, Quote> = {};
  const statuses: QuoteRefreshStatus[] = [];
  const failed: string[] = [];

  for (const symbol of unique) {
    const result = await refreshOne(symbol);
    quotes[symbol] = result.quote;
    statuses.push(result.status);
    if (result.status.connectionStatus === "FAILED") failed.push(symbol);
  }

  writeStoredStatuses(statuses);
  return { quotes, failed, statuses };
}

export function createHarvestSnapshot(tickers: string[]): HarvestSnapshot | null {
  const unique = [...new Set(tickers.map(normalizeSymbol))].filter((symbol) => BRIDGE_TICKERS.includes(symbol));
  if (!unique.length) return null;
  const quotes: Record<string, Quote> = {};
  const statuses = readStoredStatuses();
  const snapshotStatuses: QuoteRefreshStatus[] = [];

  for (const ticker of unique) {
    const quote = loadLocalQuote(ticker);
    const status = statuses[ticker];
    if (!isUsableQuote(quote) || !status) return null;
    quotes[ticker] = quote;
    snapshotStatuses.push(status);
  }

  const createdAt = new Date().toISOString();
  const snapshot: HarvestSnapshot = { id: `harvest-${createdAt}-${Math.random().toString(36).slice(2, 8)}`, createdAt, tickers: unique, quotes, statuses: snapshotStatuses };
  const existing = parseJson<HarvestSnapshot[]>(safeStorageGet(HARVEST_KEY)) ?? [];
  safeStorageSet(HARVEST_KEY, JSON.stringify([snapshot, ...existing]));
  return snapshot;
}

export function listHarvestSnapshots(): HarvestSnapshot[] {
  return parseJson<HarvestSnapshot[]>(safeStorageGet(HARVEST_KEY)) ?? [];
}

export const TAPE_SYMBOLS = BRIDGE_TICKERS;

export async function fetchTape(): Promise<TapeItem[]> {
  return TAPE_SYMBOLS.map((symbol) => loadLocalQuote(symbol))
    .filter((quote) => quote.price != null)
    .map((quote) => ({ symbol: quote.symbol, price: quote.price as number, change: quote.change ?? 0, changePct: quote.changePct ?? 0 }));
}
