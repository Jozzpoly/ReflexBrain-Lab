import { beforeAll, describe, expect, it } from 'vitest';
import {
  E0_FMAX, applyE0Demand, createE0Body, createE0Wall,
  createE0World, initE0Rapier,
} from '../src/e0-body-seam';
import {
  F3A_FROZEN, runF3AQualification, sampleActorLocalContact,
} from '../src/f3a-action-touch-relation';

beforeAll(async () => { await initE0Rapier(); });

function compact() {
  const r = runF3AQualification();
  return {
    outcome: r.outcome,
    deterministic: r.deterministic,
    informative: r.informative,
    positive: r.positive,
    negative: r.negative,
    signAccuracy: r.signAccuracy,
    auc: r.auc,
    reasons: r.reasons,
    episodes: r.episodes.map((e) => ({
      id: e.id,
      kind: e.kind,
      f2PrivateParity: e.actorPrivate.historyParity,
      touchTicks: e.actorPrivate.touchTicks,
      signedTouch: e.actorPrivate.meanSignedTouch,
      mDrive: e.f2.mDrive,
      fDrive: e.f2.fDrive,
      Q: e.actorPrivate.Q,
      R: e.f2.signals.reliabilityR,
      binaryTouch: e.f2.signals.touchFraction,
      regret: e.f2.regret,
      label: e.f2.label,
      sourceSnapshotUnchanged: e.f2.sourceSnapshotUnchanged,
    })),
  };
}

function measureBodyLocalContact(
  side: -1 | 1, actorFirst: boolean, bodyAngle = 0,
): number {
  const world = createE0World();
  try {
    let actor: ReturnType<typeof createE0Body>;
    const addActor = () => {
      actor = createE0Body(world, side * 0.38, 0);
      actor.rb.setRotation(bodyAngle, true);
    };
    const addWall = () => {
      createE0Wall(world, side * 1.5, 0, 0.1, 3);
    };
    if (actorFirst) { addActor(); addWall(); }
    else { addWall(); addActor(); }
    world.step();

    const body = actor!;
    let total = 0;
    for (let i = 0; i < 64; i += 1) {
      applyE0Demand(body.rb, 0, 0);
      body.rb.addForce({ x: side * 1.05 * E0_FMAX, y: 0 }, true);
      world.step();
      total += sampleActorLocalContact(world, body.co, body.rb.rotation());
    }
    return total;
  } finally {
    world.free();
  }
}

describe('F3A — pre-registered action × lawful body contact qualification', () => {
  it('keeps the frozen held-out schedule and excludes the D0 discovery pair', () => {
    expect(F3A_FROZEN.phases).toEqual([2, 4, 6, 8, 10, 12]);
    expect(F3A_FROZEN.strengths).toEqual([0.95, 0.95, 1.05, 1.05, 1.15, 1.15]);
    expect(F3A_FROZEN.nContact).toBe(12);
    expect(F3A_FROZEN.nFree).toBe(6);
    const r = runF3AQualification();
    expect(r.episodes).toHaveLength(18);
    expect(r.episodes.every((e) => e.id !== 'f3-right' && e.id !== 'f3-left')).toBe(true);
    expect(r.episodes.every((e) => e.actorPrivate.historyParity)).toBe(true);
    expect(r.episodes.every((e) => e.f2.sourceSnapshotUnchanged)).toBe(true);
  });

  it('does not access wall identity when sensing: actor-local normal is invariant to creation order', () => {
    for (const side of [1, -1] as const) {
      const actorFirst = measureBodyLocalContact(side, true);
      const wallFirst = measureBodyLocalContact(side, false);
      expect(Math.sign(actorFirst)).toBe(side);
      expect(Math.sign(wallFirst)).toBe(side);
      expect(Math.abs(actorFirst)).toBeGreaterThan(1e-6);
      expect(Math.abs(wallFirst)).toBeGreaterThan(1e-6);
      expect(Math.abs(actorFirst - wallFirst)).toBeLessThan(1e-6);

      // A changed body reference frame must reverse the local component.
      const rotated = measureBodyLocalContact(side, true, Math.PI);
      expect(Math.sign(rotated)).toBe(-side);
    }
  });

  it('repeats the whole experiment deterministically and reports FAIL as science, not CI breakage', () => {
    const first = compact();
    const second = compact();
    expect(second).toEqual(first);
    expect(first.deterministic).toBe(true);
    expect(['PASS', 'FAIL', 'INCONCLUSIVE']).toContain(first.outcome);
    expect(first.episodes.filter((e) => e.kind === 'contact')).toHaveLength(12);
    expect(first.episodes.filter((e) => e.kind === 'free')).toHaveLength(6);
    console.log('RB_F3A_RESULT ' + JSON.stringify(first));
  });
});
