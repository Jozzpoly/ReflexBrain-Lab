import { beforeAll, describe, expect, it } from 'vitest';
import { E0_MASS, E0_RADIUS, E0_VMAX, E0_RAPIER as R } from '../../src/e0-body-seam';
import { LivingWorld, initLivingWorld } from '../../src/living-organism/world';
import { retinalAngle } from '../../src/living-organism/retina-geometry';

/**
 * RB-VISION/A5: a REDUCED, researcher-calibrated physical passage question.
 *
 * A scene contains genuinely solid Rapier walls. The actor has body radius 1,
 * a continuing forward motor option and 96 lawful RGB-ray samples total.
 * Is a whole high-resolution fovea necessary, or can a single calibrated
 * narrow-edge ray resolve a critical physical uncertainty cheaply?
 *
 * The calibration threshold assumes known passage distance x=3, which is
 * NOT learned by the actor in this experiment. Its performance at other
 * distances is an explicit adversarial test. No autonomous reason or goal.
 */
type Style='wide96'|'focus96'|'dual80-16'|'wide95-plus-one';
type Spec={x:number;halfGap:number};
type PrivateSample={angles:number[];rgb:Float32Array};
type Phys={displacement:number;impulse:number;cost:number};
type Case={
 spec:Spec;initial:Float32Array;
 probeOrigin:number;style:Style;rayCount:number;
 observedRayAngle:number;observedUpper:boolean;
 chosen:'push'|'hold';push:Phys;hold:Phys;chosenCost:number;
 physicalChoice:'push'|'hold';
};
const GREY=[.39,.43,.47] as const,LOWER=[.26,.29,.34] as const,
 BG=[.025,.04,.06] as const;
const IDLE={drive:0,turn:0,gazeRate:0};
const STYLES:readonly Style[]=[
 'wide96','focus96','dual80-16','wide95-plus-one'];
const RAD=Math.PI/180;
const WALL_HALF_HEIGHT=2;
const WALL_HALF_THICKNESS=.015;
const CALIBRATED_BOUNDARY=Math.atan2(E0_RADIUS,3); // authored/held fixed
const GAPS=[.92,.95,.97,.99,1.01,1.03,1.05,1.08];
const RANGE_X=[2.7,3,3.3];
const SPECS=RANGE_X.flatMap(x=>GAPS.map(halfGap=>({x,halfGap})));

