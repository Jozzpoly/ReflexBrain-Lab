import type {
  ActorPrivateFrame,
  CausalEpisodeFrame,
  CausalWorldFrame,
  OngoingActivity,
  PrivateHistoryEntry,
  PrivateObservation,
} from "./causal-contracts";

export type R2ChallengeFamily =
  | "same_event_different_history"
  | "same_world_different_knowledge"
  | "same_motion_different_provenance"
  | "same_message_different_activity"
  | "actuality_and_applicability"
  | "interruption_and_resumption"
  | "supersession"
  | "competition"
  | "expectation_violation";

export interface R2ChallengeVariant {
  id: string;
  episodeFrame: CausalEpisodeFrame;
}

export interface R2CausalChallenge {
  id: string;
  family: R2ChallengeFamily;
  question: string;
  mustRemainEqual: readonly string[];
  intendedCausalDifference: readonly string[];
  variants: readonly R2ChallengeVariant[];
}

const ACTOR = "resident:mira";

export function createR2ChallengeSpaceV0(): readonly R2CausalChallenge[] {
  return [
    sameEventDifferentHistory(),
    sameWorldDifferentKnowledge(),
    sameMotionDifferentProvenance(),
  ];
}

function sameEventDifferentHistory(): R2CausalChallenge {
  const world = worldFrame([
    event(
      "event:janek-entered",
      "actor.entered_visible_area",
      "resident:janek",
      [ACTOR],
      { region: "workshop" },
    ),
  ]);

  const observation = observed(
    "obs:janek-entered",
    "event:janek-entered",
    "vision",
    "actor.entered_visible_area",
    { actor: "resident:janek", region: "workshop" },
  );

  return {
    id: "r2-v0:same-event-different-history",
    family: "same_event_different_history",
    question:
      "Can identical received evidence acquire different legitimate significance solely because private causal history differs?",
    mustRemainEqual: [
      "World event",
      "actor identity",
      "current observation",
      "ongoing activity",
    ],
    intendedCausalDifference: [
      "one variant contains active unfinished private history involving Janek",
    ],
    variants: [
      variant(
        "unfinished-history",
        world,
        privateFrame(
          [observation],
          [
            history(
              "history:janek-tool-return",
              "unfinished_exchange",
              "active",
              ["event:earlier-tool-loan"],
              { person: "resident:janek", object: "tool:hammer" },
            ),
          ],
          activity("activity:sort", "sort_materials", "carry"),
        ),
      ),
      variant(
        "no-related-history",
        world,
        privateFrame(
          [observation],
          [],
          activity("activity:sort", "sort_materials", "carry"),
        ),
      ),
    ],
  };
}

function sameWorldDifferentKnowledge(): R2CausalChallenge {
  const world = worldFrame([
    event(
      "event:crate-moved",
      "object.position_changed",
      "resident:janek",
      ["object:crate-a"],
      { object: "object:crate-a", destination: "shelf-east" },
    ),
  ]);

  return {
    id: "r2-v0:same-world-different-knowledge",
    family: "same_world_different_knowledge",
    question:
      "Does hidden World truth remain causally unavailable when the actor had no observation path to it?",
    mustRemainEqual: ["World truth", "ongoing activity", "private history"],
    intendedCausalDifference: [
      "only one variant contains an observation of the World event",
    ],
    variants: [
      variant(
        "observed",
        world,
        privateFrame(
          [
            observed(
              "obs:crate-moved",
              "event:crate-moved",
              "vision",
              "object.position_changed",
              { object: "object:crate-a", destination: "shelf-east" },
            ),
          ],
          [],
          activity("activity:sort", "sort_materials", "seek_crate"),
        ),
      ),
      variant(
        "unobserved",
        world,
        privateFrame(
          [],
          [],
          activity("activity:sort", "sort_materials", "seek_crate"),
        ),
      ),
    ],
  };
}

