import type {PrivateFrame} from './world';
import {visibleTurquoisePatches} from './retina-geometry';
type RayEvidence={tick:number;x:number;y:number;angle:number};
export type VisualEstimate={x:number;y:number;distance:number;angularResidual:number;assumption:'stationary-fragment'};
export type VisionState={lastTick:number|null;pose:{x:number;y:number;heading:number};rays:RayEvidence[];estimate:VisualEstimate|null;reason:'insufficient'|'tentative'|'missing'|'ambiguous'|'clipped'|'inconsistent'};
const wrap=(a:number)=>Math.atan2(Math.sin(a),Math.cos(a));
/** Coordinates are private integrated proprioception, never host position or object identity. */
export class PrivateVision{
 private state:VisionState={lastTick:null,pose:{x:0,y:0,heading:0},rays:[],estimate:null,reason:'insufficient'};
 observe(frame:PrivateFrame){
  const s=this.state;
  if(s.lastTick!==null&&frame.tick<=s.lastTick)return;
  const dt=s.lastTick===null?0:(frame.tick-s.lastTick)/120,p=s.pose;
  const rotation=frame.proprio.omega*dt,heading=p.heading+rotation/2;
  p.x+=(frame.proprio.forward*Math.cos(heading)-frame.proprio.lateral*Math.sin(heading))*dt;
  p.y+=(frame.proprio.forward*Math.sin(heading)+frame.proprio.lateral*Math.cos(heading))*dt;
  p.heading=wrap(p.heading+rotation);s.lastTick=frame.tick;s.estimate=null;
  const patches=visibleTurquoisePatches(frame.retina);
  if(patches.length!==1||patches[0].clipped){
   s.rays=[];s.reason=patches.length===0?'missing':patches.length>1?'ambiguous':'clipped';return;
  }
  const angle=wrap(p.heading+frame.proprio.gaze+patches[0].bearing);
  const last=s.rays.at(-1);
  if(last&&Math.abs(wrap(angle-last.angle))>.35){s.rays=[];s.reason='inconsistent';return;}
  s.rays=s.rays.filter(r=>frame.tick-r.tick<=240);
  s.rays.push({tick:frame.tick,x:p.x,y:p.y,angle});
  s.reason='insufficient';
  if(s.rays.length<3||!s.rays.some(r=>Math.hypot(r.x-p.x,r.y-p.y)>=.5))return;
  let a=0,b=0,c=0,d=0,e=0;
  for(const r of s.rays){const nx=-Math.sin(r.angle),ny=Math.cos(r.angle),v=nx*r.x+ny*r.y;a+=nx*nx;b+=nx*ny;c+=ny*ny;d+=nx*v;e+=ny*v;}
  const det=a*c-b*b;if(det/s.rays.length**2<.0001)return;
  const x=(d*c-e*b)/det,y=(e*a-d*b)/det;
  let squaredError=0;
  for(const r of s.rays){const dx=x-r.x,dy=y-r.y,forward=dx*Math.cos(r.angle)+dy*Math.sin(r.angle);
   if(forward<=0){s.reason='inconsistent';return;}
   squaredError+=Math.atan2(-dx*Math.sin(r.angle)+dy*Math.cos(r.angle),forward)**2;
  }
  const angularResidual=Math.sqrt(squaredError/s.rays.length);
  if(angularResidual>.08){s.reason='inconsistent';return;}
  s.estimate={x,y,distance:Math.hypot(x-p.x,y-p.y),angularResidual,assumption:'stationary-fragment'};s.reason='tentative';
 }
 capture():VisionState{return structuredClone(this.state);}
 restore(state:VisionState){this.state=structuredClone(state);}
}
