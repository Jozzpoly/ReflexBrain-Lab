// src/render/biome-renderer.mjs — ReflexBrain v3: organic procedural 2D Canvas renderer
// Aesthetic: "Fundament / Głębia" — mineral grain, soft isobaths, faceted basalt, layered currents,
// breathing multi-segment organisms with real gaze & close-up LOD. Zero cheap neon, zero external assets.
// Co-crafted: terrain/basalt/matter/eye foundations designed by Claude Opus 5.5, completed & integrated by Gemini 4 Neon.
//
// The renderer only READS the world (UI-side observer). It never feeds anything back to minds.

import { createRng, clamp } from '../world/biome.mjs';
import { COLOR_ROCK, createMaterialProps } from '../world/config.mjs';

const TAU = Math.PI * 2;
const SPRITE_SCALE = 2.5;
const GROUND_SCALE = 0.25;
export const LOD_ZOOM = 1.35;

export const ZONE_NAMES_PL = Object.freeze({ sanctuary: 'Sanktuarium', twilight: 'Półmrok', wilds: 'Dzicz' });

// ---------------------------------------------------------------------------------------------
// Colour & math helpers
// ---------------------------------------------------------------------------------------------
function c01(v) {
  return v < 0 ? 0 : v > 1 ? 1 : v;
}
function smoothstep(a, b, x) {
  const t = c01((x - a) / (b - a || 1e-6));
  return t * t * (3 - 2 * t);
}
function mix3(a, b, t) {
  return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
}
function scale3(a, k) {
  return [a[0] * k, a[1] * k, a[2] * k];
}
function lighten(a, t) {
  return mix3(a, [1, 1, 1], t);
}
function darken(a, t) {
  return scale3(a, 1 - t);
}
function norm3(x, y, z) {
  const m = Math.hypot(x, y, z) || 1;
  return [x / m, y / m, z / m];
}
const LIGHT = norm3(-0.55, -0.68, 0.78);

export function rgbCss(rgb, alpha = 1) {
  const r = Math.round(c01(rgb[0]) * 255);
  const g = Math.round(c01(rgb[1]) * 255);
  const b = Math.round(c01(rgb[2]) * 255);
  return `rgba(${r},${g},${b},${alpha})`;
}

export function rgbHex(rgb) {
  const h = (v) => Math.round(c01(v) * 255).toString(16).padStart(2, '0');
  return `#${h(rgb[0])}${h(rgb[1])}${h(rgb[2])}`;
}

export function hexToRgb(hex) {
  const m = /^#?([0-9a-f]{6})$/i.exec(String(hex || '').trim());
  if (!m) return [0.8, 0.5, 0.7];
  const n = parseInt(m[1], 16);
  return [((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255];
}

function makeCanvas(w, h) {
  const c = document.createElement('canvas');
  c.width = Math.max(1, Math.ceil(w));
  c.height = Math.max(1, Math.ceil(h));
  return c;
}

// Deterministic value noise per seed
function makeValueNoise(seed) {
  const rng = createRng(((seed * 2654435761) >>> 0) || 1);
  const perm = new Uint16Array(512);
  const vals = new Float32Array(256);
  const p = [];
  for (let i = 0; i < 256; i++) {
    p.push(i);
    vals[i] = rng.next();
  }
  for (let i = 255; i > 0; i--) {
    const j = Math.floor(rng.next() * (i + 1));
    const t = p[i];
    p[i] = p[j];
    p[j] = t;
  }
  for (let i = 0; i < 512; i++) perm[i] = p[i & 255];
  function n2(x, y) {
    const xi = Math.floor(x);
    const yi = Math.floor(y);
    const xf = x - xi;
    const yf = y - yi;
    const X = xi & 255;
    const Y = yi & 255;
    const u = xf * xf * (3 - 2 * xf);
    const v = yf * yf * (3 - 2 * yf);
    const a = vals[perm[perm[X] + Y]];
    const b = vals[perm[perm[X + 1] + Y]];
    const c = vals[perm[perm[X] + Y + 1]];
    const d = vals[perm[perm[X + 1] + Y + 1]];
    return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v;
  }
  function fbm(x, y, oct) {
    let s = 0;
    let amp = 0.5;
    let f = 1;
    let n = 0;
    for (let o = 0; o < oct; o++) {
      s += amp * n2(x * f + o * 17.3, y * f + o * 9.1);
      n += amp;
      amp *= 0.5;
      f *= 2.03;
    }
    return s / n;
  }
  return { n2, fbm };
}

// ---------------------------------------------------------------------------------------------
// Geometry helpers
// ---------------------------------------------------------------------------------------------
function polyPath(ctx, pts) {
  ctx.beginPath();
  ctx.moveTo(pts[0][0], pts[0][1]);
  for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i][0], pts[i][1]);
  ctx.closePath();
}

function smoothClosedPath(ctx, pts) {
  const n = pts.length;
  ctx.beginPath();
  const l = pts[n - 1];
  const f = pts[0];
  ctx.moveTo((l[0] + f[0]) * 0.5, (l[1] + f[1]) * 0.5);
  for (let i = 0; i < n; i++) {
    const p = pts[i];
    const q = pts[(i + 1) % n];
    ctx.quadraticCurveTo(p[0], p[1], (p[0] + q[0]) * 0.5, (p[1] + q[1]) * 0.5);
  }
  ctx.closePath();
}

function triShade(a, b, c) {
  const v1x = b[0] - a[0], v1y = b[1] - a[1], v1z = b[2] - a[2];
  const v2x = c[0] - a[0], v2y = c[1] - a[1], v2z = c[2] - a[2];
  let nx = v1y * v2z - v1z * v2y;
  let ny = v1z * v2x - v1x * v2z;
  let nz = v1x * v2y - v1y * v2x;
  if (nz < 0) {
    nx = -nx;
    ny = -ny;
    nz = -nz;
  }
  const m = Math.hypot(nx, ny, nz) || 1;
  return Math.max(0, (nx * LIGHT[0] + ny * LIGHT[1] + nz * LIGHT[2]) / m);
}

function drawMesh(ctx, tris, baseRgb, rng, o = {}) {
  const sMin = o.shadeMin ?? 0.4;
  const sK = o.shadeK ?? 0.85;
  const varK = o.varK ?? 0.1;
  const seam = o.seamAlpha ?? 0.14;
  ctx.lineJoin = 'round';
  for (const t of tris) {
    const sh = (sMin + sK * triShade(t[0], t[1], t[2])) * (1 + (rng.next() - 0.5) * varK);
    const css = rgbCss(scale3(baseRgb, sh), 1);
    ctx.beginPath();
    ctx.moveTo(t[0][0], t[0][1]);
    ctx.lineTo(t[1][0], t[1][1]);
    ctx.lineTo(t[2][0], t[2][1]);
    ctx.closePath();
    ctx.fillStyle = css;
    ctx.fill();
    ctx.strokeStyle = css;
    ctx.lineWidth = 0.55;
    ctx.stroke();
  }
  if (seam > 0) {
    ctx.strokeStyle = `rgba(0,0,0,${seam})`;
    ctx.lineWidth = 0.45;
    for (const t of tris) {
      ctx.beginPath();
      ctx.moveTo(t[0][0], t[0][1]);
      ctx.lineTo(t[1][0], t[1][1]);
      ctx.lineTo(t[2][0], t[2][1]);
      ctx.closePath();
      ctx.stroke();
    }
  }
}

function domeMesh(r, n, jit, hK, rng, ringK = 0.56) {
  const outer = [];
  const inner = [];
  const rot = rng.next() * TAU;
  for (let i = 0; i < n; i++) {
    const a = rot + (i / n) * TAU + (rng.next() - 0.5) * 0.25;
    const rr = r * (1 - jit / 2 + rng.next() * jit);
    outer.push([Math.cos(a) * rr, Math.sin(a) * rr, 0]);
  }
  for (let i = 0; i < n; i++) {
    const a = rot + ((i + 0.5) / n) * TAU + (rng.next() - 0.5) * 0.3;
    const rr = r * ringK * (0.85 + rng.next() * 0.3);
    inner.push([Math.cos(a) * rr - r * 0.08, Math.sin(a) * rr - r * 0.1, r * hK * 0.72]);
  }
  const apex = [-r * 0.12 + (rng.next() - 0.5) * r * 0.15, -r * 0.14 + (rng.next() - 0.5) * r * 0.15, r * hK];
  const tris = [];
  for (let i = 0; i < n; i++) {
    const j = (i + 1) % n;
    tris.push([outer[i], outer[j], inner[i]]);
    tris.push([outer[j], inner[j], inner[i]]);
    tris.push([inner[i], inner[j], apex]);
  }
  return { outer, inner, apex, tris };
}

function starMesh(r, n, outerK, valleyK, hK, rng, jitter = 0.18) {
  const pts = [];
  const rot = rng.next() * TAU;
  for (let i = 0; i < n * 2; i++) {
    const a = rot + (i / (n * 2)) * TAU + (rng.next() - 0.5) * 0.18;
    const k = i % 2 === 0 ? outerK * (1 - jitter / 2 + rng.next() * jitter) : valleyK * (0.9 + rng.next() * 0.2);
    pts.push([Math.cos(a) * r * k, Math.sin(a) * r * k, i % 2 === 0 ? r * 0.12 : 0]);
  }
  const apex = [-r * 0.06, -r * 0.08, r * hK];
  const tris = [];
  for (let i = 0; i < pts.length; i++) tris.push([pts[i], pts[(i + 1) % pts.length], apex]);
  return { outline: pts, tris, apex };
}

// Ray helpers (UI-side visualisation of the selected creature's 36 rays)
function rayCircle(ox, oy, dx, dy, cx, cy, r, maxT) {
  const fx = ox - cx;
  const fy = oy - cy;
  const b = fx * dx + fy * dy;
  const c = fx * fx + fy * fy - r * r;
  if (c <= 0) return 0.001;
  if (b > 0) return Infinity;
  const disc = b * b - c;
  if (disc < 0) return Infinity;
  const t = -b - Math.sqrt(disc);
  return t > 0 && t < maxT ? t : Infinity;
}
function rayCapsule(ox, oy, dx, dy, ax, ay, bx, by, r, maxT) {
  let best = Math.min(rayCircle(ox, oy, dx, dy, ax, ay, r, maxT), rayCircle(ox, oy, dx, dy, bx, by, r, maxT));
  const ux = bx - ax;
  const uy = by - ay;
  const L = Math.hypot(ux, uy);
  if (L < 1e-5) return best;
  const nx = -uy / L;
  const ny = ux / L;
  for (const s of [-1, 1]) {
    const px = ax + nx * r * s;
    const py = ay + ny * r * s;
    const den = dx * uy - dy * ux;
    if (Math.abs(den) < 1e-7) continue;
    const qx = px - ox;
    const qy = py - oy;
    const t = (qx * uy - qy * ux) / den;
    const u = (qx * dy - qy * dx) / den;
    if (t > 0 && t < best && u >= 0 && u <= 1) best = t;
  }
  return best;
}

