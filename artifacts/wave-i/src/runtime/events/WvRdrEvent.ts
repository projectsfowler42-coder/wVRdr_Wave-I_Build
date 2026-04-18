import type { TruthClass } from "@/runtime/truth/TruthEnvelope";

export type WvRdrActor = "operator" | "system" | "adapter";

export type WaveIContainerCode = "|W|" | "|M|" | "[B]" | "[G]";

export type BaseEvent = {
  eventId: string;
  eventType: string;
  occurredAt: string;
  recordedAt: string;
  actor: WvRdrActor;
  schemaVersion: string;
  truthClass?: TruthClass;
  sourceRefs?: string[];
};

export type MarketSnapshotEvent = BaseEvent & {
  eventType: "MARKET_SNAPSHOT";
  symbol: string;
  priceUsd: number | null;
};

export type QuoteResolutionEvent = BaseEvent & {
  eventType: "QUOTE_RESOLUTION";
  symbol: string;
  selectedSourceId: string;
  rejectedSourceIds: string[];
};

export type HoldingChangeEvent = BaseEvent & {
  eventType: "HOLDING_CHANGE";
  holdingId: string;
  ticker: string;
  changeType: "CREATE" | "UPDATE" | "DELETE";
};

export type DistributionEvent = BaseEvent & {
  eventType: "DISTRIBUTION";
  holdingId: string;
  ticker: string;
  amountUsd: number;
  exDate?: string;
  payDate?: string;
};

export type WalletFlowEvent = BaseEvent & {
  eventType: "WALLET_FLOW";
  sourceContainer: WaveIContainerCode;
  destinationContainer: WaveIContainerCode;
  amountUsd: number;
  reason: string;
  ruleId: string;
  operatorOverride?: {
    enabled: boolean;
    reason?: string;
  };
};

export type ProbeOpenEvent = BaseEvent & {
  eventType: "PROBE_OPEN";
  probeId: string;
  walletCode: WaveIContainerCode;
  sizeUsd: number;
};

export type ProbeCloseEvent = BaseEvent & {
  eventType: "PROBE_CLOSE";
  probeId: string;
  walletCode: WaveIContainerCode;
  netPnlUsd: number;
};

export type TacticalShotEvent = BaseEvent & {
  eventType: "TACTICAL_SHOT";
  shotId: string;
  walletCode: WaveIContainerCode;
  sizeUsd: number;
  permitted: boolean;
  blockedReason?: string;
};

export type SimRunEvent = BaseEvent & {
  eventType: "SIM_RUN";
  simId: string;
  pathRowCount: number;
  trustedMetricEnabled: boolean;
};

export type ConfidenceChangeEvent = BaseEvent & {
  eventType: "CONFIDENCE_CHANGE";
  subjectId: string;
  previousConfidence: number;
  nextConfidence: number;
  reason: string;
};

export type OperatorOverrideEvent = BaseEvent & {
  eventType: "OPERATOR_OVERRIDE";
  subjectId: string;
  reason: string;
};

export type QuarantineEvent = BaseEvent & {
  eventType: "QUARANTINE";
  subjectId: string;
  reason: string;
  released: boolean;
};

export type WvRdrEvent =
  | MarketSnapshotEvent
  | QuoteResolutionEvent
  | HoldingChangeEvent
  | DistributionEvent
  | WalletFlowEvent
  | ProbeOpenEvent
  | ProbeCloseEvent
  | TacticalShotEvent
  | SimRunEvent
  | ConfidenceChangeEvent
  | OperatorOverrideEvent
  | QuarantineEvent;

const LEDGER_STORAGE_KEY = "wvRdr_event_ledger_v1";
const SCHEMA_VERSION = "wvRdr-event-v1";

function createId(prefix: string): string {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

function safeRead(): WvRdrEvent[] {
  try {
    if (typeof localStorage === "undefined") return [];
    const raw = localStorage.getItem(LEDGER_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function safeWrite(events: WvRdrEvent[]): void {
  try {
    if (typeof localStorage !== "undefined") {
      localStorage.setItem(LEDGER_STORAGE_KEY, JSON.stringify(events));
    }
  } catch {
    // Ledger write failures must not crash the live shell.
  }
}

export function createBaseEvent(args: {
  eventType: WvRdrEvent["eventType"];
  actor: WvRdrActor;
  truthClass?: TruthClass;
  sourceRefs?: string[];
  occurredAt?: string;
}): BaseEvent {
  const now = new Date().toISOString();
  return {
    eventId: createId(args.eventType),
    eventType: args.eventType,
    occurredAt: args.occurredAt ?? now,
    recordedAt: now,
    actor: args.actor,
    schemaVersion: SCHEMA_VERSION,
    truthClass: args.truthClass,
    sourceRefs: args.sourceRefs,
  };
}

export function appendEvent<T extends WvRdrEvent>(event: T): T {
  const current = safeRead();
  safeWrite([...current, event]);
  return event;
}

export function listEvents(): WvRdrEvent[] {
  return safeRead();
}

export function clearEventLedgerForTestOnly(): void {
  safeWrite([]);
}
