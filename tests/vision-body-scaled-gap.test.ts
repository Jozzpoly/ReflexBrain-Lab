import { beforeAll, describe, expect, it } from 'vitest';
import {
  E0_MASS, E0_RADIUS, E0_RAPIER as R, E0_VMAX,
  applyE0Demand, createE0Body, createE0Wall,
  createE0World, initE0Rapier,
} from '../src/e0-body-seam';

/**
 * Vision V2-D0: body-scale × sparse lawful rays.
 *
 * All goals/costs are researcher-authored; this is NOT learned perception.
 * Visible, mechanically solid walls are explicitly the authored scene family.
 * Sensor returns ray ranges, never "can pass" or a fixture/world identity.
 */
type Scene = {
  id: string;
  radius: number;
  gapHalf: number;
};
type Result = {
  id: string;
  radius: number;
  gapHalf: number;
  privateBefore: { drive: number; vx: number; touch: boolean }[];
  central: number | null;
  left: number | null;
  right: number | null;
  fartherLeft: number | null;
  fartherRight: number | null;
  push: { displacement: number; impulse: number; cost: number };
  hold: { displacement: number; impulse: number; cost: number };
  preferred: 'push' | 'hold';
  sourceRestoredUnchanged: boolean;
};

const CASES: readonly Scene[] = [
  { id: 'big-narrow', radius: E0_RADIUS, gapHalf: 0.72 },
  { id: 'big-wide', radius: E0_RADIUS, gapHalf: 1.5 },
  { id: 'small-narrow', radius: 0.42, gapHalf: 0.72 },
  { id: 'small-wide', radius: 0.42, gapHalf: 1.5 },
];

const WALL_X = 3;
const WALL_HX = 0.15;
const OUTER_Y = 6;
const RAY_RANGE = 6;
const VISION_ANGLE = 0.28;
const TICKS = 180;
const PRE_TICKS = 24;
const IMPULSE_COST_FACTOR = 2;
const nullRay = null as number | null;

function impulse(world: any, actorCo: any, walls: any[]): number {
  let out = 0;
  for (const co of walls) world.contactPair(actorCo, co, (m: any) => {
    for (let i = 0; i < m.numSolverContacts(); i++) {
      out += Math.abs(m.contactImpulse(i));
    }
  });
  return out;
}

function actorRay(
  position: {x: number; y: number},
  angle: number,
  opticalWalls: any[],
): number | null {
  const ray = new R.Ray(position, {x: Math.cos(angle), y: Math.sin(angle)});
  let nearest = RAY_RANGE;
  for (const co of opticalWalls) {
    const distance = co.castRay(ray, RAY_RANGE, true);
    if (typeof distance === 'number' && distance >= 0 && distance < nearest) {
      nearest = distance;
    }
  }
  return nearest < RAY_RANGE ? nearest : nullRay;
}

function simulate(
  saved: Uint8Array,
  actorHandle: number,
  colliderHandle: number,
  wallHandles: number[],
  drive: number,
) {
  const world = R.World.restoreSnapshot(saved);
  if (!world) throw new Error('Cannot restore V2 source physics');
  try {
    const body = world.getRigidBody(actorHandle);
    const co = world.getCollider(colliderHandle);
    const walls = wallHandles.map(h => world.getCollider(h));
    if (!body || !co || walls.some(w => !w)) throw new Error('Invalid restored bindings');
    const x0 = body.translation().x;
    let totalImpulse = 0;
    for (let t = 0; t < TICKS; t++) {
      applyE0Demand(body, drive, 0);
      world.step();
      totalImpulse += impulse(world, co, walls);
    }
    const displacement = body.translation().x - x0;
    // Analyst measure, NOT organism reward. Equal body mass and force calibration.
    const cost = -displacement / E0_RADIUS +
      IMPULSE_COST_FACTOR * totalImpulse / (E0_MASS * E0_VMAX);
    return { displacement, impulse: totalImpulse, cost };
  } finally {
    world.free();
  }
}

