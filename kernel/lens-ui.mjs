// kernel/lens-ui.mjs — cichy, reuzywalny mikroskop przegladarkowy dla gramatyki MEDIUM-D/R0.
// Domyslny stan: WATCH (swiat zyje, interfejs nie zaslania).
// Opcjonalna szuflada "Oko i wnetrze (I)" czyta wylacznie bezpieczna migawke `branch.lastStep` (zero efektow ubocznych!).

import { INTERVENTION_LAYERS, createDivergenceTracker, formatOwnerVerdictCard } from './fork-microscope.mjs';

export const FIXED_DT = 1 / 60;

export function defaultMapKeysToAction(keys) {
  let thrust = 0;
  let turn = 0;
  if (keys.has('KeyW') || keys.has('ArrowUp')) thrust += 1;
  if (keys.has('KeyS') || keys.has('ArrowDown')) thrust -= 0.7;
  if (keys.has('KeyA') || keys.has('ArrowLeft')) turn -= 1;
  if (keys.has('KeyD') || keys.has('ArrowRight')) turn += 1;
  return { thrust, turn };
}

function fitRect(boxX, boxY, boxW, boxH, worldW, worldH) {
  const scale = Math.min(boxW / worldW, boxH / worldH);
  const w = worldW * scale;
  const h = worldH * scale;
  return { x: boxX + (boxW - w) * 0.5, y: boxY + (boxH - h) * 0.5, w, h, scale };
}

function extractScalars(obj, prefix = '', out = []) {
  if (!obj || typeof obj !== 'object') return out;
  for (const k of Object.keys(obj)) {
    const v = obj[k];
    if (typeof v === 'number' && Number.isFinite(v)) {
      out.push({ key: prefix ? `${prefix}.${k}` : k, val: v });
    }
    if (out.length >= 6) break;
  }
  return out;
}

