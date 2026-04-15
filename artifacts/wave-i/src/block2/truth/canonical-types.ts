export type BucketClass = "B" | "G";
export type WalletClass = "W" | "M";

export type TruthClass =
  | "RAW_MARKET"
  | "RAW_OFFICIAL"
  | "RAW_USER"
  | "TRANSFORMED"
  | "SECONDARY"
  | "QUARANTINED"
  | "SIMULATED"
  | "UNRESOLVED";

export type SourceLabel =
  | "OFFICIAL"
  | "SECONDARY"
  | "MANUAL"
  | "QUARANTINED"
  | "PARTIAL"
  | "STALE"
  | "SIMULATED"
  | "DELAYED"
  | "UNRESOLVED";

export type SourceTier = 0 | 1 | 2 | 3;
export type VerificationState = "verified" | "partial" | "stale" | "degraded" | "conflicted" | "missing";
export type HarvestRunState = "idle" | "running" | "skipped-duplicate" | "partial" | "failed" | "completed";
export type QuarantineReason =
  | "weak_source"
  | "parse_failed"
  | "source_conflict"
  | "missing_provenance"
  | "legacy_output"
  | "manual_unreconciled"
  | "observational_only";

export interface SourceRef {
  id: string;
  name: string;
  tier: SourceTier;
  label: SourceLabel;
  url?: string;
  observedAt: string;
  verifiedAt?: string;
}

export interface CalcInputRef {
  field: string;
  truthObjectId: string;
  version: number;
}

export interface TruthValue<T = unknown> {
  id: string;
  field: string;
  value: T;
  truthClass: TruthClass;
  sourceLabel: SourceLabel;
  verificationState: VerificationState;
  observedAt: string;
  source: SourceRef;
  rawCandidateIds?: string[];
  calcInputs?: CalcInputRef[];
  selectedByRule?: string;
  notes?: string;
  version: number;
}

export interface TruthFieldProvenance {
  fieldName: string;
  sourceLabel: SourceLabel;
  truthClass: TruthClass;
  asOf: string;
  inputs: string[];
}

export interface InstrumentRecord {
  ticker: string;
  name: string;
  bucketClass?: BucketClass;
  walletEligibility?: WalletClass[];
  roleSubtype?: "core" | "feeder" | "tactical" | "watchlist";
  fitReason?: string;
  failReason?: string;
  sourceRefs: SourceRef[];
}

export interface WalletState {
  walletClass: WalletClass;
  currentAmount: number;
  targetAmount?: number;
  reservedAmount?: number;
  deployableAmount?: number;
  updatedAt: string;
}

export interface HoldingRecord {
  id: string;
  ticker: string;
  bucketClass: BucketClass;
  walletClass?: WalletClass;
  shares: number;
  entryDate: string;
  entryPrice: number;
  notes?: string;
}
