import { beforeAll, describe, expect, it } from 'vitest';
import {
  LivingWorld, initLivingWorld, type Checkpoint, type PrivateFrame,
} from '../../src/living-organism/world';
import { visibleTurquoisePatches } from '../../src/living-organism/retina-geometry';

/**
 * RB-VISION/L2 — actor-private RGB memory directs gaze after true blindness.
 * Scenarios and physical checkpoint forks belong to research host ONLY.
 * The actor's usable memory is (bearing, lastSeenTick), not host XY/range/ID.
 * The fixation heuristic is authored; no learned skill or object identity.
 */
type Side = -1|1;
type Policy = 'memory'|'right-sweep'|'left-sweep'|'center';
type Spec = {side:Side;hiddenMoved:boolean};
type PrivateRemember = {bearing:number;lastSeenTick:number};
type Frozen = {
  spec:Spec;
  checkpoint:Checkpoint;
  remembered:PrivateRemember;
  decisionFrame:PrivateFrame;
  lastSeenBeforeDecision:number;
  originalSeenBearing:number;
};
type Trial = {
  side:Side;hiddenMoved:boolean;policy:Policy;
  memoryBearing:number;decisionTick:number;decisionGaze:number;
  firstReappearanceTick:number|null;
  firstVisibleBearing:number|null;
  endActorX:number;endActorY:number;
  sampledFrames:number;motorTravel:number;
  gazeTravel:number;
};
const IDLE={drive:0,turn:0,gazeRate:0};
const ANGLE=112*Math.PI/180;
const DIST=5;
const RADIUS=.55;
const PREP_STEPS=60;
const BRANCH_STEPS=180;
function matching(frame:PrivateFrame){
  return visibleTurquoisePatches(frame.retina).filter(p=>!p.clipped);
}
function freeze(spec:Spec):Frozen{
  const w=new LivingWorld(false);
  try{
    const theta=spec.side*ANGLE;
    const x=DIST*Math.cos(theta),y=DIST*Math.sin(theta);
    const handle=w.addObject(x,y,RADIUS,[.1,.85,.8]);
    const starting=w.observe();
    if(matching(starting).length>0)throw Error('Target should start out of front FOV');
    let remembered:PrivateRemember|null=null;
    for(let i=0;i<PREP_STEPS;i++){
      w.step({...IDLE,gazeRate:spec.side});
      const frame=w.observe();
      const p=matching(frame)[0];
      if(p) remembered={
        bearing:Math.atan2(
          Math.sin(frame.proprio.gaze+p.bearing),
          Math.cos(frame.proprio.gaze+p.bearing),
        ),
        lastSeenTick:frame.tick,
      };
    }
    if(remembered===null)throw Error('Retina did not legally see side target');
    const originalSeenBearing=remembered.bearing;
    const lastSeenBeforeDecision=remembered.lastSeenTick;
    for(let i=0;i<PREP_STEPS;i++){
      w.step({...IDLE,gazeRate:-spec.side});
      const frame=w.observe();
      const p=matching(frame)[0];
      if(p) remembered={
        bearing:Math.atan2(
          Math.sin(frame.proprio.gaze+p.bearing),
          Math.cos(frame.proprio.gaze+p.bearing),
        ),
        lastSeenTick:frame.tick,
      };
    }
    const current=w.observe();
    // Scene is behind the 160° retinal FOV; same empty RGB observation
    // must hold for both mirrored histories.
    if(matching(current).length!==0)throw Error('Old target remains visibly present');
    if(Math.abs(current.proprio.gaze)>.001)throw Error('Gaze was not reset to centre');

    // Independent hidden World intervention at the transition boundary.
    // The actor sees neither the host coordinates nor the movement.
    if(spec.hiddenMoved){
      const otherAngle=-spec.side*ANGLE;
      w.moveObject(handle,DIST*Math.cos(otherAngle),DIST*Math.sin(otherAngle));
    }
    const cp=w.captureCheckpoint();
    return {
      spec,checkpoint:cp,remembered,
      decisionFrame:current,lastSeenBeforeDecision,originalSeenBearing,
    };
  }finally{w.free();}
}
function branch(frozen:Frozen,policy:Policy):Trial{
  const w=new LivingWorld(false);
  w.restoreCheckpoint(frozen.checkpoint);
  try{
    const decisionTick=w.observe().tick;
    let firstReappearanceTick:number|null=null;
    let firstVisibleBearing:number|null=null;
    let sampledFrames=0,gazeTravel=0,motorTravel=0;
    let lastSampleTick=decisionTick;
    const before=w.inspect().actor;
    let previous=before;
    for(let i=0;i<BRANCH_STEPS;i++){
      const f=w.observe();
      if(f.tick>decisionTick&&f.tick!==lastSampleTick){
        lastSampleTick=f.tick;sampledFrames++;
        const p=matching(f)[0];
        if(p&&firstReappearanceTick===null){
          firstReappearanceTick=f.tick;
          firstVisibleBearing=f.proprio.gaze+p.bearing;
        }
      }
      let gazeRate: number;
      if(policy==='center')gazeRate=0;
      else if(policy==='right-sweep')gazeRate=1;
      else if(policy==='left-sweep')gazeRate=-1;
      else{
        // This uses ONLY the previously stored lawful bearing and
        // the actor's current gaze proprioception, never hidden World XY.
        const diff=Math.atan2(
          Math.sin(frozen.remembered.bearing-f.proprio.gaze),
          Math.cos(frozen.remembered.bearing-f.proprio.gaze),
        );
        gazeRate=Math.max(-1,Math.min(1,diff*2.4));
      }
      const priorGaze=f.proprio.gaze;
      w.step({...IDLE,gazeRate});
      const post=w.observe();
      if(post.tick!==f.tick)
        gazeTravel+=Math.abs(post.proprio.gaze-priorGaze);
      const now=w.inspect().actor;
      motorTravel+=Math.hypot(now.x-previous.x,now.y-previous.y);
      previous=now;
    }
    return {
      side:frozen.spec.side,hiddenMoved:frozen.spec.hiddenMoved,
      policy,memoryBearing:frozen.remembered.bearing,
      decisionTick,decisionGaze:frozen.decisionFrame.proprio.gaze,
      firstReappearanceTick,firstVisibleBearing,
      endActorX:previous.x,endActorY:previous.y,
      sampledFrames,motorTravel,gazeTravel,
    };
  }finally{w.free();}
}
const POLICIES:readonly Policy[]=[
  'memory','right-sweep','left-sweep','center',
] as const;
const SPECS:readonly Spec[]=[
  {side:1,hiddenMoved:false},{side:-1,hiddenMoved:false},
  {side:1,hiddenMoved:true},{side:-1,hiddenMoved:true},
];
function runAll(){
  return SPECS.map(spec=>{
    const f=freeze(spec);
    return {spec,remembered:f.remembered,
      current:Array.from(f.decisionFrame.retina),
      trials:POLICIES.map(policy=>branch(f,policy))};
  });
}
beforeAll(initLivingWorld);
describe('RB-VISION/L2 same current RGB, different private memory and active gaze',()=>{
  it('measures left/right reacquisition from real remembered retinal fragments',()=>{
    const cases=runAll();
    const replay=runAll();
    expect(replay).toEqual(cases);
    for(const c of cases){
      expect(c.trials.every(t=>t.motorTravel<.001)).toBe(true);
      expect(c.trials.every(t=>t.sampledFrames>=44)).toBe(true);
      expect(Math.sign(c.remembered.bearing)).toBe(c.spec.side);
    }
    expect(cases[0].current).toEqual(cases[1].current);
    expect(cases[2].current).toEqual(cases[3].current);
    // The actor cannot infer hidden side from *current* empty image.
    expect(cases[0].current).toEqual(cases[2].current);

    for(const c of cases.filter(x=>!x.spec.hiddenMoved)){
      const mem=c.trials.find(t=>t.policy==='memory')!;
      expect(mem.firstReappearanceTick).not.toBeNull();
      const wrong=c.trials.find(t=>t.policy===
        (c.spec.side===1?'left-sweep':'right-sweep'))!;
      expect(wrong.firstReappearanceTick).toBeNull();
      expect(c.trials.find(t=>t.policy==='center')!.firstReappearanceTick)
        .toBeNull();
    }
    console.log('RB_VISION_L2_REACQUIRE '+JSON.stringify(cases.map(c=>({
      side:c.spec.side,hiddenMoved:c.spec.hiddenMoved,
      memoryBearing:c.remembered.bearing,
      results:c.trials.map(t=>({
        policy:t.policy,reappeared:t.firstReappearanceTick,
        actorTravel:t.motorTravel,gazeTravel:t.gazeTravel,
      })),
    }))));
  },30000);

  it('does not allow stale prior vision to predict an independently moved target',()=>{
    for(const spec of SPECS.filter(s=>s.hiddenMoved)){
      const frozen=freeze(spec);
      const remembered=branch(frozen,'memory');
      const correctByChance=branch(frozen,
        spec.side===1?'left-sweep':'right-sweep');
      // Wrong memory aims at the previous side. A fixed opponent
      // sweep can reacquire new *current* truth if it points that way.
      expect(remembered.firstReappearanceTick).toBeNull();
      expect(correctByChance.firstReappearanceTick).not.toBeNull();
    }
  },30000);
});
