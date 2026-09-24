import {
  ContactMessengerFixturePolicy,
} from "./contact-fixture-policies";
import {
  r3ContactAuthoredMatters,
} from "./autonomous-contact-run";
import {
  R3_LIFE_PLACES,
  r3MaterialAuthoredMatters,
} from "./autonomous-life-run";
import {
  resetFixtureActivitySerials,
  StewardFixturePolicy,
} from "./life-fixture-policies";
import type {
  AutonomousLifeStep,
  LifeEvent,
  ResidentActivity,
  ResidentId,
  ResidentMatter,
  ResidentPrivateExperience,
} from "./life-contracts";
import { AutonomousLifeWorld } from "./life-world";
import {
  MixedPressureJanekFixturePolicy,
  r3MixedPressureJanekMatters,
  type R3MixedPressureMatterWording,
} from "./mixed-pressure-fixture-policy";
import {
  AutonomousResidentAgent,
} from "./resident-agent";

export interface R3MixedPressureRunOptions {
  janekMatterWording?: R3MixedPressureMatterWording;
  janekMatterOverrides?: readonly ResidentMatter[];
  janekReportGateMatterId?: string;
  reportCooldownTicks?: number;
  initialSourceRaw?: number;
}

export interface R3MixedPressureRun {
  readonly world: AutonomousLifeWorld;
  advanceOneTick(): AutonomousLifeStep;
  runTicks(count: number): readonly AutonomousLifeStep[];
  residentDebug(
    residentId: ResidentId,
  ): ReturnType<
    AutonomousResidentAgent["debugState"]
  > | null;
  allEvents(): readonly LifeEvent[];
  privateExperiences():
    readonly ResidentPrivateExperience[];
  researchReplaceResidentMatters(
    residentId: ResidentId,
    matters: readonly ResidentMatter[],
  ): void;
}

/**
 * Research-only ecology combining material work and intermittent local social
 * contact. It exists to falsify the shortcut matter<->ecology by making two
 * Janek matters switch causal responsibility in one continuous world.
 */
