import { beforeAll, describe, expect, it } from 'vitest';
import { initE01Rapier } from '../src/e01-mechanical';
import {
  R3AE01Host,
  R3A_MAX_CATCHUP_TICKS,
  forkR3AFromMark,
} from '../src/medium-e01-interaction-host';

beforeAll(async () => {
  await initE01Rapier();
});

describe('MEDIUM-D/R3A exact material interaction host', () => {
  it('marks without changing continuation and catches A/B up exactly to live source', () => {
    const source = R3AE01Host.create();
    let a: R3AE01Host | null = null;
    let b: R3AE01Host | null = null;
    try {
      source.runTicks(300);
      const beforeMark = JSON.stringify(source.stableState());
      const mark = source.capture('moment:r3a:300');
      const afterMark = JSON.stringify(source.stableState());

      expect(afterMark).toBe(beforeMark);
      expect(mark.provenance.causalTick).toBe(300);

      source.runTicks(180);
      const sourceCurrent = source.stableState();

      const fork = forkR3AFromMark({
        moment: mark,
        sourceCurrentState: sourceCurrent,
        sourceCurrentTick: source.tick,
      });
      a = fork.a;
      b = fork.b;

      expect(fork.catchupTicks).toBe(180);
      expect(a.tick).toBe(source.tick);
      expect(b.tick).toBe(source.tick);
      expect(a.stableState()).toEqual(sourceCurrent);
      expect(b.stableState()).toEqual(sourceCurrent);
    } finally {
      a?.destroy();
      b?.destroy();
      source.destroy();
    }
  });

  it('keeps branch A exact while branch-B HostBindingId impulse creates the first material divergence after intervention', () => {
    const source = R3AE01Host.create();
    let a: R3AE01Host | null = null;
    let b: R3AE01Host | null = null;
    try {
      source.runTicks(300);
      const mark = source.capture('moment:r3a:300');
      source.runTicks(120);

      const fork = forkR3AFromMark({
        moment: mark,
        sourceCurrentState: source.stableState(),
        sourceCurrentTick: source.tick,
      });
      a = fork.a;
      b = fork.b;

      expect(a.stableState()).toEqual(b.stableState());
      expect(a.getProvenance().events).toHaveLength(0);
      expect(b.getProvenance().events).toHaveLength(0);

      const interventionTick = b.tick;
      b.applyLooseImpulse(1.1, -0.35, 'event:r3a:B:impulse');
      expect(a.getProvenance().events).toHaveLength(0);
      expect(b.getProvenance().events).toHaveLength(1);
      expect(b.getProvenance().events[0]).toMatchObject({
        causalTick: interventionTick,
        kind: 'owner-material-impulse',
      });

      // Impulse mutates velocity immediately; the branches are already materially
      // distinct at the intervention boundary. This is a legitimate physical
      // divergence, not a later scenario flag.
      expect(a.stableState()).not.toEqual(b.stableState());

      a.step();
      b.step();
      expect(a.stableState()).not.toEqual(b.stableState());

      console.log('MEDIUM_D_R3A_HOST_RESULT ' + JSON.stringify({
        markTick: 300,
        catchupTicks: 120,
        interventionTick,
        branchAEvents: a.getProvenance().events.length,
        branchBEvent: b.getProvenance().events[0],
        divergentAfterImpulse: true,
      }));
    } finally {
      a?.destroy();
      b?.destroy();
      source.destroy();
    }
  });

  it('fails closed when a mark is older than the defended catch-up horizon', () => {
    const source = R3AE01Host.create();
    try {
      source.runTicks(100);
      const mark = source.capture('moment:r3a:100');
      source.runTicks(R3A_MAX_CATCHUP_TICKS + 1);
      expect(() =>
        forkR3AFromMark({
          moment: mark,
          sourceCurrentState: source.stableState(),
          sourceCurrentTick: source.tick,
        }),
      ).toThrow(/mark is .* ticks old/);
    } finally {
      source.destroy();
    }
  });
});
