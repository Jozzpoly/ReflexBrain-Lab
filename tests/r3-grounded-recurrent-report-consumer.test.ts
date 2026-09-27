import {
  describe,
  expect,
  it,
} from "vitest";
import {
  createR3GroundedRecurrentReportRun,
  type R3GroundedRecurrentReportMode,
} from "../src/r3/grounded-recurrent-report-consumer-run";

const MODES:
  readonly R3GroundedRecurrentReportMode[] =
    [
      "ignore-all",
      "respond-all",
      "exact-text-once",
      "ideal-grounded-episode",
    ];

describe("R3 grounded recurrent report consumer", () => {
  it("creates valid recurrent report pressure and qualifies bounded ideal consumer value", () => {
    const results =
      Object.fromEntries(
        MODES.map(
          (mode) => {
            const run =
              createR3GroundedRecurrentReportRun(
                mode,
              );
            run.runTicks(1800);
            return [
              mode,
              run.metrics(),
            ];
          },
        ),
      );

    console.log(
      "R3_GROUNDED_RECURRENT_REPORT_CONSUMER " +
        JSON.stringify(
          results,
        ),
    );

    const ignore =
      results["ignore-all"]!;
    const respondAll =
      results["respond-all"]!;
    const exact =
      results["exact-text-once"]!;
    const ideal =
      results[
        "ideal-grounded-episode"
      ]!;

    expect(
      ideal.firstAcceptedRequestOutOfSight,
    ).toBe(true);
    expect(
      ideal.repeatInsideUnresolvedEpisode,
    ).toBe(true);
    expect(
      ideal.sameSurfaceAfterSettledEpisode,
    ).toBe(true);

    expect(
      ideal.processingCompletedCount,
    ).toBeGreaterThan(
      ignore.processingCompletedCount,
    );
    expect(
      ideal.processingCompletedCount,
    ).toBeGreaterThan(
      exact.processingCompletedCount,
    );
    expect(
      ideal.acceptedReportCount,
    ).toBeLessThan(
      respondAll.acceptedReportCount,
    );
    expect(
      ideal.ignoredRepeatInsideUnresolvedEpisode,
    ).toBe(true);
    expect(
      ideal.rackPlacementCount,
    ).toBeGreaterThanOrEqual(2);
    expect(
      exact.acceptedReportCount,
    ).toBe(1);
  });
});
