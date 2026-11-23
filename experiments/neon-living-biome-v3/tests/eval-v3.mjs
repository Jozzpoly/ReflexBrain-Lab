// tests/eval-v3.mjs — Comprehensive Scientific & Mechanical Verification Suite for ReflexBrain v3
// Run: node tests/eval-v3.mjs

import { performance } from 'node:perf_hooks';
import { createLivingBiomeV3 } from '../src/world/biome.mjs';
import {
  DEFAULT_CONFIG,
  MATTER_PALETTE,
  COLOR_ROCK,
  COLOR_SCOUT,
  COLOR_RAM,
  COLOR_PLAYER,
} from '../src/world/config.mjs';
import { createPredictorMindV3, hueSignature, chromaDist, isRockRay, ACTION_STYLES } from '../src/mind/predictor-mind.mjs';
import {
  createRandomController,
  createBlindBraitenbergController,
  createOracleReflexController,
} from '../src/mind/baselines.mjs';

function dot3(a, b) {
  return a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
}

function fmt(x, d = 2) {
  return Number.isFinite(x) ? x.toFixed(d) : 'NaN';
}

function mean(arr) {
  return arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : 0;
}

const results = { checks: [], failures: [] };
function check(name, pass, detail) {
  results.checks.push({ name, pass, detail });
  if (!pass) results.failures.push(`${name}: ${detail}`);
  console.log(`[${pass ? 'PASS' : 'FAIL'}] ${name} — ${detail}`);
}

console.log('=== REFLEXBRAIN v3 — TEST 0: INWARIANTY, KOLORYMETRIA I MECHANIKI ===\n');

// 0.1 Pairwise opponent-color chroma separation & isRockRay precision/recall check
{
  const nonRock = [
    ...MATTER_PALETTE.map((m) => ({ name: `mat:${m.name}`, rgb: m.rgb })),
    { name: 'body:scout', rgb: COLOR_SCOUT },
    { name: 'body:ram', rgb: COLOR_RAM },
    { name: 'body:player', rgb: COLOR_PLAYER },
  ];
  let worstPair = '';
  let minDist = Infinity;
  const collisions = [];
  for (let i = 0; i < nonRock.length; i++) {
    const hi = hueSignature(nonRock[i].rgb);
    for (let j = i + 1; j < nonRock.length; j++) {
      const hj = hueSignature(nonRock[j].rgb);
      const d = chromaDist(hi.chroma, hj.chroma);
      if (d < minDist) {
        minDist = d;
        worstPair = `${nonRock[i].name} vs ${nonRock[j].name}`;
      }
      if (d < 0.48) {
        collisions.push(`${nonRock[i].name} vs ${nonRock[j].name} (dChroma=${fmt(d, 3)})`);
      }
    }
  }
  const rockFalsePos = [];
  for (const item of nonRock) {
    for (const atten of [1.0, 0.72, 0.45]) {
      const scaled = item.rgb.map((v) => v * atten);
      if (isRockRay(scaled)) {
        rockFalsePos.push(`${item.name}@${atten}`);
      }
    }
  }
  const rockTruePos = [1.0, 0.72, 0.45].every((att) => isRockRay(COLOR_ROCK.map((v) => v * att)));

  check(
    'Opponent-color chroma separation (min dChroma >= 0.48 > 2x proto radius 0.26)',
    collisions.length === 0,
    collisions.length === 0
      ? `minDist=${fmt(minDist, 3)} (${worstPair})`
      : `COLLISIONS: ${collisions.join(', ')}`
  );
  check(
    'isRockRay precision/recall across all distances',
    rockTruePos && rockFalsePos.length === 0,
    `rockTruePos=${rockTruePos}, falsePos=[${rockFalsePos.join(', ')}]`
  );
}

