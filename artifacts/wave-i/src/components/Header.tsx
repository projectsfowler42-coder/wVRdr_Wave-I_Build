import { Briefcase, Database, RadioTower, RefreshCw } from "lucide-react";
import type { HarvestRunState } from "@/block2/truth/canonical-types";

type Tab = "warroom" | "portfolio";

type RefreshState = "idle" | "running" | "completed" | "failed";

interface HeaderProps {
  tab: Tab;
  onTabChange: (t: Tab) => void;
  onDataRefresh: () => void;
  onHarvestData: () => void;
  refreshState: RefreshState;
  harvestState: HarvestRunState;
  harvestSummary?: string | null;
  lastUpdated: number | null;
  holdingsCount: number;
  canHarvest: boolean;
}

export default function Header({
  tab,
  onTabChange,
  onDataRefresh,
  onHarvestData,
  refreshState,
  harvestState,
  harvestSummary,
  lastUpdated,
  holdingsCount,
  canHarvest,
}: HeaderProps) {
  const ts = lastUpdated
    ? new Date(lastUpdated).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" })
    : null;
  const refreshing = refreshState === "running";
  const harvesting = harvestState === "running";

  return (
    <header className="flex items-center justify-between px-4 py-3 border-b border-border bg-card/70 gap-3 flex-wrap">
      <div className="flex items-center gap-3">
        <div>
          <span className="text-sm font-bold tracking-tight text-foreground">Wave-I</span>
          <span className="ml-2 text-xs text-muted-foreground">Pre-Wave-I Manual D3 Bridge</span>
        </div>
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-[10px] text-muted-foreground uppercase tracking-wider">|M| D3 wallet</span>
          <span className="text-[10px] text-muted-foreground uppercase tracking-wider">[B] Blue</span>
          <span className="text-[10px] text-muted-foreground uppercase tracking-wider">[G] Green</span>
          <span className="text-[10px] text-amber-700 uppercase tracking-wider">|W| excluded</span>
        </div>
      </div>

      <nav className="flex items-center rounded-lg border border-border overflow-hidden">
        <button
          onClick={() => onTabChange("warroom")}
          className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium transition-colors ${
            tab === "warroom" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground hover:bg-accent"
          }`}
        >
          <RadioTower size={12} />
          Control
        </button>
        <button
          onClick={() => onTabChange("portfolio")}
          className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium transition-colors border-l border-border ${
            tab === "portfolio" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground hover:bg-accent"
          }`}
        >
          <Briefcase size={12} />
          Portfolio
          {holdingsCount > 0 && (
            <span className={`ml-0.5 text-[9px] rounded-full px-1.5 py-0.5 font-bold ${tab === "portfolio" ? "bg-white/20 text-white" : "bg-muted text-muted-foreground"}`}>
              {holdingsCount}
            </span>
          )}
        </button>
      </nav>

      <div className="flex items-center gap-3 flex-wrap justify-end">
        <div className="flex flex-col items-end gap-1 text-right">
          <span className="text-[10px] text-muted-foreground num">{ts ? `Last refresh ${ts}` : "No data refresh yet"}</span>
          <span className="text-[10px] text-muted-foreground num">{harvestSummary ?? "Refresh and harvest are separate"}</span>
        </div>
        <button
          type="button"
          onClick={onDataRefresh}
          disabled={refreshing || harvesting}
          className="inline-flex items-center gap-2 rounded-full border border-cyan-300/50 bg-cyan-400/20 px-4 py-2 text-sm font-semibold text-cyan-50 shadow-sm transition-all hover:bg-cyan-400/28 disabled:cursor-not-allowed disabled:opacity-70"
        >
          <RefreshCw size={14} className={refreshing ? "animate-spin" : ""} />
          <span>[{refreshing ? "Refreshing…" : "Data Refresh"}]</span>
        </button>
        <button
          type="button"
          onClick={onHarvestData}
          disabled={!canHarvest || refreshing || harvesting}
          className="inline-flex items-center gap-2 rounded-full border border-emerald-300/50 bg-emerald-400/20 px-4 py-2 text-sm font-semibold text-emerald-50 shadow-sm transition-all hover:bg-emerald-400/28 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <Database size={14} />
          <span>[{harvesting ? "Harvesting…" : "Harvest Data"}]</span>
        </button>
      </div>
    </header>
  );
}
