import { QuarantineVault } from "@/runtime/governance/QuarantineVault";

describe("QuarantineVault", () => {
  it("quarantines and releases subjects without collateral mutation", () => {
    const vault = new QuarantineVault();

    expect(vault.isQuarantined("quote-board")).toBe(false);

    const entry = vault.quarantine("quote-board", "selector failed schema guard");
    expect(entry.subject).toBe("quote-board");
    expect(vault.isQuarantined("quote-board")).toBe(true);

    vault.release("quote-board");
    expect(vault.isQuarantined("quote-board")).toBe(false);
  });
});
