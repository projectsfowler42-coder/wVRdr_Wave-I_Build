type RefreshRunState = "idle" | "running" | "completed";

interface DataRefreshButtonProps {
  state: RefreshRunState;
  onClick: () => void;
  disabled?: boolean;
}

export default function DataRefreshButton({ state, onClick, disabled }: DataRefreshButtonProps) {
  const running = state === "running";
  const label = running ? "Refreshing…" : "Data Refresh";

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled || running}
      className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold shadow-sm transition-all ${
        running
          ? "border border-cyan-300/40 bg-cyan-400/15 text-cyan-100"
          : "border border-cyan-300/50 bg-cyan-400/20 text-cyan-50 hover:bg-cyan-400/28 hover:border-cyan-200/70"
      } disabled:cursor-not-allowed disabled:opacity-80`}
      aria-live="polite"
    >
      <span
        className={`inline-block h-2.5 w-2.5 rounded-full ${running ? "animate-pulse bg-cyan-300" : "bg-cyan-200"}`}
        aria-hidden="true"
      />
      <span>[{label}]</span>
    </button>
  );
}
