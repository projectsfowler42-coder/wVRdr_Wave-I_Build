import type { ReactNode } from "react";

type TileTruth = "LIVE" | "DEGRADED" | "STALE" | "FAILED";
type TelemetricTileTone = "cyan" | "mint" | "amber" | "neutral";

interface TelemetricTileProps {
  readonly label: string;
  readonly value: string;
  readonly movement?: string;
  readonly truthClass: TileTruth;
  readonly sourceId: string;
  readonly selected: boolean;
  readonly tone?: TelemetricTileTone;
  readonly children?: ReactNode;
  readonly onSelect: () => void;
}

const toneClass: Record<TelemetricTileTone, string> = {
  cyan: "shadow-[0_0_28px_rgba(34,211,238,0.18)]",
  mint: "shadow-[0_0_28px_rgba(52,211,153,0.18)]",
  amber: "shadow-[0_0_28px_rgba(251,191,36,0.16)]",
  neutral: "shadow-sm",
};

function badgeClass(value: TileTruth): string {
  if (value === "LIVE") return "border-emerald-300/70 bg-emerald-50 text-emerald-800";
  if (value === "DEGRADED") return "border-cyan-300/70 bg-cyan-50 text-cyan-800";
  if (value === "STALE") return "border-amber-300/70 bg-amber-50 text-amber-800";
  return "border-red-300/70 bg-red-50 text-red-800";
}

export default function TelemetricTile(props: TelemetricTileProps) {
  const { label, value, movement = "0.00%", truthClass, sourceId, selected, tone = "neutral", children, onSelect } = props;
  return (
    <button
      type="button"
      onClick={onSelect}
      className={`group rounded-3xl border p-4 text-left transition-all ${toneClass[tone]} ${selected ? "border-cyan-300 bg-white/80 ring-2 ring-cyan-200" : "border-white/40 bg-white/55 hover:border-cyan-200 hover:bg-white/75"}`}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-[10px] font-bold uppercase tracking-[0.22em] text-slate-500">{label}</div>
          <div className="mt-2 text-2xl font-semibold text-slate-950 num">{value}</div>
        </div>
        <span className={`rounded-full border px-2 py-1 text-[10px] font-bold ${badgeClass(truthClass)}`}>{truthClass}</span>
      </div>
      <div className="mt-3 flex items-center justify-between gap-3 text-[11px] text-slate-500">
        <span className="num">{movement}</span>
        <span className="truncate">{sourceId}</span>
      </div>
      {children ? <div className="mt-3 text-xs text-slate-600">{children}</div> : null}
    </button>
  );
}