// ---------------------------------------------------------------------------------------------
// Ground texture (offscreen, procedurally generated once per seed; recoloured on zone edits)
// ---------------------------------------------------------------------------------------------
function buildGroundLayers(world) {
  const W = world.cfg.width;
  const H = world.cfg.height;
  const gw = Math.max(64, Math.round(W * GROUND_SCALE));
  const gh = Math.max(64, Math.round(H * GROUND_SCALE));
  const N = gw * gh;
  const warped = new Float32Array(N);
  const lum = new Float32Array(N);
  const iso = new Float32Array(N);
  const nz = makeValueNoise((world.seed || 1) + 101);
  const wr = createRng(((world.seed || 1) * 7 + 3) >>> 0);
  const cx = W * 0.5;
  const cy = H * 0.5;
  for (let py = 0; py < gh; py++) {
    const wy = (py + 0.5) / GROUND_SCALE;
    for (let px = 0; px < gw; px++) {
      const wx = (px + 0.5) / GROUND_SCALE;
      const i = py * gw + px;
      const dx = (wx - cx) * 0.86;
      const dy = (wy - cy) * 1.12;
      const d = Math.sqrt(dx * dx + dy * dy);
      const low = nz.fbm(wx * 0.0021, wy * 0.0021, 3);
      warped[i] = d + (low - 0.5) * 46;
      const mott = nz.fbm(wx * 0.006 + 31, wy * 0.006 + 11, 3);
      const grain = nz.n2(wx * 0.09, wy * 0.09);
      const ridge = 1 - Math.abs(2 * nz.fbm(wx * 0.0075 + 5, wy * 0.0075 + 77, 3) - 1);
      const vein = Math.pow(ridge, 10);
      lum[i] = 0.82 + 0.3 * (mott - 0.5) + 0.18 + 0.09 * (grain - 0.5) + 0.05 * (wr.next() - 0.5) + 0.1 * vein;
      const depth = d + (nz.fbm(wx * 0.0032 + 13, wy * 0.0032 + 3, 3) - 0.5) * 170;
      const f = depth / 64;
      const fr = f - Math.floor(f);
      const dd = Math.min(fr, 1 - fr) * 64;
      const major = Math.round(f) % 5 === 0;
      iso[i] = (1 - smoothstep(0.35, 2.6, dd)) * (major ? 0.16 : 0.075);
    }
  }
  return { gw, gh, warped, lum, iso, W, H, seed: world.seed };
}

function colorGround(layers, cfg, canvas) {
  const { gw, gh, warped, lum, iso, W, H } = layers;
  if (canvas.width !== gw) canvas.width = gw;
  if (canvas.height !== gh) canvas.height = gh;
  const ctx = canvas.getContext('2d');
  const img = ctx.createImageData(gw, gh);
  const data = img.data;
  const rS = Math.max(0, Number(cfg.sanctuaryRadius) || 0);
  const rT = Math.max(rS + 1, Number(cfg.twilightRadius) || 0);
  const tW = Math.max(1, rT - rS);
  const wildSpan = Math.max(1, rT * 0.65);
  const cx = W * 0.5;
  const cy = H * 0.5;
  for (let py = 0; py < gh; py++) {
    const wy = (py + 0.5) / GROUND_SCALE;
    const edy = Math.min(wy, H - wy);
    const dyr = (wy - cy) * 1.12;
    for (let px = 0; px < gw; px++) {
      const i = py * gw + px;
      const wx = (px + 0.5) / GROUND_SCALE;
      const d = warped[i];
      const ks = c01(d / Math.max(1, rS));
      const sR = 40 - 11 * ks, sG = 77 - 17 * ks, sB = 73 - 9 * ks;
      const kt = c01((d - rS) / tW);
      const tR = 27 - 6 * kt, tG = 37 - 12 * kt, tB = 61 - 14 * kt;
      const kw = c01((d - rT) / wildSpan);
      const wR = 37 - 15 * kw, wG = 23 - 10 * kw, wB = 34 - 15 * kw;
      const s = smoothstep(rS - 55, rS + 55, d);
      const t = smoothstep(rT - 75, rT + 75, d);
      let r = sR + (tR - sR) * s;
      let g = sG + (tG - sG) * s;
      let b = sB + (tB - sB) * s;
      r += (wR - r) * t;
      g += (wG - g) * t;
      b += (wB - b) * t;
      const L = lum[i];
      r *= L;
      g *= L;
      b *= L;
      const a = iso[i];
      r += (r * 1.25 + 30) * a;
      g += (g * 1.25 + 32) * a;
      b += (b * 1.25 + 38) * a;
      const dxr = (wx - cx) * 0.86;
      const dr = Math.sqrt(dxr * dxr + dyr * dyr);
      const e1 = (dr - rS) / 7;
      const e2 = (dr - rT) / 9;
      const hb = Math.exp(-e1 * e1) * 0.1 + Math.exp(-e2 * e2) * 0.085;
      r += 120 * hb;
      g += 128 * hb;
      b += 130 * hb;
      const ed = Math.min(wx, W - wx, edy);
      const m = 0.5 + 0.5 * smoothstep(0, 170, ed);
      const o = i * 4;
      data[o] = r * m;
      data[o + 1] = g * m;
      data[o + 2] = b * m;
      data[o + 3] = 255;
    }
  }
  ctx.putImageData(img, 0, 0);
}

function makeGrainTile() {
  const c = makeCanvas(256, 256);
  const g = c.getContext('2d');
  const img = g.createImageData(256, 256);
  const rng = createRng(9137);
  for (let i = 0; i < 256 * 256; i++) {
    const v = 128 + (rng.next() - 0.5) * 70;
    img.data[i * 4] = v;
    img.data[i * 4 + 1] = v;
    img.data[i * 4 + 2] = v;
    img.data[i * 4 + 3] = 255;
  }
  g.putImageData(img, 0, 0);
  for (let k = 0; k < 220; k++) {
    const x = rng.next() * 256;
    const y = rng.next() * 256;
    const rr = 0.6 + rng.next() * 1.8;
    const light = rng.next() < 0.5;
    g.fillStyle = light ? 'rgba(235,235,235,0.55)' : 'rgba(10,10,10,0.55)';
    g.beginPath();
    g.arc(x, y, rr, 0, TAU);
    g.fill();
  }
  return c;
}

// ---------------------------------------------------------------------------------------------
// Basalt rock formations (cached sprites, multi-layer faceted chiaroscuro)
// ---------------------------------------------------------------------------------------------
function buildRockSprite(rf) {
  const rng = createRng((Math.floor((rf.seed || 1) * 7919) + 13) >>> 0);
  const R = rf.r;
  let ux = rf.bx - rf.ax;
  let uy = rf.by - rf.ay;
  const len = Math.hypot(ux, uy) || 1;
  ux /= len;
  uy /= len;
  const nx = -uy;
  const ny = ux;
  const axisAng = Math.atan2(uy, ux);
  const pts = [];
  const capN = 7;
  const jit = (k = 0.26) => 1 + (rng.next() - 0.5) * k;
  for (let i = 0; i <= capN; i++) {
    const a = axisAng - Math.PI / 2 + (Math.PI * i) / capN;
    const rr = R * jit();
    pts.push([rf.bx + Math.cos(a) * rr, rf.by + Math.sin(a) * rr]);
  }
  const sideN = Math.max(1, Math.round(len / 30));
  for (let j = 1; j < sideN; j++) {
    const t = 1 - j / sideN;
    const rr = R * jit(0.22);
    pts.push([rf.ax + ux * len * t + nx * rr, rf.ay + uy * len * t + ny * rr]);
  }
  for (let i = 0; i <= capN; i++) {
    const a = axisAng + Math.PI / 2 + (Math.PI * i) / capN;
    const rr = R * jit();
    pts.push([rf.ax + Math.cos(a) * rr, rf.ay + Math.sin(a) * rr]);
  }
  for (let j = 1; j < sideN; j++) {
    const t = j / sideN;
    const rr = R * jit(0.22);
    pts.push([rf.ax + ux * len * t - nx * rr, rf.ay + uy * len * t - ny * rr]);
  }
  const K = Math.max(2, Math.round(len / 45) + 1);
  const ridge = [];
  for (let k = 0; k < K; k++) {
    const t = 0.06 + (0.88 * k) / (K - 1);
    const lat = (rng.next() - 0.5) * 0.4 * R;
    ridge.push([rf.ax + ux * len * t + nx * lat, rf.ay + uy * len * t + ny * lat, R * (0.85 + rng.next() * 0.45)]);
  }
  const P = pts.map((p) => [p[0], p[1], 0]);
  const kOf = pts.map((p) => {
    const tp = ((p[0] - rf.ax) * ux + (p[1] - rf.ay) * uy) / len;
    let best = 0;
    let bd = Infinity;
    for (let k = 0; k < K; k++) {
      const tk = 0.06 + (0.88 * k) / (K - 1);
      const d = Math.abs(tk - tp);
      if (d < bd) {
        bd = d;
        best = k;
      }
    }
    return best;
  });
  const tris = [];
  for (let i = 0; i < P.length; i++) {
    const j = (i + 1) % P.length;
    let ki = kOf[i];
    const kj = kOf[j];
    tris.push([P[i], P[j], ridge[ki]]);
    while (ki !== kj) {
      const kn = ki + Math.sign(kj - ki);
      tris.push([P[j], ridge[ki], ridge[kn]]);
      ki = kn;
    }
  }

  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  for (const p of pts) {
    minX = Math.min(minX, p[0]);
    minY = Math.min(minY, p[1]);
    maxX = Math.max(maxX, p[0]);
    maxY = Math.max(maxY, p[1]);
  }
  const pad = 40;
  const S = SPRITE_SCALE;
  const c = makeCanvas((maxX - minX + pad * 2) * S, (maxY - minY + pad * 2) * S);
  const ctx = c.getContext('2d');
  ctx.setTransform(S, 0, 0, S, -(minX - pad) * S, -(minY - pad) * S);

  ctx.save();
  polyPath(ctx, pts);
  ctx.fillStyle = 'rgb(14,16,20)';
  ctx.shadowColor = 'rgba(0,0,0,0.42)';
  ctx.shadowBlur = 26 * S;
  ctx.fill();
  ctx.shadowColor = 'rgba(0,0,0,0.6)';
  ctx.shadowBlur = 12 * S;
  ctx.shadowOffsetX = 9 * S;
  ctx.shadowOffsetY = 13 * S;
  ctx.fill();
  ctx.restore();

  const base = mix3(COLOR_ROCK, [0.3, 0.27, 0.25], 0.2);
  drawMesh(ctx, tris, base, rng, { shadeMin: 0.34, shadeK: 0.95, varK: 0.16, seamAlpha: 0.2 });

  ctx.beginPath();
  ctx.moveTo(ridge[0][0], ridge[0][1]);
  for (let k = 1; k < K; k++) ctx.lineTo(ridge[k][0], ridge[k][1]);
  ctx.strokeStyle = 'rgba(205,215,228,0.12)';
  ctx.lineWidth = 1.3;
  ctx.stroke();

  polyPath(ctx, pts);
  ctx.strokeStyle = 'rgba(4,6,9,0.7)';
  ctx.lineWidth = 1.4;
  ctx.stroke();
  ctx.save();
  polyPath(ctx, pts);
  ctx.clip();
  ctx.translate(1.4, 1.8);
  polyPath(ctx, pts);
  ctx.strokeStyle = 'rgba(190,205,218,0.2)';
  ctx.lineWidth = 2.2;
  ctx.stroke();
  ctx.restore();

  ctx.save();
  polyPath(ctx, pts);
  ctx.clip();
  for (let k = 0; k < 90; k++) {
    const x = minX + rng.next() * (maxX - minX);
    const y = minY + rng.next() * (maxY - minY);
    ctx.fillStyle = rng.next() < 0.5 ? 'rgba(220,225,232,0.07)' : 'rgba(0,0,0,0.12)';
    ctx.fillRect(x, y, 0.8, 0.8);
  }
  const lichen = [
    [0.45, 0.55, 0.38],
    [0.6, 0.53, 0.32],
    [0.38, 0.5, 0.44],
  ];
  const clusters = 7 + Math.floor(rng.next() * 5);
  for (let cI = 0; cI < clusters; cI++) {
    const ei = Math.floor(rng.next() * pts.length);
    const p0 = pts[ei];
    const p1 = pts[(ei + 1) % pts.length];
    const t = rng.next();
    const ex = p0[0] + (p1[0] - p0[0]) * t;
    const ey = p0[1] + (p1[1] - p0[1]) * t;
    const midX = (rf.ax + rf.bx) * 0.5;
    const midY = (rf.ay + rf.by) * 0.5;
    const tx = midX - ex;
    const ty = midY - ey;
    const tl = Math.hypot(tx, ty) || 1;
    const col = lichen[Math.floor(rng.next() * lichen.length)];
    const dots = 3 + Math.floor(rng.next() * 5);
    for (let d = 0; d < dots; d++) {
      const inw = 1.5 + rng.next() * 6;
      const jx = (rng.next() - 0.5) * 7;
      const jy = (rng.next() - 0.5) * 7;
      ctx.fillStyle = rgbCss(col, 0.45 + rng.next() * 0.35);
      ctx.beginPath();
      ctx.arc(ex + (tx / tl) * inw + jx, ey + (ty / tl) * inw + jy, 0.6 + rng.next() * 1.6, 0, TAU);
      ctx.fill();
    }
  }
  ctx.restore();

  return { canvas: c, x: minX - pad, y: minY - pad, w: maxX - minX + pad * 2, h: maxY - minY + pad * 2, pts };
}

