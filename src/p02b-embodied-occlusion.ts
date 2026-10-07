import {
  E0_RADIUS,
  E0_RAPIER as RAPIER,
  applyE0Demand,
  createE0Body,
  createE0Wall,
  createE0World,
  e0PairImpulse,
  type E0Body,
} from './e0-body-seam';
import {
  P02A_HIDDEN_IMPULSE,
  P02A_HIDDEN_STEPS,
  P02A_MAX_RANGE,
  P02A_MIN_DISPLACEMENT,
  senseP02aFrame,
  type P02aPrivateFrame,
} from './p02a-private-occlusion';

export const P02B_DRIVE_TICKS = 72;
export const P02B_SETTLE_TICKS = 120;

const ACTOR_START = { x: -3.0, y: 2.0 };
const ACTOR_HEADING = -Math.PI / 2;

const TARGET_START = { x: 1.5, y: 2.0 };
const TARGET_RADIUS = 0.35;
const TARGET_DAMPING = 2.0;

const OCCLUDER = {
  x: 0,
  y: 0,
  hx: 0.16,
  hy: 1.5,
};

const TARGET_PREMOVE_EPS = 1e-6;
const HEADING_EPS = 1e-6;

type Candidate = {
  rb: any;
  co: any;
  radius: number;
};

type TraceRow = {
  phase: 'initial' | 'drive' | 'settle' | 'hidden';
  tick: number;
  drive: number;
  turn: number;
  blobCount: number;
  actorWorld: { x: number; y: number; rotation: number };
  targetWorld: { x: number; y: number };
  targetRange: number;
  actorOccluderContacts: number;
  actorTargetContacts: number;
};

export type P02bRun = {
  outcome: 'PASS' | 'FAIL' | 'INCONCLUSIVE';
  initialFrame: P02aPrivateFrame;
  initialHeadingApplied: boolean;
  firstOccludedTick: number | null;
  targetDisplacementAtOcclusion: number | null;
  targetRangeAtOcclusion: number | null;
  actorYAtOcclusion: number | null;
  actorSelfDisplacement: number;
  reappearanceTicks: number[];
  preHiddenTargetDisplacement: number;
  hiddenTargetDisplacement: number;
  hiddenLeakTicks: number[];
  hiddenWithinRangeAllTicks: boolean;
  actorContactContamination: boolean;
  trace: TraceRow[];
  reasons: string[];
};

export type P02bCampaign = {
  outcome: 'PASS' | 'FAIL' | 'INCONCLUSIVE';
  deterministic: boolean;
  run: P02bRun;
  repeat: P02bRun;
};

function pos(rb: any): { x: number; y: number } {
  const p = rb.translation();
  return { x: p.x, y: p.y };
}

function dist(a: { x: number; y: number }, b: { x: number; y: number }): number {
  return Math.hypot(b.x - a.x, b.y - a.y);
}

function createTarget(world: any): Candidate {
  const rb = world.createRigidBody(
    RAPIER.RigidBodyDesc.dynamic()
      .setTranslation(TARGET_START.x, TARGET_START.y)
      .setLinearDamping(TARGET_DAMPING)
      .setAngularDamping(4),
  );
  const co = world.createCollider(
    RAPIER.ColliderDesc.ball(TARGET_RADIUS)
      .setMass(1)
      .setFriction(0)
      .setRestitution(0),
    rb,
  );
  return { rb, co, radius: TARGET_RADIUS };
}

function row(
  phase: TraceRow['phase'],
  tick: number,
  drive: number,
  turn: number,
  world: any,
  actor: E0Body,
  target: Candidate,
  occluder: { co: any },
): TraceRow {
  const actorWorld = {
    ...pos(actor.rb),
    rotation: actor.rb.rotation(),
  };
  const targetWorld = pos(target.rb);
  const frame = senseP02aFrame(world, actor, [target]);

  return {
    phase,
    tick,
    drive,
    turn,
    blobCount: frame.blobs.length,
    actorWorld,
    targetWorld,
    targetRange: dist(actorWorld, targetWorld),
    actorOccluderContacts: e0PairImpulse(
      world,
      actor.co.handle,
      occluder.co.handle,
    ).solverContacts,
    actorTargetContacts: e0PairImpulse(
      world,
      actor.co.handle,
      target.co.handle,
    ).solverContacts,
  };
}

