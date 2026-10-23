import {beforeAll,describe,expect,it} from 'vitest';
import {initLivingWorld,LivingWorld,type PrivateFrame} from '../../src/living-organism/world';
import {DevResident} from '../../src/living-organism/dev-resident';
import {E0_RAPIER as R,e0PairImpulse} from '../../src/e0-body-seam';

beforeAll(initLivingWorld);
const PARTS=[
 [3.1,.2,.52,.55,'dynamic'],[5.2,-.6,.60,.60,'dynamic'],
 [4.2,2.5,1.15,.22,'dynamic'],[7.1,1.9,.22,1.15,'anchored'],
 [-2.4,2.3,.6,.55,'dynamic'],[-4.4,-1.8,1.15,.22,'anchored'],
 [1.1,-3.4,.22,1.15,'anchored']
] as const;
type Layout='A-yard'|'B-mirror';
type Version='adhesive'|'inert';
type Trace={world:LivingWorld;host:any;brain:DevResident;partHandles:number[];
 dynamicHandles:number[];joints:Map<number,{joint:any;joinedTick:number}>;
 firstBond:number|null;joined:number;broken:number;peak:number;configurations:Set<string>;
 path:number;last:{x:number;y:number};firstPrivateDivergence:number|null;
 privateFrames:number;contactFrames:number;sightFrames:number;touchFrames:number;
 lateDisplacedParts:number;stops:number;binPath:number[];binBonds:number[];
 binSeparations:number[]};