// 0.2 Observation privacy & immutability
{
  const world = createLivingBiomeV3({ seed: 7, enablePlayer: true });
  const obs = world.getObservation(0);
  const topKeys = Object.keys(obs).sort().join(',');
  const bodyKeys = Object.keys(obs.body).sort();
  const forbidden = ['x', 'y', 'theta', 'zone', 'archetype', 'chemistry', 'player', 'agents', 'objects', 'anomalies'];
  const serialized = JSON.stringify(obs);
  const leaked = forbidden.filter((k) => new RegExp(`"${k}"\\s*:`).test(serialized));

  // Mutating obs should NOT mutate world state
  obs.retina[0][0] = 999;
  obs.body.energy = -999;
  const obs2 = world.getObservation(0);
  const immutable = obs2.retina[0][0] !== 999 && obs2.body.energy >= 0;

  check(
    'Obs schema & privacy (zero leaks)',
    topKeys === 'body,retina,touch' && obs.retina.length === DEFAULT_CONFIG.retinaRays && leaked.length === 0 && immutable,
    `keys=${topKeys}, bodyFields=${bodyKeys.length}, leaked=[${leaked.join(',')}], immutable=${immutable}`
  );
}

// 0.3 Gentle casual contact vs intentional Dash damage
{
  const world = createLivingBiomeV3({
    seed: 11,
    enablePlayer: true,
    agents: [{ id: 'Zwiad-Test', morph: 'scout' }],
    config: { allowReproduction: false, numHazards: 0, numLocalAnomalies: 0 },
  });
  const a = world.agents[0];
  const p = world.player;
  // Place in calm Sanctuary right next to each other
  const cx = world.cfg.width * 0.5;
  const cy = world.cfg.height * 0.5;
  a.x = cx + 40; a.y = cy; a.vx = 0; a.vy = 0; a.integrity = 1.0;
  p.x = cx; p.y = cy; p.vx = 0; p.vy = 0;
  world.objects = [];

  // Phase 1: Player walks right into Scout and rubs against it for 40 ticks (NO dash!)
  let minIntegrityGentle = 1.0;
  for (let t = 0; t < 40; t++) {
    world.step([{ thrust: 0, turn: 0, gazeTurn: 0, grip: false, ramIntent: false }], {
      moveX: 1, moveY: 0, aimAngle: 0, toggleGrip: false, dash: false,
    });
    if (a.integrity < minIntegrityGentle) minIntegrityGentle = a.integrity;
  }
  const gentleDmg = 1.0 - minIntegrityGentle;

  // Phase 2: Separate slightly, then Player intentionally DASHES directly into Scout!
  a.x = cx + 48; a.y = cy; a.vx = 0; a.vy = 0; a.integrity = 1.0;
  p.x = cx; p.y = cy; p.vx = 0; p.vy = 0; p.dashCd = 0;
  let minIntegrityDash = 1.0;
  for (let t = 0; t < 20; t++) {
    world.step([{ thrust: 0, turn: 0, gazeTurn: 0, grip: false, ramIntent: false }], {
      moveX: 1, moveY: 0, aimAngle: 0, toggleGrip: false, dash: t === 0,
    });
    if (a.integrity < minIntegrityDash) minIntegrityDash = a.integrity;
  }
  const dashDmg = 1.0 - minIntegrityDash;

  check(
    'Gentle touch = 0 dmg, intentional Dash > 0 dmg',
    gentleDmg < 0.0001 && dashDmg >= 0.05,
    `gentleDmg=${fmt(gentleDmg, 4)}, dashDmg=${fmt(dashDmg, 4)}, gentleContacts=${a.stats.gentleContacts}`
  );
}

