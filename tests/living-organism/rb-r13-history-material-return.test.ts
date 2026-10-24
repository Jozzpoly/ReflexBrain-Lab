import {beforeAll,describe,expect,it} from 'vitest';
import {initLivingWorld,LivingWorld,type Demand} from '../../src/living-organism/world';
import {DevResident,type DevMode,type DevState} from '../../src/living-organism/dev-resident';
import {Occupant} from '../../src/living-organism/occupant';

const PARTS=[
 [3.1,.2,.52,.55,'dynamic'],[5.2,-.6,.60,.60,'dynamic'],
 [4.2,2.5,1.15,.22,'dynamic'],[7.1,1.9,.22,1.15,'anchored'],
 [-2.4,2.3,.6,.55,'dynamic'],[-4.4,-1.8,1.15,.22,'anchored'],
 [1.1,-3.4,.22,1.15,'anchored']
] as const;
const ZERO:Demand={drive:0,turn:0,gazeRate:0};
type Controller='occupant'|'adaptive'|'frozen'|'random'|'null';
const TICKS=14400, FORK=3600;
const finite=(x:number)=>Number.isFinite(x);

function createWorld(){
 const w=new LivingWorld(false,'B0');
 for(const p of PARTS)w.addMaterialPart(p[0],p[1],p[2],p[3],p[4]);
 return w;
}
function descriptors(w:LivingWorld){
 return w.inspect().objects.filter(o=>o.kind==='part')
 .map(o=>({handle:o.handle,mode:o.mode,x:o.x,y:o.y}));
}
type Initial=ReturnType<typeof descriptors>;
class HostTrace {
 private last=new Map<number,number>();
 private histories=new Set<number>();
 readonly events:{handle:number;tick:number;episode:boolean;returnToChanged:boolean;dynamic:boolean;at:{x:number;y:number};priorDisplacement:number}[]=[];
 private contactFrames=0;
 private frames=0;
 constructor(private initial:Initial,old?:HostTrace){
  if(old){this.last=new Map(old.last);this.histories=new Set(old.histories);}
 }
 sample(w:LivingWorld){
  const currentTick=w.inspect().tick;
  if(currentTick%4!==0)throw Error('not a 30 Hz private frame');
  this.frames++;
  const contacts=w.inspectContactSample().contacts;
  const byHandle=new Map(w.inspect().objects.filter(o=>o.kind==='part').map(o=>[o.handle,o]));
  const unique=new Set<number>();
  for(const c of contacts)if(this.initial.some(p=>p.handle===c.handle))unique.add(c.handle);
  if(unique.size>0)this.contactFrames++;
  for(const handle of unique){
   const last=this.last.get(handle),first= !this.histories.has(handle);
   const episode=last===undefined || currentTick-last>120;
   const origin=this.initial.find(p=>p.handle===handle)!;
   const object=byHandle.get(handle)!;
   const priorDisplacement=Math.hypot(object.x-origin.x,object.y-origin.y);
   if(episode)this.events.push({handle,tick:currentTick,episode,
    returnToChanged:!first && origin.mode==='dynamic' && priorDisplacement>.15,
    dynamic:origin.mode==='dynamic',at:{x:object.x,y:object.y},priorDisplacement});
   this.last.set(handle,currentTick);this.histories.add(handle);
  }
 }
 report(w:LivingWorld){
  const current=new Map(w.inspect().objects.filter(o=>o.kind==='part').map(o=>[o.handle,o]));
  const parts=this.initial.map(o=>{
   const p=current.get(o.handle)!;
   return {handle:o.handle,mode:o.mode,
    movedNet:Math.hypot(p.x-o.x,p.y-o.y)};
  });
  const returns=this.events.filter(e=>e.returnToChanged).map(e=>{
   const p=current.get(e.handle)!;
   return {tick:e.tick,handle:e.handle,
    priorDisplacement:e.priorDisplacement,
    furtherNetAfterContact:Math.hypot(p.x-e.at.x,p.y-e.at.y)};
  });
  return {physicsTick:w.inspect().tick,frames:this.frames,contactFrames:this.contactFrames,
   episodes:this.events.length,dynamicEpisodes:this.events.filter(e=>e.dynamic).length,
   returns,partsMoved:parts.filter(p=>p.movedNet>.15).length,
   dynamicNetShift:parts.filter(p=>p.mode==='dynamic').reduce((s,p)=>s+p.movedNet,0),
   actor:{x:w.inspect().actor.x,y:w.inspect().actor.y}};
 }
}

function advance(w:LivingWorld,brain:DevResident|Occupant|null,steps:number,trace:HostTrace){
 const checkpoints:{atTick:number;trace:ReturnType<HostTrace['report']>}[]=[];
 for(let k=0;k<steps;k++){
  const f=w.observe();
  const d:Demand=brain===null?ZERO:brain.decide(f);
  w.step(d);
  if(w.inspect().tick%4===0)trace.sample(w);
  if(w.inspect().tick%3600===0)checkpoints.push({atTick:w.inspect().tick,trace:trace.report(w)});
 }
 return checkpoints;
}

function makeBrain(kind:Controller){
 return kind==='occupant'?new Occupant():kind==='null'?null:new DevResident(kind,1183);
}
function forkedBrain(original:DevState,mode:DevMode|'ablated'){
 const own=structuredClone(original);
 if(mode==='ablated'){
  own.stats=own.stats.map(row=>row.map(()=>({sum:0,count:0})));
  own.learnedTrials=0;
 }else own.mode=mode;
 const brain=new DevResident(own.mode,1183);
 brain.restore(own);
 return brain;
}

