import * as RapierModule from '@dimforge/rapier2d-deterministic-compat';
import {
  createE02aScenario,
  destroyE02aScenario,
  type E02aState,
} from './e02a-passage';
import { stepE01Scenario } from './e01-mechanical';

const RAPIER: any = (RapierModule as any).default ?? RapierModule;

export const B01B_CLEARANCE_RADIUS = 1.0;
export const B01B_MAX_TICKS = 960;
export const B01B_PERSISTENCE_TICKS = 60;

export const B01B_CORRIDOR_INNER_HALF_HEIGHT = 1.60;
export const B01B_DOOR_GAP_HALF_HEIGHT = 1.20;
export const B01B_WALL_HALF_THICKNESS = 0.12;
export const B01B_CORRIDOR_HALF_LENGTH = 5.40;

const BLOCKER_RADIUS = 0.50;
const SHUTTLE_RADIUS = 0.55;
const DOOR_X = 0;

type FixedBody = { rb: any; co: any; hx: number; hy: number };

export type B01bState = {
  e02: E02aState;
  staticWalls: FixedBody[];
  processEnabled: boolean;
  initialOpen: boolean;
  firstContactTick: number | null;
  firstOpenTick: number | null;
  contactTicks: number;
  hadContact: boolean;
  postContactNoContactTicks: number;
  persistenceOpen: boolean | null;
  blockerAtPersistence: { x: number; y: number } | null;
};

export type B01bScenarioResult = {
  processEnabled: boolean;
  initialOpen: boolean;
  firstContactTick: number | null;
  firstOpenTick: number | null;
  contactTicks: number;
  postContactNoContactTicks: number;
  persistenceOpen: boolean | null;
  blockerStart: { x: number; y: number };
  blockerAtPersistence: { x: number; y: number } | null;
  blockerFinal: { x: number; y: number };
  finalOpen: boolean;
  ticks: number;
};

export type B01bCampaignResult = {
  pass: boolean;
  deterministic: boolean;
  control: B01bScenarioResult;
  interaction: B01bScenarioResult;
  blockerDisplacementAtPersistence: number | null;
  reasons: string[];
};

function createFixedWall(
  world: any,
  x: number,
  y: number,
  hx: number,
  hy: number,
): FixedBody {
  const rb = world.createRigidBody(
    RAPIER.RigidBodyDesc.fixed().setTranslation(x, y),
  );
  const co = world.createCollider(
    RAPIER.ColliderDesc.cuboid(hx, hy)
      .setFriction(0.1)
      .setRestitution(0),
    rb,
  );
  return { rb, co, hx, hy };
}

function removeQualifiedStaticGeometry(state: E02aState): void {
  for (const wall of state.doorwayWalls) {
    state.base.world.removeRigidBody(wall.rb);
  }
  for (const wall of state.base.walls) {
    state.base.world.removeRigidBody(wall.rb);
  }
}

function installB0ScaleStaticGeometry(world: any): FixedBody[] {
  const outerWallCenterY =
    B01B_CORRIDOR_INNER_HALF_HEIGHT + B01B_WALL_HALF_THICKNESS;

  const doorSegmentHalfHeight =
    (B01B_CORRIDOR_INNER_HALF_HEIGHT - B01B_DOOR_GAP_HALF_HEIGHT) / 2;

  const doorSegmentCenterY =
    B01B_DOOR_GAP_HALF_HEIGHT + doorSegmentHalfHeight;

  return [
    createFixedWall(
      world,
      0,
      -outerWallCenterY,
      B01B_CORRIDOR_HALF_LENGTH,
      B01B_WALL_HALF_THICKNESS,
    ),
    createFixedWall(
      world,
      0,
      outerWallCenterY,
      B01B_CORRIDOR_HALF_LENGTH,
      B01B_WALL_HALF_THICKNESS,
    ),
    createFixedWall(
      world,
      DOOR_X,
      doorSegmentCenterY,
      B01B_WALL_HALF_THICKNESS,
      doorSegmentHalfHeight,
    ),
    createFixedWall(
      world,
      DOOR_X,
      -doorSegmentCenterY,
      B01B_WALL_HALF_THICKNESS,
      doorSegmentHalfHeight,
    ),
  ];
}

function hasContact(world: any, a: any, b: any): boolean {
  let found = false;
  world.contactPair(a, b, () => {
    found = true;
  });
  return found;
}

function currentDynamicCircles(
  state: B01bState,
): Array<{ x: number; y: number; radius: number }> {
  const sp = state.e02.base.shuttle.rb.translation();
  const bp = state.e02.blocker.rb.translation();

  return [
    { x: sp.x, y: sp.y, radius: SHUTTLE_RADIUS },
    { x: bp.x, y: bp.y, radius: BLOCKER_RADIUS },
  ];
}

