export interface TreasuryState {
  cash: number;
  reserve: number;
  updatedAt: string | null;
}

export interface TransferRecord {
  id: string;
  amount: number;
  direction: "into-market" | "out-of-market" | "cash-to-reserve" | "reserve-to-cash";
  note: string;
  occurredAt: string;
}

const STORAGE_KEY = "wavei_treasury_v1";

const DEFAULT_TREASURY_STATE: TreasuryState = {
  cash: 0,
  reserve: 0,
  updatedAt: null,
};

function safeStorageGet(key: string): string | null {
  try {
    return typeof localStorage === "undefined" ? null : localStorage.getItem(key);
  } catch {
    return null;
  }
}

function safeStorageSet(key: string, value: string): void {
  try {
    if (typeof localStorage !== "undefined") {
      localStorage.setItem(key, value);
    }
  } catch {
    // Ignore browser storage failures.
  }
}

function asNumber(value: unknown): number {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim() !== "") {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) return parsed;
  }
  return 0;
}

function normalizeTreasuryState(input?: Partial<TreasuryState> | null): TreasuryState {
  return {
    cash: asNumber(input?.cash),
    reserve: asNumber(input?.reserve),
    updatedAt: typeof input?.updatedAt === "string" && input.updatedAt ? input.updatedAt : null,
  };
}

export function loadTreasuryState(): TreasuryState {
  const raw = safeStorageGet(STORAGE_KEY);
  if (!raw) return DEFAULT_TREASURY_STATE;
  try {
    return normalizeTreasuryState(JSON.parse(raw) as Partial<TreasuryState>);
  } catch {
    return DEFAULT_TREASURY_STATE;
  }
}

export function saveTreasuryState(next: Partial<TreasuryState>): TreasuryState {
  const current = loadTreasuryState();
  const normalized = normalizeTreasuryState({
    ...current,
    ...next,
    updatedAt: new Date().toISOString(),
  });
  safeStorageSet(STORAGE_KEY, JSON.stringify(normalized));
  return normalized;
}
