import {beforeAll,describe,expect,it} from 'vitest';
import {LivingWorld,initLivingWorld,type Demand,type PrivateFrame} from '../../src/living-organism/world';
import {ApproachEpisode} from '../../src/living-organism/approach-episode';
import {visibleTurquoisePatches} from '../../src/living-organism/retina-geometry';

/**
 * RB-VISION/C2: Can lawful appearance, temporal continuity and actual
 * actor-private motor/touch evidence tell "the earlier material activity
 * was completed" from "unrelated physical contact"?
 *
 * All classification features derive from actor-native 96*RGB, 8-sector
 * touch, own movement demand, velocity, and their timestamped history.
 * The physical World target/decoy handles are visible ONLY to host scoring.
 *
 * This deliberately characterizes fixed cheap rivals, NOT a trained
 * semantic reward system. Nonrandom physical geometries cannot justify
 * a universal success predicate.
 */
type Scenario={
 label:string;
 intervention:null|number;
 color:'orange'|'same-turquoise';
 lateral:number;
};
type PrivateSummary={
 tick:number;touch:number;touchSector:number;
 visible:number;maxExtent:number;forward:number;drive:number;
 lastSeenTick:number;maxPreEventExtent:number;recentGaps:number;
 displacementSinceFirst:number;retinaDigest:number;
 targetAtContact:boolean;
};
type Row={
 scenario:Scenario;actual:'target'|'decoy'|'none';
 hostTarget:boolean;hostDecoy:boolean;tick:number|null;
 distanceTarget:number;contactSectors:number[];
 lastPatchExtent:number;lastPatchAge:number;
 maxPriorExtent:number;earlyVisible:boolean;
 sightGapBeforeContact:number;targetBearingAtContact:number|null;
 forwardSpeed:number;driveBefore:number;bodyTravel:number;
 summaries:PrivateSummary[];
 rules:{touch:boolean;forwardTouch:boolean;
   turquoiseVisible:boolean;continuity:boolean;
   nearPatch:boolean;progress:boolean};
};
const colors={turquoise:[.1,.85,.8] as [number,number,number],
 orange:[.9,.55,.13] as [number,number,number]};
