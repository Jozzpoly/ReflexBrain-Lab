import {
  E0_FMAX,
  E0_RADIUS,
  applyE0Demand,
  createE0Body,
  createE0Wall,
  createE0World,
} from './e0-body-seam';
import {
  F2_P0_CONSTANTS,
  runF2P0EpisodeForResearch,
  type F2EpisodeResult,
  type F2EpisodeSpec,
} from './f2-private-competence-reliability';

export type F3DirectionalTouch = {
  side: -1 | 1;
  lastWindowSignedImpulse: number[];
  nonzeroTicks: number;
  meanSignedImpulse: number;
  sign: -1 | 0 | 1;
};

export type F3D0Result = {
  outcome: 'MATERIAL_ALIAS_FOUND' | 'NO_ALIAS' | 'APPARATUS_FAIL';
  deterministic: boolean;
  right: F2EpisodeResult;
  left: F2EpisodeResult;
  privateHistoryEqual: boolean;
  signalsEqual: boolean;
  sameMDrive: boolean;
  sameFDrive: boolean;
  regretOpposite: boolean;
  directionalTouch: {
    right: F3DirectionalTouch;
    left: F3DirectionalTouch;
    separates: boolean;
  };
  reasons: string[];
};

const FORCE_MAGNITUDE = 1.05;
const PHASE = 0;
const WALL_X = 1.5;
const WALL_HX = 0.1;
const WALL_HY = 3;
const CONTACT_START_X = WALL_X - WALL_HX - E0_RADIUS - 0.02;

function mirroredSpec(side: -1 | 1): F2EpisodeSpec {
  return {
    id: side > 0 ? 'f3-right' : 'f3-left',
    family: 'contact-constraint',
    phase: PHASE,
    externalBefore: side * FORCE_MAGNITUDE,
    externalAfter: side * FORCE_MAGNITUDE,
    transitionTick: null,
    dampingMultiplier: 1,
    wallSide: side,
    releaseWallAtTransition: false,
  };
}

function privateHistoryKey(result: F2EpisodeResult): string {
  return JSON.stringify(
    result.history.map((row) => ({
      tick: row.tick,
      demand: row.demand,
      velocityBefore: row.velocityBefore,
      velocityAfter: row.velocityAfter,
      residual: row.residual,
      privateTouch: row.privateTouch,
    })),
  );
}

function signalsKey(result: F2EpisodeResult): string {
  return JSON.stringify(result.signals);
}

function sign(value: number): -1 | 0 | 1 {
  if (value > 1e-9) return 1;
  if (value < -1e-9) return -1;
  return 0;
}

function runDirectionalTouch(side: -1 | 1): F3DirectionalTouch {
  const world = createE0World();
  try {
    const actor = createE0Body(
      world,
      side > 0 ? CONTACT_START_X : -CONTACT_START_X,
      0,
    );
    actor.rb.setRotation(0, true);

    const wall = createE0Wall(
      world,
      side > 0 ? WALL_X : -WALL_X,
      0,
      WALL_HX,
      WALL_HY,
    );

    // Same readiness step as F2 source host.
    world.step();

    const signed: number[] = [];

    for (let tick = 1; tick <= F2_P0_CONSTANTS.decisionTick; tick += 1) {
      const demand =
        F2_P0_CONSTANTS.demandPattern[
          (tick - 1 + PHASE) % F2_P0_CONSTANTS.demandPattern.length
        ];

      applyE0Demand(actor.rb, demand, 0);
      actor.rb.addForce(
        { x: side * FORCE_MAGNITUDE * E0_FMAX, y: 0 },
        true,
      );
      world.step();

      let signedImpulse = 0;
      world.contactPair(actor.co, wall.co, (manifold: any) => {
        const normal = manifold.normal();
        for (let i = 0; i < manifold.numSolverContacts(); i += 1) {
          signedImpulse +=
            normal.x * Math.abs(manifold.contactImpulse(i));
        }
      });
      signed.push(signedImpulse);
    }

    const lastWindowSignedImpulse = signed.slice(
      -F2_P0_CONSTANTS.historyWindow,
    );
    const nonzeroTicks = lastWindowSignedImpulse.filter(
      (value) => Math.abs(value) > 1e-9,
    ).length;
    const meanSignedImpulse =
      lastWindowSignedImpulse.reduce((sum, value) => sum + value, 0) /
      lastWindowSignedImpulse.length;

    return {
      side,
      lastWindowSignedImpulse,
      nonzeroTicks,
      meanSignedImpulse,
      sign: sign(meanSignedImpulse),
    };
  } finally {
    world.free();
  }
}

function runOnce(): Omit<F3D0Result, 'deterministic'> {
  const right = runF2P0EpisodeForResearch(mirroredSpec(1));
  const left = runF2P0EpisodeForResearch(mirroredSpec(-1));

  const privateHistoryEqual =
    privateHistoryKey(right) === privateHistoryKey(left);
  const signalsEqual = signalsKey(right) === signalsKey(left);
  const sameMDrive = right.mDrive === left.mDrive;
  const sameFDrive = right.fDrive === left.fDrive;
  const regretOpposite =
    Math.sign(right.regret) !== 0 &&
    Math.sign(left.regret) !== 0 &&
    Math.sign(right.regret) === -Math.sign(left.regret);

  const rightTouch = runDirectionalTouch(1);
  const leftTouch = runDirectionalTouch(-1);
  const separates =
    rightTouch.nonzeroTicks > 0 &&
    leftTouch.nonzeroTicks > 0 &&
    rightTouch.sign !== 0 &&
    leftTouch.sign !== 0 &&
    rightTouch.sign === -leftTouch.sign;

  const reasons: string[] = [];

  if (!right.sourceSnapshotUnchanged || !left.sourceSnapshotUnchanged) {
    reasons.push('F2 source snapshot mutation');
  }

  const apparatusInvalid =
    right.signals.touchFraction <= 0 ||
    left.signals.touchFraction <= 0 ||
    rightTouch.nonzeroTicks === 0 ||
    leftTouch.nonzeroTicks === 0;

  if (!privateHistoryEqual) reasons.push('mirrored F2 private histories differ');
  if (!signalsEqual) reasons.push('derived F2 private signals differ');
  if (!sameMDrive) reasons.push('M chooses different drives');
  if (!sameFDrive) reasons.push('F chooses different drives');
  if (!regretOpposite) reasons.push('M-vs-F regret does not reverse sign');

  const alias =
    privateHistoryEqual &&
    signalsEqual &&
    sameMDrive &&
    sameFDrive &&
    regretOpposite;

  return {
    outcome: apparatusInvalid
      ? 'APPARATUS_FAIL'
      : alias
        ? 'MATERIAL_ALIAS_FOUND'
        : 'NO_ALIAS',
    right,
    left,
    privateHistoryEqual,
    signalsEqual,
    sameMDrive,
    sameFDrive,
    regretOpposite,
    directionalTouch: {
      right: rightTouch,
      left: leftTouch,
      separates,
    },
    reasons,
  };
}

export function runF3D0Discovery(): F3D0Result {
  const first = runOnce();
  const second = runOnce();
  return {
    ...first,
    deterministic: JSON.stringify(first) === JSON.stringify(second),
  };
}

export const F3_D0_CONSTANTS = Object.freeze({
  phase: PHASE,
  forceMagnitude: FORCE_MAGNITUDE,
  wallX: WALL_X,
  wallHalfThickness: WALL_HX,
});
