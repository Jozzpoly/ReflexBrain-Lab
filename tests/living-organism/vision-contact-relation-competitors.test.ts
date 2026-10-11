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
 lateral:number;targetX?:number;targetRadius?:number;
 historyEnabled?:boolean;
};
type PrivateSummary={
 tick:number;touch:number;touchSector:number;
 visible:number;maxExtent:number;forward:number;drive:number;
 lastSeenTick:number;maxPreEventExtent:number;recentGaps:number;
 displacementSinceFirst:number;retinaDigest:number;
 };
type Row={
 scenario:Scenario;actual:'target'|'decoy'|'none';
 hostTarget:boolean;hostDecoy:boolean;tick:number|null;
 distanceTarget:number;contactSectors:number[];
 lastPatchExtent:number;lastPatchAge:number;
 maxRecentExtentJump:number;
 maxPriorExtent:number;earlyVisible:boolean;
 sightGapBeforeContact:number;targetBearingAtContact:number|null;
 forwardSpeed:number;driveBefore:number;bodyTravel:number;
 summaries:PrivateSummary[];
 rules:{touch:boolean;forwardTouch:boolean;
   turquoiseVisible:boolean;continuity:boolean;
   nearPatch:boolean;progress:boolean;recentSmooth:boolean};
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
 const target=w.addObject(s.targetX??7,0,
  s.targetRadius??.62,[...colors.turquoise]);
 const decoy=w.addObject(-30,-30,.65,
  [...(s.color==='orange'?colors.orange:colors.turquoise)]);
 const actor=new ApproachEpisode(s.historyEnabled??true,true);
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
  const recent=samples.slice(-4).map(x=>x.maxExtent);
  const maxRecentExtentJump=recent.slice(1).reduce((v,x,i)=>
   Math.max(v,Math.abs(x-recent[i])),0);
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
   recentSmooth:!!exitTick&&maxRecentExtentJump<.15,
  };
  return {
   scenario:s,
   actual:collisionTarget?'target':collisionDecoy?'decoy':'none',
   hostTarget:collisionTarget,hostDecoy:collisionDecoy,tick:exitTick,
   distanceTarget,
   contactSectors:lastContactTouch,
   lastPatchExtent:last?.maxExtent??0,maxRecentExtentJump,
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
  'continuity','nearPatch','progress','recentSmooth'] as const;
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
   recentJump:+r.maxRecentExtentJump.toFixed(3),
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

 it('C3: tests variable-range true targets including a legitimate failed-to-reach control',()=>{
  const moreTrue=[3.3,4.2,5.1,6.4,8.2,9.4].flatMap(
   targetX=>[.45,.85].map(targetRadius=>analyze({
    label:'genuine-'+targetX+'-'+targetRadius,
    intervention:null,color:'orange',lateral:0,
    targetX,targetRadius,
   })));
  const decoys=CASES.slice(1).map(analyze);
  const controls=[...moreTrue,...decoys];
  const confusion=scores(controls);
  console.log('RB_VISION_C3_DISTANCE_RADIUS_HOLDOUT '+
   JSON.stringify({truth:moreTrue.map(x=>({
    id:x.scenario.label,actual:x.actual,tick:x.tick,
    targetGap:+x.distanceTarget.toFixed(3),
    extent:+x.lastPatchExtent.toFixed(3),
    travel:+x.bodyTravel.toFixed(3),
    rules:x.rules,
   })),confusion,
   falseContacts:decoys.filter(x=>x.actual==='decoy').length}));
  // A distant SMALL genuine target at 9.4m is abandoned/stalled by the
  // donor controller within this horizon despite lawful initial color.
  // Keep the negative rather than erasing it to force a positive result.
  expect(moreTrue.filter(r=>r.actual==='target').length).toBe(11);
  const failure=moreTrue.find(r=>r.scenario.targetX===9.4
    &&r.scenario.targetRadius===.45);
  expect(failure?.actual).toBe('none');
  expect(failure?.tick).toBeNull();
  expect(decoys.every(r=>r.actual==='decoy')).toBe(true);
  // This deliberately characterizes 12 legitimate contacts beyond
  // the original x=7m specimen, not a selected winner model.
 },90000);


 it('C5: challenges optical progress-history failure on a distant small true target with the simpler no-history motor',()=>{
  const basis={
   intervention:null,color:'orange' as const,lateral:0,
   targetX:9.4,targetRadius:.45,
  };
  const tracked=analyze({...basis,label:'long-small-visual-history',
   historyEnabled:true});
  const basic=analyze({...basis,label:'long-small-simple-follow',
   historyEnabled:false});
  console.log('RB_VISION_C5_FAR_SMALL_PROGRESS_APPLICABILITY '+
   JSON.stringify([tracked,basic].map(x=>({
    id:x.scenario.label,
    actual:x.actual,tick:x.tick,
    gapToTarget:x.distanceTarget,
    bodyTravel:x.bodyTravel,
    lastVisualExtent:x.lastPatchExtent,
    maxPreviousExtent:x.maxPriorExtent,
   }))));
  expect(tracked.actual).toBe('none');
  expect(tracked.tick).toBeNull();
  // Whether removing the learned-looking visual progress heuristic
  // saves actual completion is a new empirical question.
 },30000);


 it('C6: expose apparent visual-continuity win as a host-teleport artifact, not object identity',()=>{
  const rows=[...CASES.slice(1),...([3.3,4.2,5.1,6.4,8.2]
   .map(targetX=>({
    label:'true-smooth-'+targetX,intervention:null,
    color:'orange' as const,lateral:0,targetX,targetRadius:.62,
   })))].map(analyze);
  const thresholds=[.07,.1,.15,.25,.4,.7];
  const challenge=thresholds.map(threshold=>{
   const valid=rows.filter(r=>r.actual!=='none');
   return {threshold,
    trueAccepted:valid.filter(r=>r.actual==='target'
      &&r.maxRecentExtentJump<threshold).length,
    falseAccepted:valid.filter(r=>r.actual==='decoy'
      &&r.maxRecentExtentJump<threshold).length,
    trueTotal:valid.filter(r=>r.actual==='target').length,
    falseTotal:valid.filter(r=>r.actual==='decoy').length,
   };
  });
  console.log('RB_VISION_C6_RETINA_CHANGE_HEURISTIC '+JSON.stringify({
   challenge,
   samples:rows.map(r=>({id:r.scenario.label,
    host:r.actual,tick:r.tick,
    maxRecentJump:+r.maxRecentExtentJump.toFixed(4)})),
  }));
  expect(rows.some(r=>r.actual==='target')).toBe(true);
  expect(rows.some(r=>r.actual==='decoy')).toBe(true);
  // The C4 lookalike-swap result on the SAME PR proves that if a physical
  // permutation creates identical complete private traces, no detector
  // based on such recent jumps can tell which handle was touched.
 },60000);

});
