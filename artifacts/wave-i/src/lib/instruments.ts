import {
  getBucketScopedInstruments,
  getInstrumentRecord,
  listWaveIInstruments,
} from "@/lib/loadInstruments";

export interface Instrument {
  ticker: string;
  name: string;
  bucket: "BLUE" | "GREEN";
  type: string;
  divFreq: "monthly" | "quarterly" | "special" | "varies";
  notes?: string;
}

function toLegacyInstrument(ticker: string): Instrument {
  const record = getInstrumentRecord(ticker);

  if (!record) {
    return {
      ticker,
      name: ticker,
      bucket: "BLUE",
      type: "Unknown",
      divFreq: "varies",
      notes: "missing from local instrument DB",
    };
  }

  return {
    ticker: record.ticker,
    name: record.name,
    bucket: record.canonicalWaveIBucket === "GREEN" ? "GREEN" : "BLUE",
    type: record.subtype,
    divFreq:
      record.payoutFrequency === "monthly" ||
      record.payoutFrequency === "quarterly" ||
      record.payoutFrequency === "special"
        ? record.payoutFrequency
        : "varies",
    notes: record.bucketJob,
  };
}

export const BLUE_INSTRUMENTS: Instrument[] = getBucketScopedInstruments("BLUE").map((record) =>
  toLegacyInstrument(record.ticker),
);

export const GREEN_INSTRUMENTS: Instrument[] = getBucketScopedInstruments("GREEN").map((record) =>
  toLegacyInstrument(record.ticker),
);

export const ALL_INSTRUMENTS: Instrument[] = listWaveIInstruments()
  .filter((record) => record.canonicalWaveIBucket === "BLUE" || record.canonicalWaveIBucket === "GREEN")
  .map((record) => toLegacyInstrument(record.ticker));

export function getInstrument(ticker: string): Instrument | undefined {
  return ALL_INSTRUMENTS.find((instrument) => instrument.ticker === ticker);
}

export function getBucketInstruments(bucket: "BLUE" | "GREEN"): Instrument[] {
  return bucket === "BLUE" ? BLUE_INSTRUMENTS : GREEN_INSTRUMENTS;
}
