import { beforeAll, describe, expect, it } from 'vitest';
import { initE02aRapier, runE02aCampaign } from '../src/e02a-passage';

beforeAll(async () => {
  await initE02aRapier();
});

describe('OCTRL-E02a passage-state composition', () => {
  it('changes passage accessibility through E01-driven physical blocker displacement', () => {
    const result = runE02aCampaign();

    expect(result.deterministic).toBe(true);

    expect(result.control.initialOpen).toBe(false);
    expect(result.control.firstOpenTick).toBeNull();

    expect(result.interaction.initialOpen).toBe(false);
    expect(result.interaction.firstBlockerContactTick).not.toBeNull();
    expect(result.interaction.firstOpenTick).not.toBeNull();
    expect(result.interaction.postContactNoContactTicks).toBeGreaterThanOrEqual(60);
    expect(result.interaction.persistenceOpen).toBe(true);
    expect(result.blockerDisplacementAtPersistence ?? 0).toBeGreaterThanOrEqual(0.9);

    expect(result.pass, result.reasons.join('\n')).toBe(true);
  });
});
