export interface Vec2 {
  x: number;
  y: number;
}

export type ResidentId = "resident:mira" | "resident:janek" | "resident:ida";
export type LifeActorId = ResidentId;
export type MaterialKind = "raw_blank" | "finished_part";

export interface LifePlace {
  id: "source" | "input_rack" | "workbench" | "output" | "depot";
  position: Vec2;
}

export interface LifeActorSnapshot {
  id: LifeActorId;
  position: Vec2;
  holdingObjectId: string | null;
}

export type MaterialLocation =
  | { kind: "free"; position: Vec2 }
  | { kind: "held"; actorId: LifeActorId };

export interface MaterialSnapshot {
  id: string;
  kind: MaterialKind;
  location: MaterialLocation;
}

export type LifeEventKind =
  | "resource_generated"
  | "motion"
  | "pickup"
  | "place"
  | "processing_started"
  | "processing_completed"
  | "speech"
  | "action_rejected";

export interface LifeEvent {
  id: string;
  tick: number;
  kind: LifeEventKind;
  actorId: LifeActorId | null;
  subjectId: string | null;
  position: Vec2;
  causes: readonly string[];
  payload: Readonly<Record<string, string | number | boolean | null>>;
}

export interface ResidentObservation {
  tick: number;
  self: LifeActorSnapshot;
  heldObject: MaterialSnapshot | null;
  visibleActors: readonly LifeActorSnapshot[];
  visibleObjects: readonly MaterialSnapshot[];
  heardEvents: readonly LifeEvent[];
}

export interface ObjectBelief {
  objectId: string;
  kind: MaterialKind;
  lastKnownLocation: MaterialLocation | null;
  lastSeenTick: number;
}

export interface ActorContactBelief {
  actorId: ResidentId;
  lastKnownPosition: Vec2 | null;
  lastSeenTick: number;
}

export interface ResidentPrivateMemory {
  objectBeliefs: Readonly<Record<string, ObjectBelief>>;
  actorBeliefs: Readonly<Record<string, ActorContactBelief>>;
  heardEventIds: readonly string[];
}

export interface ResidentMatter {
  id: string;
  statement: string;
  establishedTick: number;
  source: "authored";
}

export interface ResidentActivity {
  id: string;
  kind: string;
  phase: string;
  startedTick: number;
  subjectId: string | null;
}

export type ResidentIntent =
  | { kind: "idle" }
  | { kind: "move_to"; target: Vec2 }
  | { kind: "pickup"; objectId: string }
  | { kind: "place"; objectId: string; position: Vec2 }
  | { kind: "process"; objectId: string }
  | { kind: "speak"; text: string; radius: number };

export interface ResidentDecision {
  intent: ResidentIntent;
  activity: ResidentActivity | null;
}

export interface ResidentPolicyInput {
  observation: ResidentObservation;
  memory: ResidentPrivateMemory;
  matters: readonly ResidentMatter[];
  places: Readonly<Record<LifePlace["id"], LifePlace>>;
  previousActivity: ResidentActivity | null;
}

export interface ResidentPolicy {
  readonly residentId: ResidentId;
  decide(input: ResidentPolicyInput): ResidentDecision;
}

export interface LifeWorldPublicSnapshot {
  tick: number;
  actors: readonly LifeActorSnapshot[];
  objects: readonly MaterialSnapshot[];
}

export interface AutonomousLifeStep {
  tick: number;
  events: readonly LifeEvent[];
  snapshot: LifeWorldPublicSnapshot;
  activities: Readonly<Record<string, ResidentActivity | null>>;
}


export interface ResidentPrivateExperience {
  tick: number;
  residentId: ResidentId;
  matters: readonly ResidentMatter[];
  activityBefore: ResidentActivity | null;
  observation: ResidentObservation;
  memory: ResidentPrivateMemory;
  decision: ResidentDecision;
  factualOutcomeEvents: readonly LifeEvent[];
}
