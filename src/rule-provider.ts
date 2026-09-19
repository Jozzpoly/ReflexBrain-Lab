import type {
  ActionDistribution,
  ActorPrivateState,
  ReflexEvaluation,
  ReflexProvider,
  ReflexScores,
  VisibleActorPercept,
} from "./contracts";
import { clamp01, normalizeDistribution } from "./math";

export class RuleBaselineProvider implements ReflexProvider {
  readonly id = "rule-baseline-v0";

  evaluate(state: ActorPrivateState): ReflexEvaluation {
    const visible = state.percepts.find(
      (percept): percept is VisibleActorPercept => percept.kind === "visible_actor",
    );
    const addressedSpeech = state.percepts.find(
      (percept) => percept.kind === "speech" && percept.addressed,
    );

    const proximity = visible
      ? ({ near: 1, mid: 0.55, far: 0.2 } as const)[visible.distanceBand]
      : 0;
    const fastApproach = visible ? clamp01(visible.approachSpeed / 140) : 0;
    const addressed = addressedSpeech ? 1 : 0;

    const scores: ReflexScores = {
      attentionPlayer: clamp01(
        0.1 + proximity * 0.5 + addressed * 0.55 + fastApproach * 0.15,
      ),
      interruptCurrent: clamp01(
        0.03 + addressed * 0.22 + fastApproach * 0.18 - state.self.taskUrgency * 0.14,
      ),
      socialRelevance: clamp01(addressed * 0.85 + proximity * 0.12),
      novelty: clamp01((visible ? 0.2 : 0) + addressed * 0.35),
      threat: clamp01(
        fastApproach * 0.35 + (visible?.distanceBand === "near" ? 0.06 : 0),
      ),
      deeperCognition: clamp01(addressed * 0.28 + fastApproach * 0.08),
    };

    const actions = normalizeDistribution<keyof ActionDistribution>({
      continue: 0.9 + state.self.taskUrgency * 0.5 - scores.interruptCurrent * 0.5,
      orient: 0.2 + scores.attentionPlayer * 0.65,
      acknowledge: 0.05 + scores.socialRelevance * 0.8,
      investigate: 0.05 + scores.novelty * 0.35,
      withdraw: 0.02 + scores.threat * 0.35,
    });

    return {
      providerId: this.id,
      scores,
      actions: actions as ActionDistribution,
      rationaleTags: [
        visible ? "visible:" + visible.distanceBand : "player:not-visible",
        addressed ? "addressed-speech" : "no-addressed-speech",
        fastApproach > 0.4 ? "approaching-fast" : "approach-low",
      ],
      latencyMs: 0,
    };
  }
}
