// tests/attack-v3.mjs — Independent Adversarial Audit Suite for ReflexBrain v3
// Pure Node ESM, zero external dependencies.
// Run: node tests/attack-v3.mjs
//
// 4 Adversarial Attacks on 10 held-out seeds (9001..9010):
//   Attack 1: Learning Ablation — predictorMindV3 (lr=0.48) vs lr=0 (exposes clamp floor bug!)
//             vs trueFrozenMind (identical body physiology, pred[] & places[] genuinely frozen at 0)
//   Attack 2: Memoryless Adversary — greedyChaser (zero memory, chases all non-rock colors,
//             rams on close contact, identical acute-pain recoil & wall sliding) vs predictorMindV3
//   Attack 3: Mid-Run Chemistry Reversal (t=1500 / 3600 ticks, old ember <-> new berry swap) —
//             tests whether 0.015 pain-extinction asymmetry + knownPain veto causes paralysis
//             compared against an amnesia control (resetMemory at t=1500) from identical snapshot
//   Attack 4: Static & Dynamic Contract Leak Audit + dist/reflexbrain-v3.html integrity check

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { performance } from 'node:perf_hooks';

import { createLivingBiomeV3, clamp, wrapAngle, createRng } from '../src/world/biome.mjs';
import { DEFAULT_CONFIG } from '../src/world/config.mjs';
import {
  createPredictorMindV3,
  hueSignature,
  chromaDist,
  isRockRay,
  estimateLocalSky,
} from '../src/mind/predictor-mind.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT_DIR = path.resolve(__dirname, '..');

const HELD_OUT_SEEDS = [9001, 9002, 9003, 9004, 9005, 9006, 9007, 9008, 9009, 9010];
const BASE_TICKS = 3000;
const REVERSAL_PRE_TICKS = 1500;
const REVERSAL_POST_TICKS = 2100; // total 3600 ticks

// ---------------------------------------------------------------------------
// Utility helpers
// ---------------------------------------------------------------------------
function rgbDist(a, b) {
  const dr = a[0] - b[0];
  const dg = a[1] - b[1];
  const db = a[2] - b[2];
  return Math.sqrt(dr * dr + dg * dg + db * db);
}

function mean(arr) {
  if (!arr.length) return 0;
  let s = 0;
  for (let i = 0; i < arr.length; i++) s += arr[i];
  return s / arr.length;
}

function std(arr) {
  if (arr.length < 2) return 0;
  const m = mean(arr);
  let s = 0;
  for (let i = 0; i < arr.length; i++) {
    const d = arr[i] - m;
    s += d * d;
  }
  return Math.sqrt(s / (arr.length - 1));
}

function fmt(v, d = 2) {
  return Number.isFinite(v) ? v.toFixed(d) : 'NaN';
}

function pad(s, w) {
  const str = String(s);
  return str.length >= w ? str : str + ' '.repeat(w - str.length);
}

function padL(s, w) {
  const str = String(s);
  return str.length >= w ? str : ' '.repeat(w - str.length) + str;
}

function aggregateWorldStats(world) {
  const sm = world.getSummaryMetrics();
  let berriesTotal = 0;
  let coresTotal = 0;
  let geodesTotal = 0;
  let burnsTotal = 0;
  let agentTicksTotal = 0;
  for (const a of world.agents) {
    berriesTotal += a.stats.berriesEaten;
    coresTotal += a.stats.coresEaten;
    geodesTotal += a.stats.geodesBroken;
    burnsTotal += a.stats.burnHits;
    agentTicksTotal += a.stats.aliveTicks;
  }
  const kScale = 1000 / Math.max(1, agentTicksTotal);
  return {
    ...sm,
    berriesTotal,
    coresTotal,
    geodesTotal,
    burnsTotal,
    agentTicksTotal,
    berriesPer1k: berriesTotal * kScale,
    coresPer1k: coresTotal * kScale,
    geodesPer1k: geodesTotal * kScale,
    burnsPer1k: burnsTotal * kScale,
  };
}

function inspectLearnedWeightSummary(minds) {
  let maxAbsDE = 0;
  let maxAbsDI = 0;
  let maxAbsDS = 0;
  let totalTrials = 0;
  let totalPlaces = 0;
  let nonZeroPredProtos = 0;
  for (const m of minds) {
    const st = m.getMindState();
    totalPlaces += (st.places || []).length;
    for (const p of st.prototypes || []) {
      let hasNonZero = false;
      for (const pr of p.pred || []) {
        const ae = Math.abs(pr.dE || 0);
        const ai = Math.abs(pr.dI || 0);
        const as = Math.abs(pr.dS || 0);
        if (ae > maxAbsDE) maxAbsDE = ae;
        if (ai > maxAbsDI) maxAbsDI = ai;
        if (as > maxAbsDS) maxAbsDS = as;
        totalTrials += pr.trials || 0;
        if (ae > 1e-6 || ai > 1e-6 || as > 1e-6) hasNonZero = true;
      }
      if (hasNonZero) nonZeroPredProtos++;
    }
  }
  return { maxAbsDE, maxAbsDI, maxAbsDS, totalTrials, totalPlaces, nonZeroPredProtos };
}

