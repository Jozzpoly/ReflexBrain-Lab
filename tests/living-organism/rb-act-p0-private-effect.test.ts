import {beforeAll,describe,expect,it} from 'vitest';
import {initLivingWorld,LivingWorld,type BodyShape,type Demand,type PrivateFrame} from '../../src/living-organism/world';
import {PrivateEffectMemory,privateMAE,observedEffect} from '../../src/living-organism/private-effect-memory';

type Scene='free'|'loose'|'backstop'|'corridor'|'shifted-backstop'|'large-loose'|'alternate-obstacle';
const trainScenes:readonly Scene[]=['free','loose','backstop','corridor'];
const heldOut:readonly Scene[]=['shifted-backstop','large-loose','alternate-obstacle'];
const actions:readonly Demand[]=[
 {drive:.75,turn:0,gazeRate:0},
 {drive:.42,turn:.58,gazeRate:0},
 {drive:.42,turn:-.58,gazeRate:0},
 {drive:-.30,turn:0,gazeRate:0}
];
type Window={before:PrivateFrame;after:PrivateFrame;demand:Demand;actionIndex:number;firstTouch:boolean;lastTouch:boolean};
const color:[number,number,number]=[.12,.77,.67];
const rock:[number,number,number]=[.43,.46,.52];
const back:[number,number,number]=[.025,.04,.06];
function scenario(scene:Scene,shape:BodyShape){
 const w=new LivingWorld(false,shape);
 switch(scene){
  case 'free':break;
  case 'loose':w.addObject(3,0,.65,color);break;
  case 'backstop':w.addObject(3,0,.65,color);w.addWall(5,0,.25,.85,back);break;
  case 'corridor':
   w.addWall(5,2.35,2.2,.55,rock);
   w.addWall(5,-2.35,2.2,.55,rock);
   w.addObject(3.5,0,.65,color);break;
  case 'shifted-backstop':
   w.addObject(3.5,.4,.8,color);w.addWall(6.3,.4,.33,1.1,back);break;
  case 'large-loose':
   w.addObject(3.4,-.2,1.15,color);w.addWall(11,-.6,.8,2,rock);break;
  case 'alternate-obstacle':
   w.addObject(4,1,.55,color);w.addWall(6.2,1,.45,1.7,rock);
   w.addWall(8,-2,1.3,.4,rock);break;
 }
 return w;
}
/** Prespecified motor sequence does NOT condition on scenario or World position.
 * Fixed 32 physics steps = 8 legal 30Hz frames between paired observations.
 */
