export type DataMode = "mock" | "manual" | "csv" | "api";

export interface AccountBalance {
  id: string;
  name: string;
  institution: string;
  type: "brokerage" | "funding" | "reserve" | "external";
  balance: number;
  availableCash?: number | null;
  asOf: string;
  notes?: string;
}

export interface PositionRecord {
  id: string;
  symbol: string;
  quantity: number;
  averageCost: number;
  currentMark: number | null;
  marketValue: number | null;
  unrealizedPL: number | null;
  unrealizedPLPct: number | null;
  asOf: string;
  notes?: string;
}

export interface TransferRecord {
  id: string;
  label: string;
  amount: number;
  direction: "inbound" | "outbound";
  status: "pending" | "scheduled" | "settling" | "completed" | "held";
  expectedDate: string | null;
  holdReleaseDate: string | null;
  notes?: string;
}

export interface DailySnapshot {
  id: string;
  timestamp: string;
  totalFUM: number;
  settledCash: number;
  positionValue: number;
  unrealizedPL: number;
  fundingBalances: number;
  transfersInFlight: number;
  notes?: string;
}

export interface CalendarEventRecord {
  id: string;
  title: string;
  kind: "dividend" | "transfer" | "settlement" | "review" | "notice" | "custom";
  date: string;
  level: "info" | "watch" | "urgent";
  notes?: string;
}

export interface AlertRecord {
  id: string;
  title: string;
  level: "info" | "watch" | "urgent";
  message: string;
  createdAt: string;
  dismissedAt?: string | null;
}

export interface OperatorNoteRecord {
  id: string;
  createdAt: string;
  text: string;
  pinned?: boolean;
  reminderDate?: string | null;
}

export interface PositionCsvRow {
  symbol?: string;
  ticker?: string;
  quantity?: string;
  qty?: string;
  averageCost?: string;
  avgCost?: string;
  currentMark?: string;
  mark?: string;
  notes?: string;
}

export interface AccountsCsvRow {
  name?: string;
  institution?: string;
  type?: string;
  balance?: string;
  availableCash?: string;
  notes?: string;
}

export interface ExportBundle {
  version: string;
  exportedAt: string;
  mode: DataMode;
  accounts: AccountBalance[];
  positions: PositionRecord[];
  snapshots: DailySnapshot[];
  transfers: TransferRecord[];
  calendarEvents: CalendarEventRecord[];
  alerts: AlertRecord[];
  notes: OperatorNoteRecord[];
}

export interface DataProvider {
  mode: DataMode;
  getAccounts(): Promise<AccountBalance[]>;
  getPositions(): Promise<PositionRecord[]>;
  getSnapshots(): Promise<DailySnapshot[]>;
  getTransfers(): Promise<TransferRecord[]>;
  getCalendarEvents(): Promise<CalendarEventRecord[]>;
  getAlerts(): Promise<AlertRecord[]>;
  getNotes(): Promise<OperatorNoteRecord[]>;
  saveSnapshot(snapshot: DailySnapshot): Promise<DailySnapshot>;
  saveNote(note: OperatorNoteRecord): Promise<OperatorNoteRecord>;
  importCsv(input: {
    kind: "positions" | "accounts";
    text: string;
  }): Promise<{ imported: number; rejected: number; errors: string[] }>;
  exportData(): Promise<ExportBundle>;
}
