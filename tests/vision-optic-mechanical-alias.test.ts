import { beforeAll, describe, expect, it } from 'vitest';
import {
  E0_FMAX,
  E0_MASS,
  E0_RADIUS,
  E0_RAPIER as R,
  E0_VMAX,
  applyE0Demand,
  createE0Body,
  createE0Wall,
  createE0World,
  initE0Rapier,
} from '../src/e0-body-seam';

/**
 * VISION/V1-D0 discovery. Research host deliberately makes appearance and
 * collision independent authored laws. This is NOT a proposed actor interface.
 *
 * Same pre-action proprio+binary-touch trace, same optical ray, opposite
 * consequences. No object IDs or collision metadata reach the optical frame.
 * The authored forward-progress/contact-cost metric belongs to the ANALYST.
 */
type Spec = {
  id: 'solid-visible' | 'phantom-visible' | 'solid-invisible' | 'empty';
  optical: boolean;
  mechanical: boolean;
};
type Row = { ownDemand: number; forwardVelocity: number; touch: boolean };
type Branch = { drive: number; displacement: number; impulse: number; cost: number };
type Result = {
  spec: Spec;
  privateHistory: Row[];
  visualRayDistance: number | null;
  push: Branch;
  hold: Branch;
  regretPushMinusHold: number;
  sourceSnapshotUnchanged: boolean;
};

const SPECIMENS: readonly Spec[] = [
  { id: 'solid-visible', optical: true, mechanical: true },
  { id: 'phantom-visible', optical: true, mechanical: false },
  { id: 'solid-invisible', optical: false, mechanical: true },
  { id: 'empty', optical: false, mechanical: false },
];
const PRE_TICKS = 24;
const BRANCH_TICKS = 120;
const SURFACE_X = 3;
const HALF_THICKNESS = 0.1;
const HALF_HEIGHT = 3;
const VISUAL_RANGE = 6;
const IMPULSE_WEIGHT = 2;
// Analyst-only metric: normalized lack of forward progress + actual contact.
const boundCost = (displacement: number, impulse: number) =>
  -displacement / E0_RADIUS +
  IMPULSE_WEIGHT * impulse / (E0_MASS * E0_VMAX);

function actualImpulse(world: any, actorCo: any, wallCo: any | null): number {
  if (!wallCo) return 0;
  let impulse = 0;
  world.contactPair(actorCo, wallCo, (manifold: any) => {
    for (let i = 0; i < manifold.numSolverContacts(); i += 1) {
      impulse += Math.abs(manifold.contactImpulse(i));
    }
  });
  return impulse;
}

function branch(
  snapshot: Uint8Array,
  actorRbHandle: number,
  actorCoHandle: number,
  wallCoHandle: number | null,
  drive: number,
): Branch {
  const world = R.World.restoreSnapshot(snapshot);
  if (!world) throw new Error('vision restored branch missing world');
  try {
    const rb = world.getRigidBody(actorRbHandle);
    const co = world.getCollider(actorCoHandle);
    const wall = wallCoHandle === null ? null : world.getCollider(wallCoHandle);
    if (!rb || !co || (wallCoHandle !== null && !wall)) {
      throw new Error('vision restored binding failed');
    }
    const initialX = rb.translation().x;
    let impulse = 0;
    for (let t = 0; t < BRANCH_TICKS; t += 1) {
      applyE0Demand(rb, drive, 0);
      world.step();
      impulse += actualImpulse(world, co, wall);
    }
    const displacement = rb.translation().x - initialX;
    return {
      drive, displacement, impulse,
      cost: boundCost(displacement, impulse),
    };
  } finally {
    world.free();
  }
}

