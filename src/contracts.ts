export interface Vec2 {
  x: number;
  y: number;
}

export interface WorldActor {
  id: string;
  kind: "resident" | "player";
  position: Vec2;
  velocity: Vec2;
  facingRadians: number;
}

export interface WorldEvent {
  id: string;
  tick: number;
  kind: "speech" | "task_progress";
  sourceActorId: string;
  targetActorId: string | null;
  text: string | null;
}

export interface WorldSnapshot {
  tick: number;
  actors: readonly WorldActor[];
  events: readonly WorldEvent[];
  taskProgress: number;
}

export type DistanceBand = "near" | "mid" | "far";

export interface VisibleActorPercept {
  kind: "visible_actor";
  actorId: string;
  distanceBand: DistanceBand;
  approachSpeed: number;
  relativeBearingRadians: number;
}

export interface SpeechPercept {
  kind: "speech";
  sourceActorId: string;
  addressed: boolean;
  text: string;
}

export type Percept = VisibleActorPercept | SpeechPercept;

export interface ActorPrivateState {
  tick: number;
  self: {
    id: string;
    currentTask: "sort_crates";
    taskProgress: number;
    taskUrgency: number;
  };
  percepts: readonly Percept[];
  recentFocus: "task" | "player";
}

export interface ReflexScores {
  attentionPlayer: number;
  interruptCurrent: number;
  socialRelevance: number;
  novelty: number;
  threat: number;
  deeperCognition: number;
}

export type ReflexAction =
  | "continue"
  | "orient"
  | "acknowledge"
  | "investigate"
  | "withdraw";

export type ActionDistribution = Record<ReflexAction, number>;

export interface ReflexEvaluation {
  providerId: string;
  scores: ReflexScores;
  actions: ActionDistribution;
  rationaleTags: readonly string[];
  latencyMs: number | null;
}

export interface ReflexProvider {
  readonly id: string;
  evaluate(state: ActorPrivateState): Promise<ReflexEvaluation> | ReflexEvaluation;
}

export interface ReflexDynamicsState {
  scores: ReflexScores;
  focus: "task" | "player";
}

export interface ShadowTraceFrame {
  tick: number;
  world: WorldSnapshot;
  privateState: ActorPrivateState;
  baselineAction: "work";
  provider: ReflexEvaluation;
  stabilized: ReflexDynamicsState;
}
