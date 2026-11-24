// kernel/seam.mjs — twardy szew prywatnosci obs, ablacja percepcji, PRNG i uczciwe metryki.
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

// Deterministyczny skrot niezalezny od kolejnosci kluczy, odporny na NaN/Infinity/undefined/Map/Set/TypedArray/cykle.
export function stableDigest(value) {
  const str = canonicalize(value);
  let h = 2166136261 >>> 0;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619) >>> 0;
  }
  return h.toString(16).padStart(8, '0');
}

// Audyt szczelnosci obserwacji obs (case-insensitive, obsluguje Map/Set i chroni przed cyklami).
// W trybie 'tracklet' dopuszcza wylacznie nietrwaly trackletId; w 'entity-oracle' dopuszcza diagnostyczny entityId.
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

// Uczciwa normalizacja metryk (lekcja N12): nigdy nie dzieli skumulowanych statystyk przez koncowa populacje.
// Przy zerowym mianowniku zwraca null (nigdy nie maskuje 0 zywych tickow jako '0 bledow/1k').
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
