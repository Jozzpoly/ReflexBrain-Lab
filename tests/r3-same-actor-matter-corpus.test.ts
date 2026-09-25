import { describe, expect, it } from "vitest";
import {
  auditR3SameActorMatterDiversity,
  auditR3SameActorMatterLexicalRetrieval,
  buildR3SameActorMatterCorpus,
} from "../src/r3/same-actor-matter-corpus";
import {
  buildR3TransitionMatterCorpus,
} from "../src/r3/transition-matter-corpus";

describe("R3 same-actor matter relation audit", () => {
  const transitionCorpus =
    buildR3TransitionMatterCorpus({
      materialTicks: 1200,
      contactTicks: 1200,
      historyLength: 8,
    });
  const corpus =
    buildR3SameActorMatterCorpus(
      transitionCorpus,
    );

  it("uses only matters belonging to the same resident as candidates", () => {
    for (const example of corpus.examples.slice(0, 500)) {
      expect(example.candidateMatters).toHaveLength(2);
      expect(
        example.candidateMatters.every((matter) =>
          matter.id.startsWith(
            example.residentId + ":matter:",
          ),
        ),
      ).toBe(true);
      expect(
        example.candidateMatters.some(
          (matter) =>
            matter.id === example.positiveMatter.id,
        ),
      ).toBe(true);
    }
  }, 20_000);

  it("keeps actor identity, ecology metadata and matter text out of the transition query", () => {
    for (const example of corpus.examples.slice(0, 500)) {
      const query =
        example.transitionHistory.join("\n");

      expect(query).not.toContain(example.residentId);
      expect(query).not.toContain(example.ecology);
      for (const matter of example.candidateMatters) {
        expect(query).not.toContain(matter.statement);
      }
    }
  }, 20_000);

  it("audits whether same-actor candidate retrieval is identifiable before another model run", () => {
    const audits = [
      auditR3SameActorMatterDiversity(
        corpus,
        "resident:janek",
        "baseline",
      ),
      auditR3SameActorMatterDiversity(
        corpus,
        "resident:janek",
        "paraphrase",
      ),
      auditR3SameActorMatterDiversity(
        corpus,
        "resident:ida",
        "baseline",
      ),
      auditR3SameActorMatterDiversity(
        corpus,
        "resident:ida",
        "paraphrase",
      ),
    ];

    console.info(
      "R3_SAME_ACTOR_MATTER_DIVERSITY",
      JSON.stringify(audits),
    );

    for (const audit of audits) {
      expect(audit.candidateCount).toBe(2);
      expect(audit.sourceEcologies).toEqual(
        ["material-work", "moving-contact"],
      );
      expect(
        audit.uniqueTransitionHistoryCount,
      ).toBeGreaterThan(0);
      expect(
        audit.eventfulUniqueLabeledQueryCount,
      ).toBeGreaterThan(0);
    }
  }, 20_000);

  it("measures same-actor lexical shortcuts before semantic encoder evaluation", () => {
    const audits = [
      auditR3SameActorMatterLexicalRetrieval(
        corpus,
        "resident:janek",
        "baseline",
      ),
      auditR3SameActorMatterLexicalRetrieval(
        corpus,
        "resident:janek",
        "paraphrase",
      ),
      auditR3SameActorMatterLexicalRetrieval(
        corpus,
        "resident:ida",
        "baseline",
      ),
      auditR3SameActorMatterLexicalRetrieval(
        corpus,
        "resident:ida",
        "paraphrase",
      ),
    ];

    console.info(
      "R3_SAME_ACTOR_MATTER_LEXICAL",
      JSON.stringify(audits),
    );

    for (const audit of audits) {
      expect(audit.candidateCount).toBe(2);
      expect(audit.chanceTop1).toBe(0.5);
      expect(audit.top1Accuracy).toBeGreaterThanOrEqual(0);
      expect(audit.top1Accuracy).toBeLessThanOrEqual(1);
    }
  }, 20_000);
});
