import {beforeAll,describe,expect,it} from 'vitest';
import {LivingWorld,initLivingWorld,type PrivateFrame} from '../../src/living-organism/world';
import {DevResident} from '../../src/living-organism/dev-resident';
import {retinalAngle} from '../../src/living-organism/retina-geometry';
import {E0_RAPIER as R,e0PairImpulse} from '../../src/e0-body-seam';

beforeAll(initLivingWorld);
const PARTS=[
 [3.1,.2,.52,.55,'dynamic'],[5.2,-.6,.60,.60,'dynamic'],
 [4.2,2.5,1.15,.22,'dynamic'],[7.1,1.9,.22,1.15,'anchored'],
 [-2.4,2.3,.6,.55,'dynamic'],[-4.4,-1.8,1.15,.22,'anchored'],
 [1.1,-3.4,.22,1.15,'anchored']
] as const;
const local=(v:any,p:any,r:number)=>{const dx=v.x-p.x,dy=v.y-p.y,c=Math.cos(r),s=Math.sin(r);return {x:c*dx+s*dy,y:-s*dx+c*dy};};
type Window={frames:number;selfPixels:number;externalPixels:number;backgroundPixels:number;
 selfFrames:number;externalFrames:number;errors:number;counterfactualExternalPixels:number;
 hiddenExternalBehindSelf:number;framesWithHiddenExternal:number;framesWithAnyPotentialExternal:number;
 selfWithoutExternalBehind:number};
const fresh=():Window[]=>Array.from({length:4},()=>({frames:0,selfPixels:0,externalPixels:0,
 backgroundPixels:0,selfFrames:0,externalFrames:0,errors:0,counterfactualExternalPixels:0,
 hiddenExternalBehindSelf:0,framesWithHiddenExternal:0,framesWithAnyPotentialExternal:0,
 selfWithoutExternalBehind:0}));
