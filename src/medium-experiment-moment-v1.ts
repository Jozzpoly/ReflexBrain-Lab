import { E0_RAPIER as RAPIER } from './e0-body-seam';
import {
  HostBindingRegistry,
  type HostBindingRegistrySnapshot,
} from './medium-host-binding-registry';
import {
  type ExperimentEvent,
  type ExperimentProvenance,
} from './medium-experiment-moment';

export const EXPERIMENT_MOMENT_SCHEMA_V1 = 'reflexbrain.experiment-moment.v1';

export type ExperimentMomentV1<TWorldProcessState, TOccupantPrivateState> = {
  schemaVersion: typeof EXPERIMENT_MOMENT_SCHEMA_V1;
  buildIdentity: string;
  provenance: ExperimentProvenance;
  physicsSnapshot: Uint8Array;
  hostBindings: HostBindingRegistrySnapshot;
  worldProcessState: TWorldProcessState;
  occupantPrivateStateSchema: string;
  occupantPrivateState: TOccupantPrivateState;
};

export type RestoredExperimentMomentV1<TWorldProcessState, TOccupantPrivateState> = {
  world: any;
  registry: HostBindingRegistry;
  processState: TWorldProcessState;
  occupantPrivateState: TOccupantPrivateState;
  provenance: ExperimentProvenance;
};

export type OccupantPrivateStateValidator<T> = (value: unknown) => T;

function jsonClone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

function cloneProvenance(value: ExperimentProvenance): ExperimentProvenance {
  return {
    ...value,
    events: value.events.map((event) => ({
      ...event,
      data: event.data ? { ...event.data } : undefined,
    })),
  };
}

function assertProvenance(value: ExperimentProvenance): void {
  if (!value || !value.momentId || !value.rootMomentId || !value.branchPath) {
    throw new Error('invalid experiment provenance identity');
  }
  if (!Number.isFinite(value.causalTick) || value.causalTick < 0) {
    throw new Error('invalid experiment provenance causalTick');
  }
  for (const event of value.events) {
    if (!event.eventId || !event.kind || !Number.isFinite(event.causalTick)) {
      throw new Error('invalid experiment provenance event');
    }
  }
}

function assertEvent(event: ExperimentEvent): void {
  if (!event.eventId || !event.kind || !Number.isFinite(event.causalTick)) {
    throw new Error('invalid experiment event');
  }
}

export function captureExperimentMomentV1<TWorldProcessState, TOccupantPrivateState>(args: {
  buildIdentity: string;
  provenance: ExperimentProvenance;
  world: any;
  registry: HostBindingRegistry;
  worldProcessState: TWorldProcessState;
  occupantPrivateStateSchema: string;
  occupantPrivateState: TOccupantPrivateState;
  validateOccupantPrivateState: OccupantPrivateStateValidator<TOccupantPrivateState>;
}): ExperimentMomentV1<TWorldProcessState, TOccupantPrivateState> {
  if (!args.buildIdentity) throw new Error('buildIdentity is required');
  if (!args.occupantPrivateStateSchema) {
    throw new Error('occupantPrivateStateSchema is required');
  }
  if (args.worldProcessState === null || args.worldProcessState === undefined) {
    throw new Error('worldProcessState is required');
  }
  if (args.occupantPrivateState === null || args.occupantPrivateState === undefined) {
    throw new Error('occupantPrivateState is required');
  }
  assertProvenance(args.provenance);

  const checkedPrivate = args.validateOccupantPrivateState(
    jsonClone(args.occupantPrivateState),
  );
  const physicsSnapshot = args.world.takeSnapshot();
  if (!(physicsSnapshot instanceof Uint8Array) || physicsSnapshot.byteLength === 0) {
    throw new Error('physics snapshot capture failed');
  }

  return {
    schemaVersion: EXPERIMENT_MOMENT_SCHEMA_V1,
    buildIdentity: args.buildIdentity,
    provenance: cloneProvenance(args.provenance),
    physicsSnapshot: physicsSnapshot.slice(),
    hostBindings: jsonClone(args.registry.snapshot()),
    worldProcessState: jsonClone(args.worldProcessState),
    occupantPrivateStateSchema: args.occupantPrivateStateSchema,
    occupantPrivateState: jsonClone(checkedPrivate),
  };
}

