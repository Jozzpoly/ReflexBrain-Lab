import type {
  ActorPrivateFrame,
  CausalEpisodeFrame,
  CausalPayload,
  OngoingActivity,
  PrivateHistoryEntry,
  PrivateObservation,
  WorldEvent,
  WorldFact,
} from "./causal-contracts";
import { validateCausalEpisode } from "./causal-validation";
import type {
  LivingSpecimenBehavior,
  LivingSpecimenDecisionTrace,
  LivingSpecimenPhysicalState,
  LivingSpecimenStep,
} from "./living-specimen";

const ACTOR_ID = "resident:mira";
const PLAYER_ID = "player";
const CRATE_ID = "object:crate-a";
const HAZARD_ID = "hazard:crossing-a";
const HAZARD_X = 5.2;

export type InteractiveFixtureMode =
  | "private_hazard_oracle"
  | "null_continue";

export type InteractiveIntervention =
  | { kind: "quiet" }
  | { kind: "speech"; text: string }
  | { kind: "hazard_onset"; perceived: boolean }
  | { kind: "hazard_resolved"; perceived: boolean };

interface InteractiveOracleState {
  hazardBelievedActive: boolean;
}

interface MutablePhysicalState {
  actorX: number;
  crateX: number;
  destinationX: number;
  carrying: boolean;
  hazardActive: boolean;
  completed: boolean;
}

export interface InteractiveSessionSnapshot {
  fixtureMode: InteractiveFixtureMode;
  actorId: string;
  nextTick: number;
  steps: readonly LivingSpecimenStep[];
}

/**
 * A fixture-specific Owner intervention harness.
 *
 * This is intentionally not a generic Brain/runtime API. It exists only to
 * let us provoke the current R2 causal organism while preserving:
 * World truth -> actor-private reception -> explicit fixture decision -> World
 * consequence.
 */
export class InteractiveLivingSpecimenSession {
  readonly actorId = ACTOR_ID;
  readonly fixtureMode: InteractiveFixtureMode;

  private nextTickValue = 1;
  private readonly physical: MutablePhysicalState = {
    actorX: 1,
    crateX: 1,
    destinationX: 9,
    carrying: true,
    hazardActive: false,
    completed: false,
  };
  private oracle: InteractiveOracleState = {
    hazardBelievedActive: false,
  };
  private readonly history: PrivateHistoryEntry[] = [];
  private readonly stepLog: LivingSpecimenStep[] = [];
  private readonly knownWorldEvents: WorldEvent[] = [];
  private latestActorMotionEventId: string | null = null;
  private latestCratePositionEventId: string | null = "event:bootstrap-pickup";

  constructor(fixtureMode: InteractiveFixtureMode = "private_hazard_oracle") {
    this.fixtureMode = fixtureMode;
    this.bootstrap();
  }

  snapshot(): InteractiveSessionSnapshot {
    return {
      fixtureMode: this.fixtureMode,
      actorId: this.actorId,
      nextTick: this.nextTickValue,
      steps: this.stepLog.map((step) => structuredClone(step)),
    };
  }

