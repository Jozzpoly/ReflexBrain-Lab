import { describe, expect, it } from "vitest";
import { createDeterministicLivingSpecimen } from "../src/r2/living-specimen";
import { buildLivingSpecimenMicroscope } from "../src/r2/living-specimen-microscope";

describe("R2 deterministic living specimen", () => {
  const run = createDeterministicLivingSpecimen();

  it("receives low-stakes speech without abandoning the ongoing carry activity", () => {
    const speechStep = run.steps.find(
      (step) => step.frame.world.tick === 3,
    )!;

    expect(
      speechStep.frame.privateByActor["resident:mira"]!.observations.map(
        (entry) => entry.id,
      ),
    ).toContain("obs:low-stakes-speech");
    expect(speechStep.decision.behavior).toBe("carry");
    expect(
      speechStep.frame.privateByActor["resident:mira"]!.activity?.id,
    ).toBe("activity:carry-crate-a");
  });

  it("reacts to actor-private hazard evidence rather than hidden World state", () => {
    const onset = run.steps.find(
      (step) => step.frame.world.tick === 6,
    )!;
    expect(onset.decision.behavior).toBe("protective_hold");
    expect(onset.decision.evidenceIds).toEqual(["obs:beam-falls"]);

    const heldTicks = run.steps
      .filter((step) => step.decision.behavior === "protective_hold")
      .map((step) => step.frame.world.tick);

    expect(heldTicks).toEqual([6, 7, 8]);
  });

  it("preserves activity identity across interruption and resumes after hazard resolution", () => {
    const before = run.steps.find(
      (step) => step.frame.world.tick === 5,
    )!;
    const during = run.steps.find(
      (step) => step.frame.world.tick === 7,
    )!;
    const resumed = run.steps.find(
      (step) => step.frame.world.tick === 9,
    )!;

    expect(
      before.frame.privateByActor["resident:mira"]!.activity?.id,
    ).toBe("activity:carry-crate-a");
    expect(
      during.frame.privateByActor["resident:mira"]!.activity?.id,
    ).toBe("activity:carry-crate-a");
    expect(
      during.frame.privateByActor["resident:mira"]!.activity?.phase,
    ).toBe("carry_to_shelf");
    expect(during.decision.behavior).toBe("protective_hold");
    expect(
      resumed.frame.privateByActor["resident:mira"]!.activity?.id,
    ).toBe("activity:carry-crate-a");

    expect(resumed.decision.behavior).toBe("resume_carry");
    expect(resumed.decision.evidenceIds).toEqual(["obs:beam-cleared"]);
  });

  it("stops physical progress because the private oracle holds, not because World motion is hard-blocked", () => {
    const x5 = run.steps.find((step) => step.frame.world.tick === 5)!.physical.actorX;
    const x6 = run.steps.find((step) => step.frame.world.tick === 6)!.physical.actorX;
    const x8 = run.steps.find((step) => step.frame.world.tick === 8)!.physical.actorX;
    const x9 = run.steps.find((step) => step.frame.world.tick === 9)!.physical.actorX;

    expect(x6).toBe(x5);
    expect(x8).toBe(x5);
    expect(x9).toBeGreaterThan(x8);

    for (const tick of [6, 7, 8]) {
      const step = run.steps.find(
        (candidate) => candidate.frame.world.tick === tick,
      )!;
      expect(
        step.frame.world.events.some(
          (event) => event.kind === "body.carry_motion",
        ),
      ).toBe(false);
    }

    const resumedMotion = run.steps.find(
      (candidate) => candidate.frame.world.tick === 9,
    )!;
    expect(
      resumedMotion.frame.world.events.some(
        (event) => event.kind === "body.carry_motion",
      ),
    ).toBe(true);
  });

  it("records physical progress as causal World events referenced by position facts", () => {
    const movingStep = run.steps.find(
      (step) =>
        step.frame.world.events.some(
          (event) => event.kind === "body.carry_motion",
        ),
    )!;
    const motion = movingStep.frame.world.events.find(
      (event) => event.kind === "body.carry_motion",
    )!;

    const actorPosition = movingStep.frame.world.facts.find(
      (fact) => fact.id === "fact:mira-position",
    )!;
    const cratePosition = movingStep.frame.world.facts.find(
      (fact) => fact.id === "fact:crate-position",
    )!;

    expect(actorPosition.provenanceEventIds).toContain(motion.id);
    expect(cratePosition.provenanceEventIds).toContain(motion.id);
  });

  it("eventually completes the same assigned carry activity", () => {
    const final = run.steps.at(-1)!;

    expect(final.physical.actorX).toBe(final.physical.destinationX);
    expect(final.physical.carrying).toBe(false);
    expect(final.decision.behavior).toBe("completed");
    expect(
      final.frame.privateByActor["resident:mira"]!.activity,
    ).toBeNull();
    const placementEvents = run.steps.flatMap((step) =>
      step.frame.world.events.filter(
        (entry) => entry.id === "event:crate-placed",
      ),
    );
    expect(placementEvents).toHaveLength(1);
  });

  it("produces a three-lane causal microscope without pretending oracle reasons are actor-private evidence", () => {
    const rows = buildLivingSpecimenMicroscope(run);
    expect(rows.some((row) => row.lane === "world")).toBe(true);
    expect(rows.some((row) => row.lane === "private")).toBe(true);
    expect(rows.some((row) => row.lane === "fixture_oracle")).toBe(true);

    const onsetRows = rows.filter((row) => row.tick === 6);
    expect(
      onsetRows.some(
        (row) =>
          row.lane === "private" &&
          row.id === "obs:beam-falls",
      ),
    ).toBe(true);
    expect(
      onsetRows.some(
        (row) =>
          row.lane === "fixture_oracle" &&
          row.detail.includes("protective_hold"),
      ),
    ).toBe(true);
  });
});