describe('RB-R13: real altered matter versus actor private learning history',()=>{
 beforeAll(initLivingWorld);

 it('real 120s ordinary life: R8 Occupant versus O-DEV adaptive, frozen, random, no motor',()=>{
  const outputs=[];
  for(const mode of ['occupant','adaptive','frozen','random','null'] as Controller[]){
   const w=createWorld();
   try{
    const origin=descriptors(w),trace=new HostTrace(origin);
    const brain=makeBrain(mode);
    const checkpoints=advance(w,brain,TICKS,trace);
    const outcome=trace.report(w);
    outputs.push({mode,checkpoints,outcome,
     learnedTrials:brain instanceof DevResident?brain.capture().learnedTrials:0,
     chosen:brain instanceof DevResident?brain.capture().chosen:null});
    expect(outcome.physicsTick).toBe(TICKS);
    expect(outcome.frames).toBe(3600);
    expect(outcome.partsMoved).toBeGreaterThanOrEqual(0);
    expect(finite(outcome.dynamicNetShift)).toBe(true);
   }finally{w.free();}
  }
  expect(outputs).toHaveLength(5);
  // The initial R8 scene has no autonomous self-moving matter at rest.
  const idle=outputs.find(o=>o.mode==='null')!;
  expect(idle.outcome.partsMoved).toBe(0);
  console.log('RB_R13_FULL_120S '+JSON.stringify(outputs));
 },180000);

 it('physical + sensory matched private-history fork at exactly 30s',()=>{
  const source=createWorld();
  try{
   const origin=descriptors(source),pre=new HostTrace(origin);
   const resident=new DevResident('adaptive',1183);
   advance(source,resident,FORK,pre);
   const cp=source.captureCheckpoint();
   const original=resident.capture();
   expect(cp.tick).toBe(FORK);
   expect(original.learnedTrials).toBeGreaterThan(0);
   const forks=[];
   const forksBefore=[];
   for(const variant of ['intact','ablated','frozen','random'] as const){
    const w=new LivingWorld(false,'B0');
    try{
     w.restoreCheckpoint(cp);
     const seeded=forkedBrain(original,variant==='intact'?'adaptive':variant);
     const sample=w.observe();
     const start=w.captureCheckpoint();
     forksBefore.push({variant,bytes:start.physics,frame:sample,
       actor:w.inspect().actor,active:seeded.capture().active,
       learned:seeded.capture().learnedTrials});
     const trace=new HostTrace(origin,pre);
     const future=advance(w,seeded,FORK,trace);
     const end=trace.report(w);
     forks.push({variant,initialLearned:seeded.capture().learnedTrials, // after future; label corrected below
      first30s:pre.report(source),future,final:end,
      learnedAfter:seeded.capture().learnedTrials,chosenAfter:seeded.capture().chosen});
    }finally{w.free();}
   }
   for(const f of forksBefore.slice(1)){
    expect(f.bytes).toEqual(forksBefore[0].bytes);
    expect(f.frame).toEqual(forksBefore[0].frame);
    expect(f.actor).toEqual(forksBefore[0].actor);
    expect(f.active).toEqual(forksBefore[0].active);
   }
   // Derive first motor divergence from two fresh perfectly matching
   // descendants, without any world labels in the brain.
   const a=new LivingWorld(false,'B0'),b=new LivingWorld(false,'B0');
   try{
    a.restoreCheckpoint(cp);b.restoreCheckpoint(cp);
    const intact=forkedBrain(original,'adaptive');
    const ablated=forkedBrain(original,'ablated');
    let divergence:null|number=null,identicalPrivateSamples=0;
    for(let t=0;t<FORK;t++){
     const fa=a.observe(),fb=b.observe();
     if(divergence===null && a.inspect().tick%4===0){
      expect(fa).toEqual(fb);
      identicalPrivateSamples++;
     }
     const da=intact.decide(fa),db=ablated.decide(fb);
     if(divergence===null &&
       (Math.abs(da.drive-db.drive)+Math.abs(da.turn-db.turn)+Math.abs(da.gazeRate-db.gazeRate))>1e-9)
      divergence=fa.tick;
     a.step(da);b.step(db);
    }
    const ax=a.inspect().actor,bx=b.inspect().actor;
    const gap=Math.hypot(ax.x-bx.x,ax.y-bx.y);
    console.log('RB_R13_FORK_30_TO_60 '+JSON.stringify({
      freezeTick:FORK,originalLearned:original.learnedTrials,
      initialPrivateFramesMatched:true,originalPhysicalCheckpointMatched:true,
      firstMotorDivergenceTick:divergence,
      initialPrivateSamplesBeforeDivergence:identicalPrivateSamples,
      laterActorSeparation:gap,
      forks:forks.map(f=>({variant:f.variant,future:f.future,final:f.final,
        learnedAfter:f.learnedAfter,chosenAfter:f.chosenAfter}))}));
    expect(forks).toHaveLength(4);
    expect(forks.every(f=>f.final.physicsTick===7200&&f.final.frames===900)).toBe(true);
    expect(finite(gap)).toBe(true);
   }finally{a.free();b.free();}
  }finally{source.free();}
 },180000);
});