export function isB01bPassageOpen(
  state: B01bState,
  clearanceRadius = B01B_CLEARANCE_RADIUS,
): boolean {
  const allowedMin = -B01B_DOOR_GAP_HALF_HEIGHT + clearanceRadius;
  const allowedMax = B01B_DOOR_GAP_HALF_HEIGHT - clearanceRadius;

  if (allowedMin >= allowedMax) return false;

  const intervals: Array<[number, number]> = [];

  for (const body of currentDynamicCircles(state)) {
    const expanded = body.radius + clearanceRadius;
    const intersectsDoorPlane =
      Math.abs(body.x - DOOR_X) <=
      expanded + B01B_WALL_HALF_THICKNESS;

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

export function createB01bScenario(processEnabled: boolean): B01bState {
  const e02 = createE02aScenario(false);
  removeQualifiedStaticGeometry(e02);

  const staticWalls = installB0ScaleStaticGeometry(e02.base.world);

  const state: B01bState = {
    e02,
    staticWalls,
    processEnabled,
    initialOpen: false,
    firstContactTick: null,
    firstOpenTick: null,
    contactTicks: 0,
    hadContact: false,
    postContactNoContactTicks: 0,
    persistenceOpen: null,
    blockerAtPersistence: null,
  };

  state.initialOpen = isB01bPassageOpen(state);
  return state;
}

export function stepB01bScenario(state: B01bState): void {
  if (state.processEnabled) {
    stepE01Scenario(state.e02.base);
  } else {
    state.e02.base.shuttle.rb.resetForces(true);
    state.e02.base.shuttle.rb.resetTorques(true);
    state.e02.base.world.step();
    state.e02.base.tick += 1;
  }

  const contact = hasContact(
    state.e02.base.world,
    state.e02.base.shuttle.co,
    state.e02.blocker.co,
  );

  if (contact) {
    state.hadContact = true;
    state.contactTicks += 1;
    state.postContactNoContactTicks = 0;
    if (state.firstContactTick === null) {
      state.firstContactTick = state.e02.base.tick;
    }
  } else if (state.hadContact) {
    state.postContactNoContactTicks += 1;
  }

  const open = isB01bPassageOpen(state);

  if (!state.initialOpen && open && state.firstOpenTick === null) {
    state.firstOpenTick = state.e02.base.tick;
  }

  if (
    state.firstOpenTick !== null &&
    state.hadContact &&
    state.postContactNoContactTicks >= B01B_PERSISTENCE_TICKS &&
    state.persistenceOpen === null
  ) {
    state.persistenceOpen = open;
    const p = state.e02.blocker.rb.translation();
    state.blockerAtPersistence = { x: p.x, y: p.y };
  }
}

export function destroyB01bScenario(state: B01bState): void {
  destroyE02aScenario(state.e02);
}

export function runB01bScenario(
  processEnabled: boolean,
): B01bScenarioResult {
  const state = createB01bScenario(processEnabled);

  const start = state.e02.blocker.rb.translation();
  const blockerStart = { x: start.x, y: start.y };

  for (let i = 0; i < B01B_MAX_TICKS; i += 1) {
    stepB01bScenario(state);

    if (
      processEnabled &&
      state.firstOpenTick !== null &&
      state.persistenceOpen !== null
    ) {
      break;
    }
  }

  const bp = state.e02.blocker.rb.translation();

  const result: B01bScenarioResult = {
    processEnabled,
    initialOpen: state.initialOpen,
    firstContactTick: state.firstContactTick,
    firstOpenTick: state.firstOpenTick,
    contactTicks: state.contactTicks,
    postContactNoContactTicks: state.postContactNoContactTicks,
    persistenceOpen: state.persistenceOpen,
    blockerStart,
    blockerAtPersistence: state.blockerAtPersistence,
    blockerFinal: { x: bp.x, y: bp.y },
    finalOpen: isB01bPassageOpen(state),
    ticks: state.e02.base.tick,
  };

  destroyB01bScenario(state);
  return result;
}

function comparable(r: B01bScenarioResult): unknown {
  return {
    initialOpen: r.initialOpen,
    firstContactTick: r.firstContactTick,
    firstOpenTick: r.firstOpenTick,
    contactTicks: r.contactTicks,
    postContactNoContactTicks: r.postContactNoContactTicks,
    persistenceOpen: r.persistenceOpen,
    blockerAtPersistence: r.blockerAtPersistence,
    blockerFinal: r.blockerFinal,
    finalOpen: r.finalOpen,
    ticks: r.ticks,
  };
}

export function runB01bCampaign(): B01bCampaignResult {
  const control = runB01bScenario(false);
  const interaction = runB01bScenario(true);
  const repeat = runB01bScenario(true);

  const deterministic =
    JSON.stringify(comparable(interaction)) ===
    JSON.stringify(comparable(repeat));

  const blockerDisplacementAtPersistence =
    interaction.blockerAtPersistence
      ? Math.hypot(
          interaction.blockerAtPersistence.x - interaction.blockerStart.x,
          interaction.blockerAtPersistence.y - interaction.blockerStart.y,
        )
      : null;

  const reasons: string[] = [];

  if (control.initialOpen) {
    reasons.push('control passage was not B0-scale BLOCKED initially');
  }

  if (control.firstOpenTick !== null) {
    reasons.push('disabled-process control became B0-scale OPEN');
  }

  if (interaction.initialOpen) {
    reasons.push('interaction passage was not B0-scale BLOCKED initially');
  }

  if (interaction.firstContactTick === null) {
    reasons.push('frozen E01 shuttle never contacted unchanged E02 blocker');
  }

  if (interaction.firstOpenTick === null) {
    reasons.push('interaction never became B0-scale OPEN');
  }

  if (
    interaction.postContactNoContactTicks <
    B01B_PERSISTENCE_TICKS
  ) {
    reasons.push('insufficient post-contact separation');
  }

  if (interaction.persistenceOpen !== true) {
    reasons.push('B0-scale passage did not remain OPEN at persistence sample');
  }

  if (
    blockerDisplacementAtPersistence === null ||
    blockerDisplacementAtPersistence < 0.9
  ) {
    reasons.push('blocker displacement at persistence remained insufficient');
  }

  if (!deterministic) {
    reasons.push('interaction repeat was not deterministic');
  }

  return {
    pass: reasons.length === 0,
    deterministic,
    control,
    interaction,
    blockerDisplacementAtPersistence,
    reasons,
  };
}