// ---------------------------------------------------------------------------
// Attack 1 Helper: True Frozen Mind (exact same body physiology, zero learning)
// ---------------------------------------------------------------------------
function createTrueFrozenMind(seed = 1) {
  const inner = createPredictorMindV3(seed, { learningRate: 0 });
  let localTick = 0;

  function wipeLearnedMemoryIfDirty() {
    const st = inner.getMindState();
    let dirty = st.places.length > 0;
    if (!dirty) {
      for (let i = 0; i < st.prototypes.length; i++) {
        const p = st.prototypes[i];
        if (p.solidVal !== 0 || p.touchCount !== 0) {
          dirty = true;
          break;
        }
        for (let a = 0; a < p.pred.length; a++) {
          const pr = p.pred[a];
          if (pr.dE !== 0 || pr.dI !== 0 || pr.dS !== 0 || pr.trials !== 0) {
            dirty = true;
            break;
          }
        }
        if (dirty) break;
      }
    }
    if (!dirty) return;
    const snap = inner.snapshotMemory();
    snap.state.places.length = 0;
    for (let i = 0; i < snap.state.prototypes.length; i++) {
      const p = snap.state.prototypes[i];
      p.solidVal = 0;
      p.touchCount = 0;
      for (let a = 0; a < p.pred.length; a++) {
        const pr = p.pred[a];
        pr.dE = 0;
        pr.dI = 0;
        pr.dS = 0;
        pr.trials = 0;
      }
    }
    inner.restoreMemory(snap);
  }

  return {
    name: 'trueFrozenMind',
    act(obs) {
      localTick++;
      const action = inner.act(obs);
      const b = obs.body;
      let anyTouch = false;
      for (let i = 0; i < obs.touch.length; i++) {
        if (obs.touch[i].pressure > 0.05) {
          anyTouch = true;
          break;
        }
      }
      const mayHaveMutated =
        anyTouch ||
        b.dEnergy > 0.035 ||
        b.dIntegrity < -0.0004 ||
        ((b.stress > 0.10 || b.integrity < 0.90) && b.dStress < -0.001 && b.dIntegrity > 0.0005) ||
        localTick % 30 === 0;
      if (mayHaveMutated) wipeLearnedMemoryIfDirty();
      return action;
    },
    snapshotMemory: () => inner.snapshotMemory(),
    restoreMemory: (s) => inner.restoreMemory(s),
    resetMemory: () => {
      localTick = 0;
      inner.resetMemory();
    },
    getMindState: () => inner.getMindState(),
    setHyperparams: (hp) => inner.setHyperparams(hp),
  };
}

// ---------------------------------------------------------------------------
// Attack 2 Adversary: Memoryless GreedyChaser
// Zero prototype/place memory. Chases EVERY non-rock, non-sky color on retina,
// rams aggressively on close contact, shares identical acute-pain recoil
// (dI < -0.025 -> 13-tick flinch) and rock-wall sliding/stuck recovery.
// ---------------------------------------------------------------------------
function createGreedyChaser(seed = 1) {
  const rng = createRng((seed * 73856093 + 19) >>> 0);
  const fov = DEFAULT_CONFIG.retinaFov;
  let flinchTicks = 0;
  let flinchDir = 1;
  let wallFollowTicks = 0;
  let wallFollowDir = rng.next() < 0.5 ? -1 : 1;
  let stuckTicks = 0;
  let wanderBias = (rng.next() * 2 - 1) * 0.38;
  let gazeScanPhase = rng.next() * Math.PI * 2;

  return {
    name: 'greedyChaser',
    act(obs) {
      const ret = obs.retina;
      const N = ret.length;
      const body = obs.body;
      const skyProbe = estimateLocalSky(ret);
      const estSky = skyProbe.rgb || [0.07, 0.10, 0.14];

      let touchedRockFront = false;
      let touchedNonRockFront = false;
      let maxTouchP = 0;
      let painAngle = 0;
      let touchSteer = 0;

      for (let s = 0; s < obs.touch.length; s++) {
        const t = obs.touch[s];
        if (t.pressure > maxTouchP) maxTouchP = t.pressure;
        if (t.pressure >= 0.28) {
          if (s === 1 || s === 2) touchSteer -= 0.62;
          if (s === 6 || s === 7) touchSteer += 0.62;
        }
        if (t.pressure <= 0.05) continue;
        if (isRockRay(t.rgb)) {
          if (s === 0 || s === 1 || s === 7) touchedRockFront = true;
        } else {
          if (s === 0 || s === 1 || s === 7) touchedNonRockFront = true;
          painAngle = s <= 4 ? (s / 8) * Math.PI * 2 : ((s - 8) / 8) * Math.PI * 2;
        }
      }

      // Identical acute-pain recoil reflex
      if (body.dIntegrity < -0.025) {
        flinchTicks = 13;
        flinchDir = painAngle >= 0 ? -1 : 1;
      }

      let rockL = 0;
      let rockR = 0;
      let steerL = 0;
      let steerR = 0;
      let bestRayIdx = -1;
      let bestW = 0;
      let bestAng = 0;

      for (let i = 0; i < N; i++) {
        const frac = N > 1 ? i / (N - 1) - 0.5 : 0;
        const bAng = wrapAngle(body.gazeOffset + frac * fov);
        const normA = clamp(bAng / (Math.PI * 0.75), -1, 1);
        const centerW = 1 - Math.abs(normA) * 0.38;
        const px = ret[i];

        if (rgbDist(px, estSky) < 0.038) continue;
        if (isRockRay(px)) {
          if (bAng < 0) steerR += 0.28 * centerW;
          else steerL += 0.28 * centerW;
          if (frac < -0.17) rockL++;
          else if (frac > 0.17) rockR++;
          continue;
        }
        const h = hueSignature(px);
        if (h.mag < 0.18) continue;
        const w = clamp(h.mag / 1.12, 0.1, 1.2);
        const pull = w * (0.35 + Math.abs(normA));
        if (bAng < 0) steerL += pull;
        else steerR += pull;
        if (w > bestW) {
          bestW = w;
          bestRayIdx = i;
          bestAng = bAng;
        }
      }

      let gazeTurn = 0;
      if (bestRayIdx >= 0) {
        gazeTurn = clamp((clamp(bestAng, -1, 1) - body.gazeOffset) * 2.0, -1, 1);
      } else {
        gazeScanPhase += 0.042;
        gazeTurn = clamp((Math.sin(gazeScanPhase) * 0.74 - body.gazeOffset) * 1.4, -0.7, 0.7);
      }

      let thrust = 0.78;
      let turn = 0;
      let ramIntent = false;

      if (flinchTicks > 0) {
        flinchTicks--;
        thrust = -0.45;
        turn = flinchDir * 0.9;
      } else if (bestRayIdx >= 0) {
        const crowdTurn = (2.5 * (steerR - steerL)) / (steerL + steerR + 0.22);
        const focusTurn = clamp(bestAng * 1.75, -1, 1);
        turn = clamp(focusTurn * 0.65 + crowdTurn * 0.35 + touchSteer * 0.4, -1, 1);
        const closeAhead = (bestW > 0.52 && Math.abs(bestAng) < 0.48) || touchedNonRockFront;
        if (closeAhead) {
          thrust = 1.0;
          ramIntent = true;
        } else {
          thrust = 0.88;
        }
      } else if (wallFollowTicks > 0) {
        wallFollowTicks--;
        turn = wallFollowDir * 0.55;
        thrust = 0.78;
      } else {
        wanderBias = clamp(wanderBias * 0.96 + (rng.next() * 2 - 1) * 0.20, -0.55, 0.55);
        turn = clamp(wanderBias + touchSteer, -1, 1);
        thrust = 0.78;
      }

      if (touchedRockFront) {
        wallFollowTicks = 24;
        wallFollowDir = rockL >= rockR ? 1 : -1;
        turn = wallFollowDir * 0.90;
        thrust = 0.24;
      }
      const ownSpeed = Math.hypot(body.vxBody, body.vyBody);
      if (ownSpeed < 0.15 && maxTouchP > 0.3) {
        stuckTicks++;
        if (stuckTicks > 18) {
          turn = wallFollowDir * 1.0;
          thrust = -0.35;
          if (stuckTicks > 34) {
            stuckTicks = 0;
            wallFollowDir = -wallFollowDir;
          }
        }
      } else {
        stuckTicks = Math.max(0, stuckTicks - 1);
      }

      return {
        thrust: clamp(thrust, -0.5, 1.0),
        turn: clamp(turn, -1.0, 1.0),
        gazeTurn: clamp(gazeTurn, -1.0, 1.0),
        grip: false,
        ramIntent,
      };
    },
    snapshotMemory: () => ({}),
    restoreMemory: () => {},
    resetMemory: () => {
      flinchTicks = 0;
      stuckTicks = 0;
      wallFollowTicks = 0;
    },
    getMindState: () => ({
      mode: 'greedyChaser',
      arousal: 0,
      surprise: 0,
      loopClosures: 0,
      prototypes: [],
      places: [],
      biography: [],
    }),
  };
}

