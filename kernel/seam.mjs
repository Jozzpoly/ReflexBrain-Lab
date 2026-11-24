// kernel/seam.mjs — twardy szew prywatnosci obs, ablacja percepcji, PRNG, sonda ciaglosci N10 i uczciwe metryki.
// Czysty ESM (Node >= 20 i przegladarka), zero zewnetrznych zaleznosci.

export const PERCEPTION_MODES = Object.freeze({
  RAW: 'raw',
  TRACKLET: 'tracklet',
  ENTITY_ORACLE: 'entity-oracle',
});

export const DEFAULT_FORBIDDEN_OBS_KEYS = Object.freeze([
  'id',
  'x',
  'y',
  'z',
  'pos',
  'position',
  'posx',
  'posy',
  'coords',
  'theta',
  'heading',
  'worldx',
  'worldy',
  'zone',
  'type',
  'kind',
  'label',
  'class',
  'tag',
  'archetype',
  'chemistry',
  'worldid',
  'objectid',
  'agentid',
  'foodid',
  'entityid',
  'trackletid',
  'isplayer',
  'isfood',
  'ispoison',
  'goal',
  'reward',
  'rewardlabel',
  'agents',
  'objects',
  'truecause',
  'intervention',
  'provenance',
]);

// Mulberry32 dziala poprawnie rowniez dla seed=0 (najpierw dodaje 0x6d2b79f5).
export function createRng(seed = 1) {
  let state = seed >>> 0;
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
      state = s >>> 0;
    },
  };
}

export function deepClone(value) {
  if (typeof structuredClone === 'function') return structuredClone(value);
  return JSON.parse(JSON.stringify(value));
}

export function shallowCopyAction(action) {
  if (action === null || typeof action !== 'object') return action;
  if (Array.isArray(action)) return action.slice();
  return { ...action };
}

// Bezpieczne zamrazanie: pomija ArrayBuffer/TypedArray (w V8 Object.freeze na TypedArray rzuca TypeError!)
// oraz chroni przed cyklami przez WeakSet.
export function deepFreeze(obj, seen = new WeakSet()) {
  if (obj === null || typeof obj !== 'object') return obj;
  if (seen.has(obj)) return obj;
  seen.add(obj);
  if (ArrayBuffer.isView(obj) || obj instanceof ArrayBuffer) return obj;
  if (obj instanceof Map) {
    for (const [k, v] of obj.entries()) {
      deepFreeze(k, seen);
      deepFreeze(v, seen);
    }
    return Object.freeze(obj);
  }
  if (obj instanceof Set) {
    for (const v of obj.values()) deepFreeze(v, seen);
    return Object.freeze(obj);
  }
  if (!Object.isFrozen(obj)) Object.freeze(obj);
  for (const key of Object.keys(obj)) {
    deepFreeze(obj[key], seen);
  }
  return obj;
}

function canonicalize(value, seen = new WeakSet()) {
  if (value === undefined) return '"__undef__"';
  if (value === null) return 'null';
  const t = typeof value;
  if (t === 'number') {
    if (Number.isNaN(value)) return '"__NaN__"';
    if (value === Infinity) return '"__Inf__"';
    if (value === -Infinity) return '"__-Inf__"';
    return String(Object.is(value, -0) ? 0 : value);
  }
  if (t === 'boolean') return value ? 'true' : 'false';
  if (t === 'string') return JSON.stringify(value);
  if (t === 'bigint') return `"__BigInt__:${value.toString()}"`;
  if (t === 'symbol') return `"__Sym__:${String(value)}"`;
  if (t === 'function') return '"__Fn__"';

  if (seen.has(value)) return '"__Cycle__"';
  seen.add(value);
  try {
    if (ArrayBuffer.isView(value)) {
      const ctor = value.constructor ? value.constructor.name : 'TypedArray';
      const arr = Array.from(value, (v) => canonicalize(v, seen));
      return `{"__typed__":"${ctor}","d":[${arr.join(',')}]}`;
    }
    if (Array.isArray(value)) {
      return `[${value.map((v) => canonicalize(v, seen)).join(',')}]`;
    }
    if (value instanceof Map) {
      const entries = [...value.entries()]
        .map(([k, v]) => `[${canonicalize(k, seen)},${canonicalize(v, seen)}]`)
        .sort();
      return `{"__map__":[${entries.join(',')}]}`;
    }
    if (value instanceof Set) {
      const items = [...value.values()].map((v) => canonicalize(v, seen)).sort();
      return `{"__set__":[${items.join(',')}]}`;
    }
    const keys = Object.keys(value).sort();
    const parts = keys.map((k) => `${JSON.stringify(k)}:${canonicalize(value[k], seen)}`);
    return `{${parts.join(',')}}`;
  } finally {
    seen.delete(value);
  }
}

export function stableDigest(value) {
  const str = canonicalize(value);
  let h = 2166136261 >>> 0;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619) >>> 0;
  }
  return h.toString(16).padStart(8, '0');
}

