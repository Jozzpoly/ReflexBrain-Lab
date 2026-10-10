import {beforeAll,describe,expect,it} from 'vitest';
import {
 E0_DT,E0_RADIUS,E0_MASS,E0_VMAX,E0_RAPIER as R,
} from '../../src/e0-body-seam';
import {LivingWorld,initLivingWorld,type PrivateFrame,type Checkpoint} from '../../src/living-organism/world';
import {retinalAngle} from '../../src/living-organism/retina-geometry';

/**
 * RB-VISION/A8: independent moving material geometry WHILE observing.
 *
 * Host alone translates the real Rapier fixed-wall colliders; no change flag,
 * world pose, object identity or true clearance reaches actor-side inference.
 * Real native RGB frames and actor-local proprioception build prior evidence.
 *
 * Competing authored rules:
 *  - two dense extra edge RGB arrays, one per viewpoint (192 extra rays);
 *  - four serial extra RGB questions per viewpoint (8 extra rays);
 *  - hold (no risk, but can miss progress);
 *  - push (no inspection, can hit a wall).
 *
 * Results remain an investigator-designed passability task and host-side cost,
 * NOT learned active perception, safety certification or material agency.
 * The serial queries now advance 4 actual physics ticks each, and host events
 * can change the geometry BETWEEN questions. Thus the cheap-query assumptions
 * of A7 (frozen optical source) are no longer guaranteed.
 */
type Spec={x:number;initial:number;final:number;when:'never'|'between'|'mid'};
type Inspect='dense'|'sequential4'|'hold'|'push';
type Observation={angles:number[];rgb:Float32Array};
type Phys={displacement:number;impulse:number;cost:number};
type Row={spec:Spec;inspect:Inspect;decision:'push'|'hold';
 trueBest:'push'|'hold';retinalFrame0:number;retinalFrame1:number;
 estimatedGap:number|null;edge0:number|null;edge1:number|null;
 privateOdom:number;trueOdom:number;
 firstNative:Float32Array;lastNative:Float32Array;
 materialCost:number;regret:number;probeRays:number;
 pushImpulse:number;pushDisplacement:number;
 evidenceAges:number[]};
const WALL_HEIGHT=2,WALL_THICK=.015,DT=E0_DT;
const GREY=[.39,.43,.47] as const, DARK=[.26,.29,.34] as const;
const BG=[.025,.04,.06] as const;
const idle={drive:0,turn:0,gazeRate:0};
const SPECIMENS:Spec[]=[2.7,3,3.3].flatMap(x=>
 ([{initial:.94,final:.94,when:'never'},
   {initial:1.06,final:1.06,when:'never'},
   {initial:.94,final:1.06,when:'between'},
   {initial:1.06,final:.94,when:'between'},
   {initial:.94,final:1.06,when:'mid'},
   {initial:1.06,final:.94,when:'mid'}] as const)
  .map(s=>({...s,x})));
