import instrumentDb from "@/data/sources/instruments.wave-i.json";
import bucketDb from "@/data/sources/buckets.wave-i.json";
import type { WaveIBucketClass, WaveIInstrumentRecord } from "@/contracts/instrument.contract";

const INSTRUMENTS = instrumentDb as WaveIInstrumentRecord[];
const BUCKETS = bucketDb as Array<{
  id: string;
  class: WaveIBucketClass;
  label: string;
  activeWaveIScope: boolean;
}>;

export function listWaveIInstruments(): WaveIInstrumentRecord[] {
  return [...INSTRUMENTS];
}

export function listWaveIContainers() {
  return BUCKETS.filter((entry) => entry.activeWaveIScope);
}

export function getBucketScopedInstruments(bucket: WaveIBucketClass): WaveIInstrumentRecord[] {
  return INSTRUMENTS.filter(
    (instrument) => instrument.activeWaveIScope && instrument.canonicalWaveIBucket === bucket,
  );
}

export function getDefaultTickerForContainer(bucket: WaveIBucketClass): string {
  return getBucketScopedInstruments(bucket)[0]?.ticker ?? "";
}

export function getInstrumentRecord(ticker: string): WaveIInstrumentRecord | undefined {
  return INSTRUMENTS.find((instrument) => instrument.ticker === ticker);
}