  advance(intervention: InteractiveIntervention): LivingSpecimenStep {
    const tick = this.nextTickValue;
    const worldEvents: WorldEvent[] = [];
    const observations: PrivateObservation[] = [];

    this.applyIntervention(tick, intervention, worldEvents, observations);
    this.knownWorldEvents.push(...worldEvents);

    const beforeActuation = privateFrame(
      tick,
      observations,
      this.history,
      currentActivity(this.physical),
    );

    const resolved = resolveFixture(
      this.fixtureMode,
      beforeActuation,
      this.oracle,
    );
    this.oracle = resolved.nextState;

    if (
      resolved.decision.behavior === "carry" ||
      resolved.decision.behavior === "resume_carry"
    ) {
      const motion = advanceCarry(this.physical, tick);
      if (motion) {
        worldEvents.push(motion);
        this.knownWorldEvents.push(motion);
        this.latestActorMotionEventId = motion.id;
        this.latestCratePositionEventId = motion.id;

        if (this.physical.hazardActive && motionCrossesHazard(motion)) {
          const exposure = event(
            tick,
            "event:hazard-exposure:" + tick,
            "physical.hazard_exposure",
            HAZARD_ID,
            [ACTOR_ID],
            { hazard: HAZARD_ID, x: HAZARD_X },
          );
          worldEvents.push(exposure);
          this.knownWorldEvents.push(exposure);

          observations.push(
            observation(
              tick,
              "obs:hazard-exposure:" + tick,
              [exposure.id],
              "body",
              "physical.hazard_exposure",
              { hazard: HAZARD_ID, x: HAZARD_X },
            ),
          );
          this.history.push(
            historyEntry(
              "history:hazard-exposure:" + tick,
              tick,
              "experienced_hazard_exposure",
              [exposure.id],
              { hazard: HAZARD_ID, x: HAZARD_X },
            ),
          );
        }
      }
    }

    if (
      this.physical.carrying &&
      this.physical.actorX >= this.physical.destinationX &&
      !this.physical.completed
    ) {
      this.physical.actorX = this.physical.destinationX;
      this.physical.crateX = this.physical.destinationX;
      this.physical.carrying = false;
      this.physical.completed = true;

      const placed = event(
        tick,
        "event:crate-placed:" + tick,
        "object.placed",
        ACTOR_ID,
        [CRATE_ID],
        { object: CRATE_ID, destination: "shelf-east" },
      );
      worldEvents.push(placed);
      this.knownWorldEvents.push(placed);
      this.latestCratePositionEventId = placed.id;
      observations.push(
        observation(
          tick,
          "obs:crate-placed:" + tick,
          [placed.id],
          "proprioception",
          "object.placed",
          { object: CRATE_ID, destination: "shelf-east" },
        ),
      );
    }

    const frame: CausalEpisodeFrame = {
      world: {
        tick,
        events: worldEvents,
        facts: worldFacts(
          tick,
          this.physical,
          this.knownWorldEvents,
          this.latestActorMotionEventId,
          this.latestCratePositionEventId,
        ),
      },
      privateByActor: {
        [ACTOR_ID]: privateFrame(
          tick,
          observations,
          this.history,
          currentActivity(this.physical),
        ),
      },
    };

    const step: LivingSpecimenStep = {
      frame,
      physical: snapshotPhysical(this.physical),
      decision: resolved.decision,
    };

    this.stepLog.push(step);
    this.nextTickValue += 1;
    validateCausalEpisode(this.stepLog.map((candidate) => candidate.frame));
    return structuredClone(step);
  }

  private bootstrap(): void {
    const tick = 0;
    const assignment = event(
      tick,
      "event:bootstrap-assignment",
      "task.assignment",
      PLAYER_ID,
      [ACTOR_ID],
      { object: CRATE_ID, destination: "shelf-east" },
    );
    const pickup = event(
      tick,
      "event:bootstrap-pickup",
      "object.carried",
      ACTOR_ID,
      [CRATE_ID],
      { object: CRATE_ID },
    );
    this.knownWorldEvents.push(assignment, pickup);

    const assignmentHistory = historyEntry(
      "history:bootstrap-assignment",
      tick,
      "received_assignment",
      [assignment.id],
      { object: CRATE_ID, destination: "shelf-east" },
    );
    this.history.push(assignmentHistory);

    const observations = [
      observation(
        tick,
        "obs:bootstrap-assignment",
        [assignment.id],
        "hearing",
        "task.assignment",
        {
          speaker: PLAYER_ID,
          object: CRATE_ID,
          destination: "shelf-east",
        },
      ),
      observation(
        tick,
        "obs:bootstrap-pickup",
        [pickup.id],
        "proprioception",
        "object.carried",
        { object: CRATE_ID },
      ),
    ];

    const frame: CausalEpisodeFrame = {
      world: {
        tick,
        events: [assignment, pickup],
        facts: worldFacts(
          tick,
          this.physical,
          this.knownWorldEvents,
          null,
          pickup.id,
        ),
      },
      privateByActor: {
        [ACTOR_ID]: privateFrame(
          tick,
          observations,
          this.history,
          currentActivity(this.physical),
        ),
      },
    };

    this.stepLog.push({
      frame,
      physical: snapshotPhysical(this.physical),
      decision: {
        tick,
        behavior: "carry",
        evidenceIds: ["obs:bootstrap-assignment", "obs:bootstrap-pickup"],
        reason: "interactive fixture bootstrap: carry activity established",
      },
    });

    validateCausalEpisode(this.stepLog.map((candidate) => candidate.frame));
  }

