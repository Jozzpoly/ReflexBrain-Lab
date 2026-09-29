import type {
  AutonomousLifeStep,
  LifeEvent,
  LifePlace,
  LifeWorldPublicSnapshot,
  ResidentActivity,
  ResidentDecision,
  ResidentId,
  ResidentMatter,
  ResidentPolicy,
  ResidentPolicyInput,
  ResidentPrivateExperience,
} from "./life-contracts";
import {
  MATERIAL_FIXTURE_MATTER_IDS,
  resetFixtureActivitySerials,
  WorkerFixturePolicy,
} from "./life-fixture-policies";
import {
  AutonomousLifeWorld,
  distance,
} from "./life-world";
import {
  AutonomousResidentAgent,
} from "./resident-agent";
import {
  R3_GROUNDED_REQUEST_TEXT,
} from "./grounded-recurrent-report-consumer-run";

export type R3GroundedPatrolMode =
  | "supply-ideal"
  | "supply-respond-all"
  | "reserve-purpose-aware"
  | "reserve-purpose-blind";

export type R3GroundedPatrolPurpose =
  | "supply-rack"
  | "preserve-source-reserve";

export const R3_GROUNDED_PATROL_PLACES:
  Readonly<Record<LifePlace["id"], LifePlace>> = {
    source: { id: "source", position: { x: 4, y: 0 } },
    input_rack: { id: "input_rack", position: { x: 8, y: 0 } },
    workbench: { id: "workbench", position: { x: 10, y: 0 } },
    output: { id: "output", position: { x: 12, y: 0 } },
    depot: { id: "depot", position: { x: 18, y: 0 } },
  };

export interface R3GroundedPatrolPolicyDebug {
  acceptedReportCount: number;
  acceptedReportTicks: readonly number[];
  pendingSupply: boolean;
  patrolPhase: string;
}

export interface R3GroundedPatrolMetrics {
  mode: R3GroundedPatrolMode;
  purpose: R3GroundedPatrolPurpose;
  ticks: number;
  requestCount: number;
  acceptedReportCount: number;
  rackPlacementCount: number;
  processingCompletedCount: number;
  workerBlockedTicks: number;
  sourceReserveDeficitTicks: number;
}

export interface R3GroundedPatrolRun {
  readonly world: AutonomousLifeWorld;
  advanceOneTick(): AutonomousLifeStep;
  runTicks(count: number): readonly AutonomousLifeStep[];
  allEvents(): readonly LifeEvent[];
  privateExperiences(): readonly ResidentPrivateExperience[];
  metrics(): R3GroundedPatrolMetrics;
  miraPolicyDebug(): R3GroundedPatrolPolicyDebug;
}

const SUPPLY_MATTER: ResidentMatter = {
  id: "resident:mira:matter:patrol-supply-rack",
  statement:
    "keep workshop processing supplied by moving a raw blank from source to the input rack when grounded evidence indicates the rack needs supply",
  establishedTick: 0,
  source: "authored",
};

const RESERVE_MATTER: ResidentMatter = {
  id: "resident:mira:matter:patrol-preserve-source-reserve",
  statement:
    "preserve the three raw blanks at the source as an emergency reserve; do not spend reserve stock to replenish the workshop rack",
  establishedTick: 0,
  source: "authored",
};

const JANEK_MATTER: ResidentMatter = {
  id: MATERIAL_FIXTURE_MATTER_IDS.worker,
  statement:
    "turn available raw blanks into finished workshop parts",
  establishedTick: 0,
  source: "authored",
};

