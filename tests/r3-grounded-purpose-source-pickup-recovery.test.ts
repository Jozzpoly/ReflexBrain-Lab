import {
  describe,
  expect,
  it,
} from "vitest";
import {
  auditR3GroundedPurposeStructure,
} from "../src/r3/grounded-purpose-structure-run";
import {
  diagnoseR3GroundedPurposeMaintainerLifecycle,
} from "../src/r3/grounded-purpose-maintainer-lifecycle-diagnosis";

describe(
  "R3 grounded purpose source pickup geometry recovery",
  () => {
    it(
      "requalifies the frozen purpose ecology after only the purpose-independent pickup geometry repair",
      () => {
        const audit =
          auditR3GroundedPurposeStructure();

        const lifecycle =
          diagnoseR3GroundedPurposeMaintainerLifecycle();

        const laterEpisodes =
          lifecycle.episodes.filter(
            (episode) =>
              episode.firstEmptyTick >= 120,
          );

        const laterRejectedRows =
          laterEpisodes.reduce(
            (sum, episode) =>
              sum +
              episode.pickupRejectedRows.length,
            0,
          );

        console.log(
          "R3_GROUNDED_PURPOSE_SOURCE_PICKUP_RECOVERY " +
            JSON.stringify({
              audit,
              lifecycle: {
                emptyEpisodeCount:
                  lifecycle.emptyEpisodeCount,
                completeEpisodeCount:
                  lifecycle.completeEpisodeCount,
                classification:
                  lifecycle.classification,
                aggregates:
                  lifecycle.aggregates,
                laterRejectedRows,
              },
            }),
        );

        expect(
          audit.stageA
            .causalStructurePass,
        ).toBe(true);
        expect(
          audit.stageB
            .wordingInvariancePass,
        ).toBe(true);
        expect(
          audit.stageC
            .rackRecurrentGroundingPass,
        ).toBe(true);
        expect(
          audit.stageC
            .outputRecurrentGroundingPass,
        ).toBe(true);
        expect(
          audit.stageC
            .recurrentGroundingPass,
        ).toBe(true);
        expect(
          audit.stageD
            .provenancePass,
        ).toBe(true);
        expect(
          audit.classification,
        ).toBe(
          "GROUNDED_PURPOSE_STRUCTURE_QUALIFIED",
        );

        expect(
          lifecycle
            .completeEpisodeCount,
        ).toBeGreaterThanOrEqual(3);
        expect(
          lifecycle.aggregates
            .completedPickup,
        ).toBeGreaterThanOrEqual(3);
        expect(
          lifecycle.aggregates
            .completedRackPlace,
        ).toBeGreaterThanOrEqual(3);
        expect(
          lifecycle.aggregates
            .recoveredSatisfied,
        ).toBeGreaterThanOrEqual(3);
        expect(
          laterRejectedRows,
        ).toBe(0);
      },
      90_000,
    );
  },
);
