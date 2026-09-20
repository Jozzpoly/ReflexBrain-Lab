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

const ACTOR_ID = "resident:mira";
const PLAYER_ID = "player";
const CRATE_ID = "object:crate-a";
const BEAM_ID = "object:beam-a";

export type LivingSpecimenBehavior =
  | "carry"
  | "protective_hold"
  | "resume_carry"
  | "completed";

export interface LivingSpecimenDecisionTrace {
  tick: number;
  behavior: LivingSpecimenBehavior;
  evidenceIds: readonly string[];
  reason: string;
}

export interface LivingSpecimenPhysicalState {
  actorX: number;
  crateX: number;
  destinationX: number;
  carrying: boolean;
  hazardBlocksAisle: boolean;
}

export interface LivingSpecimenStep {
  frame: CausalEpisodeFrame;
  physical: LivingSpecimenPhysicalState;
  decision: LivingSpecimenDecisionTrace;
}

export interface LivingSpecimenRun {
  id: string;
  title: string;
  actorId: string;
  steps: readonly LivingSpecimenStep[];
}

/**
 * Research-only oracle executive.
 *
 * It does not use World truth directly. It consumes only the actor-private
 * frame and a tiny private carry-over state established by prior observations.
 * This is an explicit fixture used to validate organism continuity before any
 * learned brain exists.
 */
interface FixtureOracleState {
  hazardBelievedActive: boolean;
  resumedAfterHazard: boolean;
}

interface MutablePhysicalState {
  actorX: number;
  crateX: number;
  destinationX: number;
  carrying: boolean;
  hazardBlocksAisle: boolean;
  completed: boolean;
}

export function createDeterministicLivingSpecimen(): LivingSpecimenRun {
  const physical: MutablePhysicalState = {
    actorX: 1,
    crateX: 1,
    destinationX: 9,
    carrying: false,
    hazardBlocksAisle: false,
    completed: false,
  };

  let oracle: FixtureOracleState = {
    hazardBelievedActive: false,
    resumedAfterHazard: false,
  };

  const history: PrivateHistoryEntry[] = [];
  const steps: LivingSpecimenStep[] = [];
  const knownWorldEvents: WorldEvent[] = [];

  for (let tick = 0; tick <= 16; tick += 1) {
    const worldEvents: WorldEvent[] = [];
    const observations: PrivateObservation[] = [];

    if (tick === 0) {
      const assignment = event(
        tick,
        "event:carry-assignment",
        "task.assignment",
        PLAYER_ID,
        [ACTOR_ID],
        {
          object: CRATE_ID,
          destination: "shelf-east",
        },
      );
      worldEvents.push(assignment);
      observations.push(
        observation(
          tick,
          "obs:carry-assignment",
          ["event:carry-assignment"],
          "hearing",
          "task.assignment",
          {
            speaker: PLAYER_ID,
            object: CRATE_ID,
            destination: "shelf-east",
          },
        ),
      );
      history.push(
        historyEntry(
          "history:carry-assignment",
          tick,
          "received_assignment",
          ["event:carry-assignment"],
          {
            object: CRATE_ID,
            destination: "shelf-east",
          },
        ),
      );
    }

    if (tick === 2) {
      physical.carrying = true;
      physical.crateX = physical.actorX;
      const pickedUp = event(
        tick,
        "event:crate-picked-up",
        "object.carried",
        ACTOR_ID,
        [CRATE_ID],
        { object: CRATE_ID },
      );
      worldEvents.push(pickedUp);
      observations.push(
        observation(
          tick,
          "obs:crate-picked-up",
          ["event:crate-picked-up"],
          "proprioception",
          "object.carried",
          { object: CRATE_ID },
        ),
      );
    }

    if (tick === 3) {
      const speech = event(
        tick,
        "event:low-stakes-speech",
        "speech.utterance",
        PLAYER_ID,
        [ACTOR_ID],
        { text: "Mira, nice weather today." },
      );
      worldEvents.push(speech);
      observations.push(
        observation(
          tick,
          "obs:low-stakes-speech",
          ["event:low-stakes-speech"],
          "hearing",
          "speech.utterance",
          {
            speaker: PLAYER_ID,
            text: "Mira, nice weather today.",
          },
        ),
      );
    }

    if (tick === 6) {
      physical.hazardBlocksAisle = true;
      const hazard = event(
        tick,
        "event:beam-falls",
        "physical.hazard_onset",
        BEAM_ID,
        [ACTOR_ID],
        {
          obstacle: BEAM_ID,
          aisle: "east",
        },
      );
      worldEvents.push(hazard);
      observations.push(
        observation(
          tick,
          "obs:beam-falls",
          ["event:beam-falls"],
          "vision",
          "physical.hazard_onset",
          {
            obstacle: BEAM_ID,
            aisle: "east",
          },
        ),
      );
    }

    if (tick === 9) {
      physical.hazardBlocksAisle = false;
      const resolved = event(
        tick,
        "event:beam-cleared",
        "physical.hazard_resolved",
        PLAYER_ID,
        [ACTOR_ID],
        {
          obstacle: BEAM_ID,
          aisle: "east",
        },
      );
      worldEvents.push(resolved);
      observations.push(
        observation(
          tick,
          "obs:beam-cleared",
          ["event:beam-cleared"],
          "vision",
          "physical.hazard_resolved",
          {
            obstacle: BEAM_ID,
            aisle: "east",
          },
        ),
      );
    }

    knownWorldEvents.push(...worldEvents);

    const activity = currentActivity(tick, physical);
    const privateFrame = privateFrame(
      tick,
      observations,
      history,
      activity,
    );

    const resolved = resolveFixtureOracle(privateFrame, oracle, physical);
    oracle = resolved.nextState;

    if (resolved.decision.behavior === "carry" ||
        resolved.decision.behavior === "resume_carry") {
      advanceCarry(physical);
    }

    if (
      physical.carrying &&
      physical.actorX >= physical.destinationX &&
      !physical.completed
    ) {
      physical.actorX = physical.destinationX;
      physical.crateX = physical.destinationX;
      physical.carrying = false;
      physical.completed = true;

      const placed = event(
        tick,
        "event:crate-placed",
        "object.placed",
        ACTOR_ID,
        [CRATE_ID],
        {
          object: CRATE_ID,
          destination: "shelf-east",
        },
      );
      worldEvents.push(placed);
      knownWorldEvents.push(placed);
      observations.push(
        observation(
          tick,
          "obs:crate-placed",
          ["event:crate-placed"],
          "proprioception",
          "object.placed",
          {
            object: CRATE_ID,
            destination: "shelf-east",
          },
        ),
      );
    }

    const facts = worldFacts(tick, physical, knownWorldEvents);
    const finalPrivate = privateFrame(
      tick,
      observations,
      history,
      currentActivity(tick, physical),
    );

    const frame: CausalEpisodeFrame = {
      world: {
        tick,
        events: worldEvents,
        facts,
      },
      privateByActor: {
        [ACTOR_ID]: finalPrivate,
      },
    };

    steps.push({
      frame,
      physical: snapshotPhysical(physical),
      decision: {
        ...resolved.decision,
        behavior: physical.completed ? "completed" : resolved.decision.behavior,
      },
    });
  }

  validateCausalEpisode(steps.map((step) => step.frame));

  return {
    id: "r2-specimen:carry-interrupt-resume-v0",
    title:
      "Carry task with harmless speech, transient physical hazard, and recovery",
    actorId: ACTOR_ID,
    steps,
  };
}

