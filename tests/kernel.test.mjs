// tests/kernel.test.mjs — twarde testy regresyjne szwu prywatnosci, metryk i wszystkich 5 warstw MEDIUM-D/R0.

import assert from 'node:assert/strict';
import {
  PERCEPTION_MODES,
  createRng,
  auditObservation,
  sealObservation,
  stableDigest,
  normalizeExposureMetrics,
} from '../kernel/seam.mjs';
import {
  INTERVENTION_LAYERS,
  createDivergenceTracker,
  createLabSession,
} from '../kernel/fork-microscope.mjs';
import { createCalibratorWorld, createCalibratorMind } from '../proby/00-kalibrator-mikroskopu/world.mjs';

console.log('=== TEST 1: seam.mjs — prywatnosc, TypedArray, stableDigest, createRng(0) ===');
{
  // Seed 0 i 1 musza dawac rozne strumienie!
  const r0 = createRng(0);
  const r1 = createRng(1);
  assert.notEqual(r0.next(), r1.next(), 'createRng(0) i createRng(1) nie moga kolidowac');
  r0.setState(0);
  assert.equal(r0.getState(), 0, 'setState(0) musi zachowac 0');

  // TypedArray w obs nie moze wysypac deepFreeze!
  const typedObs = { retina: new Float32Array([0.1, 0.2, 0.3]), touch: { front: 0 } };
  const sealedTyped = sealObservation(typedObs, { perceptionMode: PERCEPTION_MODES.RAW });
  assert.equal(sealedTyped.retina.length, 3);
  sealedTyped.retina[0] = 99; // modyfikacja kopii nie rusza zrodla
  assert.ok(Math.abs(typedObs.retina[0] - 0.1) < 1e-6);

  // Blokada rozszerzonej listy przeciekow (case-insensitive + Map + cykle)
  const leaky = { retina: [{ rgb: [0.5, 0.2, 0.1], ID: 4, posX: 10, kind: 'food' }] };
  const auditRaw = auditObservation(leaky, { perceptionMode: PERCEPTION_MODES.RAW });
  assert.equal(auditRaw.ok, false);
  assert.ok(auditRaw.leaks.some((l) => l.key === 'ID'));
  assert.ok(auditRaw.leaks.some((l) => l.key === 'posX'));
  assert.ok(auditRaw.leaks.some((l) => l.key === 'kind'));
  assert.throws(() => sealObservation(leaky), /Seam privacy violation/);

  const cyclic = { a: 1 };
  cyclic.self = cyclic;
  assert.equal(auditObservation(cyclic).ok, true, 'Cykl nie moze wywolac stack overflow');

  const withTracklet = { retina: [{ rgb: [0.5, 0.2, 0.1], trackletId: 3 }] };
  assert.equal(auditObservation(withTracklet, { perceptionMode: PERCEPTION_MODES.RAW }).ok, false);
  assert.equal(auditObservation(withTracklet, { perceptionMode: PERCEPTION_MODES.TRACKLET }).ok, true);

  const withOracleId = { retina: [{ rgb: [0.5, 0.2, 0.1], entityId: 'puck-1' }] };
  assert.equal(auditObservation(withOracleId, { perceptionMode: PERCEPTION_MODES.TRACKLET }).ok, false);
  assert.equal(auditObservation(withOracleId, { perceptionMode: PERCEPTION_MODES.ENTITY_ORACLE }).ok, true);

  // Kanoniczny stableDigest: kolejnosci kluczy, NaN/Infinity/null/undefined, Map/Set, male delty < 5e-7
  assert.equal(stableDigest({ a: 1, b: 2 }), stableDigest({ b: 2, a: 1 }));
  assert.notEqual(stableDigest(NaN), stableDigest(null));
  assert.notEqual(stableDigest(Infinity), stableDigest(null));
  assert.notEqual(stableDigest(undefined), stableDigest(null));
  assert.notEqual(stableDigest(1e-8), stableDigest(2e-8));
  assert.notEqual(stableDigest(new Map([['a', 1]])), stableDigest(new Map([['a', 2]])));
  assert.notEqual(stableDigest(new Set([1])), stableDigest(new Set([2])));
  console.log('[PASS] seam.mjs (TypedArray, cykle, case-insensitive leaks, stableDigest, createRng(0))');
}

