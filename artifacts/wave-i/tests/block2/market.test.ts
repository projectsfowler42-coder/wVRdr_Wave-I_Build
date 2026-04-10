import { beforeEach, describe, expect, it, vi } from "vitest";
import { fetchQuote, fetchTape, loadLocalQuote, saveLocalQuote } from "@/lib/market";

describe("local market snapshot store", () => {
  beforeEach(() => {
    localStorage.clear();
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-04-10T10:00:00Z"));
  });

  it("persists and reloads a local quote snapshot", async () => {
    const saved = saveLocalQuote("ARCC", {
      price: 20.6,
      change: 0.19,
      changePct: 0.93,
      volume: 123456,
    });

    expect(saved.symbol).toBe("ARCC");
    expect(saved.timestamp).toBeGreaterThan(0);

    const loaded = loadLocalQuote("ARCC");
    expect(loaded.price).toBe(20.6);
    expect(loaded.changePct).toBe(0.93);
    expect(loaded.volume).toBe(123456);

    const fetched = await fetchQuote("ARCC");
    expect(fetched.price).toBe(20.6);
    expect(fetched.symbol).toBe("ARCC");
  });

  it("builds tape items only from stored local snapshots", async () => {
    saveLocalQuote("ARCC", { price: 20.6, change: 0.19, changePct: 0.93 });
    saveLocalQuote("AGNC", { price: 9.8, change: -0.04, changePct: -0.41 });

    const tape = await fetchTape();
    expect(tape).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ symbol: "ARCC", price: 20.6, changePct: 0.93 }),
        expect.objectContaining({ symbol: "AGNC", price: 9.8, changePct: -0.41 }),
      ]),
    );
  });
});
