import { useEffect, useMemo, useState } from 'react';
import { getTruthColor, mapSourceToTruth, TruthClass } from './lib/truth';
import { getSetting, loadScrapes, saveScrape, setSetting, sydneyStamp, utcStamp, type ScrapeRecord } from './lib/wal';

type Page = 'main' | 'ibkr' | 'instrument' | 'funding' | 'reserves' | 'proof' | 'actions';
type Bucket = 'BLUE' | 'GREEN';
type CheckState = 'OK' | 'NO' | 'UNKNOWN';
type StatusCode = 'IDLE' | 'RUNNING' | 'SUCCESS' | 'NO CONNECTOR' | 'NO RECORD' | 'FAILED' | 'ACTIVE';

type Instrument = {
  ticker: string;
  name: string;
  bucket: Bucket;
};

type Quote = {
  ticker: string;
  name?: string;
  price?: number;
  previousClose?: number;
  change?: number;
  changePct?: number;
  extendedPrice?: number | null;
  extendedChangePct?: number | null;
  marketState?: string;
  trailingYieldPct?: number | null;
  fiftyTwoWeekHigh?: number;
  fiftyTwoWeekLow?: number;
  volume?: number;
  currency?: string;
  source?: string;
  staleSecs?: number;
  ts?: number;
};

type ActionStatus = {
  action: string;
  status: StatusCode;
  message: string;
  local: string;
  utc: string;
};

const FETCH_TIMEOUT_MS = 3500;

const BLUE: Instrument[] = [
  { ticker: 'SGOV', name: 'iShares 0-3 Month Treasury Bond ETF', bucket: 'BLUE' },
  { ticker: 'BIL', name: 'SPDR Bloomberg 1-3 Month T-Bill ETF', bucket: 'BLUE' },
  { ticker: 'SHV', name: 'iShares Short Treasury Bond ETF', bucket: 'BLUE' },
  { ticker: 'TFLO', name: 'iShares Treasury Floating Rate Bond ETF', bucket: 'BLUE' },
  { ticker: 'USFR', name: 'WisdomTree Floating Rate Treasury Fund', bucket: 'BLUE' },
  { ticker: 'JAAA', name: 'Janus Henderson AAA CLO ETF', bucket: 'BLUE' },
  { ticker: 'MINT', name: 'PIMCO Enhanced Short Maturity Active ETF', bucket: 'BLUE' },
];

const GREEN: Instrument[] = [
  { ticker: 'BKLN', name: 'Invesco Senior Loan ETF', bucket: 'GREEN' },
  { ticker: 'SRLN', name: 'SPDR Blackstone Senior Loan ETF', bucket: 'GREEN' },
  { ticker: 'HYG', name: 'iShares iBoxx $ High Yield Corporate Bond ETF', bucket: 'GREEN' },
  { ticker: 'SJNK', name: 'SPDR Bloomberg Short Term High Yield Bond ETF', bucket: 'GREEN' },
  { ticker: 'JBBB', name: 'Janus Henderson B-BBB CLO ETF', bucket: 'GREEN' },
  { ticker: 'JEPI', name: 'JPMorgan Equity Premium Income ETF', bucket: 'GREEN' },
  { ticker: 'JEPQ', name: 'JPMorgan Nasdaq Equity Premium Income ETF', bucket: 'GREEN' },
  { ticker: 'O', name: 'Realty Income Corporation', bucket: 'GREEN' },
  { ticker: 'VICI', name: 'VICI Properties Inc', bucket: 'GREEN' },
];

const CHECKS = [
  'Login confirmed',
  'Account active',
  'Funding path ready',
  'Cash available visible',
  'Settled cash visible',
  'Buying power visible',
  'Market data / quote feed usable',
  'Order preview tested',
  'Trading permissions confirmed',
  'Extended-hours setting known',
  'No blocking restrictions',
];

const nowStatus = (action: string, status: StatusCode, message: string): ActionStatus => ({
  action,
  status,
  message,
  local: `${sydneyStamp()} Australia/Sydney`,
  utc: utcStamp(),
});

