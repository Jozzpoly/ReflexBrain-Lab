import type { AppraisalId } from "../local-choice-probe";
import type {
  R1LearnConstraintInput,
  R1LearnedConstraintResult,
  R1LearnedDimensionSummary,
} from "./encoder-contract";

const DIMENSIONS: readonly AppraisalId[] = [
  "attention",
  "interrupt",
  "social",
  "threat",
  "cognition",
];

export interface R1PairedReason {
  constraintId: string;
  higherStateId: string;
  lowerStateId: string;
}

export interface R1PairedReasonHeads {
  reasons: Readonly<Record<AppraisalId, readonly R1PairedReason[]>>;
  trainingCounts: Readonly<Record<AppraisalId, number>>;
}

/**
 * TRAIN-only local reason experts.
 *
 * Pair identity is preserved: higher/lower anchors from different authored
 * relations are never mixed into one contrast.
 */
export function learnPairedReasonHeads(
  embeddings: ReadonlyMap<string, readonly number[]>,
  constraints: readonly R1LearnConstraintInput[],
): R1PairedReasonHeads {
  const reasons = emptyReasons();
  const counts = emptyCounts();

  for (const constraint of constraints) {
    if (constraint.split !== "train" || constraint.relation !== "greater") {
      continue;
    }

    const higher = requiredEmbedding(embeddings, constraint.leftStateId);
    const lower = requiredEmbedding(embeddings, constraint.rightStateId);
    const gapSquared = squaredDistance(higher, lower);
    if (gapSquared <= 1e-12) {
      throw new Error(
        "paired reason TRAIN relation has indistinguishable anchors: " +
          constraint.id,
      );
    }

    reasons[constraint.dimension].push({
      constraintId: constraint.id,
      higherStateId: constraint.leftStateId,
      lowerStateId: constraint.rightStateId,
    });
    counts[constraint.dimension] += 1;
  }

  for (const dimension of DIMENSIONS) {
    if (reasons[dimension].length === 0) {
      throw new Error(
        "paired reason head has no TRAIN directional supervision for " +
          dimension,
      );
    }
  }

  return {
    reasons: {
      attention: reasons.attention.map((value) => ({ ...value })),
      interrupt: reasons.interrupt.map((value) => ({ ...value })),
      social: reasons.social.map((value) => ({ ...value })),
      threat: reasons.threat.map((value) => ({ ...value })),
      cognition: reasons.cognition.map((value) => ({ ...value })),
    },
    trainingCounts: { ...counts },
  };
}

/**
 * Pick the locally nearest authored TRAIN pair, normalized by that pair's gap,
 * then score only inside that pair's own higher/lower contrast.
 *
 * locality = ||x - midpoint||^2 / ||higher - lower||^2
 * contrast = (||x-lower||^2 - ||x-higher||^2) / ||higher-lower||^2
 *
 * A pair's own higher anchor scores +1 and lower anchor -1.
 */
export function evaluatePairedReasonHeads(
  heads: R1PairedReasonHeads,
  embeddings: ReadonlyMap<string, readonly number[]>,
  constraints: readonly R1LearnConstraintInput[],
  equalityTolerance = 1e-6,
): {
  constraints: readonly R1LearnedConstraintResult[];
  dimensions: readonly R1LearnedDimensionSummary[];
} {
  const scoreCache = new Map<string, number>();

  const stateScore = (dimension: AppraisalId, stateId: string): number => {
    const key = dimension + "\n" + stateId;
    const cached = scoreCache.get(key);
    if (cached !== undefined) return cached;

    const state = requiredEmbedding(embeddings, stateId);
    let bestLocality = Number.POSITIVE_INFINITY;
    let bestScore = 0;

    for (const reason of heads.reasons[dimension]) {
      const higher = requiredEmbedding(embeddings, reason.higherStateId);
      const lower = requiredEmbedding(embeddings, reason.lowerStateId);
      const gapSquared = squaredDistance(higher, lower);
      if (gapSquared <= 1e-12) {
        throw new Error("paired reason gap collapsed: " + reason.constraintId);
      }

      const midpoint = midpointVector(higher, lower);
      const locality = squaredDistance(state, midpoint) / gapSquared;
      const contrast =
        (squaredDistance(state, lower) -
          squaredDistance(state, higher)) /
        gapSquared;

      if (locality < bestLocality) {
        bestLocality = locality;
        bestScore = contrast;
      }
    }

    if (!Number.isFinite(bestLocality) || !Number.isFinite(bestScore)) {
      throw new Error("paired reason head failed to resolve local expert");
    }

    scoreCache.set(key, bestScore);
    return bestScore;
  };

  const results = constraints.map((constraint) => {
    const left = stateScore(constraint.dimension, constraint.leftStateId);
    const right = stateScore(constraint.dimension, constraint.rightStateId);
    const margin = left - right;
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

  const dimensions = DIMENSIONS.map((dimension) => {
    const rows = results.filter((row) => row.dimension === dimension);
    const splits = (["train", "dev", "test", "ood"] as const).map((split) => {
      const splitRows = rows.filter((row) => row.split === split);
      return {
        split,
        passed: splitRows.filter((row) => row.passed).length,
        total: splitRows.length,
      };
    });

    return {
      dimension,
      trainingRelations: heads.trainingCounts[dimension],
      splits,
    };
  });

  return { constraints: results, dimensions };
}

function midpointVector(
  left: readonly number[],
  right: readonly number[],
): number[] {
  if (left.length !== right.length || left.length === 0) {
    throw new Error("paired reason midpoint vectors must match");
  }
  return left.map((value, index) => (value + right[index]!) * 0.5);
}

function emptyReasons(): Record<AppraisalId, R1PairedReason[]> {
  return {
    attention: [],
    interrupt: [],
    social: [],
    threat: [],
    cognition: [],
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

function requiredEmbedding(
  embeddings: ReadonlyMap<string, readonly number[]>,
  id: string,
): readonly number[] {
  const value = embeddings.get(id);
  if (!value) throw new Error("missing paired-reason embedding " + id);
  return value;
}

function squaredDistance(
  left: readonly number[],
  right: readonly number[],
): number {
  if (left.length !== right.length || left.length === 0) {
    throw new Error("paired-reason vectors must have equal non-zero length");
  }

  let total = 0;
  for (let index = 0; index < left.length; index += 1) {
    const delta = left[index]! - right[index]!;
    total += delta * delta;
  }
  return total;
}
