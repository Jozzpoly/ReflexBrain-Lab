import {
  createE01Scenario,
  destroyE01Scenario,
  snapshotE01Scenario,
  stepE01Scenario,
  type E01State,
} from './e01-mechanical';
import {
  appendExperimentEvent,
  captureExperimentMoment,
  childProvenance,
  restoreExperimentMoment,
  type ExperimentMomentV0,
  type ExperimentProvenance,
} from './medium-experiment-moment';
import {
  HostBindingRegistry,
  type HostBindingId,
} from './medium-host-binding-registry';

export const R3A_BUILD_IDENTITY = 'e01-medium-d-r3a@1';
export const R3A_MAX_CATCHUP_TICKS = 240;

export type R3AE01Roles = {
  shuttle: HostBindingId;
  loose: HostBindingId;
  leftEnd: HostBindingId;
  rightEnd: HostBindingId;
  walls: HostBindingId[];
};

export type R3AE01Sidecar = {
  roles: R3AE01Roles;
  direction: -1 | 1;
  tick: number;
  prevLeftTouch: boolean;
  prevRightTouch: boolean;
  rightReversalTick: number | null;
  leftReversalTick: number | null;
  firstLooseContactTick: number | null;
  looseContactTicks: number;
  directionEvents: E01State['directionEvents'];
};

export type R3AMoment = ExperimentMomentV0<R3AE01Sidecar>;

function registerBody(
  registry: HostBindingRegistry,
  body: { rb: any; co: any },
  tick: number,
): HostBindingId {
  return registry.allocate(
    { rb: body.rb.handle, co: body.co.handle },
    tick,
  );
}

function buildRegistry(
  state: E01State,
): { registry: HostBindingRegistry; roles: R3AE01Roles } {
  if (!state.loose) throw new Error('R3A requires E01 loose body');
  const registry = new HostBindingRegistry('r3a-root');
  return {
    registry,
    roles: {
      shuttle: registerBody(registry, state.shuttle, state.tick),
      loose: registerBody(registry, state.loose, state.tick),
      leftEnd: registerBody(registry, state.leftEnd, state.tick),
      rightEnd: registerBody(registry, state.rightEnd, state.tick),
      walls: state.walls.map((wall) => registerBody(registry, wall, state.tick)),
    },
  };
}

function sidecarOf(state: E01State, roles: R3AE01Roles): R3AE01Sidecar {
  return {
    roles: {
      ...roles,
      walls: [...roles.walls],
    },
    direction: state.direction,
    tick: state.tick,
    prevLeftTouch: state.prevLeftTouch,
    prevRightTouch: state.prevRightTouch,
    rightReversalTick: state.rightReversalTick,
    leftReversalTick: state.leftReversalTick,
    firstLooseContactTick: state.firstLooseContactTick,
    looseContactTicks: state.looseContactTicks,
    directionEvents: state.directionEvents.map((event) => ({ ...event })),
  };
}

function requireBody(
  world: any,
  registry: HostBindingRegistry,
  id: HostBindingId,
): { rb: any; co: any } {
  const body = registry.resolve(world, id);
  if (!body) throw new Error(`required E01 role failed HostBindingId resolution: ${id}`);
  return body;
}

function stateFromRestored(args: {
  world: any;
  registry: HostBindingRegistry;
  sidecar: R3AE01Sidecar;
}): E01State {
  const { world, registry, sidecar } = args;
  return {
    world,
    shuttle: requireBody(world, registry, sidecar.roles.shuttle),
    loose: requireBody(world, registry, sidecar.roles.loose),
    leftEnd: requireBody(world, registry, sidecar.roles.leftEnd),
    rightEnd: requireBody(world, registry, sidecar.roles.rightEnd),
    walls: sidecar.roles.walls.map((id) => requireBody(world, registry, id)),
    direction: sidecar.direction,
    tick: sidecar.tick,
    prevLeftTouch: sidecar.prevLeftTouch,
    prevRightTouch: sidecar.prevRightTouch,
    rightReversalTick: sidecar.rightReversalTick,
    leftReversalTick: sidecar.leftReversalTick,
    firstLooseContactTick: sidecar.firstLooseContactTick,
    looseContactTicks: sidecar.looseContactTicks,
    directionEvents: sidecar.directionEvents.map((event) => ({ ...event })),
  };
}

export function r3aStableState(state: E01State): unknown {
  return {
    snapshot: snapshotE01Scenario(state),
    direction: state.direction,
    tick: state.tick,
    prevLeftTouch: state.prevLeftTouch,
    prevRightTouch: state.prevRightTouch,
    rightReversalTick: state.rightReversalTick,
    leftReversalTick: state.leftReversalTick,
    firstLooseContactTick: state.firstLooseContactTick,
    looseContactTicks: state.looseContactTicks,
    directionEvents: state.directionEvents.map((event) => ({ ...event })),
  };
}

