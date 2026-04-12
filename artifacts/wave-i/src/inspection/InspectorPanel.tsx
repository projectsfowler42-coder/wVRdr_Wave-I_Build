import { listRegisteredModules } from "@/runtime/registry/ModuleRegistry";
import { healthMonitor } from "@/runtime/governance/HealthMonitor";
import { listWaveIInstruments } from "@/lib/loadInstruments";
import ModuleInspector from "@/inspection/ModuleInspector";
import HealthDashboard from "@/inspection/HealthDashboard";
import ReleaseInspector from "@/inspection/ReleaseInspector";

export default function InspectorPanel() {
  const modules = listRegisteredModules();
  const health = healthMonitor.snapshot();
  const instruments = listWaveIInstruments();
  const scopedCounts = instruments.reduce<Record<string, number>>((acc, instrument) => {
    acc[instrument.canonicalWaveIBucket] = (acc[instrument.canonicalWaveIBucket] ?? 0) + 1;
    return acc;
  }, {});

  return (
    <div className="rounded-xl border border-border bg-card/60 p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <div className="text-[11px] uppercase tracking-[0.2em] text-muted-foreground">
            Ghost Chassis Inspection Surface
          </div>
          <div className="mt-1 text-sm font-semibold text-foreground">
            Module, health, release, and instrument-custody visibility
          </div>
        </div>
        <div className="text-xs text-muted-foreground">
          {Object.entries(scopedCounts)
            .map(([bucket, count]) => `${bucket}:${count}`)
            .join(" · ")}
        </div>
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-3">
        <ModuleInspector modules={modules} />
        <HealthDashboard health={health} />
        <ReleaseInspector />
      </div>
    </div>
  );
}
