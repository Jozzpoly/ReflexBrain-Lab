// src/world/biome.mjs — ReflexBrain v3: Spacious Zoned Living Biome (3200x2200)
// Pure Node ESM, zero external dependencies, 100% deterministic Mulberry32 PRNG.
//
// Core leaps for Campaign v3:
// 1. SPATIAL RISK -> REWARD GRADIENT (Sanctuary -> Twilight Gardens -> Wild Deep):
//    Zero exhausting global catastrophe! Sanctuary is always calm & healing; venturing deeper
//    brings richer Living Cores, geodes, and local anomalies/currents that can be shielded by boulders.
// 2. UNIVERSAL PAINTABLE MATTER (PROJECT-ANVIL inspired):
//    Every world object is an instance of physical `props` (mass, movable, edible, energyGain,
//    burnDamage, breakable, shelterStrength, rgb). Owner can paint custom matter live!
// 3. GENTLE CONTACT NEVER HURTS:
//    Rubbing, crowding, and friendly nudges cause 0.00 damage. Impact pain occurs ONLY from
//    intentional high-momentum dashing/ramming or genuine environmental hazards.
// 4. EQUAL PLAYER BODY + ERGONOMIC `E` TOGGLE CARRY TOWARD CURSOR:
//    Player shares energy/integrity/stamina/stress with residents (plus optional godMode toggle),
//    picks up & drops objects with a single `E` toggle, holds them smoothly toward the cursor,
//    and can toss held objects with Space!
// 5. STRICTLY PRIVATE SENSES (`obs`):
//    Zero x/y/theta/zone/archetype leaks. 36-ray RGB retina (along theta + gazeOffset),
//    8 directional touch sectors, body-frame proprioception, feltForce, and homeostasis.

import {
  DEFAULT_CONFIG,
  MATTER_PALETTE,
  CORE_ARCHETYPES,
  ZONE_SKY_SANCTUARY,
  ZONE_SKY_TWILIGHT,
  ZONE_SKY_WILDS,
  COLOR_ROCK,
  BODY_MORPHS,
  createMaterialProps,
} from './config.mjs';

export function clamp(v, lo, hi) {
  return v < lo ? lo : v > hi ? hi : v;
}

export function wrapAngle(a) {
  while (a > Math.PI) a -= 2 * Math.PI;
  while (a < -Math.PI) a += 2 * Math.PI;
  return a;
}

export function createRng(seed) {
  let state = (seed >>> 0) || 1;
  return {
    next() {
      state = (state + 0x6d2b79f5) >>> 0;
      let t = Math.imul(state ^ (state >>> 15), 1 | state);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    },
    getState() {
      return state;
    },
    setState(s) {
      state = (s >>> 0) || 1;
    },
  };
}

function lerpRgb(a, b, t) {
  const k = clamp(t, 0, 1);
  return [a[0] + (b[0] - a[0]) * k, a[1] + (b[1] - a[1]) * k, a[2] + (b[2] - a[2]) * k];
}

function closestPointOnSegment(px, py, ax, ay, bx, by) {
  const abx = bx - ax;
  const aby = by - ay;
  const lenSq = abx * abx + aby * aby;
  if (lenSq < 1e-8) return { x: ax, y: ay, t: 0 };
  const t = clamp(((px - ax) * abx + (py - ay) * aby) / lenSq, 0, 1);
  return { x: ax + abx * t, y: ay + aby * t, t };
}

function rayCircleHit(ox, oy, dx, dy, cx, cy, r, maxT) {
  const fx = ox - cx;
  const fy = oy - cy;
  const b = fx * dx + fy * dy;
  if (b > r) return Infinity;
  const c = fx * fx + fy * fy - r * r;
  if (c <= 0) return 0.001;
  const disc = b * b - c;
  if (disc < 0) return Infinity;
  const t = -b - Math.sqrt(disc);
  return t > 0 && t < maxT ? t : Infinity;
}

function rayCapsuleHit(ox, oy, dx, dy, ax, ay, bx, by, r, maxT) {
  let best = Math.min(
    rayCircleHit(ox, oy, dx, dy, ax, ay, r, maxT),
    rayCircleHit(ox, oy, dx, dy, bx, by, r, maxT)
  );
  const ux = bx - ax;
  const uy = by - ay;
  const segLen = Math.hypot(ux, uy);
  if (segLen < 1e-5) return best;
  const nx = -uy / segLen;
  const ny = ux / segLen;
  for (const sign of [-1, 1]) {
    const p1x = ax + nx * r * sign;
    const p1y = ay + ny * r * sign;
    const denom = dx * uy - dy * ux;
    if (Math.abs(denom) < 1e-7) continue;
    const qpx = p1x - ox;
    const qpy = p1y - oy;
    const t = (qpx * uy - qpy * ux) / denom;
    const s = (qpx * dy - qpy * dx) / denom;
    if (t > 0 && t < best && s >= 0 && s <= 1) best = t;
  }
  return best;
}

function rayWallHit(ox, oy, dx, dy, W, H, maxT) {
  let tMin = maxT;
  if (dx > 1e-6) {
    const t = (W - ox) / dx;
    if (t > 0 && t < tMin) tMin = t;
  } else if (dx < -1e-6) {
    const t = -ox / dx;
    if (t > 0 && t < tMin) tMin = t;
  }
  if (dy > 1e-6) {
    const t = (H - oy) / dy;
    if (t > 0 && t < tMin) tMin = t;
  } else if (dy < -1e-6) {
    const t = -oy / dy;
    if (t > 0 && t < tMin) tMin = t;
  }
  return tMin;
}

function makeSpine(x, y, theta, radius, nodes = 5) {
  const out = [];
  const step = radius * 0.65;
  for (let i = 0; i < nodes; i++) {
    out.push({ x: x - Math.cos(theta) * i * step, y: y - Math.sin(theta) * i * step });
  }
  return out;
}

function updateSpine(spine, x, y, spacing) {
  if (!spine || spine.length === 0) return;
  spine[0].x = x;
  spine[0].y = y;
  for (let i = 1; i < spine.length; i++) {
    const prev = spine[i - 1];
    const cur = spine[i];
    const dx = cur.x - prev.x;
    const dy = cur.y - prev.y;
    const d = Math.hypot(dx, dy) || 1e-6;
    cur.x = prev.x + (dx / d) * spacing;
    cur.y = prev.y + (dy / d) * spacing;
  }
}

export class LivingBiomeV3 {
  constructor(options = {}) {
    this.seed = options.seed ?? 1;
    this.freezeBlocks = Boolean(options.freezeBlocks);
    this.fixedPalette = options.fixedPalette ?? null;
    this.cfg = { ...DEFAULT_CONFIG, ...(options.config || {}) };
    this.rng = createRng(this.seed);
    this.tick = 0;
    this.nextId = 1;
    this.onBirth = options.onBirth || null;

    this.agentSpecs = options.agents || [
      { id: 'Taran-1', morph: 'ram' },
      { id: 'Taran-2', morph: 'ram' },
      { id: 'Taran-3', morph: 'ram' },
      { id: 'Zwiad-1', morph: 'scout' },
      { id: 'Zwiad-2', morph: 'scout' },
      { id: 'Zwiad-3', morph: 'scout' },
      { id: 'Zwiad-4', morph: 'scout' },
    ];
    this.enablePlayer = Boolean(options.enablePlayer);
    this.playerGodMode = Boolean(options.playerGodMode);

    this.chemistry = {}; // archetype -> { paletteIdx, name, rgb }
    this.rockFormations = [];
    this.anomalies = []; // local pulsing currents/hazards in Wild Deep ONLY
    this.objects = [];   // unified paintable matter pool!
    this.agents = [];
    this.player = null;
    this.recentEvents = []; // visual FX (bursts, gentle greetings, births) — never in obs!

    this._initWorld();
  }

  _randRange(lo, hi) {
    return lo + (hi - lo) * this.rng.next();
  }

  _shuffleChemistry(forcedOrder = null) {
    const idx = forcedOrder ? [...forcedOrder] : [0, 1, 2, 3, 4];
    if (!forcedOrder) {
      for (let i = idx.length - 1; i > 0; i--) {
        const j = Math.floor(this.rng.next() * (i + 1));
        [idx[i], idx[j]] = [idx[j], idx[i]];
      }
    }
    this.chemistry = {};
    for (let i = 0; i < CORE_ARCHETYPES.length; i++) {
      const p = MATTER_PALETTE[idx[i]];
      this.chemistry[CORE_ARCHETYPES[i]] = {
        paletteIdx: idx[i],
        name: p.name,
        rgb: [...p.rgb],
      };
    }
  }

