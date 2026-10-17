import { beforeAll, describe, expect, it } from 'vitest';
import { initLivingWorld } from '../../src/living-organism/world';
import {
  OL0_FROZEN,
  runOL0Campaign,
} from '../../src/living-organism/online-actuation-learning-scout';

beforeAll(initLivingWorld);

describe('RB-OL0 continuous local model-in-body falsifier', () => {
  it('preserves the scenario, comparison and mid-life perturbation contract', () => {
    expect(OL0_FROZEN.cases).toEqual([
      {side:1,gainAfter:1},{side:-1,gainAfter:1},
      {side:1,gainAfter:-1},{side:-1,gainAfter:-1},
      {side:1,gainAfter:.25},{side:-1,gainAfter:.25},
      {side:1,gainAfter:-.25},{side:-1,gainAfter:-.25},
    ]);
    expect(OL0_FROZEN.modes).toEqual(['fixed','sign-only','online-gain']);
    expect(OL0_FROZEN.changeTick).toBe(40);
    expect(OL0_FROZEN.maxTicks).toBe(900);
  });

  it('executes actual Rapier bodies without privileged features and prints the scientific result',()=>{
    const result=runOL0Campaign();
    expect(result.runs).toHaveLength(24);
    expect(result.deterministic).toBe(true);
    expect(result.runs.every(r=>r.valid)).toBe(true);
    expect(['PASS','FAIL','INCONCLUSIVE']).toContain(result.verdict);
    expect(result.runs.filter(r=>r.changed&&r.mode==='online-gain')).toHaveLength(6);
    console.log('RB_OL0_RESULT '+JSON.stringify(result));
  },120000);
});
