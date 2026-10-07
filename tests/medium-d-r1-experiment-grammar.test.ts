import { beforeAll, describe, expect, it } from 'vitest';
import { initE0Rapier } from '../src/e0-body-seam';
import {
  appendExperimentEventV1,
} from '../src/medium-experiment-moment-v1';
import {
  childProvenance,
  type ExperimentProvenance,
} from '../src/medium-experiment-moment';
import {
  C01MomentHost,
  R5_CAPTURE_TICK,
} from '../src/medium-c01-moment-host';

type GrammarVerb =
  | 'MARK'
  | 'FORK'
  | 'INTERVENE'
  | 'RUN'
  | 'COMPARE'
  | 'NOTE';

type TranscriptRow = {
  verb: GrammarVerb;
  tick: number;
  branch?: string;
  layer?: string;
  detail: string;
};

type DivergenceLadder = {
  privateState: number | null;
  motorDemand: number | null;
  material: number | null;
  currentP0: number | null;
};

function provenance(): ExperimentProvenance {
  return {
    momentId: 'moment:d-r1:200',
    parentMomentId: null,
    rootMomentId: 'moment:d-r1:200',
    branchPath: 'root',
    causalTick: R5_CAPTURE_TICK,
    events: [],
  };
}

function privateKey(host: C01MomentHost): string {
  return JSON.stringify(host.getPrivateState());
}

function materialKey(host: C01MomentHost): string {
  const s = host.snapshot();
  return JSON.stringify({
    actor: s.actor,
    target: s.target,
    worldEventApplied: s.worldEventApplied,
  });
}

function p0Key(host: C01MomentHost): string {
  return JSON.stringify(host.getCurrentFrame());
}

function runInterventionComparison() {
  const source = C01MomentHost.create();
  try {
    source.runTo(R5_CAPTURE_TICK);
    const root = source.capture(provenance());

    const transcript: TranscriptRow[] = [
      {
        verb: 'MARK',
        tick: R5_CAPTURE_TICK,
        detail: 'capture exact causal moment M200',
      },
      {
        verb: 'FORK',
        tick: R5_CAPTURE_TICK,
        detail: 'restore sibling histories A/B from M200',
      },
    ];
    const notes: Array<{ tick: number; text: string }> = [];

    const a = C01MomentHost.restore(root);
    const b = C01MomentHost.restore(root);
    try {
      let provA = childProvenance({
        parent: root.provenance,
        momentId: 'moment:d-r1:A',
        branchPath: 'root/A',
        causalTick: R5_CAPTURE_TICK,
      });
      let provB = childProvenance({
        parent: root.provenance,
        momentId: 'moment:d-r1:B',
        branchPath: 'root/B',
        causalTick: R5_CAPTURE_TICK,
      });

      expect(materialKey(a)).toBe(materialKey(b));
      expect(p0Key(a)).toBe(p0Key(b));
      expect(privateKey(a)).toBe(privateKey(b));

      transcript.push({
        verb: 'INTERVENE',
        tick: R5_CAPTURE_TICK,
        branch: 'B',
        layer: 'PRIVATE_RESEARCH_CUT',
        detail: 'clear occupant-private lastSeen only',
      });
      b.clearPrivateLastSeen();
      provB = appendExperimentEventV1(provB, {
        eventId: 'event:d-r1:B:private-cut',
        causalTick: R5_CAPTURE_TICK,
        kind: 'experiment-intervention',
        data: {
          layer: 'PRIVATE_RESEARCH_CUT',
          operation: 'clear-lastSeen',
        },
      });

      const ladder: DivergenceLadder = {
        privateState:
          privateKey(a) === privateKey(b) ? null : R5_CAPTURE_TICK,
        motorDemand: null,
        material: null,
        currentP0: null,
      };

      transcript.push({
        verb: 'RUN',
        tick: R5_CAPTURE_TICK,
        detail: 'advance A/B synchronously for frozen 180-tick horizon',
      });

      for (let i = 0; i < 180; i += 1) {
        const sa = a.step();
        const sb = b.step();

        if (
          ladder.motorDemand === null &&
          sa.drive !== sb.drive
        ) {
          ladder.motorDemand = sa.tick;
        }
        if (
          ladder.material === null &&
          materialKey(a) !== materialKey(b)
        ) {
          ladder.material = sa.tick;
        }
        if (
          ladder.currentP0 === null &&
          p0Key(a) !== p0Key(b)
        ) {
          ladder.currentP0 = sa.tick;
        }
      }

      transcript.push({
        verb: 'COMPARE',
        tick: R5_CAPTURE_TICK + 180,
        detail:
          'compare first divergence by private -> motor -> material -> current P0 layers',
      });

      const beforeNoteA = JSON.stringify(a.snapshot());
      const beforeNoteB = JSON.stringify(b.snapshot());
      notes.push({
        tick: R5_CAPTURE_TICK + 180,
        text: 'Branch A acts from remembered evidence; branch B remains quiet after private-history cut.',
      });
      transcript.push({
        verb: 'NOTE',
        tick: R5_CAPTURE_TICK + 180,
        detail: 'attach Owner qualitative interpretation outside causal state',
      });
      expect(JSON.stringify(a.snapshot())).toBe(beforeNoteA);
      expect(JSON.stringify(b.snapshot())).toBe(beforeNoteB);

      const verbs = [...new Set(transcript.map((row) => row.verb))].sort();

      return {
        ladder,
        transcript,
        verbs,
        branchAEvents: provA.events,
        branchBEvents: provB.events,
        notes,
        branchAEnd: a.snapshot(),
        branchBEnd: b.snapshot(),
      };
    } finally {
      a.destroy();
      b.destroy();
    }
  } finally {
    source.destroy();
  }
}

