import type {
  ActionDistribution,
  ActorPrivateState,
  ReflexAction,
} from "./contracts";

export const LOCAL_QWEN_MODEL_ID = "onnx-community/Qwen3-0.6B-ONNX";
export const LOCAL_QWEN_REVISION = "b1ece21c06dfce3839272e86b7fa12a985d97a7a";
export const LOCAL_QWEN_DTYPE = "q4f16";

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

export interface LocalChoiceProbeResult {
  modelId: string;
  modelRevision: string;
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
export function buildImmediateResponsePrompt(state: ActorPrivateState): string {
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

  const options = IMMEDIATE_RESPONSE_OPTIONS.map(
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
    ...options,
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
): ChoiceScoreAnalysis {
  if (selectedTokenIds.length !== IMMEDIATE_RESPONSE_OPTIONS.length) {
    throw new Error(
      "expected " +
        IMMEDIATE_RESPONSE_OPTIONS.length +
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
      IMMEDIATE_RESPONSE_OPTIONS.map((option, index) => [
        option.id,
        selectedWeights[index]! / selectedWeight,
      ]),
    ) as ActionDistribution,
    choiceMass: selectedWeight / vocabularyWeight,
    bestAllowedRank,
    topTokenId,
  };
}
