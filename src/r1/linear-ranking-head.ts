import type { AppraisalId } from "../local-choice-probe";
import type { R1LearnConstraintInput } from "./encoder-contract";
import type { LearnedPrototypeHeads } from "./prototype-head";

const DIMENSIONS: readonly AppraisalId[] = [
  "attention",
  "interrupt",
  "social",
  "threat",
  "cognition",
];

export const R1_LINEAR_RANKING_ITERATIONS = 400;
export const R1_LINEAR_RANKING_L2 = 0.1;
export const R1_LINEAR_RANKING_LEARNING_RATE = 0.2;

/**
 * Deterministic pairwise logistic ranker.
 *
 * The encoder/representation is frozen. Only TRAIN directional differences
 * are used. Each difference is normalized first, matching the prototype
 * head's scale treatment, so this A/B changes optimization rather than
 * feature magnitude conventions.
 */
export function learnRegularizedLinearHeads(
  embeddings: ReadonlyMap<string, readonly number[]>,
  constraints: readonly R1LearnConstraintInput[],
): LearnedPrototypeHeads {
  const dimensionCount = firstEmbeddingDimension(embeddings);
  const weights = emptyWeights(dimensionCount);
  const counts = emptyCounts();

  for (const dimension of DIMENSIONS) {
    const deltas = constraints
      .filter(
        (constraint) =>
          constraint.split === "train" &&
          constraint.relation === "greater" &&
          constraint.dimension === dimension,
      )
      .map((constraint) => {
        const delta = difference(
          requiredEmbedding(embeddings, constraint.leftStateId),
          requiredEmbedding(embeddings, constraint.rightStateId),
        );
        const norm = vectorNorm(delta);
        if (norm <= 1e-12) {
          throw new Error(
            "linear ranker TRAIN pair has zero delta: " + constraint.id,
          );
        }
        return delta.map((value) => value / norm);
      });

    counts[dimension] = deltas.length;
    if (deltas.length === 0) {
      throw new Error("no TRAIN directional supervision for " + dimension);
    }

    const target = weights[dimension];

    for (let iteration = 0; iteration < R1_LINEAR_RANKING_ITERATIONS; iteration += 1) {
      const gradient = target.map(
        (value) => R1_LINEAR_RANKING_L2 * value,
      );

      for (const delta of deltas) {
        const margin = dot(target, delta);
        const logisticFactor = 1 / (1 + Math.exp(clamp(margin, -40, 40)));

        for (let index = 0; index < gradient.length; index += 1) {
          gradient[index]! -=
            (logisticFactor * delta[index]!) / deltas.length;
        }
      }

      const learningRate =
        R1_LINEAR_RANKING_LEARNING_RATE /
        Math.sqrt(1 + iteration / 50);

      for (let index = 0; index < target.length; index += 1) {
        target[index]! -= learningRate * gradient[index]!;
      }
    }

    normalizeInPlace(target);
  }

  return {
    weights: {
      attention: [...weights.attention],
      interrupt: [...weights.interrupt],
      social: [...weights.social],
      threat: [...weights.threat],
      cognition: [...weights.cognition],
    },
    trainingCounts: { ...counts },
  };
}

function emptyWeights(
  dimensions: number,
): Record<AppraisalId, number[]> {
  return {
    attention: new Array(dimensions).fill(0),
    interrupt: new Array(dimensions).fill(0),
    social: new Array(dimensions).fill(0),
    threat: new Array(dimensions).fill(0),
    cognition: new Array(dimensions).fill(0),
  };
}

function emptyCounts(): Record<AppraisalId, number> {
  return {
    attention: 0,
    interrupt: 0,
    social: 0,
    threat: 0,
    cognition: 0,
  };
}

function firstEmbeddingDimension(
  embeddings: ReadonlyMap<string, readonly number[]>,
): number {
  const first = embeddings.values().next().value as
    | readonly number[]
    | undefined;
  if (!first || first.length === 0) {
    throw new Error("linear ranking head requires non-empty embeddings");
  }
  return first.length;
}

function requiredEmbedding(
  embeddings: ReadonlyMap<string, readonly number[]>,
  id: string,
): readonly number[] {
  const value = embeddings.get(id);
  if (!value) throw new Error("missing embedding " + id);
  return value;
}

function difference(
  left: readonly number[],
  right: readonly number[],
): number[] {
  if (left.length !== right.length) {
    throw new Error("embedding dimension mismatch");
  }
  return left.map((value, index) => value - right[index]!);
}

function dot(left: readonly number[], right: readonly number[]): number {
  if (left.length !== right.length) {
    throw new Error("linear ranker vector dimension mismatch");
  }
  let total = 0;
  for (let index = 0; index < left.length; index += 1) {
    total += left[index]! * right[index]!;
  }
  return total;
}

function vectorNorm(value: readonly number[]): number {
  return Math.sqrt(dot(value, value));
}

function normalizeInPlace(value: number[]): void {
  const norm = vectorNorm(value);
  if (norm <= 1e-12) {
    throw new Error("linear ranking head collapsed to zero");
  }
  for (let index = 0; index < value.length; index += 1) {
    value[index]! /= norm;
  }
}

function clamp(value: number, minimum: number, maximum: number): number {
  return Math.max(minimum, Math.min(maximum, value));
}
