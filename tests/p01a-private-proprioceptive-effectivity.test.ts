import { beforeAll, describe, expect, it } from 'vitest';
import { initE0Rapier } from '../src/e0-body-seam';
import {
  P01A_AUDIT_TICK,
  runP01aCampaign,
} from '../src/p01a-private-proprioceptive-effectivity';

beforeAll(async () => {
  await initE0Rapier();
});

describe('OCTRL-P01a private proprioceptive effectivity exposure', () => {
  it('keeps the B01d consequence inside a clean actor-private proprioceptive channel', () => {
    expect(P01A_AUDIT_TICK).toBe(122);

    const result = runP01aCampaign();

    console.log('P01A_RESULT ' + JSON.stringify(result));

    expect(result.openDeterministic).toBe(true);
    expect(result.openPhysicalRegressionMatchesB01d).toBe(true);
    expect(result.privateSchemaClean).toBe(true);
    expect(['PASS', 'FAIL', 'INCONCLUSIVE']).toContain(result.outcome);

    if (result.outcome === 'PASS') {
      expect(result.pairs).toHaveLength(5);
      expect(result.pairs.every((p) => p.pass)).toBe(true);
      expect(result.reasons).toEqual([]);
    }
  });
});
