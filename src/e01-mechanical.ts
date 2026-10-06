import * as RapierModule from '@dimforge/rapier2d-deterministic-compat';

const RAPIER: any = (RapierModule as any).default ?? RapierModule;

export const E01_DT = 1 / 120;
export const E01_MAX_TICKS = 1800;

const SHUTTLE_RADIUS = 0.55;
const SHUTTLE_MASS = 4;
const SHUTTLE_FORCE = 28;
const SHUTTLE_DAMPING = 1.15;
const LOOSE_RADIUS = 0.32;
const LOOSE_MASS = 1;
const LOOSE_DAMPING = 3.0;
const END_X = 4.35;
const END_RADIUS = 0.28;
const WALL_Y = 1.2;
const WALL_HALF_X = 5.4;
const LOOSE_START = { x: -0.1, y: 0.48 };

export async function initE01Rapier(): Promise<void> {
  await RAPIER.init();
}

type DynamicBody = {
  rb: any;
  co: any;
};

type FixedBody = {
  rb: any;
  co: any;
};

export type E01State = {
  world: any;
  shuttle: DynamicBody;
  loose: DynamicBody | null;
  leftEnd: FixedBody;
  rightEnd: FixedBody;
  walls: FixedBody[];
  direction: -1 | 1;
  tick: number;
  prevLeftTouch: boolean;
  prevRightTouch: boolean;
  rightReversalTick: number | null;
  leftReversalTick: number | null;
  firstLooseContactTick: number | null;
  looseContactTicks: number;
  directionEvents: Array<{ tick: number; direction: -1 | 1; cause: 'left-end-contact' | 'right-end-contact' }>;
};

export type E01ScenarioResult = {
  withLoose: boolean;
  ticks: number;
  rightReversalTick: number | null;
  leftReversalTick: number | null;
  firstLooseContactTick: number | null;
  looseContactTicks: number;
  looseStart: { x: number; y: number } | null;
  looseAtRightReversal: { x: number; y: number; speed: number } | null;
  loosePersistenceSample: { tick: number; x: number; y: number; speed: number } | null;
  looseFinal: { x: number; y: number; speed: number } | null;
  directionEvents: E01State['directionEvents'];
};

export type E01CampaignResult = {
  pass: boolean;
  deterministic: boolean;
  control: E01ScenarioResult;
  interaction: E01ScenarioResult;
  reversalDelayTicks: number | null;
  persistentDisplacement: number | null;
  reasons: string[];
};

function createDynamicBall(
  world: any,
  x: number,
  y: number,
  radius: number,
  mass: number,
  damping: number,
): DynamicBody {
  const rb = world.createRigidBody(
    RAPIER.RigidBodyDesc.dynamic()
      .setTranslation(x, y)
      .setLinearDamping(damping)
      .setAngularDamping(4),
  );
  const co = world.createCollider(
    RAPIER.ColliderDesc.ball(radius)
      .setMass(mass)
      .setFriction(0.12)
      .setRestitution(0.02),
    rb,
  );
  return { rb, co };
}

function createFixedBall(world: any, x: number, y: number, radius: number): FixedBody {
  const rb = world.createRigidBody(RAPIER.RigidBodyDesc.fixed().setTranslation(x, y));
  const co = world.createCollider(
    RAPIER.ColliderDesc.ball(radius).setFriction(0).setRestitution(0),
    rb,
  );
  return { rb, co };
}

