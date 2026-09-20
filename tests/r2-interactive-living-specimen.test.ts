import { describe, expect, it } from "vitest";
import {
  InteractiveLivingSpecimenSession,
} from "../src/r2/interactive-living-specimen";

describe("R2 interactive Owner intervention specimen", () => {
  it("keeps arbitrary received speech separate from interruption in the current fixture", () => {
    const session = new InteractiveLivingSpecimenSession(
      "private_hazard_oracle",
    );
    const step = session.advance({
      kind: "speech",
      text: "Mira, this sentence is intentionally not interpreted yet.",
    });

    expect(
      step.frame.privateByActor["resident:mira"]!.observations.some(
        (entry) => entry.kind === "speech.utterance",
      ),
    ).toBe(true);
    expect(step.decision.behavior).toBe("carry");
    expect(
      step.frame.privateByActor["resident:mira"]!.activity?.id,
    ).toBe("activity:interactive-carry-crate-a");
  });

  it("holds on a visible hazard and resumes only after a perceived resolution", () => {
    const session = new InteractiveLivingSpecimenSession(
      "private_hazard_oracle",
    );

    session.advance({ kind: "quiet" });
    const onset = session.advance({
      kind: "hazard_onset",
      perceived: true,
    });
    const waiting = session.advance({ kind: "quiet" });
    const resolution = session.advance({
      kind: "hazard_resolved",
      perceived: true,
    });

    expect(onset.decision.behavior).toBe("protective_hold");
    expect(onset.decision.evidenceIds).toHaveLength(1);
    expect(waiting.decision.behavior).toBe("protective_hold");
    expect(resolution.decision.behavior).toBe("resume_carry");
    expect(
      onset.frame.privateByActor["resident:mira"]!.activity?.id,
    ).toBe("activity:interactive-carry-crate-a");
    expect(
      resolution.frame.privateByActor["resident:mira"]!.activity?.id,
    ).toBe("activity:interactive-carry-crate-a");
  });

  it("does not let hidden World hazard truth enter the private oracle", () => {
    const session = new InteractiveLivingSpecimenSession(
      "private_hazard_oracle",
    );
    const hiddenOnset = session.advance({
      kind: "hazard_onset",
      perceived: false,
    });

    expect(
      hiddenOnset.frame.world.events.some(
        (entry) => entry.kind === "physical.hazard_onset",
      ),
    ).toBe(true);
    expect(
      hiddenOnset.frame.privateByActor["resident:mira"]!.observations.some(
        (entry) => entry.kind === "physical.hazard_onset",
      ),
    ).toBe(false);
    expect(hiddenOnset.decision.behavior).toBe("carry");
  });

  it("records a World exposure when a hidden hazard is crossed", () => {
    const session = new InteractiveLivingSpecimenSession(
      "private_hazard_oracle",
    );

    session.advance({
      kind: "hazard_onset",
      perceived: false,
    });

    let exposed = false;
    for (let i = 0; i < 8; i += 1) {
      const step = session.advance({ kind: "quiet" });
      exposed ||= step.frame.world.events.some(
        (entry) => entry.kind === "physical.hazard_exposure",
      );
      if (exposed) {
        expect(
          step.frame.privateByActor["resident:mira"]!.history.some(
            (entry) => entry.kind === "experienced_hazard_exposure",
          ),
        ).toBe(true);
        break;
      }
    }

    expect(exposed).toBe(true);
  });

  it("lets the null control continue through a visible hazard and exposes the causal consequence", () => {
    const session = new InteractiveLivingSpecimenSession("null_continue");

    session.advance({ kind: "quiet" });
    session.advance({ kind: "quiet" });
    session.advance({
      kind: "hazard_onset",
      perceived: true,
    });

    let exposed = false;
    for (let i = 0; i < 6; i += 1) {
      const step = session.advance({ kind: "quiet" });
      exposed ||= step.frame.world.events.some(
        (entry) => entry.kind === "physical.hazard_exposure",
      );
      if (exposed) break;
    }

    expect(exposed).toBe(true);
  });

  it("can preserve a stale private hazard belief when World resolution was not perceived", () => {
    const session = new InteractiveLivingSpecimenSession(
      "private_hazard_oracle",
    );

    session.advance({
      kind: "hazard_onset",
      perceived: true,
    });
    const hiddenResolution = session.advance({
      kind: "hazard_resolved",
      perceived: false,
    });
    const later = session.advance({ kind: "quiet" });

    expect(hiddenResolution.physical.hazardActive).toBe(false);
    expect(hiddenResolution.decision.behavior).toBe("protective_hold");
    expect(later.decision.behavior).toBe("protective_hold");
  });

  it("keeps every accumulated interactive frame causally valid", () => {
    const session = new InteractiveLivingSpecimenSession(
      "private_hazard_oracle",
    );
    session.advance({ kind: "quiet" });
    session.advance({ kind: "speech", text: "hello" });
    session.advance({ kind: "hazard_onset", perceived: true });
    session.advance({ kind: "quiet" });
    session.advance({ kind: "hazard_resolved", perceived: true });
    session.advance({ kind: "quiet" });

    const snapshot = session.snapshot();
    expect(snapshot.steps).toHaveLength(7);
    expect(snapshot.nextTick).toBe(7);
  });
});