// ---------------------------------------------------------------------------------------------
// Matter: archetype drawers (sprite context centred at 0,0; units = world px)
// ---------------------------------------------------------------------------------------------
export function matterStyle(o) {
  const a = o.archetype;
  if (a === 'sanctuaryBerry' || a === 'wildCore' || a === 'geode' || a === 'boulder' || a === 'emberMineral') return a;
  if ((o.burnDamage || 0) > 0) return 'emberMineral';
  if ((o.shelterStrength || 0) >= 0.45 || (o.mass || 0) >= 3.2) return 'boulder';
  if (o.breakable) return 'geode';
  if (o.edible) return (o.energyGain || 0) >= 0.3 ? 'wildCore' : 'sanctuaryBerry';
  return 'pebble';
}

function setObjShadow(ctx, r) {
  ctx.shadowColor = 'rgba(0,0,0,0.5)';
  ctx.shadowBlur = (r * 0.3 + 3) * SPRITE_SCALE;
  ctx.shadowOffsetX = (r * 0.16 + 2) * SPRITE_SCALE;
  ctx.shadowOffsetY = (r * 0.22 + 2.5) * SPRITE_SCALE;
}
function clearShadow(ctx) {
  ctx.shadowColor = 'rgba(0,0,0,0)';
  ctx.shadowBlur = 0;
  ctx.shadowOffsetX = 0;
  ctx.shadowOffsetY = 0;
}

function drawBerry(ctx, o, rng) {
  const r = o.radius;
  const rgb = o.rgb;
  const pts = [];
  const ph = rng.next() * TAU;
  for (let i = 0; i < 16; i++) {
    const a = (i / 16) * TAU;
    const k = 1 + 0.06 * Math.sin(a * 3 + ph) + 0.03 * Math.sin(a * 5 + ph * 2);
    pts.push([Math.cos(a) * r * k, Math.sin(a) * r * k * 1.04]);
  }
  ctx.save();
  setObjShadow(ctx, r);
  smoothClosedPath(ctx, pts);
  ctx.fillStyle = rgbCss(darken(rgb, 0.3), 0.9);
  ctx.fill();
  ctx.restore();
  const g = ctx.createRadialGradient(-r * 0.3, -r * 0.35, r * 0.08, 0, 0, r * 1.1);
  g.addColorStop(0, rgbCss(lighten(rgb, 0.5), 0.96));
  g.addColorStop(0.55, rgbCss(rgb, 0.86));
  g.addColorStop(1, rgbCss(darken(rgb, 0.45), 0.92));
  smoothClosedPath(ctx, pts);
  ctx.fillStyle = g;
  ctx.fill();
  ctx.strokeStyle = rgbCss(lighten(rgb, 0.55), 0.5);
  ctx.lineWidth = 0.7;
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(0, 0, r * 0.74, 0, TAU);
  ctx.strokeStyle = rgbCss(lighten(rgb, 0.6), 0.16);
  ctx.lineWidth = 0.8;
  ctx.stroke();
  ctx.save();
  ctx.translate(r * 0.12, r * 0.12);
  ctx.rotate(rng.next() * TAU);
  ctx.beginPath();
  ctx.ellipse(0, 0, r * 0.32, r * 0.2, 0, 0, TAU);
  ctx.fillStyle = rgbCss(darken(rgb, 0.62), 0.72);
  ctx.fill();
  ctx.beginPath();
  ctx.ellipse(-r * 0.08, -r * 0.05, r * 0.1, r * 0.05, 0, 0, TAU);
  ctx.fillStyle = 'rgba(255,255,255,0.22)';
  ctx.fill();
  ctx.restore();
  ctx.beginPath();
  ctx.ellipse(-r * 0.36, -r * 0.42, r * 0.26, r * 0.14, -0.6, 0, TAU);
  ctx.fillStyle = 'rgba(255,255,255,0.5)';
  ctx.fill();
}

function drawWildCore(ctx, o, rng) {
  const r = o.radius;
  const rgb = o.rgb;
  const n = 7 + Math.floor(rng.next() * 3);
  const crown = starMesh(r, n, 1.22, 0.68, 0.95, rng, 0.2);
  ctx.save();
  setObjShadow(ctx, r);
  polyPath(ctx, crown.outline);
  ctx.fillStyle = rgbCss(darken(rgb, 0.6), 1);
  ctx.fill();
  ctx.restore();
  drawMesh(ctx, crown.tris, mix3(darken(rgb, 0.25), [0.2, 0.18, 0.2], 0.25), rng, { shadeMin: 0.35, shadeK: 0.95, varK: 0.12, seamAlpha: 0.22 });
  polyPath(ctx, crown.outline);
  ctx.strokeStyle = rgbCss(lighten(rgb, 0.35), 0.35);
  ctx.lineWidth = 0.6;
  ctx.stroke();
  const gem = starMesh(r * 0.55, n, 1, 0.82, 0.8, rng, 0.05);
  drawMesh(ctx, gem.tris, lighten(rgb, 0.12), rng, { shadeMin: 0.55, shadeK: 0.65, varK: 0.08, seamAlpha: 0.12 });
}

function drawGeode(ctx, o, rng) {
  const r = o.radius;
  const rgb = o.rgb;
  const hp = clamp(Number.isFinite(o.hp) ? o.hp : 1, 0, 1);
  const stone = mix3([0.3, 0.29, 0.31], rgb, 0.42);
  const mesh = domeMesh(r, 11, 0.2, 0.8, rng, 0.55);
  ctx.save();
  setObjShadow(ctx, r);
  polyPath(ctx, mesh.outer);
  ctx.fillStyle = rgbCss(darken(stone, 0.5), 1);
  ctx.fill();
  ctx.restore();
  drawMesh(ctx, mesh.tris, stone, rng, { shadeMin: 0.36, shadeK: 0.9, varK: 0.14, seamAlpha: 0.22 });
  polyPath(ctx, mesh.outer);
  ctx.strokeStyle = 'rgba(6,6,8,0.6)';
  ctx.lineWidth = 1;
  ctx.stroke();
  const cracks = [];
  for (let k = 0; k < 7; k++) {
    const a = rng.next() * TAU;
    const pts = [[Math.cos(a) * r * 0.98, Math.sin(a) * r * 0.98]];
    const segs = 3 + Math.floor(rng.next() * 2);
    const lenK = 0.5 + rng.next() * 0.45;
    for (let s = 1; s <= segs; s++) {
      const t = 1 - (s / segs) * lenK;
      const ja = a + (rng.next() - 0.5) * 0.7;
      pts.push([Math.cos(ja) * r * t, Math.sin(ja) * r * t]);
    }
    cracks.push(pts);
  }
  const shown = 1 + Math.round((1 - hp) * 6);
  for (let k = 0; k < shown; k++) {
    const pts = cracks[k];
    ctx.beginPath();
    ctx.moveTo(pts[0][0], pts[0][1]);
    for (let s = 1; s < pts.length; s++) ctx.lineTo(pts[s][0], pts[s][1]);
    ctx.strokeStyle = 'rgba(8,6,8,0.78)';
    ctx.lineWidth = 0.9 + (1 - hp) * 0.9;
    ctx.stroke();
    ctx.strokeStyle = rgbCss(lighten(rgb, 0.25), 0.3 + (1 - hp) * 0.55);
    ctx.lineWidth = 0.5;
    ctx.stroke();
  }
  const open = hp < 0.999 ? r * (0.2 + (1 - hp) * 0.42) : r * 0.12;
  const ox = r * 0.08;
  const oy = r * 0.06;
  const hole = [];
  const hn = 9;
  for (let i = 0; i < hn; i++) {
    const a = (i / hn) * TAU + rng.next() * 0.3;
    const rr = open * (0.7 + rng.next() * 0.5);
    hole.push([ox + Math.cos(a) * rr, oy + Math.sin(a) * rr]);
  }
  polyPath(ctx, hole);
  ctx.fillStyle = rgbCss(darken(rgb, 0.62), 0.95);
  ctx.fill();
  ctx.save();
  polyPath(ctx, hole);
  ctx.clip();
  const cn = 10;
  for (let i = 0; i < cn; i++) {
    const a = (i / cn) * TAU + rng.next() * 0.4;
    const tx = ox + Math.cos(a) * open * (0.1 + rng.next() * 0.35);
    const ty = oy + Math.sin(a) * open * (0.1 + rng.next() * 0.35);
    const w = 0.35;
    ctx.beginPath();
    ctx.moveTo(ox + Math.cos(a - w) * open * 1.2, oy + Math.sin(a - w) * open * 1.2);
    ctx.lineTo(tx, ty);
    ctx.lineTo(ox + Math.cos(a + w) * open * 1.2, oy + Math.sin(a + w) * open * 1.2);
    ctx.closePath();
    const sh = 0.15 + 0.45 * Math.max(0, Math.cos(a + 2.3));
    ctx.fillStyle = rgbCss(lighten(rgb, sh), 0.92);
    ctx.fill();
    ctx.strokeStyle = rgbCss(darken(rgb, 0.4), 0.4);
    ctx.lineWidth = 0.35;
    ctx.stroke();
  }
  ctx.restore();
  polyPath(ctx, hole);
  ctx.strokeStyle = 'rgba(5,4,6,0.7)';
  ctx.lineWidth = 0.8;
  ctx.stroke();
}

