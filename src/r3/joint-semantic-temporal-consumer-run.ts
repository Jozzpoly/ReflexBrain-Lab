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

export type R3JointSemanticDomain =
  | "depot"
  | "courtyard";

export type R3JointSemanticState =
  | "complete"
  | "delayed"
  | "suspended";

export type R3JointSemanticTemporalMode =
  | "ignore-all"
  | "respond-all"
  | "purpose-only"
  | "temporal-only"
  | "exact-text-purpose"
  | "ideal-joint-oracle";

export const R3_JOINT_STATUS_MESSAGES: Readonly<
  Record<
    R3JointSemanticDomain,
    Readonly<
      Record<
        R3JointSemanticState,
        readonly [string, string]
      >
    >
  >
> = {
  depot: {
    complete: [
      "Janek, the depot inspection is complete.",
      "Janek, the storage-area review has finished.",
    ],
    delayed: [
      "Janek, the depot inspection is delayed.",
      "Janek, the storage-area review needs more time.",
    ],
    suspended: [
      "Janek, the depot inspection is suspended.",
      "Janek, the storage-area review has been put on hold.",
    ],
  },
  courtyard: {
    complete: [
      "Janek, the courtyard flower inspection is complete.",
      "Janek, the garden-condition review has finished.",
    ],
    delayed: [
      "Janek, the courtyard flower inspection is delayed.",
      "Janek, the garden-condition review needs more time.",
    ],
    suspended: [
      "Janek, the courtyard flower inspection is suspended.",
      "Janek, the garden-condition review has been put on hold.",
    ],
  },
};

export interface R3JointSemanticTemporalRunOptions {
  mode: R3JointSemanticTemporalMode;
  purposeDomain: R3JointSemanticDomain;
  pressureIntervalTicks?: number;
  initialSourceRaw?: number;
}

export interface R3JointSemanticTemporalRun {
  readonly world: AutonomousLifeWorld;
  advanceOneTick(): AutonomousLifeStep;
  runTicks(count: number): readonly AutonomousLifeStep[];
  allEvents(): readonly LifeEvent[];
  privateExperiences(): readonly ResidentPrivateExperience[];
}

/**
 * Research-only three-way semantic-consumer pressure.
 *
 * The tested relation is:
 * actor-private purpose × settled semantic history × current heard evidence.
 *
 * All semantic modes below are authored instrumentation. None is ReflexBrain.
 * The ideal oracle exists only to prove whether this joint information boundary
 * has a downstream consumer before a learned approximation is attempted.
 */
