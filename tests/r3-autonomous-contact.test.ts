import { describe, expect, it } from "vitest";
import { createAutonomousContactRun } from "../src/r3/autonomous-contact-run";

describe("R3 second autonomous contact ecology", () => {
  it("runs moving-target contact and communication with zero Owner input", () => {
    const run = createAutonomousContactRun();
    run.runTicks(1800);

    const events = run.allEvents();
    const janekMotion = events.filter(
      (event) =>
        event.kind === "motion" &&
        event.actorId === "resident:janek",
    );
    const idaMotion = events.filter(
      (event) =>
        event.kind === "motion" &&
        event.actorId === "resident:ida",
    );
    const reports = events.filter(
      (event) =>
        event.kind === "speech" &&
        event.actorId === "resident:ida" &&
        event.payload.text ===
          "Janek, the depot inspection is complete.",
    );

    expect(janekMotion.length).toBeGreaterThan(300);
    expect(idaMotion.length).toBeGreaterThan(300);
    expect(reports.length).toBeGreaterThanOrEqual(3);
  });

  it("reuses the host without material-chain behavior becoming mandatory", () => {
    const run = createAutonomousContactRun();
    run.runTicks(700);

    expect(run.world.snapshot().objects).toHaveLength(0);
    expect(
      run.allEvents().some(
        (event) =>
          event.kind === "pickup" ||
          event.kind === "place" ||
          event.kind === "processing_completed",
      ),
    ).toBe(false);
    expect(
      run.allEvents().some((event) => event.kind === "speech"),
    ).toBe(true);
  });

  it("acquires moving actor contact through private sight rather than World actor truth", () => {
    const run = createAutonomousContactRun();

    expect(
      run.residentDebug("resident:ida")!.memory.actorBeliefs[
        "resident:janek"
      ],
    ).toBeUndefined();

    run.runTicks(900);

    const belief =
      run.residentDebug("resident:ida")!.memory.actorBeliefs[
        "resident:janek"
      ];
    expect(belief).toBeDefined();
    expect(belief!.lastSeenTick).toBeGreaterThan(0);
  });

  it("delivers Ida's factual speech into Janek's private hearing after physical contact", () => {
    const run = createAutonomousContactRun();
    run.runTicks(1000);

    const report = run
      .allEvents()
      .find(
        (event) =>
          event.kind === "speech" &&
          event.actorId === "resident:ida",
      );
    expect(report).toBeDefined();

    const janekHeard = run
      .privateExperiences()
      .some(
        (row) =>
          row.residentId === "resident:janek" &&
          row.observation.heardEvents.some(
            (event) => event.id === report!.id,
          ),
      );

    expect(janekHeard).toBe(true);
  });

  it("creates last-known-contact pressure when a previously seen moving actor leaves sight", () => {
    const run = createAutonomousContactRun();
    run.runTicks(1300);

    const staleContactRow = run
      .privateExperiences()
      .find(
        (row) =>
          row.residentId === "resident:ida" &&
          row.decision.activity?.phase === "check_last_known_contact",
      );

    expect(staleContactRow).toBeDefined();
    expect(
      staleContactRow!.observation.visibleActors.some(
        (actor) => actor.id === "resident:janek",
      ),
    ).toBe(false);
    expect(
      staleContactRow!.memory.actorBeliefs["resident:janek"]
        ?.lastKnownPosition,
    ).not.toBeNull();
  });
});


describe("R3 contact matter causality", () => {
  it("removes Ida's contact/report life when her matter is absent while Janek keeps patrolling", () => {
    const run = createAutonomousContactRun({
      matterOverrides: {
        "resident:ida": [],
      },
    });
    run.runTicks(900);

    const events = run.allEvents();
    expect(
      events.some(
        (event) =>
          event.actorId === "resident:janek" &&
          event.kind === "motion",
      ),
    ).toBe(true);
    expect(
      events.some(
        (event) =>
          event.actorId === "resident:ida" &&
          (event.kind === "motion" || event.kind === "speech"),
      ),
    ).toBe(false);

    const ida = run.residentDebug("resident:ida")!;
    expect(ida.matters).toEqual([]);
    expect(ida.activity).toBeNull();
  });
});
