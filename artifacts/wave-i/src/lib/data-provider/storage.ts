import type {
  AccountBalance,
  AlertRecord,
  CalendarEventRecord,
  DailySnapshot,
  DataMode,
  OperatorNoteRecord,
  PositionRecord,
  TransferRecord,
} from "@/lib/data-provider/types";

const PREFIX = "wavei_dp_v1";

function key(name: string): string {
  return `${PREFIX}:${name}`;
}

function readJson<T>(name: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key(name));
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function writeJson<T>(name: string, value: T): void {
  localStorage.setItem(key(name), JSON.stringify(value));
}

export function getStoredMode(): DataMode {
  const raw = readJson<DataMode | null>("mode", null);
  return raw === "mock" || raw === "manual" || raw === "csv" || raw === "api" ? raw : "manual";
}

export function setStoredMode(mode: DataMode): void {
  writeJson("mode", mode);
}

export function readAccounts(): AccountBalance[] {
  return readJson<AccountBalance[]>("accounts", []);
}

export function writeAccounts(items: AccountBalance[]): void {
  writeJson("accounts", items);
}

export function readPositions(): PositionRecord[] {
  return readJson<PositionRecord[]>("positions", []);
}

export function writePositions(items: PositionRecord[]): void {
  writeJson("positions", items);
}

export function readSnapshots(): DailySnapshot[] {
  return readJson<DailySnapshot[]>("snapshots", []);
}

export function writeSnapshots(items: DailySnapshot[]): void {
  writeJson("snapshots", items);
}

export function readTransfers(): TransferRecord[] {
  return readJson<TransferRecord[]>("transfers", []);
}

export function writeTransfers(items: TransferRecord[]): void {
  writeJson("transfers", items);
}

export function readCalendarEvents(): CalendarEventRecord[] {
  return readJson<CalendarEventRecord[]>("calendar", []);
}

export function writeCalendarEvents(items: CalendarEventRecord[]): void {
  writeJson("calendar", items);
}

export function readAlerts(): AlertRecord[] {
  return readJson<AlertRecord[]>("alerts", []);
}

export function writeAlerts(items: AlertRecord[]): void {
  writeJson("alerts", items);
}

export function readNotes(): OperatorNoteRecord[] {
  return readJson<OperatorNoteRecord[]>("notes", []);
}

export function writeNotes(items: OperatorNoteRecord[]): void {
  writeJson("notes", items);
}
