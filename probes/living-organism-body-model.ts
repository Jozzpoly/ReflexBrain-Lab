import {LivingWorld,initLivingWorld,type PrivateFrame} from '../src/living-organism/world';
import {SensoryRegressor} from '../src/living-organism/sensory-regressor';
import {E0_DT,E0_LINEAR_DAMPING,E0_VMAX} from '../src/e0-body-seam';
import {createHash} from 'node:crypto';
import {writeFileSync} from 'node:fs';
await initLivingWorld();
const drives=[-.2,-.1,0,.1,.2],a4=(1/(1+E0_LINEAR_DAMPING*E0_DT))**4,a24=a4**6;
const noise=(seed:number,k:number)=>{let n=(seed*8191+k*131071+0x6d2b79f5)>>>0;n=Math.imul(n^(n>>>16),0x85ebca6b);n=Math.imul(n^(n>>>13),0xc2b2ae35);return ((n^(n>>>16))>>>0)/4294967296*2-1;};
const command=(seed:number,t:number)=>.2*noise(seed,Math.floor(t/48));
type Row={id:string;split:string;tick:number;input:number[];output:number[]};
const rows:Row[]=[],manifest=[];let invariantChecks=0;
for(const split of ['train','test','stress'])for(const force of split==='train'?[-3,-1,0,1,3]:[-2.2,.7,2.4])for(let config=0;config<2;config++){
 const seed=split==='train'?11+config:81+config,id=`${split}:${force}:${seed}`,w=new LivingWorld(false),fork=new LivingWorld(false);let previous:PrivateFrame=w.observe(),last=w.observe();
 const forceAt=(tick:number)=>force*(split==='stress'&&Math.floor(tick/132)%2?-1:1);
 for(let tick=0;tick<960;tick++){
  const f=w.observe();if(f.tick!==last.tick){previous=last;last=f;}
  if(tick>0&&tick%24===0&&tick+24<=960){
   if(f.tick-previous.tick!==4)throw new Error('History cadence mismatch');
   const cp=w.captureCheckpoint(),pastDrive=command(seed,tick-1);
   for(const drive of drives){fork.restoreCheckpoint(cp);for(let j=0;j<24;j++)fork.step({drive,turn:0,gazeRate:0},{x:forceAt(tick+j),y:0});const future=fork.observe();
    rows.push({id,split,tick,input:[f.proprio.forward,previous.proprio.forward,pastDrive,drive],output:[future.proprio.forward,future.proprio.omega]});
   }
   if(!Buffer.from(cp.physics).equals(Buffer.from(w.captureCheckpoint().physics))||JSON.stringify(w.observe())!==JSON.stringify(f))throw new Error('Source changed');invariantChecks++;
  }
  w.step({drive:command(seed,tick),turn:0,gazeRate:0},{x:forceAt(tick),y:0});
 }
 const data=rows.filter(r=>r.id===id);manifest.push({id,split,force,seed,examples:data.length,dataSha256:createHash('sha256').update(JSON.stringify(data)).digest('hex')});w.free();fork.free();
}
const train=rows.filter(r=>r.split==='train'),model=new SensoryRegressor(),noHistory=new SensoryRegressor();model.fit(train);noHistory.fit(train.map(r=>({input:[r.input[0],r.input[3]],output:r.output})));
const names=['history','noHistory','analyticFree','analyticResidual','hold'] as const;
function predictions(row:Row){const [v,old,oldDrive,drive]=row.input,bias=(v-a4*old)/(1-a4)-E0_VMAX*oldDrive;
 return {history:model.predict(row.input)[0],noHistory:noHistory.predict([v,drive])[0],analyticFree:a24*v+(1-a24)*E0_VMAX*drive,analyticResidual:a24*v+(1-a24)*(E0_VMAX*drive+bias),hold:v};}
function metrics(data:Row[]){const mae=Object.fromEntries(names.map(n=>[n,0])) as Record<typeof names[number],number>;
 for(const r of data){const p=predictions(r);for(const n of names)mae[n]+=Math.abs(p[n]-r.output[0]);}
 const groups=new Map<string,Row[]>();for(const r of data){const key=`${r.id}:${r.tick}`;groups.set(key,[...(groups.get(key)??[]),r]);}
 const cost=Object.fromEntries(names.map(n=>[n,0])) as typeof mae,regret={...cost};
 for(const group of groups.values()){
  // Choice precedes reading the candidate future labels.
  const chosen=Object.fromEntries(names.map(n=>[n,group.reduce((best,r)=>{const value=Math.abs(predictions(r)[n]),prior=Math.abs(predictions(best)[n]);return value<prior-1e-12||(Math.abs(value-prior)<=1e-12&&Math.abs(r.input[3])<Math.abs(best.input[3]))?r:best;})])) as Record<typeof names[number],Row>;
  const best=Math.min(...group.map(r=>Math.abs(r.output[0])));for(const n of names){const value=Math.abs(chosen[n].output[0]);cost[n]+=value;regret[n]+=value-best;}
 }
 return {examples:data.length,states:groups.size,velocityMAE:Object.fromEntries(names.map(n=>[n,mae[n]/data.length])),stopCost:Object.fromEntries(names.map(n=>[n,cost[n]/groups.size])),regret:Object.fromEntries(names.map(n=>[n,regret[n]/groups.size]))};
}
const result={scope:'Private body velocity prediction and matched-state action selection, free1D only. Analytic prior knows fixed body constants, learned model does not. No default runtime changes.',settings:{horizonTicks:24,sourceTicks:960,historyTicks:4,lambda:.001,drives},invariantChecks,manifest,train:metrics(train),test:metrics(rows.filter(r=>r.split==='test')),stress:metrics(rows.filter(r=>r.split==='stress')),byEpisode:Object.fromEntries(manifest.filter(e=>e.split!=='train').map(e=>[e.id,metrics(rows.filter(r=>r.id===e.id))])),models:{history:model.capture(),noHistory:noHistory.capture()}};
writeFileSync('evidence/living-organism/body-model.json',JSON.stringify(result,null,2)+'\n');console.log(JSON.stringify({test:result.test,stress:result.stress,invariantChecks},null,2));
