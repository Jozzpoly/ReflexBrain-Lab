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
  frames: readonly CausalEpisodeFrame[];
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
  const currentWorld = worldFrame(10, [
    event(
      10,
      "event:janek-entered",
      "actor.entered_visible_area",
      "resident:janek",
      [ACTOR],
      { region: "workshop" },
    ),
  ]);

  const currentObservation = observed(
    10,
    "obs:janek-entered",
    ["event:janek-entered"],
    "vision",
    "actor.entered_visible_area",
    { actor: "resident:janek", region: "workshop" },
  );

  const unfinishedEarlierWorld = worldFrame(4, [
    event(
      4,
      "event:earlier-tool-loan",
      "object.transfer",
      ACTOR,
      ["resident:janek"],
      { object: "tool:hammer" },
    ),
  ]);

  const neutralEarlierWorld = worldFrame(4, []);

  return {
    id: "r2-v0:same-event-different-history",
    family: "same_event_different_history",
    question:
      "Can identical current received evidence acquire different legitimate significance solely because private causal history differs?",
    mustRemainEqual: [
      "current World event",
      "actor identity",
      "current observation",
      "ongoing activity",
    ],
    intendedCausalDifference: [
      "one variant contains prior private causal evidence involving Janek",
    ],
    variants: [
      {
        id: "unfinished-history",
        frames: [
          episodeFrame(
            unfinishedEarlierWorld,
            privateFrame(
              4,
              [
                observed(
                  4,
                  "obs:earlier-tool-loan",
                  ["event:earlier-tool-loan"],
                  "vision",
                  "object.transfer",
                  { object: "tool:hammer", person: "resident:janek" },
                ),
              ],
              [
                history(
                  "history:janek-tool-return",
                  4,
                  "unfinished_exchange",
                  ["event:earlier-tool-loan"],
                  { person: "resident:janek", object: "tool:hammer" },
                ),
              ],
              activity(
                4,
                "activity:sort",
                "sort_materials",
                "approach_crates",
              ),
            ),
          ),
          episodeFrame(
            currentWorld,
            privateFrame(
              10,
              [currentObservation],
              [
                history(
                  "history:janek-tool-return",
                  4,
                  "unfinished_exchange",
                  ["event:earlier-tool-loan"],
                  { person: "resident:janek", object: "tool:hammer" },
                ),
              ],
              activity(10, "activity:sort", "sort_materials", "carry"),
            ),
          ),
        ],
      },
      {
        id: "no-related-history",
        frames: [
          episodeFrame(
            neutralEarlierWorld,
            privateFrame(
              4,
              [],
              [],
              activity(
                4,
                "activity:sort",
                "sort_materials",
                "approach_crates",
              ),
            ),
          ),
          episodeFrame(
            currentWorld,
            privateFrame(
              10,
              [currentObservation],
              [],
              activity(10, "activity:sort", "sort_materials", "carry"),
            ),
          ),
        ],
      },
    ],
  };
}

function sameWorldDifferentKnowledge(): R2CausalChallenge {
  const world = worldFrame(10, [
    event(
      10,
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
        episodeFrame(
          world,
          privateFrame(
            10,
            [
              observed(
                10,
                "obs:crate-moved",
                ["event:crate-moved"],
                "vision",
                "object.position_changed",
                { object: "object:crate-a", destination: "shelf-east" },
              ),
            ],
            [],
            activity(10, "activity:sort", "sort_materials", "seek_crate"),
          ),
        ),
      ),
      variant(
        "unobserved",
        episodeFrame(
          world,
          privateFrame(
            10,
            [],
            [],
            activity(10, "activity:sort", "sort_materials", "seek_crate"),
          ),
        ),
      ),
    ],
  };
}

function sameMotionDifferentProvenance(): R2CausalChallenge {
  const ownerWorld = worldFrame(10, [
    event(
      10,
      "event:owner-motion-request",
      "control.requested_motion",
      "player",
      ["player"],
      { vx: 2, vy: 0 },
    ),
    event(
      10,
      "event:player-motion",
      "body.actual_motion",
      "player",
      [ACTOR],
      { actor: "player", vx: 2, vy: 0 },
    ),
  ]);
  const externalWorld = worldFrame(10, [
    event(
      10,
      "event:external-push",
      "body.external_impulse",
      ACTOR,
      ["player"],
      { impulseX: 2, impulseY: 0 },
    ),
    event(
      10,
      "event:player-motion",
      "body.actual_motion",
      "player",
      [ACTOR],
      { actor: "player", vx: 2, vy: 0 },
    ),
  ]);

  const motionObservation = observed(
    10,
    "obs:player-motion",
    ["event:player-motion"],
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
        episodeFrame(
          ownerWorld,
          privateFrame(
            10,
            [motionObservation],
            [],
            activity(
              10,
              "activity:escort",
              "move_with_player",
              "maintain_relation",
            ),
          ),
        ),
      ),
      variant(
        "external-push-origin",
        episodeFrame(
          externalWorld,
          privateFrame(
            10,
            [motionObservation],
            [],
            activity(
              10,
              "activity:escort",
              "move_with_player",
              "maintain_relation",
            ),
          ),
        ),
      ),
    ],
  };
}

function variant(
  id: string,
  frame: CausalEpisodeFrame,
): R2ChallengeVariant {
  return { id, frames: [frame] };
}

function episodeFrame(
  world: CausalWorldFrame,
  privateState: ActorPrivateFrame,
): CausalEpisodeFrame {
  return {
    world,
    privateByActor: { [ACTOR]: privateState },
  };
}

function worldFrame(
  tick: number,
  events: CausalWorldFrame["events"],
): CausalWorldFrame {
  return { tick, events, facts: [] };
}

function event(
  tick: number,
  id: string,
  kind: string,
  sourceEntityId: string | null,
  targetEntityIds: readonly string[],
  payload: Readonly<Record<string, string | number | boolean | null>>,
) {
  return {
    id,
    tick,
    kind,
    sourceEntityId,
    targetEntityIds,
    payload,
  };
}

function privateFrame(
  tick: number,
  observations: readonly PrivateObservation[],
  entries: readonly PrivateHistoryEntry[],
  currentActivity: OngoingActivity | null,
): ActorPrivateFrame {
  return {
    actorId: ACTOR,
    tick,
    observations,
    history: entries,
    activity: currentActivity,
  };
}

function observed(
  tick: number,
  id: string,
  provenanceEventIds: readonly string[],
  channel: PrivateObservation["channel"],
  kind: string,
  payload: Readonly<Record<string, string | number | boolean | null>>,
): PrivateObservation {
  return {
    id,
    actorId: ACTOR,
    tick,
    channel,
    provenanceEventIds,
    kind,
    payload,
  };
}

function history(
  id: string,
  recordedTick: number,
  kind: string,
  provenanceEventIds: readonly string[],
  payload: Readonly<Record<string, string | number | boolean | null>>,
): PrivateHistoryEntry {
  return {
    id,
    actorId: ACTOR,
    recordedTick,
    kind,
    provenanceEventIds,
    payload,
  };
}

function activity(
  tick: number,
  id: string,
  kind: string,
  phase: string,
): OngoingActivity {
  return {
    id,
    actorId: ACTOR,
    kind,
    phase,
    startedTick: Math.min(1, tick),
    payload: {},
  };
}