function nativeAngles():number[]{
 return Array.from({length:96},(_,i)=>{
  const u=(i+.5)/96*2-1;return retinalAngle(u);
 });
}
function native(frame:PrivateFrame):Observation{
 return {angles:nativeAngles(),rgb:frame.retina};
}
function look(cp:Checkpoint,angles:number[]):Observation{
 const p=R.World.restoreSnapshot(cp.physics);
 if(!p)throw Error('A8 physics restore failed');
 try{
  const a=p.getRigidBody(cp.actorHandle);
  if(!a)throw Error('A8 actor absent');
  const pos=a.translation(),heading=a.rotation();
  const rgb=new Float32Array(angles.length*3);
  for(let i=0;i<angles.length;i++){
   const angle=angles[i]+heading,ray=new R.Ray(pos,{
    x:Math.cos(angle),y:Math.sin(angle),
   });
   let nearest=12,col:readonly number[]=BG;
   for(const s of cp.surfaces){
    const t=p.getCollider(s.handle).castRay(ray,12,true);
    if(t>=0&&t<nearest){nearest=t;col=s.color;}
   }
   rgb.set(col,i*3);
  }
  return {angles,rgb};
 }finally{p.free();}
}
function hitUpper(v:Observation,i:number):boolean{
 return Math.abs(v.rgb[i*3]-GREY[0])<.035
  &&Math.abs(v.rgb[i*3+1]-GREY[1])<.035
  &&Math.abs(v.rgb[i*3+2]-GREY[2])<.035;
}
function bracket(v:Observation):[number,number]|null {
 const positive=v.angles.map((angle,i)=>({angle,hit:hitUpper(v,i)}))
  .filter(s=>s.angle>0).sort((a,b)=>a.angle-b.angle);
 const first=positive.findIndex(s=>s.hit);
 if(first<=0)return null;
 return [positive[first-1].angle,positive[first].angle];
}
function edge(v:Observation):number|null{
 const pair=bracket(v);
 return pair?(pair[0]+pair[1])/2:null;
}
function denseAngles(frame:PrivateFrame):number[]{
 const coarse=edge(native(frame));
 if(coarse===null)throw Error('A8 native gray cue absent');
 return Array.from({length:96},(_,i)=>
  coarse+(-10+(i+.5)*20/96)*Math.PI/180);
}
function triangulate(a:number|null,b:number|null,travel:number):number|null{
 if(a===null||b===null||travel<=0)return null;
 const t0=Math.tan(a),t1=Math.tan(b);
 if(t1<=t0+.0001)return null;
 return travel*t0*t1/(t1-t0);
}
function build(s:Spec):LivingWorld{
 const w=new LivingWorld(false);
 w.addWall(s.x,WALL_HEIGHT+s.initial,
  WALL_THICK,WALL_HEIGHT,[...GREY]);
 w.addWall(s.x,-(WALL_HEIGHT+s.initial),
  WALL_THICK,WALL_HEIGHT,[...DARK]);
 return w;
}
/** HOST ONLY. Both walls physically translate; not a signal to the actor. */
function moveAperture(w:LivingWorld,newGap:number){
 const cp=w.captureCheckpoint();
 const physics=R.World.restoreSnapshot(cp.physics);
 if(!physics)throw Error('A8 world mutation restore failed');
 try {
  for(const s of cp.surfaces){
   const b=physics.getCollider(s.handle).parent();
   const isUpper=s.color[0]===GREY[0];
   const isLower=s.color[0]===DARK[0];
   if(!isUpper&&!isLower)throw Error('A8 unexpected surface');
   b.setTranslation({x:b.translation().x,
    y:(isUpper?1:-1)*(WALL_HEIGHT+newGap)},true);
  }
  physics.propagateModifiedBodyPositionsToColliders();
  const next={...cp,physics:physics.takeSnapshot()};
  w.restoreCheckpoint(next);
 }finally{physics.free();}
}
function physical(cp:Checkpoint,drive:0|1):Phys{
 const w=new LivingWorld(false);
 w.restoreCheckpoint(cp);
 try {
  const from=w.inspect().actor.x;let impulse=0;
  for(let i=0;i<180;i++){
   w.step({drive,turn:0,gazeRate:0});
   if((i+1)%4===0){
    impulse+=w.inspectContactSample().contacts.reduce(
     (sum,c)=>sum+c.impulse,0);
   }
  }
  const displacement=w.inspect().actor.x-from;
  return {displacement,impulse,
   cost:-displacement/E0_RADIUS+
    2*impulse/(E0_MASS*E0_VMAX)};
 }finally{w.free();}
}
/**
 * Eye queries are time-indexed. They cannot assume all four RGB answers
 * came from one static scene: each acquired ray consumes 4 actual ticks.
 * Edges are chosen from legal actor-private coarse RGB at latest sample.
 */
