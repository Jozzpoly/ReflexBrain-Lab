import { beforeAll, describe, expect, it } from 'vitest';
import { initE0Rapier } from '../src/e0-body-seam';
import {
  B01C_ACTOR_START,
  B01C_CROSS_X,
  B01C_TICKS,
  runB01cCampaign,
} from '../src/b01c-actual-b0-effectivity';

beforeAll(async () => {
  await initE0Rapier();
});

describe('OCTRL-B01c actual B0 effectivity falsifier', () => {
  it('executes the frozen fixed-protocol comparison deterministically', () => {
    expect(B01C_ACTOR_START).toEqual({ x: -3.20, y: 0.0 });
    expect(B01C_CROSS_X).toBe(1.25);
    expect(B01C_TICKS).toBe(360);

    const result = runB01cCampaign();

    expect(result.deterministic).toBe(true);

    expect(['PASS', 'FAIL', 'INCONCLUSIVE']).toContain(result.outcome);

    if (result.open.crossed && !result.blocked.crossed) {
      expect(result.outcome).toBe('PASS');
    } else {
      expect(result.outcome).toBe('FAIL');
    }
  });
});
