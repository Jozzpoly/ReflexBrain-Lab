import { beforeAll, describe, expect, it } from 'vitest';
import {
  E0_RAPIER as RAPIER,
  createE0Body,
  createE0World,
  initE0Rapier,
  type E0Body,
} from '../src/e0-body-seam';
import {
  P02A_MAX_RANGE,
  senseP02aFrame,
  type P02aPrivateFrame,
} from '../src/p02a-private-occlusion';

const TARGET_RADIUS = 0.35;

type Candidate = E0Body & { radius: number };
type Fixture = {
  world: any;
  actor: E0Body;
  target: Candidate;
  occluder: E0Body;
};

type Handles = {
  actorRb: number;
  actorCo: number;
  targetRb: number;
  targetCo: number;
  occluderRb: number;
  occluderCo: number;
};

beforeAll(async () => {
  await initE0Rapier();
});

function createFixture(targetX: number, targetY: number): Fixture {
  const world = createE0World();
  const actor = createE0Body(world, -3, 0);

  const occluderRb = world.createRigidBody(
    RAPIER.RigidBodyDesc.fixed().setTranslation(0, 0),
  );
  const occluderCo = world.createCollider(
    RAPIER.ColliderDesc.cuboid(0.16, 1.5)
      .setFriction(0)
      .setRestitution(0),
    occluderRb,
  );

  const targetRb = world.createRigidBody(
    RAPIER.RigidBodyDesc.dynamic()
      .setTranslation(targetX, targetY)
      .setLinearDamping(2)
      .setAngularDamping(4),
  );
  const targetCo = world.createCollider(
    RAPIER.ColliderDesc.ball(TARGET_RADIUS)
      .setMass(1)
      .setFriction(0)
      .setRestitution(0),
    targetRb,
  );

  // Frozen P02a query-readiness step for newly inserted colliders.
  world.step();

  return {
    world,
    actor,
    target: { rb: targetRb, co: targetCo, radius: TARGET_RADIUS },
    occluder: { rb: occluderRb, co: occluderCo },
  };
}

function handlesOf(f: Fixture): Handles {
  return {
    actorRb: f.actor.rb.handle,
    actorCo: f.actor.co.handle,
    targetRb: f.target.rb.handle,
    targetCo: f.target.co.handle,
    occluderRb: f.occluder.rb.handle,
    occluderCo: f.occluder.co.handle,
  };
}

function restoreFixture(bytes: Uint8Array, h: Handles): Fixture {
  const world = RAPIER.World.restoreSnapshot(bytes);
  const actorRb = world.getRigidBody(h.actorRb);
  const actorCo = world.getCollider(h.actorCo);
  const targetRb = world.getRigidBody(h.targetRb);
  const targetCo = world.getCollider(h.targetCo);
  const occluderRb = world.getRigidBody(h.occluderRb);
  const occluderCo = world.getCollider(h.occluderCo);

  if (!actorRb || !actorCo || !targetRb || !targetCo || !occluderRb || !occluderCo) {
    world.free();
    throw new Error('snapshot restore failed to rebind P02a fixture handles');
  }

  return {
    world,
    actor: { rb: actorRb, co: actorCo },
    target: { rb: targetRb, co: targetCo, radius: TARGET_RADIUS },
    occluder: { rb: occluderRb, co: occluderCo },
  };
}

function frame(f: Fixture): P02aPrivateFrame {
  return senseP02aFrame(f.world, f.actor, [f.target]);
}

function targetRange(f: Fixture): number {
  const a = f.actor.rb.translation();
  const t = f.target.rb.translation();
  return Math.hypot(t.x - a.x, t.y - a.y);
}

function destroy(f: Fixture | null): void {
  f?.world.free();
}

describe('MEDIUM-C/R2a P0 reconstructibility after exact physics restore', () => {
  it('reconstructs visible moving P0 exactly without advancing causal time', () => {
    const source = createFixture(-1.2, 0.4);
    let restored: Fixture | null = null;
    let steppedRestore: Fixture | null = null;

    try {
      source.target.rb.applyImpulse({ x: 0.45, y: 0.1 }, true);
      for (let i = 0; i < 20; i += 1) source.world.step();

      const before = frame(source);
      expect(before.blobs).toHaveLength(1);
      expect(targetRange(source)).toBeLessThan(P02A_MAX_RANGE);
      expect(Math.abs(before.blobs[0].radialMotion)).toBeGreaterThan(1e-5);

      const bytes = source.world.takeSnapshot();
      const handles = handlesOf(source);

      restored = restoreFixture(bytes, handles);
      const immediate = frame(restored);

      steppedRestore = restoreFixture(bytes, handles);
      steppedRestore.world.step();
      const afterExtraStep = frame(steppedRestore);

      const result = {
        bytes: bytes.byteLength,
        before,
        immediate,
        afterExtraStep,
        immediateEqual: JSON.stringify(before) === JSON.stringify(immediate),
        extraStepEqual: JSON.stringify(before) === JSON.stringify(afterExtraStep),
      };
      console.log('MEDIUM_C_R2A_VISIBLE ' + JSON.stringify(result));

      expect(immediate).toEqual(before);
      expect(afterExtraStep).not.toEqual(before);
    } finally {
      destroy(source);
      destroy(restored);
      destroy(steppedRestore);
    }
  });

  it('reconstructs an exact empty hidden P0 frame without a warm-up step', () => {
    const source = createFixture(1.5, -0.4);
    let restored: Fixture | null = null;

    try {
      source.target.rb.applyImpulse({ x: 1.2, y: 0 }, true);
      for (let i = 0; i < 20; i += 1) source.world.step();

      const before = frame(source);
      expect(before.blobs).toHaveLength(0);
      expect(targetRange(source)).toBeLessThan(P02A_MAX_RANGE);

      const bytes = source.world.takeSnapshot();
      restored = restoreFixture(bytes, handlesOf(source));
      const immediate = frame(restored);

      console.log('MEDIUM_C_R2A_HIDDEN ' + JSON.stringify({
        bytes: bytes.byteLength,
        before,
        immediate,
        range: targetRange(restored),
        immediateEqual: JSON.stringify(before) === JSON.stringify(immediate),
      }));

      expect(immediate).toEqual(before);
      expect(immediate.blobs).toHaveLength(0);
    } finally {
      destroy(source);
      destroy(restored);
    }
  });
});
