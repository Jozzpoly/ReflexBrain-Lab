import { distance } from "./life-world";
import type {
  LifePlace,
  MaterialSnapshot,
  ResidentActivity,
  ResidentDecision,
  ResidentId,
  ResidentPolicy,
  ResidentPolicyInput,
  Vec2,
} from "./life-contracts";

const ACTIVITY_SERIAL = new Map<ResidentId, number>();

function nextActivityId(residentId: ResidentId, kind: string): string {
  const serial = (ACTIVITY_SERIAL.get(residentId) ?? 0) + 1;
  ACTIVITY_SERIAL.set(residentId, serial);
  return residentId + ":" + kind + ":" + serial;
}

function activity(
  residentId: ResidentId,
  previous: ResidentActivity | null,
  tick: number,
  kind: string,
  phase: string,
  subjectId: string | null = null,
): ResidentActivity {
  if (
    previous &&
    previous.kind === kind &&
    previous.subjectId === subjectId
  ) {
    return {
      ...previous,
      phase,
    };
  }
  return {
    id: nextActivityId(residentId, kind),
    kind,
    phase,
    startedTick: tick,
    subjectId,
  };
}

function near(position: Vec2, place: LifePlace, radius = 0.38): boolean {
  return distance(position, place.position) <= radius;
}

function visibleFreeObject(
  input: ResidentPolicyInput,
  kind: MaterialSnapshot["kind"],
  place: LifePlace,
  radius = 0.75,
): MaterialSnapshot | null {
  return (
    input.observation.visibleObjects.find(
      (object) =>
        object.kind === kind &&
        object.location.kind === "free" &&
        distance(object.location.position, place.position) <= radius,
    ) ?? null
  );
}

export class StewardFixturePolicy implements ResidentPolicy {
  readonly residentId = "resident:mira" as const;
  private targetRackStock = 1;

  decide(input: ResidentPolicyInput): ResidentDecision {
    const tick = input.observation.tick;
    const self = input.observation.self;
    const held = input.observation.heldObject;
    const rack = input.places.input_rack;
    const source = input.places.source;

    if (held?.kind === "raw_blank") {
      if (near(self.position, rack)) {
        return {
          intent: {
            kind: "place",
            objectId: held.id,
            position: rack.position,
          },
          activity: activity(
            this.residentId,
            input.previousActivity,
            tick,
            "maintain_input_stock",
            "place_on_rack",
            held.id,
          ),
        };
      }
      return {
        intent: { kind: "move_to", target: rack.position },
        activity: activity(
          this.residentId,
          input.previousActivity,
          tick,
          "maintain_input_stock",
          "return_with_raw",
          held.id,
        ),
      };
    }

    if (near(self.position, rack)) {
      const rackStock = input.observation.visibleObjects.filter(
        (object) =>
          object.kind === "raw_blank" &&
          object.location.kind === "free" &&
          distance(object.location.position, rack.position) <= 0.75,
      ).length;

      if (rackStock >= this.targetRackStock) {
        return {
          intent: { kind: "idle" },
          activity: activity(
            this.residentId,
            input.previousActivity,
            tick,
            "maintain_input_stock",
            "monitor_rack",
          ),
        };
      }
    }

    if (!near(self.position, source)) {
      return {
        intent: { kind: "move_to", target: source.position },
        activity: activity(
          this.residentId,
          input.previousActivity,
          tick,
          "maintain_input_stock",
          "go_to_source",
        ),
      };
    }

    const raw = visibleFreeObject(input, "raw_blank", source);
    if (raw) {
      return {
        intent: { kind: "pickup", objectId: raw.id },
        activity: activity(
          this.residentId,
          input.previousActivity,
          tick,
          "maintain_input_stock",
          "pick_raw",
          raw.id,
        ),
      };
    }

    return {
      intent: { kind: "idle" },
      activity: activity(
        this.residentId,
        input.previousActivity,
        tick,
        "maintain_input_stock",
        "wait_for_source",
      ),
    };
  }
}

export class WorkerFixturePolicy implements ResidentPolicy {
  readonly residentId = "resident:janek" as const;
  private emptyRackTicks = 0;
  private lastRequestTick = -10_000;

