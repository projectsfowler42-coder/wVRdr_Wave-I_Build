import type { Holding } from "@/lib/portfolio";
import type { Quote } from "@/lib/market";

export type DecisionAction = "DRIP" | "HOLD" | "ADD" | "TRIM" | "ROTATE" | "WAIT" | "NOTE";
export type TriggerState =
  | "idle"
  | "watch-add"
  | "near-add"
  | "inside-add"
  | "watch-trim"
  | "near-trim"
  | "inside-trim"
  | "ex-window"
  | "pay-window"
  | "review-due";
export type PressureState = "stable" | "supportive" | "neutral" | "pressured" | "stressed" | "unknown";

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
  nextExDate: string | null;
  daysToEx: number | null;
  nextPayDate: string | null;
  daysToPay: number | null;
  triggerState: TriggerState;
  pressureState: PressureState;
  snapshotAt: string | null;
}

function pctDistance(current: number | null, reference: number | null): number | null {
  if (current == null || reference == null || reference === 0) return null;
  return ((current - reference) / reference) * 100;
}

function daysUntil(dateText: string | null | undefined, today: Date): number | null {
  if (!dateText) return null;
  const target = new Date(dateText);
  if (Number.isNaN(target.getTime())) return null;
  return Math.ceil((target.getTime() - today.getTime()) / 86_400_000);
}

export function deriveTriggerState(input: {
  currentPrice: number | null;
  addBelowPrice?: number | null;
  trimAbovePrice?: number | null;
  daysToEx?: number | null;
  daysToPay?: number | null;
  reviewDate?: string | null;
  today?: Date;
}): TriggerState {
  const today = input.today ?? new Date();

  if (input.reviewDate) {
    const review = new Date(input.reviewDate);
    if (!Number.isNaN(review.getTime()) && review <= today) return "review-due";
  }
  if (typeof input.daysToEx === "number" && input.daysToEx >= 0 && input.daysToEx <= 5) return "ex-window";
  if (typeof input.daysToPay === "number" && input.daysToPay >= 0 && input.daysToPay <= 7) return "pay-window";

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
  holding: Holding;
  quote?: Quote | null;
  pressureState?: PressureState;
  today?: Date;
}): HoldingContext {
  const { holding, quote } = args;
  const today = args.today ?? new Date();
  const currentPrice = quote?.price ?? null;
  const costBasis = holding.shares * holding.entryPrice;
  const currentValue = currentPrice == null ? null : holding.shares * currentPrice;
  const unrealizedGL = currentValue == null ? null : currentValue - costBasis;
  const unrealizedGLPct = unrealizedGL == null || costBasis === 0 ? null : (unrealizedGL / costBasis) * 100;
  const addBelowPrice = holding.addBelowPrice ?? (holding.entryPrice > 0 ? holding.entryPrice * 0.97 : null);
  const trimAbovePrice = holding.trimAbovePrice ?? (holding.entryPrice > 0 ? holding.entryPrice * 1.03 : null);
  const daysToEx = daysUntil(holding.nextExDate, today);
  const daysToPay = daysUntil(holding.nextPayDate, today);

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
    addBelowPrice,
    trimAbovePrice,
    distanceToAddBandPct: pctDistance(currentPrice, addBelowPrice),
    distanceToTrimBandPct: pctDistance(currentPrice, trimAbovePrice),
    nextExDate: holding.nextExDate || null,
    daysToEx,
    nextPayDate: holding.nextPayDate || null,
    daysToPay,
    triggerState: deriveTriggerState({
      currentPrice,
      addBelowPrice,
      trimAbovePrice,
      daysToEx,
      daysToPay,
      reviewDate: holding.reviewDate,
      today,
    }),
    pressureState: args.pressureState ?? "unknown",
    snapshotAt:
      typeof quote?.timestamp === "number" && Number.isFinite(quote.timestamp) && quote.timestamp > 0
        ? new Date(quote.timestamp).toISOString()
        : null,
  };
}
