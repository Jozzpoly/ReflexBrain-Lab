import {
  E0_FMAX, E0_LINEAR_DAMPING, E0_MASS, E0_RADIUS,
  applyE0Demand, createE0Body, createE0Wall, createE0World,
} from './e0-body-seam';
import {
  F2_P0_CONSTANTS,
  runF2P0EpisodeForResearch,
  type F2EpisodeResult,
  type F2EpisodeSpec,
} from './f2-private-competence-reliability';

/**
 * Frozen F3A, see docs/competence-runs/RB-F3A_ARMED.md.
 * Only the scene builder sees wall side or external force.
 * The candidate receives signed actor-local contact impulse and its OWN M demand.
 * World-side M-vs-F regret is restricted to final evaluation.
 */
type PrivateContactSample = {
  tick: number;
  demand: number;
  before: number;
  after: number;
  touch: boolean;
  signedLocalImpulse: number;
};

export type F3AEpisode = {
  id: string;
  kind: 'contact' | 'free';
  f2: F2EpisodeResult;
  actorPrivate: {
    meanSignedTouch: number;
    touchTicks: number;
    Q: number;
    historyParity: boolean;
  };
};

export type F3AResult = {
  outcome: 'PASS' | 'FAIL' | 'INCONCLUSIVE';
  deterministic: boolean;
  episodes: F3AEpisode[];
  informative: number;
  positive: number;
  negative: number;
  signAccuracy: number | null;
  auc: {
    Q: number | null;
    R: number | null;
    binaryTouch: number | null;
    signedTouch: number | null;
    mDrive: number | null;
    absMDrive: number | null;
  };
  reasons: string[];
};

const PHASES = [2, 4, 6, 8, 10, 12] as const;
const CONTACT_STRENGTHS = [0.95, 0.95, 1.05, 1.05, 1.15, 1.15] as const;
const WALL_X = 1.5;
const WALL_HX = 0.1;
const WALL_HY = 3;
const START_X = WALL_X - WALL_HX - E0_RADIUS - 0.02;
const EPS = 1e-9;

/**
 * This is an ACTOR-COLLIDER neighborhood query, not a world object lookup.
 * It does not know a wall, a side, the identity of 'other', or host regret.
 * The flipped flag converts the manifold normal to the actor->other direction.
 */
export function sampleActorLocalContact(
  world: any, actorCollider: any, bodyAngle: number,
): number {
  let signedX = 0;
  const c = Math.cos(bodyAngle);
  const s = Math.sin(bodyAngle);
  world.contactPairsWith(actorCollider, (other: any) => {
    world.contactPair(actorCollider, other, (manifold: any, flipped: boolean) => {
      const n = manifold.normal();
      const orientation = flipped ? -1 : 1;
      const localX = orientation * (c * n.x + s * n.y);
      for (let i = 0; i < manifold.numSolverContacts(); i += 1) {
        signedX += localX * Math.abs(manifold.contactImpulse(i));
      }
    });
  });
  return signedX;
}

function specContact(phase: number, strength: number, side: -1 | 1): F2EpisodeSpec {
  return {
    id: 'f3a-contact-p' + phase + '-s' + strength + '-' + (side > 0 ? 'r' : 'l'),
    family: 'contact-constraint', phase,
    externalBefore: strength * side,
    externalAfter: strength * side,
    transitionTick: null, dampingMultiplier: 1,
    wallSide: side, releaseWallAtTransition: false,
  };
}

function specFree(phase: number, ordinal: number): F2EpisodeSpec {
  const external = (ordinal % 2 === 0 ? 1 : -1) * 0.25;
  return {
    id: 'f3a-free-p' + phase,
    family: 'familiar-free', phase,
    externalBefore: external, externalAfter: external,
    transitionTick: null, dampingMultiplier: 1,
    wallSide: 0, releaseWallAtTransition: false,
  };
}

/**
 * Independent material replay in the SAME Rapier/E0 substrate as frozen F2.
 * Spec's wallSide sets up the external world; no wall reference enters sensing.
 * Parity is checked against every transition in F2's private history window.
 */
