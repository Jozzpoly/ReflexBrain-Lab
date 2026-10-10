import {beforeAll,describe,expect,it} from 'vitest';
import {LivingWorld,initLivingWorld,type PrivateFrame,type Demand} from '../../src/living-organism/world';
import {ApproachEpisode} from '../../src/living-organism/approach-episode';
import {visibleTurquoisePatches} from '../../src/living-organism/retina-geometry';

/**
 * RB-VISION/B1: active looking during an EXISTING continuing activity.
 *
 * Existing ApproachEpisode is a real motor/contact controller, not a learned
 * motive. It starts naturally upon a lawful turquoise RGB patch, tracks
 * progress through own proprioception, and ends on private touch. This test
 * changes ONLY eye steering. Its helper retains private eye/history data,
 * never World object IDs/XY, host time-of-relocation flags or cost labels.
 *
 * Independent host moves the originally viewed material target behind the
 * actor while no new eye observation has yet arrived. This tests whether
 * a history-conditioned visual search has material value over innate no-scan
 * and always-scan baselines, while paying an opportunity cost in gaze travel
 * and occasional unrelated orange peripheral flashes.
 *
 * Every controller receives the SAME native 96 RGB rays / 30Hz, body motor
 * and 120Hz Rapier physics; no special directed-ray sidecar is used here.
 */