function createFixedWall(world: any, x: number, y: number, hx: number, hy: number): FixedBody {
  const rb = world.createRigidBody(RAPIER.RigidBodyDesc.fixed().setTranslation(x, y));
  const co = world.createCollider(
    RAPIER.ColliderDesc.cuboid(hx, hy).setFriction(0.1).setRestitution(0),
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

function speed(rb: any): number {
  const v = rb.linvel();
  return Math.hypot(v.x, v.y);
}

export function createE01Scenario(withLoose: boolean): E01State {
  const world = new RAPIER.World({ x: 0, y: 0 });
  world.timestep = E01_DT;

  const shuttle = createDynamicBall(world, -3.6, 0, SHUTTLE_RADIUS, SHUTTLE_MASS, SHUTTLE_DAMPING);
  const loose = withLoose
    ? createDynamicBall(
        world,
        LOOSE_START.x,
        LOOSE_START.y,
        LOOSE_RADIUS,
        LOOSE_MASS,
        LOOSE_DAMPING,
      )
    : null;

  const leftEnd = createFixedBall(world, -END_X, 0, END_RADIUS);
  const rightEnd = createFixedBall(world, END_X, 0, END_RADIUS);
  const walls = [
    createFixedWall(world, 0, -WALL_Y, WALL_HALF_X, 0.12),
    createFixedWall(world, 0, WALL_Y, WALL_HALF_X, 0.12),
  ];

  return {
    world,
    shuttle,
    loose,
    leftEnd,
    rightEnd,
    walls,
    direction: 1,
    tick: 0,
    prevLeftTouch: false,
    prevRightTouch: false,
    rightReversalTick: null,
    leftReversalTick: null,
    firstLooseContactTick: null,
    looseContactTicks: 0,
    directionEvents: [],
  };
}

export function stepE01Scenario(state: E01State): void {
  const shuttleRb = state.shuttle.rb;

  shuttleRb.resetForces(true);
  shuttleRb.addForce({ x: SHUTTLE_FORCE * state.direction, y: 0 }, true);

  state.world.step();
  state.tick += 1;

  if (state.loose && hasContact(state.world, state.shuttle.co, state.loose.co)) {
    state.looseContactTicks += 1;
    if (state.firstLooseContactTick === null) state.firstLooseContactTick = state.tick;
  }

  const leftTouch = hasContact(state.world, state.shuttle.co, state.leftEnd.co);
  const rightTouch = hasContact(state.world, state.shuttle.co, state.rightEnd.co);

  if (rightTouch && !state.prevRightTouch && state.direction === 1) {
    state.direction = -1;
    if (state.rightReversalTick === null) state.rightReversalTick = state.tick;
    state.directionEvents.push({ tick: state.tick, direction: -1, cause: 'right-end-contact' });
  }

  if (leftTouch && !state.prevLeftTouch && state.direction === -1) {
    state.direction = 1;
    if (state.leftReversalTick === null) state.leftReversalTick = state.tick;
    state.directionEvents.push({ tick: state.tick, direction: 1, cause: 'left-end-contact' });
  }

  state.prevLeftTouch = leftTouch;
  state.prevRightTouch = rightTouch;
}

export function destroyE01Scenario(state: E01State): void {
  state.world.free();
}

export function snapshotE01Scenario(state: E01State) {
  const shuttleP = state.shuttle.rb.translation();
  const shuttleV = state.shuttle.rb.linvel();
  const looseP = state.loose?.rb.translation();
  const looseV = state.loose?.rb.linvel();

  return {
    tick: state.tick,
    direction: state.direction,
    shuttle: {
      x: shuttleP.x,
      y: shuttleP.y,
      vx: shuttleV.x,
      vy: shuttleV.y,
      speed: Math.hypot(shuttleV.x, shuttleV.y),
    },
    loose: state.loose && looseP && looseV
      ? {
          x: looseP.x,
          y: looseP.y,
          vx: looseV.x,
          vy: looseV.y,
          speed: Math.hypot(looseV.x, looseV.y),
        }
      : null,
    rightReversalTick: state.rightReversalTick,
    leftReversalTick: state.leftReversalTick,
    firstLooseContactTick: state.firstLooseContactTick,
    looseContactTicks: state.looseContactTicks,
  };
}

export function runE01Scenario(withLoose: boolean, maxTicks = E01_MAX_TICKS): E01ScenarioResult {
  const state = createE01Scenario(withLoose);
  let looseAtRightReversal: E01ScenarioResult['looseAtRightReversal'] = null;
  let loosePersistenceSample: E01ScenarioResult['loosePersistenceSample'] = null;
  let persistenceDueTick: number | null = null;

  for (let i = 0; i < maxTicks; i += 1) {
    stepE01Scenario(state);

    if (state.loose && state.rightReversalTick !== null && looseAtRightReversal === null) {
      const p = state.loose.rb.translation();
      looseAtRightReversal = { x: p.x, y: p.y, speed: speed(state.loose.rb) };
      persistenceDueTick = state.rightReversalTick + 90;
    }

    if (
      state.loose &&
      persistenceDueTick !== null &&
      state.tick >= persistenceDueTick &&
      loosePersistenceSample === null
    ) {
      const p = state.loose.rb.translation();
      loosePersistenceSample = {
        tick: state.tick,
        x: p.x,
        y: p.y,
        speed: speed(state.loose.rb),
      };
    }

    if (
      state.rightReversalTick !== null &&
      state.leftReversalTick !== null &&
      (!state.loose || loosePersistenceSample !== null)
    ) {
      break;
    }
  }

  const looseFinal = state.loose
    ? {
        x: state.loose.rb.translation().x,
        y: state.loose.rb.translation().y,
        speed: speed(state.loose.rb),
      }
    : null;

  const result: E01ScenarioResult = {
    withLoose,
    ticks: state.tick,
    rightReversalTick: state.rightReversalTick,
    leftReversalTick: state.leftReversalTick,
    firstLooseContactTick: state.firstLooseContactTick,
    looseContactTicks: state.looseContactTicks,
    looseStart: state.loose ? { ...LOOSE_START } : null,
    looseAtRightReversal,
    loosePersistenceSample,
    looseFinal,
    directionEvents: [...state.directionEvents],
  };

  destroyE01Scenario(state);
  return result;
}

function stableComparable(result: E01ScenarioResult): unknown {
  return {
    ticks: result.ticks,
    rightReversalTick: result.rightReversalTick,
    leftReversalTick: result.leftReversalTick,
    firstLooseContactTick: result.firstLooseContactTick,
    looseContactTicks: result.looseContactTicks,
    looseAtRightReversal: result.looseAtRightReversal,
    loosePersistenceSample: result.loosePersistenceSample,
    looseFinal: result.looseFinal,
    directionEvents: result.directionEvents,
  };
}

export function runE01Campaign(): E01CampaignResult {
  const control = runE01Scenario(false);
  const interaction = runE01Scenario(true);
  const repeat = runE01Scenario(true);

  const deterministic =
    JSON.stringify(stableComparable(interaction)) === JSON.stringify(stableComparable(repeat));

  const reversalDelayTicks =
    control.rightReversalTick !== null && interaction.rightReversalTick !== null
      ? interaction.rightReversalTick - control.rightReversalTick
      : null;

  const persistentDisplacement =
    interaction.loosePersistenceSample && interaction.looseStart
      ? Math.hypot(
          interaction.loosePersistenceSample.x - interaction.looseStart.x,
          interaction.loosePersistenceSample.y - interaction.looseStart.y,
        )
      : null;

  const reasons: string[] = [];

  if (control.rightReversalTick === null) reasons.push('control never reached right physical end-stop');
  if (interaction.rightReversalTick === null) reasons.push('interaction run never reached right physical end-stop');
  if (interaction.firstLooseContactTick === null) reasons.push('shuttle never physically contacted loose body');
  if (interaction.looseContactTicks < 1) reasons.push('no sustained contact evidence with loose body');
  if (reversalDelayTicks === null || Math.abs(reversalDelayTicks) < 3) {
    reasons.push('loose-body interaction did not materially alter shuttle reversal timing');
  }
  if (persistentDisplacement === null || persistentDisplacement < 0.6) {
    reasons.push('loose body did not retain a sufficiently large post-contact displacement');
  }
  if (!interaction.directionEvents.some((e) => e.cause === 'right-end-contact')) {
    reasons.push('rightward reversal was not caused by physical end-stop contact');
  }
  if (!deterministic) reasons.push('repeated interaction run was not deterministic');

  return {
    pass: reasons.length === 0,
    deterministic,
    control,
    interaction,
    reversalDelayTicks,
    persistentDisplacement,
    reasons,
  };
}