// 0.4 Player ergonomics: E toggle carry toward cursor + Space throw cracks geode + equal stats
{
  const world = createLivingBiomeV3({
    seed: 19,
    enablePlayer: true,
    playerGodMode: false,
    agents: [],
    config: { allowReproduction: false },
  });
  world.objects = [];
  const cx = world.cfg.width * 0.5;
  const cy = world.cfg.height * 0.5;
  const p = world.player;
  p.x = cx; p.y = cy; p.vx = 0; p.vy = 0; p.energy = 0.85; p.integrity = 1.0;

  // Put a movable boulder right beside player, and a geode straight east (angle 0)
  const bld = world.spawnArchetype('boulder', cx + 44, cy + 4);
  const geo = world.spawnArchetype('geode', cx + 150, cy);
  const initGeodeId = geo.id;

  // Press E once (toggleGrip: true) -> grabs boulder!
  world.step([], { moveX: 0, moveY: 0, aimAngle: -Math.PI / 2, toggleGrip: true, dash: false });
  const grabbedId = p.carriedObjId;

  // Rotate cursor straight NORTH (-PI/2) for 25 ticks -> boulder should swing north of Player!
  for (let t = 0; t < 25; t++) {
    world.step([], { moveX: 0, moveY: 0, aimAngle: -Math.PI / 2, toggleGrip: false, dash: false });
  }
  const heldAngleNorth = Math.atan2(bld.y - p.y, bld.x - p.x);

  // Rotate cursor EAST (toward geode) for 25 ticks, then press Space to TOSS boulder into geode!
  for (let t = 0; t < 25; t++) {
    world.step([], { moveX: 0, moveY: 0, aimAngle: 0, toggleGrip: false, dash: false });
  }
  world.step([], { moveX: 0, moveY: 0, aimAngle: 0, toggleGrip: false, dash: true });
  const releasedOnThrow = p.carriedObjId === -1;
  for (let t = 0; t < 45; t++) {
    world.step([], { moveX: 0, moveY: 0, aimAngle: 0, toggleGrip: false, dash: false });
  }
  const geodeStillAlive = world.objects.some((o) => o.id === initGeodeId);
  const shardsCreated = world.objects.filter((o) => o.fromGeode).length;

  // Equal stats test: place player inside a Wild Deep anomaly without godMode -> integrity drops; with godMode -> stays 1.0
  const an = world.anomalies[0];
  p.x = an.x; p.y = an.y; p.vx = 0; p.vy = 0; p.integrity = 1.0; p.energy = 0.85;
  for (let t = 0; t < 60; t++) world.step([], { moveX: 0, moveY: 0, aimAngle: 0 });
  const mortalIntegrityAfterAnomaly = p.integrity;
  const mortalEnergyAfterAnomaly = p.energy;

  world.playerGodMode = true;
  for (let t = 0; t < 15; t++) world.step([], { moveX: 0, moveY: 0, aimAngle: 0 });
  const godIntegrity = p.integrity;

  check(
    'Player E-toggle cursor-aim carry + Space throw cracks geode',
    grabbedId === bld.id && Math.abs(heldAngleNorth + Math.PI / 2) < 0.35 && releasedOnThrow && !geodeStillAlive && shardsCreated >= 2,
    `grabbed=${grabbedId === bld.id}, northAng=${fmt(heldAngleNorth, 2)}, released=${releasedOnThrow}, geodeCracked=${!geodeStillAlive}, shards=${shardsCreated}`
  );
  check(
    'Player equal living stats vs godMode toggle',
    mortalIntegrityAfterAnomaly < 0.95 && mortalEnergyAfterAnomaly < 0.85 && godIntegrity === 1.0,
    `mortalInt=${fmt(mortalIntegrityAfterAnomaly, 3)}, mortalEng=${fmt(mortalEnergyAfterAnomaly, 3)}, godInt=${fmt(godIntegrity, 2)}`
  );
}

