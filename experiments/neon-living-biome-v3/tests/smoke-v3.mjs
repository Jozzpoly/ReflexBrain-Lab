// tests/smoke-v3.mjs — Real execution smoke test of bundled dist/reflexbrain-v3.html
// Tests: JS bundle execution, 0 runtime errors across normal + LOD zoom, 60Hz vs 144Hz parity,
// default collapsed drawers, unrestricted Władza numeric override ("42"), Matter Forge paint,
// Player E-toggle + godMode, and Mind X-Ray matrix rendering.
// Run: node tests/smoke-v3.mjs

import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const htmlPath = path.resolve(__dirname, '..', 'dist', 'reflexbrain-v3.html');

const checks = [];
function check(name, pass, detail) {
  checks.push({ name, pass, detail });
  console.log(`[${pass ? 'PASS' : 'FAIL'}] ${name} — ${detail}`);
}

const html = fs.readFileSync(htmlPath, 'utf8');
const scriptMatch = html.match(/<script>([\s\S]*?)<\/script>/);
if (!scriptMatch) {
  console.error('No <script> tag found in dist/reflexbrain-v3.html');
  process.exit(1);
}
const scriptCode = scriptMatch[1].replace(/<\\\/script>/gi, '</script>');

// Minimal faithful DOM + Canvas 2D mock for real runtime execution
function makeClassList(el) {
  const set = new Set();
  return {
    add: (...c) => { c.forEach((x) => x && set.add(x)); el._syncClass(set); },
    remove: (...c) => { c.forEach((x) => set.delete(x)); el._syncClass(set); },
    toggle: (c, force) => {
      const has = set.has(c);
      const next = force === undefined ? !has : Boolean(force);
      if (next) set.add(c); else set.delete(c);
      el._syncClass(set);
      return next;
    },
    contains: (c) => set.has(c),
    _set: set,
  };
}

function makeCtx2d() {
  let drawCalls = 0;
  const noop = () => { drawCalls++; };
  const grad = { addColorStop: () => {} };
  return {
    fillStyle: '', strokeStyle: '', lineWidth: 1, lineCap: 'butt', lineJoin: 'miter',
    shadowColor: '', shadowBlur: 0, shadowOffsetX: 0, shadowOffsetY: 0,
    font: '', textAlign: 'left', globalAlpha: 1,
    save: noop, restore: noop, setTransform: noop, translate: noop, scale: noop, rotate: noop,
    beginPath: noop, closePath: noop, moveTo: noop, lineTo: noop, quadraticCurveTo: noop,
    arc: noop, ellipse: noop, clip: noop, fill: noop, stroke: noop,
    fillRect: noop, clearRect: noop, strokeRect: noop, fillText: noop, drawImage: noop,
    setLineDash: noop,
    createLinearGradient: () => grad,
    createRadialGradient: () => grad,
    createPattern: () => ({}),
    createImageData: (w, h) => ({ width: w, height: h, data: new Uint8ClampedArray(w * h * 4) }),
    putImageData: noop,
    _getDrawCalls: () => drawCalls,
  };
}

const byId = new Map();

