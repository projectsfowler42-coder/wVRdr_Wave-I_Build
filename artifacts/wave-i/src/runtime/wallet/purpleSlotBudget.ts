export const PURPLE_TOTAL = 10_000;
export const PURPLE_THRUST_TOTAL = 5_000;
export const PURPLE_PROBE_BANK = 5_000;

export const PURPLE_THRUST_SLOT_COUNT = 5;
export const PURPLE_THRUST_SLOT_SIZE = 1_000;

export const PURPLE_MIN_PROBE_COUNT = 20;
export const PURPLE_DEFAULT_PROBE_COUNT = 24;
export const PURPLE_MAX_PROBE_COUNT = 40;

export type PurpleSlotKind = "THRUST" | "PROBE";

export type PurpleSlot = {
  slotId: string;
  kind: PurpleSlotKind;
  sizeUsd: number;
  active: boolean;
};

export type PurpleWalletConfig = {
  probeCount?: number;
  walletBalance?: number;
};

export type PurpleSlotPlan = {
  walletBalance: number;
  thrustSlots: PurpleSlot[];
  probeSlots: PurpleSlot[];
  thrustTotal: number;
  probeTotal: number;
  totalCapacity: number;
};

export type PurpleBudgetViolation = {
  ruleId: string;
  message: string;
  actualUsd: number;
  limitUsd: number;
};

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function sumActive(slots: PurpleSlot[]): number {
  return slots
    .filter((slot) => slot.active)
    .reduce((total, slot) => total + slot.sizeUsd, 0);
}

export function resolvePurpleProbeCount(config: PurpleWalletConfig = {}): number {
  const requested = Number.isFinite(config.probeCount) ? Number(config.probeCount) : PURPLE_DEFAULT_PROBE_COUNT;
  return clamp(Math.floor(requested), PURPLE_MIN_PROBE_COUNT, PURPLE_MAX_PROBE_COUNT);
}

export function buildPurpleSlotPlan(config: PurpleWalletConfig = {}): PurpleSlotPlan {
  const probeCount = resolvePurpleProbeCount(config);
  const probeSize = PURPLE_PROBE_BANK / probeCount;
  const walletBalance = Number.isFinite(config.walletBalance) ? Number(config.walletBalance) : PURPLE_TOTAL;

  const thrustSlots: PurpleSlot[] = Array.from({ length: PURPLE_THRUST_SLOT_COUNT }, (_, index) => ({
    slotId: `PURPLE-THRUST-${index + 1}`,
    kind: "THRUST",
    sizeUsd: PURPLE_THRUST_SLOT_SIZE,
    active: true,
  }));

  const probeSlots: PurpleSlot[] = Array.from({ length: probeCount }, (_, index) => ({
    slotId: `PURPLE-PROBE-${index + 1}`,
    kind: "PROBE",
    sizeUsd: probeSize,
    active: true,
  }));

  return {
    walletBalance,
    thrustSlots,
    probeSlots,
    thrustTotal: sumActive(thrustSlots),
    probeTotal: sumActive(probeSlots),
    totalCapacity: sumActive(thrustSlots) + sumActive(probeSlots),
  };
}

export function validatePurpleSlotPlan(plan: PurpleSlotPlan): PurpleBudgetViolation[] {
  const violations: PurpleBudgetViolation[] = [];

  if (plan.thrustTotal > PURPLE_THRUST_TOTAL) {
    violations.push({
      ruleId: "PURPLE_THRUST_MAX_5000",
      message: "Purple thrust slots exceed the $5,000 thrust budget.",
      actualUsd: plan.thrustTotal,
      limitUsd: PURPLE_THRUST_TOTAL,
    });
  }

  if (plan.probeTotal > PURPLE_PROBE_BANK) {
    violations.push({
      ruleId: "PURPLE_PROBE_BANK_MAX_5000",
      message: "Purple probe slots exceed the $5,000 probe bank.",
      actualUsd: plan.probeTotal,
      limitUsd: PURPLE_PROBE_BANK,
    });
  }

  if (plan.totalCapacity > plan.walletBalance) {
    violations.push({
      ruleId: "PURPLE_TOTAL_CAPACITY_LE_WALLET_BALANCE",
      message: "Purple active slot capacity exceeds the Purple wallet balance.",
      actualUsd: plan.totalCapacity,
      limitUsd: plan.walletBalance,
    });
  }

  return violations;
}

export function assertPurpleSlotPlan(plan: PurpleSlotPlan): PurpleSlotPlan {
  const violations = validatePurpleSlotPlan(plan);
  if (violations.length > 0) {
    throw new Error(
      violations
        .map((violation) => `${violation.ruleId}: ${violation.actualUsd} > ${violation.limitUsd}`)
        .join("; "),
    );
  }
  return plan;
}

export function buildValidPurpleSlotPlan(config: PurpleWalletConfig = {}): PurpleSlotPlan {
  return assertPurpleSlotPlan(buildPurpleSlotPlan(config));
}