const calcReadiness = (states: CheckState[]) => {
  const known = states.filter((state) => state === 'OK' || state === 'NO').length;
  const ok = states.filter((state) => state === 'OK').length;
  if (known === 0) return { label: '—/11', sub: 'UNVERIFIED', ok, known };
  return { label: ok === states.length ? 'READY' : `${ok}/11`, sub: `KNOWN ${known}/11`, ok, known };
};

const serviceWorkerUrl = () => {
  const base = import.meta.env.BASE_URL || './';
  return `${base.endsWith('/') ? base : `${base}/`}sw.js`;
};

function Tile({ index, title, value, sub, truth, onClick }: { index: number; title: string; value: string; sub: string; truth: TruthClass; onClick: () => void }) {
  const color = getTruthColor(truth);
  return (
    <button className="wi-tile" onClick={onClick} style={{ borderColor: `${color}55` }}>
      <div className="wi-tile-top">
        <span>0{index}</span>
        <i style={{ background: color }} />
      </div>
      <strong>{title}</strong>
      <b>{value}</b>
      <small>{sub}</small>
    </button>
  );
}

function ActionStrip({ action }: { action: ActionStatus }) {
  return (
    <section className="wi-status">
      <div><b>{action.action}</b><span>{action.status}</span></div>
      <p>{action.message}</p>
      <footer><span>LOCAL {action.local}</span><span>UTC {action.utc}</span></footer>
    </section>
  );
}

function Back({ setPage }: { setPage: (page: Page) => void }) {
  return <button className="wi-back" onClick={() => setPage('main')}>BACK</button>;
}

