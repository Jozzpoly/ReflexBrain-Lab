// kernel/lens-ui.mjs — cichy, reuzywalny mikroskop przegladarkowy dla gramatyki MEDIUM-D/R0.
// Domyslny stan to WATCH (swiat zyje, interfejs nie zaslania). Zero zewnetrznych zaleznosci.

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

export function mountMicroscope({
  root,
  session,
  probeId = 'proba',
  bannerText = 'OKAZ BADAWCZY',
  isCalibrator = false,
  actorId = 'actor-0',
  materialHint = 'Przeciagnij obiekt mysza w B = MATERIAL',
  mapKeysToAction = defaultMapKeysToAction,
}) {
  let mode = 'WATCH'; // 'WATCH' | 'FORK'
  let viewLayout = 'GHOST'; // 'GHOST' | 'SPLIT'
  let paused = false;
  let capturedMark = null;
  let forkOriginTick = null;
  let branchA = session.main;
  let branchB = null;
  let divTracker = null;
  let motorTakeoverActive = false;
  let draggingBodyId = null;
  let accum = 0;
  let lastTs = null;
  let rafId = null;
  let destroyed = false;
  const keys = new Set();

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
        <button class="rb-btn" data-act="pause">Pauza</button>
        <button class="rb-btn" data-act="verdict">Werdykt Ownera</button>
      </div>
    </header>
    <main class="rb-stage">
      <canvas class="rb-canvas" width="960" height="560"></canvas>
      <div class="rb-div-badge" data-role="divbadge" style="display:none"></div>
      <section class="rb-verdict-drawer" data-role="drawer" style="display:none">
        <div class="rb-drawer-head">
          <strong>Karta werdyktu Ownera</strong>
          <button class="rb-btn rb-btn-sm" data-act="close-verdict">Zamknij</button>
        </div>
        <div class="rb-drawer-row">
          <select data-role="verdict-select">
            <option value="OTWARTE">OTWARTE</option>
            <option value="KIERUNEK_WARTY_DRAZENIA">KIERUNEK_WARTY_DRAZENIA</option>
            <option value="APARATURA_OK">APARATURA_OK</option>
            <option value="OWNER_LIFE_FAIL">OWNER_LIFE_FAIL</option>
          </select>
          <input type="text" data-role="verdict-note" placeholder="Krotka notatka z reki..." />
          <button class="rb-btn rb-btn-acc" data-act="export-verdict">Kopiuj JSON</button>
        </div>
        <div class="rb-meta" data-role="copy-status"></div>
        <pre class="rb-verdict-out" data-role="verdict-out"></pre>
      </section>
    </main>
    <footer class="rb-bar">
      <div class="rb-group">
        <button class="rb-btn rb-btn-acc" data-act="mark" title="Klawisz M">MARK (zamroz moment)</button>
        <button class="rb-btn" data-act="fork" disabled title="Klawisz F">FORK A/B</button>
        <button class="rb-btn" data-act="layout" style="display:none">Widok: Duch A+B</button>
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

  const canvas = wrap.querySelector('canvas');
  const ctx = canvas.getContext('2d');
  const bannerEl = wrap.querySelector('[data-role="banner"]');
  const metaEl = wrap.querySelector('[data-role="meta"]');
  const divBadge = wrap.querySelector('[data-role="divbadge"]');
  const intGroup = wrap.querySelector('[data-role="interventions"]');
  const matHintEl = wrap.querySelector('[data-role="mat-hint"]');
  const btnMark = wrap.querySelector('[data-act="mark"]');
  const btnFork = wrap.querySelector('[data-act="fork"]');
  const btnLayout = wrap.querySelector('[data-act="layout"]');
  const btnExitFork = wrap.querySelector('[data-act="exit-fork"]');
  const btnPause = wrap.querySelector('[data-act="pause"]');
  const btnTakeover = wrap.querySelector('[data-act="takeover"]');
  const drawer = wrap.querySelector('[data-role="drawer"]');
  const verdictOut = wrap.querySelector('[data-role="verdict-out"]');
  const verdictSelect = wrap.querySelector('[data-role="verdict-select"]');
  const verdictNote = wrap.querySelector('[data-role="verdict-note"]');
  const copyStatus = wrap.querySelector('[data-role="copy-status"]');

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
    });
    const text = JSON.stringify(card, null, 2);
    verdictOut.textContent = text;
    return text;
  }

  function updateControls() {
    const inFork = mode === 'FORK' && branchB !== null;
    btnMark.disabled = inFork;
    btnFork.disabled = !capturedMark;
    intGroup.style.display = inFork ? 'flex' : 'none';
    btnLayout.style.display = inFork ? 'inline-flex' : 'none';
    btnExitFork.style.display = inFork ? 'inline-flex' : 'none';
    divBadge.style.display = inFork ? 'block' : 'none';
    btnLayout.textContent = viewLayout === 'GHOST' ? 'Widok: Duch A+B' : 'Widok: Obok siebie A | B';
    btnPause.textContent = paused ? 'Wznow' : 'Pauza';
    btnTakeover.textContent = motorTakeoverActive ? 'RELEASE (oddaj sterowanie B)' : 'Przejmij WASD w B';
    btnTakeover.classList.toggle('rb-btn-warn', motorTakeoverActive);
  }

  function doMark() {
    if (mode === 'FORK') return; // w FORK zachowujemy niezmienny punkt startowy forkOriginTick
    capturedMark = session.mark(session.main, `mark@${session.main.tick}`);
    updateControls();
  }

  function doFork() {
    if (!capturedMark) capturedMark = session.mark(session.main, `mark@${session.main.tick}`);
    draggingBodyId = null;
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
    draggingBodyId = null;
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
      const half = canvas.width * 0.5;
      return {
        rectA: fitRect(0, 0, half, canvas.height, worldW, worldH),
        rectB: fitRect(half, 0, half, canvas.height, worldW, worldH),
        worldW,
        worldH,
      };
    }
    const full = fitRect(0, 0, canvas.width, canvas.height, worldW, worldH);
    return { rectA: full, rectB: full, worldW, worldH };
  }

  function canvasToWorldB(ev) {
    const rect = canvas.getBoundingClientRect();
    const cx = ((ev.clientX - rect.left) / Math.max(1, rect.width)) * canvas.width;
    const cy = ((ev.clientY - rect.top) / Math.max(1, rect.height)) * canvas.height;
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
      if (canvas.setPointerCapture && ev.pointerId !== undefined) {
        try { canvas.setPointerCapture(ev.pointerId); } catch {}
      }
      session.intervene(branchB, {
        layer: INTERVENTION_LAYERS.MATERIAL,
        description: `przesuniecie obiektu #${id} w B`,
        apply: ({ world }) => world.moveMovable(id, pt.x, pt.y),
      });
    }
  };

  const onPointerMove = (ev) => {
    if (draggingBodyId === null || mode !== 'FORK' || !branchB) return;
    const pt = canvasToWorldB(ev);
    if (pt) branchB.world.moveMovable(draggingBodyId, pt.x, pt.y);
  };

  const endDrag = () => {
    if (draggingBodyId !== null && mode === 'FORK' && branchB) {
      session.release(branchB, {
        layer: INTERVENTION_LAYERS.MATERIAL,
        description: `puszczenie obiektu #${draggingBodyId} w B`,
      });
    }
    draggingBodyId = null;
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
    else if (act === 'layout') setViewLayout(viewLayout === 'GHOST' ? 'SPLIT' : 'GHOST');
    else if (act === 'pause') {
      paused = !paused;
      updateControls();
    } else if (act === 'cut-mem') doCutMemoryB();
    else if (act === 'takeover') toggleTakeoverB();
    else if (act === 'verdict') {
      drawer.style.display = drawer.style.display === 'none' ? 'block' : 'none';
      copyStatus.textContent = '';
      refreshVerdictPreview();
    } else if (act === 'close-verdict') {
      drawer.style.display = 'none';
    } else if (act === 'export-verdict') {
      const text = refreshVerdictPreview();
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard
          .writeText(text)
          .then(() => { copyStatus.textContent = 'Skopiowano JSON do schowka.'; })
          .catch(() => { copyStatus.textContent = 'Schowek zablokowany (file://) — skopiuj recznie z pola ponizej.'; });
      } else {
        copyStatus.textContent = 'Skopiuj JSON recznie z pola ponizej.';
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
      const fa = session.stepBranch(branchA);
      const fb = session.stepBranch(branchB);
      if (divTracker) divTracker.recordPair(fa, fb);
    } else {
      // W trybie WATCH nie budujemy pelnych digestow co tick — oszczedza CPU!
      session.stepBranch(session.main, null, { recordTrace: false, auditSeam: true });
    }
  }

  function renderFrame() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    const { rectA, rectB } = getViewRects();
    if (mode === 'FORK' && branchB) {
      if (viewLayout === 'SPLIT') {
        const half = canvas.width * 0.5;
        ctx.fillStyle = '#080c12';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        ctx.save();
        ctx.beginPath(); ctx.rect(rectA.x, rectA.y, rectA.w, rectA.h); ctx.clip();
        branchA.world.render(ctx, { x: rectA.x, y: rectA.y, w: rectA.w, h: rectA.h, tint: 'A', ghost: false, label: 'A (kontrola)' });
        ctx.restore();

        ctx.save();
        ctx.beginPath(); ctx.rect(rectB.x, rectB.y, rectB.w, rectB.h); ctx.clip();
        branchB.world.render(ctx, { x: rectB.x, y: rectB.y, w: rectB.w, h: rectB.h, tint: 'B', ghost: false, label: 'B (interwencja)' });
        ctx.restore();

        ctx.strokeStyle = 'rgba(255,255,255,0.22)';
        ctx.lineWidth = 2;
        ctx.beginPath(); ctx.moveTo(half, 0); ctx.lineTo(half, canvas.height); ctx.stroke();
      } else {
        branchA.world.render(ctx, { x: rectA.x, y: rectA.y, w: rectA.w, h: rectA.h, tint: 'A', ghost: true, label: 'Duch A (turkus)' });
        branchB.world.render(ctx, { x: rectB.x, y: rectB.y, w: rectB.w, h: rectB.h, tint: 'B', ghost: false, overlay: true, label: 'Zywy B (bursztyn)' });
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
    doMark,
    doFork,
    exitFork,
    setViewLayout,
    doCutMemoryB,
    toggleTakeoverB,
    destroy,
    getState: () => ({
      mode,
      viewLayout,
      paused,
      motorTakeoverActive,
      tick: mode === 'FORK' && branchB ? branchA.tick : session.main.tick,
      markTick: capturedMark ? capturedMark.tick : null,
      forkOriginTick,
      divergence: currentDivergence(),
    }),
  };
}
