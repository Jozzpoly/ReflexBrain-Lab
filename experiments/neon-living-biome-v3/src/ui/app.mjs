// src/ui/app.mjs — ReflexBrain v3 Full-Screen Interactive Workbench UI (100vw x 100vh)
// Collapsible Blender-style floating docks, strict FIXED_DT = 1/60 accumulator (60Hz/144Hz invariant),
// unrestricted Władza live sliders + raw numeric inputs, Matter Forge, Mind X-Ray matrix, Player HUD & Minimap.

import { DEFAULT_CONFIG, CORE_ARCHETYPES, createMaterialProps } from '../world/config.mjs';
import { createLivingBiomeV3, clamp } from '../world/biome.mjs';
import { createPredictorMindV3, ACTION_STYLES } from '../mind/predictor-mind.mjs';
import { createBiomeRenderer, rgbCss, rgbHex, hexToRgb, ZONE_NAMES_PL } from '../render/biome-renderer.mjs';

export const FIXED_DT = 1 / 60;
const MAX_FRAME_DT = 0.1;
const SPEEDS = [0.25, 0.5, 1, 2, 4, 8];

const ARCHETYPE_LABELS = Object.freeze({
  sanctuaryBerry: 'Jagoda (łagodna)',
  wildCore: 'Żywy Rdzeń (Dzicz)',
  geode: 'Geoda (krucha)',
  boulder: 'Głaz-osłona',
  emberMineral: 'Żarzący Minerał',
});

// Parameter schema for the unrestricted Władza panel
const WORLD_PARAM_GROUPS = [
  {
    title: 'Strefy i Anomalie',
    items: [
      { key: 'sanctuaryRadius', label: 'Promień Sanktuarium', min: 120, max: 1100, step: 10, ground: true, minHard: 20 },
      { key: 'twilightRadius', label: 'Promień Półmroku', min: 300, max: 1600, step: 10, ground: true, minHard: 40 },
      { key: 'anomalyStrength', label: 'Siła prądów anomalii', min: 0, max: 1.2, step: 0.02, minHard: 0 },
      { key: 'anomalyDamage', label: 'Obrażenia anomalii', min: 0, max: 0.02, step: 0.0004, minHard: 0 },
      { key: 'wildsStressRate', label: 'Stres w Dziczy', min: 0, max: 0.015, step: 0.0002, minHard: 0 },
      { key: 'sanctuaryRegenRate', label: 'Leczenie Sanktuarium', min: 0, max: 0.015, step: 0.0002, minHard: 0 },
    ],
  },
  {
    title: 'Fizyka i Ekologia',
    items: [
      { key: 'baseDrag', label: 'Opór ośrodka (drag)', min: 0.03, max: 0.5, step: 0.01, minHard: 0.001 },
      { key: 'gentleTouchThreshold', label: 'Próg delikatnego dotyku', min: 0.5, max: 8, step: 0.1, minHard: 0 },
      { key: 'intentionalImpactDmg', label: 'Obrażenia celowego uderzenia', min: 0, max: 0.4, step: 0.01, minHard: 0 },
      { key: 'baseEnergyBurn', label: 'Metabolizm bazowy', min: 0, max: 0.002, step: 0.00004, minHard: 0 },
      { key: 'foodRespawnEvery', label: 'Odnowa pokarmu (ticki)', min: 8, max: 180, step: 2, minHard: 2 },
      { key: 'maxConsumables', label: 'Limit zasobów na mapie', min: 10, max: 260, step: 4, minHard: 1 },
      { key: 'maxPopulation', label: 'Limit populacji', min: 2, max: 40, step: 1, minHard: 1 },
      { key: 'mutationScale', label: 'Skala mutacji potomstwa', min: 0, max: 0.4, step: 0.02, minHard: 0 },
    ],
  },
];

const MIND_PARAMS = [
  { key: 'learningRate', label: 'Szybkość uczenia', min: 0.05, max: 1.0, step: 0.02, defaultVal: 0.48 },
  { key: 'curiosityGain', label: 'Ciekawość poznawcza', min: 0, max: 1.8, step: 0.04, defaultVal: 0.62 },
  { key: 'calmnessBias', label: 'Skłonność do odpoczynku', min: 0, max: 1.5, step: 0.05, defaultVal: 0.55 },
];

function fmtVal(v, digits = 2) {
  if (!Number.isFinite(v)) return '0';
  return (v > 0 ? '+' : '') + v.toFixed(digits);
}

function createEl(tag, attrs = {}, children = []) {
  const el = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) {
    if (k === 'className') el.className = v;
    else if (k === 'text') el.textContent = v;
    else if (k === 'html') el.innerHTML = v;
    else if (k.startsWith('on') && typeof v === 'function') el.addEventListener(k.slice(2).toLowerCase(), v);
    else if (v !== undefined && v !== null) el.setAttribute(k, String(v));
  }
  for (const ch of children) {
    if (typeof ch === 'string') el.appendChild(document.createTextNode(ch));
    else if (ch) el.appendChild(ch);
  }
  return el;
}

