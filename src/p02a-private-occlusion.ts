import * as RapierModule from '@dimforge/rapier2d-deterministic-compat';
import {
  E0_DT,
  E0_RADIUS,
  createE0Body,
  wrapE0Pi,
  type E0Body,
} from './e0-body-seam';

const RAPIER: any = (RapierModule as any).default ?? RapierModule;

export const P02A_MAX_RANGE = 8.0;
export const P02A_HIDDEN_STEPS = 90;
export const P02A_HIDDEN_IMPULSE = 1.2;
export const P02A_MIN_DISPLACEMENT = E0_RADIUS * 0.1;

const OCCLUDER_X = 0;
const OCCLUDER_Y = 0;
const OCCLUDER_HALF_X = 0.16;
const OCCLUDER_HALF_Y = 1.5;

const ACTOR_START = { x: -3.0, y: 0.0 };
const VISIBLE_TARGET_START = { x: -1.2, y: 0.4 };
const HIDDEN_TARGET_START = { x: 1.5, y: -0.4 };
const TARGET_RADIUS = 0.35;
const TARGET_MASS = 1.0;
const TARGET_DAMPING = 2.0;

type Body = {
  rb: any;
  co: any;
};

type SensorCandidate = Body & {
  radius: number;
};

export type P02aBlob = {
  bearing: number;
  range: number;
  radialMotion: number;
  apparentRadius: number;
};

export type P02aPrivateFrame = {
  blobs: P02aBlob[];
};

export type P02aVisibleControl = {
  frame: P02aPrivateFrame;
  targetWorldPosition: { x: number; y: number };
};

export type P02aHiddenRun = {
  privateBefore: P02aPrivateFrame;
  privateAfter: P02aPrivateFrame;
  targetStartWorldPosition: { x: number; y: number };
  targetEndWorldPosition: { x: number; y: number };
  displacement: number;
  hiddenLeakTicks: number[];
  withinRangeAllTicks: boolean;
};

export type P02aCampaignResult = {
  outcome: 'PASS' | 'FAIL' | 'INCONCLUSIVE';
  visibleDeterministic: boolean;
  hiddenDeterministic: boolean;
  visibleHasBlob: boolean;
  privateSchemaClean: boolean;
  hiddenPrivateUnchanged: boolean;
  hiddenMaterialDisplacement: boolean;
  hiddenOccludedAllTicks: boolean;
  hiddenWithinRangeAllTicks: boolean;
  visible: P02aVisibleControl;
  hidden: P02aHiddenRun;
  reasons: string[];
};

type P02aWorld = {
  world: any;
  actor: E0Body;
  target: SensorCandidate;
  occluder: Body;
};

function createFixedOccluder(world: any): Body {
  const rb = world.createRigidBody(
    RAPIER.RigidBodyDesc.fixed().setTranslation(OCCLUDER_X, OCCLUDER_Y),
  );
  const co = world.createCollider(
    RAPIER.ColliderDesc.cuboid(OCCLUDER_HALF_X, OCCLUDER_HALF_Y)
      .setFriction(0)
      .setRestitution(0),
    rb,
  );
  return { rb, co };
}

function createTarget(
  world: any,
  position: { x: number; y: number },
): SensorCandidate {
  const rb = world.createRigidBody(
    RAPIER.RigidBodyDesc.dynamic()
      .setTranslation(position.x, position.y)
      .setLinearDamping(TARGET_DAMPING)
      .setAngularDamping(4),
  );
  const co = world.createCollider(
    RAPIER.ColliderDesc.ball(TARGET_RADIUS)
      .setMass(TARGET_MASS)
      .setFriction(0)
      .setRestitution(0),
    rb,
  );
  return { rb, co, radius: TARGET_RADIUS };
}

