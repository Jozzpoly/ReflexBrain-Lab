import { describe, expect, it } from "vitest";
import type {
  R3MixedPressureCausalCorpus,
} from "../src/r3/mixed-pressure-causal-responsibility";
import {
  compareR3MixedPressureWordingStability,
  evaluateR3MixedPressureEmbeddingRetrieval,
} from "../src/r3/mixed-pressure-geometry";

describe("R3 mixed-pressure embedding geometry", () => {
  const corpus: R3MixedPressureCausalCorpus = {
    examples: [
      {
        wording: "baseline",
        anchorTick: 20,
        queryEndTick: 20,
        transitionHistory: [
          "private temporal change\nraw blank visible count increased",
        ],
        candidateMatters: [
          {
            id: "resident:janek:matter:workshop-processing",
            statement: "turn raw blanks into finished parts",
            establishedTick: 0,
            source: "authored",
          },
          {
            id: "resident:janek:matter:local-report-response",
            statement: "acknowledge coworker reports",
            establishedTick: 0,
            source: "authored",
          },
        ],
        causallyResponsibleMatterId:
          "resident:janek:matter:workshop-processing",
        baselineDecision: {
          intent: { kind: "idle" },
          activity: null,
        },
        ablationDecisionByMatterId: {},
      },
      {
        wording: "paraphrase",
        anchorTick: 20,
        queryEndTick: 20,
        transitionHistory: [
          "private temporal change\nraw blank visible count increased",
        ],
        candidateMatters: [
          {
            id: "resident:janek:matter:workshop-processing",
            statement: "convert unfinished stock into completed pieces",
            establishedTick: 0,
            source: "authored",
          },
          {
            id: "resident:janek:matter:local-report-response",
            statement: "respond to a nearby coworker's immediate update",
            establishedTick: 0,
            source: "authored",
          },
        ],
        causallyResponsibleMatterId:
          "resident:janek:matter:workshop-processing",
        baselineDecision: {
          intent: { kind: "idle" },
          activity: null,
        },
        ablationDecisionByMatterId: {},
      },
    ],
  };

  const embeddings = new Map<
    string,
    readonly number[]
  >([
    [
      "private temporal change\nraw blank visible count increased",
      [1, 0],
    ],
    ["turn raw blanks into finished parts", [0.9, 0.1]],
    ["acknowledge coworker reports", [0, 1]],
    [
      "convert unfinished stock into completed pieces",
      [0.85, 0.15],
    ],
    [
      "respond to a nearby coworker's immediate update",
      [0.1, 0.9],
    ],
  ]);

  it("retrieves causal responsibility among simultaneous matters", () => {
    const result =
      evaluateR3MixedPressureEmbeddingRetrieval(
        corpus,
        embeddings,
        "baseline",
        "last-transition",
      );

    expect(result.top1Accuracy).toBe(1);
    expect(
      result.meanResponsibleMargin,
    ).toBeGreaterThan(0);
    expect(
      result.perMatterAccuracy[
        "resident:janek:matter:workshop-processing"
      ],
    ).toBe(1);
  });

  it("pairs baseline/paraphrase wording by anchor tick", () => {
    const baseline =
      evaluateR3MixedPressureEmbeddingRetrieval(
        corpus,
        embeddings,
        "baseline",
        "mean-transitions",
      );
    const paraphrase =
      evaluateR3MixedPressureEmbeddingRetrieval(
        corpus,
        embeddings,
        "paraphrase",
        "mean-transitions",
      );

    const stability =
      compareR3MixedPressureWordingStability(
        baseline,
        paraphrase,
      );

    expect(stability.pairedQueries).toBe(1);
    expect(stability.predictionAgreement).toBe(1);
    expect(
      stability.responsiblePredictionAgreement,
    ).toBe(1);
  });
});