function sequentialEdge(w:LivingWorld,
 old:PrivateFrame,queries:number,onHalf:()=>void,
 onMove?:(before:PrivateFrame,after:PrivateFrame)=>void):{
 edge:number|null;times:number[];last:PrivateFrame
} {
 const initial=bracket(native(old));
 if(!initial)return {edge:null,times:[],last:old};
 let [lo,hi]=initial;
 const times:number[]=[];
 let last=old;
 for(let q=0;q<queries;q++){
  if(q===Math.floor(queries/2))onHalf();
  const m=(lo+hi)/2;
  const before=w.observe();
  for(let t=0;t<4;t++)w.step(idle);
  const frame=w.observe();
  if(onMove)onMove(before,frame);
  const h=hitUpper(look(w.captureCheckpoint(),[m]),0);
  if(h)hi=m;else lo=m;
  times.push(frame.tick);
  last=frame;
 }
 return {edge:(lo+hi)/2,times,last};
}
function run(s:Spec):Row[]{
 const w=build(s);
 try{
  const f0=w.observe(),cp0=w.captureCheckpoint();
  const dense0=edge(look(cp0,denseAngles(f0)));
  // Four one-ray RGB queries before locomotion, but an initial movement of
  // the static body from idle physics can happen only through dynamics.
  const q0=sequentialEdge(w,f0,4,()=>{});
  // All policies retain identical physical inputs at the moment of movement
  // within THIS specimen: gaze/inquiry never changes the motor controller.
  let prev=w.observe().proprio.forward,privateOdom=0;
  const origin=w.inspect().actor.x;
  for(let t=1;t<=40;t++){
   w.step({drive:1,turn:0,gazeRate:0});
   if(t%4===0){
    const frame=w.observe();
    privateOdom+=(prev+frame.proprio.forward)*.5*DT*4;
    prev=frame.proprio.forward;
   }
  }
  if(s.when==='between')moveAperture(w,s.final);
  // After the motor burst, the body can still coast during passive looking.
  // Integrate private proprioception for EVERY elapsed 4-tick sample window.
  const beforeRefresh=w.observe();
  for(let t=0;t<4;t++)w.step(idle);
  const f1=w.observe(),retinalFrame1=f1.tick;
  privateOdom+=.5*(beforeRefresh.proprio.forward+
   f1.proprio.forward)*DT*(f1.tick-beforeRefresh.tick);
  const dense1=edge(look(w.captureCheckpoint(),denseAngles(f1)));
  // A serial edge query can cross a hidden external material transition.
  const q1=sequentialEdge(w,f1,4,()=>{
   if(s.when==='mid')moveAperture(w,s.final);
  },(before,after)=>{
   privateOdom+=.5*(before.proprio.forward+after.proprio.forward)
    *DT*(after.tick-before.tick);
  });
  const after=w.observe();
  const finalCp=w.captureCheckpoint();
  const finallyNative=after.retina.slice();
  const trueOdom=w.inspect().actor.x-origin;
  // A dense last-minute refresh is available at the physically final time.
  const denseRefreshed=edge(look(finalCp,denseAngles(after)));
  const qEstimate=triangulate(q0.edge,q1.edge,privateOdom);
  const dEstimate=triangulate(dense0,denseRefreshed,privateOdom);
  const push=physical(finalCp,1),hold=physical(finalCp,0);
  const trueBest=push.cost<hold.cost?'push':'hold';
  const rows:Row[]=[];
  for(const inspect of ['dense','sequential4','hold','push'] as const){
   const estimate=inspect==='dense'?dEstimate:
    inspect==='sequential4'?qEstimate:null;
   const decision=inspect==='push'?'push':
    inspect==='hold'?'hold':
    estimate!==null && estimate>E0_RADIUS?'push':'hold';
   const materialCost=decision==='push'?push.cost:hold.cost;
   rows.push({
    spec:s,inspect,decision,trueBest,
    retinalFrame0:f0.tick,retinalFrame1,
    estimatedGap:estimate,
    edge0:inspect==='dense'?dense0:inspect==='sequential4'?q0.edge:null,
    edge1:inspect==='dense'?denseRefreshed:
      inspect==='sequential4'?q1.edge:null,
    privateOdom,trueOdom,firstNative:f0.retina.slice(),
    lastNative:finallyNative,materialCost,
    regret:materialCost-Math.min(push.cost,hold.cost),
    probeRays:inspect==='dense'?192:inspect==='sequential4'?8:0,
    pushImpulse:push.impulse,pushDisplacement:push.displacement,
    evidenceAges:inspect==='sequential4'?
     [...q0.times,...q1.times]:[],
   });
  }
  if(dense1===null)throw Error('A8 pre-transition dense not observed');
  return rows;
 }finally{w.free();}
}
function summary(rows:Row[]){
 return (['dense','sequential4','hold','push'] as const).map(inspect=>{
  const a=rows.filter(r=>r.inspect===inspect);
  const part=(when:Spec['when'])=>a.filter(r=>r.spec.when===when);
  return {
   inspect,scenes:a.length,rays:a[0]?.probeRays,
   correct:a.filter(x=>x.decision===x.trueBest).length,
   correctStatic:part('never').filter(x=>x.decision===x.trueBest).length,
   correctBetween:part('between').filter(x=>x.decision===x.trueBest).length,
   correctMid:part('mid').filter(x=>x.decision===x.trueBest).length,
   meanRegret:a.reduce((t,x)=>t+x.regret,0)/a.length,
   meanGapError:a.filter(r=>r.estimatedGap!==null)
    .reduce((t,x)=>t+Math.abs(x.estimatedGap!-x.spec.final),0)
     /Math.max(1,a.filter(x=>x.estimatedGap!==null).length),
   missingEstimates:a.filter(r=>r.estimatedGap===null).length,
  };
 });
}