function replayPrivateContacts(spec: F2EpisodeSpec): PrivateContactSample[] {
  const world = createE0World();
  try {
    const initialX = spec.wallSide === 0 ? 0 :
      spec.wallSide > 0 ? START_X : -START_X;
    const actor = createE0Body(
      world, initialX, 0, E0_MASS, E0_RADIUS,
      E0_LINEAR_DAMPING * spec.dampingMultiplier,
    );
    actor.rb.setRotation(0, true);
    if (spec.wallSide !== 0) {
      createE0Wall(
        world, spec.wallSide > 0 ? WALL_X : -WALL_X, 0, WALL_HX, WALL_HY,
      );
    }
    world.step(); // exactly F2's readiness step

    const samples: PrivateContactSample[] = [];
    for (let tick = 1; tick <= F2_P0_CONSTANTS.decisionTick; tick += 1) {
      const before = actor.rb.linvel().x;
      const demand = F2_P0_CONSTANTS.demandPattern[
        (tick - 1 + spec.phase) % F2_P0_CONSTANTS.demandPattern.length
      ];
      applyE0Demand(actor.rb, demand, 0);
      actor.rb.addForce({ x: spec.externalBefore * E0_FMAX, y: 0 }, true);
      world.step();

      const signedLocalImpulse = sampleActorLocalContact(
        world, actor.co, actor.rb.rotation(),
      );
      samples.push({
        tick, demand, before, after: actor.rb.linvel().x,
        touch: Math.abs(signedLocalImpulse) > EPS, signedLocalImpulse,
      });
    }
    return samples.slice(-F2_P0_CONSTANTS.historyWindow);
  } finally {
    world.free();
  }
}

function actorHistoryParity(samples: PrivateContactSample[], f2: F2EpisodeResult): boolean {
  return samples.length === f2.history.length &&
    samples.every((row, i) => {
      const expected = f2.history[i];
      return row.tick === expected.tick &&
        row.demand === expected.demand &&
        Math.abs(row.before - expected.velocityBefore) <= 1e-10 &&
        Math.abs(row.after - expected.velocityAfter) <= 1e-10 &&
        row.touch === expected.privateTouch;
    });
}

function runEpisode(spec: F2EpisodeSpec): F3AEpisode {
  const f2 = runF2P0EpisodeForResearch(spec);
  const privateRows = replayPrivateContacts(spec);
  const meanSignedTouch = privateRows.reduce(
    (sum, row) => sum + row.signedLocalImpulse, 0,
  ) / privateRows.length;
  return {
    id: spec.id, kind: spec.wallSide === 0 ? 'free' : 'contact', f2,
    actorPrivate: {
      meanSignedTouch,
      touchTicks: privateRows.filter((row) => row.touch).length,
      Q: meanSignedTouch * f2.mDrive, // exact frozen relation
      historyParity: actorHistoryParity(privateRows, f2),
    },
  };
}

function auc(episodes: F3AEpisode[], score: (e: F3AEpisode) => number): number | null {
  const worse = episodes.filter((e) => e.f2.label === 'M_WORSE');
  const better = episodes.filter((e) => e.f2.label === 'M_BETTER');
  if (!worse.length || !better.length) return null;
  let wins = 0;
  for (const a of worse) for (const b of better) {
    const x = score(a), y = score(b);
    wins += x > y ? 1 : x === y ? 0.5 : 0;
  }
  return wins / (worse.length * better.length);
}

