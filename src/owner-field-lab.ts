import {
  E0_DT,
  E0_RADIUS,
  E0_RAPIER as RAPIER,
  applyE0Demand,
  createE0Body,
  createE0Wall,
  createE0World,
  type E0Body,
} from './e0-body-seam';
import {
  P02A_MAX_RANGE,
  senseP02aFrame,
  type P02aBlob,
  type P02aPrivateFrame,
} from './p02a-private-occlusion';

export const FIELD_BOUNDS = { x: 7.2, y: 4.2 };
export const FIELD_EVIDENCE_AGE = 240;
export const FIELD_CHECK_LIMIT = 480;
export const FIELD_MAX_LOOSE = 8;

type Body = E0Body & { radius?: number };

export type FieldMode = 'ROAM' | 'BOUNCE' | 'CHECK' | 'YIELD' | 'PAUSED';

export type FieldLastSeen = P02aBlob & {
  privateTick: number;
};

export type FieldPrivateState = {
  privateTick: number;
  bodyOdom: number;
  mode: FieldMode;
  lastSeen: FieldLastSeen | null;
  evidenceAge: number | null;
  checkTicks: number;
  memoryEnabled: boolean;
  sensorEnabled: boolean;
  actorEnabled: boolean;
};

export type FieldEvent = {
  tick: number;
  kind: 'private' | 'world' | 'owner' | 'process';
  text: string;
};

export type FieldSnapshot = {
  tick: number;
  actor: { x: number; y: number; rotation: number; vx: number; vy: number };
  target: { x: number; y: number; vx: number; vy: number };
  sweeper: { x: number; y: number; vx: number; vy: number; direction: -1 | 1 };
  loose: Array<{ x: number; y: number; radius: number }>;
  privateFrame: P02aPrivateFrame;
  privateState: FieldPrivateState;
  flags: {
    sweeperEnabled: boolean;
    occluderEnabled: boolean;
  };
  events: FieldEvent[];
};

function cloneBlob(blob: P02aBlob, tick: number): FieldLastSeen {
  return { ...blob, privateTick: tick };
}

function copyFrame(frame: P02aPrivateFrame): P02aPrivateFrame {
  return { blobs: frame.blobs.map((b) => ({ ...b })) };
}

function pos(rb: any): { x: number; y: number } {
  const p = rb.translation();
  return { x: p.x, y: p.y };
}

function vel(rb: any): { x: number; y: number } {
  const v = rb.linvel();
  return { x: v.x, y: v.y };
}

