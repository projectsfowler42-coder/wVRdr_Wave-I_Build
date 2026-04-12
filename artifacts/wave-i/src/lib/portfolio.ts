export type BucketClass = "BLUE" | "GREEN";
export type WalletClass = "WHITE" | "MINT";
export type ActiveContainerClass = BucketClass | WalletClass;

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
  dripAmount: number;
  expectedIncome: number;
  notes: string;
}

const STORAGE_KEY = "wavei_portfolio_v2";
const LEGACY_STORAGE_KEY = "wavei_portfolio_v1";

export function placementFromContainer(container: ActiveContainerClass): {
  bucket?: BucketClass;
  wallet?: WalletClass;
} {
  switch (container) {
    case "WHITE":
      return { wallet: "WHITE" };
    case "MINT":
      return { bucket: "GREEN", wallet: "MINT" };
    case "BLUE":
      return { bucket: "BLUE" };
    case "GREEN":
      return { bucket: "GREEN" };
  }
}

function normalizeHolding(
  raw: Partial<Holding> & {
    id?: string;
    container?: string;
    bucket?: string;
    wallet?: string;
  },
): Holding {
  const container: ActiveContainerClass =
    raw.container === "WHITE" || raw.wallet === "WHITE"
      ? "WHITE"
      : raw.container === "MINT" || raw.wallet === "MINT"
        ? "MINT"
        : raw.container === "GREEN" || raw.bucket === "GREEN"
          ? "GREEN"
          : "BLUE";

  const placement = placementFromContainer(container);

  return {
    id: raw.id ?? crypto.randomUUID(),
    container,
    bucket: placement.bucket,
    wallet: placement.wallet,
    ticker: raw.ticker ?? "",
    shares: typeof raw.shares === "number" ? raw.shares : 0,
    entryDate: raw.entryDate ?? "",
    entryPrice: typeof raw.entryPrice === "number" ? raw.entryPrice : 0,
    dividendCollected: typeof raw.dividendCollected === "number" ? raw.dividendCollected : 0,
    latestDipDate: raw.latestDipDate ?? "",
    dripAmount: typeof raw.dripAmount === "number" ? raw.dripAmount : 0,
    expectedIncome: typeof raw.expectedIncome === "number" ? raw.expectedIncome : 0,
    notes: raw.notes ?? "",
  };
}

export function loadHoldings(): Holding[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY) ?? localStorage.getItem(LEGACY_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as Array<Partial<Holding>>;
    return parsed.map((holding) => normalizeHolding(holding));
  } catch {
    return [];
  }
}

export function saveHoldings(holdings: Holding[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(holdings));
}

export function addHolding(holdings: Holding[], holding: Omit<Holding, "id">): Holding[] {
  const next = [...holdings, normalizeHolding({ ...holding, id: crypto.randomUUID() })];
  saveHoldings(next);
  return next;
}

export function updateHolding(
  holdings: Holding[],
  id: string,
  patch: Partial<Omit<Holding, "id">>,
): Holding[] {
  const next = holdings.map((holding) =>
    holding.id === id ? normalizeHolding({ ...holding, ...patch }) : holding,
  );
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
