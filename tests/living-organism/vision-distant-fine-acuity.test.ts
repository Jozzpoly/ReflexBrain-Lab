import { beforeAll, describe, expect, it } from 'vitest';
import { LivingWorld, initLivingWorld, type PrivateFrame } from '../../src/living-organism/world';
import { retinalAngle } from '../../src/living-organism/retina-geometry';

/**
 * RB-VISION/A1 — fine distant DETAIL, rather than keeping a target visible.
 * Real 96 RGB LivingWorld retina, 120Hz physics, 30Hz eye frames, 12m ray cap.
 * Guided action follows solely a legally glimpsed coarse gray appearance.
 * Same angular retina budget across fixed and gaze-directed policies.
 * Feature classification is a narrow researcher-defined optical question.
 */
type Mark='red'|'cyan';
type Policy='fixed'|'guided';
type Spec={distance:number;bearingDeg:number;phaseDeg:number;mark:Mark};
type Result={
  spec:Spec;policy:Policy;
  previewGrayCount:number;previewMarkCount:number;previewOrangeCount:number;
  preview:Array<number>;
  selectedBearing:number|null;
  detectedMarkAt:number|null;wrongMarkFrames:number;correctMarkFrames:number;
  orangeEventFrames:number;orangeEventFirstSeen:number|null;
  actualGaze:number;gazeTravel:number;
  privateFrames:number;meanGrayFrames:number;
};
const gray=[.36,.41,.46] as const,red=[.92,.12,.08] as const,
 cyan=[.08,.88,.93] as const,orange=[.9,.55,.13] as const;
const idle={drive:0,turn:0,gazeRate:0};
const STEPS=180,BEGIN_EVENT=72,END_EVENT=112;
const FEATURES:readonly Mark[]=['red','cyan'];
const DISTANCES=[6,9,10.4];
const BEARINGS=[42,48,55];
const PHASES=[-.26,0,.26];
const RAD=Math.PI/180;
function matches(retina:Float32Array,c:readonly number[], tol=.035):number[]{
  const hits:number[]=[];
  for(let i=0;i<96;i++){
    const x=i*3;
    if(Math.abs(retina[x]-c[0])<tol
      &&Math.abs(retina[x+1]-c[1])<tol
      &&Math.abs(retina[x+2]-c[2])<tol)hits.push(i);
  }
  return hits;
}
function scalarFeature(frame:PrivateFrame,mark:Mark):number {
  return matches(frame.retina,mark==='red'?red:cyan).length;
}
function previewBearing(frame:PrivateFrame):number|null{
  // This is actor-private gray-color pixel detection, not an object ID.
  const bins=matches(frame.retina,gray);
  if(!bins.length)return null;
  const bearing=bins.reduce((sum,i)=>sum+
    retinalAngle((i+.5)/96*2-1),0)/bins.length;
  return frame.proprio.gaze+bearing;
}
function run(spec:Spec,policy:Policy):Result{
  const w=new LivingWorld(false);
  try{
    const a=spec.bearingDeg*RAD;
    const faceDistance=spec.distance-.73;
    w.addObject(spec.distance*Math.cos(a),
      spec.distance*Math.sin(a),.85,[...gray]);
    const b=(spec.bearingDeg+spec.phaseDeg)*RAD;
    w.addObject(faceDistance*Math.cos(b),faceDistance*Math.sin(b),
      .055,[...(spec.mark==='red'?red:cyan)]);
    const alertHandle=w.addObject(-24,-24,.72,[...orange]);
    const alertAngle=-55*RAD;
    const alertPosition={x:6*Math.cos(alertAngle),y:6*Math.sin(alertAngle)};
    const initial=w.observe();
    const selectedBearing=previewBearing(initial);
    const preview=Array.from(initial.retina);
    let detectedMarkAt:number|null=null,wrongMarkFrames=0,correctMarkFrames=0,
      orangeEventFrames=0,orangeEventFirstSeen:number|null=null,
      privateFrames=0,meanGrayFrames=0;
    let lastSample=-1;
    let gazeTravel=0,priorGaze=initial.proprio.gaze;
    for(let t=0;t<STEPS;t++){
      // HOST-controlled independent optical interruption — no actor access.
      if(t===BEGIN_EVENT)w.moveObject(alertHandle,
        alertPosition.x,alertPosition.y);
      if(t===END_EVENT)w.moveObject(alertHandle,-24,-24);
      const frame=w.observe();
      if(frame.tick!==lastSample){
        lastSample=frame.tick;
        privateFrames++;
        if(matches(frame.retina,gray).length>0)meanGrayFrames++;
        const expected=scalarFeature(frame,spec.mark);
        const wrong=scalarFeature(frame,spec.mark==='red'?'cyan':'red');
        if(expected>0){
          correctMarkFrames++;
          if(detectedMarkAt===null)detectedMarkAt=frame.tick;
        }
        if(wrong>0)wrongMarkFrames++;
        if(frame.tick>=BEGIN_EVENT && frame.tick<END_EVENT
          &&matches(frame.retina,orange).length>0){
          orangeEventFrames++;
          if(orangeEventFirstSeen===null)orangeEventFirstSeen=frame.tick;
        }
        const movement=frame.proprio.gaze-priorGaze;
        gazeTravel+=Math.abs(movement);
        priorGaze=frame.proprio.gaze;
      }
      // A finite eye motor (LivingWorld clamps gaze to +-90 and slew 3rad/s).
      // No physical body drive or turn here, so only information effects vary.
      let gazeRate=0;
      if(policy==='guided'&&selectedBearing!==null){
        const error=selectedBearing-frame.proprio.gaze;
        gazeRate=Math.max(-1,Math.min(1,error*2.7));
      }
      w.step({...idle,gazeRate});
    }
    return {
      spec,policy,previewGrayCount:matches(initial.retina,gray).length,
      previewMarkCount:scalarFeature(initial,spec.mark),
      previewOrangeCount:matches(initial.retina,orange).length,
      preview,selectedBearing,
      detectedMarkAt,wrongMarkFrames,correctMarkFrames,
      orangeEventFrames,orangeEventFirstSeen,actualGaze:w.inspect().gaze,
      gazeTravel,privateFrames,meanGrayFrames,
    };
  }finally{w.free();}
}
const CONFIGS=DISTANCES.flatMap(distance=>BEARINGS.flatMap(bearingDeg=>
  PHASES.map(phaseDeg=>({distance,bearingDeg,phaseDeg}))));
