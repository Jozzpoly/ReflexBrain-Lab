import {
  R3_LIFE_PLACES,
  r3MaterialAuthoredMatters,
} from "./autonomous-life-run";
import {
  resetFixtureActivitySerials,
  StewardFixturePolicy,
  WorkerFixturePolicy,
} from "./life-fixture-policies";
import type {
  AutonomousLifeStep,
  LifeEvent,
  ResidentActivity,
  ResidentDecision,
  ResidentId,
  ResidentMatter,
  ResidentPolicy,
  ResidentPolicyInput,
  ResidentPrivateExperience,
} from "./life-contracts";
import { AutonomousLifeWorld } from "./life-world";
import {
  MIXED_PRESSURE_MATTER_IDS,
  r3MixedPressureJanekMatters,
} from "./mixed-pressure-fixture-policy";
import { AutonomousResidentAgent } from "./resident-agent";

export type R3SemanticConsumerMode =
  | "ignore-all"
  | "respond-all"
  | "cadence-only"
  | "ideal-semantic-oracle";

export const R3_SEMANTIC_PRESSURE_MESSAGES = {
  relevant:
    "Janek, the depot inspection status is complete.",
  irrelevant:
    "Janek, the courtyard flowers are blooming.",
} as const;

export const R3_SEMANTIC_PRESSURE_PATTERN =
  [
    "relevant",
    "irrelevant",
    "irrelevant",
    "relevant",
    "irrelevant",
    "relevant",
    "relevant",
    "irrelevant",
    "relevant",
    "irrelevant",
    "irrelevant",
    "relevant",
  ] as const;

export interface R3SemanticConsumerRunOptions {
  mode: R3SemanticConsumerMode;
  messageIntervalTicks?: number;
  initialSourceRaw?: number;
  janekMatterOverrides?: readonly ResidentMatter[];
}

export interface R3SemanticConsumerRun {
  readonly world: AutonomousLifeWorld;
  advanceOneTick(): AutonomousLifeStep;
  runTicks(count: number): readonly AutonomousLifeStep[];
  allEvents(): readonly LifeEvent[];
  privateExperiences(): readonly ResidentPrivateExperience[];
}

/**
 * Research-only consumer-feasibility ecology.
 *
 * The pressure speaker is deliberately simple and autonomous: it emits
 * patterned meaningful-status and irrelevant-local utterances on a fixed
 * internal cadence, independent of Janek's decisions. The point is controlled
 * semantic pressure, not a candidate resident architecture.
 *
 * The "ideal-semantic-oracle" is also explicitly authored research
 * instrumentation. Its outputs MUST NOT be treated as learned evidence or
 * automatic training labels.
 */
export function createR3SemanticConsumerRun(
  options: R3SemanticConsumerRunOptions,
): R3SemanticConsumerRun {
  resetFixtureActivitySerials();

  const interval = options.messageIntervalTicks ?? 20;
  if (!Number.isSafeInteger(interval) || interval < 2) {
    throw new Error(
      "messageIntervalTicks must be a safe integer >= 2",
    );
  }

  const world = new AutonomousLifeWorld({
    sourcePosition: R3_LIFE_PLACES.source.position,
    workbenchPosition: R3_LIFE_PLACES.workbench.position,
  });

  world.addResident("resident:mira", { x: 8, y: 0.6 });
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
    { x: 10, y: 0.6 },
    {
      speedPerTick: 0,
      sightRadius: 2.5,
      hearingRadius: 5,
    },
  );

  const agents = new Map<ResidentId, AutonomousResidentAgent>([
    [
      "resident:mira",
      new AutonomousResidentAgent(
        new StewardFixturePolicy(),
        r3MaterialAuthoredMatters("resident:mira"),
      ),
    ],
    [
      "resident:janek",
      new AutonomousResidentAgent(
        new SemanticConsumerJanekPolicy(options.mode),
        options.janekMatterOverrides ??
          r3MixedPressureJanekMatters("baseline"),
      ),
    ],
    [
      "resident:ida",
      new AutonomousResidentAgent(
        new PatternedSemanticPressurePolicy(interval),
        [],
      ),
    ],
  ]);

  const initialRaw = options.initialSourceRaw ?? 3;
  for (let index = 0; index < initialRaw; index += 1) {
    world.addMaterial("raw_blank", {
      x:
        R3_LIFE_PLACES.source.position.x +
        index * 0.12,
      y: R3_LIFE_PLACES.source.position.y,
    });
  }

  const history: LifeEvent[] = [];
  const experiences: ResidentPrivateExperience[] = [];

  return {
    world,

    advanceOneTick(): AutonomousLifeStep {
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

      for (
        const residentId of
          [...agents.keys()].sort((a, b) =>
            a.localeCompare(b),
          )
      ) {
        const agent = agents.get(residentId)!;
        const before = agent.debugState();
        const observation = world.perceive(residentId);
        const decision = agent.decide(
          observation,
          R3_LIFE_PLACES,
        );
        decisions.set(residentId, decision);
        privateInputs.set(residentId, {
          activityBefore: before.activity,
          matters: structuredClone(before.matters),
          observation: structuredClone(observation),
          memory: structuredClone(
            agent.debugState().memory,
          ),
        });
      }

      const intents = new Map(
        [...decisions.entries()].map(
          ([id, decision]) => [id, decision.intent],
        ),
      );
      const events = world.step(intents);
      history.push(
        ...events.map((event) => structuredClone(event)),
      );

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
            .filter(
              (event) => event.actorId === residentId,
            )
            .map((event) => structuredClone(event)),
        });
      }

      const activities: Record<
        string,
        ResidentActivity | null
      > = {};
      for (const [residentId, decision] of decisions) {
        activities[residentId] = decision.activity
          ? structuredClone(decision.activity)
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

    runTicks(count: number): readonly AutonomousLifeStep[] {
      if (!Number.isSafeInteger(count) || count < 1) {
        throw new Error(
          "runTicks requires a positive safe integer",
        );
      }
      const steps: AutonomousLifeStep[] = [];
      for (let index = 0; index < count; index += 1) {
        steps.push(this.advanceOneTick());
      }
      return steps;
    },

    allEvents() {
      return history.map((event) =>
        structuredClone(event),
      );
    },

    privateExperiences() {
      return experiences.map((experience) =>
        structuredClone(experience),
      );
    },
  };
}

