import { appendEvent, createBaseEvent, type WalletFlowEvent, type WaveIContainerCode } from "@/runtime/events/WvRdrEvent";
import type { TruthClass } from "@/runtime/truth/TruthEnvelope";

export type WalletFlowInput = {
  source: WaveIContainerCode;
  destination: WaveIContainerCode;
  amount: number;
  reason: string;
  ruleId: string;
  operatorOverride?: boolean;
  truthClass: TruthClass;
  notes?: string;
};

export function recordWalletFlow(input: WalletFlowInput): WalletFlowEvent {
  if (!Number.isFinite(input.amount) || input.amount <= 0) {
    throw new Error("WalletFlowEvent amount must be a positive finite number.");
  }

  const base = createBaseEvent({
    eventType: "WALLET_FLOW",
    actor: input.operatorOverride ? "operator" : "system",
    truthClass: input.truthClass,
  });

  return appendEvent({
    ...base,
    eventType: "WALLET_FLOW",
    timestamp: base.occurredAt,
    source: input.source,
    destination: input.destination,
    amount: input.amount,
    reason: input.reason,
    ruleId: input.ruleId,
    operatorOverride: input.operatorOverride ?? false,
    truthClass: input.truthClass,
    notes: input.notes,
  });
}
