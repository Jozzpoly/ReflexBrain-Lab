import * as RapierModule from '@dimforge/rapier2d-deterministic-compat';
import {
  E01_DT,
  createE01Scenario,
  destroyE01Scenario,
  initE01Rapier,
  snapshotE01Scenario,
  stepE01Scenario,
  type E01State,
} from './e01-mechanical';

const RAPIER: any = (RapierModule as any).default ?? RapierModule;

export const E02A_MAX_TICKS = 720;
export const E02A_CLEARANCE_RADIUS = 0.35;

const DOOR_X = 0;
const DOOR_HALF_THICKNESS_X = 0.12;
const GAP_HALF_HEIGHT = 0.75;
const CORRIDOR_INNER_HALF_HEIGHT = 1.08;

const BLOCKER_RADIUS = 0.50;
const BLOCKER_MASS = 1.0;
const BLOCKER_DAMPING = 3.0;
const BLOCKER_START = { x: 0, y: 0 };

const PERSISTENCE_TICKS = 60;

type Body = { rb: any; co: any };

export type E02aState = {
  base: E01State;
  blocker: Body;
  doorwayWalls: Body[];
  processEnabled: boolean;
  initialOpen: boolean;
  firstOpenTick: number | null;
  firstBlockerContactTick: number | null;
  blockerContactTicks: number;
  hadBlockerContact: boolean;
  postContactNoContactTicks: number;
  persistenceOpen: boolean | null;
  blockerAtFirstOpen: { x: number; y: number } | null;
  blockerAtPersistence: { x: number; y: number } | null;
};

export type E02aScenarioResult = {
  processEnabled: boolean;
  ticks: number;
  initialOpen: boolean;
  firstOpenTick: number | null;
  firstBlockerContactTick: number | null;
  blockerContactTicks: number;
  postContactNoContactTicks: number;
  persistenceOpen: boolean | null;
  blockerStart: { x: number; y: number };
  blockerAtFirstOpen: { x: number; y: number } | null;
  blockerAtPersistence: { x: number; y: number } | null;
  blockerFinal: { x: number; y: number };
  finalOpen: boolean;
  shuttleFinal: { x: number; y: number; direction: -1 | 1 };
};

export type E02aCampaignResult = {
  pass: boolean;
  deterministic: boolean;
  control: E02aScenarioResult;
  interaction: E02aScenarioResult;
  blockerDisplacementAtPersistence: number | null;
  reasons: string[];
};

export async function initE02aRapier(): Promise<void> {
  await initE01Rapier();
}

function createFixedWall(world: any, x: number, y: number, hx: number, hy: number): Body {
  const rb = world.createRigidBody(RAPIER.RigidBodyDesc.fixed().setTranslation(x, y));
  const co = world.createCollider(
    RAPIER.ColliderDesc.cuboid(hx, hy).setFriction(0.12).setRestitution(0),
    rb,
  );
  return { rb, co };
}

function createBlocker(world: any): Body {
  const rb = world.createRigidBody(
    RAPIER.RigidBodyDesc.dynamic()
      .setTranslation(BLOCKER_START.x, BLOCKER_START.y)
      .setLinearDamping(BLOCKER_DAMPING)
      .setAngularDamping(4),
  );
  const co = world.createCollider(
    RAPIER.ColliderDesc.ball(BLOCKER_RADIUS)
      .setMass(BLOCKER_MASS)
      .setFriction(0.12)
      .setRestitution(0.02),
    rb,
  );
  return { rb, co };
}

function hasContact(world: any, a: any, b: any): boolean {
  let found = false;
  world.contactPair(a, b, () => {
    found = true;
  });
  return found;
}

function currentCircleObstacles(state: E02aState): Array<{ x: number; y: number; radius: number }> {
  const sp = state.base.shuttle.rb.translation();
  const bp = state.blocker.rb.translation();
  return [
    { x: sp.x, y: sp.y, radius: 0.55 },
    { x: bp.x, y: bp.y, radius: BLOCKER_RADIUS },
  ];
}

/**
 * Researcher-only local clearance audit.
 *
 * The doorway's static gap permits a test-disc center in:
 * [-GAP_HALF_HEIGHT + clearance, GAP_HALF_HEIGHT - clearance].
 *
 * Dynamic circles only matter if their expanded radius intersects the
 * doorway plane. Their forbidden y-intervals are merged. The passage is
 * blocked iff the union covers the entire permitted center interval.
 *
 * This function never influences physics and is not actor-facing state.
 */
