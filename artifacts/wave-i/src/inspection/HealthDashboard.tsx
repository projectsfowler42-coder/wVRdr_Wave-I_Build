import type { HealthEvent } from "@/contracts/health.contract";

export default function HealthDashboard({
  events,
}: {
  events: HealthEvent[];
}) {
  return (
    <div className="rounded-lg border border-border bg-card p-4">
      <div className="text-sm font-semibold text-foreground">Health / Fault State</div>
      <div className="mt-3 grid gap-2">
        {events.length === 0 ? (
          <div className="text-xs text-muted-foreground">
            No module health overrides recorded.
          </div>
        ) : (
          events.map((event) => (
            <div
              key={`${event.subject}-${event.occurredAt}`}
              className="rounded-md border border-border/70 px-3 py-2 text-xs"
            >
              <div className="flex items-center justify-between gap-3">
                <span className="text-foreground">{event.subject}</span>
                <span className="uppercase tracking-wider text-muted-foreground">{event.state}</span>
              </div>
              <div className="mt-1 text-[11px] text-muted-foreground">
                {event.reason ?? "No reason recorded"}
              </div>
              <div className="mt-1 text-[10px] text-muted-foreground">
                {new Date(event.occurredAt).toLocaleString()}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
