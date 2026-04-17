import { useEffect, useMemo, useState } from "react";
import type { TreasuryState } from "@/lib/treasury";
import { fmtDollar } from "@/lib/utils";

interface TreasuryPanelProps {
  treasury: TreasuryState;
  onSave: (next: { cash: number; reserve: number }) => void;
}

export default function TreasuryPanel({ treasury, onSave }: TreasuryPanelProps) {
  const [cashInput, setCashInput] = useState<string>(String(treasury.cash));
  const [reserveInput, setReserveInput] = useState<string>(String(treasury.reserve));

  useEffect(() => {
    setCashInput(String(treasury.cash));
    setReserveInput(String(treasury.reserve));
  }, [treasury.cash, treasury.reserve]);

  const dirty = useMemo(() => {
    return Number(cashInput || 0) !== treasury.cash || Number(reserveInput || 0) !== treasury.reserve;
  }, [cashInput, reserveInput, treasury.cash, treasury.reserve]);

  return (
    <section className="rounded-2xl border border-border bg-card p-4 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Treasury</div>
          <div className="mt-1 text-sm text-muted-foreground">
            Local cash and reserve state for the capital shell.
          </div>
        </div>
        <div className="text-right text-xs text-muted-foreground">
          <div>Cash {fmtDollar(treasury.cash)}</div>
          <div>Reserve {fmtDollar(treasury.reserve)}</div>
          <div>{treasury.updatedAt ? `Updated ${new Date(treasury.updatedAt).toLocaleString()}` : "No treasury snapshot yet"}</div>
        </div>
      </div>

      <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        <label className="flex flex-col gap-1">
          <span className="text-[11px] uppercase tracking-widest text-muted-foreground">Cash</span>
          <input
            type="number"
            step="0.01"
            value={cashInput}
            onChange={(event) => setCashInput(event.target.value)}
            className="rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:ring-2 focus:ring-ring"
          />
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-[11px] uppercase tracking-widest text-muted-foreground">Reserve</span>
          <input
            type="number"
            step="0.01"
            value={reserveInput}
            onChange={(event) => setReserveInput(event.target.value)}
            className="rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:ring-2 focus:ring-ring"
          />
        </label>
        <div className="md:col-span-2 xl:col-span-2 flex items-end">
          <button
            type="button"
            onClick={() => onSave({ cash: Number(cashInput || 0), reserve: Number(reserveInput || 0) })}
            disabled={!dirty}
            className="inline-flex h-10 items-center rounded-lg border border-border bg-primary px-4 text-sm font-medium text-primary-foreground disabled:cursor-not-allowed disabled:opacity-50"
          >
            Save treasury snapshot
          </button>
        </div>
      </div>
    </section>
  );
}
