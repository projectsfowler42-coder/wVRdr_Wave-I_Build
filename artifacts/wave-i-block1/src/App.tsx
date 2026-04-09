import React, { useEffect, useMemo, useState } from "react";
import { ALL_INSTRUMENTS, BLUE_INSTRUMENTS, GREEN_INSTRUMENTS, type BucketClass, getInstrument } from "./lib/instruments";
import { loadHoldings, saveHoldings, createHolding, withQuote, type HoldingRecord } from "./lib/portfolio";
import { loadWallets, saveWallets, type WalletClass, type WalletRecord } from "./lib/wallets";
import { fetchQuote, TAPE_SYMBOLS, type Quote } from "./lib/market";
import { getInstrumentLinks } from "./lib/links";
import { averageCostAfterAdd, costFromShares, dripProjection, incomeFromShares, sharesFromCash, sharesNeededForIncome, walletDeploymentGap } from "./lib/calculators";

function fmt(n: number | null | undefined, d = 2) { return n == null || Number.isNaN(n) ? "—" : n.toLocaleString(undefined, { minimumFractionDigits: d, maximumFractionDigits: d }); }
function usd(n: number | null | undefined) { return n == null || Number.isNaN(n) ? "—" : `$${fmt(n, 2)}`; }
function pct(n: number | null | undefined) { return n == null || Number.isNaN(n) ? "—" : `${n > 0 ? "+" : ""}${fmt(n, 2)}%`; }
function cls(n: number | null | undefined) { return n == null ? "dim" : n > 0 ? "up" : n < 0 ? "down" : "dim"; }

function MarketTape({ quotes }: { quotes: Record<string, Quote> }) {
  return <div className="card"><div className="section-title">Market Tape</div><div className="market-tape">{TAPE_SYMBOLS.map((s) => { const q = quotes[s]; return <div key={s}><strong>{s}</strong> <span className="mono">{fmt(q?.price)}</span> <span className={cls(q?.changePct)}>{pct(q?.changePct)}</span></div>; })}</div></div>;
}

function QuoteBoard({ quotes, holdings, selected, onSelect }: { quotes: Record<string, Quote>; holdings: HoldingRecord[]; selected: string | null; onSelect: (ticker: string) => void; }) {
  const [bucket, setBucket] = useState<"ALL" | BucketClass>("ALL");
  const [heldOnly, setHeldOnly] = useState(false);
  const held = useMemo(() => new Set(holdings.map((h) => h.ticker)), [holdings]);
  const filtered = ALL_INSTRUMENTS.filter((i) => (bucket === "ALL" || i.bucket_class === bucket) && (!heldOnly || held.has(i.ticker)));
  return (
    <div className="card">
      <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap", marginBottom: 12 }}>
        <div className="section-title" style={{ margin: 0 }}>Quote Board</div>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <select value={bucket} onChange={(e) => setBucket(e.target.value as any)}><option value="ALL">All</option><option value="[B]">[B]</option><option value="[G]">[G]</option></select>
          <label className="subtle"><input type="checkbox" checked={heldOnly} onChange={(e) => setHeldOnly(e.target.checked)} /> held only</label>
        </div>
      </div>
      <div className="quote-list">{filtered.map((i) => { const q = quotes[i.ticker]; return <button key={i.ticker} className="quote-card" style={{ textAlign: "left", cursor: "pointer", borderColor: selected === i.ticker ? "#3b82f6" : undefined }} onClick={() => onSelect(i.ticker)}><div className="quote-header"><div><div><strong>{i.ticker}</strong> <span className={`pill ${i.bucket_class === "[B]" ? "blue" : "green"}`}>{i.bucket_class}</span></div><div className="subtle">{i.name}</div></div><div className="mono">{fmt(q?.price)}</div></div><div className="kv"><div><strong>Change</strong><div className={cls(q?.change)}>{usd(q?.change)}</div></div><div><strong>Change %</strong><div className={cls(q?.changePct)}>{pct(q?.changePct)}</div></div><div><strong>Volume</strong><div className="mono">{fmt(q?.volume,0)}</div></div><div><strong>After hrs</strong><div className="mono">{fmt(q?.afterHoursPrice)}</div></div></div></button>; })}</div>
    </div>
  );
}

