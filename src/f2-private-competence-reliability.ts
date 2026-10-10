import {
  E0_DT,
  E0_FMAX,
  E0_LINEAR_DAMPING,
  E0_MASS,
  E0_RADIUS,
  E0_RAPIER as RAPIER,
  E0_TAU_MOVE,
  E0_VMAX,
  applyE0Demand,
  createE0Body,
  createE0Wall,
  createE0World,
} from './e0-body-seam';
import {
  HostBindingRegistry,
  type HostBindingId,
  type HostBindingRegistrySnapshot,
} from './medium-host-binding-registry';

export type F2Family =
  | 'familiar-free'
  | 'free-force-change'
  | 'altered-dynamics'
  | 'contact-constraint'
  | 'recovery';

export type F2EpisodeSpec = {
  id: string;
  family: F2Family;
  phase: number;
  externalBefore: number;
  externalAfter: number;
  transitionTick: number | null;
  dampingMultiplier: number;
  wallSide: -1 | 0 | 1;
  releaseWallAtTransition: boolean;
};

export type F2Transition = {
  tick: number;
  demand: number;
  velocityBefore: number;
  velocityAfter: number;
  residual: number;
  privateTouch: boolean;
};

export type F2Signals = {
  reliabilityR: number;
  speed: number;
  deltaV: number;
  lastDemand: number;
  touchFraction: number;
  touchRecency: number;
};

export type F2BranchOutcome = {
  drive: number;
  finalVelocity: number;
  contactImpulse: number;
  cost: number;
};

export type F2EpisodeResult = {
  id: string;
  family: F2Family;
  phase: number;
  sourceTick: number;
  history: F2Transition[];
  signals: F2Signals;
  mDrive: number;
  fDrive: number;
  m: F2BranchOutcome;
  f: F2BranchOutcome;
  regret: number;
  label: 'M_WORSE' | 'M_BETTER' | 'TIE';
  sameAction: boolean;
  sourceSnapshotUnchanged: boolean;
};

export type F2Aucs = {
  reliabilityR: number | null;
  speed: number | null;
  deltaV: number | null;
  lastDemand: number | null;
  touchFraction: number | null;
  touchRecency: number | null;
};

export type F2CampaignResult = {
  outcome: 'PASS' | 'FAIL' | 'INCONCLUSIVE';
  deterministic: boolean;
  episodes: F2EpisodeResult[];
  informativeCount: number;
  mWorseCount: number;
  mBetterCount: number;
  tieCount: number;
  sameActionCount: number;
  aucs: F2Aucs;
  alteredNoTouchMWorseCount: number;
  medians: {
    alteredNoTouchMWorseR: number | null;
    freeMBetterR: number | null;
    contactR: number | null;
    recoveryR: number | null;
  };
  meanCosts: {
    alwaysM: number;
    alwaysF: number;
  };
  reasons: string[];
};

const DECISION_TICK = 64;
const HISTORY_WINDOW = 24;
const BRANCH_HORIZON = 24;
const REGRET_EPS = 1e-6;
const CANDIDATES = [-1, -0.5, 0, 0.5, 1] as const;

const DEMAND_PATTERN = Object.freeze([
  -0.75, 0.25, 0.75, -0.25,
  0.25, -0.75, -0.25, 0.75,
  0.75, -0.75, 0.25, -0.25,
  -0.25, 0.75, -0.75, 0.25,
]);

const NOMINAL_ALPHA = Math.exp(-E0_DT / E0_TAU_MOVE);
const NOMINAL_BETA =
  NOMINAL_ALPHA * E0_FMAX * E0_DT / E0_MASS;

const WALL_X = 1.5;
const WALL_HX = 0.1;
const WALL_HY = 3;
const CONTACT_START_X = WALL_X - WALL_HX - E0_RADIUS - 0.02;

type SourceHost = {
  world: any;
  registry: HostBindingRegistry;
  actorId: HostBindingId;
  wallId: HostBindingId | null;
  actor: { rb: any; co: any };
  wall: { rb: any; co: any } | null;
  tick: number;
  history: F2Transition[];
};

