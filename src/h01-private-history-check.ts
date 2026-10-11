import {
  E0_RADIUS,
  E0_RAPIER as RAPIER,
  applyE0Demand,
  createE0Body,
  createE0Wall,
  createE0World,
} from './e0-body-seam';
import {
  P02A_HIDDEN_IMPULSE,
  P02A_HIDDEN_STEPS,
  P02A_MAX_RANGE,
  P02A_MIN_DISPLACEMENT,
  senseP02aFrame,
  type P02aBlob,
  type P02aPrivateFrame,
} from './p02a-private-occlusion';
import { P02B_DRIVE_TICKS, P02B_SETTLE_TICKS } from './p02b-embodied-occlusion';

export const H01_CHECK_TICKS = 110;

type LastSeen = P02aBlob & { observedTick: number };
type PrivateHistory = { lastSeen: LastSeen | null };

export type H01WorldSnapshot = {
  actor: { x: number; y: number; angle: number; vx: number; vy: number };
  target: { x: number; y: number; vx: number; vy: number };
};

export type H01Branch = {
  historyRecordingEnabled: boolean;
  initialBlobCount: number;
  firstOcclusionTick: number | null;
  hiddenLeakCount: number;
  withinRangeThroughoutHidden: boolean;
  preHiddenTargetDisplacement: number;
  hiddenTargetDisplacement: number;
  historyBeforeHidden: PrivateHistory;
  historyAfterHidden: PrivateHistory;
  preCheckWorld: H01WorldSnapshot;
  preCheckFrame: P02aPrivateFrame;
  firstCheckDrive: number;
  firstNewBlobTick: number | null;
  bodyDisplacementDuringCheck: number;
  finalBlobCount: number;
  lastSeenAfterCheck: LastSeen | null;
};

export type H01Result = {
  outcome: 'PASS' | 'FAIL' | 'INCONCLUSIVE';
  deterministic: boolean;
  physicalMatchBeforeCheck: boolean;
  currentPrivateEvidenceMatch: boolean;
  enabled: H01Branch;
  ablated: H01Branch;
  reasons: string[];
};

function position(rb: any): { x: number; y: number } {
  const p = rb.translation();
  return { x: p.x, y: p.y };
}

