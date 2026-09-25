import { describe, expect, it } from "vitest";
import {
  auditR3MatterLexicalRetrieval,
  auditR3MatterSemanticDiversity,
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

  it("deduplicates by model-visible semantic history rather than hidden structured variation", () => {
    for (const ecology of [
      "material-work",
      "moving-contact",
    ] as const) {
      for (const wording of [
        "baseline",
        "paraphrase",
      ] as const) {
        const audit = auditR3MatterLexicalRetrieval(
          corpus,
          ecology,
          wording,
        );
        expect(audit.exampleCount).toBeLessThan(
          corpus.examples.filter(
            (example) =>
              example.ecology === ecology &&
              example.wording === wording,
          ).length,
        );
      }
    }
  });

  it("reports semantic diversity instead of hiding low-diversity ecologies behind raw tick counts", () => {
    const audits = [
      auditR3MatterSemanticDiversity(
        corpus,
        "material-work",
        "baseline",
      ),
      auditR3MatterSemanticDiversity(
        corpus,
        "material-work",
        "paraphrase",
      ),
      auditR3MatterSemanticDiversity(
        corpus,
        "moving-contact",
        "baseline",
      ),
      auditR3MatterSemanticDiversity(
        corpus,
        "moving-contact",
        "paraphrase",
      ),
    ];

    console.info(
      "R3_MATTER_SEMANTIC_DIVERSITY",
      JSON.stringify(audits),
    );

    for (const audit of audits) {
      expect(audit.rawExampleCount).toBeGreaterThan(500);
      expect(audit.uniqueLabeledQueryCount).toBeGreaterThan(0);
      expect(audit.uniqueSemanticHistoryCount).toBeGreaterThan(0);
      expect(audit.uniqueSemanticFrameCount).toBeGreaterThan(0);
      expect(audit.compressionRatio).toBeGreaterThan(0);
      expect(audit.compressionRatio).toBeLessThanOrEqual(1);
    }

    const material = audits.find(
      (audit) =>
        audit.ecology === "material-work" &&
        audit.wording === "baseline",
    )!;
    const contact = audits.find(
      (audit) =>
        audit.ecology === "moving-contact" &&
        audit.wording === "baseline",
    )!;

    // This is an evidence assertion, not a quality threshold: the contact
    // ecology currently exposes dramatically less model-visible semantic
    // variety than the material ecology and must be treated as low-diversity
    // evidence rather than thousands of independent training examples.
    expect(material.uniqueSemanticHistoryCount).toBeGreaterThan(
      contact.uniqueSemanticHistoryCount * 5,
    );
    expect(contact.compressionRatio).toBeLessThan(0.05);
  });

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
      expect(audit.exampleCount).toBeGreaterThan(0);
      expect(audit.eventfulExampleCount).toBeGreaterThan(0);
      expect(audit.top1Accuracy).toBeGreaterThanOrEqual(0);
      expect(audit.top1Accuracy).toBeLessThanOrEqual(1);
      expect(audit.eventfulTop1Accuracy).toBeGreaterThanOrEqual(0);
      expect(audit.eventfulTop1Accuracy).toBeLessThanOrEqual(1);
    }
  }, 20_000);
});
