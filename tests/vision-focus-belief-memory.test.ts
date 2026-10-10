import {beforeAll, describe, expect, it} from 'vitest';
import {
  E0_MASS, E0_RADIUS, E0_RAPIER as R, E0_VMAX,
  applyE0Demand, createE0Body, createE0Wall,
  createE0World, initE0Rapier,
} from '../src/e0-body-seam';

/**
 * VISION/V4 — private focus allocation, angular sensory memory and its age.
 *
 * A deliberately bounded research-only demonstrator, NOT a spatially
 * registered world map, autonomous initiative, learning, or final retina.
 * The organism gets only its own radius, authored forward activity and
 * (angle, range/null, observedAt) from legal ray samples.
 * The host alone knows moving-wall geometry and evaluates physical costs.
 */
type Aperture = 'narrow' | 'wide';
type Scene = {
  id:string; start:Aperture; finish:Aperture; radius:number;
};
type Focus = 'center' | 'side';
type Policy = 'center-center' | 'scan-forget' | 'scan-remember'
  | 'fresh-side' | 'scan-refresh' | 'scan-expire';
type RayObservation = {angle:number; distance:number|null; observedAt:number};
type PrivateLedger = {
  sideSeen:RayObservation|null; // null: genuinely unknown, not observed empty
  newestFocus:Focus; newest:RayObservation[];
};
type Outcome = {
  scene:Scene; policy:Policy; sampleCount:number;
  gazeHistory:Focus[]; recordAtDecision:RayObservation|null;
  sideAgeAtDecision:number|null; newest:RayObservation[];
  drive:0|1; displacement:number; impulse:number; cost:number;
  sourceSnapshot:Uint8Array;
};

const PRE_SCAN = 24;
const CHANGE_TICK = 56;
const DECISION_TICK = 88;
const BRANCH_TICKS = 180;
const RAY_RANGE = 6;
const FOCUS_ANGLE = 0.28;
const FOVEA_OFFSETS = [-.012,0,.012] as const;
const ACTOR_POLICY:readonly Policy[] = [
  'center-center','scan-forget','scan-remember',
  'fresh-side','scan-refresh','scan-expire',
];
const SCENES:readonly Scene[] = [
  {id:'large-narrow-static',start:'narrow',finish:'narrow',radius:1},
  {id:'large-wide-static',start:'wide',finish:'wide',radius:1},
  {id:'large-wide-closes',start:'wide',finish:'narrow',radius:1},
  {id:'large-narrow-opens',start:'narrow',finish:'wide',radius:1},
  {id:'small-narrow-static',start:'narrow',finish:'narrow',radius:.42},
  {id:'small-narrow-opens',start:'narrow',finish:'wide',radius:.42},
];

function gapHalf(g:Aperture):number{return g==='wide'?1.5:.72;}
function createAperture(world:any, gap:Aperture) {
  const gh=gapHalf(gap),h=(6-gh)/2,y=(6+gh)/2;
  const upper=createE0Wall(world,3,y,.15,h);
  const lower=createE0Wall(world,3,-y,.15,h);
  return [upper,lower];
}
function reposition(
  world:any,walls:ReturnType<typeof createAperture>,
  gap:Aperture,
) {
  // The walls KEEP their original half-height in this specimen.
  // Move each wall so its INNER EDGE (not its center) equals the new
  // requested gap boundary. This makes the physical aperture correct.
  const gh=gapHalf(gap);
  const y=walls[0].hy+gh;
  walls[0].rb.setTranslation({x:3,y},true);
  walls[1].rb.setTranslation({x:3,y:-y},true);
  world.propagateModifiedBodyPositionsToColliders();
  // Host-only fixture invariant; never delivered to the actor.
  const achieved=walls[0].rb.translation().y-walls[0].hy;
  if(Math.abs(achieved-gh)>1e-5)
    throw new Error('V4 moving aperture failed real inner-edge geometry invariant');
}

function focusSamples(
  body:any, colliders:any[], focus:Focus, tick:number,
):RayObservation[] {
  const p=body.translation();
  const center=focus==='side'?FOCUS_ANGLE:0;
  return FOVEA_OFFSETS.map(offset=>{
    const angle=center+offset;
    const ray=new R.Ray(p,{x:Math.cos(angle),y:Math.sin(angle)});
    let min=RAY_RANGE;
    for(const co of colliders){
      const hit=co.castRay(ray,RAY_RANGE,true);
      if(typeof hit==='number' && hit>=0 && hit<min)min=hit;
    }
    return {angle,distance:min<RAY_RANGE?min:null,observedAt:tick};
  });
}

