import type {
  LifeActorId,
  LifeActorSnapshot,
  LifeEvent,
  LifeEventKind,
  LifeWorldPublicSnapshot,
  MaterialKind,
  MaterialSnapshot,
  ResidentId,
  ResidentIntent,
  ResidentObservation,
  Vec2,
} from "./life-contracts";

interface MutableActor {
  id: LifeActorId;
  position: Vec2;
  holdingObjectId: string | null;
  sightRadius: number;
  hearingRadius: number;
  speedPerTick: number;
}

interface MutableMaterial {
  id: string;
  kind: MaterialKind;
  location:
    | { kind: "free"; position: Vec2 }
    | { kind: "held"; actorId: LifeActorId };
}

interface ProcessingState {
  objectId: string;
  progressTicks: number;
}

export interface LifeWorldOptions {
  sourcePosition: Vec2;
  sourceCapacity: number;
  sourceReplenishTicks: number;
  workbenchPosition: Vec2;
  processingTicks: number;
  actionRange: number;
}

const DEFAULT_OPTIONS: LifeWorldOptions = {
  sourcePosition: { x: 0, y: 0 },
  sourceCapacity: 3,
  sourceReplenishTicks: 120,
  workbenchPosition: { x: 10, y: 0 },
  processingTicks: 24,
  actionRange: 0.45,
};

export class AutonomousLifeWorld {
  readonly options: LifeWorldOptions;

  private tickValue = 0;
  private sequence = 0;
  private objectSequence = 0;
  private sourceCooldown = 0;
  private readonly actors = new Map<LifeActorId, MutableActor>();
  private readonly objects = new Map<string, MutableMaterial>();
  private readonly processing = new Map<LifeActorId, ProcessingState>();
  private readonly objectLastEvent = new Map<string, string>();
  private previousEvents: LifeEvent[] = [];

  constructor(options: Partial<LifeWorldOptions> = {}) {
    this.options = {
      ...DEFAULT_OPTIONS,
      ...structuredClone(options),
      sourcePosition: {
        ...DEFAULT_OPTIONS.sourcePosition,
        ...(options.sourcePosition ?? {}),
      },
      workbenchPosition: {
        ...DEFAULT_OPTIONS.workbenchPosition,
        ...(options.workbenchPosition ?? {}),
      },
    };
  }

  get tick(): number {
    return this.tickValue;
  }

  addResident(
    id: ResidentId,
    position: Vec2,
    options: {
      sightRadius?: number;
      hearingRadius?: number;
      speedPerTick?: number;
    } = {},
  ): void {
    if (this.actors.has(id)) throw new Error("duplicate resident: " + id);
    this.actors.set(id, {
      id,
      position: { ...position },
      holdingObjectId: null,
      sightRadius: options.sightRadius ?? 2.5,
      hearingRadius: options.hearingRadius ?? 5,
      speedPerTick: options.speedPerTick ?? 0.16,
    });
  }

  addMaterial(
    kind: MaterialKind,
    position: Vec2,
    id = "object:" + kind + ":" + this.objectSequence++,
  ): string {
    if (this.objects.has(id)) throw new Error("duplicate object: " + id);
    this.objects.set(id, {
      id,
      kind,
      location: { kind: "free", position: { ...position } },
    });
    return id;
  }

  perceive(residentId: ResidentId): ResidentObservation {
    const self = this.requireActor(residentId);
    const visibleActors = [...this.actors.values()]
      .filter(
        (actor) =>
          actor.id !== residentId &&
          distance(actor.position, self.position) <= self.sightRadius,
      )
      .map(actorSnapshot)
      .sort((a, b) => a.id.localeCompare(b.id));

    const visibleObjects = [...this.objects.values()]
      .filter((object) => {
        if (object.location.kind === "held") {
          if (object.location.actorId === residentId) return true;
          const holder = this.actors.get(object.location.actorId);
          return holder
            ? distance(holder.position, self.position) <= self.sightRadius
            : false;
        }
        return distance(object.location.position, self.position) <= self.sightRadius;
      })
      .map(materialSnapshot)
      .sort((a, b) => a.id.localeCompare(b.id));

    const heardEvents = this.previousEvents
      .filter((event) => {
        if (event.kind !== "speech") return false;
        const radius =
          typeof event.payload.radius === "number" ? event.payload.radius : 0;
        return distance(event.position, self.position) <= Math.min(radius, self.hearingRadius);
      })
      .map((event) => structuredClone(event));

    const heldObject = self.holdingObjectId
      ? this.objects.get(self.holdingObjectId) ?? null
      : null;

    return {
      tick: this.tickValue,
      self: actorSnapshot(self),
      heldObject: heldObject ? materialSnapshot(heldObject) : null,
      visibleActors,
      visibleObjects,
      heardEvents,
    };
  }