type SourceSnapshot = {
  physics: Uint8Array;
  bindings: HostBindingRegistrySnapshot;
  actorId: HostBindingId;
  wallId: HostBindingId | null;
  tick: number;
};

function externalFractionAt(spec: F2EpisodeSpec, nextTick: number): number {
  if (spec.transitionTick !== null && nextTick > spec.transitionTick) {
    return spec.externalAfter;
  }
  return spec.externalBefore;
}

function probeDemand(spec: F2EpisodeSpec, nextTick: number): number {
  return DEMAND_PATTERN[
    (nextTick - 1 + spec.phase) % DEMAND_PATTERN.length
  ];
}

function contactImpulse(host: SourceHost): number {
  if (!host.wall) return 0;
  let impulse = 0;
  host.world.contactPair(host.actor.co, host.wall.co, (manifold: any) => {
    for (let i = 0; i < manifold.numSolverContacts(); i += 1) {
      impulse += Math.abs(manifold.contactImpulse(i));
    }
  });
  return impulse;
}

function nominalResidual(
  velocityBefore: number,
  velocityAfter: number,
  demand: number,
): number {
  return velocityAfter -
    NOMINAL_ALPHA * velocityBefore -
    NOMINAL_BETA * demand;
}

function createHost(spec: F2EpisodeSpec): SourceHost {
  const world = createE0World();
  const registry = new HostBindingRegistry('rb-f2-' + spec.id);
  const damping = E0_LINEAR_DAMPING * spec.dampingMultiplier;

  const startX =
    spec.wallSide === 0
      ? 0
      : spec.wallSide > 0
        ? CONTACT_START_X
        : -CONTACT_START_X;

  const actor = createE0Body(
    world,
    startX,
    0,
    E0_MASS,
    E0_RADIUS,
    damping,
  );
  actor.rb.setRotation(0, true);

  const actorId = registry.allocate(
    { rb: actor.rb.handle, co: actor.co.handle },
    0,
  );

  let wall: SourceHost['wall'] = null;
  let wallId: HostBindingId | null = null;
  if (spec.wallSide !== 0) {
    wall = createE0Wall(
      world,
      spec.wallSide > 0 ? WALL_X : -WALL_X,
      0,
      WALL_HX,
      WALL_HY,
    );
    wallId = registry.allocate(
      { rb: wall.rb.handle, co: wall.co.handle },
      0,
    );
  }

  // Query/contact readiness only. The private history starts after this.
  world.step();

  return {
    world,
    registry,
    actorId,
    wallId,
    actor,
    wall,
    tick: 0,
    history: [],
  };
}

function maybeApplyTransition(spec: F2EpisodeSpec, host: SourceHost, nextTick: number): void {
  if (
    spec.releaseWallAtTransition &&
    spec.transitionTick !== null &&
    nextTick === spec.transitionTick + 1 &&
    host.wall
  ) {
    host.wall.rb.setTranslation(
      { x: spec.wallSide > 0 ? 20 : -20, y: 0 },
      true,
    );
  }
}

function stepSource(spec: F2EpisodeSpec, host: SourceHost): void {
  const nextTick = host.tick + 1;
  maybeApplyTransition(spec, host, nextTick);

  const velocityBefore = host.actor.rb.linvel().x;
  const demand = probeDemand(spec, nextTick);

  applyE0Demand(host.actor.rb, demand, 0);
  host.actor.rb.addForce(
    { x: externalFractionAt(spec, nextTick) * E0_FMAX, y: 0 },
    true,
  );
  host.world.step();

  const velocityAfter = host.actor.rb.linvel().x;
  const impulse = contactImpulse(host);

  host.history.push({
    tick: nextTick,
    demand,
    velocityBefore,
    velocityAfter,
    residual: nominalResidual(velocityBefore, velocityAfter, demand),
    privateTouch: impulse > 1e-9,
  });
  host.tick = nextTick;
}

function sourceSnapshot(host: SourceHost): SourceSnapshot {
  return {
    physics: host.world.takeSnapshot().slice(),
    bindings: host.registry.snapshot(),
    actorId: host.actorId,
    wallId: host.wallId,
    tick: host.tick,
  };
}

