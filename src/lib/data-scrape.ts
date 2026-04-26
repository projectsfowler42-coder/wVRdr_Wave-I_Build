import { ageSeconds, enforceTruthSpine, TruthClass, type TruthEnvelope } from "../contracts/truth.contract";

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
    truth_class: enforceTruthSpine(env),
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
  return payload;
};
