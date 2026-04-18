import { useMemo, useState } from "react";
import { loadLocalQuote, type Quote } from "@/lib/market";
import { type Holding, type ActiveContainerClass, deleteHolding, updateHolding, calcCostBasis, calcCurrentValue, calcUnrealizedGL, calcUnrealizedGLPct, placementFromContainer } from "@/lib/portfolio";
import { deriveHoldingContext } from "@/lib/decision-model";
import { getBucketScopedInstruments } from "@/lib/loadInstruments";
import { ACTIVE_CONTAINERS, containerLabel, containerParentLabel } from "@/lib/containerModel";
import { fmtDollar, fmtPct, signClass } from "@/lib/utils";
import { Pencil, Trash2, Check, X } from "lucide-react";

interface PortfolioTableProps { holdings: Holding[]; onHoldingsChange: (h: Holding[]) => void; }
type ContainerFilter = "ALL" | ActiveContainerClass;
const inputCls = "w-full rounded border border-border bg-background px-2 py-1 text-xs";

function EditRow({ holding, onSave, onCancel }: { holding: Holding; onSave: (patch: Partial<Omit<Holding, 'id'>>) => void; onCancel: () => void }) {
  const [form, setForm] = useState({
    container: holding.container,
    ticker: holding.ticker,
    latestDipDate: holding.latestDipDate,
    nextExDate: holding.nextExDate,
    nextPayDate: holding.nextPayDate,
    reviewDate: holding.reviewDate,
    addBelowPrice: holding.addBelowPrice == null ? "" : String(holding.addBelowPrice),
    trimAbovePrice: holding.trimAbovePrice == null ? "" : String(holding.trimAbovePrice),
    currentAction: holding.currentAction,
    notes: holding.notes,
  });

  function set<K extends keyof typeof form>(key: K, value: string) { setForm((current) => ({ ...current, [key]: value })); }

  function handleSave() {
    const placement = placementFromContainer(form.container as ActiveContainerClass);
    onSave({
      container: form.container as ActiveContainerClass,
      bucket: placement.bucket,
      wallet: placement.wallet,
      ticker: form.ticker,
      latestDipDate: form.latestDipDate,
      nextExDate: form.nextExDate,
      nextPayDate: form.nextPayDate,
      reviewDate: form.reviewDate,
      addBelowPrice: form.addBelowPrice ? parseFloat(form.addBelowPrice) : null,
      trimAbovePrice: form.trimAbovePrice ? parseFloat(form.trimAbovePrice) : null,
      currentAction: form.currentAction,
      notes: form.notes,
    });
  }

  const scoped = getBucketScopedInstruments(form.container as ActiveContainerClass);
  return (
    <tr className="bg-accent/20 border-b border-border/30">
      <td className="px-2 py-2"><select value={form.container} onChange={(event)=>set('container',event.target.value)} className={inputCls}>{ACTIVE_CONTAINERS.map((container)=><option key={container} value={container}>{containerLabel(container)}</option>)}</select></td>
      <td className="px-2 py-2"><select value={form.ticker} onChange={(event)=>set('ticker',event.target.value)} className={inputCls}>{scoped.map((instrument)=><option key={instrument.ticker} value={instrument.ticker}>{instrument.ticker}</option>)}</select></td>
      <td className="px-2 py-2"><input className={inputCls} type="date" value={form.latestDipDate} onChange={(event)=>set('latestDipDate',event.target.value)} /></td>
      <td className="px-2 py-2"><input className={inputCls} type="date" value={form.nextExDate} onChange={(event)=>set('nextExDate',event.target.value)} /></td>
      <td className="px-2 py-2"><input className={inputCls} type="date" value={form.nextPayDate} onChange={(event)=>set('nextPayDate',event.target.value)} /></td>
      <td className="px-2 py-2"><input className={inputCls} type="date" value={form.reviewDate} onChange={(event)=>set('reviewDate',event.target.value)} /></td>
      <td className="px-2 py-2"><input className={inputCls} type="number" value={form.addBelowPrice} onChange={(event)=>set('addBelowPrice',event.target.value)} /></td>
      <td className="px-2 py-2"><input className={inputCls} type="number" value={form.trimAbovePrice} onChange={(event)=>set('trimAbovePrice',event.target.value)} /></td>
      <td className="px-2 py-2"><select className={inputCls} value={form.currentAction} onChange={(event)=>set('currentAction',event.target.value)}><option value="">—</option><option value="DRIP">DRiP</option><option value="HOLD">Hold</option><option value="ADD">Add</option><option value="TRIM">Trim</option><option value="ROTATE">Rotate</option><option value="WAIT">Wait</option><option value="NOTE">Note</option></select></td>
      <td className="px-2 py-2"><input className={inputCls} type="text" value={form.notes} onChange={(event)=>set('notes',event.target.value)} /></td>
      <td className="px-2 py-2"><div className="flex gap-1"><button type="button" onClick={handleSave}><Check size={13}/></button><button type="button" onClick={onCancel}><X size={13}/></button></div></td>
    </tr>
  );
}

