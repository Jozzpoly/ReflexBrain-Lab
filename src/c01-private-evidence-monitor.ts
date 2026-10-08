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
  P02A_MAX_RANGE,
  senseP02aFrame,
  type P02aBlob,
  type P02aPrivateFrame,
} from './p02a-private-occlusion';

export const C01_TOTAL_TICKS = 360;
export const C01_PRIVATE_EVIDENCE_AGE = 180;
export const C01_PATROL_ODOMETRY = 3.0;
export const C01_CHECK_LIMIT = 110;
export const C01_EARLY_WORLD_EVENT = 95;
export const C01_LATE_WORLD_EVENT = 155;

export type C01Mode = 'PATROL' | 'QUIET' | 'CHECK' | 'REOBSERVED' | 'UNRESOLVED';
export type C01LastSeen = P02aBlob & { privateTick: number };
export type C01PrivateState = {
  privateTick: number;
  bodyOdom: number;
  lastSeen: C01LastSeen | null;
  mode: C01Mode;
  checkDuration: number;
};

export type C01Snapshot = {
  tick: number;
  actor: { x: number; y: number; rotation: number };
  actorVelocity: { x: number; y: number };
  target: { x: number; y: number };
  privateFrame: P02aPrivateFrame;
  privateState: C01PrivateState;
  demand: number;
  externalImpulseApplied: boolean;
};

export type C01Run = {
  variant: 'early' | 'late' | 'static' | 'ablated';
  worldEventTick: number | null;
  historyEnabled: boolean;
  firstLostTick: number | null;
  firstCheckTick: number | null;
  firstCheckPrivateAge: number | null;
  firstReobservedTick: number | null;
  firstCheckDemand: number | null;
  beforeCheckWorld: { actor: C01Snapshot['actor']; velocity: C01Snapshot['actorVelocity'] } | null;
  beforeCheckPrivateFrame: P02aPrivateFrame | null;
  lastSeenAtLoss: C01LastSeen | null;
  lastSeenImmediatelyBeforeCheck: C01LastSeen | null;
  hiddenPrivateLeakTicks: number[];
  targetStayedWithinRange: boolean;
  worldEventDisplacement: number;
  selfMotionAfterCheck: number;
  finalMode: C01Mode;
  trace: C01Snapshot[];
};

export type C01Campaign = {
  outcome: 'PASS' | 'FAIL' | 'INCONCLUSIVE';
  deterministic: boolean;
  eventTimingIndependent: boolean;
  sameCurrentEvidenceAtCheck: boolean;
  sameBodyStateBeforeCheck: boolean;
  early: C01Run;
  late: C01Run;
  staticWorld: C01Run;
  ablated: C01Run;
  reasons: string[];
};

