const activeRuns = new Map<string, Promise<unknown>>();

export function isHarvestRunning(key = "default"): boolean {
  return activeRuns.has(key);
}

export async function runSingleFlight<T>(key: string, fn: () => Promise<T>): Promise<{ status: "started" | "already-running"; value?: T }> {
  const existing = activeRuns.get(key) as Promise<T> | undefined;
  if (existing) {
    return { status: "already-running" };
  }

  const promise = fn().finally(() => {
    activeRuns.delete(key);
  });

  activeRuns.set(key, promise);
  const value = await promise;
  return { status: "started", value };
}