export function isE02aPassageOpen(
  state: E02aState,
  clearanceRadius = E02A_CLEARANCE_RADIUS,
): boolean {
  const allowedMin = -GAP_HALF_HEIGHT + clearanceRadius;
  const allowedMax = GAP_HALF_HEIGHT - clearanceRadius;
  if (allowedMin >= allowedMax) return false;

  const intervals: Array<[number, number]> = [];

  for (const body of currentCircleObstacles(state)) {
    const expanded = body.radius + clearanceRadius;
    const intersectsDoorPlane =
      Math.abs(body.x - DOOR_X) <= expanded + DOOR_HALF_THICKNESS_X;

    if (!intersectsDoorPlane) continue;

    const lo = Math.max(allowedMin, body.y - expanded);
    const hi = Math.min(allowedMax, body.y + expanded);
    if (lo < hi) intervals.push([lo, hi]);
  }

  if (intervals.length === 0) return true;

  intervals.sort((a, b) => a[0] - b[0]);
  let coveredTo = allowedMin;

  for (const [lo, hi] of intervals) {
    if (lo > coveredTo + 1e-9) return true;
    coveredTo = Math.max(coveredTo, hi);
    if (coveredTo >= allowedMax - 1e-9) return false;
  }

  return coveredTo < allowedMax - 1e-9;
}

export function createE02aScenario(processEnabled: boolean): E02aState {
  // This imports the qualified E01 process directly. No E01 drive/reversal
  // parameter is copied or modified here.
  const base = createE01Scenario(false);
  const world = base.world;

  const segmentHalfHeight = (CORRIDOR_INNER_HALF_HEIGHT - GAP_HALF_HEIGHT) / 2;
  const segmentCenterY = GAP_HALF_HEIGHT + segmentHalfHeight;

  const doorwayWalls = [
    createFixedWall(world, DOOR_X, segmentCenterY, DOOR_HALF_THICKNESS_X, segmentHalfHeight),
    createFixedWall(world, DOOR_X, -segmentCenterY, DOOR_HALF_THICKNESS_X, segmentHalfHeight),
  ];

  const blocker = createBlocker(world);

  const state: E02aState = {
    base,
    blocker,
    doorwayWalls,
    processEnabled,
    initialOpen: false,
    firstOpenTick: null,
    firstBlockerContactTick: null,
    blockerContactTicks: 0,
    hadBlockerContact: false,
    postContactNoContactTicks: 0,
    persistenceOpen: null,
    blockerAtFirstOpen: null,
    blockerAtPersistence: null,
  };

  state.initialOpen = isE02aPassageOpen(state);
  return state;
}

export function stepE02aScenario(state: E02aState): void {
  if (state.processEnabled) {
    stepE01Scenario(state.base);
  } else {
    state.base.shuttle.rb.resetForces(true);
    state.base.shuttle.rb.resetTorques(true);
    state.base.world.step();
    state.base.tick += 1;
  }

  const blockerContact = hasContact(
    state.base.world,
    state.base.shuttle.co,
    state.blocker.co,
  );

  if (blockerContact) {
    state.hadBlockerContact = true;
    state.blockerContactTicks += 1;
    state.postContactNoContactTicks = 0;
    if (state.firstBlockerContactTick === null) {
      state.firstBlockerContactTick = state.base.tick;
    }
  } else if (state.hadBlockerContact) {
    state.postContactNoContactTicks += 1;
  }

  const open = isE02aPassageOpen(state);

  if (!state.initialOpen && open && state.firstOpenTick === null) {
    state.firstOpenTick = state.base.tick;
    const p = state.blocker.rb.translation();
    state.blockerAtFirstOpen = { x: p.x, y: p.y };
  }

  if (
    state.firstOpenTick !== null &&
    state.hadBlockerContact &&
    state.postContactNoContactTicks >= PERSISTENCE_TICKS &&
    state.persistenceOpen === null
  ) {
    state.persistenceOpen = open;
    const p = state.blocker.rb.translation();
    state.blockerAtPersistence = { x: p.x, y: p.y };
  }
}

