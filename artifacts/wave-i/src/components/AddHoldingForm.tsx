import { useState } from "react";
import { getBucketScopedInstruments } from "@/lib/loadInstruments";
import {
  addHolding,
  placementFromContainer,
  type Holding,
  type ActiveContainerClass,
} from "@/lib/portfolio";
import { ACTIVE_CONTAINERS, containerLabel } from "@/lib/containerModel";
import { Plus, X } from "lucide-react";

interface AddHoldingFormProps {
  holdings: Holding[];
  onHoldingsChange: (h: Holding[]) => void;
}

const DEFAULT_CONTAINER: ActiveContainerClass = "BLUE";

const EMPTY_FORM = {
  container: DEFAULT_CONTAINER,
  ticker: getBucketScopedInstruments(DEFAULT_CONTAINER)[0]?.ticker ?? "",
  shares: "",
  entryDate: "",
  entryPrice: "",
  dividendCollected: "",
  latestDipDate: "",
  dripAmount: "",
  expectedIncome: "",
  notes: "",
};

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="text-[11px] text-muted-foreground block mb-1">{label}</label>
      {children}
    </div>
  );
}

const inputCls =
  "w-full bg-muted border border-border rounded px-2.5 py-1.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring";

const selectCls =
  "w-full bg-muted border border-border rounded px-2.5 py-1.5 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-ring appearance-none";

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

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError("");

    const shares = parseFloat(form.shares);
    const entryPrice = parseFloat(form.entryPrice);

    if (!form.ticker) {
      setError("Ticker is required.");
      return;
    }
    if (Number.isNaN(shares) || shares <= 0) {
      setError("Shares must be a positive number.");
      return;
    }
    if (Number.isNaN(entryPrice) || entryPrice <= 0) {
      setError("Entry price must be a positive number.");
      return;
    }

    const placement = placementFromContainer(form.container);

    const holding: Omit<Holding, "id"> = {
      container: form.container,
      bucket: placement.bucket,
      wallet: placement.wallet,
      ticker: form.ticker,
      shares,
      entryDate: form.entryDate,
      entryPrice,
      dividendCollected: parseFloat(form.dividendCollected) || 0,
      latestDipDate: form.latestDipDate,
      dripAmount: parseFloat(form.dripAmount) || 0,
      expectedIncome: parseFloat(form.expectedIncome) || 0,
      notes: form.notes,
    };

    onHoldingsChange(addHolding(holdings, holding));
    setForm(EMPTY_FORM);
    setOpen(false);
  }

  const scopedInstruments = getBucketScopedInstruments(form.container);

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 px-3 py-2 rounded-lg border border-dashed border-border text-sm text-muted-foreground hover:text-foreground hover:border-border/80 transition-colors"
      >
        <Plus size={14} />
        Add holding
      </button>
    );
  }

  return (
    <div className="rounded-lg border border-border bg-card p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-foreground">Add Holding</h3>
        <button
          onClick={() => {
            setOpen(false);
            setError("");
            setForm(EMPTY_FORM);
          }}
          className="text-muted-foreground hover:text-foreground"
        >
          <X size={16} />
        </button>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-3">
          <Field label="Container">
            <select
              value={form.container}
              onChange={(event) => set("container", event.target.value)}
              className={selectCls}
            >
              {ACTIVE_CONTAINERS.map((container) => (
                <option key={container} value={container}>
                  {containerLabel(container)}
                </option>
              ))}
            </select>
          </Field>

          <Field label="Instrument">
            <select
              value={form.ticker}
              onChange={(event) => set("ticker", event.target.value)}
              className={selectCls}
            >
              {scopedInstruments.map((instrument) => (
                <option key={instrument.ticker} value={instrument.ticker}>
                  {instrument.ticker} — {instrument.name}
                </option>
              ))}
            </select>
          </Field>

          <Field label="Shares">
            <input type="number" value={form.shares} onChange={(event) => set("shares", event.target.value)} placeholder="e.g. 100" step="any" min="0" className={inputCls} />
          </Field>

          <Field label="Entry price $">
            <input type="number" value={form.entryPrice} onChange={(event) => set("entryPrice", event.target.value)} placeholder="e.g. 18.50" step="0.01" min="0" className={inputCls} />
          </Field>

          <Field label="Entry date">
            <input type="date" value={form.entryDate} onChange={(event) => set("entryDate", event.target.value)} className={inputCls} />
          </Field>

          <Field label="Dividend collected $">
            <input type="number" value={form.dividendCollected} onChange={(event) => set("dividendCollected", event.target.value)} placeholder="0.00" step="0.01" min="0" className={inputCls} />
          </Field>

          <Field label="Latest dip date">
            <input type="date" value={form.latestDipDate} onChange={(event) => set("latestDipDate", event.target.value)} className={inputCls} />
          </Field>

          <Field label="DRiP amount $">
            <input type="number" value={form.dripAmount} onChange={(event) => set("dripAmount", event.target.value)} placeholder="0.00" step="0.01" min="0" className={inputCls} />
          </Field>

          <Field label="Expected income/yr $">
            <input type="number" value={form.expectedIncome} onChange={(event) => set("expectedIncome", event.target.value)} placeholder="0.00" step="0.01" min="0" className={inputCls} />
          </Field>

          <div className="col-span-2 md:col-span-3">
            <Field label="Notes">
              <input type="text" value={form.notes} onChange={(event) => set("notes", event.target.value)} placeholder="Optional notes…" className={inputCls} />
            </Field>
          </div>
        </div>

        {error && <div className="text-xs text-destructive mb-3">{error}</div>}

        <div className="flex items-center gap-2">
          <button type="submit" className="px-4 py-1.5 rounded bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition-opacity">
            Save holding
          </button>
          <button type="button" onClick={() => { setOpen(false); setError(""); setForm(EMPTY_FORM); }} className="px-4 py-1.5 rounded text-sm text-muted-foreground hover:text-foreground transition-colors">
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}