type ThreePhase={x:number;from:number;to:number;change:boolean};
type ThreeResult={
 spec:ThreePhase;edges:[number|null,number|null,number|null];
 privateTravel:[number,number];trueTravel:[number,number];
 gaps:[number|null,number|null,number|null];
 difference:number|null;flagged:boolean;
 best:'push'|'hold';choice:'push'|'hold';twoViewChoice:'push'|'hold';
 regret:number;twoViewRegret:number;holdRegret:number;
 rays:number;impulse:number;
};
const THREE_CASES:ThreePhase[]=[2.7,3,3.3].flatMap(x=>
 [{from:.94,to:.94,change:false},
  {from:1.06,to:1.06,change:false},
  {from:.94,to:1.06,change:true},
  {from:1.06,to:.94,change:true}].map(v=>({...v,x})));
function threeViews(spec:ThreePhase):ThreeResult{
 const w=build({x:spec.x,initial:spec.from,final:spec.to,
  when:spec.change?'between':'never'});
 try{
  const original=w.observe();
  const cp0=w.captureCheckpoint();
  const e0=edge(look(cp0,denseAngles(original)));
  const hostX0=w.inspect().actor.x;
  const obtain=(duration:number)=>{
   let prev=w.observe().proprio.forward,travel=0;
   const startX=w.inspect().actor.x;
   for(let i=1;i<=duration;i++){
    w.step({drive:1,turn:0,gazeRate:0});
    if(i%4===0){
     const f=w.observe();
     travel+=(prev+f.proprio.forward)*.5*DT*4;
     prev=f.proprio.forward;
    }
   }
   const frame=w.observe(),cp=w.captureCheckpoint();
   return {edge:edge(look(cp,denseAngles(frame))),
    privateTravel:travel,trueTravel:w.inspect().actor.x-startX};
  };
  const t1=obtain(24);
  if(spec.change)moveAperture(w,spec.to);
  const t2=obtain(24);
  const es:[number|null,number|null,number|null]=[e0,t1.edge,t2.edge];
  const g01=triangulate(e0,t1.edge,t1.privateTravel);
  const g12=triangulate(t1.edge,t2.edge,t2.privateTravel);
  const g02=triangulate(e0,t2.edge,
   t1.privateTravel+t2.privateTravel);
  const difference=g01!==null&&g12!==null?
   Math.abs(g01-g12):null;
  // This fixed interpretation is authored and deliberately bounded.
  // Threshold 12cm is not fitted to these scenes after outcomes.
  const flagged=difference===null||difference>.12;
  const choice=(!flagged&&g12!==null&&g12>E0_RADIUS)
   ?'push':'hold';
  const twoViewChoice=g02!==null&&g02>E0_RADIUS?'push':'hold';
  const finalCp=w.captureCheckpoint();
  const drive=physical(finalCp,1),stationary=physical(finalCp,0);
  const best=drive.cost<stationary.cost?'push':'hold';
  const chosenCost=(decision:'push'|'hold')=>
   decision==='push'?drive.cost:stationary.cost;
  const oracle=Math.min(drive.cost,stationary.cost);
  if(!Number.isFinite(w.inspect().actor.x-hostX0))
   throw Error('A9 nonfinite host movement');
  return {spec,edges:es,
   privateTravel:[t1.privateTravel,t2.privateTravel],
   trueTravel:[t1.trueTravel,t2.trueTravel],
   gaps:[g01,g12,g02],difference,flagged,best,
   choice,twoViewChoice,
   regret:chosenCost(choice)-oracle,
   twoViewRegret:chosenCost(twoViewChoice)-oracle,
   holdRegret:stationary.cost-oracle,
   rays:288,impulse:drive.impulse};
 }finally{w.free();}
}

