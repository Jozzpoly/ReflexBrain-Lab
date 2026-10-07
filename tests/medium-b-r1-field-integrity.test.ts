import { beforeAll, describe, expect, it } from 'vitest';
import { initE0Rapier } from '../src/e0-body-seam';
import { FIELD_MAX_LOOSE, OwnerFieldLab, type FieldMode } from '../src/owner-field-lab';

beforeAll(async () => {
  await initE0Rapier();
});

type SoakSummary = {
  ticks: number;
  maxAbsCoord: number;
  maxSpeed: number;
  sweeperReversals: number;
  modeTransitions: number;
  modeTicks: Record<FieldMode, number>;
  visibleTicks: number;
  hiddenTicks: number;
  finalMode: FieldMode;
  finalEvidenceAge: number | null;
  finalActor: [number, number, number];
  finalTarget: [number, number];
  finalSweeper: [number, number, -1 | 1];
  internalEventCount: number;
  publicEventCount: number;
};

function finiteSnapshotValues(s: ReturnType<OwnerFieldLab['snapshot']>): number[] {
  return [
    s.actor.x, s.actor.y, s.actor.rotation, s.actor.vx, s.actor.vy,
    s.target.x, s.target.y, s.target.vx, s.target.vy,
    s.sweeper.x, s.sweeper.y, s.sweeper.vx, s.sweeper.vy,
    s.privateState.privateTick, s.privateState.bodyOdom, s.privateState.checkTicks,
    ...(s.privateState.evidenceAge === null ? [] : [s.privateState.evidenceAge]),
    ...s.loose.flatMap((b) => [b.x, b.y, b.radius]),
  ];
}

function summarizeSoak(ticks = 50_000): SoakSummary {
  const lab = new OwnerFieldLab();
  try {
    let maxAbsCoord = 0;
    let maxSpeed = 0;
    let reversals = 0;
    let transitions = 0;
    let visibleTicks = 0;
    let hiddenTicks = 0;
    let prev = lab.snapshot();
    let prevDir = prev.sweeper.direction;
    let prevMode = prev.privateState.mode;
    const modeTicks: Record<FieldMode, number> = {
      ROAM: 0, BOUNCE: 0, CHECK: 0, YIELD: 0, PAUSED: 0,
    };

    for (let i = 0; i < ticks; i += 1) {
      lab.step();
      const s = lab.snapshot();

      for (const value of finiteSnapshotValues(s)) {
        if (!Number.isFinite(value)) throw new Error(`non-finite state at tick ${s.tick}: ${value}`);
      }

      maxAbsCoord = Math.max(
        maxAbsCoord,
        Math.abs(s.actor.x), Math.abs(s.actor.y),
        Math.abs(s.target.x), Math.abs(s.target.y),
        Math.abs(s.sweeper.x), Math.abs(s.sweeper.y),
        ...s.loose.flatMap((b) => [Math.abs(b.x), Math.abs(b.y)]),
      );
      maxSpeed = Math.max(
        maxSpeed,
        Math.hypot(s.actor.vx, s.actor.vy),
        Math.hypot(s.target.vx, s.target.vy),
        Math.hypot(s.sweeper.vx, s.sweeper.vy),
      );

      if (s.sweeper.direction !== prevDir) {
        reversals += 1;
        prevDir = s.sweeper.direction;
      }
      if (s.privateState.mode !== prevMode) {
        transitions += 1;
        prevMode = s.privateState.mode;
      }
      modeTicks[s.privateState.mode] += 1;
      if (s.privateFrame.blobs.length > 0) visibleTicks += 1;
      else hiddenTicks += 1;

      if (maxAbsCoord >= 50) throw new Error(`catastrophic body escape at tick ${s.tick}: ${maxAbsCoord}`);
      prev = s;
    }

    const end = prev;
    const internalEventCount = ((lab as any).events as unknown[]).length;
    return {
      ticks,
      maxAbsCoord,
      maxSpeed,
      sweeperReversals: reversals,
      modeTransitions: transitions,
      modeTicks,
      visibleTicks,
      hiddenTicks,
      finalMode: end.privateState.mode,
      finalEvidenceAge: end.privateState.evidenceAge,
      finalActor: [end.actor.x, end.actor.y, end.actor.rotation],
      finalTarget: [end.target.x, end.target.y],
      finalSweeper: [end.sweeper.x, end.sweeper.y, end.sweeper.direction],
      internalEventCount,
      publicEventCount: end.events.length,
    };
  } finally {
    lab.destroy();
  }
}