function InstrumentDetail({ ticker, quote }: { ticker: string | null; quote?: Quote }) {
  if (!ticker) return <div className="card"><div className="section-title">Instrument Detail</div><div className="notice">Select an instrument from the quote board.</div></div>;
  const instrument = getInstrument(ticker);
  const grouped = getInstrumentLinks(ticker).reduce<Record<string, ReturnType<typeof getInstrumentLinks>>>((acc, link) => { (acc[link.link_class] ||= []).push(link); return acc; }, {} as any);
  return (
    <div className="card">
      <div className="section-title">Instrument Detail</div>
      <div className="quote-header"><div><h3 style={{ margin: 0 }}>{ticker}</h3><div className="subtle">{instrument?.name}</div></div><div className="mono" style={{ fontSize: 24 }}>{fmt(quote?.price)}</div></div>
      <div className="kv">
        <div><strong>Open</strong><div className="mono">{fmt(quote?.open)}</div></div>
        <div><strong>Prev Close</strong><div className="mono">{fmt(quote?.previousClose)}</div></div>
        <div><strong>Day Range</strong><div className="mono">{fmt(quote?.dayLow)} – {fmt(quote?.dayHigh)}</div></div>
        <div><strong>52W Range</strong><div className="mono">{fmt(quote?.fiftyTwoWeekLow)} – {fmt(quote?.fiftyTwoWeekHigh)}</div></div>
      </div>
      <div style={{ marginTop: 14 }}>
        <div className="section-title">Research Links</div>
        {Object.entries(grouped).map(([key, links]) => <div key={key} style={{ marginBottom: 10 }}><div className="subtle" style={{ marginBottom: 6 }}>{key}</div><div className="links-grid">{links.map((link) => <a key={`${key}-${link.source_name}-${link.priority}`} className="link-chip" href={link.url} target="_blank" rel="noreferrer">{link.source_name} <span className="subtle">({link.health_state})</span></a>)}</div></div>)}
      </div>
    </div>
  );
}

function AddHoldingForm({ onAdd }: { onAdd: (h: HoldingRecord) => void }) {
  const [bucket, setBucket] = useState<BucketClass>("[B]");
  const [wallet, setWallet] = useState<WalletClass | "">("");
  const [ticker, setTicker] = useState(BLUE_INSTRUMENTS[0].ticker);
  const [shares, setShares] = useState("");
  const [entryDate, setEntryDate] = useState("");
  const [entryPrice, setEntryPrice] = useState("");
  const [dividends, setDividends] = useState("");
  const [dipDate, setDipDate] = useState("");
  const [drip, setDrip] = useState("");
  const [income, setIncome] = useState("");
  const [notes, setNotes] = useState("");
  const list = bucket === "[B]" ? BLUE_INSTRUMENTS : GREEN_INSTRUMENTS;
  useEffect(() => { setTicker(list[0].ticker); }, [bucket]);
  const submit = () => {
    const instrument = getInstrument(ticker);
    const h = createHolding({
      ticker,
      instrument_name: instrument?.name || ticker,
      bucket_class: bucket,
      wallet_class: wallet || null,
      shares: Number(shares) || 0,
      entry_date: entryDate,
      entry_price: Number(entryPrice) || 0,
      dividends_collected: Number(dividends) || 0,
      latest_dip_date: dipDate,
      drip_amount: Number(drip) || 0,
      expected_income: Number(income) || 0,
      notes
    });
    onAdd(h);
    setShares(""); setEntryDate(""); setEntryPrice(""); setDividends(""); setDipDate(""); setDrip(""); setIncome(""); setNotes("");
  };
  return <div className="card"><div className="section-title">Add Holding</div><div className="grid-3"><div className="field"><label>Bucket</label><select value={bucket} onChange={(e) => setBucket(e.target.value as BucketClass)}><option value="[B]">[B]</option><option value="[G]">[G]</option></select></div><div className="field"><label>Wallet</label><select value={wallet} onChange={(e) => setWallet(e.target.value as any)}><option value="">Unassigned</option><option value="|W|">|W|</option><option value="|M|">|M|</option></select></div><div className="field"><label>Instrument</label><select value={ticker} onChange={(e) => setTicker(e.target.value)}>{list.map((i) => <option key={i.ticker} value={i.ticker}>{i.ticker} — {i.name}</option>)}</select></div><div className="field"><label>Shares</label><input value={shares} onChange={(e) => setShares(e.target.value)} type="number" step="any" /></div><div className="field"><label>Entry date</label><input value={entryDate} onChange={(e) => setEntryDate(e.target.value)} type="date" /></div><div className="field"><label>Entry price</label><input value={entryPrice} onChange={(e) => setEntryPrice(e.target.value)} type="number" step="0.01" /></div><div className="field"><label>Dividends collected</label><input value={dividends} onChange={(e) => setDividends(e.target.value)} type="number" step="0.01" /></div><div className="field"><label>Latest dip date</label><input value={dipDate} onChange={(e) => setDipDate(e.target.value)} type="date" /></div><div className="field"><label>DRiP amount</label><input value={drip} onChange={(e) => setDrip(e.target.value)} type="number" step="0.01" /></div><div className="field"><label>Expected income</label><input value={income} onChange={(e) => setIncome(e.target.value)} type="number" step="0.01" /></div><div className="field" style={{ gridColumn: "1 / -1" }}><label>Notes</label><textarea value={notes} onChange={(e) => setNotes(e.target.value)} /></div></div><div style={{ marginTop: 12 }}><button className="action-btn" onClick={submit}>Add holding</button></div></div>;
}