function init(adhesive:boolean){
 const world=new LivingWorld(false,'B0'),host=world as any;
 const dynamic:number[]=[],all:number[]=[];
 for(const [x,y,hx,hy,mode] of PARTS){
  const handle=world.addMaterialPart(-x,y+.6,hx,hy,mode);
  all.push(handle);
  if(mode==='dynamic'){dynamic.push(handle);host.world.getCollider(handle).parent().lockRotations(false,true);}
 }
 return {adhesive,world,host,brain:new DevResident('random',0x51babe),
  dynamic,all,joints:new Map<number,any>(),firstBond:null as number|null,
  joined:0,broken:0,windows:fresh()};
}
function physics(t:ReturnType<typeof init>,tick:number){
 if(!t.adhesive)return;
 const raw=t.host.world,actor=t.host.actor;
 for(const handle of t.dynamic){
  if(t.joints.has(handle))continue;
  const collision=e0PairImpulse(raw,actor.collider(0).handle,handle);
  if(collision.impulse<=.001)continue;
  const part=raw.getCollider(handle).parent(),p=part.translation(),a=actor.translation();
  const ar=actor.rotation(),br=part.rotation();
  const spot={x:a.x+.72*(p.x-a.x),y:a.y+.72*(p.y-a.y)};
  const joint=raw.createImpulseJoint(R.JointData.fixed(
   local(spot,a,ar),0,local(spot,p,br),ar-br),actor,part,true);
  joint.setContactsEnabled(false);
  t.joints.set(handle,joint);t.joined++;
  if(t.firstBond===null)t.firstBond=tick;
 }
 for(const [id,joint] of t.joints){
  let impulse=0;
  for(const other of t.all)if(other!==id)impulse+=e0PairImpulse(raw,id,other).impulse;
  if(impulse>4){raw.removeImpulseJoint(joint,true);t.joints.delete(id);t.broken++;}
 }
}
function audit(t:ReturnType<typeof init>,frame:PrivateFrame,tick:number){
 const w=t.windows[Math.min(3,Math.floor((tick-1)/3600))];
 const host=t.host,position=host.actor.translation(),rotation=host.actor.rotation(),gaze=frame.proprio.gaze;
 let self=0,external=0,background=0,errors=0,potential=0,hidden=0,selfWithout=0;
 for(let i=0;i<96;i++){
  const u=(i+.5)/96*2-1,angle=rotation+gaze+retinalAngle(u);
  const ray=new R.Ray(position,{x:Math.cos(angle),y:Math.sin(angle)});
  let nearest=12,handle:number|null=null,externalDistance=12,externalHandle:number|null=null;
  for(const id of t.all){
   const distance=host.world.getCollider(id).castRay(ray,12,true);
   if(distance>=0&&distance<nearest){nearest=distance;handle=id;}
   if(!t.joints.has(id)&&distance>=0&&distance<externalDistance){externalDistance=distance;externalHandle=id;}
  }
  const expectedRed=handle===null ? .025 : .74;
  if(Math.abs(frame.retina[i*3]-expectedRed)>1e-4)errors++;
  if(handle===null)background++;
  else if(t.joints.has(handle)){
   self++;
   if(externalHandle!==null&&externalDistance>nearest+1e-7)hidden++;
   else if(externalHandle===null)selfWithout++;
  }else external++;
  if(externalHandle!==null)potential++;
 }
 w.frames++;w.selfPixels+=self;w.externalPixels+=external;w.backgroundPixels+=background;w.errors+=errors;
 w.counterfactualExternalPixels+=potential;w.hiddenExternalBehindSelf+=hidden;
 w.selfWithoutExternalBehind+=selfWithout;
 if(hidden)w.framesWithHiddenExternal++;
 if(potential)w.framesWithAnyPotentialExternal++;
 if(self>0)w.selfFrames++;
 if(external>0)w.externalFrames++;
}
describe('R9F host-only optical transparency ablation on actual R9E body/world trajectories',()=>{
 it('separates first-hit self cargo from proven occlusion of independent matter behind it',()=>{
  const inert=init(false),adhesive=init(true);
  let earlyPrefixEqual=true,earlyFrames=0;
  try{
   const firstA=inert.world.observe(),firstB=adhesive.world.observe();
   expect([...firstA.retina]).toEqual([...firstB.retina]);
   for(let tick=1;tick<=14400;tick++){
    for(const t of [inert,adhesive]){
     t.world.step(t.brain.decide(t.world.observe()));
     physics(t,tick);
    }
    if(tick%16===0){
     const a=inert.world.observe(),b=adhesive.world.observe();
     if(adhesive.firstBond===null){
      earlyFrames++;
      if(a.tick!==b.tick||a.retina.some((v,i)=>v!==b.retina[i])||
       a.touch.some((v,i)=>v!==b.touch[i])||
       a.proprio.forward!==b.proprio.forward||a.proprio.lateral!==b.proprio.lateral||
       a.proprio.omega!==b.proprio.omega)earlyPrefixEqual=false;
     }
     audit(inert,a,tick);audit(adhesive,b,tick);
    }
   }
   const totals=(t:ReturnType<typeof init>)=>{
    const sum=t.windows.reduce((a,w)=>({frames:a.frames+w.frames,
      selfPixels:a.selfPixels+w.selfPixels,externalPixels:a.externalPixels+w.externalPixels,
      backgroundPixels:a.backgroundPixels+w.backgroundPixels,errors:a.errors+w.errors,
      selfFrames:a.selfFrames+w.selfFrames,externalFrames:a.externalFrames+w.externalFrames,
      counterfactualExternalPixels:a.counterfactualExternalPixels+w.counterfactualExternalPixels,
      hiddenExternalBehindSelf:a.hiddenExternalBehindSelf+w.hiddenExternalBehindSelf,
      framesWithHiddenExternal:a.framesWithHiddenExternal+w.framesWithHiddenExternal,
      framesWithAnyPotentialExternal:a.framesWithAnyPotentialExternal+w.framesWithAnyPotentialExternal,
      selfWithoutExternalBehind:a.selfWithoutExternalBehind+w.selfWithoutExternalBehind}),
      {frames:0,selfPixels:0,externalPixels:0,backgroundPixels:0,errors:0,selfFrames:0,externalFrames:0,
       counterfactualExternalPixels:0,hiddenExternalBehindSelf:0,framesWithHiddenExternal:0,
       framesWithAnyPotentialExternal:0,selfWithoutExternalBehind:0});
    return {total:sum,windows:t.windows};
   };
   const result={stepsInert:inert.world.inspect().tick,stepsAdhesive:adhesive.world.inspect().tick,
    originalValidPriorFrames:earlyFrames,earlyPrefixEqual,
    firstBond:adhesive.firstBond,jointsFormed:adhesive.joined,jointsBroken:adhesive.broken,
    stillJoined:adhesive.joints.size,inert:totals(inert),adhesive:totals(adhesive)};
   console.log('RB_R9F_OCCLUSION_ABLATION '+JSON.stringify(result));
   expect(result.stepsInert).toBe(14400);
   expect(result.stepsAdhesive).toBe(14400);
   expect(result.originalValidPriorFrames).toBeGreaterThan(0);
   expect(result.earlyPrefixEqual).toBe(true);
   expect(result.firstBond).not.toBeNull();
   expect(result.inert.total.frames).toBe(900);
   expect(result.adhesive.total.frames).toBe(900);
   expect(result.inert.total.errors).toBe(0);
   expect(result.adhesive.total.errors).toBe(0);
   expect(result.inert.total.selfPixels).toBe(0);
   expect(result.adhesive.total.selfPixels).toBeGreaterThan(0);
   expect(result.inert.total.counterfactualExternalPixels).toBe(result.inert.total.externalPixels);
   expect(result.inert.total.hiddenExternalBehindSelf).toBe(0);
   expect(result.adhesive.total.counterfactualExternalPixels).toBe(
    result.adhesive.total.externalPixels+result.adhesive.total.hiddenExternalBehindSelf);
   expect(result.adhesive.total.selfWithoutExternalBehind).toBeLessThanOrEqual(
    result.adhesive.total.selfPixels);
  }finally{inert.world.free();adhesive.world.free();}
 },180000);
});
