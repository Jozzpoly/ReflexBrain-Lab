import { beforeAll, describe, expect, it } from 'vitest';
import {
  E0_ANGULAR_DAMPING,
  E0_DT,
  E0_FMAX,
  E0_LINEAR_DAMPING,
  E0_OMEGA_MAX,
  E0_TMAX,
  E0_VMAX,
  applyE0Demand,
  createE0Body,
  createE0Wall,
  createE0World,
  e0BytesEqual,
  e0PairImpulse,
  initE0Rapier,
  wrapE0Pi,
} from '../src/e0-body-seam';

beforeAll(async () => {
  await initE0Rapier();
});

function close(actual: number, expected: number, tol: number, label: string) {
  expect(
    Math.abs(actual - expected),
    `${label}: expected ${expected} ± ${tol}, got ${actual}`,
  ).toBeLessThanOrEqual(tol);
}

function runFreeReverse() {
  const w = createE0World();
  const a = createE0Body(w, 0, 0, 1, 1);

  for (let t = 0; t < 240; t += 1) {
    applyE0Demand(a.rb, 1, 0);
    w.step();
  }

  const steady = a.rb.linvel().x;
  const x0 = a.rb.translation().x;

  applyE0Demand(a.rb, -1, 0);
  w.step();
  const afterOne = a.rb.linvel().x;

  let crossTick: number | null = null;
  let crossX: number | null = null;

  for (let t = 1; t <= 120; t += 1) {
    applyE0Demand(a.rb, -1, 0);
    w.step();
    if (crossTick === null && a.rb.linvel().x <= 0) {
      crossTick = t + 1;
      crossX = a.rb.translation().x;
      break;
    }
  }

  const overshoot = (crossX ?? a.rb.translation().x) - x0;
  w.free();

  return { steady, afterOne, crossTick, overshoot };
}

function runTransientPush(objectMass: number) {
  const w = createE0World();
  const a = createE0Body(w, 0, 0, 1, 1, 0, 0);
  const o = createE0Body(w, 1.70, 0, objectMass, 0.7, 0, 0);

  applyE0Demand(a.rb, 1, 0);
  w.step();

  let contacts = 0;
  w.contactPair(a.co, o.co, () => {
    contacts += 1;
  });

  const out = {
    actorV: a.rb.linvel().x,
    objectV: o.rb.linvel().x,
    contacts,
  };

  w.free();
  return out;
}

function runSustainedPush(objectMass: number) {
  const w = createE0World();
  const a = createE0Body(w, 0, 0, 1, 1);
  const o = createE0Body(w, 1.70, 0, objectMass, 0.7);

  let contactTicks = 0;

  for (let t = 0; t < 480; t += 1) {
    applyE0Demand(a.rb, 1, 0);
    w.step();
    w.contactPair(a.co, o.co, () => {
      contactTicks += 1;
    });
  }

  const out = {
    speed: a.rb.linvel().x,
    contactTicks,
  };

  w.free();
  return out;
}

function runPassiveShove() {
  const w = createE0World();
  const a = createE0Body(w, 0, 0, 1, 1);

  a.rb.applyImpulse({ x: 0, y: 4 }, true);
  w.step();

  const initial = Math.abs(a.rb.linvel().y);
  let prev = initial;
  let maxRise = 0;

  for (let t = 0; t < 120; t += 1) {
    applyE0Demand(a.rb, 0, 0);
    w.step();
    const cur = Math.abs(a.rb.linvel().y);
    maxRise = Math.max(maxRise, cur - prev);
    prev = cur;
  }

  const final = Math.abs(a.rb.linvel().y);
  w.free();

  return { initial, final, ratio: final / initial, maxRise };
}

function runCurveSignature() {
  const w = createE0World();
  const a = createE0Body(w, 0, 0, 1, 1);

  for (let t = 0; t < 720; t += 1) {
    applyE0Demand(a.rb, 1, 1);
    w.step();
  }

  const v = a.rb.linvel();
  const heading = a.rb.rotation();
  const speed = Math.hypot(v.x, v.y);
  const omega = a.rb.angvel();
  const slip = Math.abs(wrapE0Pi(Math.atan2(v.y, v.x) - heading));
  const predicted = Math.atan(E0_OMEGA_MAX / E0_LINEAR_DAMPING);

  w.free();

  return { speed, omega, slip, predicted };
}

