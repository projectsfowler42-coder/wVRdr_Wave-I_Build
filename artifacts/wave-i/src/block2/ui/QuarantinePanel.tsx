import React from "react";
import type { QuarantineItem } from "@/block2/quarantine/quarantine-schema";

interface QuarantinePanelProps {
  items: QuarantineItem[];
}

export function QuarantinePanel({ items }: QuarantinePanelProps) {
  return (
    <section className="rounded-3xl border border-slate-200 bg-white/70 p-4 shadow-sm backdrop-blur">
      <header className="mb-3 flex items-center justify-between">
        <h2 className="text-sm font-semibold tracking-wide text-slate-800">Quarantine</h2>
        <span className="rounded-full border border-slate-300 px-2 py-0.5 text-xs text-slate-600">
          {items.length} items
        </span>
      </header>

      <div className="space-y-2">
        {items.length === 0 ? (
          <div className="text-sm text-slate-500">No quarantined items.</div>
        ) : (
          items.map((item) => (
            <div key={item.id} className="rounded-2xl border border-slate-200 px-3 py-2 text-sm">
              <div className="font-medium text-slate-800">{item.relatedTicker ?? item.source.name}</div>
              <div className="text-slate-500">{item.reason} · {item.parseStatus}</div>
            </div>
          ))
        )}
      </div>
    </section>
  );
}

export default QuarantinePanel;
