import { describe, expect, it } from "vitest";
import {
  createAutonomousLifeRun,
  R3_LIFE_PLACES,
} from "../src/r3/autonomous-life-run";
import { distance } from "../src/r3/life-world";

describe("R3 autonomous life pressure host", () => {
  it("creates repeated material life with zero Owner input", () => {
    const run = createAutonomousLifeRun();
    run.runTicks(3500);

    const events = run.allEvents();
    const processed = events.filter(
      (event) => event.kind === "processing_completed",
    );
    const depotPlacements = events.filter(
      (event) =>
        event.kind === "place" &&
        distance(event.position, R3_LIFE_PLACES.depot.position) <= 0.5,
    );

    expect(processed.length).toBeGreaterThanOrEqual(3);
    expect(depotPlacements.length).toBeGreaterThanOrEqual(2);

    for (const residentId of [
      "resident:mira",
      "resident:janek",
      "resident:ida",
    ] as const) {
      expect(
        events.some(
          (event) =>
            event.actorId === residentId &&
            (event.kind === "motion" ||
              event.kind === "pickup" ||
              event.kind === "place"),
        ),
      ).toBe(true);
    }
  });

  it("has real cross-resident causal dependence instead of three isolated animations", () => {
    const full = createAutonomousLifeRun();
    full.runTicks(2600);
    const fullProduced = full
      .allEvents()
      .filter((event) => event.kind === "processing_completed").length;

    const withoutSteward = createAutonomousLifeRun({
      enabledResidents: ["resident:janek", "resident:ida"],
      initialSourceRaw: 3,
    });
    withoutSteward.runTicks(2600);
    const withoutStewardProduced = withoutSteward
      .allEvents()
      .filter((event) => event.kind === "processing_completed").length;

    expect(fullProduced).toBeGreaterThan(0);
    expect(withoutStewardProduced).toBe(0);
  });

  it("preserves material causal lineage across multiple residents", () => {
    const run = createAutonomousLifeRun();
    run.runTicks(4200);

    const events = run.allEvents();
    const byId = new Map(events.map((event) => [event.id, event]));
    const generatedIds = new Set(
      events
        .filter((event) => event.kind === "resource_generated")
        .map((event) => event.subjectId)
        .filter((value): value is string => value !== null),
    );

    const depotDelivery = [...events]
      .reverse()
      .find(
        (event) =>
          event.kind === "place" &&
          event.subjectId !== null &&
          generatedIds.has(event.subjectId) &&
          distance(event.position, R3_LIFE_PLACES.depot.position) <= 0.5,
      );

    expect(depotDelivery).toBeDefined();

    const chain: Array<(typeof events)[number]> = [];
    let cursor = depotDelivery!;
    const seen = new Set<string>();
    while (!seen.has(cursor.id)) {
      seen.add(cursor.id);
      chain.push(cursor);
      const causeId = cursor.causes[0];
      if (!causeId) break;
      const cause = byId.get(causeId);
      if (!cause) throw new Error("causal lineage references missing event");
      cursor = cause;
    }

    expect(chain.some((event) => event.kind === "resource_generated")).toBe(true);
    expect(
      chain.some(
        (event) =>
          event.kind === "place" && event.actorId === "resident:mira",
      ),
    ).toBe(true);
    expect(
      chain.some(
        (event) =>
          event.kind === "processing_completed" &&
          event.actorId === "resident:janek",
      ),
    ).toBe(true);
    expect(
      chain.some(
        (event) =>
          event.kind === "pickup" && event.actorId === "resident:ida",
      ),
    ).toBe(true);
  });

  it("does not expose distant source inventory through private observation", () => {
    const run = createAutonomousLifeRun();
    const observation = run.world.perceive("resident:mira");

    expect(
      observation.visibleObjects.some(
        (object) =>
          object.kind === "raw_blank" &&
          object.location.kind === "free" &&
          distance(
            object.location.position,
            R3_LIFE_PLACES.source.position,
          ) <= 0.6,
      ),
    ).toBe(false);
  });

  it("preserves one activity identity across many movement ticks", () => {
    const run = createAutonomousLifeRun();

    const activityIds: string[] = [];
    for (let i = 0; i < 25; i += 1) {
      const step = run.advanceOneTick();
      activityIds.push(step.activities["resident:mira"]!.id);
    }

    expect(new Set(activityIds).size).toBe(1);
    expect(activityIds[0]).toMatch(/maintain_input_stock/);
  });

  it("invalidates stale last-known object location after checked absence", () => {
    const run = createAutonomousLifeRun();
    let rememberedObjectId: string | null = null;

    for (let i = 0; i < 120; i += 1) {
      run.advanceOneTick();
      const memory = run.residentDebug("resident:mira")!.memory;
      const seen = Object.values(memory.objectBeliefs).find(
        (belief) =>
          belief.kind === "raw_blank" &&
          belief.lastKnownLocation?.kind === "free",
      );
      if (seen) {
        rememberedObjectId = seen.objectId;
        break;
      }
    }

    expect(rememberedObjectId).not.toBeNull();

    // Continue long enough for the remembered object to be picked up/moved and
    // for Mira to physically revisit/check its old location.
    run.runTicks(500);
    const belief =
      run.residentDebug("resident:mira")!.memory.objectBeliefs[
        rememberedObjectId!
      ];

    expect(belief).toBeDefined();
    if (belief.lastKnownLocation?.kind === "free") {
      const mira = run.world
        .snapshot()
        .actors.find((actor) => actor.id === "resident:mira")!;
      // A still-known free location is acceptable only if Mira has not yet
      // physically checked that exact location.
      expect(
        distance(mira.position, belief.lastKnownLocation.position),
      ).toBeGreaterThan(0.75);
    }
  });

  it("generates semantic pressure from resident blockage rather than a scripted tick", () => {
    const run = createAutonomousLifeRun({
      enabledResidents: ["resident:janek"],
      initialSourceRaw: 0,
    });
    run.runTicks(500);

    const requests = run
      .allEvents()
      .filter((event) => event.kind === "speech");

    expect(requests.length).toBeGreaterThanOrEqual(2);
    expect(
      requests.every(
        (event) => event.payload.text === "The input rack is empty.",
      ),
    ).toBe(true);
    expect(
      requests.map((event) => event.tick),
    ).not.toContain(90);
  });
});