// 0.5 Paintable Custom Matter learning from scratch (Zero hardcoded species!)
{
  const novelRgb = [0.95, 0.25, 0.72]; // vivid magenta-rose — NOT in MATTER_PALETTE!
  // Case A: Painted as novel TOXIC matter
  const wTox = createLivingBiomeV3({
    seed: 31,
    agents: [{ id: 'Badacz-T', morph: 'scout' }],
    config: { allowReproduction: false, numHazards: 0, numLocalAnomalies: 0, numGeodes: 0, numBoulders: 0 },
  });
  wTox.objects = [];
  const cx = wTox.cfg.width * 0.5;
  const cy = wTox.cfg.height * 0.5;
  wTox.agents[0].x = cx; wTox.agents[0].y = cy; wTox.agents[0].theta = 0;
  // Ring of custom toxic matter around agent
  for (let k = 0; k < 8; k++) {
    const ang = (k / 8) * Math.PI * 2;
    wTox.spawnCustomMatter(cx + Math.cos(ang) * 90, cy + Math.sin(ang) * 90, {
      rgb: novelRgb, radius: 15, movable: false, burnDamage: 0.14,
    });
  }
  const mTox = createPredictorMindV3(31);
  let obs = wTox.getAllObservations();
  for (let t = 0; t < 450; t++) {
    obs = wTox.step([mTox.act(obs[0])]);
  }
  const novelCh = hueSignature(novelRgb).chroma;
  const toxProto = mTox.getMindState().prototypes.find((p) => chromaDist(hueSignature(p.rgb).chroma, novelCh) < 0.28);

  // Case B: EXACT SAME NOVEL COLOR painted as EDIBLE food!
  const wFood = createLivingBiomeV3({
    seed: 31,
    agents: [{ id: 'Badacz-F', morph: 'scout' }],
    config: { allowReproduction: false, numHazards: 0, numLocalAnomalies: 0, numGeodes: 0, numBoulders: 0 },
  });
  wFood.objects = [];
  wFood.agents[0].x = cx; wFood.agents[0].y = cy; wFood.agents[0].theta = 0; wFood.agents[0].energy = 0.45;
  for (let k = 0; k < 10; k++) {
    const ang = (k / 10) * Math.PI * 2;
    wFood.spawnCustomMatter(cx + Math.cos(ang) * 85, cy + Math.sin(ang) * 85, {
      rgb: novelRgb, radius: 10, movable: true, edible: true, energyGain: 0.30,
    });
  }
  const mFood = createPredictorMindV3(31);
  obs = wFood.getAllObservations();
  for (let t = 0; t < 450; t++) {
    obs = wFood.step([mFood.act(obs[0])]);
  }
  const foodProto = mFood.getMindState().prototypes.find((p) => chromaDist(hueSignature(p.rgb).chroma, novelCh) < 0.28);

  const toxLearnedPain = toxProto ? toxProto.pred[0].dI : 0;
  const foodLearnedGain = foodProto ? foodProto.pred[0].dE : 0;
  check(
    'Paintable custom matter learned purely from consequences (same novel RGB -> toxic vs food)',
    toxLearnedPain < -0.25 && foodLearnedGain > 0.25,
    `toxic.pred[gentle].dI=${fmt(toxLearnedPain, 3)}, food.pred[gentle].dE=${fmt(foodLearnedGain, 3)}`
  );
}

