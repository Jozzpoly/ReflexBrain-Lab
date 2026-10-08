import {LivingWorld,initLivingWorld} from '../src/living-organism/world';
import {ApproachEpisode} from '../src/living-organism/approach-episode';
import {writeFileSync} from 'node:fs';
await initLivingWorld();
const scenarios=['stationary','lateral','receding','occluded','similar','observer-correlated','receding-then-still','stationary-far'] as const;
const results=[];
for(const scenario of scenarios)for(const angle of [-.2,0,.2])for(const policy of ['reactive','permanent','reconsider'] as const){
 const history=policy!=='reactive';
 const distance=scenario==='stationary-far'?11:6;
 const w=new LivingWorld(false),c=new ApproachEpisode(history,policy==='reconsider'),x=distance*Math.cos(angle),y=distance*Math.sin(angle);
 const h=w.addObject(x,y,.6,[.1,.85,.8]);
 const extra=scenario==='occluded'||scenario==='similar'?w.addObject(100,100,scenario==='occluded'?.5:.6,scenario==='occluded'?[.8,.2,.2]:[.1,.85,.8]):null;
 let commandCost=0,path=0,minTargetRange=Infinity,targetContactTick:number|null=null,otherContactTick:number|null=null;
 let previous=w.inspect().actor;
 let previousMode=c.capture().mode;
 const samples=[];
 for(let i=0;i<1200;i++){
  const t=i/120,a=w.inspect().actor;
  if(scenario==='lateral')w.moveObject(h,x,y+.35*t);
  if(scenario==='receding')w.moveObject(h,x+2.5*t,y);
  if(scenario==='receding-then-still')w.moveObject(h,x+2.5*Math.min(t,2),y);
  if(scenario==='observer-correlated')w.moveObject(h,x+a.x,y+a.y);
  if(extra!==null){
   if(scenario==='occluded')w.moveObject(extra,t>=1.5&&t<3?3:100,t>=1.5&&t<3?0:100);
   else w.moveObject(extra,t>=2?x:100,t>=2?y+2:100);
  }
  const f=w.observe(),d=c.decide(f),state=c.capture();
  const target=w.inspect().objects.find(o=>o.handle===h)!;
  const range=Math.hypot(target.x-a.x,target.y-a.y);minTargetRange=Math.min(minTargetRange,range);
  // Host-only target contact attribution: an approximate geometric tolerance,
  // not privileged identity supplied to the controller's private touch sensor.
  if(state.contactTick!==null&&state.contactTick===f.tick){
   if(range<=1.63)targetContactTick??=f.tick;else otherContactTick??=f.tick;
  }
  commandCost+=(d.drive*d.drive+d.turn*d.turn+d.gazeRate*d.gazeRate)/120;
  // Keep 2 Hz inspection snapshots plus every mode transition, not a verbose physics dump.
  if(i%60===0||state.mode!==previousMode)samples.push({tick:f.tick,mode:state.mode,drive:d.drive,turn:d.turn,extent:state.anchorExtent,travel:state.travel,hostRange:range});
  previousMode=state.mode;
  w.step(d);const next=w.inspect().actor;path+=Math.hypot(next.x-previous.x,next.y-previous.y);previous=next;
 }
 results.push({scenario,angle,policy,history,final:c.capture(),targetContactTick,otherContactTick,minTargetRange,commandCost,path,samples});w.free();
}
writeFileSync('evidence/living-organism/approach-episode.json',JSON.stringify({scope:'Authored 10-second contact-seeking episode, 8 families x 3 starts x 3 policies; extra families challenge permanent abandonment and far-field extent growth. Reconsider candidate adds authored 2-second suspension and retry; 1-unit / 10-percent progress thresholds unchanged. Only PrivateFrame enters controller. Target contact attribution uses host geometric tolerance 1.63, not exact contact-pair identity. Cost is squared command integral, not physical energy. Teleported targets and occluders are authored interventions, not natural dynamics.',results},null,2)+'\n');
console.log(JSON.stringify(results.map(({scenario,angle,policy,final,targetContactTick,otherContactTick,commandCost})=>({scenario,angle,policy,mode:final.mode,attempts:final.attempts,abandonedTick:final.abandonedTick,targetContactTick,otherContactTick,commandCost})),null,2));