export default function App() {
  const [page, setPage] = useState<Page>('main');
  const [bucket, setBucket] = useState<Bucket>('GREEN');
  const [ticker, setTicker] = useState('BKLN');
  const [quote, setQuote] = useState<Quote | null>(null);
  const [quoteTruth, setQuoteTruth] = useState<TruthClass>(TruthClass.DEGRADED);
  const [apiBaseUrl, setApiBaseUrl] = useState('');
  const [checks, setChecks] = useState<CheckState[]>(() => CHECKS.map(() => 'UNKNOWN'));
  const [wal, setWal] = useState<ScrapeRecord[]>([]);
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');
  const [action, setAction] = useState<ActionStatus>(() => nowStatus('BOOT', 'IDLE', 'Seed state loaded. No live connector attached.'));

  const instruments = bucket === 'BLUE' ? BLUE : GREEN;
  const selected = useMemo(() => [...BLUE, ...GREEN].find((item) => item.ticker === ticker) ?? GREEN[0], [ticker]);
  const readiness = calcReadiness(checks);
  const shares = ticker === 'BKLN' ? '97' : 'VERIFY';
  const priceLabel = quote?.price ? `$${quote.price.toFixed(2)}` : shares === '97' ? '97 SH' : 'VERIFY';

  useEffect(() => {
    document.documentElement.classList.toggle('wi-light', theme === 'light');
    document.documentElement.style.colorScheme = theme;
    void setSetting('theme', theme);
  }, [theme]);

  useEffect(() => {
    void (async () => {
      try {
        setApiBaseUrl(await getSetting('apiBaseUrl', ''));
        setTheme(await getSetting<'dark' | 'light'>('theme', 'dark'));
        setWal(await loadScrapes());
      } catch (error) {
        setAction(nowStatus('BOOT', 'FAILED', error instanceof Error ? error.message : 'Local DB boot read failed.'));
      }
    })();

    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register(serviceWorkerUrl()).catch(() => undefined);
    }
  }, []);

  const persistApiBaseUrl = async (value: string) => {
    setApiBaseUrl(value);
    await setSetting('apiBaseUrl', value.trim());
    setAction(nowStatus('API_BASE_URL', 'SUCCESS', value.trim() ? 'Thin Spine URL saved.' : 'Thin Spine URL cleared.'));
  };

  const refresh = async () => {
    setAction(nowStatus('DATA REFRESH', 'RUNNING', `Refreshing ${ticker}.`));
    if (!apiBaseUrl.trim()) {
      setQuote(null);
      setQuoteTruth(TruthClass.DEGRADED);
      setAction(nowStatus('DATA REFRESH', 'NO CONNECTOR', 'NO VERIFIED LIVE SOURCE ATTACHED. LOCAL DATA REFRESHED. READINESS UNCHANGED.'));
      return;
    }

    const controller = new AbortController();
    const timeoutId = window.setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

    try {
      const url = `${apiBaseUrl.replace(/\/$/, '')}/api/market/quotes?tickers=${encodeURIComponent(ticker)}`;
      const response = await fetch(url, {
        headers: { accept: 'application/json' },
        signal: controller.signal,
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const payload = await response.json() as { quotes?: Quote[] };
      const nextQuote = payload.quotes?.[0];
      if (!nextQuote) throw new Error('No quote returned.');
      setQuote(nextQuote);
      setQuoteTruth(mapSourceToTruth(nextQuote.source));
      setAction(nowStatus('DATA REFRESH', 'SUCCESS', `${nextQuote.ticker} quote updated from ${nextQuote.source ?? 'source'}.`));
    } catch (error) {
      setQuoteTruth(TruthClass.FAILED);
      const message = error instanceof DOMException && error.name === 'AbortError'
        ? `Thin Spine timed out after ${FETCH_TIMEOUT_MS / 1000}s.`
        : error instanceof Error ? error.message : 'Refresh failed.';
      setAction(nowStatus('DATA REFRESH', 'FAILED', message));
    } finally {
      window.clearTimeout(timeoutId);
    }
  };

  const scrape = async () => {
    try {
      const payload = { bucket, ticker, selected, quote, quoteTruth, funding: 30000, reserves: { etrade: 20000, marcus: 10000 }, checks, action };
      await saveScrape(payload);
      setWal(await loadScrapes());
      setAction(nowStatus('DATA SCRAPE', 'SUCCESS', 'Snapshot saved to IndexedDB WAL.'));
    } catch (error) {
      setAction(nowStatus('DATA SCRAPE', 'FAILED', error instanceof Error ? error.message : 'IndexedDB WAL write failed.'));
    }
  };

  const reset = () => {
    setBucket('GREEN');
    setTicker('BKLN');
    setQuote(null);
    setQuoteTruth(TruthClass.DEGRADED);
    setChecks(CHECKS.map(() => 'UNKNOWN'));
    setAction(nowStatus('RESET SEED', 'SUCCESS', 'Built-in 4/28 seed state restored.'));
  };

  const exportWal = (kind: 'json' | 'csv') => {
    if (!wal.length) {
      setAction(nowStatus('EXPORT', 'NO RECORD', 'No WAL records available to export.'));
      return;
    }
    const text = kind === 'json'
      ? JSON.stringify(wal, null, 2)
      : ['id,localTs,utcTs,action', ...wal.map((r) => `${r.id ?? ''},"${r.localTs}","${r.utcTs}","${r.action ?? ''}"`)].join('\n');
    const blob = new Blob([text], { type: kind === 'json' ? 'application/json' : 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `wave-i-wal.${kind}`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
    setAction(nowStatus('EXPORT', 'SUCCESS', `${kind.toUpperCase()} export generated.`));
  };

  const setCheck = (index: number, state: CheckState) => {
    const next = [...checks];
    next[index] = state;
    setChecks(next);
    setAction(nowStatus('VERIFY', 'ACTIVE', `${CHECKS[index]} set to ${state}.`));
  };

  if (page !== 'main') {
    return (
      <main className="wi-app">
        <div className="wi-detail">
          <header><Back setPage={setPage} /><h1>{page.toUpperCase()}</h1></header>
          <ActionStrip action={action} />

          {page === 'ibkr' && <section className="wi-list">{CHECKS.map((label, index) => <div className="wi-row" key={label}><span>{label}</span><div><button onClick={() => setCheck(index, 'OK')}>OK</button><button onClick={() => setCheck(index, 'NO')}>NO</button><button onClick={() => setCheck(index, 'UNKNOWN')}>UNKNOWN</button></div></div>)}</section>}

          {page === 'instrument' && <section className="wi-list"><div className="wi-row"><span>BUCKET</span><div><button onClick={() => { setBucket('BLUE'); setTicker(BLUE[0].ticker); }}>[B]</button><button onClick={() => { setBucket('GREEN'); setTicker(GREEN[0].ticker); }}>[G]</button></div></div>{instruments.map((inst) => <button className="wi-choice" key={inst.ticker} onClick={() => setTicker(inst.ticker)}>{inst.ticker} — {inst.name}</button>)}<button className="wi-primary" onClick={refresh}>REFRESH SELECTED</button></section>}

          {page === 'funding' && <section className="wi-list"><div className="wi-metric"><b>$30,000</b><span>FIRST-TIER FUNDING / TARGET 2026-04-28 / EXPECTED</span></div><button onClick={scrape}>SCRAPE</button></section>}

          {page === 'reserves' && <section className="wi-list"><div className="wi-metric"><b>$20,000</b><span>E*TRADE 3.75%</span></div><div className="wi-metric"><b>$10,000</b><span>MARCUS 3.65%</span></div><button onClick={scrape}>SCRAPE</button></section>}

          {page === 'proof' && <section className="wi-list"><div className="wi-metric"><b>{wal.length}</b><span>WAL RECORDS</span></div><button onClick={() => exportWal('json')}>EXPORT JSON</button><button onClick={() => exportWal('csv')}>EXPORT CSV</button></section>}

          {page === 'actions' && <section className="wi-list"><button onClick={refresh}>REFRESH</button><button onClick={scrape}>SCRAPE</button><button onClick={() => setPage('ibkr')}>VERIFY</button><button onClick={() => setPage('proof')}>EXPORT</button><button onClick={reset}>RESET</button><label className="wi-input">API_BASE_URL<input value={apiBaseUrl} onChange={(e) => void persistApiBaseUrl(e.target.value)} placeholder="https://..." /></label></section>}
        </div>
      </main>
    );
  }

  return (
    <main className="wi-app">
      <section className="wi-grid">
        <button className="wi-head" onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}><b>wVRdr~</b><span>WAVE-I / S22 COCKPIT</span><small>{theme.toUpperCase()}</small></button>
        <Tile index={2} title="IBKR" value={readiness.label} sub={readiness.sub} truth={TruthClass.DEGRADED} onClick={() => setPage('ibkr')} />
        <Tile index={3} title="INSTR" value={ticker} sub={priceLabel} truth={quoteTruth} onClick={() => setPage('instrument')} />
        <Tile index={4} title="FUNDING" value="$30K" sub="2026-04-28" truth={TruthClass.DEGRADED} onClick={() => setPage('funding')} />
        <Tile index={5} title="RESERVES" value="$30K" sub="E*TRADE + MARCUS" truth={TruthClass.DEGRADED} onClick={() => setPage('reserves')} />
        <Tile index={6} title="PROOF" value={`${wal.length}`} sub="WAL RECORDS" truth={TruthClass.DEGRADED} onClick={() => setPage('proof')} />
        <Tile index={7} title="ACTIONS" value="REFRESH" sub="SCRAPE / RESET" truth={TruthClass.DEGRADED} onClick={() => setPage('actions')} />
      </section>
      <ActionStrip action={action} />
      <nav className="wi-command"><button onClick={refresh}>REFRESH</button><button onClick={scrape}>SCRAPE</button><button onClick={() => setPage('ibkr')}>VERIFY</button><button onClick={() => setPage('proof')}>EXPORT</button><button onClick={reset}>RESET</button></nav>
    </main>
  );
}
