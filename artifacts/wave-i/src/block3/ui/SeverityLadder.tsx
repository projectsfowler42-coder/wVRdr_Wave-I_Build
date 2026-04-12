const LEVELS = [
  { label: "Local", value: 20 },
  { label: "Watch", value: 35 },
  { label: "Caveat", value: 50 },
  { label: "Restrict", value: 70 },
  { label: "Contain", value: 90 },
] as const;

export default function SeverityLadder() {
  return (
    <div className="rounded-xl border border-border bg-card/60 p-4">
      <div className="text-[11px] uppercase tracking-[0.2em] text-muted-foreground">
        Block-3 severity ladder
      </div>
      <div className="mt-1 text-sm font-semibold text-foreground">
        Premium shell language promoted from quarantine
      </div>
      <div className="mt-4 grid grid-cols-5 gap-2">
        {LEVELS.map((level) => (
          <div key={level.label} className="grid gap-2">
            <div
              className="h-3 rounded-full bg-gradient-to-r from-slate-300 via-amber-300 to-rose-400"
              style={{ opacity: level.value / 100 }}
            />
            <div className="text-center text-[10px] uppercase tracking-wider text-muted-foreground">
              {level.label}
            </div>
          </div>
        ))}
      </div>
      <div className="mt-3 text-xs text-muted-foreground">
        This is a frontend-only visual promotion. It does not activate dormant bucket classes.
      </div>
    </div>
  );
}