function distance(a: { x: number; y: number }, b: { x: number; y: number }): number {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

function hasContact(world: any, a: any, b: any): boolean {
  let found = false;
  world.contactPair(a, b, () => {
    found = true;
  });
  return found;
}

class FieldMonitor {
  private privateTick = 0;
  private bodyOdom = 0;
  private lastSeen: FieldLastSeen | null = null;
  private mode: FieldMode = 'ROAM';
  private checkTicks = 0;
  private bounceTicks = 0;
  private yieldUntil = 0;
  private checkDirection: -1 | 1 = 1;

  memoryEnabled = true;
  sensorEnabled = true;
  actorEnabled = true;

  decide(
    frame: P02aPrivateFrame,
    selfMotion: number,
    contact: boolean,
  ): { drive: number; turn: number; event: string | null } {
    this.privateTick += 1;
    this.bodyOdom += selfMotion;

    const visible = frame.blobs.length > 0;
    if (this.memoryEnabled && visible) {
      this.lastSeen = cloneBlob(frame.blobs[0], this.privateTick);
    }

    const evidenceAge =
      this.lastSeen === null ? null : this.privateTick - this.lastSeen.privateTick;

    if (!this.actorEnabled) {
      this.mode = 'PAUSED';
      return { drive: 0, turn: 0, event: null };
    }
    if (this.mode === 'PAUSED') this.mode = 'ROAM';

    if (visible && this.mode === 'CHECK') {
      this.mode = 'ROAM';
      this.checkTicks = 0;
      return { drive: 0.2, turn: 0, event: 'fresh P0 ended CHECK' };
    }

    if (contact && this.mode !== 'CHECK') {
      this.mode = 'BOUNCE';
      this.bounceTicks = Math.max(this.bounceTicks, 44);
    }

    if (this.mode === 'BOUNCE') {
      this.bounceTicks -= 1;
      if (this.bounceTicks <= 0) this.mode = 'ROAM';
      return { drive: -0.16, turn: 0.95, event: null };
    }

    if (this.mode === 'YIELD') {
      if (this.privateTick >= this.yieldUntil) {
        this.mode = 'ROAM';
      } else {
        return { drive: 0, turn: 0, event: null };
      }
    }

    if (
      this.memoryEnabled &&
      !visible &&
      evidenceAge !== null &&
      evidenceAge >= FIELD_EVIDENCE_AGE &&
      this.mode !== 'CHECK' &&
      this.privateTick >= this.yieldUntil
    ) {
      this.mode = 'CHECK';
      this.checkTicks = 0;
      const bearing = this.lastSeen?.bearing ?? 0;
      this.checkDirection = bearing < 0 ? -1 : 1;
      return { drive: 0.72, turn: 0.18 * this.checkDirection, event: 'private evidence became stale -> CHECK' };
    }

    if (this.mode === 'CHECK') {
      this.checkTicks += 1;
      if (this.checkTicks >= FIELD_CHECK_LIMIT) {
        this.mode = 'YIELD';
        this.yieldUntil = this.privateTick + 240;
        return { drive: 0, turn: 0, event: 'CHECK exhausted -> bounded YIELD' };
      }
      // A deliberately small, authored search pressure: forward motion plus
      // slow curvature, with direction chosen only from the last legal bearing.
      return {
        drive: 0.72,
        turn: 0.18 * this.checkDirection,
        event: null,
      };
    }

    // Ordinary continuation: the actor keeps physically moving even when
    // nothing is wrong. Contacts, not a scenario phase, redirect it.
    this.mode = 'ROAM';
    return { drive: 0.30, turn: 0, event: null };
  }

  clearMemory(): void {
    this.lastSeen = null;
    if (this.mode === 'CHECK') {
      this.mode = 'ROAM';
      this.checkTicks = 0;
    }
  }

  setMemoryEnabled(enabled: boolean): void {
    this.memoryEnabled = enabled;
    if (!enabled) this.clearMemory();
  }

  state(): FieldPrivateState {
    return {
      privateTick: this.privateTick,
      bodyOdom: this.bodyOdom,
      mode: this.mode,
      lastSeen: this.lastSeen === null ? null : { ...this.lastSeen },
      evidenceAge:
        this.lastSeen === null ? null : this.privateTick - this.lastSeen.privateTick,
      checkTicks: this.checkTicks,
      memoryEnabled: this.memoryEnabled,
      sensorEnabled: this.sensorEnabled,
      actorEnabled: this.actorEnabled,
    };
  }
}

export class OwnerFieldLab {
  readonly world: any;
  readonly actor: E0Body;
  readonly target: Body;
  readonly occluder: Body;
  readonly roomWalls: Body[];
  readonly sweeper: Body;
  readonly sweeperEnds: [Body, Body];

  private monitor = new FieldMonitor();
  private looseBodies: Array<Body & { radius: number }> = [];
  private worldTick = 0;
  private lastActorPos: { x: number; y: number };
  private lastSelfMotion = 0;
  private currentFrame: P02aPrivateFrame = { blobs: [] };
  private lastVisible = false;
  private lastActorContact = false;
  private events: FieldEvent[] = [];
  private sweeperDirection: -1 | 1 = 1;
  private sweeperEnabled = true;
  private occluderEnabled = true;
  private prevLeftTouch = false;
  private prevRightTouch = false;

  constructor() {
    this.world = createE0World();

    this.actor = createE0Body(this.world, -4.5, 1.8);
    this.actor.rb.setRotation(0, true);

    this.occluder = createE0Wall(this.world, 0, 0, 0.18, 2.15);
    this.roomWalls = [
      createE0Wall(this.world, -7.35, 0, 0.12, 4.3),
      createE0Wall(this.world, 7.35, 0, 0.12, 4.3),
      createE0Wall(this.world, 0, -4.35, 7.35, 0.12),
      createE0Wall(this.world, 0, 4.35, 7.35, 0.12),
    ];

    const targetRb = this.world.createRigidBody(
      RAPIER.RigidBodyDesc.dynamic()
        .setTranslation(-1.8, 1.8)
        .setLinearDamping(2.2)
        .setAngularDamping(4),
    );
    const targetCo = this.world.createCollider(
      RAPIER.ColliderDesc.ball(0.38)
        .setMass(1)
        .setFriction(0.12)
        .setRestitution(0.08),
      targetRb,
    );
    this.target = { rb: targetRb, co: targetCo, radius: 0.38 };

    const sweeperRb = this.world.createRigidBody(
      RAPIER.RigidBodyDesc.dynamic()
        .setTranslation(-4.7, -2.65)
        .setLinearDamping(1.15)
        .setAngularDamping(4),
    );
    const sweeperCo = this.world.createCollider(
      RAPIER.ColliderDesc.ball(0.55)
        .setMass(4)
        .setFriction(0.12)
        .setRestitution(0.02),
      sweeperRb,
    );
    this.sweeper = { rb: sweeperRb, co: sweeperCo, radius: 0.55 };

    const leftRb = this.world.createRigidBody(
      RAPIER.RigidBodyDesc.fixed().setTranslation(-5.7, -2.65),
    );
    const leftCo = this.world.createCollider(
      RAPIER.ColliderDesc.ball(0.28).setFriction(0).setRestitution(0),
      leftRb,
    );
    const rightRb = this.world.createRigidBody(
      RAPIER.RigidBodyDesc.fixed().setTranslation(5.7, -2.65),
    );
    const rightCo = this.world.createCollider(
      RAPIER.ColliderDesc.ball(0.28).setFriction(0).setRestitution(0),
      rightRb,
    );
    this.sweeperEnds = [
      { rb: leftRb, co: leftCo, radius: 0.28 },
      { rb: rightRb, co: rightCo, radius: 0.28 },
    ];

    // Same neutral query-readiness discipline as P02a/P02b.
    this.world.step();
    this.lastActorPos = pos(this.actor.rb);
    this.currentFrame = this.sense();
    this.lastVisible = this.currentFrame.blobs.length > 0;
    this.log('world', 'Field Lab started; world continues without Owner input.');
  }

  private log(kind: FieldEvent['kind'], text: string): void {
    this.events.push({ tick: this.worldTick, kind, text });
    if (this.events.length > 160) this.events.splice(0, this.events.length - 160);
  }

  private sense(): P02aPrivateFrame {
    if (!this.monitor.sensorEnabled) return { blobs: [] };
    return senseP02aFrame(this.world, this.actor, [this.target as any]);
  }

  private actorContact(): boolean {
    const candidates = [this.occluder, ...this.roomWalls, ...this.looseBodies];
    return candidates.some((body) => hasContact(this.world, this.actor.co, body.co));
  }

  private stepSweeper(): void {
    const rb = this.sweeper.rb;
    rb.resetForces(true);
    rb.resetTorques(true);
    if (this.sweeperEnabled) {
      rb.addForce({ x: 28 * this.sweeperDirection, y: 0 }, true);
    }
  }

  private updateSweeperDirection(): void {
    const left = hasContact(this.world, this.sweeper.co, this.sweeperEnds[0].co);
    const right = hasContact(this.world, this.sweeper.co, this.sweeperEnds[1].co);

    if (right && !this.prevRightTouch && this.sweeperDirection === 1) {
      this.sweeperDirection = -1;
      this.log('process', 'independent sweeper reversed on right physical end-stop');
    }
    if (left && !this.prevLeftTouch && this.sweeperDirection === -1) {
      this.sweeperDirection = 1;
      this.log('process', 'independent sweeper reversed on left physical end-stop');
    }
    this.prevLeftTouch = left;
    this.prevRightTouch = right;
  }

  step(): void {
    const decision = this.monitor.decide(
      this.currentFrame,
      this.lastSelfMotion,
      this.lastActorContact,
    );
    if (decision.event) this.log('private', decision.event);

    applyE0Demand(
      this.actor.rb,
      this.monitor.actorEnabled ? decision.drive : 0,
      this.monitor.actorEnabled ? decision.turn : 0,
    );
    this.stepSweeper();

    const actorBefore = pos(this.actor.rb);
    this.world.step();
    this.worldTick += 1;

    this.updateSweeperDirection();

    const actorAfter = pos(this.actor.rb);
    this.lastSelfMotion = distance(actorBefore, actorAfter);
    this.lastActorPos = actorAfter;
    this.lastActorContact = this.actorContact();

    const frame = this.sense();
    const visible = frame.blobs.length > 0;
    if (visible && !this.lastVisible) this.log('private', 'P0 acquired a visible target blob');
    if (!visible && this.lastVisible) this.log('private', 'P0 lost the target blob');
    this.currentFrame = frame;
    this.lastVisible = visible;
  }

  snapshot(): FieldSnapshot {
    const ap = pos(this.actor.rb);
    const av = vel(this.actor.rb);
    const tp = pos(this.target.rb);
    const tv = vel(this.target.rb);
    const sp = pos(this.sweeper.rb);
    const sv = vel(this.sweeper.rb);

    return {
      tick: this.worldTick,
      actor: { ...ap, rotation: this.actor.rb.rotation(), ...{ vx: av.x, vy: av.y } },
      target: { ...tp, vx: tv.x, vy: tv.y },
      sweeper: { ...sp, vx: sv.x, vy: sv.y, direction: this.sweeperDirection },
      loose: this.looseBodies.map((body) => ({ ...pos(body.rb), radius: body.radius })),
      privateFrame: copyFrame(this.currentFrame),
      privateState: this.monitor.state(),
      flags: {
        sweeperEnabled: this.sweeperEnabled,
        occluderEnabled: this.occluderEnabled,
      },
      events: this.events.slice(-18).map((e) => ({ ...e })),
    };
  }

  setTargetPosition(x: number, y: number, owner = true): void {
    const nx = Math.max(-6.7, Math.min(6.7, x));
    const ny = Math.max(-3.75, Math.min(3.75, y));
    this.target.rb.setTranslation({ x: nx, y: ny }, true);
    this.target.rb.setLinvel({ x: 0, y: 0 }, true);
    this.target.rb.setAngvel(0, true);
    if (owner) this.log('owner', `Owner moved target to (${nx.toFixed(2)}, ${ny.toFixed(2)})`);
  }

  shoveTarget(x: number, y: number, owner = true): void {
    this.target.rb.applyImpulse({ x, y }, true);
    if (owner) this.log('owner', `Owner shoved target (${x.toFixed(1)}, ${y.toFixed(1)})`);
  }

  shoveActor(x: number, y: number): void {
    this.actor.rb.applyImpulse({ x, y }, true);
    this.log('owner', `Owner shoved actor (${x.toFixed(1)}, ${y.toFixed(1)})`);
  }

  spawnLoose(x = 0.8, y = -2.65): boolean {
    if (this.looseBodies.length >= FIELD_MAX_LOOSE) return false;
    const offset = this.looseBodies.length * 0.38;
    const px = Math.max(-6.2, Math.min(6.2, x + offset));
    const py = Math.max(-3.7, Math.min(3.7, y));
    const rb = this.world.createRigidBody(
      RAPIER.RigidBodyDesc.dynamic()
        .setTranslation(px, py)
        .setLinearDamping(2.8)
        .setAngularDamping(4),
    );
    const radius = 0.30;
    const co = this.world.createCollider(
      RAPIER.ColliderDesc.ball(radius)
        .setMass(1)
        .setFriction(0.14)
        .setRestitution(0.04),
      rb,
    );
    this.looseBodies.push({ rb, co, radius });
    this.log('owner', 'Owner added a loose body to the live world');
    return true;
  }

  clearLoose(): void {
    for (const body of this.looseBodies) {
      this.world.removeRigidBody(body.rb);
    }
    this.looseBodies = [];
    this.log('owner', 'Owner cleared loose bodies');
  }

  setMemoryEnabled(enabled: boolean): void {
    this.monitor.setMemoryEnabled(enabled);
    this.log('owner', enabled ? 'Owner enabled actor memory' : 'Owner disabled + cleared actor memory');
  }

  setSensorEnabled(enabled: boolean): void {
    this.monitor.sensorEnabled = enabled;
    if (!enabled) this.currentFrame = { blobs: [] };
    this.log('owner', enabled ? 'Owner opened P0 sensor gate' : 'Owner closed P0 sensor gate');
  }

  setActorEnabled(enabled: boolean): void {
    this.monitor.actorEnabled = enabled;
    this.log('owner', enabled ? 'Owner resumed actor control' : 'Owner paused actor control while World continues');
  }

  setSweeperEnabled(enabled: boolean): void {
    this.sweeperEnabled = enabled;
    this.log('owner', enabled ? 'Owner enabled independent sweeper' : 'Owner disabled independent sweeper');
  }

  setOccluderEnabled(enabled: boolean): void {
    this.occluderEnabled = enabled;
    this.occluder.rb.setTranslation({ x: enabled ? 0 : 20, y: 0 }, true);
    this.log('owner', enabled ? 'Owner restored central occluder' : 'Owner removed central occluder');
  }

  clearActorMemory(): void {
    this.monitor.clearMemory();
    this.log('owner', 'Owner cleared private last-seen memory');
  }

  getWorldTick(): number {
    return this.worldTick;
  }

  destroy(): void {
    this.world.free();
  }
}