  randomizeChemistry(extraSeed = null) {
    const prev = CORE_ARCHETYPES.map((a) => this.chemistry[a].paletteIdx).join(',');
    if (extraSeed !== null) {
      const r = createRng(extraSeed);
      const ord = [0, 1, 2, 3, 4];
      for (let i = ord.length - 1; i > 0; i--) {
        const j = Math.floor(r.next() * (i + 1));
        [ord[i], ord[j]] = [ord[j], ord[i]];
      }
      this._shuffleChemistry(ord);
    } else {
      for (let tries = 0; tries < 12; tries++) {
        this._shuffleChemistry(null);
        const cur = CORE_ARCHETYPES.map((a) => this.chemistry[a].paletteIdx).join(',');
        if (cur !== prev) break;
      }
    }
    // Update existing core archetype objects to reflect new chemistry hues
    for (const obj of this.objects) {
      if (this.chemistry[obj.archetype]) {
        obj.rgb = [...this.chemistry[obj.archetype].rgb];
      }
    }
  }

  // Smooth continuous spatial risk gradient: 0.0 inside Sanctuary -> 0.5 Twilight -> 1.0 Wild Deep
  sampleZone(x, y) {
    const cx = this.cfg.width * 0.5;
    const cy = this.cfg.height * 0.5;
    // Slight elliptical aspect matching 3200x2200 biome so Sanctuary feels warm & expansive
    const dx = (x - cx) * 0.86;
    const dy = (y - cy) * 1.12;
    const dist = Math.hypot(dx, dy);
    const rS = this.cfg.sanctuaryRadius;
    const rT = this.cfg.twilightRadius;

    if (dist <= rS) {
      return {
        zone: 'sanctuary',
        wildness: 0,
        sanctuaryFactor: clamp(1 - (dist / Math.max(1, rS)) * 0.4, 0.6, 1),
        skyRgb: [...ZONE_SKY_SANCTUARY],
      };
    }
    if (dist <= rT) {
      const k = (dist - rS) / Math.max(1, rT - rS);
      return {
        zone: 'twilight',
        wildness: k * 0.5,
        sanctuaryFactor: clamp(0.6 * (1 - k), 0, 0.6),
        skyRgb: lerpRgb(ZONE_SKY_SANCTUARY, ZONE_SKY_TWILIGHT, k),
      };
    }
    const wk = clamp((dist - rT) / Math.max(1, rT * 0.65), 0, 1);
    return {
      zone: 'wilds',
      wildness: 0.5 + wk * 0.5,
      sanctuaryFactor: 0,
      skyRgb: lerpRgb(ZONE_SKY_TWILIGHT, ZONE_SKY_WILDS, wk),
    };
  }

  // Local physical anomaly current & shelter check (0 in Sanctuary! Strong only inside Wild anomalies!)
  sampleLocalForceAndShelter(x, y) {
    let fx = 0;
    let fy = 0;
    let anomalyIntensity = 0;

    // 1. Sum local anomaly currents (pulsing gently on individual phases — never global!)
    if (this.cfg.anomalyStrength > 0.001) {
      for (const an of this.anomalies) {
        const dx = x - an.x;
        const dy = y - an.y;
        const dist = Math.hypot(dx, dy);
        if (dist >= an.radius) continue;
        const falloff = 1 - dist / an.radius;
        const pulse = 0.55 + 0.45 * Math.sin(this.tick * an.freq + an.phase);
        const eff = falloff * falloff * pulse;
        // Swirl + outward draft inside anomaly pocket
        const inv = 1 / (dist || 1);
        const tx = -dy * inv * 0.65 + an.dirX * 0.75;
        const ty = dx * inv * 0.65 + an.dirY * 0.75;
        fx += tx * eff * this.cfg.anomalyStrength;
        fy += ty * eff * this.cfg.anomalyStrength;
        if (eff > anomalyIntensity) anomalyIntensity = eff;
      }
    }

    // 2. Check shelter from nearby boulders/shelter matter or rock walls!
    let shelter = 0;
    const fMag = Math.hypot(fx, fy);
    const wx = fMag > 1e-4 ? fx / fMag : 1;
    const wy = fMag > 1e-4 ? fy / fMag : 0;

    for (const obj of this.objects) {
      if (obj.shelterStrength <= 0.05) continue;
      const dx = x - obj.x;
      const dy = y - obj.y;
      const maxD = obj.radius * 4.4;
      if (dx * dx + dy * dy > maxD * maxD) continue;
      const dist = Math.hypot(dx, dy);
      // Proximity calm pocket + stronger downwind lee shadow when current flows
      const nearFactor = clamp(1 - (dist - obj.radius) / (obj.radius * 3.4), 0, 1);
      let dirBoost = 0.72;
      if (fMag > 0.02 && dist > 1) {
        const along = (dx * wx + dy * wy) / dist;
        dirBoost = along > 0.15 ? 1.0 : 0.48;
      }
      const sh = clamp(nearFactor * dirBoost * obj.shelterStrength, 0, 0.95);
      if (sh > shelter) shelter = sh;
    }

    // Rock formations also provide natural lee coves (with cheap bounding-circle reject)
    for (const rw of this.rockFormations) {
      const lim = (rw.boundR ?? 160) + 75;
      const rdx = x - (rw.cx ?? (rw.ax + rw.bx) * 0.5);
      const rdy = y - (rw.cy ?? (rw.ay + rw.by) * 0.5);
      if (rdx * rdx + rdy * rdy > lim * lim) continue;
      const cp = closestPointOnSegment(x, y, rw.ax, rw.ay, rw.bx, rw.by);
      const dist = Math.hypot(x - cp.x, y - cp.y);
      if (dist < rw.r + 75) {
        const near = clamp(1 - (dist - rw.r) / 75, 0, 1) * 0.78;
        if (near > shelter) shelter = near;
      }
    }

    const atten = 1 - shelter * 0.88;
    return {
      fx: fx * atten,
      fy: fy * atten,
      anomalyExposure: anomalyIntensity * (1 - shelter * 0.92),
      shelter,
    };
  }

  _hitsRock(x, y, r, pad = 12) {
    for (const rw of this.rockFormations) {
      const cp = closestPointOnSegment(x, y, rw.ax, rw.ay, rw.bx, rw.by);
      if (Math.hypot(x - cp.x, y - cp.y) < r + rw.r + pad) return true;
    }
    return false;
  }

  _isFree(x, y, r, pad = 16) {
    const { width: W, height: H } = this.cfg;
    if (x < r + pad || x > W - r - pad || y < r + pad || y > H - r - pad) return false;
    if (this._hitsRock(x, y, r, pad)) return false;
    for (const o of this.objects) {
      if (Math.hypot(x - o.x, y - o.y) < r + o.radius + pad) return false;
    }
    for (const a of this.agents) {
      if (Math.hypot(x - a.x, y - a.y) < r + a.r + pad) return false;
    }
    return true;
  }

  _findSpotInZone(targetZone, r, pad = 20, attempts = 80) {
    const { width: W, height: H } = this.cfg;
    const cx = W * 0.5;
    const cy = H * 0.5;
    for (let i = 0; i < attempts; i++) {
      let x, y;
      if (targetZone === 'sanctuary') {
        const ang = this._randRange(0, Math.PI * 2);
        const rad = Math.sqrt(this.rng.next()) * (this.cfg.sanctuaryRadius * 0.88);
        x = cx + Math.cos(ang) * (rad / 0.86);
        y = cy + Math.sin(ang) * (rad / 1.12);
      } else if (targetZone === 'twilight') {
        const ang = this._randRange(0, Math.PI * 2);
        const rad = this._randRange(this.cfg.sanctuaryRadius * 1.06, this.cfg.twilightRadius * 0.96);
        x = cx + Math.cos(ang) * (rad / 0.86);
        y = cy + Math.sin(ang) * (rad / 1.12);
      } else {
        x = this._randRange(r + 60, W - r - 60);
        y = this._randRange(r + 60, H - r - 60);
        if (this.sampleZone(x, y).zone !== 'wilds') continue;
      }
      if (this._isFree(x, y, r, pad)) return { x, y };
    }
    return {
      x: clamp(cx + this._randRange(-280, 280), r + 30, W - r - 30),
      y: clamp(cy + this._randRange(-220, 220), r + 30, H - r - 30),
    };
  }

  _emptyTouch() {
    const arr = new Array(this.cfg.touchSectors);
    for (let i = 0; i < arr.length; i++) {
      arr[i] = { pressure: 0, impulse: 0, rgb: [0, 0, 0] };
    }
    return arr;
  }

