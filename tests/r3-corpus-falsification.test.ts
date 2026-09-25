import { describe, expect, it } from "vitest";
import { buildR3CrossEcologyCorpus } from "../src/r3/learning-corpus";
import {
  auditR3InputIdentifiability,
  auditR3ProbeNegativeControls,
  semanticTokens,
  surveyR3ExistingProbeTarget,
  toR3BinaryProbeExamples,
} from "../src/r3/corpus-falsification";

describe("R3 corpus falsification", () => {
  const corpus = buildR3CrossEcologyCorpus({
    materialTicks: 1200,
    contactTicks: 1200,
    historyLength: 8,
    horizonTicks: 16,
  });

  it("has positive and negative future activity-phase transitions in both ecologies", () => {
    for (const ecology of [
      "material-work",
      "moving-contact",
    ] as const) {
      const rows = toR3BinaryProbeExamples(
        corpus.examples.filter(
          (example) => example.ecology === ecology,
        ),
        "future_activity_phase_change",
      );

      const positives = rows.filter((row) => row.label).length;
      expect(positives).toBeGreaterThan(20);
      expect(rows.length - positives).toBeGreaterThan(20);
    }
  });

  it("does not expose metadata identifiers through the token-control view", () => {
    const sample = corpus.examples[100]!;
    const tokens = semanticTokens(sample);

    expect(tokens).not.toContain("resident");
    expect(tokens).not.toContain("material-work");
    expect(tokens).not.toContain("moving-contact");
    expect(tokens).not.toContain("maintain_input_stock");
    expect(tokens).not.toContain("maintain_contact");
  });

  it("rejects future activity-phase change as the first cross-ecology semantic probe", () => {
    const material = auditR3InputIdentifiability(
      corpus,
      "future_activity_phase_change",
      "material-work",
    );
    const contact = auditR3InputIdentifiability(
      corpus,
      "future_activity_phase_change",
      "moving-contact",
    );

    console.info(
      "R3_IDENTIFIABILITY_AUDIT",
      JSON.stringify([material, contact]),
    );

    expect(
      material.signatureOracle.balancedAccuracy,
    ).toBeGreaterThan(0.7);
    expect(
      contact.signatureOracle.balancedAccuracy,
    ).toBeLessThan(0.7);
    expect(contact.conflictedExampleRate).toBeGreaterThan(0.5);
  });

  it("surveys all current factual-delta targets before allowing a representation probe", () => {
    const targets = [
      "future_activity_identity_change",
      "future_activity_phase_change",
      "future_held_object_change",
      "future_visible_object_kinds_change",
      "future_speech_arrival",
    ] as const;

    const surveys = targets.map((target) =>
      surveyR3ExistingProbeTarget(corpus, target),
    );

    console.info(
      "R3_FACT_DELTA_TARGET_SURVEY",
      JSON.stringify(surveys),
    );

    // This is deliberately not an assertion that one target must qualify.
    // The survey exists to stop us from forcing a learned experiment when
    // current trajectory deltas are the wrong learning question.
    expect(surveys).toHaveLength(targets.length);
  });

  it("requires exact-input memorization to fail under ecology holdout", () => {
    for (const heldOutEcology of [
      "material-work",
      "moving-contact",
    ] as const) {
      const audit = auditR3ProbeNegativeControls(
        corpus,
        "future_activity_phase_change",
        heldOutEcology,
      );

      // Exact input memorization should collapse to fallback when the ecology
      // really presents new private states. A near-perfect result here means
      // the target is shortcut-shaped even before using an encoder.
      expect(
        audit.exactInputMemorizer.balancedAccuracy,
      ).toBeLessThan(0.8);
    }
  });

  it("requires a bag-of-surface-tokens memorizer to remain materially imperfect across ecologies", () => {
    for (const heldOutEcology of [
      "material-work",
      "moving-contact",
    ] as const) {
      const audit = auditR3ProbeNegativeControls(
        corpus,
        "future_activity_phase_change",
        heldOutEcology,
      );

      console.info(
        "R3_NEGATIVE_CONTROL_AUDIT",
        JSON.stringify(audit),
      );

      expect(
        audit.tokenMemorizer.balancedAccuracy,
      ).toBeLessThan(0.85);
    }
  });
});
