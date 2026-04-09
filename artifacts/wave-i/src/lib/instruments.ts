export interface Instrument {
  ticker: string;
  name: string;
  bucket: "BLUE" | "GREEN";
  type: string;
  divFreq: "monthly" | "quarterly" | "special";
  notes?: string;
}

export const BLUE_INSTRUMENTS: Instrument[] = [
  { ticker: "ARCC",  name: "Ares Capital Corp",              bucket: "BLUE", type: "BDC",    divFreq: "quarterly" },
  { ticker: "MAIN",  name: "Main Street Capital",            bucket: "BLUE", type: "BDC",    divFreq: "monthly" },
  { ticker: "ORCC",  name: "Blue Owl Capital Corp",          bucket: "BLUE", type: "BDC",    divFreq: "quarterly" },
  { ticker: "BXSL",  name: "Blackstone Secured Lending",     bucket: "BLUE", type: "BDC",    divFreq: "quarterly" },
  { ticker: "GBDC",  name: "Golub Capital BDC",              bucket: "BLUE", type: "BDC",    divFreq: "quarterly" },
  { ticker: "HTGC",  name: "Hercules Capital",               bucket: "BLUE", type: "BDC",    divFreq: "quarterly" },
  { ticker: "FSK",   name: "FS KKR Capital Corp",            bucket: "BLUE", type: "BDC",    divFreq: "quarterly" },
  { ticker: "PSEC",  name: "Prospect Capital Corp",          bucket: "BLUE", type: "BDC",    divFreq: "monthly" },
  { ticker: "NMFC",  name: "New Mountain Finance",           bucket: "BLUE", type: "BDC",    divFreq: "quarterly" },
  { ticker: "GAIN",  name: "Gladstone Investment",           bucket: "BLUE", type: "BDC",    divFreq: "monthly" },
  { ticker: "GLAD",  name: "Gladstone Capital",              bucket: "BLUE", type: "BDC",    divFreq: "monthly" },
  { ticker: "CSWC",  name: "Capital Southwest Corp",         bucket: "BLUE", type: "BDC",    divFreq: "quarterly" },
  { ticker: "TPVG",  name: "TriplePoint Venture Growth",    bucket: "BLUE", type: "BDC",    divFreq: "quarterly" },
  { ticker: "BBDC",  name: "Barings BDC",                   bucket: "BLUE", type: "BDC",    divFreq: "quarterly" },
  { ticker: "SLRC",  name: "SLR Investment Corp",            bucket: "BLUE", type: "BDC",    divFreq: "quarterly" },
  { ticker: "OBDC",  name: "Blue Owl Capital Corp II",       bucket: "BLUE", type: "BDC",    divFreq: "quarterly" },
  { ticker: "CGBD",  name: "Carlyle Secured Lending",        bucket: "BLUE", type: "BDC",    divFreq: "quarterly" },
  { ticker: "PFLT",  name: "PennantPark Floating Rate",      bucket: "BLUE", type: "BDC",    divFreq: "monthly" },
  { ticker: "PNNT",  name: "PennantPark Investment",         bucket: "BLUE", type: "BDC",    divFreq: "quarterly" },
  { ticker: "FDUS",  name: "Fidus Investment Corp",          bucket: "BLUE", type: "BDC",    divFreq: "quarterly" },
];

export const GREEN_INSTRUMENTS: Instrument[] = [
  { ticker: "AGNC",  name: "AGNC Investment Corp",           bucket: "GREEN", type: "mREIT",  divFreq: "monthly" },
  { ticker: "NLY",   name: "Annaly Capital Management",      bucket: "GREEN", type: "mREIT",  divFreq: "quarterly" },
  { ticker: "RITM",  name: "Rithm Capital Corp",             bucket: "GREEN", type: "mREIT",  divFreq: "quarterly" },
  { ticker: "TWO",   name: "Two Harbors Investment",         bucket: "GREEN", type: "mREIT",  divFreq: "quarterly" },
  { ticker: "ORC",   name: "Orchid Island Capital",          bucket: "GREEN", type: "mREIT",  divFreq: "monthly" },
  { ticker: "NYMT",  name: "New York Mortgage Trust",        bucket: "GREEN", type: "mREIT",  divFreq: "quarterly" },
  { ticker: "MFA",   name: "MFA Financial",                  bucket: "GREEN", type: "mREIT",  divFreq: "quarterly" },
  { ticker: "DX",    name: "Dynex Capital",                  bucket: "GREEN", type: "mREIT",  divFreq: "quarterly" },
  { ticker: "IVR",   name: "Invesco Mortgage Capital",       bucket: "GREEN", type: "mREIT",  divFreq: "quarterly" },
  { ticker: "EARN",  name: "Ellington Residential Mortgage", bucket: "GREEN", type: "mREIT",  divFreq: "monthly" },
  { ticker: "EFC",   name: "Ellington Financial",            bucket: "GREEN", type: "mREIT",  divFreq: "monthly" },
  { ticker: "PMT",   name: "PennyMac Mortgage Trust",        bucket: "GREEN", type: "mREIT",  divFreq: "quarterly" },
  { ticker: "MITT",  name: "AG Mortgage Investment Trust",   bucket: "GREEN", type: "mREIT",  divFreq: "quarterly" },
  { ticker: "WMC",   name: "Western Asset Mortgage Capital", bucket: "GREEN", type: "mREIT",  divFreq: "quarterly" },
  { ticker: "ARR",   name: "ARMOUR Residential REIT",        bucket: "GREEN", type: "mREIT",  divFreq: "monthly" },
  { ticker: "CIM",   name: "Chimera Investment Corp",        bucket: "GREEN", type: "mREIT",  divFreq: "quarterly" },
  { ticker: "REM",   name: "iShares Mortgage RE ETF",        bucket: "GREEN", type: "ETF",    divFreq: "monthly" },
];

export const ALL_INSTRUMENTS: Instrument[] = [...BLUE_INSTRUMENTS, ...GREEN_INSTRUMENTS];

export function getInstrument(ticker: string): Instrument | undefined {
  return ALL_INSTRUMENTS.find((i) => i.ticker === ticker);
}

export function getBucketInstruments(bucket: "BLUE" | "GREEN"): Instrument[] {
  return bucket === "BLUE" ? BLUE_INSTRUMENTS : GREEN_INSTRUMENTS;
}
