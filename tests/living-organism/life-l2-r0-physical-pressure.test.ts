import {beforeAll,describe,expect,it} from 'vitest';
import {initLivingWorld} from '../../src/living-organism/world';
import {
 createL2R0World,runL2R0Pressure,runL2R0MotorProbe,
} from '../../src/living-organism/life-l2-pressure';

beforeAll(initLivingWorld);

describe('L2/R0: recurring physical opportunity and lawful experience (NOT organism)',()=>{
 it('R0 original fixture: high plate duty cycle changes loads but does NOT let the gate reclose (recorded NEGATIVE)',()=>{
  const dynamic=runL2R0Pressure(true);
  const staticWorld=runL2R0Pressure(false);
  console.log('RB_L2_R0_WORLD '+JSON.stringify({dynamic,staticWorld}));
  expect(dynamic.ticks).toBe(21600);
  expect(staticWorld.ticks).toBe(21600);
  expect(dynamic.totalOpenEntries).toBeGreaterThan(1);
  expect(dynamic.lateOpenEntries).toBeGreaterThan(0);
  expect(dynamic.lateClosedEntries).toBe(0); // Preserve frozen R0 scientific FAIL as regression
  expect(staticWorld.totalOpenEntries).toBe(0);
  expect(staticWorld.loadedTransitions).toBe(0);
  expect(staticWorld.lateOpenEntries).toBe(0);
  expect(dynamic.privateFrames).toBeGreaterThanOrEqual(5400);
  expect(staticWorld.privateFrames).toBeGreaterThanOrEqual(5400);
  expect(dynamic.nullFramesWithIllegalKeys).toBe(0);
  expect(staticWorld.nullFramesWithIllegalKeys).toBe(0);
  // This is lawful optical evidence, not an actor identifying a semantic gate.
  expect(dynamic.firstClosedGatePixels).toBeGreaterThan(0);
  expect(dynamic.firstOpenVsClosedRetinaChannelsChanged).not.toBeNull();
  expect(dynamic.firstOpenVsClosedRetinaChannelsChanged!).toBeGreaterThan(0);
  expect(Math.abs(dynamic.actorX)).toBeLessThan(.0001);
  expect(Math.abs(staticWorld.actorX)).toBeLessThan(.0001);
 },180000);

 it('R0b separate frozen excursion restores genuine recurring full gate closures after one minute',()=>{
  const live=runL2R0Pressure(true,21600,'R0b');
  const nullWorld=runL2R0Pressure(false,21600,'R0b');
  console.log('RB_L2_R0B_WORLD '+JSON.stringify({live,nullWorld}));
  expect(live.lateOpenEntries).toBeGreaterThan(0);
  expect(live.lateClosedEntries).toBeGreaterThan(0);
  expect(nullWorld.totalOpenEntries).toBe(0);
  expect(nullWorld.loadedTransitions).toBe(0);
  expect(live.firstOpenVsClosedRetinaChannelsChanged).not.toBeNull();
  expect(live.firstOpenVsClosedRetinaChannelsChanged!).toBeGreaterThan(0);
  expect(live.nullFramesWithIllegalKeys).toBe(0);
  expect(live.actorX).toBeCloseTo(0,5);
 },180000);

 it('identical constant motor is physically limited by a gate shut/opened by actual material',()=>{
  const shut=runL2R0MotorProbe(false);
  const held=runL2R0MotorProbe(true);
  console.log('RB_L2_R0_BODY_MOTOR '+JSON.stringify({shut,held}));
  expect(shut.startGateX).toBeLessThan(6.8);
  expect(held.startGateX).toBeGreaterThan(9.0);
  expect(shut.crossedNearPassage).toBe(false);
  expect(held.crossedNearPassage).toBe(true);
  expect(held.physicallyLoaded).toBe(true);
  expect(shut.privateFrames).toBeGreaterThan(400);
  expect(held.privateFrames).toBeGreaterThan(400);
 },120000);

 it('restores actual gate, rail, touch/retina and solver state under a dynamic fork',()=>{
  const s=createL2R0World(true),w=s.world;
  const ZERO={drive:0,turn:0,gazeRate:0};
  try{
   for(let i=0;i<713;i++)w.step(ZERO);
   const cp=w.captureCheckpoint();
   const run=()=>{for(let i=0;i<513;i++)w.step(ZERO);
    return {physics:Array.from(w.captureCheckpoint().physics),
     host:w.inspect(),gate:w.inspectGateLink(),privateFrame:w.observe()};};
   const uninterrupted=run();
   w.restoreCheckpoint(cp);
   const resumed=run();
   expect(resumed).toEqual(uninterrupted);
   expect(resumed.privateFrame.tick).toBe(1224);
   expect(Object.keys(resumed.privateFrame).sort()).toEqual(['proprio','retina','tick','touch']);
  }finally{w.free();}
 },60000);
});
