import { E0_OMEGA_MAX, E0_TAU_TURN } from '../e0-body-seam';
import { LivingWorld, type Demand, type Checkpoint, type PrivateFrame } from './world';
import { Occupant, type OccupantState } from './occupant';
import { PrivateVision, type VisionState } from './private-vision';

/**
 * Research pilot. The host is responsible for selecting ACTUALLY applied motor
 * input. This simple internal model may only train on uninterrupted motor
 * windows commanded AND executed by its own resident. An override merely
 * suppresses credit; it supplies no Owner/world label as actor perception.
 *
 * This does NOT identify all external causes; see frozen P0 contract.
 */
export type CreditMode = 'fixed' | 'sign-only';
export type MotorCreditState = {
  version: 1;
  lastTick: number | null;
  lastOmega: number;
  sumTurn: number;
  ownedSteps: number;
  elapsedSteps: number;
  gain: number;
  accepted: number;
  refusedOverride: number;
  refusedWeak: number;
};
export class MotorCredit {
  private s:MotorCreditState={
    version:1,lastTick:null,lastOmega:0,sumTurn:0,ownedSteps:0,
    elapsedSteps:0,gain:1,accepted:0,refusedOverride:0,refusedWeak:0,
  };
  constructor(readonly mode:CreditMode){}
  /**
   * Actuator window *ended* when this new private frame arrives.
   * 120Hz demand is averaged over the previous four physical steps.
   * Never create training data from the resident's merely proposed command.
   */
  observe(frame:PrivateFrame){
    const s=this.s;
    if(s.lastTick===null){s.lastTick=frame.tick;s.lastOmega=frame.proprio.omega;return;}
    if(frame.tick===s.lastTick)return;
    if(frame.tick<s.lastTick)throw Error('Nonmonotonic motor credit history');
    const dt=(frame.tick-s.lastTick)/120;
    const intact=s.elapsedSteps===frame.tick-s.lastTick &&
      s.ownedSteps===s.elapsedSteps && s.elapsedSteps>0;
    if(!intact){
      s.refusedOverride++;
    }else if(this.mode==='sign-only'&&Math.abs(s.sumTurn/s.elapsedSteps)>.06){
      const a=Math.exp(-dt/E0_TAU_TURN);
      const turn=s.sumTurn/s.elapsedSteps;
      const denominator=E0_OMEGA_MAX*(1-a)*turn;
      const measured=(frame.proprio.omega-a*s.lastOmega)/denominator;
      if(Number.isFinite(measured)){
        // OL0's cheap scalar online sign estimation; not a richer gain model.
        s.gain=.75*s.gain+.25*Math.max(-2,Math.min(2,measured));
        s.accepted++;
      }else{s.refusedWeak++;}
    }else{s.refusedWeak++;}
    s.lastTick=frame.tick;s.lastOmega=frame.proprio.omega;
    s.sumTurn=0;s.ownedSteps=0;s.elapsedSteps=0;
  }
  /** Host reports the actual issued motor signal, not policy intention. */
  motorExecuted(turn:number,owned:boolean){
    if(!Number.isFinite(turn))throw Error('Nonfinite actual motor command');
    this.s.sumTurn+=turn;
    this.s.elapsedSteps++;
    if(owned)this.s.ownedSteps++;
  }
  correct(raw:Demand):Demand{
    if(this.mode==='fixed'||this.s.gain>=0)return {...raw};
    return {...raw,turn:-raw.turn};
  }
  state():MotorCreditState{return {...this.s};}
  restore(s:MotorCreditState){
    if(s.version!==1)throw Error('Unsupported motor credit state');
    const copy={...s};
    if(![copy.gain,copy.lastOmega,copy.sumTurn,copy.ownedSteps,
      copy.elapsedSteps,copy.accepted,copy.refusedOverride,copy.refusedWeak].every(Number.isFinite))
      throw Error('Invalid motor credit state');
    this.s=copy;
  }
}
export type CreditPilotCheckpoint = {
  version:1;mode:CreditMode;world:Checkpoint;occupant:OccupantState;
  vision:VisionState;credit:MotorCreditState;
  sampleTick:number|null;selfDemand:Demand;
};

/**
 * Exact existing physical body and authored occupant, with a tiny, optional
 * motor-response learner. Only an experimental host, NEVER the public brain.
 * Manual takeovers do not reset world/private memory or fabricate own commands.
 */
export class CreditPilot {
  readonly world=new LivingWorld();
  readonly occupant=new Occupant();
  readonly vision=new PrivateVision();
  readonly credit:MotorCredit;
  private sampleTick:number|null=null;
  private selfDemand:Demand={drive:0,turn:0,gazeRate:0};
  constructor(readonly mode:CreditMode){this.credit=new MotorCredit(mode);}
  step(manual:Demand|null=null, hiddenTurnGain=1){
    if(!Number.isFinite(hiddenTurnGain))throw Error('Nonfinite host transducer gain');
    const f=this.world.observe();
    if(this.sampleTick!==f.tick){
      this.credit.observe(f);
      this.vision.observe(f);
      const proposed=this.occupant.decide(f);
      this.selfDemand=this.credit.correct(proposed);
      this.sampleTick=f.tick;
    }
    const actual=manual??this.selfDemand;
    // Record ACTUAL requested actuation, not hypothetical intended motor.
    this.credit.motorExecuted(actual.turn,manual===null);
    this.world.step({...actual,turn:Math.max(-1,Math.min(1,actual.turn*hiddenTurnGain))});
  }
  capture():CreditPilotCheckpoint{
    return {version:1,mode:this.mode,world:this.world.captureCheckpoint(),
      occupant:this.occupant.capture(),vision:this.vision.capture(),
      credit:this.credit.state(),sampleTick:this.sampleTick,selfDemand:{...this.selfDemand}};
  }
  restore(cp:CreditPilotCheckpoint){
    if(cp.version!==1||cp.mode!==this.mode)throw Error('Wrong pilot checkpoint');
    this.world.restoreCheckpoint(cp.world);
    this.occupant.restore(cp.occupant);this.vision.restore(cp.vision);
    this.credit.restore(cp.credit);
    this.sampleTick=cp.sampleTick;this.selfDemand={...cp.selfDemand};
  }
  inspect(){return this.world.inspect();}
  free(){this.world.free();}
}
