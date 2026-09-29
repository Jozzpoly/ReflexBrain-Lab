import { describe, expect, it } from "vitest";
import {
  auditR3TransitionLexicalRetrieval,
  auditR3TransitionSemanticDiversity,
  buildR3TransitionMatterCorpus,
} from "../src/r3/transition-matter-corpus";

describe("R3 actor-private transition relation audit", () => {
  const corpus = buildR3TransitionMatterCorpus({
    materialTicks: 1200,
    contactTicks: 1200,
    historyLength: 8,
  });

  it("keeps transition histories matter-free and policy-free", () => {
    for (const example of corpus.examples.slice(0, 300)) {
      const text = example.transitionHistory.join("\n");

      expect(text).not.toContain(example.residentId);
      expect(text).not.toContain(
        example.positiveMatter.statement,
      );
      expect(text).not.toContain("maintain_input_stock");
      expect(text).not.toContain("process_material");
      expect(text).not.toContain("collect_output");
      expect(text).not.toContain("maintain_contact");
      expect(text).not.toContain("patrol_between_places");
      expect(text).not.toContain("tick:");
    }
  }, 20_000);

  it("keeps private transition histories invariant under wording-only matter counterfactuals", () => {
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

        expect(paired.transitionHistory).toEqual(
          example.transitionHistory,
        );
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

  it("reports transition-view semantic diversity before another encoder run", () => {
    const audits = [
      auditR3TransitionSemanticDiversity(
        corpus,
        "material-work",
        "baseline",
      ),
      auditR3TransitionSemanticDiversity(
        corpus,
        "material-work",
        "paraphrase",
      ),
      auditR3TransitionSemanticDiversity(
        corpus,
        "moving-contact",
        "baseline",
      ),
      auditR3TransitionSemanticDiversity(
        corpus,
        "moving-contact",
        "paraphrase",
      ),
    ];

    console.info(
      "R3_TRANSITION_SEMANTIC_DIVERSITY",
      JSON.stringify(audits),
    );

    for (const audit of audits) {
      expect(audit.rawExampleCount).toBeGreaterThan(500);
      expect(
        audit.uniqueTransitionHistoryCount,
      ).toBeGreaterThan(0);
      expect(
        audit.uniqueTransitionFrameCount,
      ).toBeGreaterThan(0);
      expect(audit.eventfulRawCount).toBeGreaterThan(0);
    }
  }, 20_000);

  it("measures transition lexical shortcuts before any transition encoder probe", () => {
    const audits = [
      auditR3TransitionLexicalRetrieval(
        corpus,
        "material-work",
        "baseline",
      ),
      auditR3TransitionLexicalRetrieval(
        corpus,
        "material-work",
        "paraphrase",
      ),
      auditR3TransitionLexicalRetrieval(
        corpus,
        "moving-contact",
        "baseline",
      ),
      auditR3TransitionLexicalRetrieval(
        corpus,
        "moving-contact",
        "paraphrase",
      ),
    ];

    console.info(
      "R3_TRANSITION_LEXICAL_RETRIEVAL",
      JSON.stringify(audits),
    );

    for (const audit of audits) {
      expect(audit.exampleCount).toBeGreaterThan(0);
      expect(audit.top1Accuracy).toBeGreaterThanOrEqual(0);
      expect(audit.top1Accuracy).toBeLessThanOrEqual(1);
      expect(audit.tieRate).toBeGreaterThanOrEqual(0);
      expect(audit.tieRate).toBeLessThanOrEqual(1);
    }
  }, 20_000);
});
