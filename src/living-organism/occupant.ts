import type { Demand,PrivateFrame } from './world';
export type OccupantState = {
 lastTick:number|null;heading:number;lastDirection:number|null;lastSeenTick:number|null;
 mode:'explore'|'approach'|'inspect'|'yield';yieldUntil:number;closeSince:number|null;ignoreUntil:number;demand:Demand;
};
const wrap=(x:number)=>Math.atan2(Math.sin(x),Math.cos(x));
const clamp=(x:number)=>Math.max(-1,Math.min(1,x));
export class Occupant {
 private state:OccupantState={lastTick:null,heading:0,lastDirection:null,lastSeenTick:null,mode:'explore',yieldUntil:0,closeSince:null,ignoreUntil:0,demand:{drive:0,turn:0,gazeRate:0}};
 decide(frame:PrivateFrame):Demand{
  const s=this.state;
  if(s.lastTick!==null&&frame.tick<=s.lastTick)return {...s.demand};
  const dt=s.lastTick===null?0:(frame.tick-s.lastTick)/120;
  s.heading=wrap(s.heading+frame.proprio.omega*dt);s.lastTick=frame.tick;
  // Authored visual concern: largest contiguous turquoise patch, not object ID.
  const groups:Array<{sum:number;count:number}>=[];
  let group:{sum:number;count:number}|null=null;
  for(let i=0;i<96;i++){
   const r=frame.retina[i*3],g=frame.retina[i*3+1],b=frame.retina[i*3+2];
   if(g>.65&&b>.6&&r<.3){if(!group){group={sum:0,count:0};groups.push(group);}group.sum+=i;group.count++;}
   else group=null;
  }
  let patch:{sum:number;count:number}|undefined=groups.sort((a,b)=>b.count-a.count)[0];
  // A bounded authored inspection ends; this is not learned interest or identity.
  if(frame.tick<s.ignoreUntil)patch=undefined;
  if(patch&&patch.count>=18){
   s.closeSince??=frame.tick;
   if(frame.tick-s.closeSince>=300){s.ignoreUntil=frame.tick+1200;s.closeSince=null;s.lastDirection=null;s.lastSeenTick=null;patch=undefined;}
  }else s.closeSince=null;
  let bearing:number|null=null;
  if(patch){
   const u=(patch.sum/patch.count+.5)/96*2-1;
   bearing=wrap(frame.proprio.gaze+Math.sign(u)*u*u*(80*Math.PI/180));
   s.lastDirection=wrap(s.heading+bearing);s.lastSeenTick=frame.tick;
  }
  if(frame.touch.some(v=>v>.001))s.yieldUntil=frame.tick+48;
  if(frame.tick<s.yieldUntil){
   s.mode='yield';s.demand={drive:-.2,turn:.65,gazeRate:0};
  }else if(bearing!==null&&patch){
   s.mode='approach';
   s.demand={drive:Math.abs(bearing)<.3&&patch.count<18?.65:0,turn:clamp(bearing*2),gazeRate:clamp(-frame.proprio.gaze)};
  }else if(s.lastDirection!==null&&s.lastSeenTick!==null&&frame.tick-s.lastSeenTick<360){
   s.mode='inspect';const error=wrap(s.lastDirection-s.heading);
   s.demand={drive:Math.abs(error)<.25?.15:0,turn:clamp(error*2),gazeRate:clamp(-frame.proprio.gaze)};
  }else{
   s.lastDirection=null;s.lastSeenTick=null;s.mode='explore';
   s.demand={drive:.12,turn:.25,gazeRate:Math.sin(frame.tick/120)*.5};
  }
  return {...s.demand};
 }
 capture():OccupantState{return {...this.state,demand:{...this.state.demand}};}
 restore(state:OccupantState){this.state={...state,demand:{...state.demand}};}
}
