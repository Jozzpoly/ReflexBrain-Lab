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
    sameMessageDifferentActivity(),
    actualityAndApplicability(),
    interruptionAndResumption(),
    supersession(),
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
              activity("activity:sort", "sort_materials", "approach_crates"),
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
              activity("activity:sort", "sort_materials", "carry"),
            ),
          ),
        ],
      },
      {
        id: "no-related-history",
        frames: [
          episodeFrame(
            worldFrame(4, []),
            privateFrame(
              4,
              [],
              [],
              activity("activity:sort", "sort_materials", "approach_crates"),
            ),
          ),
          episodeFrame(
            currentWorld,
            privateFrame(
              10,
              [currentObservation],
              [],
              activity("activity:sort", "sort_materials", "carry"),
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
            activity("activity:sort", "sort_materials", "seek_crate"),
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
            activity("activity:sort", "sort_materials", "seek_crate"),
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
      "Can the lab distinguish identical observed motion whose underlying causal origin differs without pretending that observed velocity reveals intent?",
    mustRemainEqual: [
      "observed body motion",
      "actor identity",
      "ongoing activity",
    ],
    intendedCausalDifference: [
      "World provenance is Owner-requested motion in one variant and external impulse in the other",
      "the private observation alone does not reveal hidden intent",
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
            activity("activity:escort", "move_with_player", "maintain_relation"),
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
            activity("activity:escort", "move_with_player", "maintain_relation"),
          ),
        ),
      ),
    ],
  };
}

function sameMessageDifferentActivity(): R2CausalChallenge {
  const world = worldFrame(12, [
    event(
      12,
      "event:low-stakes-request",
      "speech.utterance",
      "player",
      [ACTOR],
      { text: "Mira, can you come here for a moment?" },
    ),
  ]);
  const speech = observed(
    12,
    "obs:low-stakes-request",
    ["event:low-stakes-request"],
    "hearing",
    "speech.utterance",
    { speaker: "player", text: "Mira, can you come here for a moment?" },
  );

  return {
    id: "r2-v0:same-message-different-activity",
    family: "same_message_different_activity",
    question:
      "Should identical received speech have different executive consequences when the actor's current bodily commitment differs?",
    mustRemainEqual: [
      "World speech event",
      "private speech observation",
      "private history",
      "actor identity",
    ],
    intendedCausalDifference: [
      "one actor state is low-commitment watch duty",
      "the other is mid-carry with a fragile object",
    ],
    variants: [
      variant(
        "low-commitment",
        episodeFrame(
          world,
          privateFrame(
            12,
            [speech],
            [],
            activity("activity:watch", "watch_area", "idle_scan"),
          ),
        ),
      ),
      variant(
        "fragile-carry",
        episodeFrame(
          world,
          privateFrame(
            12,
            [speech],
            [],
            activity("activity:carry-glass", "carry_object", "mid_carry"),
          ),
        ),
      ),
    ],
  };
}

function actualityAndApplicability(): R2CausalChallenge {
  const currentText = "Mira, the east bridge is collapsing now.";
  const conditionalText =
    "Mira, if the east bridge starts collapsing tomorrow, leave the area.";

  return {
    id: "r2-v0:actuality-and-applicability",
    family: "actuality_and_applicability",
    question:
      "Can a semantic candidate distinguish an operative current warning from a conditional future instruction without relying on different hazard nouns?",
    mustRemainEqual: [
      "speaker",
      "addressee",
      "hazard concept",
      "location concept",
      "ongoing activity",
    ],
    intendedCausalDifference: [
      "current actuality versus future conditionality",
    ],
    variants: [
      variant(
        "current",
        episodeFrame(
          worldFrame(14, [
            event(
              14,
              "event:bridge-current-warning",
              "speech.utterance",
              "player",
              [ACTOR],
              { text: currentText },
            ),
          ]),
          privateFrame(
            14,
            [
              observed(
                14,
                "obs:bridge-current-warning",
                ["event:bridge-current-warning"],
                "hearing",
                "speech.utterance",
                { speaker: "player", text: currentText },
              ),
            ],
            [],
            activity("activity:sort", "sort_materials", "carry"),
          ),
        ),
      ),
      variant(
        "conditional-future",
        episodeFrame(
          worldFrame(14, [
            event(
              14,
              "event:bridge-conditional-warning",
              "speech.utterance",
              "player",
              [ACTOR],
              { text: conditionalText },
            ),
          ]),
          privateFrame(
            14,
            [
              observed(
                14,
                "obs:bridge-conditional-warning",
                ["event:bridge-conditional-warning"],
                "hearing",
                "speech.utterance",
                { speaker: "player", text: conditionalText },
              ),
            ],
            [],
            activity("activity:sort", "sort_materials", "carry"),
          ),
        ),
      ),
    ],
  };
}

