import {beforeAll,describe,expect,it} from 'vitest';
import {initLivingWorld} from '../../src/living-organism/world';
import {runR2bRevisit} from '../../src/living-organism/life-l2-trace';

beforeAll(initLivingWorld);

describe('L2/R2b: uninterrupted same physical body revisit under blind tape',()=>{
 it('checks if a single same physical body actually re-encounters its old material after a 30s motor-off period',()=>{
  const lived=runR2bRevisit('forward');
  const nullActor=runR2bRevisit('zero');
  const detail=(s:typeof lived)=>({
   firstDemand:s.firstDemand,worldTick:s.worldTick,afterWaitActor:s.afterWaitActor,
   afterWaitMaterial:s.afterWaitMaterial,afterReturnActor:s.afterReturnActor,
   afterReturnMaterial:s.afterReturnMaterial,
   afterRevisitActor:s.afterRevisitActor,
   afterRevisitMaterial:s.afterRevisitMaterial,
   firstRevisitMaterialContactTick:s.firstRevisitMaterialContactTick,
   firstRevisitPrivateTouchTick:s.firstRevisitPrivateTouchTick,
   replayedExactly:s.replayedExactly});
  console.log('RB_L2_R2B_SAME_BODY '+JSON.stringify({lived:detail(lived),nullActor:detail(nullActor)}));
  expect(lived.worldTick).toBe(6180);
  expect(nullActor.worldTick).toBe(6180);
  expect(lived.replayedExactly).toBe(true);
  expect(nullActor.replayedExactly).toBe(true);
  expect(lived.afterWaitMaterial.x).toBeGreaterThan(4.0);
  expect(nullActor.afterWaitMaterial.x).toBeCloseTo(3.5,4);
  // Actual contact rather than global-route progress; failing contact is
  // predeclared negative science, not permission to extend the motor tape.
  expect(lived.firstRevisitMaterialContactTick).not.toBeNull();
  expect(nullActor.firstRevisitMaterialContactTick).not.toBeNull();
  expect(Object.keys(lived.firstRevisitFrame).sort()).toEqual(['proprio','retina','tick','touch']);
 },120000);
});
