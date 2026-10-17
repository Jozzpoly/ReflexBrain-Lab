import {
  E0_OMEGA_MAX, E0_TAU_TURN,
} from '../e0-body-seam';
import { visibleTurquoisePatches } from './retina-geometry';
import { LivingWorld, type Demand, type PrivateFrame } from './world';

/**
 * OL0: test-only, never the default LivingRuntime brain.
 * Candidate policy and learner see only private frames and their OWN issued actions.
 * The host-only actuation transducer and target handle never enter this class.
 */
export type OL0Mode = 'fixed' | 'sign-only' | 'online-gain';
export type OL0Scenario = { side: -1 | 1; gainAfter: 1 | -1 | 0.25 | -0.25 };
export type OL0Run = {
  key: string; mode: OL0Mode; changed: boolean;
  contacted: boolean; contactTick: number | null;
  finalGap: number; valid: boolean; visibleFrames: number;
  gainEstimateBefore: number; gainEstimateAfter: number;
  parameterChanged: boolean; privateSamples: number;
};
export type OL0Campaign = {
  verdict: 'PASS' | 'FAIL' | 'INCONCLUSIVE';
  deterministic: boolean; runs: OL0Run[];
  changedContacts: Record<OL0Mode, number>;
  changedMedianGap: Record<OL0Mode, number>;
  reasons: string[];
};
const SCENES: OL0Scenario[] = [
  {side:1,gainAfter:1},{side:-1,gainAfter:1},
  {side:1,gainAfter:-1},{side:-1,gainAfter:-1},
  {side:1,gainAfter:0.25},{side:-1,gainAfter:0.25},
  {side:1,gainAfter:-0.25},{side:-1,gainAfter:-0.25},
];
const MODES: OL0Mode[] = ['fixed','sign-only','online-gain'];
const TICKS = 900;
const CHANGE_TICK = 40;
const CUTOFF = 1e-6;
const clamp = (v:number,lo:number,hi:number) => Math.max(lo, Math.min(hi, v));
const wrap = (v:number) => Math.atan2(Math.sin(v),Math.cos(v));

class PrivateApproach {
  private tick: number | null = null;
  private omega = 0;
  private lastIssuedTurn = 0;
  private estimatedGain = 1;
  private targetBearing: number | null = null;
  private ageSinceVision = Infinity;
  private visible = 0;
  private samples = 0;
  private estimateAtSwitch = 1;
  constructor(readonly mode:OL0Mode, private readonly freezeUpdate=false){}

  /**
   * 30Hz legal sensor history. The nominal damping is pre-existing
   * simple actuator physics, NOT the host's current gain/force/regime.
   */
  decide(frame:PrivateFrame):Demand{
    if(this.tick!==null && frame.tick===this.tick){
      throw new Error('OL0 decide called twice on same sensory frame');
    }
    const dt=this.tick===null ? 0 : (frame.tick-this.tick)/120;
    if(this.tick!==null && dt>0){
      const alpha=Math.exp(-dt/E0_TAU_TURN);
      if(!this.freezeUpdate && this.mode!=='fixed' && Math.abs(this.lastIssuedTurn)>.05){
        const gain=(frame.proprio.omega-alpha*this.omega) /
          (E0_OMEGA_MAX*(1-alpha)*this.lastIssuedTurn);
        if(Number.isFinite(gain)){
          this.estimatedGain = .75*this.estimatedGain+.25*clamp(gain,-2,2);
          this.samples++;
        }
      }
      if(this.targetBearing!==null){
        this.targetBearing=wrap(this.targetBearing-frame.proprio.omega*dt);
        this.ageSinceVision+=dt;
      }
    }
    this.tick=frame.tick;
    this.omega=frame.proprio.omega;
    if(frame.tick===CHANGE_TICK)this.estimateAtSwitch=this.estimatedGain;

    const patches=visibleTurquoisePatches(frame.retina);
    patches.sort((a,b)=>b.extent-a.extent);
    if(patches.length){
      this.targetBearing=wrap(frame.proprio.gaze+patches[0].bearing);
      this.ageSinceVision=0;
      this.visible++;
    }
    let bearing=this.targetBearing;
    let turn: number,drive: number;
    if(bearing===null || this.ageSinceVision>2){
      // Equivalent cheap private local search in every mode.
      turn=.3;
      drive=.10;
    }else{
      bearing=wrap(bearing);
      const desiredOmega=clamp(2*bearing,-1.2,1.2);
      const alpha=Math.exp(-(4/120)/E0_TAU_TURN);
      const nominal=(desiredOmega-alpha*frame.proprio.omega)/
        (E0_OMEGA_MAX*(1-alpha));
      const gain=this.mode==='fixed'?1:
        this.mode==='sign-only'? (this.estimatedGain>=0?1:-1) :
        (this.estimatedGain>=0?1:-1)*Math.max(.2,Math.abs(this.estimatedGain));
      turn=clamp(nominal/gain,-1,1);
      drive=Math.abs(bearing)<.35?.88:.45;
    }
    this.lastIssuedTurn=turn;
    return {drive,turn,gazeRate:0};
  }
  noteSwitch():number{return this.estimateAtSwitch;}
  state(){return {
    gain:this.estimatedGain,samples:this.samples,visible:this.visible,tick:this.tick,
    finite:[this.estimatedGain,this.omega,this.lastIssuedTurn].every(Number.isFinite)
  };}
}

