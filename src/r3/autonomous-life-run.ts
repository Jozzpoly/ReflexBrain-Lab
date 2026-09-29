import type {
  AutonomousLifeStep,
  LifeEvent,
  LifePlace,
  ResidentActivity,
  ResidentId,
  ResidentMatter,
} from "./life-contracts";
import {
  CourierFixturePolicy,
  resetFixtureActivitySerials,
  StewardFixturePolicy,
  WorkerFixturePolicy,
  MATERIAL_FIXTURE_MATTER_IDS,
} from "./life-fixture-policies";
import { AutonomousLifeWorld } from "./life-world";
import { AutonomousResidentAgent } from "./resident-agent";

export interface AutonomousLifeRunOptions {
  enabledResidents?: readonly ResidentId[];
  initialSourceRaw?: number;
  matterOverrides?: Partial<
    Record<ResidentId, readonly ResidentMatter[]>
  >;
}

export interface AutonomousLifeRun {
  readonly world: AutonomousLifeWorld;
  advanceOneTick(): AutonomousLifeStep;
  runTicks(count: number): readonly AutonomousLifeStep[];
  residentDebug(residentId: ResidentId): ReturnType<AutonomousResidentAgent["debugState"]> | null;
  allEvents(): readonly LifeEvent[];
  privateExperiences(): readonly import("./life-contracts").ResidentPrivateExperience[];
  researchReplaceResidentMatters(
    residentId: ResidentId,
    matters: readonly ResidentMatter[],
  ): void;
}

export const R3_LIFE_PLACES: Readonly<Record<LifePlace["id"], LifePlace>> = {
  source: { id: "source", position: { x: 0, y: 0 } },
  input_rack: { id: "input_rack", position: { x: 8, y: 0 } },
  workbench: { id: "workbench", position: { x: 10, y: 0 } },
  output: { id: "output", position: { x: 12, y: 0 } },
  depot: { id: "depot", position: { x: 18, y: 0 } },
};

export function createAutonomousLifeRun(
  options: AutonomousLifeRunOptions = {},
): AutonomousLifeRun {
  resetFixtureActivitySerials();

  const enabled = new Set<ResidentId>(
    options.enabledResidents ?? [
      "resident:mira",
      "resident:janek",
      "resident:ida",
    ],
  );

  const world = new AutonomousLifeWorld({
    sourcePosition: R3_LIFE_PLACES.source.position,
    workbenchPosition: R3_LIFE_PLACES.workbench.position,
  });

  const agents = new Map<ResidentId, AutonomousResidentAgent>();

  if (enabled.has("resident:mira")) {
    world.addResident("resident:mira", { x: 8, y: 0.6 });
    agents.set(
      "resident:mira",
      new AutonomousResidentAgent(
        new StewardFixturePolicy(),
        options.matterOverrides?.["resident:mira"] ??
          r3MaterialAuthoredMatters("resident:mira"),
      ),
    );
  }
  if (enabled.has("resident:janek")) {
    world.addResident("resident:janek", { x: 9.6, y: 0.6 });
    agents.set(
      "resident:janek",
      new AutonomousResidentAgent(
        new WorkerFixturePolicy(),
        options.matterOverrides?.["resident:janek"] ??
          r3MaterialAuthoredMatters("resident:janek"),
      ),
    );
  }
  if (enabled.has("resident:ida")) {
    world.addResident("resident:ida", { x: 12, y: 0.6 });
    agents.set(
      "resident:ida",
      new AutonomousResidentAgent(
        new CourierFixturePolicy(),
        options.matterOverrides?.["resident:ida"] ??
          r3MaterialAuthoredMatters("resident:ida"),
      ),
    );
  }

  const initialRaw = options.initialSourceRaw ?? 3;
  for (let i = 0; i < initialRaw; i += 1) {
    world.addMaterial("raw_blank", {
      x: R3_LIFE_PLACES.source.position.x + i * 0.12,
      y: R3_LIFE_PLACES.source.position.y,
    });
  }

  const history: LifeEvent[] = [];
  const privateExperience: import("./life-contracts").ResidentPrivateExperience[] = [];

  return {
    world,

    advanceOneTick(): AutonomousLifeStep {
      const decisions = new Map<
        ResidentId,
        ReturnType<AutonomousResidentAgent["decide"]>
      >();
      const privateInputs = new Map<
        ResidentId,
        {
          activityBefore: import("./life-contracts").ResidentActivity | null;
          matters: readonly ResidentMatter[];
          observation: import("./life-contracts").ResidentObservation;
          memory: import("./life-contracts").ResidentPrivateMemory;
        }
      >();

      for (const residentId of [...agents.keys()].sort((a, b) =>
        a.localeCompare(b),
      )) {
        const agent = agents.get(residentId)!;
        const before = agent.debugState();
        const observation = world.perceive(residentId);
        const decision = agent.decide(observation, R3_LIFE_PLACES);
        decisions.set(residentId, decision);
        privateInputs.set(residentId, {
          activityBefore: before.activity,
          matters: structuredClone(before.matters),
          observation: structuredClone(observation),
          memory: structuredClone(agent.debugState().memory),
        });
      }

      const intents = new Map(
        [...decisions.entries()].map(([id, decision]) => [
          id,
          decision.intent,
        ]),
      );
      const events = world.step(intents);
      history.push(...events.map((event) => structuredClone(event)));

      for (const [residentId, decision] of decisions) {
        const input = privateInputs.get(residentId)!;
        privateExperience.push({
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
        snapshot: world.snapshot(),
        activities,
      };
    },

    runTicks(count: number): readonly AutonomousLifeStep[] {
      if (!Number.isSafeInteger(count) || count < 1) {
        throw new Error("runTicks requires a positive safe integer");
      }
      const steps: AutonomousLifeStep[] = [];
      for (let i = 0; i < count; i += 1) {
        steps.push(this.advanceOneTick());
      }
      return steps;
    },

    residentDebug(residentId: ResidentId) {
      const agent = agents.get(residentId);
      return agent ? agent.debugState() : null;
    },

    allEvents(): readonly LifeEvent[] {
      return history.map((event) => structuredClone(event));
    },

    privateExperiences() {
      return privateExperience.map((entry) => structuredClone(entry));
    },

    researchReplaceResidentMatters(
      residentId: ResidentId,
      matters: readonly ResidentMatter[],
    ): void {
      const agent = agents.get(residentId);
      if (!agent) {
        throw new Error(
          "cannot replace matters for missing resident " +
            residentId,
        );
      }
      agent.researchReplaceMatters(matters);
    },
  };
}


export function r3MaterialAuthoredMatters(
  residentId: ResidentId,
): readonly ResidentMatter[] {
  switch (residentId) {
    case "resident:mira":
      return [{
        id: MATERIAL_FIXTURE_MATTER_IDS.steward,
        statement: "keep the workshop input rack supplied with raw blanks",
        establishedTick: 0,
        source: "authored",
      }];
    case "resident:janek":
      return [{
        id: MATERIAL_FIXTURE_MATTER_IDS.worker,
        statement: "turn available raw blanks into finished workshop parts",
        establishedTick: 0,
        source: "authored",
      }];
    case "resident:ida":
      return [{
        id: MATERIAL_FIXTURE_MATTER_IDS.courier,
        statement: "carry finished workshop parts from output to the depot",
        establishedTick: 0,
        source: "authored",
      }];
  }
}