  spawnArchetype(archetype, x, y, extra = {}) {
    const chem = this.chemistry[archetype];
    const props = createMaterialProps(archetype, chem ? chem.rgb : [0.7, 0.7, 0.7]);
    const obj = {
      id: this.nextId++,
      x: clamp(x, props.radius + 8, this.cfg.width - props.radius - 8),
      y: clamp(y, props.radius + 8, this.cfg.height - props.radius - 8),
      x0: x,
      y0: y,
      vx: extra.vx || 0,
      vy: extra.vy || 0,
      shapeSeed: this.rng.next() * 1000,
      fromGeode: Boolean(extra.fromGeode),
      ...props,
      ...extra,
    };
    this.objects.push(obj);
    return obj;
  }

  // Paint arbitrary custom matter live (PROJECT-ANVIL inspired Matter Forge!)
  spawnCustomMatter(x, y, customProps) {
    const base = {
      archetype: 'custom',
      rgb: customProps.rgb ? [...customProps.rgb] : [0.92, 0.52, 0.78],
      radius: Math.max(5, Number(customProps.radius) || 15),
      mass: Math.max(0.2, Number(customProps.mass) || 1.5),
      movable: customProps.movable !== undefined ? Boolean(customProps.movable) : true,
      edible: Boolean(customProps.edible),
      energyGain: Number(customProps.energyGain) || 0,
      integrityGain: Number(customProps.integrityGain) || 0,
      burnDamage: Math.max(0, Number(customProps.burnDamage) || 0),
      burnKnockback: Number(customProps.burnDamage) > 0 ? 2.4 : 0,
      breakable: Boolean(customProps.breakable),
      hp: 1.0,
      breakImpulseMin: Math.max(0.4, Number(customProps.breakImpulseMin) || 1.1),
      burstCount: Boolean(customProps.breakable) ? 3 : 0,
      shelterStrength: clamp(Number(customProps.shelterStrength) || 0, 0, 0.95),
      valueTier: Number(customProps.energyGain) > 0.3 ? 3 : 1,
    };
    const obj = {
      id: this.nextId++,
      x: clamp(x, base.radius + 8, this.cfg.width - base.radius - 8),
      y: clamp(y, base.radius + 8, this.cfg.height - base.radius - 8),
      x0: x,
      y0: y,
      vx: 0,
      vy: 0,
      shapeSeed: this.rng.next() * 1000,
      fromGeode: false,
      ...base,
    };
    this.objects.push(obj);
    return obj;
  }

  _initWorld() {
    const { width: W, height: H } = this.cfg;
    const cx = W * 0.5;
    const cy = H * 0.5;
    this.tick = 0;
    this.nextId = 1;
    this._shuffleChemistry(this.fixedPalette);

    this.rockFormations = [];
    this.anomalies = [];
    this.objects = [];
    this.agents = [];
    this.recentEvents = [];

    // 1. Organic stone formations arranged along Twilight ring & Wild corridors
    //    (keeps Sanctuary open & inviting while creating genuine caves/passages outside!)
    for (let i = 0; i < this.cfg.numRockFormations; i++) {
      const ring = i < 8 ? 0 : 1;
      const baseAng = ((i % 8) / 8) * Math.PI * 2 + (ring ? 0.35 : 0) + this._randRange(-0.18, 0.18);
      const rad =
        ring === 0
          ? this._randRange(this.cfg.sanctuaryRadius * 1.15, this.cfg.twilightRadius * 0.86)
          : this._randRange(this.cfg.twilightRadius * 1.05, Math.min(W, H) * 0.62);
      const rx = clamp(cx + Math.cos(baseAng) * (rad / 0.86), 140, W - 140);
      const ry = clamp(cy + Math.sin(baseAng) * (rad / 1.12), 140, H - 140);
      const tang = baseAng + Math.PI * 0.5 + this._randRange(-0.55, 0.55);
      const halfLen = this._randRange(68, 128);
      const thickness = this._randRange(18, 28);
      const ax = clamp(rx - Math.cos(tang) * halfLen, 90, W - 90);
      const ay = clamp(ry - Math.sin(tang) * halfLen, 90, H - 90);
      const bx = clamp(rx + Math.cos(tang) * halfLen, 90, W - 90);
      const by = clamp(ry + Math.sin(tang) * halfLen, 90, H - 90);
      this.rockFormations.push({
        id: this.nextId++,
        ax,
        ay,
        bx,
        by,
        cx: (ax + bx) * 0.5,
        cy: (ay + by) * 0.5,
        boundR: Math.hypot(bx - ax, by - ay) * 0.5 + thickness,
        r: thickness,
        seed: this.rng.next() * 1000,
      });
    }

    // 2. Local anomalies strictly in the outer Wild Deep (high risk -> guards high-reward Wild Cores!)
    for (let i = 0; i < this.cfg.numLocalAnomalies; i++) {
      const ang = (i / Math.max(1, this.cfg.numLocalAnomalies)) * Math.PI * 2 + this._randRange(-0.25, 0.25);
      const rad = this._randRange(this.cfg.twilightRadius * 1.18, Math.min(W, H) * 0.64);
      const ax = clamp(cx + Math.cos(ang) * (rad / 0.86), 240, W - 240);
      const ay = clamp(cy + Math.sin(ang) * (rad / 1.12), 240, H - 240);
      const dirAng = this._randRange(-Math.PI, Math.PI);
      this.anomalies.push({
        id: this.nextId++,
        x: ax,
        y: ay,
        radius: this._randRange(210, 290),
        dirX: Math.cos(dirAng),
        dirY: Math.sin(dirAng),
        freq: this._randRange(0.008, 0.016),
        phase: this._randRange(0, Math.PI * 2),
      });
    }

    // 3. Boulders (shelter & building stones distributed across Twilight, Wilds & Sanctuary rim)
    for (let i = 0; i < this.cfg.numBoulders; i++) {
      const z = i < 4 ? 'sanctuary' : i < 12 ? 'twilight' : 'wilds';
      const pos = this._findSpotInZone(z, 34, 42);
      this.spawnArchetype('boulder', pos.x, pos.y);
    }

    // 4. Geodes (crumble shells: mostly Twilight & Wilds, 2 gentle ones near Sanctuary edge for play!)
    for (let i = 0; i < this.cfg.numGeodes; i++) {
      const z = i < 3 ? 'sanctuary' : i < 13 ? 'twilight' : 'wilds';
      const pos = this._findSpotInZone(z, 20, 30);
      this.spawnArchetype('geode', pos.x, pos.y);
    }

    // 5. Ember Minerals (burning hazards: STRICTLY OUTSIDE Sanctuary!)
    for (let i = 0; i < this.cfg.numHazards; i++) {
      const z = i < 4 ? 'twilight' : 'wilds';
      const pos = this._findSpotInZone(z, 16, 36);
      this.spawnArchetype('emberMineral', pos.x, pos.y);
    }

    // 6. Consumables: gentle Sanctuary Berries in Sanctuary/Twilight + high-reward Living Cores in Wilds!
    for (let i = 0; i < this.cfg.initialSanctuaryFood; i++) {
      const pos = this._findSpotInZone('sanctuary', 8, 18);
      this.spawnArchetype('sanctuaryBerry', pos.x, pos.y);
    }
    for (let i = 0; i < this.cfg.initialTwilightFood; i++) {
      const pos = this._findSpotInZone('twilight', 8, 18);
      this.spawnArchetype('sanctuaryBerry', pos.x, pos.y);
    }
    for (let i = 0; i < this.cfg.initialWildCores; i++) {
      // Spawn high-reward Living Cores near anomalies & outer Wild Deep!
      const an = this.anomalies[i % Math.max(1, this.anomalies.length)];
      let pos;
      if (an && this.rng.next() < 0.72) {
        const ang = this._randRange(0, Math.PI * 2);
        const d = this._randRange(40, an.radius * 0.82);
        const tx = clamp(an.x + Math.cos(ang) * d, 40, W - 40);
        const ty = clamp(an.y + Math.sin(ang) * d, 40, H - 40);
        pos = this._isFree(tx, ty, 10, 12) ? { x: tx, y: ty } : this._findSpotInZone('wilds', 10, 18);
      } else {
        pos = this._findSpotInZone('wilds', 10, 18);
      }
      this.spawnArchetype('wildCore', pos.x, pos.y);
    }

    // 7. Residents: begin in & around Sanctuary and Twilight so Player immediately meets curious life!
    for (let i = 0; i < this.agentSpecs.length; i++) {
      const spec = this.agentSpecs[i];
      const morph = BODY_MORPHS[spec.morph] || BODY_MORPHS.scout;
      const z = i < 4 ? 'sanctuary' : 'twilight';
      const pos = this._findSpotInZone(z, morph.radius, 34);
      this._createAgent(spec.id || `Istota-${i + 1}`, morph, pos.x, pos.y, 0, 1.0);
    }

    if (this.enablePlayer) {
      this.spawnPlayer();
    }
  }