function simulate(s:OL0Scenario,mode:OL0Mode,freeze=false):OL0Run {
  const world=new LivingWorld(false);
  try{
    const target=world.addObject(8,s.side*4,.8,[.1,.85,.8]);
    const brain=new PrivateApproach(mode,freeze);
    let demand:Demand={drive:0,turn:0,gazeRate:0};
    let contactTick:number|null=null;
    let parameterBefore=1;
    for(let tick=0;tick<TICKS;tick++){
      const frame=world.observe();
      if(tick===frame.tick && tick%4===0){
        demand=brain.decide(frame);
      }
      if(tick===CHANGE_TICK)parameterBefore=brain.state().gain;
      // Only host/World converts action to physical torque;
      // the actor never sees the regime schedule or multiplier.
      const hiddenGain=tick<CHANGE_TICK?1:s.gainAfter;
      world.step({...demand,turn:clamp(demand.turn*hiddenGain,-1,1)});
      if(world.inspectContactSample().tick===world.inspect().tick){
        const sample=world.inspectContactSample();
        if(contactTick===null && sample.contacts.some(c=>c.handle===target)){
          contactTick=sample.tick;
          break;
        }
      }
    }
    const host=world.inspect();
    const targetAfter=host.objects.find(o=>o.handle===target);
    if(!targetAfter)throw new Error('Host target missing');
    const rawGap=Math.hypot(host.actor.x-targetAfter.x,host.actor.y-targetAfter.y)-1-.8;
    const st=brain.state();
    return{
      key:`side:${s.side}/gain:${s.gainAfter}`,
      mode,changed:s.gainAfter!==1,
      contacted:contactTick!==null,contactTick,
      finalGap:contactTick!==null?0:Math.max(0,rawGap),
      valid:st.finite && st.visible>0 && Number.isFinite(rawGap),
      visibleFrames:st.visible,
      gainEstimateBefore:parameterBefore,
      gainEstimateAfter:st.gain,
      parameterChanged:Math.abs(st.gain-parameterBefore)>.01,
      privateSamples:st.samples,
    };
  }finally{world.free();}
}
function median(v:number[]):number{
 const a=[...v].sort((x,y)=>x-y);const n=a.length;
 return n%2?a[(n-1)/2]:(a[n/2-1]+a[n/2])/2;
}
function single():Omit<OL0Campaign,'deterministic'>{
 const runs=SCENES.flatMap(s=>MODES.map(mode=>simulate(s,mode)));
 const changed=runs.filter(r=>r.changed);
 const changedContacts=Object.fromEntries(MODES.map(m=>[
   m,changed.filter(x=>x.mode===m&&x.contacted).length
 ])) as Record<OL0Mode,number>;
 const changedMedianGap=Object.fromEntries(MODES.map(m=>[
   m,median(changed.filter(x=>x.mode===m).map(x=>x.finalGap))
 ])) as Record<OL0Mode,number>;
 const strongestCheap:OL0Mode=
   changedContacts['sign-only']>changedContacts.fixed ||
   (changedContacts['sign-only']===changedContacts.fixed &&
    changedMedianGap['sign-only']<changedMedianGap.fixed)
     ? 'sign-only':'fixed';
 const reasons:string[]=[];
 if(runs.length!==24 || runs.some(r=>!r.valid)) reasons.push('unavailable/nonfinite private sensing or incomplete schedule');
 const online=changed.filter(r=>r.mode==='online-gain');
 if(online.some(r=>!r.parameterChanged || r.privateSamples===0))
   reasons.push('online parameter did not update after host perturbation');
 const freeze=simulate({side:1,gainAfter:-1},'online-gain',true);
 if(freeze.parameterChanged || freeze.privateSamples!==0 || Math.abs(freeze.gainEstimateAfter-1)>CUTOFF)
   reasons.push('frozen learner ablation incorrectly changed');
 if(changedContacts['online-gain']<4)
   reasons.push('fewer than four learned material contacts in six changed scenarios');
 if(changedContacts['online-gain']<changedContacts[strongestCheap]+2)
   reasons.push('learned contact count does not exceed stronger cheap competitor by two');
 const margin=changedMedianGap[strongestCheap]===0?
   (changedMedianGap['online-gain']===0?0:-Infinity):
   (changedMedianGap[strongestCheap]-changedMedianGap['online-gain'])/changedMedianGap[strongestCheap];
 if(margin<.15)reasons.push('learned median material gap not 15% below stronger cheap competitor');
 const unchanged=runs.filter(r=>!r.changed);
 for(const side of [1,-1]){
   const group=unchanged.filter(r=>r.key.startsWith(`side:${side}/`));
   const learning=group.find(r=>r.mode==='online-gain')!;
   if(!learning.contacted && group.filter(r=>r.mode!=='online-gain').every(r=>r.contacted))
     reasons.push('learned lost contact in unchanged control side '+side);
 }
 const inconclusive=runs.some(r=>!r.valid) || online.some(r=>r.privateSamples===0);
 return {verdict:inconclusive?'INCONCLUSIVE':reasons.length?'FAIL':'PASS',
 deterministic:false as never,runs,changedContacts,changedMedianGap,reasons} as unknown as Omit<OL0Campaign,'deterministic'>;
}
export function runOL0Campaign():OL0Campaign {
 const a=single(),b=single();
 const stable=JSON.stringify(a)===JSON.stringify(b);
 return {...a,deterministic:stable,
   verdict:stable?a.verdict:'INCONCLUSIVE',
   reasons:stable?a.reasons:[...a.reasons,'non-deterministic complete World rerun']};
}
export const OL0_FROZEN=Object.freeze({
 cases:SCENES.map(s=>({...s})),modes:[...MODES],changeTick:CHANGE_TICK,maxTicks:TICKS,
});
