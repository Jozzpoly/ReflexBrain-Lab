import type { ActorPrivateState } from "../contracts";
import type { AppraisalId } from "../local-choice-probe";
import type { R1Relation, R1Split } from "./counterfactual-supervision";

export const R1_ENCODER_MODEL_ID = "Xenova/paraphrase-MiniLM-L3-v2";
export const R1_ENCODER_MODEL_REVISION =
  "4b544e74dfc3256b2b56849ea5d7064fee1ac846";
export const R1_ENCODER_DTYPE = "q8" as const;

export interface R1EncoderStateInput {
  id: string;
  state: ActorPrivateState;
}

export interface R1EncoderPairInput {
  id: string;
  leftStateId: string;
  rightStateId: string;
}

export interface R1EncoderStateTiming {
  id: string;
  latencyMs: number;
}

export interface R1EncoderPairResult extends R1EncoderPairInput {
  cosineSimilarity: number;
  cosineDistance: number;
}

export interface R1LearnConstraintInput {
  id: string;
  familyId: string;
  split: R1Split;
  dimension: AppraisalId;
  relation: R1Relation;
  leftStateId: string;
  rightStateId: string;
}

export interface R1LearnedConstraintResult extends R1LearnConstraintInput {
  margin: number;
  passed: boolean;
}

export interface R1LearnedSplitCount {
  split: R1Split;
  passed: number;
  total: number;
}

export interface R1LearnedDimensionSummary {
  dimension: AppraisalId;
  trainingRelations: number;
  splits: readonly R1LearnedSplitCount[];
}

export type R1RepresentationMode = "encoder-only" | "hybrid";
export type R1HeadMode = "prototype" | "linear-ranking";

export interface R1LearnedHeadResult {
  modelId: string;
  modelRevision: string;
  dtype: typeof R1_ENCODER_DTYPE;
  device: "webgpu";
  representation: R1RepresentationMode;
  headMode: R1HeadMode;
  stateCount: number;
  loadMs: number;
  warmupMs: number;
  embeddingMs: number;
  embeddingBatchSize: number;
  encoderDimensions: number;
  representationDimensions: number;
  headMs: number;
  constraints: readonly R1LearnedConstraintResult[];
  dimensions: readonly R1LearnedDimensionSummary[];
}

export interface R1EncoderBenchmarkResult {
  modelId: string;
  modelRevision: string;
  dtype: typeof R1_ENCODER_DTYPE;
  device: "webgpu";
  loadMs: number;
  warmupMs: number;
  sequential: readonly R1EncoderStateTiming[];
  batchMs: number;
  batchSize: number;
  embeddingDimensions: number;
  pairs: readonly R1EncoderPairResult[];
}

export type R1EncoderWorkerRequest =
  | {
      id: number;
      type: "benchmark";
      states: readonly R1EncoderStateInput[];
      pairs: readonly R1EncoderPairInput[];
    }
  | {
      id: number;
      type: "learned_head";
      states: readonly R1EncoderStateInput[];
      constraints: readonly R1LearnConstraintInput[];
      representation: R1RepresentationMode;
      headMode: R1HeadMode;
    };

export type R1EncoderWorkerResponse =
  | {
      id: number;
      type: "progress";
      status: string;
      file: string | null;
      progress: number | null;
    }
  | {
      id: number;
      type: "benchmark_result";
      result: R1EncoderBenchmarkResult;
    }
  | {
      id: number;
      type: "learned_head_result";
      result: R1LearnedHeadResult;
    }
  | { id: number; type: "error"; message: string };

export function serializeR1PrivateState(state: ActorPrivateState): string {
  const lines = [
    "actor private state",
    "task: sort crates",
    "task progress: " + state.self.taskProgress.toFixed(3),
    "task urgency: " + state.self.taskUrgency.toFixed(3),
    "recent focus: " + state.recentFocus,
  ];

  if (state.percepts.length === 0) {
    lines.push("percepts: none");
    return lines.join("\n");
  }

  for (const percept of state.percepts) {
    if (percept.kind === "visible_actor") {
      lines.push(
        [
          "visible player",
          "distance " + percept.distanceBand,
          "approach speed " + percept.approachSpeed.toFixed(2),
          "bearing " + percept.relativeBearingRadians.toFixed(3),
        ].join("; "),
      );
    } else {
      lines.push(
        [
          "speech from player",
          "addressed " + (percept.addressed ? "yes" : "no"),
          "text " + JSON.stringify(percept.text),
        ].join("; "),
      );
    }
  }

  return lines.join("\n");
}

export function cosineSimilarity(
  left: ArrayLike<number>,
  right: ArrayLike<number>,
): number {
  if (left.length !== right.length || left.length === 0) {
    throw new Error("cosine vectors must have equal non-zero length");
  }

  let dot = 0;
  let leftNorm = 0;
  let rightNorm = 0;
  for (let i = 0; i < left.length; i += 1) {
    const a = Number(left[i]);
    const b = Number(right[i]);
    dot += a * b;
    leftNorm += a * a;
    rightNorm += b * b;
  }

  const denominator = Math.sqrt(leftNorm) * Math.sqrt(rightNorm);
  if (!Number.isFinite(denominator) || denominator <= 0) {
    throw new Error("cosine vector norm is invalid");
  }
  return dot / denominator;
}
