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
  // Exact original SCIENTIFIC FAIL: Actions #39805607201. The original
  // positive claim failed, without changing material geometry or motor.
  expect(r.scientificPass).toBe(false);
  expect(r.reasons).toEqual([
    'dormant passage was not B0-open in each later 30s snapshot',
  ]);
  expect(r.early.firstSourceContactTick).toBe(121);
  expect(r.early.firstOpenTick).toBe(211);
  expect(r.early.samples.find(x=>x.tick===1200)?.open).toBe(true);
  expect(r.early.samples.filter(x=>x.tick>=3600).every(x=>!x.open)).toBe(true);
  expect(r.early.ordinaryTravel.slice(1)).toEqual([0,0,0]);
  expect(r.early.samples.find(x=>x.tick===14400)?.blockerDisplacement)
    .toBeGreaterThan(3.3);
  // Host-only geometry counterfactual: the moved ordinary blocker no longer
  // blocks, but the UNREMOVED source body does after its power stops.
  for(const m of r.early.samples.filter(x=>x.tick>=3600)){
    expect(m.blockerAloneOpen).toBe(true);
    expect(m.sourceAloneOpen).toBe(false);
    expect(m.powered).toBe(false);
  }
  expect(r.never.samples.every(x=>!x.open)).toBe(true);
  expect(r.always.samples.find(x=>x.tick===7200)?.open).toBe(true);
 },180000);
});
