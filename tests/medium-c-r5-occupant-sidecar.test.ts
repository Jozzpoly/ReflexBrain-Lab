import { beforeAll, describe, expect, it } from 'vitest';
import { initE0Rapier } from '../src/e0-body-seam';
import {
  appendExperimentEventV1,
  EXPERIMENT_MOMENT_SCHEMA_V1,
} from '../src/medium-experiment-moment-v1';
import { childProvenance, type ExperimentProvenance } from '../src/medium-experiment-moment';
import {
  C01MomentHost,
  R5_BUILD_IDENTITY,
  R5_CAPTURE_TICK,
  R5_PRIVATE_SCHEMA,
  validateC01MomentPrivateState,
  type C01MomentPrivateState,
  type C01MomentWorldProcessState,
} from '../src/medium-c01-moment-host';
import type { ExperimentMomentV1 } from '../src/medium-experiment-moment-v1';

beforeAll(async () => {
  await initE0Rapier();
});

function rootProvenance(): ExperimentProvenance {
  return {
    momentId: 'moment:r5:200',
    parentMomentId: null,
    rootMomentId: 'moment:r5:200',
    branchPath: 'root',
    causalTick: R5_CAPTURE_TICK,
    events: [],
  };
}

function cloneMoment(
  moment: ExperimentMomentV1<C01MomentWorldProcessState, C01MomentPrivateState>,
): ExperimentMomentV1<C01MomentWorldProcessState, C01MomentPrivateState> {
  return {
    ...moment,
    provenance: {
      ...moment.provenance,
      events: moment.provenance.events.map((event) => ({
        ...event,
        data: event.data ? { ...event.data } : undefined,
      })),
    },
    physicsSnapshot: moment.physicsSnapshot.slice(),
    hostBindings: JSON.parse(JSON.stringify(moment.hostBindings)),
    worldProcessState: JSON.parse(JSON.stringify(moment.worldProcessState)),
    occupantPrivateState: JSON.parse(JSON.stringify(moment.occupantPrivateState)),
  };
}

function physicalKey(host: C01MomentHost): string {
  const s = host.snapshot();
  return JSON.stringify({
    tick: s.causalTick,
    actor: s.actor,
    target: s.target,
    worldEventApplied: s.worldEventApplied,
  });
}

function runProbe() {
  const source = C01MomentHost.create();
  try {
    let firstLoss: number | null = null;
    for (let tick = 1; tick <= R5_CAPTURE_TICK; tick += 1) {
      const before = source.getCurrentFrame().blobs.length;
      const row = source.step();
      if (
        firstLoss === null &&
        before > 0 &&
        row.currentFrame.blobs.length === 0
      ) {
        firstLoss = row.tick;
      }
    }

    const capture = source.snapshot();
    expect(firstLoss).toBe(51);
    expect(capture.causalTick).toBe(200);
    expect(capture.currentFrame.blobs).toHaveLength(0);
    expect(capture.privateState.lastSeen).not.toBeNull();
    expect(capture.privateState.lastSeen?.privateTick).toBe(51);
    expect(capture.privateState.mode).toBe('QUIET');
    expect(capture.privateState.privateTick).toBe(200);
    expect(capture.worldEventApplied).toBe(true);

    const moment = source.capture(rootProvenance());
    expect(moment.schemaVersion).toBe(EXPERIMENT_MOMENT_SCHEMA_V1);
    expect(moment.buildIdentity).toBe(R5_BUILD_IDENTITY);
    expect(moment.occupantPrivateStateSchema).toBe(R5_PRIVATE_SCHEMA);

    const restored = C01MomentHost.restore(moment);
    try {
      expect(restored.snapshot()).toEqual(source.snapshot());
      expect(restored.getCurrentFrame()).toEqual(source.getCurrentFrame());

      let firstCheck: number | null = null;
      let firstReobserved: number | null = null;
      for (let i = 0; i < 220; i += 1) {
        const a = source.step();
        const b = restored.step();
        expect(b).toEqual(a);
        if (firstCheck === null && a.snapshot.privateState.mode === 'CHECK') {
          firstCheck = a.tick;
        }
        if (
          firstCheck !== null &&
          firstReobserved === null &&
          a.currentFrame.blobs.length > 0
        ) {
          firstReobserved = a.tick;
        }
      }
      expect(firstCheck).toBe(231);
      expect(firstReobserved).toBe(318);

      const branchA = C01MomentHost.restore(moment);
      const branchB = C01MomentHost.restore(moment);
      try {
        let provenanceA = childProvenance({
          parent: moment.provenance,
          momentId: 'moment:r5:A',
          branchPath: 'root/A',
          causalTick: R5_CAPTURE_TICK,
        });
        let provenanceB = childProvenance({
          parent: moment.provenance,
          momentId: 'moment:r5:B',
          branchPath: 'root/B',
          causalTick: R5_CAPTURE_TICK,
        });
        provenanceB = appendExperimentEventV1(provenanceB, {
          eventId: 'event:r5:B:memory-ablation',
          causalTick: R5_CAPTURE_TICK,
          kind: 'occupant-private-memory-ablation',
          data: { field: 'lastSeen', action: 'clear' },
        });

        expect(physicalKey(branchA)).toBe(physicalKey(branchB));
        branchB.clearPrivateLastSeen();
        expect(physicalKey(branchA)).toBe(physicalKey(branchB));
        expect(branchA.getPrivateState().lastSeen).not.toBeNull();
        expect(branchB.getPrivateState().lastSeen).toBeNull();

        let firstDriveDivergence: number | null = null;
        let firstPhysicalDivergence: number | null = null;
        let branchACheck: number | null = null;
        let branchBCheck: number | null = null;

        for (let i = 0; i < 180; i += 1) {
          const a = branchA.step();
          const b = branchB.step();

          if (
            firstDriveDivergence === null &&
            a.drive !== b.drive
          ) {
            firstDriveDivergence = a.tick;
          }
          if (
            firstPhysicalDivergence === null &&
            physicalKey(branchA) !== physicalKey(branchB)
          ) {
            firstPhysicalDivergence = a.tick;
          }
          if (
            branchACheck === null &&
            a.snapshot.privateState.mode === 'CHECK'
          ) {
            branchACheck = a.tick;
          }
          if (
            branchBCheck === null &&
            b.snapshot.privateState.mode === 'CHECK'
          ) {
            branchBCheck = b.tick;
          }
        }

        expect(firstDriveDivergence).toBe(231);
        expect(firstPhysicalDivergence).not.toBeNull();
        expect(firstPhysicalDivergence!).toBeGreaterThanOrEqual(
          firstDriveDivergence!,
        );
        expect(branchACheck).toBe(231);
        expect(branchBCheck).toBeNull();
        expect(provenanceA.events).toHaveLength(0);
        expect(provenanceB.events).toHaveLength(1);
        expect(provenanceB.events[0].kind).toBe(
          'occupant-private-memory-ablation',
        );

        return {
          firstLoss,
          rootLastSeenTick: capture.privateState.lastSeen?.privateTick ?? null,
          rootPrivateTick: capture.privateState.privateTick,
          exactFirstCheck: firstCheck,
          exactFirstReobserved: firstReobserved,
          firstDriveDivergence,
          firstPhysicalDivergence,
          branchACheck,
          branchBCheck,
          branchAEnd: branchA.snapshot(),
          branchBEnd: branchB.snapshot(),
          provenanceA,
          provenanceB,
          snapshotBytes: moment.physicsSnapshot.byteLength,
        };
      } finally {
        branchA.destroy();
        branchB.destroy();
      }
    } finally {
      restored.destroy();
    }
  } finally {
    source.destroy();
  }
}