function run(spec: Spec): Result {
  const world = createE0World();
  try {
    const body = createE0Body(world, 0, 0);
    const solid = spec.mechanical
      ? createE0Wall(world, SURFACE_X, 0, HALF_THICKNESS, HALF_HEIGHT)
      : null;
    // Sensor collider is a visible, mechanically intangible surface.
    // A mechanical collider can also be optically invisible by authored law.
    const opticalPhantom = spec.optical && !spec.mechanical
      ? world.createCollider(
          R.ColliderDesc.cuboid(HALF_THICKNESS, HALF_HEIGHT).setSensor(true),
          world.createRigidBody(
            R.RigidBodyDesc.fixed().setTranslation(SURFACE_X, 0),
          ),
        )
      : null;
    const opticalSurface = !spec.optical
      ? null
      : solid?.co ?? opticalPhantom;

    world.step(); // initialize contact state before the private history
    const privateHistory: Row[] = [];
    for (let tick = 0; tick < PRE_TICKS; tick += 1) {
      applyE0Demand(body.rb, 0, 0);
      world.step();
      privateHistory.push({
        ownDemand: 0,
        forwardVelocity: body.rb.linvel().x,
        touch: actualImpulse(world, body.co, solid?.co ?? null) > 1e-9,
      });
    }

    // An authored ray transducer samples only *optical* surfaces.
    // It outputs a distance or null, never a collider ID/passability flag.
    const p = body.rb.translation();
    const ray = new R.Ray(p, { x: 1, y: 0 });
    const raw = opticalSurface?.castRay(ray, VISUAL_RANGE, true);
    const visualRayDistance =
      typeof raw === 'number' && raw >= 0 && raw <= VISUAL_RANGE
        ? raw : null;

    const stateBefore = world.takeSnapshot().slice();
    const push = branch(
      stateBefore, body.rb.handle, body.co.handle,
      solid?.co.handle ?? null, 1,
    );
    const hold = branch(
      stateBefore, body.rb.handle, body.co.handle,
      solid?.co.handle ?? null, 0,
    );
    const stateAfter = world.takeSnapshot().slice();
    return {
      spec, privateHistory, visualRayDistance, push, hold,
      regretPushMinusHold: push.cost - hold.cost,
      sourceSnapshotUnchanged:
        stateBefore.length === stateAfter.length &&
        stateBefore.every((v, i) => v === stateAfter[i]),
    };
  } finally {
    world.free();
  }
}

function runAll() { return SPECIMENS.map(run); }

beforeAll(async () => {
  await initE0Rapier();
});

describe('RB-VISION/V1-D0 optical versus mechanical private alias', () => {
  it('runs frozen 2x2 source/branch physics deterministically', () => {
    const first = runAll();
    expect(runAll()).toEqual(first);
    expect(first.every(s => s.sourceSnapshotUnchanged)).toBe(true);
    expect(first.every(s => s.privateHistory.every(
      h => h.ownDemand === 0 && h.touch === false,
    ))).toBe(true);
    console.log('RB_VISION_V1_D0 ' + JSON.stringify(first.map(s => ({
      id: s.spec.id, ray: s.visualRayDistance,
      pushCost: s.push.cost, holdCost: s.hold.cost,
      pushImpulse: s.push.impulse,
      pushDisplacement: s.push.displacement,
      regretPushMinusHold: s.regretPushMinusHold,
    }))));
  });

  it('tests whether matched lawful optical/private input can hide different action values', () => {
    const [solidVisible, phantomVisible, solidInvisible, empty] = runAll();

    expect(solidVisible.privateHistory).toEqual(phantomVisible.privateHistory);
    expect(solidInvisible.privateHistory).toEqual(empty.privateHistory);
    expect(solidVisible.privateHistory).toEqual(empty.privateHistory);

    // Same visual evidence for a physically solid and intangible surface.
    expect(solidVisible.visualRayDistance).not.toBeNull();
    expect(solidVisible.visualRayDistance).toBe(phantomVisible.visualRayDistance);
    // Same null view for an optically invisible wall and an empty corridor.
    expect(solidInvisible.visualRayDistance).toBeNull();
    expect(empty.visualRayDistance).toBeNull();

    // Opposite analyst-only preference for the same two actions.
    expect(solidVisible.regretPushMinusHold).toBeGreaterThan(0);
    expect(phantomVisible.regretPushMinusHold).toBeLessThan(0);
    expect(solidInvisible.regretPushMinusHold).toBeGreaterThan(0);
    expect(empty.regretPushMinusHold).toBeLessThan(0);

    // Physical source, not a label/boolean being passed to a model.
    expect(solidVisible.push.impulse).toBeGreaterThan(0);
    expect(solidInvisible.push.impulse).toBeGreaterThan(0);
    expect(phantomVisible.push.impulse).toBe(0);
    expect(empty.push.impulse).toBe(0);
  });
});
