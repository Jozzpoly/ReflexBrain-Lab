import { E0_RAPIER as RAPIER } from './e0-body-seam';
import {
  HostBindingRegistry,
  type HostBindingRegistrySnapshot,
} from './medium-host-binding-registry';

export const EXPERIMENT_MOMENT_SCHEMA_V0 = 'reflexbrain.experiment-moment.v0';

export type ExperimentEvent = {
  eventId: string;
  causalTick: number;
  kind: string;
  targetBindingId?: string;
  data?: Record<string, string | number | boolean | null>;
};

export type ExperimentProvenance = {
  momentId: string;
  parentMomentId: string | null;
  rootMomentId: string;
  branchPath: string;
  causalTick: number;
  events: ExperimentEvent[];
};

export type ExperimentMomentV0<TProcessState> = {
  schemaVersion: typeof EXPERIMENT_MOMENT_SCHEMA_V0;
  buildIdentity: string;
  provenance: ExperimentProvenance;
  physicsSnapshot: Uint8Array;
  hostBindings: HostBindingRegistrySnapshot;
  worldProcessState: TProcessState;
};

export type RestoredExperimentMoment<TProcessState> = {
  world: any;
  registry: HostBindingRegistry;
  processState: TProcessState;
  provenance: ExperimentProvenance;
};

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

export function captureExperimentMoment<TProcessState>(args: {
  buildIdentity: string;
  provenance: ExperimentProvenance;
  world: any;
  registry: HostBindingRegistry;
  processState: TProcessState;
}): ExperimentMomentV0<TProcessState> {
  if (!args.buildIdentity) throw new Error('buildIdentity is required');
  if (args.processState === null || args.processState === undefined) {
    throw new Error('worldProcessState is required');
  }
  assertProvenance(args.provenance);

  const physicsSnapshot = args.world.takeSnapshot();
  if (!(physicsSnapshot instanceof Uint8Array) || physicsSnapshot.byteLength === 0) {
    throw new Error('physics snapshot capture failed');
  }

  return {
    schemaVersion: EXPERIMENT_MOMENT_SCHEMA_V0,
    buildIdentity: args.buildIdentity,
    provenance: cloneProvenance(args.provenance),
    physicsSnapshot: physicsSnapshot.slice(),
    hostBindings: jsonClone(args.registry.snapshot()),
    worldProcessState: jsonClone(args.processState),
  };
}

export function restoreExperimentMoment<TProcessState>(
  moment: ExperimentMomentV0<TProcessState>,
  expectedBuildIdentity: string,
): RestoredExperimentMoment<TProcessState> {
  if (!moment || moment.schemaVersion !== EXPERIMENT_MOMENT_SCHEMA_V0) {
    throw new Error(
      `unsupported ExperimentMoment schema: ${(moment as any)?.schemaVersion ?? 'missing'}`,
    );
  }
  if (!expectedBuildIdentity || moment.buildIdentity !== expectedBuildIdentity) {
    throw new Error(
      `ExperimentMoment build mismatch: expected=${expectedBuildIdentity || 'missing'} actual=${moment.buildIdentity}`,
    );
  }
  if (moment.worldProcessState === null || moment.worldProcessState === undefined) {
    throw new Error('ExperimentMoment missing worldProcessState');
  }
  assertProvenance(moment.provenance);

  if (!(moment.physicsSnapshot instanceof Uint8Array) || moment.physicsSnapshot.byteLength === 0) {
    throw new Error('ExperimentMoment missing physics snapshot');
  }

  const world = RAPIER.World.restoreSnapshot(moment.physicsSnapshot);
  if (!world) throw new Error('World.restoreSnapshot returned no World');

  try {
    const registry = HostBindingRegistry.restore(jsonClone(moment.hostBindings));

    // Fail closed on any live binding that cannot resolve exactly. A consumer
    // may impose additional role requirements on top of this generic check.
    for (const record of moment.hostBindings.records) {
      if (record.status !== 'live') continue;
      const resolved = registry.resolve(world, record.id);
      if (!resolved) {
        throw new Error(`required live HostBindingId failed restore: ${record.id}`);
      }
    }

    return {
      world,
      registry,
      processState: jsonClone(moment.worldProcessState),
      provenance: cloneProvenance(moment.provenance),
    };
  } catch (error) {
    world.free();
    throw error;
  }
}

export function appendExperimentEvent(
  provenance: ExperimentProvenance,
  event: ExperimentEvent,
): ExperimentProvenance {
  assertProvenance(provenance);
  if (!event.eventId || !event.kind || !Number.isFinite(event.causalTick)) {
    throw new Error('invalid event');
  }
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

export function childProvenance(args: {
  parent: ExperimentProvenance;
  momentId: string;
  branchPath: string;
  causalTick: number;
  events?: ExperimentEvent[];
}): ExperimentProvenance {
  assertProvenance(args.parent);
  if (!args.momentId || args.momentId === args.parent.momentId) {
    throw new Error('child moment requires a distinct momentId');
  }
  if (!args.branchPath || args.branchPath === args.parent.branchPath) {
    throw new Error('child moment requires a distinct branchPath');
  }
  if (args.causalTick < args.parent.causalTick) {
    throw new Error('child causalTick cannot precede parent');
  }
  return {
    momentId: args.momentId,
    parentMomentId: args.parent.momentId,
    rootMomentId: args.parent.rootMomentId,
    branchPath: args.branchPath,
    causalTick: args.causalTick,
    events: (args.events ?? args.parent.events).map((event) => ({
      ...event,
      data: event.data ? { ...event.data } : undefined,
    })),
  };
}
