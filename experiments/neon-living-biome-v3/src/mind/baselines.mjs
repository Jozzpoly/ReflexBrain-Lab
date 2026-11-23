// src/mind/baselines.mjs — Fair stateless baselines sharing the EXACT SAME continuous body & 36-ray RGB retina.
import { clamp, createRng } from '../world/biome.mjs';
import { hueSignature, chromaDist, isRockRay } from './predictor-mind.mjs';

function dot3(a, b) {
  return a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
}

export function createRandomController(seed = 1) {
  const rng = createRng((seed * 31337 + 13) >>> 0);
  let bias = 0;
  return {
    name: 'randomWalk',
    act(obs) {
      bias = clamp(bias * 0.94 + (rng.next() * 2 - 1) * 0.30, -1, 1);
      let turn = bias;
      let thrust = 0.62;
      const t = obs.touch;
      if (t[0].pressure > 0.3 || t[1].pressure > 0.3 || t[7].pressure > 0.3) {
        turn = 0.95;
        thrust = 0.2;
        bias = 0.8;
      }
      return { thrust, turn, gazeTurn: 0, grip: false, ramIntent: false };
    },
    snapshotMemory: () => ({ bias, rng: rng.getState() }),
    restoreMemory: (s) => { bias = s.bias; rng.setState(s.rng); },
    resetMemory: () => { bias = 0; },
    getMindState: () => ({ mode: 'losowy', arousal: 0, surprise: 0, loopClosures: 0, prototypes: [], places: [], biography: [] }),
  };
}

export function createBlindBraitenbergController(seed = 1) {
  const rng = createRng((seed * 48271 + 9) >>> 0);
  let scan = rng.next() < 0.5 ? -0.32 : 0.32;
  return {
    name: 'blindBraitenberg',
    act(obs) {
      const r = obs.retina;
      const N = r.length;
      let L = 0, R = 0, repL = 0, repR = 0;
      for (let i = 0; i < N; i++) {
        const [cr, cg, cb] = r[i];
        const chase = Math.max(0, cg - 0.28 - cr * 0.32); // hardcoded green assumption
        const avoid = Math.max(0, cr - cg - 0.25);        // hardcoded red avoidance
        if (i < N / 2) { L += chase; repL += avoid; } else { R += chase; repR += avoid; }
      }
      let turn = scan;
      if (L + R > 0.08) turn = clamp((2.4 * (R - L)) / (L + R + 1e-6), -1, 1);
      turn += clamp(2.2 * (repL - repR), -1, 1);
      if (obs.touch[0].pressure > 0.35 || obs.touch[1].pressure > 0.35 || obs.touch[7].pressure > 0.35) turn = 0.95;
      return { thrust: 0.78, turn: clamp(turn, -1, 1), gazeTurn: 0, grip: false, ramIntent: false };
    },
    snapshotMemory: () => ({ scan }),
    restoreMemory: (s) => { scan = s.scan; },
    resetMemory: () => {},
    getMindState: () => ({ mode: 'braitenberg (stałe RGB)', arousal: 0, surprise: 0, loopClosures: 0, prototypes: [], places: [], biography: [] }),
  };
}

// ILLEGAL upper-bound reference: handed true seed chemistry, zero memory/place learning
export function createOracleReflexController(worldChemistry, seed = 1) {
  const rng = createRng((seed * 65537 + 5) >>> 0);
  let wander = 0.25;
  const berryCh = hueSignature(worldChemistry.sanctuaryBerry.rgb).chroma;
  const coreCh = hueSignature(worldChemistry.wildCore.rgb).chroma;
  const geodeCh = hueSignature(worldChemistry.geode.rgb).chroma;
  const hazCh = hueSignature(worldChemistry.emberMineral.rgb).chroma;
  const bldCh = hueSignature(worldChemistry.boulder.rgb).chroma;

  return {
    name: 'oracleReflex',
    act(obs) {
      const r = obs.retina;
      const N = r.length;
      const stressed = obs.body.stress > 0.22 || obs.body.integrity < 0.70;
      let L = 0, R = 0;
      let ram = false;
      for (let i = 0; i < N; i++) {
        const h = hueSignature(r[i]);
        if (h.mag < 0.18 || isRockRay(r[i])) continue;
        const frac = (i / (N - 1)) * 2 - 1;
        let v = 0;
        if (chromaDist(h.chroma, hazCh) < 0.26) v -= 3.5;
        else if (stressed && chromaDist(h.chroma, bldCh) < 0.26) v += 2.2;
        else if (chromaDist(h.chroma, coreCh) < 0.26) v += 3.2;
        else if (chromaDist(h.chroma, berryCh) < 0.26) v += 2.2;
        else if (chromaDist(h.chroma, geodeCh) < 0.26) { v += 1.4; if (Math.abs(frac) < 0.25) ram = true; }
        const m = v * h.mag;
        if (m >= 0) { if (frac < 0) L += m; else R += m; }
        else { if (frac < 0) R += -m; else L += -m; }
      }
      let turn = 0;
      if (L + R > 0.08) turn = clamp((2.5 * (R - L)) / (L + R + 1e-6), -1, 1);
      else { wander = clamp(wander * 0.94 + (rng.next() * 2 - 1) * 0.30, -0.75, 0.75); turn = wander; }
      if (obs.touch[0].pressure > 0.35 && isRockRay(obs.touch[0].rgb)) turn = 0.95;
      return { thrust: ram ? 1.0 : 0.76, turn, gazeTurn: 0, grip: false, ramIntent: ram };
    },
    snapshotMemory: () => ({ wander }),
    restoreMemory: (s) => { wander = s.wander; },
    resetMemory: () => {},
    getMindState: () => ({ mode: 'wyrocznia (nielegalna)', arousal: 0, surprise: 0, loopClosures: 0, prototypes: [], places: [], biography: [] }),
  };
}
