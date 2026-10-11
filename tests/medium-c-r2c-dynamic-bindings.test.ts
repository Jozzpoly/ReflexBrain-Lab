import { beforeAll, describe, expect, it } from 'vitest';
import {
  E0_RAPIER as RAPIER,
  createE0World,
  initE0Rapier,
} from '../src/e0-body-seam';

type Pair = { rb: any; co: any };
type Handles = { rb: number; co: number };
type BindingMap = Record<'A' | 'C' | 'D', Handles>;

beforeAll(async () => {
  await initE0Rapier();
});

function makeBody(world: any, x: number, y: number): Pair {
  const rb = world.createRigidBody(
    RAPIER.RigidBodyDesc.dynamic()
      .setTranslation(x, y)
      .setLinearDamping(1.7)
      .setAngularDamping(3),
  );
  const co = world.createCollider(
    RAPIER.ColliderDesc.ball(0.3)
      .setMass(1)
      .setFriction(0)
      .setRestitution(0),
    rb,
  );
  return { rb, co };
}

function handles(body: Pair): Handles {
  return { rb: body.rb.handle, co: body.co.handle };
}

function bind(world: any, h: Handles): Pair {
  const rb = world.getRigidBody(h.rb);
  const co = world.getCollider(h.co);
  if (!rb || !co) throw new Error(`failed binding rb=${h.rb} co=${h.co}`);
  return { rb, co };
}

function bodyState(body: Pair) {
  const p = body.rb.translation();
  const v = body.rb.linvel();
  return {
    x: p.x, y: p.y,
    vx: v.x, vy: v.y,
    angle: body.rb.rotation(),
    av: body.rb.angvel(),
  };
}

function mapState(bodies: Record<'A' | 'C' | 'D', Pair>) {
  return {
    A: bodyState(bodies.A),
    C: bodyState(bodies.C),
    D: bodyState(bodies.D),
  };
}

function applyForces(bodies: Record<'A' | 'C' | 'D', Pair>): void {
  const specs = {
    A: { x: 1.2, y: 0.1 },
    C: { x: -0.7, y: 0.4 },
    D: { x: 0.3, y: -1.1 },
  };
  for (const id of ['A', 'C', 'D'] as const) {
    bodies[id].rb.resetForces(true);
    bodies[id].rb.resetTorques(true);
    bodies[id].rb.addForce(specs[id], true);
  }
}

describe('MEDIUM-C/R2c dynamic binding map across snapshot restore', () => {
  it('restores live dynamic bindings and rejects removed stale handles', () => {
    const source = createE0World();
    let restored: any = null;

    try {
      const A = makeBody(source, -2.0, 0.3);
      const B = makeBody(source, -0.6, -0.5);
      const C = makeBody(source, 1.4, 0.8);
      source.step();

      for (let i = 0; i < 8; i += 1) {
        A.rb.addForce({ x: 0.3, y: 0 }, true);
        B.rb.addForce({ x: 0, y: 0.2 }, true);
        C.rb.addForce({ x: -0.15, y: 0 }, true);
        source.step();
      }

      const staleB = handles(B);
      source.removeRigidBody(B.rb);

      expect(source.getRigidBody(staleB.rb)).toBeNull();
      expect(source.getCollider(staleB.co)).toBeNull();

      const D = makeBody(source, 0.2, -1.6);

      const sourceBodies = { A, C, D };
      const bindingMap: BindingMap = {
        A: handles(A),
        C: handles(C),
        D: handles(D),
      };

      for (let i = 0; i < 12; i += 1) {
        applyForces(sourceBodies);
        source.step();
      }

      // Re-check stale handles after a new body allocation. A removed identity
      // must not silently become "D" through host-level slot assumptions.
      const staleBeforeSnapshot = {
        rb: source.getRigidBody(staleB.rb),
        co: source.getCollider(staleB.co),
      };

      const immediateSource = mapState(sourceBodies);
      const bytes = source.takeSnapshot();

      restored = RAPIER.World.restoreSnapshot(bytes);
      const restoredBodies = {
        A: bind(restored, bindingMap.A),
        C: bind(restored, bindingMap.C),
        D: bind(restored, bindingMap.D),
      };

      const immediateRestored = mapState(restoredBodies);
      const staleAfterRestore = {
        rb: restored.getRigidBody(staleB.rb),
        co: restored.getCollider(staleB.co),
      };

      let firstDivergence: number | null = null;
      for (let tick = 1; tick <= 300; tick += 1) {
        applyForces(sourceBodies);
        applyForces(restoredBodies);
        source.step();
        restored.step();

        if (
          firstDivergence === null &&
          JSON.stringify(mapState(sourceBodies)) !== JSON.stringify(mapState(restoredBodies))
        ) {
          firstDivergence = tick;
        }
      }

      const result = {
        snapshotBytes: bytes.byteLength,
        staleB,
        bindingMap,
        dReusedExactStaleHandle:
          bindingMap.D.rb === staleB.rb || bindingMap.D.co === staleB.co,
        staleBeforeSnapshot: {
          rb: staleBeforeSnapshot.rb ? staleBeforeSnapshot.rb.handle : null,
          co: staleBeforeSnapshot.co ? staleBeforeSnapshot.co.handle : null,
        },
        staleAfterRestore: {
          rb: staleAfterRestore.rb ? staleAfterRestore.rb.handle : null,
          co: staleAfterRestore.co ? staleAfterRestore.co.handle : null,
        },
        immediateEqual:
          JSON.stringify(immediateSource) === JSON.stringify(immediateRestored),
        firstDivergence,
        finalSource: mapState(sourceBodies),
        finalRestored: mapState(restoredBodies),
      };

      console.log('MEDIUM_C_R2C_RESULT ' + JSON.stringify(result));

      expect(immediateRestored).toEqual(immediateSource);
      expect(staleBeforeSnapshot.rb).toBeNull();
      expect(staleBeforeSnapshot.co).toBeNull();
      expect(staleAfterRestore.rb).toBeNull();
      expect(staleAfterRestore.co).toBeNull();
      expect(result.dReusedExactStaleHandle).toBe(false);
      expect(firstDivergence).toBeNull();
      expect(mapState(restoredBodies)).toEqual(mapState(sourceBodies));
    } finally {
      source.free();
      restored?.free();
    }
  }, 20_000);
});
