import { useState, type FormEvent, type ReactNode } from "react";
import { getBucketScopedInstruments, getInstrumentRecord } from "@/lib/loadInstruments";
import { addHolding, placementFromContainer, type Holding, type ActiveContainerClass } from "@/lib/portfolio";
import { ACTIVE_CONTAINERS, containerLabel } from "@/lib/containerModel";
import { Plus, X } from "lucide-react";

interface AddHoldingFormProps {
  holdings: Holding[];
  onHoldingsChange: (h: Holding[]) => void;
}

const DEFAULT_CONTAINER: ActiveContainerClass = "MINT";

const EMPTY_FORM = {
  container: DEFAULT_CONTAINER,
  ticker: getBucketScopedInstruments(DEFAULT_CONTAINER)[0]?.ticker ?? "",
  shares: "",
  entryDate: "",
  entryPrice: "",
  notes: "",
  thesis: "",
  addBelowPrice: "",
  trimAbovePrice: "",
  reviewDate: "",
  latestDipDate: "",
  nextExDate: "",
  nextPayDate: "",
  currentAction: "" as Holding["currentAction"],
  actionReason: "",
  expectedOutcome: "",
};

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div>
      <label className="mb-1 block text-[11px] text-muted-foreground">{label}</label>
      {children}
    </div>
  );
}

const inputCls = "w-full rounded-xl border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring";
const selectCls = "w-full appearance-none rounded-xl border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-ring";