class MockElement {
  constructor(tag) {
    this.tagName = tag.toUpperCase();
    this.children = [];
    this.attrs = new Map();
    this.listeners = new Map();
    this.style = {};
    this.value = '';
    this.checked = false;
    this._innerHTML = '';
    this.textContent = '';
    this.classList = makeClassList(this);
    this.width = 1280;
    this.height = 720;
    this.clientWidth = 1280;
    this.clientHeight = 720;
    this._ctx = null;
  }
  _syncClass(set) { this._className = [...set].join(' '); }
  get className() { return this._className || ''; }
  set className(v) {
    this.classList._set.clear();
    String(v || '').split(/\s+/).filter(Boolean).forEach((c) => this.classList._set.add(c));
    this._className = [...this.classList._set].join(' ');
  }
  get id() { return this.attrs.get('id') || ''; }
  set id(v) { this.setAttribute('id', v); }
  get innerHTML() { return this._innerHTML; }
  set innerHTML(v) {
    this._innerHTML = String(v);
    if (v === '') this.children = [];
  }
  setAttribute(k, v) {
    this.attrs.set(k, String(v));
    if (k === 'id') byId.set(String(v), this);
    if (k === 'value') this.value = String(v);
    if (k === 'checked') this.checked = true;
    if (k === 'width') this.width = Number(v) || 1;
    if (k === 'height') this.height = Number(v) || 1;
  }
  getAttribute(k) { return this.attrs.get(k) ?? null; }
  appendChild(ch) { this.children.push(ch); return ch; }
  append(...chs) { for (const ch of chs) this.appendChild(ch); }
  addEventListener(type, fn) {
    if (!this.listeners.has(type)) this.listeners.set(type, []);
    this.listeners.get(type).push(fn);
  }
  dispatch(type, ev = {}) {
    const fns = this.listeners.get(type) || [];
    for (const fn of fns) fn({ target: this, preventDefault: () => {}, ...ev });
  }
  getBoundingClientRect() { return { left: 0, top: 0, width: this.clientWidth, height: this.clientHeight }; }
  setPointerCapture() {}
  releasePointerCapture() {}
  getContext(kind) {
    if (kind === '2d') {
      if (!this._ctx) this._ctx = makeCtx2d();
      return this._ctx;
    }
    return null;
  }
}

const appRoot = new MockElement('div');
appRoot.setAttribute('id', 'app');
const winListeners = new Map();
let queuedRaf = null;

const sandboxWindow = {
  innerWidth: 1280,
  innerHeight: 720,
  devicePixelRatio: 1,
  addEventListener: (t, fn) => {
    if (!winListeners.has(t)) winListeners.set(t, []);
    winListeners.get(t).push(fn);
  },
  dispatch: (t, ev = {}) => {
    for (const fn of winListeners.get(t) || []) fn({ target: {}, preventDefault: () => {}, ...ev });
  },
};

const sandboxDoc = {
  readyState: 'complete',
  body: appRoot,
  createElement: (tag) => new MockElement(tag),
  createTextNode: (t) => ({ nodeType: 3, textContent: t }),
  getElementById: (id) => byId.get(id) || null,
  addEventListener: () => {},
};

const ctxObj = {
  window: sandboxWindow,
  document: sandboxDoc,
  performance: { now: () => Date.now() },
  requestAnimationFrame: (cb) => { queuedRaf = cb; return 1; },
  console,
  Math, Number, String, Boolean, Array, Object, Map, Set, Float32Array, Float64Array, Uint16Array, Uint8ClampedArray, JSON, Error, RegExp, parseInt, isFinite,
};
ctxObj.globalThis = ctxObj;
ctxObj.self = sandboxWindow;

let runtimeErr = null;
try {
  vm.runInNewContext(scriptCode, ctxObj, { filename: 'reflexbrain-v3.html' });
} catch (err) {
  runtimeErr = err;
}

check('Bundle boots cleanly with zero runtime exceptions', !runtimeErr && Boolean(sandboxWindow.__REFLEXBRAIN_V3__), runtimeErr ? String(runtimeErr) : 'handle exposed');
if (runtimeErr) process.exit(1);

const api = sandboxWindow.__REFLEXBRAIN_V3__;

// 1. Default drawers collapsed (>92% world viewport!)
const wladzaHidden = byId.get('panel-wladza')?.classList.contains('rb-hidden');
const kuzniaHidden = byId.get('panel-kuznia')?.classList.contains('rb-hidden');
const rentgenHidden = byId.get('panel-rentgen')?.classList.contains('rb-hidden');
check('All 3 Blender-style drawers collapsed by default', Boolean(wladzaHidden && kuzniaHidden && rentgenHidden), `wladza=${wladzaHidden}, kuznia=${kuzniaHidden}, rentgen=${rentgenHidden}`);

