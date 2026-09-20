export type ActorId = string;
export type EntityId = string;
export type CausalEventId = string;
export type EvidenceId = string;
export type ActivityId = string;

export type CausalAtom = string | number | boolean | null;
export type CausalPayload = Readonly<Record<string, CausalAtom>>;

export interface WorldEvent {
  id: CausalEventId;
  tick: number;
  kind: string;
  sourceEntityId: EntityId | null;
  targetEntityIds: readonly EntityId[];
  payload: CausalPayload;
}

export interface WorldFact {
  id: string;
  tick: number;
  kind: string;
  subjectEntityId: EntityId;
  provenanceEventIds: readonly CausalEventId[];
  payload: CausalPayload;
}

export interface CausalWorldFrame {
  tick: number;
  events: readonly WorldEvent[];
  facts: readonly WorldFact[];
}

export type ObservationChannel =
  | "vision"
  | "hearing"
  | "body"
  | "proprioception";

export interface PrivateObservation {
  id: EvidenceId;
  actorId: ActorId;
  tick: number;
  channel: ObservationChannel;
  provenanceEventIds: readonly CausalEventId[];
  kind: string;
  payload: CausalPayload;
}

/**
 * Historical evidence intentionally has no universal lifecycle/status enum.
 *
 * Whether a particular candidate treats evidence as unresolved, superseded,
 * settled, decayed, remembered, etc. belongs to the experiment/candidate,
 * not to the neutral causal substrate.
 */
export interface PrivateHistoryEntry {
  id: EvidenceId;
  actorId: ActorId;
  recordedTick: number;
  kind: string;
  provenanceEventIds: readonly CausalEventId[];
  payload: CausalPayload;
}

/**
 * This is the actor's currently continuing activity, not a task-policy API.
 * Candidate-specific interruption/commitment semantics are deliberately absent.
 */
export interface OngoingActivity {
  id: ActivityId;
  actorId: ActorId;
  kind: string;
  phase: string;
  startedTick: number;
  payload: CausalPayload;
}

export interface ActorPrivateFrame {
  actorId: ActorId;
  tick: number;
  observations: readonly PrivateObservation[];
  history: readonly PrivateHistoryEntry[];
  activity: OngoingActivity | null;
}

export interface CausalEpisodeFrame {
  world: CausalWorldFrame;
  privateByActor: Readonly<Record<ActorId, ActorPrivateFrame>>;
}

/**
 * R2 deliberately exposes causal state only.
 *
 * There is no shared Brain score vector, action distribution or evaluation
 * contract here. Candidate cognition interfaces are deferred until the causal
 * organism and oracle boundaries are useful enough to constrain them.
 */
