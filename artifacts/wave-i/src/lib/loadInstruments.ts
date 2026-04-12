import instrumentDb from "@/data/sources/instruments.wave-i.json";
import type { WaveIBucketClass, WaveIInstrumentRecord } from "@/contracts/instrument.contract";

export type BucketContainer = WaveIBucketClass;

const INSTRUMENTS = instrumentDb as WaveIInstrumentRecord[];

export function listWaveIInstruments(): WaveIInstrumentRecord[] {
  return [...INSTRUMENTS];
}

export function getBucketScopedInstruments(
  bucket: Extract<WaveIBucketClass, "WHITE" | "MINT" | "BLUE" | "GREEN">,
): WaveIInstrumentRecord[] {
  return INSTRUMENTS.filter(
    (instrument) => instrument.activeWaveIScope && instrument.canonicalWaveIBucket === bucket,
  );
}

export function getInstrumentRecord(ticker: string): WaveIInstrumentRecord | undefined {
  return INSTRUMENTS.find((instrument) => instrument.ticker === ticker);
}
