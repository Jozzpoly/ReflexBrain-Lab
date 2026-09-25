import { describe, expect, it } from "vitest";
import {
  buildR3CrossEcologyCorpus,
  serializeR3SemanticLearningFrame,
  splitR3CorpusByHeldOutEcology,
} from "../src/r3/learning-corpus";
import { createAutonomousLifeRun } from "../src/r3/autonomous-life-run";

describe("R3 cross-ecology learning corpus", () => {
  it("builds one learning schema from two qualitatively different autonomous ecologies", () => {
    const corpus = buildR3CrossEcologyCorpus({
      materialTicks: 320,
      contactTicks: 320,
      historyLength: 6,
      horizonTicks: 8,
    });

    const ecologies = new Set(
      corpus.examples.map((example) => example.ecology),
    );

    expect(ecologies).toEqual(
      new Set(["material-work", "moving-contact"]),
    );
    expect(
      corpus.examples.filter(
        (example) => example.ecology === "material-work",
      ).length,
    ).toBeGreaterThan(500);
    expect(
      corpus.examples.filter(
        (example) => example.ecology === "moving-contact",
      ).length,
    ).toBeGreaterThan(300);

    for (const example of corpus.examples.slice(0, 20)) {
      expect(example.input.history).toHaveLength(6);
      for (const frame of example.input.history) {
        expect(typeof frame.semanticText).toBe("string");
        expect(typeof frame.structured.visibleActorCount).toBe("number");
      }
    }
  });

  it("keeps ecology, actor identity, absolute time, and fixture activity labels out of model input", () => {
    const corpus = buildR3CrossEcologyCorpus({
      materialTicks: 180,
      contactTicks: 180,
    });

    const forbidden = [
      "resident:mira",
      "resident:janek",
      "resident:ida",
      "material-work",
      "moving-contact",
      "maintain_input_stock",
      "process_material",
      "collect_output",
      "patrol_between_places",
      "maintain_contact",
      "check_last_known_contact",
      "tick:",
    ];

    for (const example of corpus.examples.slice(0, 250)) {
      const inputText = JSON.stringify(example.input);
      for (const token of forbidden) {
        expect(inputText).not.toContain(token);
      }
    }
  });

  it("keeps factual future outcome names in evaluation metadata rather than inference input", () => {
    const corpus = buildR3CrossEcologyCorpus({
      materialTicks: 800,
      contactTicks: 200,
      historyLength: 6,
      horizonTicks: 8,
    });

    const withOutcome = corpus.examples.find((example) =>
      example.evaluation.futureDelta.factualOutcomeKinds.includes(
        "processing_completed",
      ),
    );

    expect(withOutcome).toBeDefined();
    expect(
      JSON.stringify(withOutcome!.input),
    ).not.toContain("processing_completed");
    expect(
      withOutcome!.evaluation.futureDelta.factualOutcomeKinds,
    ).toContain("processing_completed");
  });

  it("supports strict ecology holdout without mixing metadata into the input", () => {
    const corpus = buildR3CrossEcologyCorpus({
      materialTicks: 240,
      contactTicks: 240,
    });

    const contactHeldOut = splitR3CorpusByHeldOutEcology(
      corpus,
      "moving-contact",
    );

    expect(contactHeldOut.train.length).toBeGreaterThan(0);
    expect(contactHeldOut.heldOut.length).toBeGreaterThan(0);
    expect(
      contactHeldOut.train.every(
        (example) => example.ecology === "material-work",
      ),
    ).toBe(true);
    expect(
      contactHeldOut.heldOut.every(
        (example) => example.ecology === "moving-contact",
      ),
    ).toBe(true);
  });

  it("represents the same naturally heard sentence differently through actor-owned matters", () => {
    const run = createAutonomousLifeRun();
    run.runTicks(500);

    const speech = run
      .allEvents()
      .find(
        (event) =>
          event.kind === "speech" &&
          event.payload.text === "The input rack is empty.",
      );
    expect(speech).toBeDefined();

    const receivers = run
      .privateExperiences()
      .filter((row) =>
        row.observation.heardEvents.some(
          (event) => event.id === speech!.id,
        ),
      );

    expect(receivers.length).toBeGreaterThanOrEqual(2);

    const texts = receivers.map(serializeR3SemanticLearningFrame);
    expect(
      texts.every((text) =>
        text.includes("The input rack is empty."),
      ),
    ).toBe(true);
    expect(new Set(texts).size).toBeGreaterThanOrEqual(2);
  });
});