function stableSourceState(host: SourceHost): unknown {
  const p = host.actor.rb.translation();
  const v = host.actor.rb.linvel();
  return {
    tick: host.tick,
    x: p.x,
    y: p.y,
    vx: v.x,
    vy: v.y,
    rotation: host.actor.rb.rotation(),
    history: host.history.map((row) => ({ ...row })),
    physics: Array.from(host.world.takeSnapshot()),
  };
}

function recentHistory(host: SourceHost): F2Transition[] {
  if (host.history.length < HISTORY_WINDOW) {
    throw new Error('F2 source lacks frozen private history window');
  }
  return host.history
    .slice(-HISTORY_WINDOW)
    .map((row) => ({ ...row }));
}

function slopeResidualOnDemand(rows: F2Transition[]): number {
  const meanD = rows.reduce((sum, row) => sum + row.demand, 0) / rows.length;
  const meanR = rows.reduce((sum, row) => sum + row.residual, 0) / rows.length;
  let cov = 0;
  let variance = 0;
  for (const row of rows) {
    const dx = row.demand - meanD;
    cov += dx * (row.residual - meanR);
    variance += dx * dx;
  }
  return variance <= 1e-12 ? 0 : cov / variance;
}

function signalsFrom(rows: F2Transition[]): F2Signals {
  const last = rows[rows.length - 1];
  const slope = slopeResidualOnDemand(rows);
  const touchCount = rows.filter((row) => row.privateTouch).length;
  let ticksSinceTouch = HISTORY_WINDOW;
  for (let i = rows.length - 1; i >= 0; i -= 1) {
    if (rows[i].privateTouch) {
      ticksSinceTouch = rows.length - 1 - i;
      break;
    }
  }

  return {
    reliabilityR: Math.abs(slope / NOMINAL_BETA),
    speed: Math.abs(last.velocityAfter) / E0_VMAX,
    deltaV:
      Math.abs(last.velocityAfter - last.velocityBefore) /
      Math.max(NOMINAL_BETA, 1e-12),
    lastDemand: Math.abs(last.demand),
    touchFraction: touchCount / rows.length,
    touchRecency: 1 - Math.min(ticksSinceTouch, HISTORY_WINDOW) / HISTORY_WINDOW,
  };
}

function predictTerminal(
  velocity: number,
  drive: number,
  residualPerStep: number,
): number {
  let v = velocity;
  for (let i = 0; i < BRANCH_HORIZON; i += 1) {
    v = NOMINAL_ALPHA * v + NOMINAL_BETA * drive + residualPerStep;
  }
  return v;
}

function selectDrive(
  velocity: number,
  residualPerStep: number,
): number {
  const scored = CANDIDATES.map((drive) => ({
    drive,
    score: Math.abs(predictTerminal(velocity, drive, residualPerStep)),
  }));
  scored.sort(
    (a, b) =>
      a.score - b.score ||
      Math.abs(a.drive) - Math.abs(b.drive) ||
      a.drive - b.drive,
  );
  return scored[0].drive;
}

function restoreBranch(snapshot: SourceSnapshot): {
  world: any;
  actor: { rb: any; co: any };
  wall: { rb: any; co: any } | null;
} {
  const world = RAPIER.World.restoreSnapshot(snapshot.physics);
  if (!world) throw new Error('F2 World.restoreSnapshot failed');
  try {
    const registry = HostBindingRegistry.restore(snapshot.bindings);
    const actor = registry.resolve(world, snapshot.actorId);
    if (!actor) throw new Error('F2 actor HostBindingId failed restore');
    const wall =
      snapshot.wallId === null
        ? null
        : registry.resolve(world, snapshot.wallId);
    if (snapshot.wallId !== null && !wall) {
      throw new Error('F2 wall HostBindingId failed restore');
    }
    return { world, actor, wall };
  } catch (error) {
    world.free();
    throw error;
  }
}

