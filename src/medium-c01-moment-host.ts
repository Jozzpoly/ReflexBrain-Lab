import {
  E0_RAPIER as RAPIER,
  applyE0Demand,
  createE0Body,
  createE0Wall,
  createE0World,
  type E0Body,
} from './e0-body-seam';
import {
  C01_CHECK_LIMIT,
  C01_LATE_WORLD_EVENT,
  C01_PATROL_ODOMETRY,
  C01_PRIVATE_EVIDENCE_AGE,
  type C01LastSeen,
  type C01Mode,
} from './c01-private-evidence-monitor';
import {
  P02A_HIDDEN_IMPULSE,
  senseP02aFrame,
  type P02aBlob,
  type P02aPrivateFrame,
} from './p02a-private-occlusion';
import {
  HostBindingRegistry,
  type HostBindingId,
} from './medium-host-binding-registry';
import {
  captureExperimentMomentV1,
  restoreExperimentMomentV1,
  type ExperimentMomentV1,
} from './medium-experiment-moment-v1';
import type { ExperimentProvenance } from './medium-experiment-moment';

export const R5_BUILD_IDENTITY = 'medium-c-r5-c01-occupant-v1';
export const R5_PRIVATE_SCHEMA = 'reflexbrain.c01-private-sidecar.v0';
export const R5_CAPTURE_TICK = 200;
export const R5_EXACT_CONTINUATION_TICKS = 220;

export type C01MomentPrivateState = {
  privateTick: number;
  bodyOdom: number;
  lastSeen: C01LastSeen | null;
  mode: C01Mode;
  checkDuration: number;
  lastSelfMotion: number;
};

export type C01MomentWorldProcessState = {
  causalTick: number;
  worldEventTick: number;
  worldEventApplied: boolean;
  roles: {
    actor: HostBindingId;
    target: HostBindingId;
    occluder: HostBindingId;
  };
};

export type C01MomentSnapshot = {
  causalTick: number;
  actor: {
    x: number;
    y: number;
    rotation: number;
    vx: number;
    vy: number;
  };
  target: {
    x: number;
    y: number;
    vx: number;
    vy: number;
  };
  currentFrame: P02aPrivateFrame;
  privateState: C01MomentPrivateState;
  worldEventApplied: boolean;
};

export type C01MomentStep = {
  tick: number;
  drive: number;
  age: number | null;
  currentFrame: P02aPrivateFrame;
  snapshot: C01MomentSnapshot;
};

type TargetBody = {
  rb: any;
  co: any;
  radius: number;
};

const PRIVATE_KEYS = [
  'bodyOdom',
  'checkDuration',
  'lastSeen',
  'lastSelfMotion',
  'mode',
  'privateTick',
].sort();

const LAST_SEEN_KEYS = [
  'apparentRadius',
  'bearing',
  'privateTick',
  'radialMotion',
  'range',
].sort();

function exactKeys(value: Record<string, unknown>, expected: string[]): boolean {
  return JSON.stringify(Object.keys(value).sort()) === JSON.stringify(expected);
}

function finiteNumber(value: unknown, label: string): number {
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    throw new Error(`invalid ${label}`);
  }
  return value;
}

function copyBlob(blob: P02aBlob, privateTick: number): C01LastSeen {
  return {
    bearing: blob.bearing,
    range: blob.range,
    radialMotion: blob.radialMotion,
    apparentRadius: blob.apparentRadius,
    privateTick,
  };
}

function copyFrame(frame: P02aPrivateFrame): P02aPrivateFrame {
  return { blobs: frame.blobs.map((blob) => ({ ...blob })) };
}

function copyPrivateState(state: C01MomentPrivateState): C01MomentPrivateState {
  return {
    privateTick: state.privateTick,
    bodyOdom: state.bodyOdom,
    lastSeen: state.lastSeen === null ? null : { ...state.lastSeen },
    mode: state.mode,
    checkDuration: state.checkDuration,
    lastSelfMotion: state.lastSelfMotion,
  };
}

