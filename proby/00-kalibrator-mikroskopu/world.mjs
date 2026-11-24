// proby/00-kalibrator-mikroskopu/world.mjs — deterministyczny stol kalibracyjny aparatury.
// UWAGA: to NIE jest eksperyment naukowy o uczeniu ani zyciu (scientificClaim = false).
// Sluzy wylacznie do weryfikacji kernel/seam.mjs, kernel/fork-microscope.mjs i kernel/lens-ui.mjs.

import { PERCEPTION_MODES, createRng, deepClone, stableDigest } from '../../kernel/seam.mjs';

const WORLD_W = 960;
const WORLD_H = 560;
const RAYS = 24;
const FOV = Math.PI * 1.15;
const VIEW_RANGE = 280;

function clamp(v, lo, hi) {
  return v < lo ? lo : v > hi ? hi : v;
}

function wrapAngle(a) {
  while (a > Math.PI) a -= 2 * Math.PI;
  while (a < -Math.PI) a += 2 * Math.PI;
  return a;
}

function rayCircle(ox, oy, dx, dy, cx, cy, r, maxT) {
  const fx = ox - cx;
  const fy = oy - cy;
  const b = fx * dx + fy * dy;
  if (b > r) return Infinity;
  const c = fx * fx + fy * fy - r * r;
  if (c <= 0) return 0.01;
  const disc = b * b - c;
  if (disc < 0) return Infinity;
  const t = -b - Math.sqrt(disc);
  return t > 0 && t < maxT ? t : Infinity;
}

