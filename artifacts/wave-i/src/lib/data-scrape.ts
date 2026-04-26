import { ageSeconds, enforceTruthSpine, TruthClass, type TruthEnvelope } from "@/contracts/truth.contract";
import type { CapitalSummary } from "@/lib/capital-summary";
import type { Quote, QuoteRefreshStatus } from "@/lib/market";
import type { Holding } from "@/lib/portfolio";

const WAL_KEY = "wavei_data_scrape_wal_v1";
const MAX_WAL_ENTRIES = 64;

export interface ScrapePayload {
  readonly timestamp: string;
  readonly ticker: string;
  readonly value: number;
  readonly movement: string;
  readonly truth_class: TruthClass;
  readonly source_id: string;
  readonly age_seconds: number;
}

export interface GoogleSheetsAppendPayload {
  readonly schema: "wavei.sheets.append.v1";
  readonly capturedAt: string;
  readonly action: "APPEND_ROWS";
  readonly spreadsheet: "WaveRider_Archive";
  readonly sheet: "Telemetry_Logs";
  readonly headers: readonly ["Timestamp", "Ticker", "Value", "Movement", "Truth Class", "Source ID", "Age (Seconds)"];
  readonly data: Array<[string, string, number, string, TruthClass, string, number]>;
}

export interface WalEntry {
  readonly id: string;
  readonly payload: GoogleSheetsAppendPayload;
  readonly status: "BUFFERED" | "READY_FOR_CONNECTOR" | "FLUSHED";
  readonly createdAt: string;
}

export type WarRoomCapture = GoogleSheetsAppendPayload;

export interface CaptureInput {
  readonly readinessState: string;
  readonly refreshState: string;
  readonly holdings: Holding[];
  readonly quotesByTicker: Record<string, Quote | undefined>;
  readonly refreshStatuses: QuoteRefreshStatus[];
  readonly capitalSummary: CapitalSummary;
}

type TelemetryEnvelope = TruthEnvelope<number> & {
  readonly movementPercent?: number | string | null;
};

const HEADERS = ["Timestamp", "Ticker", "Value", "Movement", "Truth Class", "Source ID", "Age (Seconds)"] as const;

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

