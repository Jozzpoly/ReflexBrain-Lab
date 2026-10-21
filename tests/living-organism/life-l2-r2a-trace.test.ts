import {beforeAll,describe,expect,it} from 'vitest';
import {initLivingWorld} from '../../src/living-organism/world';
import {runR2aHistory,runR2aReencounter,runR2aReplay} from '../../src/living-organism/life-l2-trace';

beforeAll(initLivingWorld);
const numDifferent=(a:Float32Array,b:Float32Array)=>
 Array.from(a).reduce((n,v,i)=>n+Number(v!==b[i]),0);

describe('L2/R2a durable material consequence — engineering only, no organism',()=>{
 it('a real actor leaves a measurable loose-material trace after 30s idle; same World without actor demand does not',()=>{
  const driven=runR2aHistory('forward');
  const nullActor=runR2aHistory('zero');
  console.log('RB_L2_R2A_TRACE '+JSON.stringify({
   driven:{afterAction:driven.afterAction,afterWait:driven.afterWait,
    actionMovement:driven.actionMovement,residual:driven.lateResidualFromStart,
    extraAfterDrive:driven.lateExtraMovement,tick:driven.finalCheckpoint.tick},
   null:{afterAction:nullActor.afterAction,afterWait:nullActor.afterWait,
    actionMovement:nullActor.actionMovement,residual:nullActor.lateResidualFromStart,
    tick:nullActor.finalCheckpoint.tick},
  }));
  expect(driven.finalCheckpoint.tick).toBe(4080);
  expect(nullActor.finalCheckpoint.tick).toBe(4080);
  expect(driven.actionMovement).toBeGreaterThan(.5);
  expect(driven.lateResidualFromStart).toBeGreaterThan(.5);
  expect(nullActor.actionMovement).toBeLessThan(.05);
  expect(nullActor.lateResidualFromStart).toBeLessThan(.05);
  // This is physical persistence, NOT "the actor remembers what it did".
  expect(driven.finalCheckpoint.surfaces.length).toBe(nullActor.finalCheckpoint.surfaces.length);
 },120000);

 it('a fresh same-body witness in the physically derived World afterstate experiences a different ordinary encounter under identical blind forward demand',()=>{
  const driven=runR2aHistory('forward');
  const nullActor=runR2aHistory('zero');
  const later=runR2aReencounter(driven.afterWait);
  const original=runR2aReencounter(nullActor.afterWait);
  const eyeDiff=numDifferent(later.initialLegalFrame.retina,original.initialLegalFrame.retina);
  console.log('RB_L2_R2A_REENCOUNTER '+JSON.stringify({
   livedWorldPos:driven.afterWait,freshWorldPos:nullActor.afterWait,
   livedContact:later.firstMaterialContactTick,
   freshContact:original.firstMaterialContactTick,
   livedPrivateTouch:later.firstPrivateTouchTick,
   freshPrivateTouch:original.firstPrivateTouchTick,
   eyeDiff,liveMaxX:later.maxActorX,freshMaxX:original.maxActorX,
  }));
  expect(original.firstMaterialContactTick).not.toBeNull();
  expect(eyeDiff).toBeGreaterThan(0);
  expect(later.firstMaterialContactTick===null ||
    later.firstMaterialContactTick!>original.firstMaterialContactTick!).toBe(true);
  // No other private fields, no host target identification in motor.
  expect(Object.keys(later.initialLegalFrame).sort()).toEqual(['proprio','retina','tick','touch']);
  expect(Object.keys(original.initialLegalFrame).sort()).toEqual(['proprio','retina','tick','touch']);
 },120000);

 it('full physical state plus private observation extends identically after a checkpoint fork',()=>{
  const r=runR2aReplay();
  console.log('RB_L2_R2A_REPLAY '+JSON.stringify(r));
  expect(r.matched).toBe(true);
  expect(r.checkpointTick).toBe(480);
  expect(r.physicsBytes).toBeGreaterThan(100);
 },90000);
});