function sameMotionDifferentProvenance(): R2CausalChallenge {
  const ownerWorld = worldFrame([
    event(
      "event:owner-motion-request",
      "control.requested_motion",
      "player",
      ["player"],
      { vx: 2, vy: 0 },
    ),
    event(
      "event:player-motion",
      "body.actual_motion",
      "player",
      [ACTOR],
      { actor: "player", vx: 2, vy: 0 },
    ),
  ]);
  const externalWorld = worldFrame([
    event(
      "event:external-push",
      "body.external_impulse",
      ACTOR,
      ["player"],
      { impulseX: 2, impulseY: 0 },
    ),
    event(
      "event:player-motion",
      "body.actual_motion",
      "player",
      [ACTOR],
      { actor: "player", vx: 2, vy: 0 },
    ),
  ]);

  const motionObservation = observed(
    "obs:player-motion",
    "event:player-motion",
    "vision",
    "body.actual_motion",
    { actor: "player", vx: 2, vy: 0 },
  );

  return {
    id: "r2-v0:same-motion-different-provenance",
    family: "same_motion_different_provenance",
    question:
      "Can the lab distinguish identical observed motion whose underlying causal origin differs?",
    mustRemainEqual: [
      "observed body motion",
      "actor identity",
      "ongoing activity",
    ],
    intendedCausalDifference: [
      "World provenance is Owner-requested motion in one variant and external impulse in the other",
      "the private observation alone does not magically reveal hidden intent",
    ],
    variants: [
      variant(
        "owner-request-origin",
        ownerWorld,
        privateFrame(
          [motionObservation],
          [],
          activity("activity:escort", "move_with_player", "maintain_relation"),
        ),
      ),
      variant(
        "external-push-origin",
        externalWorld,
        privateFrame(
          [motionObservation],
          [],
          activity("activity:escort", "move_with_player", "maintain_relation"),
        ),
      ),
    ],
  };
}

function variant(
  id: string,
  world: CausalWorldFrame,
  privateState: ActorPrivateFrame,
): R2ChallengeVariant {
  return {
    id,
    episodeFrame: {
      world,
      privateByActor: { [ACTOR]: privateState },
    },
  };
}

function worldFrame(events: CausalWorldFrame["events"]): CausalWorldFrame {
  return { tick: 10, events, facts: [] };
}

function event(
  id: string,
  kind: string,
  sourceEntityId: string | null,
  targetEntityIds: readonly string[],
  payload: Readonly<Record<string, string | number | boolean | null>>,
) {
  return {
    id,
    tick: 10,
    kind,
    sourceEntityId,
    targetEntityIds,
    payload,
  };
}

function privateFrame(
  observations: readonly PrivateObservation[],
  entries: readonly PrivateHistoryEntry[],
  currentActivity: OngoingActivity | null,
): ActorPrivateFrame {
  return {
    actorId: ACTOR,
    tick: 10,
    observations,
    history: entries,
    activity: currentActivity,
  };
}

function observed(
  id: string,
  sourceEventId: string,
  channel: PrivateObservation["channel"],
  kind: string,
  payload: Readonly<Record<string, string | number | boolean | null>>,
): PrivateObservation {
  return {
    id,
    actorId: ACTOR,
    tick: 10,
    channel,
    sourceEventId,
    kind,
    payload,
  };
}

function history(
  id: string,
  kind: string,
  status: PrivateHistoryEntry["status"],
  provenanceEventIds: readonly string[],
  payload: Readonly<Record<string, string | number | boolean | null>>,
): PrivateHistoryEntry {
  return {
    id,
    actorId: ACTOR,
    establishedTick: 4,
    status,
    kind,
    provenanceEventIds,
    payload,
  };
}

function activity(
  id: string,
  kind: string,
  phase: string,
): OngoingActivity {
  return {
    id,
    actorId: ACTOR,
    kind,
    phase,
    status: "active",
    startedTick: 1,
    payload: {},
  };
}
