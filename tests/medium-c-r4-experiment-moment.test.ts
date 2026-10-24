import { beforeAll, describe, expect, it } from 'vitest';
import {
  createE01Scenario,
  destroyE01Scenario,
  initE01Rapier,
  snapshotE01Scenario,
  stepE01Scenario,
  type E01State,
} from '../src/e01-mechanical';
import {
  appendExperimentEvent,
  captureExperimentMoment,
  childProvenance,
  restoreExperimentMoment,
  type ExperimentMomentV0,
  type ExperimentProvenance,
} from '../src/medium-experiment-moment';
import {
  HostBindingRegistry,
  type HostBindingId,
} from '../src/medium-host-binding-registry';

const BUILD_ID = 'e01-medium-c-r4@1';

type E01Roles = {
  shuttle: HostBindingId;
  loose: HostBindingId | null;
  leftEnd: HostBindingId;
  rightEnd: HostBindingId;
  walls: HostBindingId[];
};

type E01MomentSidecar = {
  roles: E01Roles;
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

beforeAll(async () => {
  await initE01Rapier();
});

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

function buildRegistry(state: E01State): { registry: HostBindingRegistry; roles: E01Roles } {
  const registry = new HostBindingRegistry('root');
  const roles: E01Roles = {
    shuttle: registerBody(registry, state.shuttle, state.tick),
    loose: state.loose ? registerBody(registry, state.loose, state.tick) : null,
    leftEnd: registerBody(registry, state.leftEnd, state.tick),
    rightEnd: registerBody(registry, state.rightEnd, state.tick),
    walls: state.walls.map((wall) => registerBody(registry, wall, state.tick)),
  };
  return { registry, roles };
}

function sidecarOf(state: E01State, roles: E01Roles): E01MomentSidecar {
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

function restoreE01FromMoment(
  moment: ExperimentMomentV0<E01MomentSidecar>,
  branchLineage: string | null = null,
): {
  state: E01State;
  registry: HostBindingRegistry;
  provenance: ExperimentProvenance;
} {
  const restored = restoreExperimentMoment(moment, BUILD_ID);
  const registry = branchLineage
    ? restored.registry.fork(branchLineage)
    : restored.registry;
  const sidecar = restored.processState;

  const requireBody = (id: HostBindingId) => {
    const body = registry.resolve(restored.world, id);
    if (!body) throw new Error(`required E01 role failed HostBindingId resolution: ${id}`);
    return body;
  };

  const state: E01State = {
    world: restored.world,
    shuttle: requireBody(sidecar.roles.shuttle),
    loose: sidecar.roles.loose ? requireBody(sidecar.roles.loose) : null,
    leftEnd: requireBody(sidecar.roles.leftEnd),
    rightEnd: requireBody(sidecar.roles.rightEnd),
    walls: sidecar.roles.walls.map(requireBody),
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

  return {
    state,
    registry,
    provenance: restored.provenance,
  };
}

function stableState(state: E01State) {
  return {
    physical: snapshotE01Scenario(state),
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

function captureE01Moment(args: {
  state: E01State;
  registry: HostBindingRegistry;
  roles: E01Roles;
  provenance: ExperimentProvenance;
}): ExperimentMomentV0<E01MomentSidecar> {
  return captureExperimentMoment({
    buildIdentity: BUILD_ID,
    provenance: args.provenance,
    world: args.state.world,
    registry: args.registry,
    processState: sidecarOf(args.state, args.roles),
  });
}

function runOnce() {
  const source = createE01Scenario(true);
  let rootRestored: ReturnType<typeof restoreE01FromMoment> | null = null;
  let forkA: ReturnType<typeof restoreE01FromMoment> | null = null;
  let forkB: ReturnType<typeof restoreE01FromMoment> | null = null;
  let childRestoreA: ReturnType<typeof restoreE01FromMoment> | null = null;
  let childRestoreB: ReturnType<typeof restoreE01FromMoment> | null = null;

  try {
    const { registry: rootRegistry, roles } = buildRegistry(source);

    for (let i = 0; i < 300; i += 1) stepE01Scenario(source);
    expect(source.tick).toBe(300);

    const rootProvenance: ExperimentProvenance = {
      momentId: 'moment:root:300',
      parentMomentId: null,
      rootMomentId: 'moment:root:300',
      branchPath: 'root',
      causalTick: 300,
      events: [],
    };

    const rootMoment = captureE01Moment({
      state: source,
      registry: rootRegistry,
      roles,
      provenance: rootProvenance,
    });

    // Root restore: same causal boundary, no hidden warm-up.
    rootRestored = restoreE01FromMoment(rootMoment);
    const immediateRootEqual =
      JSON.stringify(stableState(source)) === JSON.stringify(stableState(rootRestored.state));

    let firstRootRestoreDivergence: number | null = null;
    for (let tick = 1; tick <= 240; tick += 1) {
      stepE01Scenario(source);
      stepE01Scenario(rootRestored.state);
      if (
        firstRootRestoreDivergence === null &&
        JSON.stringify(stableState(source)) !== JSON.stringify(stableState(rootRestored.state))
      ) {
        firstRootRestoreDivergence = tick;
      }
    }

    // Fork from original M0, not from the already-advanced root restore.
    forkA = restoreE01FromMoment(rootMoment, 'root/A');
    forkB = restoreE01FromMoment(rootMoment, 'root/B');

    let firstPreInterventionDivergence: number | null = null;
    for (let tick = 1; tick <= 120; tick += 1) {
      stepE01Scenario(forkA.state);
      stepE01Scenario(forkB.state);
      if (
        firstPreInterventionDivergence === null &&
        JSON.stringify(stableState(forkA.state)) !== JSON.stringify(stableState(forkB.state))
      ) {
        firstPreInterventionDivergence = tick;
      }
    }

    if (!roles.loose) throw new Error('R4 requires the E01 loose body');
    const looseB = forkB.registry.resolve(forkB.state.world, roles.loose);
    if (!looseB) throw new Error('branch B loose body failed HostBindingId resolution');

    // Branch-local intervention only in B.
    looseB.rb.applyImpulse({ x: 1.1, y: -0.35 }, true);
    const interventionTick = forkB.state.tick;
    const bProvenance = appendExperimentEvent(
      forkB.provenance,
      {
        eventId: 'event:B:loose-impulse:121',
        causalTick: interventionTick,
        kind: 'owner-material-impulse',
        targetBindingId: roles.loose,
        data: { impulseX: 1.1, impulseY: -0.35 },
      },
    );

    const rootEventsRemainImmutable = rootMoment.provenance.events.length === 0;

    let firstPostInterventionDivergence: number | null = null;
    for (let tick = 1; tick <= 360; tick += 1) {
      stepE01Scenario(forkA.state);
      stepE01Scenario(forkB.state);
      if (
        firstPostInterventionDivergence === null &&
        JSON.stringify(stableState(forkA.state)) !== JSON.stringify(stableState(forkB.state))
      ) {
        firstPostInterventionDivergence = tick;
      }
    }

    const provenanceA1 = childProvenance({
      parent: rootMoment.provenance,
      momentId: 'moment:A1',
      branchPath: 'root/A',
      causalTick: forkA.state.tick,
    });
    const provenanceB1 = childProvenance({
      parent: rootMoment.provenance,
      momentId: 'moment:B1',
      branchPath: 'root/B',
      causalTick: forkB.state.tick,
      events: bProvenance.events,
    });

    const momentA1 = captureE01Moment({
      state: forkA.state,
      registry: forkA.registry,
      roles,
      provenance: provenanceA1,
    });
    const momentB1 = captureE01Moment({
      state: forkB.state,
      registry: forkB.registry,
      roles,
      provenance: provenanceB1,
    });

    childRestoreA = restoreE01FromMoment(momentA1);
    childRestoreB = restoreE01FromMoment(momentB1);

    const childAImmediateEqual =
      JSON.stringify(stableState(forkA.state)) === JSON.stringify(stableState(childRestoreA.state));
    const childBImmediateEqual =
      JSON.stringify(stableState(forkB.state)) === JSON.stringify(stableState(childRestoreB.state));

    let firstChildARestoreDivergence: number | null = null;
    let firstChildBRestoreDivergence: number | null = null;

    for (let tick = 1; tick <= 300; tick += 1) {
      stepE01Scenario(forkA.state);
      stepE01Scenario(childRestoreA.state);
      stepE01Scenario(forkB.state);
      stepE01Scenario(childRestoreB.state);

      if (
        firstChildARestoreDivergence === null &&
        JSON.stringify(stableState(forkA.state)) !== JSON.stringify(stableState(childRestoreA.state))
      ) {
        firstChildARestoreDivergence = tick;
      }
      if (
        firstChildBRestoreDivergence === null &&
        JSON.stringify(stableState(forkB.state)) !== JSON.stringify(stableState(childRestoreB.state))
      ) {
        firstChildBRestoreDivergence = tick;
      }
    }

    // Fail-closed controls.
    let badSchemaRejected = false;
    let badBuildRejected = false;
    let missingProcessRejected = false;
    let retiredRequiredBindingRejected = false;

    try {
      restoreExperimentMoment(
        { ...rootMoment, schemaVersion: 'wrong.schema' as any },
        BUILD_ID,
      );
    } catch {
      badSchemaRejected = true;
    }

    try {
      restoreExperimentMoment(rootMoment, 'wrong-build');
    } catch {
      badBuildRejected = true;
    }

    try {
      restoreExperimentMoment(
        { ...rootMoment, worldProcessState: null as any },
        BUILD_ID,
      );
    } catch {
      missingProcessRejected = true;
    }

    const brokenBindings = JSON.parse(JSON.stringify(rootMoment.hostBindings));
    const shuttleRecord = brokenBindings.records.find(
      (record: any) => record.id === roles.shuttle,
    );
    if (!shuttleRecord) throw new Error('missing shuttle binding in root moment');
    shuttleRecord.status = 'retired';
    shuttleRecord.retiredTick = rootMoment.provenance.causalTick;

    try {
      const brokenMoment = {
        ...rootMoment,
        hostBindings: brokenBindings,
      } as ExperimentMomentV0<E01MomentSidecar>;
      const restored = restoreE01FromMoment(brokenMoment);
      destroyE01Scenario(restored.state);
    } catch {
      retiredRequiredBindingRejected = true;
    }

    const result = {
      root: {
        snapshotBytes: rootMoment.physicsSnapshot.byteLength,
        immediateEqual: immediateRootEqual,
        firstRestoreDivergence: firstRootRestoreDivergence,
        momentId: rootMoment.provenance.momentId,
      },
      fork: {
        firstPreInterventionDivergence,
        interventionTick,
        firstPostInterventionDivergence,
        rootEventsRemainImmutable,
        eventTarget: bProvenance.events[0]?.targetBindingId ?? null,
      },
      childA: {
        momentId: momentA1.provenance.momentId,
        parentMomentId: momentA1.provenance.parentMomentId,
        rootMomentId: momentA1.provenance.rootMomentId,
        branchPath: momentA1.provenance.branchPath,
        eventCount: momentA1.provenance.events.length,
        immediateEqual: childAImmediateEqual,
        firstRestoreDivergence: firstChildARestoreDivergence,
      },
      childB: {
        momentId: momentB1.provenance.momentId,
        parentMomentId: momentB1.provenance.parentMomentId,
        rootMomentId: momentB1.provenance.rootMomentId,
        branchPath: momentB1.provenance.branchPath,
        eventCount: momentB1.provenance.events.length,
        event: momentB1.provenance.events[0] ?? null,
        immediateEqual: childBImmediateEqual,
        firstRestoreDivergence: firstChildBRestoreDivergence,
      },
      failClosed: {
        badSchemaRejected,
        badBuildRejected,
        missingProcessRejected,
        retiredRequiredBindingRejected,
      },
      inheritedRoleIds: roles,
    };

    return result;
  } finally {
    destroyE01Scenario(source);
    if (rootRestored) destroyE01Scenario(rootRestored.state);
    if (forkA) destroyE01Scenario(forkA.state);
    if (forkB) destroyE01Scenario(forkB.state);
    if (childRestoreA) destroyE01Scenario(childRestoreA.state);
    if (childRestoreB) destroyE01Scenario(childRestoreB.state);
  }
}

describe('MEDIUM-C/R4 versioned ExperimentMoment exact fork provenance', () => {
  it('restores root and diverged child moments exactly while provenance stays branch-local and validation fails closed', () => {
    const first = runOnce();
    const repeat = runOnce();

    console.log('MEDIUM_C_R4_RESULT ' + JSON.stringify(first));

    expect(repeat).toEqual(first);

    expect(first.root.immediateEqual).toBe(true);
    expect(first.root.firstRestoreDivergence).toBeNull();

    expect(first.fork.firstPreInterventionDivergence).toBeNull();
    expect(first.fork.firstPostInterventionDivergence).toBe(1);
    expect(first.fork.rootEventsRemainImmutable).toBe(true);
    expect(first.fork.eventTarget).toBe(first.inheritedRoleIds.loose);

    expect(first.childA.parentMomentId).toBe(first.root.momentId);
    expect(first.childB.parentMomentId).toBe(first.root.momentId);
    expect(first.childA.rootMomentId).toBe(first.root.momentId);
    expect(first.childB.rootMomentId).toBe(first.root.momentId);
    expect(first.childA.branchPath).toBe('root/A');
    expect(first.childB.branchPath).toBe('root/B');
    expect(first.childA.eventCount).toBe(0);
    expect(first.childB.eventCount).toBe(1);

    expect(first.childA.immediateEqual).toBe(true);
    expect(first.childB.immediateEqual).toBe(true);
    expect(first.childA.firstRestoreDivergence).toBeNull();
    expect(first.childB.firstRestoreDivergence).toBeNull();

    expect(first.failClosed).toEqual({
      badSchemaRejected: true,
      badBuildRejected: true,
      missingProcessRejected: true,
      retiredRequiredBindingRejected: true,
    });
  }, 30_000);
});