export default function AddHoldingForm({ holdings, onHoldingsChange }: AddHoldingFormProps) {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [error, setError] = useState("");

  function set(key: keyof typeof EMPTY_FORM, value: string) {
    setForm((current) => {
      const next = { ...current, [key]: value };
      if (key === "container") {
        const scoped = getBucketScopedInstruments(value as ActiveContainerClass);
        next.ticker = scoped[0]?.ticker ?? "";
      }
      return next;
    });
  }

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError("");

    const shares = parseFloat(form.shares);
    const entryPrice = parseFloat(form.entryPrice);
    const addBelowPrice = form.addBelowPrice ? parseFloat(form.addBelowPrice) : null;
    const trimAbovePrice = form.trimAbovePrice ? parseFloat(form.trimAbovePrice) : null;

    if (!form.ticker) return setError("Instrument is required.");
    if (Number.isNaN(shares) || shares <= 0) return setError("Shares must be a positive number.");
    if (Number.isNaN(entryPrice) || entryPrice <= 0) return setError("Entry price must be a positive number.");

    const placement = placementFromContainer(form.container);
    const holding: Omit<Holding, "id"> = {
      container: form.container,
      bucket: placement.bucket,
      wallet: placement.wallet,
      ticker: form.ticker,
      shares,
      entryDate: form.entryDate,
      entryPrice,
      dividendCollected: 0,
      latestDipDate: form.latestDipDate,
      nextExDate: form.nextExDate,
      nextPayDate: form.nextPayDate,
      dripAmount: 0,
      expectedIncome: 0,
      notes: form.notes,
      thesis: form.thesis,
      currentAction: form.currentAction ?? "",
      actionReason: form.actionReason,
      expectedOutcome: form.expectedOutcome,
      reviewDate: form.reviewDate,
      addBelowPrice,
      trimAbovePrice,
      lastActionAt: null,
      lastActionType: "",
      outcomeNote: "",
    };

    onHoldingsChange(addHolding(holdings, holding));
    setForm(EMPTY_FORM);
    setOpen(false);
  }

  const scopedInstruments = getBucketScopedInstruments(form.container);
  const selectedInstrument = getInstrumentRecord(form.ticker);

  if (!open) {
    return (
      <button onClick={() => setOpen(true)} className="flex items-center gap-2 rounded-2xl border border-dashed border-border px-3 py-2 text-sm text-muted-foreground transition-colors hover:border-border/80 hover:text-foreground">
        <Plus size={14} />
        Add holding
      </button>
    );
  }

  return (
    <div className="rounded-2xl border border-border bg-card p-4 shadow-sm">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold text-foreground">Add Holding</h3>
          <div className="mt-1 text-[11px] text-muted-foreground">Enter the position, dates, bands, and your first decision context now.</div>
        </div>
        <button onClick={() => { setOpen(false); setError(""); setForm(EMPTY_FORM); }} className="text-muted-foreground hover:text-foreground"><X size={16} /></button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
          <Field label="Container"><select value={form.container} onChange={(event) => set("container", event.target.value)} className={selectCls}>{ACTIVE_CONTAINERS.map((container) => <option key={container} value={container}>{containerLabel(container)}</option>)}</select></Field>
          <Field label="Instrument"><select value={form.ticker} onChange={(event) => set("ticker", event.target.value)} className={selectCls}>{scopedInstruments.map((instrument) => <option key={instrument.ticker} value={instrument.ticker}>{instrument.ticker} — {instrument.name}</option>)}</select></Field>
          <Field label="Shares"><input type="number" value={form.shares} onChange={(event) => set("shares", event.target.value)} step="any" min="0" className={inputCls} /></Field>
          <Field label="Entry price $"><input type="number" value={form.entryPrice} onChange={(event) => set("entryPrice", event.target.value)} step="0.01" min="0" className={inputCls} /></Field>
          <Field label="Entry date"><input type="date" value={form.entryDate} onChange={(event) => set("entryDate", event.target.value)} className={inputCls} /></Field>
          <Field label="Latest dip date"><input type="date" value={form.latestDipDate} onChange={(event) => set("latestDipDate", event.target.value)} className={inputCls} /></Field>
          <Field label="Next ex date"><input type="date" value={form.nextExDate} onChange={(event) => set("nextExDate", event.target.value)} className={inputCls} /></Field>
          <Field label="Next pay date"><input type="date" value={form.nextPayDate} onChange={(event) => set("nextPayDate", event.target.value)} className={inputCls} /></Field>
          <Field label="Review date"><input type="date" value={form.reviewDate} onChange={(event) => set("reviewDate", event.target.value)} className={inputCls} /></Field>
          <Field label="Add below $"><input type="number" value={form.addBelowPrice} onChange={(event) => set("addBelowPrice", event.target.value)} step="0.01" min="0" className={inputCls} /></Field>
          <Field label="Trim above $"><input type="number" value={form.trimAbovePrice} onChange={(event) => set("trimAbovePrice", event.target.value)} step="0.01" min="0" className={inputCls} /></Field>
          <Field label="Initial action"><select value={form.currentAction ?? ""} onChange={(event) => set("currentAction", event.target.value)} className={selectCls}><option value="">No action set</option><option value="DRIP">DRiP</option><option value="HOLD">Hold</option><option value="ADD">Add</option><option value="TRIM">Trim</option><option value="ROTATE">Rotate</option><option value="WAIT">Wait</option><option value="NOTE">Note only</option></select></Field>
          <Field label="Thesis"><input type="text" value={form.thesis} onChange={(event) => set("thesis", event.target.value)} className={inputCls} /></Field>
          <Field label="Action reason"><input type="text" value={form.actionReason} onChange={(event) => set("actionReason", event.target.value)} className={inputCls} /></Field>
          <Field label="Expected outcome"><input type="text" value={form.expectedOutcome} onChange={(event) => set("expectedOutcome", event.target.value)} className={inputCls} /></Field>
          <div className="md:col-span-2 xl:col-span-3"><Field label="Notes"><input type="text" value={form.notes} onChange={(event) => set("notes", event.target.value)} className={inputCls} /></Field></div>
        </div>
        {selectedInstrument ? <div className="rounded-xl border border-border/70 bg-background/60 p-3 text-xs text-muted-foreground"><div className="font-medium text-foreground">Selected instrument</div><div className="mt-1">{selectedInstrument.ticker} · {selectedInstrument.subtype} · {selectedInstrument.payoutFrequency ?? "varies"}</div></div> : null}
        {error ? <div className="text-xs text-destructive">{error}</div> : null}
        <div className="flex items-center gap-2"><button type="submit" className="rounded-xl bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90">Save holding</button><button type="button" onClick={() => { setOpen(false); setError(""); setForm(EMPTY_FORM); }} className="rounded-xl px-4 py-2 text-sm text-muted-foreground transition-colors hover:text-foreground">Cancel</button></div>
      </form>
    </div>
  );
}