  step(intents: ReadonlyMap<ResidentId, ResidentIntent>): readonly LifeEvent[] {
    this.tickValue += 1;
    const events: LifeEvent[] = [];

    this.advanceSource(events);

    for (const residentId of [...this.actors.keys()].sort((a, b) =>
      a.localeCompare(b),
    )) {
      const intent = intents.get(residentId) ?? { kind: "idle" as const };
      this.resolveIntent(residentId, intent, events);
    }

    this.previousEvents = events.map((event) => structuredClone(event));
    return this.previousEvents.map((event) => structuredClone(event));
  }

  snapshot(): LifeWorldPublicSnapshot {
    return {
      tick: this.tickValue,
      actors: [...this.actors.values()]
        .map(actorSnapshot)
        .sort((a, b) => a.id.localeCompare(b.id)),
      objects: [...this.objects.values()]
        .map(materialSnapshot)
        .sort((a, b) => a.id.localeCompare(b.id)),
    };
  }

  eventHistoryForObject(objectId: string): readonly LifeEvent[] {
    return this.previousEvents
      .filter((event) => event.subjectId === objectId)
      .map((event) => structuredClone(event));
  }

  private advanceSource(events: LifeEvent[]): void {
    const freeRawAtSource = [...this.objects.values()].filter(
      (object) =>
        object.kind === "raw_blank" &&
        object.location.kind === "free" &&
        distance(object.location.position, this.options.sourcePosition) <= 0.6,
    ).length;

    if (freeRawAtSource >= this.options.sourceCapacity) {
      this.sourceCooldown = 0;
      return;
    }

    this.sourceCooldown += 1;
    if (this.sourceCooldown < this.options.sourceReplenishTicks) return;
    this.sourceCooldown = 0;

    const id = this.addMaterial("raw_blank", this.options.sourcePosition);
    const generated = this.makeEvent(
      "resource_generated",
      null,
      id,
      this.options.sourcePosition,
      [],
      { kind: "raw_blank" },
    );
    this.objectLastEvent.set(id, generated.id);
    events.push(generated);
  }

