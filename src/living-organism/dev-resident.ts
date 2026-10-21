import type {Demand,PrivateFrame} from './world';

/**
 * O-DEV/V0: a deliberately weak *replacement* for the cyan Occupant.
 * Authored source of actions + privately learned local action-effect efficacy.
 * Not a learned purpose, world model, semantic ReflexBrain or organism PASS.
 *
 * Its training target is body-local mobility under sensed contact, not
 * researcher-measured material displacement. World ID/coordinates never enter.
 */
export type DevMode='adaptive'|'frozen'|'random';
export type Maneuver=0|1|2|3;
export type DevState={
  version:1;mode:DevMode;seed:number;lastTick:number|null;
  active:{context:0|1;maneuver:Maneuver;until:number;start:number;
    distance:number;touchExposure:number;seconds:number}|null;
  lastDemand:Demand;trials:number;learnedTrials:number;manualFrames:number;
  stats:{sum:number;count:number}[][];chosen:number[];lastResult:number|null;
};
const ZERO:Demand={drive:0,turn:0,gazeRate:0};
const commands:readonly Demand[]=[
  {drive:.55,turn:0,gazeRate:.0},
  {drive:.40,turn:.65,gazeRate:.20},
  {drive:.40,turn:-.65,gazeRate:-.20},
  {drive:-.35,turn:0,gazeRate:0},
];
const freshStats=()=>Array.from({length:2},()=>Array.from({length:4},()=>({sum:0,count:0})));
const clamp=(x:number,a:number,b:number)=>Math.max(a,Math.min(b,x));
const copy=(d:Demand):Demand=>({...d});
export class DevResident {
 private s:DevState;
 constructor(mode:DevMode='adaptive',seed=0x51babe){
  this.s={version:1,mode,seed:seed>>>0,lastTick:null,active:null,
    lastDemand:copy(ZERO),trials:0,learnedTrials:0,manualFrames:0,
    stats:freshStats(),chosen:[0,0,0,0],lastResult:null};
 }
 private random():number{
  let x=this.s.seed;
  x^=x<<13;x^=x>>>17;x^=x<<5;
  this.s.seed=x>>>0;
  return this.s.seed/4294967296;
 }
 private choose(context:0|1):Maneuver{
  const s=this.s;
  if(s.mode==='random')return Math.floor(this.random()*4) as Maneuver;
  if(s.mode==='frozen')return (s.trials%4) as Maneuver;
  const options=s.stats[context];
  // Always sample all actions in each experienced context before exploiting.
  const pending=options.findIndex(v=>v.count===0);
  if(pending>=0)return pending as Maneuver;
  let best=-Infinity,selection: Maneuver=0;
  const total=options.reduce((a,v)=>a+v.count,0);
  for(let k=0;k<4;k++){
   const o=options[k];
   // Small uncertainty bonus, not a 'surprise reward'.
   const score=o.sum/o.count+.04*Math.sqrt(Math.log(total+1)/o.count);
   if(score>best){best=score;selection=k as Maneuver;}
  }
  return selection;
 }
 private finish(){
  const s=this.s,ep=s.active;
  if(!ep)return;
  if(ep.seconds>.00001){
   // Bounded endogenous score of local own-body response, not World success.
   const mobility=clamp(ep.distance/ep.seconds/3,0,1);
   const resistance=clamp(ep.touchExposure/ep.seconds/12,0,1);
   const outcome=clamp(mobility-.5*resistance,-.5,1);
   s.lastResult=outcome;
   if(s.mode==='adaptive'){
    const stat=s.stats[ep.context][ep.maneuver];
    stat.count++;stat.sum+=outcome;s.learnedTrials++;
   }
  }
  s.trials++;s.active=null;
 }
 /** Called once on each *distinct* actor-private frame, at most 30 Hz.
  * `manual` changes motor authority; it is not a learned 'owner' sensation.
  * Such windows must not be misattributed as own chosen trial evidence.
  */
 decide(frame:PrivateFrame,manual=false):Demand {
  const s=this.s;
  if(s.lastTick!==null && frame.tick<=s.lastTick)
   return manual?copy(ZERO):copy(s.lastDemand);
  const delta=s.lastTick===null?0:(frame.tick-s.lastTick)/120;
  if(manual){
   // Close without committing a possibly contaminated action-effect episode.
   s.active=null;s.manualFrames++;s.lastTick=frame.tick;
   s.lastDemand=copy(ZERO);return copy(ZERO);
  }
  if(s.active&&delta>0){
   const v=frame.proprio;
   s.active.distance+=Math.hypot(v.forward,v.lateral)*delta;
   s.active.touchExposure+=Math.min(50,Array.from(frame.touch).reduce((a,b)=>a+Math.abs(b),0))*delta;
   s.active.seconds+=delta;
  }
  if(s.active&&frame.tick>=s.active.until)this.finish();
  if(!s.active){
   const touch=Array.from(frame.touch).some(v=>v>.005);
   // Stall evidence is actor-private, but not automatically 'collision'.
   const stall=s.lastDemand.drive>.25&&Math.abs(frame.proprio.forward)<.13;
   const context:0|1=touch||stall?1:0;
   const maneuver=this.choose(context);
   s.active={context,maneuver,start:frame.tick,until:frame.tick+180,
    distance:0,touchExposure:0,seconds:0};
   s.chosen[maneuver]++;
  }
  s.lastTick=frame.tick;
  s.lastDemand=copy(commands[s.active.maneuver]);
  return copy(s.lastDemand);
 }
 capture():DevState{return structuredClone(this.s);}
 restore(other:DevState){
  if(other.version!==1||other.mode!==this.s.mode||!Number.isFinite(other.seed)||
    other.stats.length!==2||other.stats.some(a=>a.length!==4))
   throw new Error('Invalid O-DEV private checkpoint');
  this.s=structuredClone(other);
 }
}
