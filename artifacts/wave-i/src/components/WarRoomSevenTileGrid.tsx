import { useState } from "react";
import TelemetricTile from "@/components/TelemetricTile";

export type TileTruth = "LIVE" | "DEGRADED" | "STALE" | "FAILED";

export interface SevenTileItem {
  readonly id: string;
  readonly label: string;
  readonly value: string;
  readonly movement: string;
  readonly truthClass: TileTruth;
  readonly sourceId: string;
  readonly detail: string;
  readonly tone: "cyan" | "mint" | "amber" | "neutral";
}

interface WarRoomSevenTileGridProps {
  readonly tiles: SevenTileItem[];
}

export default function WarRoomSevenTileGrid({ tiles }: WarRoomSevenTileGridProps) {
  const [selectedId, setSelectedId] = useState(tiles[0]?.id ?? "");
  const selected = tiles.find((tile) => tile.id === selectedId) ?? tiles[0];

  return (
    <section className="space-y-3">
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        {tiles.map((tile) => (
          <TelemetricTile key={tile.id} {...tile} selected={selected?.id === tile.id} onSelect={() => setSelectedId(tile.id)}>
            {tile.detail}
          </TelemetricTile>
        ))}
      </div>
      {selected ? (
        <div className="rounded-2xl border border-border bg-card p-4 shadow-sm">
          <div className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Selected telemetry</div>
          <div className="mt-2 flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
            <div>
              <h2 className="text-xl font-semibold text-foreground">{selected.label}</h2>
              <p className="mt-1 text-xs text-muted-foreground">{selected.detail}</p>
            </div>
            <div className="text-right">
              <div className="text-2xl font-semibold text-foreground num">{selected.value}</div>
              <div className="text-xs text-muted-foreground">{selected.movement} · {selected.sourceId}</div>
            </div>
          </div>
        </div>
      ) : null}
    </section>
  );
}