function branchContactImpulse(
  world: any,
  actor: { rb: any; co: any },
  wall: { rb: any; co: any } | null,
): number {
  if (!wall) return 0;
  let impulse = 0;
  world.contactPair(actor.co, wall.co, (manifold: any) => {
    for (let i = 0; i < manifold.numSolverContacts(); i += 1) {
      impulse += Math.abs(manifold.contactImpulse(i));
    }
  });
  return impulse;
}

function runBranch(
  spec: F2EpisodeSpec,
  snapshot: SourceSnapshot,
  drive: number,
): F2BranchOutcome {
  const branch = restoreBranch(snapshot);
  try {
    let impulse = 0;
    for (let i = 1; i <= BRANCH_HORIZON; i += 1) {
      const nextTick = snapshot.tick + i;
      applyE0Demand(branch.actor.rb, drive, 0);
      branch.actor.rb.addForce(
        { x: externalFractionAt(spec, nextTick) * E0_FMAX, y: 0 },
        true,
      );
      branch.world.step();
      impulse += branchContactImpulse(
        branch.world,
        branch.actor,
        branch.wall,
      );
    }
    const finalVelocity = branch.actor.rb.linvel().x;
    const cost =
      Math.abs(finalVelocity) / E0_VMAX +
      impulse / (E0_MASS * E0_VMAX);
    return {
      drive,
      finalVelocity,
      contactImpulse: impulse,
      cost,
    };
  } finally {
    branch.world.free();
  }
}

function classify(regret: number): F2EpisodeResult['label'] {
  if (regret > REGRET_EPS) return 'M_WORSE';
  if (regret < -REGRET_EPS) return 'M_BETTER';
  return 'TIE';
}

function runEpisode(spec: F2EpisodeSpec): F2EpisodeResult {
  const host = createHost(spec);
  try {
    for (let tick = 1; tick <= DECISION_TICK; tick += 1) {
      stepSource(spec, host);
    }

    const rows = recentHistory(host);
    const signals = signalsFrom(rows);
    const latestResidual = rows[rows.length - 1].residual;
    const currentVelocity = rows[rows.length - 1].velocityAfter;

    const mDrive = selectDrive(currentVelocity, latestResidual);
    const fDrive = selectDrive(currentVelocity, 0);

    const before = JSON.stringify(stableSourceState(host));
    const snapshot = sourceSnapshot(host);
    const after = JSON.stringify(stableSourceState(host));
    const sourceSnapshotUnchanged = before === after;

    const m = runBranch(spec, snapshot, mDrive);
    const f = runBranch(spec, snapshot, fDrive);
    const regret = m.cost - f.cost;

    return {
      id: spec.id,
      family: spec.family,
      phase: spec.phase,
      sourceTick: host.tick,
      history: rows,
      signals,
      mDrive,
      fDrive,
      m,
      f,
      regret,
      label: classify(regret),
      sameAction: mDrive === fDrive,
      sourceSnapshotUnchanged,
    };
  } finally {
    host.world.free();
  }
}

function auc(
  episodes: F2EpisodeResult[],
  value: (episode: F2EpisodeResult) => number,
): number | null {
  const positives = episodes.filter((episode) => episode.label === 'M_WORSE');
  const negatives = episodes.filter((episode) => episode.label === 'M_BETTER');
  if (positives.length === 0 || negatives.length === 0) return null;

  let wins = 0;
  let pairs = 0;
  for (const positive of positives) {
    for (const negative of negatives) {
      const a = value(positive);
      const b = value(negative);
      wins += a > b ? 1 : a === b ? 0.5 : 0;
      pairs += 1;
    }
  }
  return wins / pairs;
}

function median(values: number[]): number | null {
  if (values.length === 0) return null;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 1
    ? sorted[mid]
    : (sorted[mid - 1] + sorted[mid]) / 2;
}