const p=(x:any)=>({x:x.x,y:x.y});
const local=(v:{x:number;y:number},a:{x:number;y:number},r:number)=>{
 const dx=v.x-a.x,dy=v.y-a.y,c=Math.cos(r),s=Math.sin(r);
 return {x:c*dx+s*dy,y:-s*dx+c*dy};
};
const diff=(a:PrivateFrame,b:PrivateFrame)=>{
 let d=Math.max(Math.abs(a.proprio.forward-b.proprio.forward),
  Math.abs(a.proprio.lateral-b.proprio.lateral),
  Math.abs(a.proprio.omega-b.proprio.omega));
 for(let i=0;i<a.touch.length;i++)d=Math.max(d,Math.abs(a.touch[i]-b.touch[i]));
 for(let i=0;i<a.retina.length;i++)d=Math.max(d,Math.abs(a.retina[i]-b.retina[i]));
 return d;
};
function build(layout:Layout,seed:number,version:Version):Trace{
 const world=new LivingWorld(false,'B0'),brain=new DevResident('random',seed),host=world as any;
 const ids:number[]=[],dynamic:number[]=[];
 for(const [x,y,hx,hy,mode] of PARTS){
  const handle=world.addMaterialPart(layout==='A-yard'?x:-x,layout==='A-yard'?y:y+.6,hx,hy,mode);
  ids.push(handle);
  if(mode==='dynamic'){
   dynamic.push(handle);
   host.world.getCollider(handle).parent().lockRotations(false,true);
  }
 }
 return {world,host,brain,partHandles:ids,dynamicHandles:dynamic,joints:new Map(),
  firstBond:null,joined:0,broken:0,peak:0,configurations:new Set(['none']),
  path:0,last:{x:0,y:0},firstPrivateDivergence:null,privateFrames:0,
  contactFrames:0,sightFrames:0,touchFrames:0,lateDisplacedParts:0,stops:0,
  binPath:[0,0,0,0],binBonds:[0,0,0,0],binSeparations:[0,0,0,0]};
}
function law(t:Trace,tick:number,version:Version){
 const {host,world}=t,raw=host.world,actor=host.actor;
 if(version!=='adhesive')return;
 for(const handle of t.dynamicHandles){
  if(t.joints.has(handle))continue;
  const impulse=e0PairImpulse(raw,actor.collider(0).handle,handle).impulse;
  if(impulse<=.001)continue;
  const part=raw.getCollider(handle).parent(),a=actor.translation(),b=part.translation();
  const ar=actor.rotation(),br=part.rotation();
  if(Math.hypot(a.x-b.x,a.y-b.y)>5)throw Error('contact reported from nonlocal body');
  const anchor={x:a.x+(b.x-a.x)*.72,y:a.y+(b.y-a.y)*.72};
  const joint=raw.createImpulseJoint(
   R.JointData.fixed(local(anchor,a,ar),0,local(anchor,b,br),ar-br),actor,part,true);
  joint.setContactsEnabled(false);
  t.joints.set(handle,{joint,joinedTick:tick});
  t.joined++;t.binBonds[Math.min(3,Math.floor((tick-1)/3600))]++;
  if(t.firstBond===null)t.firstBond=tick;
 }
 for(const [handle,entry] of t.joints){
  let impact=0;
  for(const other of t.partHandles){
   if(other===handle)continue;
   impact+=e0PairImpulse(raw,handle,other).impulse;
  }
  if(impact>4){
   raw.removeImpulseJoint(entry.joint,true);
   t.joints.delete(handle);
   t.broken++;t.binSeparations[Math.min(3,Math.floor((tick-1)/3600))]++;
  }
 }
 t.peak=Math.max(t.peak,t.joints.size);
 t.configurations.add(t.dynamicHandles.map(id=>t.joints.has(id)?'1':'0').join(''));
}
function run(layout:Layout,seed:number){
 const inert=build(layout,seed,'inert'),adhesive=build(layout,seed,'adhesive');
 let prefixGood=true,prefixFrames=0,firstPostContactDifference:number|null=null;
 const initially=adhesive.world.inspect().objects.map(o=>({handle:o.handle,x:o.x,y:o.y,mode:o.mode}));
 let inertLastPos=inert.world.inspect().actor,adhesiveLastPos=adhesive.world.inspect().actor;
 try{
  inert.world.observe();adhesive.world.observe();
  for(let tick=1;tick<=14400;tick++){
   for(const t of [inert,adhesive]){
    const demand=t.brain.decide(t.world.observe());
    t.world.step(demand);
    law(t,tick,t===adhesive?'adhesive':'inert');
    if(tick%120===0){
     const now=t.world.inspect().actor;
     const former=t===inert?inertLastPos:adhesiveLastPos;
     const distance=Math.hypot(now.x-former.x,now.y-former.y);
     t.path+=distance;t.binPath[Math.min(3,Math.floor((tick-1)/3600))]+=distance;
     if(distance<.04)t.stops++;
     if(t===inert)inertLastPos=now;else adhesiveLastPos=now;
    }
   }
   if(tick%4===0){
    const a=inert.world.observe(),b=adhesive.world.observe();
    const difference=diff(a,b);
    inert.privateFrames++;adhesive.privateFrames++;
    if(adhesive.firstBond===null){
     prefixFrames++;
     if(difference!==0)prefixGood=false;
    }else if(difference>1e-4&&firstPostContactDifference===null)
     firstPostContactDifference=tick;
    for(const [t,frame] of [[inert,a],[adhesive,b]] as const){
     if(Array.from(frame.retina).some(x=>Math.abs(x-.74)<1e-4))t.sightFrames++;
     if(Array.from(frame.touch).some(x=>x>.001))t.touchFrames++;
     const count=t.world.inspectContactSample().contacts.filter(x=>t.partHandles.includes(x.handle)).length;
     if(count)t.contactFrames++;
    }
   }
  }
  const aNow=adhesive.world.inspect(),iNow=inert.world.inspect();
  const moved=(t:Trace)=>{
   const state=t.world.inspect();
   return state.objects.filter(o=>o.mode==='dynamic'&&initially.some(z=>z.mode==='dynamic'&&
    Math.hypot((z.x===undefined?0:z.x)-o.x,z.y-o.y)>.20)).length;
  };
  const wrap=(t:Trace)=>({path:+t.path.toFixed(2),joined:t.joined,broken:t.broken,
    currentlyJoined:t.joints.size,peakJoined:t.peak,configurationCount:t.configurations.size,
    bodyAtEnd:{x:t.world.inspect().actor.x,y:t.world.inspect().actor.y},
    privateFrames:t.privateFrames,materialVisible:t.sightFrames,touchFrames:t.touchFrames,
    contactFrames:t.contactFrames,stalledSeconds:t.stops,
    movedParts:moved(t),binPath:t.binPath.map(x=>+x.toFixed(2)),binBonds:t.binBonds,
    binSeparations:t.binSeparations,maneuvers:t.brain.capture().chosen});
  const outcome={layout,seed:'0x'+seed.toString(16),stepsInert:iNow.tick,
   stepsAdhesive:aNow.tick,firstBondTick:adhesive.firstBond,prefixFrames,
   exactLegalPrefix:prefixGood,firstPrivateDivergence:firstPostContactDifference,
   inert:wrap(inert),adhesive:wrap(adhesive)};
  console.log('RB_R9D_OPEN_HISTORY '+JSON.stringify(outcome));
  expect(outcome.stepsInert).toBe(14400);
  expect(outcome.stepsAdhesive).toBe(14400);
  expect(outcome.inert.privateFrames).toBe(3600);
  expect(outcome.adhesive.privateFrames).toBe(3600);
  expect(prefixGood).toBe(true);
  expect(outcome.adhesive.joined).toBeGreaterThanOrEqual(outcome.adhesive.broken);
  expect(outcome.adhesive.peakJoined).toBeLessThanOrEqual(4);
  expect(Number.isFinite(outcome.adhesive.path)).toBe(true);
  return outcome;
 }finally{inert.world.free();adhesive.world.free();}
}
const cases=(['A-yard','B-mirror'] as const).flatMap(layout=>
 [0x51babe,0x31415926].map(seed=>({layout,seed})));
describe('R9D open-yard 120s spontaneous actor-material coupling vs same-seed inert control',()=>{
 it.each(cases)('$layout seed $seed',({layout,seed})=>{run(layout,seed);},180000);
});