export function createR3GroundedPatrolRun(
  mode: R3GroundedPatrolMode,
): R3GroundedPatrolRun {
  resetFixtureActivitySerials();

  const purpose = purposeForMode(mode);
  const world = new AutonomousLifeWorld({
    sourcePosition: R3_GROUNDED_PATROL_PLACES.source.position,
    sourceCapacity: 3,
    sourceReplenishTicks: 120,
    workbenchPosition: R3_GROUNDED_PATROL_PLACES.workbench.position,
    processingTicks: 24,
  });

  world.addResident(
    "resident:mira",
    { x: 4, y: 0 },
    {
      sightRadius: 2.5,
      hearingRadius: 5,
      speedPerTick: 0.03,
    },
  );
  world.addResident(
    "resident:janek",
    { x: 9.6, y: 0.6 },
  );

  const miraPolicy = new GroundedPatrolMiraPolicy(mode);
  const agents = new Map<ResidentId, AutonomousResidentAgent>([
    [
      "resident:mira",
      new AutonomousResidentAgent(
        miraPolicy,
        [purpose === "supply-rack" ? SUPPLY_MATTER : RESERVE_MATTER],
      ),
    ],
    [
      "resident:janek",
      new AutonomousResidentAgent(
        new WorkerFixturePolicy(),
        [JANEK_MATTER],
      ),
    ],
  ]);

  for (let index = 0; index < 3; index += 1) {
    world.addMaterial("raw_blank", {
      x: R3_GROUNDED_PATROL_PLACES.source.position.x + index * 0.12,
      y: R3_GROUNDED_PATROL_PLACES.source.position.y,
    });
  }

  const history: LifeEvent[] = [];
  const experiences: ResidentPrivateExperience[] = [];
  let sourceReserveDeficitTicks = 0;

  const run: R3GroundedPatrolRun = {
    world,

    advanceOneTick() {
      const decisions = new Map<ResidentId, ResidentDecision>();
      const privateInputs = new Map<
        ResidentId,
        {
          activityBefore: ResidentActivity | null;
          matters: readonly ResidentMatter[];
          observation: import("./life-contracts").ResidentObservation;
          memory: import("./life-contracts").ResidentPrivateMemory;
        }
      >();

      for (const residentId of [...agents.keys()].sort((a, b) => a.localeCompare(b))) {
        const agent = agents.get(residentId)!;
        const before = agent.debugState();
        const observation = world.perceive(residentId);
        const decision = agent.decide(
          observation,
          R3_GROUNDED_PATROL_PLACES,
        );

        decisions.set(residentId, decision);
        privateInputs.set(residentId, {
          activityBefore: before.activity,
          matters: structuredClone(before.matters),
          observation: structuredClone(observation),
          memory: structuredClone(agent.debugState().memory),
        });
      }

      const intents = new Map(
        [...decisions.entries()].map(([residentId, decision]) => [
          residentId,
          decision.intent,
        ]),
      );

      const events = world.step(intents);
      const snapshot = world.snapshot();

      if (freeRawAtSource(snapshot) < 3) {
        sourceReserveDeficitTicks += 1;
      }

      history.push(...events.map((event) => structuredClone(event)));

      for (const [residentId, decision] of decisions) {
        const input = privateInputs.get(residentId)!;
        experiences.push({
          tick: input.observation.tick,
          residentId,
          matters: structuredClone(input.matters),
          activityBefore: input.activityBefore
            ? structuredClone(input.activityBefore)
            : null,
          observation: structuredClone(input.observation),
          memory: structuredClone(input.memory),
          decision: structuredClone(decision),
          factualOutcomeEvents: events
            .filter((event) => event.actorId === residentId)
            .map((event) => structuredClone(event)),
        });
      }

      const activities: Record<string, ResidentActivity | null> = {};
      for (const [residentId, decision] of decisions) {
        activities[residentId] = decision.activity
          ? structuredClone(decision.activity)
          : null;
      }

      return {
        tick: world.tick,
        events: events.map((event) => structuredClone(event)),
        snapshot,
        activities,
      };
    },

    runTicks(count) {
      if (!Number.isSafeInteger(count) || count < 1) {
        throw new Error("runTicks requires a positive safe integer");
      }

      const steps: AutonomousLifeStep[] = [];
      for (let index = 0; index < count; index += 1) {
        steps.push(this.advanceOneTick());
      }
      return steps;
    },

    allEvents() {
      return history.map((event) => structuredClone(event));
    },

    privateExperiences() {
      return experiences.map((experience) => structuredClone(experience));
    },

    metrics() {
      const requestCount = history.filter(
        (event) =>
          event.kind === "speech" &&
          event.actorId === "resident:janek" &&
          event.payload.text === R3_GROUNDED_REQUEST_TEXT,
      ).length;

      const rackPlacementCount = history.filter(
        (event) =>
          event.kind === "place" &&
          event.actorId === "resident:mira" &&
          event.payload.objectKind === "raw_blank" &&
          distance(
            event.position,
            R3_GROUNDED_PATROL_PLACES.input_rack.position,
          ) <= 0.75,
      ).length;

      const processingCompletedCount = history.filter(
        (event) =>
          event.kind === "processing_completed" &&
          event.actorId === "resident:janek",
      ).length;

      const workerBlockedTicks = experiences.filter(
        (experience) =>
          experience.residentId === "resident:janek" &&
          experience.decision.activity?.kind === "seek_input" &&
          (
            experience.decision.activity.phase === "blocked_waiting_for_input" ||
            experience.decision.activity.phase === "wait_at_empty_rack"
          ),
      ).length;

      return {
        mode,
        purpose,
        ticks: world.tick,
        requestCount,
        acceptedReportCount: miraPolicy.debug().acceptedReportCount,
        rackPlacementCount,
        processingCompletedCount,
        workerBlockedTicks,
        sourceReserveDeficitTicks,
      };
    },

    miraPolicyDebug() {
      return miraPolicy.debug();
    },
  };

  return run;
}

