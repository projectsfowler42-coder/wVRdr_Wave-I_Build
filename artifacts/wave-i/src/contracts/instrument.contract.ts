export type WaveIBucketClass = "MINT" | "BLUE" | "GREEN";

export interface InstrumentRelevantNumbers {
  yield: number | null;
  expenseRatio: number | null;
  aum: number | null;
  duration: number | null;
  maturityBand: string | null;
  leverage: number | null;
}

export interface WaveIInstrumentRecord {
  id: string;
  ticker: string;
  name: string;
  issuer: string | null;
  exchange: string | null;
  currency: string | null;
  countryOrDomicile: string | null;
  assetType: string;
  subtype: string;
  activeWaveIScope: boolean;
  canonicalWaveIBucket: WaveIBucketClass;
  broaderDoctrineBucket: string;
  bucketJob: string;
  riskRewardJob: string;
  whatItOwns: string;
  whatPaysIt: string;
  whatHurtsIt: string;
  failureMode: string;
  shockFamily: string;
  selectorLabel: string;
  selectorKeywords: string[];
  payoutFrequency: string | null;
  distributionStyle: string | null;
  dripRelevance: string | null;
  stagingReserveSuitability: string | null;
  whySelected: string;
  whyNotOtherBucket: string | null;
  doctrineNotes: string;
  provenanceNotes: string;
  evidenceLinks: Array<{ type: string; ref: string }>;
  factsheetUrl: string | null;
  issuerUrl: string | null;
  holdingsUrl: string | null;
  distributionUrl: string | null;
  retrievalTimestamp: string;
  relevantNumbers: InstrumentRelevantNumbers;
  schemaVersion: string;
  recordVersion: string;
  status: "active" | "provisional" | "quarantined" | "deprecated";
}
