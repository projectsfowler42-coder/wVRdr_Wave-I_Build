export type TruthClass =
  | "RAW_MARKET"
  | "RAW_OFFICIAL"
  | "RAW_USER"
  | "TRANSFORMED"
  | "SECONDARY"
  | "QUARANTINED"
  | "SIMULATED"
  | "UNRESOLVED";

export type SourceClass =
  | "issuer"
  | "exchange"
  | "broker"
  | "market-data"
  | "proxy"
  | "user"
  | "derived";

export type TruthEnvelope<T> = {
  value: T;
  truthClass: TruthClass;
  sourceClass: SourceClass;
  sourceId: string;
  sourceUrl?: string;
  observedAt: string;
  verifiedAt?: string;
  adapterVersion: string;
  stale: boolean;
  degraded: boolean;
  conflicted: boolean;
  rawRef?: string;
  ruleId?: string;
};

export function hasSourceIdentity(envelope: TruthEnvelope<unknown>): boolean {
  return envelope.sourceId.trim().length > 0 && envelope.adapterVersion.trim().length > 0;
}

export function isBlockedTruthClass(truthClass: TruthClass): boolean {
  return truthClass === "QUARANTINED" || truthClass === "SIMULATED" || truthClass === "UNRESOLVED";
}

export function canDriveOfficialDecision(envelope: TruthEnvelope<unknown>): boolean {
  if (!hasSourceIdentity(envelope)) return false;
  if (isBlockedTruthClass(envelope.truthClass)) return false;
  if (envelope.stale || envelope.degraded || envelope.conflicted) return false;
  if (envelope.sourceClass === "proxy") return false;
  return true;
}

export function explainTruthBlock(envelope: TruthEnvelope<unknown>): string[] {
  const reasons: string[] = [];
  if (!hasSourceIdentity(envelope)) reasons.push("missing source identity or adapter version");
  if (envelope.truthClass === "QUARANTINED") reasons.push("quarantined material may display but cannot drive authoritative action");
  if (envelope.truthClass === "SIMULATED") reasons.push("simulated value may display but cannot drive live action");
  if (envelope.truthClass === "UNRESOLVED") reasons.push("unresolved source conflict blocks automatic action");
  if (envelope.stale) reasons.push("stale/cached value requires age disclosure and cannot drive automatic action");
  if (envelope.degraded) reasons.push("degraded data cannot drive authoritative action");
  if (envelope.conflicted) reasons.push("conflicted data requires operator adjudication");
  if (envelope.sourceClass === "proxy") reasons.push("proxy-fetched data is degraded for authority purposes");
  return reasons;
}

export function createDerivedEnvelope<T>(args: {
  value: T;
  sourceId: string;
  rawRef?: string;
  ruleId: string;
  observedAt?: string;
}): TruthEnvelope<T> {
  return {
    value: args.value,
    truthClass: "TRANSFORMED",
    sourceClass: "derived",
    sourceId: args.sourceId,
    observedAt: args.observedAt ?? new Date().toISOString(),
    adapterVersion: "wave-i-runtime-v1",
    stale: false,
    degraded: false,
    conflicted: false,
    rawRef: args.rawRef,
    ruleId: args.ruleId,
  };
}

export function createUserEnvelope<T>(value: T, sourceId = "operator-local"): TruthEnvelope<T> {
  return {
    value,
    truthClass: "RAW_USER",
    sourceClass: "user",
    sourceId,
    observedAt: new Date().toISOString(),
    adapterVersion: "wave-i-user-entry-v1",
    stale: false,
    degraded: false,
    conflicted: false,
  };
}
