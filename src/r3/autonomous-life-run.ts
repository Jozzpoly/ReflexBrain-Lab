import type {
  AutonomousLifeStep,
  LifeEvent,
  LifePlace,
  ResidentActivity,
  ResidentId,
} from "./life-contracts";
import {
  CourierFixturePolicy,
  resetFixtureActivitySerials,
  StewardFixturePolicy,
  WorkerFixturePolicy,
} from "./life-fixture-policies";
import { AutonomousLifeWorld } from "./life-world";
import { AutonomousResidentAgent } from "./resident-agent";

export interface AutonomousLifeRunOptions {
  enabledResidents?: readonly ResidentId[];
  initialSourceRaw?: number;
}

export interface AutonomousLifeRun {
  readonly world: AutonomousLifeWorld;
  advanceOneTick(): AutonomousLifeStep;
  runTicks(count: number): readonly AutonomousLifeStep[];
  residentDebug(residentId: ResidentId): ReturnType<AutonomousResidentAgent["debugState"]> | null;
  allEvents(): readonly LifeEvent[];
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
      new AutonomousResidentAgent(new StewardFixturePolicy()),
    );
  }
  if (enabled.has("resident:janek")) {
    world.addResident("resident:janek", { x: 9.6, y: 0.6 });
    agents.set(
      "resident:janek",
      new AutonomousResidentAgent(new WorkerFixturePolicy()),
    );
  }
  if (enabled.has("resident:ida")) {
    world.addResident("resident:ida", { x: 12, y: 0.6 });
    agents.set(
      "resident:ida",
      new AutonomousResidentAgent(new CourierFixturePolicy()),
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

  return {
    world,

    advanceOneTick(): AutonomousLifeStep {
      const decisions = new Map<
        ResidentId,
        ReturnType<AutonomousResidentAgent["decide"]>
      >();

      for (const residentId of [...agents.keys()].sort((a, b) =>
        a.localeCompare(b),
      )) {
        const agent = agents.get(residentId)!;
        const observation = world.perceive(residentId);
        decisions.set(
          residentId,
          agent.decide(observation, R3_LIFE_PLACES),
        );
      }

      const intents = new Map(
        [...decisions.entries()].map(([id, decision]) => [
          id,
          decision.intent,
        ]),
      );
      const events = world.step(intents);
      history.push(...events.map((event) => structuredClone(event)));

      const activities: Record<string, ResidentActivity> = {};
      for (const [residentId, decision] of decisions) {
        activities[residentId] = structuredClone(decision.activity);
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
  };
}