function PortfolioTable({ holdings, setHoldings }: { holdings: HoldingRecord[]; setHoldings: (h: HoldingRecord[]) => void }) {
  const remove = (id: string) => setHoldings(holdings.filter((h) => h.holding_id !== id));
  const edit = (holding: HoldingRecord) => {
    const shares = window.prompt("Shares", String(holding.shares));
    if (shares == null) return;
    const entry = window.prompt("Entry price", String(holding.entry_price));
    if (entry == null) return;
    const notes = window.prompt("Notes", holding.notes) ?? holding.notes;
    setHoldings(holdings.map((h) => h.holding_id === holding.holding_id ? { ...h, shares: Number(shares) || h.shares, entry_price: Number(entry) || h.entry_price, cost_basis: (Number(shares) || h.shares) * (Number(entry) || h.entry_price), notes, updated_at: new Date().toISOString() } : h));
  };
  return <div className="card"><div className="section-title">Portfolio Truth</div><div className="table-wrap"><table><thead><tr><th>Bucket</th><th>Wallet</th><th>Ticker</th><th>Shares</th><th>Entry</th><th>Current</th><th>Value</th><th>Cost Basis</th><th>Unreal. P&L</th><th>Dividends</th><th>Dip Date</th><th>DRiP</th><th>Expected</th><th>Notes</th><th></th></tr></thead><tbody>{holdings.map((h) => <tr key={h.holding_id}><td><span className={`pill ${h.bucket_class === "[B]" ? "blue" : "green"}`}>{h.bucket_class}</span></td><td>{h.wallet_class ? <span className="pill wallet">{h.wallet_class}</span> : <span className="dim">—</span>}</td><td><strong>{h.ticker}</strong><div className="subtle">{h.instrument_name}</div></td><td className="mono">{fmt(h.shares, 4)}</td><td className="mono">{usd(h.entry_price)}</td><td className="mono">{usd(h.current_price)}</td><td className="mono">{usd(h.current_value)}</td><td className="mono">{usd(h.cost_basis)}</td><td className={`mono ${cls(h.unrealized_pnl)}`}>{usd(h.unrealized_pnl)}<div>{pct(h.unrealized_pnl_pct)}</div></td><td className="mono">{usd(h.dividends_collected)}</td><td>{h.latest_dip_date || "—"}</td><td className="mono">{usd(h.drip_amount)}</td><td className="mono">{usd(h.expected_income)}</td><td>{h.notes || "—"}</td><td><div className="row-actions"><button className="action-btn secondary" onClick={() => edit(h)}>Edit</button><button className="action-btn secondary" onClick={() => remove(h.holding_id)}>Delete</button></div></td></tr>)}</tbody></table></div></div>;
}

