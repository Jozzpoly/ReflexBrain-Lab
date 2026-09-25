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

export type R3TemporalConsumerMode =
  | "ignore-all"
  | "respond-all"
  | "exact-text-change"
  | "ideal-semantic-state-change";

export type R3TemporalReportState =
  | "complete"
  | "delayed"
  | "suspended";

export const R3_TEMPORAL_STATUS_MESSAGES:
Readonly<
  Record<
    R3TemporalReportState,
    readonly [string, string]
  >
> = {
  complete: [
    "Janek, the depot inspection is complete.",
    "Janek, the storage review has finished.",
  ],
  delayed: [
    "Janek, the depot inspection is delayed.",
    "Janek, the storage review will take longer.",
  ],
  suspended: [
    "Janek, the depot inspection is suspended.",
    "Janek, the storage review has been put on hold.",
  ],
};

export interface R3SemanticTemporalConsumerRunOptions {
  mode: R3TemporalConsumerMode;
  pressureIntervalTicks?: number;
  initialSourceRaw?: number;
  janekMatterOverrides?: readonly ResidentMatter[];
}

export interface R3SemanticTemporalConsumerRun {
  readonly world: AutonomousLifeWorld;
  advanceOneTick(): AutonomousLifeStep;
  runTicks(count: number): readonly AutonomousLifeStep[];
  allEvents(): readonly LifeEvent[];
  privateExperiences(): readonly ResidentPrivateExperience[];
}

/**
 * Research-only temporal semantic-consumer ecology.
 *
 * Each report episode has one semantic state (complete/delayed). The first
 * report is required. The second pressure slot always restates the same state
 * with a different surface form. If Janek already acknowledged the state, that
 * restatement is redundant; if he did not, it is still unresolved pressure.
 *
 * This makes the correct response depend on actor-private semantic history,
 * not only current message text or current matter text.
 */
export function createR3SemanticTemporalConsumerRun(
  options: R3SemanticTemporalConsumerRunOptions,
): R3SemanticTemporalConsumerRun {
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

  const defaultMatters =
    r3MixedPressureJanekMatters(
      "baseline",
    ).map((matter) =>
      matter.id ===
      MIXED_PRESSURE_MATTER_IDS.reportResponse
        ? {
            ...matter,
            statement:
              "acknowledge changes in depot inspection status, but do not re-acknowledge equivalent restatements already handled",
          }
        : structuredClone(matter),
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
          new TemporalSemanticConsumerJanekPolicy(
            options.mode,
          ),
          options.janekMatterOverrides ??
            defaultMatters,
        ),
      ],
      [
        "resident:ida",
        new AutonomousResidentAgent(
          new TemporalStatusPressurePolicy(
            interval,
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

class TemporalSemanticConsumerJanekPolicy
  implements ResidentPolicy
{
  readonly residentId =
    "resident:janek" as const;

  private readonly worker =
    new WorkerFixturePolicy();

  private lastAcknowledgedSemanticState:
    R3TemporalReportState | null =
    null;
  private lastAcknowledgedExactText:
    string | null = null;

  constructor(
    private readonly mode:
      R3TemporalConsumerMode,
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
      const semanticState =
        reportSemanticState(text);

      if (
        this.shouldRespond(
          text,
          semanticState,
        )
      ) {
        this.lastAcknowledgedExactText =
          text;
        if (semanticState) {
          this.lastAcknowledgedSemanticState =
            semanticState;
        }

        return {
          intent: {
            kind: "speak",
            text:
              "Ida, status received.",
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
    semanticState:
      R3TemporalReportState | null,
  ): boolean {
    switch (this.mode) {
      case "ignore-all":
        return false;
      case "respond-all":
        return true;
      case "exact-text-change":
        return (
          this.lastAcknowledgedExactText !==
          text
        );
      case "ideal-semantic-state-change":
        return (
          semanticState !== null &&
          semanticState !==
            this.lastAcknowledgedSemanticState
        );
    }
  }
}

class TemporalStatusPressurePolicy
  implements ResidentPolicy
{
  readonly residentId =
    "resident:ida" as const;

  private ticksSinceSlot = 0;
  private slotIndex = 0;
  private pending = false;
  private currentState:
    R3TemporalReportState =
    "complete";

  constructor(
    private readonly interval: number,
  ) {}

  decide(
    input: ResidentPolicyInput,
  ): ResidentDecision {
    if (
      input.observation.heardEvents.some(
        (event) =>
          event.kind === "speech" &&
          event.actorId ===
            "resident:janek" &&
          event.payload.text ===
            "Ida, status received.",
      )
    ) {
      this.pending = false;
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
            this.pending
              ? "await_status_ack"
              : "wait",
          ),
      };
    }

    this.ticksSinceSlot = 0;
    const slot =
      this.slotIndex % 3;
    const episode =
      Math.floor(
        this.slotIndex / 3,
      );
    this.slotIndex += 1;

    const states:
      readonly R3TemporalReportState[] = [
        "complete",
        "delayed",
        "suspended",
      ];
    this.currentState =
      states[
        episode % states.length
      ]!;

    if (slot === 0) {
      this.pending = true;
      return this.emit(
        input,
        this.currentState,
        0,
        "required_status",
      );
    }

    if (slot === 1) {
      // Same semantic state, deliberately different wording. Whether this
      // restatement still deserves a response depends on whether the actor
      // already settled the report in private history.
      return this.emit(
        input,
        this.currentState,
        1,
        this.pending
          ? "repeat_unresolved_status"
          : "redundant_restatement",
      );
    }

    if (this.pending) {
      return this.emit(
        input,
        this.currentState,
        0,
        "final_unresolved_repeat",
      );
    }

    return {
      intent: { kind: "idle" },
      activity:
        sourceActivity(
          input.previousActivity,
          input.observation.tick,
          "status_settled",
        ),
    };
  }

  private emit(
    input: ResidentPolicyInput,
    state: R3TemporalReportState,
    variant: 0 | 1,
    phase: string,
  ): ResidentDecision {
    return {
      intent: {
        kind: "speak",
        text:
          R3_TEMPORAL_STATUS_MESSAGES[
            state
          ][variant],
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

function reportSemanticState(
  text: string,
): R3TemporalReportState | null {
  const normalized =
    text.trim().toLowerCase();

  for (
    const state of [
      "complete",
      "delayed",
      "suspended",
    ] as const
  ) {
    if (
      R3_TEMPORAL_STATUS_MESSAGES[
        state
      ].some(
        (message) =>
          message.toLowerCase() ===
          normalized,
      )
    ) {
      return state;
    }
  }

  return null;
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
    "respond_to_status_change"
  ) {
    return {
      ...previous,
      phase:
        "acknowledge_changed_status",
    };
  }

  return {
    id:
      "resident:janek:respond_to_status_change:" +
      tick,
    kind:
      "respond_to_status_change",
    phase:
      "acknowledge_changed_status",
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
    "temporal_status_pressure"
  ) {
    return {
      ...previous,
      phase,
    };
  }

  return {
    id:
      "resident:ida:temporal_status_pressure:" +
      tick,
    kind:
      "temporal_status_pressure",
    phase,
    startedTick: tick,
    subjectId: null,
  };
}
