import type { AppraisalId } from "../local-choice-probe";
import type {
  R1LearnConstraintInput,
  R1LearnedConstraintResult,
  R1LearnedDimensionSummary,
} from "./encoder-contract";

const ALL_DIMENSIONS: readonly AppraisalId[] = [
  "attention",
  "interrupt",
  "social",
  "threat",
  "cognition",
];

export interface LearnedPrototypeHeads {
  weights: Readonly<Record<AppraisalId, readonly number[]>>;
  trainingCounts: Readonly<Record<AppraisalId, number>>;
}

export function learnPrototypeHeads(
  embeddings: ReadonlyMap<string, readonly number[]>,
  constraints: readonly R1LearnConstraintInput[],
): LearnedPrototypeHeads {
  const dimensions = firstEmbeddingDimension(embeddings);
  const weights = emptyWeights(dimensions);
  const counts = emptyCounts();

  for (const constraint of constraints) {
    if (constraint.split !== "train" || constraint.relation !== "greater") {
      continue;
    }

    const delta = difference(
      requiredEmbedding(embeddings, constraint.leftStateId),
      requiredEmbedding(embeddings, constraint.rightStateId),
    );
    const norm = vectorNorm(delta);
    if (norm <= 1e-12) {
      throw new Error(
        "train directional constraint has indistinguishable embeddings: " +
          constraint.id,
      );
    }

    const target = weights[constraint.dimension];
    for (let i = 0; i < target.length; i += 1) {
      target[i]! += delta[i]! / norm;
    }
    counts[constraint.dimension] += 1;
  }

  for (const dimension of ALL_DIMENSIONS) {
    if (counts[dimension] < 1) {
      throw new Error("no TRAIN directional supervision for " + dimension);
    }
    normalizeInPlace(weights[dimension]);
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

export function evaluatePrototypeHeads(
  heads: LearnedPrototypeHeads,
  embeddings: ReadonlyMap<string, readonly number[]>,
  constraints: readonly R1LearnConstraintInput[],
  equalityTolerance = 1e-6,
): {
  constraints: readonly R1LearnedConstraintResult[];
  dimensions: readonly R1LearnedDimensionSummary[];
} {
  const results = constraints.map((constraint) => {
    const delta = difference(
      requiredEmbedding(embeddings, constraint.leftStateId),
      requiredEmbedding(embeddings, constraint.rightStateId),
    );
    const margin = dot(heads.weights[constraint.dimension], delta);
    const passed =
      constraint.relation === "greater"
        ? margin > 0
        : Math.abs(margin) <= equalityTolerance;

    return {
      ...constraint,
      margin,
      passed,
    };
  });

  const dimensions = ALL_DIMENSIONS.map((dimension) => {
    const byDimension = results.filter(
      (result) => result.dimension === dimension,
    );
    const splitCounts = (["train", "dev", "test"] as const).map((split) => {
      const rows = byDimension.filter((result) => result.split === split);
      return {
        split,
        passed: rows.filter((result) => result.passed).length,
        total: rows.length,
      };
    });

    return {
      dimension,
      trainingRelations: heads.trainingCounts[dimension],
      splits: splitCounts,
    };
  });

  return { constraints: results, dimensions };
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
    throw new Error("learned head requires non-empty embeddings");
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
    throw new Error("head/embedding dimension mismatch");
  }
  let total = 0;
  for (let i = 0; i < left.length; i += 1) {
    total += left[i]! * right[i]!;
  }
  return total;
}

function vectorNorm(value: readonly number[]): number {
  return Math.sqrt(dot(value, value));
}

function normalizeInPlace(value: number[]): void {
  const norm = vectorNorm(value);
  if (norm <= 1e-12) {
    throw new Error("learned head collapsed to zero");
  }
  for (let i = 0; i < value.length; i += 1) {
    value[i]! /= norm;
  }
}
