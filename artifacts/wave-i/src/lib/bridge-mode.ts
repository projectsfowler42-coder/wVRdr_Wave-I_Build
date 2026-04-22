export type BridgeBucket = "BLUE" | "GREEN";
export type BridgeContainer = "MINT" | BridgeBucket;

export interface BridgeLine {
  ticker: string;
  displayTicker: string;
  bucket: BridgeBucket;
  amount: number;
  weight: number;
  rate: number;
  role: string;
  requiresNav: boolean;
  requiresLeverage: boolean;
  requiresXfltGate: boolean;
}

export const BRIDGE_STARTING_CAPITAL = 55_000;
export const BRIDGE_M_WALLET_PRELOAD = 5_000;
export const BRIDGE_DEPLOYABLE_CAPITAL = 50_000;
export const BRIDGE_GREEN_AMOUNT = 32_500;
export const BRIDGE_BLUE_AMOUNT = 17_500;

export const BRIDGE_LINES: BridgeLine[] = [
  { ticker: "XFLT", displayTicker: "XFLT", bucket: "GREEN", amount: 13_000, weight: 0.4, rate: 15.72, role: "High-output D3 accelerator", requiresNav: true, requiresLeverage: true, requiresXfltGate: true },
  { ticker: "SRLN", displayTicker: "SRLN", bucket: "GREEN", amount: 8_125, weight: 0.25, rate: 7.63, role: "Senior-loan ballast", requiresNav: false, requiresLeverage: false, requiresXfltGate: false },
  { ticker: "JBBB", displayTicker: "JBBB", bucket: "GREEN", amount: 6_500, weight: 0.2, rate: 7.19, role: "CLO debt income", requiresNav: true, requiresLeverage: false, requiresXfltGate: false },
  { ticker: "BKLN", displayTicker: "BKLN", bucket: "GREEN", amount: 4_875, weight: 0.15, rate: 7.01, role: "Senior-loan anchor", requiresNav: false, requiresLeverage: false, requiresXfltGate: false },
  { ticker: "JAAA", displayTicker: "JAAA", bucket: "BLUE", amount: 8_750, weight: 0.5, rate: 5.13, role: "AAA CLO anchor", requiresNav: true, requiresLeverage: false, requiresXfltGate: false },
  { ticker: "FLOT", displayTicker: "FLOT", bucket: "BLUE", amount: 5_250, weight: 0.3, rate: 4.67, role: "IG floater ballast", requiresNav: false, requiresLeverage: false, requiresXfltGate: false },
  { ticker: "MINT", displayTicker: "MINT ETF", bucket: "BLUE", amount: 3_500, weight: 0.2, rate: 4.49, role: "Short-duration cash proxy", requiresNav: false, requiresLeverage: false, requiresXfltGate: false },
];

export const BRIDGE_TICKERS = BRIDGE_LINES.map((line) => line.ticker);

export function bridgeLineForTicker(ticker: string): BridgeLine | undefined {
  return BRIDGE_LINES.find((line) => line.ticker === ticker.toUpperCase());
}

export function bridgeDisplayTicker(ticker: string): string {
  return bridgeLineForTicker(ticker)?.displayTicker ?? ticker.toUpperCase();
}

export function bridgeMonthlyFuel(line: Pick<BridgeLine, "amount" | "rate">): number {
  return (line.amount * line.rate) / 100 / 12;
}

export function bridgeYearlyFuel(line: Pick<BridgeLine, "amount" | "rate">): number {
  return (line.amount * line.rate) / 100;
}

export const BRIDGE_YEARLY_FUEL = BRIDGE_LINES.reduce((sum, line) => sum + bridgeYearlyFuel(line), 0);
export const BRIDGE_MONTHLY_FUEL = BRIDGE_YEARLY_FUEL / 12;

export function defaultBridgeAmount(ticker: string): number {
  return bridgeLineForTicker(ticker)?.amount ?? 0;
}
