export const TICKERS = {
  BLUE: "ARCC",
  GREEN: "AGNC",
} as const;

export type Ticker = (typeof TICKERS)[keyof typeof TICKERS];

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
}

export interface TapeItem {
  symbol: string;
  price: number;
  change: number;
  changePct: number;
}

export interface RefreshQuotesResult {
  quotes: Record<string, Quote>;
  failed: string[];
}

type StoredQuoteMap = Record<string, Partial<Quote>>;
type YahooChartResult = {
  meta?: Record<string, unknown>;
  indicators?: {
    quote?: Array<Record<string, Array<number | null> | undefined>>;
  };
};

const STORAGE_KEY = "wavei_market_snapshots_v1";
const CURATED_SNAPSHOTS: StoredQuoteMap = {};
const YAHOO_CHART_BASE = "https://query1.finance.yahoo.com/v8/finance/chart/";
const CORS_PROXY = "https://api.allorigins.win/raw?url=";

function normalizeSymbol(symbol: string): string {
  return symbol.trim().toUpperCase();
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
  };
}

function readStoredSnapshots(): StoredQuoteMap {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

function asNumber(value: unknown): number | null {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
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
  return {
    ...base,
    ...partial,
    symbol: normalizedSymbol,
    timestamp: typeof partial.timestamp === "number" ? partial.timestamp : 0,
    isAfterHours: Boolean(partial.isAfterHours && partial.afterHoursPrice != null),
  };
}

function buildRemoteQuote(symbol: string, result: YahooChartResult): Partial<Quote> {
  const meta = result.meta ?? {};
  const series = result.indicators?.quote?.[0];

  const price =
    asNumber(meta.regularMarketPrice) ??
    lastFinite(series?.close);

  const previousClose =
    asNumber(meta.previousClose) ??
    asNumber(meta.regularMarketPreviousClose) ??
    asNumber(meta.chartPreviousClose);

  const change =
    asNumber(meta.regularMarketChange) ??
    (price != null && previousClose != null ? price - previousClose : null);

  const changePct =
    asNumber(meta.regularMarketChangePercent) ??
    (change != null && previousClose != null && previousClose !== 0
      ? (change / previousClose) * 100
      : null);

  const afterHoursPrice =
    asNumber(meta.postMarketPrice) ??
    asNumber(meta.preMarketPrice);

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
    avgVolume:
      asNumber(meta.averageDailyVolume10Day) ??
      asNumber(meta.averageDailyVolume3Month),
    marketCap: asNumber(meta.marketCap),
    afterHoursPrice,
    afterHoursChange:
      asNumber(meta.postMarketChange) ??
      asNumber(meta.preMarketChange),
    afterHoursChangePct:
      asNumber(meta.postMarketChangePercent) ??
      asNumber(meta.preMarketChangePercent),
    isAfterHours: afterHoursPrice != null,
    timestamp,
  };
}

async function requestRemoteQuote(symbol: string): Promise<Partial<Quote>> {
  const normalizedSymbol = normalizeSymbol(symbol);
  const targetUrl =
    `${YAHOO_CHART_BASE}${encodeURIComponent(normalizedSymbol)}` +
    "?interval=1d&range=5d&includePrePost=true";
  const response = await fetch(`${CORS_PROXY}${encodeURIComponent(targetUrl)}`, {
    headers: { accept: "application/json" },
  });

  if (!response.ok) {
    throw new Error(`Quote refresh failed for ${normalizedSymbol} (${response.status})`);
  }

  const payload = await response.json() as {
    chart?: { result?: YahooChartResult[] };
  };
  const result = payload.chart?.result?.[0];

  if (!result) {
    throw new Error(`Quote refresh returned no data for ${normalizedSymbol}`);
  }

  const quote = buildRemoteQuote(normalizedSymbol, result);
  if (quote.price == null) {
    throw new Error(`Quote refresh returned no price for ${normalizedSymbol}`);
  }

  return quote;
}

export function loadLocalQuote(symbol: string): Quote {
  const normalizedSymbol = normalizeSymbol(symbol);
  const stored = readStoredSnapshots()[normalizedSymbol];
  const curated = CURATED_SNAPSHOTS[normalizedSymbol];
  return normalizeQuote(normalizedSymbol, stored ?? curated ?? null);
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
  localStorage.setItem(STORAGE_KEY, JSON.stringify(current));
  return next;
}

export async function fetchQuote(symbol: string): Promise<Quote> {
  return loadLocalQuote(symbol);
}

export async function refreshQuote(symbol: string): Promise<Quote> {
  const normalizedSymbol = normalizeSymbol(symbol);
  const remoteQuote = await requestRemoteQuote(normalizedSymbol);
  return saveLocalQuote(normalizedSymbol, remoteQuote);
}

export async function refreshQuotes(symbols: string[]): Promise<RefreshQuotesResult> {
  const uniqueSymbols = Array.from(new Set(symbols.map(normalizeSymbol).filter(Boolean)));
  const settled = await Promise.allSettled(uniqueSymbols.map((symbol) => refreshQuote(symbol)));

  const quotes: Record<string, Quote> = {};
  const failed: string[] = [];

  settled.forEach((result, index) => {
    const symbol = uniqueSymbols[index];
    if (!symbol) return;

    if (result.status === "fulfilled") {
      quotes[symbol] = result.value;
      return;
    }

    failed.push(symbol);
  });

  return { quotes, failed };
}

export async function fetchQuotes(): Promise<Record<string, Quote>> {
  const symbols = Object.values(TICKERS);
  const out: Record<string, Quote> = {};
  symbols.forEach((symbol) => {
    out[symbol] = loadLocalQuote(symbol);
  });
  return out;
}

export const TAPE_SYMBOLS = [
  "SPY", "QQQ", "IWM", "TLT", "HYG", "XLF",
  "ARCC", "AGNC",
  "BX", "KKR", "ARES", "FSK", "MAIN", "ORCC",
  "NLY", "RITM", "TWO",
];

export async function fetchTape(): Promise<TapeItem[]> {
  return TAPE_SYMBOLS
    .map((symbol) => loadLocalQuote(symbol))
    .filter((quote) => quote.price != null)
    .map((quote) => ({
      symbol: quote.symbol,
      price: quote.price as number,
      change: quote.change ?? 0,
      changePct: quote.changePct ?? 0,
    }));
}
