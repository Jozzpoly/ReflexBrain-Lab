import {beforeAll,describe,expect,it} from 'vitest';
import {initLivingWorld,LivingWorld} from '../../src/living-organism/world';
import {SituatedResident} from '../../src/living-organism/life-l2-situated-resident';
import {SituatedRuntime} from '../../src/living-organism/life-l2-situated-runtime';

beforeAll(initLivingWorld);

function run(mode:'adaptive'|'frozen'|'blind',ticks:number){
 const rt=new SituatedRuntime(mode);let everContact=false,seen=0,lastSeen=-1;
 let firstMaterialMotion=0, maxActor=0, minActor=0;
 try{
  const initial=rt.world.inspect();
  for(let i=0;i<ticks;i++){
   rt.step();
   const f=rt.world.observe();
   if(f.tick!==lastSeen){lastSeen=f.tick;seen++;
    if(Array.from(f.touch).some(x=>x>.005))everContact=true;
   }
   if((i+1)%120===0){
    const w=rt.world.inspect();
    maxActor=Math.max(maxActor,w.actor.x);minActor=Math.min(minActor,w.actor.x);
   }
  }
  const w=rt.world.inspect(),s=rt.resident.capture();
  const startObjects=initial.objects.filter(x=>x.kind==='object');
  const motion=w.objects.filter(x=>x.kind==='object').map(x=>{
   const origin=startObjects.find(o=>o.handle===x.handle)!;
   return Math.hypot(x.x-origin.x,x.y-origin.y);
  });
  firstMaterialMotion=Math.max(...motion);
  return {w,s,seen,everContact,firstMaterialMotion,maxActor,minActor};
 }finally{rt.free();}
}
describe('L2/R3 new continuous situated resident, narrow sensorimotor history',()=>{
 it('real legal retina changes the direct motor without a color-ID or host goal',()=>{
  const leftWorld=new LivingWorld(false,'B1');
  const rightWorld=new LivingWorld(false,'B1');
  try{
   leftWorld.addWall(3,2,1.2,1.1,[.5,.55,.6]);
   rightWorld.addWall(3,-2,1.2,1.1,[.5,.55,.6]);
   const a=new SituatedResident('adaptive').decide(leftWorld.observe());
   const b=new SituatedResident('adaptive').decide(rightWorld.observe());
   console.log('RB_L2_R3_VISION '+JSON.stringify({a,b}));
   expect(a.turn).toBeLessThan(0);
   expect(b.turn).toBeGreaterThan(0);
   expect(a.drive).toBeGreaterThan(0);
   expect(b.drive).toBeGreaterThan(0);
   expect(Object.keys(leftWorld.observe()).sort()).toEqual(['proprio','retina','tick','touch']);
  }finally{leftWorld.free();rightWorld.free();}
 },30000);

 it('in a real empty Rapier World no-contact time alone never invents contact-derived habit',()=>{
  const w=new LivingWorld(false,'B1'),r=new SituatedResident('adaptive');
  try{
   let contacts=0;
   for(let i=0;i<3600;i++){
    const f=w.observe();
    if(Array.from(f.touch).some(x=>x>.005))contacts++;
    w.step(r.decide(f));
   }
   const s=r.capture();
   console.log('RB_L2_R3_NO_CONTACT '+JSON.stringify({contacts,habit:s.habit,
     updates:s.habitUpdates,episodes:s.touchEpisodes,frames:s.frames}));
   expect(contacts).toBe(0);
   expect(s.touchEpisodes).toBe(0);
   expect(s.habitUpdates).toBe(0);
   expect(s.habit).toBe(0);
  }finally{w.free();}
 },90000);

 it('actual material and private frames exert pressure; compare learning to blind and frozen controls',()=>{
  const a=run('adaptive',9600),f=run('frozen',9600),b=run('blind',9600);
  console.log('RB_L2_R3_CONTINUING '+JSON.stringify({
   adaptive:{actor:a.w.actor,habit:a.s.habit,updates:a.s.habitUpdates,
    contacts:a.s.touchEpisodes,retinal:a.s.retinalModulations,frames:a.s.frames,
    physicalMaterial:a.firstMaterialMotion,range:[a.minActor,a.maxActor]},
   frozen:{actor:f.w.actor,habit:f.s.habit,updates:f.s.habitUpdates,
    contacts:f.s.touchEpisodes,retinal:f.s.retinalModulations,frames:f.s.frames,
    physicalMaterial:f.firstMaterialMotion,range:[f.minActor,f.maxActor]},
   blind:{actor:b.w.actor,contacts:b.s.touchEpisodes,frames:b.s.frames,
    physicalMaterial:b.firstMaterialMotion,range:[b.minActor,b.maxActor]},
  }));
  expect(a.s.frames).toBeGreaterThanOrEqual(2400);
  expect(f.s.frames).toBeGreaterThanOrEqual(2400);
  expect(b.s.frames).toBeGreaterThanOrEqual(2400);
  expect(a.s.retinalModulations).toBeGreaterThan(0);
  expect(f.s.retinalModulations).toBeGreaterThan(0);
  expect(b.s.habit).toBe(0);
  expect(f.s.habit).toBe(0);
  expect(f.s.habitUpdates).toBe(0);
  expect(a.s.touchEpisodes).toBeGreaterThan(0);
  expect(a.s.habitUpdates).toBeGreaterThan(0);
 },180000);

 it('isolate private memory on precisely matched Rapier World checkpoint, not divergent trajectories',()=>{
  const worldA=new SituatedRuntime('adaptive'),worldB=new SituatedRuntime('adaptive');
  try{
   for(let i=0;i<9600;i++)worldA.step();
   const cp=worldA.capture();
   worldB.restore(cp);
   const ablated=worldB.resident.capture();
   ablated.habit=0;
   worldB.resident.restore(ablated);
   expect(worldA.world.inspect()).toEqual(worldB.world.inspect());
   expect(worldA.world.observe()).toEqual(worldB.world.observe());
   const before=worldA.resident.capture();
   worldA.step();worldB.step();
   const learned=worldA.resident.capture().lastDemand;
   const removed=worldB.resident.capture().lastDemand;
   console.log('RB_L2_R3_PRIVATE_ABLATION '+JSON.stringify({
    before:{habit:before.habit,updates:before.habitUpdates,
     lastTick:before.lastTick,visual:before.currentVisual},
    learned,removed,difference:{drive:learned.drive-removed.drive,
     turn:learned.turn-removed.turn},
    endPositions:{a:worldA.world.inspect().actor,b:worldB.world.inspect().actor}}));
   expect(Math.abs(before.habit)).toBeGreaterThan(.0001);
   expect(learned.turn).not.toBe(removed.turn);
  }finally{worldA.free();worldB.free();}
 },180000);

 it('exact same-world and private-state replay survives an intervening 15s extension',()=>{
  const rt=new SituatedRuntime('adaptive');
  try{
   for(let i=0;i<1177;i++)rt.step();
   const cp=rt.capture();
   const forward=()=>{
    for(let i=0;i<1800;i++)rt.step();
    const cp=rt.capture();
    return {physics:Array.from(cp.world.physics),private:cp.resident,
     frame:rt.world.observe(),body:rt.world.inspect()};
   };
   const one=forward();rt.restore(cp);const two=forward();
   expect(two).toEqual(one);
   console.log('RB_L2_R3_REPLAY '+JSON.stringify({
    forkTick:cp.world.tick,endTick:rt.world.inspect().tick,
    physicsBytes:cp.world.physics.length,privateFrames:two.private.frames}));
  }finally{rt.free();}
 },180000);
});

