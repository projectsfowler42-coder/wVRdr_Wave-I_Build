import type { Holding, ActiveContainerClass } from "@/lib/portfolio";
import type { Quote } from "@/lib/market";
import { ACTIVE_CONTAINERS } from "@/lib/containerModel";

export interface CapitalSummary {
  holdingsCount: number;
  deployedCostBasis: number;
  currentMarketValue: number | null;
  unrealizedGL: number | null;
  unrealizedGLPct: number | null;
  dividendCollected: number;
  expectedAnnualIncome: number;
  dripBudget: number;
  byContainer: Record<ActiveContainerClass, {
    positions: number;
    costBasis: number;
    marketValue: number | null;
    dividendCollected: number;
    expectedAnnualIncome: number;
  }>;
}

function emptyContainerSummary() {
  return {
    positions: 0,
    costBasis: 0,
    marketValue: null as number | null,
    dividendCollected: 0,
    expectedAnnualIncome: 0,
  };
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
    byContainer: {
      WHITE: emptyContainerSummary(),
      MINT: emptyContainerSummary(),
      BLUE: emptyContainerSummary(),
      GREEN: emptyContainerSummary(),
    },
  };
}

function calcHoldingCostBasis(holding: Holding): number {
  return holding.shares * holding.entryPrice;
}

function calcHoldingMarketValue(holding: Holding, quote?: Quote | null): number | null {
  if (quote?.price == null) return null;
  return holding.shares * quote.price;
}

export function buildCapitalSummary(
  holdings: Holding[],
  quotesByTicker: Record<string, Quote | undefined>,
): CapitalSummary {
  const summary = createEmptyCapitalSummary();
  summary.holdingsCount = holdings.length;

  for (const holding of holdings) {
    const costBasis = calcHoldingCostBasis(holding);
    const marketValue = calcHoldingMarketValue(holding, quotesByTicker[holding.ticker]);
    const bucket = summary.byContainer[holding.container];

    summary.deployedCostBasis += costBasis;
    summary.dividendCollected += holding.dividendCollected;
    summary.expectedAnnualIncome += holding.expectedIncome;
    summary.dripBudget += holding.dripAmount;

    bucket.positions += 1;
    bucket.costBasis += costBasis;
    bucket.dividendCollected += holding.dividendCollected;
    bucket.expectedAnnualIncome += holding.expectedIncome;

    if (marketValue != null) {
      bucket.marketValue = (bucket.marketValue ?? 0) + marketValue;
      summary.currentMarketValue = (summary.currentMarketValue ?? 0) + marketValue;
    }
  }

  if (summary.currentMarketValue != null) {
    summary.unrealizedGL = summary.currentMarketValue - summary.deployedCostBasis;
    summary.unrealizedGLPct =
      summary.deployedCostBasis > 0
        ? (summary.unrealizedGL / summary.deployedCostBasis) * 100
        : null;
  } else {
    summary.unrealizedGL = null;
    summary.unrealizedGLPct = null;
  }

  for (const container of ACTIVE_CONTAINERS) {
    const bucket = summary.byContainer[container];
    if (bucket.positions === 0) bucket.marketValue = null;
  }

  return summary;
}