function runNoteOnlyControl() {
  const source = C01MomentHost.create();
  try {
    source.runTo(R5_CAPTURE_TICK);
    const root = source.capture(provenance());
    const a = C01MomentHost.restore(root);
    const b = C01MomentHost.restore(root);
    try {
      const notes = [{
        tick: R5_CAPTURE_TICK,
        text: 'No causal intervention; annotation only.',
      }];

      expect(notes).toHaveLength(1);
      expect(materialKey(a)).toBe(materialKey(b));
      expect(privateKey(a)).toBe(privateKey(b));
      expect(p0Key(a)).toBe(p0Key(b));

      for (let i = 0; i < 180; i += 1) {
        const sa = a.step();
        const sb = b.step();
        expect(sb.drive).toBe(sa.drive);
        expect(privateKey(b)).toBe(privateKey(a));
        expect(materialKey(b)).toBe(materialKey(a));
        expect(p0Key(b)).toBe(p0Key(a));
      }

      return {
        noteCount: notes.length,
        endA: a.snapshot(),
        endB: b.snapshot(),
      };
    } finally {
      a.destroy();
      b.destroy();
    }
  } finally {
    source.destroy();
  }
}

describe('MEDIUM-D/R1 experiment grammar microprobe', () => {
  it('expresses a real private-history experiment and surfaces a layer-specific divergence ladder', () => {
    const first = runInterventionComparison();
    const repeat = runInterventionComparison();
    expect(repeat).toEqual(first);

    expect(first.ladder.privateState).toBe(200);
    expect(first.ladder.motorDemand).toBe(231);
    expect(first.ladder.material).not.toBeNull();
    expect(first.ladder.material!).toBeGreaterThanOrEqual(
      first.ladder.motorDemand!,
    );
    if (first.ladder.currentP0 !== null) {
      expect(first.ladder.currentP0).toBeGreaterThanOrEqual(
        first.ladder.material!,
      );
    }

    expect(first.branchAEvents).toHaveLength(0);
    expect(first.branchBEvents).toHaveLength(1);
    expect(first.branchBEvents[0].data?.layer).toBe(
      'PRIVATE_RESEARCH_CUT',
    );

    expect(first.verbs).toEqual(
      ['COMPARE', 'FORK', 'INTERVENE', 'MARK', 'NOTE', 'RUN'].sort(),
    );
    expect(
      first.transcript.some((row) =>
        /C01|hide target|start check|reacquire/i.test(row.verb)
      ),
    ).toBe(false);

    console.log('MEDIUM_D_R1_RESULT ' + JSON.stringify({
      deterministic: true,
      ladder: first.ladder,
      verbs: first.verbs,
      branchBEvents: first.branchBEvents,
      noteCount: first.notes.length,
    }));
  });

  it('keeps NOTE-only metadata completely non-causal', () => {
    const control = runNoteOnlyControl();
    expect(control.noteCount).toBe(1);
    expect(control.endB).toEqual(control.endA);
  });
});
