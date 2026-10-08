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

      const key = (pair: G5D0Pair) => {
        const offset = Number(
          (pair.config.shuttleY - pair.config.targetY).toFixed(1),
        );
        return [
          pair.config.targetY,
          offset,
          pair.config.shuttleStartX,
          pair.config.leftEndX,
        ].join('|');
      };

      const viableKeys = new Set(discovery.candidates.map(key));
      const targetYs = [1.9, 2.0, 2.1, 2.2];
      const offsets = [-0.3, 0, 0.3];
      const shuttleStarts = [4.2, 4.6, 5.0];
      const leftEnds = [0.4, 0.8, 1.2];

      const neighborCount = (pair: G5D0Pair) => {
        const current = [
          targetYs.indexOf(pair.config.targetY),
          offsets.indexOf(
            Number(
              (pair.config.shuttleY - pair.config.targetY).toFixed(1),
            ),
          ),
          shuttleStarts.indexOf(pair.config.shuttleStartX),
          leftEnds.indexOf(pair.config.leftEndX),
        ];

        let count = 0;
        for (let axis = 0; axis < current.length; axis += 1) {
          for (const delta of [-1, 1]) {
            const next = [...current];
            next[axis] += delta;
            const grids = [targetYs, offsets, shuttleStarts, leftEnds];
            if (next[axis] < 0 || next[axis] >= grids[axis].length) continue;
            const cfg = {
              targetY: targetYs[next[0]],
              offset: offsets[next[1]],
              shuttleStartX: shuttleStarts[next[2]],
              leftEndX: leftEnds[next[3]],
            };
            const candidateKey = [
              cfg.targetY,
              cfg.offset,
              cfg.shuttleStartX,
              cfg.leftEndX,
            ].join('|');
            if (viableKeys.has(candidateKey)) count += 1;
          }
        }
        return count;
      };

      const robust = discovery.candidates
        .map((pair) => ({
          ...compact(pair),
          neighborCount: neighborCount(pair),
          bothReobserved:
            pair.dynamic.finalMode === 'REOBSERVED' &&
            pair.staticWorld.finalMode === 'REOBSERVED',
          timingMargin:
            pair.dynamic.firstLostTick !== null &&
            pair.dynamic.firstProcessTargetContactTick !== null &&
            pair.dynamic.firstCheckTick !== null
              ? Math.min(
                  pair.dynamic.firstProcessTargetContactTick -
                    pair.dynamic.firstLostTick,
                  pair.dynamic.firstCheckTick -
                    pair.dynamic.firstProcessTargetContactTick,
                )
              : null,
        }))
        .sort(
          (a, b) =>
            Number(b.bothReobserved) - Number(a.bothReobserved) ||
            b.neighborCount - a.neighborCount ||
            b.score - a.score,
        )
        .slice(0, 8);

      const byTargetY = Object.fromEntries(
        targetYs.map((value) => [
          String(value),
          discovery.candidates.filter(
            (pair) => pair.config.targetY === value,
          ).length,
        ]),
      );
      const byOffset = Object.fromEntries(
        offsets.map((value) => [
          String(value),
          discovery.candidates.filter(
            (pair) =>
              Number(
                (pair.config.shuttleY - pair.config.targetY).toFixed(1),
              ) === value,
          ).length,
        ]),
      );
      const byShuttleStart = Object.fromEntries(
        shuttleStarts.map((value) => [
          String(value),
          discovery.candidates.filter(
            (pair) => pair.config.shuttleStartX === value,
          ).length,
        ]),
      );
      const byLeftEnd = Object.fromEntries(
        leftEnds.map((value) => [
          String(value),
          discovery.candidates.filter(
            (pair) => pair.config.leftEndX === value,
          ).length,
        ]),
      );

      console.log(
        'G5D0_DISCOVERY_RESULT ' +
          JSON.stringify({
            tested: discovery.tested,
            viableCount: discovery.viableCount,
            top,
            landscape: {
              byTargetY,
              byOffset,
              byShuttleStart,
              byLeftEnd,
              robust,
            },
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