function drawXrayRow(ctx, x, y, w, h, snap, accent, label) {
  ctx.fillStyle = '#0c121a';
  ctx.fillRect(x, y, w, h);
  ctx.strokeStyle = 'rgba(148,175,204,0.14)';
  ctx.strokeRect(x + 0.5, y + 0.5, w - 1, h - 1);

  ctx.fillStyle = accent;
  ctx.font = '11px monospace';
  ctx.fillText(label, x + 8, y + 14);

  if (!snap || !snap.obs) {
    ctx.fillStyle = '#7b8fa6';
    ctx.fillText('brak probki kroku', x + 120, y + 14);
    return;
  }

  // 1. Siatkowka 1D (lewa czesc)
  const ret = Array.isArray(snap.obs.retina) ? snap.obs.retina : [];
  const rx = x + 8;
  const ry = y + 20;
  const rw = Math.min(340, w * 0.38);
  const rh = Math.max(16, h - 26);
  ctx.fillStyle = '#070b10';
  ctx.fillRect(rx, ry, rw, rh);
  if (ret.length > 0) {
    const cellW = rw / ret.length;
    for (let i = 0; i < ret.length; i++) {
      const s = ret[i];
      const rgb = Array.isArray(s) ? s : s && Array.isArray(s.rgb) ? s.rgb : [0.08, 0.1, 0.14];
      const prox = s && typeof s.proximity === 'number' ? s.proximity : 1;
      const barH = Math.max(4, Math.min(1, prox * 0.85 + 0.15) * rh);
      ctx.fillStyle = `rgb(${Math.round(Math.min(1, rgb[0]) * 255)},${Math.round(Math.min(1, rgb[1]) * 255)},${Math.round(Math.min(1, rgb[2]) * 255)})`;
      ctx.fillRect(rx + i * cellW, ry + (rh - barH), Math.max(1, cellW - 0.5), barH);
      if (s && (s.trackletId || s.entityId)) {
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(rx + i * cellW + cellW * 0.3, ry + 1, Math.max(1.5, cellW * 0.4), 2.5);
      }
    }
  }

  // 2. Rozeta dotyku + wektor proprio (srodek)
  const cx = rx + rw + 42;
  const cy = y + h * 0.54;
  const rad = Math.min(18, h * 0.34);
  ctx.strokeStyle = 'rgba(148,175,204,0.32)';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.arc(cx, cy, rad, 0, Math.PI * 2);
  ctx.stroke();

  const touch = snap.obs.touch || {};
  const sectors = [
    { val: touch.front || 0, a0: -Math.PI * 0.75, a1: -Math.PI * 0.25 },
    { val: touch.right || 0, a0: -Math.PI * 0.25, a1: Math.PI * 0.5 },
    { val: touch.left || 0, a0: Math.PI * 0.5, a1: Math.PI * 1.25 },
  ];
  for (const sec of sectors) {
    if (sec.val > 0.02) {
      ctx.strokeStyle = `rgba(245,165,74,${Math.min(1, 0.35 + sec.val * 0.65)})`;
      ctx.lineWidth = 3.5;
      ctx.beginPath();
      ctx.arc(cx, cy, rad + 2, sec.a0, sec.a1);
      ctx.stroke();
    }
  }
  const prop = snap.obs.proprio || {};
  const vx = (prop.vxBody || 0) * 6;
  const vy = (prop.vyBody || 0) * 6;
  ctx.strokeStyle = accent;
  ctx.lineWidth = 1.6;
  ctx.beginPath();
  ctx.moveTo(cx, cy);
  ctx.lineTo(cx + Math.max(-rad, Math.min(rad, vy)), cy - Math.max(-rad, Math.min(rad, vx)));
  ctx.stroke();

  // 3. Prywatne wnetrze (appraisal / prediction / action)
  const sx = cx + rad + 24;
  const sw = Math.max(120, x + w - sx - 10);
  const scalars = [
    ...extractScalars(snap.appraisal, 'ocena'),
    ...extractScalars(snap.prediction, 'pred'),
    ...extractScalars(snap.action, 'akt'),
  ].slice(0, 5);

  const barStep = Math.max(12, Math.floor((h - 14) / Math.max(1, scalars.length)));
  ctx.font = '10px monospace';
  scalars.forEach((item, idx) => {
    const by = y + 18 + idx * barStep;
    ctx.fillStyle = '#9bb0c7';
    ctx.fillText(item.key.slice(0, 18), sx, by);
    const bx = sx + 122;
    const bw = Math.max(40, sw - 165);
    const mid = bx + bw * 0.5;
    ctx.fillStyle = '#182230';
    ctx.fillRect(bx, by - 8, bw, 7);
    const clamped = Math.max(-1, Math.min(1, item.val));
    ctx.fillStyle = clamped >= 0 ? accent : '#f07178';
    const len = Math.abs(clamped) * (bw * 0.5);
    ctx.fillRect(clamped >= 0 ? mid : mid - len, by - 8, len, 7);
    ctx.fillStyle = '#d8e6f5';
    ctx.fillText(item.val.toFixed(2), bx + bw + 5, by);
  });

  if (snap.motorOverridden) {
    ctx.fillStyle = '#f5a54a';
    ctx.font = 'bold 10px monospace';
    ctx.fillText('WASD OVERRIDE', x + w - 96, y + 13);
  }
}

