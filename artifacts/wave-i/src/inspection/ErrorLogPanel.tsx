import { useSyncExternalStore } from "react";
import {
  subscribeRuntimeErrors,
  snapshotRuntimeErrors,
} from "@/runtime/governance/ErrorCatalog";

export default function ErrorLogPanel() {
  const errors = useSyncExternalStore(subscribeRuntimeErrors, snapshotRuntimeErrors, snapshotRuntimeErrors);

  return (
    <div className="rounded-lg border border-border bg-card p-4">
      <div className="flex items-center justify-between gap-2">
        <div className="text-sm font-semibold text-foreground">Runtime Error Catalog</div>
        <div className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
          {errors.length} logged
        </div>
      </div>

      {errors.length === 0 ? (
        <div className="mt-3 text-xs text-muted-foreground">
          No runtime faults are currently cataloged.
        </div>
      ) : (
        <div className="mt-3 grid gap-2">
          {errors.slice(0, 5).map((error) => (
            <div key={error.id} className="rounded-md border border-border/70 bg-background/60 p-3">
              <div className="flex items-center justify-between gap-2 text-[10px] text-muted-foreground">
                <span>{error.kind}</span>
                <span>{new Date(error.timestamp).toLocaleTimeString()}</span>
              </div>
              <div className="mt-1 text-xs font-medium text-foreground">{error.message}</div>
              <div className="mt-1 text-[11px] text-muted-foreground">{error.explanation}</div>
              <div className="mt-2 text-[10px] text-muted-foreground">source: {error.source}</div>
              {error.detail ? <pre className="mt-2 whitespace-pre-wrap break-words text-[10px] text-muted-foreground">{error.detail}</pre> : null}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
