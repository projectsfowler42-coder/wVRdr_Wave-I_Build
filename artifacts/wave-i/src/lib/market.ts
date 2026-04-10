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

type StoredQuoteMap = Record<string, Partial<Quote>>;

const STORAGE_KEY = "wavei_market_snapshots_v1";
const CURATED_SNAPSHOTS: StoredQuoteMap = {};

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

function normalizeQuote(symbol: string, partial?: Partial<Quote> | null): Quote {
  const base = emptyQuote(symbol);
  if (!partial) return base;
  return {
    ...base,
    ...partial,
    symbol,
    timestamp: typeof partial.timestamp === "number" ? partial.timestamp : 0,
    isAfterHours: Boolean(partial.isAfterHours && partial.afterHoursPrice != null),
  };
}

export function loadLocalQuote(symbol: string): Quote {
  const stored = readStoredSnapshots()[symbol];
  const curated = CURATED_SNAPSHOTS[symbol];
  return normalizeQuote(symbol, stored ?? curated ?? null);
}

export function saveLocalQuote(symbol: string, partial: Partial<Quote>): Quote {
  const current = readStoredSnapshots();
  const next = normalizeQuote(symbol, {
    ...current[symbol],
    ...partial,
    symbol,
    timestamp: Date.now(),
  });
  current[symbol] = next;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(current));
  return next;
}

export async function fetchQuote(symbol: string): Promise<Quote> {
  return loadLocalQuote(symbol);
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
