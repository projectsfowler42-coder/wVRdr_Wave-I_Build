import type { SourceTier } from "@/block2/truth/canonical-types";

export const SOURCE_TIER = {
  MANUAL: 0,
  OFFICIAL: 1,
  SECONDARY: 2,
  QUARANTINED: 3,
} as const satisfies Record<string, SourceTier>;

export function isAuthoritativeTier(tier: SourceTier): boolean {
  return tier === SOURCE_TIER.MANUAL || tier === SOURCE_TIER.OFFICIAL;
}

export function outranks(a: SourceTier, b: SourceTier): boolean {
  return a < b;
}
