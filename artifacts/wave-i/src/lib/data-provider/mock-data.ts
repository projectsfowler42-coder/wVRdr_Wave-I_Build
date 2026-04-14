import type {
  AccountBalance,
  AlertRecord,
  CalendarEventRecord,
  DailySnapshot,
  OperatorNoteRecord,
  PositionRecord,
  TransferRecord,
} from "@/lib/data-provider/types";

const now = new Date().toISOString();

export const mockAccounts: AccountBalance[] = [
  {
    id: "acct-schwab",
    name: "Schwab Core",
    institution: "Schwab",
    type: "brokerage",
    balance: 158240.12,
    availableCash: 18250.44,
    asOf: now,
    notes: "Manual placeholder until broker connector exists.",
  },
  {
    id: "acct-marcus",
    name: "Marcus Reserve",
    institution: "Marcus",
    type: "reserve",
    balance: 27400,
    availableCash: 27400,
    asOf: now,
  },
];

export const mockPositions: PositionRecord[] = [
  {
    id: "pos-bkln",
    symbol: "BKLN",
    quantity: 420,
    averageCost: 20.84,
    currentMark: 20.91,
    marketValue: 8782.2,
    unrealizedPL: 29.4,
    unrealizedPLPct: 0.34,
    asOf: now,
    notes: "Near add band watch.",
  },
  {
    id: "pos-sgov",
    symbol: "SGOV",
    quantity: 300,
    averageCost: 100.12,
    currentMark: 100.19,
    marketValue: 30057,
    unrealizedPL: 21,
    unrealizedPLPct: 0.07,
    asOf: now,
  },
];

export const mockSnapshots: DailySnapshot[] = [
  {
    id: "snap-1",
    timestamp: now,
    totalFUM: 185640.12,
    settledCash: 18250.44,
    positionValue: 163389.68,
    unrealizedPL: 50.4,
    fundingBalances: 27400,
    transfersInFlight: 2500,
    notes: "Mock opening snapshot.",
  },
];

export const mockTransfers: TransferRecord[] = [
  {
    id: "tr-1",
    label: "Marcus → Schwab",
    amount: 2500,
    direction: "inbound",
    status: "pending",
    expectedDate: now.slice(0, 10),
    holdReleaseDate: null,
  },
];

export const mockCalendar: CalendarEventRecord[] = [
  {
    id: "cal-1",
    title: "BKLN pay window",
    kind: "dividend",
    date: now.slice(0, 10),
    level: "watch",
  },
  {
    id: "cal-2",
    title: "Weekly review checkpoint",
    kind: "review",
    date: now.slice(0, 10),
    level: "info",
  },
];

export const mockAlerts: AlertRecord[] = [
  {
    id: "alert-1",
    title: "Refresh pending",
    level: "info",
    message: "Manual refresh has not been run on this mock session yet.",
    createdAt: now,
  },
];

export const mockNotes: OperatorNoteRecord[] = [
  {
    id: "note-1",
    createdAt: now,
    text: "Keep manual entries clean so future API reconciliation is easy.",
    pinned: true,
  },
];