// ---------------------------------------------------------------------------
// Generic episode runner
// ---------------------------------------------------------------------------
function runControllerOnSeeds(label, mindFactory, seeds, ticks) {
  const perSeed = [];
  let sumMaxDE = 0;
  let sumMaxDI = 0;
  let sumPlaces = 0;
  let sumNonZeroProtos = 0;

  for (const seed of seeds) {
    const world = createLivingBiomeV3({ seed });
    const minds = world.agents.map((_, i) => mindFactory(seed * 31 + i));
    world.onBirth = (childIdx) => {
      minds[childIdx] = mindFactory(seed * 31 + childIdx + world.tick);
    };
    let obs = world.getAllObservations();
    for (let t = 0; t < ticks; t++) {
      const acts = new Array(world.agents.length);
      for (let i = 0; i < world.agents.length; i++) {
        if (!minds[i]) minds[i] = mindFactory(seed * 31 + i + world.tick);
        acts[i] = minds[i].act(obs[i]);
      }
      obs = world.step(acts);
    }
    const stats = aggregateWorldStats(world);
    const learned = inspectLearnedWeightSummary(minds);
    sumMaxDE += learned.maxAbsDE;
    sumMaxDI += learned.maxAbsDI;
    sumPlaces += learned.totalPlaces;
    sumNonZeroProtos += learned.nonZeroPredProtos;
    perSeed.push({ seed, stats, learned });
  }

  return {
    label,
    perSeed,
    viability: mean(perSeed.map((r) => r.stats.viability)),
    viabilityStd: std(perSeed.map((r) => r.stats.viability)),
    berriesPerAgent: mean(perSeed.map((r) => r.stats.berriesPerAgent)),
    coresPerAgent: mean(perSeed.map((r) => r.stats.coresPerAgent)),
    burnsPerAgent: mean(perSeed.map((r) => r.stats.burnHitsPerAgent)),
    geodesTotal: mean(perSeed.map((r) => r.stats.geodesTotal)),
    berriesPer1k: mean(perSeed.map((r) => r.stats.berriesPer1k)),
    coresPer1k: mean(perSeed.map((r) => r.stats.coresPer1k)),
    burnsPer1k: mean(perSeed.map((r) => r.stats.burnsPer1k)),
    geodesPer1k: mean(perSeed.map((r) => r.stats.geodesPer1k)),
    meanEnergy: mean(perSeed.map((r) => r.stats.meanEnergy)),
    meanIntegrity: mean(perSeed.map((r) => r.stats.meanIntegrity)),
    population: mean(perSeed.map((r) => r.stats.population)),
    avgMaxDE: sumMaxDE / seeds.length,
    avgMaxDI: sumMaxDI / seeds.length,
    avgPlaces: sumPlaces / seeds.length,
    avgNonZeroProtos: sumNonZeroProtos / seeds.length,
  };
}

function pairedWins(resA, resB, metricFn, higherIsBetter = true) {
  let wins = 0;
  let ties = 0;
  for (let i = 0; i < resA.perSeed.length; i++) {
    const a = metricFn(resA.perSeed[i].stats);
    const b = metricFn(resB.perSeed[i].stats);
    if (Math.abs(a - b) < 1e-9) ties++;
    else if (higherIsBetter ? a > b : a < b) wins++;
  }
  return `${wins}/${resA.perSeed.length}${ties ? ` (${ties} tie)` : ''}`;
}

