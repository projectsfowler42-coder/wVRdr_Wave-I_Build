import type { TruthEnvelope } from "@/runtime/truth/TruthEnvelope";

export type SelectedIncomeRule =
  | "operator"
  | "issuer"
  | "trailing"
  | "manual_override"
  | "unresolved";

export type ExpectedIncomeField = {
  operatorEstimate?: TruthEnvelope<number>;
  trailingDistributionDerived?: TruthEnvelope<number>;
  issuerSecYieldDerived?: TruthEnvelope<number>;
  selectedValue: TruthEnvelope<number>;
  selectedRule: SelectedIncomeRule;
  confidence: number;
};

export type CriticalHoldingTruthFields = {
  quote?: TruthEnvelope<number>;
  yield?: TruthEnvelope<number>;
  nextExDate?: TruthEnvelope<string | null>;
  nextPayDate?: TruthEnvelope<string | null>;
  expectedIncome?: ExpectedIncomeField;
  calculatedMarketValue?: TruthEnvelope<number | null>;
  calculatedUnrealizedGainLoss?: TruthEnvelope<number | null>;
};

export function selectExpectedIncome(args: {
  operatorEstimate?: TruthEnvelope<number>;
  trailingDistributionDerived?: TruthEnvelope<number>;
  issuerSecYieldDerived?: TruthEnvelope<number>;
  manualOverride?: TruthEnvelope<number>;
}): ExpectedIncomeField {
  if (args.manualOverride) {
    return {
      operatorEstimate: args.operatorEstimate,
      trailingDistributionDerived: args.trailingDistributionDerived,
      issuerSecYieldDerived: args.issuerSecYieldDerived,
      selectedValue: args.manualOverride,
      selectedRule: "manual_override",
      confidence: 72,
    };
  }

  if (args.issuerSecYieldDerived) {
    return {
      operatorEstimate: args.operatorEstimate,
      trailingDistributionDerived: args.trailingDistributionDerived,
      issuerSecYieldDerived: args.issuerSecYieldDerived,
      selectedValue: args.issuerSecYieldDerived,
      selectedRule: "issuer",
      confidence: 92,
    };
  }

  if (args.trailingDistributionDerived) {
    return {
      operatorEstimate: args.operatorEstimate,
      trailingDistributionDerived: args.trailingDistributionDerived,
      issuerSecYieldDerived: args.issuerSecYieldDerived,
      selectedValue: args.trailingDistributionDerived,
      selectedRule: "trailing",
      confidence: 82,
    };
  }

  if (args.operatorEstimate) {
    return {
      operatorEstimate: args.operatorEstimate,
      trailingDistributionDerived: args.trailingDistributionDerived,
      issuerSecYieldDerived: args.issuerSecYieldDerived,
      selectedValue: args.operatorEstimate,
      selectedRule: "operator",
      confidence: 72,
    };
  }

  return {
    selectedValue: {
      value: 0,
      truthClass: "UNRESOLVED",
      sourceClass: "derived",
      sourceId: "wave-i-income-selector",
      observedAt: new Date().toISOString(),
      adapterVersion: "wave-i-runtime-v1",
      stale: false,
      degraded: true,
      conflicted: false,
      ruleId: "EXPECTED_INCOME_UNRESOLVED",
    },
    selectedRule: "unresolved",
    confidence: 0,
  };
}
