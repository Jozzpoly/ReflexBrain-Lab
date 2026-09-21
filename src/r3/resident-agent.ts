import type {
  ObjectBelief,
  ResidentActivity,
  ResidentDecision,
  ResidentId,
  ResidentMatter,
  ResidentObservation,
  ResidentPolicy,
  ResidentPrivateMemory,
} from "./life-contracts";

export interface ResidentAgentDebugState {
  residentId: ResidentId;
  activity: ResidentActivity | null;
  matters: readonly ResidentMatter[];
  memory: ResidentPrivateMemory;
}

export class AutonomousResidentAgent {
  private activityValue: ResidentActivity | null = null;
  private readonly objectBeliefs = new Map<string, ObjectBelief>();
  private readonly actorBeliefs = new Map<
    ResidentId,
    import("./life-contracts").ActorContactBelief
  >();
  private readonly heardEventIds: string[] = [];
  private readonly mattersValue: ResidentMatter[];

  constructor(
    private readonly policy: ResidentPolicy,
    initialMatters: readonly ResidentMatter[] = [],
  ) {
    this.mattersValue = validateInitialMatters(
      policy.residentId,
      initialMatters,
    );
  }

  get residentId(): ResidentId {
    return this.policy.residentId;
  }

  decide(
    observation: ResidentObservation,
    places: Parameters<ResidentPolicy["decide"]>[0]["places"],
  ): ResidentDecision {
    this.integrateObservation(observation);
    const decision = this.policy.decide({
      observation,
      memory: this.memorySnapshot(),
      matters: this.matterSnapshot(),
      places,
      previousActivity: this.activityValue
        ? structuredClone(this.activityValue)
        : null,
    });
    this.activityValue = structuredClone(decision.activity);
    return structuredClone(decision);
  }

  debugState(): ResidentAgentDebugState {
    return {
      residentId: this.residentId,
      activity: this.activityValue ? structuredClone(this.activityValue) : null,
      matters: this.matterSnapshot(),
      memory: this.memorySnapshot(),
    };
  }

  private integrateObservation(observation: ResidentObservation): void {
    const visibleIds = new Set(observation.visibleObjects.map((object) => object.id));
    const visibleActorIds = new Set(
      observation.visibleActors.map((actor) => actor.id),
    );

    for (const actor of observation.visibleActors) {
      this.actorBeliefs.set(actor.id, {
        actorId: actor.id,
        lastKnownPosition: { ...actor.position },
        lastSeenTick: observation.tick,
      });
    }

    for (const [actorId, belief] of this.actorBeliefs) {
      if (visibleActorIds.has(actorId) || !belief.lastKnownPosition) continue;
      const d = Math.hypot(
        belief.lastKnownPosition.x - observation.self.position.x,
        belief.lastKnownPosition.y - observation.self.position.y,
      );
      if (d <= 0.75) {
        this.actorBeliefs.set(actorId, {
          ...belief,
          lastKnownPosition: null,
        });
      }
    }

    for (const object of observation.visibleObjects) {
      this.objectBeliefs.set(object.id, {
        objectId: object.id,
        kind: object.kind,
        lastKnownLocation:
          object.location.kind === "free"
            ? { kind: "free", position: { ...object.location.position } }
            : { kind: "held", actorId: object.location.actorId },
        lastSeenTick: observation.tick,
      });
    }

    // Checked absence: if the resident is physically close enough to inspect the
    // last known free position and the object is no longer visible, preserve the
    // object's identity but invalidate its location instead of pretending it still
    // occupies stale World space.
    for (const [objectId, belief] of this.objectBeliefs) {
      if (visibleIds.has(objectId)) continue;
      if (!belief.lastKnownLocation || belief.lastKnownLocation.kind !== "free") {
        continue;
      }
      const d = Math.hypot(
        belief.lastKnownLocation.position.x - observation.self.position.x,
        belief.lastKnownLocation.position.y - observation.self.position.y,
      );
      if (d <= 0.75) {
        this.objectBeliefs.set(objectId, {
          ...belief,
          lastKnownLocation: null,
        });
      }
    }

    for (const event of observation.heardEvents) {
      if (this.heardEventIds.includes(event.id)) continue;
      this.heardEventIds.push(event.id);
      if (this.heardEventIds.length > 64) this.heardEventIds.shift();
    }
  }

  private matterSnapshot(): readonly ResidentMatter[] {
    return this.mattersValue.map((matter) => structuredClone(matter));
  }

  private memorySnapshot(): ResidentPrivateMemory {
    const objectBeliefs: Record<string, ObjectBelief> = {};
    for (const [id, belief] of this.objectBeliefs) {
      objectBeliefs[id] = structuredClone(belief);
    }
    const actorBeliefs: Record<
      string,
      import("./life-contracts").ActorContactBelief
    > = {};
    for (const [id, belief] of this.actorBeliefs) {
      actorBeliefs[id] = structuredClone(belief);
    }

    return {
      objectBeliefs,
      actorBeliefs,
      heardEventIds: [...this.heardEventIds],
    };
  }
}


function validateInitialMatters(
  residentId: ResidentId,
  matters: readonly ResidentMatter[],
): ResidentMatter[] {
  const ids = new Set<string>();
  return matters.map((matter) => {
    if (matter.id.trim().length === 0) {
      throw new Error("resident matter id must be non-empty");
    }
    if (matter.statement.trim().length === 0) {
      throw new Error("resident matter statement must be non-empty");
    }
    if (!Number.isSafeInteger(matter.establishedTick) || matter.establishedTick < 0) {
      throw new Error("resident matter establishedTick must be a non-negative safe integer");
    }
    if (ids.has(matter.id)) {
      throw new Error("duplicate resident matter id: " + matter.id);
    }
    if (!matter.id.startsWith(residentId + ":matter:")) {
      throw new Error("resident matter id must be actor-owned: " + matter.id);
    }
    ids.add(matter.id);
    return structuredClone(matter);
  });
}
