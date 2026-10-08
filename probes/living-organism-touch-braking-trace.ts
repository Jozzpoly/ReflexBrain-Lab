import {LivingWorld,initLivingWorld,type Demand} from '../src/living-organism/world';
import {TouchInterruption} from '../src/living-organism/touch-interruption';
import {visibleTurquoisePatches} from '../src/living-organism/retina-geometry';
import {writeFileSync} from 'node:fs';
await initLivingWorld();const intent:Demand={drive:.12,turn:0,gazeRate:0},episodes=[];
for(const fixture of ['pinch-force'])for(let config=1;config<2;config++)for(const policy of ['interrupted','interrupted-cancel','interrupted-brake']){
 const w=new LivingWorld(false),c=new TouchInterruption(policy==='interrupted-cancel'||policy==='interrupted-brake',policy==='interrupted-brake'),target=w.addObject(5,(config-1)*.2,.5,[.1,.85,.8]);
 const front=fixture==='side-obstacle'?w.addWall(2.5,.9,.18,.35,[.4,.4,.45]):w.addWall(1.1,0,.05,1,[.4,.4,.45]);
 const rear=fixture==='pinch-force'?w.addWall(-1.08,0,.05,1,[.4,.4,.45]):null;
 const force=fixture==='side-obstacle'?0:[.5,1.5,4][config];let lastTick=-1,samples=0,touchWindows=0,visible=0,frontImpulse=0,rearImpulse=0,targetImpulse=0,commandCost=0,backoffFrames=0,minX=Infinity,maxX=-Infinity,lastMode='active';const events=[],samplesTrace=[];
 for(let tick=0;tick<1440;tick++){
  const f=w.observe(),d=policy==='continuous'?intent:c.decide(f,intent),state=c.capture(),actual=policy==='quiet-only'&&state.mode==='backoff'?{drive:0,turn:0,gazeRate:0}:d;
  if(f.tick!==lastTick&&f.tick>0){
   lastTick=f.tick;samples++;const patches=visibleTurquoisePatches(f.retina);visible+=Number(patches.length===1&&!patches[0].clipped);touchWindows+=Number(f.touch.some(t=>t>.001));
   for(const e of w.inspectContactSample().contacts){if(e.handle===front)frontImpulse+=e.impulse;if(e.handle===rear)rearImpulse+=e.impulse;if(e.handle===target)targetImpulse+=e.impulse;}
   backoffFrames+=Number(state.mode==='backoff');samplesTrace.push({tick:f.tick,x:w.inspect().actor.x,forward:f.proprio.forward,drive:actual.drive,mode:state.mode,rearImpulse:w.inspectContactSample().contacts.filter(e=>e.handle===rear).reduce((sum,e)=>sum+e.impulse,0)});
   if(state.mode!==lastMode){events.push({tick,mode:state.mode,demand:{...actual},privateTouch:Array.from(f.touch),actor:w.inspect().actor});lastMode=state.mode;}
  }
  commandCost+=Math.abs(actual.drive)/120;w.step(actual,{x:force,y:0});const x=w.inspect().actor.x;minX=Math.min(minX,x);maxX=Math.max(maxX,x);
 }
 episodes.push({fixture,config,policy,force,samples,touchWindows,coverage:visible/samples,frontImpulse,rearImpulse,targetImpulse,commandCost,minX,maxX,backoffFrames,controller:c.capture(),events,samplesTrace});w.free();
}
const result={scope:'Post-primary mechanical stress:constant upstream demand, no visual motor policy. No safety or success claim.',episodes};writeFileSync('evidence/living-organism/touch-braking-trace.json',JSON.stringify(result,null,2)+'\n');console.log(JSON.stringify(episodes.map(({events,...e})=>e),null,2));
