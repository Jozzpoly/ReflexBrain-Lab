import {
  describe,
  expect,
  it,
} from "vitest";
import {
  diagnoseR3GroundedPurposeMaintainerLifecycle,
} from "../src/r3/grounded-purpose-maintainer-lifecycle-diagnosis";

describe(
  "R3 grounded purpose maintainer lifecycle diagnosis",
  () => {
    it(
      "traces rack-purpose recovery only from Ida-private evidence and factual Ida events",
      () => {
        const audit =
          diagnoseR3GroundedPurposeMaintainerLifecycle();

        console.log(
          "R3_GROUNDED_PURPOSE_MAINTAINER_LIFECYCLE " +
            JSON.stringify(audit),
        );

        expect(
          audit.horizonTicks,
        ).toBe(1800);

        expect(
          audit.emptyEpisodeCount,
        ).toBeGreaterThanOrEqual(3);

        expect(
          audit.episodes[0],
        ).toBeDefined();

        expect(
          audit.aggregates
            .respondedToEmpty,
        ).toBeGreaterThan(0);

        expect(
          audit.aggregates
            .reachedSource,
        ).toBeGreaterThan(0);

        expect(
          [
            "MAINTAINER_EMPTY_RESPONSE_FAIL",
            "MAINTAINER_SOURCE_ACQUISITION_FAIL",
            "MAINTAINER_SOURCE_AVAILABILITY_FAIL",
            "MAINTAINER_RETURN_OR_PLACE_FAIL",
            "MAINTAINER_RECOVERY_LIFECYCLE_COMPLETE",
            "MAINTAINER_RECOVERY_DIAGNOSIS_MIXED",
          ],
        ).toContain(
          audit.classification,
        );
      },
      60_000,
    );
  },
);
