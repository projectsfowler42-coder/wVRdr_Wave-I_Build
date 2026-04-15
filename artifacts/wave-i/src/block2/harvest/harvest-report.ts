import type { HarvestRunState } from "@/block2/truth/canonical-types";

export interface HarvestReport {
  state: HarvestRunState;
  added: number;
  updated: number;
  failed: number;
  skippedDuplicate: number;
  itemResults: Array<{
    sourceId: string;
    status: "added" | "updated" | "skipped-duplicate" | "partial" | "failed";
  }>;
  finishedAt?: string;
}

export function createHarvestReport(): HarvestReport {
  return {
    state: "idle",
    added: 0,
    updated: 0,
    failed: 0,
    skippedDuplicate: 0,
    itemResults: [],
  };
}
