import { beforeAll, describe, expect, it } from 'vitest';
import { initE01Rapier } from '../src/e01-mechanical';
import { R3BShadowMarkSession } from '../src/medium-shadow-mark';
import {
  createR3EProjection,
  deriveSpatialProxyCircle,
  materialImpulseFromGesture,
  R3E_MAX_IMPULSE,
} from '../src/medium-spatial-interaction';

beforeAll(async () => {
  await initE01Rapier();
});

function runCausalGestureProbe() {
  const session = R3BShadowMarkSession.create();
  try {
    for (let i = 0; i < 300; i += 1) session.step();
    const mark = session.mark('moment:r3e:300');
    expect(mark.immediateEqual).toBe(true);

    for (let i = 0; i < 720; i += 1) session.step();
    const exposure = session.exposeFork();
    expect(exposure.ageTicks).toBe(720);

    const visible = session.getVisible();
    const reference = session.getReference();
    if (!reference) throw new Error('R3E reference missing');

    expect(visible.stableState()).toEqual(reference.stableState());
    expect(visible.getProvenance().events).toHaveLength(0);
    expect(reference.getProvenance().events).toHaveLength(0);

    const snap = visible.snapshot();
    if (!snap.loose) throw new Error('R3E loose body missing');

    const projection = createR3EProjection(1200, 620);
    const screenCenter = projection.worldToScreen({
      x: snap.loose.x,
      y: snap.loose.y,
    });
    const proxy = deriveSpatialProxyCircle({
      viewportWidth: 1200,
      viewportHeight: 620,
      worldCenter: { x: snap.loose.x, y: snap.loose.y },
      worldRadius: 0.32,
    });

    expect(proxy.center.x).toBeCloseTo(screenCenter.x, 12);
    expect(proxy.center.y).toBeCloseTo(screenCenter.y, 12);
    expect(proxy.hitRadiusPx).toBeGreaterThan(proxy.visualRadiusPx);

    // Merely deriving/updating the proxy is presentation-only.
    expect(visible.stableState()).toEqual(reference.stableState());
    expect(visible.getProvenance().events).toHaveLength(0);

    const tiny = materialImpulseFromGesture({
      bodyWorld: { x: snap.loose.x, y: snap.loose.y },
      pointerWorld: { x: snap.loose.x + 0.01, y: snap.loose.y },
    });
    expect(tiny).toEqual({ kind: 'none', reason: 'below-threshold' });
    expect(visible.getProvenance().events).toHaveLength(0);
    expect(visible.stableState()).toEqual(reference.stableState());

    const mapped = materialImpulseFromGesture({
      bodyWorld: { x: snap.loose.x, y: snap.loose.y },
      pointerWorld: { x: snap.loose.x + 4, y: snap.loose.y - 2 },
    });
    expect(mapped.kind).toBe('impulse');
    if (mapped.kind !== 'impulse') throw new Error('expected impulse mapping');
    expect(mapped.appliedMagnitude).toBeCloseTo(R3E_MAX_IMPULSE, 12);

    const interventionTick = visible.tick;
    session.applyWorkingImpulse(
      mapped.impulse.x,
      mapped.impulse.y,
      'event:r3e:B:spatial-proxy-impulse',
    );

    expect(reference.getProvenance().events).toHaveLength(0);
    expect(visible.getProvenance().events).toHaveLength(1);
    expect(visible.getProvenance().events[0]).toMatchObject({
      causalTick: interventionTick,
      kind: 'owner-material-impulse',
      targetBindingId: visible.roles.loose,
    });
    expect(visible.stableState()).not.toEqual(reference.stableState());

    return {
      markTick: mark.tick,
      exposureTick: exposure.currentTick,
      ageTicks: exposure.ageTicks,
      interventionTick,
      impulse: mapped.impulse,
      appliedMagnitude: mapped.appliedMagnitude,
      referenceEvents: reference.getProvenance().events.length,
      workingEvent: visible.getProvenance().events[0],
    };
  } finally {
    session.destroy();
  }
}

describe('MEDIUM-D/R3E derived spatial interaction projection', () => {
  it('shares one invertible projection for render, proxy placement and pointer conversion', () => {
    for (const [width, height] of [
      [800, 420],
      [1200, 620],
      [1600, 900],
    ] as const) {
      const projection = createR3EProjection(width, height);
      for (const point of [
        { x: -4.35, y: 0 },
        { x: -0.1, y: 0.48 },
        { x: 3.2, y: -0.75 },
        { x: 0, y: 0 },
      ]) {
        const screen = projection.worldToScreen(point);
        const roundTrip = projection.screenToWorld(screen);
        expect(roundTrip.x).toBeCloseTo(point.x, 12);
        expect(roundTrip.y).toBeCloseTo(point.y, 12);
      }
    }
  });

  it('keeps proxy derivation and cancelled/subthreshold gestures non-causal, then applies one B-only event on release', () => {
    const first = runCausalGestureProbe();
    const repeat = runCausalGestureProbe();
    expect(repeat).toEqual(first);

    console.log('MEDIUM_D_R3E_RESULT ' + JSON.stringify({
      deterministic: true,
      markTick: first.markTick,
      exposureTick: first.exposureTick,
      ageTicks: first.ageTicks,
      interventionTick: first.interventionTick,
      appliedMagnitude: first.appliedMagnitude,
      referenceEvents: first.referenceEvents,
      workingEvent: first.workingEvent,
    }));
  });

  it('fails closed when the working loose-body HostBindingId is retired', () => {
    const session = R3BShadowMarkSession.create();
    try {
      for (let i = 0; i < 120; i += 1) session.step();
      session.mark('moment:r3e:retire');
      for (let i = 0; i < 360; i += 1) session.step();
      session.exposeFork();

      const working = session.getVisible();
      const reference = session.getReference();
      if (!reference) throw new Error('R3E reference missing');

      const looseId = working.roles.loose;
      working.registry.retire(looseId, working.tick);

      expect(() =>
        session.applyWorkingImpulse(
          0.8,
          -0.2,
          'event:r3e:should-not-exist',
        ),
      ).toThrow(/not live/);

      expect(working.getProvenance().events).toHaveLength(0);
      expect(reference.getProvenance().events).toHaveLength(0);
    } finally {
      session.destroy();
    }
  });

  it('rejects invalid projection and non-finite gesture inputs', () => {
    expect(() => createR3EProjection(0, 500)).toThrow(/positive finite/);
    expect(() =>
      materialImpulseFromGesture({
        bodyWorld: { x: 0, y: 0 },
        pointerWorld: { x: Number.NaN, y: 0 },
      }),
    ).toThrow(/must be finite/);
  });
});