function readWal(): WalEntry[] {
  const raw = safeGet(WAL_KEY);
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw) as WalEntry[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeWal(entries: WalEntry[]): void {
  safeSet(WAL_KEY, JSON.stringify(entries.slice(0, MAX_WAL_ENTRIES)));
}

function createWalId(payload: GoogleSheetsAppendPayload): string {
  return `${payload.capturedAt}:${payload.data.length}:${payload.data[0]?.[1] ?? "EMPTY"}`;
}

function normalizeMovement(value: number | string | null | undefined): string {
  if (typeof value === "number" && Number.isFinite(value)) return `${value.toFixed(2)}%`;
  if (typeof value === "string" && value.trim() !== "") return value;
  return "0.00%";
}

function normalizeTruth(env: TruthEnvelope<number>): TruthClass {
  return enforceTruthSpine(env);
}

function quoteTruthClass(quote?: Quote): TruthClass {
  if (!quote) return TruthClass.FAILED;
  if (quote.connectionStatus === "LIVE") return TruthClass.LIVE;
  if (quote.connectionStatus === "DEGRADED") return TruthClass.DEGRADED;
  if (quote.connectionStatus === "STALE") return TruthClass.STALE;
  return TruthClass.FAILED;
}

export function listDataScrapeWal(): WalEntry[] {
  return readWal();
}

export function clearDataScrapeWal(): void {
  writeWal([]);
}

export function markDataScrapeWalFlushed(id: string): void {
  writeWal(readWal().map((entry) => entry.id === id ? { ...entry, status: "FLUSHED" } : entry));
}

export function bufferGoogleSheetsPayload(payload: GoogleSheetsAppendPayload): WalEntry {
  const entry: WalEntry = {
    id: createWalId(payload),
    payload,
    status: "READY_FOR_CONNECTOR",
    createdAt: new Date().toISOString(),
  };
  writeWal([entry, ...readWal().filter((existing) => existing.id !== entry.id)]);
  return entry;
}

export const captureToGoogleSheets = async (
  telemetry: Record<string, TelemetryEnvelope>,
): Promise<GoogleSheetsAppendPayload> => {
  const capturedAt = new Date().toISOString();
  const rows: ScrapePayload[] = Object.entries(telemetry).map(([label, env]) => ({
    timestamp: new Date(env.timestamp).toISOString(),
    ticker: label,
    value: env.value,
    movement: normalizeMovement(env.movementPercent),
    truth_class: normalizeTruth(env),
    source_id: env.sourceId,
    age_seconds: ageSeconds(env.timestamp),
  }));

  const payload: GoogleSheetsAppendPayload = {
    schema: "wavei.sheets.append.v1",
    capturedAt,
    action: "APPEND_ROWS",
    spreadsheet: "WaveRider_Archive",
    sheet: "Telemetry_Logs",
    headers: HEADERS,
    data: rows.map((row) => [
      row.timestamp,
      row.ticker,
      row.value,
      row.movement,
      row.truth_class,
      row.source_id,
      row.age_seconds,
    ]),
  };

  bufferGoogleSheetsPayload(payload);
  console.log("[ACTION] Data Scrape buffered for Google Sheets WAL", payload);
  return payload;
};

export function executeRobustScrape(telemetry: Record<string, TelemetryEnvelope>): Promise<GoogleSheetsAppendPayload> {
  return captureToGoogleSheets(telemetry);
}

export function buildWarRoomTelemetry(input: CaptureInput): Record<string, TelemetryEnvelope> {
  const now = Date.now();
  const failed = input.refreshStatuses.some((status) => status.connectionStatus === "FAILED");
  const stale = input.refreshStatuses.some((status) => status.connectionStatus === "STALE");
  const degraded = input.refreshStatuses.some((status) => status.connectionStatus === "DEGRADED");
  const aggregateTruth = failed ? TruthClass.FAILED : stale ? TruthClass.STALE : degraded ? TruthClass.DEGRADED : TruthClass.LIVE;

  const telemetry: Record<string, TelemetryEnvelope> = {
    "Total capital": {
      value: input.capitalSummary.currentMarketValue ?? input.capitalSummary.deployedCostBasis,
      sourceId: "WAR_ROOM_CAPITAL_SUMMARY",
      timestamp: now,
      truthClass: aggregateTruth,
      movementPercent: input.capitalSummary.unrealizedGLPct,
    },
    "Deployed": {
      value: input.capitalSummary.deployedCostBasis,
      sourceId: "WAR_ROOM_DEPLOYED_COST_BASIS",
      timestamp: now,
      truthClass: TruthClass.LIVE,
      movementPercent: 0,
    },
    "Unrealized": {
      value: input.capitalSummary.unrealizedGL ?? 0,
      sourceId: "WAR_ROOM_UNREALIZED_GL",
      timestamp: now,
      truthClass: input.capitalSummary.currentMarketValue == null ? TruthClass.STALE : aggregateTruth,
      movementPercent: input.capitalSummary.unrealizedGLPct,
    },
    "Cash / reserve": {
      value: 0,
      sourceId: "WAR_ROOM_MANUAL_RESERVE_EXCLUDED",
      timestamp: now,
      truthClass: TruthClass.STALE,
      movementPercent: 0,
    },
    "Refresh issues": {
      value: input.refreshStatuses.filter((status) => status.status !== "refreshed").length,
      sourceId: "WAR_ROOM_REFRESH_STATUS",
      timestamp: now,
      truthClass: aggregateTruth,
      movementPercent: 0,
    },
    "Quote coverage": {
      value: input.holdings.length > 0
        ? (input.holdings.filter((holding) => Boolean(input.quotesByTicker[holding.ticker])).length / input.holdings.length) * 100
        : 0,
      sourceId: "WAR_ROOM_QUOTE_COVERAGE",
      timestamp: now,
      truthClass: input.holdings.length === 0 ? TruthClass.STALE : aggregateTruth,
      movementPercent: 0,
    },
    "Holdings count": {
      value: input.holdings.length,
      sourceId: "WAR_ROOM_HOLDINGS_COUNT",
      timestamp: now,
      truthClass: TruthClass.LIVE,
      movementPercent: 0,
    },
  };

  input.holdings.forEach((holding) => {
    const quote = input.quotesByTicker[holding.ticker];
    telemetry[holding.ticker] = {
      value: quote?.price ?? holding.entryPrice,
      sourceId: quote?.source ?? "WAR_ROOM_POSITION_FALLBACK",
      timestamp: quote?.timestamp && quote.timestamp > 0 ? quote.timestamp : now,
      truthClass: quoteTruthClass(quote),
      movementPercent: quote?.changePct ?? 0,
    };
  });

  return telemetry;
}

export async function captureWarRoomSnapshot(input: CaptureInput): Promise<GoogleSheetsAppendPayload> {
  return captureToGoogleSheets(buildWarRoomTelemetry(input));
}

export function loadLatestWarRoomCapture(): WarRoomCapture | null {
  return readWal()[0]?.payload ?? null;
}

export function listWarRoomCaptureHistory(): WarRoomCapture[] {
  return readWal().map((entry) => entry.payload);
}