export function auditObservation(obs, options = {}) {
  const mode = options.perceptionMode || PERCEPTION_MODES.RAW;
  const allowed = new Set((options.extraAllowedKeys || []).map((k) => String(k).toLowerCase()));
  if (mode === PERCEPTION_MODES.TRACKLET) allowed.add('trackletid');
  if (mode === PERCEPTION_MODES.ENTITY_ORACLE) {
    allowed.add('trackletid');
    allowed.add('entityid');
  }
  const forbidden = new Set(DEFAULT_FORBIDDEN_OBS_KEYS.filter((k) => !allowed.has(k)));
  const leaks = [];
  const seen = new WeakSet();

  function walk(node, path) {
    if (node === null || typeof node !== 'object') return;
    if (seen.has(node)) return;
    seen.add(node);
    if (ArrayBuffer.isView(node) || node instanceof ArrayBuffer) return;
    if (Array.isArray(node)) {
      for (let i = 0; i < node.length; i++) walk(node[i], `${path}[${i}]`);
      return;
    }
    if (node instanceof Map) {
      let idx = 0;
      for (const [k, v] of node.entries()) {
        if (typeof k === 'string' && forbidden.has(k.toLowerCase())) {
          leaks.push({ path: `${path}.Map(${k})`, key: k });
        }
        walk(v, `${path}.Map[${idx++}]`);
      }
      return;
    }
    if (node instanceof Set) {
      let idx = 0;
      for (const v of node.values()) walk(v, `${path}.Set[${idx++}]`);
      return;
    }
    for (const key of Object.keys(node)) {
      const nextPath = path ? `${path}.${key}` : key;
      if (forbidden.has(key.toLowerCase())) leaks.push({ path: nextPath, key });
      walk(node[key], nextPath);
    }
  }

  walk(obs, 'obs');
  return { ok: leaks.length === 0, mode, leaks };
}

export function sealObservation(rawObs, options = {}) {
  const audit = auditObservation(rawObs, options);
  if (!audit.ok && options.strict !== false) {
    const desc = audit.leaks.map((l) => `${l.path} (${l.key})`).join(', ');
    throw new Error(`Seam privacy violation [${audit.mode}]: ${desc}`);
  }
  return deepFreeze(deepClone(rawObs));
}

function interpolateValue(a, b, t) {
  if (typeof a === 'number' && typeof b === 'number') return a + (b - a) * t;
  if (Array.isArray(a) && Array.isArray(b) && a.length === b.length) {
    return a.map((v, i) => interpolateValue(v, b[i], t));
  }
  if (ArrayBuffer.isView(a) && ArrayBuffer.isView(b) && a.length === b.length && a.constructor === b.constructor) {
    const out = new a.constructor(a.length);
    for (let i = 0; i < a.length; i++) out[i] = a[i] + (b[i] - a[i]) * t;
    return out;
  }
  if (a && b && typeof a === 'object' && typeof b === 'object') {
    const out = {};
    for (const k of Object.keys(a)) {
      out[k] = k in b ? interpolateValue(a[k], b[k], t) : deepClone(a[k]);
    }
    return out;
  }
  return t < 0.5 ? deepClone(a) : deepClone(b);
}

// Sonda ciaglosci sygnalu (szczepionka przeciw N10 — np. isRockRay widzacy 36/36 skal na interpolowanym niebie!).
// Przepuszcza przez czysty klasyfikator lub fabryke umyslu ciagly gradient miedzy probkami A i B
// i wykrywa nagly falszywy pik / zalamanie (np. wartosc posrednia przekraczajaca oba krance albo skok > maxJump).
export function sweepSensoryGradient(evaluator, sampleA, sampleB, options = {}) {
  const steps = Math.max(4, options.steps ?? 32);
  const maxJump = options.maxJump ?? 0.45;
  const scoreFn = options.scoreFn || ((out) => (typeof out === 'number' ? out : typeof out === 'boolean' ? (out ? 1 : 0) : 0));
  const series = [];
  const spikes = [];

  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    const obs = interpolateValue(sampleA, sampleB, t);
    const raw = evaluator(obs, t);
    const score = Number(scoreFn(raw));
    series.push({ t, score, raw });
  }

  const endMin = Math.min(series[0].score, series[series.length - 1].score);
  const endMax = Math.max(series[0].score, series[series.length - 1].score);
  const overshootTol = options.overshootTolerance ?? 0.25;

  for (let i = 1; i < series.length; i++) {
    const jump = Math.abs(series[i].score - series[i - 1].score);
    const overshoot = series[i].score < endMin - overshootTol || series[i].score > endMax + overshootTol;
    if (jump > maxJump || overshoot) {
      spikes.push({
        index: i,
        t: series[i].t,
        score: series[i].score,
        jump,
        overshoot,
      });
    }
  }

  return {
    ok: spikes.length === 0,
    steps,
    endpointRange: [endMin, endMax],
    spikes,
    series,
  };
}

export function normalizeExposureMetrics(records = []) {
  let totalAliveTicks = 0;
  let totalExposures = 0;
  const totals = {};

  for (const r of records) {
    totalAliveTicks += Math.max(0, r.aliveTicks || 0);
    totalExposures += Math.max(0, r.exposures || 0);
    for (const [k, v] of Object.entries(r.events || {})) {
      totals[k] = (totals[k] || 0) + (v || 0);
    }
  }

  const per1kAliveTicks = {};
  const per100Exposures = {};
  for (const [k, sum] of Object.entries(totals)) {
    per1kAliveTicks[k] = totalAliveTicks > 0 ? (sum * 1000) / totalAliveTicks : null;
    per100Exposures[k] = totalExposures > 0 ? (sum * 100) / totalExposures : null;
  }

  return {
    agentCount: records.length,
    totalAliveTicks,
    totalExposures,
    totals,
    per1kAliveTicks,
    per100Exposures,
  };
}