function specs(): F2EpisodeSpec[] {
  const result: F2EpisodeSpec[] = [];

  const familiarForces = [0.15, -0.15, 0.25, -0.25, 0.35, -0.35];
  familiarForces.forEach((force, i) => {
    result.push({
      id: 'free-' + i,
      family: 'familiar-free',
      phase: i * 2,
      externalBefore: force,
      externalAfter: force,
      transitionTick: null,
      dampingMultiplier: 1,
      wallSide: 0,
      releaseWallAtTransition: false,
    });
  });

  const forceChanges: Array<[number, number]> = [
    [-0.35, 0.25],
    [0.35, -0.25],
    [-0.15, 0.4],
    [0.15, -0.4],
    [-0.4, 0.1],
    [0.4, -0.1],
  ];
  forceChanges.forEach(([before, after], i) => {
    result.push({
      id: 'force-change-' + i,
      family: 'free-force-change',
      phase: i * 2 + 1,
      externalBefore: before,
      externalAfter: after,
      transitionTick: 32,
      dampingMultiplier: 1,
      wallSide: 0,
      releaseWallAtTransition: false,
    });
  });

  const altered = [
    [1.5, 0.2],
    [1.7, -0.2],
    [1.9, 0.3],
    [2.1, -0.3],
    [2.3, 0.15],
    [2.5, -0.15],
  ] as const;
  altered.forEach(([dampingMultiplier, force], i) => {
    result.push({
      id: 'altered-' + i,
      family: 'altered-dynamics',
      phase: i * 3,
      externalBefore: force,
      externalAfter: force,
      transitionTick: null,
      dampingMultiplier,
      wallSide: 0,
      releaseWallAtTransition: false,
    });
  });

  for (let i = 0; i < 6; i += 1) {
    const side: -1 | 1 = i % 2 === 0 ? 1 : -1;
    const strength = [0.95, 1.05, 1.15][Math.floor(i / 2)];
    result.push({
      id: 'contact-' + i,
      family: 'contact-constraint',
      phase: i * 2,
      externalBefore: side * strength,
      externalAfter: side * strength,
      transitionTick: null,
      dampingMultiplier: 1,
      wallSide: side,
      releaseWallAtTransition: false,
    });
  }

  for (let i = 0; i < 6; i += 1) {
    const side: -1 | 1 = i % 2 === 0 ? 1 : -1;
    const freeForce = [0.2, 0.3, 0.4][Math.floor(i / 2)];
    result.push({
      id: 'recovery-' + i,
      family: 'recovery',
      phase: i * 2 + 1,
      externalBefore: side * 1.05,
      externalAfter: side * freeForce,
      transitionTick: 32,
      dampingMultiplier: 1,
      wallSide: side,
      releaseWallAtTransition: true,
    });
  }

  return result;
}

function stableCampaign(result: F2CampaignResult): unknown {
  return {
    ...result,
    episodes: result.episodes.map((episode) => ({
      ...episode,
      history: episode.history.map((row) => ({ ...row })),
    })),
  };
}