function drawBoulder(ctx, o, rng, soft = 1) {
  const r = o.radius;
  const rgb = o.rgb;
  const stone = mix3([0.25, 0.25, 0.27], rgb, 0.36);
  const mesh = domeMesh(r, 13, 0.1, 0.9, rng, 0.58);
  ctx.save();
  setObjShadow(ctx, r);
  ctx.shadowBlur = (r * 0.45 + 4) * SPRITE_SCALE;
  smoothClosedPath(ctx, mesh.outer);
  ctx.fillStyle = rgbCss(darken(stone, 0.45), 1);
  ctx.fill();
  ctx.restore();
  ctx.save();
  smoothClosedPath(ctx, mesh.outer);
  ctx.clip();
  drawMesh(ctx, mesh.tris, stone, rng, { shadeMin: 0.42, shadeK: 0.72 * soft, varK: 0.1, seamAlpha: 0.1 });
  const g = ctx.createRadialGradient(-r * 0.35, -r * 0.4, r * 0.1, 0, 0, r * 1.05);
  g.addColorStop(0, 'rgba(255,255,255,0.12)');
  g.addColorStop(0.6, 'rgba(0,0,0,0)');
  g.addColorStop(1, 'rgba(0,0,0,0.35)');
  ctx.fillStyle = g;
  ctx.fillRect(-r * 1.2, -r * 1.2, r * 2.4, r * 2.4);
  for (let k = 0; k < 26; k++) {
    const a = -2.3 + (rng.next() - 0.5) * 2.2;
    const d = r * (0.35 + rng.next() * 0.6);
    const mossy = rng.next() < 0.7;
    ctx.fillStyle = mossy
      ? rgbCss([0.36 + rng.next() * 0.12, 0.47 + rng.next() * 0.1, 0.32], 0.4 + rng.next() * 0.3)
      : 'rgba(225,220,205,0.18)';
    ctx.beginPath();
    ctx.arc(Math.cos(a) * d, Math.sin(a) * d, 0.6 + rng.next() * (mossy ? 2.2 : 0.8), 0, TAU);
    ctx.fill();
  }
  ctx.restore();
  smoothClosedPath(ctx, mesh.outer);
  ctx.strokeStyle = 'rgba(5,6,8,0.6)';
  ctx.lineWidth = 1.1;
  ctx.stroke();
}

function drawEmber(ctx, o, rng) {
  const r = o.radius;
  const rgb = o.rgb;
  const n = 9 + Math.floor(rng.next() * 4);
  const mesh = starMesh(r, n, 1.18, 0.66, 1.0, rng, 0.35);
  ctx.save();
  setObjShadow(ctx, r);
  polyPath(ctx, mesh.outline);
  ctx.fillStyle = 'rgb(10,8,9)';
  ctx.fill();
  ctx.restore();
  const obs = mix3([0.12, 0.1, 0.11], rgb, 0.14);
  drawMesh(ctx, mesh.tris, obs, rng, { shadeMin: 0.45, shadeK: 1.4, varK: 0.2, seamAlpha: 0.3 });
  ctx.save();
  ctx.lineCap = 'round';
  ctx.shadowColor = rgbCss(rgb, 0.8);
  ctx.shadowBlur = 3 * SPRITE_SCALE;
  const fn = 4 + Math.floor(rng.next() * 3);
  for (let k = 0; k < fn; k++) {
    let a = rng.next() * TAU;
    let x = Math.cos(a) * r * 0.12;
    let y = Math.sin(a) * r * 0.12;
    ctx.beginPath();
    ctx.moveTo(x, y);
    const segs = 3;
    for (let s = 1; s <= segs; s++) {
      a += (rng.next() - 0.5) * 0.8;
      const d = (r * 0.8 * s) / segs;
      x = Math.cos(a) * d;
      y = Math.sin(a) * d;
      ctx.lineTo(x, y);
    }
    ctx.strokeStyle = rgbCss(lighten(rgb, 0.3), 0.85);
    ctx.lineWidth = 1.05;
    ctx.stroke();
  }
  ctx.restore();
  const g = ctx.createRadialGradient(0, 0, 0, 0, 0, r * 0.45);
  g.addColorStop(0, rgbCss(lighten(rgb, 0.65), 0.85));
  g.addColorStop(1, rgbCss(rgb, 0));
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.arc(0, 0, r * 0.45, 0, TAU);
  ctx.fill();
}

function drawPebble(ctx, o, rng) {
  const r = o.radius;
  const rgb = o.rgb;
  const mesh = domeMesh(r, 10, 0.16, 0.7, rng, 0.55);
  ctx.save();
  setObjShadow(ctx, r);
  smoothClosedPath(ctx, mesh.outer);
  ctx.fillStyle = rgbCss(darken(rgb, 0.5), 1);
  ctx.fill();
  ctx.restore();
  ctx.save();
  smoothClosedPath(ctx, mesh.outer);
  ctx.clip();
  drawMesh(ctx, mesh.tris, mix3(rgb, [0.3, 0.3, 0.32], 0.25), rng, { shadeMin: 0.45, shadeK: 0.7, varK: 0.08, seamAlpha: 0.08 });
  ctx.restore();
  smoothClosedPath(ctx, mesh.outer);
  ctx.strokeStyle = 'rgba(5,6,8,0.55)';
  ctx.lineWidth = 0.9;
  ctx.stroke();
}

function drawMatterBody(ctx, o) {
  const rng = createRng((Math.floor((o.shapeSeed || 1) * 1009) + 7) >>> 0);
  const st = matterStyle(o);
  if (st === 'sanctuaryBerry') drawBerry(ctx, o, rng);
  else if (st === 'wildCore') drawWildCore(ctx, o, rng);
  else if (st === 'geode') drawGeode(ctx, o, rng);
  else if (st === 'boulder') drawBoulder(ctx, o, rng);
  else if (st === 'emberMineral') drawEmber(ctx, o, rng);
  else drawPebble(ctx, o, rng);
}

function spriteKey(o) {
  const hp = o.breakable ? Math.round(clamp(o.hp ?? 1, 0, 1) * 6) : 6;
  return `${o.id}|${o.archetype}|${rgbHex(o.rgb)}|${o.radius.toFixed(2)}|${hp}|${o.edible ? 1 : 0}${o.breakable ? 1 : 0}${(o.burnDamage || 0) > 0 ? 1 : 0}${(o.shelterStrength || 0).toFixed(2)}|${(o.mass || 0).toFixed(1)}|${(o.energyGain || 0).toFixed(2)}`;
}

function buildObjectSprite(o) {
  const E = o.radius * 1.5 + 14;
  const S = SPRITE_SCALE;
  const c = makeCanvas(E * 2 * S, E * 2 * S);
  const ctx = c.getContext('2d');
  ctx.setTransform(S, 0, 0, S, E * S, E * S);
  drawMatterBody(ctx, o);
  clearShadow(ctx);
  return { canvas: c, E };
}

// ---------------------------------------------------------------------------------------------
// Multi-segment organic creatures & Player (using real 5-node spine + tracking gaze eyes + LOD)
// ---------------------------------------------------------------------------------------------
const PROFILE = {
  scout: [0.98, 0.84, 0.62, 0.4, 0.2],
  ram: [1.05, 1.0, 0.86, 0.62, 0.36],
  player: [1.0, 0.9, 0.72, 0.5, 0.28],
};

function bodyFrame(a, kind) {
  const sp = a.spine && a.spine.length >= 2 ? a.spine : null;
  const prof = PROFILE[kind] || PROFILE.scout;
  const n = sp ? sp.length : 5;
  const R = a.r;
  const breath = 1 + 0.045 * Math.sin(a.breathPhase || 0);
  const speed = Math.hypot(a.vx || 0, a.vy || 0);
  const amp = R * 0.1 * clamp(speed / 2, 0.25, 1);
  const P = [];
  const D = [];
  const Nn = [];
  const Wd = [];
  for (let i = 0; i < n; i++) {
    let px, py;
    if (sp) {
      px = sp[i].x;
      py = sp[i].y;
    } else {
      px = a.x - Math.cos(a.theta) * i * R * 0.62;
      py = a.y - Math.sin(a.theta) * i * R * 0.62;
    }
    let dx, dy;
    if (i === 0) {
      dx = Math.cos(a.theta);
      dy = Math.sin(a.theta);
    } else {
      dx = P[i - 1][0] - px;
      dy = P[i - 1][1] - py;
      const l = Math.hypot(dx, dy);
      if (l < 1e-4) {
        dx = D[i - 1][0];
        dy = D[i - 1][1];
      } else {
        dx /= l;
        dy /= l;
      }
    }
    const nx = -dy;
    const ny = dx;
    const wave = Math.sin((a.breathPhase || 0) * 2.2 - i * 1.1) * amp * (i / Math.max(1, n - 1));
    P.push([px + nx * wave, py + ny * wave]);
    D.push([dx, dy]);
    Nn.push([nx, ny]);
    Wd.push(prof[Math.min(i, prof.length - 1)] * R * breath);
  }
  return { P, D, N: Nn, W: Wd, n };
}

function bodyOutline(f, noseK, tailK) {
  const { P, D, N, W, n } = f;
  const pts = [];
  pts.push([P[0][0] + D[0][0] * W[0] * noseK, P[0][1] + D[0][1] * W[0] * noseK]);
  pts.push([P[0][0] + D[0][0] * W[0] * 0.72 + N[0][0] * W[0] * 0.74, P[0][1] + D[0][1] * W[0] * 0.72 + N[0][1] * W[0] * 0.74]);
  for (let i = 0; i < n; i++) pts.push([P[i][0] + N[i][0] * W[i], P[i][1] + N[i][1] * W[i]]);
  const t = n - 1;
  pts.push([P[t][0] - D[t][0] * W[t] * tailK, P[t][1] - D[t][1] * W[t] * tailK]);
  for (let i = n - 1; i >= 0; i--) pts.push([P[i][0] - N[i][0] * W[i], P[i][1] - N[i][1] * W[i]]);
  pts.push([P[0][0] + D[0][0] * W[0] * 0.72 - N[0][0] * W[0] * 0.74, P[0][1] + D[0][1] * W[0] * 0.72 - N[0][1] * W[0] * 0.74]);
  return pts;
}

