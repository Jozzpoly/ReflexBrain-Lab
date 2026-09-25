import { describe, expect, it } from "vitest";
import {
  createR3MixedPressureRun,
} from "../src/r3/mixed-pressure-run";
import {
  MIXED_PRESSURE_MATTER_IDS,
} from "../src/r3/mixed-pressure-fixture-policy";
import {
  MATERIAL_FIXTURE_MATTER_IDS,
} from "../src/r3/life-fixture-policies";

describe("R3 mixed-pressure ecology", () => {
  it("makes both Janek matters coexist while material work and local report response both occur", () => {
    const run =
      createR3MixedPressureRun();
    run.runTicks(900);

    const janek =
      run.privateExperiences().filter(
        (experience) =>
          experience.residentId ===
          "resident:janek",
      );

    expect(janek.length).toBe(900);

    for (const experience of janek.slice(0, 100)) {
      expect(
        experience.matters.map(
          (matter) => matter.id,
        ),
      ).toEqual([
        MATERIAL_FIXTURE_MATTER_IDS.worker,
        MIXED_PRESSURE_MATTER_IDS.reportResponse,
      ]);
    }

    const workerDecisions = janek.filter(
      (experience) =>
        experience.decision.activity !== null &&
        experience.decision.activity.kind !==
          "respond_to_local_report",
    );
    const reportResponses = janek.filter(
      (experience) =>
        experience.decision.activity?.kind ===
        "respond_to_local_report",
    );

    expect(workerDecisions.length).toBeGreaterThan(100);
    expect(reportResponses.length).toBeGreaterThan(2);

    for (const response of reportResponses) {
      expect(
        response.observation.heardEvents.some(
          (event) =>
            event.kind === "speech" &&
            event.actorId === "resident:ida",
        ),
      ).toBe(true);
      expect(response.decision.intent.kind).toBe("speak");
    }
  }, 20_000);

  it("keeps mixed-pressure life invariant under Janek matter wording-only paraphrase", () => {
    const baseline =
      createR3MixedPressureRun({
        janekMatterWording: "baseline",
      });
    const baselineSteps =
      baseline.runTicks(500);

    // Construct the second replay only after the first run is complete so
    // the disposable fixture activity serial is reset at the replay boundary.
    const paraphrase =
      createR3MixedPressureRun({
        janekMatterWording: "paraphrase",
      });
    const paraphraseSteps =
      paraphrase.runTicks(500);

    expect(
      paraphraseSteps.map((step) => ({
        tick: step.tick,
        events: step.events,
        snapshot: step.snapshot,
        activities: step.activities,
      })),
    ).toEqual(
      baselineSteps.map((step) => ({
        tick: step.tick,
        events: step.events,
        snapshot: step.snapshot,
        activities: step.activities,
      })),
    );

    const baselineJanek =
      baseline.privateExperiences().filter(
        (experience) =>
          experience.residentId ===
          "resident:janek",
      );
    const paraphraseJanek =
      paraphrase.privateExperiences().filter(
        (experience) =>
          experience.residentId ===
          "resident:janek",
      );

    expect(
      paraphraseJanek.map((row) => row.decision),
    ).toEqual(
      baselineJanek.map((row) => row.decision),
    );
    expect(
      paraphraseJanek[0]!.matters.map(
        (matter) => matter.statement,
      ),
    ).not.toEqual(
      baselineJanek[0]!.matters.map(
        (matter) => matter.statement,
      ),
    );
  }, 20_000);
});