function schedule(policy:Policy):readonly [Focus,Focus] {
  if(policy==='center-center')return ['center','center'];
  if(policy==='fresh-side')return ['center','side'];
  if(policy==='scan-refresh')return ['side','side'];
  return ['side','center'];
}

function physicalOutcome(
  physics:Uint8Array,
  actorHandle:number,
  actorColliderHandle:number,
  wallColliderHandles:number[],
  drive:0|1,
) {
  const branch=R.World.restoreSnapshot(physics);
  if(!branch)throw Error('Failed to restore world physics');
  try {
    const rb=branch.getRigidBody(actorHandle);
    const co=branch.getCollider(actorColliderHandle);
    const walls=wallColliderHandles.map(x=>branch.getCollider(x));
    if(!rb||!co||walls.some(x=>!x))throw Error('Lost physical binding');
    const xStart=rb.translation().x;
    let impulse=0;
    for(let tick=0;tick<BRANCH_TICKS;tick++){
      applyE0Demand(rb,drive,0);
      branch.step();
      for(const wall of walls){
        branch.contactPair(co,wall,(m:any)=>{
          for(let i=0;i<m.numSolverContacts();i++)
            impulse+=Math.abs(m.contactImpulse(i));
        });
      }
    }
    const displacement=rb.translation().x-xStart;
    // Cost is ONLY a host-side authored physical evaluation criterion.
    const cost=-displacement/E0_RADIUS+
      2*impulse/(E0_MASS*E0_VMAX);
    return {displacement,impulse,cost};
  }finally{branch.free();}
}

function choose(ledger:PrivateLedger, radius:number):0|1{
  // Intentionally authored heuristic; no world labels or hidden changes.
  // Body can be small enough to pass either aperture in this specimen.
  if(radius<=.42)return 1;
  const s=ledger.sideSeen;
  if(!s)return 0; // Unknown is not "free"!
  return s.distance===null?1:0;
}
function run(scene:Scene,policy:Policy):Outcome {
  const world=createE0World();
  try {
    const b=createE0Body(world,0,0,E0_MASS,scene.radius);
    const walls=createAperture(world,scene.start);
    const colliders=walls.map(x=>x.co);
    const planned=schedule(policy);
    const ledger:PrivateLedger={
      sideSeen:null,newestFocus:'center',newest:[],
    };
    let sampleCount=0, seen=0;
    world.step(); // initialize
    for(let tick=1;tick<=DECISION_TICK;tick++){
      applyE0Demand(b.rb,0,0);
      if(tick===CHANGE_TICK && scene.start!==scene.finish){
        reposition(world,walls,scene.finish);
      }
      world.step();
      if(tick===PRE_SCAN||tick===DECISION_TICK){
        const focus=planned[seen++];
        const obs=focusSamples(b.rb,colliders,focus,tick);
        sampleCount+=obs.length;
        ledger.newestFocus=focus;
        ledger.newest=obs;
        if(focus==='side'){
          ledger.sideSeen={...obs[1]};
        }
      }
    }
    if(policy==='scan-forget'){
      // Explicit memory ablation, not destruction of physical or sensor state.
      ledger.sideSeen=ledger.newestFocus==='side'
        ? {...ledger.newest[1]} : null;
    }
    if(policy==='scan-expire' && ledger.sideSeen){
      // Authored TTL=20 ticks. Prevents trusting old narrow/wide evidence,
      // but may sacrifice real benefits of memory in static scenes.
      if(DECISION_TICK-ledger.sideSeen.observedAt>20)ledger.sideSeen=null;
    }
    const drive=choose(ledger,scene.radius);
    const sourceSnapshot:Uint8Array=world.takeSnapshot().slice();
    const out=physicalOutcome(
      sourceSnapshot,b.rb.handle,b.co.handle,colliders.map(x=>x.handle),drive,
    );
    return {scene,policy,sampleCount,gazeHistory:[...planned],
      recordAtDecision:ledger.sideSeen?{...ledger.sideSeen}:null,
      sideAgeAtDecision:ledger.sideSeen
        ? DECISION_TICK-ledger.sideSeen.observedAt:null,
      newest:ledger.newest.map(x=>({...x})),
      drive,...out,sourceSnapshot};
  }finally{world.free();}
}

