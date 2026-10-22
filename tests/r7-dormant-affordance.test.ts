import {beforeAll,describe,expect,it} from 'vitest';
import {initE02aRapier} from '../src/e02a-passage';
import {r7DormancyDecision} from '../src/r7-dormant-affordance';
beforeAll(initE02aRapier);
describe('R7/P0 prearmed dormant physical affordance (not a living organism)',()=>{
 it('executes three true 120s physical histories and preserves original science outcome',()=>{
  const r=r7DormancyDecision();
  console.log('RB_R7_P0_EXECUTED '+JSON.stringify(r));
  expect(r.reproducible).toBe(true);
  for(const q of [r.never,r.early,r.always]){
   expect(q.executedUpdates).toBe(14400);
   expect(q.samples.map(x=>x.tick)).toEqual([0,1200,3600,7200,10800,14400]);
   expect(q.physicsFinalBytes).toBeGreaterThan(50);
  }
  // Frozen hypothesis: early power created a durable, *quiet* effect
  // after the independently powered material source was shut off.
  // If false: record source execution as SCIENTIFIC FAIL; don't retune.
  expect(r.scientificPass,r.reasons.join('; ')).toBe(true);
 },180000);
});
