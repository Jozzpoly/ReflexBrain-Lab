import type { ActorPrivateState } from "../contracts";
import type { AppraisalId } from "../local-choice-probe";
import {
  createR1CounterfactualSuite,
  type R1CounterfactualSuite,
  type R1Split,
} from "./counterfactual-supervision";

const DIMENSIONS: readonly AppraisalId[] = [
  "attention",
  "interrupt",
  "social",
  "threat",
  "cognition",
];

export interface SurfaceBaselineModel {
  vocabulary: readonly string[];
  weights: Readonly<Record<AppraisalId, readonly number[]>>;
}

export interface SurfaceBaselineSplitReport {
  split: R1Split;
  passed: number;
  total: number;
  directionalPassed: number;
  directionalTotal: number;
  equalPassed: number;
  equalTotal: number;
  warningSemanticPassed: number;
  warningSemanticTotal: number;
}

/**
 * Deliberately weak negative control.
 *
 * The model can learn:
 * - structured observable features;
 * - exact lexical surface tokens seen in TRAIN.
 *
 * It has no embedding model, no pretrained semantics and no access to state IDs.
 * Dev/test paraphrases therefore test whether the R1 split catches surface
 * memorization masquerading as semantic generalization.
 */
export function trainSurfaceMemorizer(
  suite: R1CounterfactualSuite = createR1CounterfactualSuite(),
): SurfaceBaselineModel {
  const trainStates = suite.states.filter((state) => state.split === "train");
  const vocabulary = [...new Set(
    trainStates.flatMap((record) => speechTokens(record.state)),
  )].sort();
  const featureCount = structuredFeatures(trainStates[0]!.state).length + vocabulary.length;

  const mutableWeights = Object.fromEntries(
    DIMENSIONS.map((dimension) => [
      dimension,
      new Array<number>(featureCount).fill(0),
    ]),
  ) as Record<AppraisalId, number[]>;

  const byId = new Map(suite.states.map((record) => [record.id, record] as const));
  const trainConstraints = suite.constraints.filter(
    (constraint) => constraint.split === "train",
  );

  for (let epoch = 0; epoch < 80; epoch += 1) {
    for (const constraint of trainConstraints) {
      if (constraint.relation !== "greater") continue;
      const left = requiredState(byId, constraint.leftStateId);
      const right = requiredState(byId, constraint.rightStateId);
      const delta = subtract(
        featureVector(left.state, vocabulary),
        featureVector(right.state, vocabulary),
      );
      const weights = mutableWeights[constraint.dimension];
      const margin = dot(weights, delta);

      if (margin <= 1) {
        const learningRate = 0.25;
        for (let i = 0; i < weights.length; i += 1) {
          weights[i]! += learningRate * delta[i]!;
        }
      }
    }
  }

  return {
    vocabulary,
    weights: Object.fromEntries(
      DIMENSIONS.map((dimension) => [
        dimension,
        [...mutableWeights[dimension]],
      ]),
    ) as Record<AppraisalId, readonly number[]>,
  };
}

export function evaluateSurfaceMemorizer(
  model: SurfaceBaselineModel,
  suite: R1CounterfactualSuite = createR1CounterfactualSuite(),
): readonly SurfaceBaselineSplitReport[] {
  const byId = new Map(suite.states.map((record) => [record.id, record] as const));

  return (["train", "dev", "test"] as const).map((split) => {
    const constraints = suite.constraints.filter(
      (constraint) => constraint.split === split,
    );
    let passed = 0;
    let directionalPassed = 0;
    let directionalTotal = 0;
    let equalPassed = 0;
    let equalTotal = 0;
    let warningSemanticPassed = 0;
    let warningSemanticTotal = 0;

    for (const constraint of constraints) {
      const left = requiredState(byId, constraint.leftStateId);
      const right = requiredState(byId, constraint.rightStateId);
      const leftScore = score(model, constraint.dimension, left.state);
      const rightScore = score(model, constraint.dimension, right.state);
      const margin = leftScore - rightScore;

      const isWarningSemantic =
        constraint.familyId === split + ":warning-semantics";
      if (isWarningSemantic) warningSemanticTotal += 1;

      let success: boolean;
      if (constraint.relation === "equal") {
        equalTotal += 1;
        success = Math.abs(margin) <= 1e-9;
        if (success) equalPassed += 1;
      } else {
        directionalTotal += 1;
        success = margin > 1e-9;
        if (success) directionalPassed += 1;
      }

      if (success) {
        passed += 1;
        if (isWarningSemantic) warningSemanticPassed += 1;
      }
    }

    return {
      split,
      passed,
      total: constraints.length,
      directionalPassed,
      directionalTotal,
      equalPassed,
      equalTotal,
      warningSemanticPassed,
      warningSemanticTotal,
    };
  });
}

export function score(
  model: SurfaceBaselineModel,
  dimension: AppraisalId,
  state: ActorPrivateState,
): number {
  return dot(model.weights[dimension], featureVector(state, model.vocabulary));
}

function featureVector(
  state: ActorPrivateState,
  vocabulary: readonly string[],
): number[] {
  const structured = structuredFeatures(state);
  const present = new Set(speechTokens(state));
  return [
    ...structured,
    ...vocabulary.map((token) => (present.has(token) ? 1 : 0)),
  ];
}

function structuredFeatures(state: ActorPrivateState): number[] {
  const visible = state.percepts.find(
    (percept) => percept.kind === "visible_actor",
  );
  const speech = state.percepts.find((percept) => percept.kind === "speech");

  const distance =
    visible?.kind === "visible_actor" ? visible.distanceBand : null;

  return [
    1,
    state.self.taskProgress,
    state.self.taskUrgency,
    state.recentFocus === "player" ? 1 : 0,
    visible?.kind === "visible_actor" ? 1 : 0,
    distance === "near" ? 1 : 0,
    distance === "mid" ? 1 : 0,
    distance === "far" ? 1 : 0,
    visible?.kind === "visible_actor" ? visible.approachSpeed / 250 : 0,
    speech?.kind === "speech" ? 1 : 0,
    speech?.kind === "speech" && speech.addressed ? 1 : 0,
  ];
}

function speechTokens(state: ActorPrivateState): string[] {
  const text = state.percepts
    .filter((percept) => percept.kind === "speech")
    .map((percept) => percept.text)
    .join(" ")
    .toLowerCase();

  return text.match(/[a-z]+/g) ?? [];
}

function requiredState(
  byId: ReadonlyMap<
    string,
    R1CounterfactualSuite["states"][number]
  >,
  id: string,
): R1CounterfactualSuite["states"][number] {
  const state = byId.get(id);
  if (!state) throw new Error("missing R1 baseline state " + id);
  return state;
}

function subtract(left: readonly number[], right: readonly number[]): number[] {
  if (left.length !== right.length) throw new Error("feature length mismatch");
  return left.map((value, index) => value - right[index]!);
}

function dot(left: readonly number[], right: readonly number[]): number {
  if (left.length !== right.length) throw new Error("dot length mismatch");
  let total = 0;
  for (let i = 0; i < left.length; i += 1) {
    total += left[i]! * right[i]!;
  }
  return total;
}
