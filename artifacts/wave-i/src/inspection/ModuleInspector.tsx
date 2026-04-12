import type { ModulePointer } from "@/contracts/module.contract";

export default function ModuleInspector({ modules }: { modules: ModulePointer[] }) {
  return (
    <div className="rounded-lg border border-border bg-card p-4">
      <div className="text-sm font-semibold text-foreground">Module Registry</div>
      <div className="mt-3 grid gap-2">
        {modules.map((module) => (
          <div
            key={module.module_name}
            className="flex flex-wrap items-center justify-between gap-2 rounded-md border border-border/70 px-3 py-2 text-xs"
          >
            <div>
              <div className="font-medium text-foreground">{module.module_name}</div>
              <div className="text-muted-foreground">{module.path}</div>
            </div>
            <div className="flex items-center gap-2 text-muted-foreground">
              <span>v{module.module_version}</span>
              <span className="uppercase tracking-wider">{module.status}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
