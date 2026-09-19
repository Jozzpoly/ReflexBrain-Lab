import type {
  ActionDistribution,
  ActorPrivateState,
  ReflexAction,
} from "./contracts";

export type LocalModelBackendId = "qwen3-0.6b" | "smollm2-135m";

export interface LocalModelBackendConfig {
  id: LocalModelBackendId;
  modelId: string;
  modelRevision: string;
}

export const LOCAL_MODEL_BACKENDS: Record<
  LocalModelBackendId,
  LocalModelBackendConfig
> = {
  "qwen3-0.6b": {
    id: "qwen3-0.6b",
    modelId: "onnx-community/Qwen3-0.6B-ONNX",
    modelRevision: "b1ece21c06dfce3839272e86b7fa12a985d97a7a",
  },
  "smollm2-135m": {
    id: "smollm2-135m",
    modelId: "onnx-community/SmolLM2-135M-Instruct-ONNX",
    modelRevision: "b8a5c0f183b78c55955a5364f610c36668b5e681",
  },
};

export const DEFAULT_LOCAL_MODEL_BACKEND: LocalModelBackendId = "qwen3-0.6b";

export function isLocalModelBackendId(
  value: string | null,
): value is LocalModelBackendId {
  return value === "qwen3-0.6b" || value === "smollm2-135m";
}

export function getLocalModelBackend(
  id: LocalModelBackendId,
): LocalModelBackendConfig {
  return LOCAL_MODEL_BACKENDS[id];
}

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

export interface SemanticTokenSpec {
  id: ReflexAction;
  candidates: readonly string[];
}

export interface ResolvedSemanticToken {
  action: ReflexAction;
  keyword: string;
  surface: string;
  tokenId: number;
}

export const SEMANTIC_TOKEN_SPECS: readonly SemanticTokenSpec[] = [
  { id: "continue", candidates: ["work"] },
  { id: "orient", candidates: ["look"] },
  { id: "acknowledge", candidates: ["reply", "answer"] },
  { id: "investigate", candidates: ["inspect", "check"] },
  { id: "withdraw", candidates: ["leave", "retreat"] },
];

export type AppraisalId =
  | "attention"
  | "interrupt"
  | "social"
  | "threat"
  | "cognition";

export type AppraisalPolarity = "positive" | "negative";

export interface AppraisalSpec {
  id: AppraisalId;
  positive: string;
  negative: string;
}

export const APPRAISAL_SPECS: readonly AppraisalSpec[] = [
  {
    id: "attention",
    positive:
      "The player deserves meaningful attention from the actor right now.",
    negative:
      "The player does not deserve meaningful attention from the actor right now.",
  },
  {
    id: "interrupt",
    positive:
      "The actor should interrupt its current task right now.",
    negative:
      "The actor should not interrupt its current task right now.",
  },
  {
    id: "social",
    positive:
      "The perceived situation is socially relevant to the actor right now.",
    negative:
      "The perceived situation is not socially relevant to the actor right now.",
  },
  {
    id: "threat",
    positive:
      "The perceived situation presents immediate danger to the actor right now.",
    negative:
      "The perceived situation does not present immediate danger to the actor right now.",
  },
  {
    id: "cognition",
    positive:
      "The situation warrants deeper deliberate cognition beyond routine local behavior.",
    negative:
      "The situation does not warrant deeper deliberate cognition beyond routine local behavior.",
  },
];

export function getAppraisalSpec(id: AppraisalId): AppraisalSpec {
  const spec = APPRAISAL_SPECS.find((candidate) => candidate.id === id);
  if (!spec) throw new Error("unknown appraisal id: " + id);
  return spec;
}

export interface ResolvedBinaryToken {
  answer: "yes" | "no";
  surface: string;
  tokenId: number;
}

export function probabilityYesFromScores(
  yesScore: number,
  noScore: number,
): number {
  if (!Number.isFinite(yesScore) || !Number.isFinite(noScore)) {
    throw new Error("binary appraisal scores must be finite");
  }
  const maximum = Math.max(yesScore, noScore);
  const yesWeight = Math.exp(yesScore - maximum);
  const noWeight = Math.exp(noScore - maximum);
  return yesWeight / (yesWeight + noWeight);
}

export function semanticActionFromToken(
  selectedTokenId: number,
  tokens: readonly ResolvedSemanticToken[],
): ReflexAction {
  const match = tokens.find((token) => token.tokenId === selectedTokenId);
  if (!match) {
    throw new Error("generated token is outside the semantic action token set");
  }
  return match.action;
}

export type ChoiceOrder =
  | "canonical"
  | "reverse"
  | "rotate1"
  | "rotate2"
  | "rotate3"
  | "rotate4";

export const PERMUTATION_SWEEP_ORDERS: readonly ChoiceOrder[] = [
  "canonical",
  "rotate1",
  "rotate2",
  "rotate3",
  "rotate4",
];

