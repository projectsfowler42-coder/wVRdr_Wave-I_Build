import type { Quote } from "@/lib/market";

export type QuoteCalculationStatus = "VALID" | "DEGRADED" | "BLOCKED";

export function classifyQuoteForCalculation(quote?: Quote | null): QuoteCalculationStatus {
  if (!quote || quote.price == null || quote.connectionStatus === "FAILED" || quote.truthClass === "FAILED") {
    return "BLOCKED";
  }

  if (quote.connectionStatus === "LIVE" && quote.truthClass === "RAW_MARKET") {
    return "VALID";
  }

  return "DEGRADED";
}

export function blockedQuoteReason(quote?: Quote | null): string | undefined {
  if (!quote) return "missing quote input";
  if (quote.price == null) return "missing quote price";
  if (quote.connectionStatus === "FAILED") return "quote connection failed";
  if (quote.truthClass === "FAILED") return "quote truth class failed";
  return undefined;
}

export function quoteAllowsMath(quote?: Quote | null): boolean {
  return classifyQuoteForCalculation(quote) !== "BLOCKED";
}

export function quoteCalculationInput(quote?: Quote | null): string {
  if (!quote) return "quote:missing";
  return [
    `quote:${quote.symbol}`,
    `status:${quote.connectionStatus}`,
    `truth:${quote.truthClass}`,
    `source:${quote.source}`,
    `observedAt:${quote.observedAt ?? "missing"}`,
  ].join("|");
}