export function createR3JointSemanticTemporalRun(
  options: R3JointSemanticTemporalRunOptions,
): R3JointSemanticTemporalRun {
  resetFixtureActivitySerials();

  const interval =
    options.pressureIntervalTicks ?? 12;
  if (
    !Number.isSafeInteger(interval) ||
    interval < 2
  ) {
    throw new Error(
      "pressureIntervalTicks must be a safe integer >= 2",
    );
  }

  const world = new AutonomousLifeWorld({
    sourcePosition:
      R3_LIFE_PLACES.source.position,
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
    { x: 10, y: 0.6 },
    {
      speedPerTick: 0,
      sightRadius: 2.5,
      hearingRadius: 5,
    },
  );

  const agents =
    new Map<
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
          new JointSemanticTemporalJanekPolicy(
            options.mode,
          ),
          mattersForPurpose(
            options.purposeDomain,
          ),
        ),
      ],
      [
        "resident:ida",
        new AutonomousResidentAgent(
          new JointSemanticTemporalPressurePolicy(
            interval,
            options.purposeDomain,
          ),
          [],
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
    world.addMaterial(
      "raw_blank",
      {
        x:
          R3_LIFE_PLACES.source
            .position.x +
          index * 0.12,
        y:
          R3_LIFE_PLACES.source
            .position.y,
      },
    );
  }

  const history: LifeEvent[] = [];
  const experiences:
    ResidentPrivateExperience[] = [];

  return {
    world,

    advanceOneTick(): AutonomousLifeStep {
      const decisions =
        new Map<
          ResidentId,
          ResidentDecision
        >();
      const privateInputs =
        new Map<
          ResidentId,
          {
            activityBefore:
              ResidentActivity | null;
            matters:
              readonly ResidentMatter[];
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
          [...agents.keys()].sort(
            (a, b) =>
              a.localeCompare(b),
          )
      ) {
        const agent =
          agents.get(residentId)!;
        const before =
          agent.debugState();
        const observation =
          world.perceive(residentId);
        const decision =
          agent.decide(
            observation,
            R3_LIFE_PLACES,
          );
        decisions.set(
          residentId,
          decision,
        );
        privateInputs.set(
          residentId,
          {
            activityBefore:
              before.activity,
            matters:
              structuredClone(
                before.matters,
              ),
            observation:
              structuredClone(
                observation,
              ),
            memory:
              structuredClone(
                agent.debugState()
                  .memory,
              ),
          },
        );
      }

      const intents = new Map(
        [...decisions.entries()].map(
          ([id, decision]) => [
            id,
            decision.intent,
          ],
        ),
      );
      const events =
        world.step(intents);
      history.push(
        ...events.map((event) =>
          structuredClone(event),
        ),
      );

      for (
        const [
          residentId,
          decision,
        ] of decisions
      ) {
        const input =
          privateInputs.get(
            residentId,
          )!;
        experiences.push({
          tick:
            input.observation.tick,
          residentId,
          matters:
            structuredClone(
              input.matters,
            ),
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
            structuredClone(
              input.memory,
            ),
          decision:
            structuredClone(
              decision,
            ),
          factualOutcomeEvents:
            events
              .filter(
                (event) =>
                  event.actorId ===
                  residentId,
              )
              .map((event) =>
                structuredClone(
                  event,
                ),
              ),
        });
      }

      const activities:
        Record<
          string,
          ResidentActivity | null
        > = {};
      for (
        const [
          residentId,
          decision,
        ] of decisions
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
        events: events.map(
          (event) =>
            structuredClone(event),
        ),
        snapshot:
          world.snapshot(),
        activities,
      };
    },

    runTicks(
      count: number,
    ): readonly AutonomousLifeStep[] {
      if (
        !Number.isSafeInteger(
          count,
        ) ||
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

    allEvents() {
      return history.map(
        (event) =>
          structuredClone(event),
      );
    },

    privateExperiences() {
      return experiences.map(
        (experience) =>
          structuredClone(
            experience,
          ),
      );
    },
  };
}

export function r3JointPurposeMatters(
  domain: R3JointSemanticDomain,
): readonly ResidentMatter[] {
  return mattersForPurpose(domain);
}

class JointSemanticTemporalJanekPolicy
  implements ResidentPolicy
{
  readonly residentId =
    "resident:janek" as const;

  private readonly worker =
    new WorkerFixturePolicy();

  private lastAcknowledgedState:
    R3JointSemanticState | null =
    null;
  private lastAcknowledgedExactText:
    string | null = null;

  constructor(
    private readonly mode:
      R3JointSemanticTemporalMode,
  ) {}

  decide(
    input: ResidentPolicyInput,
  ): ResidentDecision {
    const heard =
      input.observation.heardEvents.find(
        (event) =>
          event.kind === "speech" &&
          event.actorId ===
            "resident:ida" &&
          typeof event.payload.text ===
            "string" &&
          event.payload.text
            .trim().length > 0,
      );

    if (
      heard &&
      hasReportMatter(input)
    ) {
      const text =
        heard.payload.text as string;
      const meaning =
        parseJointMessage(text);
      const purpose =
        parsePurposeDomain(input);

      if (
        this.shouldRespond(
          text,
          meaning,
          purpose,
        )
      ) {
        this.lastAcknowledgedExactText =
          text;
        if (meaning) {
          this.lastAcknowledgedState =
            meaning.state;
        }

        return {
          intent: {
            kind: "speak",
            text:
              "Ida, joint status received.",
            radius: 5,
          },
          activity:
            responseActivity(
              input.previousActivity,
              input.observation.tick,
            ),
        };
      }
    }

    return this.worker.decide(
      input,
    );
  }

  private shouldRespond(
    text: string,
    meaning:
      | {
          domain:
            R3JointSemanticDomain;
          state:
            R3JointSemanticState;
        }
      | null,
    purpose:
      R3JointSemanticDomain | null,
  ): boolean {
    switch (this.mode) {
      case "ignore-all":
        return false;

      case "respond-all":
        return meaning !== null;

      case "purpose-only":
        return (
          meaning !== null &&
          purpose !== null &&
          meaning.domain ===
            purpose
        );

      case "temporal-only":
        return (
          meaning !== null &&
          meaning.state !==
            this.lastAcknowledgedState
        );

      case "exact-text-purpose":
        return (
          meaning !== null &&
          purpose !== null &&
          meaning.domain ===
            purpose &&
          text !==
            this.lastAcknowledgedExactText
        );

      case "ideal-joint-oracle":
        return (
          meaning !== null &&
          purpose !== null &&
          meaning.domain ===
            purpose &&
          meaning.state !==
            this.lastAcknowledgedState
        );
    }
  }
}

class JointSemanticTemporalPressurePolicy
  implements ResidentPolicy
{
  readonly residentId =
    "resident:ida" as const;

  private ticksSinceSlot = 0;
  private slotIndex = 0;
  private pendingRequired = false;
  private currentRequiredState:
    R3JointSemanticState =
    "complete";
  private currentDecoyState:
    R3JointSemanticState =
    "delayed";
  private lastEmittedDomain:
    R3JointSemanticDomain | null =
    null;

  constructor(
    private readonly interval: number,
    private readonly requiredDomain:
      R3JointSemanticDomain,
  ) {}

  decide(
    input: ResidentPolicyInput,
  ): ResidentDecision {
    const heardAcknowledgement =
      input.observation.heardEvents.some(
        (event) =>
          event.kind === "speech" &&
          event.actorId ===
            "resident:janek" &&
          event.payload.text ===
            "Ida, joint status received.",
      );

    if (
      heardAcknowledgement &&
      this.pendingRequired &&
      this.lastEmittedDomain ===
        this.requiredDomain
    ) {
      this.pendingRequired = false;
    }

    this.ticksSinceSlot += 1;
    if (
      this.ticksSinceSlot <
      this.interval
    ) {
      return {
        intent: { kind: "idle" },
        activity:
          sourceActivity(
            input.previousActivity,
            input.observation.tick,
            this.pendingRequired
              ? "await_required_ack"
              : "wait",
          ),
      };
    }

    this.ticksSinceSlot = 0;
    const slot =
      this.slotIndex % 4;
    const episode =
      Math.floor(
        this.slotIndex / 4,
      );
    this.slotIndex += 1;

    const states:
      readonly R3JointSemanticState[] = [
        "complete",
        "delayed",
        "suspended",
      ];

    if (slot === 0) {
      this.currentRequiredState =
        states[
          episode %
            states.length
        ]!;
      this.currentDecoyState =
        states[
          (episode + 1) %
            states.length
        ]!;
      this.pendingRequired = true;

      return this.emit(
        input,
        this.requiredDomain,
        this.currentRequiredState,
        0,
        "required_primary",
      );
    }

    if (slot === 1) {
      return this.emit(
        input,
        oppositeDomain(
          this.requiredDomain,
        ),
        this.currentDecoyState,
        0,
        "decoy_primary",
      );
    }

    if (slot === 2) {
      return this.emit(
        input,
        this.requiredDomain,
        this.currentRequiredState,
        1,
        this.pendingRequired
          ? "required_repeat_unresolved"
          : "required_restatement_settled",
      );
    }

    if (this.pendingRequired) {
      return this.emit(
        input,
        this.requiredDomain,
        this.currentRequiredState,
        0,
        "required_final_unresolved",
      );
    }

    this.lastEmittedDomain = null;
    return {
      intent: { kind: "idle" },
      activity:
        sourceActivity(
          input.previousActivity,
          input.observation.tick,
          "required_settled",
        ),
    };
  }

  private emit(
    input: ResidentPolicyInput,
    domain: R3JointSemanticDomain,
    state: R3JointSemanticState,
    variant: 0 | 1,
    phase: string,
  ): ResidentDecision {
    this.lastEmittedDomain = domain;

    return {
      intent: {
        kind: "speak",
        text:
          R3_JOINT_STATUS_MESSAGES[
            domain
          ][state][variant],
        radius: 5,
      },
      activity:
        sourceActivity(
          input.previousActivity,
          input.observation.tick,
          phase,
        ),
    };
  }
}

function mattersForPurpose(
  domain: R3JointSemanticDomain,
): readonly ResidentMatter[] {
  return r3MixedPressureJanekMatters(
    "baseline",
  ).map((matter) =>
    matter.id ===
    MIXED_PRESSURE_MATTER_IDS.reportResponse
      ? {
          ...matter,
          statement:
            domain === "depot"
              ? "acknowledge changes in depot inspection status, but do not re-acknowledge equivalent restatements already handled"
              : "acknowledge changes in courtyard flower-condition status, but do not re-acknowledge equivalent restatements already handled",
        }
      : structuredClone(matter),
  );
}

function parsePurposeDomain(
  input: ResidentPolicyInput,
): R3JointSemanticDomain | null {
  const matter =
    input.matters.find(
      (candidate) =>
        candidate.id ===
        MIXED_PRESSURE_MATTER_IDS.reportResponse,
    );
  if (!matter) return null;

  const text =
    matter.statement
      .trim()
      .toLowerCase();

  if (
    text.includes("depot") ||
    text.includes("storage")
  ) {
    return "depot";
  }
  if (
    text.includes("courtyard") ||
    text.includes("flower") ||
    text.includes("garden")
  ) {
    return "courtyard";
  }

  return null;
}

function parseJointMessage(
  text: string,
):
  | {
      domain:
        R3JointSemanticDomain;
      state:
        R3JointSemanticState;
    }
  | null {
  const normalized =
    text.trim().toLowerCase();

  for (
    const domain of [
      "depot",
      "courtyard",
    ] as const
  ) {
    for (
      const state of [
        "complete",
        "delayed",
        "suspended",
      ] as const
    ) {
      if (
        R3_JOINT_STATUS_MESSAGES[
          domain
        ][state].some(
          (message) =>
            message.toLowerCase() ===
            normalized,
        )
      ) {
        return {
          domain,
          state,
        };
      }
    }
  }

  return null;
}

function oppositeDomain(
  domain: R3JointSemanticDomain,
): R3JointSemanticDomain {
  return domain === "depot"
    ? "courtyard"
    : "depot";
}

function hasReportMatter(
  input: ResidentPolicyInput,
): boolean {
  return input.matters.some(
    (matter) =>
      matter.id ===
      MIXED_PRESSURE_MATTER_IDS.reportResponse,
  );
}

function responseActivity(
  previous:
    ResidentActivity | null,
  tick: number,
): ResidentActivity {
  if (
    previous?.kind ===
    "respond_to_joint_semantic_pressure"
  ) {
    return {
      ...previous,
      phase:
        "acknowledge_joint_status",
    };
  }

  return {
    id:
      "resident:janek:respond_to_joint_semantic_pressure:" +
      tick,
    kind:
      "respond_to_joint_semantic_pressure",
    phase:
      "acknowledge_joint_status",
    startedTick: tick,
    subjectId: null,
  };
}

function sourceActivity(
  previous:
    ResidentActivity | null,
  tick: number,
  phase: string,
): ResidentActivity {
  if (
    previous?.kind ===
    "joint_semantic_temporal_pressure"
  ) {
    return {
      ...previous,
      phase,
    };
  }

  return {
    id:
      "resident:ida:joint_semantic_temporal_pressure:" +
      tick,
    kind:
      "joint_semantic_temporal_pressure",
    phase,
    startedTick: tick,
    subjectId: null,
  };
}
