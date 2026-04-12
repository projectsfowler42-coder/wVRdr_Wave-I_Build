import { releaseRegistry } from "@/runtime/release/ReleaseRegistry";

export default function ReleaseInspector() {
  return (
    <div className="rounded-lg border border-border bg-card p-4">
      <div className="text-sm font-semibold text-foreground">Release / Ghost Image</div>
      <div className="mt-3 text-xs text-muted-foreground grid gap-1">
        <div>active: {releaseRegistry.active ?? "none yet"}</div>
        <div>previous: {releaseRegistry.previous ?? "none yet"}</div>
        <div>known releases: {releaseRegistry.releases.length}</div>
        <div>rollback posture: pointer-addressable once a Ghost Image is generated</div>
      </div>
    </div>
  );
}