function printSummaryTable(rows) {
  const hdr =
    pad('Controller', 20) +
    padL('Viab (std)', 14) +
    padL('Ber/1k', 8) +
    padL('Cor/1k', 8) +
    padL('Geo/1k', 8) +
    padL('Brn/1k', 8) +
    padL('Brn/Ag', 8) +
    padL('MeanE', 7) +
    padL('MeanI', 7) +
    padL('Pop', 6);
  console.log(hdr);
  console.log('-'.repeat(hdr.length));
  for (const r of rows) {
    console.log(
      pad(r.label, 20) +
        padL(`${fmt(r.viability, 2)} (${fmt(r.viabilityStd, 2)})`, 14) +
        padL(fmt(r.berriesPer1k, 2), 8) +
        padL(fmt(r.coresPer1k, 2), 8) +
        padL(fmt(r.geodesPer1k, 2), 8) +
        padL(fmt(r.burnsPer1k, 2), 8) +
        padL(fmt(r.burnsPerAgent, 2), 8) +
        padL(fmt(r.meanEnergy, 3), 7) +
        padL(fmt(r.meanIntegrity, 3), 7) +
        padL(fmt(r.population, 1), 6)
    );
  }
}

// ---------------------------------------------------------------------------
// Attack 3: Mid-Run Chemistry Reversal (old ember -> new berry, old food -> new ember)
// ---------------------------------------------------------------------------
function findProtoMatchingChroma(mindState, targetChroma) {
  let best = null;
  let bestD = 0.26;
  for (const p of mindState.prototypes || []) {
    const sig = hueSignature(p.rgb);
    const d = chromaDist(sig.chroma, targetChroma);
    if (d < bestD) {
      bestD = d;
      best = p;
    }
  }
  return best;
}

function runAttack3Reversal(seeds) {
  const totals = {
    preBurns: 0,
    preBerries: 0,
    preCores: 0,
    preAgentTicks: 0,

    keptPostEarlyBurns: 0,
    keptPostLateBurns: 0,
    keptPostBerries: 0,
    keptPostCores: 0,
    keptPostAgentTicks: 0,

    resetPostEarlyBurns: 0,
    resetPostLateBurns: 0,
    resetPostBerries: 0,
    resetPostCores: 0,
    resetPostAgentTicks: 0,

    fearImprintedCount: 0,
    fearExtinguishedCount: 0,
    fearStillParalyzedCount: 0,
    fearImprintedInitDI: [],
    fearImprintedFinalDI: [],
    fearImprintedBerriesKept: 0,
    fearImprintedBerriesReset: 0,
    fearImprintedBurnsKept: 0,
    fearImprintedBurnsReset: 0,

    naiveCount: 0,
    naiveBerriesKept: 0,
    naiveBerriesReset: 0,
  };

  const splitMid = Math.floor(REVERSAL_POST_TICKS / 2);

  for (const seed of seeds) {
    const world = createLivingBiomeV3({ seed });
    const minds = world.agents.map((_, i) => createPredictorMindV3(seed * 31 + i));
    world.onBirth = (childIdx) => {
      minds[childIdx] = createPredictorMindV3(seed * 31 + childIdx + world.tick);
    };

    let obs = world.getAllObservations();
    for (let t = 0; t < REVERSAL_PRE_TICKS; t++) {
      const acts = new Array(world.agents.length);
      for (let i = 0; i < world.agents.length; i++) {
        acts[i] = minds[i].act(obs[i]);
      }
      obs = world.step(acts);
    }

    // Snapshot pre-reversal counts
    const preStats = aggregateWorldStats(world);
    totals.preBurns += preStats.burnsTotal;
    totals.preBerries += preStats.berriesTotal;
    totals.preCores += preStats.coresTotal;
    totals.preAgentTicks += preStats.agentTicksTotal;

    const oldEmberIdx = world.chemistry.emberMineral.paletteIdx;
    const oldBerryIdx = world.chemistry.sanctuaryBerry.paletteIdx;
    const oldCoreIdx = world.chemistry.wildCore.paletteIdx;
    const oldEmberChroma = hueSignature(world.chemistry.emberMineral.rgb).chroma;

    // Identify agents already fear-imprinted on old emberMineral at t=1500
    const preAgentSnapshots = world.agents.map((a, idx) => {
      const st = minds[idx].getMindState();
      const emberProto = findProtoMatchingChroma(st, oldEmberChroma);
      const minDI = emberProto ? Math.min(emberProto.pred[0].dI, emberProto.pred[1].dI) : 0;
      return {
        idx,
        berriesAtSplit: a.stats.berriesEaten,
        burnsAtSplit: a.stats.burnHits,
        fearImprinted: Boolean(emberProto && minDI < -0.08),
        initDI: emberProto ? emberProto.pred[0].dI : 0,
      };
    });

    // Deterministic adversarial swap:
    //   NEW sanctuaryBerry = OLD emberMineral color!
    //   NEW emberMineral   = OLD sanctuaryBerry or OLD wildCore color!
    let swapped = false;
    for (let k = 1; k <= 2000; k++) {
      world.randomizeChemistry(seed * 997 + k);
      const newBerryIdx = world.chemistry.sanctuaryBerry.paletteIdx;
      const newEmberIdx = world.chemistry.emberMineral.paletteIdx;
      if (newBerryIdx === oldEmberIdx && (newEmberIdx === oldBerryIdx || newEmberIdx === oldCoreIdx)) {
        swapped = true;
        break;
      }
    }
    if (!swapped) {
      throw new Error(`Attack 3: failed to construct adversarial chemistry swap for seed ${seed}`);
    }

    // Snapshot world & minds AFTER reversal so Branch A (kept) and Branch B (reset) are 100% identical at t=1500
    const snapWorldAtSplit = world.snapshot();
    const snapMindsAtSplit = minds.map((m) => m.snapshotMemory());

    // --- Branch A: KEPT MEMORY ---
    let obsA = world.getAllObservations();
    let midBurnsA = 0;
    for (let t = 0; t < REVERSAL_POST_TICKS; t++) {
      const acts = new Array(world.agents.length);
      for (let i = 0; i < world.agents.length; i++) {
        if (!minds[i]) minds[i] = createPredictorMindV3(seed * 31 + i + world.tick);
        acts[i] = minds[i].act(obsA[i]);
      }
      obsA = world.step(acts);
      if (t === splitMid - 1) {
        midBurnsA = aggregateWorldStats(world).burnsTotal;
      }
    }
    const endStatsA = aggregateWorldStats(world);
    totals.keptPostEarlyBurns += midBurnsA - preStats.burnsTotal;
    totals.keptPostLateBurns += endStatsA.burnsTotal - midBurnsA;
    totals.keptPostBerries += endStatsA.berriesTotal - preStats.berriesTotal;
    totals.keptPostCores += endStatsA.coresTotal - preStats.coresTotal;
    totals.keptPostAgentTicks += endStatsA.agentTicksTotal - preStats.agentTicksTotal;

    // --- Branch B: AMNESIA CONTROL (resetMemory at t=1500) ---
    const worldB = createLivingBiomeV3({ seed });
    worldB.restore(snapWorldAtSplit);
    const mindsB = snapMindsAtSplit.map((ms, i) => {
      const m = createPredictorMindV3(seed * 31 + i);
      m.restoreMemory(ms);
      m.resetMemory();
      return m;
    });
    worldB.onBirth = (childIdx) => {
      mindsB[childIdx] = createPredictorMindV3(seed * 31 + childIdx + worldB.tick);
    };
    let obsB = worldB.getAllObservations();
    let midBurnsB = 0;
    for (let t = 0; t < REVERSAL_POST_TICKS; t++) {
      const acts = new Array(worldB.agents.length);
      for (let i = 0; i < worldB.agents.length; i++) {
        if (!mindsB[i]) mindsB[i] = createPredictorMindV3(seed * 31 + i + worldB.tick);
        acts[i] = mindsB[i].act(obsB[i]);
      }
      obsB = worldB.step(acts);
      if (t === splitMid - 1) {
        midBurnsB = aggregateWorldStats(worldB).burnsTotal;
      }
    }
    const endStatsB = aggregateWorldStats(worldB);
    totals.resetPostEarlyBurns += midBurnsB - preStats.burnsTotal;
    totals.resetPostLateBurns += endStatsB.burnsTotal - midBurnsB;
    totals.resetPostBerries += endStatsB.berriesTotal - preStats.berriesTotal;
    totals.resetPostCores += endStatsB.coresTotal - preStats.coresTotal;
    totals.resetPostAgentTicks += endStatsB.agentTicksTotal - preStats.agentTicksTotal;

    // Compare fear-imprinted vs naive agents on the NEW berry color (= OLD ember color)
    for (const rec of preAgentSnapshots) {
      const aKept = world.agents[rec.idx];
      const aReset = worldB.agents[rec.idx];
      const dBerriesKept = aKept.stats.berriesEaten - rec.berriesAtSplit;
      const dBerriesReset = aReset.stats.berriesEaten - rec.berriesAtSplit;
      const dBurnsKept = aKept.stats.burnHits - rec.burnsAtSplit;
      const dBurnsReset = aReset.stats.burnHits - rec.burnsAtSplit;

      if (rec.fearImprinted) {
        totals.fearImprintedCount++;
        totals.fearImprintedInitDI.push(rec.initDI);
        const endProto = findProtoMatchingChroma(minds[rec.idx].getMindState(), oldEmberChroma);
        const finalMinDI = endProto ? Math.min(endProto.pred[0].dI, endProto.pred[1].dI) : 0;
        totals.fearImprintedFinalDI.push(endProto ? endProto.pred[0].dI : 0);
        if (finalMinDI >= -0.08) totals.fearExtinguishedCount++;
        else totals.fearStillParalyzedCount++;

        totals.fearImprintedBerriesKept += dBerriesKept;
        totals.fearImprintedBerriesReset += dBerriesReset;
        totals.fearImprintedBurnsKept += dBurnsKept;
        totals.fearImprintedBurnsReset += dBurnsReset;
      } else {
        totals.naiveCount++;
        totals.naiveBerriesKept += dBerriesKept;
        totals.naiveBerriesReset += dBerriesReset;
      }
    }
  }

  return totals;
}

