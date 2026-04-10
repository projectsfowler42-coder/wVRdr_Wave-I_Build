import { beforeEach, describe, expect, it } from "vitest";
import {
  calcCostBasis,
  calcCurrentValue,
  calcUnrealizedGL,
  calcUnrealizedGLPct,
  loadHoldings,
  updateHolding,
  type Holding,
} from "@/lib/portfolio";

const BASE_HOLDING: Holding = {
  id: "h1",
  bucket: "GREEN",
  wallet: "MINT",
  ticker: "AGNC",
  shares: 97,
  entryDate: "2026-04-01",
  entryPrice: 20.41,
  dividendCollected: 11.20447,
  latestDipDate: "",
  dripAmount: 0,
  expectedIncome: 0,
  notes: "",
};

describe("portfolio truth math", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("computes deterministic cost basis and unrealized pnl", () => {
    expect(calcCostBasis(BASE_HOLDING)).toBeCloseTo(1979.77, 2);
    expect(calcCurrentValue(BASE_HOLDING, 20.6)).toBeCloseTo(1998.2, 2);
    expect(calcUnrealizedGL(BASE_HOLDING, 20.6)).toBeCloseTo(18.43, 2);
    expect(calcUnrealizedGLPct(BASE_HOLDING, 20.6)).toBeCloseTo((18.43 / 1979.77) * 100, 6);
  });

  it("strips |M| when a holding is moved outside [G]", () => {
    const updated = updateHolding([BASE_HOLDING], "h1", {
      bucket: "BLUE",
      wallet: "MINT",
      ticker: "ARCC",
    });

    expect(updated[0].bucket).toBe("BLUE");
    expect(updated[0].wallet).toBeUndefined();
  });

  it("normalizes invalid stored wallet assignments on load", () => {
    localStorage.setItem(
      "wavei_portfolio_v1",
      JSON.stringify([
        {
          ...BASE_HOLDING,
          bucket: "BLUE",
          wallet: "MINT",
          ticker: "ARCC",
        },
      ]),
    );

    const loaded = loadHoldings();
    expect(loaded).toHaveLength(1);
    expect(loaded[0].bucket).toBe("BLUE");
    expect(loaded[0].wallet).toBeUndefined();
  });
});
