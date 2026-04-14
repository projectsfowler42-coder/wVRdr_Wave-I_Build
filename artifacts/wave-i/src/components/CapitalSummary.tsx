import type { CapitalSummary as CapitalSummaryModel } from "@/lib/capital-summary";
import { ACTIVE_CONTAINERS, containerAccent, containerLabel } from "@/lib/containerModel";
import { fmtDollar, fmtPct, signClass } from "@/lib/utils";

interface CapitalSummaryProps {
  summary: CapitalSummaryModel;
}

function StatCard({ label, value, detail }: { label: string; value: string; detail?: string }) {
  return (
    <div className="rounded-lg border border-border bg-card p-3">
      <div className="text-[10px] uppercase tracking-widest text-muted-foreground">{label}</div>
      <div className="mt-1 text-lg font-semibold text-foreground num">{value}</div>
      {detail ? <div className="mt-1 text-[11px] text-muted-foreground">{detail}</div> : null}
    </div>
  );
}

export default function CapitalSummary({ summary }: CapitalSummaryProps) {
  return (
    <section className="space-y-4">
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-5">
        <StatCard label="Holdings" value={String(summary.holdingsCount)} detail="Tracked positions in local Wave-I custody" />
        <StatCard label="Cost basis" value={fmtDollar(summary.deployedCostBasis)} detail="Capital deployed into tracked positions" />
        <StatCard
          label="Market value"
          value={fmtDollar(summary.currentMarketValue)}
          detail={
            summary.currentMarketValue != null
              ? "Based on local quote snapshots when available"
              : "Awaiting quote coverage µ cost basis remains authoritative"
          }
        />
        <StatCard
          label="Unrealized"
          value={fmtDollar(summary.unrealizedGL)}
          detail={summary.unrealizedGLPct != null ? fmtPct(summary.unrealizedGLPct) : "Needs live quote context"}
        />
        <StatCard
          label="Income state"
          value={fmtDollar(summary.expectedAnnualIncome)}
          detail={`Collected ${fmtDollar(summary.dividendCollected)} · DRiP budget ${fmtDollar(summary.dripBudget)}`}
        />
      </div>

      <div className="rounded-lg border border-border bg-card p-4">
        <div className="text-[10px] uppercase tracking-widest text-muted-foreground">Container spread</div>
        <div className="mt-3 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          {ACTIVE_CONTAINERS.map((container) => {
            const row = summary.byContainer[container];
            const accent = containerAccent(container);
            return (
              <div key={container} className={`rounded-lg border ${accent.border} ${accent.dim} p-3`}>
                <div className={`text-[10px] font-bold uppercase tracking-widest ${accent.text}`}>
                  {containerLabel(container)}
                </div>
                <div className="mt-2 space-y-1 text-xs">
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-muted-foreground">Positions</span>
                    <span className="num text-foreground">{row.positions}</span>
                  </div>
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-muted-foreground">Cost basis</span>
                    <span className="num text-foreground">{fmtDollar(row.costBasis)}</span>
                  </div>
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-muted-foreground">Market value</span>
                    <span className={`num ${signClass(row.marketValue != null ? row.marketValue - row.costBasis : null)}`}>{fmtDollar(row.marketValue)}</span>
                  </div>
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-muted-foreground">Income</span>
                    <span className="num text-foreground">{fmtDollar(row.expectedAnnualIncome)}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
