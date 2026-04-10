export type BucketClass = "BLUE" | "GREEN";
export type WalletClass = "WHITE" | "MINT";

export interface Holding {
  id: string;
  bucket: BucketClass;
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

const STORAGE_KEY = "wavei_portfolio_v1";

function normalizeHolding(raw: Partial<Holding> & { id?: string; bucket?: string; wallet?: string }): Holding {
  const bucket: BucketClass = raw.bucket === "GREEN" ? "GREEN" : "BLUE";
  const wallet: WalletClass | undefined =
    raw.wallet === "WHITE"
      ? "WHITE"
      : raw.wallet === "MINT" && bucket === "GREEN"
      ? "MINT"
      : undefined;

  return {
    id: raw.id ?? crypto.randomUUID(),
    bucket,
    wallet,
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
    const raw = localStorage.getItem(STORAGE_KEY);
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
  const next = [...holdings, { ...holding, id: crypto.randomUUID() }];
  saveHoldings(next);
  return next;
}

export function updateHolding(holdings: Holding[], id: string, patch: Partial<Omit<Holding, "id">>): Holding[] {
  const next = holdings.map((h) => (h.id === id ? normalizeHolding({ ...h, ...patch }) : h));
  saveHoldings(next);
  return next;
}

export function deleteHolding(holdings: Holding[], id: string): Holding[] {
  const next = holdings.filter((h) => h.id !== id);
  saveHoldings(next);
  return next;
}

export function calcCostBasis(holding: Holding): number {
  return holding.shares * holding.entryPrice;
}

export function calcCurrentValue(holding: Holding, currentPrice: number | null | undefined): number | null {
  if (currentPrice == null) return null;
  return holding.shares * currentPrice;
}

export function calcUnrealizedGL(holding: Holding, currentPrice: number | null | undefined): number | null {
  const cv = calcCurrentValue(holding, currentPrice);
  if (cv == null) return null;
  return cv - calcCostBasis(holding);
}

export function calcUnrealizedGLPct(holding: Holding, currentPrice: number | null | undefined): number | null {
  const gl = calcUnrealizedGL(holding, currentPrice);
  const cb = calcCostBasis(holding);
  if (gl == null || cb === 0) return null;
  return (gl / cb) * 100;
}
