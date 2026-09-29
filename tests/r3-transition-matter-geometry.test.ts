import { describe, expect, it } from "vitest";
import type {
  R3TransitionMatterCorpus,
} from "../src/r3/transition-matter-corpus";
import {
  compareR3TransitionWordingStability,
  evaluateR3TransitionEmbeddingRetrieval,
} from "../src/r3/transition-matter-geometry";

describe("R3 transition matter embedding geometry", () => {
  const corpus: R3TransitionMatterCorpus = {
    examples: [
      {
        ecology: "moving-contact",
        wording: "baseline",
        residentId: "resident:janek",
        anchorTick: 10,
        transitionHistory: [
          "no change",
          "actor entered sight",
        ],
        positiveMatter: {
          id: "resident:janek:matter:a",
          statement: "patrol and remain available",
          establishedTick: 0,
          source: "authored",
        },
        candidateMatters: [
          {
            id: "resident:janek:matter:a",
            statement: "patrol and remain available",
            establishedTick: 0,
            source: "authored",
          },
          {
            id: "resident:ida:matter:b",
            statement: "find coworker and report",
            establishedTick: 0,
            source: "authored",
          },
        ],
        eventful: true,
      },
      {
        ecology: "moving-contact",
        wording: "paraphrase",
        residentId: "resident:janek",
        anchorTick: 10,
        transitionHistory: [
          "no change",
          "actor entered sight",
        ],
        positiveMatter: {
          id: "resident:janek:matter:a",
          statement: "walk route while reachable",
          establishedTick: 0,
          source: "authored",
        },
        candidateMatters: [
          {
            id: "resident:janek:matter:a",
            statement: "walk route while reachable",
            establishedTick: 0,
            source: "authored",
          },
          {
            id: "resident:ida:matter:b",
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
    ["actor entered sight", [1, 0]],
    ["patrol and remain available", [0.9, 0.1]],
    ["find coworker and report", [0, 1]],
    ["walk route while reachable", [0.85, 0.15]],
    ["locate peer and deliver update", [0.1, 0.9]],
  ]);

  it("retrieves from last transition", () => {
    const result =
      evaluateR3TransitionEmbeddingRetrieval(
        corpus,
        embeddings,
        "moving-contact",
        "baseline",
        "last-transition",
      );

    expect(result.top1Accuracy).toBe(1);
    expect(result.meanPositiveMargin).toBeGreaterThan(0);
  });

  it("retrieves from mean transition history", () => {
    const result =
      evaluateR3TransitionEmbeddingRetrieval(
        corpus,
        embeddings,
        "moving-contact",
        "baseline",
        "mean-transitions",
      );

    expect(result.top1Accuracy).toBe(1);
  });

  it("compares wording stability on paired transition histories", () => {
    const baseline =
      evaluateR3TransitionEmbeddingRetrieval(
        corpus,
        embeddings,
        "moving-contact",
        "baseline",
        "mean-transitions",
      );
    const paraphrase =
      evaluateR3TransitionEmbeddingRetrieval(
        corpus,
        embeddings,
        "moving-contact",
        "paraphrase",
        "mean-transitions",
      );

    const stability =
      compareR3TransitionWordingStability(
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