function runOnce(): P02bRun {
  const world = createE0World();
  const actor = createE0Body(world, ACTOR_START.x, ACTOR_START.y);
  actor.rb.setRotation(ACTOR_HEADING, true);

  const occluder = createE0Wall(
    world,
    OCCLUDER.x,
    OCCLUDER.y,
    OCCLUDER.hx,
    OCCLUDER.hy,
  );
  const target = createTarget(world);

  // Neutral readiness step: identical reason/discipline as qualified P02a.
  world.step();

  const trace: TraceRow[] = [];
  const initialFrame = senseP02aFrame(world, actor, [target]);
  const initialHeadingApplied =
    Math.abs(actor.rb.rotation() - ACTOR_HEADING) <= HEADING_EPS;

  trace.push(row('initial', 0, 0, 0, world, actor, target, occluder));

  const actorStart = pos(actor.rb);
  const targetStart = pos(target.rb);

  let firstOccludedTick: number | null = null;
  let targetDisplacementAtOcclusion: number | null = null;
  let targetRangeAtOcclusion: number | null = null;
  let actorYAtOcclusion: number | null = null;
  const reappearanceTicks: number[] = [];
  let actorContactContamination = false;
  let previouslyVisible = initialFrame.blobs.length === 1;

  for (let tick = 1; tick <= P02B_DRIVE_TICKS; tick += 1) {
    applyE0Demand(actor.rb, 1, 0);
    world.step();

    const r = row('drive', tick, 1, 0, world, actor, target, occluder);
    trace.push(r);

    if (r.actorOccluderContacts > 0 || r.actorTargetContacts > 0) {
      actorContactContamination = true;
    }

    const visible = r.blobCount === 1;

    if (firstOccludedTick === null && previouslyVisible && !visible) {
      firstOccludedTick = tick;
      targetDisplacementAtOcclusion = dist(targetStart, r.targetWorld);
      targetRangeAtOcclusion = r.targetRange;
      actorYAtOcclusion = r.actorWorld.y;
    } else if (firstOccludedTick !== null && visible) {
      reappearanceTicks.push(tick);
    }

    previouslyVisible = visible;
  }

  for (let tick = 1; tick <= P02B_SETTLE_TICKS; tick += 1) {
    applyE0Demand(actor.rb, 0, 0);
    world.step();

    const absoluteTick = P02B_DRIVE_TICKS + tick;
    const r = row('settle', absoluteTick, 0, 0, world, actor, target, occluder);
    trace.push(r);

    if (r.actorOccluderContacts > 0 || r.actorTargetContacts > 0) {
      actorContactContamination = true;
    }

    if (firstOccludedTick !== null && r.blobCount > 0) {
      reappearanceTicks.push(absoluteTick);
    }
  }

  const preHiddenTarget = pos(target.rb);
  const preHiddenTargetDisplacement = dist(targetStart, preHiddenTarget);

  target.rb.applyImpulse({ x: P02A_HIDDEN_IMPULSE, y: 0 }, true);

  const hiddenLeakTicks: number[] = [];
  let hiddenWithinRangeAllTicks = true;

  for (let tick = 1; tick <= P02A_HIDDEN_STEPS; tick += 1) {
    applyE0Demand(actor.rb, 0, 0);
    world.step();

    const absoluteTick = P02B_DRIVE_TICKS + P02B_SETTLE_TICKS + tick;
    const r = row('hidden', absoluteTick, 0, 0, world, actor, target, occluder);
    trace.push(r);

    if (r.actorOccluderContacts > 0 || r.actorTargetContacts > 0) {
      actorContactContamination = true;
    }

    if (r.targetRange > P02A_MAX_RANGE) {
      hiddenWithinRangeAllTicks = false;
    }

    if (r.blobCount > 0) {
      hiddenLeakTicks.push(tick);
    }
  }

  const hiddenTargetDisplacement = dist(
    preHiddenTarget,
    pos(target.rb),
  );
  const actorSelfDisplacement = dist(actorStart, pos(actor.rb));

  const reasons: string[] = [];

  const protocolInvalid =
    !initialHeadingApplied ||
    actorContactContamination ||
    preHiddenTargetDisplacement > TARGET_PREMOVE_EPS ||
    (targetRangeAtOcclusion !== null && targetRangeAtOcclusion > P02A_MAX_RANGE) ||
    !hiddenWithinRangeAllTicks ||
    hiddenTargetDisplacement < P02A_MIN_DISPLACEMENT;

  let outcome: P02bRun['outcome'];

  if (protocolInvalid) {
    outcome = 'INCONCLUSIVE';
    if (!initialHeadingApplied) reasons.push('initial actor heading was not applied');
    if (actorContactContamination) reasons.push('actor contacted target or occluder');
    if (preHiddenTargetDisplacement > TARGET_PREMOVE_EPS) {
      reasons.push('target moved before hidden-displacement phase');
    }
    if (targetRangeAtOcclusion !== null && targetRangeAtOcclusion > P02A_MAX_RANGE) {
      reasons.push('target was outside P02a range at occlusion transition');
    }
    if (!hiddenWithinRangeAllTicks) reasons.push('target left P02a range during hidden displacement');
    if (hiddenTargetDisplacement < P02A_MIN_DISPLACEMENT) {
      reasons.push('hidden target did not undergo sufficient material displacement');
    }
  } else {
    if (initialFrame.blobs.length !== 1) {
      reasons.push('initial target was not visible through unchanged P02a sensor');
    }
    if (firstOccludedTick === null) {
      reasons.push('actor self-motion did not produce visible-to-occluded transition');
    }
    if (
      targetDisplacementAtOcclusion !== null &&
      targetDisplacementAtOcclusion > TARGET_PREMOVE_EPS
    ) {
      reasons.push('target moved before the occlusion transition');
    }
    if (reappearanceTicks.length > 0) {
      reasons.push('target reappeared after first occlusion before/during hidden phase');
    }
    if (hiddenLeakTicks.length > 0) {
      reasons.push('hidden target displacement leaked into P0');
    }
    if (actorSelfDisplacement <= E0_RADIUS) {
      reasons.push('actor did not undergo material self-motion');
    }

    outcome = reasons.length === 0 ? 'PASS' : 'FAIL';
  }

  const result: P02bRun = {
    outcome,
    initialFrame,
    initialHeadingApplied,
    firstOccludedTick,
    targetDisplacementAtOcclusion,
    targetRangeAtOcclusion,
    actorYAtOcclusion,
    actorSelfDisplacement,
    reappearanceTicks,
    preHiddenTargetDisplacement,
    hiddenTargetDisplacement,
    hiddenLeakTicks,
    hiddenWithinRangeAllTicks,
    actorContactContamination,
    trace,
    reasons,
  };

  world.free();
  return result;
}

function stable(run: P02bRun): unknown {
  return run;
}

export function runP02bCampaign(): P02bCampaign {
  const run = runOnce();
  const repeat = runOnce();
  const deterministic = JSON.stringify(stable(run)) === JSON.stringify(stable(repeat));

  if (!deterministic) {
    return {
      outcome: 'INCONCLUSIVE',
      deterministic,
      run: {
        ...run,
        outcome: 'INCONCLUSIVE',
        reasons: [...run.reasons, 'repeat was not deterministic'],
      },
      repeat,
    };
  }

  return {
    outcome: run.outcome,
    deterministic,
    run,
    repeat,
  };
}
