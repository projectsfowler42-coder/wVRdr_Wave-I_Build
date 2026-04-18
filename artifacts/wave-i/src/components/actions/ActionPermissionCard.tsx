import type { ActionPermission } from "@/runtime/actions/actionPermission";

export function ActionPermissionCard({ permission }: { permission: ActionPermission }) {
  return (
    <div className={`rounded-2xl border p-4 shadow-sm ${permission.allowed ? "border-emerald-300 bg-emerald-50" : "border-amber-300 bg-amber-50"}`}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-[10px] uppercase tracking-widest text-muted-foreground">Action</div>
          <div className="mt-1 text-lg font-bold text-foreground">
            {permission.action} {permission.amountUsd == null ? "" : `$${permission.amountUsd.toLocaleString()}`}
          </div>
        </div>
        <span className="rounded-full border border-border bg-background px-2 py-1 text-[10px] font-bold uppercase tracking-widest text-foreground">
          {permission.allowed ? "ALLOWED" : "BLOCKED"}
        </span>
      </div>

      <div className="mt-3 grid gap-1 text-xs text-muted-foreground">
        <div>source: {permission.source}</div>
        <div>destination: {permission.destination}</div>
        <div>allowed by: {permission.allowedBy}</div>
        <div>blocked by: {permission.blockedBy ?? "none"}</div>
        <div>data quality: {permission.dataQuality}</div>
        <div>confidence ceiling: {permission.confidenceCeiling}%</div>
        <div>
          next evidence: {permission.nextRequiredEvidence.length ? permission.nextRequiredEvidence.join("; ") : "none"}
        </div>
      </div>
    </div>
  );
}