function runLongBracing() {
  const w = createE0World();
  const a = createE0Body(w, 0, 0, 1, 1);
  const h = createE0Body(w, 2.5, 0, 3, 1);
  const wall = createE0Wall(w, 5, 0, 0.25, 3);

  let minAX = Infinity;
  let maxAX = -Infinity;
  let minHX = Infinity;
  let maxHX = -Infinity;
  let maxAV = 0;
  let maxHV = 0;
  let lastAH = 0;
  let lastHW = 0;

  for (let t = 0; t < 1440; t += 1) {
    applyE0Demand(a.rb, 1, 0);
    w.step();

    if (t >= 720) {
      const ap = a.rb.translation();
      const hp = h.rb.translation();
      minAX = Math.min(minAX, ap.x);
      maxAX = Math.max(maxAX, ap.x);
      minHX = Math.min(minHX, hp.x);
      maxHX = Math.max(maxHX, hp.x);
      maxAV = Math.max(maxAV, Math.abs(a.rb.linvel().x));
      maxHV = Math.max(maxHV, Math.abs(h.rb.linvel().x));
    }

    if (t === 1439) {
      lastAH = e0PairImpulse(w, a.co.handle, h.co.handle).impulse;
      lastHW = e0PairImpulse(w, h.co.handle, wall.co.handle).impulse;
    }
  }

  const out = {
    actorDrift: maxAX - minAX,
    heavyDrift: maxHX - minHX,
    maxAV,
    maxHV,
    lastAH,
    lastHW,
  };

  w.free();
  return out;
}

function runCausalReplay() {
  const w = createE0World();
  const actor = createE0Body(w, 0, 0, 1, 1);
  const heavy = createE0Body(w, 2.5, 0, 3, 1);
  const wall = createE0Wall(w, 5, 0, 0.25, 3);

  const ah = actor.rb.handle;
  const hh = heavy.rb.handle;
  const ac = actor.co.handle;
  const hc = heavy.co.handle;
  const wc = wall.co.handle;

  const scripted = (world: any, t: number, perturb = false) => {
    const a = world.getRigidBody(ah);
    let turn = t >= 280 && t < 330 ? 0.35 : 0;
    if (perturb && t === 317) turn += 0.001;
    applyE0Demand(a, 1, turn);
    world.step();
  };

  for (let t = 0; t < 240; t += 1) scripted(w, t, false);

  const cp = w.takeSnapshot();
  const a0 = w.getRigidBody(ah);
  const h0 = w.getRigidBody(hh);
  const actorHeavy = e0PairImpulse(w, ac, hc);
  const heavyWall = e0PairImpulse(w, hc, wc);

  const cpState = {
    ax: a0.translation().x,
    av: a0.linvel().x,
    hx: h0.translation().x,
    hv: h0.linvel().x,
    actorHeavyImpulse: actorHeavy.impulse,
    heavyWallImpulse: heavyWall.impulse,
    actorHeavyContacts: actorHeavy.solverContacts,
    heavyWallContacts: heavyWall.solverContacts,
  };

  for (let t = 240; t < 480; t += 1) scripted(w, t, false);
  const endA = w.takeSnapshot();
  const endARb = w.getRigidBody(ah);
  const endAState = {
    x: endARb.translation().x,
    y: endARb.translation().y,
    a: endARb.rotation(),
    vx: endARb.linvel().x,
    vy: endARb.linvel().y,
    omega: endARb.angvel(),
  };

  const twin = (E0_RAPIER as any).World.restoreSnapshot(cp);
  twin.timestep = E0_DT;
  for (let t = 240; t < 480; t += 1) scripted(twin, t, false);
  const endB = twin.takeSnapshot();

  const changed = (E0_RAPIER as any).World.restoreSnapshot(cp);
  changed.timestep = E0_DT;
  for (let t = 240; t < 480; t += 1) scripted(changed, t, true);
  const endC = changed.takeSnapshot();
  const endCRb = changed.getRigidBody(ah);
  const endCState = {
    x: endCRb.translation().x,
    y: endCRb.translation().y,
    a: endCRb.rotation(),
    vx: endCRb.linvel().x,
    vy: endCRb.linvel().y,
    omega: endCRb.angvel(),
  };

  const exact = e0BytesEqual(endA, endB);
  const divergent = !e0BytesEqual(endA, endC);
  const stateDelta =
    Math.abs(endAState.x - endCState.x) +
    Math.abs(endAState.y - endCState.y) +
    Math.abs(endAState.a - endCState.a) +
    Math.abs(endAState.vx - endCState.vx) +
    Math.abs(endAState.vy - endCState.vy) +
    Math.abs(endAState.omega - endCState.omega);

  const jammed =
    Math.abs(cpState.av) < 0.08 &&
    Math.abs(cpState.hv) < 0.08 &&
    cpState.hx > 3.65 &&
    cpState.hx < 3.85;

  const reciprocalContact =
    cpState.actorHeavyContacts > 0 &&
    cpState.heavyWallContacts > 0 &&
    cpState.actorHeavyImpulse > 1e-5 &&
    cpState.heavyWallImpulse > 1e-5;

  w.free();
  twin.free();
  changed.free();

  return {
    exact,
    divergent,
    stateDelta,
    braced: jammed && reciprocalContact,
    actorHeavyImpulse: cpState.actorHeavyImpulse,
    heavyWallImpulse: cpState.heavyWallImpulse,
  };
}

