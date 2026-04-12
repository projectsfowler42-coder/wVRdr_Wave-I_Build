import {
  CONSTRAINT_STACK,
  OPERATOR_DISCIPLINE,
  SYSTEM_SPINE,
  type DoctrineItem,
  type DoctrineStatus,
} from "@/doctrine/waveriderDoctrine";

const STATUS_STYLES: Record<DoctrineStatus, string> = {
  present: "border-emerald-500/40 bg-emerald-500/10 text-emerald-200",
  partial: "border-amber-500/40 bg-amber-500/10 text-amber-200",
  missing: "border-rose-500/40 bg-rose-500/10 text-rose-200",
};

function StatusBadge({ status }: { status: DoctrineStatus }) {
  return (
    <span
      className={`inline-flex items-center rounded border px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest ${STATUS_STYLES[status]}`}
    >
      {status}
    </span>
  );
}

function DoctrineRow({ item }: { item: DoctrineItem }) {
  return (
    <div className="rounded-lg border border-border/70 bg-background/40 p-3">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-sm font-semibold text-foreground">{item.name}</div>
          <div className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">{item.source}</div>
        </div>
        <StatusBadge status={item.status} />
      </div>

      <div className="mt-3 space-y-2 text-xs text-muted-foreground">
        <p>
          <span className="font-semibold text-foreground">Doctrine:</span> {item.doctrine}
        </p>
        <p>
          <span className="font-semibold text-foreground">Repo state:</span> {item.repoState}
        </p>
        <p>
          <span className="font-semibold text-foreground">Next surface:</span> {item.nextSurface}
        </p>
      </div>
    </div>
  );
}

function DoctrineColumn({ title, subtitle, items }: { title: string; subtitle: string; items: DoctrineItem[] }) {
  return (
    <section className="rounded-xl border border-border bg-card/60 p-4">
      <div className="mb-3">
        <div className="text-[11px] uppercase tracking-[0.2em] text-muted-foreground">{title}</div>
        <div className="mt-1 text-sm font-semibold text-foreground">{subtitle}</div>
      </div>
      <div className="space-y-3">
        {items.map((item) => (
          <DoctrineRow key={item.name} item={item} />
        ))}
      </div>
    </section>
  );
}

export default function WaveRiderDoctrinePanel() {
  const missingConstraintModules = CONSTRAINT_STACK.filter((item) => item.status === "missing").length;
  const missingDisciplineSurfaces = OPERATOR_DISCIPLINE.filter((item) => item.status === "missing").length;

  return (
    <div className="rounded-xl border border-border bg-card/60 p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="text-[11px] uppercase tracking-[0.2em] text-muted-foreground">
            Imported WaveRider doctrine
          </div>
          <div className="mt-1 text-sm font-semibold text-foreground">
            Repo-to-doc comparison surfaced inside Wave-I
          </div>
        </div>
        <div className="text-xs text-muted-foreground">
          {missingConstraintModules} constraint modules missing · {missingDisciplineSurfaces} discipline surfaces missing
        </div>
      </div>

      <div className="mt-4 grid gap-4 xl:grid-cols-2">
        <DoctrineColumn
          title="System spine"
          subtitle="Aggregator / Gate / Coach / System"
          items={SYSTEM_SPINE}
        />
        <DoctrineColumn
          title="Operator discipline"
          subtitle="Brakes, approval, and contradiction custody"
          items={OPERATOR_DISCIPLINE}
        />
      </div>

      <div className="mt-4">
        <DoctrineColumn
          title="Constraint stack"
          subtitle="Imported modules from the broader WaveRider architecture"
          items={CONSTRAINT_STACK}
        />
      </div>

      <div className="mt-4 rounded-lg border border-border/70 bg-background/40 p-3 text-xs text-muted-foreground">
        This panel is intentionally honest: it exposes imported doctrine and current repo coverage without claiming that
        missing engines already exist behind the UI.
      </div>
    </div>
  );
}