const STILL:Demand={drive:0,turn:0,gazeRate:0};
const POSITIONS=[80,160,300,420,468];
const CASES:Scenario[]=[
 {label:'true-target',intervention:null,color:'orange',lateral:0},
 ...POSITIONS.flatMap(intervention=>
  (['orange','same-turquoise'] as const).flatMap(color=>
   [-.32,.32].map(lateral=>({
    label:color+'-'+intervention+'-'+lateral,
    intervention,color,lateral,
   })))),
];
function maxPatch(frame:PrivateFrame):{extent:number,bearing:number}|null{
 const p=visibleTurquoisePatches(frame.retina)
  .filter(x=>!x.clipped)
  .sort((a,b)=>b.extent-a.extent)[0];
 return p?{extent:p.extent,bearing:p.bearing}:null;
}
function digest(f:PrivateFrame):number{
 let n=2166136261;
 for(let i=0;i<f.retina.length;i++){
  n^=Math.round(f.retina[i]*1000);n=Math.imul(n,16777619);
 }
 return n>>>0;
}
function analyze(s:Scenario):Row{
 const w=new LivingWorld(false);
 const target=w.addObject(7,0,.62,[...colors.turquoise]);
 const decoy=w.addObject(-30,-30,.65,
  [...(s.color==='orange'?colors.orange:colors.turquoise)]);
 const actor=new ApproachEpisode(true,true);
 let cmd:Demand=STILL,lastTick=-1,lastSeen=-1,lastPatch=0,
  prevDrive=0,travel=0,earlyVisible=false;
 let firstSeen=-1,maximumExtent=0;
 let collisionTarget=false,collisionDecoy=false;
 let exitTick:number|null=null;
 let lastContactTouch:number[]=[];
 const samples:PrivateSummary[]=[];
 let prev=w.inspect().actor;
 try{
  for(let t=0;t<900;t++){
   if(t===s.intervention){
    const a=w.inspect().actor;
    w.moveObject(decoy,a.x+1.45,a.y+s.lateral);
   }
   const f=w.observe();
   if(f.tick!==lastTick){
    lastTick=f.tick;
    const patch=maxPatch(f);
    if(patch){
     lastSeen=f.tick;lastPatch=patch.extent;
     maximumExtent=Math.max(maximumExtent,patch.extent);
     if(firstSeen<0)firstSeen=f.tick;
     if(f.tick<80)earlyVisible=true;
    }
    const touch=Math.max(...f.touch);
    if(touch>0)lastContactTouch=Array.from(f.touch);
    samples.push({
     tick:f.tick,touch,touchSector:f.touch.indexOf(touch),
     visible:patch?1:0,maxExtent:patch?.extent??0,
     forward:f.proprio.forward,drive:cmd.drive,
     lastSeenTick:lastSeen,maxPreEventExtent:maximumExtent,
     recentGaps:lastSeen<0?Infinity:f.tick-lastSeen,
     displacementSinceFirst:travel,retinaDigest:digest(f),
     targetAtContact:false, // host later attribution, not classifier input
    });
    prevDrive=cmd.drive;
    cmd=actor.decide(f);
   }
   w.step(cmd);
   const a=w.inspect().actor;
   travel+=Math.hypot(a.x-prev.x,a.y-prev.y);prev=a;
   if((t+1)%4===0){
    for(const event of w.inspectContactSample().contacts){
     if(event.impulse>.001){
      if(event.handle===target)collisionTarget=true;
      if(event.handle===decoy)collisionDecoy=true;
     }
    }
   }
   if(actor.capture().mode==='contact'){
    exitTick=actor.capture().contactTick;break;
   }
  }
  const targetWorld=w.inspect().objects.find(o=>o.handle===target);
  if(!targetWorld)throw Error('C2 host target missing');
  const pos=w.inspect().actor;
  const distanceTarget=Math.hypot(pos.x-targetWorld.x,pos.y-targetWorld.y);
  const last=samples[samples.length-1];
  const visible=last?.visible===1;
  const nearPatch=visible&&last.maxExtent>.4;
  const gap=lastSeen<0?Infinity:(exitTick??w.observe().tick)-lastSeen;
  // Entire 'rules' object is computed solely from participant's
  // PrivateFrame sequence and the issued motor command.
  const rules={
   touch:!!exitTick,
   forwardTouch:!!exitTick&&last?.touchSector===4,
   turquoiseVisible:!!exitTick&&visible,
   continuity:!!exitTick&&gap<=4&&
    samples.slice(-4).filter(x=>x.visible).length>=3,
   nearPatch:!!exitTick&&nearPatch,
   progress:!!exitTick&&travel>4,
  };
  return {
   scenario:s,
   actual:collisionTarget?'target':collisionDecoy?'decoy':'none',
   hostTarget:collisionTarget,hostDecoy:collisionDecoy,tick:exitTick,
   distanceTarget,
   contactSectors:lastContactTouch,
   lastPatchExtent:last?.maxExtent??0,
   lastPatchAge:gap,maxPriorExtent:maximumExtent,
   earlyVisible,sightGapBeforeContact:gap,
   targetBearingAtContact:maxPatch(w.observe())?.bearing??null,
   forwardSpeed:last?.forward??0,driveBefore:prevDrive,
   bodyTravel:travel,summaries:samples.slice(-6),
   rules,
  };
 }finally{w.free();}
}
function scores(rows:Row[]){
 const keys=['touch','forwardTouch','turquoiseVisible',
  'continuity','nearPatch','progress'] as const;
 return keys.map(key=>{
  const tp=rows.filter(r=>r.actual==='target'&&r.rules[key]).length,
   fp=rows.filter(r=>r.actual==='decoy'&&r.rules[key]).length,
   fn=rows.filter(r=>r.actual==='target'&&!r.rules[key]).length,
   tn=rows.filter(r=>r.actual==='decoy'&&!r.rules[key]).length;
  return {key,TP:tp,FP:fp,FN:fn,TN:tn};
 });
}
beforeAll(initLivingWorld);
describe('RB-VISION/C2 lawful private relation to prior object vs incidental touch',()=>{
 it('physically profiles cheap sensory rules across decoy color, timing and side',()=>{
  const results=CASES.map(analyze);
  const out=results.map(r=>({
   id:r.scenario.label,tick:r.tick,
   host:r.actual,hostTarget:r.hostTarget,hostDecoy:r.hostDecoy,
   gap:+r.distanceTarget.toFixed(3),
   lastVisualExtent:+r.lastPatchExtent.toFixed(3),
   age:r.lastPatchAge,
   maxVisualExtent:+r.maxPriorExtent.toFixed(3),
   bodyTravel:+r.bodyTravel.toFixed(3),
   sector:r.contactSectors.indexOf(Math.max(...r.contactSectors)),
   rules:r.rules,
  }));
  console.log('RB_VISION_C2_PHYSICAL_TRACES '+JSON.stringify(out));
  console.log('RB_VISION_C2_SIMPLE_COMPETITORS '+JSON.stringify(scores(results)));
  expect(results.length).toBe(CASES.length);
  expect(results[0].actual).toBe('target');
  expect(results[0].tick).not.toBeNull();
  expect(results.slice(1).every(r=>r.actual==='decoy')).toBe(true);
  expect(results.every(r=>r.earlyVisible)).toBe(true);
  // Learned classifiers will be tested only if this adversarial physical
  // suite is executable, not because simple rules happen to fail.
 },90000);
});