function resolveFixtureOracle(
  frame: ActorPrivateFrame,
  previous: FixtureOracleState,
  physical: MutablePhysicalState,
): {
  decision: LivingSpecimenDecisionTrace;
  nextState: FixtureOracleState;
} {
  let hazardBelievedActive = previous.hazardBelievedActive;
  const evidenceIds: string[] = [];

  for (const observation of frame.observations) {
    if (observation.kind === "physical.hazard_onset") {
      hazardBelievedActive = true;
      evidenceIds.push(observation.id);
    }
    if (observation.kind === "physical.hazard_resolved") {
      hazardBelievedActive = false;
      evidenceIds.push(observation.id);
    }
  }

  if (physical.completed) {
    return {
      decision: {
        tick: frame.tick,
        behavior: "completed",
        evidenceIds,
        reason: "research fixture: assigned carry activity already completed",
      },
      nextState: {
        hazardBelievedActive,
        resumedAfterHazard: previous.resumedAfterHazard,
      },
    };
  }

  if (hazardBelievedActive) {
    return {
      decision: {
        tick: frame.tick,
        behavior: "protective_hold",
        evidenceIds,
        reason:
          "research fixture: actor-private hazard evidence temporarily blocks carry movement",
      },
      nextState: {
        hazardBelievedActive,
        resumedAfterHazard: previous.resumedAfterHazard,
      },
    };
  }

  const resumed =
    previous.hazardBelievedActive && !hazardBelievedActive && physical.carrying;

  return {
    decision: {
      tick: frame.tick,
      behavior: resumed ? "resume_carry" : "carry",
      evidenceIds,
      reason: resumed
        ? "research fixture: hazard belief resolved; continue the same carry activity"
        : "research fixture: continue assigned carry activity",
    },
    nextState: {
      hazardBelievedActive,
      resumedAfterHazard: previous.resumedAfterHazard || resumed,
    },
  };
}

function advanceCarry(state: MutablePhysicalState): void {
  if (!state.carrying || state.hazardBlocksAisle) return;
  state.actorX = Math.min(state.destinationX, state.actorX + 0.75);
  state.crateX = state.actorX;
}

function currentActivity(
  tick: number,
  physical: MutablePhysicalState,
): OngoingActivity | null {
  if (physical.completed) return null;

  let phase = "approach_crate";
  if (physical.carrying) {
    phase = physical.hazardBlocksAisle ? "carry_blocked" : "carry_to_shelf";
  }

  return {
    id: "activity:carry-crate-a",
    actorId: ACTOR_ID,
    kind: "carry_object",
    phase,
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
      [],
      { x: physical.actorX },
    ),
    fact(
      "fact:crate-position",
      tick,
      "object.position",
      CRATE_ID,
      [],
      { x: physical.crateX },
    ),
    fact(
      "fact:aisle-hazard",
      tick,
      "world.hazard_state",
      BEAM_ID,
      latestHazardEvent ? [latestHazardEvent.id] : [],
      { active: physical.hazardBlocksAisle },
    ),
  ];
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
    hazardBlocksAisle: physical.hazardBlocksAisle,
  };
}