function WalletSummary({ wallets, setWallets }: { wallets: Record<WalletClass, WalletRecord>; setWallets: (w: Record<WalletClass, WalletRecord>) => void }) {
  const update = (walletKey: WalletClass, field: string, value: number | string) => {
    const next = { ...wallets, [walletKey]: { ...wallets[walletKey], [field]: value, updated_at: new Date().toISOString() } as WalletRecord };
    setWallets(next);
  };
  return <div className="grid-2">{(["|W|","|M|"] as WalletClass[]).map((k) => <div key={k} className="card"><div className="section-title">Wallet {k}</div>{k === "|W|" ? <div className="grid-2"><div className="field"><label>Cap</label><input value={(wallets[k] as any).cap} onChange={(e) => update(k, "cap", Number(e.target.value) || 0)} type="number" step="0.01" /></div><div className="field"><label>Current balance</label><input value={wallets[k].current_balance} onChange={(e) => update(k, "current_balance", Number(e.target.value) || 0)} type="number" step="0.01" /></div><div className="field"><label>Reserved amount</label><input value={(wallets[k] as any).reserved_amount} onChange={(e) => update(k, "reserved_amount", Number(e.target.value) || 0)} type="number" step="0.01" /></div><div className="field"><label>Deployable amount</label><input value={wallets[k].deployable_amount} onChange={(e) => update(k, "deployable_amount", Number(e.target.value) || 0)} type="number" step="0.01" /></div><div className="field" style={{ gridColumn: "1 / -1" }}><label>Funding notes</label><textarea value={(wallets[k] as any).funding_source_notes} onChange={(e) => update(k, "funding_source_notes", e.target.value)} /></div></div> : <div className="grid-2"><div className="field"><label>Current balance</label><input value={wallets[k].current_balance} onChange={(e) => update(k, "current_balance", Number(e.target.value) || 0)} type="number" step="0.01" /></div><div className="field"><label>Dividend inflows</label><input value={(wallets[k] as any).dividend_inflows} onChange={(e) => update(k, "dividend_inflows", Number(e.target.value) || 0)} type="number" step="0.01" /></div><div className="field"><label>DRiP inflows</label><input value={(wallets[k] as any).drip_inflows} onChange={(e) => update(k, "drip_inflows", Number(e.target.value) || 0)} type="number" step="0.01" /></div><div className="field"><label>Drawdown capture</label><input value={(wallets[k] as any).drawdown_capture_inflows} onChange={(e) => update(k, "drawdown_capture_inflows", Number(e.target.value) || 0)} type="number" step="0.01" /></div><div className="field"><label>Deployable amount</label><input value={wallets[k].deployable_amount} onChange={(e) => update(k, "deployable_amount", Number(e.target.value) || 0)} type="number" step="0.01" /></div><div className="field"><label>Pending inflows</label><input value={(wallets[k] as any).pending_inflows} onChange={(e) => update(k, "pending_inflows", Number(e.target.value) || 0)} type="number" step="0.01" /></div></div>}<div className="subtle" style={{ marginTop: 8 }}>Updated: {wallets[k].updated_at}</div></div>)}</div>;
}

function CalculatorsPanel() {
  const [cash, setCash] = useState(""); const [price, setPrice] = useState("");
  const [shares, setShares] = useState(""); const [dividend, setDividend] = useState(""); const [periods, setPeriods] = useState("12");
  const [targetIncome, setTargetIncome] = useState(""); const [deployable, setDeployable] = useState(""); const [targetDeploy, setTargetDeploy] = useState("");
  const [currShares, setCurrShares] = useState(""); const [currCost, setCurrCost] = useState(""); const [addShares, setAddShares] = useState(""); const [addPrice, setAddPrice] = useState("");
  const sharesCalc = sharesFromCash(Number(cash) || 0, Number(price) || 0);
  const income = incomeFromShares(Number(shares) || 0, Number(dividend) || 0, Number(periods) || 0);
  const sharesNeed = sharesNeededForIncome(Number(targetIncome) || 0, Number(dividend) || 0, Number(periods) || 0);
  const gap = walletDeploymentGap(Number(deployable) || 0, Number(targetDeploy) || 0);
  const avg = averageCostAfterAdd(Number(currShares) || 0, Number(currCost) || 0, Number(addShares) || 0, Number(addPrice) || 0);
  const drip = dripProjection(Number(shares) || 0, Number(dividend) || 0, 6);
  return <div className="card"><div className="section-title">Deterministic Calculators</div><div className="calc-grid"><div className="quote-card"><strong>Shares from cash</strong><div className="field"><label>Cash</label><input value={cash} onChange={(e) => setCash(e.target.value)} type="number" /></div><div className="field"><label>Price</label><input value={price} onChange={(e) => setPrice(e.target.value)} type="number" /></div><div className="subtle">Shares: <span className="mono">{fmt(sharesCalc, 4)}</span></div><div className="subtle">Cost from shares: <span className="mono">{usd(costFromShares(sharesCalc, Number(price) || 0))}</span></div></div><div className="quote-card"><strong>Income from shares</strong><div className="field"><label>Shares</label><input value={shares} onChange={(e) => setShares(e.target.value)} type="number" /></div><div className="field"><label>Dividend per share</label><input value={dividend} onChange={(e) => setDividend(e.target.value)} type="number" step="0.0001" /></div><div className="field"><label>Periods per year</label><input value={periods} onChange={(e) => setPeriods(e.target.value)} type="number" /></div><div className="subtle">Annual: <span className="mono">{usd(income.annual)}</span></div><div className="subtle">Monthly: <span className="mono">{usd(income.monthly)}</span></div><div className="subtle">Shares needed for target income: <span className="mono">{fmt(sharesNeed, 4)}</span></div></div><div className="quote-card"><strong>DRiP and average cost</strong><div className="field"><label>Current shares</label><input value={currShares} onChange={(e) => setCurrShares(e.target.value)} type="number" /></div><div className="field"><label>Current cost basis</label><input value={currCost} onChange={(e) => setCurrCost(e.target.value)} type="number" /></div><div className="field"><label>Add shares</label><input value={addShares} onChange={(e) => setAddShares(e.target.value)} type="number" /></div><div className="field"><label>Add price</label><input value={addPrice} onChange={(e) => setAddPrice(e.target.value)} type="number" /></div><div className="subtle">New average: <span className="mono">{usd(avg.averagePrice)}</span></div><div className="subtle">Six-period DRiP shares: <span className="mono">{fmt(drip.finalShares, 4)}</span></div></div><div className="quote-card"><strong>Wallet deployment gap</strong><div className="field"><label>Deployable amount</label><input value={deployable} onChange={(e) => setDeployable(e.target.value)} type="number" /></div><div className="field"><label>Target deploy</label><input value={targetDeploy} onChange={(e) => setTargetDeploy(e.target.value)} type="number" /></div><div className="field"><label>Target annual income</label><input value={targetIncome} onChange={(e) => setTargetIncome(e.target.value)} type="number" /></div><div className="subtle">{gap.surplus ? "Surplus" : "Shortfall"}: <span className="mono">{usd(gap.gap)}</span></div></div></div></div>;
}

