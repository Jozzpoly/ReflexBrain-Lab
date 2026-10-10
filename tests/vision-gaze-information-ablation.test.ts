import { beforeAll, describe, expect, it } from 'vitest';
import {
  E0_MASS, E0_RADIUS, E0_RAPIER as R, E0_VMAX,
  applyE0Demand, createE0Body, createE0Wall,
  createE0World, initE0Rapier,
} from '../src/e0-body-seam';

/**
 * VISION/V3 authored, gaze-only information-effect isolation.
 * Research-only control: a conceptual gaze angle affects ONLY legal optical
 * sampling, never the Rapier body. No implicit World solidity information.
 * This is not self-directed looking or a learned brain.
 */
type Scene = {
  id: string;
  radius: number;
  halfGap: number;
  physical: boolean;
  optical: boolean;
};
type Frame = { tick: number; gaze: number; range: number | null };
type Variant = 'center-only' | 'gaze-withheld' | 'gaze-fresh';
type Outcome = {
  id: string;
  variant: Variant;
  source: Uint8Array;
  frame: Frame;
  actualGaze: number;
  choseDrive: 0 | 1;
  displacement: number;
  impulse: number;
  cost: number;
};

const SCENES: readonly Scene[] = [
  {id:'big-narrow-solid',radius:1,halfGap:.72,physical:true,optical:true},
  {id:'big-wide-solid',radius:1,halfGap:1.5,physical:true,optical:true},
  {id:'small-narrow-solid',radius:.42,halfGap:.72,physical:true,optical:true},
  {id:'big-narrow-phantom',radius:1,halfGap:.72,physical:false,optical:true},
  {id:'big-narrow-invisible',radius:1,halfGap:.72,physical:true,optical:false},
];
const SAMPLE_TICK = 28;
const ANGLE = 0.28;
const VIEW_DIST = 6;
const ACTION_TICKS = 180;

function collisionImpulse(world:any, bodyCo:any, walls:any[]):number {
  let acc = 0;
  for(const wall of walls)world.contactPair(bodyCo,wall,(m:any)=>{
    for(let i=0;i<m.numSolverContacts();i++){
      acc+=Math.abs(m.contactImpulse(i));
    }
  });
  return acc;
}

function rayRange(position:{x:number;y:number},angle:number,colliders:any[]):number|null{
  const ray=new R.Ray(position,{x:Math.cos(angle),y:Math.sin(angle)});
  let best=VIEW_DIST;
  for(const co of colliders){
    const dist=co.castRay(ray,VIEW_DIST,true);
    if(typeof dist==='number' && dist>=0 && dist<best)best=dist;
  }
  return best===VIEW_DIST?null:best;
}

function choose(frame:Frame,radius:number):0|1 {
  // Author-written heuristic: big bodies are conservative without a
  // recent *side-looking* sample. Small bodies try going forward.
  if(radius<.7)return 1;
  if(frame.tick!==SAMPLE_TICK || Math.abs(frame.gaze-ANGLE)>1e-9)return 0;
  return frame.range===null?1:0;
}

function physicalContinuation(
  snap:Uint8Array,bodyHandle:number,coHandle:number,wallHandles:number[],drive:0|1,
) {
  const world=R.World.restoreSnapshot(snap);
  if(!world)throw Error('V3 snapshot restore failed');
  try {
    const rb=world.getRigidBody(bodyHandle);
    const co=world.getCollider(coHandle);
    const walls=wallHandles.map(x=>world.getCollider(x));
    if(!rb||!co||walls.some(x=>!x))throw Error('V3 physical binding missing');
    const x0=rb.translation().x;
    let totalImpulse=0;
    for(let t=0;t<ACTION_TICKS;t++){
      applyE0Demand(rb,drive,0);
      world.step();
      totalImpulse+=collisionImpulse(world,co,walls);
    }
    const displacement=rb.translation().x-x0;
    const cost=-displacement/E0_RADIUS+2*totalImpulse/(E0_MASS*E0_VMAX);
    return {displacement,impulse:totalImpulse,cost};
  }finally{world.free();}
}

