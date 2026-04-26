import { TruthBadge, type BadgeStatus } from "@/components/hud/TruthBadge";
import { ageSeconds, type TruthEnvelope } from "@/contracts/truth.contract";

export interface TelemetricTileData extends TruthEnvelope<number> {
  readonly movementPercent: number | string;
  readonly isPositive: boolean;
  readonly staleRescue?: boolean;
}

interface TelemetricTileProps {
  readonly label: string;
  readonly data: TelemetricTileData;
  readonly selected?: boolean;
  readonly onSelect?: () => void;
}

function displayMovement(value: number | string): string {
  if (typeof value === "number" && Number.isFinite(value)) return `${value.toFixed(2)}%`;
  if (typeof value === "string" && value.trim() !== "") return value;
  return "0.00%";
}

function displayValue(value: number): string {
  if (!Number.isFinite(value)) return "--";
  return value.toFixed(2);
}

export function TelemetricTile({ label, data, selected = false, onSelect }: TelemetricTileProps) {
  const status: BadgeStatus = data.staleRescue ? "STALE_RESCUE" : data.truthClass;
  const polarity = data.isPositive ? "cyan" : "pink";

  return (
    <button
      type="button"
      onClick={onSelect}
      className={`liquid-glass-tile w-full rounded-3xl border p-4 text-left transition-all ${selected ? "ring-2 ring-cyan-300" : ""}`}
    >
      <div className="tile-header flex items-start justify-between gap-3">
        <span className="ticker-label font-mono text-xs font-bold uppercase tracking-[0.24em] text-slate-200">{label}</span>
        <TruthBadge status={status} age={ageSeconds(data.timestamp)} />
      </div>
      <div className="tile-body mt-4 flex items-end justify-between gap-3">
        <span className="value-mono font-mono text-3xl font-semibold tabular-nums text-white">{displayValue(data.value)}</span>
        <span className={`move-pct ${polarity} font-mono text-sm font-bold tabular-nums`}>
          {displayMovement(data.movementPercent)}
        </span>
      </div>
    </button>
  );
}
