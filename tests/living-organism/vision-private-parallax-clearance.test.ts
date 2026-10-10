import { beforeAll, describe, expect, it } from 'vitest';
import {
 E0_DT,E0_RADIUS,E0_MASS,E0_VMAX,E0_RAPIER as R,
} from '../../src/e0-body-seam';
import { LivingWorld, initLivingWorld, type PrivateFrame } from '../../src/living-organism/world';
import { retinalAngle } from '../../src/living-organism/retina-geometry';

/**
 * RB-VISION/A6: two lawful RGB views + actor-private odometry estimate
 * a material gap, WITHOUT an actor-private World position or wall distance.
 *
 * A researcher defines activity "attempt to pass" and the rule comparing
 * estimated clearance with body radius. This does not create an actor-owned
 * goal, a learned model, depth sense or a general map.
 *
 * Native retina publishes RGB+gaze+velocity. The extra 96-ray inspection
 * is a hypothetical optical allocator, explicitly not native LivingWorld.
 * Wide and focused rivals purchase the same TWO extra 96-ray inspections.
 */
type Spec={wallX:number;halfGap:number};
type Sensor='wide'|'dense';
type View={angles:number[];rgb:Float32Array};
type Phys={displacement:number;impulse:number;cost:number};
type Result={spec:Spec;style:'wide-parallax'|'dense-parallax'|'fixed-range-probe';
 initialNative:Float32Array;privateMove:number;hostMove:number;
 edge0:number|null;edge1:number|null;inferredGap:number|null;
 chose:'push'|'hold';physical:'push'|'hold';
 push:Phys;hold:Phys;chosenCost:number;costRegret:number;
 rayBudget:number};
const GAPS=[.92,.95,.97,.99,1.01,1.03,1.05,1.08];
const WALL_X=[2.7,3,3.3];
const CASES:Spec[]=WALL_X.flatMap(wallX=>
 GAPS.map(halfGap=>({wallX,halfGap})));
const G=[.39,.43,.47] as const,L=[.26,.29,.34] as const,
 BG=[.025,.04,.06] as const;