  _createAgent(id, morph, x, y, generation = 0, sizeScale = 1.0) {
    const r = morph.radius * sizeScale;
    const mass = morph.mass * (sizeScale * sizeScale);
    const theta = this._randRange(-Math.PI, Math.PI);
    const a = {
      idx: this.agents.length,
      id,
      morph: morph.kind,
      generation,
      sizeScale,
      x,
      y,
      vx: 0,
      vy: 0,
      theta,
      omega: 0,
      gazeOffset: 0,
      r,
      mass,
      maxThrust: morph.maxThrust / Math.sqrt(sizeScale),
      turnRate: morph.turnRate,
      gripRange: morph.gripRange,
      gripStiffness: morph.gripStiffness,
      energyBurnMult: morph.energyBurnMult * sizeScale,
      ramBonus: morph.ramBonus * sizeScale,
      rgb: [...morph.rgb],
      energy: 0.70,
      integrity: 1.0,
      stress: 0.0,
      stamina: 1.0,
      dEnergy: 0,
      dIntegrity: 0,
      dStress: 0,
      feltForceXBody: 0,
      feltForceYBody: 0,
      gripping: false,
      carriedObjId: -1,
      ramIntent: false,
      inShelter: false,
      zone: 'sanctuary',
      reproCd: Math.floor(this.cfg.reproCooldownTicks * 0.5),
      breathPhase: this.rng.next() * Math.PI * 2,
      spine: makeSpine(x, y, theta, r, 5),
      touch: this._emptyTouch(),
      trail: [],
      stats: {
        berriesEaten: 0,
        coresEaten: 0,
        geodesBroken: 0,
        burnHits: 0,
        wildsTicks: 0,
        twilightTicks: 0,
        sanctuaryTicks: 0,
        shelteredInWildsTicks: 0,
        restTicks: 0,
        gentleContacts: 0,
        boulderPushDist: 0,
        energyIntegral: 0,
        integrityIntegral: 0,
        aliveTicks: 0,
        births: 0,
      },
    };
    this.agents.push(a);
    return a;
  }

  spawnPlayer(x = null, y = null) {
    const spec = BODY_MORPHS.player;
    const pos =
      x !== null && y !== null
        ? { x: clamp(x, 40, this.cfg.width - 40), y: clamp(y, 40, this.cfg.height - 40) }
        : this._findSpotInZone('sanctuary', spec.radius, 30);
    this.player = {
      id: 'Gracz',
      morph: 'player',
      x: pos.x,
      y: pos.y,
      vx: 0,
      vy: 0,
      theta: 0,
      r: spec.radius,
      mass: spec.mass,
      ramBonus: spec.ramBonus,
      rgb: [...spec.rgb],
      // Equal living stats with creatures (ignored when playerGodMode === true)!
      energy: 0.85,
      integrity: 1.0,
      stamina: 1.0,
      stress: 0.0,
      zone: 'sanctuary',
      inShelter: false,
      dashActive: 0,
      dashCd: 0,
      carriedObjId: -1, // toggled cleanly by single `E` press!
      aimAngle: 0,
      breathPhase: 0,
      spine: makeSpine(pos.x, pos.y, 0, spec.radius, 5),
      stats: { eaten: 0, geodesBroken: 0 },
    };
  }

  removePlayer() {
    this.player = null;
  }

