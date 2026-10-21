import {E0_OMEGA_MAX,E0_TAU_TURN} from '../e0-body-seam';
import type {PrivateFrame} from './world';

/**
 * Experimental *physical body sensor* interpretation: a pre-transducer motor
 * command readback is available as bodily telemetry. It is not an inference
 * from the original RGB/touch/proprio frame and it never includes WHO selected
 * the motor command, scenario ID, World position or hidden actuator gain.
 *
 * No assertion of self-originated intent follows from this channel.
 */
export type MotorCopyState={
  version:1;tick:number|null;omega:number;sum:number;steps:number;
  gain:number;accepted:number;insufficient:number;
};
export class MotorCopyCredit {
  private s:MotorCopyState={version:1,tick:null,omega:0,sum:0,
    steps:0,gain:1,accepted:0,insufficient:0};
  observe(frame:PrivateFrame) {
    const s=this.s;
    if(s.tick===null){s.tick=frame.tick;s.omega=frame.proprio.omega;return;}
    const interval=frame.tick-s.tick;
    if(interval===0)return;
    if(interval<0)throw Error('Motor feedback went backwards');
    if(s.steps===interval&&s.steps>0&&Math.abs(s.sum/s.steps)>.06) {
      const alpha=Math.exp(-(interval/120)/E0_TAU_TURN);
      const delivered=s.sum/s.steps;
      const estimate=(frame.proprio.omega-alpha*s.omega)/
        (E0_OMEGA_MAX*(1-alpha)*delivered);
      if(Number.isFinite(estimate)){
        s.gain=.75*s.gain+.25*Math.max(-2,Math.min(2,estimate));
        s.accepted++;
      }else s.insufficient++;
    }else s.insufficient++;
    s.omega=frame.proprio.omega;s.tick=frame.tick;s.sum=0;s.steps=0;
  }
  /** The ONLY extra actor-legal sensor candidate: pre-transducer motor signal. */
  actuatorReadback(turn:number) {
    if(!Number.isFinite(turn))throw Error('Nonfinite motor copy');
    this.s.sum+=turn;this.s.steps++;
  }
  state():MotorCopyState{return {...this.s};}
  restore(s:MotorCopyState){
    if(s.version!==1||![s.omega,s.sum,s.steps,s.gain,
      s.accepted,s.insufficient].every(Number.isFinite))throw Error('Invalid readback state');
    this.s={...s};
  }
}