const IDLE={drive:0,turn:0,gazeRate:0};
const HALF_H=2,HALF_X=.015;
function worldFor(s:Spec){
 const w=new LivingWorld(false);
 w.addWall(s.wallX,HALF_H+s.halfGap,HALF_X,HALF_H,[...G]);
 w.addWall(s.wallX,-(HALF_H+s.halfGap),HALF_X,HALF_H,[...L]);
 return w;
}
function nativeAngles():number[]{
 return Array.from({length:96},(_,i)=>{
  const u=(i+.5)/96*2-1;
  return retinalAngle(u);
 });
}
function rgbAt(cp:ReturnType<LivingWorld['captureCheckpoint']>,
 angles:number[]):View{
 const rapier=R.World.restoreSnapshot(cp.physics);
 if(!rapier)throw Error('A6 restoration failed');
 try{
  const body=rapier.getRigidBody(cp.actorHandle);
  if(!body)throw Error('A6 actor missing');
  const pos=body.translation(),heading=body.rotation();
  const rgb=new Float32Array(angles.length*3);
  for(let i=0;i<angles.length;i++){
   const ang=angles[i]+heading;
   const ray=new R.Ray(pos,{x:Math.cos(ang),y:Math.sin(ang)});
   let best=12,col:readonly number[]=BG;
   for(const surface of cp.surfaces){
    const t=rapier.getCollider(surface.handle).castRay(ray,12,true);
    if(t>=0&&t<best){best=t;col=surface.color;}
   }
   rgb.set(col,i*3);
  }
  return {angles,rgb};
 }finally{rapier.free();}
}
function upper(view:View,i:number):boolean {
 return Math.abs(view.rgb[3*i]-G[0])<.035
  &&Math.abs(view.rgb[3*i+1]-G[1])<.035
  &&Math.abs(view.rgb[3*i+2]-G[2])<.035;
}
function edge(view:View):number|null{
 const samples=view.angles
  .map((a,i)=>({a,hit:upper(view,i)}))
  .filter(x=>x.a>0).sort((p,q)=>p.a-q.a);
 const i=samples.findIndex(x=>x.hit);
 if(i<=0)return null;
 return (samples[i].a+samples[i-1].a)/2;
}
function anglesFor(style:Sensor,priorNative:PrivateFrame):number[]{
 if(style==='wide')return Array.from({length:96},
  (_,i)=>(-80+(i+.5)*160/96)*Math.PI/180);
 // The focus center comes from *current lawful coarse retina pixels*.
 const coarse=edge({angles:nativeAngles(),rgb:priorNative.retina});
 if(coarse===null)throw Error('A6 no legal upper-boundary cue');
 return Array.from({length:96},(_,i)=>coarse+
  (-10+(i+.5)*20/96)*Math.PI/180);
}
function gapEstimate(e0:number|null,e1:number|null,privateMove:number)
 :number|null {
 if(e0===null||e1===null||privateMove<=0)return null;
 const a=Math.tan(e0),b=Math.tan(e1);
 if(!(b>a+.0001))return null;
 return privateMove*a*b/(b-a);
}
function physical(cp:ReturnType<LivingWorld['captureCheckpoint']>,drive:0|1):Phys{
 const w=new LivingWorld(false);
 w.restoreCheckpoint(cp);
 try{
  const start=w.inspect().actor.x;
  let impulse=0;
  for(let i=0;i<180;i++){
   w.step({drive,turn:0,gazeRate:0});
   if((i+1)%4===0)impulse+=w.inspectContactSample().contacts
    .reduce((sum,c)=>sum+c.impulse,0);
  }
  const displacement=w.inspect().actor.x-start;
  return {displacement,impulse,
   cost:-displacement/E0_RADIUS+2*impulse/(E0_MASS*E0_VMAX)};
 }finally{w.free();}
}
function run(s:Spec):Result[]{
 const w=worldFor(s);
 try {
  const initial=w.observe();
  const p0=w.captureCheckpoint();
  const v0={
   wide:rgbAt(p0,anglesFor('wide',initial)),
   dense:rgbAt(p0,anglesFor('dense',initial)),
  };
  // This self-motion is THE SAME on all experimental arms; no actor
  // gets privileged true displacement. Sampling proprio every 4 ticks.
  let lastForward=initial.proprio.forward,privateMove=0;
  const hostStart=w.inspect().actor.x;
  for(let i=1;i<=40;i++){
   w.step({drive:1,turn:0,gazeRate:0});
   if(i%4===0){
    const f=w.observe();
    privateMove+=.5*(lastForward+f.proprio.forward)*E0_DT*4;
    lastForward=f.proprio.forward;
   }
  }
  const hostMove=w.inspect().actor.x-hostStart;
  const f1=w.observe();
  const end=w.captureCheckpoint();
  const v1={
   wide:rgbAt(end,anglesFor('wide',f1)),
   dense:rgbAt(end,anglesFor('dense',f1)),
  };
  const push=physical(end,1),hold=physical(end,0);
  const physicalChoice=push.cost<hold.cost?'push':'hold';
  const results:Result[]=[];
  for(const sensor of ['wide','dense'] as const){
   const e0=edge(v0[sensor]),e1=edge(v1[sensor]);
   const inferredGap=gapEstimate(e0,e1,privateMove);
   // Unknown is not equal to "safe passage".
   const chose=inferredGap!==null&&inferredGap>E0_RADIUS
    ?'push':'hold';
   const chosenCost=chose==='push'?push.cost:hold.cost;
   results.push({spec:s,style:sensor==='wide'?'wide-parallax':'dense-parallax',
    initialNative:initial.retina.slice(),privateMove,hostMove,
    edge0:e0,edge1:e1,inferredGap,
    chose,physical:physicalChoice,push,hold,chosenCost,
    costRegret:chosenCost-Math.min(push.cost,hold.cost),
    rayBudget:2*96});
  }
  // Strong cheap, but FRAGILE, 1-query baseline calibrated to x=3.
  // Its extra ray is obtained from the same legal RGB transducer.
  const theta=Math.atan2(E0_RADIUS,3-privateMove);
  const probe=rgbAt(end,[theta]);
  const hit=upper(probe,0);
  const chose=hit?'hold':'push';
  const cost=chose==='push'?push.cost:hold.cost;
  results.push({spec:s,style:'fixed-range-probe',
   initialNative:initial.retina.slice(),privateMove,hostMove,
   edge0:null,edge1:theta,inferredGap:null,chose,
   physical:physicalChoice,push,hold,chosenCost:cost,
   costRegret:cost-Math.min(push.cost,hold.cost),rayBudget:1});
  return results;
 }finally{w.free();}
}
function summary(rows:Result[]){
 const styles=['wide-parallax','dense-parallax','fixed-range-probe'] as const;
 return styles.map(style=>{
  const r=rows.filter(x=>x.style===style);
  const values=r.map(x=>x.inferredGap===null?null:
   x.inferredGap-x.spec.halfGap).filter(
   (x):x is number=>x!==null);
  return {style,cases:r.length,
   optimal:r.filter(x=>x.chose===x.physical).length,
   calibratedOptimal:r.filter(x=>x.spec.wallX===3
    &&x.chose===x.physical).length,
   regret:r.reduce((sum,x)=>sum+x.costRegret,0)/r.length,
   meanGapError:values.length?
    values.reduce((sum,x)=>sum+Math.abs(x),0)/values.length:null,
   inferredNull:r.filter(x=>x.inferredGap===null).length,
  };
 });
}
beforeAll(initLivingWorld);
describe('RB-VISION/A6 private two-view odometry parallax vs fixed geometry',()=>{
 it('checks lawful optical geometry after self-motion in 24 material scenes',()=>{
  const results=CASES.flatMap(run);
  const scores=summary(results);
  expect(results.length).toBe(72);
  expect(results.every(x=>x.privateMove>0&&x.hostMove>0)).toBe(true);
  expect(results.every(x=>x.costRegret>=-1e-6)).toBe(true);
  expect(results.some(x=>x.push.impulse>0)).toBe(true);
  expect(results.some(x=>x.push.impulse===0)).toBe(true);
  console.log('RB_VISION_A6_PRIVATE_PARALLAX '+JSON.stringify(scores));
  console.log('RB_VISION_A6_ROWS '+JSON.stringify(results
   .filter(x=>x.style==='dense-parallax').map(x=>({
    x:x.spec.wallX,gap:x.spec.halfGap,
    privateMove:+x.privateMove.toFixed(4),
    trueMove:+x.hostMove.toFixed(4),
    estimate:x.inferredGap===null?null:+x.inferredGap.toFixed(4),
    choice:x.chose,best:x.physical,
    regret:+x.costRegret.toFixed(3),
   }))));
 },120000);
 it('recognizes that initially identical coarse RGB need not mean same clearance',()=>{
  const a=run({wallX:3,halfGap:.97});
  const b=run({wallX:3,halfGap:1.03});
  expect(Array.from(a[0].initialNative))
   .toEqual(Array.from(b[0].initialNative));
  expect(a[0].physical).toBe('hold');
  expect(b[0].physical).toBe('push');
 },30000);
});
