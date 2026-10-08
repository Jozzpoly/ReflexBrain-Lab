import { beforeAll, describe, expect, it } from 'vitest';
import { initE0Rapier } from '../src/e0-body-seam';
import {
  rerunG5D0Config,
  runG5D0Discovery,
  type G5D0Pair,
} from '../src/g5d0-independent-ecology-discovery';

beforeAll(async () => {
  await initE0Rapier();
});

function compact(pair: G5D0Pair) {
  return {
    config: pair.config,
    viable: pair.viable,
    score: pair.score,
    firstPrivateDivergenceTick: pair.firstPrivateDivergenceTick,
    dynamic: {
      initialBlobCount: pair.dynamic.initialBlobCount,
      firstLostTick: pair.dynamic.firstLostTick,
      firstProcessTargetContactTick:
        pair.dynamic.firstProcessTargetContactTick,
      firstCheckTick: pair.dynamic.firstCheckTick,
      firstReobservedTick: pair.dynamic.firstReobservedTick,
      hiddenLeakTicks: pair.dynamic.hiddenLeakTicks,
      targetStayedWithinRangeBeforeCheck:
        pair.dynamic.targetStayedWithinRangeBeforeCheck,
      actorProcessContactTicks: pair.dynamic.actorProcessContactTicks,
      targetDisplacementAtCheck: pair.dynamic.targetDisplacementAtCheck,
      targetFinalDisplacement: pair.dynamic.targetFinalDisplacement,
      processDirectionEvents: pair.dynamic.processDirectionEvents,
      finalMode: pair.dynamic.finalMode,
    },
    staticWorld: {
      initialBlobCount: pair.staticWorld.initialBlobCount,
      firstLostTick: pair.staticWorld.firstLostTick,
      firstProcessTargetContactTick:
        pair.staticWorld.firstProcessTargetContactTick,
      firstCheckTick: pair.staticWorld.firstCheckTick,
      firstReobservedTick: pair.staticWorld.firstReobservedTick,
      hiddenLeakTicks: pair.staticWorld.hiddenLeakTicks,
      targetStayedWithinRangeBeforeCheck:
        pair.staticWorld.targetStayedWithinRangeBeforeCheck,
      actorProcessContactTicks: pair.staticWorld.actorProcessContactTicks,
      targetDisplacementAtCheck: pair.staticWorld.targetDisplacementAtCheck,
      targetFinalDisplacement: pair.staticWorld.targetFinalDisplacement,
      processDirectionEvents: pair.staticWorld.processDirectionEvents,
      finalMode: pair.staticWorld.finalMode,
    },
    reasons: pair.reasons,
  };
}

describe('G5-D0 independent ecology composition discovery', () => {
  it(
    'searches the frozen bounded geometry family without turning discovery outcome into a scientific gate',
    () => {
      const discovery = runG5D0Discovery();

      expect(discovery.tested).toBe(108);
      expect(discovery.viableCount).toBe(discovery.candidates.length);
      expect(discovery.viableCount).toBeGreaterThanOrEqual(0);
      expect(discovery.viableCount).toBeLessThanOrEqual(discovery.tested);

      const top = discovery.candidates.slice(0, 3).map(compact);

      console.log(
        'G5D0_DISCOVERY_RESULT ' +
          JSON.stringify({
            tested: discovery.tested,
            viableCount: discovery.viableCount,
            top,
          }),
      );

      // Zero viable candidates is a valid discovery result. If a candidate
      // exists, however, its exact dynamic/static pair must replay
      // deterministically before it can be considered for a later frozen G5A.
      for (const candidate of discovery.candidates.slice(0, 2)) {
        const a = rerunG5D0Config(candidate.config);
        const b = rerunG5D0Config(candidate.config);

        expect(compact(a)).toEqual(compact(candidate));
        expect(compact(b)).toEqual(compact(candidate));
      }
    },
    30_000,
  );
});