export function mountMicroscope({
  root,
  session,
  probeId = 'proba',
  bannerText = 'OKAZ BADAWCZY',
  isCalibrator = false,
  actorId = 'actor-0',
  materialHint = 'Przeciagnij obiekt mysza w B = MATERIAL',
  mapKeysToAction = defaultMapKeysToAction,
  commitSha = null,
}) {
  let mode = 'WATCH'; // 'WATCH' | 'FORK'
  let viewLayout = 'GHOST'; // 'GHOST' | 'SPLIT'
  let paused = false;
  let xrayOpen = false;
  let capturedMark = null;
  let forkOriginTick = null;
  let branchA = session.main;
  let branchB = null;
  let divTracker = null;
  let motorTakeoverActive = false;
  let draggingBodyId = null;
  let hoverBodyId = null;
  let accum = 0;
  let lastTs = null;
  let rafId = null;
  let destroyed = false;
  const keys = new Set();

  const verdictOptions = isCalibrator
    ? [
        ['OTWARTE', 'OTWARTE'],
        ['APARATURA_OK', 'APARATURA_OK'],
        ['APARATURA_DO_POPRAWY', 'APARATURA_DO_POPRAWY'],
      ]
    : [
        ['OTWARTE', 'OTWARTE'],
        ['KIERUNEK_WARTY_DRAZENIA', 'KIERUNEK_WARTY_DRAZENIA'],
        ['OWNER_LIFE_FAIL', 'OWNER_LIFE_FAIL'],
      ];

  root.innerHTML = '';
  const wrap = document.createElement('div');
  wrap.className = 'rb-wrap';
  wrap.innerHTML = `
    <header class="rb-top">
      <div class="rb-brand">
        <span class="rb-pill" data-role="banner"></span>
        <span class="rb-meta" data-role="meta">WATCH · tick 0</span>
      </div>
      <div class="rb-top-right">
        <button class="rb-btn" data-act="xray" title="Klawisz I">Oko i wnetrze (I)</button>
        <button class="rb-btn" data-act="pause">Pauza</button>
        <button class="rb-btn" data-act="step1" style="display:none" title="Jeden krok do przodu">+1 tick</button>
        <button class="rb-btn" data-act="verdict">Werdykt Ownera</button>
      </div>
    </header>
    <main class="rb-stage">
      <canvas class="rb-canvas" data-role="main-canvas" width="960" height="540"></canvas>
      <div class="rb-div-badge" data-role="divbadge" style="display:none"></div>
      <div class="rb-xray-box" data-role="xray-box" style="display:none">
        <canvas class="rb-xray-canvas" data-role="xray-canvas" width="960" height="128"></canvas>
      </div>
      <section class="rb-verdict-drawer" data-role="drawer" style="display:none">
        <div class="rb-drawer-head">
          <strong>Karta werdyktu Ownera</strong>
          <button class="rb-btn rb-btn-sm" data-act="close-verdict">Zamknij</button>
        </div>
        <div class="rb-drawer-row">
          <select data-role="verdict-select">${verdictOptions.map(([v, l]) => `<option value="${v}">${l}</option>`).join('')}</select>
          <input type="text" data-role="verdict-note" placeholder="Krotka notatka z reki..." />
        </div>
        <div class="rb-drawer-row">
          <button class="rb-btn rb-btn-acc" data-act="download-verdict">Pobierz .verdict.json</button>
          <button class="rb-btn" data-act="export-verdict">Kopiuj JSON</button>
        </div>
        <div class="rb-meta" data-role="copy-status"></div>
        <pre class="rb-verdict-out" data-role="verdict-out"></pre>
      </section>
    </main>
    <footer class="rb-bar">
      <div class="rb-group">
        <button class="rb-btn" data-act="mark" title="Klawisz M">MARK (zamroz moment)</button>
        <button class="rb-btn rb-btn-acc" data-act="fork" title="Klawisz F — 1 klik robi MARK + FORK">FORK teraz (F)</button>
        <div class="rb-seg" data-role="layout-seg" style="display:none">
          <button class="rb-btn rb-btn-sm" data-act="layout-ghost">Duch A+B</button>
          <button class="rb-btn rb-btn-sm" data-act="layout-split">Obok A|B</button>
        </div>
        <button class="rb-btn" data-act="exit-fork" style="display:none">Wroc do WATCH</button>
      </div>
      <div class="rb-group" data-role="interventions" style="display:none">
        <span class="rb-label">Interwencje w B:</span>
        <button class="rb-btn" data-act="cut-mem" title="PRIVATE_RESEARCH_CUT (R)">Wyzeruj pamiec B</button>
        <button class="rb-btn" data-act="takeover" title="MOTOR_AUTHORITY (T + WASD)">Przejmij WASD w B</button>
        <span class="rb-hint" data-role="mat-hint"></span>
      </div>
    </footer>
  `;
  root.appendChild(wrap);

  const canvas = wrap.querySelector('[data-role="main-canvas"]');
  const ctx = canvas.getContext('2d');
  const xrayBox = wrap.querySelector('[data-role="xray-box"]');
  const xrayCanvas = wrap.querySelector('[data-role="xray-canvas"]');
  const xrayCtx = xrayCanvas.getContext('2d');
  const bannerEl = wrap.querySelector('[data-role="banner"]');
  const metaEl = wrap.querySelector('[data-role="meta"]');
  const divBadge = wrap.querySelector('[data-role="divbadge"]');
  const intGroup = wrap.querySelector('[data-role="interventions"]');
  const matHintEl = wrap.querySelector('[data-role="mat-hint"]');
  const btnMark = wrap.querySelector('[data-act="mark"]');
  const btnFork = wrap.querySelector('[data-act="fork"]');
  const btnXray = wrap.querySelector('[data-act="xray"]');
  const layoutSeg = wrap.querySelector('[data-role="layout-seg"]');
  const btnGhost = wrap.querySelector('[data-act="layout-ghost"]');
  const btnSplit = wrap.querySelector('[data-act="layout-split"]');
  const btnExitFork = wrap.querySelector('[data-act="exit-fork"]');
  const btnPause = wrap.querySelector('[data-act="pause"]');
  const btnStep1 = wrap.querySelector('[data-act="step1"]');
  const btnTakeover = wrap.querySelector('[data-act="takeover"]');
  const drawer = wrap.querySelector('[data-role="drawer"]');
  const verdictOut = wrap.querySelector('[data-role="verdict-out"]');
  const verdictSelect = wrap.querySelector('[data-role="verdict-select"]');
  const verdictNote = wrap.querySelector('[data-role="verdict-note"]');
  const copyStatus = wrap.querySelector('[data-role="copy-status"]');

  let logicalW = 960;
  let logicalH = 540;
  let dpr = 1;

  function syncCanvasResolution() {
    const nextDpr = typeof window !== 'undefined' && window.devicePixelRatio ? Math.min(2, window.devicePixelRatio) : 1;
    const nextW = mode === 'FORK' && viewLayout === 'SPLIT' ? 1160 : 960;
    const nextH = mode === 'FORK' && viewLayout === 'SPLIT' ? 400 : 540;
    if (nextDpr !== dpr || nextW !== logicalW || nextH !== logicalH || canvas.width !== Math.round(nextW * nextDpr)) {
      dpr = nextDpr;
      logicalW = nextW;
      logicalH = nextH;
      canvas.width = Math.round(logicalW * dpr);
      canvas.height = Math.round(logicalH * dpr);
      if (ctx.setTransform) ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }
  }

  bannerEl.textContent = bannerText;
  if (isCalibrator && bannerEl.classList && bannerEl.classList.add) bannerEl.classList.add('rb-pill-cal');
  matHintEl.textContent = materialHint;

  function currentDivergence() {
    return mode === 'FORK' && branchB && divTracker ? divTracker.summary(branchA, branchB) : null;
  }

  function refreshVerdictPreview() {
    const card = formatOwnerVerdictCard({
      probeId,
      verdict: verdictSelect.value,
      markTick: mode === 'FORK' ? forkOriginTick : capturedMark ? capturedMark.tick : session.main.tick,
      divergence: currentDivergence(),
      note: verdictNote.value,
      commitSha,
    });
    const text = JSON.stringify(card, null, 2);
    verdictOut.textContent = text;
    return text;
  }

  function updateControls() {
    const inFork = mode === 'FORK' && branchB !== null;
    btnMark.disabled = inFork;
    btnFork.textContent = capturedMark ? `FORK od @${capturedMark.tick} (F)` : 'FORK teraz (F)';
    intGroup.style.display = inFork ? 'flex' : 'none';
    layoutSeg.style.display = inFork ? 'inline-flex' : 'none';
    btnExitFork.style.display = inFork ? 'inline-flex' : 'none';
    divBadge.style.display = inFork ? 'block' : 'none';
    btnStep1.style.display = paused ? 'inline-flex' : 'none';
    xrayBox.style.display = xrayOpen ? 'block' : 'none';
    btnXray.classList.toggle('rb-btn-acc', xrayOpen);
    btnGhost.classList.toggle('rb-btn-acc', viewLayout === 'GHOST');
    btnSplit.classList.toggle('rb-btn-acc', viewLayout === 'SPLIT');
    btnPause.textContent = paused ? 'Wznow' : 'Pauza';
    btnTakeover.textContent = motorTakeoverActive ? 'RELEASE (oddaj sterowanie B)' : 'Przejmij WASD w B';
    btnTakeover.classList.toggle('rb-btn-warn', motorTakeoverActive);
    if (!inFork) canvas.style.cursor = 'default';
    syncCanvasResolution();
  }

  function doMark() {
    if (mode === 'FORK') return;
    capturedMark = session.mark(session.main, `mark@${session.main.tick}`);
    updateControls();
  }

  function doFork() {
    if (!capturedMark) capturedMark = session.mark(session.main, `mark@${session.main.tick}`);
    draggingBodyId = null;
    hoverBodyId = null;
    const [a, b] = session.fork(capturedMark, ['A (kontrola)', 'B (interwencja)']);
    branchA = a;
    branchB = b;
    forkOriginTick = capturedMark.tick;
    divTracker = createDivergenceTracker(forkOriginTick);
    mode = 'FORK';
    motorTakeoverActive = false;
    updateControls();
  }

  function exitFork() {
    if (draggingBodyId !== null && branchB && typeof branchB.world.unpinMovable === 'function') {
      branchB.world.unpinMovable();
    }
    draggingBodyId = null;
    hoverBodyId = null;
    mode = 'WATCH';
    branchA = session.main;
    branchB = null;
    divTracker = null;
    forkOriginTick = null;
    motorTakeoverActive = false;
    updateControls();
  }

  function setViewLayout(nextLayout) {
    viewLayout = nextLayout === 'SPLIT' ? 'SPLIT' : 'GHOST';
    updateControls();
  }

  function toggleXray(forceState = null) {
    xrayOpen = forceState !== null ? Boolean(forceState) : !xrayOpen;
    updateControls();
    renderFrame();
  }

  function doCutMemoryB() {
    if (mode !== 'FORK' || !branchB) return;
    session.intervene(branchB, {
      layer: INTERVENTION_LAYERS.PRIVATE_RESEARCH_CUT,
      description: 'reczny reset prywatnej pamieci w B',
      apply: ({ resetMind }) => resetMind(actorId),
    });
  }

  function toggleTakeoverB() {
    if (mode !== 'FORK' || !branchB) return;
    if (!motorTakeoverActive) {
      motorTakeoverActive = true;
      session.intervene(branchB, {
        layer: INTERVENTION_LAYERS.MOTOR_AUTHORITY,
        description: 'przejecie sterowania WASD przez Ownera w B',
        apply: ({ setMotorOverride }) => {
          setMotorOverride(actorId, () => mapKeysToAction(keys));
        },
      });
    } else {
      motorTakeoverActive = false;
      session.release(branchB, {
        layer: INTERVENTION_LAYERS.MOTOR_AUTHORITY,
        actorId,
        description: 'RELEASE: powrot autonomicznego organu w B',
      });
    }
    updateControls();
  }

  function getViewRects() {
    const w = (branchB || branchA).world;
    const worldW = w.width || 960;
    const worldH = w.height || 560;
    if (mode === 'FORK' && viewLayout === 'SPLIT') {
      const half = logicalW * 0.5;
      return {
        rectA: fitRect(0, 0, half - 4, logicalH, worldW, worldH),
        rectB: fitRect(half + 4, 0, half - 4, logicalH, worldW, worldH),
        worldW,
        worldH,
      };
    }
    const full = fitRect(0, 0, logicalW, logicalH, worldW, worldH);
    return { rectA: full, rectB: full, worldW, worldH };
  }

  function canvasToWorldB(ev) {
    const rect = canvas.getBoundingClientRect();
    const cx = ((ev.clientX - rect.left) / Math.max(1, rect.width)) * logicalW;
    const cy = ((ev.clientY - rect.top) / Math.max(1, rect.height)) * logicalH;
    const { rectB, worldW, worldH } = getViewRects();
    if (cx < rectB.x || cx > rectB.x + rectB.w || cy < rectB.y || cy > rectB.y + rectB.h) return null;
    return {
      x: ((cx - rectB.x) / rectB.w) * worldW,
      y: ((cy - rectB.y) / rectB.h) * worldH,
    };
  }

  const onPointerDown = (ev) => {
    if (mode !== 'FORK' || !branchB || typeof branchB.world.pickMovable !== 'function') return;
    const pt = canvasToWorldB(ev);
    if (!pt) return;
    const id = branchB.world.pickMovable(pt.x, pt.y);
    if (id !== null) {
      draggingBodyId = id;
      canvas.style.cursor = 'grabbing';
      if (canvas.setPointerCapture && ev.pointerId !== undefined) {
        try { canvas.setPointerCapture(ev.pointerId); } catch {}
      }
      session.intervene(branchB, {
        layer: INTERVENTION_LAYERS.MATERIAL,
        description: `przesuniecie obiektu #${id} w B`,
        apply: ({ world }) => {
          if (typeof world.pinMovable === 'function') world.pinMovable(id, pt.x, pt.y);
          else world.moveMovable(id, pt.x, pt.y);
        },
      });
    }
  };

  const onPointerMove = (ev) => {
    if (mode !== 'FORK' || !branchB) {
      hoverBodyId = null;
      canvas.style.cursor = 'default';
      return;
    }
    const pt = canvasToWorldB(ev);
    if (draggingBodyId !== null) {
      if (pt) {
        if (typeof branchB.world.pinMovable === 'function') branchB.world.pinMovable(draggingBodyId, pt.x, pt.y);
        else branchB.world.moveMovable(draggingBodyId, pt.x, pt.y);
      }
      return;
    }
    if (pt && typeof branchB.world.pickMovable === 'function') {
      hoverBodyId = branchB.world.pickMovable(pt.x, pt.y);
      canvas.style.cursor = hoverBodyId !== null ? 'grab' : 'default';
    } else {
      hoverBodyId = null;
      canvas.style.cursor = 'default';
    }
  };

  const endDrag = () => {
    if (draggingBodyId !== null && mode === 'FORK' && branchB) {
      if (typeof branchB.world.unpinMovable === 'function') branchB.world.unpinMovable();
      session.release(branchB, {
        layer: INTERVENTION_LAYERS.MATERIAL,
        description: `puszczenie obiektu #${draggingBodyId} w B`,
      });
    }
    draggingBodyId = null;
    canvas.style.cursor = hoverBodyId !== null && mode === 'FORK' ? 'grab' : 'default';
  };

  canvas.addEventListener('pointerdown', onPointerDown);
  canvas.addEventListener('pointermove', onPointerMove);
  canvas.addEventListener('pointerup', endDrag);
  canvas.addEventListener('pointercancel', endDrag);
  canvas.addEventListener('pointerleave', endDrag);

  verdictSelect.addEventListener('change', refreshVerdictPreview);
  verdictNote.addEventListener('input', refreshVerdictPreview);

  wrap.addEventListener('click', (ev) => {
    const btn = ev.target && ev.target.closest ? ev.target.closest('[data-act]') : null;
    if (!btn) return;
    const act = btn.dataset.act;
    if (act === 'mark') doMark();
    else if (act === 'fork') doFork();
    else if (act === 'exit-fork') exitFork();
    else if (act === 'layout-ghost') setViewLayout('GHOST');
    else if (act === 'layout-split') setViewLayout('SPLIT');
    else if (act === 'xray') toggleXray();
    else if (act === 'pause') {
      paused = !paused;
      updateControls();
    } else if (act === 'step1') {
      stepOneTick();
      renderFrame();
    } else if (act === 'cut-mem') doCutMemoryB();
    else if (act === 'takeover') toggleTakeoverB();
    else if (act === 'verdict') {
      drawer.style.display = drawer.style.display === 'none' ? 'block' : 'none';
      copyStatus.textContent = '';
      refreshVerdictPreview();
    } else if (act === 'close-verdict') {
      drawer.style.display = 'none';
    } else if (act === 'download-verdict') {
      const text = refreshVerdictPreview();
      if (typeof Blob !== 'undefined' && typeof URL !== 'undefined' && URL.createObjectURL) {
        const blob = new Blob([text], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${probeId}-verdict.json`;
        if (a.click) a.click();
        setTimeout(() => URL.revokeObjectURL(url), 1000);
        copyStatus.textContent = `Pobrano plik ${probeId}-verdict.json.`;
      }
    } else if (act === 'export-verdict') {
      const text = refreshVerdictPreview();
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard
          .writeText(text)
          .then(() => { copyStatus.textContent = 'Skopiowano JSON do schowka.'; })
          .catch(() => { copyStatus.textContent = 'Schowek zablokowany — uzyj Pobierz .verdict.json.'; });
      } else {
        copyStatus.textContent = 'Uzyj Pobierz .verdict.json lub skopiuj recznie.';
      }
    }
  });

  const onKeyDown = (e) => {
    if (e.ctrlKey || e.metaKey || e.altKey) return;
    const tag = e.target && e.target.tagName;
    if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;
    if (motorTakeoverActive && ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space'].includes(e.code)) {
      if (e.preventDefault) e.preventDefault();
    }
    keys.add(e.code);
    if (e.repeat) return;
    if (e.code === 'KeyM') doMark();
    if (e.code === 'KeyF') doFork();
    if (e.code === 'KeyI') toggleXray();
    if (e.code === 'KeyR' && mode === 'FORK') doCutMemoryB();
    if (e.code === 'KeyT' && mode === 'FORK') toggleTakeoverB();
  };
  const onKeyUp = (e) => keys.delete(e.code);
  const onBlur = () => keys.clear();

  if (typeof window !== 'undefined') {
    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    window.addEventListener('blur', onBlur);
  }

  function stepOneTick() {
    if (mode === 'FORK' && branchB) {
      const fa = session.stepBranch(branchA, null, { captureLastStep: true });
      const fb = session.stepBranch(branchB, null, { captureLastStep: true });
      if (divTracker) divTracker.recordPair(fa, fb);
    } else {
      session.stepBranch(session.main, null, { recordTrace: false, auditSeam: true, captureLastStep: true });
    }
  }

  function renderXray() {
    if (!xrayOpen) return;
    const xw = xrayCanvas.width;
    const xh = xrayCanvas.height;
    xrayCtx.clearRect(0, 0, xw, xh);
    if (mode === 'FORK' && branchB) {
      const snapA = branchA.lastStep && branchA.lastStep.byActor[actorId];
      const snapB = branchB.lastStep && branchB.lastStep.byActor[actorId];
      const rowH = Math.floor((xh - 8) * 0.5);
      drawXrayRow(xrayCtx, 0, 0, xw, rowH, snapA, '#4ad8c4', `OKO A (${actorId})`);
      // Cienki pasek roznicy |A - B| na promieniach siatkowki
      const retA = snapA && snapA.obs && Array.isArray(snapA.obs.retina) ? snapA.obs.retina : [];
      const retB = snapB && snapB.obs && Array.isArray(snapB.obs.retina) ? snapB.obs.retina : [];
      const rw = Math.min(340, xw * 0.38);
      xrayCtx.fillStyle = '#070a0f';
      xrayCtx.fillRect(0, rowH + 1, xw, 6);
      if (retA.length && retA.length === retB.length) {
        const cellW = rw / retA.length;
        for (let i = 0; i < retA.length; i++) {
          const a = retA[i].rgb || [0, 0, 0];
          const b = retB[i].rgb || [0, 0, 0];
          const diff = Math.abs(a[0] - b[0]) + Math.abs(a[1] - b[1]) + Math.abs(a[2] - b[2]);
          if (diff > 0.01) {
            xrayCtx.fillStyle = `rgba(245,165,74,${Math.min(1, 0.3 + diff * 2)})`;
            xrayCtx.fillRect(8 + i * cellW, rowH + 1, Math.max(1.5, cellW - 0.5), 6);
          }
        }
      }
      drawXrayRow(xrayCtx, 0, rowH + 8, xw, rowH, snapB, '#f5a54a', `OKO B (${actorId})`);
    } else {
      const snap = session.main.lastStep && session.main.lastStep.byActor[actorId];
      drawXrayRow(xrayCtx, 0, 0, xw, xh, snap, '#4ad8c4', `OKO I WNETRZE (${actorId} · tryb WATCH)`);
    }
  }

  function renderFrame() {
    syncCanvasResolution();
    ctx.clearRect(0, 0, logicalW, logicalH);
    const { rectA, rectB } = getViewRects();
    if (mode === 'FORK' && branchB) {
      if (viewLayout === 'SPLIT') {
        const half = logicalW * 0.5;
        ctx.fillStyle = '#080c12';
        ctx.fillRect(0, 0, logicalW, logicalH);

        ctx.save();
        ctx.beginPath(); ctx.rect(rectA.x, rectA.y, rectA.w, rectA.h); ctx.clip();
        branchA.world.render(ctx, { x: rectA.x, y: rectA.y, w: rectA.w, h: rectA.h, tint: 'A', ghost: false, label: 'A (kontrola)' });
        ctx.restore();

        ctx.save();
        ctx.beginPath(); ctx.rect(rectB.x, rectB.y, rectB.w, rectB.h); ctx.clip();
        branchB.world.render(ctx, {
          x: rectB.x, y: rectB.y, w: rectB.w, h: rectB.h, tint: 'B', ghost: false,
          hoverId: draggingBodyId ?? hoverBodyId, label: 'B (interwencja)',
        });
        ctx.restore();

        ctx.strokeStyle = 'rgba(255,255,255,0.22)';
        ctx.lineWidth = 2;
        ctx.beginPath(); ctx.moveTo(half, 0); ctx.lineTo(half, logicalH); ctx.stroke();
      } else {
        branchA.world.render(ctx, { x: rectA.x, y: rectA.y, w: rectA.w, h: rectA.h, tint: 'A', ghost: true, label: 'Duch A (turkus)' });
        branchB.world.render(ctx, {
          x: rectB.x, y: rectB.y, w: rectB.w, h: rectB.h, tint: 'B', ghost: false, overlay: true,
          hoverId: draggingBodyId ?? hoverBodyId, label: 'Zywy B (bursztyn)',
        });
      }

      const div = currentDivergence();
      metaEl.textContent = `FORK od tick ${forkOriginTick} · teraz ${branchA.tick}`;
      if (!div || !div.diverged) {
        divBadge.textContent = 'A i B identyczne co do bitu — wykonaj interwencje w B';
        divBadge.className = 'rb-div-badge rb-div-same';
      } else {
        const l = div.firstByLayer;
        divBadge.textContent = `Pierwszy rozjazd: tick ${div.earliest.tick} (${div.earliest.layer}) | obs:${l.observation ?? '-'} · pamiec:${l.privateState ?? '-'} · akcja:${l.action ?? '-'} · swiat:${l.worldAfterstate ?? '-'}`;
        divBadge.className = 'rb-div-badge rb-div-diff';
      }
    } else {
      session.main.world.render(ctx, { x: rectA.x, y: rectA.y, w: rectA.w, h: rectA.h, tint: 'A', ghost: false, label: 'WATCH' });
      metaEl.textContent = `WATCH · tick ${session.main.tick}${capturedMark ? ` · MARK @ ${capturedMark.tick}` : ''}`;
    }
    renderXray();
  }

  function advanceByMs(deltaMs) {
    if (destroyed) return;
    const dtSec = Math.min(0.1, Math.max(0, deltaMs / 1000));
    if (!paused) {
      accum += dtSec;
      while (accum >= FIXED_DT - 1e-9) {
        stepOneTick();
        accum -= FIXED_DT;
      }
    }
    renderFrame();
  }

  function rafLoop(ts) {
    if (destroyed) return;
    if (lastTs === null) lastTs = ts;
    const d = ts - lastTs;
    lastTs = ts;
    advanceByMs(d);
    if (typeof requestAnimationFrame === 'function') rafId = requestAnimationFrame(rafLoop);
  }

  function destroy() {
    destroyed = true;
    if (rafId !== null && typeof cancelAnimationFrame === 'function') cancelAnimationFrame(rafId);
    if (typeof window !== 'undefined' && window.removeEventListener) {
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
      window.removeEventListener('blur', onBlur);
    }
    keys.clear();
  }

  updateControls();
  renderFrame();
  if (typeof requestAnimationFrame === 'function') rafId = requestAnimationFrame(rafLoop);

  return {
    advanceByMs,
    stepOneTick: () => { stepOneTick(); renderFrame(); },
    doMark,
    doFork,
    exitFork,
    setViewLayout,
    toggleXray,
    doCutMemoryB,
    toggleTakeoverB,
    destroy,
    getState: () => ({
      mode,
      viewLayout,
      paused,
      xrayOpen,
      motorTakeoverActive,
      tick: mode === 'FORK' && branchB ? branchA.tick : session.main.tick,
      markTick: capturedMark ? capturedMark.tick : null,
      forkOriginTick,
      divergence: currentDivergence(),
    }),
  };
}
