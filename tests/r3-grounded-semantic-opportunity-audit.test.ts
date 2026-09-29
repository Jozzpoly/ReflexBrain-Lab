import {
  describe,
  expect,
  it,
} from "vitest";
import {
  createAutonomousLifeRun,
} from "../src/r3/autonomous-life-run";
import {
  auditR3GroundedSemanticOpportunity,
} from "../src/r3/grounded-semantic-opportunity-audit";

describe("R3 grounded semantic opportunity audit", () => {
  it("audits recurrent private factual diversity before adding semantic speech or labels", () => {
    const run =
      createAutonomousLifeRun();
    run.runTicks(5400);

    const audit =
      auditR3GroundedSemanticOpportunity(
        run.privateExperiences(),
      );

    console.log(
      "R3_GROUNDED_SEMANTIC_OPPORTUNITY " +
        JSON.stringify(audit),
    );

    expect(
      audit.ticks,
    ).toBe(5399);

    expect(
      [
        "GROUNDED_SEMANTIC_DIVERSITY_SEED_AVAILABLE",
        "GROUNDED_SEMANTIC_DIVERSITY_TOO_NARROW",
      ],
    ).toContain(
      audit.classification,
    );
  }, 30_000);
});