function generate(scene:Scene,shape:BodyShape):Window[]{
 const w=scenario(scene,shape),out:Window[]=[];
 try{
  for(let k=0;k<56;k++){
   const before=w.observe();
   // Include sustained push, left/right turns, and backing; not random seeds.
   const idx=([0,0,1,0,2,0,3,1,2,0,0,3] as const)[k%12];
   const demand=actions[idx];
   for(let t=0;t<32;t++)w.step(demand);
   const after=w.observe();
   out.push({before,after,demand,actionIndex:idx,
    firstTouch:Array.from(before.touch).some(v=>v>.005),
    lastTouch:Array.from(after.touch).some(v=>v>.005)});
  }
  return out;
 }finally{w.free();}
}
const sum=(a:number[])=>a.reduce((s,x)=>s+x,0);
describe('RB-ACT/P0 — source-executed action-conditioned private effect vs cheap controls',()=>{
 beforeAll(initLivingWorld);
 it('preserves only legal actor-local experience and deterministic learned state',()=>{
  const windows=generate('backstop','B1');
  const model=new PrivateEffectMemory(384);
  for(const w of windows)model.observe(w.before,w.actionIndex,w.demand,w.after);
  expect(model.capture().examples).toHaveLength(56);
  const fork=new PrivateEffectMemory(384);fork.restore(model.capture());
  const q=generate('shifted-backstop','B1')[0];
  expect(fork.predict(q.before,q.demand)).toEqual(model.predict(q.before,q.demand));
  expect(()=>model.observe(q.before,0,q.demand,q.before)).toThrow('Invalid action-to-observation window');
  const tiny=new PrivateEffectMemory(7);
  for(const w of windows)tiny.observe(w.before,w.actionIndex,w.demand,w.after);
  expect(tiny.capture().examples).toHaveLength(7);
  expect(model.capture().examples.every(x=>x.features.length===7&&
   !('worldX' in x)&&!('colliderHandle' in x)&&!('scene' in x))).toBe(true);
 });
 it('freezes held-out empirical prediction errors for model/persistence/motor-mean/contact-rule without post-hoc tuning',()=>{
  const result=[];
  for(const shape of ['B0','B1'] as const){
   const model=new PrivateEffectMemory();
   let trainCount=0,trainContactWindows=0;
   for(const scene of trainScenes){
    const windows=generate(scene,shape);
    for(const w of windows){
     trainContactWindows+=Number(w.firstTouch||w.lastTouch);
     model.observe(w.before,w.actionIndex,w.demand,w.after);trainCount++;
    }
   }
   expect(trainCount).toBe(224);
   for(const scene of heldOut){
    const windows=generate(scene,shape);
    const scores={learned:[],persistence:[],actionMean:[],fixedContact:[]} as
     Record<'learned'|'persistence'|'actionMean'|'fixedContact',number[]>;
    for(const w of windows){
     const actual=observedEffect(w.after);
     scores.learned.push(privateMAE(model.predict(w.before,w.demand),actual));
     scores.persistence.push(privateMAE(model.persistence(w.before),actual));
     scores.actionMean.push(privateMAE(model.actionMean(w.before,w.actionIndex),actual));
     scores.fixedContact.push(privateMAE(model.fixedContactRule(w.before,w.demand),actual));
    }
    const mae=Object.fromEntries(Object.entries(scores).map(([k,v])=>[k,sum(v)/v.length]));
    // Post-result diagnostic only; these partitions do NOT change the frozen
    // aggregate hypothesis or select a new winner after viewing outcomes.
    const byIndex=(indices:number[])=>Object.fromEntries(
     Object.entries(scores).map(([key,v])=>[key,
       indices.length?sum(indices.map(i=>v[i]))/indices.length:null]));
    const contactIdx=windows.map((w,i)=>w.firstTouch||w.lastTouch?i:-1).filter(i=>i>=0);
    const noContactIdx=windows.map((w,i)=>!w.firstTouch&&!w.lastTouch?i:-1).filter(i=>i>=0);
    const movingIdx=windows.map((w,i)=>Math.abs(w.after.proprio.forward)>.5?i:-1).filter(i=>i>=0);
    const lowMotionIdx=windows.map((w,i)=>Math.abs(w.after.proprio.forward)<=.5?i:-1).filter(i=>i>=0);
    result.push({shape,scene,mae,
     descriptiveStrata:{
      contact:{n:contactIdx.length,mae:byIndex(contactIdx)},
      noContact:{n:noContactIdx.length,mae:byIndex(noContactIdx)},
      moving:{n:movingIdx.length,mae:byIndex(movingIdx)},
      lowMotion:{n:lowMotionIdx.length,mae:byIndex(lowMotionIdx)},
     },
     meanAbsFinalForward:sum(windows.map(w=>Math.abs(w.after.proprio.forward)))/windows.length,
     meanFinalTouch:sum(windows.map(w=>observedEffect(w.after).touch))/windows.length,
     frames:windows.length,
     contactRelevantWindows:contactIdx.length,
     initialRetinaContrast:windows[0].before.retina.some(v=>v>.4),
     finite:Object.values(mae).every(Number.isFinite)});
   }
  }
  expect(result).toHaveLength(6);
  expect(result.every(r=>r.frames===56&&r.finite)).toBe(true);
  console.log('RB_ACT_P0_PREDICTION '+JSON.stringify({
   scientificScope:'harness-chosen motor probes; actor-private forward consequence shadow predictor only',
   trainScenes,heldOut,trainPerBody:224,
   note:'no behavior advantage or actor-chosen information probe, cheap-rule/touch and observation density matter',
   rows:result}));
 },240000);
});