function probe(scene: Scene): Result {
  const world = createE0World();
  try {
    const b = createE0Body(world, 0, 0, E0_MASS, scene.radius);
    const h = (OUTER_Y - scene.gapHalf) / 2;
    const y = (OUTER_Y + scene.gapHalf) / 2;
    const upper = createE0Wall(world, WALL_X, y, WALL_HX, h);
    const lower = createE0Wall(world, WALL_X, -y, WALL_HX, h);
    const optical = [upper.co, lower.co];
    world.step();

    const privateBefore: Result['privateBefore'] = [];
    for (let t = 0; t < PRE_TICKS; t++) {
      applyE0Demand(b.rb, 0, 0);
      world.step();
      privateBefore.push({
        drive: 0,
        vx: b.rb.linvel().x,
        touch: impulse(world, b.co, optical) > 1e-9,
      });
    }

    const p = b.rb.translation();
    const central = actorRay(p, 0, optical);
    const left = actorRay(p, VISION_ANGLE, optical);
    const right = actorRay(p, -VISION_ANGLE, optical);
    const fartherLeft = actorRay(p, 0.36, optical);
    const fartherRight = actorRay(p, -0.36, optical);
    const before: Uint8Array = world.takeSnapshot().slice();
    const wallHandles = optical.map(w => w.handle);
    const push = simulate(before, b.rb.handle, b.co.handle, wallHandles, 1);
    const hold = simulate(before, b.rb.handle, b.co.handle, wallHandles, 0);
    const after: Uint8Array = world.takeSnapshot().slice();

    return {
      id: scene.id, radius: scene.radius, gapHalf: scene.gapHalf,
      privateBefore, central, left, right, fartherLeft, fartherRight, push, hold,
      preferred: push.cost < hold.cost ? 'push' : 'hold',
      sourceRestoredUnchanged: before.length === after.length &&
        before.every((v, i) => v === after[i]),
    };
  } finally {
    world.free();
  }
}

beforeAll(async () => { await initE0Rapier(); });

