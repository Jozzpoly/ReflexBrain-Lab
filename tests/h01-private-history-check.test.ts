import { beforeAll, describe, expect, it } from 'vitest';
import { initE0Rapier } from '../src/e0-body-seam';
import { H01_CHECK_TICKS, runH01Campaign } from '../src/h01-private-history-check';

beforeAll(async () => {
  await initE0Rapier();
});

describe('OCTRL-H01 actor-private history -> material CHECK', () => {
  it('requires legal prior private evidence for a later embodied CHECK under matched current evidence', () => {
    expect(H01_CHECK_TICKS).toBe(110);
    const result = runH01Campaign();

    console.log('H01_RESULT ' + JSON.stringify({
      outcome: result.outcome,
      deterministic: result.deterministic,
      physicalMatchBeforeCheck: result.physicalMatchBeforeCheck,
      currentPrivateEvidenceMatch: result.currentPrivateEvidenceMatch,
      firstOcclusionTick: result.enabled.firstOcclusionTick,
      hiddenTargetDisplacement: result.enabled.hiddenTargetDisplacement,
      enabledLastSeenBeforeHidden: result.enabled.historyBeforeHidden.lastSeen,
      enabledLastSeenAfterHidden: result.enabled.historyAfterHidden.lastSeen,
      ablatedLastSeenAfterHidden: result.ablated.historyAfterHidden.lastSeen,
      enabledFirstDemand: result.enabled.firstCheckDrive,
      ablatedFirstDemand: result.ablated.firstCheckDrive,
      enabledBodyDisplacement: result.enabled.bodyDisplacementDuringCheck,
      ablatedBodyDisplacement: result.ablated.bodyDisplacementDuringCheck,
      enabledFirstNewBlobTick: result.enabled.firstNewBlobTick,
      ablatedFirstNewBlobTick: result.ablated.firstNewBlobTick,
      reasons: result.reasons,
    }));

    // The scientific outcome is intentionally binding. FAIL must not be
    // repaired by retuning geometry, physics, the sensor or the CHECK window.
    if (result.outcome !== 'PASS') {
      throw new Error('H01_SCIENTIFIC_RESULT ' + JSON.stringify({
        outcome: result.outcome,
        reasons: result.reasons,
        enabled: result.enabled,
        ablated: result.ablated,
      }));
    }

    expect(result.deterministic).toBe(true);
    expect(result.physicalMatchBeforeCheck).toBe(true);
    expect(result.currentPrivateEvidenceMatch).toBe(true);
    expect(result.enabled.historyBeforeHidden.lastSeen).not.toBeNull();
    expect(result.enabled.historyBeforeHidden).toEqual(result.enabled.historyAfterHidden);
    expect(result.ablated.historyAfterHidden.lastSeen).toBeNull();
    expect(result.enabled.firstCheckDrive).toBe(-1);
    expect(result.ablated.firstCheckDrive).toBe(0);
    expect(result.enabled.firstNewBlobTick).not.toBeNull();
    expect(result.ablated.firstNewBlobTick).toBeNull();
  });
});