class GroundedPatrolMiraPolicy implements ResidentPolicy {
  readonly residentId = "resident:mira" as const;

  private pendingSupply = false;
  private acceptedReportCount = 0;
  private readonly acceptedReportTicks: number[] = [];
  private phase:
    | "dwell_source"
    | "to_rack"
    | "dwell_rack"
    | "to_source" = "dwell_source";
  private dwellRemaining = 90;

  constructor(
    private readonly mode: R3GroundedPatrolMode,
  ) {}

  debug(): R3GroundedPatrolPolicyDebug {
    return {
      acceptedReportCount: this.acceptedReportCount,
      acceptedReportTicks: [...this.acceptedReportTicks],
      pendingSupply: this.pendingSupply,
      patrolPhase: this.phase,
    };
  }

  decide(input: ResidentPolicyInput): ResidentDecision {
    this.updatePrivateSettlement(input);
    this.consumeGroundedReport(input);

    for (;;) {
      if (this.phase === "dwell_source") {
        if (this.dwellRemaining <= 0) {
          this.phase = "to_rack";
          continue;
        }

        this.dwellRemaining -= 1;

        if (
          this.pendingSupply &&
          input.observation.heldObject === null
        ) {
          const raw = visibleFreeRawAt(
            input,
            input.places.source,
          );
          if (raw) {
            return {
              intent: {
                kind: "pickup",
                objectId: raw.id,
              },
              activity: patrolActivity(
                input.previousActivity,
                input.observation.tick,
                this.phase,
              ),
            };
          }
        }

        return idlePatrol(input, this.phase);
      }

      if (this.phase === "to_rack") {
        if (
          near(
            input.observation.self.position,
            input.places.input_rack.position,
          )
        ) {
          this.phase = "dwell_rack";
          this.dwellRemaining = 90;
          continue;
        }

        return movePatrol(
          input,
          this.phase,
          input.places.input_rack.position,
        );
      }

      if (this.phase === "dwell_rack") {
        if (this.dwellRemaining <= 0) {
          this.phase = "to_source";
          continue;
        }

        this.dwellRemaining -= 1;

        const held = input.observation.heldObject;
        if (
          this.pendingSupply &&
          held?.kind === "raw_blank"
        ) {
          return {
            intent: {
              kind: "place",
              objectId: held.id,
              position: input.places.input_rack.position,
            },
            activity: patrolActivity(
              input.previousActivity,
              input.observation.tick,
              this.phase,
            ),
          };
        }

        return idlePatrol(input, this.phase);
      }

      if (
        near(
          input.observation.self.position,
          input.places.source.position,
        )
      ) {
        this.phase = "dwell_source";
        this.dwellRemaining = 90;
        continue;
      }

      return movePatrol(
        input,
        this.phase,
        input.places.source.position,
      );
    }
  }

