import React from "react";
import type { TruthFieldProvenance } from "@/block2/truth/canonical-types";

interface ProvenanceDrawerProps {
  provenance: TruthFieldProvenance[];
}

export function ProvenanceDrawer({ provenance }: ProvenanceDrawerProps) {
  return (
    <section className="rounded-3xl border border-slate-200 bg-white/70 p-4 shadow-sm backdrop-blur">
      <header className="mb-3 flex items-center justify-between">
        <h2 className="text-sm font-semibold tracking-wide text-slate-800">Provenance</h2>
        <span className="rounded-full border border-slate-300 px-2 py-0.5 text-xs text-slate-600">
          {provenance.length} fields
        </span>
      </header>

      <div className="space-y-3">
        {provenance.length === 0 ? (
          <div className="text-sm text-slate-500">No provenance attached.</div>
        ) : (
          provenance.map((field) => (
            <div key={field.fieldName} className="rounded-2xl border border-slate-200 px-3 py-2 text-sm">
              <div className="font-medium text-slate-800">{field.fieldName}</div>
              <div className="text-slate-500">{field.sourceLabel} · {field.truthClass} · {field.asOf}</div>
              {field.inputs.length > 0 ? (
                <div className="mt-1 text-xs text-slate-500">inputs: {field.inputs.join(", ")}</div>
              ) : null}
            </div>
          ))
        )}
      </div>
    </section>
  );
}

export default ProvenanceDrawer;
