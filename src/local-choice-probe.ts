import type {
  ActionDistribution,
  ActorPrivateState,
  ReflexAction,
} from "./contracts";

export const LOCAL_QWEN_MODEL_ID = "onnx-community/Qwen3-0.6B-ONNX";
export const LOCAL_QWEN_REVISION = "b1ece21c06dfce3839272e86b7fa12a985d97a7a";
export type LocalQwenDtype = "q4f16" | "q8";
export const LOCAL_QWEN_F16_DTYPE: LocalQwenDtype = "q4f16";
export const LOCAL_QWEN_NO_F16_DTYPE: LocalQwenDtype = "q8";

export function chooseLocalQwenDtype(shaderF16: boolean): LocalQwenDtype {
  return shaderF16 ? LOCAL_QWEN_F16_DTYPE : LOCAL_QWEN_NO_F16_DTYPE;
}

export interface ChoiceOption {
  id: ReflexAction;
  label: string;
}

export const IMMEDIATE_RESPONSE_OPTIONS: readonly ChoiceOption[] = [
  { id: "continue", label: "continue the current task" },
  { id: "orient", label: "orient attention toward the player" },
  { id: "acknowledge", label: "briefly acknowledge the player" },
  { id: "investigate", label: "pause to investigate what is happening" },
  { id: "withdraw", label: "create distance from the player" },
];

export type ChoiceOrder = "canonical" | "reverse";

export function getImmediateResponseOptions(
  order: ChoiceOrder,
): readonly ChoiceOption[] {
  return order === "reverse"
    ? [...IMMEDIATE_RESPONSE_OPTIONS].reverse()
    : IMMEDIATE_RESPONSE_OPTIONS;
}

export interface LocalChoiceProbeResult {
  modelId: string;
  modelRevision: string;
  dtype: LocalQwenDtype;
  shaderF16: boolean;
  logitsShape: readonly number[];
  choiceOrder: ChoiceOrder;
  optionOrder: readonly ReflexAction[];
  distribution: ActionDistribution;
  choiceMass: number;
  bestAllowedRank: number;
  topTokenId: number;
  topTokenText: string;
  latencyMs: number;
  inputTokenCount: number;
  optionTokenSurfaces: readonly string[];
}

/**
 * Deliberately compact and neutral. This serializes only actor-private state.
 * R0 must not quietly embed the desired policy in prompt prose.
 */
export function buildImmediateResponsePrompt(
  state: ActorPrivateState,
  options: readonly ChoiceOption[] = IMMEDIATE_RESPONSE_OPTIONS,
): string {
  const perceptLines =
    state.percepts.length === 0
      ? ["- none"]
      : state.percepts.map((percept) => {
          if (percept.kind === "speech") {
            return [
              "- speech",
              "source=" + percept.sourceActorId,
              "addressed=" + String(percept.addressed),
              "text=" + JSON.stringify(percept.text),
            ].join(" ");
          }

          return [
            "- visible_actor",
            "actor=" + percept.actorId,
            "distance=" + percept.distanceBand,
            "approach_speed=" + percept.approachSpeed.toFixed(2),
            "bearing_rad=" + percept.relativeBearingRadians.toFixed(3),
          ].join(" ");
        });

  const optionLines = options.map(
    (option, index) =>
      String.fromCharCode(65 + index) + ". " + option.label,
  );

  return [
    "You are a fast semantic reflex evaluator for an embodied game actor.",
    "Use only the private state below. Do not invent hidden facts.",
    "",
    "PRIVATE STATE",
    "tick=" + state.tick,
    "current_task=" + state.self.currentTask,
    "task_progress=" + state.self.taskProgress.toFixed(3),
    "task_urgency=" + state.self.taskUrgency.toFixed(3),
    "recent_focus=" + state.recentFocus,
    "percepts:",
    ...perceptLines,
    "",
    "QUESTION",
    "Which immediate response best fits this exact moment?",
    "",
    "ALLOWED ANSWERS",
    ...optionLines,
    "",
    "Answer with exactly one letter: A, B, C, D, or E.",
  ].join("\n");
}

export interface ChoiceScoreAnalysis {
  distribution: ActionDistribution;
  choiceMass: number;
  bestAllowedRank: number;
  topTokenId: number;
}

export function analyzeChoiceScores(
  scores: ArrayLike<number>,
  selectedTokenIds: readonly number[],
  options: readonly ChoiceOption[] = IMMEDIATE_RESPONSE_OPTIONS,
): ChoiceScoreAnalysis {
  if (selectedTokenIds.length !== options.length) {
    throw new Error(
      "expected " +
        options.length +
        " selected token ids, got " +
        selectedTokenIds.length,
    );
  }

  if (new Set(selectedTokenIds).size !== selectedTokenIds.length) {
    throw new Error("allowed response labels must map to distinct tokens");
  }

  let maximum = -Infinity;
  let topTokenId = -1;

  for (let index = 0; index < scores.length; index += 1) {
    const value = Number(scores[index]);
    if (Number.isNaN(value) || value === Infinity) {
      throw new Error("prediction scores contain invalid values");
    }
    if (value > maximum) {
      maximum = value;
      topTokenId = index;
    }
  }

  if (!Number.isFinite(maximum) || topTokenId < 0) {
    throw new Error("prediction scores contain no finite token");
  }

  let vocabularyWeight = 0;
  for (let index = 0; index < scores.length; index += 1) {
    const value = Number(scores[index]);
    if (value !== -Infinity) vocabularyWeight += Math.exp(value - maximum);
  }

  const selectedScores = selectedTokenIds.map((tokenId) => {
    if (!Number.isInteger(tokenId) || tokenId < 0 || tokenId >= scores.length) {
      throw new Error("allowed response token id is outside the vocabulary");
    }
    return Number(scores[tokenId]);
  });

  const selectedWeights = selectedScores.map((value) =>
    value === -Infinity ? 0 : Math.exp(value - maximum),
  );
  const selectedWeight = selectedWeights.reduce((sum, value) => sum + value, 0);

  if (!Number.isFinite(vocabularyWeight) || vocabularyWeight <= 0) {
    throw new Error("invalid vocabulary score normalization");
  }
  if (!Number.isFinite(selectedWeight) || selectedWeight <= 0) {
    throw new Error("allowed responses have zero prediction mass");
  }

  const bestAllowedScore = Math.max(...selectedScores);
  let bestAllowedRank = 1;
  for (let index = 0; index < scores.length; index += 1) {
    if (Number(scores[index]) > bestAllowedScore) bestAllowedRank += 1;
  }

  return {
    distribution: Object.fromEntries(
      options.map((option, index) => [
        option.id,
        selectedWeights[index]! / selectedWeight,
      ]),
    ) as ActionDistribution,
    choiceMass: selectedWeight / vocabularyWeight,
    bestAllowedRank,
    topTokenId,
  };
}