beforeAll(initLivingWorld);
describe('RB-VISION/A8 independently changing Rapier aperture during real RGB sampling',()=>{
 it('compares current lawful evidence and true body action costs under hidden wall changes',()=>{
  const results=SPECIMENS.flatMap(run);
  expect(results.length).toBe(SPECIMENS.length*4);
  expect(results.every(r=>r.regret>=-1e-6)).toBe(true);
  expect(results.every(r=>Number.isFinite(r.privateOdom)
    &&Number.isFinite(r.trueOdom))).toBe(true);
  expect(results.every(r=>r.evidenceAges.length===8
    ||r.inspect!=='sequential4')).toBe(true);
  const scores=summary(results);
  console.log('RB_VISION_A8_MOVING_GATE '+JSON.stringify(scores));
  console.log('RB_VISION_A8_CASES '+JSON.stringify(results
   .filter(r=>r.inspect==='sequential4'||r.inspect==='dense')
   .map(r=>({x:r.spec.x,from:r.spec.initial,to:r.spec.final,
    when:r.spec.when,inspect:r.inspect,
    estimate:r.estimatedGap===null?null:+r.estimatedGap.toFixed(4),
    decision:r.decision,best:r.trueBest,
    regret:+r.regret.toFixed(3),
   }))));
  // Never assert a winner from authored geometry. The actual falsifier:
  // material post-transition geometry must alter what forward motion costs.
  expect(results.filter(r=>r.spec.final===.94)
   .some(r=>r.pushImpulse>0)).toBe(true);
  expect(results.filter(r=>r.spec.final===1.06)
   .some(r=>r.pushImpulse===0)).toBe(true);
 },120000);

 it('A9: asks if three privately acquired views expose material scene change',()=>{
  const results=THREE_CASES.map(threeViews);
  const compress=(filter:(r:ThreeResult)=>boolean)=>{
   const r=results.filter(filter);
   return {cases:r.length,
    flagged:r.filter(v=>v.flagged).length,
    correct:r.filter(v=>v.choice===v.best).length,
    twoViewCorrect:r.filter(v=>v.twoViewChoice===v.best).length,
    meanRegret:r.reduce((s,v)=>s+v.regret,0)/r.length,
    twoViewMeanRegret:r.reduce((s,v)=>s+v.twoViewRegret,0)/r.length,
    holdMeanRegret:r.reduce((s,v)=>s+v.holdRegret,0)/r.length,
    meanDifference:r.filter(v=>v.difference!==null)
     .reduce((s,v)=>s+v.difference!,0)/
     Math.max(1,r.filter(v=>v.difference!==null).length),
   };
  };
  const stats={static:compress(r=>!r.spec.change),
   changed:compress(r=>r.spec.change)};
  console.log('RB_VISION_A9_THREE_VIEW '+JSON.stringify(stats));
  console.log('RB_VISION_A9_TRACES '+JSON.stringify(results.map(x=>({
   x:x.spec.x,from:x.spec.from,to:x.spec.to,
   changed:x.spec.change,
   g01:x.gaps[0],g12:x.gaps[1],g02:x.gaps[2],
   difference:x.difference,flagged:x.flagged,
   choice:x.choice,twoView:x.twoViewChoice,best:x.best,
   regret:x.regret,
  }))));
  expect(results.every(x=>x.rays===288)).toBe(true);
  expect(results.every(x=>x.regret>=-1e-6&&x.twoViewRegret>=-1e-6))
   .toBe(true);
  expect(results.some(x=>x.spec.change&&x.impulse>0)).toBe(true);
  // Actual comparison is descriptive; no post-hoc tuned success threshold.
 },120000);

});