class SemanticConsumerJanekPolicy
  implements ResidentPolicy
{
  readonly residentId = "resident:janek" as const;
  private readonly worker = new WorkerFixturePolicy();
  private observedSpeechCount = 0;

  constructor(
    private readonly mode: R3SemanticConsumerMode,
  ) {}

  decide(input: ResidentPolicyInput): ResidentDecision {
    const heard = input.observation.heardEvents.find(
      (event) =>
        event.kind === "speech" &&
        event.actorId === "resident:ida" &&
        typeof event.payload.text === "string" &&
        event.payload.text.trim().length > 0,
    );

    if (
      heard &&
      hasMatter(
        input,
        MIXED_PRESSURE_MATTER_IDS.reportResponse,
      )
    ) {
      const speechIndex = this.observedSpeechCount;
      this.observedSpeechCount += 1;

      if (
        this.shouldRespond(
          input,
          heard.payload.text as string,
          speechIndex,
        )
      ) {
        return {
          intent: {
            kind: "speak",
            text: "Ida, received.",
            radius: 5,
          },
          activity: responseActivity(
            input.previousActivity,
            input.observation.tick,
          ),
        };
      }
    }

    return this.worker.decide(input);
  }

  private shouldRespond(
    input: ResidentPolicyInput,
    speechText: string,
    speechIndex: number,
  ): boolean {
    switch (this.mode) {
      case "ignore-all":
        return false;
      case "respond-all":
        return true;
      case "cadence-only":
        return speechIndex % 2 === 0;
      case "ideal-semantic-oracle":
        return idealLocalReportApplicabilityOracle(
          input,
          speechText,
        );
    }
  }
}

/**
 * Explicit research oracle over actor-private evidence only.
 *
 * This is deliberately hand-authored semantic knowledge. It exists to test
 * whether a perfect semantic boundary would have a useful downstream
 * consumer. It is NOT a proposed implementation of ReflexBrain and its answer
 * is NOT training ground truth.
 */
function idealLocalReportApplicabilityOracle(
  input: ResidentPolicyInput,
  speechText: string,
): boolean {
  const reportMatter = input.matters.find(
    (matter) =>
      matter.id === MIXED_PRESSURE_MATTER_IDS.reportResponse,
  );
  if (!reportMatter) return false;

  const statement =
    reportMatter.statement.trim().toLowerCase();
  const matterAcceptsLocalUpdates =
    statement.includes("status report") ||
    statement.includes("immediate update");

  const normalizedSpeech =
    speechText.trim().toLowerCase();
  const isRelevantStatusReport =
    normalizedSpeech ===
    R3_SEMANTIC_PRESSURE_MESSAGES.relevant.toLowerCase();

  return (
    matterAcceptsLocalUpdates &&
    isRelevantStatusReport
  );
}

class PatternedSemanticPressurePolicy
  implements ResidentPolicy
{
  readonly residentId = "resident:ida" as const;

  private ticksSinceSpeech = 0;
  private messageIndex = 0;

  constructor(
    private readonly messageIntervalTicks: number,
  ) {}

  decide(
    input: ResidentPolicyInput,
  ): ResidentDecision {
    this.ticksSinceSpeech += 1;

    if (
      this.ticksSinceSpeech >=
      this.messageIntervalTicks
    ) {
      this.ticksSinceSpeech = 0;
      const kind =
        R3_SEMANTIC_PRESSURE_PATTERN[
          this.messageIndex %
            R3_SEMANTIC_PRESSURE_PATTERN.length
        ]!;
      this.messageIndex += 1;

      return {
        intent: {
          kind: "speak",
          text:
            R3_SEMANTIC_PRESSURE_MESSAGES[kind],
          radius: 5,
        },
        activity: speakerActivity(
          input.previousActivity,
          input.observation.tick,
          "relay_message",
        ),
      };
    }

    return {
      intent: { kind: "idle" },
      activity: speakerActivity(
        input.previousActivity,
        input.observation.tick,
        "wait",
      ),
    };
  }
}

function hasMatter(
  input: ResidentPolicyInput,
  matterId: string,
): boolean {
  return input.matters.some(
    (matter) => matter.id === matterId,
  );
}

function responseActivity(
  previous: ResidentActivity | null,
  tick: number,
): ResidentActivity {
  if (
    previous?.kind === "respond_to_semantic_pressure"
  ) {
    return {
      ...previous,
      phase: "acknowledge_relevant_report",
    };
  }

  return {
    id:
      "resident:janek:respond_to_semantic_pressure:" +
      tick,
    kind: "respond_to_semantic_pressure",
    phase: "acknowledge_relevant_report",
    startedTick: tick,
    subjectId: null,
  };
}

function speakerActivity(
  previous: ResidentActivity | null,
  tick: number,
  phase: string,
): ResidentActivity {
  if (
    previous?.kind === "semantic_pressure_source"
  ) {
    return { ...previous, phase };
  }

  return {
    id:
      "resident:ida:semantic_pressure_source:" +
      tick,
    kind: "semantic_pressure_source",
    phase,
    startedTick: tick,
    subjectId: null,
  };
}