export function validateC01MomentPrivateState(
  value: unknown,
): C01MomentPrivateState {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new Error('C01 private sidecar must be an object');
  }
  const record = value as Record<string, unknown>;
  if (!exactKeys(record, PRIVATE_KEYS)) {
    throw new Error('C01 private sidecar contains unknown/missing fields');
  }

  const privateTick = finiteNumber(record.privateTick, 'privateTick');
  const bodyOdom = finiteNumber(record.bodyOdom, 'bodyOdom');
  const checkDuration = finiteNumber(record.checkDuration, 'checkDuration');
  const lastSelfMotion = finiteNumber(record.lastSelfMotion, 'lastSelfMotion');

  if (
    !Number.isInteger(privateTick) ||
    privateTick < 0 ||
    !Number.isInteger(checkDuration) ||
    checkDuration < 0 ||
    bodyOdom < 0 ||
    lastSelfMotion < 0
  ) {
    throw new Error('C01 private sidecar numeric domain invalid');
  }

  const modes: C01Mode[] = [
    'PATROL',
    'QUIET',
    'CHECK',
    'REOBSERVED',
    'UNRESOLVED',
  ];
  if (typeof record.mode !== 'string' || !modes.includes(record.mode as C01Mode)) {
    throw new Error('C01 private sidecar mode invalid');
  }

  let lastSeen: C01LastSeen | null = null;
  if (record.lastSeen !== null) {
    if (
      !record.lastSeen ||
      typeof record.lastSeen !== 'object' ||
      Array.isArray(record.lastSeen)
    ) {
      throw new Error('C01 private lastSeen invalid');
    }
    const seen = record.lastSeen as Record<string, unknown>;
    if (!exactKeys(seen, LAST_SEEN_KEYS)) {
      throw new Error('C01 private lastSeen contains unknown/missing fields');
    }
    const seenTick = finiteNumber(seen.privateTick, 'lastSeen.privateTick');
    if (!Number.isInteger(seenTick) || seenTick < 0 || seenTick > privateTick) {
      throw new Error('C01 private lastSeen tick invalid');
    }
    lastSeen = {
      privateTick: seenTick,
      bearing: finiteNumber(seen.bearing, 'lastSeen.bearing'),
      range: finiteNumber(seen.range, 'lastSeen.range'),
      radialMotion: finiteNumber(seen.radialMotion, 'lastSeen.radialMotion'),
      apparentRadius: finiteNumber(
        seen.apparentRadius,
        'lastSeen.apparentRadius',
      ),
    };
  }

  return {
    privateTick,
    bodyOdom,
    lastSeen,
    mode: record.mode as C01Mode,
    checkDuration,
    lastSelfMotion,
  };
}

function validateWorldProcessState(
  value: C01MomentWorldProcessState,
): C01MomentWorldProcessState {
  if (!value || typeof value !== 'object') {
    throw new Error('C01 World/process sidecar missing');
  }
  if (!Number.isInteger(value.causalTick) || value.causalTick < 0) {
    throw new Error('invalid causalTick');
  }
  if (!Number.isInteger(value.worldEventTick) || value.worldEventTick < 0) {
    throw new Error('invalid worldEventTick');
  }
  if (typeof value.worldEventApplied !== 'boolean') {
    throw new Error('invalid worldEventApplied');
  }
  if (
    !value.roles ||
    !value.roles.actor ||
    !value.roles.target ||
    !value.roles.occluder
  ) {
    throw new Error('missing required C01 host roles');
  }
  return {
    causalTick: value.causalTick,
    worldEventTick: value.worldEventTick,
    worldEventApplied: value.worldEventApplied,
    roles: { ...value.roles },
  };
}

function position(rb: any): { x: number; y: number } {
  const p = rb.translation();
  return { x: p.x, y: p.y };
}

function velocity(rb: any): { x: number; y: number } {
  const v = rb.linvel();
  return { x: v.x, y: v.y };
}