function result(scene:Scene,policy:Policy) {
  const o=run(scene,policy);
  return {id:scene.id,policy,gazes:o.gazeHistory,
    samples:o.sampleCount,side:o.recordAtDecision?.distance??null,
    sideKnown:o.recordAtDecision!==null,
    age:o.sideAgeAtDecision,drive:o.drive,
    displacement:o.displacement,impulse:o.impulse,cost:o.cost};
}
beforeAll(async()=>{await initE0Rapier();});

describe('RB-VISION/V4 controllable sparse focus and private observation ledger',()=>{
  it('keeps raycast budgets equal and physical truth identical across focus policies',()=>{
    for(const scene of SCENES){
      const runs=ACTOR_POLICY.map(p=>run(scene,p));
      expect(runs.map(x=>x.sampleCount)).toEqual([6,6,6,6,6,6]);
      for(const variant of runs.slice(1)) {
        expect(variant.sourceSnapshot).toEqual(runs[0].sourceSnapshot);
      }
      expect(runs[0].newest.every(x=>x.distance===null)).toBe(true);
    }
    console.log('RB_VISION_V4 ' + JSON.stringify(
      SCENES.flatMap(s=>ACTOR_POLICY.map(p=>result(s,p)))));
  });

  it('shows a stored ray can affect later embodied action when current view is the same',()=>{
    const wide=SCENES[1],narrow=SCENES[0];
    const memoryWide=run(wide,'scan-remember');
    const forgetWide=run(wide,'scan-forget');
    const passiveWide=run(wide,'center-center');
    expect(memoryWide.newest).toEqual(forgetWide.newest);
    expect(memoryWide.newest).toEqual(passiveWide.newest);
    expect(memoryWide.recordAtDecision?.distance).toBeNull();
    expect(memoryWide.sideAgeAtDecision).toBe(64);
    expect(forgetWide.recordAtDecision).toBeNull();
    expect(memoryWide.drive).toBe(1);
    expect(forgetWide.drive).toBe(0);
    expect(memoryWide.cost).toBeLessThan(forgetWide.cost);

    const memoryNarrow=run(narrow,'scan-remember');
    expect(memoryNarrow.recordAtDecision?.distance).not.toBeNull();
    expect(memoryNarrow.drive).toBe(0);
    expect(memoryNarrow.impulse).toBe(0);
  });

  it('falsifies treating old clear optical evidence as current material passability',()=>{
    const closed=SCENES[2],opened=SCENES[3];
    const oldClear=run(closed,'scan-remember');
    const freshClosed=run(closed,'fresh-side');
    expect(oldClear.recordAtDecision?.distance).toBeNull();
    expect(oldClear.drive).toBe(1);
    expect(oldClear.impulse).toBeGreaterThan(0);
    expect(freshClosed.recordAtDecision?.distance).not.toBeNull();
    expect(freshClosed.drive).toBe(0);
    expect(freshClosed.cost).toBeLessThan(oldClear.cost);
    const oldBlocked=run(opened,'scan-remember');
    const freshOpened=run(opened,'fresh-side');
    expect(oldBlocked.drive).toBe(0);
    expect(freshOpened.drive).toBe(1);
    expect(freshOpened.impulse).toBe(0);
    expect(freshOpened.cost).toBeLessThan(oldBlocked.cost);
  });

  it('reports the tradeoff of a fixed memory expiry versus fresh reinspection',()=>{
    const rows=SCENES.map(scene=>{
      const values=ACTOR_POLICY.map(policy=>run(scene,policy));
      return {scene:scene.id,values};
    });
    function mean(policy:Policy):number{
      return rows.reduce((sum,r)=>
        sum+r.values.find(v=>v.policy===policy)!.cost,0)/rows.length;
    }
    const costs=Object.fromEntries(ACTOR_POLICY.map(p=>[p,mean(p)]));
    console.log('RB_VISION_V4_POLICY ' + JSON.stringify(costs));
    // Descriptive comparison only. There is deliberately no winning-policy
    // assertion on this mixed distribution; inspect the actual mean costs.
    expect(Object.values(costs).every(Number.isFinite)).toBe(true);
    const wideStatic=rows[1].values;
    expect(wideStatic.find(v=>v.policy==='scan-expire')!.drive).toBe(0);
    expect(wideStatic.find(v=>v.policy==='scan-remember')!.drive).toBe(1);
    const changed=rows[2].values;
    expect(changed.find(v=>v.policy==='scan-expire')!.drive).toBe(0);
    expect(changed.find(v=>v.policy==='scan-remember')!.drive).toBe(1);
  });
});
