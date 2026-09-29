import { describe, expect, it } from "vitest";
import {
  buildR3JointRelationFeatures,
  evaluateR3JointPredictions,
  predictR3JointLinearHead,
  trainR3JointLinearHead,
  type R3JointHeadTrainingExample,
} from "../src/r3/joint-relation-linear-head";

describe("R3 frozen joint linear relation head", () => {
  it("builds purpose-current and history-current absolute-difference features in frozen order", () => {
    expect(
      buildR3JointRelationFeatures(
        [0.1, -0.2],
        [0.4, 0.6],
        [0.3, -0.1],
      ),
    ).toEqual([
      0.19999999999999998,
      0.1,
      0.10000000000000003,
      0.7,
    ]);
  });

  it("learns a deterministic class-balanced linear boundary without threshold tuning", () => {
    const examples: R3JointHeadTrainingExample[] = [
      { id: "p1", features: [0.1, 0.1], label: true },
      { id: "p2", features: [0.2, 0.1], label: true },
      { id: "p3", features: [0.1, 0.2], label: true },
      { id: "n1", features: [1.0, 0.1], label: false },
      { id: "n2", features: [0.1, 1.0], label: false },
      { id: "n3", features: [0.9, 0.9], label: false },
    ];

    const first =
      trainR3JointLinearHead(examples);
    const second =
      trainR3JointLinearHead(examples);

    expect(second).toEqual(first);
    expect(first.trainingCount).toBe(6);
    expect(first.positiveCount).toBe(3);
    expect(first.negativeCount).toBe(3);

    const predictions =
      examples.map((example) =>
        predictR3JointLinearHead(
          first,
          example,
        ),
      );
    const metrics =
      evaluateR3JointPredictions(
        predictions,
      );

    expect(metrics.balancedAccuracy).toBe(1);
    expect(metrics.truePositiveRate).toBe(1);
    expect(metrics.trueNegativeRate).toBe(1);
  });
});
