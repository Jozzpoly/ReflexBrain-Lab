import { beforeAll, describe, expect, it } from 'vitest';
import { LivingRuntime } from '../../src/living-organism/runtime';
import { initLivingWorld, type Demand, type PrivateFrame } from '../../src/living-organism/world';
import { visibleTurquoisePatches } from '../../src/living-organism/retina-geometry';

/**
 * RB-VISION/L1 — actual RGB retina, independent ecology, real continuous
 * body, 120-Hz motor and 30-Hz lawful PRIVATE sensory samples.
 *
 * Only gazeRate is replaced: all variants run the same authored Occupant
 * motor policy. L1 is NOT learned attention or actor-owned motivation.
 *
 * Gaze controllers receive only PrivateFrame and own internal history;
 * no inspect(), World handles, positions, collision labels or future events.
 */
type GazePolicy = 'native' | 'center' | 'clock-sweep'
  | 'visible-centering-only' | 'private-reacquisition';
type Scene = 'native-world' | 'shifted-visible-surface';
type GazeState = {
  lastTick:number|null;
  integratedHeading:number;
  rememberedWorldBearing:number|null;
  lastPatchTick:number|null;
  rememberedCount:number;
  gazeCommand:number;
  memoryFollowSamples:number;
};
type Outcome = {
  scene:Scene;policy:GazePolicy;ticks:number;
  actualDistance:number;finalX:number;finalY:number;
  privateSamples:number;visibleSamples:number;fovealSamples:number;
  orangeSamples:number;purpleSamples:number;
  memoryFollowSamples:number;
  renewedSightings:number;recordedContactEvents:number;
  contactImpulseTotal:number;touchPositiveFrames:number;
  separatedTouchEpisodes:number;maxConsecutiveTouchFrames:number;
  modeCounts:Record<string,number>;
  commandedGazeSum:number;distinctGazeBins:number;
  distinctVisitedCells:number;rememberedCount:number;
  firstSeenTick:number|null;lastSeenTick:number|null;
  finalGaze:number;
  minuteDistances:number[];minuteFovealCounts:number[];
};

const RUN_TICKS=7200; // 60 s simulated time without reset
const DT=1/120;
const clamp=(x:number)=>Math.max(-1,Math.min(1,x));
const wrap=(x:number)=>Math.atan2(Math.sin(x),Math.cos(x));

class ActorPrivateFocus {
  readonly state:GazeState={
    lastTick:null,integratedHeading:0,rememberedWorldBearing:null,
    lastPatchTick:null,rememberedCount:0,gazeCommand:0,
    memoryFollowSamples:0,
  };
  readonly policy:GazePolicy;
  constructor(policy:GazePolicy){this.policy=policy;}
  select(frame:PrivateFrame, nativeGazeRate:number):number {
    const s=this.state;
    if(s.lastTick!==null && frame.tick<=s.lastTick) return s.gazeCommand;
    const dt=s.lastTick===null?0:(frame.tick-s.lastTick)/120;
    s.integratedHeading=wrap(s.integratedHeading+frame.proprio.omega*dt);
    s.lastTick=frame.tick;
    const patches=visibleTurquoisePatches(frame.retina);
    const patch=patches.filter(p=>!p.clipped)
      .sort((a,b)=>b.extent-a.extent)[0];
    if(patch){
      const relative=wrap(frame.proprio.gaze+patch.bearing);
      s.rememberedWorldBearing=wrap(s.integratedHeading+relative);
      s.lastPatchTick=frame.tick;
      s.rememberedCount++;
    }
    let demand=nativeGazeRate;
    if(this.policy==='center'){
      demand=clamp(-frame.proprio.gaze*2);
    }else if(this.policy==='clock-sweep'){
      // Strong cheap authored baseline: sweeping needs no memory.
      demand=Math.sin(frame.tick/72)*.8;
    }else if(this.policy==='private-reacquisition'
      || this.policy==='visible-centering-only'){
      if(patch){
        // Keep a visible fragment near the densest part of the retina.
        demand=clamp(patch.bearing*3);
      }else if(
        this.policy==='private-reacquisition'
        && s.rememberedWorldBearing!==null&&s.lastPatchTick!==null
        &&frame.tick-s.lastPatchTick<=360
      ){
        s.memoryFollowSamples++;
        // Actor-private heading integration, not host World position.
        const desired=wrap(s.rememberedWorldBearing-s.integratedHeading);
        demand=clamp(wrap(desired-frame.proprio.gaze)*2.5);
      }else{
        // No magic target identity: search with a cheap time-based sweep.
        demand=Math.sin(frame.tick/72)*.8;
      }
    }
    s.gazeCommand=demand;
    return demand;
  }
}

