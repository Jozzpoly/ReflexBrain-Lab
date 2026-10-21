import {beforeAll,describe,expect,it} from 'vitest';
import {initLivingWorld} from '../../src/living-organism/world';
import {observeR5Site,observeR5Resident,R5Runtime} from '../../src/living-organism/life-l2-r5a-site';

beforeAll(initLivingWorld);
describe('L2/R5a independently renewed material ↔ private re-entry (authored, not life)',()=>{
 it('independent real physical ordinary matter renews after 30s, unlike no-rail matched World',()=>{
  const on=observeR5Site(true);
  const off=observeR5Site(false);
  console.log('RB_L2_R5A_WORLD '+JSON.stringify({on,off}));
  expect(on.ticks).toBe(14400);
  expect(off.ticks).toBe(14400);
  expect(on.screenedFrames).toBeGreaterThanOrEqual(3600);
  expect(off.screenedFrames).toBeGreaterThanOrEqual(3600);
  // Pre-frozen scientific necessity. A powered shaft without renewed loose
  // material after first window is NO ecology qualification.
  // ORIGINAL optimistic science FAILED at GitHub Actions #39693791089.
  // Motor moved material ONCE, but not after 30 s. No ecological renewal.
  expect(on.travel[0]).toBeGreaterThan(4);
  expect(on.travel.slice(1)).toEqual([0,0,0]);
  expect(off.travel).toEqual([0,0,0,0]);
 },180000);

 it('compares own embodied, lawful 96RGB re-entry practice against reactive and blind rivals',()=>{
  const memory=observeR5Resident(true,'reentrant');
  const reactive=observeR5Resident(true,'reactive');
  const blind=observeR5Resident(true,'blind');
  const noPower=observeR5Resident(false,'reentrant');
  console.log('RB_L2_R5A_ACTORS '+JSON.stringify({
   memory,reactive,blind,noPower
  }));
  for(const a of [memory,reactive,blind,noPower]){
   expect(a.ticks).toBe(14400);
   expect(a.checkpointBytes).toBeGreaterThan(100);
   expect(a.state.frames).toBeGreaterThan(3500);
  }
  // A late real ordinary collider contact, not motion/pixels alone.
  // VISION SUFFICIENCY IS FALSE. Many rays see material, no late touch.
  expect(memory.binEye[2]).toBeGreaterThan(0);
  expect(memory.binEye[3]).toBeGreaterThan(0);
  expect(memory.lateRealContacts).toBe(0);
  expect(reactive.lateRealContacts).toBe(0);
  expect(memory.binTouch).toEqual([0,0,0,0]);
  expect(memory.state.reentryFrames).toBe(0);
  expect(memory.lastActor).toEqual(reactive.lastActor);
  expect(memory.binEye).toEqual(reactive.binEye);
  expect(memory.state.lastDemand).toEqual(reactive.state.lastDemand);
  expect(blind.state.contactEpisodes).toBeGreaterThan(0);
  expect(blind.lateRealContacts).toBe(0);
 },240000);

 it('R5a NEGATIVE: the return-state never activates in 10000 true motor ticks',()=>{
  const a=new R5Runtime(true,'reentrant');
  try{
   let captured=null as ReturnType<typeof a.capture>|null;
   for(let i=0;i<10000;i++){
    a.step();
    const state=a.resident.capture();
    if(state.control==='seek' && state.reentryFrames>3 &&
       a.world.observe().tick===state.lastTick &&
       state.lastExposureTick!==null){
     captured=a.capture();break;
    }
   }
   const state=a.resident.capture();
   console.log('RB_L2_R5A_HISTORY_FORK_UNREACHABLE '+JSON.stringify({
    memoryEpisodeReached:captured!==null,
    reentryFrames:state.reentryFrames,
    visualFrames:state.visualFrames,
    finalControl:state.control,
    finalTick:a.world.inspect().tick
   }));
   // No legal matched World/private-history fork can be claimed if the
   // proposed private behavior never occurred in actual physical life.
   expect(captured).toBeNull();
   expect(state.reentryFrames).toBe(0);
  }finally{a.free();}
 },140000);

 it('replays exactly same World AND actual private exposure-history snapshot',()=>{
  const rt=new R5Runtime(true,'reentrant');
  try{
   for(let i=0;i<817;i++)rt.step();
   const cp=rt.capture();
   const advance=()=>{
    for(let i=0;i<1230;i++)rt.step();
    const n=rt.capture();
    return {world:Array.from(n.world.physics),worldHost:rt.world.inspect(),
     resident:n.resident,frame:rt.world.observe()};
   };
   const first=advance();
   rt.restore(cp);
   const second=advance();
   expect(second).toEqual(first);
  }finally{rt.free();}
 },90000);
});
