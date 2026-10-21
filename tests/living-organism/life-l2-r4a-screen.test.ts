import {beforeAll,describe,expect,it} from 'vitest';
import {initLivingWorld} from '../../src/living-organism/world';
import {runR4aScreen} from '../../src/living-organism/life-l2-r4a-screen';
beforeAll(initLivingWorld);
describe('R4a OPEN shell: does independent ordinary material preserve late resident exposure?',()=>{
 it('freezes a four-arm factual comparison of true private exposure and physical contact',()=>{
  const baseline=runR4aScreen('r3-original','adaptive');
  const shell=runR4aScreen('shell-dynamic','adaptive');
  const nullWorld=runR4aScreen('shell-static','adaptive');
  const blind=runR4aScreen('shell-dynamic','blind');
  console.log('RB_L2_R4A_WORLD_SCREEN '+JSON.stringify({baseline,shell,nullWorld,blind}));
  for(const arm of [baseline,shell,nullWorld,blind]){
   expect(arm.ticks).toBe(14400);
   expect(arm.privateFrames).toBeGreaterThanOrEqual(3600);
   expect(arm.windows).toHaveLength(4);
   expect(arm.windows.every(w=>w.privateFrames>=899)).toBe(true);
   expect(arm.physicsSnapshotBytes).toBeGreaterThan(100);
  }
  const last=shell.windows.slice(2);
  const lateContacts=last.reduce((s,w)=>s+w.privateTouchFrames,0);
  // This was pre-armed as a SCIENTIFIC pressure gate. If failing, archive
  // exact evidence and convert later to a NEGATIVE regression, no retuning.
  expect(last.every(w=>w.nonemptyRetinaFrames>=30)).toBe(true);
  expect(lateContacts).toBeGreaterThanOrEqual(1);
  // An autonomous world process must do more than change its own shaft.
  expect(shell.worldMaterialMovement).toBeGreaterThan(nullWorld.worldMaterialMovement);
 },240000);
});
