import type { HarvestRunState, SourceLabel, VerificationState } from "@/block2/truth/canonical-types";

interface AuditPanelsProps {
  holdingsCount: number;
  lastUpdated: number | null;
  harvestState: HarvestRunState;
  harvestSummary?: string | null;
}

function StatusChip({ label }: { label: SourceLabel | VerificationState | string }) {
  return (
    <span className="inline-flex items-center rounded border border-border bg-muted/40 px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground">
      {label}
    </span>
  );
}

function AuditCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-lg border border-border bg-card p-3">
      <div className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-2">{title}</div>
      {children}
    </div>
  );
}

export default function AuditPanels({ holdingsCount, lastUpdated, harvestState, harvestSummary }: AuditPanelsProps) {
  const updatedLabel = lastUpdated
    ? new Date(lastUpdated).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" })
    : "—";

  return (
    <div className="grid gap-4 lg:grid-cols-3">
      <AuditCard title="Provenance">
        <div className="space-y-2 text-xs">
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="font-medium text-foreground">Holdings</div>
              <div className="text-muted-foreground">{holdingsCount} local position(s)</div>
            </div>
            <div className="flex items-center gap-1.5 flex-wrap justify-end">
              <StatusChip label="MANUAL" />
              <StatusChip label="verified" />
            </div>
          </div>
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="font-medium text-foreground">Quote snapshots</div>
              <div className="text-muted-foreground">Browser-fetched market snapshots · updated {updatedLabel}</div>
            </div>
            <div className="flex items-center gap-1.5 flex-wrap justify-end">
              <StatusChip label="SECONDARY" />
              <StatusChip label="partial" />
            </div>
          </div>
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="font-medium text-foreground">Harvest state</div>
              <div className="text-muted-foreground">{harvestSummary ?? "No local harvest report yet"}</div>
            </div>
            <div className="flex items-center gap-1.5 flex-wrap justify-end">
              <StatusChip label="MANUAL" />
              <StatusChip label={harvestState} />
            </div>
          </div>
        </div>
      </AuditCard>

      <AuditCard title="Conflicts">
        <div className="space-y-2 text-xs">
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="font-medium text-foreground">Unresolved source conflicts</div>
              <div className="text-muted-foreground">0 active local conflict records</div>
            </div>
            <div className="flex items-center gap-1.5 flex-wrap justify-end">
              <StatusChip label="UNRESOLVED" />
              <StatusChip label="missing" />
            </div>
          </div>
          <div className="text-[11px] text-muted-foreground border-t border-border/40 pt-2">
            Conflicts remain visible when recorded. None are currently stored in this local session.
          </div>
        </div>
      </AuditCard>

      <AuditCard title="Quarantine">
        <div className="space-y-2 text-xs">
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="font-medium text-foreground">Quarantined items</div>
              <div className="text-muted-foreground">0 items routed to quarantine in current local session</div>
            </div>
            <div className="flex items-center gap-1.5 flex-wrap justify-end">
              <StatusChip label="QUARANTINED" />
              <StatusChip label="missing" />
            </div>
          </div>
          <div className="text-[11px] text-muted-foreground border-t border-border/40 pt-2">
            Weak or unresolved material stays out of truth math. Current quote snapshots are marked SECONDARY in provenance, not promoted to OFFICIAL.
          </div>
        </div>
      </AuditCard>
    </div>
  );
}