  _sectorForAngle(bodyTheta, worldAngle) {
    const n = this.cfg.touchSectors;
    const rel = wrapAngle(worldAngle - bodyTheta);
    const shifted = rel + Math.PI / n;
    const wrapped = ((shifted % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI);
    return Math.floor((wrapped / (2 * Math.PI)) * n) % n;
  }

  _recordTouch(agent, worldAngle, pressure, impulse, rgb) {
    const s = this._sectorForAngle(agent.theta, worldAngle);
    const slot = agent.touch[s];
    if (pressure > slot.pressure || impulse > slot.impulse) {
      slot.pressure = Math.max(slot.pressure, clamp(pressure, 0, 1));
      slot.impulse = Math.max(slot.impulse, clamp(impulse, 0, 4));
      slot.rgb = [rgb[0], rgb[1], rgb[2]];
    }
  }

  _breakObject(objIdx, breakerIdx) {
    const obj = this.objects[objIdx];
    this.objects.splice(objIdx, 1);
    if (breakerIdx >= 0 && breakerIdx < this.agents.length) {
      this.agents[breakerIdx].stats.geodesBroken++;
    } else if (breakerIdx === -2 && this.player) {
      this.player.stats.geodesBroken++;
    }

    // Burst into rich shards (wildCore value if deep, sanctuaryBerry/rich shard otherwise)
    const z = this.sampleZone(obj.x, obj.y).zone;
    const shardArch = z === 'sanctuary' ? 'sanctuaryBerry' : 'wildCore';
    const count = Math.max(2, obj.burstCount || 3);
    for (let k = 0; k < count; k++) {
      const ang = (k / count) * Math.PI * 2 + this.rng.next() * 0.6;
      const spd = 1.1 + this.rng.next() * 1.2;
      const sx = clamp(obj.x + Math.cos(ang) * 14, 24, this.cfg.width - 24);
      const sy = clamp(obj.y + Math.sin(ang) * 14, 24, this.cfg.height - 24);
      this.spawnArchetype(shardArch, sx, sy, {
        vx: Math.cos(ang) * spd,
        vy: Math.sin(ang) * spd,
        fromGeode: true,
      });
    }
    this.recentEvents.push({ kind: 'burst', x: obj.x, y: obj.y, tick: this.tick, rgb: [...obj.rgb] });
    if (this.recentEvents.length > 36) this.recentEvents.shift();
  }

  _resolveBodyRockFormations(body, isResident = false) {
    for (const rw of this.rockFormations) {
      const cp = closestPointOnSegment(body.x, body.y, rw.ax, rw.ay, rw.bx, rw.by);
      const dx = body.x - cp.x;
      const dy = body.y - cp.y;
      const dist = Math.hypot(dx, dy);
      const minD = (body.r ?? body.radius) + rw.r;
      if (dist < minD) {
        const nx = dist > 1e-6 ? dx / dist : 1;
        const ny = dist > 1e-6 ? dy / dist : 0;
        const pen = minD - dist;
        body.x += nx * pen;
        body.y += ny * pen;
        const closing = -(body.vx * nx + body.vy * ny);
        if (closing > 0) {
          body.vx += nx * closing * 1.1;
          body.vy += ny * closing * 1.1;
        }
        if (isResident) {
          this._recordTouch(body, Math.atan2(cp.y - body.y, cp.x - body.x), clamp(pen / 4 + 0.4, 0.4, 1), Math.max(0, closing), COLOR_ROCK);
        }
      }
    }
  }

  _stepAgent(a, action) {
    const cfg = this.cfg;
    const thrust = clamp(Number(action?.thrust) || 0, -0.5, 1.0);
    const turn = clamp(Number(action?.turn) || 0, -1.0, 1.0);
    const gazeTurn = clamp(Number(action?.gazeTurn) || 0, -1.0, 1.0);
    const grip = Boolean(action?.grip);
    a.ramIntent = Boolean(action?.ramIntent) || thrust > 0.92;

    a.omega = turn * a.turnRate;
    a.theta = wrapAngle(a.theta + a.omega);
    a.breathPhase += 0.045 + Math.abs(thrust) * 0.03;

    if (Math.abs(gazeTurn) > 0.02) {
      a.gazeOffset = clamp(a.gazeOffset + gazeTurn * cfg.gazeTurnRate, -cfg.maxGazeOffset, cfg.maxGazeOffset);
    } else {
      a.gazeOffset *= 0.90;
    }

    a.gripping = grip;
    const effort = thrust * thrust + 0.14 * turn * turn + (grip ? 0.08 : 0);
    a.stamina = clamp(a.stamina + cfg.staminaRegen - cfg.staminaDrain * effort, 0, 1);

    const vitality = 0.52 + 0.26 * a.integrity + 0.22 * a.energy;
    const powerScale = (0.60 + 0.40 * a.stamina) * vitality;
    const eBurn = (cfg.baseEnergyBurn + cfg.thrustEnergyBurn * effort) * a.energyBurnMult;
    a.energy = clamp(a.energy - eBurn, 0, 1);

    if (Math.abs(thrust) < 0.14 && Math.hypot(a.vx, a.vy) < 0.35) a.stats.restTicks++;

    const zInfo = this.sampleZone(a.x, a.y);
    a.zone = zInfo.zone;
    if (zInfo.zone === 'sanctuary') a.stats.sanctuaryTicks++;
    else if (zInfo.zone === 'twilight') a.stats.twilightTicks++;
    else a.stats.wildsTicks++;

    const lf = this.sampleLocalForceAndShelter(a.x, a.y);
    a.inShelter = lf.shelter > 0.35;
    a._extFx = lf.fx;
    a._extFy = lf.fy;

    const cosT = Math.cos(a.theta);
    const sinT = Math.sin(a.theta);
    const thrustMag = thrust * a.maxThrust * powerScale;
    const dragX = -cfg.baseDrag * a.vx;
    const dragY = -cfg.baseDrag * a.vy;

    a.vx += (cosT * thrustMag + lf.fx + dragX) / Math.sqrt(a.mass);
    a.vy += (sinT * thrustMag + lf.fy + dragY) / Math.sqrt(a.mass);

    // Optional physical carry/haul by creatures
    if (grip && !this.freezeBlocks) {
      let target = a.carriedObjId > 0 ? this.objects.find((o) => o.id === a.carriedObjId) : null;
      if (!target) {
        let bestD = a.gripRange;
        for (const o of this.objects) {
          if (!o.movable || o.burnDamage > 0) continue;
          const d = Math.hypot(o.x - a.x, o.y - a.y) - (o.radius + a.r);
          if (d < bestD) {
            bestD = d;
            target = o;
          }
        }
        a.carriedObjId = target ? target.id : -1;
      }
      if (target) {
        const holdDist = a.r + target.radius + 6;
        const hx = a.x + cosT * holdDist;
        const hy = a.y + sinT * holdDist;
        target.vx += ((hx - target.x) * a.gripStiffness) / Math.sqrt(target.mass);
        target.vy += ((hy - target.y) * a.gripStiffness) / Math.sqrt(target.mass);
        a.vx *= 0.88;
        a.vy *= 0.88;
      }
    } else {
      a.carriedObjId = -1;
    }

    a.x += a.vx;
    a.y += a.vy;

    // Arena boundary
    const W = cfg.width;
    const H = cfg.height;
    if (a.x < a.r) { a.x = a.r; const imp = Math.abs(a.vx); a.vx = imp * 0.35; this._recordTouch(a, Math.PI, 1, imp, COLOR_ROCK); }
    else if (a.x > W - a.r) { a.x = W - a.r; const imp = Math.abs(a.vx); a.vx = -imp * 0.35; this._recordTouch(a, 0, 1, imp, COLOR_ROCK); }
    if (a.y < a.r) { a.y = a.r; const imp = Math.abs(a.vy); a.vy = imp * 0.35; this._recordTouch(a, -Math.PI / 2, 1, imp, COLOR_ROCK); }
    else if (a.y > H - a.r) { a.y = H - a.r; const imp = Math.abs(a.vy); a.vy = -imp * 0.35; this._recordTouch(a, Math.PI / 2, 1, imp, COLOR_ROCK); }
    this._resolveBodyRockFormations(a, true);

    // Zone & local anomaly physiology (Sanctuary heals & calms; Wild anomalies stress & drain unless sheltered!)
    if (zInfo.zone === 'sanctuary') {
      a.stress = clamp(a.stress - 0.008, 0, 1);
      a.integrity = clamp(a.integrity + cfg.sanctuaryRegenRate, 0, 1);
    } else {
      const exp = lf.anomalyExposure;
      if (exp > 0.06) {
        a.stress = clamp(a.stress + cfg.wildsStressRate * (1 + exp * 4), 0, 1);
        a.integrity = clamp(a.integrity - (cfg.wildsDamageRate * 0.5 + cfg.anomalyDamage * exp), 0, 1);
      } else if (lf.shelter > 0.32) {
        a.stress = clamp(a.stress - 0.006, 0, 1);
        a.integrity = clamp(a.integrity + cfg.shelterRegenRate, 0, 1);
        if (zInfo.zone === 'wilds') a.stats.shelteredInWildsTicks++;
      } else {
        // Gentle calm outside anomalies
        a.stress = clamp(a.stress + (zInfo.wildness > 0.7 ? cfg.wildsStressRate * 0.25 : -0.003), 0, 1);
        a.integrity = clamp(a.integrity + cfg.sanctuaryRegenRate * 0.35, 0, 1);
      }
    }

    // Update organic spine physics + visual breadcrumb trail
    updateSpine(a.spine, a.x, a.y, a.r * 0.62);
    if (this.tick % 5 === 0) {
      a.trail.push([a.x, a.y]);
      if (a.trail.length > 26) a.trail.shift();
    }
    if (a.reproCd > 0) a.reproCd--;
  }

  // Equal-body top-down Player controller: WASD + smooth cursor aim + E toggle grip + Space dash/throw!
  _stepPlayer(action) {
    const p = this.player;
    if (!p) return;
    const spec = BODY_MORPHS.player;
    const cfg = this.cfg;

    if (p.dashCd > 0) p.dashCd--;
    if (p.dashActive > 0) p.dashActive--;
    p.breathPhase += 0.05;

    let mx = clamp(Number(action?.moveX) || 0, -1, 1);
    let my = clamp(Number(action?.moveY) || 0, -1, 1);
    const mLen = Math.hypot(mx, my);
    if (mLen > 1) { mx /= mLen; my /= mLen; }

    if (Number.isFinite(action?.aimAngle)) {
      p.aimAngle = action.aimAngle;
      const diff = wrapAngle(action.aimAngle - p.theta);
      p.theta = wrapAngle(p.theta + diff * 0.32);
    } else if (mLen > 0.08) {
      p.aimAngle = Math.atan2(my, mx);
      const diff = wrapAngle(p.aimAngle - p.theta);
      p.theta = wrapAngle(p.theta + diff * 0.28);
    }

    const vitality = this.playerGodMode ? 1.0 : 0.58 + 0.24 * p.integrity + 0.18 * p.energy;
    const speedScale = (this.playerGodMode ? 1.0 : 0.65 + 0.35 * p.stamina) * vitality;
    const targetVx = mx * spec.maxSpeed * speedScale;
    const targetVy = my * spec.maxSpeed * speedScale;
    const accel = p.dashActive > 0 ? 0.05 : 0.25;
    p.vx += (targetVx - p.vx) * accel;
    p.vy += (targetVy - p.vy) * accel;

    // Equal living physiology (unless godMode!)
    const zInfo = this.sampleZone(p.x, p.y);
    p.zone = zInfo.zone;
    const lf = this.sampleLocalForceAndShelter(p.x, p.y);
    p.inShelter = lf.shelter > 0.35;
    if (!this.playerGodMode) {
      p.vx += lf.fx * 0.7;
      p.vy += lf.fy * 0.7;
      const moveEffort = mLen * mLen;
      p.stamina = clamp(p.stamina + cfg.staminaRegen - cfg.staminaDrain * moveEffort * 0.65, 0, 1);
      p.energy = clamp(p.energy - (cfg.baseEnergyBurn + cfg.thrustEnergyBurn * moveEffort) * spec.energyBurnMult, 0, 1);
      if (zInfo.zone === 'sanctuary') {
        p.stress = clamp(p.stress - 0.01, 0, 1);
        p.integrity = clamp(p.integrity + cfg.sanctuaryRegenRate * 1.3, 0, 1);
      } else if (lf.anomalyExposure > 0.08) {
        p.stress = clamp(p.stress + cfg.wildsStressRate * (1 + lf.anomalyExposure * 3.5), 0, 1);
        p.integrity = clamp(p.integrity - cfg.anomalyDamage * lf.anomalyExposure, 0, 1);
      } else if (lf.shelter > 0.32) {
        p.stress = clamp(p.stress - 0.008, 0, 1);
        p.integrity = clamp(p.integrity + cfg.shelterRegenRate, 0, 1);
      } else {
        p.stress = clamp(p.stress - 0.004, 0, 1);
      }
      // Gentle return to Sanctuary if player integrity hits 0 in Wilds
      if (p.integrity <= 0.01) {
        const home = this._findSpotInZone('sanctuary', p.r, 24);
        p.x = home.x;
        p.y = home.y;
        p.vx = 0;
        p.vy = 0;
        p.integrity = 0.85;
        p.stress = 0;
      }
    } else {
      p.energy = 1.0;
      p.integrity = 1.0;
      p.stamina = 1.0;
      p.stress = 0.0;
    }

    // Ergonomic `E` TOGGLE grip (single press grabs nearest movable object or releases held object!)
    if (action?.toggleGrip) {
      if (p.carriedObjId > 0) {
        p.carriedObjId = -1;
      } else {
        let best = null;
        let bestD = spec.gripRange;
        for (const o of this.objects) {
          if (!o.movable) continue;
          if (this.freezeBlocks && o.archetype === 'boulder') continue;
          const d = Math.hypot(o.x - p.x, o.y - p.y) - (o.radius + p.r);
          if (d < bestD) {
            bestD = d;
            best = o;
          }
        }
        if (best) p.carriedObjId = best.id;
      }
    }

    // Hold carried object smoothly IN THE DIRECTION OF THE CURSOR (`p.aimAngle`)!
    if (p.carriedObjId > 0) {
      const held = this.objects.find((o) => o.id === p.carriedObjId);
      if (!held) {
        p.carriedObjId = -1;
      } else {
        const holdDist = p.r + held.radius + 10;
        const hx = p.x + Math.cos(p.aimAngle) * holdDist;
        const hy = p.y + Math.sin(p.aimAngle) * holdDist;
        const stiff = held.mass > 2.5 ? 0.18 : 0.36;
        held.vx += (hx - held.x) * stiff;
        held.vy += (hy - held.y) * stiff;
        held.vx *= 0.78;
        held.vy *= 0.78;
        if (held.mass > 2.5 && !this.playerGodMode) {
          p.vx *= 0.88;
          p.vy *= 0.88;
        }
      }
    }

    // Space: if carrying an object -> TOSS it briskly toward cursor! Otherwise -> crisp Dash!
    if (action?.dash && p.dashCd === 0) {
      if (p.carriedObjId > 0) {
        const held = this.objects.find((o) => o.id === p.carriedObjId);
        if (held) {
          const throwSpd = clamp(10.2 / Math.pow(held.mass, 0.36), 5.0, 9.5);
          held.vx = Math.cos(p.aimAngle) * throwSpd;
          held.vy = Math.sin(p.aimAngle) * throwSpd;
        }
        p.carriedObjId = -1;
        p.dashCd = 16;
      } else {
        const dx = mLen > 0.1 ? mx : Math.cos(p.aimAngle);
        const dy = mLen > 0.1 ? my : Math.sin(p.aimAngle);
        p.vx = dx * spec.dashSpeed;
        p.vy = dy * spec.dashSpeed;
        p.dashActive = spec.dashDuration;
        p.dashCd = spec.dashCooldown;
        if (!this.playerGodMode) p.stamina = clamp(p.stamina - 0.18, 0, 1);
      }
    }

    p.x = clamp(p.x + p.vx, p.r, cfg.width - p.r);
    p.y = clamp(p.y + p.vy, p.r, cfg.height - p.r);
    this._resolveBodyRockFormations(p, false);
    updateSpine(p.spine, p.x, p.y, p.r * 0.62);
  }

  _resolveBodyMatterCollisions(body, bodyIdx, isPlayer = false) {
    for (let i = this.objects.length - 1; i >= 0; i--) {
      const obj = this.objects[i];
      // Skip eating or colliding violently with the object currently held by this body
      if (body.carriedObjId === obj.id) continue;

      const dx = body.x - obj.x;
      const dy = body.y - obj.y;
      const dist = Math.hypot(dx, dy);
      const minD = body.r + obj.radius + (obj.edible ? 2 : 0);
      if (dist >= minD) continue;

      // 1. Edible objects
      if (obj.edible) {
        // Player only eats when hungry (and not carrying), so Player can also gently nudge/carry food to creatures!
        const playerWantsEat = isPlayer && !this.playerGodMode && body.energy < 0.90;
        if (!isPlayer || playerWantsEat) {
          if (!isPlayer) {
            this._recordTouch(body, Math.atan2(obj.y - body.y, obj.x - body.x), 0.85, 0.3, obj.rgb);
            if (obj.valueTier >= 3) body.stats.coresEaten++;
            else body.stats.berriesEaten++;
          } else {
            body.stats.eaten++;
          }
          body.energy = clamp(body.energy + obj.energyGain, 0, 1);
          body.integrity = clamp(body.integrity + obj.integrityGain, 0, 1);
          this.objects.splice(i, 1);
          continue;
        }
      }

      // 2. Burning / hazard objects
      if (obj.burnDamage > 0) {
        const nx = dist > 1e-6 ? dx / dist : 1;
        const ny = dist > 1e-6 ? dy / dist : 0;
        const pen = minD - dist;
        body.x += nx * (pen + 1.5);
        body.y += ny * (pen + 1.5);
        body.vx = nx * (obj.burnKnockback || 2.5);
        body.vy = ny * (obj.burnKnockback || 2.5);
        if (!isPlayer) {
          this._recordTouch(body, Math.atan2(obj.y - body.y, obj.x - body.x), 1.0, 2.5, obj.rgb);
          body.integrity = clamp(body.integrity - obj.burnDamage, 0, 1);
          body.energy = clamp(body.energy - obj.burnDamage * 0.35, 0, 1);
          body.stress = clamp(body.stress + 0.35, 0, 1);
          body.stats.burnHits++;
        } else if (!this.playerGodMode) {
          body.integrity = clamp(body.integrity - obj.burnDamage * 0.8, 0, 1);
          body.stress = clamp(body.stress + 0.3, 0, 1);
        }
        continue;
      }

      // 3. Solid physical objects (boulders, geodes, custom matter)
      const nx = dist > 1e-6 ? dx / dist : 1;
      const ny = dist > 1e-6 ? dy / dist : 0;
      const pen = minD - dist;
      const closing = -((body.vx - obj.vx) * nx + (body.vy - obj.vy) * ny);
      const impact = Math.max(0, closing) * (body.ramBonus || 1.0);

      const frozen = !obj.movable || (this.freezeBlocks && obj.archetype === 'boulder');
      if (frozen) {
        body.x += nx * pen;
        body.y += ny * pen;
        if (closing > 0) {
          body.vx += nx * closing * 1.1;
          body.vy += ny * closing * 1.1;
        }
      } else {
        const invM1 = 1 / body.mass;
        const invM2 = 1 / obj.mass;
        const invSum = invM1 + invM2;
        const ox0 = obj.x;
        const oy0 = obj.y;
        body.x += nx * pen * (invM1 / invSum);
        body.y += ny * pen * (invM1 / invSum);
        obj.x -= nx * pen * (invM2 / invSum);
        obj.y -= ny * pen * (invM2 / invSum);
        if (closing > 0) {
          const j = (1.12 * closing) / invSum;
          body.vx += nx * j * invM1;
          body.vy += ny * j * invM1;
          obj.vx -= nx * j * invM2;
          obj.vy -= ny * j * invM2;
        }
        if (!isPlayer && obj.shelterStrength > 0.5) {
          body.stats.boulderPushDist += Math.hypot(obj.x - ox0, obj.y - oy0);
        }
      }

      if (!isPlayer) {
        this._recordTouch(body, Math.atan2(obj.y - body.y, obj.x - body.x), clamp(pen / 4 + 0.35, 0.35, 1), impact, obj.rgb);
      }

      if (obj.breakable && impact >= obj.breakImpulseMin) {
        obj.hp -= impact * 0.58;
        if (obj.hp <= 0) {
          this._breakObject(i, isPlayer ? -2 : bodyIdx);
        }
      }
    }
  }

  // GENTLE BODY-BODY PHYSICS: rubbing, crowding, and greeting NEVER cause pain!
  // Pain happens ONLY on intentional high-velocity Dash / Ram impact above gentleTouchThreshold!
  _resolveBodyBodyCollisions() {
    const all = this.player ? [...this.agents, this.player] : this.agents;
    const thresh = this.cfg.gentleTouchThreshold;

    for (let i = 0; i < all.length; i++) {
      for (let j = i + 1; j < all.length; j++) {
        const a = all[i];
        const b = all[j];
        const dx = b.x - a.x;
        const dy = b.y - a.y;
        const dist = Math.hypot(dx, dy);
        const minD = a.r + b.r;
        if (dist >= minD) continue;

        const nx = dist > 1e-6 ? dx / dist : 1;
        const ny = dist > 1e-6 ? dy / dist : 0;
        const pen = minD - dist;
        const invMa = 1 / a.mass;
        const invMb = 1 / b.mass;
        const invSum = invMa + invMb;

        // Soft compliant separation (feels squishy & alive like Combat-Lab crowds!)
        a.x -= nx * pen * 0.85 * (invMa / invSum);
        a.y -= ny * pen * 0.85 * (invMa / invSum);
        b.x += nx * pen * 0.85 * (invMb / invSum);
        b.y += ny * pen * 0.85 * (invMb / invSum);

        const closing = -((b.vx - a.vx) * nx + (b.vy - a.vy) * ny);
        if (closing > 0) {
          const imp = (0.95 * closing) / invSum;
          a.vx -= nx * imp * invMa;
          a.vy -= ny * imp * invMa;
          b.vx += nx * imp * invMb;
          b.vy += ny * imp * invMb;

          // ONLY intentional dashing/ramming causes pain (casual touching/rubbing ALWAYS = 0 damage!)
          const playerDashThresh = Math.min(thresh, 2.0);
          const aIntentionalHit =
            a.morph === 'player'
              ? a.dashActive > 0 && closing > playerDashThresh
              : a.ramIntent && closing > thresh;
          const bIntentionalHit =
            b.morph === 'player'
              ? b.dashActive > 0 && closing > playerDashThresh
              : b.ramIntent && closing > thresh;

          if (aIntentionalHit && b.morph !== 'player') {
            b.integrity = clamp(b.integrity - this.cfg.intentionalImpactDmg, 0, 1);
            b.stress = clamp(b.stress + 0.3, 0, 1);
          }
          if (bIntentionalHit && a.morph !== 'player') {
            a.integrity = clamp(a.integrity - this.cfg.intentionalImpactDmg, 0, 1);
            a.stress = clamp(a.stress + 0.3, 0, 1);
          }
        }

        if (a.morph !== 'player') {
          this._recordTouch(a, Math.atan2(dy, dx), 0.65, Math.max(0, closing), b.rgb);
          if (closing <= thresh) a.stats.gentleContacts++;
        }
        if (b.morph !== 'player') {
          this._recordTouch(b, Math.atan2(-dy, -dx), 0.65, Math.max(0, closing), a.rgb);
          if (closing <= thresh) b.stats.gentleContacts++;
        }
      }
    }
  }

  _stepMatterAndEcology() {
    const cfg = this.cfg;
    const W = cfg.width;
    const H = cfg.height;

    for (let i = this.objects.length - 1; i >= 0; i--) {
      const o = this.objects[i];
      if (!o.movable || (this.freezeBlocks && o.archetype === 'boulder')) {
        o.vx = 0;
        o.vy = 0;
        continue;
      }
      if (o.mass < 1.2 && this.cfg.anomalyStrength > 0.001) {
        // Fast reject: only check full local force/shelter if light object sits inside an anomaly radius!
        let nearAnom = false;
        for (let k = 0; k < this.anomalies.length; k++) {
          const an = this.anomalies[k];
          const adx = o.x - an.x;
          const ady = o.y - an.y;
          if (adx * adx + ady * ady < an.radius * an.radius) {
            nearAnom = true;
            break;
          }
        }
        if (nearAnom) {
          const lf = this.sampleLocalForceAndShelter(o.x, o.y);
          o.vx += lf.fx * 0.25;
          o.vy += lf.fy * 0.25;
        }
      }
      if (o.vx === 0 && o.vy === 0) continue;
      const fric = o.mass > 2.5 ? 0.915 : 0.925;
      o.vx *= fric;
      o.vy *= fric;
      if (Math.abs(o.vx) < 0.003) o.vx = 0;
      if (Math.abs(o.vy) < 0.003) o.vy = 0;
      o.x = clamp(o.x + o.vx, o.radius + 8, W - o.radius - 8);
      o.y = clamp(o.y + o.vy, o.radius + 8, H - o.radius - 8);
      this._resolveBodyRockFormations(o, false);
    }

    // Thrown heavy object cracking a geode!
    for (let i = this.objects.length - 1; i >= 0; i--) {
      const a = this.objects[i];
      if (!a || !a.breakable) continue;
      for (let j = 0; j < this.objects.length; j++) {
        if (i === j) continue;
        const b = this.objects[j];
        if (!b || b.edible) continue;
        const d = Math.hypot(a.x - b.x, a.y - b.y);
        if (d < a.radius + b.radius) {
          const spd = Math.hypot(b.vx - a.vx, b.vy - a.vy);
          if (spd * Math.sqrt(b.mass) > a.breakImpulseMin * 1.4) {
            a.hp = 0;
            this._breakObject(i, -2);
            break;
          }
        }
      }
    }

    // Ecological renewal across zones
    const edibleCount = this.objects.filter((o) => o.edible).length;
    if (this.tick > 0 && this.tick % Math.max(10, Math.round(cfg.foodRespawnEvery)) === 0 && edibleCount < cfg.maxConsumables) {
      const roll = this.rng.next();
      if (roll < 0.34) {
        const pos = this._findSpotInZone('sanctuary', 8, 16, 40);
        this.spawnArchetype('sanctuaryBerry', pos.x, pos.y);
      } else if (roll < 0.66) {
        const pos = this._findSpotInZone('twilight', 8, 16, 40);
        this.spawnArchetype('sanctuaryBerry', pos.x, pos.y);
      } else {
        const pos = this._findSpotInZone('wilds', 10, 16, 40);
        this.spawnArchetype('wildCore', pos.x, pos.y);
      }
    }

    const geodeCount = this.objects.filter((o) => o.archetype === 'geode').length;
    if (this.tick > 0 && this.tick % Math.max(40, Math.round(cfg.geodeRespawnEvery)) === 0 && geodeCount < cfg.numGeodes) {
      const z = this.rng.next() < 0.55 ? 'twilight' : 'wilds';
      const pos = this._findSpotInZone(z, 20, 26, 40);
      this.spawnArchetype('geode', pos.x, pos.y);
    }

    // Optional lineage reproduction on high vitality surplus!
    if (cfg.allowReproduction && this.agents.length < cfg.maxPopulation) {
      for (let i = 0; i < this.agents.length; i++) {
        const parent = this.agents[i];
        if (
          parent.energy >= cfg.reproEnergyThreshold &&
          parent.integrity > 0.82 &&
          parent.reproCd <= 0 &&
          this.agents.length < cfg.maxPopulation
        ) {
          parent.energy *= 0.56;
          parent.reproCd = cfg.reproCooldownTicks;
          parent.stats.births++;
          const morph = BODY_MORPHS[parent.morph] || BODY_MORPHS.scout;
          const mutScale = clamp(
            parent.sizeScale + (this.rng.next() * 2 - 1) * cfg.mutationScale,
            0.78,
            1.28
          );
          const ang = this._randRange(0, Math.PI * 2);
          const cx = clamp(parent.x + Math.cos(ang) * (parent.r * 2.2), 30, W - 30);
          const cy = clamp(parent.y + Math.sin(ang) * (parent.r * 2.2), 30, H - 30);
          const childId = `${parent.morph === 'ram' ? 'Taran' : 'Zwiad'}-g${parent.generation + 1}-${this.nextId}`;
          const child = this._createAgent(childId, morph, cx, cy, parent.generation + 1, mutScale);
          child.energy = 0.62;
          this.recentEvents.push({ kind: 'birth', x: cx, y: cy, tick: this.tick, rgb: [...child.rgb] });
          if (this.onBirth) this.onBirth(child.idx, i);
          break;
        }
      }
    }
  }

  step(actions = [], playerAction = null) {
    this.tick++;

    const preE = this.agents.map((a) => a.energy);
    const preI = this.agents.map((a) => a.integrity);
    const preS = this.agents.map((a) => a.stress);

    for (let i = 0; i < this.agents.length; i++) {
      this.agents[i].touch = this._emptyTouch();
      this._stepAgent(this.agents[i], actions[i] || null);
    }
    if (this.player) {
      this._stepPlayer(playerAction || {});
    }

    for (let i = 0; i < this.agents.length; i++) {
      this._resolveBodyMatterCollisions(this.agents[i], i, false);
    }
    if (this.player) {
      this._resolveBodyMatterCollisions(this.player, -2, true);
    }

    this._resolveBodyBodyCollisions();
    this._stepMatterAndEcology();

    for (let i = 0; i < this.agents.length; i++) {
      const a = this.agents[i];
      const cosT = Math.cos(a.theta);
      const sinT = Math.sin(a.theta);
      a.feltForceXBody = (a._extFx || 0) * cosT + (a._extFy || 0) * sinT;
      a.feltForceYBody = -(a._extFx || 0) * sinT + (a._extFy || 0) * cosT;
      a.dEnergy = i < preE.length ? a.energy - preE[i] : 0;
      a.dIntegrity = i < preI.length ? a.integrity - preI[i] : 0;
      a.dStress = i < preS.length ? a.stress - preS[i] : 0;
      a.stats.aliveTicks++;
      a.stats.energyIntegral += a.energy;
      a.stats.integrityIntegral += a.integrity;
    }

    return this.getAllObservations();
  }

  // Strictly private egocentric observation — ZERO coordinates, ZERO object-type tags, ZERO leaks!
  getObservation(idx) {
    const a = this.agents[idx];
    const cfg = this.cfg;
    const zInfo = this.sampleZone(a.x, a.y);
    const sky = zInfo.skyRgb;

    const N = cfg.retinaRays;
    const fov = cfg.retinaFov;
    const range = cfg.retinaRange;
    const lookTheta = a.theta + a.gazeOffset;
    const retina = new Array(N);

    const ox = a.x;
    const oy = a.y;

    // Spatial broadphase filter (huge speedup on 3200x2200 biome!)
    const maxR = range + 45;
    const maxR2 = maxR * maxR;
    const nearRocks = [];
    for (let i = 0; i < this.rockFormations.length; i++) {
      const rw = this.rockFormations[i];
      const lim = range + (rw.boundR ?? 160);
      const dx = (rw.cx ?? (rw.ax + rw.bx) * 0.5) - ox;
      const dy = (rw.cy ?? (rw.ay + rw.by) * 0.5) - oy;
      if (dx * dx + dy * dy <= lim * lim) nearRocks.push(rw);
    }
    const nearObjs = [];
    for (let i = 0; i < this.objects.length; i++) {
      const o = this.objects[i];
      const dx = o.x - ox;
      const dy = o.y - oy;
      if (dx * dx + dy * dy <= maxR2) nearObjs.push(o);
    }
    const nearAgents = [];
    for (let i = 0; i < this.agents.length; i++) {
      if (i === idx) continue;
      const o = this.agents[i];
      const dx = o.x - ox;
      const dy = o.y - oy;
      if (dx * dx + dy * dy <= maxR2) nearAgents.push(o);
    }
    const playerNear =
      this.player &&
      (this.player.x - ox) ** 2 + (this.player.y - oy) ** 2 <= maxR2
        ? this.player
        : null;

    for (let r = 0; r < N; r++) {
      const frac = N > 1 ? r / (N - 1) - 0.5 : 0;
      const ang = lookTheta + frac * fov;
      const dx = Math.cos(ang);
      const dy = Math.sin(ang);

      let bestT = rayWallHit(ox, oy, dx, dy, cfg.width, cfg.height, range);
      let hitRgb = bestT < range ? COLOR_ROCK : sky;

      for (let i = 0; i < nearRocks.length; i++) {
        const rw = nearRocks[i];
        const t = rayCapsuleHit(ox, oy, dx, dy, rw.ax, rw.ay, rw.bx, rw.by, rw.r, bestT);
        if (t < bestT) {
          bestT = t;
          hitRgb = COLOR_ROCK;
        }
      }
      for (let i = 0; i < nearObjs.length; i++) {
        const o = nearObjs[i];
        const t = rayCircleHit(ox, oy, dx, dy, o.x, o.y, o.radius, bestT);
        if (t < bestT) {
          bestT = t;
          hitRgb = o.rgb;
        }
      }
      for (let i = 0; i < nearAgents.length; i++) {
        const o = nearAgents[i];
        const t = rayCircleHit(ox, oy, dx, dy, o.x, o.y, o.r, bestT);
        if (t < bestT) {
          bestT = t;
          hitRgb = o.rgb;
        }
      }
      if (playerNear) {
        const t = rayCircleHit(ox, oy, dx, dy, playerNear.x, playerNear.y, playerNear.r, bestT);
        if (t < bestT) {
          bestT = t;
          hitRgb = playerNear.rgb;
        }
      }

      if (bestT >= range) {
        retina[r] = [sky[0], sky[1], sky[2]];
      } else {
        const atten = 1 - clamp((bestT / range) * 0.56, 0, 0.56);
        retina[r] = [hitRgb[0] * atten, hitRgb[1] * atten, hitRgb[2] * atten];
      }
    }

    const cosT = Math.cos(a.theta);
    const sinT = Math.sin(a.theta);
    return {
      retina,
      touch: a.touch.map((s) => ({
        pressure: s.pressure,
        impulse: s.impulse,
        rgb: [s.rgb[0], s.rgb[1], s.rgb[2]],
      })),
      body: {
        vxBody: a.vx * cosT + a.vy * sinT,
        vyBody: -a.vx * sinT + a.vy * cosT,
        omega: a.omega,
        gazeOffset: a.gazeOffset,
        feltForceXBody: a.feltForceXBody,
        feltForceYBody: a.feltForceYBody,
        energy: a.energy,
        dEnergy: a.dEnergy,
        integrity: a.integrity,
        dIntegrity: a.dIntegrity,
        stress: a.stress,
        dStress: a.dStress,
        stamina: a.stamina,
        gripping: a.gripping ? 1 : 0,
        carrying: a.carriedObjId > 0 ? 1 : 0,
      },
    };
  }

  getAllObservations() {
    return this.agents.map((_, i) => this.getObservation(i));
  }

  removeNear(x, y, maxDist = 48) {
    let bestIdx = -1;
    let bestD = maxDist;
    for (let i = 0; i < this.objects.length; i++) {
      const o = this.objects[i];
      const d = Math.hypot(o.x - x, o.y - y) - o.radius * 0.5;
      if (d < bestD) {
        bestD = d;
        bestIdx = i;
      }
    }
    if (bestIdx >= 0) {
      this.objects.splice(bestIdx, 1);
      return true;
    }
    return false;
  }

  snapshot() {
    return JSON.parse(
      JSON.stringify({
        seed: this.seed,
        freezeBlocks: this.freezeBlocks,
        tick: this.tick,
        nextId: this.nextId,
        rngState: this.rng.getState(),
        chemistry: this.chemistry,
        rockFormations: this.rockFormations,
        anomalies: this.anomalies,
        objects: this.objects,
        agents: this.agents,
        player: this.player,
      })
    );
  }

  restore(snap) {
    const s = JSON.parse(JSON.stringify(snap));
    this.seed = s.seed;
    this.freezeBlocks = s.freezeBlocks;
    this.tick = s.tick;
    this.nextId = s.nextId;
    this.rng.setState(s.rngState);
    this.chemistry = s.chemistry;
    this.rockFormations = s.rockFormations;
    this.anomalies = s.anomalies;
    this.objects = s.objects;
    this.agents = s.agents;
    this.player = s.player;
  }

  getSummaryMetrics() {
    const n = this.agents.length || 1;
    let berries = 0, cores = 0, geodes = 0, burns = 0;
    let meanE = 0, meanI = 0, restR = 0, gentle = 0;
    let zS = 0, zT = 0, zW = 0, births = 0;
    for (const a of this.agents) {
      berries += a.stats.berriesEaten;
      cores += a.stats.coresEaten;
      geodes += a.stats.geodesBroken;
      burns += a.stats.burnHits;
      meanE += a.stats.energyIntegral / Math.max(1, a.stats.aliveTicks);
      meanI += a.stats.integrityIntegral / Math.max(1, a.stats.aliveTicks);
      restR += a.stats.restTicks / Math.max(1, a.stats.aliveTicks);
      gentle += a.stats.gentleContacts;
      zS += a.stats.sanctuaryTicks;
      zT += a.stats.twilightTicks;
      zW += a.stats.wildsTicks;
      births += a.stats.births;
    }
    const zTot = Math.max(1, zS + zT + zW);
    return {
      tick: this.tick,
      population: this.agents.length,
      birthsTotal: births,
      berriesPerAgent: berries / n,
      coresPerAgent: cores / n,
      geodesBrokenTotal: geodes,
      burnHitsPerAgent: burns / n,
      gentleContactsPerAgent: gentle / n,
      meanEnergy: meanE / n,
      meanIntegrity: meanI / n,
      restRatio: restR / n,
      zoneShare: {
        sanctuary: zS / zTot,
        twilight: zT / zTot,
        wilds: zW / zTot,
      },
      // Honest composite summary (Wild Cores weighted higher because they require risking Twilight/Wilds!)
      viability: (berries / n) * 1.0 + (cores / n) * 2.4 - (burns / n) * 2.6 + (meanI / n - 0.7) * 10,
    };
  }
}

export function createLivingBiomeV3(options = {}) {
  return new LivingBiomeV3(options);
}
