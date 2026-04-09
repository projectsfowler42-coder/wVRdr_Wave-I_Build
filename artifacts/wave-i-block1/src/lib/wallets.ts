export type WalletClass = "|W|" | "|M|";

export interface BaseWallet {
  wallet_id: "|W|";
  wallet_class: "|W|";
  cap: number;
  current_balance: number;
  reserved_amount: number;
  deployable_amount: number;
  funding_source_notes: string;
  updated_at: string;
}

export interface MintWallet {
  wallet_id: "|M|";
  wallet_class: "|M|";
  current_balance: number;
  dividend_inflows: number;
  drip_inflows: number;
  drawdown_capture_inflows: number;
  deployable_amount: number;
  pending_inflows: number;
  updated_at: string;
}

export type WalletRecord = BaseWallet | MintWallet;
const STORAGE_KEY = "wavei_wallets_v1";

export function loadWallets(): Record<WalletClass, WalletRecord> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  const now = new Date().toISOString();
  return {
    "|W|": {
      wallet_id: "|W|",
      wallet_class: "|W|",
      cap: 0,
      current_balance: 0,
      reserved_amount: 0,
      deployable_amount: 0,
      funding_source_notes: "",
      updated_at: now
    },
    "|M|": {
      wallet_id: "|M|",
      wallet_class: "|M|",
      current_balance: 0,
      dividend_inflows: 0,
      drip_inflows: 0,
      drawdown_capture_inflows: 0,
      deployable_amount: 0,
      pending_inflows: 0,
      updated_at: now
    }
  };
}

export function saveWallets(next: Record<WalletClass, WalletRecord>) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
}
