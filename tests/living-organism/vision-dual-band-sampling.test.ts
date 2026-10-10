import {beforeAll,describe,expect,it} from 'vitest';
import {E0_RAPIER as R} from '../../src/e0-body-seam';
import {LivingWorld,initLivingWorld} from '../../src/living-organism/world';
import {retinalAngle} from '../../src/living-organism/retina-geometry';

/**
 * RB-VISION/A3: hypothetical ACTIVE SPATIAL SAMPLE ALLOCATION.
 *
 * Existing LivingWorld has a fixed 96-ray quadratic retina, and supports
 * motorized GAZE direction, but cannot dynamically redistribute rays.
 * To avoid editing its core, we freeze real LivingWorld/Rapier World physics,
 * raycast the exact same color/surface law through alternative legal
 * ray-angle schedules and deliver ONLY (rgb, own ray directions) as a
 * candidate private observation. The host's surfaces/IDs are used ONLY
 * inside the sensory transducer, never decision/classifier inputs.
 *
 * Every frame costs precisely 96 raycasts. CPU/eye-motion/time prices,
 * perceptual integration and learned attention remain UNQUALIFIED.
 */
type Pattern='red-left'|'cyan-left';
type Profile='native-shifted'|'wide-uniform'|'dual-band-80-16';
type Spec={range:number;bearingDeg:number;phaseDeg:number;pattern:Pattern};
type Frame={rgb:Float32Array;angles:number[]};
type Outcome={
  spec:Spec;profile:Profile;cueBearing:number|null;
  firstCoarseSameAsSibling:boolean;
  redRayCount:number;cyanRayCount:number;orangeRayCount:number;
  recognition:Pattern|null;rayBudget:number;
};
const RAD=Math.PI/180;
const GRAY=[.36,.41,.46] as const, RED=[.92,.12,.08] as const,
 CYAN=[.08,.88,.93] as const, ORANGE=[.9,.55,.13] as const,
 BG=[.025,.04,.06] as const;
const PROFILES:readonly Profile[]=[
  'native-shifted','wide-uniform','dual-band-80-16',
];
const SPECS:Spec[]=[7,9.8,10.4].flatMap(range=>
 [42,48,55].flatMap(bearingDeg=>
 [-.32,0,.32].flatMap(phaseDeg=>
 (['red-left','cyan-left'] as const).map(pattern=>({
   range,bearingDeg,phaseDeg,pattern,
 })))));
