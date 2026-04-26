import { enforceTruthSpine, TruthClass, type TruthEnvelope } from "@/contracts/truth.contract";
import type { CapitalSummary } from "@/lib/capital-summary";
import type { Quote, QuoteRefreshStatus } from "@/lib/market";
import type { Holding } from "@/lib/portfolio";

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
  readonly action: "APPEND_ROWS";
  readonly spreadsheet: "WaveRider_Archive";
  readonly sheet: "Telemetry_Logs";
  readonly data: Array<[string, string, number, string, TruthClass, string, number]>;
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

export const captureToGoogleSheets = async (
  telemetry: Record<string, TelemetryEnvelope>,
): Promise<GoogleSheetsAppendPayload> => {
  const sheetName = "Telemetry_Logs";

  const rows: ScrapePayload[] = Object.entries(telemetry).map(([label, env]) => ({
    timestamp: new Date(env.timestamp).toISOString(),
    ticker: label,
    value: env.value,
    movement: normalizeMovement(env.movementPercent),
    truth_class: normalizeTruth(env),
    source_id: env.sourceId,
    age_seconds: Math.floor((Date.now() - env.timestamp) / 1000),
  }));

  console.log("[ACTION] Data Scrape initiated for Google Sheets...");

  return {
    action: "APPEND_ROWS",
    spreadsheet: "WaveRider_Archive",
    sheet: sheetName,
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
};

export function buildWarRoomTelemetry(input: CaptureInput): Record<string, TelemetryEnvelope> {
  const now = Date.now();
  const telemetry: Record<string, TelemetryEnvelope> = {
    "Total capital": {
      value: input.capitalSummary.currentMarketValue ?? input.capitalSummary.deployedCostBasis,
      sourceId: "WAR_ROOM_CAPITAL_SUMMARY",
      timestamp: now,
      truthClass: input.refreshStatuses.some((status) => status.connectionStatus === "FAILED")
        ? TruthClass.DEGRADED
        : TruthClass.LIVE,
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
      truthClass: input.capitalSummary.currentMarketValue == null ? TruthClass.STALE : TruthClass.LIVE,
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
      truthClass: input.refreshStatuses.some((status) => status.connectionStatus === "FAILED")
        ? TruthClass.DEGRADED
        : TruthClass.LIVE,
      movementPercent: 0,
    },
    "Quote coverage": {
      value: input.holdings.length > 0
        ? (input.holdings.filter((holding) => Boolean(input.quotesByTicker[holding.ticker])).length / input.holdings.length) * 100
        : 0,
      sourceId: "WAR_ROOM_QUOTE_COVERAGE",
      timestamp: now,
      truthClass: input.holdings.length === 0 ? TruthClass.STALE : TruthClass.LIVE,
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
  return null;
}

export function listWarRoomCaptureHistory(): WarRoomCapture[] {
  return [];
}
