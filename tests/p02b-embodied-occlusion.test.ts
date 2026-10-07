import { beforeAll, describe, expect, it } from 'vitest';
import { initE0Rapier } from '../src/e0-body-seam';
import {
  P02B_DRIVE_TICKS,
  P02B_SETTLE_TICKS,
  runP02bCampaign,
} from '../src/p02b-embodied-occlusion';

beforeAll(async () => {
  await initE0Rapier();
});

describe('OCTRL-P02b embodied occlusion transition integration', () => {
  it('preserves P02a privacy across a self-motion visibility transition', () => {
    expect(P02B_DRIVE_TICKS).toBe(72);
    expect(P02B_SETTLE_TICKS).toBe(120);

    const result = runP02bCampaign();

    console.log(
      'P02B_RESULT ' +
        JSON.stringify({
          outcome: result.outcome,
          deterministic: result.deterministic,
          initialBlobCount: result.run.initialFrame.blobs.length,
          firstOccludedTick: result.run.firstOccludedTick,
          actorYAtOcclusion: result.run.actorYAtOcclusion,
          targetDisplacementAtOcclusion: result.run.targetDisplacementAtOcclusion,
          targetRangeAtOcclusion: result.run.targetRangeAtOcclusion,
          actorSelfDisplacement: result.run.actorSelfDisplacement,
          reappearanceTicks: result.run.reappearanceTicks,
          preHiddenTargetDisplacement: result.run.preHiddenTargetDisplacement,
          hiddenTargetDisplacement: result.run.hiddenTargetDisplacement,
          hiddenLeakTicks: result.run.hiddenLeakTicks,
          hiddenWithinRangeAllTicks: result.run.hiddenWithinRangeAllTicks,
          actorContactContamination: result.run.actorContactContamination,
          reasons: result.run.reasons,
        }),
    );

    expect(result.deterministic).toBe(true);

    if (result.outcome !== 'PASS') {
      throw new Error(
        'P02B_SCIENTIFIC_RESULT ' +
          JSON.stringify({
            outcome: result.outcome,
            reasons: result.run.reasons,
          }),
      );
    }

    expect(result.run.initialFrame.blobs).toHaveLength(1);
    expect(result.run.firstOccludedTick).not.toBeNull();
    expect(result.run.reappearanceTicks).toEqual([]);
    expect(result.run.hiddenLeakTicks).toEqual([]);
    expect(result.run.hiddenWithinRangeAllTicks).toBe(true);
    expect(result.run.actorContactContamination).toBe(false);
    expect(result.run.preHiddenTargetDisplacement).toBeLessThanOrEqual(1e-6);
  });
});
