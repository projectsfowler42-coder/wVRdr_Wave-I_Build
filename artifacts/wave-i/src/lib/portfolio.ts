export interface Holding {
  id: string;
  bucket: "BLUE" | "GREEN";
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

export function loadHoldings(): Holding[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as Holding[];
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
  const next = holdings.map((h) => (h.id === id ? { ...h, ...patch } : h));
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
