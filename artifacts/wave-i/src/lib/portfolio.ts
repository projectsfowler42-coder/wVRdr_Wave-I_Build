export type BucketClass = "BLUE" | "GREEN";
export type WalletClass = "MINT";
export type ActiveContainerClass = BucketClass | WalletClass;
export type DecisionAction = "DRIP" | "HOLD" | "ADD" | "TRIM" | "ROTATE" | "WAIT" | "NOTE";

export interface Holding {
  id: string;
  container: ActiveContainerClass;
  bucket?: BucketClass;
  wallet?: WalletClass;
  ticker: string;
  shares: number;
  entryDate: string;
  entryPrice: number;
  dividendCollected: number;
  latestDipDate: string;
  nextExDate: string;
  nextPayDate: string;
  dripAmount: number;
  expectedIncome: number;
  notes: string;
  thesis: string;
  currentAction: DecisionAction | "";
  actionReason: string;
  expectedOutcome: string;
  reviewDate: string;
  addBelowPrice: number | null;
  trimAbovePrice: number | null;
  lastActionAt: string | null;
  lastActionType: DecisionAction | "";
  outcomeNote: string;
}

const STORAGE_KEY = "wavei_portfolio_v4";
const LEGACY_STORAGE_KEYS = ["wavei_portfolio_v3", "wavei_portfolio_v2", "wavei_portfolio_v1"];

function safeStorageGet(key: string): string | null {
  try {
    return typeof localStorage === "undefined" ? null : localStorage.getItem(key);
  } catch {
    return null;
  }
}

function safeStorageSet(key: string, value: string): void {
  try {
    if (typeof localStorage !== "undefined") localStorage.setItem(key, value);
  } catch {
    // Storage can fail in private mode or locked-down environments.
  }
}

export function placementFromContainer(container: ActiveContainerClass): { bucket?: BucketClass; wallet?: WalletClass } {
  switch (container) {
    case "MINT":
      return { bucket: "GREEN", wallet: "MINT" };
    case "BLUE":
      return { bucket: "BLUE" };
    case "GREEN":
      return { bucket: "GREEN" };
  }
}

function parseNumber(value: unknown, fallback = 0): number {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim() !== "") {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : fallback;
  }
  return fallback;
}

function parseNullableNumber(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim() !== "") {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
}

function parseString(value: unknown): string {
  return typeof value === "string" ? value : "";
}

function normalizeContainer(raw: Partial<Holding> & { container?: string; bucket?: string; wallet?: string }): ActiveContainerClass | null {
  if (raw.container === "MINT" || raw.wallet === "MINT") return "MINT";
  if (raw.container === "BLUE" || raw.bucket === "BLUE") return "BLUE";
  if (raw.container === "GREEN" || raw.bucket === "GREEN") return "GREEN";
  return null;
}

function normalizeHolding(
  raw: Partial<Holding> & { id?: string; container?: string; bucket?: string; wallet?: string },
): Holding | null {
  const container = normalizeContainer(raw);
  if (!container) return null;
  const placement = placementFromContainer(container);

  return {
    id: parseString(raw.id) || crypto.randomUUID(),
    container,
    bucket: placement.bucket,
    wallet: placement.wallet,
    ticker: parseString(raw.ticker).trim().toUpperCase(),
    shares: parseNumber(raw.shares),
    entryDate: parseString(raw.entryDate),
    entryPrice: parseNumber(raw.entryPrice),
    dividendCollected: parseNumber(raw.dividendCollected),
    latestDipDate: parseString(raw.latestDipDate),
    nextExDate: parseString((raw as Partial<Holding>).nextExDate),
    nextPayDate: parseString(raw.nextPayDate),
    dripAmount: parseNumber(raw.dripAmount),
    expectedIncome: parseNumber(raw.expectedIncome),
    notes: parseString(raw.notes),
    thesis: parseString(raw.thesis),
    currentAction: (parseString(raw.currentAction) as DecisionAction | "") || "",
    actionReason: parseString(raw.actionReason),
    expectedOutcome: parseString(raw.expectedOutcome),
    reviewDate: parseString(raw.reviewDate),
    addBelowPrice: parseNullableNumber(raw.addBelowPrice),
    trimAbovePrice: parseNullableNumber(raw.trimAbovePrice),
    lastActionAt: parseString(raw.lastActionAt) || null,
    lastActionType: (parseString(raw.lastActionType) as DecisionAction | "") || "",
    outcomeNote: parseString(raw.outcomeNote),
  };
}

function readRawHoldings(): string | null {
  const current = safeStorageGet(STORAGE_KEY);
  if (current) return current;
  for (const key of LEGACY_STORAGE_KEYS) {
    const value = safeStorageGet(key);
    if (value) return value;
  }
  return null;
}

export function loadHoldings(): Holding[] {
  try {
    const raw = readRawHoldings();
    if (!raw) return [];
    const parsed = JSON.parse(raw) as Array<Partial<Holding>>;
    return parsed
      .map((holding) => normalizeHolding(holding))
      .filter((holding): holding is Holding => Boolean(holding?.ticker));
  } catch {
    return [];
  }
}

export function saveHoldings(holdings: Holding[]): void {
  safeStorageSet(STORAGE_KEY, JSON.stringify(holdings.map((holding) => normalizeHolding(holding)).filter(Boolean)));
}

export function addHolding(holdings: Holding[], holding: Omit<Holding, "id">): Holding[] {
  const normalized = normalizeHolding({ ...holding, id: crypto.randomUUID() });
  if (!normalized) return holdings;
  const next = [...holdings, normalized];
  saveHoldings(next);
  return next;
}

export function updateHolding(
  holdings: Holding[],
  id: string,
  patch: Partial<Omit<Holding, "id">>,
): Holding[] {
  const next = holdings
    .map((holding) => (holding.id === id ? normalizeHolding({ ...holding, ...patch }) : holding))
    .filter((holding): holding is Holding => Boolean(holding));
  saveHoldings(next);
  return next;
}

export function deleteHolding(holdings: Holding[], id: string): Holding[] {
  const next = holdings.filter((holding) => holding.id !== id);
  saveHoldings(next);
  return next;
}

export function calcCostBasis(holding: Holding): number {
  return holding.shares * holding.entryPrice;
}

export function calcCurrentValue(
  holding: Holding,
  currentPrice: number | null | undefined,
): number | null {
  if (currentPrice == null) return null;
  return holding.shares * currentPrice;
}

export function calcUnrealizedGL(
  holding: Holding,
  currentPrice: number | null | undefined,
): number | null {
  const currentValue = calcCurrentValue(holding, currentPrice);
  if (currentValue == null) return null;
  return currentValue - calcCostBasis(holding);
}

export function calcUnrealizedGLPct(
  holding: Holding,
  currentPrice: number | null | undefined,
): number | null {
  const gl = calcUnrealizedGL(holding, currentPrice);
  const costBasis = calcCostBasis(holding);
  if (gl == null || costBasis === 0) return null;
  return (gl / costBasis) * 100;
}
