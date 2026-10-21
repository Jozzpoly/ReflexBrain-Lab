import type {Demand,PrivateFrame} from './world';

/** ACT/P0: action-conditioned predictor of *future legal bodily sensations*.
 * It has no World references, actor position, collider IDs, meaning or goals.
 * Fixed small-memory nearest-neighbor proposal, research-only shadow model.
 */
export type Effect={forward:number;lateral:number;touch:number};
type Example={features:number[];action:number;effect:Effect};
export type EffectState={version:1;limit:number;examples:Example[]};
const clip=(v:number,lo:number,hi:number)=>Math.max(lo,Math.min(hi,v));
const touch=(f:PrivateFrame)=>Array.from(f.touch).reduce((s,v)=>s+Math.abs(v),0);
const frontBrightness=(f:PrivateFrame)=>{
 let b=0;
 // Middle 24 of 96 angular RGB rays, without an appearance category or ID.
 for(let i=36;i<60;i++)b+=(f.retina[3*i]+f.retina[3*i+1]+f.retina[3*i+2])/3;
 return b/24;
};
export function legalFeatures(f:PrivateFrame,d:Demand){
 return [
  clip(f.proprio.forward/4,-2,2),
  clip(f.proprio.lateral/4,-2,2),
  clip(f.proprio.omega/4,-2,2),
  clip(touch(f)/30,0,3),
  frontBrightness(f),
  clip(d.drive,-1,1),
  clip(d.turn,-1,1),
 ];
}
export const observedEffect=(f:PrivateFrame):Effect=>({
 forward:f.proprio.forward,lateral:f.proprio.lateral,touch:touch(f),
});
const copy=(e:Effect):Effect=>({...e});
const diff=(a:number[],b:number[])=>a.reduce((s,x,i)=>s+(x-b[i])**2,0);
const mean=(vals:{effect:Effect;weight:number}[]):Effect=>{
 const z=vals.reduce((s,x)=>s+x.weight,0);
 if(z===0)return{forward:0,lateral:0,touch:0};
 return {
  forward:vals.reduce((s,x)=>s+x.effect.forward*x.weight,0)/z,
  lateral:vals.reduce((s,x)=>s+x.effect.lateral*x.weight,0)/z,
  touch:vals.reduce((s,x)=>s+x.effect.touch*x.weight,0)/z,
 };
};
export class PrivateEffectMemory {
 private state:EffectState;
 constructor(limit=384){
  if(!Number.isInteger(limit)||limit<7||limit>4096)throw Error('Invalid memory bound');
  this.state={version:1,limit,examples:[]};
 }
 observe(before:PrivateFrame,actionIndex:number,demand:Demand,after:PrivateFrame){
  if(!(after.tick>before.tick)||!Number.isInteger(actionIndex)||actionIndex<0||actionIndex>3)
   throw Error('Invalid action-to-observation window');
  const example={features:legalFeatures(before,demand),action:actionIndex,effect:observedEffect(after)};
  if(!example.features.every(Number.isFinite)||!Object.values(example.effect).every(Number.isFinite))
   throw Error('Non-finite private experience');
  this.state.examples.push(example);
  if(this.state.examples.length>this.state.limit)this.state.examples.shift();
 }
 predict(before:PrivateFrame,demand:Demand):Effect{
  if(!this.state.examples.length)return observedEffect(before);
  const q=legalFeatures(before,demand);
  const selected=this.state.examples
   .map((e,i)=>({e,i,r:diff(q,e.features)}))
   .sort((a,b)=>a.r-b.r||a.i-b.i).slice(0,7);
  return mean(selected.map(x=>({effect:x.e.effect,weight:1/(.08+Math.sqrt(x.r))})));
 }
 /** Cheap trained comparator, same examples but only exact motor selection. */
 actionMean(before:PrivateFrame,actionIndex:number):Effect{
  const selected=this.state.examples.filter(x=>x.action===actionIndex);
  if(!selected.length)return observedEffect(before);
  return mean(selected.map(x=>({effect:x.effect,weight:1})));
 }
 /** Cheapest actor-local recent-signal persistence comparator. */
 persistence(before:PrivateFrame):Effect{return observedEffect(before);}
 /** Frozen hand-rule: after contact and forward push, reduce predicted speed.
  * Not an oracle; the fixed rule must never be tuned from heldout results.
  */
 fixedContactRule(before:PrivateFrame,d:Demand):Effect{
  const p=observedEffect(before);
  if(p.touch>.005&&d.drive>.25)p.forward=Math.min(.10,p.forward);
  return p;
 }
 capture():EffectState{return structuredClone(this.state);}
 restore(s:EffectState){
  if(s.version!==1||s.limit!==this.state.limit||!Array.isArray(s.examples)||
   s.examples.length>s.limit||s.examples.some(e=>e.features.length!==7||
   !e.features.every(Number.isFinite)||!Object.values(e.effect).every(Number.isFinite)))
   throw Error('Invalid actor-private effect checkpoint');
  this.state=structuredClone(s);
 }
}
export function privateMAE(pred:Effect,observed:Effect):number{
 return (Math.abs(pred.forward-observed.forward)/4+
  Math.abs(pred.lateral-observed.lateral)/4+
  Math.abs(pred.touch-observed.touch)/30)/3;
}
