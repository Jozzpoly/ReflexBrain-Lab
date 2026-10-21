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
  expect(on.travel[2]).toBeGreaterThan(.2);
  expect(on.travel[3]).toBeGreaterThan(.2);
  expect(on.travel[2]+on.travel[3]).toBeGreaterThan(off.travel[2]+off.travel[3]+.2);
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
  expect(memory.lateRealContacts).toBeGreaterThan(0);
  expect(memory.binEye[2]).toBeGreaterThan(0);
  expect(memory.binEye[3]).toBeGreaterThan(0);
  // If the cheap rival is equivalent, there is NO extra evidence for history.
  expect(memory.lateRealContacts).toBeGreaterThan(reactive.lateRealContacts);
 },240000);

 it('isolates private locus history at an actual re-entry episode on identical living Rapier state',()=>{
  const a=new R5Runtime(true,'reentrant');
  const b=new R5Runtime(true,'reentrant');
  try{
   let captured=null as ReturnType<typeof a.capture>|null;
   for(let i=0;i<10000;i++){
    a.step();
    const s=a.resident.capture();
    if(s.control==='seek' && s.reentryFrames>3 &&
       a.world.observe().tick===s.lastTick &&
       s.lastExposureTick!==null){
     captured=a.capture();break;
    }
   }
   expect(captured).not.toBeNull();
   const cp=captured!;
   b.restore(cp);
   expect(b.world.inspect()).toEqual(a.world.inspect());
   expect(b.world.observe()).toEqual(a.world.observe());
   const amputated=b.resident.capture();
   amputated.lastExposureTick=null;
   b.resident.restore(amputated);
   for(let i=0;i<8;i++){a.step();b.step();}
   const retained=a.resident.capture();
   const erased=b.resident.capture();
   console.log('RB_L2_R5A_HISTORY_FORK '+JSON.stringify({
    at:cp.world.tick,
    anchor:{x:cp.resident.lastExposureX,y:cp.resident.lastExposureY,
     age:cp.world.tick-(cp.resident.lastExposureTick??0)},
    retained:{motor:retained.lastDemand,control:retained.control},
    erased:{motor:erased.lastDemand,control:erased.control},
    physicsA:a.world.inspect().actor,physicsB:b.world.inspect().actor
   }));
   expect(retained.lastDemand.turn).not.toBe(erased.lastDemand.turn);
   // Show actual solver divergence; narrow private causation, not utility.
   expect(a.world.inspect().actor).not.toEqual(b.world.inspect().actor);
  }finally{a.free();b.free();}
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
