import type {Demand,PrivateFrame} from './world';
export type TouchInterruptionState={mode:'active'|'quiet'|'backoff';lastTick:number|null;until:number;lastTouch:number|null;lastDrive:number;interruptions:number;resumptions:number;withdrawals:number;demand:Demand};
const zero=():Demand=>({drive:0,turn:0,gazeRate:0});
/** Authored interruption regulator. Touch is an event, never success or identity. */
export class TouchInterruption{
 private state:TouchInterruptionState={mode:'active',lastTick:null,until:0,lastTouch:null,lastDrive:0,interruptions:0,resumptions:0,withdrawals:0,demand:zero()};
 decide(frame:PrivateFrame,upstream:Demand):Demand{
  const s=this.state;if(s.lastTick!==null&&frame.tick<=s.lastTick)return {...s.demand};s.lastTick=frame.tick;
  if(Math.max(...frame.touch)>.001)s.lastTouch=frame.tick;
  if(s.mode==='active'){
   if(s.lastTouch===frame.tick){s.mode='quiet';s.until=frame.tick+60;s.interruptions++;s.demand=zero();}
   else{s.lastDrive=upstream.drive;s.demand={...upstream};}
  }else if(s.mode==='quiet'){
   s.demand=zero();
   if(frame.tick>=s.until){
    if(s.lastTouch!==null&&frame.tick-s.lastTouch<=24){s.mode='backoff';s.until=frame.tick+42;s.withdrawals++;s.demand={drive:s.lastDrive<0?.12:-.12,turn:0,gazeRate:0};}
    else{s.mode='active';s.resumptions++;s.lastDrive=upstream.drive;s.demand={...upstream};}
   }
  }else if(frame.tick>=s.until){s.mode='quiet';s.until=frame.tick+60;s.demand=zero();}
  return {...s.demand};
 }
 capture():TouchInterruptionState{return structuredClone(this.state);}
 restore(state:TouchInterruptionState){this.state=structuredClone(state);}
}
