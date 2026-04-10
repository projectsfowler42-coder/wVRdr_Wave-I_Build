export interface HashableHarvestItem {
  sourceId: string;
  payloadHash: string;
}

export function dedupeHarvestItems<T extends HashableHarvestItem>(items: T[]): {
  unique: T[];
  skippedDuplicateCount: number;
} {
  const seen = new Set<string>();
  const unique: T[] = [];
  let skippedDuplicateCount = 0;

  for (const item of items) {
    const key = `${item.sourceId}:${item.payloadHash}`;
    if (seen.has(key)) {
      skippedDuplicateCount += 1;
      continue;
    }
    seen.add(key);
    unique.push(item);
  }

  return { unique, skippedDuplicateCount };
}
