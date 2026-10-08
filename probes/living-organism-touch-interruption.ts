import {LivingWorld,initLivingWorld,type Demand,type PrivateFrame} from '../src/living-organism/world';
import {TouchInterruption} from '../src/living-organism/touch-interruption-baseline';
import {SensoryRegressor} from '../src/living-organism/sensory-regressor';
import {sensoryFeatures} from '../src/living-organism/sensory-features';
import {visibleTurquoisePatches} from '../src/living-organism/retina-geometry';
import {readFileSync,writeFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
await initLivingWorld();const wrap=(a:number)=>Math.atan2(Math.sin(a),Math.cos(a));
const state=JSON.parse(readFileSync('evidence/living-organism/action-conditioned.json','utf8')).models.motorOnly,model=new SensoryRegressor();model.restore(state);
const candidates:Demand[]=[];for(const turn of [-.12,0,.12])for(const gazeRate of [-.15,0,.15])candidates.push({drive:.12,turn,gazeRate});
const families=['pushable-target','obstacle','rear-obstacle','receding-stopping','occlusion','similar'],episodes=[];
for(const family of families)for(let config=0;config<6;config++)for(const policy of ['continuous','interrupted']){
 const w=new LivingWorld(false),angle=-.3+config*.12,distance=5.2+config*.4,x=distance*Math.cos(angle),y=distance*Math.sin(angle),h=w.addObject(x,y,.5,[.1,.85,.8]),controller=new TouchInterruption();
 if(family==='obstacle')w.addWall(2.5,0,.18,1.4,[.4,.4,.45]);
 if(family==='rear-obstacle')w.addWall(-1.5,0,.15,.9,[.4,.4,.45]);
 const block=family==='occlusion'?w.addObject(100,100,.55,[.8,.2,.2]):null;
 if(family==='similar')w.addObject(x,y+1.5,.5,[.1,.85,.8]);
 let last=w.observe(),previous:PrivateFrame|null=null,intent:Demand={drive:0,turn:0,gazeRate:0},touchWindows=0,targetImpulse=0,otherImpulse=0,path=0,commandCost=0,visible=0,samples=0,cost=0;
 let lastActor=w.inspect().actor;const phases={active:0,quiet:0,backoff:0},trace=[],hash=createHash('sha256');let previousMode='active',forkVerified=false;
 for(let tick=0;tick<2160;tick++){
  const current=w.observe(),fresh=current.tick!==last.tick;
  if(fresh){previous=last;last=current;}
  if(tick%24===0){
   const ps=visibleTurquoisePatches(current.retina),input=previous?sensoryFeatures(previous,current,candidates[0]):null;
   if(input&&ps.length===1&&!ps[0].clipped){const scores=candidates.map(d=>{const a=sensoryFeatures(previous!,current,d)!;return Math.abs(wrap(ps[0].bearing+model.predict([a[6],a[7],a[9],a[10]])[0]));});const index=scores.reduce((best,value,i)=>value<scores[best]-1e-12||(Math.abs(value-scores[best])<=1e-12&&Math.abs(candidates[i].turn)<Math.abs(candidates[best].turn))?i:best,0);intent=candidates[index];}
   else intent={drive:0,turn:0,gazeRate:0};
  }
  const demand=policy==='interrupted'?controller.decide(current,intent):intent,cs=controller.capture(),mode=policy==='interrupted'?cs.mode:'active';
  commandCost+=Math.abs(demand.drive)/120;
  if(fresh){
   const ps=visibleTurquoisePatches(current.retina),usable=ps.length===1&&!ps[0].clipped,bearing=usable?Math.abs(ps[0].bearing):Math.PI/2;samples++;visible+=Number(usable);cost+=bearing;phases[mode]++;
   if(current.touch.some(v=>v>.001))touchWindows++;
   const host=w.inspectContactSample();for(const e of host.contacts){if(e.handle===h)targetImpulse+=e.impulse;else otherImpulse+=e.impulse;}
   hash.update(JSON.stringify({frame:current,demand,mode,host}));
   if(tick%60===0||mode!==previousMode)trace.push({tick,demand:{...demand},mode,bearing:usable?ps[0].bearing:null,extent:usable?ps[0].extent:null,touch:Array.from(current.touch),host});previousMode=mode;
   if(policy==='interrupted'&&mode==='quiet'&&!forkVerified){
    const a=new LivingWorld(false),b=new TouchInterruption();a.restoreCheckpoint(w.captureCheckpoint());b.restore(controller.capture());
    for(let j=0;j<48;j++){const f=a.observe(),da=b.decide(f,intent);a.step(da);}
    const a2=new LivingWorld(false),b2=new TouchInterruption();a2.restoreCheckpoint(w.captureCheckpoint());b2.restore(controller.capture());
    for(let j=0;j<48;j++)a2.step(b2.decide(a2.observe(),intent));
    if(JSON.stringify(a.observe())!==JSON.stringify(a2.observe())||JSON.stringify(b.capture())!==JSON.stringify(b2.capture()))throw new Error('Partial quiet fork diverged');a.free();a2.free();forkVerified=true;
   }
  }
  const t=tick/120;if(family==='receding-stopping')w.moveObject(h,x+.4*Math.min(t,6),y);
  if(block!==null)w.moveObject(block,t>=3&&t<5?2.5:100,t>=3&&t<5?0:100);
  w.step(demand);const actor=w.inspect().actor;path+=Math.hypot(actor.x-lastActor.x,actor.y-lastActor.y);lastActor=actor;
 }
 const target=w.inspect().objects.find(o=>o.handle===h)!;
 episodes.push({id:`${family}:${config}`,family,config,policy,angle,distance,samples,coverage:visible/samples,penalizedBearing:cost/samples,touchWindows,targetImpulse,otherImpulse,path,commandCost,phases,controller:controller.capture(),forkVerified,targetDisplacement:Math.hypot(target.x-x,target.y-y),trace,dataSha256:hash.digest('hex')});w.free();
}
const summarize=(es:typeof episodes)=>({episodes:es.length,touchWindows:es.reduce((s,e)=>s+e.touchWindows,0),targetImpulse:es.reduce((s,e)=>s+e.targetImpulse,0),otherImpulse:es.reduce((s,e)=>s+e.otherImpulse,0),coverage:es.reduce((s,e)=>s+e.coverage,0)/es.length,penalizedBearing:es.reduce((s,e)=>s+e.penalizedBearing,0)/es.length,path:es.reduce((s,e)=>s+e.path,0)/es.length,commandCost:es.reduce((s,e)=>s+e.commandCost,0)/es.length,resumptions:es.reduce((s,e)=>s+e.controller.resumptions,0)});
const result={scope:'Authored nonterminal touch interruption outside runtime. No target identity/success inference. 36scenarios x2policies18s, frozen motor-only centering.',modelSha256:createHash('sha256').update(JSON.stringify(state)).digest('hex'),settings:{episodeTicks:2160,samplesPerEpisode:539,measurementTicks:[4,2156],quietTicks:60,backoffTicks:42,recentTouchTicks:24},summary:Object.fromEntries(['continuous','interrupted'].map(p=>[p,summarize(episodes.filter(e=>e.policy===p))])),byFamily:Object.fromEntries(families.map(f=>[f,Object.fromEntries(['continuous','interrupted'].map(p=>[p,summarize(episodes.filter(e=>e.family===f&&e.policy===p))]))])),episodes};
writeFileSync('evidence/living-organism/touch-interruption.json',JSON.stringify(result)+'\n');console.log(JSON.stringify({summary:result.summary,byFamily:result.byFamily},null,2));
