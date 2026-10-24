import { beforeAll, describe, expect, it } from 'vitest';
import { initE0Rapier } from '../src/e0-body-seam';
import {
  F2_P0_CONSTANTS,
  runF2P0Campaign,
} from '../src/f2-private-competence-reliability';

beforeAll(async () => {
  await initE0Rapier();
});

function compact() {
  const result = runF2P0Campaign();
  return {
    outcome: result.outcome,
    deterministic: result.deterministic,
    informativeCount: result.informativeCount,
    mWorseCount: result.mWorseCount,
    mBetterCount: result.mBetterCount,
    tieCount: result.tieCount,
    sameActionCount: result.sameActionCount,
    aucs: result.aucs,
    alteredNoTouchMWorseCount: result.alteredNoTouchMWorseCount,
    medians: result.medians,
    meanCosts: result.meanCosts,
    reasons: result.reasons,
    families: Object.fromEntries(
      [
        'familiar-free',
        'free-force-change',
        'altered-dynamics',
        'contact-constraint',
        'recovery',
      ].map((family) => [
        family,
        result.episodes
          .filter((episode) => episode.family === family)
          .map((episode) => ({
            id: episode.id,
            phase: episode.phase,
            R: episode.signals.reliabilityR,
            speed: episode.signals.speed,
            deltaV: episode.signals.deltaV,
            lastDemand: episode.signals.lastDemand,
            touchFraction: episode.signals.touchFraction,
            touchRecency: episode.signals.touchRecency,
            mDrive: episode.mDrive,
            fDrive: episode.fDrive,
            mCost: episode.m.cost,
            fCost: episode.f.cost,
            regret: episode.regret,
            label: episode.label,
            sameAction: episode.sameAction,
          })),
      ]),
    ),
  };
}

describe('RB-F2/P0 private competence reliability falsifier', () => {
  it('runs the frozen 30-episode apparatus deterministically without mutating source snapshots', () => {
    const result = runF2P0Campaign();

    expect(result.deterministic).toBe(true);
    expect(result.episodes).toHaveLength(30);

    const counts = new Map<string, number>();
    for (const episode of result.episodes) {
      counts.set(episode.family, (counts.get(episode.family) ?? 0) + 1);
      expect(episode.sourceTick).toBe(F2_P0_CONSTANTS.decisionTick);
      expect(episode.history).toHaveLength(F2_P0_CONSTANTS.historyWindow);
      expect(episode.sourceSnapshotUnchanged).toBe(true);

      for (const value of [
        episode.signals.reliabilityR,
        episode.signals.speed,
        episode.signals.deltaV,
        episode.signals.lastDemand,
        episode.signals.touchFraction,
        episode.signals.touchRecency,
        episode.m.finalVelocity,
        episode.m.contactImpulse,
        episode.m.cost,
        episode.f.finalVelocity,
        episode.f.contactImpulse,
        episode.f.cost,
        episode.regret,
      ]) {
        expect(Number.isFinite(value)).toBe(true);
      }

      expect(F2_P0_CONSTANTS.candidates).toContain(episode.mDrive);
      expect(F2_P0_CONSTANTS.candidates).toContain(episode.fDrive);
    }

    expect([...counts.values()]).toEqual([6, 6, 6, 6, 6]);
  });

  it('repeats the complete scientific result exactly and reports rather than asserts its hypothesis outcome', () => {
    const first = compact();
    const second = compact();

    expect(second).toEqual(first);
    expect(['PASS', 'FAIL', 'INCONCLUSIVE']).toContain(first.outcome);

    console.log('RB_F2_P0_RESULT ' + JSON.stringify(first));
  });

  it('keeps the intended frozen P0 constants', () => {
    expect(F2_P0_CONSTANTS.decisionTick).toBe(64);
    expect(F2_P0_CONSTANTS.historyWindow).toBe(24);
    expect(F2_P0_CONSTANTS.branchHorizon).toBe(24);
    expect(F2_P0_CONSTANTS.candidates).toEqual([-1, -0.5, 0, 0.5, 1]);
    expect(F2_P0_CONSTANTS.demandPattern).toHaveLength(16);
    expect(F2_P0_CONSTANTS.nominalAlpha).toBeGreaterThan(0);
    expect(F2_P0_CONSTANTS.nominalAlpha).toBeLessThan(1);
    expect(F2_P0_CONSTANTS.nominalBeta).toBeGreaterThan(0);
  });
});
