// tests/kalibrator-smoke.test.mjs — test uruchomieniowy jednoplikowego HTML kalibratora P00 (bez przegladarki).

import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import vm from 'node:vm';

const ROOT = resolve(fileURLToPath(new URL('..', import.meta.url)));
const HTML_PATH = join(ROOT, 'proby', '00-kalibrator-mikroskopu', 'dist', 'kalibrator-mikroskopu.html');

assert.ok(existsSync(HTML_PATH), `Brak zbudowanego pliku ${HTML_PATH} — uruchom npm run build:kalibrator`);
const html = readFileSync(HTML_PATH, 'utf8');
const scriptMatch = html.match(/<script>([\s\S]*?)<\/script>/);
assert.ok(scriptMatch, 'Plik HTML musi zawierac wbudowany blok <script>');
const code = scriptMatch[1];

assert.ok(!/^\s*(?:import|export)\s+/m.test(code), 'Samodzielny plik HTML nie moze zawierac surowych import/export');

function createIsolatedInstance() {
  const bySel = new Map();
  let canvasCalls = 0;
  let winListeners = 0;

  const ctx = {
    clearRect() { canvasCalls++; },
    fillRect() { canvasCalls++; },
    strokeRect() { canvasCalls++; },
    setTransform() { canvasCalls++; },
    beginPath() { canvasCalls++; },
    moveTo() { canvasCalls++; },
    lineTo() { canvasCalls++; },
    arc() { canvasCalls++; },
    closePath() { canvasCalls++; },
    fill() { canvasCalls++; },
    stroke() { canvasCalls++; },
    save() { canvasCalls++; },
    restore() { canvasCalls++; },
    rect() { canvasCalls++; },
    clip() { canvasCalls++; },
    setLineDash() { canvasCalls++; },
    fillText() { canvasCalls++; },
  };

  function makeEl(tag = 'div') {
    const el = {
      tagName: tag.toUpperCase(),
      className: '',
      textContent: '',
      value: 'OTWARTE',
      disabled: false,
      style: {},
      dataset: {},
      width: 960,
      height: 560,
      children: [],
      classList: { toggle() {}, add() {} },
      getBoundingClientRect: () => ({ left: 0, top: 0, width: 960, height: 560 }),
      getContext: () => ctx,
      appendChild(child) { this.children.push(child); return child; },
      addEventListener() {},
      querySelector(sel) {
        if (sel === 'canvas' || sel === '[data-role="main-canvas"]') return canvasEl;
        if (sel === '[data-role="xray-canvas"]') return xrayCanvasEl;
        if (!bySel.has(sel)) bySel.set(sel, makeEl('button'));
        return bySel.get(sel);
      },
      set innerHTML(_v) {},
    };
    return el;
  }

  const canvasEl = makeEl('canvas');
  const xrayCanvasEl = makeEl('canvas');
  xrayCanvasEl.width = 960;
  xrayCanvasEl.height = 128;
  const appRoot = makeEl('div');
  const sandbox = {
    console, Math, Number, String, Boolean, Array, Object, Map, Set, WeakSet,
    JSON, Date, Error, TypeError, Float32Array, Uint8Array, ArrayBuffer, structuredClone,
    navigator: {},
    window: {
      addEventListener() { winListeners++; },
      removeEventListener() { winListeners--; },
    },
    document: {
      getElementById: () => appRoot,
      createElement: (tag) => makeEl(tag),
    },
  };
  sandbox.globalThis = sandbox;
  vm.runInNewContext(code, sandbox, { filename: 'kalibrator-mikroskopu.html' });
  return {
    api: sandbox.window.__RB_MICROSCOPE__,
    getCanvasCalls: () => canvasCalls,
    getWinListeners: () => winListeners,
  };
}

// 1. Parzystosc czasu 60Hz vs 144Hz w niezaleznych instancjach
const runRate = (fps) => {
  const { api } = createIsolatedInstance();
  const stepMs = 1000 / fps;
  for (let i = 0; i < fps; i++) api.advanceByMs(stepMs);
  return api.getState().tick;
};
const ticks60 = runRate(60);
const ticks144 = runRate(144);
assert.equal(ticks60, 60, `60Hz powinno dac 60 tickow/s, wyszlo ${ticks60}`);
assert.equal(ticks144, 60, `144Hz powinno dac 60 tickow/s, wyszlo ${ticks144}`);

// 2. Pelny cykl: WATCH -> MARK@90 -> WATCH do 120 -> FORK -> proba MARK w FORK NIE psuje forkOriginTick!
const inst = createIsolatedInstance();
const { api } = inst;
for (let i = 0; i < 90; i++) api.advanceByMs(1000 / 60);
api.doMark();
for (let i = 0; i < 30; i++) api.advanceByMs(1000 / 60);
api.doFork();
assert.equal(api.getState().forkOriginTick, 90);
api.doMark(); // w FORK ma byc ignorowane, nie psuc forkOriginTick!
assert.equal(api.getState().forkOriginTick, 90, 'doMark w trybie FORK nie moze zepsuc forkOriginTick');

// 3. Brak rozjazdu przed interwencja + PRIVATE_RESEARCH_CUT + trwały rozjazd przez >620 tickow (>10s)!
for (let i = 0; i < 20; i++) api.advanceByMs(1000 / 60);
assert.equal(api.getState().divergence.diverged, false);

api.doCutMemoryB();
for (let i = 0; i < 620; i++) api.advanceByMs(1000 / 60);
const div = api.getState().divergence;
assert.equal(div.diverged, true);
assert.equal(div.earliest.layer, 'privateState', `Po >600 tickach w UI pierwszy rozjazd musi pozostac privateState, wyszlo ${div.earliest.layer}`);
assert.equal(div.earliest.tick, 111);

// 4. Szuflada Oko i wnetrze (I) w FORK + widok SPLIT + +1 tick + takeover/RELEASE + destroy()
api.toggleXray(true);
assert.equal(api.getState().xrayOpen, true);
const prevTick = api.getState().tick;
api.stepOneTick();
assert.equal(api.getState().tick, prevTick + 1, '+1 tick musi posunac symulacje dokladnie o 1 krok');

api.setViewLayout('SPLIT');
api.advanceByMs(1000 / 60);
assert.equal(api.getState().viewLayout, 'SPLIT');

api.toggleTakeoverB();
assert.equal(api.getState().motorTakeoverActive, true);
for (let i = 0; i < 5; i++) api.advanceByMs(1000 / 60);
api.toggleTakeoverB();
assert.equal(api.getState().motorTakeoverActive, false);
assert.ok(api.getState().divergence.interventionsB.some((e) => e.kind === 'RELEASE' && e.layer === 'MOTOR_AUTHORITY'));

assert.ok(inst.getCanvasCalls() > 500);
api.destroy();
assert.equal(inst.getWinListeners(), 0, 'destroy() musi wyczyscic wszystkie listenery window');

console.log(`[PASS] kalibrator-smoke.test.mjs (60Hz=${ticks60}, 144Hz=${ticks144}, firstDiv=${div.earliest.layer}@${div.earliest.tick} po +620t, Xray+SPLIT+step1+RELEASE+destroy OK)`);
