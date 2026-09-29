import { describe, expect, it } from "vitest";
import type {
  R3MatterRelationCorpus,
} from "../src/r3/matter-relation-corpus";
import {
  compareR3MatterWordingStability,
  cosineSimilarity,
  evaluateR3MatterEmbeddingRetrieval,
} from "../src/r3/matter-relation-geometry";

describe("R3 matter relation embedding geometry", () => {
  const corpus: R3MatterRelationCorpus = {
    examples: [
      {
        id: "baseline:a",
        ecology: "moving-contact",
        wording: "baseline",
        anchorTick: 10,
        residentId: "resident:janek",
        context: [
          {
            semanticText: "context patrol",
            structured: {
              hasOngoingActivity: true,
              heldObjectPresent: false,
              visibleActorCount: 0,
              visibleObjectCount: 0,
              rememberedActorCount: 0,
              locatedActorContactCount: 0,
              rememberedObjectCount: 0,
              locatedObjectCount: 0,
            },
          },
        ],
        positiveMatter: {
          id: "resident:janek:matter:a",
          statement: "matter patrol",
          establishedTick: 0,
          source: "authored",
        },
        candidateMatters: [
          {
            id: "resident:janek:matter:a",
            statement: "matter patrol",
            establishedTick: 0,
            source: "authored",
          },
          {
            id: "resident:ida:matter:b",
            statement: "matter report",
            establishedTick: 0,
            source: "authored",
          },
        ],
        eventful: true,
      },
      {
        id: "paraphrase:a",
        ecology: "moving-contact",
        wording: "paraphrase",
        anchorTick: 10,
        residentId: "resident:janek",
        context: [
          {
            semanticText: "context patrol",
            structured: {
              hasOngoingActivity: true,
              heldObjectPresent: false,
              visibleActorCount: 0,
              visibleObjectCount: 0,
              rememberedActorCount: 0,
              locatedActorContactCount: 0,
              rememberedObjectCount: 0,
              locatedObjectCount: 0,
            },
          },
        ],
        positiveMatter: {
          id: "resident:janek:matter:a",
          statement: "paraphrased patrol",
          establishedTick: 0,
          source: "authored",
        },
        candidateMatters: [
          {
            id: "resident:janek:matter:a",
            statement: "paraphrased patrol",
            establishedTick: 0,
            source: "authored",
          },
          {
            id: "resident:ida:matter:b",
            statement: "paraphrased report",
            establishedTick: 0,
            source: "authored",
          },
        ],
        eventful: true,
      },
    ],
  };

  const embeddings = new Map<string, readonly number[]>([
    ["context patrol", [1, 0]],
    ["matter patrol", [0.9, 0.1]],
    ["matter report", [0, 1]],
    ["paraphrased patrol", [0.8, 0.2]],
    ["paraphrased report", [0.1, 0.9]],
  ]);

  it("retrieves the positive matter from semantic geometry", () => {
    const baseline = evaluateR3MatterEmbeddingRetrieval(
      corpus,
      embeddings,
      "moving-contact",
      "baseline",
      "last-frame",
    );

    expect(baseline.top1Accuracy).toBe(1);
    expect(baseline.meanPositiveMargin).toBeGreaterThan(0);
  });

  it("compares wording stability by actor/tick key", () => {
    const baseline = evaluateR3MatterEmbeddingRetrieval(
      corpus,
      embeddings,
      "moving-contact",
      "baseline",
      "last-frame",
    );
    const paraphrase = evaluateR3MatterEmbeddingRetrieval(
      corpus,
      embeddings,
      "moving-contact",
      "paraphrase",
      "last-frame",
    );

    const stability = compareR3MatterWordingStability(
      baseline,
      paraphrase,
    );

    expect(stability.pairedQueries).toBe(1);
    expect(stability.predictionAgreement).toBe(1);
    expect(stability.positivePredictionAgreement).toBe(1);
  });

  it("computes ordinary cosine similarity without R1 ontology dependencies", () => {
    expect(cosineSimilarity([1, 0], [1, 0])).toBeCloseTo(1);
    expect(cosineSimilarity([1, 0], [0, 1])).toBeCloseTo(0);
  });
});