function lightGradient(ctx, cx, cy, R, light, shade) {
  const g = ctx.createLinearGradient(cx + LIGHT[0] * R, cy + LIGHT[1] * R, cx - LIGHT[0] * R, cy - LIGHT[1] * R);
  g.addColorStop(0, rgbCss(light, 1));
  g.addColorStop(1, rgbCss(shade, 1));
  return g;
}

function drawEyes(ctx, f, lookAng, o) {
  const P0 = f.P[0];
  const D0 = f.D[0];
  const N0 = f.N[0];
  const w0 = f.W[0];
  const er = w0 * o.er;
  const lx = Math.cos(lookAng);
  const ly = Math.sin(lookAng);
  for (const s of [-1, 1]) {
    const ex = P0[0] + D0[0] * w0 * o.fwd + N0[0] * w0 * o.side * s;
    const ey = P0[1] + D0[1] * w0 * o.fwd + N0[1] * w0 * o.side * s;
    ctx.beginPath();
    ctx.arc(ex, ey, er, 0, TAU);
    ctx.fillStyle = o.sclera;
    ctx.fill();
    ctx.strokeStyle = 'rgba(8,8,10,0.65)';
    ctx.lineWidth = Math.max(0.4, er * 0.16);
    ctx.stroke();
    if (o.detail) {
      const ix = ex + lx * er * 0.32;
      const iy = ey + ly * er * 0.32;
      const g = ctx.createRadialGradient(ix, iy, 0, ix, iy, er * 0.64);
      g.addColorStop(0, rgbCss(lighten(o.iris, 0.25), 1));
      g.addColorStop(1, rgbCss(darken(o.iris, 0.35), 1));
      ctx.beginPath();
      ctx.arc(ix, iy, er * 0.62, 0, TAU);
      ctx.fillStyle = g;
      ctx.fill();
    }
    ctx.beginPath();
    ctx.arc(ex + lx * er * 0.42, ey + ly * er * 0.42, er * 0.33, 0, TAU);
    ctx.fillStyle = 'rgb(9,9,13)';
    ctx.fill();
    if (o.detail) {
      ctx.beginPath();
      ctx.arc(ex - er * 0.3, ey - er * 0.34, er * 0.17, 0, TAU);
      ctx.fillStyle = 'rgba(255,255,255,0.82)';
      ctx.fill();
    }
  }
}

function spinePath(ctx, f, from = 0, to = f.n - 1) {
  ctx.beginPath();
  ctx.moveTo(f.P[from][0], f.P[from][1]);
  for (let i = from + 1; i <= to; i++) {
    const p = f.P[i - 1];
    const q = f.P[i];
    ctx.quadraticCurveTo(p[0], p[1], (p[0] + q[0]) * 0.5, (p[1] + q[1]) * 0.5);
  }
  ctx.lineTo(f.P[to][0], f.P[to][1]);
}

