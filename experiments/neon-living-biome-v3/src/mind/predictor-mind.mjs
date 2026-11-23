// src/mind/predictor-mind.mjs — ReflexBrain v3: Action-Conditioned Outcome Predictor
//
// HONEST ARCHITECTURAL BOUNDARY (explicitly separating innate physiology/priors from learned state):
// 1. INNATE BODY PHYSIOLOGY & SENSORY PRIORS (not learned):
//    - Opponent-color (R-G, B-Y) retina transform & dark-achromatic barrier filter (`isRockRay`, zero world imports).
//    - Acute pain recoil reflex (`dI < -0.025`), rock-wall sliding, stuck-recovery, and gaze orienting.
//    - Exploratory scaffolding priors: `solidVal`, `movingScore`, and gated strike/near curiosity cues.
// 2. ONLINE LEARNED STATE (zero world-constant imports, zero object/zone/player knowledge):
//    - Per-prototype 3-active-action outcome predictor (`GENTLE`, `STRIKE`, `NEAR`) vs null reference (`AVOID = 0`):
//      `pred[style] = { dE, dI, dS, trials }` updated purely from own sensorimotor history (`lr = 0` truly freezes learning!).
//    - Visual-odometric `PlaceGraph` with loop-closure relocalization (`estX/estY/estHeading` starting at 0,0,0).
//    - Adaptive fear decay after prolonged pain-free intervals (`lastPainTick`) so mid-run chemistry reversals recover!

import { clamp, wrapAngle, createRng } from '../world/biome.mjs';

export const ACTION_STYLES = Object.freeze(['delikatnie', 'uderz', 'blisko', 'omijaj']);
const S_GENTLE = 0;
const S_STRIKE = 1;
const S_NEAR = 2;
const S_AVOID = 3;

function rgbDist(a, b) {
  const dr = a[0] - b[0];
  const dg = a[1] - b[1];
  const db = a[2] - b[2];
  return Math.sqrt(dr * dr + dg * dg + db * db);
}

function normalize3(x, y, z) {
  const m = Math.sqrt(x * x + y * y + z * z);
  if (m < 1e-6) return [0, 0, 0, 0];
  return [x / m, y / m, z / m, m];
}

function dot3(a, b) {
  return a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
}

function cosVec(a, b) {
  let num = 0, da = 0, db = 0;
  for (let i = 0; i < a.length; i++) {
    num += a[i] * b[i];
    da += a[i] * a[i];
    db += b[i] * b[i];
  }
  return num / Math.sqrt(da * db + 1e-12);
}

// Distance-invariant biological opponent-color signature:
// Because ray attenuation scales [r, g, b] uniformly by `atten`,
// both `rg = (r - g) / lum` and `by = (b - 0.5*(r + g)) / lum` are 100% distance-invariant
// while spreading muted natural pigments cleanly across the full 2D chroma plane!
export function hueSignature(rgb) {
  const [ux, uy, uz, mag] = normalize3(rgb[0], rgb[1], rgb[2]);
  const lum = (rgb[0] + rgb[1] + rgb[2]) / 3;
  const invLum = lum > 1e-5 ? 1 / lum : 0;
  const rg = (rgb[0] - rgb[1]) * invLum;
  const by = (rgb[2] - 0.5 * (rgb[0] + rgb[1])) * invLum;
  const chromaMag = Math.hypot(rg, by);
  const maxC = Math.max(rgb[0], rgb[1], rgb[2]);
  const minC = Math.min(rgb[0], rgb[1], rgb[2]);
  const sat = maxC > 1e-5 ? (maxC - minC) / maxC : 0;
  return { dir: [ux, uy, uz], chroma: [rg, by], chromaMag, mag, sat };
}

export function chromaDist(a, b) {
  return Math.hypot(a[0] - b[0], a[1] - b[1]);
}

function rgbToHex(rgb) {
  const h = (v) =>
    Math.round(clamp(v, 0, 1) * 255)
      .toString(16)
      .padStart(2, '0');
  return `#${h(rgb[0])}${h(rgb[1])}${h(rgb[2])}`;
}

// Purely sensory dark-achromatic structural barrier filter (ZERO imported world color constants!):
// Separates dim neutral barriers (low luminance & low saturation/chroma) from bright ivory bodies & vivid matter.
export function isRockRay(rgb) {
  const h = hueSignature(rgb);
  return h.mag < 0.50 && h.chromaMag < 0.44 && h.sat < 0.34;
}

export function estimateLocalSky(retina) {
  const N = retina.length;
  const cands = [];
  for (let i = 0; i < N; i++) {
    const p = retina[i];
    const lum = p[0] + p[1] + p[2];
    if (lum > 0.56) continue;
    if (isRockRay(p)) continue;
    const dL = i > 0 ? rgbDist(p, retina[i - 1]) : 1;
    const dR = i < N - 1 ? rgbDist(p, retina[i + 1]) : 1;
    if (Math.min(dL, dR) < 0.015) cands.push(p);
  }
  if (cands.length === 0) return { rgb: null, confidence: 0 };
  let sr = 0, sg = 0, sb = 0;
  for (const p of cands) { sr += p[0]; sg += p[1]; sb += p[2]; }
  const inv = 1 / cands.length;
  return { rgb: [sr * inv, sg * inv, sb * inv], confidence: clamp(cands.length / 4, 0, 1) };
}