  private applyIntervention(
    tick: number,
    intervention: InteractiveIntervention,
    worldEvents: WorldEvent[],
    observations: PrivateObservation[],
  ): void {
    switch (intervention.kind) {
      case "quiet":
        return;
      case "speech": {
        const utterance = event(
          tick,
          "event:owner-speech:" + tick,
          "speech.utterance",
          PLAYER_ID,
          [ACTOR_ID],
          { text: intervention.text },
        );
        worldEvents.push(utterance);
        observations.push(
          observation(
            tick,
            "obs:owner-speech:" + tick,
            [utterance.id],
            "hearing",
            "speech.utterance",
            { speaker: PLAYER_ID, text: intervention.text },
          ),
        );
        return;
      }
      case "hazard_onset": {
        this.physical.hazardActive = true;
        const onset = event(
          tick,
          "event:hazard-onset:" + tick,
          "physical.hazard_onset",
          HAZARD_ID,
          [ACTOR_ID],
          { hazard: HAZARD_ID, x: HAZARD_X },
        );
        worldEvents.push(onset);
        if (intervention.perceived) {
          observations.push(
            observation(
              tick,
              "obs:hazard-onset:" + tick,
              [onset.id],
              "vision",
              "physical.hazard_onset",
              { hazard: HAZARD_ID, x: HAZARD_X },
            ),
          );
        }
        return;
      }
      case "hazard_resolved": {
        this.physical.hazardActive = false;
        const resolved = event(
          tick,
          "event:hazard-resolved:" + tick,
          "physical.hazard_resolved",
          PLAYER_ID,
          [ACTOR_ID],
          { hazard: HAZARD_ID, x: HAZARD_X },
        );
        worldEvents.push(resolved);
        if (intervention.perceived) {
          observations.push(
            observation(
              tick,
              "obs:hazard-resolved:" + tick,
              [resolved.id],
              "vision",
              "physical.hazard_resolved",
              { hazard: HAZARD_ID, x: HAZARD_X },
            ),
          );
        }
        return;
      }
    }
  }
}

function resolveFixture(
  fixtureMode: InteractiveFixtureMode,
  frame: ActorPrivateFrame,
  previous: InteractiveOracleState,
): {
  decision: LivingSpecimenDecisionTrace;
  nextState: InteractiveOracleState;
} {
  if (fixtureMode === "null_continue") {
    return {
      decision: {
        tick: frame.tick,
        behavior: frame.activity === null ? "completed" : "carry",
        evidenceIds: [],
        reason:
          frame.activity === null
            ? "null control: activity already completed"
            : "null control: continue activity regardless of incoming evidence",
      },
      nextState: previous,
    };
  }

  let hazardBelievedActive = previous.hazardBelievedActive;
  const evidenceIds: string[] = [];

  for (const evidence of frame.observations) {
    if (evidence.kind === "physical.hazard_onset") {
      hazardBelievedActive = true;
      evidenceIds.push(evidence.id);
    }
    if (evidence.kind === "physical.hazard_resolved") {
      hazardBelievedActive = false;
      evidenceIds.push(evidence.id);
    }
  }

  if (frame.activity === null) {
    return {
      decision: {
        tick: frame.tick,
        behavior: "completed",
        evidenceIds,
        reason: "private-hazard fixture: activity already completed",
      },
      nextState: { hazardBelievedActive },
    };
  }

  if (hazardBelievedActive) {
    return {
      decision: {
        tick: frame.tick,
        behavior: "protective_hold",
        evidenceIds,
        reason:
          "private-hazard fixture: actor-private hazard evidence holds movement",
      },
      nextState: { hazardBelievedActive },
    };
  }

  const resumed =
    previous.hazardBelievedActive && !hazardBelievedActive;

  return {
    decision: {
      tick: frame.tick,
      behavior: resumed ? "resume_carry" : "carry",
      evidenceIds,
      reason: resumed
        ? "private-hazard fixture: observed resolution resumes the same activity"
        : "private-hazard fixture: continue current activity",
    },
    nextState: { hazardBelievedActive },
  };
}