function copyBlob(blob: P02aBlob, privateTick: number): C01LastSeen {
  return { ...blob, privateTick };
}
function copyLast(v: C01LastSeen | null): C01LastSeen | null {
  return v === null ? null : { ...v };
}
function copyFrame(v: P02aPrivateFrame): P02aPrivateFrame {
  return { blobs: v.blobs.map((b) => ({ ...b })) };
}
function xy(rb: any): { x: number; y: number } {
  const p = rb.translation();
  return { x: p.x, y: p.y };
}
function dist(a: { x: number; y: number }, b: { x: number; y: number }): number {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

// This is the *entire* actor-private policy interface. World, target identity,
// research impulse schedule and simulator timeline are never passed in.
export class C01AuthoredMonitor {
  private tick = 0;
  private odometry = 0;
  private lastSeen: C01LastSeen | null = null;
  private mode: C01Mode = 'PATROL';
  private checkDuration = 0;

  constructor(private readonly recordLegalHistory: boolean) {}

  seedLegalObservation(frame: P02aPrivateFrame): void {
    if (this.recordLegalHistory && frame.blobs.length > 0) {
      this.lastSeen = copyBlob(frame.blobs[0], 0);
    }
  }

  step(previousPrivateFrame: P02aPrivateFrame, selfMotion: number): {
    drive: number; state: C01PrivateState; age: number | null;
  } {
    this.tick++;
    // Perfect-proprioception null. Host computes body-local delta at sensing
    // boundary; policy only receives scalar self-motion, not World pose.
    this.odometry += selfMotion;
    if (this.recordLegalHistory && previousPrivateFrame.blobs.length > 0) {
      this.lastSeen = copyBlob(previousPrivateFrame.blobs[0], this.tick);
    }

    const visible = previousPrivateFrame.blobs.length > 0;
    const age = this.lastSeen === null ? null : this.tick - this.lastSeen.privateTick;
    let drive = 0;

    if (this.mode === 'UNRESOLVED' || this.mode === 'REOBSERVED') {
      drive = 0;
    } else if (this.mode === 'CHECK') {
      if (visible) {
        this.mode = 'REOBSERVED';
        drive = 0;
      } else if (this.checkDuration >= C01_CHECK_LIMIT) {
        this.mode = 'UNRESOLVED';
        drive = 0;
      } else {
        this.checkDuration++;
        drive = -1;
      }
    } else if (!visible && age !== null && age >= C01_PRIVATE_EVIDENCE_AGE) {
      // Triggered by actor-private evidence age, not any World event tick.
      this.mode = 'CHECK';
      this.checkDuration = 1;
      drive = -1;
    } else if (this.mode === 'PATROL' && this.odometry < C01_PATROL_ODOMETRY) {
      drive = 1;
    } else {
      this.mode = 'QUIET';
      drive = 0;
    }

    return { drive, age, state: this.getState() };
  }

  getState(): C01PrivateState {
    return {
      privateTick: this.tick,
      bodyOdom: this.odometry,
      lastSeen: copyLast(this.lastSeen),
      mode: this.mode,
      checkDuration: this.checkDuration,
    };
  }
}

function runOnce(
  variant: C01Run['variant'],
  worldEventTick: number | null,
  historyEnabled: boolean,
): C01Run {
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

    // Frozen P02a broad-phase query readiness.
    world.step();

    let frame = senseP02aFrame(world, actor, [target]);
    const controller = new C01AuthoredMonitor(historyEnabled);
    controller.seedLegalObservation(frame);

    const trace: C01Snapshot[] = [];
    const initialActor = xy(actor.rb);
    const initialTarget = xy(targetRb);
    const initialVelocity = actor.rb.linvel();
    trace.push({
      tick: 0,
      actor: { ...initialActor, rotation: actor.rb.rotation() },
      actorVelocity: { x: initialVelocity.x, y: initialVelocity.y },
      target: initialTarget,
      privateFrame: copyFrame(frame),
      privateState: controller.getState(),
      demand: 0,
      externalImpulseApplied: false,
    });

    let firstLostTick: number | null = null;
    let firstCheckTick: number | null = null;
    let firstCheckPrivateAge: number | null = null;
    let firstReobservedTick: number | null = null;
    let firstCheckDemand: number | null = null;
    let lastSeenAtLoss: C01LastSeen | null = null;
    let lastSeenImmediatelyBeforeCheck: C01LastSeen | null = null;
    let beforeCheckWorld: C01Run['beforeCheckWorld'] = null;
    let beforeCheckPrivateFrame: C01Run['beforeCheckPrivateFrame'] = null;
    let worldEventDisplacement = 0;
    let targetBeforeEvent: { x: number; y: number } | null = null;
    const hiddenPrivateLeakTicks: number[] = [];
    let targetStayedWithinRange = true;
    let actorAtCheckStart: { x: number; y: number } | null = null;
    let lastSelfMotion = 0;
    let wasVisible = frame.blobs.length > 0;
    let checkedAlready = false;

    for (let tick = 1; tick <= C01_TOTAL_TICKS; tick++) {
      const priorActor = xy(actor.rb);
      const decision = controller.step(frame, lastSelfMotion);

      if (decision.state.mode === 'CHECK' && firstCheckTick === null) {
        firstCheckTick = tick;
        firstCheckPrivateAge = decision.age;
        firstCheckDemand = decision.drive;
        lastSeenImmediatelyBeforeCheck = copyLast(decision.state.lastSeen);
        beforeCheckWorld = {
          actor: { ...priorActor, rotation: actor.rb.rotation() },
          velocity: { ...actor.rb.linvel() },
        };
        beforeCheckPrivateFrame = copyFrame(frame);
        actorAtCheckStart = { ...priorActor };
      }

      // This is a researcher-controlled WORLD intervention. It cannot
      // notify or call into the private actor controller.
      const externalImpulseApplied = worldEventTick === tick;
      if (externalImpulseApplied) {
        targetBeforeEvent = xy(targetRb);
        targetRb.applyImpulse({ x: P02A_HIDDEN_IMPULSE, y: 0 }, true);
      }

      applyE0Demand(actor.rb, decision.drive, 0);
      world.step();
      const actorPos = xy(actor.rb);
      lastSelfMotion = dist(priorActor, actorPos);
      const targetPos = xy(targetRb);

      frame = senseP02aFrame(world, actor, [target]);
      const visible = frame.blobs.length > 0;
      if (firstLostTick === null && wasVisible && !visible) {
        firstLostTick = tick;
        lastSeenAtLoss = copyLast(decision.state.lastSeen);
      }
      wasVisible = visible;

      if (firstLostTick !== null && firstCheckTick === null && visible) {
        hiddenPrivateLeakTicks.push(tick);
      }
      if (firstLostTick !== null && firstCheckTick === null &&
          dist(actorPos, targetPos) > P02A_MAX_RANGE) {
        targetStayedWithinRange = false;
      }
      if (firstCheckTick !== null && firstReobservedTick === null &&
          tick >= firstCheckTick && visible) {
        firstReobservedTick = tick;
      }
      if (firstCheckTick !== null) checkedAlready = true;
      if (targetBeforeEvent !== null) {
        worldEventDisplacement = dist(targetBeforeEvent, targetPos);
      }

      const velocity = actor.rb.linvel();
      trace.push({
        tick,
        actor: { ...actorPos, rotation: actor.rb.rotation() },
        actorVelocity: { x: velocity.x, y: velocity.y },
        target: { ...targetPos },
        privateFrame: copyFrame(frame),
        privateState: decision.state,
        demand: decision.drive,
        externalImpulseApplied,
      });
    }

    const selfMotionAfterCheck = actorAtCheckStart === null
      ? 0 : dist(actorAtCheckStart, xy(actor.rb));
    const finalMode = controller.getState().mode;

    return {
      variant, worldEventTick, historyEnabled,
      firstLostTick, firstCheckTick, firstCheckPrivateAge,
      firstReobservedTick, firstCheckDemand,
      beforeCheckWorld, beforeCheckPrivateFrame,
      lastSeenAtLoss, lastSeenImmediatelyBeforeCheck,
      hiddenPrivateLeakTicks, targetStayedWithinRange,
      worldEventDisplacement, selfMotionAfterCheck,
      finalMode, trace,
    };
  } finally {
    world.free();
  }
}