export function initReflexBrainV3App() {
  const root = document.getElementById('app') || document.body;
  root.innerHTML = '';

  // Main full-screen viewport canvas
  const canvas = createEl('canvas', { id: 'biome-canvas' });
  root.appendChild(canvas);

  // Simulation state
  let currentSeed = 101;
  let world = null;
  let minds = [];
  let lastObs = [];
  let mindHyper = { learningRate: 0.48, curiosityGain: 0.62, calmnessBias: 0.55 };

  let paused = false;
  let speed = 1;
  let simAccum = 0;
  let lastRafTs = null;
  let totalFrames = 0;
  let lastFpsTs = performance.now();
  let fpsCount = 0;
  let currentFps = 60;

  let selectedIdx = 0;
  let cameraMode = 'free'; // 'free' | 'follow-selected' | 'follow-player'
  const camera = { x: DEFAULT_CONFIG.width * 0.5, y: DEFAULT_CONFIG.height * 0.5, zoom: 0.72 };

  // Tool & UI state (all drawers collapsed on launch so >92% screen is living world!)
  let toolMode = 'select'; // 'select' | 'paint' | 'erase'
  let brushKind = 'sanctuaryBerry'; // CORE_ARCHETYPE or 'custom'
  const customBrush = {
    rgb: [0.88, 0.38, 0.74],
    radius: 15,
    mass: 1.4,
    movable: true,
    edible: true,
    energyGain: 0.32,
    integrityGain: 0.04,
    burnDamage: 0,
    breakable: false,
    shelterStrength: 0,
  };

  let showRays = true;
  let showPlaces = false;
  const drawers = { wladza: false, kuznia: false, rentgen: false };

  // Input state
  const keys = new Set();
  let pendingToggleGrip = false;
  let pendingDash = false;
  let mouseScreen = { x: 0, y: 0, inside: false };
  let mouseWorld = { x: DEFAULT_CONFIG.width * 0.5, y: DEFAULT_CONFIG.height * 0.5 };
  let isPanning = false;
  let panStart = { sx: 0, sy: 0, cx: 0, cy: 0 };
  let pointerMoved = false;

  const renderer = createBiomeRenderer(canvas);

  function buildWorld(seed, customCfg = null, keepPlayer = false) {
    currentSeed = seed;
    const prevGod = world ? world.playerGodMode : false;
    const hadPlayer = keepPlayer && world && Boolean(world.player);
    world = createLivingBiomeV3({
      seed,
      config: customCfg ? { ...customCfg } : undefined,
      enablePlayer: hadPlayer,
      playerGodMode: prevGod,
    });
    minds = world.agents.map((_, i) => createPredictorMindV3(seed * 31 + i, mindHyper));
    world.onBirth = (childIdx) => {
      minds[childIdx] = createPredictorMindV3(seed * 31 + childIdx + world.tick, mindHyper);
    };
    lastObs = world.getAllObservations();
    selectedIdx = world.agents.length > 0 ? 0 : -1;
    renderer.invalidateGround();
    refreshChemSwatches();
  }

  function screenToWorld(sx, sy) {
    const rect = canvas.getBoundingClientRect();
    const vw = rect.width || window.innerWidth || 1280;
    const vh = rect.height || window.innerHeight || 720;
    return {
      x: camera.x + (sx - rect.left - vw * 0.5) / camera.zoom,
      y: camera.y + (sy - rect.top - vh * 0.5) / camera.zoom,
    };
  }

  function fitOverview() {
    const vw = canvas.clientWidth || window.innerWidth || 1280;
    const vh = canvas.clientHeight || window.innerHeight || 720;
    camera.x = world.cfg.width * 0.5;
    camera.y = world.cfg.height * 0.5;
    camera.zoom = clamp(Math.min((vw - 60) / world.cfg.width, (vh - 90) / world.cfg.height), 0.3, 1.5);
    cameraMode = 'free';
    syncTopBar();
  }

  function stepOneTick() {
    const acts = [];
    for (let i = 0; i < world.agents.length; i++) {
      if (!minds[i]) minds[i] = createPredictorMindV3(currentSeed * 31 + i + world.tick, mindHyper);
      acts.push(minds[i].act(lastObs[i]));
    }
    let playerAction = null;
    if (world.player) {
      let mx = 0;
      let my = 0;
      if (keys.has('KeyW') || keys.has('ArrowUp')) my -= 1;
      if (keys.has('KeyS') || keys.has('ArrowDown')) my += 1;
      if (keys.has('KeyA') || keys.has('ArrowLeft')) mx -= 1;
      if (keys.has('KeyD') || keys.has('ArrowRight')) mx += 1;
      const aimAngle = Math.atan2(mouseWorld.y - world.player.y, mouseWorld.x - world.player.x);
      playerAction = {
        moveX: mx,
        moveY: my,
        aimAngle,
        toggleGrip: pendingToggleGrip,
        dash: pendingDash,
      };
      pendingToggleGrip = false;
      pendingDash = false;
    } else {
      pendingToggleGrip = false;
      pendingDash = false;
    }
    lastObs = world.step(acts, playerAction);
  }

  // Strictly frame-rate-independent fixed-timestep accumulator (identical on 60Hz and 144Hz!)
  function advanceTime(dtSeconds) {
    if (paused) return 0;
    const clampedDt = clamp(dtSeconds, 0, MAX_FRAME_DT);
    simAccum += clampedDt * speed;
    let stepped = 0;
    const maxSubsteps = Math.max(4, Math.ceil(speed * 6));
    while (simAccum + 1e-9 >= FIXED_DT && stepped < maxSubsteps) {
      stepOneTick();
      simAccum = Math.max(0, simAccum - FIXED_DT);
      stepped++;
    }
    if (stepped === maxSubsteps && simAccum > FIXED_DT * 2) {
      simAccum = 0;
    }
    return stepped;
  }

  // -------------------------------------------------------------------------------------------
  // UI Construction (Blender-style compact floating glass docks)
  // -------------------------------------------------------------------------------------------
  const topBar = createEl('header', { id: 'top-bar', className: 'rb-topbar' });

  const brandBox = createEl('div', { className: 'rb-group rb-brand' }, [
    createEl('span', { className: 'rb-title', text: 'ReflexBrain v3' }),
    createEl('span', { id: 'stat-clock', className: 'rb-pill rb-mono', text: '00:00 · t=0' }),
    createEl('span', { id: 'stat-pop', className: 'rb-pill', text: 'Pop: 7' }),
    createEl('span', { id: 'stat-zone', className: 'rb-pill rb-zone-pill', text: 'Sanktuarium' }),
  ]);

  const timeGroup = createEl('div', { className: 'rb-group' });
  const btnPause = createEl('button', {
    id: 'btn-pause',
    className: 'rb-btn',
    text: 'Pauza',
    title: 'Pauza / Wznów (P)',
    onClick: () => {
      paused = !paused;
      syncTopBar();
    },
  });
  timeGroup.appendChild(btnPause);

  const speedBtns = new Map();
  for (const sp of SPEEDS) {
    const b = createEl('button', {
      className: 'rb-btn rb-speed-btn',
      text: `${sp}×`,
      onClick: () => {
        speed = sp;
        paused = false;
        syncTopBar();
      },
    });
    speedBtns.set(sp, b);
    timeGroup.appendChild(b);
  }

  const camGroup = createEl('div', { className: 'rb-group' });
  const btnOverview = createEl('button', { id: 'btn-cam-overview', className: 'rb-btn', text: 'Biom', title: 'Pokaż cały biom (0)', onClick: fitOverview });
  const btnFollow = createEl('button', {
    id: 'btn-cam-follow',
    className: 'rb-btn',
    text: 'Śledź',
    title: 'Śledź wybraną istotę',
    onClick: () => {
      cameraMode = cameraMode === 'follow-selected' ? 'free' : 'follow-selected';
      if (selectedIdx < 0 && world.agents.length > 0) selectedIdx = 0;
      syncTopBar();
    },
  });
  const btnPlayer = createEl('button', {
    id: 'btn-player-toggle',
    className: 'rb-btn rb-btn-accent',
    text: 'Wejdź ciałem',
    title: 'Wejdź / Wyjdź ciałem Gracza (G)',
    onClick: togglePlayerBody,
  });
  camGroup.append(btnOverview, btnFollow, btnPlayer);

  const drawerGroup = createEl('div', { className: 'rb-group' });
  const btnWladza = createEl('button', {
    id: 'btn-drawer-wladza',
    className: 'rb-btn',
    text: 'Władza',
    title: 'Parametry świata i umysłu (1)',
    onClick: () => toggleDrawer('wladza'),
  });
  const btnKuznia = createEl('button', {
    id: 'btn-drawer-kuznia',
    className: 'rb-btn',
    text: 'Kuźnia Materii',
    title: 'Maluj i usuwaj materię (2)',
    onClick: () => toggleDrawer('kuznia'),
  });
  const btnRentgen = createEl('button', {
    id: 'btn-drawer-rentgen',
    className: 'rb-btn',
    text: 'Rentgen Umysłu',
    title: 'Inspekcja siatkówki i macierzy predykcji (3)',
    onClick: () => toggleDrawer('rentgen'),
  });
  drawerGroup.append(btnWladza, btnKuznia, btnRentgen);

  topBar.append(brandBox, timeGroup, camGroup, drawerGroup);
  root.appendChild(topBar);

  // --- Drawer 1: Władza (Right floating panel, unrestricted numeric inputs + sliders) ---
  const panelWladza = createEl('aside', { id: 'panel-wladza', className: 'rb-drawer rb-drawer-right rb-hidden' });
  const warnBanner = createEl('div', { id: 'wladza-warn', className: 'rb-warn rb-hidden' });
  const wladzaBody = createEl('div', { className: 'rb-drawer-body' });

  const wladzaHeader = createEl('div', { className: 'rb-drawer-head' }, [
    createEl('span', { text: 'Władza — Zasady Świata' }),
    createEl('button', { className: 'rb-x', text: '×', onClick: () => toggleDrawer('wladza', false) }),
  ]);
  panelWladza.append(wladzaHeader, warnBanner, wladzaBody);

  const paramBindings = new Map();
  function setWarning(msg) {
    if (!msg) {
      warnBanner.classList.add('rb-hidden');
      warnBanner.textContent = '';
    } else {
      warnBanner.textContent = msg;
      warnBanner.classList.remove('rb-hidden');
    }
  }

  function makeParamRow(def, getter, setter) {
    const val0 = getter();
    const range = createEl('input', {
      type: 'range',
      min: def.min,
      max: def.max,
      step: def.step,
      value: val0,
      className: 'rb-slider',
    });
    const num = createEl('input', {
      type: 'number',
      step: 'any',
      value: val0,
      className: 'rb-num',
      id: `param-${def.key}`,
    });

    range.addEventListener('input', () => {
      const v = Number(range.value);
      num.value = String(v);
      setWarning('');
      setter(v);
    });
    num.addEventListener('change', () => {
      const raw = Number(num.value);
      if (!Number.isFinite(raw)) {
        setWarning(`Wartość dla „${def.label}” nie jest liczbą (NaN) — cofnięto.`);
        num.value = String(getter());
        return;
      }
      if (def.minHard !== undefined && raw < def.minHard) {
        setWarning(`Uwaga: „${def.label}” poniżej ${def.minHard} grozi zawieszeniem fizyki — użyto minimum ${def.minHard}.`);
        setter(def.minHard);
        num.value = String(def.minHard);
        range.value = String(clamp(def.minHard, def.min, def.max));
        return;
      }
      // ZERO silent clamping above slider range! Owner can freely enter 42 or extreme values!
      if (raw > def.max || raw < def.min) {
        setWarning(`Tryb ręczny: „${def.label}” = ${raw} (poza skalą suwaka — aktywne bez przycinania).`);
      } else {
        setWarning('');
      }
      setter(raw);
      range.value = String(clamp(raw, def.min, def.max));
    });

    paramBindings.set(def.key, () => {
      const cur = getter();
      num.value = String(cur);
      range.value = String(clamp(cur, def.min, def.max));
    });

    return createEl('div', { className: 'rb-param' }, [
      createEl('div', { className: 'rb-param-top' }, [createEl('label', { text: def.label }), num]),
      range,
    ]);
  }

  for (const grp of WORLD_PARAM_GROUPS) {
    const sec = createEl('section', { className: 'rb-sec' }, [createEl('h4', { text: grp.title })]);
    for (const item of grp.items) {
      sec.appendChild(
        makeParamRow(
          item,
          () => (world ? world.cfg[item.key] : DEFAULT_CONFIG[item.key]),
          (v) => {
            if (!world) return;
            world.cfg[item.key] = v;
            if (item.ground) renderer.invalidateGround();
          }
        )
      );
    }
    wladzaBody.appendChild(sec);
  }

  // Mind hyperparameters section
  const mindSec = createEl('section', { className: 'rb-sec' }, [createEl('h4', { text: 'Umysł (Predyktor)' })]);
  for (const mp of MIND_PARAMS) {
    mindSec.appendChild(
      makeParamRow(
        mp,
        () => mindHyper[mp.key],
        (v) => {
          mindHyper[mp.key] = v;
          for (const m of minds) m.setHyperparams({ [mp.key]: v });
        }
      )
    );
  }
  wladzaBody.appendChild(mindSec);

  // Toggles & quick world actions
  const chkRepro = createEl('input', { type: 'checkbox', id: 'chk-repro', checked: 'checked' });
  chkRepro.addEventListener('change', () => {
    world.cfg.allowReproduction = chkRepro.checked;
  });
  const chkGod = createEl('input', { type: 'checkbox', id: 'chk-godmode' });
  chkGod.addEventListener('change', () => {
    world.playerGodMode = chkGod.checked;
    syncPlayerHud();
  });

  const actionSec = createEl('section', { className: 'rb-sec' }, [
    createEl('h4', { text: 'Przełączniki i Świat' }),
    createEl('label', { className: 'rb-check' }, [chkRepro, createEl('span', { text: 'Rozmnażanie i linie pokoleniowe' })]),
    createEl('label', { className: 'rb-check' }, [chkGod, createEl('span', { text: 'Tryb Architekta (nieśmiertelność Gracza)' })]),
    createEl('div', { className: 'rb-btn-grid' }, [
      createEl('button', {
        id: 'btn-randomize-chem',
        className: 'rb-btn',
        text: 'Przelosuj chemię',
        onClick: () => {
          world.randomizeChemistry();
          refreshChemSwatches();
        },
      }),
      createEl('button', {
        id: 'btn-new-biome',
        className: 'rb-btn',
        text: 'Nowy biom',
        onClick: () => {
          buildWorld((currentSeed * 1664525 + 1013904223) >>> 0 & 0xffff, world.cfg, true);
          syncAllParams();
        },
      }),
      createEl('button', {
        id: 'btn-reset-memory',
        className: 'rb-btn',
        text: 'Wyczyść pamięć',
        onClick: () => {
          for (const m of minds) m.resetMemory();
        },
      }),
      createEl('button', {
        id: 'btn-defaults',
        className: 'rb-btn',
        text: 'Domyślne zasady',
        onClick: () => {
          Object.assign(world.cfg, DEFAULT_CONFIG);
          mindHyper = { learningRate: 0.48, curiosityGain: 0.62, calmnessBias: 0.55 };
          for (const m of minds) m.setHyperparams(mindHyper);
          renderer.invalidateGround();
          setWarning('');
          syncAllParams();
        },
      }),
    ]),
  ]);

  // JSON Preset export / import
  const presetBox = createEl('textarea', {
    id: 'preset-json',
    className: 'rb-textarea',
    rows: '3',
    placeholder: 'Preset JSON (Eksport / Wklej i Wczytaj)',
  });
  actionSec.append(
    createEl('div', { className: 'rb-btn-grid' }, [
      createEl('button', {
        id: 'btn-export-preset',
        className: 'rb-btn',
        text: 'Eksportuj JSON',
        onClick: () => {
          presetBox.value = JSON.stringify({ seed: currentSeed, cfg: world.cfg, mind: mindHyper }, null, 2);
        },
      }),
      createEl('button', {
        id: 'btn-import-preset',
        className: 'rb-btn',
        text: 'Wczytaj JSON',
        onClick: () => {
          try {
            const parsed = JSON.parse(presetBox.value);
            if (parsed.cfg && typeof parsed.cfg === 'object') Object.assign(world.cfg, parsed.cfg);
            if (parsed.mind && typeof parsed.mind === 'object') {
              Object.assign(mindHyper, parsed.mind);
              for (const m of minds) m.setHyperparams(mindHyper);
            }
            renderer.invalidateGround();
            syncAllParams();
            setWarning('');
          } catch (err) {
            setWarning(`Błąd JSON: ${err.message}`);
          }
        },
      }),
    ]),
    presetBox
  );
  wladzaBody.appendChild(actionSec);
  root.appendChild(panelWladza);

  // --- Drawer 2: Kuźnia Materii (Left floating panel) ---
  const panelKuznia = createEl('aside', { id: 'panel-kuznia', className: 'rb-drawer rb-drawer-left rb-hidden' });
  const kuzniaHeader = createEl('div', { className: 'rb-drawer-head' }, [
    createEl('span', { text: 'Kuźnia Materii' }),
    createEl('button', { className: 'rb-x', text: '×', onClick: () => toggleDrawer('kuznia', false) }),
  ]);
  const kuzniaBody = createEl('div', { className: 'rb-drawer-body' });

  const toolRow = createEl('div', { className: 'rb-seg' });
  const toolBtns = {};
  for (const [id, lbl] of [
    ['select', 'Wybierz'],
    ['paint', 'Maluj'],
    ['erase', 'Gumka'],
  ]) {
    const b = createEl('button', {
      id: `tool-${id}`,
      className: 'rb-btn',
      text: lbl,
      onClick: () => {
        toolMode = id;
        syncKuznia();
      },
    });
    toolBtns[id] = b;
    toolRow.appendChild(b);
  }
  kuzniaBody.appendChild(createEl('section', { className: 'rb-sec' }, [createEl('h4', { text: 'Tryb kliknięcia LPM' }), toolRow]));

  const archGrid = createEl('div', { className: 'rb-brush-list' });
  const brushBtns = {};
  const chemDots = {};
  for (const arch of CORE_ARCHETYPES) {
    const dot = createEl('span', { className: 'rb-dot' });
    chemDots[arch] = dot;
    const b = createEl('button', {
      id: `brush-${arch}`,
      className: 'rb-brush-btn',
      onClick: () => {
        brushKind = arch;
        toolMode = 'paint';
        syncKuznia();
      },
    }, [dot, createEl('span', { text: ARCHETYPE_LABELS[arch] || arch })]);
    brushBtns[arch] = b;
    archGrid.appendChild(b);
  }
  const customDot = createEl('span', { className: 'rb-dot' });
  const btnCustomBrush = createEl('button', {
    id: 'brush-custom',
    className: 'rb-brush-btn',
    onClick: () => {
      brushKind = 'custom';
      toolMode = 'paint';
      syncKuznia();
    },
  }, [customDot, createEl('span', { text: 'Własna materia (Maluj)' })]);
  brushBtns.custom = btnCustomBrush;
  archGrid.appendChild(btnCustomBrush);
  kuzniaBody.appendChild(createEl('section', { className: 'rb-sec' }, [createEl('h4', { text: 'Pędzel materii' }), archGrid]));

  // Custom matter forge editor + live preview canvas
  const previewCanvas = createEl('canvas', { width: '56', height: '56', className: 'rb-preview-canvas' });
  const colorPicker = createEl('input', { type: 'color', id: 'custom-color', value: rgbHex(customBrush.rgb), className: 'rb-color' });
  colorPicker.addEventListener('input', () => {
    customBrush.rgb = hexToRgb(colorPicker.value);
    brushKind = 'custom';
    toolMode = 'paint';
    syncKuznia();
  });

  const customSec = createEl('section', { className: 'rb-sec' }, [
    createEl('h4', { text: 'Kreator Własnej Materii' }),
    createEl('div', { className: 'rb-custom-head' }, [
      previewCanvas,
      createEl('div', { className: 'rb-custom-col' }, [
        createEl('label', { text: 'Barwa widzialna na siatkówce' }),
        colorPicker,
      ]),
    ]),
  ]);

  function addCustomNum(key, label, min, max, step) {
    const inp = createEl('input', { type: 'number', step: 'any', value: customBrush[key], className: 'rb-num', id: `custom-${key}` });
    const rng = createEl('input', { type: 'range', min, max, step, value: customBrush[key], className: 'rb-slider' });
    const apply = (v) => {
      if (!Number.isFinite(v)) return;
      customBrush[key] = v;
      inp.value = String(v);
      rng.value = String(clamp(v, min, max));
      brushKind = 'custom';
      toolMode = 'paint';
      syncKuznia();
    };
    rng.addEventListener('input', () => apply(Number(rng.value)));
    inp.addEventListener('change', () => apply(Number(inp.value)));
    customSec.appendChild(createEl('div', { className: 'rb-param' }, [createEl('div', { className: 'rb-param-top' }, [createEl('label', { text: label }), inp]), rng]));
  }
  function addCustomCheck(key, label) {
    const c = createEl('input', { type: 'checkbox', id: `custom-${key}` });
    c.checked = Boolean(customBrush[key]);
    c.addEventListener('change', () => {
      customBrush[key] = c.checked;
      brushKind = 'custom';
      toolMode = 'paint';
      syncKuznia();
    });
    customSec.appendChild(createEl('label', { className: 'rb-check' }, [c, createEl('span', { text: label })]));
  }

  addCustomNum('radius', 'Promień', 6, 48, 1);
  addCustomNum('mass', 'Masa', 0.3, 8, 0.1);
  addCustomCheck('movable', 'Przesuwalny');
  addCustomCheck('edible', 'Jadalny (znika przy dotyku)');
  addCustomNum('energyGain', 'Zysk energii', -0.4, 0.8, 0.04);
  addCustomNum('burnDamage', 'Obrażenia (parzenie)', 0, 0.35, 0.01);
  addCustomCheck('breakable', 'Kruchy (pęka po uderzeniu)');
  addCustomNum('shelterStrength', 'Siła osłony przed prądem', 0, 0.95, 0.05);

  kuzniaBody.appendChild(customSec);
  panelKuznia.append(kuzniaHeader, kuzniaBody);
  root.appendChild(panelKuznia);

  // --- Drawer 3: Rentgen Umysłu (Bottom-left compact dock with live 36-ray strip & 4-action prediction matrix) ---
  const panelRentgen = createEl('section', { id: 'panel-rentgen', className: 'rb-drawer rb-drawer-bottom rb-hidden' });
  const rentgenTitle = createEl('span', { id: 'xray-title', text: 'Rentgen Umysłu' });
  const chkRays = createEl('input', { type: 'checkbox', id: 'chk-rays', checked: 'checked' });
  chkRays.addEventListener('change', () => { showRays = chkRays.checked; });
  const chkPlaces = createEl('input', { type: 'checkbox', id: 'chk-places' });
  chkPlaces.addEventListener('change', () => { showPlaces = chkPlaces.checked; });

  const rentgenHead = createEl('div', { className: 'rb-drawer-head' }, [
    rentgenTitle,
    createEl('div', { className: 'rb-inline-checks' }, [
      createEl('label', { className: 'rb-check-sm' }, [chkRays, createEl('span', { text: 'Promienie (36)' })]),
      createEl('label', { className: 'rb-check-sm' }, [chkPlaces, createEl('span', { text: 'Kotwice pamięci' })]),
      createEl('button', { className: 'rb-x', text: '×', onClick: () => toggleDrawer('rentgen', false) }),
    ]),
  ]);

  const retinaCanvas = createEl('canvas', { id: 'xray-retina', width: '288', height: '18', className: 'rb-retina-strip' });
  const xrayStats = createEl('div', { id: 'xray-stats', className: 'rb-xray-stats' });
  const xrayMatrix = createEl('div', { id: 'xray-matrix', className: 'rb-xray-matrix' });
  const xrayBio = createEl('div', { id: 'xray-bio', className: 'rb-xray-bio' });

  const rentgenGrid = createEl('div', { className: 'rb-xray-grid' }, [
    createEl('div', { className: 'rb-xray-col' }, [
      createEl('div', { className: 'rb-sublabel', text: 'Surowa siatkówka 1D (36 promieni RGB)' }),
      retinaCanvas,
      xrayStats,
      createEl('div', { className: 'rb-sublabel', text: 'Dziennik doświadczeń' }),
      xrayBio,
    ]),
    createEl('div', { className: 'rb-xray-col rb-xray-wide' }, [
      createEl('div', { className: 'rb-sublabel', text: 'Żywa macierz predykcji: Bodziec × 4 akcje → [ΔE | ΔI | ΔS] (próby)' }),
      xrayMatrix,
    ]),
  ]);
  panelRentgen.append(rentgenHead, rentgenGrid);
  root.appendChild(panelRentgen);

  // --- Player HUD (bottom center, visible only when Player body is active) ---
  const playerHud = createEl('div', { id: 'player-hud', className: 'rb-player-hud rb-hidden' });
  root.appendChild(playerHud);

  // --- Minimap (bottom right, clickable to jump camera) ---
  const miniWrap = createEl('div', { id: 'minimap-wrap', className: 'rb-minimap-wrap' });
  const miniCanvas = createEl('canvas', { id: 'minimap-canvas', width: '176', height: '121' });
  miniWrap.append(miniCanvas, createEl('div', { className: 'rb-minimap-label', text: 'Sanktuarium · Półmrok · Dzicz' }));
  root.appendChild(miniWrap);

  // -------------------------------------------------------------------------------------------
  // UI Sync Helpers
  // -------------------------------------------------------------------------------------------
  function toggleDrawer(name, force = null) {
    drawers[name] = force !== null ? Boolean(force) : !drawers[name];
    panelWladza.classList.toggle('rb-hidden', !drawers.wladza);
    panelKuznia.classList.toggle('rb-hidden', !drawers.kuznia);
    panelRentgen.classList.toggle('rb-hidden', !drawers.rentgen);
    syncTopBar();
  }

  function togglePlayerBody() {
    if (world.player) {
      world.removePlayer();
      if (cameraMode === 'follow-player') cameraMode = 'free';
    } else {
      world.spawnPlayer(camera.x, camera.y);
      cameraMode = 'follow-player';
    }
    syncTopBar();
    syncPlayerHud();
  }

  function refreshChemSwatches() {
    if (!world) return;
    for (const arch of CORE_ARCHETYPES) {
      const ch = world.chemistry[arch];
      if (ch && chemDots[arch]) chemDots[arch].style.background = rgbCss(ch.rgb, 1);
    }
    customDot.style.background = rgbCss(customBrush.rgb, 1);
    renderer.drawMatterPreview(previewCanvas, customBrush);
  }

  function syncKuznia() {
    for (const [id, b] of Object.entries(toolBtns)) b.classList.toggle('rb-active', toolMode === id);
    for (const [k, b] of Object.entries(brushBtns)) b.classList.toggle('rb-active', toolMode === 'paint' && brushKind === k);
    customDot.style.background = rgbCss(customBrush.rgb, 1);
    renderer.drawMatterPreview(previewCanvas, customBrush);
    canvas.style.cursor = toolMode === 'paint' ? 'crosshair' : toolMode === 'erase' ? 'not-allowed' : isPanning ? 'grabbing' : 'default';
  }

  function syncTopBar() {
    btnPause.textContent = paused ? 'Wznów' : 'Pauza';
    btnPause.classList.toggle('rb-active', paused);
    for (const [sp, b] of speedBtns.entries()) b.classList.toggle('rb-active', !paused && speed === sp);
    btnFollow.classList.toggle('rb-active', cameraMode === 'follow-selected');
    btnPlayer.textContent = world && world.player ? 'Wyjdź z ciała' : 'Wejdź ciałem';
    btnPlayer.classList.toggle('rb-active', Boolean(world && world.player));
    btnWladza.classList.toggle('rb-active', drawers.wladza);
    btnKuznia.classList.toggle('rb-active', drawers.kuznia);
    btnRentgen.classList.toggle('rb-active', drawers.rentgen);
  }

  function syncAllParams() {
    for (const fn of paramBindings.values()) fn();
    chkRepro.checked = Boolean(world.cfg.allowReproduction);
    chkGod.checked = Boolean(world.playerGodMode);
  }

  function syncPlayerHud() {
    if (!world || !world.player) {
      playerHud.classList.add('rb-hidden');
      return;
    }
    playerHud.classList.remove('rb-hidden');
    const p = world.player;
    const held = p.carriedObjId > 0 ? world.objects.find((o) => o.id === p.carriedObjId) : null;
    const zPl = ZONE_NAMES_PL[p.zone] || p.zone;
    const bar = (lbl, val, cls) =>
      `<div class="rb-hbar"><span>${lbl}</span><div class="rb-track"><div class="rb-fill ${cls}" style="width:${Math.round(clamp(val, 0, 1) * 100)}%"></div></div></div>`;
    playerHud.innerHTML = `
      <div class="rb-phud-top">
        <strong>Ciało Gracza</strong>
        <span class="rb-pill">${zPl}</span>
        ${world.playerGodMode ? '<span class="rb-pill rb-pill-gold">Tryb Architekta</span>' : ''}
        ${held ? `<span class="rb-pill rb-pill-hold">Trzymasz obiekt (Spacja = rzut, E = puść)</span>` : ''}
      </div>
      <div class="rb-phud-bars">
        ${bar('Energia', p.energy, 'c-e')}
        ${bar('Integralność', p.integrity, 'c-i')}
        ${bar('Kondycja', p.stamina, 'c-k')}
        ${bar('Stres', p.stress, 'c-s')}
      </div>
      <div class="rb-phud-hint">WASD ruch · Mysz celowanie · <b>E</b> złap/puść do kursora · <b>Spacja</b> rzut / dash</div>
    `;
  }

  function updateXrayPanel() {
    if (!drawers.rentgen || !world) return;
    if (selectedIdx < 0 || selectedIdx >= world.agents.length) {
      rentgenTitle.textContent = 'Rentgen Umysłu — kliknij istotę na mapie';
      xrayStats.innerHTML = '';
      xrayMatrix.innerHTML = '<div class="rb-muted">Brak wybranej istoty.</div>';
      xrayBio.innerHTML = '';
      return;
    }
    const a = world.agents[selectedIdx];
    const m = minds[selectedIdx];
    const st = m ? m.getMindState() : null;
    const obs = lastObs[selectedIdx];

    rentgenTitle.textContent = `${a.id} (${a.morph === 'ram' ? 'Taran' : 'Zwiadowca'}, g${a.generation}) · ${ZONE_NAMES_PL[a.zone] || a.zone} · ${st ? st.mode : ''}`;

    // Draw raw 36-ray 1D retina strip
    if (obs && obs.retina) {
      const rctx = retinaCanvas.getContext('2d');
      const rw = retinaCanvas.width;
      const rh = retinaCanvas.height;
      const N = obs.retina.length;
      const cellW = rw / N;
      for (let i = 0; i < N; i++) {
        rctx.fillStyle = rgbCss(obs.retina[i], 1);
        rctx.fillRect(i * cellW, 0, Math.ceil(cellW), rh);
      }
      // Gaze center marker
      rctx.fillStyle = 'rgba(255,250,235,0.75)';
      rctx.fillRect(rw * 0.5 - 1, 0, 2, rh);
    }

    xrayStats.innerHTML = `
      <span>E: <b>${Math.round(a.energy * 100)}%</b></span>
      <span>Int: <b>${Math.round(a.integrity * 100)}%</b></span>
      <span>Stres: <b>${Math.round(a.stress * 100)}%</b></span>
      <span>Pobudz.: <b>${st ? st.arousal.toFixed(2) : '0'}</b></span>
      <span>Zaskocz.: <b>${st ? st.surprise.toFixed(2) : '0'}</b></span>
      <span>Pętle: <b>${st ? st.loopClosures : 0}</b></span>
    `;

    // Live stimulus x 4-action outcome prediction matrix
    if (st && st.prototypes && st.prototypes.length > 0) {
      const sorted = [...st.prototypes].sort((x, y) => {
        const tx = x.pred.reduce((s, r) => s + r.trials, 0);
        const ty = y.pred.reduce((s, r) => s + r.trials, 0);
        return ty - tx;
      }).slice(0, 7);

      const cell = (pr) => {
        if (!pr || pr.trials < 0.05) return '<td class="rb-m-empty">—</td>';
        const score = pr.dE + pr.dI - pr.dS * 0.6;
        const cls = score > 0.16 ? 'rb-m-pos' : score < -0.16 ? 'rb-m-neg' : 'rb-m-neu';
        return `<td class="${cls}"><div>E${fmtVal(pr.dE, 2)} I${fmtVal(pr.dI, 2)}</div><small>S${fmtVal(pr.dS, 2)} · n=${Math.round(pr.trials)}</small></td>`;
      };

      const rows = sorted
        .map(
          (p) =>
            `<tr><td><span class="rb-swatch" style="background:${rgbCss(p.rgb, 1)}"></span>#${p.id}</td>${ACTION_STYLES.map((_, j) => cell(p.pred[j])).join('')}</tr>`
        )
        .join('');
      xrayMatrix.innerHTML = `
        <table class="rb-table">
          <thead><tr><th>Kolor</th>${ACTION_STYLES.map((s) => `<th>${s}</th>`).join('')}</tr></thead>
          <tbody>${rows}</tbody>
        </table>
      `;
    } else {
      xrayMatrix.innerHTML = '<div class="rb-muted">Czysta karta — istota jeszcze nie odkryła żadnego bodźca.</div>';
    }

    if (st && st.biography && st.biography.length > 0) {
      xrayBio.innerHTML = st.biography
        .slice(0, 5)
        .map(
          (b) =>
            `<div class="rb-bio-row"><span class="rb-mono">t=${b.tick}</span> ${
              b.hex ? `<span class="rb-swatch-sm" style="background:${b.hex}"></span>` : ''
            }${b.text}</div>`
        )
        .join('');
    } else {
      xrayBio.innerHTML = '<div class="rb-muted">Brak wpisów biograficznych.</div>';
    }
  }

  // -------------------------------------------------------------------------------------------
  // Pointer, Wheel, Minimap & Keyboard Interactions
  // -------------------------------------------------------------------------------------------
  function handleCanvasClick(wx, wy) {
    if (toolMode === 'paint') {
      if (brushKind === 'custom') {
        world.spawnCustomMatter(wx, wy, { ...customBrush });
      } else {
        world.spawnArchetype(brushKind, wx, wy);
      }
      return;
    }
    if (toolMode === 'erase') {
      world.removeNear(wx, wy, 44);
      return;
    }
    // Select nearest creature
    let best = -1;
    let bestD = 36 / Math.min(1.5, Math.max(0.5, camera.zoom));
    for (const a of world.agents) {
      const d = Math.hypot(a.x - wx, a.y - wy) - a.r;
      if (d < bestD) {
        bestD = d;
        best = a.idx;
      }
    }
    if (best >= 0) {
      selectedIdx = best;
      toggleDrawer('rentgen', true);
      updateXrayPanel();
    }
  }

  canvas.addEventListener('contextmenu', (e) => e.preventDefault());
  canvas.addEventListener('pointerdown', (e) => {
    const wpt = screenToWorld(e.clientX, e.clientY);
    mouseWorld = wpt;
    pointerMoved = false;
    if (e.button === 1 || e.button === 2 || (e.button === 0 && toolMode === 'select')) {
      isPanning = true;
      panStart = { sx: e.clientX, sy: e.clientY, cx: camera.x, cy: camera.y };
      canvas.setPointerCapture?.(e.pointerId);
    } else if (e.button === 0) {
      handleCanvasClick(wpt.x, wpt.y);
    }
  });

  canvas.addEventListener('pointermove', (e) => {
    mouseScreen = { x: e.clientX, y: e.clientY, inside: true };
    if (isPanning) {
      const dx = e.clientX - panStart.sx;
      const dy = e.clientY - panStart.sy;
      if (Math.hypot(dx, dy) > 4) {
        pointerMoved = true;
        cameraMode = 'free';
        camera.x = clamp(panStart.cx - dx / camera.zoom, 0, world.cfg.width);
        camera.y = clamp(panStart.cy - dy / camera.zoom, 0, world.cfg.height);
        syncTopBar();
      }
    }
    mouseWorld = screenToWorld(e.clientX, e.clientY);
  });

  canvas.addEventListener('pointerup', (e) => {
    const wasPan = isPanning;
    isPanning = false;
    canvas.releasePointerCapture?.(e.pointerId);
    if (wasPan && e.button === 0 && !pointerMoved && toolMode === 'select') {
      const wpt = screenToWorld(e.clientX, e.clientY);
      handleCanvasClick(wpt.x, wpt.y);
    }
  });

  canvas.addEventListener('pointerleave', () => {
    mouseScreen.inside = false;
  });

  canvas.addEventListener(
    'wheel',
    (e) => {
      e.preventDefault();
      const before = screenToWorld(e.clientX, e.clientY);
      const factor = e.deltaY < 0 ? 1.14 : 1 / 1.14;
      camera.zoom = clamp(camera.zoom * factor, 0.32, 3.6);
      if (cameraMode === 'free') {
        const after = screenToWorld(e.clientX, e.clientY);
        camera.x = clamp(camera.x + (before.x - after.x), 0, world.cfg.width);
        camera.y = clamp(camera.y + (before.y - after.y), 0, world.cfg.height);
      }
    },
    { passive: false }
  );

  // Minimap click / drag to jump camera
  let miniDragging = false;
  function jumpFromMini(e) {
    const rect = miniCanvas.getBoundingClientRect();
    const u = clamp((e.clientX - rect.left) / (rect.width || 1), 0, 1);
    const v = clamp((e.clientY - rect.top) / (rect.height || 1), 0, 1);
    cameraMode = 'free';
    camera.x = u * world.cfg.width;
    camera.y = v * world.cfg.height;
    syncTopBar();
  }
  miniCanvas.addEventListener('pointerdown', (e) => { miniDragging = true; jumpFromMini(e); });
  window.addEventListener('pointermove', (e) => { if (miniDragging) jumpFromMini(e); });
  window.addEventListener('pointerup', () => { miniDragging = false; });

  window.addEventListener('keydown', (e) => {
    const tag = (e.target && e.target.tagName) || '';
    if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;
    keys.add(e.code);
    if (e.code === 'KeyE' && !e.repeat && world.player) {
      pendingToggleGrip = true;
      e.preventDefault();
    } else if (e.code === 'Space' && !e.repeat) {
      e.preventDefault();
      if (world.player) {
        pendingDash = true;
      } else {
        paused = !paused;
        syncTopBar();
      }
    } else if (e.code === 'KeyP' && !e.repeat) {
      paused = !paused;
      syncTopBar();
    } else if (e.code === 'KeyG' && !e.repeat) {
      togglePlayerBody();
    } else if (e.code === 'Digit1') {
      toggleDrawer('wladza');
    } else if (e.code === 'Digit2') {
      toggleDrawer('kuznia');
    } else if (e.code === 'Digit3') {
      toggleDrawer('rentgen');
    } else if (e.code === 'Digit0') {
      fitOverview();
    }
  });
  window.addEventListener('keyup', (e) => {
    keys.delete(e.code);
  });

  // -------------------------------------------------------------------------------------------
  // Main Animation Loop
  // -------------------------------------------------------------------------------------------
  const statClock = document.getElementById('stat-clock');
  const statPop = document.getElementById('stat-pop');
  const statZone = document.getElementById('stat-zone');

  function updateCamera() {
    if (!world.player) {
      const panSpd = 10 / camera.zoom;
      if (keys.has('KeyW') || keys.has('ArrowUp')) { camera.y -= panSpd; cameraMode = 'free'; }
      if (keys.has('KeyS') || keys.has('ArrowDown')) { camera.y += panSpd; cameraMode = 'free'; }
      if (keys.has('KeyA') || keys.has('ArrowLeft')) { camera.x -= panSpd; cameraMode = 'free'; }
      if (keys.has('KeyD') || keys.has('ArrowRight')) { camera.x += panSpd; cameraMode = 'free'; }
    }
    if (cameraMode === 'follow-player' && world.player) {
      camera.x += (world.player.x - camera.x) * 0.14;
      camera.y += (world.player.y - camera.y) * 0.14;
    } else if (cameraMode === 'follow-selected' && selectedIdx >= 0 && world.agents[selectedIdx]) {
      const a = world.agents[selectedIdx];
      camera.x += (a.x - camera.x) * 0.12;
      camera.y += (a.y - camera.y) * 0.12;
    }
    camera.x = clamp(camera.x, 0, world.cfg.width);
    camera.y = clamp(camera.y, 0, world.cfg.height);
  }

  function frame(ts) {
    if (lastRafTs === null) lastRafTs = ts;
    const dt = (ts - lastRafTs) / 1000;
    lastRafTs = ts;

    advanceTime(dt);
    updateCamera();
    if (mouseScreen.inside) mouseWorld = screenToWorld(mouseScreen.x, mouseScreen.y);

    let brushGhost = null;
    if (mouseScreen.inside && (toolMode === 'paint' || toolMode === 'erase')) {
      if (toolMode === 'erase') {
        brushGhost = { x: mouseWorld.x, y: mouseWorld.y, radius: 34, erase: true };
      } else if (brushKind === 'custom') {
        brushGhost = { x: mouseWorld.x, y: mouseWorld.y, radius: Math.max(5, customBrush.radius), rgb: customBrush.rgb };
      } else {
        const ch = world.chemistry[brushKind];
        const pr = createMaterialProps(brushKind, ch ? ch.rgb : [0.8, 0.8, 0.8]);
        brushGhost = { x: mouseWorld.x, y: mouseWorld.y, radius: pr.radius, rgb: pr.rgb };
      }
    }

    const selMindState = selectedIdx >= 0 && minds[selectedIdx] ? minds[selectedIdx].getMindState() : null;
    renderer.render(world, camera, {
      paused,
      selectedIdx,
      selectedMindState: selMindState,
      showRays,
      showPlaces,
      brushGhost,
    });
    renderer.renderMinimap(miniCanvas, world, camera, canvas, selectedIdx);

    totalFrames++;
    fpsCount++;
    if (ts - lastFpsTs >= 500) {
      currentFps = Math.round((fpsCount * 1000) / (ts - lastFpsTs));
      fpsCount = 0;
      lastFpsTs = ts;
    }

    if (totalFrames % 6 === 0) {
      const secs = Math.floor(world.tick / 60);
      const mm = String(Math.floor(secs / 60)).padStart(2, '0');
      const ss = String(secs % 60).padStart(2, '0');
      statClock.textContent = `${mm}:${ss} · t=${world.tick}`;
      statPop.textContent = `Pop: ${world.agents.length}`;
      const zCenter = world.sampleZone(world.player ? world.player.x : camera.x, world.player ? world.player.y : camera.y);
      statZone.textContent = ZONE_NAMES_PL[zCenter.zone] || zCenter.zone;
      syncPlayerHud();
      updateXrayPanel();
    }

    requestAnimationFrame(frame);
  }

  // Boot world & expose inspection handle strictly for smoke-test verification (never passed to minds!)
  buildWorld(currentSeed, null, false);
  syncAllParams();
  syncKuznia();
  syncTopBar();
  fitOverview();
  // Start comfortably zoomed into Sanctuary & inner Twilight so residents are alive & crisp immediately!
  camera.zoom = clamp(Math.max(camera.zoom, 0.82), 0.65, 1.15);

  window.__REFLEXBRAIN_V3__ = {
    get world() { return world; },
    get minds() { return minds; },
    getConfig: () => ({ ...world.cfg }),
    setSpeed: (s) => { speed = Number(s) || 1; paused = false; syncTopBar(); },
    setPaused: (p) => { paused = Boolean(p); syncTopBar(); },
    stepFixedFrames: (frameCount, frameDtSec) => {
      let ticks = 0;
      for (let i = 0; i < frameCount; i++) ticks += advanceTime(frameDtSec);
      return { ticks, worldTick: world.tick };
    },
    togglePlayer: togglePlayerBody,
    toggleDrawer,
    getPerf: () => ({ fps: currentFps, tick: world.tick, population: world.agents.length, objects: world.objects.length }),
  };

  requestAnimationFrame(frame);
}

if (typeof document !== 'undefined') {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => initReflexBrainV3App());
  } else {
    initReflexBrainV3App();
  }
}
