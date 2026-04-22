import { Briefcase, RadioTower } from "lucide-react";
import DataRefreshButton from "@/components/DataRefreshButton";

type Tab = "warroom" | "portfolio";
type RefreshRunState = "idle" | "running" | "completed";

interface HeaderProps {
  tab: Tab;
  onTabChange: (t: Tab) => void;
  onDataRefresh: () => void;
  refreshState: RefreshRunState;
  refreshSummary?: string | null;
  lastUpdated: number | null;
  holdingsCount: number;
}

export default function Header({
  tab,
  onTabChange,
  onDataRefresh,
  refreshState,
  refreshSummary,
  lastUpdated,
  holdingsCount,
}: HeaderProps) {
  const ts = lastUpdated
    ? new Date(lastUpdated).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" })
    : null;

  return (
    <header className="flex items-center justify-between px-4 py-3 border-b border-border bg-card/70 gap-3 flex-wrap">
      <div className="flex items-center gap-3">
        <div>
          <span className="text-sm font-bold tracking-tight text-foreground">Wave-I</span>
          <span className="ml-2 text-xs text-muted-foreground">Manual Bridge</span>
        </div>
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-[10px] text-muted-foreground uppercase tracking-wider">|M| MINT ETF wallet</span>
          <span className="text-[10px] text-muted-foreground uppercase tracking-wider">[B] Blue</span>
          <span className="text-[10px] text-muted-foreground uppercase tracking-wider">[G] Green</span>
        </div>
      </div>

      <nav className="flex items-center rounded-lg border border-border overflow-hidden">
        <button
          onClick={() => onTabChange("warroom")}
          className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium transition-colors ${
            tab === "warroom"
              ? "bg-primary text-primary-foreground"
              : "text-muted-foreground hover:text-foreground hover:bg-accent"
          }`}
        >
          <RadioTower size={12} />
          Control
        </button>
        <button
          onClick={() => onTabChange("portfolio")}
          className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium transition-colors border-l border-border ${
            tab === "portfolio"
              ? "bg-primary text-primary-foreground"
              : "text-muted-foreground hover:text-foreground hover:bg-accent"
          }`}
        >
          <Briefcase size={12} />
          Portfolio
          {holdingsCount > 0 && (
            <span className={`ml-0.5 text-[9px] rounded-full px-1.5 py-0.5 font-bold ${
              tab === "portfolio" ? "bg-white/20 text-white" : "bg-muted text-muted-foreground"
            }`}>
              {holdingsCount}
            </span>
          )}
        </button>
      </nav>

      <div className="flex items-center gap-3 flex-wrap justify-end">
        <div className="flex flex-col items-end gap-1 text-right">
          <span className="text-[10px] text-muted-foreground num">
            {ts ? `Last refresh ${ts}` : "No manual refresh yet"}
          </span>
          <span className="text-[10px] text-muted-foreground num">
            {refreshState === "running"
              ? "Refresh pass in progress…"
              : refreshSummary ?? "One click = one fetch pass"}
          </span>
        </div>
        <DataRefreshButton state={refreshState} onClick={onDataRefresh} />
      </div>
    </header>
  );
}