type Policy='native'|'always-sweep'|'history-scan'|'history-freeze';
type Relocation='left-rear'|'right-rear'|'stationary'|'no-history-left'|'no-history-right'|'world-mover';
type Result={
 policy:Policy;relocation:Relocation;duration:number;
 sawInitial:boolean;memoryActiveAfterRelocation:boolean;
 firstLostTick:number|null;
 targetReacquiredTick:number|null;contactTick:number|null;
 turquoiseFrames:number;orangePeripheralFrames:number;
 effort:number;distance:number;touchEpisodes:number;
 contactImpulse:number;final:[number,number];finalMode:string;
 gazeExtremes:[number,number];searchingFrames:number;
};
const TOTAL=4800,RELOCATE=160,ORANGE_START=740,ORANGE_END=780;
const clamp=(v:number)=>Math.max(-1,Math.min(1,v));
const wrap=(v:number)=>Math.atan2(Math.sin(v),Math.cos(v));
function hasOrange(f:PrivateFrame){
 for(let i=0;i<96;i++){
  const j=i*3,v=f.retina;
  if(Math.abs(v[j]-.87)<.04&&Math.abs(v[j+1]-.51)<.04
     &&Math.abs(v[j+2]-.16)<.04)return true;
 }
 return false;
}
class PrivateAttention {
 private lastTick:number|null=null;
 private heading=0;
 private lastTargetDirection:number|null=null;
 private lastSeen:number|null=null;
 private lossStart:number|null=null;
 private direction=1;
 searchingFrames=0;
 constructor(private readonly policy:Policy){}
 decide(f:PrivateFrame,baseline:Demand):Demand {
  if(this.lastTick===f.tick)return baseline;
  const dt=this.lastTick===null?0:(f.tick-this.lastTick)/120;
  this.heading=wrap(this.heading+f.proprio.omega*dt);
  this.lastTick=f.tick;
  const patch=visibleTurquoisePatches(f.retina)
   .filter(p=>!p.clipped)
   .sort((a,b)=>b.extent-a.extent)[0];
  if(patch){
   this.lastTargetDirection=wrap(this.heading+
    f.proprio.gaze+patch.bearing);
   this.lastSeen=f.tick;
   this.lossStart=null;
   if(this.policy==='native')return baseline;
   // The same cheap visible centering is used by every scan competitor.
   return {...baseline,gazeRate:clamp(patch.bearing*2)};
  }
  if(this.policy==='native')return baseline;
  if(this.policy==='always-sweep'){
   this.searchingFrames++;
   return {...baseline,gazeRate:this.sweep(f)};
  }
  if(this.lastSeen===null||f.tick-this.lastSeen>2600)
   return baseline; // no owned previously-seen visual relation
  this.searchingFrames++;
  this.lossStart??=f.tick;
  if(this.policy==='history-freeze'){
   // Strong stale-history challenger: re-look where the patch USED TO be,
   // without asking whether changed World still supports it.
   const bearing=wrap(this.lastTargetDirection!-this.heading);
   return {...baseline,gazeRate:clamp(
    wrap(bearing-f.proprio.gaze)*2)};
  }
  // First recheck the last actor-private remembered direction, THEN
  // expand sampling alternately. No host target position or movement time.
  const elapsed=f.tick-this.lossStart;
  if(elapsed<80){
   const bearing=wrap(this.lastTargetDirection!-this.heading);
   return {...baseline,gazeRate:clamp(
    wrap(bearing-f.proprio.gaze)*2)};
  }
  return {...baseline,gazeRate:this.sweep(f)};
 }
 private sweep(f:PrivateFrame):number{
  // A bounded endogenous eye motor oscillator: reversal at lawful
  // proprioceptive gaze limits, not World time/event triggers.
  if(f.proprio.gaze>1.48)this.direction=-1;
  if(f.proprio.gaze< -1.48)this.direction=1;
  return this.direction*.95;
 }
 hasHistory(){return this.lastSeen!==null;}
}
function run(policy:Policy,relocation:Relocation):Result{
 const w=new LivingWorld(false);
 const noHistory=relocation.startsWith('no-history');
 const firstSide=relocation.endsWith('left')?1:-1;
 const target=w.addObject(noHistory?-3:7,
  noHistory?firstSide*5:0,.62,[.1,.85,.8]);
 const orange=w.addObject(-30,-30,.65,[.87,.51,.16]);
 if(relocation==='world-mover'){
  // Real independent World-powered finite mover; force ownership is World,
  // never the eye/controller. No relocation clock during this arm.
  const cp=w.captureCheckpoint();
  cp.mover={handle:target,direction:-1};
  w.restoreCheckpoint(cp);
 }
 const c=new ApproachEpisode(true,true);
 const attention=new PrivateAttention(policy);
 let lastSample=-1,seenAtStart=false,memoryAfter=false,
  reacquiredTick:number|null=null,firstLostTick:number|null=null,
  orangePeripheralFrames=0,
  turquoiseFrames=0,effort=0,distance=0,contactImpulse=0,
  touchEpisodes=0,lastTouch=false,searchingFrames=0;
 let prev=w.inspect().actor;
 let lower=0,upper=0;
 let previousDemand:Demand={drive:0,turn:0,gazeRate:0};
 try{
  for(let t=0;t<TOTAL;t++){
   // World change is unrelated to the eye-controller's internal clock.
   if(t===RELOCATE && (relocation==='left-rear'||relocation==='right-rear')){
    const side=relocation==='left-rear'?1:-1;
    w.moveObject(target,-3,side*5);
   }
   if(t===ORANGE_START)w.moveObject(orange,3,-5.5);
   if(t===ORANGE_END)w.moveObject(orange,-30,-30);
   const f=w.observe();
   if(f.tick!==lastSample){
    lastSample=f.tick;
    const visible=visibleTurquoisePatches(f.retina)
      .some(p=>!p.clipped);
    if(t<RELOCATE && visible)seenAtStart=true;
    if(t>=RELOCATE+4 && !visible&&firstLostTick===null)
      firstLostTick=f.tick;
    if(t>=RELOCATE+4&&visible&&firstLostTick!==null
       &&reacquiredTick===null)reacquiredTick=f.tick;
    if(visible)turquoiseFrames++;
    if(hasOrange(f))orangePeripheralFrames++;
    const touch=f.touch.some(value=>value>.001);
    if(touch&&!lastTouch)touchEpisodes++;
    lastTouch=touch;
    lower=Math.min(lower,f.proprio.gaze);
    upper=Math.max(upper,f.proprio.gaze);
    previousDemand=attention.decide(f,c.decide(f));
    if(t===RELOCATE)memoryAfter=attention.hasHistory();
    searchingFrames=attention.searchingFrames;
   }
   const gazeBefore=f.proprio.gaze;
   w.step(previousDemand);
   const now=w.inspect().actor;
   distance+=Math.hypot(now.x-prev.x,now.y-prev.y);
   prev=now;
   effort+=Math.abs(previousDemand.gazeRate)/120;
   if(t%4===3)contactImpulse+=w.inspectContactSample().contacts
     .reduce((acc,event)=>acc+event.impulse,0);
   if(c.capture().mode==='contact')break;
  }
  return {
   policy,relocation,duration:w.observe().tick,
   sawInitial:seenAtStart,memoryActiveAfterRelocation:memoryAfter,
   firstLostTick,
   targetReacquiredTick:reacquiredTick,contactTick:c.capture().contactTick,
   turquoiseFrames,orangePeripheralFrames,effort,distance,
   touchEpisodes,contactImpulse,
   final:[w.inspect().actor.x,w.inspect().actor.y],
   finalMode:c.capture().mode,gazeExtremes:[lower,upper],
   searchingFrames,
  };
 }finally{w.free();}
}
function summarise(outcomes:Result[]){
 return outcomes.map(x=>({
  policy:x.policy,relocation:x.relocation,
  initial:x.sawInitial,hadHistory:x.memoryActiveAfterRelocation,
  lost:x.firstLostTick,
  reacquired:x.targetReacquiredTick,contact:x.contactTick,
  duration:x.duration,seen:x.turquoiseFrames,orange:x.orangePeripheralFrames,
  gazeEffort:+x.effort.toFixed(3),
  searchFrames:x.searchingFrames,
  displacement:+x.distance.toFixed(3),
  episodes:x.touchEpisodes,impulse:+x.contactImpulse.toFixed(3),
  mode:x.finalMode,final:x.final.map(v=>+v.toFixed(2)),
  eyeLimits:x.gazeExtremes.map(v=>+v.toFixed(2)),
 }));
}
beforeAll(initLivingWorld);
describe('RB-VISION/B1 real continuing approach activity with optional actor-private visual search',()=>{
 it('compares material outcomes in 3 actual World continuations, at equal native RGB budget',()=>{
  const policies:Policy[]=['native','always-sweep',
   'history-scan','history-freeze'];
  const relocations:Relocation[]=[
   'stationary','left-rear','right-rear'];
  const outcomes=relocations.flatMap(relocation=>
   policies.map(policy=>run(policy,relocation)));
  expect(outcomes.every(x=>x.sawInitial)).toBe(true);
  expect(outcomes.filter(x=>x.relocation!=='stationary')
   .every(x=>x.firstLostTick!==null)).toBe(true);
  expect(outcomes.every(x=>x.memoryActiveAfterRelocation)).toBe(true);
  expect(outcomes.every(x=>x.duration>160)).toBe(true);
  expect(outcomes.every(x=>Number.isFinite(x.distance)
    &&Number.isFinite(x.contactImpulse))).toBe(true);
  expect(outcomes.every(x=>x.touchEpisodes>=0)).toBe(true);
  console.log('RB_VISION_B1_CONTINUING '+JSON.stringify(summarise(outcomes)));
  // This is characterization, not a cherry-picked winner contract.
 },120000);
 it('checks attention itself depends on actor-private previous observation, not the World label',()=>{
  const noHistory=new PrivateAttention('history-scan');
  const oldSeen=new PrivateAttention('history-scan');
  const frame=(tick:number,patch:boolean):PrivateFrame=>{
   const retina=new Float32Array(288);
   if(patch)for(let j=44;j<52;j++)retina.set([.1,.85,.8],3*j);
   return {tick,retina,touch:new Float32Array(8),
    proprio:{forward:0,lateral:0,omega:0,gaze:0}};
  };
  const stop:Demand={drive:0,turn:0,gazeRate:0};
  oldSeen.decide(frame(0,true),stop);
  oldSeen.decide(frame(4,false),stop);
  noHistory.decide(frame(4,false),stop);
  for(const tick of [8,12,20,84]){
   const f=frame(tick,false);
   oldSeen.decide(f,stop);
   noHistory.decide(f,stop);
  }
  expect(oldSeen.searchingFrames).toBeGreaterThan(0);
  expect(noHistory.searchingFrames).toBe(0);
  expect(oldSeen.hasHistory()).toBe(true);
  expect(noHistory.hasHistory()).toBe(false);
 },10000);

 it('falsifies history-only focus as a universal exploration policy',()=>{
  const policies:Policy[]=['native','always-sweep',
   'history-scan','history-freeze'];
  const unseen:Relocation[]=['no-history-left','no-history-right'];
  const results=unseen.flatMap(relocation=>
   policies.map(policy=>run(policy,relocation)));
  expect(results.every(r=>r.sawInitial===false)).toBe(true);
  expect(results.every(r=>r.memoryActiveAfterRelocation===false)).toBe(true);
  expect(results.filter(r=>r.policy==='history-scan')
   .every(r=>r.searchingFrames===0)).toBe(true);
  expect(results.filter(r=>r.policy==='always-sweep')
   .every(r=>r.searchingFrames>0)).toBe(true);
  console.log('RB_VISION_B1_NO_PRIOR_RELATION '+
   JSON.stringify(summarise(results)));
 },120000);


 it('B2: compares gaze demand under a genuine independent World-powered target',()=>{
  const variants:Policy[]=['native','always-sweep',
    'history-scan','history-freeze'];
  const outputs=variants.map(policy=>run(policy,'world-mover'));
  expect(outputs.every(x=>x.sawInitial)).toBe(true);
  expect(outputs.every(x=>x.duration>160)).toBe(true);
  console.log('RB_VISION_B2_WORLD_MOVER '+JSON.stringify(summarise(outputs)));
  // World mover is not an instruction or hidden motion signal to brain.
  // Only downstream actual contact, motion and private sight are evaluated.
 },120000);

});
