import type { Holding } from "@/lib/portfolio";
import type { Quote } from "@/lib/market";

export type DecisionAction =
  | "DRIP"
  | "HOLD"
  | "ADD"
  | "TRIM"
  | "ROTATE"
  | "WAIT"
  | "NOTE";

export type TriggerState =
  | "idle"
  | "watch-add"
  | "near-add"
  | "inside-add"
  | "watch-trim"
  | "near-trim"
  | "inside-trim"
  | "pay-window"
  | "review-due";

export type PressureState =
  | "stable"
  | "supportive"
  | "neutral"
  | "pressured"
  | "stressed"
  | "unknown";

export interface HoldingContext {
  holdingId: string;
  ticker: string;
  container: Holding["container"];
  currentPrice: number | null;
  costBasis: number;
  currentValue: number | null;
  unrealizedGL: number | null;
  unrealizedGLPct: number | null;
  distanceToCostBasisPct: number | null;
  addBelowPrice: number | null;
  trimAbovePrice: number | null;
  distanceToAddBandPct: number | null;
  distanceToTrimBandPct: number | null;
  nextPayDate: string | null;
  daysToPay: number | null;
  triggerState: TriggerState;
  pressureState: PressureState;
  snapshotAt: string | null;
}

export interface DecisionRecord {
  decisionId: string;
  holdingId: string;
  ticker: string;
  container: Holding["container"];
  actionType: DecisionAction;
  actionAt: string;
  marketSnapshotAt: string | null;
  reason: string;
  expectedOutcome: string;
  reviewDate: string | null;
  outcome: string | null;
  outcomeRecordedAt: string | null;
}

export interface CapitalDecisionDraft {
  actionType: DecisionAction;
  reason?: string;
  expectedOutcome?: string;
  reviewDate?: string | null;
  marketSnapshotAt?: string | null;
}

function pctDistance(current: number | null, reference: number | null): number | null {
  if (current == null || reference == null || reference === 0) return null;
  return ((current - reference) / reference) * 100;
}

function calcCurrentValue(shares: number, currentPrice: number | null): number | null {
  if (currentPrice == null) return null;
  return shares * currentPrice;
}

function calcUnrealizedGL(costBasis: number, currentValue: number | null): number | null {
  if (currentValue == null) return null;
  return currentValue - costBasis;
}

function calcUnrealizedGLPct(costBasis: number, unrealizedGL: number | null): number | null {
  if (unrealizedGL == null || costBasis === 0) return null;
  return (unrealizedGL / costBasis) * 100;
}

export function deriveTriggerState(input: {
  currentPrice: number | null;
  addBelowPrice?: number | null;
  trimAbovePrice?: number | null;
  daysToPay?: number | null;
  reviewDate?: string | null;
  today?: Date;
}): TriggerState {
  const today = input.today ?? new Date();

  if (input.reviewDate) {
    const review = new Date(input.reviewDate);
    if (!Number.isNaN(review.getTime()) && review <= today) {
      return "review-due";
    }
  }

  if (typeof input.daysToPay === "number" && input.daysToPay >= 0 && input.daysToPay <= 7) {
    return "pay-window";
  }

  if (input.currentPrice != null && input.addBelowPrice != null) {
    if (input.currentPrice <= input.addBelowPrice) return "inside-add";
    const nearAdd = pctDistance(input.currentPrice, input.addBelowPrice);
    if (nearAdd != null && nearAdd <= 2) return "near-add";
    if (nearAdd != null && nearAdd <= 5) return "watch-add";
  }

  if (input.currentPrice != null && input.trimAbovePrice != null) {
    if (input.currentPrice >= input.trimAbovePrice) return "inside-trim";
    const nearTrim = pctDistance(input.trimAbovePrice, input.currentPrice);
    if (nearTrim != null && nearTrim <= 2) return "near-trim";
    if (nearTrim != null && nearTrim <= 5) return "watch-trim";
  }

  return "idle";
}

export function deriveHoldingContext(args: {
  holding: Holding & {
    addBelowPrice?: number | null;
    trimAbovePrice?: number | null;
    reviewDate?: string | null;
    nextPayDate?: string | null;
  };
  quote?: Quote | null;
  pressureState?: PressureState;
  today?: Date;
}): HoldingContext {
  const { holding, quote, today } = args;
  const currentPrice = quote?.price ?? null;
  const costBasis = holding.shares * holding.entryPrice;
  const currentValue = calcCurrentValue(holding.shares, currentPrice);
  const unrealizedGL = calcUnrealizedGL(costBasis, currentValue);
  const unrealizedGLPct = calcUnrealizedGLPct(costBasis, unrealizedGL);

  let daysToPay: number | null = null;
  if (holding.nextPayDate) {
    const nextPay = new Date(holding.nextPayDate);
    const base = today ?? new Date();
    if (!Number.isNaN(nextPay.getTime())) {
      daysToPay = Math.ceil((nextPay.getTime() - base.getTime()) / 86_400_000);
    }
  }

  return {
    holdingId: holding.id,
    ticker: holding.ticker,
    container: holding.container,
    currentPrice,
    costBasis,
    currentValue,
    unrealizedGL,
    unrealizedGLPct,
    distanceToCostBasisPct: pctDistance(currentPrice, holding.entryPrice),
    addBelowPrice: holding.addBelowPrice ?? null,
    trimAbovePrice: holding.trimAbovePrice ?? null,
    distanceToAddBandPct:
      holding.addBelowPrice != null ? pctDistance(currentPrice, holding.addBelowPrice) : null,
    distanceToTrimBandPct:
      holding.trimAbovePrice != null ? pctDistance(currentPrice, holding.trimAbovePrice) : null,
    nextPayDate: holding.nextPayDate ?? null,
    daysToPay,
    triggerState: deriveTriggerState({
      currentPrice,
      addBelowPrice: holding.addBelowPrice,
      trimAbovePrice: holding.trimAbovePrice,
      daysToPay,
      reviewDate: holding.reviewDate,
      today,
    }),
    pressureState: args.pressureState ?? "unknown",
    snapshotAt: quote?.timestamp ? new Date(quote.timestamp).toISOString() : null,
  };
}

export function createDecisionRecord(
  holding: Holding,
  draft: CapitalDecisionDraft,
): DecisionRecord {
  return {
    decisionId: crypto.randomUUID(),
    holdingId: holding.id,
    ticker: holding.ticker,
    container: holding.container,
    actionType: draft.actionType,
    actionAt: new Date().toISOString(),
    marketSnapshotAt: draft.marketSnapshotAt ?? null,
    reason: draft.reason?.trim() ?? "",
    expectedOutcome: draft.expectedOutcome?.trim() ?? "",
    reviewDate: draft.reviewDate ?? null,
    outcome: null,
    outcomeRecordedAt: null,
  };
}