function distance(
  a: { x: number; y: number },
  b: { x: number; y: number },
): number {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

function initialPrivateState(frame: P02aPrivateFrame): C01MomentPrivateState {
  if (frame.blobs.length !== 1) {
    throw new Error('R5 donor requires exactly one initial legal P0 blob');
  }
  return {
    privateTick: 0,
    bodyOdom: 0,
    lastSeen: copyBlob(frame.blobs[0], 0),
    mode: 'PATROL',
    checkDuration: 0,
    lastSelfMotion: 0,
  };
}

function decide(
  state: C01MomentPrivateState,
  previousPrivateFrame: P02aPrivateFrame,
): { state: C01MomentPrivateState; drive: number; age: number | null } {
  const next = copyPrivateState(state);
  next.privateTick += 1;
  next.bodyOdom += next.lastSelfMotion;

  const visible = previousPrivateFrame.blobs.length > 0;
  if (visible) {
    next.lastSeen = copyBlob(previousPrivateFrame.blobs[0], next.privateTick);
  }

  const age =
    next.lastSeen === null
      ? null
      : next.privateTick - next.lastSeen.privateTick;

  let drive = 0;
  if (next.mode === 'UNRESOLVED' || next.mode === 'REOBSERVED') {
    drive = 0;
  } else if (next.mode === 'CHECK') {
    if (visible) {
      next.mode = 'REOBSERVED';
      drive = 0;
    } else if (next.checkDuration >= C01_CHECK_LIMIT) {
      next.mode = 'UNRESOLVED';
      drive = 0;
    } else {
      next.checkDuration += 1;
      drive = -1;
    }
  } else if (
    !visible &&
    age !== null &&
    age >= C01_PRIVATE_EVIDENCE_AGE
  ) {
    next.mode = 'CHECK';
    next.checkDuration = 1;
    drive = -1;
  } else if (
    next.mode === 'PATROL' &&
    next.bodyOdom < C01_PATROL_ODOMETRY
  ) {
    drive = 1;
  } else {
    next.mode = 'QUIET';
    drive = 0;
  }

  return { state: next, drive, age };
}

export class C01MomentHost {
  private currentFrame: P02aPrivateFrame;

  private constructor(
    readonly world: any,
    readonly registry: HostBindingRegistry,
    private processState: C01MomentWorldProcessState,
    private privateState: C01MomentPrivateState,
    readonly actor: E0Body,
    readonly target: TargetBody,
    readonly occluder: E0Body,
  ) {
    this.processState = validateWorldProcessState(processState);
    this.privateState = validateC01MomentPrivateState(privateState);
    this.currentFrame = senseP02aFrame(this.world, this.actor, [this.target]);
  }

  static create(): C01MomentHost {
    const world = createE0World();
    const registry = new HostBindingRegistry('c01-r5-root');

    const actor = createE0Body(world, -3, 2);
    actor.rb.setRotation(-Math.PI / 2, true);
    const occluder = createE0Wall(world, 0, 0, 0.16, 1.5);

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
    const target: TargetBody = { rb: targetRb, co: targetCo, radius: 0.35 };

    const roles = {
      actor: registry.allocate(
        { rb: actor.rb.handle, co: actor.co.handle },
        0,
      ),
      target: registry.allocate(
        { rb: target.rb.handle, co: target.co.handle },
        0,
      ),
      occluder: registry.allocate(
        { rb: occluder.rb.handle, co: occluder.co.handle },
        0,
      ),
    };

    // Frozen P02a query readiness step. This precedes causal tick 0.
    world.step();
    const frame = senseP02aFrame(world, actor, [target]);
    const host = new C01MomentHost(
      world,
      registry,
      {
        causalTick: 0,
        worldEventTick: C01_LATE_WORLD_EVENT,
        worldEventApplied: false,
        roles,
      },
      initialPrivateState(frame),
      actor,
      target,
      occluder,
    );
    host.currentFrame = copyFrame(frame);
    return host;
  }

  static restore(
    moment: ExperimentMomentV1<
      C01MomentWorldProcessState,
      C01MomentPrivateState
    >,
  ): C01MomentHost {
    const restored = restoreExperimentMomentV1(moment, {
      expectedBuildIdentity: R5_BUILD_IDENTITY,
      expectedOccupantPrivateStateSchema: R5_PRIVATE_SCHEMA,
      validateOccupantPrivateState: validateC01MomentPrivateState,
    });
    try {
      const processState = validateWorldProcessState(restored.processState);
      const actorBinding = restored.registry.resolve(
        restored.world,
        processState.roles.actor,
      );
      const targetBinding = restored.registry.resolve(
        restored.world,
        processState.roles.target,
      );
      const occluderBinding = restored.registry.resolve(
        restored.world,
        processState.roles.occluder,
      );
      if (!actorBinding || !targetBinding || !occluderBinding) {
        throw new Error('R5 required host role failed binding restore');
      }

      return new C01MomentHost(
        restored.world,
        restored.registry,
        processState,
        restored.occupantPrivateState,
        { rb: actorBinding.rb, co: actorBinding.co },
        { rb: targetBinding.rb, co: targetBinding.co, radius: 0.35 },
        { rb: occluderBinding.rb, co: occluderBinding.co },
      );
    } catch (error) {
      restored.world.free();
      throw error;
    }
  }

  capture(
    provenance: ExperimentProvenance,
  ): ExperimentMomentV1<
    C01MomentWorldProcessState,
    C01MomentPrivateState
  > {
    if (provenance.causalTick !== this.processState.causalTick) {
      throw new Error('provenance tick must equal host causal tick');
    }
    return captureExperimentMomentV1({
      buildIdentity: R5_BUILD_IDENTITY,
      provenance,
      world: this.world,
      registry: this.registry,
      worldProcessState: this.getWorldProcessState(),
      occupantPrivateStateSchema: R5_PRIVATE_SCHEMA,
      occupantPrivateState: this.getPrivateState(),
      validateOccupantPrivateState: validateC01MomentPrivateState,
    });
  }

  step(): C01MomentStep {
    const nextTick = this.processState.causalTick + 1;
    const actorBefore = position(this.actor.rb);
    const decision = decide(this.privateState, this.currentFrame);

    if (
      !this.processState.worldEventApplied &&
      nextTick === this.processState.worldEventTick
    ) {
      this.target.rb.applyImpulse(
        { x: P02A_HIDDEN_IMPULSE, y: 0 },
        true,
      );
      this.processState.worldEventApplied = true;
    }

    applyE0Demand(this.actor.rb, decision.drive, 0);
    this.world.step();

    const actorAfter = position(this.actor.rb);
    decision.state.lastSelfMotion = distance(actorBefore, actorAfter);
    this.privateState = decision.state;
    this.processState.causalTick = nextTick;
    this.currentFrame = senseP02aFrame(this.world, this.actor, [this.target]);

    return {
      tick: nextTick,
      drive: decision.drive,
      age: decision.age,
      currentFrame: copyFrame(this.currentFrame),
      snapshot: this.snapshot(),
    };
  }

  runTo(tick: number): void {
    if (tick < this.processState.causalTick) {
      throw new Error('cannot run C01MomentHost backwards');
    }
    while (this.processState.causalTick < tick) this.step();
  }

  snapshot(): C01MomentSnapshot {
    const ap = position(this.actor.rb);
    const av = velocity(this.actor.rb);
    const tp = position(this.target.rb);
    const tv = velocity(this.target.rb);
    return {
      causalTick: this.processState.causalTick,
      actor: {
        x: ap.x,
        y: ap.y,
        rotation: this.actor.rb.rotation(),
        vx: av.x,
        vy: av.y,
      },
      target: {
        x: tp.x,
        y: tp.y,
        vx: tv.x,
        vy: tv.y,
      },
      currentFrame: copyFrame(this.currentFrame),
      privateState: this.getPrivateState(),
      worldEventApplied: this.processState.worldEventApplied,
    };
  }

  getPrivateState(): C01MomentPrivateState {
    return copyPrivateState(this.privateState);
  }

  getWorldProcessState(): C01MomentWorldProcessState {
    return {
      causalTick: this.processState.causalTick,
      worldEventTick: this.processState.worldEventTick,
      worldEventApplied: this.processState.worldEventApplied,
      roles: { ...this.processState.roles },
    };
  }

  clearPrivateLastSeen(): void {
    this.privateState.lastSeen = null;
  }

  getCurrentFrame(): P02aPrivateFrame {
    return copyFrame(this.currentFrame);
  }

  destroy(): void {
    this.world.free();
  }
}
