import type { TruthClass } from "@/contracts/truth.contract";

export type BadgeStatus = TruthClass | "STALE_RESCUE";

interface TruthBadgeProps {
  readonly status: BadgeStatus;
  readonly age: number;
}

function badgeClass(status: BadgeStatus): string {
  if (status === "LIVE") return "border-cyan-300/80 text-cyan-100 shadow-[0_0_14px_rgba(0,255,255,0.38)]";
  if (status === "STALE_RESCUE") return "border-amber-300/80 text-amber-100 shadow-[0_0_14px_rgba(251,191,36,0.32)]";
  if (status === "DEGRADED") return "border-pink-300/80 text-pink-100 shadow-[0_0_14px_rgba(255,0,255,0.30)]";
  if (status === "STALE") return "border-slate-300/70 text-slate-200";
  return "border-red-300/80 text-red-100";
}

export function TruthBadge({ status, age }: TruthBadgeProps) {
  const safeAge = Number.isFinite(age) ? Math.max(0, Math.floor(age)) : 0;
  return (
    <span className={`rounded-full border px-2 py-1 text-[10px] font-bold tracking-[0.18em] ${badgeClass(status)}`}>
      {status} · {safeAge}s
    </span>
  );
}
