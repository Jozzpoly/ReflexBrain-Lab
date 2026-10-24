import {
  E0_RADIUS,
  E0_RAPIER as RAPIER,
  applyE0Demand,
  createE0Body,
  createE0Wall,
  createE0World,
} from './e0-body-seam';
import {
  C01AuthoredMonitor,
  C01_TOTAL_TICKS,
  type C01PrivateState,
} from './c01-private-evidence-monitor';
import { E01_PROCESS_DONOR } from './e01-mechanical';
import {
  P02A_MAX_RANGE,
  senseP02aFrame,
  type P02aPrivateFrame,
} from './p02a-private-occlusion';

type Body = { rb: any; co: any };

export type G5D0Config = {
  targetY: number;
  shuttleY: number;
  shuttleStartX: number;
  leftEndX: number;
  rightEndX: number;
};

export type G5D0PrivateRow = {
  tick: number;
  frame: P02aPrivateFrame;
  state: C01PrivateState;
  demand: number;
};

export type G5D0Run = {
  processEnabled: boolean;
  config: G5D0Config;
  initialBlobCount: number;
  firstLostTick: number | null;
  firstProcessTargetContactTick: number | null;
  firstCheckTick: number | null;
  firstReobservedTick: number | null;
  hiddenLeakTicks: number[];
  targetStayedWithinRangeBeforeCheck: boolean;
  actorProcessContactTicks: number[];
  targetDisplacementAtCheck: number | null;
  targetFinalDisplacement: number;
  processDirectionEvents: Array<{
    tick: number;
    direction: -1 | 1;
    cause: 'left-end-contact' | 'right-end-contact';
  }>;
  finalMode: C01PrivateState['mode'];
  privateTrace: G5D0PrivateRow[];
};

export type G5D0Pair = {
  config: G5D0Config;
  dynamic: G5D0Run;
  staticWorld: G5D0Run;
  firstPrivateDivergenceTick: number | null;
  viable: boolean;
  score: number;
  reasons: string[];
};

export type G5D0Discovery = {
  tested: number;
  viableCount: number;
  candidates: G5D0Pair[];
};

const ACTOR_START = { x: -3, y: 2 };
const TARGET_X = 1.5;
const TARGET_RADIUS = 0.35;
const TARGET_MASS = 1;
const TARGET_DAMPING = 2;

const OCCLUDER = { x: 0, y: 0, hx: 0.16, hy: 1.5 };
const LANE_WALL_HALF_THICKNESS = E01_PROCESS_DONOR.laneWallHalfThickness;

function xy(rb: any): { x: number; y: number } {
  const p = rb.translation();
  return { x: p.x, y: p.y };
}

