import { describe, expect, it } from "vitest";
import type {
  R3CausalMatterResponsibilityCorpus,
} from "../src/r3/causal-matter-responsibility";
import {
  compareR3CausalMatterWordingStability,
  evaluateR3CausalMatterEmbeddingRetrieval,
} from "../src/r3/causal-matter-geometry";

describe("R3 causal matter embedding geometry", () => {
  const corpus: R3CausalMatterResponsibilityCorpus = {
    examples: [
      {
        residentId: "resident:janek",
        ecology: "material-work",
        wording: "baseline",
        anchorTick: 20,
        queryEndTick: 20,
        transitionHistory: [
          "no change",
          "raw blank visible count increased",
        ],
        candidateMatters: [
          {
            id: "resident:janek:matter:workshop-processing",
            statement: "process incoming material",
            establishedTick: 0,
            source: "authored",
          },
          {
            id: "resident:janek:matter:contact-patrol",
            statement: "patrol and remain reachable",
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
        residentId: "resident:janek",
        ecology: "material-work",
        wording: "paraphrase",
        anchorTick: 20,
        queryEndTick: 20,
        transitionHistory: [
          "no change",
          "raw blank visible count increased",
        ],
        candidateMatters: [
          {
            id: "resident:janek:matter:workshop-processing",
            statement: "convert unfinished stock into completed pieces",
            establishedTick: 0,
            source: "authored",
          },
          {
            id: "resident:janek:matter:contact-patrol",
            statement: "walk route and stay available",
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

  const embeddings = new Map<string, readonly number[]>([
    ["no change", [0.8, 0.2]],
    ["raw blank visible count increased", [1, 0]],
    ["process incoming material", [0.9, 0.1]],
    ["patrol and remain reachable", [0, 1]],
    ["convert unfinished stock into completed pieces", [0.85, 0.15]],
    ["walk route and stay available", [0.1, 0.9]],
  ]);

  it("retrieves the causally responsible matter", () => {
    const result =
      evaluateR3CausalMatterEmbeddingRetrieval(
        corpus,
        embeddings,
        "resident:janek",
        "baseline",
        "last-transition",
      );

    expect(result.top1Accuracy).toBe(1);
    expect(
      result.meanResponsibleMargin,
    ).toBeGreaterThan(0);
  });

  it("compares causal responsibility stability under paraphrase", () => {
    const baseline =
      evaluateR3CausalMatterEmbeddingRetrieval(
        corpus,
        embeddings,
        "resident:janek",
        "baseline",
        "mean-transitions",
      );
    const paraphrase =
      evaluateR3CausalMatterEmbeddingRetrieval(
        corpus,
        embeddings,
        "resident:janek",
        "paraphrase",
        "mean-transitions",
      );

    const stability =
      compareR3CausalMatterWordingStability(
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
