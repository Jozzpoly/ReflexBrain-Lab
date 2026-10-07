import { beforeAll, describe, expect, it } from 'vitest';
import {
  E0_RAPIER as RAPIER,
  createE0Body,
  initE0Rapier,
} from '../src/e0-body-seam';

beforeAll(async () => {
  await initE0Rapier();
});

describe('P02a Rapier scene-query readiness diagnostic', () => {
  it('compares the same visible ray before and after the first world step', () => {
    const world = new RAPIER.World({ x: 0, y: 0 });

    const actor = createE0Body(world, -3.0, 0.0);

    const occluderRb = world.createRigidBody(
      RAPIER.RigidBodyDesc.fixed().setTranslation(0, 0),
    );
    world.createCollider(
      RAPIER.ColliderDesc.cuboid(0.16, 1.5),
      occluderRb,
    );

    const targetRb = world.createRigidBody(
      RAPIER.RigidBodyDesc.dynamic()
        .setTranslation(-1.2, 0.4)
        .setLinearDamping(2.0),
    );
    const targetCo = world.createCollider(
      RAPIER.ColliderDesc.ball(0.35).setMass(1),
      targetRb,
    );

    const cast = () => {
      const ap = actor.rb.translation();
      const tp = targetRb.translation();
      const dx = tp.x - ap.x;
      const dy = tp.y - ap.y;
      const range = Math.hypot(dx, dy);
      const ray = new RAPIER.Ray(
        { x: ap.x, y: ap.y },
        { x: dx / range, y: dy / range },
      );
      const hit = world.castRay(
        ray,
        range,
        true,
        undefined,
        undefined,
        actor.co,
      );
      return {
        hit: hit !== null,
        targetHit: hit?.collider?.handle === targetCo.handle,
        hitHandle: hit?.collider?.handle ?? null,
        targetHandle: targetCo.handle,
        actorHandle: actor.co.handle,
        actor: { x: ap.x, y: ap.y },
        target: { x: tp.x, y: tp.y },
      };
    };

    const beforeStep = cast();
    world.step();
    const afterStep = cast();

    console.log(
      'P02A_QUERY_READINESS ' +
        JSON.stringify({ beforeStep, afterStep }),
    );

    expect(beforeStep.targetHit).toBe(false);
    expect(afterStep.targetHit).toBe(true);

    world.free();
  });
});
