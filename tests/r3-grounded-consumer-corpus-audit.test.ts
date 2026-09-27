import {
  describe,
  expect,
  it,
} from "vitest";
import {
  createR3GroundedRecurrentReportRun,
} from "../src/r3/grounded-recurrent-report-consumer-run";
import {
  auditR3GroundedConsumerCorpus,
  buildR3GroundedConsumerCorpus,
} from "../src/r3/grounded-consumer-corpus-audit";

describe("R3 grounded consumer corpus audit", () => {
  it("falsifies the smallest current corpus before any learned probe", () => {
    const run =
      createR3GroundedRecurrentReportRun(
        "ideal-grounded-episode",
      );
    run.runTicks(1800);

    const rows =
      buildR3GroundedConsumerCorpus(
        run.privateExperiences(),
      );
    const audit =
      auditR3GroundedConsumerCorpus(
        rows,
      );

    console.log(
      "R3_GROUNDED_CONSUMER_CORPUS_AUDIT " +
        JSON.stringify({
          audit,
          rows,
        }),
    );

    expect(
      rows.length,
    ).toBeGreaterThan(0);
    expect(
      rows.some((row) => row.updateWorthy),
    ).toBe(true);
    expect(
      rows.some((row) => !row.updateWorthy),
    ).toBe(true);

    expect(
      audit.classification,
    ).toBe(
      "GROUNDED_CONSUMER_CORPUS_UNDERIDENTIFIED",
    );
  });
});
