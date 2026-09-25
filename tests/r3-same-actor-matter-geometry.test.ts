import { describe, expect, it } from "vitest";
import type {
  R3SameActorMatterCorpus,
} from "../src/r3/same-actor-matter-corpus";
import {
  compareR3SameActorWordingStability,
  evaluateR3SameActorEmbeddingRetrieval,
} from "../src/r3/same-actor-matter-geometry";

describe("R3 same-actor matter embedding geometry", () => {
  const corpus: R3SameActorMatterCorpus = {
    examples: [
      {
        residentId: "resident:ida",
        ecology: "material-work",
        wording: "baseline",
        anchorTick: 10,
        transitionHistory: [
          "no change",
          "finished part visible count increased",
        ],
        positiveMatter: {
          id: "resident:ida:matter:delivery",
          statement: "carry finished parts to storage",
          establishedTick: 0,
          source: "authored",
        },
        candidateMatters: [
          {
            id: "resident:ida:matter:delivery",
            statement: "carry finished parts to storage",
            establishedTick: 0,
            source: "authored",
          },
          {
            id: "resident:ida:matter:report",
            statement: "find coworker and report in person",
            establishedTick: 0,
            source: "authored",
          },
        ],
        eventful: true,
      },
      {
        residentId: "resident:ida",
        ecology: "material-work",
        wording: "paraphrase",
        anchorTick: 10,
        transitionHistory: [
          "no change",
          "finished part visible count increased",
        ],
        positiveMatter: {
          id: "resident:ida:matter:delivery",
          statement: "move completed pieces into storage",
          establishedTick: 0,
          source: "authored",
        },
        candidateMatters: [
          {
            id: "resident:ida:matter:delivery",
            statement: "move completed pieces into storage",
            establishedTick: 0,
            source: "authored",
          },
          {
            id: "resident:ida:matter:report",
            statement: "locate peer and deliver update",
            establishedTick: 0,
            source: "authored",
          },
        ],
        eventful: true,
      },
    ],
  };

  const embeddings = new Map<string, readonly number[]>([
    ["no change", [0.8, 0.2]],
    ["finished part visible count increased", [1, 0]],
    ["carry finished parts to storage", [0.9, 0.1]],
    ["find coworker and report in person", [0, 1]],
    ["move completed pieces into storage", [0.85, 0.15]],
    ["locate peer and deliver update", [0.1, 0.9]],
  ]);

  it("retrieves among matters owned by the same actor", () => {
    const result =
      evaluateR3SameActorEmbeddingRetrieval(
        corpus,
        embeddings,
        "resident:ida",
        "baseline",
        "mean-transitions",
      );

    expect(result.top1Accuracy).toBe(1);
    expect(result.meanPositiveMargin).toBeGreaterThan(0);
  });

  it("compares same-actor paraphrase stability", () => {
    const baseline =
      evaluateR3SameActorEmbeddingRetrieval(
        corpus,
        embeddings,
        "resident:ida",
        "baseline",
        "last-transition",
      );
    const paraphrase =
      evaluateR3SameActorEmbeddingRetrieval(
        corpus,
        embeddings,
        "resident:ida",
        "paraphrase",
        "last-transition",
      );

    const stability =
      compareR3SameActorWordingStability(
        baseline,
        paraphrase,
      );

    expect(stability.pairedQueries).toBe(1);
    expect(stability.predictionAgreement).toBe(1);
    expect(
      stability.positivePredictionAgreement,
    ).toBe(1);
  });
});
