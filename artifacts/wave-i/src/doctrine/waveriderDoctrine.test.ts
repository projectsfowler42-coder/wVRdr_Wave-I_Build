import { describe, expect, it } from "vitest";
import { CONSTRAINT_STACK, OPERATOR_DISCIPLINE, SYSTEM_SPINE } from "@/doctrine/waveriderDoctrine";

describe("waveriderDoctrine", () => {
  it("preserves the imported system spine order", () => {
    expect(SYSTEM_SPINE.map((item) => item.name)).toEqual(["Aggregator", "Gate", "Coach", "System"]);
  });

  it("tracks the required constraint modules from the imported WaveRider docs", () => {
    const names = CONSTRAINT_STACK.map((item) => item.name);

    expect(names).toContain("Constraint Engine");
    expect(names).toContain("Constraint-aware PreCog");
    expect(names).toContain("Monte Carlo Simulation Layer");
    expect(names).toContain("Playbook Compiler");
    expect(names).toContain("Capital Translator");
    expect(names).toContain("Meta Optimizer");
    expect(names).toContain("Risk Governor");
    expect(names).toContain("Output Layer");
    expect(names).toContain("Evolution Engine");
  });

  it("keeps the operator-discipline guardrails visible", () => {
    const names = OPERATOR_DISCIPLINE.map((item) => item.name);

    expect(names).toContain("20-minute Tactical Brake");
    expect(names).toContain("Explicit User Approval");
    expect(names).toContain("No Silent Prioritization");
    expect(names).toContain("Rule Library");
  });
});