export function createCalibratorWorld(seed = 1) {
  const rng = createRng(seed);
  let tick = 0;

  let actor = {
    x: WORLD_W * 0.28,
    y: WORLD_H * 0.52,
    vx: 0,
    vy: 0,
    theta: -0.22,
    omega: 0,
    radius: 17,
    trail: [],
    lastTouch: { front: 0, left: 0, right: 0 },
  };

  let pucks = [
    { id: 1, x: WORLD_W * 0.56, y: WORLD_H * 0.34, vx: 0, vy: 0, radius: 22, rgb: [0.28, 0.82, 0.72] },
    { id: 2, x: WORLD_W * 0.64, y: WORLD_H * 0.68, vx: 0, vy: 0, radius: 26, rgb: [0.92, 0.62, 0.26] },
    { id: 3, x: WORLD_W * 0.44, y: WORLD_H * 0.66, vx: 0, vy: 0, radius: 19, rgb: [0.58, 0.68, 0.94] },
  ];

  // Kotwiczenie krazka trzymanego mysza w trybie MATERIAL (zeby aktor nie wyrywal go spod kursora)
  let pinnedPuck = null; // { id, x, y } | null

  // Nietrwale lokalne sledzenie (tracklets): aktualizowane wylacznie w trybie TRACKLET.
  let nextTrackletId = 1;
  let visibleTracklets = new Map();

  function getActorIds() {
    return ['actor-0'];
  }

  function computeTouch() {
    let touchFront = 0;
    let touchLeft = 0;
    let touchRight = 0;
    for (const p of pucks) {
      const dx = p.x - actor.x;
      const dy = p.y - actor.y;
      const d = Math.hypot(dx, dy);
      const overlap = actor.radius + p.radius + 3 - d;
      if (overlap > 0) {
        const rel = wrapAngle(Math.atan2(dy, dx) - actor.theta);
        const f = clamp(overlap / 8, 0, 1);
        if (Math.abs(rel) < 0.7) touchFront = Math.max(touchFront, f);
        else if (rel < 0) touchLeft = Math.max(touchLeft, f);
        else touchRight = Math.max(touchRight, f);
      }
    }
    return { front: touchFront, left: touchLeft, right: touchRight };
  }

  function observe(_actorId, perceptionMode = PERCEPTION_MODES.RAW) {
    const retina = [];
    const seenNow = new Set();

    for (let i = 0; i < RAYS; i++) {
      const frac = i / (RAYS - 1) - 0.5;
      const ang = actor.theta + frac * FOV;
      const dx = Math.cos(ang);
      const dy = Math.sin(ang);
      let bestT = VIEW_RANGE;
      let hitPuck = null;

      for (const p of pucks) {
        const t = rayCircle(actor.x, actor.y, dx, dy, p.x, p.y, p.radius, bestT);
        if (t < bestT) {
          bestT = t;
          hitPuck = p;
        }
      }

      if (hitPuck) {
        seenNow.add(hitPuck.id);
        const atten = 1 - clamp((bestT / VIEW_RANGE) * 0.55, 0, 0.55);
        const sample = {
          rgb: [hitPuck.rgb[0] * atten, hitPuck.rgb[1] * atten, hitPuck.rgb[2] * atten],
          proximity: clamp(1 - bestT / VIEW_RANGE, 0, 1),
        };
        if (perceptionMode === PERCEPTION_MODES.TRACKLET) {
          if (!visibleTracklets.has(hitPuck.id)) visibleTracklets.set(hitPuck.id, nextTrackletId++);
          sample.trackletId = visibleTracklets.get(hitPuck.id);
        } else if (perceptionMode === PERCEPTION_MODES.ENTITY_ORACLE) {
          sample.entityId = `oracle-puck-${hitPuck.id}`;
        }
        retina.push(sample);
      } else {
        retina.push({ rgb: [0.06, 0.08, 0.11], proximity: 0 });
      }
    }

    if (perceptionMode === PERCEPTION_MODES.TRACKLET) {
      for (const key of [...visibleTracklets.keys()]) {
        if (!seenNow.has(key)) visibleTracklets.delete(key);
      }
    }

    const touch = computeTouch();
    const cosT = Math.cos(actor.theta);
    const sinT = Math.sin(actor.theta);
    return {
      retina,
      touch,
      proprio: {
        vxBody: actor.vx * cosT + actor.vy * sinT,
        vyBody: -actor.vx * sinT + actor.vy * cosT,
        omega: actor.omega,
      },
    };
  }

  function step(actions) {
    tick += 1;
    const act = (actions && actions['actor-0']) || { thrust: 0, turn: 0 };
    const thrust = clamp(act.thrust || 0, -0.8, 1.0);
    const turn = clamp(act.turn || 0, -1.0, 1.0);

    actor.omega = actor.omega * 0.76 + turn * 0.036;
    actor.theta = wrapAngle(actor.theta + actor.omega);
    actor.vx = actor.vx * 0.88 + Math.cos(actor.theta) * thrust * 0.42;
    actor.vy = actor.vy * 0.88 + Math.sin(actor.theta) * thrust * 0.42;
    actor.x += actor.vx;
    actor.y += actor.vy;

    // 1. Zderzenia aktor <-> krazki (z poszanowaniem zakotwiczonego krazka)
    for (const p of pucks) {
      const isPinned = pinnedPuck && pinnedPuck.id === p.id;
      if (isPinned) {
        p.x = pinnedPuck.x;
        p.y = pinnedPuck.y;
        p.vx = 0;
        p.vy = 0;
      }
      const dx = p.x - actor.x;
      const dy = p.y - actor.y;
      const d = Math.hypot(dx, dy) || 1e-4;
      const minD = actor.radius + p.radius;
      if (d < minD) {
        const nx = dx / d;
        const ny = dy / d;
        const pen = minD - d;
        if (isPinned) {
          actor.x -= nx * pen;
          actor.y -= ny * pen;
          actor.vx -= nx * 0.65;
          actor.vy -= ny * 0.65;
        } else {
          actor.x -= nx * pen * 0.45;
          actor.y -= ny * pen * 0.45;
          p.x += nx * pen * 0.55;
          p.y += ny * pen * 0.55;
          p.vx += nx * 0.85 + actor.vx * 0.35;
          p.vy += ny * 0.85 + actor.vy * 0.35;
          actor.vx -= nx * 0.4;
          actor.vy -= ny * 0.4;
        }
      }
      if (!isPinned) {
        p.vx *= 0.92;
        p.vy *= 0.92;
        p.x += p.vx;
        p.y += p.vy;
      }
    }

    // 2. Zderzenia krazek <-> krazek
    for (let i = 0; i < pucks.length; i++) {
      for (let j = i + 1; j < pucks.length; j++) {
        const a = pucks[i];
        const b = pucks[j];
        const pinA = pinnedPuck && pinnedPuck.id === a.id;
        const pinB = pinnedPuck && pinnedPuck.id === b.id;
        const dx = b.x - a.x;
        const dy = b.y - a.y;
        const d = Math.hypot(dx, dy) || 1e-4;
        const minD = a.radius + b.radius;
        if (d < minD) {
          const nx = dx / d;
          const ny = dy / d;
          const pen = minD - d;
          if (pinA && !pinB) { b.x += nx * pen; b.y += ny * pen; }
          else if (pinB && !pinA) { a.x -= nx * pen; a.y -= ny * pen; }
          else {
            a.x -= nx * pen * 0.5; a.y -= ny * pen * 0.5;
            b.x += nx * pen * 0.5; b.y += ny * pen * 0.5;
          }
        }
      }
    }

    // 3. Naturalne fizyczne odbicie od 4 scian stolu (zalezne od kata padania, nie sztywne +0.35 rad!)
    const pad = actor.radius + 14;
    if (actor.x < pad) {
      actor.x = pad;
      actor.vx = Math.abs(actor.vx) * 0.65;
      actor.theta = wrapAngle(Math.PI - actor.theta);
    } else if (actor.x > WORLD_W - pad) {
      actor.x = WORLD_W - pad;
      actor.vx = -Math.abs(actor.vx) * 0.65;
      actor.theta = wrapAngle(Math.PI - actor.theta);
    }
    if (actor.y < pad) {
      actor.y = pad;
      actor.vy = Math.abs(actor.vy) * 0.65;
      actor.theta = wrapAngle(-actor.theta);
    } else if (actor.y > WORLD_H - pad) {
      actor.y = WORLD_H - pad;
      actor.vy = -Math.abs(actor.vy) * 0.65;
      actor.theta = wrapAngle(-actor.theta);
    }

    for (const p of pucks) {
      p.x = clamp(p.x, p.radius + 14, WORLD_W - p.radius - 14);
      p.y = clamp(p.y, p.radius + 14, WORLD_H - p.radius - 14);
    }

    actor.lastTouch = computeTouch();
    if (tick % 3 === 0) {
      actor.trail.push([actor.x, actor.y]);
      if (actor.trail.length > 75) actor.trail.shift();
    }
    rng.next();
  }

  function pickMovable(wx, wy) {
    for (const p of pucks) {
      if (Math.hypot(p.x - wx, p.y - wy) <= p.radius + 10) return p.id;
    }
    return null;
  }

  function moveMovable(id, wx, wy) {
    const p = pucks.find((x) => x.id === id);
    if (!p) return;
    p.x = clamp(wx, p.radius + 14, WORLD_W - p.radius - 14);
    p.y = clamp(wy, p.radius + 14, WORLD_H - p.radius - 14);
    p.vx = 0;
    p.vy = 0;
  }

  function pinMovable(id, wx, wy) {
    const p = pucks.find((x) => x.id === id);
    if (!p) return;
    const cx = clamp(wx, p.radius + 14, WORLD_W - p.radius - 14);
    const cy = clamp(wy, p.radius + 14, WORLD_H - p.radius - 14);
    pinnedPuck = { id, x: cx, y: cy };
    p.x = cx;
    p.y = cy;
    p.vx = 0;
    p.vy = 0;
  }

  function unpinMovable() {
    pinnedPuck = null;
  }

  function snapshot() {
    return deepClone({
      tick,
      rngState: rng.getState(),
      actor,
      pucks,
      pinnedPuck,
      nextTrackletId,
      visibleTracklets: [...visibleTracklets.entries()],
    });
  }

  function restore(snap) {
    const s = deepClone(snap);
    tick = s.tick;
    rng.setState(s.rngState);
    actor = s.actor;
    pucks = s.pucks;
    pinnedPuck = s.pinnedPuck || null;
    nextTrackletId = s.nextTrackletId;
    visibleTracklets = new Map(s.visibleTracklets || []);
  }

  function digest() {
    return stableDigest({
      tick,
      actor: [actor.x, actor.y, actor.vx, actor.vy, actor.theta, actor.omega],
      pucks: pucks.map((p) => [p.id, p.x, p.y, p.vx, p.vy]),
    });
  }

  function render(ctx, view) {
    const sx = view.w / WORLD_W;
    const sy = view.h / WORLD_H;
    const tx = (x) => view.x + x * sx;
    const ty = (y) => view.y + y * sy;
    const sr = (r) => r * Math.min(sx, sy);

    if (!view.overlay) {
      ctx.fillStyle = '#0d131b';
      ctx.fillRect(view.x, view.y, view.w, view.h);
      ctx.strokeStyle = 'rgba(148,175,204,0.08)';
      ctx.lineWidth = 1;
      for (let gx = 80; gx < WORLD_W; gx += 80) {
        ctx.beginPath(); ctx.moveTo(tx(gx), view.y); ctx.lineTo(tx(gx), view.y + view.h); ctx.stroke();
      }
      for (let gy = 80; gy < WORLD_H; gy += 80) {
        ctx.beginPath(); ctx.moveTo(view.x, ty(gy)); ctx.lineTo(view.x + view.w, ty(gy)); ctx.stroke();
      }
    }

    const alpha = view.ghost ? 0.42 : 0.96;
    const accent = view.tint === 'B' ? '#f5a54a' : '#4ad8c4';

    // Slad trajektorii
    if (actor.trail.length > 1) {
      ctx.save();
      ctx.globalAlpha = view.ghost ? 0.35 : 0.65;
      ctx.strokeStyle = accent;
      ctx.lineWidth = 2;
      ctx.beginPath();
      actor.trail.forEach((pt, idx) => {
        if (idx === 0) ctx.moveTo(tx(pt[0]), ty(pt[1]));
        else ctx.lineTo(tx(pt[0]), ty(pt[1]));
      });
      ctx.stroke();
      ctx.restore();
    }

    // Luzne krazki + delikatna obwodka hover w FORK
    for (const p of pucks) {
      ctx.save();
      ctx.globalAlpha = alpha;
      const r = Math.round(p.rgb[0] * 255);
      const g = Math.round(p.rgb[1] * 255);
      const b = Math.round(p.rgb[2] * 255);
      ctx.fillStyle = `rgb(${r},${g},${b})`;
      ctx.beginPath();
      ctx.arc(tx(p.x), ty(p.y), sr(p.radius), 0, Math.PI * 2);
      ctx.fill();
      if (view.ghost) {
        ctx.strokeStyle = accent;
        ctx.setLineDash([4, 4]);
        ctx.lineWidth = 1.5;
        ctx.stroke();
      } else if (view.hoverId === p.id) {
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(tx(p.x), ty(p.y), sr(p.radius + 4), 0, Math.PI * 2);
        ctx.stroke();
      }
      ctx.restore();
    }

    // Cialo zwiadowcy + wierny stozek wzroku (100% VIEW_RANGE)
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.fillStyle = view.tint === 'B' ? 'rgba(245,165,74,0.07)' : 'rgba(74,216,196,0.07)';
    ctx.beginPath();
    ctx.moveTo(tx(actor.x), ty(actor.y));
    ctx.arc(tx(actor.x), ty(actor.y), sr(VIEW_RANGE), actor.theta - FOV * 0.5, actor.theta + FOV * 0.5);
    ctx.closePath();
    ctx.fill();

    ctx.strokeStyle = view.tint === 'B' ? 'rgba(245,165,74,0.18)' : 'rgba(74,216,196,0.18)';
    ctx.lineWidth = 1;
    ctx.stroke();

    ctx.fillStyle = accent;
    ctx.beginPath();
    ctx.arc(tx(actor.x), ty(actor.y), sr(actor.radius), 0, Math.PI * 2);
    ctx.fill();

    // Subtelny blysk obwodu przy realnym kontakcie dotykowym (front/left/right)
    const lt = actor.lastTouch || {};
    if (!view.ghost && (lt.front > 0.02 || lt.left > 0.02 || lt.right > 0.02)) {
      ctx.strokeStyle = '#ffe0a3';
      ctx.lineWidth = 3;
      if (lt.front > 0.02) {
        ctx.beginPath();
        ctx.arc(tx(actor.x), ty(actor.y), sr(actor.radius + 3), actor.theta - 0.65, actor.theta + 0.65);
        ctx.stroke();
      }
      if (lt.left > 0.02) {
        ctx.beginPath();
        ctx.arc(tx(actor.x), ty(actor.y), sr(actor.radius + 3), actor.theta - Math.PI * 0.85, actor.theta - 0.65);
        ctx.stroke();
      }
      if (lt.right > 0.02) {
        ctx.beginPath();
        ctx.arc(tx(actor.x), ty(actor.y), sr(actor.radius + 3), actor.theta + 0.65, actor.theta + Math.PI * 0.85);
        ctx.stroke();
      }
    }

    // Kierunek spojrzenia
    const eyeX = actor.x + Math.cos(actor.theta) * actor.radius * 0.62;
    const eyeY = actor.y + Math.sin(actor.theta) * actor.radius * 0.62;
    ctx.fillStyle = '#0b1017';
    ctx.beginPath();
    ctx.arc(tx(eyeX), ty(eyeY), sr(4.2), 0, Math.PI * 2);
    ctx.fill();

    if (view.label) {
      ctx.globalAlpha = 0.85;
      ctx.fillStyle = accent;
      ctx.font = '12px monospace';
      ctx.fillText(view.label, view.x + 12, view.y + (view.overlay ? 36 : 20));
    }
    ctx.restore();
  }

  return {
    width: WORLD_W,
    height: WORLD_H,
    getActorIds,
    observe,
    step,
    pickMovable,
    moveMovable,
    pinMovable,
    unpinMovable,
    snapshot,
    restore,
    digest,
    render,
  };
}

