import type {
  AutonomousLifeStep,
  LifeEvent,
  ResidentActivity,
  ResidentId,
  ResidentMatter,
  ResidentPrivateExperience,
} from "./life-contracts";
import {
  ContactMessengerFixturePolicy,
  PatrolContactFixturePolicy,
  CONTACT_FIXTURE_MATTER_IDS,
} from "./contact-fixture-policies";
import { R3_LIFE_PLACES } from "./autonomous-life-run";
import { AutonomousLifeWorld } from "./life-world";
import { AutonomousResidentAgent } from "./resident-agent";

export interface AutonomousContactRunOptions {
  janekStart?: import("./life-contracts").Vec2;
  idaStart?: import("./life-contracts").Vec2;
  matterOverrides?: Partial<
    Record<ResidentId, readonly ResidentMatter[]>
  >;
}

export interface AutonomousContactRun {
  readonly world: AutonomousLifeWorld;
  advanceOneTick(): AutonomousLifeStep;
  runTicks(count: number): readonly AutonomousLifeStep[];
  residentDebug(
    residentId: ResidentId,
  ): ReturnType<AutonomousResidentAgent["debugState"]> | null;
  allEvents(): readonly LifeEvent[];
  privateExperiences(): readonly ResidentPrivateExperience[];
}

/**
 * Second autonomous ecology for anti-core qualification.
 *
 * No material task is active. Janek continuously patrols between two authored
 * places. Ida has to acquire and maintain contact through private sight /
 * last-known position and periodically report in person.
 */
export function createAutonomousContactRun(
  options: AutonomousContactRunOptions = {},
): AutonomousContactRun {
  const world = new AutonomousLifeWorld({
    sourcePosition: R3_LIFE_PLACES.source.position,
    sourceCapacity: 0,
    workbenchPosition: R3_LIFE_PLACES.workbench.position,
  });

  world.addResident(
    "resident:janek",
    options.janekStart ?? R3_LIFE_PLACES.workbench.position,
    { speedPerTick: 0.12, sightRadius: 2.5, hearingRadius: 5 },
  );
  world.addResident(
    "resident:ida",
    options.idaStart ?? R3_LIFE_PLACES.source.position,
    { speedPerTick: 0.19, sightRadius: 2.5, hearingRadius: 5 },
  );

  const agents = new Map<ResidentId, AutonomousResidentAgent>([
    [
      "resident:janek",
      new AutonomousResidentAgent(
        new PatrolContactFixturePolicy(),
        options.matterOverrides?.["resident:janek"] ??
          contactMatters("resident:janek"),
      ),
    ],
    [
      "resident:ida",
      new AutonomousResidentAgent(
        new ContactMessengerFixturePolicy(),
        options.matterOverrides?.["resident:ida"] ??
          contactMatters("resident:ida"),
      ),
    ],
  ]);

  const history: LifeEvent[] = [];
  const experiences: ResidentPrivateExperience[] = [];

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
          activityBefore: ResidentActivity | null;
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
        snapshot: world.snapshot(),
        activities,
      };
    },

    runTicks(count: number): readonly AutonomousLifeStep[] {
      if (!Number.isSafeInteger(count) || count < 1) {
        throw new Error("runTicks requires a positive safe integer");
      }
      const steps: AutonomousLifeStep[] = [];
      for (let index = 0; index < count; index += 1) {
        steps.push(this.advanceOneTick());
      }
      return steps;
    },

    residentDebug(residentId: ResidentId) {
      const agent = agents.get(residentId);
      return agent ? agent.debugState() : null;
    },

    allEvents() {
      return history.map((event) => structuredClone(event));
    },

    privateExperiences() {
      return experiences.map((entry) => structuredClone(entry));
    },
  };
}


function contactMatters(residentId: "resident:janek" | "resident:ida"): readonly ResidentMatter[] {
  if (residentId === "resident:janek") {
    return [{
      id: CONTACT_FIXTURE_MATTER_IDS.patrol,
      statement: "patrol between the workshop and depot while remaining available for local contact",
      establishedTick: 0,
      source: "authored",
    }];
  }
  return [{
    id: CONTACT_FIXTURE_MATTER_IDS.report,
    statement: "maintain intermittent physical contact with Janek and report depot inspection status in person",
    establishedTick: 0,
    source: "authored",
  }];
}