// 0.6 Emergent Player relationship (Helper vs Bully — ZERO if(isPlayer)!)
{
  const playerCh = hueSignature(COLOR_PLAYER).chroma;
  // Helper: brings food right beside Scout
  const wHelp = createLivingBiomeV3({
    seed: 42,
    enablePlayer: true,
    agents: [{ id: 'Zwiad-H', morph: 'scout' }],
    config: { allowReproduction: false, numHazards: 0, numLocalAnomalies: 0, numGeodes: 0, numBoulders: 0 },
  });
  wHelp.objects = [];
  const cx = wHelp.cfg.width * 0.5;
  const cy = wHelp.cfg.height * 0.5;
  wHelp.agents[0].x = cx; wHelp.agents[0].y = cy; wHelp.agents[0].theta = 0; wHelp.agents[0].energy = 0.5;
  wHelp.player.x = cx + 65; wHelp.player.y = cy;
  const mHelp = createPredictorMindV3(42);
  let obs = wHelp.getAllObservations();
  for (let t = 0; t < 600; t++) {
    const a = wHelp.agents[0];
    const p = wHelp.player;
    const angToA = Math.atan2(a.y - p.y, a.x - p.x);
    const d = Math.hypot(a.x - p.x, a.y - p.y);
    // Player gently orbits at polite 70px distance and drops berries near Scout every 90 ticks
    const moveX = d > 85 ? Math.cos(angToA) * 0.55 : d < 55 ? -Math.cos(angToA) * 0.4 : 0;
    const moveY = d > 85 ? Math.sin(angToA) * 0.55 : d < 55 ? -Math.sin(angToA) * 0.4 : 0;
    if (t % 90 === 30) {
      wHelp.spawnArchetype('sanctuaryBerry', (a.x + p.x) * 0.5, (a.y + p.y) * 0.5);
    }
    obs = wHelp.step([mHelp.act(obs[0])], { moveX, moveY, aimAngle: angToA });
  }
  const pHelp = mHelp.getMindState().prototypes.find((p) => chromaDist(hueSignature(p.rgb).chroma, playerCh) < 0.28);

  // Bully: repeatedly intentionally dashes straight into Scout
  const wBully = createLivingBiomeV3({
    seed: 42,
    enablePlayer: true,
    agents: [{ id: 'Zwiad-B', morph: 'scout' }],
    config: { allowReproduction: false, numHazards: 0, numLocalAnomalies: 0, numGeodes: 0, numBoulders: 0 },
  });
  wBully.objects = [];
  wBully.agents[0].x = cx; wBully.agents[0].y = cy; wBully.agents[0].theta = 0;
  wBully.player.x = cx + 55; wBully.player.y = cy;
  const mBully = createPredictorMindV3(42);
  obs = wBully.getAllObservations();
  for (let t = 0; t < 450; t++) {
    const a = wBully.agents[0];
    const p = wBully.player;
    const angToA = Math.atan2(a.y - p.y, a.x - p.x);
    const d = Math.hypot(a.x - p.x, a.y - p.y);
    obs = wBully.step([mBully.act(obs[0])], {
      moveX: Math.cos(angToA),
      moveY: Math.sin(angToA),
      aimAngle: angToA,
      dash: d < 95,
    });
  }
  const pBully = mBully.getMindState().prototypes.find((p) => chromaDist(hueSignature(p.rgb).chroma, playerCh) < 0.28);

  const helperNearE = pHelp ? pHelp.pred[2].dE : 0;
  const bullyPainI = pBully ? Math.min(pBully.pred[0].dI, pBully.pred[1].dI) : 0;
  check(
    'Emergent Player trust (Helper) vs fear (Bully) with zero isPlayer code',
    helperNearE > 0.20 && bullyPainI < -0.20,
    `helper.pred[blisko].dE=${fmt(helperNearE, 3)}, bully.min(dI)=${fmt(bullyPainI, 3)}`
  );
}

// 0.7 Reproduction callback & Performance benchmark
{
  let birthCallbacks = 0;
  const world = createLivingBiomeV3({
    seed: 55,
    config: { allowReproduction: true, reproCooldownTicks: 50, reproEnergyThreshold: 0.90 },
    onBirth: () => { birthCallbacks++; },
  });
  world.agents[0].energy = 0.96;
  world.agents[0].reproCd = 0;
  const minds = world.agents.map((_, i) => createPredictorMindV3(55 + i));
  world.onBirth = (childIdx) => {
    birthCallbacks++;
    minds[childIdx] = createPredictorMindV3(500 + childIdx);
  };
  let obs = world.getAllObservations();
  const t0 = performance.now();
  const benchTicks = 400;
  for (let t = 0; t < benchTicks; t++) {
    const acts = minds.map((m, i) => m.act(obs[i]));
    obs = world.step(acts);
  }
  const msPerTick = (performance.now() - t0) / benchTicks;
  check(
    'Lineage reproduction callback & speed (< 4.0 ms/tick)',
    birthCallbacks >= 1 && world.agents.length === minds.length && msPerTick < 4.0,
    `births=${birthCallbacks}, pop=${world.agents.length}, speed=${fmt(msPerTick, 3)} ms/tick`
  );
}

// =========================================================================
// TEST A: 16 SEEDS x 4500 TICKS — predictorMindV3 vs Baselines vs Oracle
// =========================================================================
console.log('\n=== TEST A: 16 SEEDOW x 3600 TICKOW (NIEZNANA CHEMIA, BIOM 3200x2200) ===\n');

const SEEDS = Array.from({ length: 16 }, (_, i) => 101 + i * 17);
const TICKS_A = 3600;

