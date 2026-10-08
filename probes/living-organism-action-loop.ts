import {LivingWorld,initLivingWorld,type Demand,type PrivateFrame} from '../src/living-organism/world';
import {SensoryRegressor} from '../src/living-organism/sensory-regressor';
import {sensoryFeatures} from '../src/living-organism/sensory-features';
import {visibleTurquoisePatches} from '../src/living-organism/retina-geometry';
import {readFileSync,writeFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
await initLivingWorld();const wrap=(a:number)=>Math.atan2(Math.sin(a),Math.cos(a));
const states=JSON.parse(readFileSync('evidence/living-organism/action-conditioned.json','utf8')).models;
const full=new SensoryRegressor(),motor=new SensoryRegressor();full.restore(states.held);motor.restore(states.motorOnly);
const candidates:Demand[]=[];for(const turn of [-.12,0,.12])for(const gazeRate of [-.15,0,.15])candidates.push({drive:.12,turn,gazeRate});
const policies=['learned','motorOnly','bodyGaze'] as const,episodes=[];
for(const family of ['static','lateral','reversal','occlusion'])for(let seed=401;seed<=403;seed++)for(const policy of policies){
 const w=new LivingWorld(false),x=5.4+(seed-401)*1.1,y=(seed-402)*.65,h=w.addObject(x,y,.5,[.1,.85,.8]),block=family==='occlusion'?w.addObject(100,100,.55,[.8,.2,.2]):null;
 let last=w.observe(),previous:PrivateFrame|null=null,demand:Demand={drive:0,turn:0,gazeRate:0},sum=0,visibleSum=0,visible=0,samples=0,touchSamples=0,decisions=0;
 const trajectory=[];
 for(let tick=0;tick<1440;tick++){
  const current=w.observe();
  if(current.tick!==last.tick){previous=last;last=current;const ps=visibleTurquoisePatches(current.retina);const usable=ps.length===1&&!ps[0].clipped;
   const cost=usable?Math.abs(ps[0].bearing):Math.PI/2;sum+=cost;samples++;if(usable){visible++;visibleSum+=cost;}if(current.touch.some(v=>v>.001))touchSamples++;
  }
  if(tick%24===0){
   const ps=visibleTurquoisePatches(current.retina),input=previous?sensoryFeatures(previous,current,candidates[0]):null;
   if(input&&ps.length===1&&!ps[0].clipped){
    const scores=candidates.map(d=>{const x=sensoryFeatures(previous!,current,d)!;const gaze=x[7],next=Math.max(-Math.PI/2,Math.min(Math.PI/2,gaze+d.gazeRate*.6));
     const delta=policy==='learned'?full.predict(x)[0]:policy==='motorOnly'?motor.predict([x[6],x[7],x[9],x[10]])[0]:-x[6]-(next-gaze);
     return Math.abs(wrap(ps[0].bearing+delta));});
    const selected=scores.reduce((best,value,i)=>value<scores[best]-1e-12||(Math.abs(value-scores[best])<=1e-12&&Math.abs(candidates[i].turn)<Math.abs(candidates[best].turn))?i:best,0);demand=candidates[selected];decisions++;
   }else demand={drive:0,turn:0,gazeRate:0};
   trajectory.push({tick,demand:{...demand},patches:ps,proprio:current.proprio,touch:current.touch,sensorySha256:createHash('sha256').update(JSON.stringify(current)).digest('hex')});
  }
  const t=tick/120;if(family==='lateral')w.moveObject(h,x,y+.28*t);if(family==='reversal')w.moveObject(h,x,y+.28*(t<=6?t:12-t));
  if(block!==null)w.moveObject(block,t>=3&&t<5?2.5:100,t>=3&&t<5?0:100);
  w.step(demand);
 }
 episodes.push({id:`${family}:${seed}`,family,seed,policy,samples,visible,coverage:visible/samples,penalizedBearing:sum/samples,visibleBearing:visible?visibleSum/visible:null,touchSamples,decisions,finalActor:w.inspect().actor,trajectory});w.free();
}
const summary=Object.fromEntries(policies.map(p=>{const es=episodes.filter(e=>e.policy===p);return [p,{episodes:es.length,penalizedBearing:es.reduce((s,e)=>s+e.penalizedBearing,0)/es.length,coverage:es.reduce((s,e)=>s+e.coverage,0)/es.length,touchSamples:es.reduce((s,e)=>s+e.touchSamples,0)}];}));
const result={modelSha256:createHash('sha256').update(JSON.stringify(states)).digest('hex'),measurementTicks:{first:4,last:1436,samplesPerEpisode:359},scope:'12 new scenarios x3 policies,12s closed-loop authored visual centering. Missing vision penalized, no runtime promotion or life claim.',settings:{episodeTicks:1440,decisionTicks:24,missingPenalty:Math.PI/2},summary,episodes};writeFileSync('evidence/living-organism/action-loop.json',JSON.stringify(result)+'\n');console.log(JSON.stringify({summary,episodes:episodes.map(({trajectory,...e})=>e)},null,2));
