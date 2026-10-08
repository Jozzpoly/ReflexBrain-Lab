import {LivingWorld,initLivingWorld,type Demand} from '../src/living-organism/world';
import {SensoryRegressor} from '../src/living-organism/sensory-regressor';
import {sensoryFeatures} from '../src/living-organism/sensory-features';
import {visibleTurquoisePatches} from '../src/living-organism/retina-geometry';
import {readFileSync,writeFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
await initLivingWorld();const wrap=(a:number)=>Math.atan2(Math.sin(a),Math.cos(a));
const model=new SensoryRegressor();model.restore(JSON.parse(readFileSync('evidence/living-organism/action-conditioned.json','utf8')).models.held);
const states=JSON.parse(readFileSync('evidence/living-organism/action-conditioned.json','utf8')).models;const noHistory=new SensoryRegressor(),motorOnly=new SensoryRegressor();noHistory.restore(states.noHistory);motorOnly.restore(states.motorOnly);
const candidates:Demand[]=[];for(const turn of [-.12,0,.12])for(const gazeRate of [-.15,0,.15])candidates.push({drive:.12,turn,gazeRate});
const policies=['learned','noHistory','motorOnly','bodyGaze','reactive'] as const;
const episodes=[];let evaluated=0,masked=0;
for(const family of ['static','lateral','reversal'])for(let seed=201;seed<=203;seed++){
 const id=`${family}:${seed}`,w=new LivingWorld(false),fork=new LivingWorld(false),x=5.6+(seed-201)*1.2,y=(seed-202)*.5,h=w.addObject(x,y,.48+.04*(seed-201),[.1,.85,.8]);
 const schedule=(tick:number):Demand=>({drive:.1,turn:.06*Math.sin(tick/120+seed),gazeRate:.1*Math.cos(tick/90+seed)});
 function advance(world:LivingWorld,tick:number,d:Demand){if(family!=='static'){const t=tick/120;world.moveObject(h,x,y+.32*(family==='reversal'&&t>3?6-t:t));}world.step(d);}
 let previous=w.observe(),count=0,rejected=0;const records=[];
 for(let tick=0;tick<720;tick++){
  const current=w.observe();
  if(tick>0&&tick%24===0&&tick+24<=720){
   const patches=visibleTurquoisePatches(current.retina),cp=w.captureCheckpoint();
   if(patches.length!==1||patches[0].clipped){rejected++;}else{
    const p=patches[0],scores:Record<typeof policies[number],number[]>={learned:[],noHistory:[],motorOnly:[],bodyGaze:[],reactive:[]};let valid=true;
    for(const d of candidates){const input=sensoryFeatures(previous,current,d);if(!input){valid=false;break;}
     const gaze=current.proprio.gaze,next=Math.max(-Math.PI/2,Math.min(Math.PI/2,gaze+d.gazeRate*.6));
     scores.learned.push(Math.abs(wrap(p.bearing+model.predict(input)[0])));scores.noHistory.push(Math.abs(wrap(p.bearing+noHistory.predict(input.slice(2))[0])));scores.motorOnly.push(Math.abs(wrap(p.bearing+motorOnly.predict([input[6],input[7],input[9],input[10]])[0])));
     scores.bodyGaze.push(Math.abs(wrap(p.bearing-current.proprio.omega*.2-(next-gaze))));
     scores.reactive.push(Math.abs(wrap(p.bearing-(next-gaze))));
    }
    const selected=Object.fromEntries(policies.map(n=>[n,scores[n].reduce((best,value,i)=>value<scores[n][best]-1e-12||(Math.abs(value-scores[n][best])<=1e-12&&Math.abs(candidates[i].turn)<Math.abs(candidates[best].turn))?i:best,0)])) as Record<typeof policies[number],number>;
    const truth:number[]=[];
    if(valid)for(const d of candidates){fork.restoreCheckpoint(cp);let branchValid=true;
     for(let j=0;j<24;j++){advance(fork,tick+j,d);if((j+1)%4===0){const pp=visibleTurquoisePatches(fork.observe().retina);branchValid=branchValid&&pp.length===1&&!pp[0].clipped;}}
     const pp=visibleTurquoisePatches(fork.observe().retina);if(!branchValid){valid=false;break;}truth.push(Math.abs(pp[0].bearing));
    }
    const after=w.captureCheckpoint();if(JSON.stringify(w.observe())!==JSON.stringify(current)||!Buffer.from(cp.physics).equals(Buffer.from(after.physics)))throw new Error('Source mutation');
    if(valid){const best=Math.min(...truth);records.push({tick,selected,cost:Object.fromEntries(policies.map(n=>[n,truth[selected[n]]])),regret:Object.fromEntries(policies.map(n=>[n,truth[selected[n]]-best])),best});count++;}else rejected++;
   }
  }
  if(tick%4===0)previous=current;advance(w,tick,schedule(tick));
 }
 episodes.push({id,family,seed,examples:count,masked:rejected,records});evaluated+=count;masked+=rejected;w.free();fork.free();
}
function summarize(records:typeof episodes[number]['records']){return {examples:records.length,cost:Object.fromEntries(policies.map(n=>[n,records.reduce((s,r)=>s+r.cost[n],0)/records.length])),regret:Object.fromEntries(policies.map(n=>[n,records.reduce((s,r)=>s+r.regret[n],0)/records.length]))};}
const result={modelSha256:createHash('sha256').update(JSON.stringify(states)).digest('hex'),scope:'Matched-state one-step action ranking. Authored centering objective; no closed-loop organism/motivation claim. Weights frozen before new seeds.',candidates,evaluated,masked,summary:summarize(episodes.flatMap(e=>e.records)),episodeComparison:Object.fromEntries(policies.filter(n=>n!=='learned').map(n=>{const differences=episodes.map(e=>{const s=summarize(e.records);return s.cost.learned-s.cost[n];});return [n,{wins:differences.filter(d=>d<-1e-12).length,ties:differences.filter(d=>Math.abs(d)<=1e-12).length,losses:differences.filter(d=>d>1e-12).length}];})),byEpisode:Object.fromEntries(episodes.map(e=>[e.id,summarize(e.records)])),episodes};
writeFileSync('evidence/living-organism/action-ranking.json',JSON.stringify(result,null,2)+'\n');console.log(JSON.stringify({summary:result.summary,byEpisode:result.byEpisode,evaluated,masked},null,2));
