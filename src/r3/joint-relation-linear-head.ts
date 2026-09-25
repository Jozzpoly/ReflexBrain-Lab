export const R3_JOINT_HEAD_ITERATIONS = 1200;
export const R3_JOINT_HEAD_L2 = 0.02;
export const R3_JOINT_HEAD_BASE_LEARNING_RATE = 0.2;
export const R3_JOINT_HEAD_THRESHOLD = 0.5;

export interface R3JointHeadTrainingExample {
  id: string;
  features: readonly number[];
  label: boolean;
}

export interface R3JointLinearHead {
  weights: readonly number[];
  bias: number;
  featureDimensions: number;
  trainingCount: number;
  positiveCount: number;
  negativeCount: number;
}

export interface R3JointHeadPrediction {
  id: string;
  probability: number;
  predicted: boolean;
  label: boolean;
}

export interface R3JointHeadMetrics {
  count: number;
  positives: number;
  negatives: number;
  truePositive: number;
  trueNegative: number;
  falsePositive: number;
  falseNegative: number;
  accuracy: number;
  balancedAccuracy: number;
  truePositiveRate: number;
  trueNegativeRate: number;
}

export function buildR3JointRelationFeatures(
  purpose: readonly number[],
  history: readonly number[],
  current: readonly number[],
): number[] {
  if (
    purpose.length === 0 ||
    purpose.length !== history.length ||
    purpose.length !== current.length
  ) {
    throw new Error(
      "joint relation features require equal non-empty embedding dimensions",
    );
  }

  const features = new Array<number>(
    purpose.length * 2,
  );

  for (
    let index = 0;
    index < purpose.length;
    index += 1
  ) {
    features[index] =
      Math.abs(
        purpose[index]! -
          current[index]!,
      );
    features[
      purpose.length + index
    ] =
      Math.abs(
        history[index]! -
          current[index]!,
      );
  }

  return features;
}

export function trainR3JointLinearHead(
  examples:
    readonly R3JointHeadTrainingExample[],
): R3JointLinearHead {
  if (examples.length === 0) {
    throw new Error(
      "joint linear head requires TRAIN examples",
    );
  }

  const dimensions =
    examples[0]!.features.length;
  if (dimensions === 0) {
    throw new Error(
      "joint linear head requires non-empty features",
    );
  }

  for (const example of examples) {
    if (
      example.features.length !==
      dimensions
    ) {
      throw new Error(
        "joint linear head feature dimension mismatch",
      );
    }
    for (const value of example.features) {
      if (!Number.isFinite(value)) {
        throw new Error(
          "joint linear head received non-finite feature",
        );
      }
    }
  }

  const positiveCount =
    examples.filter(
      (example) => example.label,
    ).length;
  const negativeCount =
    examples.length -
    positiveCount;

  if (
    positiveCount === 0 ||
    negativeCount === 0
  ) {
    throw new Error(
      "joint linear head requires both TRAIN classes",
    );
  }

  const positiveWeight =
    examples.length /
    (2 * positiveCount);
  const negativeWeight =
    examples.length /
    (2 * negativeCount);

  const weights =
    new Array<number>(
      dimensions,
    ).fill(0);
  let bias = 0;

  for (
    let iteration = 0;
    iteration <
    R3_JOINT_HEAD_ITERATIONS;
    iteration += 1
  ) {
    const gradient =
      weights.map(
        (weight) =>
          R3_JOINT_HEAD_L2 *
          weight,
      );
    let biasGradient = 0;

    for (const example of examples) {
      const probability =
        sigmoid(
          dot(
            weights,
            example.features,
          ) + bias,
        );
      const target =
        example.label ? 1 : 0;
      const classWeight =
        example.label
          ? positiveWeight
          : negativeWeight;
      const error =
        classWeight *
        (probability - target) /
        examples.length;

      for (
        let index = 0;
        index < dimensions;
        index += 1
      ) {
        gradient[index]! +=
          error *
          example.features[index]!;
      }
      biasGradient += error;
    }

    const learningRate =
      R3_JOINT_HEAD_BASE_LEARNING_RATE /
      Math.sqrt(
        1 + iteration / 100,
      );

    for (
      let index = 0;
      index < dimensions;
      index += 1
    ) {
      weights[index]! -=
        learningRate *
        gradient[index]!;
    }
    bias -=
      learningRate *
      biasGradient;
  }

  return {
    weights: [...weights],
    bias,
    featureDimensions:
      dimensions,
    trainingCount:
      examples.length,
    positiveCount,
    negativeCount,
  };
}

export function predictR3JointLinearHead(
  head: R3JointLinearHead,
  example:
    R3JointHeadTrainingExample,
): R3JointHeadPrediction {
  if (
    example.features.length !==
    head.featureDimensions
  ) {
    throw new Error(
      "joint linear head prediction dimension mismatch",
    );
  }

  const probability =
    sigmoid(
      dot(
        head.weights,
        example.features,
      ) + head.bias,
    );

  return {
    id: example.id,
    probability,
    predicted:
      probability >=
      R3_JOINT_HEAD_THRESHOLD,
    label: example.label,
  };
}

export function evaluateR3JointPredictions(
  predictions:
    readonly R3JointHeadPrediction[],
): R3JointHeadMetrics {
  if (predictions.length === 0) {
    throw new Error(
      "joint relation evaluation requires predictions",
    );
  }

  let truePositive = 0;
  let trueNegative = 0;
  let falsePositive = 0;
  let falseNegative = 0;

  for (
    const prediction of
      predictions
  ) {
    if (
      prediction.predicted &&
      prediction.label
    ) {
      truePositive += 1;
    } else if (
      prediction.predicted &&
      !prediction.label
    ) {
      falsePositive += 1;
    } else if (
      !prediction.predicted &&
      prediction.label
    ) {
      falseNegative += 1;
    } else {
      trueNegative += 1;
    }
  }

  const positives =
    truePositive +
    falseNegative;
  const negatives =
    trueNegative +
    falsePositive;
  const truePositiveRate =
    positives > 0
      ? truePositive /
        positives
      : 0;
  const trueNegativeRate =
    negatives > 0
      ? trueNegative /
        negatives
      : 0;

  return {
    count: predictions.length,
    positives,
    negatives,
    truePositive,
    trueNegative,
    falsePositive,
    falseNegative,
    accuracy:
      (
        truePositive +
        trueNegative
      ) /
      predictions.length,
    balancedAccuracy:
      (
        truePositiveRate +
        trueNegativeRate
      ) /
      2,
    truePositiveRate,
    trueNegativeRate,
  };
}

function sigmoid(
  value: number,
): number {
  const clamped =
    Math.max(
      -40,
      Math.min(40, value),
    );
  return (
    1 /
    (1 + Math.exp(-clamped))
  );
}

function dot(
  left: readonly number[],
  right: readonly number[],
): number {
  if (
    left.length !==
    right.length
  ) {
    throw new Error(
      "joint linear head dot dimension mismatch",
    );
  }

  let total = 0;
  for (
    let index = 0;
    index < left.length;
    index += 1
  ) {
    total +=
      left[index]! *
      right[index]!;
  }
  return total;
}
