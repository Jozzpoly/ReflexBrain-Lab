import { distance } from "./life-world";
import type {
  ResidentActivity,
  ResidentDecision,
  ResidentPolicy,
  ResidentPolicyInput,
  Vec2,
} from "./life-contracts";

export const CONTACT_FIXTURE_MATTER_IDS = {
  patrol: "resident:janek:matter:contact-patrol",
  report: "resident:ida:matter:contact-report",
} as const;

function hasFixtureMatter(
  input: ResidentPolicyInput,
  matterId: string,
): boolean {
  return input.matters.some((matter) => matter.id === matterId);
}

function matterAbsentDecision(): ResidentDecision {
  return {
    intent: { kind: "idle" },
    activity: null,
  };
}

function continueActivity(
  previous: ResidentActivity | null,
  residentId: "resident:janek" | "resident:ida",
  tick: number,
  kind: string,
  phase: string,
): ResidentActivity {
  if (previous?.kind === kind) {
    return { ...previous, phase };
  }
  return {
    id: residentId + ":" + kind + ":" + tick,
    kind,
    phase,
    startedTick: tick,
    subjectId: null,
  };
}

function near(a: Vec2, b: Vec2, radius = 0.4): boolean {
  return distance(a, b) <= radius;
}

export class PatrolContactFixturePolicy implements ResidentPolicy {
  readonly residentId = "resident:janek" as const;
  private target: "workbench" | "depot" = "depot";

  decide(input: ResidentPolicyInput): ResidentDecision {
    if (!hasFixtureMatter(input, CONTACT_FIXTURE_MATTER_IDS.patrol)) {
      return matterAbsentDecision();
    }

    const currentTarget = input.places[this.target];

    if (near(input.observation.self.position, currentTarget.position)) {
      this.target = this.target === "depot" ? "workbench" : "depot";
    }

    const target = input.places[this.target];
    return {
      intent: { kind: "move_to", target: target.position },
      activity: continueActivity(
        input.previousActivity,
        this.residentId,
        input.observation.tick,
        "patrol_between_places",
        "toward_" + this.target,
      ),
    };
  }
}

export class ContactMessengerFixturePolicy implements ResidentPolicy {
  readonly residentId = "resident:ida" as const;

  private searchTarget: "workbench" | "depot" = "workbench";
  private lastReportTick = -10_000;
  private returningToOwnWork = false;

  decide(input: ResidentPolicyInput): ResidentDecision {
    if (!hasFixtureMatter(input, CONTACT_FIXTURE_MATTER_IDS.report)) {
      return matterAbsentDecision();
    }

    const tick = input.observation.tick;
    const self = input.observation.self;
    const visibleJanek = input.observation.visibleActors.find(
      (actor) => actor.id === "resident:janek",
    );

    if (this.returningToOwnWork) {
      // Deliberately leave the contact corridor after reporting. This gives
      // Janek's independent patrol time to diverge from Ida's own work before
      // she needs contact again.
      const ownWork = input.places.source;
      if (near(self.position, ownWork.position)) {
        this.returningToOwnWork = false;
      } else {
        return {
          intent: { kind: "move_to", target: ownWork.position },
          activity: continueActivity(
            input.previousActivity,
            this.residentId,
            tick,
            "maintain_contact",
            "return_to_own_work",
          ),
        };
      }
    }

    if (visibleJanek) {
      const d = distance(self.position, visibleJanek.position);
      if (d <= 0.7 && tick - this.lastReportTick >= 180) {
        this.lastReportTick = tick;
        this.returningToOwnWork = true;
        return {
          intent: {
            kind: "speak",
            text: "Janek, the depot inspection is complete.",
            radius: 5,
          },
          activity: continueActivity(
            input.previousActivity,
            this.residentId,
            tick,
            "maintain_contact",
            "report_in_person",
          ),
        };
      }

      return {
        intent: { kind: "move_to", target: visibleJanek.position },
        activity: continueActivity(
          input.previousActivity,
          this.residentId,
          tick,
          "maintain_contact",
          "follow_visible_contact",
        ),
      };
    }

    const remembered =
      input.memory.actorBeliefs["resident:janek"]?.lastKnownPosition ?? null;
    if (remembered) {
      return {
        intent: { kind: "move_to", target: remembered },
        activity: continueActivity(
          input.previousActivity,
          this.residentId,
          tick,
          "maintain_contact",
          "check_last_known_contact",
        ),
      };
    }

    const currentSearch = input.places[this.searchTarget];
    if (near(self.position, currentSearch.position)) {
      this.searchTarget =
        this.searchTarget === "workbench" ? "depot" : "workbench";
    }
    const target = input.places[this.searchTarget];

    return {
      intent: { kind: "move_to", target: target.position },
      activity: continueActivity(
        input.previousActivity,
        this.residentId,
        tick,
        "maintain_contact",
        "search_" + this.searchTarget,
      ),
    };
  }
}