  private consumeGroundedReport(
    input: ResidentPolicyInput,
  ): void {
    const heard = input.observation.heardEvents.some(
      (event) =>
        event.kind === "speech" &&
        event.actorId === "resident:janek" &&
        event.payload.text === R3_GROUNDED_REQUEST_TEXT,
    );

    if (!heard) return;

    const currentRackStock =
      visibleFreeRawAt(
        input,
        input.places.input_rack,
      ) !== null;

    switch (this.mode) {
      case "supply-ideal":
      case "reserve-purpose-blind":
        if (
          !this.pendingSupply &&
          !currentRackStock
        ) {
          this.acceptedReportCount += 1;
          this.acceptedReportTicks.push(input.observation.tick);
          this.pendingSupply = true;
        }
        return;

      case "supply-respond-all":
        this.acceptedReportCount += 1;
        this.acceptedReportTicks.push(input.observation.tick);
        this.pendingSupply = true;
        return;

      case "reserve-purpose-aware":
        return;
    }
  }

  private updatePrivateSettlement(
    input: ResidentPolicyInput,
  ): void {
    if (
      !this.pendingSupply ||
      input.observation.heldObject !== null ||
      distance(
        input.observation.self.position,
        input.places.input_rack.position,
      ) > 2.5
    ) {
      return;
    }

    if (
      visibleFreeRawAt(
        input,
        input.places.input_rack,
      )
    ) {
      this.pendingSupply = false;
    }
  }
}

function purposeForMode(
  mode: R3GroundedPatrolMode,
): R3GroundedPatrolPurpose {
  return mode.startsWith("supply-")
    ? "supply-rack"
    : "preserve-source-reserve";
}

function visibleFreeRawAt(
  input: ResidentPolicyInput,
  place: LifePlace,
): import("./life-contracts").MaterialSnapshot | null {
  return (
    input.observation.visibleObjects.find(
      (object) =>
        object.kind === "raw_blank" &&
        object.location.kind === "free" &&
        distance(object.location.position, place.position) <= 0.75,
    ) ?? null
  );
}

function near(
  left: { x: number; y: number },
  right: { x: number; y: number },
  radius = 0.38,
): boolean {
  return distance(left, right) <= radius;
}

function patrolActivity(
  previous: ResidentActivity | null,
  tick: number,
  phase: string,
): ResidentActivity {
  if (
    previous &&
    previous.kind === "grounded_patrol"
  ) {
    return {
      ...previous,
      phase,
      subjectId: null,
    };
  }

  return {
    id: "resident:mira:grounded_patrol:" + tick,
    kind: "grounded_patrol",
    phase,
    startedTick: tick,
    subjectId: null,
  };
}

function idlePatrol(
  input: ResidentPolicyInput,
  phase: string,
): ResidentDecision {
  return {
    intent: { kind: "idle" },
    activity: patrolActivity(
      input.previousActivity,
      input.observation.tick,
      phase,
    ),
  };
}

function movePatrol(
  input: ResidentPolicyInput,
  phase: string,
  target: { x: number; y: number },
): ResidentDecision {
  return {
    intent: {
      kind: "move_to",
      target,
    },
    activity: patrolActivity(
      input.previousActivity,
      input.observation.tick,
      phase,
    ),
  };
}

function freeRawAtSource(
  snapshot: LifeWorldPublicSnapshot,
): number {
  return snapshot.objects.filter(
    (object) =>
      object.kind === "raw_blank" &&
      object.location.kind === "free" &&
      distance(
        object.location.position,
        R3_GROUNDED_PATROL_PLACES.source.position,
      ) <= 0.75,
  ).length;
}