console.log('=== TEST 2: normalizeExposureMetrics (lekcja N12) ===');
{
  const gA = normalizeExposureMetrics([
    { aliveTicks: 1000, exposures: 20, events: { hit: 10 } },
    { aliveTicks: 1000, exposures: 20, events: { hit: 10 } },
  ]);
  const gB = normalizeExposureMetrics([
    { aliveTicks: 1000, exposures: 20, events: { hit: 10 } },
    { aliveTicks: 1000, exposures: 20, events: { hit: 10 } },
    { aliveTicks: 100, exposures: 2, events: { hit: 1 } },
    { aliveTicks: 100, exposures: 2, events: { hit: 1 } },
  ]);
  assert.ok(Math.abs(gA.per1kAliveTicks.hit - gB.per1kAliveTicks.hit) < 1e-9);
  assert.ok(Math.abs(gA.per100Exposures.hit - gB.per100Exposures.hit) < 1e-9);
  const gZero = normalizeExposureMetrics([{ aliveTicks: 0, exposures: 0, events: { hit: 0 } }]);
  assert.equal(gZero.per1kAliveTicks.hit, null, 'Przy 0 aliveTicks musi zwrocic null, nie 0');
  console.log('[PASS] normalizeExposureMetrics (niezmiennicze wobec narodzin + null przy 0 aliveTicks)');
}