function runCondition(name, makeMind) {
  const rows = [];
  for (const seed of SEEDS) {
    const world = createLivingBiomeV3({
      seed,
      config: { allowReproduction: false },
    });
    const minds = world.agents.map((_, i) => makeMind(world, seed * 31 + i));
    let obs = world.getAllObservations();
    let burnsEarly = 0;
    for (let t = 1; t <= TICKS_A; t++) {
      const acts = minds.map((m, i) => m.act(obs[i]));
      obs = world.step(acts);
      if (t === Math.floor(TICKS_A / 2)) {
        burnsEarly = world.agents.reduce((s, a) => s + a.stats.burnHits, 0) / world.agents.length;
      }
    }
    const m = world.getSummaryMetrics();
    const burnsLate = m.burnHitsPerAgent - burnsEarly;
    const loops = minds.reduce((s, c) => s + (c.getMindState().loopClosures || 0), 0) / minds.length;
    rows.push({
      seed,
      ...m,
      burnsEarly,
      burnsLate,
      loops,
    });
  }
  return {
    name,
    rows,
    viability: mean(rows.map((r) => r.viability)),
    berries: mean(rows.map((r) => r.berriesPerAgent)),
    cores: mean(rows.map((r) => r.coresPerAgent)),
    geodes: mean(rows.map((r) => r.geodesBrokenTotal)),
    burns: mean(rows.map((r) => r.burnHitsPerAgent)),
    burnsEarly: mean(rows.map((r) => r.burnsEarly)),
    burnsLate: mean(rows.map((r) => r.burnsLate)),
    meanE: mean(rows.map((r) => r.meanEnergy)),
    meanI: mean(rows.map((r) => r.meanIntegrity)),
    rest: mean(rows.map((r) => r.restRatio)) * 100,
    zS: mean(rows.map((r) => r.zoneShare.sanctuary)) * 100,
    zT: mean(rows.map((r) => r.zoneShare.twilight)) * 100,
    zW: mean(rows.map((r) => r.zoneShare.wilds)) * 100,
    loops: mean(rows.map((r) => r.loops)),
  };
}

const tStartA = performance.now();
const resPred = runCondition('predictorMindV3', (_w, s) => createPredictorMindV3(s));
const resBlind = runCondition('blindBraitenberg', (_w, s) => createBlindBraitenbergController(s));
const resRand = runCondition('randomWalk', (_w, s) => createRandomController(s));
const resOracle = runCondition('oracleReflex (nielegalna)', (w, s) => createOracleReflexController(w.chemistry, s));
const secA = (performance.now() - tStartA) / 1000;

console.log(
  'Kontroler                 | Viab  | Jagod | Rdzen | Geody | Oparz (1->2)  | Eng  | Int  | Odp% | Strefy S/T/D   | Loops'
);
console.log('-'.repeat(118));
for (const r of [resPred, resBlind, resRand, resOracle]) {
  console.log(
    `${r.name.padEnd(25)} | ${fmt(r.viability, 2).padStart(5)} | ${fmt(r.berries, 2).padStart(5)} | ${fmt(r.cores, 2).padStart(5)} | ${fmt(r.geodes, 1).padStart(5)} | ${fmt(r.burns, 2).padStart(4)} (${fmt(r.burnsEarly, 1)}->${fmt(r.burnsLate, 1)}) | ${fmt(r.meanE, 2)} | ${fmt(r.meanI, 2)} | ${fmt(r.rest, 1).padStart(4)} | ${fmt(r.zS, 0).padStart(2)}/${fmt(r.zT, 0).padStart(2)}/${fmt(r.zW, 0).padStart(2)}%     | ${fmt(r.loops, 1)}`
  );
}
console.log(`(Test A czas: ${fmt(secA, 1)} s)\n`);