function advanceCarry(
  state: MutablePhysicalState,
  tick: number,
): WorldEvent | null {
  if (!state.carrying) return null;
  const fromX = state.actorX;
  const toX = Math.min(state.destinationX, state.actorX + 0.75);
  if (toX === fromX) return null;

  state.actorX = toX;
  state.crateX = toX;

  return event(
    tick,
    "event:interactive-carry-motion:" + tick,
    "body.carry_motion",
    ACTOR_ID,
    [ACTOR_ID, CRATE_ID],
    { object: CRATE_ID, fromX, toX },
  );
}

function motionCrossesHazard(motion: WorldEvent): boolean {
  const fromX = motion.payload.fromX;
  const toX = motion.payload.toX;
  return (
    typeof fromX === "number" &&
    typeof toX === "number" &&
    fromX < HAZARD_X &&
    toX >= HAZARD_X
  );
}

function currentActivity(
  physical: MutablePhysicalState,
): OngoingActivity | null {
  if (physical.completed) return null;
  return {
    id: "activity:interactive-carry-crate-a",
    actorId: ACTOR_ID,
    kind: "carry_object",
    phase: physical.carrying ? "carry_to_shelf" : "approach_crate",
    startedTick: 0,
    payload: {
      object: CRATE_ID,
      destination: "shelf-east",
    },
  };
}

function worldFacts(
  tick: number,
  physical: MutablePhysicalState,
  knownWorldEvents: readonly WorldEvent[],
  latestActorMotionEventId: string | null,
  latestCratePositionEventId: string | null,
): readonly WorldFact[] {
  const latestHazardEvent = [...knownWorldEvents]
    .reverse()
    .find(
      (candidate) =>
        candidate.kind === "physical.hazard_onset" ||
        candidate.kind === "physical.hazard_resolved",
    );

  return [
    fact(
      "fact:mira-position",
      tick,
      "body.position",
      ACTOR_ID,
      latestActorMotionEventId ? [latestActorMotionEventId] : [],
      { x: physical.actorX },
    ),
    fact(
      "fact:crate-position",
      tick,
      "object.position",
      CRATE_ID,
      latestCratePositionEventId ? [latestCratePositionEventId] : [],
      { x: physical.crateX },
    ),
    fact(
      "fact:hazard-state",
      tick,
      "world.hazard_state",
      HAZARD_ID,
      latestHazardEvent ? [latestHazardEvent.id] : [],
      { active: physical.hazardActive, x: HAZARD_X },
    ),
  ];
}

function privateFrame(
  tick: number,
  observations: readonly PrivateObservation[],
  history: readonly PrivateHistoryEntry[],
  activity: OngoingActivity | null,
): ActorPrivateFrame {
  return {
    actorId: ACTOR_ID,
    tick,
    observations: observations.map((entry) => structuredClone(entry)),
    history: history.map((entry) => structuredClone(entry)),
    activity: activity ? structuredClone(activity) : null,
  };
}

function snapshotPhysical(
  physical: MutablePhysicalState,
): LivingSpecimenPhysicalState {
  return {
    actorX: physical.actorX,
    crateX: physical.crateX,
    destinationX: physical.destinationX,
    carrying: physical.carrying,
    hazardActive: physical.hazardActive,
  };
}

function event(
  tick: number,
  id: string,
  kind: string,
  sourceEntityId: string | null,
  targetEntityIds: readonly string[],
  payload: CausalPayload,
): WorldEvent {
  return {
    id,
    tick,
    kind,
    sourceEntityId,
    targetEntityIds,
    payload,
  };
}

function fact(
  id: string,
  tick: number,
  kind: string,
  subjectEntityId: string,
  provenanceEventIds: readonly string[],
  payload: CausalPayload,
): WorldFact {
  return {
    id,
    tick,
    kind,
    subjectEntityId,
    provenanceEventIds,
    payload,
  };
}

function observation(
  tick: number,
  id: string,
  provenanceEventIds: readonly string[],
  channel: PrivateObservation["channel"],
  kind: string,
  payload: CausalPayload,
): PrivateObservation {
  return {
    id,
    actorId: ACTOR_ID,
    tick,
    channel,
    provenanceEventIds,
    kind,
    payload,
  };
}

function historyEntry(
  id: string,
  recordedTick: number,
  kind: string,
  provenanceEventIds: readonly string[],
  payload: CausalPayload,
): PrivateHistoryEntry {
  return {
    id,
    actorId: ACTOR_ID,
    recordedTick,
    kind,
    provenanceEventIds,
    payload,
  };
}
