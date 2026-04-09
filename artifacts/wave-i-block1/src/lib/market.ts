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
  afterHoursPrice: number | null;
  timestamp: number;
}

const PROXY = "https://corsproxy.io/?url=";
function url(symbol: string) {
  return `${PROXY}${encodeURIComponent(`https://query1.finance.yahoo.com/v8/finance/chart/${symbol}?interval=1d&range=1d&includePrePost=true`)}`;
}

export async function fetchQuote(symbol: string): Promise<Quote> {
  const res = await fetch(url(symbol), { signal: AbortSignal.timeout(8000) });
  const json = await res.json();
  const meta = json?.chart?.result?.[0]?.meta ?? {};
  const price = meta.regularMarketPrice ?? null;
  const previousClose = meta.chartPreviousClose ?? meta.previousClose ?? null;
  const change = price != null && previousClose != null ? price - previousClose : null;
  const changePct = change != null && previousClose ? (change / previousClose) * 100 : null;
  return {
    symbol,
    price,
    previousClose,
    change,
    changePct,
    open: meta.regularMarketOpen ?? null,
    dayHigh: meta.regularMarketDayHigh ?? null,
    dayLow: meta.regularMarketDayLow ?? null,
    fiftyTwoWeekHigh: null,
    fiftyTwoWeekLow: null,
    volume: meta.regularMarketVolume ?? null,
    afterHoursPrice: meta.postMarketPrice ?? meta.preMarketPrice ?? null,
    timestamp: Date.now()
  };
}

export const TAPE_SYMBOLS = ["SPY","QQQ","IWM","TLT","HYG","XLF","ARCC","AGNC","BX","KKR","ARES","FSK","MAIN","ORCC","NLY","RITM","TWO"];
