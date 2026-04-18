import type { TruthEnvelope } from "@/runtime/truth/TruthEnvelope";

export function TruthNumberCard({
  label,
  envelope,
  formatValue,
}: {
  label: string;
  envelope: TruthEnvelope<number | string | null>;
  formatValue?: (value: number | string | null) => string;
}) {
  const flags = [
    envelope.stale ? "STALE" : null,
    envelope.degraded ? "DEGRADED" : null,
    envelope.conflicted ? "CONFLICTED" : null,
  ].filter(Boolean);

  return (
    <div className="rounded-2xl border border-border bg-card p-4 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-[10px] uppercase tracking-widest text-muted-foreground">{label}</div>
          <div className="mt-1 text-xl font-semibold text-foreground num">
            {formatValue ? formatValue(envelope.value) : String(envelope.value ?? "—")}
          </div>
        </div>
        <span className="rounded-full border border-border bg-background px-2 py-1 text-[10px] font-bold uppercase tracking-widest text-foreground">
          {envelope.truthClass}
        </span>
      </div>

      <div className="mt-3 grid gap-1 text-[10px] text-muted-foreground">
        <div>source: {envelope.sourceClass}/{envelope.sourceId}</div>
        {envelope.sourceUrl ? <div>url: {envelope.sourceUrl}</div> : null}
        <div>observed: {envelope.observedAt}</div>
        {envelope.verifiedAt ? <div>verified: {envelope.verifiedAt}</div> : null}
        <div>adapter: {envelope.adapterVersion}</div>
        {envelope.rawRef ? <div>raw: {envelope.rawRef}</div> : null}
        {envelope.ruleId ? <div>rule: {envelope.ruleId}</div> : null}
        {flags.length ? <div>flags: {flags.join(" / ")}</div> : <div>flags: none</div>}
      </div>
    </div>
  );
}
