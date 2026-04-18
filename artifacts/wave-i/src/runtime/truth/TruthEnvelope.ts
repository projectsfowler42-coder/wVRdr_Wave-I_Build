export type TruthClass =
  | "RAW_MARKET"
  | "SECONDARY"
  | "QUARANTINED"
  | "SIMULATED"
  | "USER_ENTERED"
  | "CALCULATED"
  | "UNRESOLVED";

export type SourceClass =
  | "issuer"
  | "exchange"
  | "broker"
  | "market-data"
  | "proxy"
  | "user"
  | "system";

export type TruthEnvelope<T> = {
  value: T;
  truthClass: TruthClass;
  sourceClass: SourceClass;
  sourceId: string;
  sourceUrl?: string;
  observedAt: string;
  adapterVersion: string;
  stale: boolean;
  degraded: boolean;
  conflicted: boolean;
  rawRef?: string;
};

export type TruthBadge =
  | "LIVE"
  | "CACHED"
  | "ISSUER"
  | "USER"
  | "SIMULATED"
  | "QUARANTINED"
  | "UNRESOLVED";

export function truthBadgeFor(envelope: TruthEnvelope<unknown>): TruthBadge {
  if (envelope.truthClass === "QUARANTINED") return "QUARANTINED";
  if (envelope.truthClass === "SIMULATED") return "SIMULATED";
  if (envelope.truthClass === "UNRESOLVED" || envelope.conflicted) return "UNRESOLVED";
  if (envelope.sourceClass === "issuer") return "ISSUER";
  if (envelope.sourceClass === "user" || envelope.truthClass === "USER_ENTERED") return "USER";
  if (envelope.stale) return "CACHED";
  return "LIVE";
}

export function hasSourceIdentity(envelope: TruthEnvelope<unknown>): boolean {
  return envelope.sourceId.trim().length > 0 && envelope.adapterVersion.trim().length > 0;
}

export function canDriveOfficialDecision(envelope: TruthEnvelope<unknown>): boolean {
  if (!hasSourceIdentity(envelope)) return false;
  if (envelope.stale || envelope.degraded || envelope.conflicted) return false;
  if (envelope.truthClass === "QUARANTINED") return false;
  if (envelope.truthClass === "SIMULATED") return false;
  if (envelope.truthClass === "UNRESOLVED") return false;
  if (envelope.sourceClass === "proxy") return false;
  return true;
}

export function createSystemCalculatedEnvelope<T>(value: T, sourceId: string, rawRef?: string): TruthEnvelope<T> {
  return {
    value,
    truthClass: "CALCULATED",
    sourceClass: "system",
    sourceId,
    observedAt: new Date().toISOString(),
    adapterVersion: "wave-i-runtime-v1",
    stale: false,
    degraded: false,
    conflicted: false,
    rawRef,
  };
}
