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

export interface R1PrototypeBankAnchor {
  constraintId: string;
  higherStateId: string;
  lowerStateId: string;
}

export interface R1PrototypeBankHeads {
  anchors: Readonly<Record<AppraisalId, readonly R1PrototypeBankAnchor[]>>;
  trainingCounts: Readonly<Record<AppraisalId, number>>;
}

/**
 * Transparent multimodal appraisal head.
 *
 * Every TRAIN directional relation contributes two state prototypes:
 * - the left state is a higher-appraisal anchor;
 * - the right state is a lower-appraisal anchor.
 *
 * No TRAIN directions are averaged together.
 */
export function learnPrototypeBankHeads(
  embeddings: ReadonlyMap<string, readonly number[]>,
  constraints: readonly R1LearnConstraintInput[],
): R1PrototypeBankHeads {
  const anchors = emptyAnchors();
  const counts = emptyCounts();

  for (const constraint of constraints) {
    if (constraint.split !== "train" || constraint.relation !== "greater") {
      continue;
    }

    requiredEmbedding(embeddings, constraint.leftStateId);
    requiredEmbedding(embeddings, constraint.rightStateId);

    anchors[constraint.dimension].push({
      constraintId: constraint.id,
      higherStateId: constraint.leftStateId,
      lowerStateId: constraint.rightStateId,
    });
    counts[constraint.dimension] += 1;
  }

  for (const dimension of DIMENSIONS) {
    if (anchors[dimension].length === 0) {
      throw new Error(
        "prototype bank has no TRAIN directional supervision for " +
          dimension,
      );
    }
  }

  return {
    anchors: {
      attention: anchors.attention.map((value) => ({ ...value })),
      interrupt: anchors.interrupt.map((value) => ({ ...value })),
      social: anchors.social.map((value) => ({ ...value })),
      threat: anchors.threat.map((value) => ({ ...value })),
      cognition: anchors.cognition.map((value) => ({ ...value })),
    },
    trainingCounts: { ...counts },
  };
}

/**
 * Higher score means the state is closer to at least one higher-appraisal
 * TRAIN prototype than to every lower-appraisal prototype.
 *
 * score = nearest-lower squared distance - nearest-higher squared distance
 *
 * This is deliberately parameter-free. It is an R1 falsifier for multimodal
 * appraisal geometry, not a promoted runtime architecture.
 */
export function evaluatePrototypeBankHeads(
  heads: R1PrototypeBankHeads,
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
    const bank = heads.anchors[dimension];

    let nearestHigher = Number.POSITIVE_INFINITY;
    let nearestLower = Number.POSITIVE_INFINITY;

    for (const anchor of bank) {
      nearestHigher = Math.min(
        nearestHigher,
        squaredDistance(
          state,
          requiredEmbedding(embeddings, anchor.higherStateId),
        ),
      );
      nearestLower = Math.min(
        nearestLower,
        squaredDistance(
          state,
          requiredEmbedding(embeddings, anchor.lowerStateId),
        ),
      );
    }

    if (!Number.isFinite(nearestHigher) || !Number.isFinite(nearestLower)) {
      throw new Error("prototype bank failed to resolve nearest anchor");
    }

    const score = nearestLower - nearestHigher;
    scoreCache.set(key, score);
    return score;
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
    const rows = results.filter((result) => result.dimension === dimension);
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

function emptyAnchors(): Record<AppraisalId, R1PrototypeBankAnchor[]> {
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
  if (!value) throw new Error("missing prototype-bank embedding " + id);
  return value;
}

function squaredDistance(
  left: readonly number[],
  right: readonly number[],
): number {
  if (left.length !== right.length || left.length === 0) {
    throw new Error("prototype-bank vectors must have equal non-zero length");
  }

  let total = 0;
  for (let index = 0; index < left.length; index += 1) {
    const delta = left[index]! - right[index]!;
    total += delta * delta;
  }
  return total;
}
