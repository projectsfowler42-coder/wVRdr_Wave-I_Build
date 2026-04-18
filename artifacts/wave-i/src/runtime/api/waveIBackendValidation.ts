import type { HealthCheck, IncomeFact, LiveQuote, PositionMath, WalletFlowRequest, WalletFlowResult } from "@/runtime/api/waveIBackendContracts";

export const LIVE_QUOTE_MAX_AGE_SECONDS = 60;
export const ISSUER_FACT_MAX_AGE_SECONDS = 7 * 24 * 60 * 60;

export function quoteAgeSeconds(observedAt: string | null, now = new Date()): number | null {
  if (!observedAt) return null;
  const observed = new Date(observedAt);
  if (Number.isNaN(observed.getTime())) return null;
  return Math.max(0, Math.floor((now.getTime() - observed.getTime()) / 1000));
}

export function validateLiveQuote(quote: LiveQuote, now = new Date()): LiveQuote {
  const ageSeconds = quoteAgeSeconds(quote.observedAt, now);
  const hasNumericPrice = typeof quote.price === "number" && Number.isFinite(quote.price) && quote.price > 0;
  const tickerMatches = quote.ticker.trim().length > 0;
  const fresh = ageSeconds != null && ageSeconds <= LIVE_QUOTE_MAX_AGE_SECONDS;
  const live = hasNumericPrice && tickerMatches && fresh && quote.connectionStatus === "LIVE";

  if (live) {
    return { ...quote, ageSeconds, truthClass: "RAW_MARKET", connectionStatus: "LIVE" };
  }

  if (hasNumericPrice && ageSeconds != null) {
    return {
      ...quote,
      ageSeconds,
      truthClass: "UNRESOLVED",
      connectionStatus: fresh ? "DEGRADED" : "STALE",
    };
  }

  return { ...quote, ageSeconds, price: null, truthClass: "FAILED", connectionStatus: "FAILED" };
}

export function validateIncomeFact(fact: IncomeFact, now = new Date()): IncomeFact {
  const ageSeconds = quoteAgeSeconds(fact.observedAt, now);
  const fresh = ageSeconds != null && ageSeconds <= ISSUER_FACT_MAX_AGE_SECONDS;

  if (fact.source === "issuer" && fresh) {
    return { ...fact, truthClass: "RAW_OFFICIAL" };
  }

  if (fact.source === "operator") {
    return { ...fact, truthClass: "RAW_USER" };
  }

  if (fact.source === "exchange" || !fresh) {
    return { ...fact, truthClass: "UNRESOLVED" };
  }

  return { ...fact, truthClass: "FAILED" };
}

export function blockPositionMathIfInputsWeak(math: PositionMath, quote: LiveQuote | null): PositionMath {
  if (!quote || quote.connectionStatus !== "LIVE" || quote.truthClass !== "RAW_MARKET" || quote.price == null) {
    return {
      ...math,
      livePrice: quote?.price ?? null,
      marketValue: null,
      unrealizedDollar: null,
      unrealizedPct: null,
      allocationPct: null,
      calculationStatus: "BLOCKED",
      blockedReason: "required live price is stale, failed, missing, or unresolved",
      truthClass: "UNRESOLVED",
    };
  }

  return { ...math, calculationStatus: "VALID", truthClass: "TRANSFORMED" };
}

export function validateWalletFlowRequest(request: WalletFlowRequest, sourceBalance: number): WalletFlowResult {
  const base = {
    sourceBalanceBefore: sourceBalance,
    sourceBalanceAfter: null,
    destinationBalanceBefore: 0,
    destinationBalanceAfter: null,
    ruleId: `WAVE_I_WALLET_FLOW_${request.reason}`,
    truthClass: "TRANSFORMED" as const,
  };

  if (!request.operatorConfirmed) {
    return { ...base, allowed: false, blockedReason: "operator confirmation required before wallet movement" };
  }

  if (!Number.isFinite(request.amount) || request.amount <= 0) {
    return { ...base, allowed: false, blockedReason: "wallet flow amount must be positive and finite" };
  }

  if (request.amount > sourceBalance) {
    return { ...base, allowed: false, blockedReason: "wallet flow would create a negative source balance" };
  }

  return {
    ...base,
    allowed: true,
    sourceBalanceAfter: sourceBalance - request.amount,
    destinationBalanceAfter: request.amount,
  };
}

export function deriveHealthStatus(health: HealthCheck): HealthCheck["status"] {
  if (health.quoteFeed.status === "FAILED" || health.storage.status === "FAILED") return "FAILED";
  if (health.quoteFeed.status === "DEGRADED" || health.issuerFacts.status === "DEGRADED") return "DEGRADED";
  return "OK";
}
