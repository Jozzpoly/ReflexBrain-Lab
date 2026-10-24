import { beforeAll, describe, expect, it } from 'vitest';
import { initE02aRapier } from '../src/e02a-passage';
import {
  B01B_CLEARANCE_RADIUS,
  B01B_CORRIDOR_INNER_HALF_HEIGHT,
  B01B_DOOR_GAP_HALF_HEIGHT,
  runB01bCampaign,
} from '../src/b01b-b0-scale-passage';

beforeAll(async () => {
  await initE02aRapier();
});

describe('OCTRL-B01b B0-scale passage calibration', () => {
  it('preserves material topology effect at frozen B0 research clearance', () => {
    expect(B01B_CLEARANCE_RADIUS).toBe(1.0);
    expect(B01B_CORRIDOR_INNER_HALF_HEIGHT).toBeGreaterThan(
      B01B_CLEARANCE_RADIUS,
    );
    expect(B01B_DOOR_GAP_HALF_HEIGHT).toBeGreaterThan(
      B01B_CLEARANCE_RADIUS,
    );

    const result = runB01bCampaign();

    expect(result.deterministic).toBe(true);

    expect(result.control.initialOpen).toBe(false);
    expect(result.control.firstOpenTick).toBeNull();

    expect(result.interaction.initialOpen).toBe(false);
    expect(result.interaction.firstContactTick).not.toBeNull();
    expect(result.interaction.firstOpenTick).not.toBeNull();
    expect(result.interaction.postContactNoContactTicks).toBeGreaterThanOrEqual(60);
    expect(result.interaction.persistenceOpen).toBe(true);
    expect(result.blockerDisplacementAtPersistence ?? 0).toBeGreaterThanOrEqual(0.9);

    expect(result.pass, result.reasons.join('\n')).toBe(true);
  });
});
