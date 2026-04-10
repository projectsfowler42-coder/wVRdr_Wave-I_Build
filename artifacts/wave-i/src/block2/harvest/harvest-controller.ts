import { createHarvestReport, type HarvestReport } from "@/block2/harvest/harvest-report";
import { dedupeHarvestItems, type HashableHarvestItem } from "@/block2/harvest/harvest-dedupe";
import { runSingleFlight } from "@/block2/harvest/harvest-singleflight";

export interface HarvestControllerInput<T extends HashableHarvestItem> {
  items: T[];
  onProcess: (item: T) => Promise<"added" | "updated" | "skipped-duplicate" | "partial" | "failed">;
}

export async function runHarvestController<T extends HashableHarvestItem>(
  input: HarvestControllerInput<T>,
): Promise<{ status: "started" | "already-running"; report?: HarvestReport }> {
  return await runSingleFlight("block2-harvest", async () => {
    const report = createHarvestReport();
    const { unique, skippedDuplicateCount } = dedupeHarvestItems(input.items);
    report.skippedDuplicate += skippedDuplicateCount;

    for (const item of unique) {
      const result = await input.onProcess(item);
      report.itemResults.push({ sourceId: item.sourceId, status: result });
      if (result === "added") report.added += 1;
      if (result === "updated") report.updated += 1;
      if (result === "failed") report.failed += 1;
    }

    report.state = report.failed > 0 ? "partial" : "completed";
    report.finishedAt = new Date().toISOString();
    return report;
  });
}