export function createCalibratorMind(_actorId, seed = 1) {
  const rng = createRng(seed);
  let state = {
    steps: 0,
    recentTurnBias: 0,
    touchMemory: 0,
  };

  function step(obs) {
    state.steps += 1;
    const ret = obs.retina || [];
    let pullL = 0;
    let pullR = 0;
    for (let i = 0; i < ret.length; i++) {
      const p = ret[i].proximity || 0;
      if (p <= 0.02) continue;
      if (i < ret.length / 2) pullL += p;
      else pullR += p;
    }

    const visualSignal = clamp((pullR - pullL) * 0.45, -1, 1);
    const touchSignal = (obs.touch.left - obs.touch.right) * 0.9;
    if (obs.touch.front > 0.1 || obs.touch.left > 0.1 || obs.touch.right > 0.1) {
      state.touchMemory = clamp(state.touchMemory + 0.35, 0, 2.0);
    } else {
      state.touchMemory *= 0.97;
    }

    state.recentTurnBias = clamp(state.recentTurnBias * 0.94 + visualSignal * 0.14 + touchSignal * 0.2, -0.85, 0.85);
    const jitter = (rng.next() - 0.5) * 0.08;
    const turn = clamp(visualSignal * 0.55 + state.recentTurnBias * 0.65 + touchSignal + jitter, -1, 1);
    const thrust = obs.touch.front > 0.25 ? -0.35 : clamp(0.74 - state.touchMemory * 0.18, 0.25, 0.82);

    return {
      action: { thrust, turn },
      appraisal: { touchMemory: Number(state.touchMemory.toFixed(4)) },
      prediction: { expectedTurnBias: Number(state.recentTurnBias.toFixed(4)) },
    };
  }

  return {
    step,
    reset() {
      state = { steps: 0, recentTurnBias: 0, touchMemory: 0 };
    },
    snapshot() {
      return deepClone({ state, rngState: rng.getState() });
    },
    restore(snap) {
      const s = deepClone(snap);
      state = s.state;
      rng.setState(s.rngState);
    },
    digest() {
      return stableDigest(state);
    },
  };
}