function runAll(){
  return CONFIGS.flatMap(base=>FEATURES.flatMap(mark=>
    (['fixed','guided'] as const).map(policy=>run({...base,mark},policy))));
}
function summarize(results:Result[]){
  return (['fixed','guided'] as const).map(policy=>{
    const rows=results.filter(x=>x.policy===policy);
    const hidden=rows.filter(x=>x.previewMarkCount===0
      &&x.previewGrayCount>0);
    return {
      policy,cases:rows.length,coarseOnlyCases:hidden.length,
      hiddenThenFineResolved:hidden.filter(x=>x.detectedMarkAt!==null).length,
      hiddenThenFineRate:hidden.length?
        hidden.filter(x=>x.detectedMarkAt!==null).length/hidden.length:null,
      allMarkerDetected:rows.filter(x=>x.detectedMarkAt!==null).length,
      peripheralEventSeen:rows.filter(x=>x.orangeEventFrames>0).length,
      meanOrangeEventFrames:rows.reduce((s,x)=>
        s+x.orangeEventFrames,0)/rows.length,
      meanGazeTravel:rows.reduce((s,x)=>s+x.gazeTravel,0)/rows.length,
      meanFirstDetectTick:(()=>{
        const seen=rows.filter(x=>x.detectedMarkAt!==null);
        return seen.length?
          seen.reduce((s,x)=>s+x.detectedMarkAt!,0)/seen.length:null;
      })(),
    };
  });
}
beforeAll(initLivingWorld);
describe('RB-VISION/A1 genuine distant detail versus peripheral opportunity',()=>{
  it('qualifies the limited RGB premise and measures the two opposed optical effects',()=>{
    const results=runAll();
    const stats=summarize(results);
    // The sensor is actually 96 RGB samples per frame, not a depth/oracle eye.
    expect(results.every(r=>r.preview.length===288)).toBe(true);
    expect(results.every(r=>r.privateFrames===45)).toBe(true);
    expect(results.every(r=>r.previewOrangeCount===0)).toBe(true);
    expect(results.every(r=>r.wrongMarkFrames===0)).toBe(true);
    const asSeen=results.filter(r=>r.policy==='guided'
      &&r.previewGrayCount>0 &&r.previewMarkCount===0);
    // Discovery gate: positive optical counterexample exists. A later
    // generality claim must be qualified separately with held-out offsets.
    expect(asSeen.length).toBeGreaterThan(0);
    expect(asSeen.some(r=>r.detectedMarkAt!==null)).toBe(true);
    console.log('RB_VISION_A1_SUMMARY '+JSON.stringify(stats));
    console.log('RB_VISION_A1_SPECIMENS '+JSON.stringify(results
      .filter(x=>x.spec.mark==='red')
      .map(x=>({
        range:x.spec.distance,bearing:x.spec.bearingDeg,
        phase:x.spec.phaseDeg,policy:x.policy,
        gray:x.previewGrayCount,initialDetail:x.previewMarkCount,
        detailAt:x.detectedMarkAt,orangeFrames:x.orangeEventFrames,
        targetBearing:x.selectedBearing,eyeTravel:+x.gazeTravel.toFixed(3),
      }))));
  },60000);
  it('shows a pair of different fine features can start with EXACT SAME lawful coarse RGB',()=>{
    // No privileged object classification for the controller.
    const candidates=CONFIGS.map(base=>{
      const left=run({...base,mark:'red'},'fixed');
      const right=run({...base,mark:'cyan'},'fixed');
      return {base,left,right};
    }).filter(x=>x.left.previewMarkCount===0&&x.right.previewMarkCount===0
      &&x.left.previewGrayCount>0
      &&x.left.preview.every((v,i)=>v===x.right.preview[i]));
    expect(candidates.length).toBeGreaterThan(0);
    const chosen=candidates[0];
    const targetR=run({...chosen.base,mark:'red'},'guided');
    const targetC=run({...chosen.base,mark:'cyan'},'guided');
    expect(targetR.preview).toEqual(targetC.preview);
    expect(targetR.selectedBearing).toEqual(targetC.selectedBearing);
    expect(targetR.detectedMarkAt).not.toBeNull();
    expect(targetC.detectedMarkAt).not.toBeNull();
    console.log('RB_VISION_A1_FINE_ALIAS '+JSON.stringify({
      specimen:chosen.base,grayRayCount:targetR.previewGrayCount,
      redFirstDetail:targetR.detectedMarkAt,
      cyanFirstDetail:targetC.detectedMarkAt,
      gazeDemandFromSameGray:targetR.selectedBearing,
      orangeSeenWhenFocused:targetR.orangeEventFrames,
    }));
  },60000);
});
