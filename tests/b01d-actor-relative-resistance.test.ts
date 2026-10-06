import { beforeAll, describe, expect, it } from 'vitest';
import { initE0Rapier } from '../src/e0-body-seam';
import {
  B01D_HELD_OUT,
  B01D_OPEN_EXPECTED_CONTACT_TICKS,
  B01D_OPEN_EXPECTED_CROSS_TICK,
  runB01dCampaign,
} from '../src/b01d-actor-relative-resistance';

beforeAll(async () => {
  await initE0Rapier();
});

describe('OCTRL-B01d actor-relative resistance signature', () => {
  it('executes the predeclared held-out qualification without retuning', () => {
    expect(B01D_HELD_OUT).toEqual([
      { id: 'H1', x: 0.00, y: +0.10 },
      { id: 'H2', x: 0.00, y: +0.30 },
      { id: 'H3', x: 0.00, y: -0.20 },
      { id: 'H4', x: -0.10, y: +0.20 },
      { id: 'H5', x: +0.10, y: +0.20 },
    ]);

    const result = runB01dCampaign();

    console.log('B01D_RESULT ' + JSON.stringify(result));

    expect(result.openDeterministic).toBe(true);
    expect(result.open.crossedTick).toBe(B01D_OPEN_EXPECTED_CROSS_TICK);
    expect(result.open.actorBlockerContactTicks).toBe(
      B01D_OPEN_EXPECTED_CONTACT_TICKS,
    );

    expect(['PASS', 'FAIL', 'INCONCLUSIVE']).toContain(result.outcome);

    if (result.outcome === 'PASS') {
      expect(result.cases.every((c) => c.pass)).toBe(true);
      expect(result.reasons).toEqual([]);
    }

    if (result.outcome === 'FAIL') {
      expect(
        !result.openRegressionExact ||
          result.cases.some(
            (c) => !c.laterThanOpen || !c.moreContactThanOpen,
          ),
      ).toBe(true);
    }
  });
});
