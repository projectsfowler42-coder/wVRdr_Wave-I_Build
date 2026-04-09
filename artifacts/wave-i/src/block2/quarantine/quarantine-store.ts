import type { QuarantineItem } from "@/block2/quarantine/quarantine-schema";

export interface QuarantineSnapshot {
  id: string;
  updatedAt: string;
  items: QuarantineItem[];
}

export function createQuarantineSnapshot(items: QuarantineItem[] = []): QuarantineSnapshot {
  return {
    id: "quarantine-snapshot",
    updatedAt: new Date().toISOString(),
    items,
  };
}

export function addQuarantineItem(snapshot: QuarantineSnapshot, item: QuarantineItem): QuarantineSnapshot {
  return {
    ...snapshot,
    updatedAt: new Date().toISOString(),
    items: [...snapshot.items.filter((existing) => existing.id !== item.id), item],
  };
}