export default function App() {
  const [tab, setTab] = useState<"warroom" | "portfolio">("warroom");
  const [holdings, setHoldings] = useState<HoldingRecord[]>(() => loadHoldings());
  const [wallets, setWallets] = useState<Record<WalletClass, WalletRecord>>(() => loadWallets());
  const [quotes, setQuotes] = useState<Record<string, Quote>>({});
  const [tape, setTape] = useState<Record<string, Quote>>({});
  const [selectedTicker, setSelectedTicker] = useState<string | null>("ARCC");
  const [loading, setLoading] = useState(false);

  useEffect(() => { saveHoldings(holdings); }, [holdings]);
  useEffect(() => { saveWallets(wallets); }, [wallets]);

  const refreshQuotes = async () => {
    setLoading(true);
    try {
      const all = await Promise.all(ALL_INSTRUMENTS.map(async (i) => [i.ticker, await fetchQuote(i.ticker)] as const));
      setQuotes(Object.fromEntries(all));
      setHoldings((prev) => prev.map((h) => withQuote(h, Object.fromEntries(all)[h.ticker]?.price ?? null)));
      const tapeResults = await Promise.all(TAPE_SYMBOLS.map(async (s) => [s, await fetchQuote(s)] as const));
      setTape(Object.fromEntries(tapeResults));
    } finally { setLoading(false); }
  };

  useEffect(() => { refreshQuotes(); }, []);

  return (
    <div className="app-shell">
      <div className="topbar">
        <div>
          <h1>Wave‑I Block‑1 Candidate</h1>
          <small>truth-first · separate buckets and wallets · no engine overlays</small>
        </div>
        <div className="topbar-actions">
          <button className={`tab-btn ${tab === "warroom" ? "active" : ""}`} onClick={() => setTab("warroom")}>War Room</button>
          <button className={`tab-btn ${tab === "portfolio" ? "active" : ""}`} onClick={() => setTab("portfolio")}>Portfolio</button>
          <button className="action-btn" onClick={refreshQuotes}>{loading ? "Refreshing…" : "Refresh live truth"}</button>
        </div>
      </div>
      <div className="page">
        <MarketTape quotes={tape} />
        {tab === "warroom" ? <div style={{ display: "grid", gap: 16, marginTop: 16 }}><div className="grid-2"><QuoteBoard quotes={quotes} holdings={holdings} selected={selectedTicker} onSelect={setSelectedTicker} /><InstrumentDetail ticker={selectedTicker} quote={selectedTicker ? quotes[selectedTicker] : undefined} /></div><CalculatorsPanel /></div> : <div style={{ display: "grid", gap: 16, marginTop: 16 }}><AddHoldingForm onAdd={(h) => setHoldings((prev) => [...prev, h])} /><PortfolioTable holdings={holdings} setHoldings={setHoldings} /><WalletSummary wallets={wallets} setWallets={setWallets} /></div>}
      </div>
    </div>
  );
}
