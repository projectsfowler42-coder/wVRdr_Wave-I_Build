import { listWaveIInstruments } from "@/lib/loadInstruments";

export type QuoteConnectionStatus = "LIVE" | "DEGRADED" | "STALE" | "FAILED";
export type QuoteTruthClass = "RAW_MARKET" | "UNRESOLVED" | "FAILED";
export type QuoteSource = "stooq-direct" | "yahoo-direct" | "quarantined-proxy" | "local-cache" | "none";

export interface Quote {
  symbol: string;
  price: number | null;
  previousClose: number | null;
  change: number | null;
  changePct: number | null;
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

type StoredQuoteMap = Record<string, Partial<Quote>>;
type StoredStatusMap = Record<string, QuoteRefreshStatus>;
type YahooChartResult = {
  meta?: Record<string, unknown>;
  indicators?: {
    quote?: Array<Record<string, Array<number | null> | undefined>>;
  };
};

type QuoteAttemptResult = {
  source: QuoteSource;
  quote: Partial<Quote>;
  note?: string | null;
};

const STORAGE_KEY = "wavei_market_snapshots_v3";
const LEGACY_STORAGE_KEYS = ["wavei_market_snapshots_v2", "wavei_market_snapshots_v1"];
const STATUS_KEY = "wavei_market_refresh_status_v2";
const YAHOO_CHART_BASE = "https://query1.finance.yahoo.com/v8/finance/chart/";
const STOOQ_BASE = "https://stooq.com/q/l/";
const QUARANTINED_PROXY_BASE = "https://api.allorigins.win/raw?url=";
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
    // Storage can fail in private mode or restricted environments.
  }
}

function normalizeSymbol(symbol: string): string {
  return symbol.trim().toUpperCase();
}

function observedAtFromTimestamp(timestamp: number): string | null {
  return timestamp > 0 ? new Date(timestamp).toISOString() : null;
}

function ageSecondsFromTimestamp(timestamp: number, nowMs = Date.now()): number | null {
  if (timestamp <= 0) return null;
  return Math.max(0, Math.round((nowMs - timestamp) / 1000));
}

function isUsableQuote(quote: Quote): boolean {
  return quote.price != null && quote.timestamp > 0;
}

function emptyQuote(symbol: string): Quote {
  return {
    symbol,
    price: null,
    previousClose: null,
    change: null,
    changePct: null,
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
    observedAt: null,
    source: "none",
    connectionStatus: "FAILED",
    ageSeconds: null,
    truthClass: "FAILED",
    stale: false,
    degraded: false,
    conflicted: false,
  };
}

