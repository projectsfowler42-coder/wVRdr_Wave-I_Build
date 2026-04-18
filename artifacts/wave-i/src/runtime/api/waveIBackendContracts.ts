import type { TruthClass } from "@/runtime/truth/TruthEnvelope";
import type { WaveIContainerCode } from "@/runtime/events/WvRdrEvent";

export type ConnectionStatus = "LIVE" | "DEGRADED" | "STALE" | "FAILED";
export type HealthStatus = "OK" | "DEGRADED" | "FAILED";
export type CalculationStatus = "VALID" | "BLOCKED";
export type WalletStatus = "NORMAL" | "WATCH" | "BREACH" | "OVER_TARGET" | "UNDER_TARGET";

export type LiveQuote = {
  ticker: string;
  price: number | null;
  previousClose: number | null;
  changeDollar: number | null;
  changePct: number | null;
  open: number | null;
  dayHigh: number | null;
  dayLow: number | null;
  volume: number | null;
  observedAt: string | null;
  source: string;
  connectionStatus: ConnectionStatus;
  ageSeconds: number | null;
  truthClass: "RAW_MARKET" | "UNRESOLVED" | "FAILED";
};

export type IncomeFact = {
  ticker: string;
  secYieldPct: number | null;
  distributionYieldPct: number | null;
  trailingDistributionPct: number | null;
  nextExDate: string | null;
  nextPayDate: string | null;
  payoutFrequency: "monthly" | "quarterly" | "unknown";
  source: "issuer" | "exchange" | "operator" | "unavailable";
  sourceUrl?: string;
  observedAt: string | null;
  truthClass: "RAW_OFFICIAL" | "RAW_USER" | "UNRESOLVED" | "FAILED";
};

export type BackendHolding = {
  id: string;
  ticker: string;
  container: WaveIContainerCode;
  shares: number;
  costBasisPerShare: number;
  entryDate: string;
  operatorNotes?: string;
  truthClass: "RAW_USER";
  updatedAt: string;
};

export type PositionMath = {
  ticker: string;
  container: WaveIContainerCode;
  shares: number;
  livePrice: number | null;
  marketValue: number | null;
  costBasis: number;
  unrealizedDollar: number | null;
  unrealizedPct: number | null;
  allocationPct: number | null;
  expectedAnnualIncomeDollar: number | null;
  expectedAnnualIncomePct: number | null;
  daysToExDate: number | null;
  daysToPayDate: number | null;
  calculationStatus: CalculationStatus;
  blockedReason?: string;
  inputs: string[];
  truthClass: "TRANSFORMED" | "UNRESOLVED";
};

export type HealthCheck = {
  status: HealthStatus;
  checkedAt: string;
  quoteFeed: {
    status: HealthStatus;
    latencyMs: number | null;
    lastSuccessAt: string | null;
    failedTickers: string[];
  };
  issuerFacts: {
    status: HealthStatus;
    lastSuccessAt: string | null;
    unresolvedTickers: string[];
  };
  storage: {
    status: "OK" | "FAILED";
    lastWriteAt: string | null;
  };
};

export type WalletState = {
  container: WaveIContainerCode;
  targetDollar: number | null;
  currentDollar: number;
  currentPct: number | null;
  targetPct: number | null;
  deltaDollar: number | null;
  deltaPct: number | null;
  status: WalletStatus;
  truthClass: "TRANSFORMED";
  inputs: string[];
};

export type WalletFlowReason =
  | "DIVIDEND_TO_MINT"
  | "EXCESS_TO_MINT"
  | "MINT_TO_GREEN_DIP"
  | "WHITE_TO_BLUE_STABILIZE"
  | "BLUE_REPAIR"
  | "OPERATOR_ADJUSTMENT";

export type WalletFlowRequest = {
  source: WaveIContainerCode;
  destination: WaveIContainerCode;
  amount: number;
  reason: WalletFlowReason;
  operatorConfirmed: boolean;
};

export type WalletFlowResult = {
  allowed: boolean;
  blockedReason?: string;
  eventId?: string;
  sourceBalanceBefore: number;
  sourceBalanceAfter: number | null;
  destinationBalanceBefore: number;
  destinationBalanceAfter: number | null;
  ruleId: string;
  truthClass: "TRANSFORMED";
};

export const WAVE_I_API_ROUTES = [
  "GET /api/wave-i/health",
  "GET /api/wave-i/live-quotes",
  "GET /api/wave-i/income-facts",
  "GET /api/wave-i/holdings",
  "POST /api/wave-i/holdings",
  "GET /api/wave-i/position-math",
  "GET /api/wave-i/wallet-state",
  "POST /api/wave-i/wallet-flow",
] as const;

export type WaveIApiRoute = typeof WAVE_I_API_ROUTES[number];

export function isAuthoritativeBackendTruth(truthClass: TruthClass | "FAILED"): boolean {
  return truthClass === "RAW_MARKET" || truthClass === "RAW_OFFICIAL" || truthClass === "RAW_USER" || truthClass === "TRANSFORMED";
}
