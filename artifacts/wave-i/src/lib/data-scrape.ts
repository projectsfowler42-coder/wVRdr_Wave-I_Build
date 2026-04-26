import type { CapitalSummary } from "@/lib/capital-summary";
import type { Quote, QuoteRefreshStatus } from "@/lib/market";
import type { Holding } from "@/lib/portfolio";

const CAPTURE_KEY = "wavei_war_room_capture_v1";
const CAPTURE_HISTORY_KEY = "wavei_war_room_capture_history_v1";
const MAX_CAPTURE_HISTORY = 12;

export type DataScrapeBridgeStatus = "DB_READY_LOCAL_ONLY" | "CAPTURE_FAILED";

export interface WarRoomCapture {
  readonly schema: "wavei.war_room.capture.v1";
  readonly capturedAt: string;
  readonly sourceId: "WAVEI_WAR_ROOM_LOCAL_BRIDGE";
  readonly bridgeStatus: DataScrapeBridgeStatus;
  readonly readinessState: string;
  readonly refreshState: string;
  readonly holdings: Holding[];
  readonly quotesByTicker: Record<string, Quote | undefined>;
  readonly refreshStatuses: QuoteRefreshStatus[];
  readonly capitalSummary: CapitalSummary;
}

export interface CaptureInput {
  readonly readinessState: string;
  readonly refreshState: string;
  readonly holdings: Holding[];
  readonly quotesByTicker: Record<string, Quote | undefined>;
  readonly refreshStatuses: QuoteRefreshStatus[];
  readonly capitalSummary: CapitalSummary;
}

function safeGet(key: string): string | null {
  try {
    return typeof localStorage === "undefined" ? null : localStorage.getItem(key);
  } catch {
    return null;
  }
}

function safeSet(key: string, value: string): boolean {
  try {
    if (typeof localStorage === "undefined") return false;
    localStorage.setItem(key, value);
    return true;
  } catch {
    return false;
  }
}

function readHistory(): WarRoomCapture[] {
  const raw = safeGet(CAPTURE_HISTORY_KEY);
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw) as WarRoomCapture[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function loadLatestWarRoomCapture(): WarRoomCapture | null {
  const raw = safeGet(CAPTURE_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as WarRoomCapture;
  } catch {
    return null;
  }
}

export function listWarRoomCaptureHistory(): WarRoomCapture[] {
  return readHistory();
}

export function captureWarRoomSnapshot(input: CaptureInput): WarRoomCapture {
  const capture: WarRoomCapture = {
    schema: "wavei.war_room.capture.v1",
    capturedAt: new Date().toISOString(),
    sourceId: "WAVEI_WAR_ROOM_LOCAL_BRIDGE",
    bridgeStatus: "DB_READY_LOCAL_ONLY",
    readinessState: input.readinessState,
    refreshState: input.refreshState,
    holdings: input.holdings,
    quotesByTicker: input.quotesByTicker,
    refreshStatuses: input.refreshStatuses,
    capitalSummary: input.capitalSummary,
  };

  const persisted = safeSet(CAPTURE_KEY, JSON.stringify(capture));
  if (!persisted) return { ...capture, bridgeStatus: "CAPTURE_FAILED" };

  const history = [capture, ...readHistory()].slice(0, MAX_CAPTURE_HISTORY);
  safeSet(CAPTURE_HISTORY_KEY, JSON.stringify(history));
  return capture;
}
