import schema from "@/data/schemas/instrument.schema.json";
import { getBucketScopedInstruments, listWaveIInstruments } from "@/lib/loadInstruments";

describe("wave-i instrument database", () => {
  it("keeps active Wave-I scope inside M/W/B/G", () => {
    const activeBuckets = new Set(
      listWaveIInstruments()
        .filter((instrument) => instrument.activeWaveIScope)
        .map((instrument) => instrument.canonicalWaveIBucket),
    );

    expect([...activeBuckets].sort()).toEqual(["BLUE", "GREEN", "MINT", "WHITE"]);
  });

  it("exposes selector candidates for BLUE and GREEN", () => {
    expect(getBucketScopedInstruments("BLUE").length).toBeGreaterThan(0);
    expect(getBucketScopedInstruments("GREEN").length).toBeGreaterThan(0);
  });

  it("contains the schema-required fields on every record", () => {
    const required = schema.required as string[];

    for (const instrument of listWaveIInstruments()) {
      for (const field of required) {
        expect(instrument).toHaveProperty(field);
      }
    }
  });
});
