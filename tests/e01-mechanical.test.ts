import { beforeAll, describe, expect, it } from 'vitest';
import { initE01Rapier, runE01Campaign } from '../src/e01-mechanical';

beforeAll(async () => {
  await initE01Rapier();
});

describe('OCTRL-E01 independent mechanical process', () => {
  it('creates deterministic persistent material change through local physical interaction', () => {
    const result = runE01Campaign();

    expect(result.deterministic).toBe(true);
    expect(result.control.rightReversalTick).not.toBeNull();
    expect(result.interaction.rightReversalTick).not.toBeNull();
    expect(result.interaction.firstLooseContactTick).not.toBeNull();
    expect(result.interaction.looseContactTicks).toBeGreaterThan(0);
    expect(Math.abs(result.reversalDelayTicks ?? 0)).toBeGreaterThanOrEqual(3);
    expect(result.persistentDisplacement ?? 0).toBeGreaterThanOrEqual(0.6);
    expect(result.interaction.directionEvents.some((e) => e.cause === 'right-end-contact')).toBe(true);

    expect(result.pass, result.reasons.join('\n')).toBe(true);
  });
});
