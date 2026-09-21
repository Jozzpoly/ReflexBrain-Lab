import { describe, expect, it } from "vitest";
import { buildR3CrossEcologyCorpus } from "../src/r3/learning-corpus";
import {
  auditR3ProbeNegativeControls,
  semanticTokens,
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

      expect(
        audit.tokenMemorizer.balancedAccuracy,
      ).toBeLessThan(0.85);
    }
  });
});