function parseJson<T>(raw: string | null): T | null {
  if (!raw) return null;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

function readStoredSnapshots(): StoredQuoteMap {
  const current = parseJson<StoredQuoteMap>(safeStorageGet(STORAGE_KEY));
  if (current) return current;
  for (const key of LEGACY_STORAGE_KEYS) {
    const legacy = parseJson<StoredQuoteMap>(safeStorageGet(key));
    if (legacy) return legacy;
  }
  return {};
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

function asNumber(value: unknown): number | null {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function csvNumber(value: string | undefined): number | null {
  if (!value || value === "N/D") return null;
  const parsed = Number(value.replace(/,/g, ""));
  return Number.isFinite(parsed) ? parsed : null;
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
  if (!values) return null;
  let out: number | null = null;
  values.forEach((value) => {
    const next = asNumber(value);
    if (next == null) return;
    out = out == null ? next : Math.min(out, next);
  });
  return out;
}

function maxFinite(values?: Array<number | null>): number | null {
  if (!values) return null;
  let out: number | null = null;
  values.forEach((value) => {
    const next = asNumber(value);
    if (next == null) return;
    out = out == null ? next : Math.max(out, next);
  });
  return out;
}

function normalizeQuote(symbol: string, partial?: Partial<Quote> | null): Quote {
  const normalizedSymbol = normalizeSymbol(symbol);
  const base = emptyQuote(normalizedSymbol);
  if (!partial) return base;

  const timestamp = typeof partial.timestamp === "number" ? partial.timestamp : 0;
  const connectionStatus = partial.connectionStatus ?? base.connectionStatus;
  const truthClass = partial.truthClass ?? base.truthClass;

  return {
    ...base,
    ...partial,
    symbol: normalizedSymbol,
    timestamp,
    observedAt: partial.observedAt ?? observedAtFromTimestamp(timestamp),
    source: partial.source ?? base.source,
    connectionStatus,
    ageSeconds: partial.ageSeconds ?? ageSecondsFromTimestamp(timestamp),
    truthClass,
    stale: partial.stale ?? connectionStatus === "STALE",
    degraded: partial.degraded ?? connectionStatus === "DEGRADED",
    conflicted: Boolean(partial.conflicted),
    isAfterHours: Boolean(partial.isAfterHours && partial.afterHoursPrice != null),
  };
}

function annotateQuote(
  quote: Quote,
  source: QuoteSource,
  connectionStatus: QuoteConnectionStatus,
  truthClass: QuoteTruthClass,
): Quote {
  const timestamp = quote.timestamp;
  return {
    ...quote,
    source,
    connectionStatus,
    observedAt: observedAtFromTimestamp(timestamp),
    ageSeconds: ageSecondsFromTimestamp(timestamp),
    truthClass,
    stale: connectionStatus === "STALE",
    degraded: connectionStatus === "DEGRADED",
    conflicted: false,
  };
}

function cachedQuote(symbol: string): Quote {
  const normalizedSymbol = normalizeSymbol(symbol);
  const stored = normalizeQuote(normalizedSymbol, readStoredSnapshots()[normalizedSymbol] ?? null);
  if (!isUsableQuote(stored)) return annotateQuote(stored, "none", "FAILED", "FAILED");
  return annotateQuote(stored, "local-cache", "STALE", "UNRESOLVED");
}

function classifyRemoteQuote(source: QuoteSource, quote: Quote): { connectionStatus: QuoteConnectionStatus; truthClass: QuoteTruthClass; note: string | null } {
  if (!isUsableQuote(quote)) {
    return { connectionStatus: "FAILED", truthClass: "FAILED", note: "remote source returned no usable numeric quote" };
  }

  if (source === "quarantined-proxy") {
    return { connectionStatus: "DEGRADED", truthClass: "UNRESOLVED", note: "direct transports failed; used quarantined proxy" };
  }

  const ageMs = Date.now() - quote.timestamp;
  if (ageMs > LIVE_QUOTE_MAX_AGE_MS) {
    return { connectionStatus: "DEGRADED", truthClass: "UNRESOLVED", note: "direct feed responded but quote timestamp is outside live freshness window" };
  }

  return { connectionStatus: "LIVE", truthClass: "RAW_MARKET", note: null };
}

function buildRefreshStatus(
  symbol: string,
  status: QuoteRefreshStatus["status"],
  source: QuoteSource,
  connectionStatus: QuoteConnectionStatus,
  truthClass: QuoteTruthClass,
  reason: string | null,
  quote?: Quote,
): QuoteRefreshStatus {
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

function buildRemoteQuote(symbol: string, result: YahooChartResult): Partial<Quote> {
  const meta = result.meta ?? {};
  const series = result.indicators?.quote?.[0];
  const price = asNumber(meta.regularMarketPrice) ?? lastFinite(series?.close);
  const previousClose =
    asNumber(meta.previousClose) ??
    asNumber(meta.regularMarketPreviousClose) ??
    asNumber(meta.chartPreviousClose);
  const change =
    asNumber(meta.regularMarketChange) ??
    (price != null && previousClose != null ? price - previousClose : null);
  const changePct =
    asNumber(meta.regularMarketChangePercent) ??
    (change != null && previousClose != null && previousClose !== 0 ? (change / previousClose) * 100 : null);
  const afterHoursPrice = asNumber(meta.postMarketPrice) ?? asNumber(meta.preMarketPrice);
  const remoteTimestamp =
    asNumber(meta.postMarketTime) ??
    asNumber(meta.preMarketTime) ??
    asNumber(meta.regularMarketTime);
  const timestamp =
    remoteTimestamp != null
      ? remoteTimestamp < 1_000_000_000_000
        ? remoteTimestamp * 1000
        : remoteTimestamp
      : Date.now();

  return {
    symbol: normalizeSymbol(symbol),
    price,
    previousClose,
    change,
    changePct,
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
  const timer = window.setTimeout(() => controller.abort(), 12000);
  try {
    const response = await fetch(url, {
      headers: { accept: "application/json,text/plain,*/*" },
      signal: controller.signal,
    });
    if (!response.ok) throw new Error(`http ${response.status}`);
    return await response.text();
  } finally {
    window.clearTimeout(timer);
  }
}

async function fetchTextViaQuarantinedProxy(url: string): Promise<string> {
  return fetchText(`${QUARANTINED_PROXY_BASE}${encodeURIComponent(url)}`);
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
  const dayHigh = csvNumber(row.High);
  const dayLow = csvNumber(row.Low);
  const previousClose = open;
  const change = price != null && previousClose != null ? price - previousClose : null;
  const changePct = change != null && previousClose != null && previousClose !== 0 ? (change / previousClose) * 100 : null;
  const volume = csvNumber(row.Volume);
  if (price == null) throw new Error("no stooq price");
  return {
    symbol: normalizeSymbol(symbol),
    price,
    previousClose,
    change,
    changePct,
    open,
    dayHigh,
    dayLow,
    volume,
    avgVolume: null,
    marketCap: null,
    afterHoursPrice: null,
    afterHoursChange: null,
    afterHoursChangePct: null,
    isAfterHours: false,
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

async function requestStooqViaQuarantinedProxy(symbol: string): Promise<Partial<Quote>> {
  const targetUrl = `${STOOQ_BASE}?s=${encodeURIComponent(normalizeSymbol(symbol).toLowerCase())}&f=sd2t2ohlcvn&e=csv`;
  return parseStooqQuote(symbol, await fetchTextViaQuarantinedProxy(targetUrl));
}

async function requestYahooViaQuarantinedProxy(symbol: string): Promise<Partial<Quote>> {
  const targetUrl = `${YAHOO_CHART_BASE}${encodeURIComponent(normalizeSymbol(symbol))}?interval=1d&range=5d&includePrePost=true`;
  return parseYahooQuote(symbol, await fetchTextViaQuarantinedProxy(targetUrl));
}

export function loadLocalQuote(symbol: string): Quote {
  return cachedQuote(symbol);
}

export function saveLocalQuote(symbol: string, partial: Partial<Quote>): Quote {
  const normalizedSymbol = normalizeSymbol(symbol);
  const current = readStoredSnapshots();
  const next = normalizeQuote(normalizedSymbol, {
    ...current[normalizedSymbol],
    ...partial,
    symbol: normalizedSymbol,
    timestamp: typeof partial.timestamp === "number" ? partial.timestamp : Date.now(),
  });
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
  const source: string[] = symbols?.length
    ? symbols
    : listWaveIInstruments().filter((instrument) => instrument.activeWaveIScope).map((instrument) => instrument.ticker);

  const unique = [...new Set(source.map(normalizeSymbol))];
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

  const attempts: Array<() => Promise<QuoteAttemptResult>> = [
    async () => ({ source: "stooq-direct", quote: await requestStooqDirect(normalizedSymbol), note: null }),
    async () => ({ source: "yahoo-direct", quote: await requestYahooDirect(normalizedSymbol), note: null }),
    async () => ({ source: "quarantined-proxy", quote: await requestStooqViaQuarantinedProxy(normalizedSymbol), note: "direct transports failed; used quarantined proxy" }),
    async () => ({ source: "quarantined-proxy", quote: await requestYahooViaQuarantinedProxy(normalizedSymbol), note: "direct transports failed; used quarantined proxy" }),
  ];

  for (const attempt of attempts) {
    try {
      const result = await attempt();
      const saved = saveLocalQuote(normalizedSymbol, result.quote);
      const classification = classifyRemoteQuote(result.source, saved);
      const reason = result.note ?? classification.note;
      const quote = annotateQuote(saved, result.source, classification.connectionStatus, classification.truthClass);
      return {
        quote,
        status: buildRefreshStatus(
          normalizedSymbol,
          classification.connectionStatus === "FAILED" ? "failed" : "refreshed",
          result.source,
          classification.connectionStatus,
          classification.truthClass,
          reason,
          quote,
        ),
      };
    } catch (error) {
      errors.push(error instanceof Error ? error.message : String(error));
    }
  }

  if (isUsableQuote(local)) {
    return {
      quote: local,
      status: buildRefreshStatus(
        normalizedSymbol,
        "reused-local",
        "local-cache",
        "STALE",
        "UNRESOLVED",
        errors.join(" | ") || "remote refresh failed; reusing stale local snapshot",
        local,
      ),
    };
  }

  return {
    quote: local,
    status: buildRefreshStatus(
      normalizedSymbol,
      "failed",
      "none",
      "FAILED",
      "FAILED",
      errors.join(" | ") || "all refresh transports failed",
      local,
    ),
  };
}

export async function refreshQuotes(symbols?: string[]): Promise<RefreshQuotesResult> {
  const source: string[] = symbols?.length
    ? symbols
    : listWaveIInstruments().filter((instrument) => instrument.activeWaveIScope).map((instrument) => instrument.ticker);

  const unique = [...new Set(source.map(normalizeSymbol))];
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

export const TAPE_SYMBOLS = ["SPY", "QQQ", "IWM", "TLT", "HYG", "BKLN", "SGOV", "USFR", "JEPI", "O", "VICI"];

export async function fetchTape(): Promise<TapeItem[]> {
  return TAPE_SYMBOLS.map((symbol) => loadLocalQuote(symbol))
    .filter((quote) => quote.price != null)
    .map((quote) => ({
      symbol: quote.symbol,
      price: quote.price as number,
      change: quote.change ?? 0,
      changePct: quote.changePct ?? 0,
    }));
}
