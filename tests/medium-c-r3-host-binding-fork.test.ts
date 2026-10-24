import { beforeAll, describe, expect, it } from 'vitest';
import {
  E0_RAPIER as RAPIER,
  createE0World,
  initE0Rapier,
} from '../src/e0-body-seam';
import {
  HostBindingRegistry,
  type HostBindingId,
  type PhysicsHandles,
} from '../src/medium-host-binding-registry';

type Pair = { rb: any; co: any };

beforeAll(async () => {
  await initE0Rapier();
});

function makeBody(world: any, x: number, y: number): Pair {
  const rb = world.createRigidBody(
    RAPIER.RigidBodyDesc.dynamic()
      .setTranslation(x, y)
      .setLinearDamping(1.6)
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

function handles(body: Pair): PhysicsHandles {
  return { rb: body.rb.handle, co: body.co.handle };
}

function state(world: any, registry: HostBindingRegistry, ids: HostBindingId[]) {
  return Object.fromEntries(ids.map((id) => {
    const body = registry.resolve(world, id);
    if (!body) return [id, null];
    const p = body.rb.translation();
    const v = body.rb.linvel();
    return [id, {
      x: p.x,
      y: p.y,
      vx: v.x,
      vy: v.y,
      angle: body.rb.rotation(),
      av: body.rb.angvel(),
    }];
  }));
}

function runOnce() {
  const source = createE0World();
  let worldA: any = null;
  let worldB: any = null;

  try {
    const root = new HostBindingRegistry('root');

    const A = makeBody(source, -2.0, 0.5);
    const idA = root.allocate(handles(A), 0);

    const B = makeBody(source, -0.7, -0.4);
    const idB = root.allocate(handles(B), 0);

    const C = makeBody(source, 1.3, 0.7);
    const idC = root.allocate(handles(C), 0);

    for (let tick = 1; tick <= 8; tick += 1) {
      A.rb.addForce({ x: 0.25, y: 0.05 }, true);
      B.rb.addForce({ x: 0, y: 0.2 }, true);
      C.rb.addForce({ x: -0.15, y: 0 }, true);
      source.step();
    }

    const staleBHandles = handles(B);
    root.retire(idB, 8);
    source.removeRigidBody(B.rb);

    const D = makeBody(source, 0.1, -1.5);
    const idD = root.allocate(handles(D), 8);

    for (let tick = 9; tick <= 20; tick += 1) {
      A.rb.resetForces(true);
      C.rb.resetForces(true);
      D.rb.resetForces(true);
      A.rb.addForce({ x: 0.3, y: 0.1 }, true);
      C.rb.addForce({ x: -0.2, y: 0.2 }, true);
      D.rb.addForce({ x: 0.1, y: -0.25 }, true);
      source.step();
    }

    const liveIds = [idA, idC, idD];
    const rootMomentState = state(source, root, liveIds);
    const physicsBytes = source.takeSnapshot();
    const registrySnapshot = root.snapshot();

    // Parent falsifier may or may not manifest on every future runtime build.
    // We record raw alias behavior but never use it as the host identity oracle.
    const staleRawBeforeFork = source.getRigidBody(staleBHandles.rb);
    const staleRawAliasHandle = staleRawBeforeFork ? staleRawBeforeFork.handle : null;

    worldA = RAPIER.World.restoreSnapshot(physicsBytes);
    worldB = RAPIER.World.restoreSnapshot(physicsBytes);

    const restoredRootA = HostBindingRegistry.restore(registrySnapshot);
    const restoredRootB = HostBindingRegistry.restore(registrySnapshot);
    const regA = restoredRootA.fork('root/A');
    const regB = restoredRootB.fork('root/B');

    const immediateA = state(worldA, regA, liveIds);
    const immediateB = state(worldB, regB, liveIds);

    // Retired B remains retired even if a low-level stale handle resolves.
    const retiredBSource = root.resolve(source, idB);
    const retiredBA = regA.resolve(worldA, idB);
    const retiredBB = regB.resolve(worldB, idB);

    // Both branches are exact copies before branch-local births/interventions.
    let firstPreInterventionDivergence: number | null = null;
    for (let tick = 1; tick <= 60; tick += 1) {
      for (const [world, registry] of [[worldA, regA], [worldB, regB]] as const) {
        const a = registry.resolve(world, idA)!;
        const c = registry.resolve(world, idC)!;
        const d = registry.resolve(world, idD)!;
        a.rb.resetForces(true);
        c.rb.resetForces(true);
        d.rb.resetForces(true);
        a.rb.addForce({ x: 0.16, y: 0.02 }, true);
        c.rb.addForce({ x: -0.11, y: 0.03 }, true);
        d.rb.addForce({ x: 0.04, y: -0.08 }, true);
        world.step();
      }
      if (
        firstPreInterventionDivergence === null &&
        JSON.stringify(state(worldA, regA, liveIds)) !==
          JSON.stringify(state(worldB, regB, liveIds))
      ) {
        firstPreInterventionDivergence = tick;
      }
    }

    // New births in sibling branches may receive identical physics handles
    // because the Worlds are independent. Their host identities must still differ.
    const bornA = makeBody(worldA, 2.4, -1.1);
    const bornB = makeBody(worldB, 2.4, -1.1);
    const idBornA = regA.allocate(handles(bornA), 80);
    const idBornB = regB.allocate(handles(bornB), 80);

    const bornHandlesEqualAcrossForks =
      bornA.rb.handle === bornB.rb.handle &&
      bornA.co.handle === bornB.co.handle;

    // Branch-local intervention 1: retire inherited D only in branch A.
    const dA = regA.resolve(worldA, idD)!;
    regA.retire(idD, 81);
    worldA.removeRigidBody(dA.rb);

    const dStillLiveInB = regB.resolve(worldB, idD);

    // Branch-local intervention 2: address each newly born object only by HBID.
    const targetA = regA.resolve(worldA, idBornA)!;
    const targetB = regB.resolve(worldB, idBornB)!;
    targetA.rb.applyImpulse({ x: 1.25, y: 0.1 }, true);
    targetB.rb.applyImpulse({ x: -0.85, y: 0.4 }, true);

    for (let tick = 1; tick <= 120; tick += 1) {
      worldA.step();
      worldB.step();
    }

    const bornAAfter = regA.resolve(worldA, idBornA)!;
    const bornBAfter = regB.resolve(worldB, idBornB)!;

    // Post-fork churn in A: a second birth must not reuse retired D's HBID.
    const bornA2 = makeBody(worldA, -2.5, -1.4);
    const idBornA2 = regA.allocate(handles(bornA2), 201);

    const summary = {
      ids: { idA, idB, idC, idD, idBornA, idBornB, idBornA2 },
      snapshotBytes: physicsBytes.byteLength,
      staleBHandles,
      staleRawAliasHandle,
      rootRegistry: registrySnapshot,
      immediateMatchesRoot:
        JSON.stringify(immediateA) === JSON.stringify(rootMomentState) &&
        JSON.stringify(immediateB) === JSON.stringify(rootMomentState),
      forkInheritedIdsEqual:
        regA.get(idA)?.id === regB.get(idA)?.id &&
        regA.get(idC)?.id === regB.get(idC)?.id &&
        regA.get(idD)?.id === regB.get(idD)?.id,
      retiredBResolvable: {
        source: retiredBSource !== null,
        A: retiredBA !== null,
        B: retiredBB !== null,
      },
      firstPreInterventionDivergence,
      bornHandlesEqualAcrossForks,
      branchBirthIdsDistinct: idBornA !== idBornB,
      dAfterBranchARetirement: {
        A: regA.resolve(worldA, idD) !== null,
        B: dStillLiveInB !== null,
      },
      branchBirthVelocities: {
        A: { ...bornAAfter.rb.linvel() },
        B: { ...bornBAfter.rb.linvel() },
      },
      branchASecondBirth: {
        id: idBornA2,
        differsFromRetiredD: idBornA2 !== idD,
        differsFromFirstBranchBirth: idBornA2 !== idBornA,
      },
      forkRegistryA: regA.snapshot(),
      forkRegistryB: regB.snapshot(),
    };

    return summary;
  } finally {
    source.free();
    worldA?.free();
    worldB?.free();
  }
}

describe('MEDIUM-C/R3 fork-safe HostBindingId lifecycle', () => {
  it('preserves host provenance identity across handle churn, restore, fork, retirement and branch-local births', () => {
    const first = runOnce();
    const second = runOnce();

    console.log('MEDIUM_C_R3_RESULT ' + JSON.stringify(first));

    expect(second).toEqual(first);

    expect(first.ids.idA).toBe('hb:root:0');
    expect(first.ids.idB).toBe('hb:root:1');
    expect(first.ids.idC).toBe('hb:root:2');
    expect(first.ids.idD).toBe('hb:root:3');

    expect(first.immediateMatchesRoot).toBe(true);
    expect(first.forkInheritedIdsEqual).toBe(true);
    expect(first.retiredBResolvable).toEqual({ source: false, A: false, B: false });
    expect(first.firstPreInterventionDivergence).toBeNull();

    expect(first.ids.idBornA).toBe('hb:root/A:0');
    expect(first.ids.idBornB).toBe('hb:root/B:0');
    expect(first.branchBirthIdsDistinct).toBe(true);

    expect(first.dAfterBranchARetirement).toEqual({ A: false, B: true });

    expect(first.branchASecondBirth.differsFromRetiredD).toBe(true);
    expect(first.branchASecondBirth.differsFromFirstBranchBirth).toBe(true);
    expect(first.ids.idBornA2).toBe('hb:root/A:1');

    // HBID-addressed branch-local impulses must reach different intended bodies.
    expect(first.branchBirthVelocities.A.x).toBeGreaterThan(0);
    expect(first.branchBirthVelocities.B.x).toBeLessThan(0);

    const retiredA = first.forkRegistryA.records.filter((r) => r.status === 'retired').map((r) => r.id);
    const retiredB = first.forkRegistryB.records.filter((r) => r.status === 'retired').map((r) => r.id);
    expect(retiredA).toContain(first.ids.idB);
    expect(retiredA).toContain(first.ids.idD);
    expect(retiredB).toContain(first.ids.idB);
    expect(retiredB).not.toContain(first.ids.idD);
  }, 20_000);
});
