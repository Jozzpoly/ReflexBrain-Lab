import type {
  ActorPrivateState,
  ReflexProvider,
  ShadowTraceFrame,
  WorldSnapshot,
} from "./contracts";
import { compilePrivateState } from "./private-state";
import {
  initialReflexDynamicsState,
  stepReflexDynamics,
} from "./reflex-dynamics";

export async function runShadowEpisode(
  frames: readonly WorldSnapshot[],
  provider: ReflexProvider,
): Promise<readonly ShadowTraceFrame[]> {
  let dynamics = initialReflexDynamicsState();
  const trace: ShadowTraceFrame[] = [];

  for (const world of frames) {
    const privateState: ActorPrivateState = compilePrivateState(
      world,
      dynamics.focus,
    );
    const worldBefore = JSON.stringify(world);
    const evaluation = await provider.evaluate(structuredClone(privateState));
    const worldAfter = JSON.stringify(world);

    if (worldBefore !== worldAfter) {
      throw new Error(
        "shadow provider mutated World state at tick " + world.tick,
      );
    }

    dynamics = stepReflexDynamics(dynamics, evaluation);
    trace.push({
      tick: world.tick,
      world: structuredClone(world),
      privateState: structuredClone(privateState),
      baselineAction: "work",
      provider: structuredClone(evaluation),
      stabilized: structuredClone(dynamics),
    });
  }

  return trace;
}
