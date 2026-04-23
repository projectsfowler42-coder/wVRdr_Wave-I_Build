import type { Holding, ActiveContainerClass } from "@/lib/portfolio";
import type { Quote } from "@/lib/market";
import { ACTIVE_CONTAINERS } from "@/lib/containerModel";
import {
  blockedQuoteReason,
  classifyQuoteForCalculation,
  quoteAllowsMath,
  quoteCalculationInput,
  type QuoteCalculationStatus,
} from "@/lib/quote-quality";

interface ContainerSummary {
  positions: number;
  costBasis: number;
  marketValue: number | null;
  dividendCollected: number;
  expectedAnnualIncome: number;
  calculationStatus: QuoteCalculationStatus;
  degradedPositions: number;
  blockedPositions: number;
}

export interface CapitalSummary {
  holdingsCount: number;
  deployedCostBasis: number;
  currentMarketValue: number | null;
  unrealizedGL: number | null;
  unrealizedGLPct: number | null;
  dividendCollected: number;
  expectedAnnualIncome: number;
  dripBudget: number;
  calculationStatus: QuoteCalculationStatus;
  blockedPositions: number;
  degradedPositions: number;
  inputs: string[];
  blockedReason?: string;
  byContainer: Record<ActiveContainerClass, ContainerSummary>;
}

function emptyContainerSummary(): ContainerSummary {
  return {
    positions: 0,
    costBasis: 0,
    marketValue: null,
    dividendCollected: 0,
    expectedAnnualIncome: 0,
    calculationStatus: "VALID",
    degradedPositions: 0,
    blockedPositions: 0,
  };
}

function createEmptyContainerRecord(): CapitalSummary["byContainer"] {
  return ACTIVE_CONTAINERS.reduce((acc, container) => {
    acc[container] = emptyContainerSummary();
    return acc;
  }, {} as CapitalSummary["byContainer"]);
}

export function createEmptyCapitalSummary(): CapitalSummary {
  return {
    holdingsCount: 0,
    deployedCostBasis: 0,
    currentMarketValue: null,
    unrealizedGL: null,
    unrealizedGLPct: null,
    dividendCollected: 0,
    expectedAnnualIncome: 0,
    dripBudget: 0,
    calculationStatus: "BLOCKED",
    blockedPositions: 0,
    degradedPositions: 0,
    inputs: [],
    blockedReason: "no holdings loaded",
    byContainer: createEmptyContainerRecord(),
  };
}

function calcHoldingCostBasis(holding: Holding): number {
  return holding.shares * holding.entryPrice;
}

function calcHoldingMarketValue(holding: Holding, quote?: Quote | null): number | null {
  if (!quoteAllowsMath(quote) || quote?.price == null) return null;
  return holding.shares * quote.price;
}

function mergeStatus(current: QuoteCalculationStatus, next: QuoteCalculationStatus): QuoteCalculationStatus {
  if (current === "BLOCKED" || next === "BLOCKED") return "BLOCKED";
  if (current === "DEGRADED" || next === "DEGRADED") return "DEGRADED";
  return "VALID";
}

export function buildCapitalSummary(
  holdings: Holding[],
  quotesByTicker: Record<string, Quote | undefined>,
): CapitalSummary {
  const summary = createEmptyCapitalSummary();
  summary.holdingsCount = holdings.length;
  summary.blockedReason = undefined;

  for (const holding of holdings) {
    const quote = quotesByTicker[holding.ticker];
    const costBasis = calcHoldingCostBasis(holding);
    const marketValue = calcHoldingMarketValue(holding, quote);
    const bucket = summary.byContainer[holding.container];
    const quoteStatus = classifyQuoteForCalculation(quote);

    summary.deployedCostBasis += costBasis;
    summary.dividendCollected += holding.dividendCollected;
    summary.expectedAnnualIncome += holding.expectedIncome;
    summary.dripBudget += holding.dripAmount;
    summary.inputs.push(`${holding.ticker}|${quoteCalculationInput(quote)}`);

    bucket.positions += 1;
    bucket.costBasis += costBasis;
    bucket.dividendCollected += holding.dividendCollected;
    bucket.expectedAnnualIncome += holding.expectedIncome;
    bucket.calculationStatus = mergeStatus(bucket.calculationStatus, quoteStatus);

    if (quoteStatus === "DEGRADED") {
      bucket.degradedPositions += 1;
      summary.degradedPositions += 1;
    }

    if (quoteStatus === "BLOCKED") {
      bucket.blockedPositions += 1;
      summary.blockedPositions += 1;
      summary.blockedReason ??= blockedQuoteReason(quote) ?? `${holding.ticker} blocked quote math`;
    }

    if (marketValue != null) {
      bucket.marketValue = (bucket.marketValue ?? 0) + marketValue;
      summary.currentMarketValue = (summary.currentMarketValue ?? 0) + marketValue;
    }
  }

  if (holdings.length === 0) {
    summary.calculationStatus = "BLOCKED";
    summary.blockedReason = "no holdings loaded";
  } else if (summary.currentMarketValue == null) {
    summary.calculationStatus = "BLOCKED";
    summary.unrealizedGL = null;
    summary.unrealizedGLPct = null;
    summary.blockedReason ??= "all quote math blocked";
  } else {
    summary.unrealizedGL = summary.currentMarketValue - summary.deployedCostBasis;
    summary.unrealizedGLPct =
      summary.deployedCostBasis > 0
        ? (summary.unrealizedGL / summary.deployedCostBasis) * 100
        : null;
    summary.calculationStatus = summary.blockedPositions > 0 || summary.degradedPositions > 0 ? "DEGRADED" : "VALID";
  }

  for (const container of ACTIVE_CONTAINERS) {
    const bucket = summary.byContainer[container];
    if (bucket.positions === 0) {
      bucket.marketValue = null;
      bucket.calculationStatus = "BLOCKED";
    }
  }

  return summary;
}