describe('MEDIUM-C/R5 actor-private sidecar exact moment', () => {
  it('restores and forks legal private history without reconstructing memory from World truth', () => {
    const first = runProbe();
    const second = runProbe();
    expect(second).toEqual(first);

    console.log('MEDIUM_C_R5_RESULT ' + JSON.stringify({
      deterministic: true,
      firstLoss: first.firstLoss,
      rootLastSeenTick: first.rootLastSeenTick,
      rootPrivateTick: first.rootPrivateTick,
      exactFirstCheck: first.exactFirstCheck,
      exactFirstReobserved: first.exactFirstReobserved,
      firstDriveDivergence: first.firstDriveDivergence,
      firstPhysicalDivergence: first.firstPhysicalDivergence,
      branchACheck: first.branchACheck,
      branchBCheck: first.branchBCheck,
      snapshotBytes: first.snapshotBytes,
      branchBEvents: first.provenanceB.events,
    }));
  });

  it('fails closed on missing/wrong/private-host-contaminated occupant sidecars', () => {
    const host = C01MomentHost.create();
    try {
      host.runTo(R5_CAPTURE_TICK);
      const moment = host.capture(rootProvenance());

      const missing = cloneMoment(moment) as any;
      delete missing.occupantPrivateState;
      expect(() => C01MomentHost.restore(missing)).toThrow(
        /missing occupantPrivateState/,
      );

      const wrongPrivateSchema = cloneMoment(moment);
      wrongPrivateSchema.occupantPrivateStateSchema =
        'reflexbrain.wrong-private.v0';
      expect(() => C01MomentHost.restore(wrongPrivateSchema)).toThrow(
        /occupant private schema mismatch/,
      );

      const wrongBuild = cloneMoment(moment);
      wrongBuild.buildIdentity = 'wrong-build';
      expect(() => C01MomentHost.restore(wrongBuild)).toThrow(
        /build mismatch/,
      );

      const wrongEnvelope = cloneMoment(moment) as any;
      wrongEnvelope.schemaVersion = 'reflexbrain.experiment-moment.v0';
      expect(() => C01MomentHost.restore(wrongEnvelope)).toThrow(
        /unsupported ExperimentMoment schema/,
      );

      const contaminated = cloneMoment(moment) as any;
      contaminated.occupantPrivateState.targetBindingId =
        moment.worldProcessState.roles.target;
      expect(() => C01MomentHost.restore(contaminated)).toThrow(
        /unknown\/missing fields/,
      );

      // Explicit validator check: a perfectly plausible World-side field is
      // still forbidden inside private state.
      expect(() =>
        validateC01MomentPrivateState({
          ...moment.occupantPrivateState,
          targetWorldX: moment.worldProcessState.causalTick,
        }),
      ).toThrow(/unknown\/missing fields/);
    } finally {
      host.destroy();
    }
  });
});