const winsVsBlind = resPred.rows.filter((r, i) => r.viability > resBlind.rows[i].viability).length;
const winsVsRand = resPred.rows.filter((r, i) => r.viability > resRand.rows[i].viability).length;
check(
  'predictorMindV3 beats blindBraitenberg (>= 13/16 seeds)',
  winsVsBlind >= 13,
  `wins=${winsVsBlind}/${SEEDS.length}, viab=${fmt(resPred.viability)} vs ${fmt(resBlind.viability)}`
);
check(
  'predictorMindV3 beats randomWalk (>= 14/16 seeds)',
  winsVsRand >= 14,
  `wins=${winsVsRand}/${SEEDS.length}, viab=${fmt(resPred.viability)} vs ${fmt(resRand.viability)}`
);
check(
  'Burn avoidance improves 1st half -> 2nd half',
  resPred.burnsLate <= resPred.burnsEarly * 0.75 || resPred.burnsLate < 0.8,
  `early=${fmt(resPred.burnsEarly, 2)} -> late=${fmt(resPred.burnsLate, 2)}`
);

// =========================================================================
// TEST B: COUNTERFACTUAL MEMORY FORK (t = 2250 -> 4500) + DETERMINISM 16/16
// =========================================================================
console.log('\n=== TEST B: KONTRFAKTYCZNY FORK PAMIECI (t=1800 -> 3600) + DETERMINIZM ===\n');

const FORK_T = 1800;
const END_T = 3600;

function runPostFork(worldSnap, memSnaps, mode) {
  const w = createLivingBiomeV3({ seed: worldSnap.seed, config: { allowReproduction: false } });
  w.restore(worldSnap);
  const preB = w.agents.reduce((s, a) => s + a.stats.berriesEaten, 0);
  const preC = w.agents.reduce((s, a) => s + a.stats.coresEaten, 0);
  const preBurn = w.agents.reduce((s, a) => s + a.stats.burnHits, 0);
  const preGeo = w.agents.reduce((s, a) => s + a.stats.geodesBroken, 0);

  const minds = w.agents.map((_, i) => {
    const m = createPredictorMindV3(worldSnap.seed * 31 + i);
    if (mode === 'ablated') {
      m.resetMemory();
    } else {
      m.restoreMemory(memSnaps[i]);
    }
    return m;
  });

  let obs = w.getAllObservations();
  for (let t = FORK_T + 1; t <= END_T; t++) {
    const acts = minds.map((m, i) => m.act(obs[i]));
    obs = w.step(acts);
  }
  const n = w.agents.length;
  const dB = (w.agents.reduce((s, a) => s + a.stats.berriesEaten, 0) - preB) / n;
  const dC = (w.agents.reduce((s, a) => s + a.stats.coresEaten, 0) - preC) / n;
  const dBurn = (w.agents.reduce((s, a) => s + a.stats.burnHits, 0) - preBurn) / n;
  const dGeo = w.agents.reduce((s, a) => s + a.stats.geodesBroken, 0) - preGeo;
  const score = dB * 1.0 + dC * 2.4 - dBurn * 2.6;
  return { score, dB, dC, dBurn, dGeo, sig: `${w.tick}:${fmt(w.agents[0].x, 4)}:${fmt(w.agents[0].energy, 4)}` };
}

let detExact = 0;
const bIntact = [], bAblated = [], bTransDiff = [], bTransSame = [];