export class R3AE01Host {
  private constructor(
    readonly state: E01State,
    readonly registry: HostBindingRegistry,
    readonly roles: R3AE01Roles,
    private provenance: ExperimentProvenance,
  ) {}

  static create(): R3AE01Host {
    const state = createE01Scenario(true);
    const { registry, roles } = buildRegistry(state);
    return new R3AE01Host(
      state,
      registry,
      roles,
      {
        momentId: 'live:r3a',
        parentMomentId: null,
        rootMomentId: 'live:r3a',
        branchPath: 'live',
        causalTick: 0,
        events: [],
      },
    );
  }

  static restore(
    moment: R3AMoment,
    branchLineage: string,
    momentId: string,
    branchPath: string,
  ): R3AE01Host {
    const restored = restoreExperimentMoment(moment, R3A_BUILD_IDENTITY);
    const registry = restored.registry.fork(branchLineage);
    const sidecar = restored.processState;
    const state = stateFromRestored({
      world: restored.world,
      registry,
      sidecar,
    });
    return new R3AE01Host(
      state,
      registry,
      sidecar.roles,
      childProvenance({
        parent: moment.provenance,
        momentId,
        branchPath,
        causalTick: moment.provenance.causalTick,
      }),
    );
  }

  step(): void {
    stepE01Scenario(this.state);
  }

  runTicks(count: number): void {
    if (!Number.isInteger(count) || count < 0) {
      throw new Error('runTicks requires non-negative integer');
    }
    for (let i = 0; i < count; i += 1) this.step();
  }

  capture(momentId: string): R3AMoment {
    const provenance: ExperimentProvenance = {
      momentId,
      parentMomentId: null,
      rootMomentId: momentId,
      branchPath: 'root',
      causalTick: this.state.tick,
      events: [],
    };
    return captureExperimentMoment({
      buildIdentity: R3A_BUILD_IDENTITY,
      provenance,
      world: this.state.world,
      registry: this.registry,
      processState: sidecarOf(this.state, this.roles),
    });
  }

  applyLooseImpulse(x: number, y: number, eventId: string): void {
    if (!Number.isFinite(x) || !Number.isFinite(y)) {
      throw new Error('impulse must be finite');
    }
    const loose = this.registry.resolve(this.state.world, this.roles.loose);
    if (!loose) throw new Error('R3A loose HostBindingId is not live');
    loose.rb.applyImpulse({ x, y }, true);
    this.provenance = appendExperimentEvent(this.provenance, {
      eventId,
      causalTick: this.state.tick,
      kind: 'owner-material-impulse',
      targetBindingId: this.roles.loose,
      data: { impulseX: x, impulseY: y },
    });
  }

  getProvenance(): ExperimentProvenance {
    return {
      ...this.provenance,
      events: this.provenance.events.map((event) => ({
        ...event,
        data: event.data ? { ...event.data } : undefined,
      })),
    };
  }

  stableState(): unknown {
    return r3aStableState(this.state);
  }

  snapshot() {
    return snapshotE01Scenario(this.state);
  }

  get tick(): number {
    return this.state.tick;
  }

  destroy(): void {
    destroyE01Scenario(this.state);
  }
}

export function forkR3AFromMark(args: {
  moment: R3AMoment;
  sourceCurrentState: unknown;
  sourceCurrentTick: number;
}): {
  a: R3AE01Host;
  b: R3AE01Host;
  catchupTicks: number;
} {
  const catchupTicks = args.sourceCurrentTick - args.moment.provenance.causalTick;
  if (!Number.isInteger(catchupTicks) || catchupTicks < 0) {
    throw new Error('mark cannot be ahead of source');
  }
  if (catchupTicks > R3A_MAX_CATCHUP_TICKS) {
    throw new Error(
      `mark is ${catchupTicks} ticks old; R3A limit is ${R3A_MAX_CATCHUP_TICKS}`,
    );
  }

  const a = R3AE01Host.restore(
    args.moment,
    'r3a/A',
    'moment:r3a:A',
    'root/A',
  );
  const b = R3AE01Host.restore(
    args.moment,
    'r3a/B',
    'moment:r3a:B',
    'root/B',
  );

  try {
    a.runTicks(catchupTicks);
    b.runTicks(catchupTicks);
    const aKey = JSON.stringify(a.stableState());
    const bKey = JSON.stringify(b.stableState());
    const sourceKey = JSON.stringify(args.sourceCurrentState);

    if (aKey !== bKey || aKey !== sourceKey) {
      throw new Error('exact fork catch-up failed equality check');
    }
    return { a, b, catchupTicks };
  } catch (error) {
    a.destroy();
    b.destroy();
    throw error;
  }
}
