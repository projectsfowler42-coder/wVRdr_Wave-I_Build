export type BucketClass = "[B]" | "[G]";

export interface Instrument {
  instrument_id: string;
  ticker: string;
  name: string;
  bucket_class: BucketClass;
  instrument_type: string;
  payout_frequency: "monthly" | "quarterly" | "special";
  yield_type: string;
  exchange: string;
  enabled: boolean;
  notes?: string;
}

export const BLUE_INSTRUMENTS: Instrument[] = [
  ["ARCC","Ares Capital Corp","BDC","quarterly","ordinary","NASDAQ"],
  ["MAIN","Main Street Capital","BDC","monthly","ordinary","NYSE"],
  ["ORCC","Blue Owl Capital Corp","BDC","quarterly","ordinary","NYSE"],
  ["BXSL","Blackstone Secured Lending","BDC","quarterly","ordinary","NYSE"],
  ["GBDC","Golub Capital BDC","BDC","quarterly","ordinary","NASDAQ"],
  ["HTGC","Hercules Capital","BDC","quarterly","ordinary","NYSE"],
  ["FSK","FS KKR Capital Corp","BDC","quarterly","ordinary","NYSE"],
  ["PSEC","Prospect Capital Corp","BDC","monthly","ordinary","NASDAQ"],
  ["NMFC","New Mountain Finance","BDC","quarterly","ordinary","NASDAQ"],
  ["GAIN","Gladstone Investment","BDC","monthly","ordinary","NASDAQ"],
  ["GLAD","Gladstone Capital","BDC","monthly","ordinary","NASDAQ"],
  ["CSWC","Capital Southwest Corp","BDC","quarterly","ordinary","NASDAQ"],
  ["TPVG","TriplePoint Venture Growth","BDC","quarterly","ordinary","NYSE"],
  ["BBDC","Barings BDC","BDC","quarterly","ordinary","NYSE"],
  ["SLRC","SLR Investment Corp","BDC","quarterly","ordinary","NASDAQ"],
  ["OBDC","Blue Owl Capital Corp II","BDC","quarterly","ordinary","NYSE"],
  ["CGBD","Carlyle Secured Lending","BDC","quarterly","ordinary","NASDAQ"],
  ["PFLT","PennantPark Floating Rate","BDC","monthly","ordinary","NASDAQ"],
  ["PNNT","PennantPark Investment","BDC","quarterly","ordinary","NASDAQ"],
  ["FDUS","Fidus Investment Corp","BDC","quarterly","ordinary","NASDAQ"]
].map(([ticker,name,instrument_type,payout_frequency,yield_type,exchange]) => ({
  instrument_id: ticker,
  ticker,
  name,
  bucket_class: "[B]" as const,
  instrument_type,
  payout_frequency: payout_frequency as Instrument["payout_frequency"],
  yield_type,
  exchange,
  enabled: true
}));

export const GREEN_INSTRUMENTS: Instrument[] = [
  ["AGNC","AGNC Investment Corp","mREIT","monthly","ordinary","NASDAQ"],
  ["NLY","Annaly Capital Management","mREIT","quarterly","ordinary","NYSE"],
  ["RITM","Rithm Capital Corp","mREIT","quarterly","ordinary","NYSE"],
  ["TWO","Two Harbors Investment","mREIT","quarterly","ordinary","NYSE"],
  ["ORC","Orchid Island Capital","mREIT","monthly","ordinary","NYSE"],
  ["NYMT","New York Mortgage Trust","mREIT","quarterly","ordinary","NASDAQ"],
  ["MFA","MFA Financial","mREIT","quarterly","ordinary","NYSE"],
  ["DX","Dynex Capital","mREIT","quarterly","ordinary","NYSE"],
  ["IVR","Invesco Mortgage Capital","mREIT","quarterly","ordinary","NYSE"],
  ["EARN","Ellington Residential Mortgage","mREIT","monthly","ordinary","NYSE"],
  ["EFC","Ellington Financial","mREIT","monthly","ordinary","NYSE"],
  ["PMT","PennyMac Mortgage Trust","mREIT","quarterly","ordinary","NYSE"],
  ["MITT","AG Mortgage Investment Trust","mREIT","quarterly","ordinary","NYSE"],
  ["WMC","Western Asset Mortgage Capital","mREIT","quarterly","ordinary","NYSE"],
  ["ARR","ARMOUR Residential REIT","mREIT","monthly","ordinary","NYSE"],
  ["CIM","Chimera Investment Corp","mREIT","quarterly","ordinary","NYSE"],
  ["REM","iShares Mortgage RE ETF","ETF","monthly","ordinary","NYSE"]
].map(([ticker,name,instrument_type,payout_frequency,yield_type,exchange]) => ({
  instrument_id: ticker,
  ticker,
  name,
  bucket_class: "[G]" as const,
  instrument_type,
  payout_frequency: payout_frequency as Instrument["payout_frequency"],
  yield_type,
  exchange,
  enabled: true
}));

export const ALL_INSTRUMENTS = [...BLUE_INSTRUMENTS, ...GREEN_INSTRUMENTS];

export function getInstrument(ticker: string) {
  return ALL_INSTRUMENTS.find((i) => i.ticker.toUpperCase() === ticker.toUpperCase());
}
