import type {Demand,PrivateFrame} from './world';
import {visibleTurquoisePatches} from './retina-geometry';
export type ApproachState={
 history:boolean;reconsider:boolean;lastTick:number|null;mode:'observe'|'approach'|'contact'|'abandoned'|'paused';
 anchorExtent:number|null;travel:number;abandonedTick:number|null;contactTick:number|null;pauseUntil:number;attempts:number;demand:Demand;
};
const clamp=(v:number)=>Math.max(-1,Math.min(1,v));
const stop=():Demand=>({drive:0,turn:0,gazeRate:0});
/** Authored contact-seeking experiment, not an autonomous goal or object tracker. */
export class ApproachEpisode{
 private state:ApproachState;
 constructor(history:boolean,reconsider=false){this.state={history,reconsider,lastTick:null,mode:'observe',anchorExtent:null,travel:0,abandonedTick:null,contactTick:null,pauseUntil:0,attempts:1,demand:stop()};}
 decide(f:PrivateFrame):Demand{
  const s=this.state;if(s.lastTick!==null&&f.tick<=s.lastTick)return {...s.demand};
  const dt=s.lastTick===null?0:(f.tick-s.lastTick)/120;s.lastTick=f.tick;
  if(s.mode==='contact'||s.mode==='abandoned')return {...s.demand};
  if(Math.max(...f.touch)>.001){s.mode='contact';s.contactTick=f.tick;s.demand=stop();return {...s.demand};}
  if(s.mode==='paused'){
   if(f.tick<s.pauseUntil)return {...s.demand};
   s.mode='observe';s.anchorExtent=null;s.travel=0;s.attempts++;
  }
  const patches=visibleTurquoisePatches(f.retina),p=patches.length===1&&!patches[0].clipped?patches[0]:null;
  if(!p){s.mode='observe';s.anchorExtent=null;s.travel=0;s.demand=stop();return {...s.demand};}
  // Only charge travel when the preceding command sought forward movement.
  // This still cannot distinguish our force from aligned external assistance.
  if(s.demand.drive>0)s.travel+=Math.max(0,f.proprio.forward)*dt;
  s.anchorExtent??=p.extent;
  if(s.history&&s.travel>=1){
   if(p.extent>=s.anchorExtent*1.1){s.anchorExtent=p.extent;s.travel=0;}
   else{s.mode=s.reconsider?'paused':'abandoned';s.abandonedTick??=f.tick;s.pauseUntil=f.tick+240;s.demand=stop();return {...s.demand};}
  }
  const bearing=Math.atan2(Math.sin(p.bearing+f.proprio.gaze),Math.cos(p.bearing+f.proprio.gaze));
  s.mode='approach';s.demand={drive:Math.abs(bearing)<.3?.25:0,turn:clamp(bearing*2),gazeRate:clamp(-f.proprio.gaze)};
  return {...s.demand};
 }
 capture():ApproachState{return structuredClone(this.state);}
 restore(state:ApproachState){this.state=structuredClone(state);}
}
