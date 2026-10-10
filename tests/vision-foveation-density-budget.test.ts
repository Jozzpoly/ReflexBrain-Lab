import { beforeAll, describe, expect, it } from 'vitest';
import {
  E0_RAPIER as R, createE0World, initE0Rapier,
} from '../src/e0-body-seam';

/**
 * VISION/V6: equal-budget optical ray distributions.
 * Inspired by Living Organism's 96-ray, +/-80 degree retina and u^2 fovea.
 * The model sees ONLY per-ray appearance hits, not ground-truth range,
 * angular location of the authored spot, ID, or collision semantics.
 *
 * Host enumerates target bearing/size only for controlled truth analysis.
 * This is not learned attention, sensory policy, or final organ.
 */
type Lens = {name:string; exponent:number; gaze:number};
const COUNT=96, HALF_FOV=80*Math.PI/180, DIST=4;
const LENSES:readonly Lens[] = [
  {name:'uniform',exponent:1,gaze:0},
  {name:'quadratic-living-donor',exponent:2,gaze:0},
  {name:'concentrated',exponent:3,gaze:0},
  {name:'concentrated-gaze+45deg',exponent:3,gaze:45*Math.PI/180},
];
const DEGREES=[
  -75,-70,-65,-60,-55,-50,-45,-40,-35,-30,-25,-20,-15,-10,-5,
  0,5,10,15,20,25,30,35,40,45,50,55,60,65,70,75,
];
const RADII=[.025,.06,.12] as const;
type Trial = {
  lens:string; bearing:number; size:number;
  hitCount:number; detected:boolean;
};
function rayAngles(lens:Lens):number[] {
  return Array.from({length:COUNT},(_,i)=>{
    const u=(i+.5)/COUNT*2-1;
    return lens.gaze+Math.sign(u)*Math.pow(Math.abs(u),lens.exponent)*HALF_FOV;
  });
}
function observe(
  world:any, collider:any, lens:Lens,
):number {
  let hits=0;
  for(const angle of rayAngles(lens)){
    const ray=new R.Ray({x:0,y:0},{x:Math.cos(angle),y:Math.sin(angle)});
    const dist=collider.castRay(ray,10,true);
    if(typeof dist==='number' && dist>=0 && dist<=10)hits++;
  }
  return hits;
}
function trialAt(bearing:number,radius:number):Trial[] {
  const world=createE0World();
  try {
    const a=bearing*Math.PI/180;
    const fixed=world.createRigidBody(R.RigidBodyDesc.fixed()
      .setTranslation(DIST*Math.cos(a),DIST*Math.sin(a)));
    const co=world.createCollider(R.ColliderDesc.ball(radius),fixed);
    return LENSES.map(lens=>{
      const hitCount=observe(world,co,lens);
      return {lens:lens.name,bearing,size:radius,hitCount,detected:hitCount>0};
    });
  }finally{world.free();}
}
function run():Trial[] {
  return RADII.flatMap(radius=>DEGREES.flatMap(angle=>trialAt(angle,radius)));
}
function summarize(data:Trial[]){
  return LENSES.map(lens=>{
    const rows=data.filter(r=>r.lens===lens.name);
    const rate=(p:(r:Trial)=>boolean)=>
      rows.filter(p).reduce((n,r)=>n+Number(r.detected),0)/rows.filter(p).length;
    const count=(p:(r:Trial)=>boolean)=>
      rows.filter(p).reduce((n,r)=>n+r.hitCount,0)/rows.filter(p).length;
    return {
      lens:lens.name,rayBudget:COUNT,scenes:rows.length,
      all:rate(_=>true),center:rate(r=>Math.abs(r.bearing)<=15),
      edges:rate(r=>Math.abs(r.bearing)>=50),
      positiveFocus:rate(r=>r.bearing>=40&&r.bearing<=55),
      oppositeSide:rate(r=>r.bearing<=-40&&r.bearing>=-75),
      meanHitsCenter:count(r=>Math.abs(r.bearing)<=15),
    };
  });
}
beforeAll(async()=>{await initE0Rapier();});

describe('RB-VISION/V6 equal-budget 96-ray foveal angular allocation',()=>{
  it('uses the same 96 rays and the original quadratic Living-style geometry',()=>{
    for(const lens of LENSES){
      const angles=rayAngles(lens);
      expect(angles.length).toBe(COUNT);
      expect(angles.every(Number.isFinite)).toBe(true);
      expect(angles[0]).toBeLessThan(angles[angles.length-1]);
    }
    const donor=LENSES[1];
    for(const u of [-.95,-.5,0,.5,.95]){
      const original=Math.sign(u)*u*u*HALF_FOV;
      const ours=Math.sign(u)*Math.pow(Math.abs(u),donor.exponent)*HALF_FOV;
      expect(ours).toBeCloseTo(original,12);
    }
  });

  it('stress-tests fixed angular grids against held-out fractional-degree phase offsets',()=>{
    // D1 stress was proposed AFTER observing D0 integer-grid results.
    // This is exploratory sensitivity, not a retroactive D0 PASS gate.
    const offsets=[0,.29,.71,1.13];
    const sweeps=offsets.map(offset=>{
      const data=RADII.flatMap(radius=>
        DEGREES.flatMap(angle=>trialAt(angle+offset,radius)));
      return {offset,stats:summarize(data)};
    });
    console.log('RB_VISION_V6_PHASE '+JSON.stringify(sweeps));
    expect(sweeps.length).toBe(4);
    expect(sweeps.every(x=>x.stats.length===LENSES.length)).toBe(true);
    expect(sweeps.every(x=>x.stats.every(s=>
      s.rayBudget===COUNT && s.scenes===DEGREES.length*RADII.length)))
      .toBe(true);
  });

  it('compares periphery, fovea and shifted focus on physically raycast targets',()=>{
    const data=run();
    expect(data.length).toBe(DEGREES.length*RADII.length*LENSES.length);
    const replay=run();
    expect(replay).toEqual(data);
    expect(data.every(x=>Number.isInteger(x.hitCount)&&x.hitCount>=0&&x.hitCount<=COUNT))
      .toBe(true);
    const stats=summarize(data);
    console.log('RB_VISION_V6_SUMMARY '+JSON.stringify(stats));
    // The experiment does not presuppose a given density/focus wins.
    expect(stats.every(x=>x.scenes===DEGREES.length*RADII.length)).toBe(true);
    expect(stats.every(x=>Object.values(x).filter(y=>typeof y==='number')
      .every(Number.isFinite))).toBe(true);
  });
});
