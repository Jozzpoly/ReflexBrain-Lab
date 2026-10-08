import { beforeAll, describe, expect, it } from 'vitest';
import { initE01Rapier } from '../src/e01-mechanical';
import { R3AE01Host } from '../src/medium-e01-interaction-host';
import { R3BShadowMarkSession } from '../src/medium-shadow-mark';

const HUMAN_SCALE_TICKS = 36_000;
const SNAPSHOT_CHECK_INTERVAL = 600;

beforeAll(async () => {
  await initE01Rapier();
});

function bytesEqual(a: Uint8Array, b: Uint8Array): boolean {
  return a.length === b.length && a.every((value, i) => value === b[i]);
}

function stateKey(host: R3AE01Host): string {
  return JSON.stringify(host.stableState());
}

function assertExactTriple(
  control: R3AE01Host,
  reference: R3AE01Host,
  working: R3AE01Host,
  tick: number,
): void {
  const c = stateKey(control);
  const a = stateKey(reference);
  const b = stateKey(working);
  if (c !== a || c !== b) {
    throw new Error('R3B stable-state drift at post-MARK tick ' + tick);
  }
}

function assertPhysicsBytesTriple(
  control: R3AE01Host,
  reference: R3AE01Host,
  working: R3AE01Host,
  tick: number,
): void {
  const c = control.state.world.takeSnapshot();
  const a = reference.state.world.takeSnapshot();
  const b = working.state.world.takeSnapshot();
  if (!bytesEqual(c, a) || !bytesEqual(c, b)) {
    throw new Error('R3B Rapier snapshot-byte drift at post-MARK tick ' + tick);
  }
}

function runProbe() {
  const control = R3AE01Host.create();
  const session = R3BShadowMarkSession.create();
  try {
    for (let i = 0; i < 300; i += 1) {
      control.step();
      session.step();
    }

    expect(stateKey(session.getVisible())).toBe(stateKey(control));

    const mark = session.mark('moment:r3b:300');
    expect(mark).toEqual({ tick: 300, immediateEqual: true });

    const reference = session.getReference();
    if (!reference) throw new Error('R3B reference missing after MARK');
    const working = session.getVisible();

    assertExactTriple(control, reference, working, 0);
    assertPhysicsBytesTriple(control, reference, working, 0);
    expect(reference.getProvenance().events).toHaveLength(0);
    expect(working.getProvenance().events).toHaveLength(0);

    for (let i = 1; i <= HUMAN_SCALE_TICKS; i += 1) {
      control.step();
      session.step();

      assertExactTriple(control, reference, working, i);

      if (i % SNAPSHOT_CHECK_INTERVAL === 0) {
        assertPhysicsBytesTriple(control, reference, working, i);
      }
    }

    const beforeExposure = stateKey(working);
    const exposure = session.exposeFork();
    const afterExposure = stateKey(working);

    expect(exposure).toEqual({
      markTick: 300,
      currentTick: 300 + HUMAN_SCALE_TICKS,
      ageTicks: HUMAN_SCALE_TICKS,
    });
    expect(afterExposure).toBe(beforeExposure);
    expect(stateKey(reference)).toBe(beforeExposure);
    expect(reference.getProvenance().events).toHaveLength(0);
    expect(working.getProvenance().events).toHaveLength(0);

    const interventionTick = working.tick;
    session.applyWorkingImpulse(
      1.1,
      -0.35,
      'event:r3b:B:late-material-impulse',
    );

    expect(reference.getProvenance().events).toHaveLength(0);
    expect(working.getProvenance().events).toHaveLength(1);
    expect(working.getProvenance().events[0]).toMatchObject({
      causalTick: interventionTick,
      kind: 'owner-material-impulse',
    });

    expect(stateKey(reference)).toBe(stateKey(control));
    expect(stateKey(working)).not.toBe(stateKey(reference));

    control.step();
    session.step();

    expect(stateKey(reference)).toBe(stateKey(control));
    expect(stateKey(working)).not.toBe(stateKey(reference));

    return {
      markTick: mark.tick,
      humanScaleTicks: HUMAN_SCALE_TICKS,
      forkExposureTick: exposure.currentTick,
      markAgeAtExposure: exposure.ageTicks,
      referenceEventsBeforeIntervention: 0,
      workingEventsAfterIntervention: working.getProvenance().events.length,
      interventionTick,
      referenceStillMatchesControl: stateKey(reference) === stateKey(control),
      workingDiverged: stateKey(working) !== stateKey(reference),
    };
  } finally {
    session.destroy();
    control.destroy();
  }
}

describe('MEDIUM-D/R3B human-scale hidden exact shadow', () => {
  it('keeps MARK causally neutral and exact for five minutes of simulated time before late FORK exposure', () => {
    const first = runProbe();
    const second = runProbe();
    expect(second).toEqual(first);

    console.log('MEDIUM_D_R3B_RESULT ' + JSON.stringify({
      deterministic: true,
      ...first,
      secondsAt1x: first.humanScaleTicks / 120,
    }));
  }, 20_000);
});