function build(s:Spec){
 const w=new LivingWorld(false);
 w.addWall(s.x,WALL_HALF_HEIGHT+s.halfGap,
  WALL_HALF_THICKNESS,WALL_HALF_HEIGHT,[...GREY]);
 w.addWall(s.x,-(WALL_HALF_HEIGHT+s.halfGap),
  WALL_HALF_THICKNESS,WALL_HALF_HEIGHT,[...LOWER]);
 return w;
}
function sample(cp:ReturnType<LivingWorld['captureCheckpoint']>,
 angles:number[]):PrivateSample{
 const world=R.World.restoreSnapshot(cp.physics);
 if(!world)throw Error('A5 snapshot failed');
 try {
  const actor=world.getRigidBody(cp.actorHandle);
  if(!actor)throw Error('A5 actor unavailable');
  const p=actor.translation(),heading=actor.rotation();
  const rgb=new Float32Array(angles.length*3);
  for(let i=0;i<angles.length;i++){
   const a=heading+angles[i];
   const ray=new R.Ray(p,{x:Math.cos(a),y:Math.sin(a)});
   let best=12,col:readonly number[]=BG;
   for(const surface of cp.surfaces){
    const co=world.getCollider(surface.handle);
    const t=co.castRay(ray,12,true);
    if(t>=0&&t<best){best=t;col=surface.color;}
   }
   rgb.set(col,3*i);
  }
  return {angles,rgb};
 }finally{world.free();}
}
function upperAtIndex(s:PrivateSample,i:number):boolean{
 return Math.abs(s.rgb[3*i]-GREY[0])<.035
  &&Math.abs(s.rgb[3*i+1]-GREY[1])<.035
  &&Math.abs(s.rgb[3*i+2]-GREY[2])<.035;
}
function seedFocus(cp:ReturnType<LivingWorld['captureCheckpoint']>){
 const current=sample(cp,
  Array.from({length:96},(_,i)=>{
   const u=(i+.5)/96*2-1;return retinalAngle(u);
  }));
 const rays=current.angles.filter((a,i)=>a>0&&upperAtIndex(current,i));
 if(!rays.length)throw Error('A5 no lawful upper-wall coarse cue');
 // Author-chosen edge offset from the FIRST visible upper ray,
 // never a hidden gap value or exact world position.
 return {current,focus:Math.min(...rays)-.75*RAD};
}
function angles(style:Style,focus:number):number[]{
 const uniform=(count:number)=>Array.from({length:count},
  (_,i)=>(-80+(i+.5)*160/count)*RAD);
 const detail=(n:number)=>Array.from({length:n},
  (_,i)=>focus+(-9+(i+.5)*18/n)*RAD);
 if(style==='wide96')return uniform(96);
 if(style==='focus96')return detail(96);
 if(style==='dual80-16')return [...detail(80),...uniform(16)];
 return [...uniform(95),CALIBRATED_BOUNDARY];
}
function actionFromVisual(s:PrivateSample):{
 observedRayAngle:number;observedUpper:boolean;chosen:'push'|'hold'}{
 // Research-authored known body radius and known x≈3 calibration.
 // The actor chooses the legally acquired sample ANGULARLY closest to
 // the line that would clear a disc of own diameter, not a host gap ID.
 const index=s.angles.reduce((best,a,i)=>
  Math.abs(a-CALIBRATED_BOUNDARY)<
  Math.abs(s.angles[best]-CALIBRATED_BOUNDARY)?i:best,0);
 const observedUpper=upperAtIndex(s,index);
 return {observedRayAngle:s.angles[index],observedUpper,
  chosen:observedUpper?'hold':'push'};
}
function branch(cp:ReturnType<LivingWorld['captureCheckpoint']>,
 drive:0|1):Phys {
 const w=new LivingWorld(false);
 w.restoreCheckpoint(cp);
 try{
  const start=w.inspect().actor.x;
  let impulse=0;
  for(let tick=0;tick<200;tick++){
   w.step({drive,turn:0,gazeRate:0});
   if((tick+1)%4===0){
    impulse+=w.inspectContactSample().contacts.reduce(
     (sum,c)=>sum+c.impulse,0);
   }
  }
  const displacement=w.inspect().actor.x-start;
  return {
   displacement,impulse,
   cost:-displacement/E0_RADIUS+
    2*impulse/(E0_MASS*E0_VMAX),
  };
 }finally{w.free();}
}
function run(s:Spec):Case[]{
 const w=build(s);
 try{
  const cp=w.captureCheckpoint();
  const {current,focus}=seedFocus(cp);
  const push=branch(cp,1),hold=branch(cp,0);
  return STYLES.map(style=>{
   const input=sample(cp,angles(style,focus));
   const evidence=actionFromVisual(input);
   return {
    spec:s,initial:current.rgb,
    probeOrigin:focus,style,rayCount:input.angles.length,
    ...evidence,
    push,hold,chosenCost:evidence.chosen==='push'?push.cost:hold.cost,
    physicalChoice:push.cost<hold.cost?'push':'hold',
   };
  });
 }finally{w.free();}
}
function summary(rows:Case[]){
 return STYLES.map(style=>{
  const set=rows.filter(x=>x.style===style);
  const oracle=set.reduce((sum,x)=>
   sum+Math.min(x.push.cost,x.hold.cost),0)/set.length;
  const mean=set.reduce((sum,x)=>sum+x.chosenCost,0)/set.length;
  const optimal=set.filter(x=>x.physicalChoice===x.chosen).length;
  const calibrated=set.filter(x=>x.spec.x===3);
  return {style,cases:set.length,
   optimalAll:optimal,optimalCalibrated:
    calibrated.filter(x=>x.physicalChoice===x.chosen).length,
   calibratedCases:calibrated.length,
   meanPhysicalCost:mean,oracleCost:oracle,
   excessCost:mean-oracle,
   samples:set[0].rayCount,
  };
 });
}
beforeAll(initLivingWorld);
describe('RB-VISION/A5 real passage action-value vs one calibrated ray',()=>{
 it('tests true Rapier drive/contact outcomes under equal 96-RGB budget',()=>{
  const rows=SPECS.flatMap(run);
  const report=summary(rows);
  expect(rows.length).toBe(SPECS.length*STYLES.length);
  expect(rows.every(x=>x.rayCount===96)).toBe(true);
  expect(rows.every(x=>x.chosenCost>=Math.min(x.push.cost,x.hold.cost)-1e-7))
   .toBe(true);
  expect(rows.some(x=>x.push.impulse>0)).toBe(true);
  expect(rows.some(x=>x.push.impulse===0)).toBe(true);
  console.log('RB_VISION_A5_ACTION '+JSON.stringify(report));
  console.log('RB_VISION_A5_CALIBRATED '+JSON.stringify(
   rows.filter(x=>x.spec.x===3).map(x=>({
    gap:x.spec.halfGap,style:x.style,
    visualUpper:x.observedUpper,
    rayAngle:+(x.observedRayAngle/RAD).toFixed(4),
    chose:x.chosen,physical:x.physicalChoice,
    pushX:+x.push.displacement.toFixed(4),
    pushImpulse:+x.push.impulse.toFixed(4),
   }))));
  // The claim is diagnostic: cannot promote a winner just because
  // the experiment was designed around its probe geometry.
 },120000);
 it('checks strict coarse RGB alias on near-clearance opposite outcomes',()=>{
  const narrow=run({x:3,halfGap:.97});
  const wide=run({x:3,halfGap:1.03});
  const a=narrow[0],b=wide[0];
  expect(Array.from(a.initial)).toEqual(Array.from(b.initial));
  expect(a.push.impulse).toBeGreaterThan(0);
  expect(b.push.impulse).toBe(0);
  expect(a.physicalChoice).toBe('hold');
  expect(b.physicalChoice).toBe('push');
 },30000);
});
