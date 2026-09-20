import type { AppraisalId } from "../local-choice-probe";
import type {
  R1LearnConstraintInput,
  R1RelationGeometry,
  R1TrainAlignment,
} from "./encoder-contract";

const DIMENSIONS: readonly AppraisalId[] = [
  "attention",
  "interrupt",
  "social",
  "threat",
  "cognition",
];

/**
 * Diagnose whether held-out pairwise directions occupy geometry already
 * represented by TRAIN pairwise deltas.
 *
 * This is evaluation-only. It does not update any head or representation.
 */
export function analyzeRelationGeometry(
  representations: ReadonlyMap<string, readonly number[]>,
  constraints: readonly R1LearnConstraintInput[],
): readonly R1RelationGeometry[] {
  const trainByDimension = new Map<
    AppraisalId,
    Array<{ constraint: R1LearnConstraintInput; delta: number[] }>
  >();

  for (const dimension of DIMENSIONS) {
    const train = constraints
      .filter(
        (constraint) =>
          constraint.split === "train" &&
          constraint.relation === "greater" &&
          constraint.dimension === dimension,
      )
      .map((constraint) => ({
        constraint,
        delta: normalizedDelta(representations, constraint),
      }));

    if (train.length === 0) {
      throw new Error("relation geometry has no TRAIN direction for " + dimension);
    }
    trainByDimension.set(dimension, train);
  }

  return constraints
    .filter(
      (constraint) =>
        constraint.split !== "train" &&
        constraint.relation === "greater",
    )
    .map((constraint) => {
      const heldOutDelta = normalizedDelta(representations, constraint);
      const train = trainByDimension.get(constraint.dimension)!;

      const trainAlignments: R1TrainAlignment[] = train.map((entry) => ({
        trainConstraintId: entry.constraint.id,
        cosine: dot(heldOutDelta, entry.delta),
      }));

      const nearest = [...trainAlignments].sort(
        (left, right) => right.cosine - left.cosine,
      )[0]!;
      const meanCosine =
        trainAlignments.reduce((sum, entry) => sum + entry.cosine, 0) /
        trainAlignments.length;

      const prototype = new Array<number>(heldOutDelta.length).fill(0);
      for (const entry of train) {
        for (let index = 0; index < prototype.length; index += 1) {
          prototype[index]! += entry.delta[index]!;
        }
      }
      normalizeInPlace(prototype);

      return {
        constraintId: constraint.id,
        familyId: constraint.familyId,
        split: constraint.split,
        dimension: constraint.dimension,
        nearestTrainConstraintId: nearest.trainConstraintId,
        nearestCosine: nearest.cosine,
        meanTrainCosine: meanCosine,
        prototypeCosine: dot(heldOutDelta, prototype),
        trainAlignments,
      };
    });
}

function normalizedDelta(
  representations: ReadonlyMap<string, readonly number[]>,
  constraint: R1LearnConstraintInput,
): number[] {
  const left = requiredRepresentation(
    representations,
    constraint.leftStateId,
  );
  const right = requiredRepresentation(
    representations,
    constraint.rightStateId,
  );
  if (left.length !== right.length) {
    throw new Error("relation geometry representation dimension mismatch");
  }

  const delta = left.map((value, index) => value - right[index]!);
  normalizeInPlace(delta);
  return delta;
}

function requiredRepresentation(
  representations: ReadonlyMap<string, readonly number[]>,
  id: string,
): readonly number[] {
  const value = representations.get(id);
  if (!value) throw new Error("missing relation geometry representation " + id);
  return value;
}

function normalizeInPlace(value: number[]): void {
  const norm = Math.sqrt(dot(value, value));
  if (norm <= 1e-12) {
    throw new Error("relation geometry delta collapsed to zero");
  }
  for (let index = 0; index < value.length; index += 1) {
    value[index]! /= norm;
  }
}

function dot(left: readonly number[], right: readonly number[]): number {
  if (left.length !== right.length) {
    throw new Error("relation geometry vector dimension mismatch");
  }
  let total = 0;
  for (let index = 0; index < left.length; index += 1) {
    total += left[index]! * right[index]!;
  }
  return total;
}