function drawCreature(ctx, a, kind, opts) {
  const f = bodyFrame(a, kind);
  const zoom = opts.zoom;
  const detail = zoom > 0.55;
  const lod = zoom > LOD_ZOOM;
  const bp = a.breathPhase || 0;
  const noseK = kind === 'scout' ? 1.3 : kind === 'ram' ? 1.0 : 1.12;
  const tailK = kind === 'scout' ? 1.9 : kind === 'ram' ? 1.2 : 1.6;
  const outline = bodyOutline(f, noseK, tailK);
  const R = a.r;
  const P = f.P;
  const D = f.D;
  const N = f.N;
  const W = f.W;
  const tail = f.n - 1;
  const tailTip = [P[tail][0] - D[tail][0] * W[tail] * tailK, P[tail][1] - D[tail][1] * W[tail] * tailK];
  const baseRgb = a.rgb || (kind === 'ram' ? [0.34, 0.42, 0.84] : kind === 'player' ? [0.64, 0.9, 0.24] : [0.92, 0.89, 0.82]);

  // 1. Soft seabed shadow
  ctx.save();
  ctx.translate(R * 0.22 + 1.5, R * 0.3 + 2);
  smoothClosedPath(ctx, outline);
  ctx.fillStyle = 'rgba(0,0,0,0.32)';
  ctx.fill();
  ctx.restore();

  // 2. Appendages / fins beneath body
  if (kind === 'scout') {
    const ivory = lighten(baseRgb, 0.15);
    const ta = Math.atan2(-D[tail][1], -D[tail][0]);
    const wv = Math.sin(bp * 2.2 - 4.4) * 0.42;
    const L = R * 1.22;
    ctx.beginPath();
    ctx.moveTo(tailTip[0], tailTip[1]);
    for (const s of [-1, 1]) {
      const aa = ta + wv + s * 0.55;
      const mx = tailTip[0] + Math.cos(ta + wv + s * 0.2) * L * 0.6;
      const my = tailTip[1] + Math.sin(ta + wv + s * 0.2) * L * 0.6;
      ctx.quadraticCurveTo(mx, my, tailTip[0] + Math.cos(aa) * L, tailTip[1] + Math.sin(aa) * L);
      ctx.lineTo(tailTip[0] + Math.cos(ta + wv) * L * 0.55, tailTip[1] + Math.sin(ta + wv) * L * 0.55);
    }
    ctx.closePath();
    ctx.fillStyle = rgbCss(ivory, 0.42);
    ctx.fill();
    if (detail) {
      ctx.strokeStyle = rgbCss(ivory, 0.3);
      ctx.lineWidth = 0.5;
      for (let k = -2; k <= 2; k++) {
        const aa = ta + wv + k * 0.22;
        ctx.beginPath();
        ctx.moveTo(tailTip[0], tailTip[1]);
        ctx.lineTo(tailTip[0] + Math.cos(aa) * L * 0.9, tailTip[1] + Math.sin(aa) * L * 0.9);
        ctx.stroke();
      }
    }
    // Delicate pectoral fins
    for (const s of [-1, 1]) {
      const bx = P[1][0] + N[1][0] * W[1] * 0.8 * s;
      const by = P[1][1] + N[1][1] * W[1] * 0.8 * s;
      const back = Math.atan2(-D[1][1], -D[1][0]);
      const flap = Math.sin(bp * 2.5 + (s > 0 ? 0 : 1.1)) * 0.28;
      const ang = back + s * (0.85 + flap);
      const fl = R * 0.92;
      ctx.beginPath();
      ctx.moveTo(bx, by);
      ctx.quadraticCurveTo(
        bx + Math.cos(ang - s * 0.35) * fl * 0.65,
        by + Math.sin(ang - s * 0.35) * fl * 0.65,
        bx + Math.cos(ang) * fl,
        by + Math.sin(ang) * fl
      );
      ctx.quadraticCurveTo(
        bx + Math.cos(ang + s * 0.25) * fl * 0.45,
        by + Math.sin(ang + s * 0.25) * fl * 0.45,
        P[2][0] + N[2][0] * W[2] * 0.72 * s,
        P[2][1] + N[2][1] * W[2] * 0.72 * s
      );
      ctx.closePath();
      ctx.fillStyle = rgbCss(ivory, 0.35);
      ctx.fill();
    }
    // Sensory antennae in front
    for (const s of [-1, 1]) {
      const sx = P[0][0] + D[0][0] * W[0] * 0.85 + N[0][0] * W[0] * 0.42 * s;
      const sy = P[0][1] + D[0][1] * W[0] * 0.85 + N[0][1] * W[0] * 0.42 * s;
      const sway = Math.sin(bp * 1.9 + s * 0.9) * 0.16;
      const a0 = a.theta + s * 0.42 + sway;
      const al = R * 0.95;
      ctx.beginPath();
      ctx.moveTo(sx, sy);
      ctx.quadraticCurveTo(
        sx + Math.cos(a0 - s * 0.2) * al * 0.55,
        sy + Math.sin(a0 - s * 0.2) * al * 0.55,
        sx + Math.cos(a0) * al,
        sy + Math.sin(a0) * al
      );
      ctx.strokeStyle = rgbCss(lighten(baseRgb, 0.3), 0.65);
      ctx.lineWidth = 0.85;
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(sx + Math.cos(a0) * al, sy + Math.sin(a0) * al, 1.35, 0, TAU);
      ctx.fillStyle = rgbCss(lighten(baseRgb, 0.45), 0.85);
      ctx.fill();
    }
  } else if (kind === 'ram') {
    // Broad fluke tail + stout stabilizer fins
    const finCol = darken(baseRgb, 0.22);
    const ta = Math.atan2(-D[tail][1], -D[tail][0]);
    const wv = Math.sin(bp * 1.8 - 3.6) * 0.26;
    const L = R * 0.85;
    ctx.beginPath();
    ctx.moveTo(tailTip[0], tailTip[1]);
    ctx.lineTo(tailTip[0] + Math.cos(ta + wv - 0.65) * L, tailTip[1] + Math.sin(ta + wv - 0.65) * L);
    ctx.lineTo(tailTip[0] + Math.cos(ta + wv) * L * 0.45, tailTip[1] + Math.sin(ta + wv) * L * 0.45);
    ctx.lineTo(tailTip[0] + Math.cos(ta + wv + 0.65) * L, tailTip[1] + Math.sin(ta + wv + 0.65) * L);
    ctx.closePath();
    ctx.fillStyle = rgbCss(finCol, 0.68);
    ctx.fill();
    for (const s of [-1, 1]) {
      const bx = P[1][0] + N[1][0] * W[1] * 0.85 * s;
      const by = P[1][1] + N[1][1] * W[1] * 0.85 * s;
      const back = Math.atan2(-D[1][1], -D[1][0]);
      const ang = back + s * (1.05 + Math.sin(bp * 1.7) * 0.14);
      ctx.beginPath();
      ctx.moveTo(bx, by);
      ctx.lineTo(bx + Math.cos(ang) * R * 0.62, by + Math.sin(ang) * R * 0.62);
      ctx.lineTo(P[2][0] + N[2][0] * W[2] * 0.82 * s, P[2][1] + N[2][1] * W[2] * 0.82 * s);
      ctx.closePath();
      ctx.fillStyle = rgbCss(finCol, 0.72);
      ctx.fill();
    }
  } else {
    // Player organic mossy tail & subtle side fins
    const ta = Math.atan2(-D[tail][1], -D[tail][0]);
    const wv = Math.sin(bp * 2.1 - 3.8) * 0.32;
    const L = R * 1.05;
    ctx.beginPath();
    ctx.moveTo(tailTip[0], tailTip[1]);
    ctx.quadraticCurveTo(
      tailTip[0] + Math.cos(ta + wv - 0.4) * L * 0.6,
      tailTip[1] + Math.sin(ta + wv - 0.4) * L * 0.6,
      tailTip[0] + Math.cos(ta + wv - 0.5) * L,
      tailTip[1] + Math.sin(ta + wv - 0.5) * L
    );
    ctx.lineTo(tailTip[0] + Math.cos(ta + wv) * L * 0.52, tailTip[1] + Math.sin(ta + wv) * L * 0.52);
    ctx.lineTo(tailTip[0] + Math.cos(ta + wv + 0.5) * L, tailTip[1] + Math.sin(ta + wv + 0.5) * L);
    ctx.closePath();
    ctx.fillStyle = rgbCss(lighten(baseRgb, 0.12), 0.52);
    ctx.fill();
  }

  // 3. Main organic body envelope
  smoothClosedPath(ctx, outline);
  ctx.fillStyle = lightGradient(ctx, P[0][0], P[0][1], R * 1.65, lighten(baseRgb, 0.22), darken(baseRgb, 0.36));
  ctx.fill();
  ctx.strokeStyle = rgbCss(darken(baseRgb, 0.58), 0.82);
  ctx.lineWidth = kind === 'ram' ? 1.35 : 0.95;
  ctx.stroke();

  // 4. Species carapace / dorsal anatomy + LOD detail
  if (kind === 'ram') {
    // Hardened cobalt prow beak
    const prow = [
      [P[0][0] + D[0][0] * W[0] * 1.24, P[0][1] + D[0][1] * W[0] * 1.24],
      [P[0][0] + D[0][0] * W[0] * 0.55 + N[0][0] * W[0] * 0.68, P[0][1] + D[0][1] * W[0] * 0.55 + N[0][1] * W[0] * 0.68],
      [P[0][0] + D[0][0] * W[0] * 0.28, P[0][1] + D[0][1] * W[0] * 0.28],
      [P[0][0] + D[0][0] * W[0] * 0.55 - N[0][0] * W[0] * 0.68, P[0][1] + D[0][1] * W[0] * 0.55 - N[0][1] * W[0] * 0.68],
    ];
    polyPath(ctx, prow);
    ctx.fillStyle = rgbCss(lighten(baseRgb, 0.32), 0.85);
    ctx.fill();
    ctx.strokeStyle = rgbCss(darken(baseRgb, 0.55), 0.75);
    ctx.lineWidth = 0.85;
    ctx.stroke();

    // Ribbed carapace plates along spine segments 1..3
    for (let i = 1; i < f.n - 1; i++) {
      const pi = P[i];
      const di = D[i];
      const ni = N[i];
      const wi = W[i] * 0.86;
      ctx.beginPath();
      ctx.moveTo(pi[0] + ni[0] * wi, pi[1] + ni[1] * wi);
      ctx.quadraticCurveTo(pi[0] + di[0] * wi * 0.48, pi[1] + di[1] * wi * 0.48, pi[0] - ni[0] * wi, pi[1] - ni[1] * wi);
      ctx.strokeStyle = rgbCss(darken(baseRgb, 0.52), 0.72);
      ctx.lineWidth = 1.4;
      ctx.stroke();
      if (detail) {
        ctx.beginPath();
        ctx.moveTo(pi[0] + ni[0] * wi * 0.85 + di[0] * 1.1, pi[1] + ni[1] * wi * 0.85 + di[1] * 1.1);
        ctx.quadraticCurveTo(
          pi[0] + di[0] * (wi * 0.48 + 1.1),
          pi[1] + di[1] * (wi * 0.48 + 1.1),
          pi[0] - ni[0] * wi * 0.85 + di[0] * 1.1,
          pi[1] - ni[1] * wi * 0.85 + di[1] * 1.1
        );
        ctx.strokeStyle = rgbCss(lighten(baseRgb, 0.4), 0.36);
        ctx.lineWidth = 0.8;
        ctx.stroke();
      }
    }
  } else {
    // Subtle translucent dorsal ridge + internal bioluminescent energy core (stronger on zoom LOD!)
    spinePath(ctx, f, 0, f.n - 1);
    ctx.strokeStyle = rgbCss(lighten(baseRgb, 0.45), lod ? 0.42 : 0.24);
    ctx.lineWidth = lod ? 1.5 : 1.0;
    ctx.stroke();

    if (detail) {
      const coreE = clamp(a.energy ?? 0.7, 0.1, 1);
      const pulse = 0.88 + 0.12 * Math.sin(bp * 2.2);
      const cr = W[1] * (0.28 + 0.22 * coreE) * pulse;
      const cg = ctx.createRadialGradient(P[1][0], P[1][1], 0, P[1][0], P[1][1], cr * 1.7);
      const coreCol = kind === 'player' ? [0.85, 0.96, 0.55] : [0.95, 0.82, 0.52];
      cg.addColorStop(0, rgbCss(coreCol, (lod ? 0.78 : 0.45) * coreE));
      cg.addColorStop(1, rgbCss(coreCol, 0));
      ctx.fillStyle = cg;
      ctx.beginPath();
      ctx.arc(P[1][0], P[1][1], cr * 1.7, 0, TAU);
      ctx.fill();
    }
    if (lod) {
      // Fine transverse segment striation visible up close
      for (let i = 1; i < f.n - 1; i++) {
        const pi = P[i];
        const ni = N[i];
        const wi = W[i] * 0.65;
        ctx.beginPath();
        ctx.moveTo(pi[0] - ni[0] * wi, pi[1] - ni[1] * wi);
        ctx.lineTo(pi[0] + ni[0] * wi, pi[1] + ni[1] * wi);
        ctx.strokeStyle = rgbCss(darken(baseRgb, 0.45), 0.22);
        ctx.lineWidth = 0.7;
        ctx.stroke();
      }
    }
  }

  // 5. Subtle stress/damage feedback (organic amber/coral blush near head, never loud neon!)
  if ((a.stress || 0) > 0.28 || (a.integrity ?? 1) < 0.65) {
    const sAmt = Math.max(clamp((a.stress || 0) - 0.22, 0, 1), clamp(0.75 - (a.integrity ?? 1), 0, 1));
    ctx.beginPath();
    ctx.arc(P[0][0], P[0][1], W[0] * 1.25, 0, TAU);
    ctx.strokeStyle = `rgba(226,114,96,${(0.22 + 0.45 * sAmt).toFixed(2)})`;
    ctx.lineWidth = 1.2;
    ctx.stroke();
  }

  // 6. Real gaze eyes!
  const lookAng = kind === 'player' ? (a.aimAngle ?? a.theta) : a.theta + (a.gazeOffset || 0);
  drawEyes(ctx, f, lookAng, {
    fwd: kind === 'ram' ? 0.24 : 0.36,
    side: kind === 'ram' ? 0.56 : 0.52,
    er: kind === 'ram' ? 0.23 : 0.27,
    sclera: kind === 'ram' ? 'rgba(228,236,245,0.92)' : 'rgba(246,242,232,0.94)',
    iris: kind === 'ram' ? [0.76, 0.62, 0.28] : kind === 'player' ? [0.34, 0.66, 0.36] : [0.28, 0.56, 0.62],
    detail,
  });

  // 7. Player aim reticle & subtle identity ring
  if (kind === 'player') {
    const dashGlow = (a.dashActive || 0) > 0;
    ctx.beginPath();
    ctx.arc(a.x, a.y, R * 1.48, 0, TAU);
    ctx.strokeStyle = dashGlow ? 'rgba(218,242,132,0.72)' : 'rgba(176,222,94,0.34)';
    ctx.lineWidth = dashGlow ? 2.0 : 1.1;
    ctx.setLineDash([5, 5]);
    ctx.stroke();
    ctx.setLineDash([]);
    // Subtle forward aim tick toward cursor
    const aim = a.aimAngle ?? a.theta;
    const ax1 = a.x + Math.cos(aim) * (R * 1.65);
    const ay1 = a.y + Math.sin(aim) * (R * 1.65);
    const ax2 = a.x + Math.cos(aim) * (R * 2.25);
    const ay2 = a.y + Math.sin(aim) * (R * 2.25);
    ctx.beginPath();
    ctx.moveTo(ax1, ay1);
    ctx.lineTo(ax2, ay2);
    ctx.strokeStyle = 'rgba(212,240,140,0.6)';
    ctx.lineWidth = 1.5;
    ctx.stroke();
  }

  // 8. Selection halo & subtle ID badge when zoomed in or selected
  if (opts.selected) {
    ctx.beginPath();
    ctx.arc(a.x, a.y, R * 1.72, 0, TAU);
    ctx.strokeStyle = 'rgba(225,212,170,0.82)';
    ctx.lineWidth = 1.6 / Math.max(0.6, zoom * 0.7);
    ctx.setLineDash([6, 4]);
    ctx.stroke();
    ctx.setLineDash([]);
  }
  if (opts.selected || lod) {
    ctx.save();
    ctx.font = `${Math.max(9, Math.round(10 / Math.min(1.4, Math.max(0.75, zoom * 0.75))))}px "Segoe UI", system-ui, sans-serif`;
    ctx.textAlign = 'center';
    ctx.fillStyle = opts.selected ? 'rgba(244,236,214,0.92)' : 'rgba(216,224,228,0.58)';
    ctx.fillText(a.id, a.x, a.y - R * 1.55 - 4);
    ctx.restore();
  }
}