function interruptionAndResumption(): R2CausalChallenge {
  const activityId = "activity:carry-crate";
  const frames = [
    episodeFrame(
      worldFrame(20, []),
      privateFrame(
        20,
        [],
        [],
        activity(activityId, "carry_object", "mid_carry"),
      ),
    ),
    episodeFrame(
      worldFrame(21, [
        event(
          21,
          "event:beam-falls",
          "physical.hazard_onset",
          "beam:a",
          [ACTOR],
          { region: "aisle", immediate: true },
        ),
      ]),
      privateFrame(
        21,
        [
          observed(
            21,
            "obs:beam-falls",
            ["event:beam-falls"],
            "vision",
            "physical.hazard_onset",
            { region: "aisle", immediate: true },
          ),
        ],
        [],
        activity(activityId, "carry_object", "mid_carry"),
      ),
    ),
    episodeFrame(
      worldFrame(22, [
        event(
          22,
          "event:beam-settled",
          "physical.hazard_resolved",
          "beam:a",
          [ACTOR],
          { region: "aisle" },
        ),
      ]),
      privateFrame(
        22,
        [
          observed(
            22,
            "obs:beam-settled",
            ["event:beam-settled"],
            "vision",
            "physical.hazard_resolved",
            { region: "aisle" },
          ),
        ],
        [],
        activity(activityId, "carry_object", "mid_carry"),
      ),
    ),
  ] as const;

  return {
    id: "r2-v0:interruption-and-resumption",
    family: "interruption_and_resumption",
    question:
      "Can a candidate react to a transient hazard without losing the identity of the pre-existing activity it may later resume?",
    mustRemainEqual: ["activity identity across the episode"],
    intendedCausalDifference: [
      "hazard onset appears and then resolves while the prior activity remains causally present",
    ],
    variants: [{ id: "transient-hazard", frames }],
  };
}

function supersession(): R2CausalChallenge {
  const order = "Mira, wait by the east gate.";
  const cancel = "Mira, cancel my previous gate order.";
  const replay = "Recording: Mira, wait by the east gate.";

  const frames: CausalEpisodeFrame[] = [
    episodeFrame(
      worldFrame(30, [
        event(
          30,
          "event:gate-order",
          "speech.utterance",
          "player",
          [ACTOR],
          { text: order },
        ),
      ]),
      privateFrame(
        30,
        [
          observed(
            30,
            "obs:gate-order",
            ["event:gate-order"],
            "hearing",
            "speech.utterance",
            { speaker: "player", text: order },
          ),
        ],
        [
          history(
            "history:gate-order",
            30,
            "received_directive",
            ["event:gate-order"],
            { speaker: "player", text: order },
          ),
        ],
        activity("activity:sort", "sort_materials", "return"),
      ),
    ),
    episodeFrame(
      worldFrame(31, [
        event(
          31,
          "event:gate-cancel",
          "speech.utterance",
          "player",
          [ACTOR],
          { text: cancel },
        ),
      ]),
      privateFrame(
        31,
        [
          observed(
            31,
            "obs:gate-cancel",
            ["event:gate-cancel"],
            "hearing",
            "speech.utterance",
            { speaker: "player", text: cancel },
          ),
        ],
        [
          history(
            "history:gate-order",
            30,
            "received_directive",
            ["event:gate-order"],
            { speaker: "player", text: order },
          ),
          history(
            "history:gate-cancel",
            31,
            "received_cancellation",
            ["event:gate-cancel"],
            { speaker: "player", text: cancel },
          ),
        ],
        activity("activity:sort", "sort_materials", "return"),
      ),
    ),
    episodeFrame(
      worldFrame(32, [
        event(
          32,
          "event:old-recording",
          "speech.playback",
          "radio",
          [ACTOR],
          { text: replay },
        ),
      ]),
      privateFrame(
        32,
        [
          observed(
            32,
            "obs:old-recording",
            ["event:old-recording"],
            "hearing",
            "speech.playback",
            { source: "radio", text: replay },
          ),
        ],
        [
          history(
            "history:gate-order",
            30,
            "received_directive",
            ["event:gate-order"],
            { speaker: "player", text: order },
          ),
          history(
            "history:gate-cancel",
            31,
            "received_cancellation",
            ["event:gate-cancel"],
            { speaker: "player", text: cancel },
          ),
        ],
        activity("activity:sort", "sort_materials", "return"),
      ),
    ),
  ];

  return {
    id: "r2-v0:supersession",
    family: "supersession",
    question:
      "Can late evidence resembling an older directive be interpreted in the presence of newer contradictory private history without resurrecting stale policy?",
    mustRemainEqual: ["actor identity", "ongoing activity"],
    intendedCausalDifference: [
      "the private causal history contains an explicit later cancellation before the old-looking playback arrives",
    ],
    variants: [{ id: "cancel-then-old-playback", frames }],
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
  id: string,
  kind: string,
  phase: string,
): OngoingActivity {
  return {
    id,
    actorId: ACTOR,
    kind,
    phase,
    startedTick: 1,
    payload: {},
  };
}
