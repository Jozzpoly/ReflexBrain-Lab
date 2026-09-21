import { describe, expect, it } from "vitest";
import {
  auditR3MatterLexicalRetrieval,
  buildR3MatterRelationCorpus,
} from "../src/r3/matter-relation-corpus";

describe("R3 matter-to-lived-context relation corpus", () => {
  const corpus = buildR3MatterRelationCorpus({
    materialTicks: 1200,
    contactTicks: 1200,
    historyLength: 8,
  });

  it("creates matter-free temporal queries with same-ecology candidate matters", () => {
    for (const ecology of [
      "material-work",
      "moving-contact",
    ] as const) {
      for (const wording of [
        "baseline",
        "paraphrase",
      ] as const) {
        const examples = corpus.examples.filter(
          (example) =>
            example.ecology === ecology &&
            example.wording === wording,
        );

        expect(examples.length).toBeGreaterThan(500);

        for (const example of examples.slice(0, 50)) {
          expect(
            example.candidateMatters.length,
          ).toBeGreaterThanOrEqual(2);
          expect(
            example.candidateMatters.some(
              (matter) =>
                matter.id === example.positiveMatter.id,
            ),
          ).toBe(true);

          const query = JSON.stringify(example.context);
          expect(query).not.toContain(
            example.positiveMatter.statement,
          );
          expect(query).not.toContain(example.residentId);
          expect(query).not.toContain(ecology);
          expect(query).not.toContain("maintain_input_stock");
          expect(query).not.toContain("maintain_contact");
        }
      }
    }
  }, 20_000);

  it("keeps matter-free private trajectories invariant under wording-only counterfactuals", () => {
    for (const ecology of [
      "material-work",
      "moving-contact",
    ] as const) {
      const baseline = corpus.examples.filter(
        (example) =>
          example.ecology === ecology &&
          example.wording === "baseline",
      );
      const paraphrase = new Map(
        corpus.examples
          .filter(
            (example) =>
              example.ecology === ecology &&
              example.wording === "paraphrase",
          )
          .map((example) => [
            example.residentId + ":" + example.anchorTick,
            example,
          ]),
      );

      let compared = 0;
      for (const example of baseline) {
        const paired = paraphrase.get(
          example.residentId + ":" + example.anchorTick,
        );
        if (!paired) continue;
        compared += 1;

        expect(paired.context).toEqual(example.context);
        expect(paired.positiveMatter.id).toBe(
          example.positiveMatter.id,
        );
        expect(paired.positiveMatter.statement).not.toBe(
          example.positiveMatter.statement,
        );
      }
      expect(compared).toBeGreaterThan(500);
    }
  }, 20_000);

  it("contains changing private-life windows in both ecologies and wording variants", () => {
    for (const ecology of [
      "material-work",
      "moving-contact",
    ] as const) {
      for (const wording of [
        "baseline",
        "paraphrase",
      ] as const) {
        const eventful = corpus.examples.filter(
          (example) =>
            example.ecology === ecology &&
            example.wording === wording &&
            example.eventful,
        );
        expect(eventful.length).toBeGreaterThan(100);
      }
    }
  }, 20_000);

  it("measures lexical-overlap shortcut strength before any encoder probe", () => {
    const audits = [
      auditR3MatterLexicalRetrieval(
        corpus,
        "material-work",
        "baseline",
      ),
      auditR3MatterLexicalRetrieval(
        corpus,
        "material-work",
        "paraphrase",
      ),
      auditR3MatterLexicalRetrieval(
        corpus,
        "moving-contact",
        "baseline",
      ),
      auditR3MatterLexicalRetrieval(
        corpus,
        "moving-contact",
        "paraphrase",
      ),
    ];

    console.info(
      "R3_MATTER_LEXICAL_RETRIEVAL",
      JSON.stringify(audits),
    );

    for (const audit of audits) {
      expect(audit.exampleCount).toBeGreaterThan(20);
      expect(audit.eventfulExampleCount).toBeGreaterThan(10);
      expect(audit.top1Accuracy).toBeGreaterThanOrEqual(0);
      expect(audit.top1Accuracy).toBeLessThanOrEqual(1);
      expect(audit.eventfulTop1Accuracy).toBeGreaterThanOrEqual(0);
      expect(audit.eventfulTop1Accuracy).toBeLessThanOrEqual(1);
    }
  }, 20_000);
});
