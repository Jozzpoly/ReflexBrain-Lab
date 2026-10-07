import type {
  ReflexDynamicsState,
  ReflexEvaluation,
  ReflexScores,
} from "./contracts";
import { clamp01 } from "./math";

const INITIAL_SCORES: ReflexScores = {
  attentionPlayer: 0,
  interruptCurrent: 0,
  socialRelevance: 0,
  novelty: 0,
  threat: 0,
  deeperCognition: 0,
};

export function initialReflexDynamicsState(): ReflexDynamicsState {
  return {
    scores: { ...INITIAL_SCORES },
    focus: "task",
  };
}

export function stepReflexDynamics(
  previous: ReflexDynamicsState,
  evaluation: ReflexEvaluation,
): ReflexDynamicsState {
  const scores = mapScores(previous.scores, evaluation.scores);
  let focus = previous.focus;

  if (focus === "task" && scores.attentionPlayer >= 0.68) focus = "player";
  if (
    focus === "player" &&
    scores.attentionPlayer <= 0.32 &&
    scores.socialRelevance <= 0.25
  ) {
    focus = "task";
  }

  return { scores, focus };
}

function mapScores(
  previous: ReflexScores,
  incoming: ReflexScores,
): ReflexScores {
  return {
    attentionPlayer: smooth(
      previous.attentionPlayer,
      incoming.attentionPlayer,
      0.55,
      0.22,
    ),
    interruptCurrent: smooth(
      previous.interruptCurrent,
      incoming.interruptCurrent,
      0.6,
      0.3,
    ),
    socialRelevance: smooth(
      previous.socialRelevance,
      incoming.socialRelevance,
      0.65,
      0.2,
    ),
    novelty: smooth(previous.novelty, incoming.novelty, 0.7, 0.34),
    threat: smooth(previous.threat, incoming.threat, 0.65, 0.28),
    deeperCognition: smooth(
      previous.deeperCognition,
      incoming.deeperCognition,
      0.62,
      0.26,
    ),
  };
}

function smooth(
  previous: number,
  incoming: number,
  rise: number,
  fall: number,
): number {
  const alpha = incoming >= previous ? rise : fall;
  return clamp01(previous + (incoming - previous) * alpha);
}
