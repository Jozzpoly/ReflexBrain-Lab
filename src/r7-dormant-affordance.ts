import {
  createB01bScenario, destroyB01bScenario,
  isB01bPassageOpen, stepB01bScenario,
} from './b01b-b0-scale-passage';

/**
 * P0 long-horizon existing B01b donor; host-only physical microscope.
 * No new organism, sensor, hidden World access to brain, geometry or physics law.
 * All three phases keep the exact same Rapier World and material identities.
 * Pre-arm: docs/research/RB_R7_P0_DORMANT_AFFORDANCE_ARMED_2026-10-22.md.
 */
export type R7Power='never'|'early-only'|'always';
export type R7Moment={
 tick:number; seconds:number; powered:boolean; open:boolean;
 blocker:{x:number;y:number;speed:number};
 shuttle:{x:number;y:number;speed:number};
 blockerDisplacement:number; contactTicks:number; sourceOpenTick:number|null;
};
export type R7Run={
 power:R7Power; samples:R7Moment[];ordinaryTravel:number[];
 totalSourceBlockerContactTicks:number;
 firstSourceContactTick:number|null;firstOpenTick:number|null;
 executedUpdates:number; physicsFinalBytes:number;
};

const SNAP=new Set([0,1200,3600,7200,10800,14400]);
const point=(v:{x:number;y:number})=>({x:v.x,y:v.y});
const norm=(a:{x:number;y:number},b:{x:number;y:number})=>
  Math.hypot(a.x-b.x,a.y-b.y);

export function runR7Dormant(power:R7Power):R7Run{
 const s=createB01bScenario(power!=='never');
 const snapshot=():R7Moment=>{
  const p=s.e02.blocker.rb.translation();
  const v=s.e02.blocker.rb.linvel();
  const q=s.e02.base.shuttle.rb.translation();
  const w=s.e02.base.shuttle.rb.linvel();
  return {tick:s.e02.base.tick,seconds:s.e02.base.tick/120,
   powered:s.processEnabled,open:isB01bPassageOpen(s),
   blocker:{x:p.x,y:p.y,speed:Math.hypot(v.x,v.y)},
   shuttle:{x:q.x,y:q.y,speed:Math.hypot(w.x,w.y)},
   blockerDisplacement:0,contactTicks:s.contactTicks,sourceOpenTick:s.firstOpenTick};
 };
 const samples:R7Moment[]=[];
 let executedUpdates=0;
 let prev=point(s.e02.blocker.rb.translation());
 let origin={...prev};
 const ordinaryTravel=[0,0,0,0];
 try{
  if(SNAP.has(0))samples.push(snapshot());
  for(let tick=1;tick<=14400;tick++){
   // Source-off is a declared experimenter action at tick 1200.
   // Never remove, teleport, freeze or respawn source or matter.
   s.processEnabled=power==='always'||(power==='early-only'&&tick<=1200);
   const before=s.e02.base.tick;
   stepB01bScenario(s);
   if(s.e02.base.tick!==before+1)throw Error('R7 physical clock failed');
   executedUpdates++;
   if(tick%120===0){
    const p=point(s.e02.blocker.rb.translation());
    ordinaryTravel[Math.min(3,Math.floor((tick-1)/3600))]+=norm(p,prev);
    prev=p;
   }
   if(SNAP.has(tick)){
    const m=snapshot();
    m.blockerDisplacement=norm(m.blocker,origin);
    samples.push(m);
   }
  }
  if(executedUpdates!==14400||s.e02.base.tick!==14400)throw Error('R7 false timeline');
  return {power,samples,ordinaryTravel,
    totalSourceBlockerContactTicks:s.contactTicks,
    firstSourceContactTick:s.firstContactTick,
    firstOpenTick:s.firstOpenTick,
    executedUpdates,physicsFinalBytes:s.e02.base.world.takeSnapshot().length};
 }finally{destroyB01bScenario(s);}
}

export function r7DormancyDecision(){
 const never=runR7Dormant('never'),early=runR7Dormant('early-only');
 const always=runR7Dormant('always'),repeat=runR7Dormant('early-only');
 const reproducible=JSON.stringify(early)===JSON.stringify(repeat);
 const post=early.samples.filter(x=>x.tick>=3600);
 const nullLate=never.samples.filter(x=>x.tick>=3600);
 const end=early.samples.at(-1)!;
 const control=never.samples.at(-1)!;
 const retainedDifference=norm(end.blocker,control.blocker);
 const reasons:string[]=[];
 if(!reproducible)reasons.push('early-only physics was not deterministic');
 if(!early.firstSourceContactTick||early.firstSourceContactTick>1200)
   reasons.push('powered source did not genuinely contact blocker in the 10s acquisition window');
 if(early.firstOpenTick===null||early.firstOpenTick>1200)
   reasons.push('physical blocker passage never actually opened before source-off');
 if(post.some(x=>!x.open))
   reasons.push('dormant passage was not B0-open in each later 30s snapshot');
 if(early.ordinaryTravel[2]+early.ordinaryTravel[3]>.03)
   reasons.push('late blocker moved substantially; no physically quiet material memory');
 if(retainedDifference<.9)
   reasons.push('late blocker remained too similar to never-powered control');
 if(nullLate.some(x=>x.open)||never.totalSourceBlockerContactTicks!==0)
   reasons.push('never-powered control opened or had source contact');
 if(never.ordinaryTravel.reduce((a,b)=>a+b,0)>.03)
   reasons.push('never-powered blocker was not stationary');
 for(const r of [never,early,always]){
  if(r.executedUpdates!==14400)reasons.push(r.power+' lost real solver updates');
 }
 return {scientificPass:reasons.length===0, reasons,reproducible,
   retainedDifference,never,early,always};
}
