declare module "@/block2/harvest/harvest-singleflight" {
  export function runSingleFlight<T>(
    key: string,
    fn: () => Promise<T>,
  ): Promise<{ status: "started" | "already-running"; value?: T; report?: T }>;
}
