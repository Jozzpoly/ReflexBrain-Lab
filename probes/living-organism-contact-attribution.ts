import {LivingWorld,initLivingWorld} from '../src/living-organism/world';
import {ApproachEpisode} from '../src/living-organism/approach-episode';
import {readFileSync,writeFileSync} from 'node:fs';
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
 let geometricTargetContactTick:number|null=null,geometricOtherContactTick:number|null=null;
 let contactEvidence:ReturnType<LivingWorld['inspectContactSample']>|null=null;
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
  // Compare the former geometric proxy with the actual impulse-bearing pairs.
  // Both are host evaluation, never inputs to c.decide().
  if(state.contactTick!==null&&state.contactTick===f.tick){
   if(range<=1.63)geometricTargetContactTick??=f.tick;else geometricOtherContactTick??=f.tick;
   contactEvidence??=w.inspectContactSample();
   if(contactEvidence.tick!==f.tick)throw new Error('Contact evidence is out of phase');
   if(contactEvidence.contacts.some(e=>e.handle===h))targetContactTick??=f.tick;
   if(contactEvidence.contacts.some(e=>e.handle!==h))otherContactTick??=f.tick;
  }
  commandCost+=(d.drive*d.drive+d.turn*d.turn+d.gazeRate*d.gazeRate)/120;
  // Keep 2 Hz inspection snapshots plus every mode transition, not a verbose physics dump.
  if(i%60===0||state.mode!==previousMode)samples.push({tick:f.tick,mode:state.mode,drive:d.drive,turn:d.turn,extent:state.anchorExtent,travel:state.travel,hostRange:range});
  previousMode=state.mode;
  w.step(d);const next=w.inspect().actor;path+=Math.hypot(next.x-previous.x,next.y-previous.y);previous=next;
 }
 results.push({scenario,angle,policy,history,final:c.capture(),targetContactTick,otherContactTick,geometricTargetContactTick,geometricOtherContactTick,contactEvidence,minTargetRange,commandCost,path,samples});w.free();
}
const legacy=JSON.parse(readFileSync('evidence/living-organism/approach-episode.json','utf8')).results;
const unchangedPolicies=results.every((r,i)=>JSON.stringify(r.final)===JSON.stringify(legacy[i].final)&&r.commandCost===legacy[i].commandCost&&r.path===legacy[i].path);
const unchangedRecordedSnapshots=results.every((r,i)=>JSON.stringify(r.samples)===JSON.stringify(legacy[i].samples));
const disagreements=results.filter(r=>r.targetContactTick!==r.geometricTargetContactTick||r.otherContactTick!==r.geometricOtherContactTick).length;
writeFileSync('evidence/living-organism/approach-contact-attribution.json',JSON.stringify({scope:'72 matched ten-second episodes. Actual positive-impulse pairs aligned to private touch window replace geometric proximity as primary evaluation. geometric* fields preserve the former proxy. Brain receives no pair identities. Contact with target does not establish private recognition or intentional task success. Teleported targets are authored interventions; cost is command integral, not energy. unchangedPolicies checks final state/path/cost; unchangedRecordedSnapshots checks recorded 2Hz/transition snapshots, neither proves every physics frame identical.',unchangedPolicies,unchangedRecordedSnapshots,geometricDisagreements:disagreements,results},null,2)+'\n');
console.log({unchangedPolicies,unchangedRecordedSnapshots,geometricDisagreements:disagreements});
console.log(JSON.stringify(results.map(({scenario,angle,policy,final,targetContactTick,otherContactTick,commandCost})=>({scenario,angle,policy,mode:final.mode,attempts:final.attempts,abandonedTick:final.abandonedTick,targetContactTick,otherContactTick,commandCost})),null,2));