function createWorld(targetPosition: { x: number; y: number }): P02aWorld {
  const world = new RAPIER.World({ x: 0, y: 0 });
  world.timestep = E0_DT;

  const actor = createE0Body(world, ACTOR_START.x, ACTOR_START.y);
  const occluder = createFixedOccluder(world);
  const target = createTarget(world, targetPosition);

  // Rapier scene queries read the broad-phase state from the last simulation
  // step. A neutral first step makes freshly inserted colliders query-visible.
  // In this zero-gravity setup there are no applied forces or initial overlaps,
  // so this does not alter the declared arrangement.
  world.step();

  return { world, actor, target, occluder };
}

function destroyWorld(state: P02aWorld): void {
  state.world.free();
}

function bodyPosition(body: Body): { x: number; y: number } {
  const p = body.rb.translation();
  return { x: p.x, y: p.y };
}

function distance(a: { x: number; y: number }, b: { x: number; y: number }): number {
  return Math.hypot(b.x - a.x, b.y - a.y);
}

function senseCandidate(
  world: any,
  actor: E0Body,
  candidate: SensorCandidate,
): P02aBlob | null {
  const ap = actor.rb.translation();
  const cp = candidate.rb.translation();

  const dx = cp.x - ap.x;
  const dy = cp.y - ap.y;
  const range = Math.hypot(dx, dy);

  if (range <= 1e-9 || range > P02A_MAX_RANGE) {
    return null;
  }

  const ux = dx / range;
  const uy = dy / range;

  const ray = new RAPIER.Ray(
    { x: ap.x, y: ap.y },
    { x: ux, y: uy },
  );

  const hit = world.castRay(
    ray,
    range,
    true,
    undefined,
    undefined,
    actor.co,
  );

  if (!hit || hit.collider.handle !== candidate.co.handle) {
    return null;
  }

  const av = actor.rb.linvel();
  const cv = candidate.rb.linvel();

  const relativeVx = cv.x - av.x;
  const relativeVy = cv.y - av.y;

  return {
    bearing: wrapE0Pi(Math.atan2(dy, dx) - actor.rb.rotation()),
    range,
    radialMotion: relativeVx * ux + relativeVy * uy,
    apparentRadius: candidate.radius / range,
  };
}

export function senseP02aFrame(
  world: any,
  actor: E0Body,
  candidates: SensorCandidate[],
): P02aPrivateFrame {
  const blobs = candidates
    .map((candidate) => senseCandidate(world, actor, candidate))
    .filter((blob): blob is P02aBlob => blob !== null)
    .sort((a, b) =>
      a.bearing !== b.bearing
        ? a.bearing - b.bearing
        : a.range - b.range,
    );

  return { blobs };
}

function schemaIsPrivate(frame: P02aPrivateFrame): boolean {
  if (JSON.stringify(Object.keys(frame).sort()) !== JSON.stringify(['blobs'])) {
    return false;
  }

  const expectedBlobKeys = [
    'apparentRadius',
    'bearing',
    'radialMotion',
    'range',
  ].sort();

  return frame.blobs.every(
    (blob) =>
      JSON.stringify(Object.keys(blob).sort()) ===
      JSON.stringify(expectedBlobKeys),
  );
}

function runVisibleControlOnce(): P02aVisibleControl {
  const state = createWorld(VISIBLE_TARGET_START);
  const frame = senseP02aFrame(state.world, state.actor, [state.target]);
  const targetWorldPosition = bodyPosition(state.target);

  const result = { frame, targetWorldPosition };
  destroyWorld(state);
  return result;
}

