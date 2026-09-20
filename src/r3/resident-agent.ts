import type {
  ObjectBelief,
  ResidentActivity,
  ResidentDecision,
  ResidentId,
  ResidentObservation,
  ResidentPolicy,
  ResidentPrivateMemory,
} from "./life-contracts";

export interface ResidentAgentDebugState {
  residentId: ResidentId;
  activity: ResidentActivity | null;
  memory: ResidentPrivateMemory;
}

export class AutonomousResidentAgent {
  private activityValue: ResidentActivity | null = null;
  private readonly objectBeliefs = new Map<string, ObjectBelief>();
  private readonly heardEventIds: string[] = [];

  constructor(private readonly policy: ResidentPolicy) {}

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
      memory: this.memorySnapshot(),
    };
  }

  private integrateObservation(observation: ResidentObservation): void {
    const visibleIds = new Set(observation.visibleObjects.map((object) => object.id));

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

  private memorySnapshot(): ResidentPrivateMemory {
    const objectBeliefs: Record<string, ObjectBelief> = {};
    for (const [id, belief] of this.objectBeliefs) {
      objectBeliefs[id] = structuredClone(belief);
    }
    return {
      objectBeliefs,
      heardEventIds: [...this.heardEventIds],
    };
  }
}