describe('RB-VISION/V2-D0 lawful sparse spatial foresight × body scale', () => {
  it('runs 2×2 physical scenes deterministically with source non-interference', () => {
    const first = CASES.map(probe);
    const second = CASES.map(probe);
    expect(second).toEqual(first);
    expect(first.every(s => s.sourceRestoredUnchanged)).toBe(true);
    console.log('RB_VISION_V2_D0 ' + JSON.stringify(first.map(s => ({
      id:s.id, radius:s.radius, halfGap:s.gapHalf,
      center:s.central, left:s.left, right:s.right, fartherLeft:s.fartherLeft, fartherRight:s.fartherRight,
      pushX:s.push.displacement, pushImpulse:s.push.impulse,
      pushCost:s.push.cost, holdCost:s.hold.cost, preferred:s.preferred,
    }))));
  });

  it('finds an actor-private optical alias where extra angled rays separate geometry', () => {
    const [bigN, bigW, smallN, smallW] = CASES.map(probe);
    for (const s of [bigN,bigW,smallN,smallW]) {
      expect(s.central).toBeNull();
      expect(s.privateBefore.every(r => r.drive===0 && r.touch===false)).toBe(true);
    }
    expect(bigN.privateBefore).toEqual(bigW.privateBefore);
    expect(smallN.privateBefore).toEqual(smallW.privateBefore);
    expect(bigN.left).not.toBeNull();
    expect(bigN.right).not.toBeNull();
    expect(bigW.left).toBeNull();
    expect(bigW.right).toBeNull();
    expect(smallN.left).toBe(bigN.left);
    expect(smallW.left).toBe(bigW.left);
  });

  it('challenges the two-side-ray success with a held-out just-blocking gap', () => {
    // V2-D1: Post-D0 ADVERSARIAL stress, not retroactive D0 qualification.
    const blocked = probe({ id: 'holdout-blocked-092', radius: 1, gapHalf: 0.92 });
    const passable = probe({ id: 'holdout-passable-112', radius: 1, gapHalf: 1.12 });
    expect(blocked.privateBefore).toEqual(passable.privateBefore);
    // The original three-ray retinal sample sees exactly the same void.
    expect(blocked.central).toBeNull();
    expect(passable.central).toBeNull();
    expect(blocked.left).toBeNull();
    expect(passable.left).toBeNull();
    expect(blocked.right).toBeNull();
    expect(passable.right).toBeNull();
    // A naive larger-FOV binary "any side ray hit = hold" can also alias.
    expect(blocked.fartherLeft).not.toBeNull();
    expect(passable.fartherLeft).not.toBeNull();
    expect(blocked.fartherRight).not.toBeNull();
    expect(passable.fartherRight).not.toBeNull();

    expect(blocked.preferred).toBe('hold');
    expect(passable.preferred).toBe('push');
    expect(blocked.push.impulse).toBeGreaterThan(0);
    expect(passable.push.impulse).toBe(0);
    console.log('RB_VISION_V2_D1 ' + JSON.stringify(
      [blocked,passable].map(s => ({
        id:s.id, radius:s.radius, halfGap:s.gapHalf,
        center:s.central, rays028:[s.left,s.right],
        rays036:[s.fartherLeft,s.fartherRight],
        pushCost:s.push.cost, pushImpulse:s.push.impulse,
        preferred:s.preferred,
      })),
    ));
  });

  it('measures conditional value of ONE added lawful ray against strong simple policies', () => {
    // This is a post-D0 *analyst demonstration* on the SAME four cases.
    // Policy rules are deliberately authored and evaluated in-sample;
    // do not promote this to a general or learned competence PASS.
    const scenes = CASES.map(probe);
    const cost = (s:Result,drive:'push'|'hold') => s[drive].cost;
    const choose = {
      alwaysPush: (s:Result):'push'|'hold' => 'push',
      bestBodyOnly: (s:Result):'push'|'hold' =>
        s.radius < 0.7 ? 'push' : 'hold',
      // Misleading shortcut: treat every observed edge as impassable.
      visualWithoutBody: (s:Result):'push'|'hold' =>
        s.left!==null ? 'hold' : 'push',
      bodyAndSideRay: (s:Result):'push'|'hold' =>
        s.radius > 0.7 && s.left!==null ? 'hold' : 'push',
    };
    const average = (policy:(s:Result)=>'push'|'hold') =>
      scenes.reduce((sum,s)=>sum+cost(s,policy(s)),0)/scenes.length;
    const means = Object.fromEntries(Object.entries(choose).map(
      ([k,fn])=>[k,average(fn)],
    )) as Record<keyof typeof choose,number>;
    console.log('RB_VISION_V2_POLICY ' + JSON.stringify(means));
    expect(means.bodyAndSideRay).toBeLessThan(means.bestBodyOnly);
    expect(means.visualWithoutBody).toBeGreaterThanOrEqual(means.bodyAndSideRay);
    // In this particular four-scene set, an extra lawful visual sample
    // can improve decision value only when interpreted relative to body size.
    // Information sample cost is NOT in these physics-only figures.
    const extraValue = means.bestBodyOnly-means.bodyAndSideRay;
    expect(extraValue).toBeGreaterThan(0);
  });

  it('shows the same narrow image requires a different action for different body dimensions', () => {
    const [bigN,bigW,smallN,smallW] = CASES.map(probe);
    expect(bigN.preferred).toBe('hold');
    expect(bigW.preferred).toBe('push');
    expect(smallN.preferred).toBe('push');
    expect(smallW.preferred).toBe('push');

    expect(bigN.push.impulse).toBeGreaterThan(0);
    expect(bigN.push.displacement).toBeLessThan(2.5);
    expect(bigW.push.impulse).toBe(0);
    expect(smallN.push.impulse).toBe(0);
    expect(smallW.push.impulse).toBe(0);
    expect(smallN.push.displacement).toBeGreaterThan(3);
  });

  it('maps 32 body×gap worlds and compares representation information ceilings', () => {
    // V2-D2: discovery landscape, not a qualified trained policy.
    // Exact Bayes decision uses analyst outcomes within this *same* synthetic
    // uniform distribution. In-sample idealized information ceilings only.
    const sizes = [0.42, 0.75, 1.0, 1.3];
    const openings = [0.55, 0.72, 0.9, 1.0, 1.12, 1.3, 1.5, 1.8];
    const cases = sizes.flatMap(radius => openings.map(gapHalf =>
      probe({id:`landscape-${radius}-${gapHalf}`,radius,gapHalf}),
    ));
    const round = (v:number|null, step:number) =>
      v===null ? 'none' : String(Math.round(v/step)*step);
    const binary = (v:number|null) => v===null ? '0' : '1';
    const exact = (v:number|null) => v===null ? 'none' : v.toFixed(6);
    const format = (values:(number|null)[], fn:(v:number|null)=>string) =>
      values.map(fn).join('/');
    type Eval = {mean:number; mixedGroups:number; groups:number};
    const decisionCeiling = (key:(s:Result)=>string):Eval => {
      const grouped=new Map<string,Result[]>();
      for(const s of cases){
        const k=key(s);
        const g=grouped.get(k) ?? [];
        g.push(s);grouped.set(k,g);
      }
      let cost=0,mixedGroups=0;
      for(const g of grouped.values()){
        const pushCost=g.reduce((sum,s)=>sum+s.push.cost,0);
        const holdCost=g.reduce((sum,s)=>sum+s.hold.cost,0);
        cost+=Math.min(pushCost,holdCost);
        const different=new Set(g.map(s=>s.preferred));
        if(different.size>1)mixedGroups++;
      }
      return {mean:cost/cases.length,mixedGroups,groups:grouped.size};
    };
    const out = {
      noSensors:decisionCeiling(_=>'same'),
      bodyOnly:decisionCeiling(s=>String(s.radius)),
      visualOnly:decisionCeiling(s=>format([s.left,s.right],binary)),
      bodyPlusCenter:decisionCeiling(s=>String(s.radius)+'/'+binary(s.central)),
      bodyPlusTwoBinary:decisionCeiling(s=>String(s.radius)+'/'+format([s.left,s.right],binary)),
      bodyPlusTwoDistance:decisionCeiling(s=>String(s.radius)+'/'+format([s.left,s.right],exact)),
      bodyPlusFourBinary:decisionCeiling(s=>String(s.radius)+'/'+format([s.left,s.right,s.fartherLeft,s.fartherRight],binary)),
      bodyPlusFourRangeHalfMeter:decisionCeiling(s=>String(s.radius)+'/'+format(
        [s.left,s.right,s.fartherLeft,s.fartherRight],v=>round(v,0.5),
      )),
      bodyPlusFourRangeExact:decisionCeiling(s=>String(s.radius)+'/'+format(
        [s.left,s.right,s.fartherLeft,s.fartherRight],exact,
      )),
      oracle:decisionCeiling(s=>s.id),
    };

    console.log('RB_VISION_V2_LANDSCAPE ' + JSON.stringify({
      cases:cases.length,sizes,openings,evidence:out,
      outcomeMatrix:sizes.map(radius=>cases.filter(s=>s.radius===radius)
        .map(s=>s.preferred==='push'?'P':'H').join('')),
    }));

    expect(cases.length).toBe(32);
    expect(cases.every(s=>s.sourceRestoredUnchanged)).toBe(true);
    // Partition refinement with additional lawful channels cannot worsen
    // the ideal in-sample selector, even though a REAL learner might regress.
    expect(out.bodyPlusTwoBinary.mean).toBeLessThanOrEqual(out.bodyOnly.mean+1e-9);
    expect(out.bodyPlusFourBinary.mean).toBeLessThanOrEqual(out.bodyPlusTwoBinary.mean+1e-9);
    expect(out.oracle.mean).toBeLessThanOrEqual(out.bodyPlusFourRangeExact.mean+1e-9);
    // A full 2D raster is NOT needed to state or solve this limited problem.
    // Do not assert a preselected method must improve on this exploratory grid.
  });

});