function runOnce(): Omit<F2CampaignResult, 'deterministic'> {
  const episodes = specs().map(runEpisode);
  const informative = episodes.filter(
    (episode) => !episode.sameAction && episode.label !== 'TIE',
  );

  const aucs: F2Aucs = {
    reliabilityR: auc(informative, (e) => e.signals.reliabilityR),
    speed: auc(informative, (e) => e.signals.speed),
    deltaV: auc(informative, (e) => e.signals.deltaV),
    lastDemand: auc(informative, (e) => e.signals.lastDemand),
    touchFraction: auc(informative, (e) => e.signals.touchFraction),
    touchRecency: auc(informative, (e) => e.signals.touchRecency),
  };

  const mWorseCount = informative.filter((e) => e.label === 'M_WORSE').length;
  const mBetterCount = informative.filter((e) => e.label === 'M_BETTER').length;
  const tieCount = episodes.filter((e) => e.label === 'TIE').length;
  const sameActionCount = episodes.filter((e) => e.sameAction).length;

  const alteredNoTouchMWorse = informative.filter(
    (e) =>
      e.family === 'altered-dynamics' &&
      e.label === 'M_WORSE' &&
      e.signals.touchFraction === 0,
  );

  const freeMBetter = informative.filter(
    (e) =>
      (e.family === 'familiar-free' ||
        e.family === 'free-force-change') &&
      e.label === 'M_BETTER',
  );

  const medians = {
    alteredNoTouchMWorseR: median(
      alteredNoTouchMWorse.map((e) => e.signals.reliabilityR),
    ),
    freeMBetterR: median(
      freeMBetter.map((e) => e.signals.reliabilityR),
    ),
    contactR: median(
      episodes
        .filter((e) => e.family === 'contact-constraint')
        .map((e) => e.signals.reliabilityR),
    ),
    recoveryR: median(
      episodes
        .filter((e) => e.family === 'recovery')
        .map((e) => e.signals.reliabilityR),
    ),
  };

  const meanCosts = {
    alwaysM:
      episodes.reduce((sum, e) => sum + e.m.cost, 0) / episodes.length,
    alwaysF:
      episodes.reduce((sum, e) => sum + e.f.cost, 0) / episodes.length,
  };

  const reasons: string[] = [];

  if (episodes.some((e) => !e.sourceSnapshotUnchanged)) {
    reasons.push('physics snapshot mutated source state');
  }

  if (informative.length < 12) {
    reasons.push('fewer than 12 informative M/F-different episodes');
  }
  if (mWorseCount < 4) reasons.push('fewer than 4 M-worse informative episodes');
  if (mBetterCount < 4) reasons.push('fewer than 4 M-better informative episodes');

  if (aucs.reliabilityR === null || aucs.reliabilityR < 0.75) {
    reasons.push('R AUC below 0.75 or undefined');
  }

  const nonTouchAucs = [aucs.speed, aucs.deltaV, aucs.lastDemand].filter(
    (value): value is number => value !== null,
  );
  const bestNonTouch = nonTouchAucs.length > 0 ? Math.max(...nonTouchAucs) : null;
  if (
    aucs.reliabilityR === null ||
    bestNonTouch === null ||
    aucs.reliabilityR < bestNonTouch + 0.05
  ) {
    reasons.push('R does not beat best simple non-touch scalar baseline by 0.05');
  }

  if (alteredNoTouchMWorse.length < 2) {
    reasons.push('fewer than 2 altered-dynamics touch-free M-worse episodes');
  }

  if (
    medians.alteredNoTouchMWorseR === null ||
    medians.freeMBetterR === null ||
    medians.alteredNoTouchMWorseR <= medians.freeMBetterR
  ) {
    reasons.push('altered-dynamics M-worse R is not above free M-better R');
  }

  if (
    medians.recoveryR === null ||
    medians.contactR === null ||
    medians.recoveryR >= medians.contactR
  ) {
    reasons.push('recovery R does not fall below contact-family R');
  }

  let outcome: F2CampaignResult['outcome'] = reasons.length === 0 ? 'PASS' : 'FAIL';
  if (
    informative.length < 4 ||
    mWorseCount === 0 ||
    mBetterCount === 0
  ) {
    outcome = 'INCONCLUSIVE';
  }

  return {
    outcome,
    episodes,
    informativeCount: informative.length,
    mWorseCount,
    mBetterCount,
    tieCount,
    sameActionCount,
    aucs,
    alteredNoTouchMWorseCount: alteredNoTouchMWorse.length,
    medians,
    meanCosts,
    reasons,
  };
}

export function runF2P0Campaign(): F2CampaignResult {
  const first = runOnce();
  const second = runOnce();
  const deterministic =
    JSON.stringify(first) === JSON.stringify(second);

  const result: F2CampaignResult = {
    ...first,
    deterministic,
  };

  if (!deterministic) {
    result.outcome = 'INCONCLUSIVE';
    result.reasons = [...result.reasons, 'full campaign replay is nondeterministic'];
  }

  return result;
}

export const F2_P0_CONSTANTS = Object.freeze({
  decisionTick: DECISION_TICK,
  historyWindow: HISTORY_WINDOW,
  branchHorizon: BRANCH_HORIZON,
  candidates: [...CANDIDATES],
  nominalAlpha: NOMINAL_ALPHA,
  nominalBeta: NOMINAL_BETA,
  demandPattern: [...DEMAND_PATTERN],
});
