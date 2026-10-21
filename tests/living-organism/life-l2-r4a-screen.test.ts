import {beforeAll,describe,expect,it} from 'vitest';
import {initLivingWorld} from '../../src/living-organism/world';
import {runR4aScreen} from '../../src/living-organism/life-l2-r4a-screen';
beforeAll(initLivingWorld);
describe('R4a OPEN shell: does independent ordinary material preserve late resident exposure?',()=>{
 it('preserves R4a negative result: richer physical ecology alone does not sustain actor-relative activity',()=>{
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
  // Exact R4a SCIENTIFIC FAIL was originally executed (not silently fixed)
  // in Actions #39691414618. Preserve this as a source-negative regression.
  expect(last.every(w=>w.nonemptyRetinaFrames===0)).toBe(true);
  expect(lateContacts).toBe(0);
  expect(shell.windows.slice(1).every(w=>w.netOrdinaryMaterialMotion===0)).toBe(true);
  expect(shell.touchEpisodes).toBe(1);
  expect(shell.habitUpdates).toBe(2);
  expect(shell.finalHabit).toBeCloseTo(-.051,5);
  expect(shell.finalDistance).toBeGreaterThan(100);
  // The independent shaft displaced objects, but not the resident's path.
  expect(shell.windows.map(w=>[w.endActorX,w.endActorY])).toEqual(
   nullWorld.windows.map(w=>[w.endActorX,w.endActorY]));
  expect(blind.windows.slice(1).every(w=>w.nonemptyRetinaFrames===0)).toBe(true);
  // An autonomous world process must do more than change its own shaft.
  expect(shell.worldMaterialMovement).toBeGreaterThan(nullWorld.worldMaterialMovement);
 },240000);
});