function runHiddenOnce(): P02aHiddenRun {
  const state = createWorld(HIDDEN_TARGET_START);

  const privateBefore = senseP02aFrame(
    state.world,
    state.actor,
    [state.target],
  );

  const targetStartWorldPosition = bodyPosition(state.target);
  const hiddenLeakTicks: number[] = [];
  let withinRangeAllTicks = true;

  state.target.rb.applyImpulse({ x: P02A_HIDDEN_IMPULSE, y: 0 }, true);

  for (let tick = 1; tick <= P02A_HIDDEN_STEPS; tick += 1) {
    state.world.step();

    const ap = bodyPosition(state.actor);
    const tp = bodyPosition(state.target);

    if (distance(ap, tp) > P02A_MAX_RANGE) {
      withinRangeAllTicks = false;
    }

    const frame = senseP02aFrame(
      state.world,
      state.actor,
      [state.target],
    );

    if (frame.blobs.length > 0) {
      hiddenLeakTicks.push(tick);
    }
  }

  const privateAfter = senseP02aFrame(
    state.world,
    state.actor,
    [state.target],
  );

  const targetEndWorldPosition = bodyPosition(state.target);
  const displacement = distance(
    targetStartWorldPosition,
    targetEndWorldPosition,
  );

  const result: P02aHiddenRun = {
    privateBefore,
    privateAfter,
    targetStartWorldPosition,
    targetEndWorldPosition,
    displacement,
    hiddenLeakTicks,
    withinRangeAllTicks,
  };

  destroyWorld(state);
  return result;
}

function stableVisible(result: P02aVisibleControl): unknown {
  return result;
}

function stableHidden(result: P02aHiddenRun): unknown {
  return result;
}

export function runP02aCampaign(): P02aCampaignResult {
  const visible = runVisibleControlOnce();
  const visibleRepeat = runVisibleControlOnce();
  const hidden = runHiddenOnce();
  const hiddenRepeat = runHiddenOnce();

  const visibleDeterministic =
    JSON.stringify(stableVisible(visible)) ===
    JSON.stringify(stableVisible(visibleRepeat));

  const hiddenDeterministic =
    JSON.stringify(stableHidden(hidden)) ===
    JSON.stringify(stableHidden(hiddenRepeat));

  const visibleHasBlob = visible.frame.blobs.length === 1;

  const privateSchemaClean =
    schemaIsPrivate(visible.frame) &&
    schemaIsPrivate(hidden.privateBefore) &&
    schemaIsPrivate(hidden.privateAfter);

  const hiddenPrivateUnchanged =
    JSON.stringify(hidden.privateBefore) ===
    JSON.stringify(hidden.privateAfter);

  const hiddenMaterialDisplacement =
    hidden.displacement >= P02A_MIN_DISPLACEMENT;

  const hiddenOccludedAllTicks =
    hidden.hiddenLeakTicks.length === 0 &&
    hidden.privateBefore.blobs.length === 0 &&
    hidden.privateAfter.blobs.length === 0;

  const hiddenWithinRangeAllTicks = hidden.withinRangeAllTicks;

  const reasons: string[] = [];

  const protocolInvalid =
    !visibleDeterministic ||
    !hiddenDeterministic ||
    !privateSchemaClean ||
    !hiddenWithinRangeAllTicks ||
    !hiddenMaterialDisplacement;

  let outcome: P02aCampaignResult['outcome'];

  if (protocolInvalid) {
    outcome = 'INCONCLUSIVE';

    if (!visibleDeterministic) reasons.push('visible control is not deterministic');
    if (!hiddenDeterministic) reasons.push('hidden run is not deterministic');
    if (!privateSchemaClean) reasons.push('P0 private schema is contaminated');
    if (!hiddenWithinRangeAllTicks) reasons.push('hidden target left declared sensor range');
    if (!hiddenMaterialDisplacement) reasons.push('hidden target did not undergo sufficient material displacement');
  } else {
    if (!visibleHasBlob) reasons.push('visible control did not emit exactly one blob');
    if (!hiddenOccludedAllTicks) reasons.push('hidden target leaked into P0 during hidden motion');
    if (!hiddenPrivateUnchanged) reasons.push('private P0 evidence changed during hidden displacement');

    outcome = reasons.length === 0 ? 'PASS' : 'FAIL';
  }

  return {
    outcome,
    visibleDeterministic,
    hiddenDeterministic,
    visibleHasBlob,
    privateSchemaClean,
    hiddenPrivateUnchanged,
    hiddenMaterialDisplacement,
    hiddenOccludedAllTicks,
    hiddenWithinRangeAllTicks,
    visible,
    hidden,
    reasons,
  };
}
