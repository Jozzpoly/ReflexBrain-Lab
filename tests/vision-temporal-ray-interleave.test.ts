import {beforeAll,describe,expect,it} from 'vitest';
import {E0_RAPIER as R,createE0World,initE0Rapier} from '../src/e0-body-seam';

/**
 * VISION/V7: temporal interleaving of a fixed budget of optical rays,
 * and the false simultaneity trap when a scene evolves between scans.
 * NO privileged object ID or world pos is supplied to the observations.
 * Experiment host handles collider mechanics and temporal ground truth.
 */
const N=96,HALF_FOV=80*Math.PI/180,RANGE=10,RADIUS=4;
const ANGLES=[
  -75,-70,-65,-60,-55,-50,-45,-40,-35,-30,-25,-20,-15,-10,-5,
  0,5,10,15,20,25,30,35,40,45,50,55,60,65,70,75,
];
const SIZES=[.025,.06,.12] as const;
const PHASES=[0,.29,.71,1.13] as const;
const EXPONENTS=[1,2] as const;
type Frame={tick:number;hits:number[];numberOfRays:number};
function sample(co:any,exp:number,subpixel:number,tick:number):Frame{
  const hits:number[]=[];
  for(let i=0;i<N;i++){
    const u=((i+subpixel)/N)*2-1;
    const angle=Math.sign(u)*Math.pow(Math.abs(u),exp)*HALF_FOV;
    const ray=new R.Ray({x:0,y:0},{x:Math.cos(angle),y:Math.sin(angle)});
    const distance=co.castRay(ray,RANGE,true);
    if(typeof distance==='number'&&distance>=0&&distance<RANGE)hits.push(angle);
  }
  return {tick,hits,numberOfRays:N};
}
function pairAt(bearing:number,size:number,exp:number){
  const world=createE0World();
  try{
    const a=bearing*Math.PI/180;
    const rb=world.createRigidBody(R.RigidBodyDesc.fixed()
      .setTranslation(RADIUS*Math.cos(a),RADIUS*Math.sin(a)));
    const co=world.createCollider(R.ColliderDesc.ball(size),rb);
    const first=sample(co,exp,.5,10);
    const repeated=sample(co,exp,.5,20);
    const interleaved=sample(co,exp,1,20);
    return {first,repeated,interleaved};
  }finally{world.free();}
}
function stats(){
  return EXPONENTS.map(exp=>{
    let total=0,one=0,repeat=0,dither=0,gains=0;
    for(const phase of PHASES){
      for(const angle of ANGLES){
        for(const radius of SIZES){
          const samplePair=pairAt(angle+phase,radius,exp);
          const a=samplePair.first.hits.length>0;
          const b=samplePair.repeated.hits.length>0;
          const c=samplePair.interleaved.hits.length>0;
          one+=Number(a);
          repeat+=Number(a||b);
          dither+=Number(a||c);
          gains+=Number(!a&&c);
          total++;
        }
      }
    }
    return {exp,scenes:total,raycastBudgetEachFrame:N,frames:2,
      single:one/total,repeated:repeat/total,
      interleaved:dither/total,
      newlySeenAfterShift:gains,
    };
  });
}
function movingTrace(){
  const world=createE0World();
  try{
    const firstAngle=-20*Math.PI/180,lastAngle=20*Math.PI/180;
    const rb=world.createRigidBody(R.RigidBodyDesc.fixed()
      .setTranslation(RADIUS*Math.cos(firstAngle),RADIUS*Math.sin(firstAngle)));
    const co=world.createCollider(R.ColliderDesc.ball(.2),rb);
    const before=sample(co,2,.5,10);
    rb.setTranslation({
      x:RADIUS*Math.cos(lastAngle),y:RADIUS*Math.sin(lastAngle)},true);
    world.propagateModifiedBodyPositionsToColliders();
    const after=sample(co,2,1,20);
    // This union is a deliberately WRONG current-scene interpretation.
    // The time-stamped ledger below is the defensible private memory.
    const naiveCurrentUnion=[...before.hits,...after.hits];
    const ledger=[
      ...before.hits.map(angle=>({angle,observedAt:before.tick})),
      ...after.hits.map(angle=>({angle,observedAt:after.tick})),
    ];
    return {before,after,naiveCurrentUnion,ledger};
  }finally{world.free();}
}
beforeAll(async()=>{await initE0Rapier();});

describe('RB-VISION/V7 temporal ray interleaving and stale appearance',()=>{
  it('compares two-frame coverage under exactly 192 rays for each scheme',()=>{
    const measured=stats();
    expect(stats()).toEqual(measured);
    for(const s of measured){
      expect(s.scenes).toBe(ANGLES.length*SIZES.length*PHASES.length);
      expect(s.raycastBudgetEachFrame).toBe(96);
      expect(s.single).toBeLessThanOrEqual(s.interleaved+1e-12);
      expect(s.repeated).toBeCloseTo(s.single,12);
      expect(s.newlySeenAfterShift).toBeGreaterThanOrEqual(0);
    }
    console.log('RB_VISION_V7_STATIC '+JSON.stringify(measured));
  });

  it('shows why a union of old and fresh ray hits is not a current world map',()=>{
    const t=movingTrace();
    expect(movingTrace()).toEqual(t);
    expect(t.before.numberOfRays).toBe(96);
    expect(t.after.numberOfRays).toBe(96);
    expect(t.before.hits.length).toBeGreaterThan(0);
    expect(t.after.hits.length).toBeGreaterThan(0);
    expect(t.before.hits.every(angle=>angle<0)).toBe(true);
    expect(t.after.hits.every(angle=>angle>0)).toBe(true);
    expect(t.naiveCurrentUnion.some(angle=>angle<0)).toBe(true);
    expect(t.naiveCurrentUnion.some(angle=>angle>0)).toBe(true);
    expect(t.ledger.every(e=>e.observedAt===10||e.observedAt===20)).toBe(true);
    console.log('RB_VISION_V7_MOVING '+JSON.stringify({
      previousHits:t.before.hits.length,
      freshHits:t.after.hits.length,
      unionHasOld:t.naiveCurrentUnion.some(angle=>angle<0),
      unionHasFresh:t.naiveCurrentUnion.some(angle=>angle>0),
      sampleBudget:192,
    }));
  });
});