export default function PortfolioTable({ holdings, onHoldingsChange }: PortfolioTableProps) {
  const [containerFilter, setContainerFilter] = useState<ContainerFilter>("ALL");
  const [editingId, setEditingId] = useState<string | null>(null);
  const filtered = useMemo(() => holdings.filter((holding) => containerFilter === "ALL" || holding.container === containerFilter), [holdings, containerFilter]);
  const tickers = useMemo(() => [...new Set(filtered.map((holding) => holding.ticker))], [filtered]);
  const quotes = useMemo(() => new Map<string, Quote | undefined>(tickers.map((ticker) => [ticker, loadLocalQuote(ticker)])), [tickers]);
  const totals = useMemo(() => ({ basis: filtered.reduce((acc, holding)=>acc+calcCostBasis(holding),0), divs: filtered.reduce((acc, holding)=>acc+holding.dividendCollected,0), income: filtered.reduce((acc, holding)=>acc+holding.expectedIncome,0) }), [filtered]);

  function save(id: string, patch: Partial<Omit<Holding,'id'>>) { onHoldingsChange(updateHolding(holdings, id, patch)); setEditingId(null); }

  if (!holdings.length) return <div className="rounded-lg border border-dashed border-border bg-card p-10 text-center text-sm text-muted-foreground">No holdings yet. Add your first position above.</div>;

  return (
    <div className="rounded-lg border border-border bg-card overflow-hidden">
      <div className="flex items-center gap-2 px-4 py-3 border-b border-border flex-wrap">
        <span className="text-xs font-semibold text-foreground mr-1">Container:</span>
        {(["ALL",...ACTIVE_CONTAINERS] as ContainerFilter[]).map((container)=><button type="button" key={container} onClick={()=>setContainerFilter(container)} className={`px-2.5 py-1 rounded text-xs ${containerFilter===container?'bg-primary text-primary-foreground':'text-muted-foreground hover:bg-accent hover:text-foreground'}`}>{container==='ALL'?'ALL':containerLabel(container)}</button>)}
        <div className="ml-auto flex items-center gap-4 text-[10px] text-muted-foreground"><span>{filtered.length} positions</span><span>Basis {fmtDollar(totals.basis)}</span><span>Div {fmtDollar(totals.divs)}</span><span>Income {fmtDollar(totals.income)}</span></div>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-xs min-w-[1400px]">
          <thead>
            <tr className="border-b border-border/60 bg-muted/20">
              <th className="px-2 py-2 text-left text-[10px] uppercase text-muted-foreground">Container</th>
              <th className="px-2 py-2 text-left text-[10px] uppercase text-muted-foreground">Ticker</th>
              <th className="px-2 py-2 text-left text-[10px] uppercase text-muted-foreground">Current</th>
              <th className="px-2 py-2 text-left text-[10px] uppercase text-muted-foreground">Value</th>
              <th className="px-2 py-2 text-left text-[10px] uppercase text-muted-foreground">G/L</th>
              <th className="px-2 py-2 text-left text-[10px] uppercase text-muted-foreground">Dip</th>
              <th className="px-2 py-2 text-left text-[10px] uppercase text-muted-foreground">Ex</th>
              <th className="px-2 py-2 text-left text-[10px] uppercase text-muted-foreground">Pay</th>
              <th className="px-2 py-2 text-left text-[10px] uppercase text-muted-foreground">Review</th>
              <th className="px-2 py-2 text-left text-[10px] uppercase text-muted-foreground">Add</th>
              <th className="px-2 py-2 text-left text-[10px] uppercase text-muted-foreground">Trim</th>
              <th className="px-2 py-2 text-left text-[10px] uppercase text-muted-foreground">Action / Trigger</th>
              <th className="px-2 py-2 text-left text-[10px] uppercase text-muted-foreground">Notes</th>
              <th className="px-2 py-2 w-14" />
            </tr>
          </thead>
          <tbody>
            {filtered.map((holding)=>{
              const quote=quotes.get(holding.ticker);
              const ctx=deriveHoldingContext({holding, quote});
              const gl=calcUnrealizedGL(holding, quote?.price);
              const glPct=calcUnrealizedGLPct(holding, quote?.price);
              return editingId===holding.id ? (
                <EditRow key={holding.id} holding={holding} onSave={(patch)=>save(holding.id,patch)} onCancel={()=>setEditingId(null)} />
              ) : (
                <tr key={holding.id} className="border-b border-border/20 hover:bg-muted/10">
                  <td className="px-2 py-2.5"><div className="text-[10px] font-semibold uppercase text-foreground">{containerLabel(holding.container)}<div className="text-muted-foreground">{containerParentLabel(holding.container)}</div></div></td>
                  <td className="px-2 py-2.5"><div className="font-bold text-foreground">{holding.ticker}</div></td>
                  <td className="px-2 py-2.5">{quote?.price == null ? '—' : fmtDollar(quote.price)}</td>
                  <td className="px-2 py-2.5">{fmtDollar(calcCurrentValue(holding, quote?.price))}</td>
                  <td className="px-2 py-2.5">{gl == null ? '—' : <div><div className={signClass(gl)}>{fmtDollar(gl)}</div><div className={signClass(glPct)}>{fmtPct(glPct)}</div></div>}</td>
                  <td className="px-2 py-2.5">{holding.latestDipDate || '—'}</td>
                  <td className="px-2 py-2.5">{holding.nextExDate || '—'}</td>
                  <td className="px-2 py-2.5">{holding.nextPayDate || '—'}</td>
                  <td className="px-2 py-2.5">{holding.reviewDate || '—'}</td>
                  <td className="px-2 py-2.5">{fmtDollar(ctx.addBelowPrice)}</td>
                  <td className="px-2 py-2.5">{fmtDollar(ctx.trimAbovePrice)}</td>
                  <td className="px-2 py-2.5">{holding.currentAction || ctx.triggerState}</td>
                  <td className="px-2 py-2.5 max-w-[160px]"><span className="truncate block" title={holding.notes}>{holding.notes || '—'}</span></td>
                  <td className="px-2 py-2.5"><div className="flex gap-1"><button type="button" onClick={()=>setEditingId(holding.id)}><Pencil size={12}/></button><button type="button" onClick={()=>{ if(window.confirm('Remove this holding?')) onHoldingsChange(deleteHolding(holdings, holding.id)); }}><Trash2 size={12}/></button></div></td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
