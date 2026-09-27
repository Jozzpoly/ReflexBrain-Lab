import {
  describe,
  expect,
  it,
} from "vitest";
import {
  createAutonomousLifeRun,
} from "../src/r3/autonomous-life-run";
import {
  auditR3GroundedSupervisionOpportunities,
  buildR3GroundedMaterialEpisodes,
} from "../src/r3/grounded-supervision-opportunity";

describe("R3 grounded supervision opportunity audit", () => {
  it("deduplicates continuous private sightings into episodes", () => {
    const run =
      createAutonomousLifeRun();

    run.runTicks(180);

    const experiences =
      run.privateExperiences();
    const episodes =
      buildR3GroundedMaterialEpisodes(
        experiences,
      );

    expect(
      episodes.length,
    ).toBeGreaterThan(0);

    for (
      let index = 1;
      index < episodes.length;
      index += 1
    ) {
      const previous =
        episodes[index - 1]!;
      const current =
        episodes[index]!;

      if (
        previous.residentId ===
          current.residentId &&
        previous.objectId ===
          current.objectId &&
        previous.kind ===
          current.kind &&
        previous.mode ===
          current.mode
      ) {
        expect(
          current.startTick,
        ).toBeGreaterThan(
          previous.endTick + 1,
        );
      }
    }
  });

  it("audits naturally recurring cross-actor material correspondences without semantic labels", () => {
    const run =
      createAutonomousLifeRun();

    run.runTicks(960);

    const audit =
      auditR3GroundedSupervisionOpportunities(
        run.privateExperiences(),
      );

    console.log(
      "R3_GROUNDED_SUPERVISION_AUDIT " +
        JSON.stringify(
          audit,
        ),
    );

    expect(
      audit.experienceCount,
    ).toBeGreaterThan(0);
    expect(
      audit.uniqueObjectCount,
    ).toBeGreaterThan(0);
    expect(
      audit.multiResidentObjectCount,
    ).toBeGreaterThan(0);
    expect(
      audit.crossActorCorrespondenceCount,
    ).toBeGreaterThan(0);
    expect(
      audit.positiveGapCount,
    ).toBeGreaterThan(0);
    expect(
      audit.adjacentCrossActorHandoffObjectCount,
    ).toBeGreaterThan(0);
    expect(
      audit.sameKindCrossActorObjectCount,
    ).toBeGreaterThan(0);
    expect(
      audit.crossKindLifecycleObjectCount,
    ).toBeGreaterThan(0);
  });
});