export function createR3MixedPressureRun(
  options: R3MixedPressureRunOptions = {},
): R3MixedPressureRun {
  resetFixtureActivitySerials();

  const world = new AutonomousLifeWorld({
    sourcePosition: R3_LIFE_PLACES.source.position,
    workbenchPosition:
      R3_LIFE_PLACES.workbench.position,
  });

  world.addResident(
    "resident:mira",
    { x: 8, y: 0.6 },
  );
  world.addResident(
    "resident:janek",
    { x: 9.6, y: 0.6 },
    {
      speedPerTick: 0.16,
      sightRadius: 2.5,
      hearingRadius: 5,
    },
  );
  world.addResident(
    "resident:ida",
    R3_LIFE_PLACES.source.position,
    {
      speedPerTick: 0.19,
      sightRadius: 2.5,
      hearingRadius: 5,
    },
  );

  const agents = new Map<
    ResidentId,
    AutonomousResidentAgent
  >([
    [
      "resident:mira",
      new AutonomousResidentAgent(
        new StewardFixturePolicy(),
        r3MaterialAuthoredMatters(
          "resident:mira",
        ),
      ),
    ],
    [
      "resident:janek",
      new AutonomousResidentAgent(
        new MixedPressureJanekFixturePolicy(
          options.janekReportGateMatterId,
        ),
        options.janekMatterOverrides ??
          r3MixedPressureJanekMatters(
            options.janekMatterWording ??
              "baseline",
          ),
      ),
    ],
    [
      "resident:ida",
      new AutonomousResidentAgent(
        new ContactMessengerFixturePolicy(
          options.reportCooldownTicks ?? 90,
        ),
        r3ContactAuthoredMatters(
          "resident:ida",
        ),
      ),
    ],
  ]);

  const initialRaw =
    options.initialSourceRaw ?? 3;
  for (
    let index = 0;
    index < initialRaw;
    index += 1
  ) {
    world.addMaterial("raw_blank", {
      x:
        R3_LIFE_PLACES.source.position.x +
        index * 0.12,
      y: R3_LIFE_PLACES.source.position.y,
    });
  }

  const history: LifeEvent[] = [];
  const experiences:
    ResidentPrivateExperience[] = [];

  return {
    world,

    advanceOneTick(): AutonomousLifeStep {
      const decisions = new Map<
        ResidentId,
        ReturnType<
          AutonomousResidentAgent["decide"]
        >
      >();
      const privateInputs = new Map<
        ResidentId,
        {
          activityBefore:
            ResidentActivity | null;
          matters: readonly ResidentMatter[];
          observation:
            import("./life-contracts")
              .ResidentObservation;
          memory:
            import("./life-contracts")
              .ResidentPrivateMemory;
        }
      >();

      for (
        const residentId of
          [...agents.keys()].sort((a, b) =>
            a.localeCompare(b),
          )
      ) {
        const agent = agents.get(residentId)!;
        const before = agent.debugState();
        const observation =
          world.perceive(residentId);
        const decision = agent.decide(
          observation,
          R3_LIFE_PLACES,
        );
        decisions.set(
          residentId,
          decision,
        );
        privateInputs.set(residentId, {
          activityBefore: before.activity,
          matters:
            structuredClone(before.matters),
          observation:
            structuredClone(observation),
          memory: structuredClone(
            agent.debugState().memory,
          ),
        });
      }

      const intents = new Map(
        [...decisions.entries()].map(
          ([id, decision]) => [
            id,
            decision.intent,
          ],
        ),
      );
      const events = world.step(intents);
      history.push(
        ...events.map((event) =>
          structuredClone(event),
        ),
      );

      for (
        const [residentId, decision]
          of decisions
      ) {
        const input =
          privateInputs.get(residentId)!;
        experiences.push({
          tick: input.observation.tick,
          residentId,
          matters:
            structuredClone(input.matters),
          activityBefore:
            input.activityBefore
              ? structuredClone(
                  input.activityBefore,
                )
              : null,
          observation:
            structuredClone(
              input.observation,
            ),
          memory:
            structuredClone(input.memory),
          decision:
            structuredClone(decision),
          factualOutcomeEvents: events
            .filter(
              (event) =>
                event.actorId ===
                residentId,
            )
            .map((event) =>
              structuredClone(event),
            ),
        });
      }

      const activities:
        Record<
          string,
          ResidentActivity | null
        > = {};
      for (
        const [residentId, decision]
          of decisions
      ) {
        activities[residentId] =
          decision.activity
            ? structuredClone(
                decision.activity,
              )
            : null;
      }

      return {
        tick: world.tick,
        events: events.map((event) =>
          structuredClone(event),
        ),
        snapshot: world.snapshot(),
        activities,
      };
    },

    runTicks(
      count: number,
    ): readonly AutonomousLifeStep[] {
      if (
        !Number.isSafeInteger(count) ||
        count < 1
      ) {
        throw new Error(
          "runTicks requires a positive safe integer",
        );
      }

      const steps:
        AutonomousLifeStep[] = [];
      for (
        let index = 0;
        index < count;
        index += 1
      ) {
        steps.push(
          this.advanceOneTick(),
        );
      }
      return steps;
    },

    residentDebug(
      residentId: ResidentId,
    ) {
      const agent =
        agents.get(residentId);
      return agent
        ? agent.debugState()
        : null;
    },

    allEvents() {
      return history.map((event) =>
        structuredClone(event),
      );
    },

    privateExperiences() {
      return experiences.map(
        (experience) =>
          structuredClone(experience),
      );
    },

    researchReplaceResidentMatters(
      residentId: ResidentId,
      matters: readonly ResidentMatter[],
    ): void {
      const agent =
        agents.get(residentId);
      if (!agent) {
        throw new Error(
          "cannot replace matters for missing resident " +
            residentId,
        );
      }
      agent.researchReplaceMatters(
        matters,
      );
    },
  };
}
