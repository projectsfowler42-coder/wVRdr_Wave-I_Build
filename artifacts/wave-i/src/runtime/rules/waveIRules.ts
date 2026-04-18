import { canDriveOfficialDecision, type TruthEnvelope } from "@/runtime/truth/TruthEnvelope";

export const WAVE_I_HARD_RULES = {
  MINT_FIRST_NORMAL_FLOW: "WAVE_I_MINT_FIRST_NORMAL_FLOW",
  WHITE_BLUE_SLOW_REPAIR: "WAVE_I_WHITE_BLUE_SLOW_REPAIR",
  EXACT_EXCESS_SPILLS_TO_MINT: "WAVE_I_EXACT_EXCESS_SPILLS_TO_MINT",
  QUARANTINE_NO_AUTHORITY: "WAVE_I_QUARANTINE_NO_AUTHORITY",
  SIMULATED_NO_LIVE_AUTHORITY: "WAVE_I_SIMULATED_NO_LIVE_AUTHORITY",
  USER_INCOME_NOT_ISSUER_TRUTH: "WAVE_I_USER_INCOME_NOT_ISSUER_TRUTH",
  CACHED_QUOTES_SHOW_AGE: "WAVE_I_CACHED_QUOTES_SHOW_AGE",
  PROXY_DATA_DEGRADED: "WAVE_I_PROXY_DATA_DEGRADED",
  UNRESOLVED_CONFLICT_BLOCKS_AUTO_ACTION: "WAVE_I_UNRESOLVED_CONFLICT_BLOCKS_AUTO_ACTION",
  ACTIVE_SCOPE_ONLY: "WAVE_I_ACTIVE_SCOPE_ONLY",
} as const;

export type WaveIHardRuleId = typeof WAVE_I_HARD_RULES[keyof typeof WAVE_I_HARD_RULES];

export function blockedAuthorityRules(envelopes: TruthEnvelope<unknown>[]): WaveIHardRuleId[] {
  const blocked = new Set<WaveIHardRuleId>();

  for (const envelope of envelopes) {
    if (canDriveOfficialDecision(envelope)) continue;
    if (envelope.truthClass === "QUARANTINED") blocked.add(WAVE_I_HARD_RULES.QUARANTINE_NO_AUTHORITY);
    if (envelope.truthClass === "SIMULATED") blocked.add(WAVE_I_HARD_RULES.SIMULATED_NO_LIVE_AUTHORITY);
    if (envelope.truthClass === "UNRESOLVED" || envelope.conflicted) blocked.add(WAVE_I_HARD_RULES.UNRESOLVED_CONFLICT_BLOCKS_AUTO_ACTION);
    if (envelope.truthClass === "RAW_USER") blocked.add(WAVE_I_HARD_RULES.USER_INCOME_NOT_ISSUER_TRUTH);
    if (envelope.stale) blocked.add(WAVE_I_HARD_RULES.CACHED_QUOTES_SHOW_AGE);
    if (envelope.sourceClass === "proxy" || envelope.degraded) blocked.add(WAVE_I_HARD_RULES.PROXY_DATA_DEGRADED);
  }

  return [...blocked];
}