function runOnce(): Omit<F3AResult, 'deterministic'> {
  const specs: F2EpisodeSpec[] = [];
  PHASES.forEach((phase, i) => {
    specs.push(specContact(phase, CONTACT_STRENGTHS[i], 1));
    specs.push(specContact(phase, CONTACT_STRENGTHS[i], -1));
  });
  PHASES.forEach((phase, i) => specs.push(specFree(phase, i)));
  const episodes = specs.map(runEpisode);
  const contacts = episodes.filter((e) => e.kind === 'contact');
  const free = episodes.filter((e) => e.kind === 'free');
  const informative = contacts.filter(
    (e) => !e.f2.sameAction && e.f2.label !== 'TIE',
  );
  const positive = informative.filter((e) => e.f2.label === 'M_WORSE').length;
  const negative = informative.filter((e) => e.f2.label === 'M_BETTER').length;
  const signHits = informative.filter((e) =>
    Math.sign(e.actorPrivate.Q) === (e.f2.label === 'M_WORSE' ? 1 : -1)
  ).length;
  const signAccuracy = informative.length ? signHits / informative.length : null;
  const resultAuc = {
    Q: auc(informative, (e) => e.actorPrivate.Q),
    R: auc(informative, (e) => e.f2.signals.reliabilityR),
    binaryTouch: auc(informative, (e) => e.f2.signals.touchFraction),
    signedTouch: auc(informative, (e) => e.actorPrivate.meanSignedTouch),
    mDrive: auc(informative, (e) => e.f2.mDrive),
    absMDrive: auc(informative, (e) => Math.abs(e.f2.mDrive)),
  };

  const reasons: string[] = [];
  if (episodes.some((e) => !e.actorPrivate.historyParity)) {
    reasons.push('actor-only contact replay does not match frozen F2 private history');
  }
  if (contacts.some((e) => e.actorPrivate.touchTicks === 0)) {
    reasons.push('some held-out contact episodes have no sensed contact');
  }
  if (contacts.some((e) => e.f2.sourceSnapshotUnchanged !== true)) {
    reasons.push('F2 source snapshot mutated');
  }
  if (informative.length < 8) reasons.push('fewer than 8 informative contact episodes');
  if (positive === 0 || negative === 0) reasons.push('only one regret class present');
  if (resultAuc.Q === null || resultAuc.Q < 0.9) reasons.push('Q AUC below 0.90');
  if (resultAuc.Q === null || resultAuc.R === null ||
      resultAuc.Q - resultAuc.R < 0.25) reasons.push('Q fails +0.25 over R');
  if (resultAuc.Q === null || resultAuc.binaryTouch === null ||
      resultAuc.Q - resultAuc.binaryTouch < 0.25) reasons.push('Q fails +0.25 over touch');
  if (resultAuc.Q === null || resultAuc.signedTouch === null ||
      resultAuc.Q - resultAuc.signedTouch < 0.10) reasons.push('Q fails +0.10 over signed touch');
  if (signAccuracy === null || signAccuracy < 0.8) {
    reasons.push('frozen Q sign rule accuracy below 80%');
  }
  if (free.some((e) =>
    e.actorPrivate.touchTicks !== 0 ||
    Math.abs(e.actorPrivate.meanSignedTouch) > EPS ||
    Math.abs(e.actorPrivate.Q) > EPS
  )) reasons.push('fabricated directional touch in free controls');
  if (free.some((e) => !e.actorPrivate.historyParity)) {
    reasons.push('free-control F2 private replay mismatch');
  }

  const inconclusive =
    informative.length < 4 || positive === 0 || negative === 0 ||
    contacts.some((e) => e.actorPrivate.touchTicks === 0);
  return {
    outcome: inconclusive ? 'INCONCLUSIVE' : reasons.length ? 'FAIL' : 'PASS',
    episodes, informative: informative.length, positive, negative,
    signAccuracy, auc: resultAuc, reasons,
  };
}

export function runF3AQualification(): F3AResult {
  const first = runOnce();
  const second = runOnce();
  const deterministic = JSON.stringify(first) === JSON.stringify(second);
  return {
    ...first,
    deterministic,
    outcome: deterministic ? first.outcome : 'INCONCLUSIVE',
    reasons: deterministic ? first.reasons : [...first.reasons, 'nondeterministic rerun'],
  };
}

export const F3A_FROZEN = Object.freeze({
  phases: [...PHASES],
  strengths: [...CONTACT_STRENGTHS],
  nContact: 12, nFree: 6,
});
