import type { Block2ExportBundle } from "@/block2/storage/export-bundle";

export interface ImportBundleResult {
  ok: boolean;
  bundle?: Block2ExportBundle;
  error?: string;
}

export function parseImportBundle(serialized: string): ImportBundleResult {
  try {
    const bundle = JSON.parse(serialized) as Block2ExportBundle;
    if (!bundle || typeof bundle !== "object" || typeof bundle.exportedAt !== "string") {
      return { ok: false, error: "Invalid bundle shape" };
    }
    return { ok: true, bundle };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : "Unknown import error" };
  }
}
