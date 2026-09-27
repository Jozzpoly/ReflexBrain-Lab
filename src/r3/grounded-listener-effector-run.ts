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
  Vec2,
} from "./life-contracts";
import {
  MATERIAL_FIXTURE_MATTER_IDS,
  resetFixtureActivitySerials,
  WorkerFixturePolicy,
  type WorkerFixturePolicyOptions,
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

export const R3_LISTENER_FORWARD_TEXT =
  "Mira, please restock the input rack.";
export const R3_SUPPLIER_STOCKED_TEXT =
  "The input rack is stocked.";

export type R3ListenerEffectorMode =
  | "supply-ideal"
  | "supply-respond-all"
  | "reserve-purpose-aware"
  | "reserve-purpose-blind";

export const R3_LISTENER_EFFECTOR_PLACES:
  Readonly<Record<LifePlace["id"], LifePlace>> = {
    source: { id: "source", position: { x: 4, y: 0 } },
    input_rack: { id: "input_rack", position: { x: 8, y: 0 } },
    workbench: { id: "workbench", position: { x: 10, y: 0 } },
    output: { id: "output", position: { x: 12, y: 0 } },
    depot: { id: "depot", position: { x: 18, y: 0 } },
  };

export interface R3ListenerPolicyDebug {
  forwardedCount: number;
  forwardedTicks: readonly number[];
  unresolved: boolean;
}

export interface R3SupplierPolicyDebug {
  acceptedForwardCount: number;
  stockedReportCount: number;
  servicing: boolean;
}

export interface R3ListenerEffectorMetrics {
  mode: R3ListenerEffectorMode;
  ticks: number;
  janekRequestCount: number;
  idaForwardedCount: number;
  miraAcceptedForwardCount: number;
  miraStockedReportCount: number;
  rackPlacementCount: number;
  processingCompletedCount: number;
  workerBlockedTicks: number;
  sourceReserveDeficitTicks: number;
}

export interface R3ListenerEffectorRunOptions {
  idaPosition?: Vec2;
  janekWorkerOptions?: WorkerFixturePolicyOptions;
}

export interface R3ListenerEffectorRun {
  readonly world: AutonomousLifeWorld;
  advanceOneTick(): AutonomousLifeStep;
  runTicks(count: number): readonly AutonomousLifeStep[];
  allEvents(): readonly LifeEvent[];
  privateExperiences(): readonly ResidentPrivateExperience[];
  metrics(): R3ListenerEffectorMetrics;
  idaPolicyDebug(): R3ListenerPolicyDebug;
  miraPolicyDebug(): R3SupplierPolicyDebug;
}

const SUPPLY_MATTER: ResidentMatter = {
  id: "resident:ida:matter:listener-supply-rack",
  statement:
    "keep workshop processing supplied by forwarding credible grounded rack-shortage reports to the supplier when the shortage is not already being handled",
  establishedTick: 0,
  source: "authored",
};

const RESERVE_MATTER: ResidentMatter = {
  id: "resident:ida:matter:listener-preserve-source-reserve",
  statement:
    "preserve the three source raw blanks as emergency reserve; do not request supplier replenishment of the workshop rack from reserve stock",
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

const MIRA_SUPPLIER_MATTER: ResidentMatter = {
  id: "resident:mira:matter:listener-effector-supplier",
  statement:
    "when Ida requests workshop rack replenishment, carry one available raw blank from source to the input rack and report when the rack is privately observed stocked",
  establishedTick: 0,
  source: "authored",
};

export function createR3ListenerEffectorRun(
  mode: R3ListenerEffectorMode,
  options: R3ListenerEffectorRunOptions = {},
): R3ListenerEffectorRun {
  resetFixtureActivitySerials();

  const world = new AutonomousLifeWorld({
    sourcePosition: R3_LISTENER_EFFECTOR_PLACES.source.position,
    sourceCapacity: 3,
    sourceReplenishTicks: 120,
    workbenchPosition: R3_LISTENER_EFFECTOR_PLACES.workbench.position,
    processingTicks: 24,
  });

  world.addResident(
    "resident:ida",
    options.idaPosition ?? { x: 6, y: 0 },
    {
      sightRadius: 0.75,
      hearingRadius: 5,
      speedPerTick: 0.16,
    },
  );
  world.addResident(
    "resident:janek",
    { x: 9.6, y: 0.6 },
  );
  world.addResident(
    "resident:mira",
    { x: 4, y: 0 },
    {
      sightRadius: 2.5,
      hearingRadius: 5,
      speedPerTick: 0.03,
    },
  );

  const idaPolicy = new ListenerIdaPolicy(mode);
  const miraPolicy = new SupplierMiraPolicy();

  const agents = new Map<ResidentId, AutonomousResidentAgent>([
    [
      "resident:ida",
      new AutonomousResidentAgent(
        idaPolicy,
        [
          mode.startsWith("supply-")
            ? SUPPLY_MATTER
            : RESERVE_MATTER,
        ],
      ),
    ],
    [
      "resident:janek",
      new AutonomousResidentAgent(
        new WorkerFixturePolicy(
          options.janekWorkerOptions,
        ),
        [JANEK_MATTER],
      ),
    ],
    [
      "resident:mira",
      new AutonomousResidentAgent(
        miraPolicy,
        [MIRA_SUPPLIER_MATTER],
      ),
    ],
  ]);

  for (let index = 0; index < 3; index += 1) {
    world.addMaterial("raw_blank", {
      x: R3_LISTENER_EFFECTOR_PLACES.source.position.x + index * 0.12,
      y: R3_LISTENER_EFFECTOR_PLACES.source.position.y,
    });
  }

  const history: LifeEvent[] = [];
  const experiences: ResidentPrivateExperience[] = [];
  let sourceReserveDeficitTicks = 0;

  const run: R3ListenerEffectorRun = {
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
          R3_LISTENER_EFFECTOR_PLACES,
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
      const janekRequestCount = history.filter(
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
            R3_LISTENER_EFFECTOR_PLACES.input_rack.position,
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

      const idaDebug = idaPolicy.debug();
      const miraDebug = miraPolicy.debug();

      return {
        mode,
        ticks: world.tick,
        janekRequestCount,
        idaForwardedCount: idaDebug.forwardedCount,
        miraAcceptedForwardCount: miraDebug.acceptedForwardCount,
        miraStockedReportCount: miraDebug.stockedReportCount,
        rackPlacementCount,
        processingCompletedCount,
        workerBlockedTicks,
        sourceReserveDeficitTicks,
      };
    },

    idaPolicyDebug() {
      return idaPolicy.debug();
    },

    miraPolicyDebug() {
      return miraPolicy.debug();
    },
  };

  return run;
}

class ListenerIdaPolicy implements ResidentPolicy {
  readonly residentId = "resident:ida" as const;

  private unresolved = false;
  private forwardedCount = 0;
  private readonly forwardedTicks: number[] = [];

  constructor(
    private readonly mode: R3ListenerEffectorMode,
  ) {}

  debug(): R3ListenerPolicyDebug {
    return {
      forwardedCount: this.forwardedCount,
      forwardedTicks: [...this.forwardedTicks],
      unresolved: this.unresolved,
    };
  }

  decide(input: ResidentPolicyInput): ResidentDecision {
    let shouldForward = false;

    for (const event of input.observation.heardEvents) {
      if (
        event.kind !== "speech" ||
        typeof event.payload.text !== "string"
      ) {
        continue;
      }

      if (
        event.actorId === "resident:mira" &&
        event.payload.text === R3_SUPPLIER_STOCKED_TEXT
      ) {
        this.unresolved = false;
        continue;
      }

      if (
        event.actorId !== "resident:janek" ||
        event.payload.text !== R3_GROUNDED_REQUEST_TEXT
      ) {
        continue;
      }

      switch (this.mode) {
        case "supply-ideal":
        case "reserve-purpose-blind":
          if (!this.unresolved) {
            this.unresolved = true;
            shouldForward = true;
          }
          break;

        case "supply-respond-all":
          this.unresolved = true;
          shouldForward = true;
          break;

        case "reserve-purpose-aware":
          break;
      }
    }

    if (shouldForward) {
      this.forwardedCount += 1;
      this.forwardedTicks.push(input.observation.tick);
      return {
        intent: {
          kind: "speak",
          text: R3_LISTENER_FORWARD_TEXT,
          radius: 5,
        },
        activity: listenerActivity(input.previousActivity),
      };
    }

    return {
      intent: { kind: "idle" },
      activity: listenerActivity(input.previousActivity),
    };
  }
}

class SupplierMiraPolicy implements ResidentPolicy {
  readonly residentId = "resident:mira" as const;

  private servicing = false;
  private completionPending = false;
  private acceptedForwardCount = 0;
  private stockedReportCount = 0;

  debug(): R3SupplierPolicyDebug {
    return {
      acceptedForwardCount: this.acceptedForwardCount,
      stockedReportCount: this.stockedReportCount,
      servicing: this.servicing || this.completionPending,
    };
  }

  decide(input: ResidentPolicyInput): ResidentDecision {
    const tick = input.observation.tick;
    const source = input.places.source;
    const rack = input.places.input_rack;

    const heardForward = input.observation.heardEvents.some(
      (event) =>
        event.kind === "speech" &&
        event.actorId === "resident:ida" &&
        event.payload.text === R3_LISTENER_FORWARD_TEXT,
    );

    if (
      heardForward &&
      !this.servicing &&
      !this.completionPending
    ) {
      this.servicing = true;
      this.acceptedForwardCount += 1;
    }

    if (
      this.completionPending &&
      input.observation.heldObject === null &&
      distance(
        input.observation.self.position,
        rack.position,
      ) <= 2.5 &&
      visibleFreeRawAt(input, rack)
    ) {
      this.completionPending = false;
      this.servicing = false;
      this.stockedReportCount += 1;
      return {
        intent: {
          kind: "speak",
          text: R3_SUPPLIER_STOCKED_TEXT,
          radius: 5,
        },
        activity: supplierActivity(
          input.previousActivity,
          tick,
          "report_stocked",
        ),
      };
    }

    if (this.servicing || this.completionPending) {
      const held = input.observation.heldObject;

      if (held?.kind === "raw_blank") {
        if (
          near(
            input.observation.self.position,
            rack.position,
          )
        ) {
          this.completionPending = true;
          return {
            intent: {
              kind: "place",
              objectId: held.id,
              position: rack.position,
            },
            activity: supplierActivity(
              input.previousActivity,
              tick,
              "place_at_rack",
              held.id,
            ),
          };
        }

        return {
          intent: {
            kind: "move_to",
            target: rack.position,
          },
          activity: supplierActivity(
            input.previousActivity,
            tick,
            "carry_to_rack",
            held.id,
          ),
        };
      }

      if (
        !near(
          input.observation.self.position,
          source.position,
        )
      ) {
        return {
          intent: {
            kind: "move_to",
            target: source.position,
          },
          activity: supplierActivity(
            input.previousActivity,
            tick,
            "go_to_source",
          ),
        };
      }

      const raw = visibleFreeRawAt(input, source);
      if (raw) {
        return {
          intent: {
            kind: "pickup",
            objectId: raw.id,
          },
          activity: supplierActivity(
            input.previousActivity,
            tick,
            "pick_raw",
            raw.id,
          ),
        };
      }

      return {
        intent: { kind: "idle" },
        activity: supplierActivity(
          input.previousActivity,
          tick,
          "wait_for_raw",
        ),
      };
    }

    if (
      !near(
        input.observation.self.position,
        source.position,
      )
    ) {
      return {
        intent: {
          kind: "move_to",
          target: source.position,
        },
        activity: supplierActivity(
          input.previousActivity,
          tick,
          "return_to_source",
        ),
      };
    }

    return {
      intent: { kind: "idle" },
      activity: supplierActivity(
        input.previousActivity,
        tick,
        "wait_for_forward",
      ),
    };
  }
}

function listenerActivity(
  previous: ResidentActivity | null,
): ResidentActivity {
  if (previous?.kind === "grounded_listener") {
    return {
      ...previous,
      phase: "listen",
      subjectId: null,
    };
  }

  return {
    id: "resident:ida:grounded_listener",
    kind: "grounded_listener",
    phase: "listen",
    startedTick: 0,
    subjectId: null,
  };
}

function supplierActivity(
  previous: ResidentActivity | null,
  tick: number,
  phase: string,
  subjectId: string | null = null,
): ResidentActivity {
  if (
    previous?.kind === "grounded_supplier" &&
    previous.subjectId === subjectId
  ) {
    return {
      ...previous,
      phase,
    };
  }

  return {
    id: "resident:mira:grounded_supplier:" + tick,
    kind: "grounded_supplier",
    phase,
    startedTick: tick,
    subjectId,
  };
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

function freeRawAtSource(
  snapshot: LifeWorldPublicSnapshot,
): number {
  return snapshot.objects.filter(
    (object) =>
      object.kind === "raw_blank" &&
      object.location.kind === "free" &&
      distance(
        object.location.position,
        R3_LISTENER_EFFECTOR_PLACES.source.position,
      ) <= 0.75,
  ).length;
}
