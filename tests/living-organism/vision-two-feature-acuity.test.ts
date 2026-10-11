import {beforeAll,describe,expect,it} from 'vitest';
import {LivingWorld,initLivingWorld,type PrivateFrame} from '../../src/living-organism/world';
import {retinalAngle} from '../../src/living-organism/retina-geometry';

/**
 * RB-VISION/A2 — two-part, spatially ordered distant color detail.
 * The A1 "any one marker ray" was a low recognition bar. This diagnostic
 * requires TWO simultaneous colored parts, each supported by >=2 rays,
 * and correct left-to-right arrangement in one legal RGB sample.
 *
 * Fixed 96-ray quadratic LivingWorld retina, 30Hz sampling, actual slew.
 * No high-res image/oracle depth and no output from host scene setup.
 */
type Pattern='red-left'|'cyan-left';
type Policy='fixed'|'cue-guided'|'blind-sweep';
type Setup={distance:number;bearingDeg:number;phaseDeg:number;pattern:Pattern};
type Result={
 setup:Setup;policy:Policy;
 preview:number[];cueRayCount:number;previewRecognized:Pattern|null;
 frameCount:number;anyCorrectFrames:number;firstRecognizedTick:number|null;
 incorrectFrames:number;strongestRedRays:number;strongestCyanRays:number;
 stableRun:number;maxStableRun:number;peripheralEventFrames:number;
 firstEventTick:number|null;eyeTravel:number;finalGaze:number;
};
const GRAY=[.36,.41,.46] as const;
const RED=[.92,.12,.08] as const;
const CYAN=[.08,.88,.93] as const;
const ORANGE=[.9,.55,.13] as const;
const RAD=Math.PI/180;
const BASE_DISTANCES=[7,9.8];
const BASE_BEARINGS=[42,48,55];
const PHASES=[-.32,0,.32];
const STEPS=240,EVENT_START=108,EVENT_END=148;
const idle={drive:0,turn:0,gazeRate:0};
const setups:Setup[]=BASE_DISTANCES.flatMap(distance=>
 BASE_BEARINGS.flatMap(bearingDeg=>PHASES.flatMap(phaseDeg=>
 (['red-left','cyan-left'] as const).map(pattern=>({
   distance,bearingDeg,phaseDeg,pattern,
 })))));