// ---------------------------------------------------------------------------------------------
// Main Renderer Factory
// ---------------------------------------------------------------------------------------------
export function createBiomeRenderer(canvas) {
  const ctx = canvas.getContext('2d');
  let groundLayers = null;
  const groundCanvas = makeCanvas(64, 64);
  let groundColorKey = '';
  const grainTile = makeGrainTile();
  let grainPattern = null;

  const rockSprites = new Map();
  let rockCacheSeed = null;
  const objSprites = new Map();

  // Ambient anomaly current particles (pure visual state — never touches world!)
  let anomParticles = [];
  let anomSeed = null;

  function ensureGround(world) {
    const needRebuild =
      !groundLayers ||
      groundLayers.seed !== world.seed ||
      groundLayers.W !== world.cfg.width ||
      groundLayers.H !== world.cfg.height;
    if (needRebuild) {
      groundLayers = buildGroundLayers(world);
      groundColorKey = '';
    }
    const ck = `${world.cfg.sanctuaryRadius}|${world.cfg.twilightRadius}`;
    if (ck !== groundColorKey) {
      colorGround(groundLayers, world.cfg, groundCanvas);
      groundColorKey = ck;
    }
  }

  function ensureRocks(world) {
    if (rockCacheSeed !== world.seed || rockSprites.size !== world.rockFormations.length) {
      rockSprites.clear();
      rockCacheSeed = world.seed;
      for (const rf of world.rockFormations) {
        rockSprites.set(rf.id, buildRockSprite(rf));
      }
    }
  }

  function ensureAnomParticles(world) {
    if (anomSeed === world.seed && anomParticles.length > 0) return;
    anomSeed = world.seed;
    anomParticles = [];
    const rng = createRng(((world.seed || 1) * 4999 + 19) >>> 0);
    for (let ai = 0; ai < world.anomalies.length; ai++) {
      const an = world.anomalies[ai];
      for (let k = 0; k < 22; k++) {
        const ang = rng.next() * TAU;
        const rad = Math.sqrt(rng.next()) * an.radius * 0.92;
        anomParticles.push({
          ai,
          x: an.x + Math.cos(ang) * rad,
          y: an.y + Math.sin(ang) * rad,
          px: an.x + Math.cos(ang) * rad,
          py: an.y + Math.sin(ang) * rad,
          life: rng.next() * 90,
          maxLife: 55 + rng.next() * 55,
          tint: k % 2 === 0 ? [0.68, 0.56, 0.78] : [0.46, 0.72, 0.74],
        });
      }
    }
  }

  function stepAndDrawAnomalies(world, view, animate) {
    ensureAnomParticles(world);
    const strength = Math.max(0, Number(world.cfg.anomalyStrength) || 0);
    if (strength <= 0.001) return;
    const visK = clamp(strength / 0.28, 0.25, 1.8);

    // 1. Soft atmospheric pocket glow + subtle rotating current arcs
    for (let i = 0; i < world.anomalies.length; i++) {
      const an = world.anomalies[i];
      if (
        an.x + an.radius < view.minX ||
        an.x - an.radius > view.maxX ||
        an.y + an.radius < view.minY ||
        an.y - an.radius > view.maxY
      ) {
        continue;
      }
      const pulse = 0.55 + 0.45 * Math.sin(world.tick * an.freq + an.phase);
      const g = ctx.createRadialGradient(an.x, an.y, an.radius * 0.06, an.x, an.y, an.radius);
      g.addColorStop(0, `rgba(148,96,136,${(0.14 * pulse * visK).toFixed(3)})`);
      g.addColorStop(0.55, `rgba(88,66,118,${(0.08 * pulse * visK).toFixed(3)})`);
      g.addColorStop(1, 'rgba(60,44,82,0)');
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(an.x, an.y, an.radius, 0, TAU);
      ctx.fill();

      // Gentle spiral flow ribbons
      ctx.save();
      ctx.translate(an.x + an.dirX * 12, an.y + an.dirY * 12);
      const spin = world.tick * 0.008 * (0.7 + 0.3 * pulse) + an.phase;
      ctx.strokeStyle = `rgba(172,146,188,${(0.085 * pulse * visK).toFixed(3)})`;
      ctx.lineWidth = 1.4;
      for (let arm = 0; arm < 3; arm++) {
        const a0 = spin + (arm / 3) * TAU;
        ctx.beginPath();
        for (let s = 0; s <= 12; s++) {
          const u = s / 12;
          const r = an.radius * (0.14 + 0.74 * u);
          const aa = a0 + u * 1.45;
          const px = Math.cos(aa) * r;
          const py = Math.sin(aa) * r;
          if (s === 0) ctx.moveTo(px, py);
          else ctx.lineTo(px, py);
        }
        ctx.stroke();
      }
      ctx.restore();
    }

    // 2. Drifting organic stream motes
    ctx.lineCap = 'round';
    for (let i = 0; i < anomParticles.length; i++) {
      const pt = anomParticles[i];
      const an = world.anomalies[pt.ai];
      if (!an) continue;
      if (animate) {
        pt.px = pt.x;
        pt.py = pt.y;
        const dx = pt.x - an.x;
        const dy = pt.y - an.y;
        const dist = Math.hypot(dx, dy) || 1;
        const fall = clamp(1 - dist / an.radius, 0, 1);
        const pulse = 0.55 + 0.45 * Math.sin(world.tick * an.freq + an.phase);
        const spd = (0.9 + 2.4 * fall * pulse) * visK;
        const tx = (-dy / dist) * 0.65 + an.dirX * 0.75;
        const ty = (dx / dist) * 0.65 + an.dirY * 0.75;
        pt.x += tx * spd;
        pt.y += ty * spd;
        pt.life++;
        if (pt.life > pt.maxLife || dist > an.radius * 0.96) {
          const ang = ((i * 2.39996 + world.tick * 0.13) % TAU);
          const rad = an.radius * (0.12 + ((i * 0.37 + world.tick * 0.01) % 0.72));
          pt.x = an.x + Math.cos(ang) * rad;
          pt.y = an.y + Math.sin(ang) * rad;
          pt.px = pt.x;
          pt.py = pt.y;
          pt.life = 0;
        }
      }
      if (pt.x < view.minX - 20 || pt.x > view.maxX + 20 || pt.y < view.minY - 20 || pt.y > view.maxY + 20) continue;
      const alpha = Math.sin((pt.life / pt.maxLife) * Math.PI) * 0.34 * clamp(visK, 0.3, 1.2);
      if (alpha < 0.02) continue;
      ctx.beginPath();
      ctx.moveTo(pt.px, pt.py);
      ctx.lineTo(pt.x, pt.y);
      ctx.strokeStyle = rgbCss(pt.tint, alpha);
      ctx.lineWidth = 1.25;
      ctx.stroke();
    }
  }

  function drawShelterHalos(world, view) {
    for (const o of world.objects) {
      if ((o.shelterStrength || 0) < 0.45) continue;
      const rad = o.radius * 3.1;
      if (o.x + rad < view.minX || o.x - rad > view.maxX || o.y + rad < view.minY || o.y - rad > view.maxY) continue;
      const g = ctx.createRadialGradient(o.x, o.y, o.radius * 0.9, o.x, o.y, rad);
      g.addColorStop(0, 'rgba(130,178,166,0.09)');
      g.addColorStop(1, 'rgba(130,178,166,0)');
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(o.x, o.y, rad, 0, TAU);
      ctx.fill();
    }
  }

  function drawObjects(world, view, zoom) {
    const aliveIds = new Set();
    const t = world.tick * 0.05;
    for (const o of world.objects) {
      aliveIds.add(o.id);
      const pad = o.radius * 2 + 20;
      if (o.x + pad < view.minX || o.x - pad > view.maxX || o.y + pad < view.minY || o.y - pad > view.maxY) continue;

      const key = spriteKey(o);
      let entry = objSprites.get(o.id);
      if (!entry || entry.key !== key) {
        entry = { key, ...buildObjectSprite(o) };
        objSprites.set(o.id, entry);
      }

      const st = matterStyle(o);
      // Soft ambient glow for living cores & hot embers
      if (st === 'wildCore' || st === 'emberMineral') {
        const pulse = 0.78 + 0.22 * Math.sin(t + (o.shapeSeed || 0));
        const gr = o.radius * (st === 'wildCore' ? 2.6 : 2.3);
        const g = ctx.createRadialGradient(o.x, o.y, o.radius * 0.3, o.x, o.y, gr);
        g.addColorStop(0, rgbCss(o.rgb, (st === 'wildCore' ? 0.26 : 0.22) * pulse));
        g.addColorStop(1, rgbCss(o.rgb, 0));
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.arc(o.x, o.y, gr, 0, TAU);
        ctx.fill();
      } else if (st === 'sanctuaryBerry') {
        const gr = o.radius * 2.0;
        const g = ctx.createRadialGradient(o.x, o.y, o.radius * 0.2, o.x, o.y, gr);
        g.addColorStop(0, rgbCss(o.rgb, 0.14));
        g.addColorStop(1, rgbCss(o.rgb, 0));
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.arc(o.x, o.y, gr, 0, TAU);
        ctx.fill();
      }

      ctx.drawImage(entry.canvas, o.x - entry.E, o.y - entry.E, entry.E * 2, entry.E * 2);

      // Extra close-up LOD glint on crystals/cores
      if (zoom > LOD_ZOOM && (st === 'wildCore' || st === 'geode')) {
        const tw = 0.5 + 0.5 * Math.sin(t * 1.4 + (o.shapeSeed || 0));
        ctx.fillStyle = `rgba(255,252,240,${(0.28 * tw).toFixed(2)})`;
        ctx.beginPath();
        ctx.arc(o.x - o.radius * 0.25, o.y - o.radius * 0.28, Math.max(1.1, o.radius * 0.12), 0, TAU);
        ctx.fill();
      }
    }
    if (objSprites.size > aliveIds.size + 40) {
      for (const id of objSprites.keys()) {
        if (!aliveIds.has(id)) objSprites.delete(id);
      }
    }
  }

  function drawSelectedOverlays(world, agent, mindState, opts) {
    if (!agent) return;
    // 1. Optional 36-ray private retina cone
    if (opts.showRays) {
      const N = world.cfg.retinaRays || 36;
      const fov = world.cfg.retinaFov || (195 * Math.PI) / 180;
      const range = world.cfg.retinaRange || 300;
      const lookTheta = agent.theta + (agent.gazeOffset || 0);
      const obs = world.getObservation(agent.idx);
      ctx.save();
      for (let r = 0; r < N; r++) {
        const frac = N > 1 ? r / (N - 1) - 0.5 : 0;
        const ang = lookTheta + frac * fov;
        const dx = Math.cos(ang);
        const dy = Math.sin(ang);
        let bestT = range;
        for (const rw of world.rockFormations) {
          const t = rayCapsule(agent.x, agent.y, dx, dy, rw.ax, rw.ay, rw.bx, rw.by, rw.r, bestT);
          if (t < bestT) bestT = t;
        }
        for (const o of world.objects) {
          const t = rayCircle(agent.x, agent.y, dx, dy, o.x, o.y, o.radius, bestT);
          if (t < bestT) bestT = t;
        }
        for (const other of world.agents) {
          if (other.idx === agent.idx) continue;
          const t = rayCircle(agent.x, agent.y, dx, dy, other.x, other.y, other.r, bestT);
          if (t < bestT) bestT = t;
        }
        if (world.player) {
          const t = rayCircle(agent.x, agent.y, dx, dy, world.player.x, world.player.y, world.player.r, bestT);
          if (t < bestT) bestT = t;
        }
        const px = obs.retina[r] || [0.5, 0.5, 0.5];
        ctx.beginPath();
        ctx.moveTo(agent.x, agent.y);
        ctx.lineTo(agent.x + dx * bestT, agent.y + dy * bestT);
        ctx.strokeStyle = rgbCss(lighten(px, 0.15), bestT < range ? 0.34 : 0.1);
        ctx.lineWidth = bestT < range ? 1.05 : 0.6;
        ctx.stroke();
      }
      ctx.restore();
    }

    // 2. Optional private Visual-Odometric PlaceGraph anchors (aligned to agent's current ego pose!)
    if (opts.showPlaces && mindState && mindState.places && mindState.places.length > 0) {
      const ep = mindState.estPos || { x: 0, y: 0, heading: 0 };
      const dRot = agent.theta - ep.heading;
      const cr = Math.cos(dRot);
      const sr = Math.sin(dRot);
      ctx.save();
      for (const pl of mindState.places) {
        const rx = pl.estX - ep.x;
        const ry = pl.estY - ep.y;
        const wx = agent.x + rx * cr - ry * sr;
        const wy = agent.y + rx * sr + ry * cr;
        const isSafe = pl.dI > 0.2 || pl.dS < -0.2;
        const isDanger = pl.dI < -0.2 || pl.dS > 0.2;
        const isFood = pl.dE > 0.2;
        const col = isDanger ? 'rgba(218,96,92,' : isFood ? 'rgba(130,214,158,' : isSafe ? 'rgba(128,186,214,' : 'rgba(200,196,176,';
        const rad = 14 + clamp(pl.strength, 0.2, 2.5) * 9;
        ctx.beginPath();
        ctx.moveTo(agent.x, agent.y);
        ctx.lineTo(wx, wy);
        ctx.strokeStyle = `${col}0.16)`;
        ctx.lineWidth = 1;
        ctx.setLineDash([4, 4]);
        ctx.stroke();
        ctx.setLineDash([]);

        ctx.beginPath();
        ctx.arc(wx, wy, rad, 0, TAU);
        ctx.fillStyle = `${col}0.12)`;
        ctx.fill();
        ctx.strokeStyle = `${col}0.55)`;
        ctx.lineWidth = 1.2;
        ctx.stroke();
      }
      ctx.restore();
    }
  }

  function drawRecentEvents(world) {
    for (const ev of world.recentEvents) {
      const age = world.tick - ev.tick;
      if (age < 0 || age > 42) continue;
      const u = age / 42;
      const alpha = (1 - u) * (1 - u);
      const rgb = ev.rgb || [0.9, 0.85, 0.7];
      if (ev.kind === 'burst') {
        const r = 10 + u * 44;
        ctx.beginPath();
        ctx.arc(ev.x, ev.y, r, 0, TAU);
        ctx.strokeStyle = rgbCss(lighten(rgb, 0.35), alpha * 0.7);
        ctx.lineWidth = Math.max(0.6, 2.2 * (1 - u));
        ctx.stroke();
        for (let k = 0; k < 6; k++) {
          const a = (k / 6) * TAU + (ev.tick % 11) * 0.4;
          const d = 6 + u * 36;
          ctx.fillStyle = rgbCss(lighten(rgb, 0.4), alpha * 0.8);
          ctx.beginPath();
          ctx.arc(ev.x + Math.cos(a) * d, ev.y + Math.sin(a) * d, 2.2 * (1 - u), 0, TAU);
          ctx.fill();
        }
      } else if (ev.kind === 'birth') {
        const r = 14 + u * 52;
        ctx.beginPath();
        ctx.arc(ev.x, ev.y, r, 0, TAU);
        ctx.strokeStyle = rgbCss(lighten(rgb, 0.45), alpha * 0.65);
        ctx.lineWidth = 1.6;
        ctx.stroke();
      }
    }
  }

  function render(world, camera, opts = {}) {
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    const vw = canvas.clientWidth || canvas.width || 1280;
    const vh = canvas.clientHeight || canvas.height || 720;
    const bw = Math.max(1, Math.round(vw * dpr));
    const bh = Math.max(1, Math.round(vh * dpr));
    if (canvas.width !== bw || canvas.height !== bh) {
      canvas.width = bw;
      canvas.height = bh;
    }

    ensureGround(world);
    ensureRocks(world);

    const zoom = clamp(camera.zoom || 1, 0.25, 4.0);
    const halfW = (vw * 0.5) / zoom;
    const halfH = (vh * 0.5) / zoom;
    const view = {
      minX: camera.x - halfW,
      maxX: camera.x + halfW,
      minY: camera.y - halfH,
      maxY: camera.y + halfH,
    };

    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.fillStyle = '#090c10';
    ctx.fillRect(0, 0, vw, vh);

    ctx.save();
    ctx.translate(vw * 0.5, vh * 0.5);
    ctx.scale(zoom, zoom);
    ctx.translate(-camera.x, -camera.y);

    // 1. Procedural seabed terrain
    ctx.drawImage(groundCanvas, 0, 0, world.cfg.width, world.cfg.height);

    // Fine mineral grain overlay on close zoom
    if (zoom > 1.15) {
      if (!grainPattern) grainPattern = ctx.createPattern(grainTile, 'repeat');
      if (grainPattern) {
        ctx.save();
        ctx.globalAlpha = clamp((zoom - 1.15) * 0.08, 0, 0.09);
        ctx.fillStyle = grainPattern;
        ctx.fillRect(
          Math.max(0, view.minX),
          Math.max(0, view.minY),
          Math.min(world.cfg.width, view.maxX) - Math.max(0, view.minX),
          Math.min(world.cfg.height, view.maxY) - Math.max(0, view.minY)
        );
        ctx.restore();
      }
    }

    // Subtle biome perimeter border
    ctx.strokeStyle = 'rgba(130,148,162,0.22)';
    ctx.lineWidth = 3;
    ctx.strokeRect(1.5, 1.5, world.cfg.width - 3, world.cfg.height - 3);

    // 2. Local anomaly currents & boulder shelter lee pockets
    stepAndDrawAnomalies(world, view, !opts.paused);
    drawShelterHalos(world, view);

    // 3. Faceted basalt rock formations
    for (const rf of world.rockFormations) {
      const sp = rockSprites.get(rf.id);
      if (!sp) continue;
      if (sp.x + sp.w < view.minX || sp.x > view.maxX || sp.y + sp.h < view.minY || sp.y > view.maxY) continue;
      ctx.drawImage(sp.canvas, sp.x, sp.y, sp.w, sp.h);
    }

    // 4. Organic breadcrumbs / soft swim trails
    ctx.lineCap = 'round';
    for (const a of world.agents) {
      if (!a.trail || a.trail.length < 2) continue;
      ctx.beginPath();
      ctx.moveTo(a.trail[0][0], a.trail[0][1]);
      for (let i = 1; i < a.trail.length; i++) ctx.lineTo(a.trail[i][0], a.trail[i][1]);
      ctx.strokeStyle = rgbCss(a.rgb, a.idx === opts.selectedIdx ? 0.24 : 0.085);
      ctx.lineWidth = a.idx === opts.selectedIdx ? 2.0 : 1.15;
      ctx.stroke();
    }

    // 5. Matter objects
    drawObjects(world, view, zoom);

    // 6. Selected creature X-Ray overlays (rays / private place anchors)
    const selAgent = opts.selectedIdx >= 0 && opts.selectedIdx < world.agents.length ? world.agents[opts.selectedIdx] : null;
    if (selAgent && (opts.showRays || opts.showPlaces)) {
      drawSelectedOverlays(world, selAgent, opts.selectedMindState, opts);
    }

    // 7. Player held-object tether (graceful elastic arc toward cursor!)
    if (world.player && world.player.carriedObjId > 0) {
      const held = world.objects.find((o) => o.id === world.player.carriedObjId);
      if (held) {
        ctx.save();
        ctx.beginPath();
        ctx.moveTo(world.player.x, world.player.y);
        ctx.lineTo(held.x, held.y);
        ctx.strokeStyle = 'rgba(196,232,124,0.62)';
        ctx.lineWidth = 2.0;
        ctx.setLineDash([4, 3]);
        ctx.stroke();
        ctx.setLineDash([]);
        ctx.beginPath();
        ctx.arc(held.x, held.y, held.radius + 5, 0, TAU);
        ctx.strokeStyle = 'rgba(196,232,124,0.52)';
        ctx.lineWidth = 1.4;
        ctx.stroke();
        ctx.restore();
      }
    }

    // 8. Living residents & Player
    for (const a of world.agents) {
      const pad = a.r * 4 + 24;
      if (a.x + pad < view.minX || a.x - pad > view.maxX || a.y + pad < view.minY || a.y - pad > view.maxY) continue;
      drawCreature(ctx, a, a.morph, { zoom, time: world.tick * 0.05, selected: a.idx === opts.selectedIdx });
    }
    if (world.player) {
      drawCreature(ctx, world.player, 'player', { zoom, time: world.tick * 0.05, selected: false });
    }

    // 9. Burst / birth ripples
    drawRecentEvents(world);

    // 10. Brush preview ghost when Matter Forge is active
    if (opts.brushGhost) {
      const g = opts.brushGhost;
      ctx.save();
      ctx.beginPath();
      ctx.arc(g.x, g.y, g.radius, 0, TAU);
      ctx.fillStyle = g.erase ? 'rgba(220,92,84,0.16)' : rgbCss(g.rgb || [0.85, 0.85, 0.85], 0.22);
      ctx.fill();
      ctx.strokeStyle = g.erase ? 'rgba(232,108,98,0.75)' : rgbCss(g.rgb || [0.9, 0.9, 0.9], 0.78);
      ctx.lineWidth = 1.4 / Math.max(0.5, zoom);
      ctx.setLineDash([4, 3]);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.restore();
    }

    ctx.restore();
  }

  function renderMinimap(miniCanvas, world, camera, mainCanvas, selectedIdx) {
    if (!miniCanvas) return;
    ensureGround(world);
    const mctx = miniCanvas.getContext('2d');
    const mw = miniCanvas.width;
    const mh = miniCanvas.height;
    const sx = mw / world.cfg.width;
    const sy = mh / world.cfg.height;

    mctx.clearRect(0, 0, mw, mh);
    mctx.drawImage(groundCanvas, 0, 0, mw, mh);

    // Anomalies
    for (const an of world.anomalies) {
      mctx.beginPath();
      mctx.arc(an.x * sx, an.y * sy, an.radius * sx, 0, TAU);
      mctx.fillStyle = 'rgba(154,102,146,0.22)';
      mctx.fill();
    }
    // Rock formations
    mctx.strokeStyle = 'rgba(92,102,116,0.85)';
    mctx.lineCap = 'round';
    for (const rf of world.rockFormations) {
      mctx.beginPath();
      mctx.moveTo(rf.ax * sx, rf.ay * sy);
      mctx.lineTo(rf.bx * sx, rf.by * sy);
      mctx.lineWidth = Math.max(1.5, rf.r * sx * 1.8);
      mctx.stroke();
    }
    // Agents
    for (const a of world.agents) {
      mctx.beginPath();
      mctx.arc(a.x * sx, a.y * sy, a.idx === selectedIdx ? 3.2 : 2.1, 0, TAU);
      mctx.fillStyle = a.idx === selectedIdx ? '#f6e7b8' : rgbCss(a.rgb, 0.95);
      mctx.fill();
    }
    // Player
    if (world.player) {
      mctx.beginPath();
      mctx.arc(world.player.x * sx, world.player.y * sy, 3.4, 0, TAU);
      mctx.fillStyle = '#b9ef52';
      mctx.fill();
      mctx.strokeStyle = '#0d1216';
      mctx.lineWidth = 1;
      mctx.stroke();
    }
    // Camera viewport box
    const vw = (mainCanvas.clientWidth || mainCanvas.width || 1280) / (camera.zoom || 1);
    const vh = (mainCanvas.clientHeight || mainCanvas.height || 720) / (camera.zoom || 1);
    mctx.strokeStyle = 'rgba(236,228,200,0.75)';
    mctx.lineWidth = 1.1;
    mctx.strokeRect((camera.x - vw * 0.5) * sx, (camera.y - vh * 0.5) * sy, vw * sx, vh * sy);
  }

  function invalidateGround() {
    groundColorKey = '';
  }

  return {
    render,
    renderMinimap,
    invalidateGround,
    drawMatterPreview(previewCanvas, props) {
      if (!previewCanvas) return;
      const pctx = previewCanvas.getContext('2d');
      const w = previewCanvas.width;
      const h = previewCanvas.height;
      pctx.clearRect(0, 0, w, h);
      pctx.save();
      const fake = {
        ...createMaterialProps('sanctuaryBerry', props.rgb || [0.8, 0.5, 0.7]),
        ...props,
        radius: Math.min(w, h) * 0.32,
        shapeSeed: 42,
      };
      pctx.translate(w * 0.5, h * 0.5);
      drawMatterBody(pctx, fake);
      pctx.restore();
    },
  };
}