function hasPaletteColor(frame:PrivateFrame, r:number,g:number,b:number):boolean {
  const a=frame.retina;
  for(let i=0;i<a.length;i+=3){
    if(Math.abs(a[i]-r)<.035 && Math.abs(a[i+1]-g)<.035
       && Math.abs(a[i+2]-b)<.035)return true;
  }
  return false;
}

function run(policy:GazePolicy,scene:Scene,ticks=RUN_TICKS):Outcome {
  const rt=new LivingRuntime();
  try{
    if(scene==='shifted-visible-surface'){
      const turquoise=rt.inspect().objects.filter(o=>
        o.color[0]<.3&&o.color[1]>.7&&o.color[2]>.6);
      if(turquoise.length<2) throw Error('LivingWorld donor scene mismatch');
      // World-authoring only; no object metadata reaches ActorPrivateFocus.
      rt.world.moveObject(turquoise[0].handle,4.5,-2);
    }
    const focus=new ActorPrivateFocus(policy);
    let lastSample=-1,privateSamples=0,visibleSamples=0,
      fovealSamples=0,renewedSightings=0,recordedContactEvents=0;
    let wasVisible=false,actualDistance=0;
    let contactImpulseTotal=0,touchPositiveFrames=0;
    let separatedTouchEpisodes=0,maxConsecutiveTouchFrames=0;
    let consecutiveTouchFrames=0,previousFrameTouch=false;
    let orangeSamples=0,purpleSamples=0;
    const minuteDistances:number[]=[],minuteFovealCounts:number[]=[];
    let previousMinuteDistance=0,previousMinuteFoveal=0;
    let firstSeenTick:number|null=null,lastSeenTick:number|null=null;
    let commandedGazeSum=0;
    const visited=new Set<string>(),gazeBins=new Set<number>();
    const modes:Record<string,number>={};
    let previous=rt.inspect().actor;
    let manual:Demand={drive:0,turn:0,gazeRate:0};
    for(let step=0;step<ticks;step++){
      const frame=rt.observe();
      if(frame.tick!==lastSample){
        const base=rt.occupant.decide(frame);
        const demand=focus.select(frame,base.gazeRate);
        manual={...base,gazeRate:demand};
        lastSample=frame.tick;
        privateSamples++;
        const patch=visibleTurquoisePatches(frame.retina)
          .some(p=>!p.clipped);
        if(patch){
          visibleSamples++;
          if(firstSeenTick===null)firstSeenTick=frame.tick;
          lastSeenTick=frame.tick;
          if(!wasVisible)renewedSightings++;
          if(visibleTurquoisePatches(frame.retina)
            .some(p=>!p.clipped&&Math.abs(p.bearing)<.08))fovealSamples++;
        }
        wasVisible=patch;
        // Analyst-side secondary appearance coverage, NOT available to
        // the private focus controller as an object identity or World cue.
        if(hasPaletteColor(frame,.8,.5,.2))orangeSamples++;
        if(hasPaletteColor(frame,.65,.4,.8))purpleSamples++;
        gazeBins.add(Math.floor((frame.proprio.gaze+Math.PI/2)/.12));
        modes[rt.occupant.capture().mode]=(modes[rt.occupant.capture().mode]??0)+1;
        // Host microscope, NOT delivered to the gaze or motor controller.
        const contactSample=rt.world.inspectContactSample();
        recordedContactEvents+=contactSample.contacts.length;
        contactImpulseTotal+=contactSample.contacts.reduce(
          (sum,c)=>sum+c.impulse,0,
        );
        const touching=Array.from(frame.touch).some(x=>x>1e-9);
        if(touching){
          touchPositiveFrames++;
          if(!previousFrameTouch)separatedTouchEpisodes++;
          consecutiveTouchFrames++;
          maxConsecutiveTouchFrames=Math.max(
            maxConsecutiveTouchFrames,consecutiveTouchFrames,
          );
        }else consecutiveTouchFrames=0;
        previousFrameTouch=touching;
      }
      commandedGazeSum+=Math.abs(manual.gazeRate)*DT;
      rt.step(manual);
      const now=rt.inspect().actor;
      actualDistance+=Math.hypot(now.x-previous.x,now.y-previous.y);
      previous=now;
      if(step%40===0)visited.add(`${Math.floor(now.x)}:${Math.floor(now.y)}`);
      if((step+1)%7200===0){
        minuteDistances.push(actualDistance-previousMinuteDistance);
        minuteFovealCounts.push(fovealSamples-previousMinuteFoveal);
        previousMinuteDistance=actualDistance;
        previousMinuteFoveal=fovealSamples;
      }
    }
    const a=rt.inspect().actor;
    return {
      scene,policy,ticks,
      actualDistance,finalX:a.x,finalY:a.y,
      privateSamples,visibleSamples,fovealSamples,
      orangeSamples,purpleSamples,
      memoryFollowSamples:focus.state.memoryFollowSamples,
      renewedSightings,recordedContactEvents,
      contactImpulseTotal,touchPositiveFrames,
      separatedTouchEpisodes,maxConsecutiveTouchFrames,
      modeCounts:modes,commandedGazeSum,
      distinctGazeBins:gazeBins.size,
      distinctVisitedCells:visited.size,
      rememberedCount:focus.state.rememberedCount,
      firstSeenTick,lastSeenTick,finalGaze:rt.inspect().gaze,
      minuteDistances,minuteFovealCounts,
    };
  }finally{rt.free();}
}
function summary(x:Outcome){
  return {
    scene:x.scene,policy:x.policy,simulatedSeconds:x.ticks/120,
    distance:+x.actualDistance.toFixed(3),
    seen:x.visibleSamples,centered:x.fovealSamples,
    orange:x.orangeSamples,purple:x.purpleSamples,
    memoryFollow:x.memoryFollowSamples,
    reacquisitions:x.renewedSightings,contacts:x.recordedContactEvents,
    impulse:+x.contactImpulseTotal.toFixed(3),
    touchFrames:x.touchPositiveFrames,
    touchEpisodes:x.separatedTouchEpisodes,
    longestTouchRun:x.maxConsecutiveTouchFrames,
    visited:x.distinctVisitedCells,gazeBins:x.distinctGazeBins,
    gazeDemandSum:+x.commandedGazeSum.toFixed(3),
    modes:x.modeCounts,
    final:[+x.finalX.toFixed(3),+x.finalY.toFixed(3)],
    minuteDistances:x.minuteDistances.map(v=>+v.toFixed(3)),
    minuteFoveal:x.minuteFovealCounts,
  };
}
beforeAll(initLivingWorld);

