import { bridgeLineForTicker } from "@/lib/bridge-mode";
import type { Quote } from "@/lib/market";

export type BridgeRowStatus = "comparable" | "blocked" | "degraded" | "watch" | "unresolved";
export type BridgeMetricGroup = "identity" | "market" | "income" | "nav" | "risk" | "position" | "truth" | "xflt";

export interface BridgeGateResult {
  status: BridgeRowStatus;
  missingGroups: BridgeMetricGroup[];
  reasons: string[];
  xfltGateOpen: boolean;
}

function hasNumber(value: number | null | undefined): boolean {
  return typeof value === "number" && Number.isFinite(value);
}

function addMissing(missing: Set<BridgeMetricGroup>, reasons: string[], group: BridgeMetricGroup, reason: string): void {
  missing.add(group);
  reasons.push(reason);
}

export function evaluateBridgeGate(args: {
  ticker: string;
  quote?: Quote | null;
  shares?: number | null;
  costBasis?: number | null;
  nextExDate?: string | null;
  nextPayDate?: string | null;
  thesis?: string | null;
}): BridgeGateResult {
  const ticker = args.ticker.toUpperCase();
  const line = bridgeLineForTicker(ticker);
  const quote = args.quote ?? null;
  const missing = new Set<BridgeMetricGroup>();
  const reasons: string[] = [];

  if (!line) addMissing(missing, reasons, "identity", "Ticker is outside the Pre-Wave-I bridge instrument set.");
  if (!quote || !hasNumber(quote.price)) addMissing(missing, reasons, "market", "Current price is missing; row cannot be compared.");
  if (!quote || !hasNumber(quote.previousClose) || quote.changePct == null) addMissing(missing, reasons, "market", "Previous close or change % is missing.");
  if (!quote || !quote.observedAt) addMissing(missing, reasons, "truth", "Observed timestamp is missing.");
  if (!quote || quote.truthClass === "FAILED") addMissing(missing, reasons, "truth", "Truth class is failed or absent.");
  if (!quote || !hasNumber(quote.selectedYieldPct) || !quote.yieldType || !hasNumber(quote.lastDistribution)) addMissing(missing, reasons, "income", "Yield type, selected yield %, or last distribution is missing.");
  if (!args.nextExDate) addMissing(missing, reasons, "income", "Next ex-date is missing.");
  if (!args.nextPayDate) addMissing(missing, reasons, "income", "Next pay-date is missing.");
  if (!quote || !hasNumber(quote.oneMonthReturnPct) || !hasNumber(quote.threeMonthReturnPct) || !hasNumber(quote.twelveMonthReturnPct)) addMissing(missing, reasons, "risk", "Risk path returns are missing.");
  if (!quote || !hasNumber(quote.oneYearMaxDrawdownPct) || !hasNumber(quote.ninetyDayVolatilityPct) || !hasNumber(quote.downsideDeviationPct)) addMissing(missing, reasons, "risk", "Drawdown, volatility, or downside deviation is missing.");
  if (!hasNumber(args.shares) || !hasNumber(args.costBasis)) addMissing(missing, reasons, "position", "Shares or cost basis is missing.");

  if (line?.requiresNav && (!quote || !hasNumber(quote.nav) || !hasNumber(quote.premiumDiscountPct))) {
    addMissing(missing, reasons, "nav", "NAV or premium/discount is required and missing.");
  }
  if (line?.requiresLeverage && (!quote || !hasNumber(quote.leveragePct))) {
    addMissing(missing, reasons, "nav", "Leverage is required and missing.");
  }

  const xfltGateOpen =
    ticker !== "XFLT" ||
    Boolean(
      quote &&
        hasNumber(quote.price) &&
        hasNumber(quote.nav) &&
        hasNumber(quote.premiumDiscountPct) &&
        hasNumber(quote.lastDistribution) &&
        quote.distributionTrend &&
        hasNumber(quote.leveragePct) &&
        args.nextExDate &&
        args.nextPayDate &&
        quote.liquidityStatus &&
        args.thesis,
    );

  if (!xfltGateOpen) {
    addMissing(missing, reasons, "xflt", "XFLT special gate is closed: price, NAV, discount, distribution trend, leverage, dates, liquidity, and thesis survival must be visible.");
  }

  const missingGroups = Array.from(missing);
  const status: BridgeRowStatus =
    missingGroups.includes("identity") || missingGroups.includes("market") || missingGroups.includes("truth") || missingGroups.includes("xflt")
      ? "blocked"
      : missingGroups.length > 0
        ? "degraded"
        : "comparable";

  return { status, missingGroups, reasons, xfltGateOpen };
}
