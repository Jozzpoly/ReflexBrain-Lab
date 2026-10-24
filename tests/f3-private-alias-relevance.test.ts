import { beforeAll, describe, expect, it } from 'vitest';
import { initE0Rapier } from '../src/e0-body-seam';
import {
  F3_D0_CONSTANTS,
  runF3D0Discovery,
} from '../src/f3-private-alias-relevance';

beforeAll(async () => {
  await initE0Rapier();
});

function compact() {
  const result = runF3D0Discovery();
  return {
    outcome: result.outcome,
    deterministic: result.deterministic,
    privateHistoryEqual: result.privateHistoryEqual,
    signalsEqual: result.signalsEqual,
    sameMDrive: result.sameMDrive,
    sameFDrive: result.sameFDrive,
    regretOpposite: result.regretOpposite,
    right: {
      R: result.right.signals.reliabilityR,
      touchFraction: result.right.signals.touchFraction,
      mDrive: result.right.mDrive,
      fDrive: result.right.fDrive,
      mCost: result.right.m.cost,
      fCost: result.right.f.cost,
      regret: result.right.regret,
      label: result.right.label,
    },
    left: {
      R: result.left.signals.reliabilityR,
      touchFraction: result.left.signals.touchFraction,
      mDrive: result.left.mDrive,
      fDrive: result.left.fDrive,
      mCost: result.left.m.cost,
      fCost: result.left.f.cost,
      regret: result.left.regret,
      label: result.left.label,
    },
    directionalTouch: {
      right: {
        nonzeroTicks: result.directionalTouch.right.nonzeroTicks,
        meanSignedImpulse:
          result.directionalTouch.right.meanSignedImpulse,
        sign: result.directionalTouch.right.sign,
      },
      left: {
        nonzeroTicks: result.directionalTouch.left.nonzeroTicks,
        meanSignedImpulse:
          result.directionalTouch.left.meanSignedImpulse,
        sign: result.directionalTouch.left.sign,
      },
      separates: result.directionalTouch.separates,
    },
    reasons: result.reasons,
  };
}

describe('RB-F3/D0 private alias / relational relevance discovery', () => {
  it('executes the one frozen mirrored pair deterministically', () => {
    const first = compact();
    const second = compact();

    expect(second).toEqual(first);
    expect(first.deterministic).toBe(true);
    expect([
      'MATERIAL_ALIAS_FOUND',
      'NO_ALIAS',
      'APPARATUS_FAIL',
    ]).toContain(first.outcome);

    expect(F3_D0_CONSTANTS.phase).toBe(0);
    expect(F3_D0_CONSTANTS.forceMagnitude).toBe(1.05);

    console.log('RB_F3_D0_RESULT ' + JSON.stringify(first));
  });

  it('keeps directional touch as observation-only discovery evidence', () => {
    const result = runF3D0Discovery();

    // The F2 decisions come from the original binary-touch private
    // representation. Directional touch is measured separately afterwards.
    expect(result.right.history.every(
      (row) => typeof row.privateTouch === 'boolean',
    )).toBe(true);
    expect(result.left.history.every(
      (row) => typeof row.privateTouch === 'boolean',
    )).toBe(true);

    expect(Number.isFinite(
      result.directionalTouch.right.meanSignedImpulse,
    )).toBe(true);
    expect(Number.isFinite(
      result.directionalTouch.left.meanSignedImpulse,
    )).toBe(true);
  });
});