type AbuseSummary = {
  ticks: number;
  maxAbsCoord: number;
  maxSpeed: number;
  finalMode: FieldMode;
  finalMemoryEnabled: boolean;
  finalSensorEnabled: boolean;
  finalActorEnabled: boolean;
  finalSweeperEnabled: boolean;
  finalOccluderEnabled: boolean;
  finalLoose: number;
  capRejected: boolean;
  motorCutActorMotion: number;
  motorCutSweeperMotion: number;
  sweeperOffMotion: number;
  sweeperOnMotion: number;
  memoryClearedObserved: boolean;
  sensorGateEmptyObserved: boolean;
  continuedAfterRestore: boolean;
  internalEventCount: number;
};

function dist(a: {x:number;y:number}, b: {x:number;y:number}): number {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

function runAbuse(): AbuseSummary {
  const lab = new OwnerFieldLab();
  try {
    let maxAbsCoord = 0;
    let maxSpeed = 0;
    let capRejected = false;
    let motorCutActorMotion = 0;
    let motorCutSweeperMotion = 0;
    let sweeperOffMotion = 0;
    let sweeperOnMotion = 0;
    let memoryClearedObserved = false;
    let sensorGateEmptyObserved = false;
    let continuedAfterRestore = false;

    const inspect = () => {
      const s = lab.snapshot();
      for (const value of finiteSnapshotValues(s)) {
        if (!Number.isFinite(value)) throw new Error(`non-finite abuse state at tick ${s.tick}: ${value}`);
      }
      maxAbsCoord = Math.max(
        maxAbsCoord,
        Math.abs(s.actor.x), Math.abs(s.actor.y),
        Math.abs(s.target.x), Math.abs(s.target.y),
        Math.abs(s.sweeper.x), Math.abs(s.sweeper.y),
        ...s.loose.flatMap((b) => [Math.abs(b.x), Math.abs(b.y)]),
      );
      maxSpeed = Math.max(
        maxSpeed,
        Math.hypot(s.actor.vx, s.actor.vy),
        Math.hypot(s.target.vx, s.target.vy),
        Math.hypot(s.sweeper.vx, s.sweeper.vy),
      );
      if (maxAbsCoord >= 50) throw new Error(`catastrophic abuse escape at tick ${s.tick}: ${maxAbsCoord}`);
      return s;
    };

    const step = (n: number) => {
      for (let i = 0; i < n; i += 1) {
        lab.step();
        inspect();
      }
    };

    step(80);
    lab.setTargetPosition(2.2, 1.8);
    step(140);
    lab.shoveTarget(1.3, -0.7);
    step(180);

    lab.setMemoryEnabled(false);
    memoryClearedObserved = lab.snapshot().privateState.lastSeen === null;
    step(60);
    lab.setMemoryEnabled(true);
    lab.setTargetPosition(-1.7, 1.8);
    step(60);

    lab.setSensorEnabled(false);
    step(40);
    sensorGateEmptyObserved = lab.snapshot().privateFrame.blobs.length === 0;
    lab.setSensorEnabled(true);
    step(80);

    // Motor-authority cut: actor body should nearly stop while the independent
    // sweeper continues to evolve in the same physical World.
    const motorA = inspect();
    lab.setActorEnabled(false);
    step(180);
    const motorB = inspect();
    motorCutActorMotion = dist(motorA.actor, motorB.actor);
    motorCutSweeperMotion = dist(motorA.sweeper, motorB.sweeper);
    lab.setActorEnabled(true);
    step(80);

    // Sweeper cut: compare short disabled vs enabled windows from nearby state.
    lab.setSweeperEnabled(false);
    const swA = inspect();
    step(120);
    const swB = inspect();
    sweeperOffMotion = dist(swA.sweeper, swB.sweeper);
    lab.setSweeperEnabled(true);
    const swC = inspect();
    step(120);
    const swD = inspect();
    sweeperOnMotion = dist(swC.sweeper, swD.sweeper);

    lab.setOccluderEnabled(false);
    lab.setTargetPosition(0.0, 0.0);
    step(30);
    lab.setOccluderEnabled(true);
    step(120);

    for (let i = 0; i < FIELD_MAX_LOOSE; i += 1) {
      const ok = lab.spawnLoose(-1.2 + i * 0.16, -2.65);
      if (!ok) throw new Error(`loose body capacity rejected early at ${i}`);
    }
    capRejected = lab.spawnLoose(0, -2.65) === false;
    step(600);

    lab.clearLoose();
    step(30);
    lab.spawnLoose(0.8, -2.65);
    lab.spawnLoose(1.2, -2.65);
    lab.shoveActor(0.7, -0.5);
    lab.clearActorMemory();
    step(300);

    // Boundary and rapid-cut abuse.
    const boundaryTargets: Array<[number, number]> = [
      [6.7, 3.75], [-6.7, 3.75], [6.7, -3.75], [-6.7, -3.75],
      [0, 0], [2.2, 1.8], [-1.8, 1.8],
    ];
    for (let cycle = 0; cycle < 10; cycle += 1) {
      const [x, y] = boundaryTargets[cycle % boundaryTargets.length];
      lab.setTargetPosition(x, y);
      lab.setMemoryEnabled(cycle % 2 === 0);
      lab.setSensorEnabled(cycle % 3 !== 0);
      lab.setOccluderEnabled(cycle % 4 !== 0);
      step(90);
      lab.setMemoryEnabled(true);
      lab.setSensorEnabled(true);
      lab.setOccluderEnabled(true);
      lab.shoveTarget(cycle % 2 ? 0.8 : -0.8, cycle % 3 ? 0.4 : -0.4);
      step(90);
    }

    // Continue to the frozen 12k horizon with all channels restored.
    lab.setMemoryEnabled(true);
    lab.setSensorEnabled(true);
    lab.setActorEnabled(true);
    lab.setSweeperEnabled(true);
    lab.setOccluderEnabled(true);
    const beforeTail = lab.snapshot().tick;
    if (beforeTail > 11_500) throw new Error(`abuse script exceeded tail budget at ${beforeTail}`);
    step(12_000 - beforeTail);
    const end = inspect();
    const tickBeforeContinue = end.tick;
    step(10);
    continuedAfterRestore = lab.snapshot().tick === tickBeforeContinue + 10;

    return {
      ticks: 12_010,
      maxAbsCoord,
      maxSpeed,
      finalMode: lab.snapshot().privateState.mode,
      finalMemoryEnabled: lab.snapshot().privateState.memoryEnabled,
      finalSensorEnabled: lab.snapshot().privateState.sensorEnabled,
      finalActorEnabled: lab.snapshot().privateState.actorEnabled,
      finalSweeperEnabled: lab.snapshot().flags.sweeperEnabled,
      finalOccluderEnabled: lab.snapshot().flags.occluderEnabled,
      finalLoose: lab.snapshot().loose.length,
      capRejected,
      motorCutActorMotion,
      motorCutSweeperMotion,
      sweeperOffMotion,
      sweeperOnMotion,
      memoryClearedObserved,
      sensorGateEmptyObserved,
      continuedAfterRestore,
      internalEventCount: ((lab as any).events as unknown[]).length,
    };
  } finally {
    lab.destroy();
  }
}

describe('MEDIUM-B/R1 Field Lab integrity campaign', () => {
  it('survives a 50k-tick unattended soak deterministically', () => {
    const a = summarizeSoak();
    const b = summarizeSoak();

    console.log('MEDIUM_B_R1_SOAK ' + JSON.stringify(a));

    expect(a).toEqual(b);
    expect(a.maxAbsCoord).toBeLessThan(50);
    expect(a.sweeperReversals).toBeGreaterThan(10);
    expect(a.internalEventCount).toBeLessThanOrEqual(160);
    expect(a.publicEventCount).toBeLessThanOrEqual(18);
  }, 30_000);

  it('survives the frozen intervention-abuse sequence deterministically', () => {
    const a = runAbuse();
    const b = runAbuse();

    console.log('MEDIUM_B_R1_ABUSE ' + JSON.stringify(a));

    expect(a).toEqual(b);
    expect(a.maxAbsCoord).toBeLessThan(50);
    expect(a.capRejected).toBe(true);
    expect(a.memoryClearedObserved).toBe(true);
    expect(a.sensorGateEmptyObserved).toBe(true);
    expect(a.motorCutActorMotion).toBeLessThan(0.12);
    expect(a.motorCutSweeperMotion).toBeGreaterThan(0.05);
    // A dynamic body may coast for a while after force is removed; require
    // enabled motion to be materially greater rather than assuming zero drift.
    expect(a.sweeperOnMotion).toBeGreaterThan(a.sweeperOffMotion + 0.03);
    expect(a.finalMemoryEnabled).toBe(true);
    expect(a.finalSensorEnabled).toBe(true);
    expect(a.finalActorEnabled).toBe(true);
    expect(a.finalSweeperEnabled).toBe(true);
    expect(a.finalOccluderEnabled).toBe(true);
    expect(a.continuedAfterRestore).toBe(true);
    expect(a.internalEventCount).toBeLessThanOrEqual(160);
  }, 30_000);
});