function createScene(spec:Spec){
 const w=new LivingWorld(false);
 const a=spec.bearingDeg*RAD;
 w.addObject(spec.range*Math.cos(a),spec.range*Math.sin(a),.85,[...GRAY]);
 const face=spec.range-.78;
 const left=(spec.bearingDeg+spec.phaseDeg-.79)*RAD;
 const right=(spec.bearingDeg+spec.phaseDeg+.79)*RAD;
 const lc=spec.pattern==='red-left'?RED:CYAN;
 const rc=spec.pattern==='red-left'?CYAN:RED;
 w.addObject(face*Math.cos(left),face*Math.sin(left),.072,[...lc]);
 w.addObject(face*Math.cos(right),face*Math.sin(right),.072,[...rc]);
 const other=-56*RAD;
 w.addObject(6*Math.cos(other),6*Math.sin(other),.76,[...ORANGE]);
 return w;
}
function bins(frame:Frame,col:readonly number[]):number[]{
 const hits:number[]=[];
 for(let i=0;i<frame.angles.length;i++){
  const k=i*3;
  if(Math.abs(frame.rgb[k]-col[0])<.035
   &&Math.abs(frame.rgb[k+1]-col[1])<.035
   &&Math.abs(frame.rgb[k+2]-col[2])<.035)hits.push(i);
 }
 return hits;
}
function cueBearing(frame:Frame):number|null{
 const gray=bins(frame,GRAY);
 if(!gray.length)return null;
 return gray.reduce((sum,i)=>sum+frame.angles[i],0)/gray.length;
}
function angularProfile(profile:Profile,focus:number):number[]{
 if(profile==='native-shifted'){
  return Array.from({length:96},(_,i)=>{
   const u=(i+.5)/96*2-1;
   return focus+retinalAngle(u);
  });
 }
 if(profile==='wide-uniform')return Array.from({length:96},
  (_,i)=>((i+.5)/96*160-80)*RAD);
 // Reserve exactly 16 periphery sentinels and assign the remaining 80
 // near the cue's bearing, with a high-density +/-9deg optical window.
 return [
  ...Array.from({length:80},(_,i)=>focus+(-9+(i+.5)*18/80)*RAD),
  ...Array.from({length:16},(_,i)=>(-80+(i+.5)*160/16)*RAD),
 ];
}
function readWorld(cp:ReturnType<LivingWorld['captureCheckpoint']>,
 angles:number[]):Frame{
 const world=R.World.restoreSnapshot(cp.physics);
 if(!world)throw Error('A3 failed checkpoint restoration');
 try {
  const b=world.getRigidBody(cp.actorHandle);
  if(!b)throw Error('A3 no physical eye origin');
  const p=b.translation(),a=b.rotation();
  const rgb=new Float32Array(angles.length*3);
  for(let i=0;i<angles.length;i++){
   const direction=a+angles[i];
   const ray=new R.Ray(p,
    {x:Math.cos(direction),y:Math.sin(direction)});
   let closest=12;
   let color:readonly number[]=BG;
   for(const s of cp.surfaces){
    const co=world.getCollider(s.handle);
    const distance=co.castRay(ray,12,true);
    if(distance>=0 && distance<closest){
     closest=distance;color=s.color;
    }
   }
   rgb.set(color,i*3);
  }
  return {rgb,angles};
 }finally{world.free();}
}
function classify(frame:Frame):Pattern|null{
 const red=bins(frame,RED),cyan=bins(frame,CYAN);
 if(red.length<2||cyan.length<2)return null;
 const pos=(set:number[])=>set.reduce((sum,i)=>
   sum+frame.angles[i],0)/set.length;
 const delta=pos(red)-pos(cyan);
 if(Math.abs(delta)<.25*RAD)return null;
 return delta<0?'red-left':'cyan-left';
}
function scenario(spec:Spec){
 const w=createScene(spec);
 try {
  const cp=w.captureCheckpoint();
  // This is the exact EXISTING quadratic RGB sampling law at body gaze=0.
  const initialAngles=angularProfile('native-shifted',0);
  const initial=readWorld(cp,initialAngles);
  const focus=cueBearing(initial);
  if(focus===null)throw Error('A3 no legally sensed coarse gray cue');
  return {cp,initial,focus};
 }finally{w.free();}
}
function run(spec:Spec):Outcome[]{
 const {cp,initial,focus}=scenario(spec);
 return PROFILES.map(profile=>{
  const frame=readWorld(cp,angularProfile(profile,focus));
  return {
   spec,profile,cueBearing:focus,firstCoarseSameAsSibling:false,
   redRayCount:bins(frame,RED).length,
   cyanRayCount:bins(frame,CYAN).length,
   orangeRayCount:bins(frame,ORANGE).length,
   recognition:classify(frame),rayBudget:frame.angles.length,
  };
 });
}
function aggregate(rows:Outcome[]){
 return PROFILES.map(profile=>{
  const selected=rows.filter(r=>r.profile===profile);
  return {
   profile,cases:selected.length,
   accuratePattern:selected.filter(r=>r.recognition===r.spec.pattern).length,
   twoPartUnknown:selected.filter(r=>r.recognition===null).length,
   peripheralSeen:selected.filter(r=>r.orangeRayCount>0).length,
   meanRedRays:selected.reduce((a,r)=>a+r.redRayCount,0)/selected.length,
   meanCyanRays:selected.reduce((a,r)=>a+r.cyanRayCount,0)/selected.length,
   meanOrangeRays:selected.reduce((a,r)=>a+r.orangeRayCount,0)/selected.length,
  };
 });
}
beforeAll(initLivingWorld);
describe('RB-VISION/A3 dual-band 96 RGB ray allocation: detail + periphery',()=>{
 it('compares real raycast color samples at EXACTLY equal total ray budget',()=>{
  const results=SPECS.flatMap(run);
  expect(results.every(o=>o.rayBudget===96)).toBe(true);
  const stats=aggregate(results);
  expect(stats.every(x=>x.cases===SPECS.length)).toBe(true);
  expect(results.every(x=>x.recognition===null
    ||x.recognition===x.spec.pattern)).toBe(true);
  console.log('RB_VISION_A3_SUMMARY '+JSON.stringify(stats));
  console.log('RB_VISION_A3_CASES '+JSON.stringify(results
   .filter(r=>r.spec.pattern==='red-left'&&r.spec.phaseDeg===0)
   .map(r=>({
    range:r.spec.range,bearing:r.spec.bearingDeg,
    profile:r.profile,feature:r.recognition,
    red:r.redRayCount,cyan:r.cyanRayCount,peripheral:r.orangeRayCount,
   }))));
  // Discovery, not winner enforcement: dual-band must produce at least
  // one simultaneous fine-feature and peripheral optical observation.
  expect(results.some(r=>r.profile==='dual-band-80-16'
   &&r.recognition===r.spec.pattern&&r.orangeRayCount>0)).toBe(true);
 },90000);
 it('checks identical coarse RGB history for two different distant details',()=>{
  for(const base of SPECS.filter(s=>s.pattern==='red-left')){
   const other={...base,pattern:'cyan-left'} as Spec;
   const a=scenario(base),b=scenario(other);
   expect(Array.from(a.initial.rgb)).toEqual(Array.from(b.initial.rgb));
   expect(a.focus).toBe(b.focus);
   expect(classify(a.initial)).toBeNull();
   expect(classify(b.initial)).toBeNull();
  }
 },90000);
});
