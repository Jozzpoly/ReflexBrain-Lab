import { beforeAll, describe, expect, it } from 'vitest';
import { initE0Rapier } from '../src/e0-body-seam';
import {
  P02A_MAX_RANGE,
  P02A_MIN_DISPLACEMENT,
  runP02aCampaign,
} from '../src/p02a-private-occlusion';

beforeAll(async () => {
  await initE0Rapier();
});

describe('OCTRL-P02a private dynamic-blob occlusion null', () => {
  it('keeps hidden material displacement out of legal P0 evidence', () => {
    expect(P02A_MAX_RANGE).toBeGreaterThan(0);
    expect(P02A_MIN_DISPLACEMENT).toBeGreaterThan(0);

    const result = runP02aCampaign();

    console.log('P02A_RESULT ' + JSON.stringify(result));

    expect(result.visibleDeterministic).toBe(true);
    expect(result.hiddenDeterministic).toBe(true);
    expect(result.privateSchemaClean).toBe(true);
    expect(result.hiddenWithinRangeAllTicks).toBe(true);
    expect(result.hiddenMaterialDisplacement).toBe(true);
    expect(['PASS', 'FAIL', 'INCONCLUSIVE']).toContain(result.outcome);

    if (result.outcome !== 'PASS') {
      throw new Error('P02A_SCIENTIFIC_RESULT ' + JSON.stringify(result));
    }

    expect(result.visibleHasBlob).toBe(true);
    expect(result.hiddenOccludedAllTicks).toBe(true);
    expect(result.hiddenPrivateUnchanged).toBe(true);
    expect(result.hidden.hiddenLeakTicks).toEqual([]);
    expect(result.hidden.privateBefore).toEqual(result.hidden.privateAfter);
    expect(result.reasons).toEqual([]);
  });
});