function indices(frame:PrivateFrame,color:readonly number[]):number[]{
 const out:number[]=[];
 for(let i=0;i<96;i++){
  const j=3*i,r=frame.retina;
  if(Math.abs(r[j]-color[0])<.035
   &&Math.abs(r[j+1]-color[1])<.035
   &&Math.abs(r[j+2]-color[2])<.035)out.push(i);
 }
 return out;
}
function bearingOfBins(indices:number[]):number{
 return indices.reduce((sum,i)=>sum+
   retinalAngle((i+.5)/96*2-1),0)/indices.length;
}
function recognize(frame:PrivateFrame):Pattern|null{
 const red=indices(frame,RED),cyan=indices(frame,CYAN);
 if(red.length<2||cyan.length<2)return null;
 const redBearing=bearingOfBins(red),cyanBearing=bearingOfBins(cyan);
 if(Math.abs(redBearing-cyanBearing)<.25*RAD)return null;
 return redBearing<cyanBearing?'red-left':'cyan-left';
}
function makeWorld(setup:Setup){
 const world=new LivingWorld(false);
 const base=setup.bearingDeg*RAD;
 world.addObject(setup.distance*Math.cos(base),
  setup.distance*Math.sin(base),.85,[...GRAY]);
 // A legally visible pattern, at 7-10 m, painted using two tiny
 // RGB surfaces in front of an otherwise identical carrier object.
 const face=setup.distance-.78;
 const offset=.79;
 const colourA=setup.pattern==='red-left'?RED:CYAN;
 const colourB=setup.pattern==='red-left'?CYAN:RED;
 const left=(setup.bearingDeg+setup.phaseDeg-offset)*RAD;
 const right=(setup.bearingDeg+setup.phaseDeg+offset)*RAD;
 world.addObject(face*Math.cos(left),face*Math.sin(left),.072,[...colourA]);
 world.addObject(face*Math.cos(right),face*Math.sin(right),.072,[...colourB]);
 const secondary=world.addObject(-24,-24,.76,[...ORANGE]);
 return {world,secondary};
}
function run(setup:Setup,policy:Policy):Result{
 const {world:w,secondary}=makeWorld(setup);
 try{
  const initial=w.observe(),firstCue=indices(initial,GRAY);
  const cueRayCount=firstCue.length;
  const targetAngle=cueRayCount?
   bearingOfBins(firstCue)+initial.proprio.gaze:null;
  const preview=Array.from(initial.retina);
  const previewRecognized=recognize(initial);
  let lastTick=-1,frameCount=0,anyCorrectFrames=0,incorrectFrames=0,
   firstRecognizedTick:number|null=null,strongestRedRays=0,
   strongestCyanRays=0,stableRun=0,maxStableRun=0,
   peripheralEventFrames=0,firstEventTick:number|null=null,
   eyeTravel=0,previousGaze=initial.proprio.gaze;
  const peripheralA=-56*RAD;
  for(let t=0;t<STEPS;t++){
   if(t===EVENT_START)w.moveObject(secondary,
     6*Math.cos(peripheralA),6*Math.sin(peripheralA));
   if(t===EVENT_END)w.moveObject(secondary,-24,-24);
   const f=w.observe();
   if(f.tick!==lastTick){
    lastTick=f.tick;frameCount++;
    const rr=indices(f,RED).length,cc=indices(f,CYAN).length;
    strongestRedRays=Math.max(strongestRedRays,rr);
    strongestCyanRays=Math.max(strongestCyanRays,cc);
    const observation=recognize(f);
    if(observation===setup.pattern){
     anyCorrectFrames++;stableRun++;
     if(firstRecognizedTick===null)firstRecognizedTick=f.tick;
    }else{
     stableRun=0;
     if(observation!==null)incorrectFrames++;
    }
    maxStableRun=Math.max(maxStableRun,stableRun);
    if(f.tick>=EVENT_START&&f.tick<EVENT_END
      &&indices(f,ORANGE).length>0){
     peripheralEventFrames++;
     if(firstEventTick===null)firstEventTick=f.tick;
    }
    eyeTravel+=Math.abs(f.proprio.gaze-previousGaze);
    previousGaze=f.proprio.gaze;
   }
   let gazeRate=0;
   if(policy==='cue-guided'&&targetAngle!==null){
    gazeRate=Math.max(-1,Math.min(1,
      (targetAngle-f.proprio.gaze)*2.7));
   }else if(policy==='blind-sweep'){
    // Broad preprogrammed camera sweep independent of the gray cue.
    gazeRate=t<70?1:t<190?-1:1;
   }
   w.step({...idle,gazeRate});
  }
  return {
   setup,policy,preview,cueRayCount,previewRecognized,frameCount,
   anyCorrectFrames,firstRecognizedTick,incorrectFrames,
   strongestRedRays,strongestCyanRays,stableRun,maxStableRun,
   peripheralEventFrames,firstEventTick,
   eyeTravel,finalGaze:w.inspect().gaze,
  };
 }finally{w.free();}
}
function runAll(){
 return setups.flatMap(setup=>
  (['fixed','cue-guided','blind-sweep'] as const).map(policy=>run(setup,policy)));
}
function compress(results:Result[]){
 return (['fixed','cue-guided','blind-sweep'] as const).map(policy=>{
  const items=results.filter(x=>x.policy===policy),
    opaque=items.filter(x=>x.previewRecognized===null&&x.cueRayCount>0);
  return {
   policy,cases:items.length,opaqueCases:opaque.length,
   resolvedAtLeastOneFrame:opaque.filter(x=>x.anyCorrectFrames>0).length,
   resolved3ConsecutiveFrames:opaque.filter(x=>x.maxStableRun>=3).length,
   wrongClassificationFrames:items.reduce((n,x)=>n+x.incorrectFrames,0),
   meanCorrectFrames:items.reduce((n,x)=>n+x.anyCorrectFrames,0)/items.length,
   peripheralDetected:items.filter(x=>x.peripheralEventFrames>0).length,
   meanEyeTravel:items.reduce((n,x)=>n+x.eyeTravel,0)/items.length,
   meanMaxStableRun:items.reduce((n,x)=>n+x.maxStableRun,0)/items.length,
  };
 });
}
beforeAll(initLivingWorld);
describe('RB-VISION/A2 two-part distant details under real RGB gaze budget',()=>{
 it('measures optical acuity and peripheral tradeoff against independent sweep',()=>{
  const results=runAll();
  expect(results.every(x=>x.preview.length===288)).toBe(true);
  expect(results.every(x=>x.frameCount===60)).toBe(true);
  expect(results.every(x=>x.incorrectFrames===0)).toBe(true);
  const stats=compress(results);
  console.log('RB_VISION_A2_SUMMARY '+JSON.stringify(stats));
  console.log('RB_VISION_A2_SAMPLES '+JSON.stringify(results
   .filter(x=>x.setup.pattern==='red-left'&&x.setup.phaseDeg===0)
   .map(x=>({
    distance:x.setup.distance,bearing:x.setup.bearingDeg,
    policy:x.policy,cue:x.cueRayCount,
    preview:x.previewRecognized,first:x.firstRecognizedTick,
    maxRun:x.maxStableRun,meanHits:[x.strongestRedRays,x.strongestCyanRays],
    peripheral:x.peripheralEventFrames,
   }))));
  expect(results.some(x=>x.policy==='cue-guided'
    &&x.previewRecognized===null&&x.maxStableRun>=3)).toBe(true);
 },120000);
 it('finds a paired DIFFERENT two-part pattern initially aliased by the real RGB retina',()=>{
  let demonstrated=false;
  for(const config of setups.filter(x=>x.pattern==='red-left')){
   const opposite={...config,pattern:'cyan-left'} as Setup;
   const a=run(config,'cue-guided'),b=run(opposite,'cue-guided');
   if(a.previewRecognized===null && b.previewRecognized===null
    &&a.cueRayCount>0&&a.preview.every((v,i)=>v===b.preview[i])
    &&a.maxStableRun>=3&&b.maxStableRun>=3){
    demonstrated=true;
    console.log('RB_VISION_A2_PAIRED_DETAIL '+JSON.stringify({
     setup:{distance:config.distance,bearing:config.bearingDeg,
       phase:config.phaseDeg},
     coarseGrayRays:a.cueRayCount,
     redLeftFirst:a.firstRecognizedTick,
     cyanLeftFirst:b.firstRecognizedTick,
     redLeftStable:a.maxStableRun,
     cyanLeftStable:b.maxStableRun,
     guidedEyeTravel:a.eyeTravel,
     missedPeripheralA:a.peripheralEventFrames,
    }));
    break;
   }
  }
  expect(demonstrated).toBe(true);
 },120000);
});
