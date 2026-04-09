import type { BucketClass } from "./instruments";
import type { WalletClass } from "./wallets";

export interface HoldingRecord {
  holding_id: string;
  ticker: string;
  instrument_name: string;
  bucket_class: BucketClass;
  wallet_class: WalletClass | null;
  shares: number;
  entry_date: string;
  entry_price: number;
  current_price: number | null;
  current_value: number | null;
  cost_basis: number;
  unrealized_pnl: number | null;
  unrealized_pnl_pct: number | null;
  dividends_collected: number;
  latest_dip_date: string;
  drip_amount: number;
  expected_income: number;
  notes: string;
  created_at: string;
  updated_at: string;
}

const STORAGE_KEY = "wavei_portfolio_v2";

export function loadHoldings(): HoldingRecord[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveHoldings(next: HoldingRecord[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
}

export function createHolding(input: Omit<HoldingRecord, "holding_id" | "current_price" | "current_value" | "cost_basis" | "unrealized_pnl" | "unrealized_pnl_pct" | "created_at" | "updated_at">): HoldingRecord {
  const now = new Date().toISOString();
  const cost_basis = input.shares * input.entry_price;
  return {
    ...input,
    holding_id: crypto.randomUUID(),
    current_price: null,
    current_value: null,
    cost_basis,
    unrealized_pnl: null,
    unrealized_pnl_pct: null,
    created_at: now,
    updated_at: now
  };
}

export function withQuote(h: HoldingRecord, current_price: number | null): HoldingRecord {
  const current_value = current_price == null ? null : h.shares * current_price;
  const unrealized_pnl = current_value == null ? null : current_value - h.cost_basis;
  const unrealized_pnl_pct = unrealized_pnl == null || h.cost_basis === 0 ? null : (unrealized_pnl / h.cost_basis) * 100;
  return { ...h, current_price, current_value, unrealized_pnl, unrealized_pnl_pct, updated_at: new Date().toISOString() };
}
