import { beforeAll, describe, expect, it } from 'vitest';
import { initE0Rapier } from '../src/e0-body-seam';
import {
  C01_TOTAL_TICKS,
  C01_PRIVATE_EVIDENCE_AGE,
  C01_CHECK_LIMIT,
  C01_EARLY_WORLD_EVENT,
  C01_LATE_WORLD_EVENT,
  runC01Campaign,
} from '../src/c01-private-evidence-monitor';

beforeAll(async () => {
  await initE0Rapier();
});

describe('OCTRL-C01 actor-private continuous temporal monitoring', () => {
  it('requires actor-owned evidence age to start bounded CHECK independently of hidden World timing', () => {
    expect(C01_TOTAL_TICKS).toBe(360);
    expect(C01_PRIVATE_EVIDENCE_AGE).toBe(180);
    expect(C01_CHECK_LIMIT).toBe(110);
    expect(C01_EARLY_WORLD_EVENT).toBe(95);
    expect(C01_LATE_WORLD_EVENT).toBe(155);

    const result = runC01Campaign(false);
    console.log('C01_RESULT ' + JSON.stringify({
      outcome: result.outcome,
      deterministic: result.deterministic,
      eventTimingIndependent: result.eventTimingIndependent,
      sameCurrentEvidenceAtCheck: result.sameCurrentEvidenceAtCheck,
      sameBodyStateBeforeCheck: result.sameBodyStateBeforeCheck,
      variants: [result.early, result.late, result.staticWorld, result.ablated].map((r) => ({
        variant: r.variant,
        firstLostTick: r.firstLostTick,
        worldEventTick: r.worldEventTick,
        firstCheckTick: r.firstCheckTick,
        firstCheckPrivateAge: r.firstCheckPrivateAge,
        firstReobservedTick: r.firstReobservedTick,
        worldEventDisplacement: r.worldEventDisplacement,
        firstCheckDemand: r.firstCheckDemand,
        selfMotionAfterCheck: r.selfMotionAfterCheck,
        finalMode: r.finalMode,
        privateLastSeenAtLoss: r.lastSeenAtLoss,
        privateLastSeenAtCheck: r.lastSeenImmediatelyBeforeCheck,
        privateLeakTicks: r.hiddenPrivateLeakTicks,
      })),
      reasons: result.reasons,
    }));
    if (result.outcome !== 'PASS') {
      throw new Error('C01_SCIENTIFIC_RESULT ' + JSON.stringify({
        outcome: result.outcome,
        reasons: result.reasons,
      }));
    }

    expect(result.deterministic).toBe(true);
    expect(result.eventTimingIndependent).toBe(true);
    expect(result.sameCurrentEvidenceAtCheck).toBe(true);
    expect(result.sameBodyStateBeforeCheck).toBe(true);

    for (const r of [result.early, result.late, result.staticWorld]) {
      expect(r.firstCheckPrivateAge).toBe(180);
      expect(r.firstReobservedTick).not.toBeNull();
      expect(r.lastSeenAtLoss).toEqual(r.lastSeenImmediatelyBeforeCheck);
    }
    expect(result.ablated.firstCheckTick).toBeNull();
  });
});