function distance(a: { x: number; y: number }, b: { x: number; y: number }): number {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

// The complete control-facing state. No World position, object identity,
// collider handle, contact trace, hidden-event bit or semantic label.
function perceiveIntoHistory(
  history: PrivateHistory,
  frame: P02aPrivateFrame,
  tick: number,
  recordHistory: boolean,
): void {
  if (!recordHistory || frame.blobs.length === 0) return;
  const blob = frame.blobs[0];
  history.lastSeen = {
    observedTick: tick,
    bearing: blob.bearing,
    range: blob.range,
    radialMotion: blob.radialMotion,
    apparentRadius: blob.apparentRadius,
  };
}

// Deliberately authored diagnostic consumer, not a general Local Brain.
// A backward CHECK is a bounded physical response, not a World-coordinate route.
function checkDemand(
  history: Readonly<PrivateHistory>,
  currentFrame: P02aPrivateFrame,
): number {
  return currentFrame.blobs.length === 0 && history.lastSeen !== null ? -1 : 0;
}

function copyHistory(history: PrivateHistory): PrivateHistory {
  return { lastSeen: history.lastSeen === null ? null : { ...history.lastSeen } };
}

function snapshot(actor: any, target: any): H01WorldSnapshot {
  const a = actor.translation();
  const av = actor.linvel();
  const t = target.translation();
  const tv = target.linvel();
  return {
    actor: { x: a.x, y: a.y, angle: actor.rotation(), vx: av.x, vy: av.y },
    target: { x: t.x, y: t.y, vx: tv.x, vy: tv.y },
  };
}

function runOnce(recordHistory: boolean): H01Branch {
  const world = createE0World();
  try {
    const actor = createE0Body(world, -3, 2);
    actor.rb.setRotation(-Math.PI / 2, true);
    createE0Wall(world, 0, 0, 0.16, 1.5);

    const targetRb = world.createRigidBody(
      RAPIER.RigidBodyDesc.dynamic()
        .setTranslation(1.5, 2)
        .setLinearDamping(2)
        .setAngularDamping(4),
    );
    const targetCo = world.createCollider(
      RAPIER.ColliderDesc.ball(0.35)
        .setMass(1)
        .setFriction(0)
        .setRestitution(0),
      targetRb,
    );
    const target = { rb: targetRb, co: targetCo, radius: 0.35 };

    // Same neutral query-readiness step as frozen P02a / P02b.
    world.step();

    const history: PrivateHistory = { lastSeen: null };
    const sense = (tick: number): P02aPrivateFrame => {
      const frame = senseP02aFrame(world, actor, [target]);
      perceiveIntoHistory(history, frame, tick, recordHistory);
      return frame;
    };

    let frame = sense(0);
    const initialBlobCount = frame.blobs.length;
    const initialTarget = position(targetRb);
    let firstOcclusionTick: number | null = null;

    for (let t = 1; t <= P02B_DRIVE_TICKS; t += 1) {
      applyE0Demand(actor.rb, 1, 0);
      world.step();
      frame = sense(t);
      if (firstOcclusionTick === null && frame.blobs.length === 0) {
        firstOcclusionTick = t;
      }
    }

    for (let t = 1; t <= P02B_SETTLE_TICKS; t += 1) {
      applyE0Demand(actor.rb, 0, 0);
      world.step();
      frame = sense(P02B_DRIVE_TICKS + t);
    }

    const historyBeforeHidden = copyHistory(history);
    const preHiddenTarget = position(targetRb);
    const preHiddenTargetDisplacement = distance(initialTarget, preHiddenTarget);
    targetRb.applyImpulse({ x: P02A_HIDDEN_IMPULSE, y: 0 }, true);

    let hiddenLeakCount = 0;
    let withinRangeThroughoutHidden = true;
    for (let t = 1; t <= P02A_HIDDEN_STEPS; t += 1) {
      applyE0Demand(actor.rb, 0, 0);
      world.step();
      frame = sense(P02B_DRIVE_TICKS + P02B_SETTLE_TICKS + t);
      if (frame.blobs.length > 0) hiddenLeakCount += 1;
      if (distance(position(actor.rb), position(targetRb)) > P02A_MAX_RANGE) {
        withinRangeThroughoutHidden = false;
      }
    }

    const hiddenTargetDisplacement = distance(preHiddenTarget, position(targetRb));
    const historyAfterHidden = copyHistory(history);
    const preCheckWorld = snapshot(actor.rb, targetRb);
    const preCheckFrame = frame;
    const checkStart = position(actor.rb);
    const firstCheckDrive = checkDemand(history, frame);
    let firstNewBlobTick: number | null = null;

    for (let t = 1; t <= H01_CHECK_TICKS; t += 1) {
      const drive = checkDemand(history, frame);
      applyE0Demand(actor.rb, drive, 0);
      world.step();
      frame = sense(
        P02B_DRIVE_TICKS + P02B_SETTLE_TICKS + P02A_HIDDEN_STEPS + t,
      );
      if (firstNewBlobTick === null && frame.blobs.length > 0) {
        firstNewBlobTick = t;
      }
    }

    return {
      historyRecordingEnabled: recordHistory,
      initialBlobCount,
      firstOcclusionTick,
      hiddenLeakCount,
      withinRangeThroughoutHidden,
      preHiddenTargetDisplacement,
      hiddenTargetDisplacement,
      historyBeforeHidden,
      historyAfterHidden,
      preCheckWorld,
      preCheckFrame,
      firstCheckDrive,
      firstNewBlobTick,
      bodyDisplacementDuringCheck: distance(checkStart, position(actor.rb)),
      finalBlobCount: frame.blobs.length,
      lastSeenAfterCheck: copyHistory(history).lastSeen,
    };
  } finally {
    world.free();
  }
}

export function runH01Campaign(): H01Result {
  const enabled = runOnce(true);
  const ablated = runOnce(false);
  const enabledRepeat = runOnce(true);
  const ablatedRepeat = runOnce(false);

  const deterministic =
    JSON.stringify(enabled) === JSON.stringify(enabledRepeat) &&
    JSON.stringify(ablated) === JSON.stringify(ablatedRepeat);

  const physicalMatchBeforeCheck =
    JSON.stringify(enabled.preCheckWorld) === JSON.stringify(ablated.preCheckWorld);
  const currentPrivateEvidenceMatch =
    JSON.stringify(enabled.preCheckFrame) === JSON.stringify(ablated.preCheckFrame) &&
    enabled.preCheckFrame.blobs.length === 0;

  const reasons: string[] = [];
  const invalid =
    !deterministic ||
    !physicalMatchBeforeCheck ||
    !currentPrivateEvidenceMatch ||
    enabled.initialBlobCount !== 1 ||
    ablated.initialBlobCount !== 1 ||
    enabled.firstOcclusionTick !== 51 ||
    ablated.firstOcclusionTick !== 51 ||
    enabled.hiddenLeakCount !== 0 ||
    ablated.hiddenLeakCount !== 0 ||
    !enabled.withinRangeThroughoutHidden ||
    !ablated.withinRangeThroughoutHidden ||
    enabled.preHiddenTargetDisplacement > 1e-6 ||
    ablated.preHiddenTargetDisplacement > 1e-6 ||
    enabled.hiddenTargetDisplacement < P02A_MIN_DISPLACEMENT ||
    ablated.hiddenTargetDisplacement < P02A_MIN_DISPLACEMENT;

  if (invalid) {
    if (!deterministic) reasons.push('repeat is nondeterministic');
    if (!physicalMatchBeforeCheck) reasons.push('physical states not matched before CHECK');
    if (!currentPrivateEvidenceMatch) reasons.push('current P0 evidence not matched/empty');
    if (enabled.firstOcclusionTick !== 51 || ablated.firstOcclusionTick !== 51) {
      reasons.push('frozen P02b first-occlusion timing did not reproduce');
    }
    if (enabled.initialBlobCount !== 1 || ablated.initialBlobCount !== 1) {
      reasons.push('frozen P02b initial visibility did not reproduce');
    }
    if (enabled.hiddenLeakCount || ablated.hiddenLeakCount) {
      reasons.push('hidden P0 leaked');
    }
    if (!enabled.withinRangeThroughoutHidden || !ablated.withinRangeThroughoutHidden) {
      reasons.push('target exceeded sensor range');
    }
    if (
      enabled.preHiddenTargetDisplacement > 1e-6 ||
      ablated.preHiddenTargetDisplacement > 1e-6 ||
      enabled.hiddenTargetDisplacement < P02A_MIN_DISPLACEMENT ||
      ablated.hiddenTargetDisplacement < P02A_MIN_DISPLACEMENT
    ) {
      reasons.push('frozen material target conditions did not reproduce');
    }
    return {
      outcome: 'INCONCLUSIVE',
      deterministic,
      physicalMatchBeforeCheck,
      currentPrivateEvidenceMatch,
      enabled,
      ablated,
      reasons,
    };
  }

  // Scientific checks: a private historical observation must be the *only*
  // pre-action difference, must survive the hidden material change, and must
  // produce a real body action and a fresh legal P0 reading.
  if (enabled.historyBeforeHidden.lastSeen === null) {
    reasons.push('no legal private observation was stored before occlusion');
  }
  if (
    JSON.stringify(enabled.historyBeforeHidden) !==
    JSON.stringify(enabled.historyAfterHidden)
  ) {
    reasons.push('private history changed while target stayed hidden');
  }
  if (ablated.historyAfterHidden.lastSeen !== null) {
    reasons.push('memory ablation did not remove the private historical record');
  }
  if (enabled.firstCheckDrive !== -1 || ablated.firstCheckDrive !== 0) {
    reasons.push('first motor demand not causally separated by private history');
  }
  if (enabled.bodyDisplacementDuringCheck <= E0_RADIUS * 0.5) {
    reasons.push('enabled CHECK did not produce material body displacement');
  }
  if (ablated.bodyDisplacementDuringCheck > E0_RADIUS * 0.01) {
    reasons.push('ablated body did not remain materially quiescent');
  }
  if (enabled.firstNewBlobTick === null) {
    reasons.push('enabled CHECK did not yield a new legal P0 blob');
  }
  if (ablated.firstNewBlobTick !== null) {
    reasons.push('ablated actor received a new blob without CHECK');
  }

  return {
    outcome: reasons.length === 0 ? 'PASS' : 'FAIL',
    deterministic,
    physicalMatchBeforeCheck,
    currentPrivateEvidenceMatch,
    enabled,
    ablated,
    reasons,
  };
}
