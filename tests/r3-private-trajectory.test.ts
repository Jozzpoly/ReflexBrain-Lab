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
    expect(text).not.toContain(String(row.tick));
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
