import {
  describe,
  expect,
  it,
} from "vitest";
import {
  createAutonomousLifeRun,
} from "../src/r3/autonomous-life-run";
import {
  auditR3GroundedSpeechOpportunity,
} from "../src/r3/grounded-speech-opportunity";

describe("R3 grounded speech opportunity audit", () => {
  it("audits naturally grounded empty-rack speech without authored semantic-state labels", () => {
    const run =
      createAutonomousLifeRun();

    run.runTicks(1200);

    const audit =
      auditR3GroundedSpeechOpportunity(
        run.privateExperiences(),
      );

    console.log(
      "R3_GROUNDED_SPEECH_AUDIT " +
        JSON.stringify(
          audit,
        ),
    );

    expect(
      audit.requestCount,
    ).toBeGreaterThan(0);
    expect(
      audit.groundedRequestCount,
    ).toBe(
      audit.requestCount,
    );
    expect(
      audit.groundedRate,
    ).toBe(1);
  });
});