console.log('=== TEST 3: fork-microscope.mjs — 5 warstw i trwalosc po >600 tickach ===');
{
  const session = createLabSession({
    createWorld: createCalibratorWorld,
    createMind: createCalibratorMind,
    seed: 13,
    perceptionMode: PERCEPTION_MODES.RAW,
  });

  for (let t = 0; t < 90; t++) session.stepBranch(session.main);
  const m = session.mark(session.main, 't90');

  // 3a. Determinizm bez interwencji
  const [a0, b0] = session.fork(m);
  const div0 = session.runSync(a0, b0, 120);
  assert.equal(div0.diverged, false);

  // 3b. PRIVATE_RESEARCH_CUT + bieg 750 tickow (> maxTrace=600!): pierwszy rozjazd NIE MOZE zniknac!
  const [a1, b1] = session.fork(m);
  session.intervene(b1, {
    layer: INTERVENTION_LAYERS.PRIVATE_RESEARCH_CUT,
    description: 'reset pamieci B',
    apply: ({ resetMind }) => resetMind('actor-0'),
  });
  const divLong = session.runSync(a1, b1, 750);
  assert.equal(divLong.diverged, true);
  assert.equal(divLong.earliest.tick, 91, 'Nawet po 750 tickach (>600) pierwszy rozjazd musi pozostac tick 91!');
  assert.equal(divLong.earliest.layer, 'privateState', 'Pierwsza warstwa musi pozostac privateState, nie observation!');
  assert.equal(divLong.comparedTicks, 750);

  // 3c. MATERIAL: przesuniecie krazka bezposrednio przed oczy -> rozjazd w observation!
  const [a2, b2] = session.fork(m);
  const snapA2 = a2.world.snapshot();
  const frontX = snapA2.actor.x + Math.cos(snapA2.actor.theta) * 90;
  const frontY = snapA2.actor.y + Math.sin(snapA2.actor.theta) * 90;
  session.intervene(b2, {
    layer: INTERVENTION_LAYERS.MATERIAL,
    description: 'postawienie krazka przed oczami',
    apply: ({ world }) => world.moveMovable(1, frontX, frontY),
  });
  const div2 = session.runSync(a2, b2, 20);
  assert.equal(div2.earliest.tick, 91);
  assert.equal(div2.earliest.layer, 'observation', 'Krazek przed oczami musi rozjechac sie dokladnie na warstwie observation');

  // 3d. MOTOR_AUTHORITY + RELEASE -> sprawdzamy ze override znika i umysl odzyskuje kontrole!
  const [a3, b3] = session.fork(m);
  session.intervene(b3, {
    layer: INTERVENTION_LAYERS.MOTOR_AUTHORITY,
    description: 'skret w prawo',
    apply: ({ setMotorOverride }) => setMotorOverride('actor-0', { thrust: 0.9, turn: 1.0 }),
  });
  const tracker3 = createDivergenceTracker(90);
  session.runSync(a3, b3, 10, { tracker: tracker3 });
  assert.equal(b3.motorOverrides.size, 1);
  // Release z inna warstwa (MATERIAL) NIE moze wykasowac override'u motoru!
  session.release(b3, { layer: INTERVENTION_LAYERS.MATERIAL, actorId: 'actor-0' });
  assert.equal(b3.motorOverrides.size, 1, 'Release MATERIAL nie moze kasowac MOTOR_AUTHORITY');
  // Wlasciwy RELEASE MOTOR_AUTHORITY
  session.release(b3, { layer: INTERVENTION_LAYERS.MOTOR_AUTHORITY, actorId: 'actor-0' });
  assert.equal(b3.motorOverrides.size, 0, 'Po RELEASE motorOverrides musi byc puste');
  const div3 = session.runSync(a3, b3, 10, { tracker: tracker3 });
  assert.equal(div3.earliest.tick, 91);
  assert.equal(div3.earliest.layer, 'action');

  // 3e. WORLD_REPLACEMENT + OCCUPANT_REPLACEMENT + pozniejszy fork()!
  const [a4, b4] = session.fork(m);
  const freshWorldFactory = (s) => createCalibratorWorld(s + 99);
  const frozenMindFactory = () => ({
    step: () => ({ action: { thrust: 0, turn: 0 }, appraisal: { frozen: true } }),
    reset() {},
    snapshot() { return { frozen: true }; },
    restore() {},
    digest() { return 'frozen00'; },
  });
  session.intervene(b4, {
    layer: INTERVENTION_LAYERS.WORLD_REPLACEMENT,
    description: 'swiezy swiat przy zachowanym umysle',
    apply: ({ replaceWorld }) => replaceWorld(freshWorldFactory(13), freshWorldFactory),
  });
  session.intervene(b4, {
    layer: INTERVENTION_LAYERS.OCCUPANT_REPLACEMENT,
    description: 'podmiana umyslu na zamrozony baseline',
    apply: ({ replaceMind }) => replaceMind('actor-0', frozenMindFactory(), frozenMindFactory),
  });
  const mAfterReplace = session.mark(b4, 'after-replace');
  const [c1, c2] = session.fork(mAfterReplace);
  assert.equal(c1.minds.get('actor-0').digest(), 'frozen00', 'Fork po OCCUPANT_REPLACEMENT musi zachowac nowa fabryke umyslu');
  assert.equal(session.runSync(c1, c2, 15).diverged, false);

  // 3f. Nieudana interwencja nie moze zasmiecic proweniencji
  const prevProvLen = b4.provenance.length;
  assert.throws(() => {
    session.intervene(b4, { layer: INTERVENTION_LAYERS.MATERIAL, apply: () => { throw new Error('boom'); } });
  }, /boom/);
  assert.equal(b4.provenance.length, prevProvLen, 'Rzucajaca blad interwencja nie moze trafic do provenance');

  // 3g. Nietrwalosc trackletId + brak efektu ubocznego w trybie RAW
  const wTr = createCalibratorWorld(7);
  const obsT1 = wTr.observe('actor-0', PERCEPTION_MODES.TRACKLET);
  const ids1 = new Set(obsT1.retina.filter((r) => r.trackletId).map((r) => r.trackletId));
  assert.ok(ids1.size >= 1);
  // Wywolanie w RAW nie moze skasowac aktywnych trackletow!
  wTr.observe('actor-0', PERCEPTION_MODES.RAW);
  const obsT2 = wTr.observe('actor-0', PERCEPTION_MODES.TRACKLET);
  const ids2 = new Set(obsT2.retina.filter((r) => r.trackletId).map((r) => r.trackletId));
  assert.deepEqual([...ids2].sort(), [...ids1].sort(), 'observe(RAW) nie moze resetowac trackletow');
  // Po realnym zniknieciu z oczu i powrocie -> nowe trackletId
  wTr.moveMovable(1, 930, 530); wTr.moveMovable(2, 930, 50); wTr.moveMovable(3, 930, 280);
  wTr.observe('actor-0', PERCEPTION_MODES.TRACKLET);
  wTr.moveMovable(1, 360, 280);
  const idsBack = new Set(wTr.observe('actor-0', PERCEPTION_MODES.TRACKLET).retina.filter((r) => r.trackletId).map((r) => r.trackletId));
  assert.ok(idsBack.size >= 1);
  for (const id of idsBack) assert.ok(!ids1.has(id));

  console.log('[PASS] fork-microscope.mjs (5 warstw, >600 tickow, RELEASE, replace+fork, tracklets bez efektow ubocznych)');
}
