import { beforeAll, describe, expect, it } from 'vitest';
import {
  E02B_CASES,
  initE02bRapier,
  runE02bCampaign,
} from '../src/e02b-robustness';

beforeAll(async () => {
  await initE02bRapier();
});

describe('OCTRL-E02b frozen composition robustness', () => {
  it('qualifies the exact predeclared held-out blocker-position set without retuning', () => {
    expect(E02B_CASES.map((c) => [c.id, c.x, c.y, c.heldOut])).toEqual([
      ['B0', 0.00, +0.20, false],
      ['H1', 0.00, +0.10, true],
      ['H2', 0.00, +0.30, true],
      ['H3', 0.00, -0.20, true],
      ['H4', -0.10, +0.20, true],
      ['H5', +0.10, +0.20, true],
    ]);

    const result = runE02bCampaign();

    expect(result.baselinePass).toBe(true);
    expect(result.heldOutTotal).toBe(5);
    expect(result.heldOutPassCount).toBe(5);

    expect(
      result.pass,
      result.reasons.join('\n'),
    ).toBe(true);
  });
});
