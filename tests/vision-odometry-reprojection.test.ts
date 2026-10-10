import { beforeAll, describe, expect, it } from 'vitest';
import {
  E0_DT, E0_MASS, E0_RAPIER as R,
  applyE0Demand, createE0Body, createE0Wall,
  createE0World, initE0Rapier,
} from '../src/e0-body-seam';

/**
 * Vision V5 / odometry and revisiting one formerly observed surface.
 *
 * RESEARCH-ONLY, not full spatial memory, SLAM, organism agency or RGB vision.
 * Initial raycast deliberately grants true RANGE unlike LivingWorld RGB.
 * The private actor may integrate own body-local velocity but NEVER reads
 * world translation, wall handle or the host hidden-change flag.
 */
type Scene = 'static' | 'hidden-opening';
type Trace = {
  scene:Scene;
  sampleAtTick0:{angle:number; range:number};
  motionTicks:number;
  privateIntegratedX:number;
  privateIntegratedY:number;
  hostDisplacementX:number;
  lastTrueX:number;
  rememberedPointLocal:{x:number;y:number};
  oldAngle:number;
  reprojectedAngle:number;
  staleRayRange:number|null;
  directedRayRange:number|null;
  expectedPointRange:number;
  observedResidual:number|null;
  touchTicks:number;
};
const WALL_X=3;
const BASE_GAP=.72;
const OPENED_GAP=1.5;
const FOCUS=0.28;
const MAX_RANGE=6;
const MOTION_TICKS=40;

function raycast(
  actor:any, colliders:any[], angle:number,
):number|null{
  const pos=actor.translation();
  const ray=new R.Ray(pos,{x:Math.cos(angle),y:Math.sin(angle)});
  let best=MAX_RANGE;
  for(const co of colliders){
    const r=co.castRay(ray,MAX_RANGE,true);
    if(typeof r==='number' && r>=0 && r<best)best=r;
  }
  return best===MAX_RANGE?null:best;
}

function run(scene:Scene):Trace {
  const world=createE0World();
  try{
    const b=createE0Body(world,0,0,E0_MASS,1);
    const h=(6-BASE_GAP)/2,y=(6+BASE_GAP)/2;
    const walls=[
      createE0Wall(world,WALL_X,y,.15,h),
      createE0Wall(world,WALL_X,-y,.15,h),
    ];
    const colliders=walls.map(w=>w.co);
    world.step();
    const p0=b.rb.translation();
    const initial=raycast(b.rb,colliders,FOCUS);
    if(initial===null)throw Error('V5 no initial surface to remember');
    // The actor only stores its own range+bearing at t=0.
    const remembered={x:initial*Math.cos(FOCUS),y:initial*Math.sin(FOCUS)};
    let integratedX=0,integratedY=0,touchTicks=0;
    for(let t=1;t<=MOTION_TICKS;t++){
      const before=b.rb.linvel();
      applyE0Demand(b.rb,1,0);
      if(t===20&&scene==='hidden-opening'){
        // Keep original wall half-height; move *inner edges* to ±OPENED_GAP.
        const newY=h+OPENED_GAP;
        walls[0].rb.setTranslation({x:WALL_X,y:newY},true);
        walls[1].rb.setTranslation({x:WALL_X,y:-newY},true);
        world.propagateModifiedBodyPositionsToColliders();
      }
      world.step();
      const after=b.rb.linvel();
      // Body-local integrated proprioception; no host position.
      // A trapezoidal rule is deliberately imperfect under discrete physics.
      integratedX += (before.x+after.x)*.5*E0_DT;
      integratedY += (before.y+after.y)*.5*E0_DT;
      let impulse=0;
      for(const co of colliders)world.contactPair(b.co,co,(m:any)=>{
        for(let i=0;i<m.numSolverContacts();i++)
          impulse+=Math.abs(m.contactImpulse(i));
      });
      if(impulse>0)touchTicks++;
    }

    const estimatedRel={
      x:remembered.x-integratedX,
      y:remembered.y-integratedY,
    };
    const predicted=Math.atan2(estimatedRel.y,estimatedRel.x);
    const expected=Math.hypot(estimatedRel.x,estimatedRel.y);
    const staleRayRange=raycast(b.rb,colliders,FOCUS);
    const directedRayRange=raycast(b.rb,colliders,predicted);
    const finalHost=b.rb.translation();
    return {
      scene,sampleAtTick0:{angle:FOCUS,range:initial},
      motionTicks:MOTION_TICKS,
      privateIntegratedX:integratedX,
      privateIntegratedY:integratedY,
      hostDisplacementX:finalHost.x-p0.x,
      lastTrueX:finalHost.x,
      rememberedPointLocal:remembered,
      oldAngle:FOCUS,
      reprojectedAngle:predicted,
      staleRayRange,directedRayRange,
      expectedPointRange:expected,
      observedResidual:directedRayRange===null?null:Math.abs(directedRayRange-expected),
      touchTicks,
    };
  }finally{world.free();}
}

beforeAll(async()=>{await initE0Rapier();});
describe('RB-VISION/V5 one-point private odometry memory and resampling',()=>{
  it('demonstrates body motion changes where a previously observed point lies',()=>{
    const s=run('static');
    expect(run('static')).toEqual(s);
    expect(s.touchTicks).toBe(0);
    expect(s.hostDisplacementX).toBeGreaterThan(.35);
    expect(Math.abs(s.privateIntegratedX-s.hostDisplacementX)).toBeLessThan(.04);
    expect(s.reprojectedAngle).toBeGreaterThan(s.oldAngle+.03);
    expect(s.staleRayRange).toBeNull();
    expect(s.directedRayRange).not.toBeNull();
    expect(s.observedResidual).not.toBeNull();
    expect(s.observedResidual!).toBeLessThan(.04);
    console.log('RB_VISION_V5_STATIC ' + JSON.stringify(s));
  });

  it('keeps prior private experience equal under a hidden independent opening',()=>{
    const fixed=run('static');
    const changed=run('hidden-opening');
    expect(changed.sampleAtTick0).toEqual(fixed.sampleAtTick0);
    expect(changed.touchTicks).toBe(0);
    expect(changed.privateIntegratedX).toBeCloseTo(fixed.privateIntegratedX,4);
    expect(changed.reprojectedAngle).toBeCloseTo(fixed.reprojectedAngle,4);
    expect(changed.staleRayRange).toBeNull();
    expect(changed.directedRayRange).toBeNull();
    expect(changed.observedResidual).toBeNull();
    console.log('RB_VISION_V5_CHANGED ' + JSON.stringify(changed));
  });
});