export function runC01Campaign(includeTraces = true): C01Campaign {
  const early = runOnce('early', C01_EARLY_WORLD_EVENT, true);
  const late = runOnce('late', C01_LATE_WORLD_EVENT, true);
  const staticWorld = runOnce('static', null, true);
  const ablated = runOnce('ablated', C01_LATE_WORLD_EVENT, false);

  const repeats = [
    runOnce('early', C01_EARLY_WORLD_EVENT, true),
    runOnce('late', C01_LATE_WORLD_EVENT, true),
    runOnce('static', null, true),
    runOnce('ablated', C01_LATE_WORLD_EVENT, false),
  ];
  const variants = [early, late, staticWorld, ablated];
  const deterministic = variants.every(
    (run, i) => JSON.stringify(run) === JSON.stringify(repeats[i]),
  );

  const sameCurrentEvidenceAtCheck =
    late.beforeCheckPrivateFrame !== null &&
    JSON.stringify(late.beforeCheckPrivateFrame) ===
    JSON.stringify(ablated.trace[late.firstCheckTick === null ? 0 : late.firstCheckTick - 1].privateFrame);
  const sameBodyStateBeforeCheck =
    late.beforeCheckWorld !== null &&
    JSON.stringify(late.beforeCheckWorld) === JSON.stringify(
      (() => {
        const row = ablated.trace[late.firstCheckTick === null ? 0 : late.firstCheckTick - 1];
        return { actor: row.actor, velocity: row.actorVelocity };
      })(),
    );
  const eventTimingIndependent = [early, late, staticWorld].every(
    (run) => run.firstCheckTick !== null &&
      run.firstCheckTick === early.firstCheckTick &&
      run.firstCheckPrivateAge === C01_PRIVATE_EVIDENCE_AGE,
  );

  const reasons: string[] = [];
  const invalid =
    !deterministic ||
    !sameCurrentEvidenceAtCheck ||
    !sameBodyStateBeforeCheck ||
    variants.some((run) =>
      run.trace[0].privateFrame.blobs.length !== 1 ||
      run.firstLostTick === null ||
      !run.targetStayedWithinRange ||
      run.hiddenPrivateLeakTicks.length > 0
    );

  if (invalid) {
    if (!deterministic) reasons.push('nondeterministic replay');
    if (!sameCurrentEvidenceAtCheck) reasons.push('comparison P0 evidence not matched');
    if (!sameBodyStateBeforeCheck) reasons.push('comparison actor state not matched');
    for (const run of variants) {
      if (run.trace[0].privateFrame.blobs.length !== 1) reasons.push(run.variant + ': target not initially visible');
      if (run.firstLostTick === null) reasons.push(run.variant + ': no actor-caused P0 loss');
      if (!run.targetStayedWithinRange) reasons.push(run.variant + ': target left sensor range before CHECK');
      if (run.hiddenPrivateLeakTicks.length > 0) reasons.push(run.variant + ': premature visible P0 while supposedly hidden');
    }
  } else {
    if (!eventTimingIndependent) reasons.push('CHECK trigger changed with hidden World event timing');
    for (const run of [early, late, staticWorld]) {
      if (run.lastSeenAtLoss === null) reasons.push(run.variant + ': no prior legal P0 memory');
      if (run.lastSeenImmediatelyBeforeCheck === null ||
          JSON.stringify(run.lastSeenAtLoss) !== JSON.stringify(run.lastSeenImmediatelyBeforeCheck)) {
        reasons.push(run.variant + ': private history mutated while P0 hidden');
      }
      if (run.firstCheckDemand !== -1) reasons.push(run.variant + ': no CHECK motor command');
      if (run.selfMotionAfterCheck <= E0_RADIUS * 0.5) reasons.push(run.variant + ': no material CHECK movement');
      if (run.firstReobservedTick === null ||
          run.firstCheckTick === null ||
          run.firstReobservedTick - run.firstCheckTick > C01_CHECK_LIMIT) {
        reasons.push(run.variant + ': CHECK did not reobserve in time');
      }
      if (run.worldEventTick !== null &&
          run.worldEventDisplacement < E0_RADIUS * 0.1) {
        reasons.push(run.variant + ': hidden physical intervention ineffective');
      }
    }
    if (ablated.firstCheckTick !== null || ablated.firstReobservedTick !== null) {
      reasons.push('memory ablation unexpectedly triggered CHECK');
    }
    if (ablated.trace.some((row) => row.privateState.lastSeen !== null)) {
      reasons.push('memory ablation contaminated private state');
    }
    if (ablated.finalMode !== 'QUIET') reasons.push('memory-ablated actor failed to become quiescent');
  }

  const outcome: C01Campaign['outcome'] = invalid
    ? 'INCONCLUSIVE' : reasons.length === 0 ? 'PASS' : 'FAIL';

  if (!includeTraces) {
    for (const run of variants) run.trace = [];
  }
  return {
    outcome, deterministic, eventTimingIndependent,
    sameCurrentEvidenceAtCheck, sameBodyStateBeforeCheck,
    early, late, staticWorld, ablated, reasons,
  };
}
