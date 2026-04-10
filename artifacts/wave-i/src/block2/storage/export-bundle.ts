import type { TruthStoreSnapshot } from "@/block2/truth/truth-store";
import type { QuarantineSnapshot } from "@/block2/quarantine/quarantine-store";
import type { HarvestReport } from "@/block2/harvest/harvest-report";

export interface Block2ExportBundle {
  exportedAt: string;
  truthSnapshot?: TruthStoreSnapshot;
  quarantineSnapshot?: QuarantineSnapshot;
  harvestReports?: HarvestReport[];
}

export function createExportBundle(input: Omit<Block2ExportBundle, "exportedAt">): Block2ExportBundle {
  return {
    exportedAt: new Date().toISOString(),
    ...input,
  };
}

export function serializeExportBundle(bundle: Block2ExportBundle): string {
  return JSON.stringify(bundle, null, 2);
}
