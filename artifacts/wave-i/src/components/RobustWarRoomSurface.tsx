import React, { useEffect, useState } from "react";
import { raceTruth, TruthClass, type RescueEnvelope, type TruthEnvelope } from "@/contracts/truth.contract";
import { executeRobustScrape } from "@/lib/data-scrape";
import { applyThemeShield } from "@/lib/theme-shield";
import { TelemetricTile, type TelemetricTileData } from "@/components/hud/TelemetricTile";

const TICKERS = ["BKLN", "JAAA", "SGOV", "BTC", "ETH", "10Y", "VIX"] as const;

type TileKey = (typeof TICKERS)[number];
type TelemetryState = Record<string, TelemetricTileData>;

const seedTimestamp = Date.now();
const FALLBACK_STATE: Record<TileKey, TelemetricTileData> = {
  BKLN: { value: 0, sourceId: "[B]_FALLBACK", timestamp: seedTimestamp, truthClass: TruthClass.STALE, movementPercent: "0.00%", isPositive: true, staleRescue: true },
  JAAA: { value: 0, sourceId: "[B]_FALLBACK", timestamp: seedTimestamp, truthClass: TruthClass.STALE, movementPercent: "0.00%", isPositive: true, staleRescue: true },
  SGOV: { value: 0, sourceId: "|W|_FALLBACK", timestamp: seedTimestamp, truthClass: TruthClass.STALE, movementPercent: "0.00%", isPositive: true, staleRescue: true },
  BTC: { value: 0, sourceId: "MINT_FALLBACK", timestamp: seedTimestamp, truthClass: TruthClass.STALE, movementPercent: "0.00%", isPositive: true, staleRescue: true },
  ETH: { value: 0, sourceId: "MINT_FALLBACK", timestamp: seedTimestamp, truthClass: TruthClass.STALE, movementPercent: "0.00%", isPositive: true, staleRescue: true },
  "10Y": { value: 0, sourceId: "|M|_RATES_FALLBACK", timestamp: seedTimestamp, truthClass: TruthClass.STALE, movementPercent: "0.00%", isPositive: true, staleRescue: true },
  VIX: { value: 0, sourceId: "|M|_VOL_FALLBACK", timestamp: seedTimestamp, truthClass: TruthClass.STALE, movementPercent: "0.00%", isPositive: false, staleRescue: true },
};

function fallbackFor(ticker: TileKey, current?: TelemetricTileData): TruthEnvelope<number> {
  const fallback = current ?? FALLBACK_STATE[ticker];
  return {
    value: fallback.value,
    sourceId: fallback.sourceId,
    timestamp: fallback.timestamp,
    truthClass: fallback.truthClass,
  };
}

async function fetchConnectorPrice(ticker: TileKey): Promise<TruthEnvelope<number>> {
  const base = FALLBACK_STATE[ticker];
  return {
    value: base.value,
    sourceId: `${ticker}_CONNECTOR_PENDING`,
    timestamp: Date.now(),
    truthClass: TruthClass.STALE,
  };
}

function toTileData(result: RescueEnvelope<number>, previous: TelemetricTileData): TelemetricTileData {
  const movement = result.value - previous.value;
  const movementPercent = previous.value === 0 ? "0.00%" : `${((movement / previous.value) * 100).toFixed(2)}%`;
  return {
    value: result.value,
    sourceId: result.sourceId,
    timestamp: result.timestamp,
    truthClass: result.truthClass,
    staleRescue: result.staleRescue,
    movementPercent,
    isPositive: movement >= 0,
  };
}

function triggerPulseFeedback(signal: "MINT") {
  document.documentElement.setAttribute("data-wavei-pulse", signal);
  window.setTimeout(() => document.documentElement.removeAttribute("data-wavei-pulse"), 420);
}

export default function RobustWarRoomSurface() {
  useEffect(() => {
    applyThemeShield("dark");
  }, []);

  const [selected, setSelected] = useState<TileKey>("BKLN");
  const [telemetry, setTelemetry] = useState<TelemetryState>(FALLBACK_STATE);

  const handleRefresh = async () => {
    console.log("[ACTION] Triggering Resilient Global Fetch...");
    const updates = await Promise.all(TICKERS.map(async (ticker) => {
      const previous = telemetry[ticker] ?? FALLBACK_STATE[ticker];
      const result = await raceTruth(() => fetchConnectorPrice(ticker), fallbackFor(ticker, previous));
      return [ticker, toTileData(result, previous)] as const;
    }));
    setTelemetry((prev) => ({ ...prev, ...Object.fromEntries(updates) }));
  };

  const handleScrape = async () => {
    await executeRobustScrape(telemetry);
    triggerPulseFeedback("MINT");
  };

  return (
    <div className="wvrdr-war-room min-h-screen bg-black text-white">
      <header className="header-hud flex items-center justify-between p-4">
        <div>
          <div className="font-mono text-[10px] font-bold uppercase tracking-[0.28em] text-cyan-300">Wave-I War Room</div>
          <div className="mt-1 font-mono text-xs text-slate-400">MINT · |M| · |W| · [B]</div>
        </div>
        <button className="btn-refresh rounded-2xl bg-cyan-300/10 px-4 py-2 font-mono text-xs font-bold tracking-[0.2em] text-white" onClick={handleRefresh}>
          [ DATA REFRESH ]
        </button>
      </header>

      <main className="selectable-7-grid px-4 pb-24">
        {TICKERS.map((label) => (
          <TelemetricTile key={label} label={label} data={telemetry[label]} selected={selected === label} onSelect={() => setSelected(label)} />
        ))}
      </main>

      <footer className="footer-hud fixed bottom-0 right-0 p-5">
        <button className="btn-scrape rounded-2xl bg-emerald-300/20 px-4 py-3 font-mono text-xs font-bold tracking-[0.2em] text-emerald-50" onClick={handleScrape}>
          [ DATA SCRAPE ]
        </button>
      </footer>
    </div>
  );
}