export function getImmediateResponseOptions(
  order: ChoiceOrder,
): readonly ChoiceOption[] {
  if (order === "canonical") return IMMEDIATE_RESPONSE_OPTIONS;
  if (order === "reverse") return [...IMMEDIATE_RESPONSE_OPTIONS].reverse();

  const offset = Number(order.slice("rotate".length));
  if (!Number.isInteger(offset) || offset < 1 || offset >= IMMEDIATE_RESPONSE_OPTIONS.length) {
    throw new Error("invalid choice order: " + order);
  }

  return [
    ...IMMEDIATE_RESPONSE_OPTIONS.slice(offset),
    ...IMMEDIATE_RESPONSE_OPTIONS.slice(0, offset),
  ];
}

export interface LocalChoiceOnlyResult {
  backendId: LocalModelBackendId;
  modelId: string;
  modelRevision: string;
  dtype: LocalQwenDtype;
  shaderF16: boolean;
  choiceOrder: ChoiceOrder;
  optionOrder: readonly ReflexAction[];
  selectedAction: ReflexAction;
  selectedTokenId: number;
  selectedTokenText: string;
  latencyMs: number;
  inputTokenCount: number;
  optionTokenSurfaces: readonly string[];
}

export interface LocalAppraisalResult {
  backendId: LocalModelBackendId;
  modelId: string;
  modelRevision: string;
  dtype: LocalQwenDtype;
  shaderF16: boolean;
  appraisalId: AppraisalId;
  polarity: AppraisalPolarity;
  proposition: string;
  selectedAnswer: "yes" | "no";
  probabilityYes: number;
  positiveProbability: number;
  yesScore: number;
  noScore: number;
  latencyMs: number;
  inputTokenCount: number;
  binaryTokens: readonly ResolvedBinaryToken[];
}

export interface LocalSemanticChoiceResult {
  backendId: LocalModelBackendId;
  modelId: string;
  modelRevision: string;
  dtype: LocalQwenDtype;
  shaderF16: boolean;
  choiceOrder: ChoiceOrder;
  optionOrder: readonly ReflexAction[];
  selectedAction: ReflexAction;
  selectedKeyword: string;
  selectedTokenId: number;
  selectedTokenText: string;
  latencyMs: number;
  inputTokenCount: number;
  semanticTokens: readonly ResolvedSemanticToken[];
}

export interface LocalChoiceProbeResult {
  backendId: LocalModelBackendId;
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
  const optionLines = options.map(
    (option, index) =>
      String.fromCharCode(65 + index) + ". " + option.label,
  );

  return [
    "You are a fast semantic reflex evaluator for an embodied game actor.",
    "Use only the private state below. Do not invent hidden facts.",
    "",
    ...privateStateLines(state),
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

export function buildAppraisalPrompt(
  state: ActorPrivateState,
  spec: AppraisalSpec,
  polarity: AppraisalPolarity,
): string {
  const proposition =
    polarity === "positive" ? spec.positive : spec.negative;

  return [
    "You are a fast semantic appraisal evaluator for an embodied game actor.",
    "Use only the private state below. Do not invent hidden facts.",
    "",
    ...privateStateLines(state),
    "",
    "PROPOSITION",
    proposition,
    "",
    "Is this proposition true?",
    "Answer exactly yes or no.",
  ].join("\n");
}

export function buildSemanticResponsePrompt(
  state: ActorPrivateState,
  tokens: readonly ResolvedSemanticToken[],
  options: readonly ChoiceOption[] = IMMEDIATE_RESPONSE_OPTIONS,
): string {
  const tokenByAction = new Map(
    tokens.map((token) => [token.action, token] as const),
  );
  const optionLines = options.map((option) => {
    const token = tokenByAction.get(option.id);
    if (!token) {
      throw new Error("missing semantic token for action " + option.id);
    }
    return token.keyword + " — " + option.label;
  });

  return [
    "You are a fast semantic reflex evaluator for an embodied game actor.",
    "Use only the private state below. Do not invent hidden facts.",
    "",
    ...privateStateLines(state),
    "",
    "QUESTION",
    "Which immediate response best fits this exact moment?",
    "",
    "ALLOWED ACTION KEYWORDS",
    ...optionLines,
    "",
    "Answer with exactly one action keyword.",
  ].join("\n");
}

function privateStateLines(state: ActorPrivateState): string[] {
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

  return [
    "PRIVATE STATE",
    "tick=" + state.tick,
    "current_task=" + state.self.currentTask,
    "task_progress=" + state.self.taskProgress.toFixed(3),
    "task_urgency=" + state.self.taskUrgency.toFixed(3),
    "recent_focus=" + state.recentFocus,
    "percepts:",
    ...perceptLines,
  ];
}

export function actionFromChoiceToken(
  selectedTokenId: number,
  labelTokenIds: readonly number[],
  options: readonly ChoiceOption[] = IMMEDIATE_RESPONSE_OPTIONS,
): ReflexAction {
  if (labelTokenIds.length !== options.length) {
    throw new Error("choice token map length does not match semantic option count");
  }
  const index = labelTokenIds.indexOf(selectedTokenId);
  if (index < 0) {
    throw new Error("generated token is outside the allowed choice labels");
  }
  return options[index]!.id;
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
