import {LivingWorld,initLivingWorld,type PrivateFrame} from '../src/living-organism/world';
import {SensoryRegressor} from '../src/living-organism/sensory-regressor';
import {E0_DT,E0_LINEAR_DAMPING,E0_VMAX} from '../src/e0-body-seam';
import {createHash} from 'node:crypto';
import {readFileSync,writeFileSync} from 'node:fs';
await initLivingWorld();
const states=JSON.parse(readFileSync('evidence/living-organism/body-model.json','utf8')).models,history=new SensoryRegressor(),noHistory=new SensoryRegressor();history.restore(states.history);noHistory.restore(states.noHistory);
const drives=[-.2,-.1,0,.1,.2],a4=(1/(1+E0_LINEAR_DAMPING*E0_DT))**4,a24=a4**6,episodes=[];
for(const geometry of ['free','constrained'])for(const baseForce of [.8,-1.7,2.1])for(const profile of ['constant','switch'])for(const policy of ['history','noHistory','analyticFree','analyticResidual']){
 const w=new LivingWorld(false),front=geometry==='constrained'?w.addWall(1.1,0,.05,1,[.4,.4,.45]):null,rear=geometry==='constrained'?w.addWall(-1.08,0,.05,1,[.4,.4,.45]):null;
 let previous:PrivateFrame=w.observe(),last=w.observe(),drive=0,samples=0,velocity=0,path=0,lastX=0,frontImpulse=0,rearImpulse=0,decisions=0;const trace=[];
 for(let tick=0;tick<1440;tick++){
  const f=w.observe(),fresh=f.tick!==last.tick;if(fresh){previous=last;last=f;samples++;velocity+=Math.abs(f.proprio.forward);
   for(const e of w.inspectContactSample().contacts){if(e.handle===front)frontImpulse+=e.impulse;if(e.handle===rear)rearImpulse+=e.impulse;}
  }
  if(tick>0&&tick%24===0){
   if(f.tick-previous.tick!==4)throw new Error('History cadence mismatch');
   const pastDrive=drive,v=f.proprio.forward,old=previous.proprio.forward,bias=(v-a4*old)/(1-a4)-E0_VMAX*pastDrive;
   const scores=drives.map(candidate=>Math.abs(policy==='history'?history.predict([v,old,pastDrive,candidate])[0]:policy==='noHistory'?noHistory.predict([v,candidate])[0]:a24*v+(1-a24)*(E0_VMAX*candidate+(policy==='analyticResidual'?bias:0))));
   const i=scores.reduce((best,value,index)=>value<scores[best]-1e-12||(Math.abs(value-scores[best])<=1e-12&&Math.abs(drives[index])<Math.abs(drives[best]))?index:best,0);drive=drives[i];decisions++;
   trace.push({tick,forward:v,previousForward:old,pastDrive,drive,x:w.inspect().actor.x});
  }
  const t=tick/120,force=baseForce*(profile==='switch'&&t>=2.3&&t<6.7?-1:1);w.step({drive,turn:0,gazeRate:0},{x:force,y:0});const x=w.inspect().actor.x;path+=Math.abs(x-lastX);lastX=x;
 }
 episodes.push({geometry,baseForce,profile,policy,samples,meanAbsVelocity:velocity/samples,path,finalX:lastX,frontImpulse,rearImpulse,decisions,trace});w.free();
}
const names=['history','noHistory','analyticFree','analyticResidual'];const summarize=(es:typeof episodes)=>({episodes:es.length,meanAbsVelocity:es.reduce((s,e)=>s+e.meanAbsVelocity,0)/es.length,path:es.reduce((s,e)=>s+e.path,0)/es.length,frontImpulse:es.reduce((s,e)=>s+e.frontImpulse,0),rearImpulse:es.reduce((s,e)=>s+e.rearImpulse,0)});
const result={scope:'Frozen body predictor in closed-loop authored velocity suppression, free/constrained1D. Contact is evaluation only, not success. No runtime promotion.',modelSha256:createHash('sha256').update(JSON.stringify(states)).digest('hex'),settings:{episodeTicks:1440,measurementTicks:[4,1436],samplesPerEpisode:359,decisionTicks:24,drives},summary:Object.fromEntries(['free','constrained'].map(g=>[g,Object.fromEntries(names.map(p=>[p,summarize(episodes.filter(e=>e.geometry===g&&e.policy===p))]))])),episodes};
writeFileSync('evidence/living-organism/body-loop.json',JSON.stringify(result)+'\n');console.log(JSON.stringify(result.summary,null,2));