function distance(
  a: { x: number; y: number },
  b: { x: number; y: number },
): number {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

function copyFrame(frame: P02aPrivateFrame): P02aPrivateFrame {
  return { blobs: frame.blobs.map((blob) => ({ ...blob })) };
}

function copyState(state: C01PrivateState): C01PrivateState {
  return {
    ...state,
    lastSeen: state.lastSeen ? { ...state.lastSeen } : null,
  };
}

function createDynamicBall(
  world: any,
  x: number,
  y: number,
  radius: number,
  mass: number,
  damping: number,
): Body {
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

function createFixedBall(
  world: any,
  x: number,
  y: number,
  radius: number,
): Body {
  const rb = world.createRigidBody(
    RAPIER.RigidBodyDesc.fixed().setTranslation(x, y),
  );
  const co = world.createCollider(
    RAPIER.ColliderDesc.ball(radius)
      .setFriction(0)
      .setRestitution(0),
    rb,
  );
  return { rb, co };
}

function createFixedWall(
  world: any,
  x: number,
  y: number,
  hx: number,
  hy: number,
): Body {
  const rb = world.createRigidBody(
    RAPIER.RigidBodyDesc.fixed().setTranslation(x, y),
  );
  const co = world.createCollider(
    RAPIER.ColliderDesc.cuboid(hx, hy)
      .setFriction(0.1)
      .setRestitution(0),
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

function firstPrivateDivergence(
  a: G5D0PrivateRow[],
  b: G5D0PrivateRow[],
): number | null {
  const n = Math.min(a.length, b.length);
  for (let i = 0; i < n; i += 1) {
    if (JSON.stringify(a[i]) !== JSON.stringify(b[i])) return a[i].tick;
  }
  return a.length === b.length ? null : n;
}

function runOnce(
  config: G5D0Config,
  processEnabled: boolean,
  historyEnabled = true,
): G5D0Run {
  const world = createE0World();
  try {
    const actor = createE0Body(world, ACTOR_START.x, ACTOR_START.y);
    actor.rb.setRotation(-Math.PI / 2, true);

    createE0Wall(
      world,
      OCCLUDER.x,
      OCCLUDER.y,
      OCCLUDER.hx,
      OCCLUDER.hy,
    );

    const target = createDynamicBall(
      world,
      TARGET_X,
      config.targetY,
      TARGET_RADIUS,
      TARGET_MASS,
      TARGET_DAMPING,
    );

    const shuttle = createDynamicBall(
      world,
      config.shuttleStartX,
      config.shuttleY,
      E01_PROCESS_DONOR.shuttleRadius,
      E01_PROCESS_DONOR.shuttleMass,
      E01_PROCESS_DONOR.shuttleDamping,
    );

    const leftEnd = createFixedBall(
      world,
      config.leftEndX,
      config.shuttleY,
      E01_PROCESS_DONOR.endRadius,
    );
    const rightEnd = createFixedBall(
      world,
      config.rightEndX,
      config.shuttleY,
      E01_PROCESS_DONOR.endRadius,
    );

    const laneCenterX = (config.leftEndX + config.rightEndX) / 2;
    const laneHalfX = (config.rightEndX - config.leftEndX) / 2 + 0.35;
    const lowerWall = createFixedWall(
      world,
      laneCenterX,
      config.shuttleY - E01_PROCESS_DONOR.laneWallOffset,
      laneHalfX,
      LANE_WALL_HALF_THICKNESS,
    );
    const upperWall = createFixedWall(
      world,
      laneCenterX,
      config.shuttleY + E01_PROCESS_DONOR.laneWallOffset,
      laneHalfX,
      LANE_WALL_HALF_THICKNESS,
    );

    // Query-readiness step exactly as in P02/C01.
    world.step();

    let frame = senseP02aFrame(world, actor, [
      { ...target, radius: TARGET_RADIUS },
    ]);
    const initialBlobCount = frame.blobs.length;

    const controller = new C01AuthoredMonitor(historyEnabled);
    controller.seedLegalObservation(frame);

    let direction: -1 | 1 = -1;
    let prevLeftTouch = false;
    let prevRightTouch = false;
    let lastSelfMotion = 0;
    let wasVisible = frame.blobs.length > 0;

    let firstLostTick: number | null = null;
    let firstProcessTargetContactTick: number | null = null;
    let firstCheckTick: number | null = null;
    let firstReobservedTick: number | null = null;
    let targetDisplacementAtCheck: number | null = null;
    let targetStayedWithinRangeBeforeCheck = true;

    const hiddenLeakTicks: number[] = [];
    const actorProcessContactTicks: number[] = [];
    const directionEvents: G5D0Run['processDirectionEvents'] = [];
    const privateTrace: G5D0PrivateRow[] = [];

    const initialTarget = xy(target.rb);

    privateTrace.push({
      tick: 0,
      frame: copyFrame(frame),
      state: copyState(controller.getState()),
      demand: 0,
    });

    for (let tick = 1; tick <= C01_TOTAL_TICKS; tick += 1) {
      const actorBefore = xy(actor.rb);
      const decision = controller.step(frame, lastSelfMotion);

      if (decision.state.mode === 'CHECK' && firstCheckTick === null) {
        firstCheckTick = tick;
        targetDisplacementAtCheck = distance(initialTarget, xy(target.rb));
      }

      shuttle.rb.resetForces(true);
      shuttle.rb.resetTorques(true);
      if (processEnabled) {
        shuttle.rb.addForce(
          { x: E01_PROCESS_DONOR.shuttleForce * direction, y: 0 },
          true,
        );
      }

      applyE0Demand(actor.rb, decision.drive, 0);
      world.step();

      const leftTouch = hasContact(world, shuttle.co, leftEnd.co);
      const rightTouch = hasContact(world, shuttle.co, rightEnd.co);

      if (leftTouch && !prevLeftTouch && direction === -1) {
        direction = 1;
        directionEvents.push({
          tick,
          direction: 1,
          cause: 'left-end-contact',
        });
      }
      if (rightTouch && !prevRightTouch && direction === 1) {
        direction = -1;
        directionEvents.push({
          tick,
          direction: -1,
          cause: 'right-end-contact',
        });
      }
      prevLeftTouch = leftTouch;
      prevRightTouch = rightTouch;

      if (
        firstProcessTargetContactTick === null &&
        hasContact(world, shuttle.co, target.co)
      ) {
        firstProcessTargetContactTick = tick;
      }

      const actorAfter = xy(actor.rb);
      const targetAfter = xy(target.rb);
      lastSelfMotion = distance(actorBefore, actorAfter);

      frame = senseP02aFrame(world, actor, [
        { ...target, radius: TARGET_RADIUS },
      ]);
      const visible = frame.blobs.length > 0;

      if (firstLostTick === null && wasVisible && !visible) {
        firstLostTick = tick;
      }
      wasVisible = visible;

      if (firstLostTick !== null && firstCheckTick === null) {
        if (visible) hiddenLeakTicks.push(tick);
        if (distance(actorAfter, targetAfter) > P02A_MAX_RANGE) {
          targetStayedWithinRangeBeforeCheck = false;
        }
      }

      if (
        firstCheckTick !== null &&
        firstReobservedTick === null &&
        tick >= firstCheckTick &&
        visible
      ) {
        firstReobservedTick = tick;
      }

      const actorTouchedProcess =
        hasContact(world, actor.co, target.co) ||
        hasContact(world, actor.co, shuttle.co) ||
        hasContact(world, actor.co, leftEnd.co) ||
        hasContact(world, actor.co, rightEnd.co) ||
        hasContact(world, actor.co, lowerWall.co) ||
        hasContact(world, actor.co, upperWall.co);

      if (actorTouchedProcess) actorProcessContactTicks.push(tick);

      privateTrace.push({
        tick,
        frame: copyFrame(frame),
        state: copyState(decision.state),
        demand: decision.drive,
      });
    }

    if (firstCheckTick === null) {
      targetDisplacementAtCheck = null;
    }

    return {
      processEnabled,
      config: { ...config },
      initialBlobCount,
      firstLostTick,
      firstProcessTargetContactTick,
      firstCheckTick,
      firstReobservedTick,
      hiddenLeakTicks,
      targetStayedWithinRangeBeforeCheck,
      actorProcessContactTicks,
      targetDisplacementAtCheck,
      targetFinalDisplacement: distance(initialTarget, xy(target.rb)),
      processDirectionEvents: directionEvents,
      finalMode: controller.getState().mode,
      privateTrace,
    };
  } finally {
    world.free();
  }
}

function evaluate(config: G5D0Config): G5D0Pair {
  const dynamic = runOnce(config, true);
  const staticWorld = runOnce(config, false);
  const firstPrivate = firstPrivateDivergence(
    dynamic.privateTrace,
    staticWorld.privateTrace,
  );

  const reasons: string[] = [];

  if (dynamic.initialBlobCount !== 1 || staticWorld.initialBlobCount !== 1) {
    reasons.push('initial legal P0 is not exactly one blob');
  }
  if (dynamic.firstLostTick === null || staticWorld.firstLostTick === null) {
    reasons.push('actor does not produce legal P0 loss');
  }
  if (dynamic.firstLostTick !== staticWorld.firstLostTick) {
    reasons.push('process changes visibility-loss timing');
  }
  if (dynamic.firstProcessTargetContactTick === null) {
    reasons.push('independent shuttle never contacts target');
  }
  if (
    dynamic.firstProcessTargetContactTick !== null &&
    dynamic.firstLostTick !== null &&
    dynamic.firstProcessTargetContactTick <= dynamic.firstLostTick
  ) {
    reasons.push('process contacts target before actor loses P0');
  }
  if (
    dynamic.firstProcessTargetContactTick !== null &&
    dynamic.firstCheckTick !== null &&
    dynamic.firstProcessTargetContactTick >= dynamic.firstCheckTick
  ) {
    reasons.push('process contact does not occur before CHECK');
  }
  if (dynamic.firstCheckTick === null || staticWorld.firstCheckTick === null) {
    reasons.push('private-age CHECK missing');
  }
  if (dynamic.firstCheckTick !== staticWorld.firstCheckTick) {
    reasons.push('process changes private CHECK timing');
  }
  if (
    dynamic.targetDisplacementAtCheck === null ||
    dynamic.targetDisplacementAtCheck < E0_RADIUS * 0.1
  ) {
    reasons.push('hidden target displacement is too small by CHECK');
  }
  if (
    staticWorld.targetDisplacementAtCheck === null ||
    staticWorld.targetDisplacementAtCheck > 1e-6
  ) {
    reasons.push('disabled-process target does not remain static');
  }
  if (dynamic.hiddenLeakTicks.length > 0 || staticWorld.hiddenLeakTicks.length > 0) {
    reasons.push('P0 leaks during hidden interval');
  }
  if (
    !dynamic.targetStayedWithinRangeBeforeCheck ||
    !staticWorld.targetStayedWithinRangeBeforeCheck
  ) {
    reasons.push('target leaves declared P0 range before CHECK');
  }
  if (
    dynamic.actorProcessContactTicks.length > 0 ||
    staticWorld.actorProcessContactTicks.length > 0
  ) {
    reasons.push('process/target directly contacts actor');
  }
  if (
    dynamic.firstReobservedTick === null ||
    staticWorld.firstReobservedTick === null
  ) {
    reasons.push('CHECK does not obtain fresh legal P0');
  }

  const earliestFresh = Math.min(
    dynamic.firstReobservedTick ?? Number.POSITIVE_INFINITY,
    staticWorld.firstReobservedTick ?? Number.POSITIVE_INFINITY,
  );
  if (firstPrivate !== null && firstPrivate < earliestFresh) {
    reasons.push('dynamic/static private histories diverge before lawful fresh P0');
  }

  const loss = dynamic.firstLostTick ?? 0;
  const contact = dynamic.firstProcessTargetContactTick ?? 0;
  const check = dynamic.firstCheckTick ?? C01_TOTAL_TICKS;
  const timingMargin =
    contact > loss && check > contact
      ? Math.min(contact - loss, check - contact)
      : -1000;

  const displacement = dynamic.targetDisplacementAtCheck ?? 0;
  const score = timingMargin + Math.min(displacement, 2) * 10;

  return {
    config: { ...config },
    dynamic,
    staticWorld,
    firstPrivateDivergenceTick: firstPrivate,
    viable: reasons.length === 0,
    score,
    reasons,
  };
}

function configs(): G5D0Config[] {
  const result: G5D0Config[] = [];
  const targetYs = [1.9, 2.0, 2.1, 2.2];
  const shuttleOffsets = [-0.3, 0, 0.3];
  const shuttleStarts = [4.2, 4.6, 5.0];
  const leftEnds = [0.4, 0.8, 1.2];
  const rightEndX = 5.8;

  for (const targetY of targetYs) {
    for (const offset of shuttleOffsets) {
      for (const shuttleStartX of shuttleStarts) {
        for (const leftEndX of leftEnds) {
          result.push({
            targetY,
            shuttleY: targetY + offset,
            shuttleStartX,
            leftEndX,
            rightEndX,
          });
        }
      }
    }
  }
  return result;
}

export function runG5D0Discovery(): G5D0Discovery {
  const pairs = configs().map(evaluate);
  const candidates = pairs
    .filter((pair) => pair.viable)
    .sort((a, b) => b.score - a.score);

  return {
    tested: pairs.length,
    viableCount: candidates.length,
    candidates,
  };
}

export function rerunG5D0Config(config: G5D0Config): G5D0Pair {
  return evaluate(config);
}

export function runG5D0Variant(
  config: G5D0Config,
  processEnabled: boolean,
  historyEnabled = true,
): G5D0Run {
  return runOnce(config, processEnabled, historyEnabled);
}