// ---------------------------------------------------------------------------
// Attack 4: Static & Dynamic Contract Leak Audit + dist/reflexbrain-v3.html
// ---------------------------------------------------------------------------
function stripJsComments(src) {
  return src.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/.*$/gm, '');
}

function runAttack4Audit() {
  const findings = [];
  const mindPath = path.join(ROOT_DIR, 'src/mind/predictor-mind.mjs');
  const appPath = path.join(ROOT_DIR, 'src/ui/app.mjs');
  const htmlPath = path.join(ROOT_DIR, 'dist/reflexbrain-v3.html');

  const mindRaw = fs.readFileSync(mindPath, 'utf8');
  const mindNoComments = stripJsComments(mindRaw);

  const FORBIDDEN = [
    'chemistry',
    'archetype',
    'player',
    'zone',
    'sanctuary',
    'wilds',
    'geode',
    'boulder',
    'ember',
    'window',
    '__REFLEXBRAIN',
  ];

  const codeMatches = [];
  const commentOnlyMatches = [];
  for (const tok of FORBIDDEN) {
    const re = new RegExp(tok, 'gi');
    const inCode = mindNoComments.match(re);
    const inRaw = mindRaw.match(re);
    if (inCode && inCode.length > 0) {
      codeMatches.push(`${tok} (${inCode.length}x)`);
    } else if (inRaw && inRaw.length > 0) {
      commentOnlyMatches.push(`${tok} (${inRaw.length}x in comments)`);
    }
  }

  // Check world/config.mjs imports in predictor-mind.mjs
  const configImportMatch = mindNoComments.match(/import\s*\{([^}]+)\}\s*from\s*['"]\.\.\/world\/config\.mjs['"]/);
  const configImports = configImportMatch
    ? configImportMatch[1].split(',').map((s) => s.trim()).filter(Boolean)
    : [];

  // Check lr=0 clamp floor bug in predictor-mind.mjs
  const hasLrClampBug =
    /clamp\s*\(\s*lr\s*\*\s*1\.65\s*,\s*0\.55/.test(mindNoComments) ||
    /clamp\s*\(\s*lr\s*\*\s*1\.15\s*,\s*0\.38/.test(mindNoComments);

  // Check UI isolation in src/ui/app.mjs
  const appRaw = fs.readFileSync(appPath, 'utf8');
  const appNoComments = stripJsComments(appRaw);
  const exposesDebugHandle = appNoComments.includes('window.__REFLEXBRAIN_V3__');
  const mindActCalls = appNoComments.match(/minds\[[^\]]+\]\.act\(([^)]+)\)/g) || [];
  const uiPassesOnlyObs = mindActCalls.length > 0 && mindActCalls.every((c) => /act\(\s*lastObs\[/.test(c));

  // Dynamic obs seal check on live LivingBiomeV3 with Player enabled
  const testWorld = createLivingBiomeV3({ seed: 9001, enablePlayer: true });
  for (let t = 0; t < 30; t++) {
    testWorld.step([], { moveX: 1, moveY: 0, aimAngle: 0, toggleGrip: false, dash: false });
  }
  const obs0 = testWorld.getObservation(0);
  const topKeys = Object.keys(obs0).sort();
  const expectedTopKeys = ['body', 'retina', 'touch'];
  const topKeysClean = JSON.stringify(topKeys) === JSON.stringify(expectedTopKeys);

  const allowedBodyKeys = new Set([
    'vxBody', 'vyBody', 'omega', 'gazeOffset',
    'feltForceXBody', 'feltForceYBody',
    'energy', 'dEnergy', 'integrity', 'dIntegrity',
    'stress', 'dStress', 'stamina', 'gripping', 'carrying',
  ]);
  const unexpectedBodyKeys = Object.keys(obs0.body).filter((k) => !allowedBodyKeys.has(k));
  const touchKeysClean = obs0.touch.every(
    (s) => JSON.stringify(Object.keys(s).sort()) === JSON.stringify(['impulse', 'pressure', 'rgb'])
  );
  const retinaShapeClean =
    obs0.retina.length === DEFAULT_CONFIG.retinaRays &&
    obs0.retina.every((px) => Array.isArray(px) && px.length === 3 && px.every((v) => Number.isFinite(v)));

  // Reference-mutation isolation test
  const origTouchP = testWorld.agents[0].touch[0].pressure;
  obs0.touch[0].pressure = 999;
  obs0.retina[0][0] = 999;
  const noRefLeak = testWorld.agents[0].touch[0].pressure === origTouchP;

  // Sanity-check dist/reflexbrain-v3.html
  let htmlExists = fs.existsSync(htmlPath);
  let htmlKb = 0;
  let htmlSyntaxOk = false;
  let htmlSyntaxErr = null;
  let htmlMindHasWindow = false;
  let htmlHasRawImportExport = false;

  if (htmlExists) {
    const html = fs.readFileSync(htmlPath, 'utf8');
    htmlKb = html.length / 1024;
    const m = html.match(/<script>([\s\S]*?)<\/script>/);
    if (m) {
      const scriptText = m[1];
      try {
        new Function(scriptText);
        htmlSyntaxOk = true;
      } catch (err) {
        htmlSyntaxErr = err.message;
      }
      const mindModMatch = scriptText.match(
        /__modules\['mind\/predictor-mind'\]\s*=\s*function\(__require\)\s*\{([\s\S]*?)__modules\['/
      );
      if (mindModMatch) {
        const mindSlice = stripJsComments(mindModMatch[1]);
        htmlMindHasWindow = /\bwindow\b|__REFLEXBRAIN/.test(mindSlice);
      }
      htmlHasRawImportExport = /^\s*(import|export)\s+/m.test(stripJsComments(scriptText));
    } else {
      htmlSyntaxErr = 'No <script> block found';
    }
  }

  return {
    codeMatches,
    commentOnlyMatches,
    configImports,
    hasLrClampBug,
    exposesDebugHandle,
    uiPassesOnlyObs,
    topKeysClean,
    unexpectedBodyKeys,
    touchKeysClean,
    retinaShapeClean,
    noRefLeak,
    htmlExists,
    htmlKb,
    htmlSyntaxOk,
    htmlSyntaxErr,
    htmlMindHasWindow,
    htmlHasRawImportExport,
    findings,
  };
}

// ---------------------------------------------------------------------------
// Main Execution
// ---------------------------------------------------------------------------
const t0All = performance.now();
console.log('================================================================================');
console.log('  REFLEXBRAIN v3 — ADVERSARIAL AUDIT SUITE (tests/attack-v3.mjs)');
console.log(`  Held-out seeds: ${HELD_OUT_SEEDS[0]}..${HELD_OUT_SEEDS[HELD_OUT_SEEDS.length - 1]} (${HELD_OUT_SEEDS.length} seeds)`);
console.log('================================================================================\n');

// --- ATTACK 1 ---
const t1 = performance.now();
console.log(`[ATTACK 1] Learning Ablation (${HELD_OUT_SEEDS.length} seeds x ${BASE_TICKS} ticks)`);
console.log('  Comparing: predictorMindV3 (lr=0.48) vs lr0Broken (lr=0) vs trueFrozenMind (pred=0, places=[])');
const resPred = runControllerOnSeeds(
  'predictorMindV3',
  (s) => createPredictorMindV3(s, { learningRate: 0.48 }),
  HELD_OUT_SEEDS,
  BASE_TICKS
);
const resLr0 = runControllerOnSeeds(
  'lr0 (API bug!)',
  (s) => createPredictorMindV3(s, { learningRate: 0 }),
  HELD_OUT_SEEDS,
  BASE_TICKS
);
const resTrueFrozen = runControllerOnSeeds(
  'trueFrozenMind',
  (s) => createTrueFrozenMind(s),
  HELD_OUT_SEEDS,
  BASE_TICKS
);

printSummaryTable([resPred, resLr0, resTrueFrozen]);
console.log('');
console.log(
  `  Learning-matrix audit: ` +
    `predictorMindV3 max|dE|=${fmt(resPred.avgMaxDE, 2)} max|dI|=${fmt(resPred.avgMaxDI, 2)} places=${fmt(resPred.avgPlaces, 1)} | ` +
    `lr=0 max|dE|=${fmt(resLr0.avgMaxDE, 2)} max|dI|=${fmt(resLr0.avgMaxDI, 2)} places=${fmt(resLr0.avgPlaces, 1)} (NON-ZERO = CLAMP BUG!) | ` +
    `trueFrozen max|dE|=${fmt(resTrueFrozen.avgMaxDE, 2)} max|dI|=${fmt(resTrueFrozen.avgMaxDI, 2)} places=${fmt(resTrueFrozen.avgPlaces, 1)}`
);
console.log(
  `  Paired wins predictorMindV3 vs trueFrozenMind: ` +
    `Viability=${pairedWins(resPred, resTrueFrozen, (s) => s.viability, true)}, ` +
    `Burns/1k(lower)=${pairedWins(resPred, resTrueFrozen, (s) => s.burnsPer1k, false)}, ` +
    `Cores/1k=${pairedWins(resPred, resTrueFrozen, (s) => s.coresPer1k, true)}, ` +
    `Geodes/1k=${pairedWins(resPred, resTrueFrozen, (s) => s.geodesPer1k, true)}`
);
console.log(
  `  Paired wins predictorMindV3 vs lr=0(buggy):    ` +
    `Viability=${pairedWins(resPred, resLr0, (s) => s.viability, true)}, ` +
    `Geodes/1k=${pairedWins(resPred, resLr0, (s) => s.geodesPer1k, true)}, ` +
    `Burns/1k(lower)=${pairedWins(resPred, resLr0, (s) => s.burnsPer1k, false)}`
);
console.log(`  Elapsed Attack 1: ${fmt((performance.now() - t1) / 1000, 2)}s\n`);

// --- ATTACK 2 ---
const t2 = performance.now();
console.log(`[ATTACK 2] Memoryless Adversary: greedyChaser vs predictorMindV3 (${HELD_OUT_SEEDS.length} seeds x ${BASE_TICKS} ticks)`);
const resGreedy = runControllerOnSeeds(
  'greedyChaser',
  (s) => createGreedyChaser(s),
  HELD_OUT_SEEDS,
  BASE_TICKS
);
printSummaryTable([resPred, resGreedy]);
console.log('');
console.log(
  `  Paired wins predictorMindV3 vs greedyChaser: ` +
    `Viability=${pairedWins(resPred, resGreedy, (s) => s.viability, true)}, ` +
    `Burns/1k(lower)=${pairedWins(resPred, resGreedy, (s) => s.burnsPer1k, false)}, ` +
    `MeanI=${pairedWins(resPred, resGreedy, (s) => s.meanIntegrity, true)}, ` +
    `Cores/1k=${pairedWins(resPred, resGreedy, (s) => s.coresPer1k, true)}, ` +
    `Berries/1k=${pairedWins(resPred, resGreedy, (s) => s.berriesPer1k, true)}, ` +
    `Geodes/1k=${pairedWins(resPred, resGreedy, (s) => s.geodesPer1k, true)}`
);
console.log(`  Elapsed Attack 2: ${fmt((performance.now() - t2) / 1000, 2)}s\n`);

// --- ATTACK 3 ---
const t3 = performance.now();
console.log(
  `[ATTACK 3] Mid-Run Chemistry Reversal (${HELD_OUT_SEEDS.length} seeds x ${REVERSAL_PRE_TICKS + REVERSAL_POST_TICKS} ticks, swap at t=${REVERSAL_PRE_TICKS})`
);
console.log('  Adversarial swap: OLD emberMineral color -> NEW sanctuaryBerry; OLD food color -> NEW emberMineral');
const rev = runAttack3Reversal(HELD_OUT_SEEDS);
const preBurns1k = (rev.preBurns / Math.max(1, rev.preAgentTicks)) * 1000;
const preBerries1k = (rev.preBerries / Math.max(1, rev.preAgentTicks)) * 1000;
const keptPostBurns1k = ((rev.keptPostEarlyBurns + rev.keptPostLateBurns) / Math.max(1, rev.keptPostAgentTicks)) * 1000;
const keptPostBerries1k = (rev.keptPostBerries / Math.max(1, rev.keptPostAgentTicks)) * 1000;
const resetPostBurns1k = ((rev.resetPostEarlyBurns + rev.resetPostLateBurns) / Math.max(1, rev.resetPostAgentTicks)) * 1000;
const resetPostBerries1k = (rev.resetPostBerries / Math.max(1, rev.resetPostAgentTicks)) * 1000;

console.log(`  Pre-reversal  (t=0..${REVERSAL_PRE_TICKS}):            burns=${rev.preBurns} (${fmt(preBurns1k, 2)}/1k), berries=${rev.preBerries} (${fmt(preBerries1k, 2)}/1k), cores=${rev.preCores}`);
console.log(
  `  Post KEPT-MEM (t=${REVERSAL_PRE_TICKS + 1}..${REVERSAL_PRE_TICKS + REVERSAL_POST_TICKS}): ` +
    `burns=${rev.keptPostEarlyBurns + rev.keptPostLateBurns} [early=${rev.keptPostEarlyBurns}, late=${rev.keptPostLateBurns}] (${fmt(keptPostBurns1k, 2)}/1k), ` +
    `NEW-color berries=${rev.keptPostBerries} (${fmt(keptPostBerries1k, 2)}/1k), cores=${rev.keptPostCores}`
);
console.log(
  `  Post AMNESIA  (resetMemory@1500):  ` +
    `burns=${rev.resetPostEarlyBurns + rev.resetPostLateBurns} [early=${rev.resetPostEarlyBurns}, late=${rev.resetPostLateBurns}] (${fmt(resetPostBurns1k, 2)}/1k), ` +
    `NEW-color berries=${rev.resetPostBerries} (${fmt(resetPostBerries1k, 2)}/1k), cores=${rev.resetPostCores}`
);
const paralysisRate = rev.fearImprintedCount > 0 ? (rev.fearStillParalyzedCount / rev.fearImprintedCount) * 100 : 0;
console.log('');
console.log(`  PARALYSIS AUDIT (agents fear-imprinted on old ember color at t=${REVERSAL_PRE_TICKS}):`);
console.log(
  `    Imprinted agents: ${rev.fearImprintedCount} (naive: ${rev.naiveCount}) | ` +
    `Still paralyzed (min dI < -0.08) at t=3600: ${rev.fearStillParalyzedCount}/${rev.fearImprintedCount} (${fmt(paralysisRate, 1)}%) | ` +
    `Extinguished: ${rev.fearExtinguishedCount}/${rev.fearImprintedCount}`
);
console.log(
  `    Mean pred[GENTLE].dI on old-ember color: at t=1500 = ${fmt(mean(rev.fearImprintedInitDI), 3)} -> at t=3600 = ${fmt(mean(rev.fearImprintedFinalDI), 3)}`
);
console.log(
  `    NEW-color berries eaten by fear-imprinted agents: ` +
    `KEPT-MEM=${rev.fearImprintedBerriesKept} (${fmt(rev.fearImprintedBerriesKept / Math.max(1, rev.fearImprintedCount), 2)}/agent) vs ` +
    `AMNESIA=${rev.fearImprintedBerriesReset} (${fmt(rev.fearImprintedBerriesReset / Math.max(1, rev.fearImprintedCount), 2)}/agent)`
);
console.log(
  `    NEW-color berries eaten by naive agents (control): ` +
    `KEPT-MEM=${rev.naiveBerriesKept} (${fmt(rev.naiveBerriesKept / Math.max(1, rev.naiveCount), 2)}/agent) vs ` +
    `AMNESIA=${rev.naiveBerriesReset} (${fmt(rev.naiveBerriesReset / Math.max(1, rev.naiveCount), 2)}/agent)`
);
console.log(`  Elapsed Attack 3: ${fmt((performance.now() - t3) / 1000, 2)}s\n`);

// --- ATTACK 4 ---
const t4 = performance.now();
console.log('[ATTACK 4] Contract Leak Audit & dist/reflexbrain-v3.html Integrity Check');
const a4 = runAttack4Audit();
console.log(`  predictor-mind.mjs forbidden tokens in CODE:     ${a4.codeMatches.length === 0 ? 'NONE (CLEAN)' : 'FAIL: ' + a4.codeMatches.join(', ')}`);
console.log(`  predictor-mind.mjs forbidden tokens in COMMENTS: ${a4.commentOnlyMatches.length === 0 ? 'NONE' : a4.commentOnlyMatches.join(', ')}`);
console.log(`  predictor-mind.mjs imports from world/config:    ${a4.configImports.length === 0 ? 'NONE' : a4.configImports.join(', ')} (COLOR_ROCK = world-constant leak!)`);
console.log(`  predictor-mind.mjs lr=0 clamp floor bug present: ${a4.hasLrClampBug ? 'YES (CONFIRMED BUG)' : 'NO'}`);
console.log(`  biome.mjs runtime obs seal:                      topKeys=${a4.topKeysClean ? 'OK' : 'FAIL'}, bodyKeys=${a4.unexpectedBodyKeys.length === 0 ? 'OK' : 'FAIL:' + a4.unexpectedBodyKeys.join(',')}, touch=${a4.touchKeysClean ? 'OK' : 'FAIL'}, retina=${a4.retinaShapeClean ? 'OK' : 'FAIL'}, noRefLeak=${a4.noRefLeak ? 'OK' : 'FAIL'}`);
console.log(`  ui/app.mjs isolation:                            __REFLEXBRAIN_V3__=${a4.exposesDebugHandle ? 'present' : 'absent'}, minds.act receives only lastObs=${a4.uiPassesOnlyObs ? 'OK' : 'FAIL'}`);
console.log(
  `  dist/reflexbrain-v3.html sanity:                 exists=${a4.htmlExists} (${fmt(a4.htmlKb, 1)} KB), ` +
    `syntax=${a4.htmlSyntaxOk ? 'OK' : 'FAIL: ' + a4.htmlSyntaxErr}, ` +
    `mindHasWindow=${a4.htmlMindHasWindow ? 'FAIL' : 'CLEAN'}, ` +
    `rawImportExport=${a4.htmlHasRawImportExport ? 'FAIL' : 'CLEAN'}`
);
console.log(`  Elapsed Attack 4: ${fmt((performance.now() - t4) / 1000, 2)}s\n`);

// --- FINAL VERDICT SUMMARY ---
const totalSec = (performance.now() - t0All) / 1000;
console.log('================================================================================');
console.log(`  AUDIT COMPLETE in ${fmt(totalSec, 2)}s`);
console.log('  Key adversarial flags:');
console.log(`   1. lr=0 clamp bug confirmed:           ${resLr0.avgMaxDE > 0.1 || resLr0.avgMaxDI > 0.1 ? 'YES (FAIL — lr=0 still learns!)' : 'NO'}`);
console.log(`   2. Real learning over trueFrozenMind:  dViab=${fmt(resPred.viability - resTrueFrozen.viability, 2)}, dBurns/1k=${fmt(resPred.burnsPer1k - resTrueFrozen.burnsPer1k, 2)}`);
console.log(`   3. Beats memoryless greedyChaser:      dViab=${fmt(resPred.viability - resGreedy.viability, 2)}, dBurns/1k=${fmt(resPred.burnsPer1k - resGreedy.burnsPer1k, 2)}`);
console.log(`   4. Reversal paralysis (0.015 asymm):   ${rev.fearStillParalyzedCount}/${rev.fearImprintedCount} (${fmt(paralysisRate, 1)}%) stuck fearing new berry color`);
console.log(`   5. World-constant import leak:         ${a4.configImports.includes('COLOR_ROCK') ? 'YES (COLOR_ROCK imported in predictor-mind.mjs)' : 'NO'}`);
console.log('================================================================================');
