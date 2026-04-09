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

const CORS_PROXY = "https://corsproxy.io/?url=";

function yahooUrl(symbol: string): string {
  return `${CORS_PROXY}${encodeURIComponent(
    `https://query1.finance.yahoo.com/v8/finance/chart/${symbol}?interval=1d&range=1d&includePrePost=true`
  )}`;
}

function yahooQuoteV7Url(symbol: string): string {
  return `${CORS_PROXY}${encodeURIComponent(
    `https://query1.finance.yahoo.com/v7/finance/quote?symbols=${symbol}&fields=regularMarketPrice,regularMarketChange,regularMarketChangePercent,regularMarketPreviousClose,regularMarketOpen,regularMarketDayHigh,regularMarketDayLow,regularMarketVolume,averageDailyVolume3Month,marketCap,fiftyTwoWeekHigh,fiftyTwoWeekLow,postMarketPrice,postMarketChange,postMarketChangePercent,preMarketPrice,preMarketChange,preMarketChangePercent`
  )}`;
}

export async function fetchQuote(symbol: string): Promise<Quote> {
  const [chartRes, summaryRes] = await Promise.allSettled([
    fetch(yahooUrl(symbol), { signal: AbortSignal.timeout(8000) }),
    fetch(yahooQuoteV7Url(symbol), { signal: AbortSignal.timeout(8000) }),
  ]);

  let price: number | null = null;
  let previousClose: number | null = null;
  let change: number | null = null;
  let changePct: number | null = null;
  let open: number | null = null;
  let dayHigh: number | null = null;
  let dayLow: number | null = null;
  let volume: number | null = null;
  let afterHoursPrice: number | null = null;
  let afterHoursChange: number | null = null;
  let afterHoursChangePct: number | null = null;
  let isAfterHours = false;

  let fiftyTwoWeekHigh: number | null = null;
  let fiftyTwoWeekLow: number | null = null;
  let avgVolume: number | null = null;
  let marketCap: number | null = null;

  if (chartRes.status === "fulfilled" && chartRes.value.ok) {
    try {
      const data = await chartRes.value.json();
      const result = data?.chart?.result?.[0];
      const meta = result?.meta;
      if (meta) {
        price = meta.regularMarketPrice ?? null;
        previousClose = meta.chartPreviousClose ?? meta.previousClose ?? null;
        open = meta.regularMarketOpen ?? null;
        dayHigh = meta.regularMarketDayHigh ?? null;
        dayLow = meta.regularMarketDayLow ?? null;
        volume = meta.regularMarketVolume ?? null;

        if (price != null && previousClose != null) {
          change = price - previousClose;
          changePct = (change / previousClose) * 100;
        }

        const prePost = meta.postMarketPrice ?? meta.preMarketPrice ?? null;
        if (prePost != null && price != null) {
          afterHoursPrice = prePost;
          afterHoursChange = prePost - price;
          afterHoursChangePct = (afterHoursChange / price) * 100;
          isAfterHours = true;
        }
      }
    } catch {
    }
  }

  if (summaryRes.status === "fulfilled" && summaryRes.value.ok) {
    try {
      const data = await summaryRes.value.json();
      const q = data?.quoteResponse?.result?.[0] ?? data?.quoteSummary?.result?.[0]?.price;

      if (q) {
        if (price == null) price = q.regularMarketPrice ?? null;
        if (previousClose == null) previousClose = q.regularMarketPreviousClose ?? null;
        if (change == null) change = q.regularMarketChange ?? null;
        if (changePct == null) {
          const raw = q.regularMarketChangePercent ?? null;
          changePct = raw != null ? raw * 100 : null;
        }
        if (open == null) open = q.regularMarketOpen ?? null;
        if (dayHigh == null) dayHigh = q.regularMarketDayHigh ?? null;
        if (dayLow == null) dayLow = q.regularMarketDayLow ?? null;
        if (volume == null) volume = q.regularMarketVolume ?? null;
        if (avgVolume == null) avgVolume = q.averageDailyVolume3Month ?? null;
        if (marketCap == null) marketCap = q.marketCap ?? null;
        if (fiftyTwoWeekHigh == null) fiftyTwoWeekHigh = q.fiftyTwoWeekHigh ?? null;
        if (fiftyTwoWeekLow == null) fiftyTwoWeekLow = q.fiftyTwoWeekLow ?? null;

        const postP = q.postMarketPrice ?? q.preMarketPrice ?? null;
        const postC = q.postMarketChange ?? q.preMarketChange ?? null;
        const postPct = q.postMarketChangePercent ?? q.preMarketChangePercent ?? null;
        if (postP != null && !isAfterHours) {
          afterHoursPrice = postP;
          afterHoursChange = postC ?? (price != null ? postP - price : null);
          afterHoursChangePct = postPct != null ? postPct * 100 : (afterHoursChange != null && price != null && price !== 0 ? (afterHoursChange / price) * 100 : null);
          isAfterHours = true;
        }
      }
    } catch {
    }
  }

  return {
    symbol,
    price,
    previousClose,
    change,
    changePct,
    open,
    dayHigh,
    dayLow,
    fiftyTwoWeekHigh,
    fiftyTwoWeekLow,
    volume,
    avgVolume,
    marketCap,
    afterHoursPrice,
    afterHoursChange,
    afterHoursChangePct,
    isAfterHours,
    timestamp: Date.now(),
  };
}

export async function fetchQuotes(): Promise<Record<string, Quote>> {
  const symbols = Object.values(TICKERS);
  const results = await Promise.allSettled(symbols.map((s) => fetchQuote(s)));
  const out: Record<string, Quote> = {};
  results.forEach((r, i) => {
    if (r.status === "fulfilled") {
      out[symbols[i]] = r.value;
    }
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
  const results = await Promise.allSettled(
    TAPE_SYMBOLS.map(async (sym) => {
      const res = await fetch(yahooUrl(sym), { signal: AbortSignal.timeout(6000) });
      if (!res.ok) throw new Error("bad");
      const data = await res.json();
      const meta = data?.chart?.result?.[0]?.meta;
      if (!meta) throw new Error("no meta");
      const p = meta.regularMarketPrice;
      const prev = meta.chartPreviousClose ?? meta.previousClose;
      if (!p || !prev) throw new Error("no price");
      const chg = p - prev;
      const chgPct = (chg / prev) * 100;
      return { symbol: sym, price: p, change: chg, changePct: chgPct } as TapeItem;
    })
  );
  return results
    .filter((r) => r.status === "fulfilled")
    .map((r) => (r as PromiseFulfilledResult<TapeItem>).value);
}