function makeFreshPredMatrix() {
  return [
    { dE: 0, dI: 0, dS: 0, trials: 0 }, // 0: GENTLE_APPROACH
    { dE: 0, dI: 0, dS: 0, trials: 0 }, // 1: STRIKE_IMPACT
    { dE: 0, dI: 0, dS: 0, trials: 0 }, // 2: STAY_NEAR
    { dE: 0, dI: 0, dS: 0, trials: 0 }, // 3: AVOID (safe null reference)
  ];
}

export function createPredictorMindV3(seed = 1, options = {}) {
  const rng = createRng((seed * 131071 + 41) >>> 0);
  const cfg = {
    learningRate: options.learningRate ?? 0.48,
    curiosityGain: options.curiosityGain ?? 0.62,
    calmnessBias: options.calmnessBias ?? 0.55,
    odometryDrift: options.odometryDrift ?? 0.0012,
    maxPrototypes: 16,
    maxPlaces: 10,
    protoMatchDist: 0.26, // opponent-color (rg, by) cluster radius (< half min palette spacing!)
    fov: options.fov ?? (195 * Math.PI) / 180,
  };

  let state = null;

  function makeFreshState() {
    return {
      tick: 0,
      prototypes: [],
      // Per-prototype short-horizon credit assignment traces for each interaction style
      elig: {}, // id -> { gentle, strike, near, view }
      // Egocentric odometry & visual-odometric PlaceGraph (starts at 0,0,0 — zero global coords!)
      estX: 0,
      estY: 0,
      estHeading: 0,
      places: [],
      loopClosures: 0,
      lastLoopClosureTick: -999,
      // Homeostatic / affective inner state
      arousal: 0.12,
      surprise: 0,
      flinchTicks: 0,
      flinchDir: 1,
      gazeScanPhase: rng.next() * Math.PI * 2,
      // Sensory prediction & optic flow
      predRetinaMean: [0.08, 0.11, 0.14],
      predForceMag: 0,
      prevRetina: null,
      prevGazeOffset: 0,
      prevStress: 0,
      // Navigation state
      wanderBias: (rng.next() * 2 - 1) * 0.38,
      stuckTicks: 0,
      wallFollowTicks: 0,
      wallFollowDir: rng.next() < 0.5 ? -1 : 1,
      activeStyle: 'obserwacja',
      activeTargetProtoId: -1,
      loggedKeys: {},
      biography: [],
      nextProtoId: 1,
    };
  }

  state = makeFreshState();

  function logEvent(key, text, rgb = null) {
    if (key && state.loggedKeys[key]) return;
    if (key) state.loggedKeys[key] = state.tick;
    state.biography.unshift({ tick: state.tick, text, hex: rgb ? rgbToHex(rgb) : null });
    if (state.biography.length > 18) state.biography.pop();
  }

  function matchOrCreatePrototype(chroma, rawRgb, createIfMissing = true) {
    let best = null;
    let bestD = cfg.protoMatchDist;
    for (let i = 0; i < state.prototypes.length; i++) {
      const p = state.prototypes[i];
      const d = chromaDist(p.chroma, chroma);
      if (d < bestD) {
        bestD = d;
        best = p;
      }
    }
    if (best) {
      const a = 0.02;
      best.chroma[0] = best.chroma[0] * (1 - a) + chroma[0] * a;
      best.chroma[1] = best.chroma[1] * (1 - a) + chroma[1] * a;
      best.displayRgb[0] = best.displayRgb[0] * (1 - a) + rawRgb[0] * a;
      best.displayRgb[1] = best.displayRgb[1] * (1 - a) + rawRgb[1] * a;
      best.displayRgb[2] = best.displayRgb[2] * (1 - a) + rawRgb[2] * a;
      best.seenTicks++;
      return best;
    }
    if (!createIfMissing) return null;
    if (state.prototypes.length >= cfg.maxPrototypes) {
      let evictIdx = 0;
      let minScore = Infinity;
      for (let i = 0; i < state.prototypes.length; i++) {
        const p = state.prototypes[i];
        const totalTrials = p.pred.reduce((s, r) => s + r.trials, 0);
        const salience = p.pred.reduce((s, r) => s + Math.abs(r.dE) + Math.abs(r.dI) + Math.abs(r.dS), 0);
        const sc = totalTrials * 3 + salience * 20 + p.seenTicks * 0.01;
        if (sc < minScore) { minScore = sc; evictIdx = i; }
      }
      delete state.elig[state.prototypes[evictIdx].id];
      state.prototypes.splice(evictIdx, 1);
    }
    const created = {
      id: state.nextProtoId++,
      chroma: [chroma[0], chroma[1]],
      displayRgb: [rawRgb[0], rawRgb[1], rawRgb[2]],
      seenTicks: 1,
      touchCount: 0,
      solidVal: 0,
      movingScore: 0,
      lastPainTick: -9999,
      pred: makeFreshPredMatrix(),
    };
    state.prototypes.push(created);
    state.elig[created.id] = { gentle: 0, strike: 0, near: 0, view: 0 };
    return created;
  }

  // Uniform Active-Inference utility evaluation for ANY prototype `p` and ANY interaction style `a`!
  // Separates healing value (only valuable when damaged!) from pain avoidance (always active!).
  function styleUtility(p, style, wE, wHeal, wPain, wS, wC) {
    const pr = p.pred[style];
    const unc = style === S_STRIKE ? 1 / (1 + 0.55 * pr.trials) : 1 / (1 + 1.35 * pr.trials);

    // Expected homeostatic value (purely learned from sensory consequences!)
    const iTerm = pr.dI >= 0 ? wHeal * pr.dI : wPain * pr.dI;
    const sTerm = pr.dS <= 0 ? -wS * pr.dS : -wPain * 0.45 * pr.dS;
    let val = wE * pr.dE + iTerm + sTerm;

    // Epistemic curiosity bonus: explore uncertain actions, UNLESS painful contact was recently learned!
    const minPain = Math.min(p.pred[S_GENTLE].dI, p.pred[S_STRIKE].dI);
    const knownPain = minPain < -0.08;
    const stalePain = state.tick - (p.lastPainTick ?? -9999) > 520;
    if (style === S_AVOID) {
      return val;
    }
    if (knownPain) {
      // If pain was recent, keep strict avoidance; after prolonged pain-free time & hunger, allow cautious re-testing!
      if (style === S_GENTLE && stalePain && wE > 1.35) {
        return val + wC * 0.42;
      }
      return val - 0.35;
    }

    if (style === S_GENTLE) {
      val += wC * unc * 0.78;
    } else if (style === S_STRIKE) {
      // Experiment with hard striking after gentle contact revealed a solid, non-edible, stationary object
      const worthTestingStrike =
        p.solidVal > 0.30 &&
        p.pred[S_GENTLE].trials >= 1 &&
        p.pred[S_GENTLE].dE < 0.06 &&
        p.movingScore < 0.14;
      val += worthTestingStrike ? wC * unc * 0.82 : -0.10;
    } else if (style === S_NEAR) {
      // Mild social/shelter exploration value when object moves or under elevated stress
      const worthNear = p.movingScore > 0.08 || wS > 0.65;
      val += worthNear ? wC * unc * 0.22 : -0.02;
    }
    return val;
  }

  function bestStyleFor(p, wE, wHeal, wPain, wS, wC) {
    let bestA = S_AVOID;
    let bestU = styleUtility(p, S_AVOID, wE, wHeal, wPain, wS, wC);
    for (let a = 0; a < 3; a++) {
      const u = styleUtility(p, a, wE, wHeal, wPain, wS, wC);
      if (u > bestU) {
        bestU = u;
        bestA = a;
      }
    }
    return { style: bestA, utility: bestU };
  }

  // Visual-Odometric PlaceGraph upsert + loop-closure relocalization!
  function upsertPlace(dE, dI, dS, sceneSig) {
    if (cfg.learningRate <= 1e-6) return;
    // Check for existing nearby anchor (within 150px odometric radius)
    for (const pl of state.places) {
      const dist = Math.hypot(pl.estX - state.estX, pl.estY - state.estY);
      if (dist < 150) {
        pl.estX = pl.estX * 0.72 + state.estX * 0.28;
        pl.estY = pl.estY * 0.72 + state.estY * 0.28;
        pl.dE = pl.dE * 0.75 + dE * 0.25;
        pl.dI = pl.dI * 0.75 + dI * 0.25;
        pl.dS = pl.dS * 0.75 + dS * 0.25;
        pl.strength = clamp(pl.strength + 0.25, 0.1, 3.0);
        for (let i = 0; i < sceneSig.length; i++) pl.sceneSig[i] = pl.sceneSig[i] * 0.8 + sceneSig[i] * 0.2;
        pl.updatedTick = state.tick;
        return;
      }
    }
    if (state.places.length >= cfg.maxPlaces) {
      let minIdx = 0;
      for (let i = 1; i < state.places.length; i++) {
        if (state.places[i].strength < state.places[minIdx].strength) minIdx = i;
      }
      state.places.splice(minIdx, 1);
    }
    state.places.push({
      estX: state.estX,
      estY: state.estY,
      dE,
      dI,
      dS,
      strength: 0.75,
      sceneSig: [...sceneSig],
      updatedTick: state.tick,
    });
  }

  function act(obs) {
    state.tick++;
    const lr = cfg.learningRate;
    const ret = obs.retina;
    const N = ret.length;
    const body = obs.body;

    // --- 1. Private egocentric odometry ---
    const driftTurn = (rng.next() * 2 - 1) * cfg.odometryDrift;
    state.estHeading = wrapAngle(state.estHeading + body.omega + driftTurn);
    const ch = Math.cos(state.estHeading);
    const sh = Math.sin(state.estHeading);
    state.estX += body.vxBody * ch - body.vyBody * sh;
    state.estY += body.vxBody * sh + body.vyBody * ch;

    // --- 2. Local sky, sensory prediction error (surprise) & optic-flow motion detection ---
    const skyProbe = estimateLocalSky(ret);
    const estSky = skyProbe.rgb || [0.07, 0.10, 0.14];

    let meanR = 0, meanG = 0, meanB = 0;
    for (let i = 0; i < N; i++) { meanR += ret[i][0]; meanG += ret[i][1]; meanB += ret[i][2]; }
    meanR /= N; meanG /= N; meanB /= N;

    const forceMag = Math.hypot(body.feltForceXBody, body.feltForceYBody);
    const instSurprise = clamp(rgbDist([meanR, meanG, meanB], state.predRetinaMean) * 4.5 + Math.abs(forceMag - state.predForceMag) * 2.8, 0, 1.5);
    state.surprise = state.surprise * 0.90 + instSurprise * 0.10;
    state.predRetinaMean[0] = state.predRetinaMean[0] * 0.90 + meanR * 0.10;
    state.predRetinaMean[1] = state.predRetinaMean[1] * 0.90 + meanG * 0.10;
    state.predRetinaMean[2] = state.predRetinaMean[2] * 0.90 + meanB * 0.10;
    state.predForceMag = state.predForceMag * 0.88 + forceMag * 0.12;

    const rayMotion = new Float64Array(N);
    const dLook = body.omega + (body.gazeOffset - state.prevGazeOffset);
    const shiftRays = Math.round(dLook / (cfg.fov / Math.max(1, N - 1)));
    const ownSpeed = Math.hypot(body.vxBody, body.vyBody);
    // Detect true external motion ONLY when own translation/rotation is minimal (eliminates self-motion parallax on static boulders!)
    if (state.prevRetina && ownSpeed < 0.42 && Math.abs(dLook) < 0.045) {
      for (let i = 0; i < N; i++) {
        const pi = i + shiftRays;
        if (pi >= 0 && pi < N) {
          const d = rgbDist(ret[i], state.prevRetina[pi]);
          if (d > 0.22) rayMotion[i] = clamp(d, 0, 1);
        }
      }
    }
    state.prevRetina = ret.map((p) => [p[0], p[1], p[2]]);
    state.prevGazeOffset = body.gazeOffset;

    // --- 3. Decay interaction eligibility traces ---
    for (const id in state.elig) {
      const e = state.elig[id];
      e.gentle *= 0.82;
      e.strike *= 0.975; // ~100 tick (~1.7s) credit window so cracking a geode & eating shards credits STRIKE!
      e.near *= 0.972;   // ~2s window so nearby helper/shelter gets credit!
      e.view *= 0.88;
    }

    // --- 4. Parse 36-ray retina & compute compact 6D visual scene signature for Loop Closure ---
    const rayProtos = new Array(N);
    const rayWeights = new Float64Array(N);
    const rayBodyAng = new Float64Array(N);
    let rockL = 0, rockC = 0, rockR = 0, colorHits = 0;
    let maxMotionRay = -1, maxMotionVal = 0;

    for (let i = 0; i < N; i++) {
      const frac = N > 1 ? i / (N - 1) - 0.5 : 0;
      const bAng = wrapAngle(body.gazeOffset + frac * cfg.fov);
      rayBodyAng[i] = bAng;
      const px = ret[i];

      if (rgbDist(px, estSky) < 0.038) {
        rayProtos[i] = null;
        rayWeights[i] = 0;
        continue;
      }
      if (isRockRay(px)) {
        rayProtos[i] = null;
        rayWeights[i] = -0.35;
        if (frac < -0.17) rockL++;
        else if (frac > 0.17) rockR++;
        else rockC++;
        continue;
      }
      const h = hueSignature(px);
      if (h.mag < 0.18) { rayProtos[i] = null; rayWeights[i] = 0; continue; }
      const p = matchOrCreatePrototype(h.chroma, px, h.mag > 0.28);
      rayProtos[i] = p;
      rayWeights[i] = clamp(h.mag / 1.12, 0.1, 1.2);
      colorHits++;
      if (p) {
        const el = state.elig[p.id];
        el.view = Math.min(1.5, el.view + rayWeights[i] * 0.14);
        if (rayWeights[i] > 0.36) el.near = Math.min(1.5, el.near + 0.14);
        if (rayMotion[i] > 0.22 && ownSpeed < 0.42 && Math.abs(dLook) < 0.045) {
          p.movingScore = clamp(p.movingScore * 0.90 + 0.14 * rayMotion[i], 0, 1);
          if (rayMotion[i] > maxMotionVal) { maxMotionVal = rayMotion[i]; maxMotionRay = i; }
        } else if (ownSpeed < 0.42 && Math.abs(dLook) < 0.045 && rayWeights[i] > 0.45) {
          p.movingScore *= 0.985;
        }
      }
    }

    const sceneSig = [
      rockL / (N / 3),
      rockC / (N / 3),
      rockR / (N / 3),
      estSky[0] * 3.5,
      estSky[1] * 3.5,
      colorHits / N,
    ];

    // Visual-Odometric Loop Closure: when nearby an anchor AND visual scene matches -> gently correct drift!
    if (state.tick - state.lastLoopClosureTick >= 90) {
      for (const pl of state.places) {
        const dist = Math.hypot(pl.estX - state.estX, pl.estY - state.estY);
        if (dist > 30 && dist < 180 && cosVec(sceneSig, pl.sceneSig) > 0.94) {
          state.estX = state.estX * 0.90 + pl.estX * 0.10;
          state.estY = state.estY * 0.90 + pl.estY * 0.10;
          state.loopClosures++;
          state.lastLoopClosureTick = state.tick;
          break;
        }
      }
    }

    // --- 5. Process 8 directional touch sectors ---
    let touchedRockFront = false;
    let maxTouchP = 0;
    let painAngle = 0;
    const touchedGentleIds = [];
    const touchedStrikeIds = [];

    for (let s = 0; s < obs.touch.length; s++) {
      const t = obs.touch[s];
      if (t.pressure <= 0.05) continue;
      if (t.pressure > maxTouchP) maxTouchP = t.pressure;
      if (isRockRay(t.rgb)) {
        if (s === 0 || s === 1 || s === 7) touchedRockFront = true;
        continue;
      }
      const h = hueSignature(t.rgb);
      if (h.mag < 0.15) continue;
      const p = matchOrCreatePrototype(h.chroma, t.rgb, true);
      if (!p) continue;
      p.touchCount++;
      const el = state.elig[p.id];
      el.near = 1.0;

      painAngle = s <= 4 ? (s / 8) * Math.PI * 2 : ((s - 8) / 8) * Math.PI * 2;
      if (lr > 1e-6 && t.pressure > 0.30 && body.dEnergy <= 0.005 && body.energy < 0.97) {
        p.solidVal = clamp(p.solidVal + clamp(lr * 0.94, 0, 0.55), 0, 1);
      }

      if (t.impulse > 0.82 && body.dIntegrity >= -0.02) {
        el.strike = 1.0;
        touchedStrikeIds.push(p.id);
      } else {
        el.gentle = 1.0;
        touchedGentleIds.push(p.id);
      }
    }

    // --- 6. GENERAL OUTCOME PREDICTOR UPDATE ---
    const dE = body.dEnergy;
    const dI = body.dIntegrity;
    const dS = body.dStress;
    const acutePain = dI < -0.025;
    const gainedFood = dE > 0.04;
    const canLearn = lr > 1e-6;

    if (acutePain) {
      state.arousal = clamp(state.arousal + 0.45, 0, 1);
      state.flinchTicks = 13;
      state.flinchDir = painAngle >= 0 ? -1 : 1;
    } else if (body.stress > 0.25) {
      state.arousal = clamp(state.arousal + 0.015, 0, 1);
    } else {
      state.arousal = clamp(state.arousal * 0.992 + state.surprise * 0.01, 0.05, 1);
    }

    // 6a. Direct touch outcome updates (GENTLE & STRIKE) — strictly gated by `canLearn` so lr=0 freezes learning!
    if (canLearn) {
      for (const pid of touchedGentleIds) {
        const p = state.prototypes.find((x) => x.id === pid);
        if (!p) continue;
        const pr = p.pred[S_GENTLE];
        const satCapped = body.energy > 0.95 && dE > 0.002;
        const obsE = satCapped ? Math.max(pr.dE, 0.45) : clamp(dE * 3.8, -0.5, 2.0);
        const obsI = clamp(dI * 6.5, -1.6, 0.8);
        const obsS = clamp(dS * 4.0, -1.0, 1.0);
        const prevE = pr.dE, prevI = pr.dI;
        pr.trials++;
        const a = pr.trials === 1 ? clamp(lr * 1.65, 0, 0.88) : clamp(lr / Math.sqrt(Math.min(pr.trials, 6)), 0, 0.72);
        if (!satCapped || obsE > pr.dE) {
          pr.dE = pr.dE * (1 - a) + obsE * a;
        }
        // Biological pain-memory asymmetry with safe reversal override:
        // acute pain imprints rapidly and refreshes lastPainTick;
        // neutral brushes extinguish slowly (preserves fear of a bully);
        // BUT eating genuine food with zero pain immediately overturns stale fear (allows chemistry reversal recovery!).
        if (obsI < -0.15) {
          p.lastPainTick = state.tick;
          const aPain = clamp(lr * 1.15, 0, 0.85);
          pr.dI = pr.dI * (1 - aPain) + obsI * aPain;
        } else if (gainedFood && dI >= -0.01 && pr.dI < -0.05) {
          pr.dI = Math.max(0, pr.dI * 0.15);
          p.pred[S_STRIKE].dI = Math.max(0, p.pred[S_STRIKE].dI * 0.15);
          logEvent(`rev-${p.id}`, 'Ten kolor przestał parzyć — teraz daje energię!', p.displayRgb);
        } else {
          const aI = pr.dI < -0.15 ? clamp(lr * 0.032, 0, 0.025) : a;
          pr.dI = pr.dI * (1 - aI) + obsI * aI;
        }
        pr.dS = pr.dS * (1 - a) + obsS * a;
        if (prevE < 0.28 && pr.dE >= 0.28) logEvent(`gE-${p.id}`, 'Delikatny dotyk tego koloru daje energię!', p.displayRgb);
        if (prevI > -0.30 && pr.dI <= -0.30) logEvent(`gI-${p.id}`, 'Kontakt z tym obiektem boli — zaczynam go omijać.', p.displayRgb);
      }

      for (const pid of touchedStrikeIds) {
        const p = state.prototypes.find((x) => x.id === pid);
        if (!p) continue;
        const pr = p.pred[S_STRIKE];
        pr.trials++;
        const obsI = clamp(dI * 6.0, -1.6, 0.5);
        if (obsI < -0.15) p.lastPainTick = state.tick;
        const a = clamp(lr * 0.46, 0, 0.46);
        pr.dI = pr.dI * (1 - a) + obsI * a;
        if (pr.dE > 0.05 && !gainedFood) pr.dE *= 1 - clamp(lr * 0.125, 0, 0.12);
      }

      // Gentle time-based fear softening after prolonged pain-free sightings (> 420 ticks)
      // prevents permanent paralysis when environment chemistry reverses mid-run!
      for (const p of state.prototypes) {
        const el = state.elig[p.id];
        if (!el || el.view < 0.15) continue;
        const sincePain = state.tick - (p.lastPainTick ?? -9999);
        if (sincePain > 420 && body.energy < 0.85) {
          const decay = 1 - clamp(lr * 0.009, 0, 0.008);
          if (p.pred[S_GENTLE].dI < -0.04) p.pred[S_GENTLE].dI *= decay;
          if (p.pred[S_STRIKE].dI < -0.04) p.pred[S_STRIKE].dI *= decay;
        }
      }
    }

    // 6b. Delayed causal outcome updates (cracking a geode -> STRIKE credit; companion/Player -> NEAR credit!)
    if (canLearn && gainedFood) {
      // Credit PlaceGraph for rich energy location!
      upsertPlace(clamp(dE * 3.0, 0.3, 1.5), 0.1, -0.1, sceneSig);

      for (const p of state.prototypes) {
        const el = state.elig[p.id];
        if (!el) continue;
        if (touchedGentleIds.includes(p.id)) continue;

        // Delayed STRIKE credit (if we recently struck a solid non-painful object and energy appeared!)
        if (el.strike > 0.18 && p.pred[S_GENTLE].dI > -0.15) {
          const pr = p.pred[S_STRIKE];
          const prev = pr.dE;
          pr.dE = clamp(pr.dE + lr * 0.65 * el.strike * (1.25 - pr.dE), -0.5, 1.4);
          pr.trials = Math.max(pr.trials, 1);
          if (prev < 0.30 && pr.dE >= 0.30) {
            logEvent(`sE-${p.id}`, 'Mocne uderzenie w ten materiał uwalnia energię!', p.displayRgb);
          }
        }

        // Delayed NEAR credit when standing near an object/entity that repeatedly accompanies food appearance
        if (el.near > 0.22 && p.pred[S_GENTLE].dE < 0.2 && p.pred[S_GENTLE].dI > -0.15) {
          const pr = p.pred[S_NEAR];
          const prev = pr.dE;
          pr.dE = clamp(pr.dE + lr * 0.48 * el.near * (0.95 - pr.dE), -0.5, 0.95);
          pr.trials++;
          if (prev < 0.22 && pr.dE >= 0.22) {
            logEvent(`nE-${p.id}`, 'Przy tym obiekcie/istocie pojawia się jedzenie — ufam mu.', p.displayRgb);
          }
        }
      }
    } else if (canLearn) {
      // Honest Rescorla-Wagner prediction error for STAY_NEAR:
      // standing close to a prototype that does NOT produce food gradually extinguishes false superstition!
      for (const p of state.prototypes) {
        const el = state.elig[p.id];
        if (!el || el.near < 0.35) continue;
        if (p.pred[S_NEAR].dE > 0.01) {
          p.pred[S_NEAR].dE *= 0.9972;
        }
      }
    }

    // 6c. Relief / Safety credit for STAY_NEAR & PlaceGraph (when stress drops or integrity heals!)
    if (canLearn && (body.stress > 0.10 || body.integrity < 0.90) && dS < -0.001 && dI > 0.0005) {
      upsertPlace(0, 0.55, -0.65, sceneSig);
      for (const p of state.prototypes) {
        const el = state.elig[p.id];
        if (!el || el.near < 0.25) continue;
        if (p.solidVal > 0.12 && p.pred[S_GENTLE].dI > -0.15 && p.pred[S_GENTLE].dE < 0.2) {
          const pr = p.pred[S_NEAR];
          const prev = pr.dS;
          pr.dS = clamp(pr.dS - lr * 0.08 * el.near, -1.2, 0.5);
          pr.dI = clamp(pr.dI + lr * 0.05 * el.near, -0.5, 0.8);
          pr.trials += 0.15;
          if (prev > -0.25 && pr.dS <= -0.25) {
            logEvent(`nS-${p.id}`, 'Przebywanie przy tym obiekcie daje ulgę i bezpieczeństwo.', p.displayRgb);
          }
        }
      }
    } else if (canLearn && body.stress < 0.04 && dI > 0.0012 && state.tick % 90 === 0) {
      // Quietly remember peaceful healing ground (pure safety anchor, NOT a food anchor!)
      upsertPlace(0.0, 0.50, -0.60, sceneSig);
    } else if (canLearn && body.stress > 0.28 && dI < -0.0005 && state.tick % 30 === 0) {
      // Remember stressful danger pocket so we can route away if hurt
      upsertPlace(0, -0.55, 0.70, sceneSig);
    }

    state.prevStress = body.stress;

    // Gentle place memory decay
    for (let i = state.places.length - 1; i >= 0; i--) {
      state.places[i].strength *= 0.9997;
      if (state.places[i].strength < 0.08) state.places.splice(i, 1);
    }

    // --- 7. UNIFIED ACTIVE-INFERENCE STEERING OVER ALL 36 RAYS ---
    const energyNeed = clamp(1.08 - body.energy, 0.08, 1.0);
    const dmgNeed = clamp(1.0 - body.integrity, 0.0, 1.0);
    const wE = 0.65 + energyNeed * 3.0;
    const wHeal = dmgNeed * 4.8 + body.stress * 1.4; // 0 when fully healthy & calm!
    const wPain = 0.90 + dmgNeed * 4.0 + body.stress * 2.4; // ALWAYS avoids burning/harm!
    const wS = clamp(body.stress * 3.8 + dmgNeed * 1.8, 0.0, 4.2); // 0 when stress=0 & healthy!
    const wC = cfg.curiosityGain * (0.40 + 0.65 * body.energy) * (1 + state.surprise * 0.40);

    let steerL = 0, steerR = 0;
    let avoidL = 0, avoidR = 0;
    let bestRayIdx = -1;
    let bestRayUtil = 0.06;
    let bestRayStyle = S_AVOID;
    let bestRayProto = null;

    for (let i = 0; i < N; i++) {
      const p = rayProtos[i];
      const w = rayWeights[i];
      const bAng = rayBodyAng[i];
      const normA = clamp(bAng / (Math.PI * 0.75), -1, 1);
      const centerW = 1 - Math.abs(normA) * 0.38;

      if (!p) {
        if (w < 0) {
          if (bAng < 0) steerR += 0.28 * centerW;
          else steerL += 0.28 * centerW;
        }
        continue;
      }

      const { style, utility } = bestStyleFor(p, wE, wHeal, wPain, wS, wC);
      const weightedU = utility * (0.42 + 0.88 * w);

      if (style === S_AVOID) {
        const painMag = Math.max(0.35, -Math.min(p.pred[S_GENTLE].dI, p.pred[S_STRIKE].dI) * 3.2);
        const rep = painMag * (0.45 + 1.15 * w);
        if (bAng < 0) avoidR += rep * (0.45 + Math.abs(normA));
        else avoidL += rep * (0.45 + Math.abs(normA));
      } else {
        // For STAY_NEAR: attract from afar, gently hold polite distance when very close (`w > 0.78`)!
        let dirSign = 1;
        if (style === S_NEAR && w > 0.78) dirSign = -0.35;
        // Superlinear sharpening so a single high-value learned target isn't drowned out by wide low-value background objects
        const sharpU = weightedU > 0 ? Math.pow(weightedU, 1.35) : weightedU;
        const pull = sharpU * dirSign;
        if (pull >= 0) {
          if (bAng < 0) steerL += pull * (0.35 + Math.abs(normA));
          else steerR += pull * (0.35 + Math.abs(normA));
        } else {
          if (bAng < 0) steerR += -pull * 0.5;
          else steerL += -pull * 0.5;
        }
        if (weightedU > bestRayUtil) {
          bestRayUtil = weightedU;
          bestRayIdx = i;
          bestRayStyle = style;
          bestRayProto = p;
        }
      }
    }

    const avoidTurn = clamp((2.2 * (avoidR - avoidL)) / (avoidL + avoidR + 0.30), -1, 1);

    let touchSteer = 0;
    for (let s = 0; s < obs.touch.length; s++) {
      if (obs.touch[s].pressure < 0.28) continue;
      if (s === 1 || s === 2) touchSteer -= 0.62;
      if (s === 6 || s === 7) touchSteer += 0.62;
    }

    // --- 8. Independent Gaze Orienting ---
    let gazeTurn = 0;
    if (maxMotionRay >= 0) {
      gazeTurn = clamp((clamp(rayBodyAng[maxMotionRay], -1, 1) - body.gazeOffset) * 2.5, -1, 1);
    } else if (bestRayIdx >= 0) {
      gazeTurn = clamp((clamp(rayBodyAng[bestRayIdx], -1, 1) - body.gazeOffset) * 2.0, -1, 1);
    } else {
      state.gazeScanPhase += 0.042;
      const desired = Math.sin(state.gazeScanPhase) * 0.74;
      gazeTurn = clamp((desired - body.gazeOffset) * 1.4, -0.7, 0.7);
    }

    // --- 9. Motor Action Execution from Chosen Style or PlaceGraph ---
    let thrust = 0.72;
    let turn = 0;
    let ramIntent = false;
    const grip = false;

    const needsRelief = body.stress > 0.22 || body.integrity < 0.72;
    const wellRestedSafe =
      body.energy > 0.95 &&
      body.integrity > 0.96 &&
      body.stress < 0.04 &&
      state.arousal < 0.22 &&
      cfg.calmnessBias > 0.1;

    if (state.flinchTicks > 0) {
      state.flinchTicks--;
      state.activeStyle = 'odskok';
      thrust = -0.45;
      turn = state.flinchDir * 0.9;
    } else if (needsRelief && bestRayIdx >= 0 && bestRayStyle === S_NEAR && rayWeights[bestRayIdx] > 0.58 && body.dStress <= 0) {
      // Calmly resting in a learned safe pocket!
      state.activeStyle = 'w bezpiecznym miejscu';
      thrust = clamp(-body.vxBody * 0.45, -0.18, 0.15);
      turn = clamp(avoidTurn * 0.5, -0.3, 0.3);
    } else if (bestRayIdx >= 0 && (!wellRestedSafe || bestRayUtil > 0.42)) {
      const targetAng = rayBodyAng[bestRayIdx];
      const totL = steerL + avoidL;
      const totR = steerR + avoidR;
      const crowdTurn = (2.5 * (totR - totL)) / (totL + totR + 0.22);
      const focusTurn = clamp(targetAng * 1.75, -1, 1);
      // Blend focused approach toward the highest-utility ray with obstacle/pain avoidance
      turn = clamp(
        (avoidL + avoidR > 0.4 ? crowdTurn * 0.75 + avoidTurn * 0.65 : focusTurn * 0.65 + crowdTurn * 0.35) +
          touchSteer * 0.4,
        -1,
        1
      );
      state.activeTargetProtoId = bestRayProto ? bestRayProto.id : -1;

      if (bestRayStyle === S_STRIKE && avoidL + avoidR < 0.35) {
        state.activeStyle = 'uderz (wyuczone)';
        thrust = Math.abs(targetAng) < 0.65 ? 1.0 : 0.62;
        ramIntent = Math.abs(targetAng) < 0.42;
      } else if (bestRayStyle === S_NEAR) {
        state.activeStyle = 'blisko (wyuczone)';
        thrust = rayWeights[bestRayIdx] > 0.72 ? 0.14 : 0.70;
      } else {
        const isNovel = bestRayProto && bestRayProto.pred[S_GENTLE].trials === 0;
        state.activeStyle = isNovel ? 'bada delikatnie' : 'podchodzi delikatnie';
        thrust = isNovel ? 0.56 : 0.88;
      }
    } else if (wellRestedSafe && maxMotionRay < 0) {
      state.activeStyle = 'odpoczywa';
      thrust = 0.06;
      turn = clamp(avoidTurn * 0.6, -0.35, 0.35);
    } else {
      // Consult Visual-Odometric PlaceGraph ONLY for currently needed homeostatic deficits!
      // (Healthy agents never get leashed back to Sanctuary — they keep exploring Twilight & Wilds!)
      let bestPlace = null;
      let bestPlaceScore = 0.18;
      for (const pl of state.places) {
        const d = Math.hypot(pl.estX - state.estX, pl.estY - state.estY);
        if (d < 85 || d > 1100) continue;
        let pVal = 0;
        if (needsRelief) {
          pVal = Math.max(0, pl.dI) * 2.5 + Math.max(0, -pl.dS) * 2.0;
        } else if (body.energy < 0.82 && pl.dE > 0.25) {
          pVal = wE * pl.dE;
        }
        const sc = (pVal * pl.strength) / (1 + d * 0.0022);
        if (sc > bestPlaceScore) {
          bestPlaceScore = sc;
          bestPlace = pl;
        }
      }
      if (bestPlace) {
        state.activeStyle = needsRelief ? 'wraca do bezpiecznej strefy' : 'wraca na bogate łowisko';
        const wAng = Math.atan2(bestPlace.estY - state.estY, bestPlace.estX - state.estX);
        const rel = wrapAngle(wAng - state.estHeading);
        if (state.wallFollowTicks > 0) {
          state.wallFollowTicks--;
          turn = clamp(state.wallFollowDir * 0.55 + avoidTurn, -1, 1);
          thrust = 0.78;
        } else {
          turn = clamp(rel * 1.65 + avoidTurn + touchSteer * 0.4, -1, 1);
          thrust = Math.abs(rel) < 1.15 ? 0.84 : 0.36;
        }
      } else {
        state.activeStyle = 'spokojny zwiad';
        state.wanderBias = clamp(state.wanderBias * 0.96 + (rng.next() * 2 - 1) * 0.20, -0.55, 0.55);
        turn = clamp(state.wanderBias + avoidTurn + touchSteer, -1, 1);
        thrust = 0.76;
      }
    }

    // Body physiology: smooth rock-wall sliding & stuck recovery
    if (touchedRockFront) {
      state.wallFollowTicks = 24;
      state.wallFollowDir = rockL >= rockR ? 1 : -1;
      turn = state.wallFollowDir * 0.90;
      thrust = 0.24;
    }
    if (ownSpeed < 0.15 && state.activeStyle !== 'odpoczywa' && state.activeStyle !== 'w bezpiecznym miejscu' && maxTouchP > 0.3) {
      state.stuckTicks++;
      if (state.stuckTicks > 18) {
        turn = state.wallFollowDir * 1.0;
        thrust = -0.35;
        if (state.stuckTicks > 34) {
          state.stuckTicks = 0;
          state.wallFollowDir = -state.wallFollowDir;
        }
      }
    } else {
      state.stuckTicks = Math.max(0, state.stuckTicks - 1);
    }

    return {
      thrust: clamp(thrust, -0.5, 1.0),
      turn: clamp(turn, -1.0, 1.0),
      gazeTurn: clamp(gazeTurn, -1.0, 1.0),
      grip,
      ramIntent,
    };
  }

  function snapshotMemory() {
    return JSON.parse(JSON.stringify({ state, rngState: rng.getState() }));
  }

  function restoreMemory(snap) {
    const c = JSON.parse(JSON.stringify(snap));
    state = c.state;
    if (c.rngState !== undefined) rng.setState(c.rngState);
  }

  function resetMemory() {
    state = makeFreshState();
  }

  function getMindState() {
    return {
      mode: state.activeStyle,
      arousal: state.arousal,
      surprise: state.surprise,
      loopClosures: state.loopClosures,
      estPos: { x: state.estX, y: state.estY, heading: state.estHeading },
      places: state.places.map((p) => ({
        estX: p.estX,
        estY: p.estY,
        dE: p.dE,
        dI: p.dI,
        dS: p.dS,
        strength: p.strength,
      })),
      biography: state.biography.slice(0, 12),
      prototypes: state.prototypes.map((p) => ({
        id: p.id,
        rgb: [...p.displayRgb],
        touchCount: p.touchCount,
        solidVal: p.solidVal,
        movingScore: p.movingScore,
        pred: p.pred.map((r) => ({ ...r })),
      })),
    };
  }

  function setHyperparams(hp = {}) {
    if (hp.learningRate !== undefined) cfg.learningRate = hp.learningRate;
    if (hp.curiosityGain !== undefined) cfg.curiosityGain = hp.curiosityGain;
    if (hp.calmnessBias !== undefined) cfg.calmnessBias = hp.calmnessBias;
  }

  return {
    name: 'predictorMindV3',
    act,
    snapshotMemory,
    restoreMemory,
    resetMemory,
    getMindState,
    setHyperparams,
  };
}