  private resolveIntent(
    residentId: ResidentId,
    intent: ResidentIntent,
    events: LifeEvent[],
  ): void {
    const actor = this.requireActor(residentId);

    switch (intent.kind) {
      case "idle":
        return;

      case "move_to": {
        const before = { ...actor.position };
        const delta = {
          x: intent.target.x - actor.position.x,
          y: intent.target.y - actor.position.y,
        };
        const d = Math.hypot(delta.x, delta.y);
        if (d <= 1e-9) return;
        const step = Math.min(actor.speedPerTick, d);
        actor.position = {
          x: actor.position.x + (delta.x / d) * step,
          y: actor.position.y + (delta.y / d) * step,
        };
        events.push(
          this.makeEvent(
            "motion",
            residentId,
            residentId,
            actor.position,
            [],
            {
              fromX: before.x,
              fromY: before.y,
              toX: actor.position.x,
              toY: actor.position.y,
            },
          ),
        );
        return;
      }

      case "pickup": {
        const object = this.objects.get(intent.objectId);
        if (
          !object ||
          object.location.kind !== "free" ||
          actor.holdingObjectId !== null ||
          distance(actor.position, object.location.position) > this.options.actionRange
        ) {
          events.push(
            this.rejected(residentId, intent.objectId, "pickup_rejected"),
          );
          return;
        }

        const sourceEvent = this.latestObjectEventId(intent.objectId);
        object.location = { kind: "held", actorId: residentId };
        actor.holdingObjectId = object.id;
        this.processing.delete(residentId);
        const pickup = this.makeEvent(
          "pickup",
          residentId,
          object.id,
          actor.position,
          sourceEvent ? [sourceEvent] : [],
          { objectKind: object.kind },
        );
        this.objectLastEvent.set(object.id, pickup.id);
        events.push(pickup);
        return;
      }

      case "place": {
        const object = this.objects.get(intent.objectId);
        if (
          !object ||
          actor.holdingObjectId !== object.id ||
          object.location.kind !== "held" ||
          object.location.actorId !== residentId ||
          distance(actor.position, intent.position) > this.options.actionRange
        ) {
          events.push(
            this.rejected(residentId, intent.objectId, "place_rejected"),
          );
          return;
        }

        const sourceEvent = this.latestObjectEventId(intent.objectId);
        object.location = { kind: "free", position: { ...intent.position } };
        actor.holdingObjectId = null;
        this.processing.delete(residentId);
        const placed = this.makeEvent(
          "place",
          residentId,
          object.id,
          intent.position,
          sourceEvent ? [sourceEvent] : [],
          { objectKind: object.kind },
        );
        this.objectLastEvent.set(object.id, placed.id);
        events.push(placed);
        return;
      }

      case "process": {
        const object = this.objects.get(intent.objectId);
        if (
          !object ||
          actor.holdingObjectId !== object.id ||
          object.location.kind !== "held" ||
          object.location.actorId !== residentId ||
          object.kind !== "raw_blank" ||
          distance(actor.position, this.options.workbenchPosition) >
            this.options.actionRange
        ) {
          events.push(
            this.rejected(residentId, intent.objectId, "process_rejected"),
          );
          return;
        }

        const current = this.processing.get(residentId);
        const state =
          current && current.objectId === object.id
            ? current
            : { objectId: object.id, progressTicks: 0 };

        if (state.progressTicks === 0) {
          const sourceEvent = this.latestObjectEventId(object.id);
          const started = this.makeEvent(
            "processing_started",
            residentId,
            object.id,
            actor.position,
            sourceEvent ? [sourceEvent] : [],
            {},
          );
          this.objectLastEvent.set(object.id, started.id);
          events.push(started);
        }

        state.progressTicks += 1;
        this.processing.set(residentId, state);

        if (state.progressTicks < this.options.processingTicks) return;

        const cause = this.latestObjectEventId(object.id);
        object.kind = "finished_part";
        this.processing.delete(residentId);
        const completed = this.makeEvent(
          "processing_completed",
          residentId,
          object.id,
          actor.position,
          cause ? [cause] : [],
          { objectKind: "finished_part" },
        );
        this.objectLastEvent.set(object.id, completed.id);
        events.push(completed);
        return;
      }

      case "speak": {
        events.push(
          this.makeEvent(
            "speech",
            residentId,
            null,
            actor.position,
            [],
            { text: intent.text, radius: intent.radius },
          ),
        );
        return;
      }
    }
  }

  private rejected(
    residentId: ResidentId,
    subjectId: string | null,
    reason: string,
  ): LifeEvent {
    return this.makeEvent(
      "action_rejected",
      residentId,
      subjectId,
      this.requireActor(residentId).position,
      [],
      { reason },
    );
  }

  private latestObjectEventId(objectId: string): string | null {
    return this.objectLastEvent.get(objectId) ?? null;
  }

  private makeEvent(
    kind: LifeEventKind,
    actorId: LifeActorId | null,
    subjectId: string | null,
    position: Vec2,
    causes: readonly string[],
    payload: Readonly<Record<string, string | number | boolean | null>>,
  ): LifeEvent {
    return {
      id: "life-event:" + this.tickValue + ":" + this.sequence++,
      tick: this.tickValue,
      kind,
      actorId,
      subjectId,
      position: { ...position },
      causes: [...causes],
      payload: { ...payload },
    };
  }

  private requireActor(id: LifeActorId): MutableActor {
    const actor = this.actors.get(id);
    if (!actor) throw new Error("unknown actor: " + id);
    return actor;
  }
}

function actorSnapshot(actor: MutableActor): LifeActorSnapshot {
  return {
    id: actor.id,
    position: { ...actor.position },
    holdingObjectId: actor.holdingObjectId,
  };
}

function materialSnapshot(object: MutableMaterial): MaterialSnapshot {
  return {
    id: object.id,
    kind: object.kind,
    location:
      object.location.kind === "free"
        ? { kind: "free", position: { ...object.location.position } }
        : { kind: "held", actorId: object.location.actorId },
  };
}

export function distance(a: Vec2, b: Vec2): number {
  return Math.hypot(a.x - b.x, a.y - b.y);
}