export function snapshotE02aScenario(state: E02aState) {
  const base = snapshotE01Scenario(state.base);
  const bp = state.blocker.rb.translation();
  const bv = state.blocker.rb.linvel();

  return {
    tick: state.base.tick,
    processEnabled: state.processEnabled,
    passageOpen: isE02aPassageOpen(state),
    clearanceRadius: E02A_CLEARANCE_RADIUS,
    blocker: {
      x: bp.x,
      y: bp.y,
      vx: bv.x,
      vy: bv.y,
      speed: Math.hypot(bv.x, bv.y),
    },
    shuttle: base.shuttle,
    direction: base.direction,
    firstOpenTick: state.firstOpenTick,
    firstBlockerContactTick: state.firstBlockerContactTick,
    blockerContactTicks: state.blockerContactTicks,
    postContactNoContactTicks: state.postContactNoContactTicks,
    persistenceOpen: state.persistenceOpen,
  };
}

export function destroyE02aScenario(state: E02aState): void {
  destroyE01Scenario(state.base);
}

export function runE02aScenario(
  processEnabled: boolean,
  maxTicks = E02A_MAX_TICKS,
): E02aScenarioResult {
  const state = createE02aScenario(processEnabled);

  for (let i = 0; i < maxTicks; i += 1) {
    stepE02aScenario(state);

    if (
      processEnabled &&
      state.firstOpenTick !== null &&
      state.persistenceOpen !== null
    ) {
      break;
    }
  }

  const bp = state.blocker.rb.translation();
  const sp = state.base.shuttle.rb.translation();

  const result: E02aScenarioResult = {
    processEnabled,
    ticks: state.base.tick,
    initialOpen: state.initialOpen,
    firstOpenTick: state.firstOpenTick,
    firstBlockerContactTick: state.firstBlockerContactTick,
    blockerContactTicks: state.blockerContactTicks,
    postContactNoContactTicks: state.postContactNoContactTicks,
    persistenceOpen: state.persistenceOpen,
    blockerStart: { ...BLOCKER_START },
    blockerAtFirstOpen: state.blockerAtFirstOpen,
    blockerAtPersistence: state.blockerAtPersistence,
    blockerFinal: { x: bp.x, y: bp.y },
    finalOpen: isE02aPassageOpen(state),
    shuttleFinal: {
      x: sp.x,
      y: sp.y,
      direction: state.base.direction,
    },
  };

  destroyE02aScenario(state);
  return result;
}

function stableComparable(result: E02aScenarioResult): unknown {
  return {
    ticks: result.ticks,
    initialOpen: result.initialOpen,
    firstOpenTick: result.firstOpenTick,
    firstBlockerContactTick: result.firstBlockerContactTick,
    blockerContactTicks: result.blockerContactTicks,
    postContactNoContactTicks: result.postContactNoContactTicks,
    persistenceOpen: result.persistenceOpen,
    blockerAtFirstOpen: result.blockerAtFirstOpen,
    blockerAtPersistence: result.blockerAtPersistence,
    blockerFinal: result.blockerFinal,
    finalOpen: result.finalOpen,
    shuttleFinal: result.shuttleFinal,
  };
}

export function runE02aCampaign(): E02aCampaignResult {
  const control = runE02aScenario(false);
  const interaction = runE02aScenario(true);
  const repeat = runE02aScenario(true);

  const deterministic =
    JSON.stringify(stableComparable(interaction)) ===
    JSON.stringify(stableComparable(repeat));

  const blockerDisplacementAtPersistence =
    interaction.blockerAtPersistence
      ? Math.hypot(
          interaction.blockerAtPersistence.x - BLOCKER_START.x,
          interaction.blockerAtPersistence.y - BLOCKER_START.y,
        )
      : null;

  const reasons: string[] = [];

  if (control.initialOpen) reasons.push('control passage was not blocked initially');
  if (interaction.initialOpen) reasons.push('interaction passage was not blocked initially');
  if (control.firstOpenTick !== null) reasons.push('disabled-process control opened passage');
  if (interaction.firstBlockerContactTick === null) reasons.push('E01 shuttle never contacted blocker');
  if (interaction.firstOpenTick === null) reasons.push('interaction never opened passage');
  if (interaction.postContactNoContactTicks < PERSISTENCE_TICKS) {
    reasons.push('shuttle and blocker never separated for the required post-contact persistence window');
  }
  if (interaction.persistenceOpen !== true) {
    reasons.push('passage did not remain open after the required no-contact persistence window');
  }
  if (
    blockerDisplacementAtPersistence === null ||
    blockerDisplacementAtPersistence < 0.9
  ) {
    reasons.push('blocker displacement was too small to support persistent geometry change');
  }
  if (!deterministic) reasons.push('interaction result was not deterministic');

  return {
    pass: reasons.length === 0,
    deterministic,
    control,
    interaction,
    blockerDisplacementAtPersistence,
    reasons,
  };
}