describe("R3 private experience stream", () => {
  it("records autonomous actor-private trajectories without embedding World snapshots in model input", () => {
    const run = createAutonomousLifeRun();
    run.runTicks(500);

    const rows = run.privateExperiences();
    expect(rows.length).toBe(1500);

    for (const row of rows.slice(0, 30)) {
      expect(row.standingMatter.length).toBeGreaterThan(10);
      expect("snapshot" in row).toBe(false);
      expect("world" in row).toBe(false);
      expect(row.observation.self.id).toBe(row.residentId);
    }
  });

  it("preserves divergent private experience for residents sharing one World", () => {
    const run = createAutonomousLifeRun();
    run.runTicks(120);

    const rows = run.privateExperiences();
    const mira = rows.find(
      (row) =>
        row.residentId === "resident:mira" &&
        row.observation.visibleObjects.length > 0,
    );
    const idaSameTick = mira
      ? rows.find(
          (row) =>
            row.residentId === "resident:ida" &&
            row.tick === mira.tick,
        )
      : undefined;

    expect(mira).toBeDefined();
    expect(idaSameTick).toBeDefined();

    const miraIds = new Set(
      mira!.observation.visibleObjects.map((object) => object.id),
    );
    const idaIds = new Set(
      idaSameTick!.observation.visibleObjects.map((object) => object.id),
    );

    expect([...miraIds].some((id) => !idaIds.has(id))).toBe(true);
  });

  it("joins private decisions to factual same-tick World outcomes without making those outcomes input evidence", () => {
    const run = createAutonomousLifeRun();
    run.runTicks(800);

    const rows = run.privateExperiences();
    const pickup = rows.find((row) =>
      row.factualOutcomeEvents.some((event) => event.kind === "pickup"),
    );

    expect(pickup).toBeDefined();
    expect(
      pickup!.factualOutcomeEvents.every(
        (event) => event.actorId === pickup!.residentId,
      ),
    ).toBe(true);
    expect(
      pickup!.observation.heardEvents.some(
        (event) => pickup!.factualOutcomeEvents.some((outcome) => outcome.id === event.id),
      ),
    ).toBe(false);
  });
});
