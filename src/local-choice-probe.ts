import type {
  ActionDistribution,
  ActorPrivateState,
  ReflexAction,
} from "./contracts";

export const LOCAL_QWEN_MODEL_ID = "onnx-community/Qwen3-0.6B-ONNX";
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
  distribution: ActionDistribution;
  latencyMs: number;
  inputTokenCount: number;
  optionTokenSurfaces: readonly string[];
}

/**
 * Deliberately compact: this must represent only actor-private state, not World
 * debug truth. R0 keeps this explicit so we can audit whether the compiler
 * quietly becomes the real policy.
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
    "Prefer preserving the actor's own ongoing life unless the perceived situation gives a reason to redirect it.",
    "/no_think",
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

export function distributionFromSelectedLogits(
  logits: readonly number[],
): ActionDistribution {
  if (logits.length !== IMMEDIATE_RESPONSE_OPTIONS.length) {
    throw new Error(
      "expected " +
        IMMEDIATE_RESPONSE_OPTIONS.length +
        " selected logits, got " +
        logits.length,
    );
  }

  const maximum = Math.max(...logits);
  const weights = logits.map((value) => Math.exp(value - maximum));
  const total = weights.reduce((sum, value) => sum + value, 0);
  if (!Number.isFinite(total) || total <= 0) {
    throw new Error("invalid selected-logit normalization");
  }

  return Object.fromEntries(
    IMMEDIATE_RESPONSE_OPTIONS.map((option, index) => [
      option.id,
      weights[index]! / total,
    ]),
  ) as ActionDistribution;
}