for (const seed of SEEDS) {
  // Train main world up to FORK_T
  const wA = createLivingBiomeV3({ seed, config: { allowReproduction: false } });
  const mA = wA.agents.map((_, i) => createPredictorMindV3(seed * 31 + i));
  let obsA = wA.getAllObservations();
  for (let t = 1; t <= FORK_T; t++) {
    obsA = wA.step(mA.map((m, i) => m.act(obsA[i])));
  }
  const snapW = wA.snapshot();
  const snapMem = mA.map((m) => m.snapshotMemory());

  // Train donor with DIFFERENT chemistry (rotated palette order)
  const trueOrder = ['sanctuaryBerry', 'wildCore', 'geode', 'boulder', 'emberMineral'].map(
    (k) => wA.chemistry[k].paletteIdx
  );
  const diffOrder = [trueOrder[1], trueOrder[2], trueOrder[3], trueOrder[4], trueOrder[0]];
  const wDiff = createLivingBiomeV3({ seed: seed + 777, fixedPalette: diffOrder, config: { allowReproduction: false } });
  const mDiff = wDiff.agents.map((_, i) => createPredictorMindV3((seed + 777) * 31 + i));
  let obsD = wDiff.getAllObservations();
  for (let t = 1; t <= FORK_T; t++) obsD = wDiff.step(mDiff.map((m, i) => m.act(obsD[i])));
  const snapDiff = mDiff.map((m) => m.snapshotMemory());

  // Train donor with SAME chemistry, DIFFERENT rock/anomaly layout
  const wSame = createLivingBiomeV3({ seed: seed + 1337, fixedPalette: trueOrder, config: { allowReproduction: false } });
  const mSame = wSame.agents.map((_, i) => createPredictorMindV3((seed + 1337) * 31 + i));
  let obsS = wSame.getAllObservations();
  for (let t = 1; t <= FORK_T; t++) obsS = wSame.step(mSame.map((m, i) => m.act(obsS[i])));
  const snapSame = mSame.map((m) => m.snapshotMemory());

  const r1 = runPostFork(snapW, snapMem, 'intact');
  const r1Check = runPostFork(snapW, snapMem, 'intact');
  if (r1.sig === r1Check.sig) detExact++;

  const rAbl = runPostFork(snapW, snapMem, 'ablated');
  const rDiff = runPostFork(snapW, snapDiff, 'transplant');
  const rSame = runPostFork(snapW, snapSame, 'transplant');

  bIntact.push(r1);
  bAblated.push(rAbl);
  bTransDiff.push(rDiff);
  bTransSame.push(rSame);
}

const summarizeB = (label, arr) =>
  `${label.padEnd(28)} | dScore=${fmt(mean(arr.map((x) => x.score)), 2).padStart(5)} | dJag=${fmt(mean(arr.map((x) => x.dB)), 2)} | dRdz=${fmt(mean(arr.map((x) => x.dC)), 2)} | dOparz=${fmt(mean(arr.map((x) => x.dBurn)), 2)} | dGeo=${fmt(mean(arr.map((x) => x.dGeo)), 1)}`;

console.log(summarizeB('intact (wlasna pamiec)', bIntact));
console.log(summarizeB('ablated (amnezja w t=2250)', bAblated));
console.log(summarizeB('transplant INNA chemia', bTransDiff));
console.log(summarizeB('transplant TA SAMA chemia', bTransSame));

const winsVsDiff = bIntact.filter((r, i) => r.score > bTransDiff[i].score).length;
const winsVsAbl = bIntact.filter((r, i) => r.score > bAblated[i].score).length;
const winsVsSame = bIntact.filter((r, i) => r.score > bTransSame[i].score).length;

check('Determinism after snapshot/restore', detExact === SEEDS.length, `${detExact}/${SEEDS.length}`);
check(
  'Memory fork: intact > transplant DIFFERENT chemistry (>= 12/16)',
  winsVsDiff >= 12,
  `wins=${winsVsDiff}/${SEEDS.length}, intact=${fmt(mean(bIntact.map((x) => x.score)))} vs diff=${fmt(mean(bTransDiff.map((x) => x.score)))}`
);
check(
  'Memory fork: intact >= ablated (honest report)',
  mean(bIntact.map((x) => x.score)) >= mean(bAblated.map((x) => x.score)),
  `wins=${winsVsAbl}/${SEEDS.length}, intact=${fmt(mean(bIntact.map((x) => x.score)))} vs ablated=${fmt(mean(bAblated.map((x) => x.score)))}`
);
console.log(
  `[INFO] Place-memory probe (intact vs transplant SAME chemistry, diff layout): wins=${winsVsSame}/${SEEDS.length}, intact=${fmt(mean(bIntact.map((x) => x.score)))} vs same=${fmt(mean(bTransSame.map((x) => x.score)))}`
);

console.log('\n=== PODSUMOWANIE EVAL-V3 ===');
console.log(`Passed: ${results.checks.filter((c) => c.pass).length}/${results.checks.length}`);
if (results.failures.length > 0) {
  console.log('FAILURES:');
  for (const f of results.failures) console.log('  - ' + f);
  process.exitCode = 1;
}
