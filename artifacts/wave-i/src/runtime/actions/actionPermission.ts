import { canDriveOfficialDecision, explainTruthBlock, type TruthEnvelope } from "@/runtime/truth/TruthEnvelope";
import type { WaveIContainerCode } from "@/runtime/events/WvRdrEvent";

export type WaveIActionKind = "ADD" | "TRIM" | "HOLD" | "DRIP" | "WAIT" | "ROTATE" | "NOTE";

export type ActionPermission = {
  action: WaveIActionKind;
  amountUsd: number | null;
  source: WaveIContainerCode;
  destination: WaveIContainerCode;
  allowed: boolean;
  allowedBy: string;
  blockedBy: string | null;
  dataQuality: string;
  confidenceCeiling: number;
  nextRequiredEvidence: string[];
  truthRefs: TruthEnvelope<unknown>[];
};

function clampConfidence(value: number): number {
  return Math.min(100, Math.max(0, Math.round(value)));
}

export function confidenceCeilingForTruth(truthRefs: TruthEnvelope<unknown>[]): number {
  if (truthRefs.length === 0) return 0;

  let ceiling = 100;
  for (const ref of truthRefs) {
    if (ref.truthClass === "RAW_USER") ceiling = Math.min(ceiling, 72);
    if (ref.truthClass === "SECONDARY") ceiling = Math.min(ceiling, 80);
    if (ref.truthClass === "TRANSFORMED") ceiling = Math.min(ceiling, 86);
    if (ref.sourceClass === "proxy") ceiling = Math.min(ceiling, 50);
    if (ref.stale) ceiling = Math.min(ceiling, 65);
    if (ref.degraded) ceiling = Math.min(ceiling, 55);
    if (ref.conflicted) ceiling = Math.min(ceiling, 0);
    if (ref.truthClass === "QUARANTINED" || ref.truthClass === "SIMULATED" || ref.truthClass === "UNRESOLVED") {
      ceiling = 0;
    }
  }

  return clampConfidence(ceiling);
}

export function dataQualitySummary(truthRefs: TruthEnvelope<unknown>[]): string {
  if (truthRefs.length === 0) return "no truth references attached";
  return truthRefs
    .map((ref) => `${ref.truthClass}/${ref.sourceClass}${ref.stale ? "/stale" : ""}${ref.degraded ? "/degraded" : ""}${ref.conflicted ? "/conflicted" : ""}`)
    .join(" + ");
}

export function adjudicateAction(args: {
  action: WaveIActionKind;
  amountUsd?: number | null;
  source: WaveIContainerCode;
  destination: WaveIContainerCode;
  allowedBy: string;
  truthRefs: TruthEnvelope<unknown>[];
  nextRequiredEvidence?: string[];
}): ActionPermission {
  const blockedReasons = args.truthRefs.flatMap(explainTruthBlock);
  const hasAuthority = args.truthRefs.every(canDriveOfficialDecision);
  const amountValid = args.amountUsd == null || (Number.isFinite(args.amountUsd) && args.amountUsd >= 0);

  if (!amountValid) blockedReasons.push("action amount is not a valid non-negative USD value");

  return {
    action: args.action,
    amountUsd: args.amountUsd ?? null,
    source: args.source,
    destination: args.destination,
    allowed: hasAuthority && amountValid,
    allowedBy: args.allowedBy,
    blockedBy: blockedReasons.length > 0 ? [...new Set(blockedReasons)].join("; ") : null,
    dataQuality: dataQualitySummary(args.truthRefs),
    confidenceCeiling: confidenceCeilingForTruth(args.truthRefs),
    nextRequiredEvidence: args.nextRequiredEvidence ?? [],
    truthRefs: args.truthRefs,
  };
}