// Imported late to keep the extraction surface itself minimal.
import { E0_RAPIER } from '../src/e0-body-seam';

describe('OCTRL-B01a E0 reusable seam parity', () => {
  it('preserves frozen E0 constants and mechanical signature', () => {
    close(E0_DT, 1 / 120, 1e-15, 'DT');
    close(E0_VMAX, 5.2631578947, 1e-12, 'VMAX');
    close(E0_OMEGA_MAX, 2.0, 1e-12, 'OMEGA_MAX');
    expect(E0_FMAX).toBeGreaterThan(0);
    expect(E0_TMAX).toBeGreaterThan(0);
    expect(E0_ANGULAR_DAMPING).toBeGreaterThan(0);

    const reverse = runFreeReverse();
    close(reverse.steady, 5.26298, 5e-5, 'free steady');
    close(reverse.afterOne, 4.82482, 5e-5, 'after one reverse');
    expect(reverse.crossTick).toBe(17);
    close(reverse.overshoot, 0.31856, 5e-5, 'reverse overshoot');

    const transientLight = runTransientPush(1);
    const transientHeavy = runTransientPush(4);
    close(transientLight.actorV, 0.114299, 5e-6, 'transient light actorV');
    close(transientHeavy.actorV, 0.045720, 5e-6, 'transient heavy actorV');
    close(
      transientLight.actorV / transientHeavy.actorV,
      2.5,
      5e-4,
      'transient ratio',
    );

    const sustainedLight = runSustainedPush(1);
    const sustainedHeavy = runSustainedPush(4);
    close(sustainedLight.speed, 2.63158, 5e-5, 'sustained light speed');
    close(sustainedHeavy.speed, 1.05263, 5e-5, 'sustained heavy speed');
    expect(sustainedLight.contactTicks).toBe(480);
    expect(sustainedHeavy.contactTicks).toBe(480);

    const shove = runPassiveShove();
    close(shove.initial, 3.83350, 5e-5, 'passive shove initial');
    close(shove.final, 0.02332, 5e-5, 'passive shove final');
    close(shove.ratio, 0.00608, 5e-5, 'passive shove ratio');
    expect(shove.maxRise).toBeLessThanOrEqual(1e-9);

    const curve = runCurveSignature();
    close(curve.speed, 4.87544, 5e-5, 'curve speed');
    close(curve.omega, 2.0, 5e-5, 'curve omega');
    close(curve.slip * 180 / Math.PI, 22.63, 0.02, 'curve slip deg');
    close(curve.predicted * 180 / Math.PI, 20.99, 0.02, 'curve predicted deg');

    const bracing = runLongBracing();
    expect(bracing.actorDrift).toBeLessThanOrEqual(1e-8);
    expect(bracing.heavyDrift).toBeLessThanOrEqual(1e-8);
    close(bracing.maxAV, 2.355e-5, 5e-7, 'bracing max actor speed');
    expect(bracing.maxHV).toBeLessThanOrEqual(1e-8);
    close(bracing.lastAH, 0.28574771, 1e-6, 'bracing actor-heavy impulse');
    close(bracing.lastHW, 0.28574771, 1e-6, 'bracing heavy-wall impulse');

    const causal = runCausalReplay();
    expect(causal.exact).toBe(true);
    expect(causal.divergent).toBe(true);
    expect(causal.braced).toBe(true);
    close(causal.stateDelta, 2.712e-4, 5e-7, 'causal state delta');
    close(causal.actorHeavyImpulse, 0.28574875, 1e-6, 'checkpoint actor-heavy impulse');
    close(causal.heavyWallImpulse, 0.28574875, 1e-6, 'checkpoint heavy-wall impulse');
  });
});