  decide(input: ResidentPolicyInput): ResidentDecision {
    const tick = input.observation.tick;
    const self = input.observation.self;
    const held = input.observation.heldObject;
    const rack = input.places.input_rack;
    const bench = input.places.workbench;
    const output = input.places.output;

    if (held?.kind === "raw_blank") {
      this.emptyRackTicks = 0;
      if (!near(self.position, bench)) {
        return {
          intent: { kind: "move_to", target: bench.position },
          activity: activity(
            this.residentId,
            input.previousActivity,
            tick,
            "process_material",
            "carry_to_workbench",
            held.id,
          ),
        };
      }
      return {
        intent: { kind: "process", objectId: held.id },
        activity: activity(
          this.residentId,
          input.previousActivity,
          tick,
          "process_material",
          "work",
          held.id,
        ),
      };
    }

    if (held?.kind === "finished_part") {
      if (!near(self.position, output)) {
        return {
          intent: { kind: "move_to", target: output.position },
          activity: activity(
            this.residentId,
            input.previousActivity,
            tick,
            "finish_output",
            "carry_finished_to_output",
            held.id,
          ),
        };
      }
      return {
        intent: {
          kind: "place",
          objectId: held.id,
          position: output.position,
        },
        activity: activity(
          this.residentId,
          input.previousActivity,
          tick,
          "finish_output",
          "place_finished",
          held.id,
        ),
      };
    }

    if (!near(self.position, rack)) {
      this.emptyRackTicks = 0;
      return {
        intent: { kind: "move_to", target: rack.position },
        activity: activity(
          this.residentId,
          input.previousActivity,
          tick,
          "seek_input",
          "go_to_rack",
        ),
      };
    }

    const raw = visibleFreeObject(input, "raw_blank", rack);
    if (raw) {
      this.emptyRackTicks = 0;
      return {
        intent: { kind: "pickup", objectId: raw.id },
        activity: activity(
          this.residentId,
          input.previousActivity,
          tick,
          "seek_input",
          "pick_input",
          raw.id,
        ),
      };
    }

    this.emptyRackTicks += 1;
    if (
      this.emptyRackTicks >= 90 &&
      tick - this.lastRequestTick >= 120
    ) {
      this.lastRequestTick = tick;
      return {
        intent: {
          kind: "speak",
          text: "The input rack is empty.",
          radius: 5,
        },
        activity: activity(
          this.residentId,
          input.previousActivity,
          tick,
          "seek_input",
          "blocked_waiting_for_input",
        ),
      };
    }

    return {
      intent: { kind: "idle" },
      activity: activity(
        this.residentId,
        input.previousActivity,
        tick,
        "seek_input",
        "wait_at_empty_rack",
      ),
    };
  }
}

export class CourierFixturePolicy implements ResidentPolicy {
  readonly residentId = "resident:ida" as const;

  decide(input: ResidentPolicyInput): ResidentDecision {
    const tick = input.observation.tick;
    const self = input.observation.self;
    const held = input.observation.heldObject;
    const output = input.places.output;
    const depot = input.places.depot;

    if (held?.kind === "finished_part") {
      if (!near(self.position, depot)) {
        return {
          intent: { kind: "move_to", target: depot.position },
          activity: activity(
            this.residentId,
            input.previousActivity,
            tick,
            "deliver_output",
            "carry_to_depot",
            held.id,
          ),
        };
      }
      return {
        intent: {
          kind: "place",
          objectId: held.id,
          position: depot.position,
        },
        activity: activity(
          this.residentId,
          input.previousActivity,
          tick,
          "deliver_output",
          "place_at_depot",
          held.id,
        ),
      };
    }

    if (!near(self.position, output)) {
      return {
        intent: { kind: "move_to", target: output.position },
        activity: activity(
          this.residentId,
          input.previousActivity,
          tick,
          "collect_output",
          "go_to_output",
        ),
      };
    }

    const finished = visibleFreeObject(input, "finished_part", output);
    if (finished) {
      return {
        intent: { kind: "pickup", objectId: finished.id },
        activity: activity(
          this.residentId,
          input.previousActivity,
          tick,
          "collect_output",
          "pick_finished",
          finished.id,
        ),
      };
    }

    return {
      intent: { kind: "idle" },
      activity: activity(
        this.residentId,
        input.previousActivity,
        tick,
        "collect_output",
        "wait_for_finished_part",
      ),
    };
  }
}

export function resetFixtureActivitySerials(): void {
  ACTIVITY_SERIAL.clear();
}
