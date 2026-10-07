import type {
  ActorPrivateState,
  ReflexEvaluation,
  ReflexProvider,
} from "./contracts";

export interface SemanticProbeResult {
  providerId: string;
  evaluation: ReflexEvaluation;
}

/**
 * Evaluate multiple providers against byte-equivalent actor-private input.
 *
 * This is intentionally different from runShadowEpisode(): the temporal runner
 * lets each provider's stabilized focus feed its next frame, while this helper
 * isolates instantaneous semantic judgement before feedback can diverge.
 */
export async function evaluateProvidersSameState(
  state: ActorPrivateState,
  providers: readonly ReflexProvider[],
): Promise<readonly SemanticProbeResult[]> {
  const canonical = JSON.stringify(state);

  const results = await Promise.all(
    providers.map(async (provider) => {
      const providerState = structuredClone(state);
      const evaluation = await provider.evaluate(providerState);
      return {
        providerId: provider.id,
        evaluation: structuredClone(evaluation),
      };
    }),
  );

  if (JSON.stringify(state) !== canonical) {
    throw new Error("same-state semantic probe mutated canonical private state");
  }

  return results;
}