function run(scene:Scene,variant:Variant):Outcome{
  const world=createE0World();
  try {
    const body=createE0Body(world,0,0,E0_MASS,scene.radius);
    const h=(6-scene.halfGap)/2,y=(6+scene.halfGap)/2;
    const geometry=[{y},{y:-y}];
    const physicalWalls:any[]=[];
    const opticalWalls:any[]=[];
    for(const g of geometry){
      if(scene.physical){
        const co=createE0Wall(world,3,g.y,.15,h).co;
        physicalWalls.push(co);
        if(scene.optical)opticalWalls.push(co);
      }else if(scene.optical){
        const rb=world.createRigidBody(
          R.RigidBodyDesc.fixed().setTranslation(3,g.y),
        );
        const co=world.createCollider(
          R.ColliderDesc.cuboid(.15,h).setSensor(true),rb,
        );
        opticalWalls.push(co);
      }
    }
    world.step();
    const initial:Frame={tick:0,gaze:0,range:null};
    let cached=initial;
    // Commanded private gaze state is independent from rigid-body pose.
    // Both gaze variants execute the exact same idealized gaze command;
    // only fresh lawful sensor delivery differs.
    let actualGaze=0;
    const commandedGaze=variant==='center-only'?0:ANGLE;
    for(let t=1;t<=SAMPLE_TICK;t++){
      if(t===SAMPLE_TICK-3)actualGaze=commandedGaze;
      applyE0Demand(body.rb,0,0);
      world.step();
      if(t===SAMPLE_TICK-4){
        cached={tick:t,gaze:0,range:rayRange(body.rb.translation(),0,opticalWalls)};
      }
    }
    // The fresh sample is made on the exact same final physical state.
    // Withheld means the independent optical sensor is not copied into
    // this actor's private frame; the old cached center sight remains.
    const frame=variant==='gaze-fresh'
      ? {tick:SAMPLE_TICK,gaze:actualGaze,range:rayRange(body.rb.translation(),actualGaze,opticalWalls)}
      : variant==='center-only'
        ? {tick:SAMPLE_TICK,gaze:actualGaze,range:rayRange(body.rb.translation(),actualGaze,opticalWalls)}
        : cached;
    const source:Uint8Array=world.takeSnapshot().slice();
    const choseDrive=choose(frame,scene.radius);
    const result=physicalContinuation(source,body.rb.handle,body.co.handle,
      physicalWalls.map(x=>x.handle),choseDrive);
    return {id:scene.id,variant,source,frame,actualGaze,choseDrive,...result};
  }finally{world.free();}
}
function summary(o:Outcome){
  return {id:o.id,variant:o.variant,gaze:o.frame.gaze,
    sampledTick:o.frame.tick,range:o.frame.range,actualGaze:o.actualGaze,
    drive:o.choseDrive,displacement:o.displacement,
    impulse:o.impulse,cost:o.cost};
}
beforeAll(async()=>{await initE0Rapier();});

describe('RB-VISION/V3 authored gaze-only causal-information ablation',()=>{
  it('keeps all physics/source states identical before the informational boundary',()=>{
    const outcomes=SCENES.flatMap(s=>
      (['center-only','gaze-withheld','gaze-fresh'] as const).map(v=>run(s,v)));
    const replay=SCENES.flatMap(s=>
      (['center-only','gaze-withheld','gaze-fresh'] as const).map(v=>run(s,v)));
    expect(replay.map(summary)).toEqual(outcomes.map(summary));
    for(let i=0;i<outcomes.length;i+=3){
      const trio=outcomes.slice(i,i+3);
      for(const other of trio.slice(1))expect(other.source).toEqual(trio[0].source);
      expect(trio[0].actualGaze).toBe(0);
      expect(trio[1].actualGaze).toBe(ANGLE);
      expect(trio[2].actualGaze).toBe(ANGLE);
    }
    console.log('RB_VISION_V3 ' + JSON.stringify(outcomes.map(summary)));
  });

  it('separates behavior caused by a fresh lawful gaze sample from gaze/clock alone',()=>{
    const bigN=SCENES[0],bigW=SCENES[1],small=SCENES[2];
    const compare=(s:Scene)=>
      (['center-only','gaze-withheld','gaze-fresh'] as const).map(v=>run(s,v));
    const narrow=compare(bigN),wide=compare(bigW),tiny=compare(small);
    expect(narrow.map(x=>x.choseDrive)).toEqual([0,0,0]);
    expect(wide.map(x=>x.choseDrive)).toEqual([0,0,1]);
    expect(tiny.map(x=>x.choseDrive)).toEqual([1,1,1]);
    expect(wide[2].displacement).toBeGreaterThan(3);
    expect(wide[2].impulse).toBe(0);
    expect(wide[0].displacement).toBe(0);
    expect(wide[1].displacement).toBe(0);
    expect(wide[2].cost).toBeLessThan(wide[1].cost);
  });

  it('falsifies an unearned rule that a visual sample reveals mechanical solidity',()=>{
    const phantom=run(SCENES[3],'gaze-fresh');
    const invisible=run(SCENES[4],'gaze-fresh');
    const visibleSolid=run(SCENES[0],'gaze-fresh');
    const visibleWide=run(SCENES[1],'gaze-fresh');
    // Same optical sample, different mechanical truth: looking cannot
    // disambiguate phantom from a genuinely solid narrow obstruction.
    expect(phantom.frame.range).toBe(visibleSolid.frame.range);
    expect(phantom.choseDrive).toBe(0);
    // Invisible but physically solid: the same "no side hit" as a wide gap,
    // so the authored simplistic optic heuristic physically fails.
    expect(invisible.frame.range).toBe(visibleWide.frame.range);
    expect(invisible.choseDrive).toBe(1);
    expect(invisible.impulse).toBeGreaterThan(0);
  });
});
