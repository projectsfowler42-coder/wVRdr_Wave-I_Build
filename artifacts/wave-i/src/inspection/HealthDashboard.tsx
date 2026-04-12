import type { HealthState } from "@/contracts/health.contract";

export default function HealthDashboard({
  health,
}: {
  health: Record<string, HealthState>;
}) {
  const entries = Object.entries(health);

  return (
    <div className="rounded-lg border border-border bg-card p-4">
      <div className="text-sm font-semibold text-foreground">Health / Fault State</div>
      <div className="mt-3 grid gap-2">
        {entries.length === 0 ? (
          <div className="text-xs text-muted-foreground">
            No module health overrides recorded.
          </div>
        ) : (
          entries.map(([subject, state]) => (
            <div
              key={subject}
              className="flex items-center justify-between rounded-md border border-border/70 px-3 py-2 text-xs"
            >
              <span className="text-foreground">{subject}</span>
              <span className="uppercase tracking-wider text-muted-foreground">{state}</span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
