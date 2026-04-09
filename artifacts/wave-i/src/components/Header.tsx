import { RefreshCw, Briefcase, RadioTower } from "lucide-react";

type Tab = "warroom" | "portfolio";

interface HeaderProps {
  tab: Tab;
  onTabChange: (t: Tab) => void;
  onRefresh: () => void;
  isRefreshing: boolean;
  lastUpdated: number | null;
  holdingsCount: number;
}

export default function Header({ tab, onTabChange, onRefresh, isRefreshing, lastUpdated, holdingsCount }: HeaderProps) {
  const ts = lastUpdated
    ? new Date(lastUpdated).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" })
    : null;

  return (
    <header className="flex items-center justify-between px-4 py-2 border-b border-border bg-card/70 gap-3 flex-wrap">
      <div className="flex items-center gap-3">
        <div>
          <span className="text-sm font-bold tracking-tight text-foreground">Wave-I</span>
          <span className="ml-2 text-xs text-muted-foreground">War Room</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-blue-signal inline-block" />
          <span className="text-[10px] text-muted-foreground uppercase tracking-wider">Blue</span>
          <span className="w-2 h-2 rounded-full bg-green-signal inline-block ml-1" />
          <span className="text-[10px] text-muted-foreground uppercase tracking-wider">Green</span>
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
          War Room
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

      <div className="flex items-center gap-3">
        {ts && (
          <span className="text-[10px] text-muted-foreground num">Updated {ts}</span>
        )}
        <button
          onClick={onRefresh}
          disabled={isRefreshing}
          className="flex items-center gap-1.5 px-2.5 py-1 rounded text-xs text-muted-foreground hover:text-foreground hover:bg-accent border border-border/60 transition-colors disabled:opacity-40"
        >
          <RefreshCw size={11} className={isRefreshing ? "animate-spin" : ""} />
          Refresh
        </button>
      </div>
    </header>
  );
}