describe('RB-VISION/L1 real RGB retina + continuous embodied gaze policies',()=>{
  it('independently executes actual continuous world + authored local focus rivalries',()=>{
    const policies:GazePolicy[]=[
      'native','center','clock-sweep',
      'visible-centering-only','private-reacquisition'];
    const scenes:Scene[]=['native-world','shifted-visible-surface'];
    const outcomes=scenes.flatMap(scene=>policies.map(policy=>
      run(policy,scene)));
    const sampleExpect=RUN_TICKS/4;
    expect(outcomes.every(o=>o.privateSamples===sampleExpect)).toBe(true);
    expect(outcomes.every(o=>o.ticks===RUN_TICKS)).toBe(true);
    expect(outcomes.every(o=>Number.isFinite(o.actualDistance)
      &&Number.isFinite(o.finalX)&&Number.isFinite(o.finalY))).toBe(true);
    expect(outcomes.every(o=>o.distinctVisitedCells>0)).toBe(true);
    expect(outcomes.some(o=>o.visibleSamples>0)).toBe(true);
    // Mechanism must actually change lawful sampled experience.
    expect(new Set(outcomes.map(o=>o.visibleSamples)).size).toBeGreaterThan(1);
    expect(outcomes.filter(o=>o.policy==='visible-centering-only')
      .every(o=>o.memoryFollowSamples===0)).toBe(true);
    expect(outcomes.filter(o=>o.policy==='private-reacquisition')
      .every(o=>o.memoryFollowSamples>0)).toBe(true);
    console.log('RB_VISION_L1_CONTINUOUS '+JSON.stringify(outcomes.map(summary)));
  },120000);

  it('replays actor-private focus and actual ecology deterministically',()=>{
    const first=run('private-reacquisition','native-world',2400);
    const second=run('private-reacquisition','native-world',2400);
    expect(second).toEqual(first);
  },60000);

  it('applies 3-minute without-reset pressure to fixation vs memory vs native',()=>{
    const p:GazePolicy[]=['native','visible-centering-only',
      'private-reacquisition'];
    const scenarios=p.map(policy=>run(policy,'native-world',21600));
    expect(scenarios.every(o=>o.privateSamples===5400)).toBe(true);
    expect(scenarios.every(o=>o.minuteDistances.length===3)).toBe(true);
    expect(scenarios.every(o=>o.minuteDistances.every(Number.isFinite)))
      .toBe(true);
    expect(scenarios.every(o=>o.minuteFovealCounts.length===3)).toBe(true);
    expect(scenarios.every(o=>Number.isFinite(o.contactImpulseTotal))).toBe(true);
    expect(scenarios.every(o=>o.touchPositiveFrames>=o.separatedTouchEpisodes))
      .toBe(true);
    // No predeclared winner! Detect life/motor stagnation via per-minute
    // distance rather than laundering more foveal frames into autonomy.
    console.log('RB_VISION_L1_3MIN '+JSON.stringify(scenarios.map(summary)));
  },120000);

});
