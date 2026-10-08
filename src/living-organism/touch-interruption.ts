import type {Demand,PrivateFrame} from './world';
export type TouchInterruptionState={mode:'active'|'quiet'|'backoff'|'brake';lastTick:number|null;until:number;lastTouch:number|null;lastDrive:number;interruptions:number;resumptions:number;withdrawals:number;demand:Demand;cancelOppositeTouch:boolean;lastSector:number|null;backoffSector:number|null;cancellations:number;brakeAfterBackoff:boolean;brakeDrive:number;brakes:number;brakeTimeouts:number};
const zero=():Demand=>({drive:0,turn:0,gazeRate:0});
/** Authored interruption regulator. Touch is an event, never success or identity. */
export class TouchInterruption{
 private state:TouchInterruptionState={mode:'active',lastTick:null,until:0,lastTouch:null,lastDrive:0,interruptions:0,resumptions:0,withdrawals:0,demand:zero(),cancelOppositeTouch:false,lastSector:null,backoffSector:null,cancellations:0,brakeAfterBackoff:false,brakeDrive:0,brakes:0,brakeTimeouts:0};
 constructor(cancelOppositeTouch=false,brakeAfterBackoff=false){this.state.cancelOppositeTouch=cancelOppositeTouch;this.state.brakeAfterBackoff=brakeAfterBackoff;}
 decide(frame:PrivateFrame,upstream:Demand):Demand{
  const s=this.state;if(s.lastTick!==null&&frame.tick<=s.lastTick)return {...s.demand};s.lastTick=frame.tick;
  if(Math.max(...frame.touch)>.001){s.lastTouch=frame.tick;s.lastSector=Array.from(frame.touch).indexOf(Math.max(...frame.touch));}
  if(s.mode==='active'){
   if(s.lastTouch===frame.tick){s.mode='quiet';s.until=frame.tick+60;s.interruptions++;s.demand=zero();}
   else{s.lastDrive=upstream.drive;s.demand={...upstream};}
  }else if(s.mode==='quiet'){
   s.demand=zero();
   if(frame.tick>=s.until){
    if(s.lastTouch!==null&&frame.tick-s.lastTouch<=24){s.mode='backoff';s.until=frame.tick+42;s.withdrawals++;s.backoffSector=s.lastSector;s.demand={drive:s.lastDrive<0?.12:-.12,turn:0,gazeRate:0};}
    else{s.mode='active';s.resumptions++;s.lastDrive=upstream.drive;s.demand={...upstream};}
   }
  }else if(s.mode==='backoff'){
   const opposite=s.backoffSector!==null&&frame.touch.some((value,i)=>{const delta=Math.abs(i-s.backoffSector!);return value>.001&&Math.min(delta,8-delta)>=3;});
   if((s.cancelOppositeTouch&&opposite)||frame.tick>=s.until){
    if(s.cancelOppositeTouch&&opposite)s.cancellations++;
    if(s.brakeAfterBackoff&&Math.sign(s.demand.drive)*frame.proprio.forward>.03){
     s.mode='brake';s.until=frame.tick+30;s.brakes++;s.brakeDrive=-s.demand.drive;s.demand={drive:s.brakeDrive,turn:0,gazeRate:0};
    }else{s.mode='quiet';s.until=frame.tick+60;s.demand=zero();}
   }
  }else{
   const stopped=Math.sign(s.brakeDrive)*frame.proprio.forward>=-.03;
   if(stopped||frame.tick>=s.until){if(!stopped)s.brakeTimeouts++;s.mode='quiet';s.until=frame.tick+60;s.demand=zero();}
  }
  return {...s.demand};
 }
 capture():TouchInterruptionState{return structuredClone(this.state);}
 restore(state:TouchInterruptionState){this.state=structuredClone(state);}
}
