import type { ActorPrivateState } from "../contracts";

export const R1_STRUCTURED_FEATURE_NAMES = [
  "task_progress",
  "task_urgency",
  "focus_player",
  "visible_player",
  "distance_near",
  "distance_mid",
  "distance_far",
  "approach_speed_norm",
  "bearing_sin",
  "bearing_cos",
  "speech_present",
  "speech_addressed",
] as const;

/**
 * Explicit actor-private channels that should not be forced through a language
 * encoder merely to recover precise numeric/perceptual facts.
 *
 * Values are kept roughly in [-1, 1]. No World/debug-only information enters.
 */
export function structuredPrivateFeatures(
  state: ActorPrivateState,
): number[] {
  const visible = state.percepts.find(
    (percept) => percept.kind === "visible_actor",
  );
  const speech = state.percepts.find(
    (percept) => percept.kind === "speech",
  );

  const hasVisible = visible?.kind === "visible_actor";
  const distance = hasVisible ? visible.distanceBand : null;
  const bearing = hasVisible ? visible.relativeBearingRadians : 0;
  const approach = hasVisible
    ? clamp(visible.approachSpeed / 250, -1, 1)
    : 0;

  return [
    state.self.taskProgress,
    state.self.taskUrgency,
    state.recentFocus === "player" ? 1 : 0,
    hasVisible ? 1 : 0,
    distance === "near" ? 1 : 0,
    distance === "mid" ? 1 : 0,
    distance === "far" ? 1 : 0,
    approach,
    hasVisible ? Math.sin(bearing) : 0,
    hasVisible ? Math.cos(bearing) : 0,
    speech?.kind === "speech" ? 1 : 0,
    speech?.kind === "speech" && speech.addressed ? 1 : 0,
  ];
}

export function hybridPrivateRepresentation(
  embedding: readonly number[],
  state: ActorPrivateState,
): number[] {
  return [...embedding, ...structuredPrivateFeatures(state)];
}

function clamp(value: number, minimum: number, maximum: number): number {
  return Math.max(minimum, Math.min(maximum, value));
}