// 2. Render frames cleanly (normal zoom + LOD zoom > 1.35 + place anchors + rays)
let renderErr = null;
try {
  api.setPaused(true);
  // Trigger 6 RAF frames
  for (let i = 0; i < 6; i++) if (queuedRaf) queuedRaf(1000 + i * 16.67);
  // Enable PlaceGraph overlay and zoom in past LOD_ZOOM (wheel zoom in)
  byId.get('chk-places').checked = true;
  byId.get('chk-places').dispatch('change');
  const mainCanvas = byId.get('biome-canvas');
  for (let i = 0; i < 10; i++) mainCanvas.dispatch('wheel', { clientX: 640, clientY: 360, deltaY: -120 });
  if (queuedRaf) queuedRaf(1200);
} catch (err) {
  renderErr = err;
}
const drawCalls = byId.get('biome-canvas').getContext('2d')._getDrawCalls();
check('Renderer runs normal + LOD zoom + overlays with 0 errors', !renderErr && drawCalls > 500, renderErr ? String(renderErr) : `drawCalls=${drawCalls}`);

// 3. 60Hz vs 144Hz strict FIXED_DT=1/60 parity test
api.setSpeed(1);
api.setPaused(false);
const r60 = api.stepFixedFrames(60, 1 / 60);
const r144 = api.stepFixedFrames(144, 1 / 144);
check(
  '60Hz vs 144Hz 1.0s fixed-timestep parity',
  r60.ticks === 60 && r144.ticks === 60,
  `60Hz->${r60.ticks} ticks, 144Hz->${r144.ticks} ticks`
);

// 4. Unrestricted Władza numeric override ("42" without silent clamping!)
const anomInp = byId.get('param-anomalyStrength');
anomInp.value = '42';
anomInp.dispatch('change');
const warnVisible = !byId.get('wladza-warn').classList.contains('rb-hidden');
const appliedVal = api.world.cfg.anomalyStrength;
check('Władza allows manual override "42" without silent clamp', appliedVal === 42 && warnVisible, `cfg.anomalyStrength=${appliedVal}, warnVisible=${warnVisible}`);
// Restore default
byId.get('btn-defaults').dispatch('click');

// 5. Matter Forge paint custom matter onto biome
const objBefore = api.world.objects.length;
byId.get('brush-custom').dispatch('click');
byId.get('biome-canvas').dispatch('pointerdown', { button: 0, clientX: 640, clientY: 360 });
const objAfter = api.world.objects.length;
const spawnedCustom = api.world.objects[api.world.objects.length - 1];
check('Matter Forge paints custom matter directly into biome', objAfter === objBefore + 1 && spawnedCustom.archetype === 'custom', `objects ${objBefore}->${objAfter}, archetype=${spawnedCustom?.archetype}`);

// 6. Player body toggle + E key grip + godMode + HUD render
api.togglePlayer();
const hasPlayer = Boolean(api.world.player);
sandboxWindow.dispatch('keydown', { code: 'KeyE', repeat: false });
api.stepFixedFrames(10, 1 / 60);
byId.get('chk-godmode').checked = true;
byId.get('chk-godmode').dispatch('change');
api.stepFixedFrames(5, 1 / 60);
const hudHasGod = byId.get('player-hud').innerHTML.includes('Tryb Architekta');
check('Player body + E key + Tryb Architekta HUD work cleanly', hasPlayer && api.world.playerGodMode && hudHasGod, `hasPlayer=${hasPlayer}, godMode=${api.world.playerGodMode}, hudBadge=${hudHasGod}`);

// 7. Mind X-Ray matrix populates live learned prototypes after running 300 ticks
api.stepFixedFrames(300, 1 / 60);
api.toggleDrawer('rentgen', true);
for (let i = 0; i < 8; i++) if (queuedRaf) queuedRaf(2000 + i * 16.67);
const matrixHtml = byId.get('xray-matrix').innerHTML;
const hasTable = matrixHtml.includes('<table class="rb-table">') && matrixHtml.includes('delikatnie') && matrixHtml.includes('uderz');
check('Mind X-Ray renders live 4-action prediction matrix table', hasTable, `matrixLen=${matrixHtml.length}, hasTable=${hasTable}`);

console.log(`\n=== SMOKE-V3 SUMMARY: ${checks.filter((c) => c.pass).length}/${checks.length} PASS ===`);
if (checks.some((c) => !c.pass)) process.exit(1);
