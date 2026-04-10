import { useState } from "react";
import { BLUE_INSTRUMENTS, getBucketInstruments } from "@/lib/instruments";
import { addHolding, type Holding, type BucketClass, type WalletClass } from "@/lib/portfolio";
import { Plus, X } from "lucide-react";

interface AddHoldingFormProps {
  holdings: Holding[];
  onHoldingsChange: (h: Holding[]) => void;
}

const EMPTY_FORM = {
  bucket: "BLUE" as BucketClass,
  wallet: "" as "" | WalletClass,
  ticker: BLUE_INSTRUMENTS[0].ticker,
  shares: "",
  entryDate: "",
  entryPrice: "",
  dividendCollected: "",
  latestDipDate: "",
  dripAmount: "",
  expectedIncome: "",
  notes: "",
};

function getWalletOptions(bucket: BucketClass): Array<{ value: "" | WalletClass; label: string }> {
  return [
    { value: "", label: "—" },
    { value: "WHITE", label: "|W| WHITE" },
    ...(bucket === "GREEN" ? [{ value: "MINT" as const, label: "|M| MINT" }] : []),
  ];
}

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
    setForm((f) => {
      const next = { ...f, [key]: value };
      if (key === "bucket") {
        const instruments = getBucketInstruments(value as BucketClass);
        next.ticker = instruments[0].ticker;
        if (value !== "GREEN" && next.wallet === "MINT") {
          next.wallet = "";
        }
      }
      return next;
    });
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    const shares = parseFloat(form.shares);
    const entryPrice = parseFloat(form.entryPrice);

    if (!form.ticker) { setError("Ticker is required."); return; }
    if (isNaN(shares) || shares <= 0) { setError("Shares must be a positive number."); return; }
    if (isNaN(entryPrice) || entryPrice <= 0) { setError("Entry price must be a positive number."); return; }
    if (form.wallet === "MINT" && form.bucket !== "GREEN") { setError("|M| may only be assigned inside [G]."); return; }

    const holding: Omit<Holding, "id"> = {
      bucket: form.bucket,
      wallet: form.wallet || undefined,
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

  const bucketInstruments = getBucketInstruments(form.bucket);
  const walletOptions = getWalletOptions(form.bucket);

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
          onClick={() => { setOpen(false); setError(""); setForm(EMPTY_FORM); }}
          className="text-muted-foreground hover:text-foreground"
        >
          <X size={16} />
        </button>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-3">
          <Field label="Bucket">
            <select
              value={form.bucket}
              onChange={(e) => set("bucket", e.target.value)}
              className={selectCls}
            >
              <option value="BLUE">[B] BLUE</option>
              <option value="GREEN">[G] GREEN</option>
            </select>
          </Field>

          <Field label="Wallet">
            <select
              value={form.wallet}
              onChange={(e) => set("wallet", e.target.value)}
              className={selectCls}
            >
              {walletOptions.map((wallet) => (
                <option key={wallet.value || "none"} value={wallet.value}>
                  {wallet.label}
                </option>
              ))}
            </select>
          </Field>

          <Field label="Instrument">
            <select
              value={form.ticker}
              onChange={(e) => set("ticker", e.target.value)}
              className={selectCls}
            >
              {bucketInstruments.map((i) => (
                <option key={i.ticker} value={i.ticker}>
                  {i.ticker} — {i.name}
                </option>
              ))}
            </select>
          </Field>

          <Field label="Shares">
            <input type="number" value={form.shares} onChange={(e) => set("shares", e.target.value)} placeholder="e.g. 100" step="any" min="0" className={inputCls} />
          </Field>

          <Field label="Entry price $">
            <input type="number" value={form.entryPrice} onChange={(e) => set("entryPrice", e.target.value)} placeholder="e.g. 18.50" step="0.01" min="0" className={inputCls} />
          </Field>

          <Field label="Entry date">
            <input type="date" value={form.entryDate} onChange={(e) => set("entryDate", e.target.value)} className={inputCls} />
          </Field>

          <Field label="Dividend collected $">
            <input type="number" value={form.dividendCollected} onChange={(e) => set("dividendCollected", e.target.value)} placeholder="0.00" step="0.01" min="0" className={inputCls} />
          </Field>

          <Field label="Latest dip date">
            <input type="date" value={form.latestDipDate} onChange={(e) => set("latestDipDate", e.target.value)} className={inputCls} />
          </Field>

          <Field label="DRiP amount $">
            <input type="number" value={form.dripAmount} onChange={(e) => set("dripAmount", e.target.value)} placeholder="0.00" step="0.01" min="0" className={inputCls} />
          </Field>

          <Field label="Expected income/yr $">
            <input type="number" value={form.expectedIncome} onChange={(e) => set("expectedIncome", e.target.value)} placeholder="0.00" step="0.01" min="0" className={inputCls} />
          </Field>

          <div className="col-span-2 md:col-span-3">
            <Field label="Notes">
              <input type="text" value={form.notes} onChange={(e) => set("notes", e.target.value)} placeholder="Optional notes…" className={inputCls} />
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