export function restoreExperimentMomentV1<TWorldProcessState, TOccupantPrivateState>(
  moment: ExperimentMomentV1<TWorldProcessState, TOccupantPrivateState>,
  args: {
    expectedBuildIdentity: string;
    expectedOccupantPrivateStateSchema: string;
    validateOccupantPrivateState: OccupantPrivateStateValidator<TOccupantPrivateState>;
  },
): RestoredExperimentMomentV1<TWorldProcessState, TOccupantPrivateState> {
  if (!moment || moment.schemaVersion !== EXPERIMENT_MOMENT_SCHEMA_V1) {
    throw new Error(
      `unsupported ExperimentMoment schema: ${(moment as any)?.schemaVersion ?? 'missing'}`,
    );
  }
  if (
    !args.expectedBuildIdentity ||
    moment.buildIdentity !== args.expectedBuildIdentity
  ) {
    throw new Error(
      `ExperimentMoment build mismatch: expected=${args.expectedBuildIdentity || 'missing'} actual=${moment.buildIdentity}`,
    );
  }
  if (
    !args.expectedOccupantPrivateStateSchema ||
    moment.occupantPrivateStateSchema !==
      args.expectedOccupantPrivateStateSchema
  ) {
    throw new Error(
      `occupant private schema mismatch: expected=${args.expectedOccupantPrivateStateSchema || 'missing'} actual=${moment.occupantPrivateStateSchema ?? 'missing'}`,
    );
  }
  if (
    moment.worldProcessState === null ||
    moment.worldProcessState === undefined
  ) {
    throw new Error('ExperimentMoment missing worldProcessState');
  }
  if (
    moment.occupantPrivateState === null ||
    moment.occupantPrivateState === undefined
  ) {
    throw new Error('ExperimentMoment missing occupantPrivateState');
  }
  assertProvenance(moment.provenance);

  if (
    !(moment.physicsSnapshot instanceof Uint8Array) ||
    moment.physicsSnapshot.byteLength === 0
  ) {
    throw new Error('ExperimentMoment missing physics snapshot');
  }

  const checkedPrivate = args.validateOccupantPrivateState(
    jsonClone(moment.occupantPrivateState),
  );
  const world = RAPIER.World.restoreSnapshot(moment.physicsSnapshot);
  if (!world) throw new Error('World.restoreSnapshot returned no World');

  try {
    const registry = HostBindingRegistry.restore(jsonClone(moment.hostBindings));
    for (const record of moment.hostBindings.records) {
      if (record.status !== 'live') continue;
      const resolved = registry.resolve(world, record.id);
      if (!resolved) {
        throw new Error(
          `required live HostBindingId failed restore: ${record.id}`,
        );
      }
    }

    return {
      world,
      registry,
      processState: jsonClone(moment.worldProcessState),
      occupantPrivateState: jsonClone(checkedPrivate),
      provenance: cloneProvenance(moment.provenance),
    };
  } catch (error) {
    world.free();
    throw error;
  }
}

export function appendExperimentEventV1(
  provenance: ExperimentProvenance,
  event: ExperimentEvent,
): ExperimentProvenance {
  assertProvenance(provenance);
  assertEvent(event);
  if (provenance.events.some((existing) => existing.eventId === event.eventId)) {
    throw new Error(`duplicate experiment event id: ${event.eventId}`);
  }
  return {
    ...cloneProvenance(provenance),
    events: [
      ...provenance.events.map((existing) => ({
        ...existing,
        data: existing.data ? { ...existing.data } : undefined,
      })),
      {
        ...event,
        data: event.data ? { ...event.data } : undefined,
      },
    ],
  };
}
