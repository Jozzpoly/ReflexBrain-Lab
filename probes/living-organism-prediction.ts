import {LivingWorld,initLivingWorld} from '../src/living-organism/world';
import {PrivateVision} from '../src/living-organism/private-vision';
import {visibleTurquoisePatches} from '../src/living-organism/retina-geometry';
import {writeFileSync} from 'node:fs';
import {createHash} from 'node:crypto';

await initLivingWorld();
const variants=['static-near','static-far','moving-line-alias','moving-scale-alias'] as const;
const results=[];
for(const variant of variants){
 const w=new LivingWorld(false),v=new PrivateVision(),x=variant==='static-far'?6:3;
 const h=w.addObject(x,0,x/10,[.1,.85,.8]);v.observe(w.observe());
 let frozen:ReturnType<PrivateVision['capture']>['estimate']=null;
 const samples=[];
 for(let i=1;i<=120;i++){
  w.step({drive:0,turn:0,gazeRate:0},i<=60?{x:0,y:30}:{x:-30,y:0});
  const a=w.inspect().actor;
  if(variant==='moving-line-alias')w.moveObject(h,3,a.y*.5);
  if(variant==='moving-scale-alias')w.moveObject(h,3+a.x*.5,a.y*.5);
  const f=w.observe();v.observe(f);
  if(f.tick!==i)continue; // Cached frames are not independent evidence.
  const state=v.capture(),patches=visibleTurquoisePatches(f.retina);
  let frozenAngularError:number|null=null;
  if(frozen&&patches.length===1&&!patches[0].clipped){
   const bearing=Math.atan2(frozen.y-state.pose.y,frozen.x-state.pose.x)-state.pose.heading-f.proprio.gaze;
   const error=patches[0].bearing-bearing;
   frozenAngularError=Math.atan2(Math.sin(error),Math.cos(error));
  }
  samples.push({tick:f.tick,retina:Array.from(f.retina),prediction:state.prediction,estimate:state.estimate,frozenAngularError});
  if(i===60)frozen=structuredClone(state.estimate);
 }
 const a=w.inspect().actor,o=w.inspect().objects[0];
 const errors=samples.map(s=>s.frozenAngularError).filter((e):e is number=>e!==null);
 results.push({variant,actualDistance:Math.hypot(o.x-a.x,o.y-a.y),final:v.capture(),frozenAtTick60:frozen,
  compatible:samples.filter(s=>s.prediction?.status==='compatible').length,
  inconsistent:samples.filter(s=>s.prediction?.status==='inconsistent').length,
  frozenMaxAngularError:errors.length?Math.max(...errors.map(Math.abs)):null,samples});w.free();
}
const far=results.find(r=>r.variant==='static-far')!,scale=results.find(r=>r.variant==='moving-scale-alias')!;
const identicalRetinas=far.samples.every((s,i)=>s.retina.every((value,j)=>value===scale.samples[i].retina[j]));
const differingSamples=far.samples.filter((s,i)=>s.retina.some((value,j)=>value!==scale.samples[i].retina[j])).length;
const output={scope:'Host truth only evaluates or constructs interventions. Motion switches axis at tick 60. Scale alias is deliberately observer-correlated, not a naturalistic motion prior. Object edits occur after step, so cached retina precedes that edit by one physics step. Exact retinal equality is measured, not assumed. No model sees host XY. Hashes retain sample identity; rerun probe to reproduce full RGB buffers.',
 identicalFarAndScaleRetinas:identicalRetinas,differingFarAndScaleSamples:differingSamples,
 results:results.map(r=>({...r,samples:r.samples.map(({retina,...s})=>({...s,retinaSha256:createHash('sha256').update(new Uint8Array(new Float32Array(retina).buffer)).digest('hex')}))}))};
writeFileSync('evidence/living-organism/private-prediction.json',JSON.stringify(output,null,2)+'\n');
console.log(JSON.stringify({identicalFarAndScaleRetinas:identicalRetinas,results:results.map(({variant,actualDistance,final,compatible,inconsistent,frozenMaxAngularError})=>({variant,actualDistance,estimate:final.estimate,compatible,inconsistent,frozenMaxAngularError}))},null,2));
