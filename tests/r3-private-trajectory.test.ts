import { describe, expect, it } from "vitest";
import { createAutonomousLifeRun } from "../src/r3/autonomous-life-run";
import {
  buildR3PrivateTrajectoryWindows,
  deriveR3TemporalFactDelta,
  serializeR3PrivateExperience,
} from "../src/r3/private-trajectory";

describe("R3 private temporal corpus", () => {
  it("builds contiguous actor-private windows from autonomous life", () => {
    const run = createAutonomousLifeRun();
    run.runTicks(300);

    const windows = buildR3PrivateTrajectoryWindows(
      run.privateExperiences(),
      { historyLength: 6, horizonTicks: 8 },
    );

    expect(windows.length).toBeGreaterThan(700);

    const sample = windows[100]!;
    expect(sample.history).toHaveLength(6);
    expect(sample.future.tick).toBe(
      sample.history.at(-1)!.tick + 8,
    );
    expect(
      sample.history.every(
        (row) => row.residentId === sample.residentId,
      ),
    ).toBe(true);
  });

  it("serializes semantic private context without absolute tick or resident identity shortcuts", () => {
    const run = createAutonomousLifeRun();
    run.runTicks(20);

    const row = run.privateExperiences()[7]!;
    const text = serializeR3PrivateExperience(row);

    expect(text).toContain("standing matter:");
    expect(text).toContain("activity:");
    expect(text).not.toContain(row.residentId);
    expect(text).not.toContain("tick:");
  });

  it("derives factual temporal changes without introducing appraisal labels", () => {
    const run = createAutonomousLifeRun();
    run.runTicks(900);

    const windows = buildR3PrivateTrajectoryWindows(
      run.privateExperiences(),
      { historyLength: 8, horizonTicks: 16 },
    );
    const deltas = windows.map(deriveR3TemporalFactDelta);

    expect(
      deltas.some((delta) => delta.heldObjectChanged),
    ).toBe(true);
    expect(
      deltas.some((delta) => delta.activityPhaseChanged),
    ).toBe(true);

    const serialized = JSON.stringify(deltas);
    expect(serialized).not.toContain("threat");
    expect(serialized).not.toContain("interrupt");
    expect(serialized).not.toContain("attention");
    expect(serialized).not.toContain("cognition");
    expect(serialized).not.toContain("significance");
  });
});


describe("R3 naturally occurring semantic pressure", () => {
  it("delivers the same blocked-worker speech into different resident matters", () => {
    const run = createAutonomousLifeRun();
    run.runTicks(500);

    const speech = run
      .allEvents()
      .find(
        (event) =>
          event.kind === "speech" &&
          event.actorId === "resident:janek" &&
          event.payload.text === "The input rack is empty.",
      );

    expect(speech).toBeDefined();

    const heardRows = run
      .privateExperiences()
      .filter((row) =>
        row.observation.heardEvents.some(
          (event) => event.id === speech!.id,
        ),
      );

    expect(heardRows.length).toBeGreaterThanOrEqual(2);
    expect(
      heardRows.some((row) => row.residentId !== speech!.actorId),
    ).toBe(true);

    const matters = new Set(
      heardRows.map((row) => row.standingMatter),
    );
    expect(matters.size).toBeGreaterThanOrEqual(2);

    const heardTexts = heardRows.map((row) =>
      row.observation.heardEvents.find(
        (event) => event.id === speech!.id,
      )?.payload.text,
    );
    expect(
      heardTexts.every(
        (text) => text === "The input rack is empty.",
      ),
    ).toBe(true);

    const serialized = heardRows.map(serializeR3PrivateExperience);
    expect(
      serialized.every((text) =>
        text.includes("The input rack is empty."),
      ),
    ).toBe(true);
    expect(new Set(serialized).size).toBeGreaterThanOrEqual(2);
  });
});
