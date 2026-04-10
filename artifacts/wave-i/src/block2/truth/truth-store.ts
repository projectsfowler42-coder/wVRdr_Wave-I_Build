import type { TruthValue } from "@/block2/truth/canonical-types";

export interface TruthStoreSnapshot {
  version: number;
  updatedAt: string;
  values: TruthValue[];
}

export function makeTruthStoreSnapshot(values: TruthValue[], version = 1): TruthStoreSnapshot {
  return {
    version,
    updatedAt: new Date().toISOString(),
    values,
  };
}

export function getTruthValue<T = unknown>(snapshot: TruthStoreSnapshot, field: string): TruthValue<T> | undefined {
  return snapshot.values.find((value) => value.field === field) as TruthValue<T> | undefined;
}

export function upsertTruthValue(snapshot: TruthStoreSnapshot, next: TruthValue): TruthStoreSnapshot {
  const values = snapshot.values.filter((value) => value.id !== next.id && value.field !== next.field);
  values.push(next);
  return {
    ...snapshot,
    updatedAt: new Date().toISOString(),
    values,
  };
}
