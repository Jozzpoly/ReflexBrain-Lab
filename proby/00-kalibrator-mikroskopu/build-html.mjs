// proby/00-kalibrator-mikroskopu/build-html.mjs — sklada samodzielny plik HTML dzialajacy z file:// po dwukliku.
// Kazdy modul jest owiniety we wlasny zakres IIFE (zero kolizji lokalnych nazw pomocniczych!).
// Tryb `--check` weryfikuje brak dryfu miedzy zrodlami a dist/kalibrator-mikroskopu.html.

import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..', '..');

function wrapModule(code, importsBind, exportedNames) {
  const cleaned = code
    .replace(/^\s*import\s+[\s\S]*?from\s+['"][^'"]+['"];?[ \t]*(\/\/.*)?$/gm, '')
    .replace(/^\s*export\s+(?=(?:async\s+)?(?:const|let|var|function|class)\b)/gm, '');
  const bindLine = importsBind ? `  ${importsBind}\n` : '';
  return `(() => {\n${bindLine}${cleaned}\n  return { ${exportedNames.join(', ')} };\n})()`;
}

export function renderCalibratorHtml() {
  const seamMod = wrapModule(
    readFileSync(join(ROOT, 'kernel', 'seam.mjs'), 'utf8'),
    '',
    ['PERCEPTION_MODES', 'createRng', 'deepClone', 'deepFreeze', 'stableDigest', 'auditObservation', 'sealObservation', 'normalizeExposureMetrics']
  );

  const forkMod = wrapModule(
    readFileSync(join(ROOT, 'kernel', 'fork-microscope.mjs'), 'utf8'),
    'const { PERCEPTION_MODES, deepClone, sealObservation, stableDigest } = __seam;',
    ['INTERVENTION_LAYERS', 'createDivergenceTracker', 'createLabSession', 'findFirstDivergence', 'formatOwnerVerdictCard']
  );

  const uiMod = wrapModule(
    readFileSync(join(ROOT, 'kernel', 'lens-ui.mjs'), 'utf8'),
    'const { INTERVENTION_LAYERS, createDivergenceTracker, formatOwnerVerdictCard } = __fork;',
    ['FIXED_DT', 'defaultMapKeysToAction', 'mountMicroscope']
  );

  const worldMod = wrapModule(
    readFileSync(join(__dirname, 'world.mjs'), 'utf8'),
    'const { PERCEPTION_MODES, createRng, deepClone, stableDigest } = __seam;',
    ['createCalibratorWorld', 'createCalibratorMind']
  );

  return `<!doctype html>
<html lang="pl">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>ReflexBrain Lab — Kalibrator Mikroskopu (P00)</title>
  <style>
    :root { color-scheme: dark; --bg: #0b1017; --panel: #121a24; --line: rgba(148,175,204,0.18); --txt: #e5eef8; --muted: #8ea2b8; --acc: #4ad8c4; --warn: #f5a54a; }
    * { box-sizing: border-box; }
    body { margin: 0; background: var(--bg); color: var(--txt); font: 14px/1.45 system-ui, -apple-system, sans-serif; }
    .rb-wrap { min-height: 100vh; display: flex; flex-direction: column; }
    .rb-top, .rb-bar { display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; gap: 10px; padding: 10px 14px; background: var(--panel); border-bottom: 1px solid var(--line); }
    .rb-bar { border-bottom: 0; border-top: 1px solid var(--line); }
    .rb-brand, .rb-top-right, .rb-group { display: flex; flex-wrap: wrap; align-items: center; gap: 8px; }
    .rb-pill { padding: 3px 9px; border-radius: 999px; font-size: 12px; font-weight: 600; background: rgba(74,216,196,0.16); color: var(--acc); border: 1px solid rgba(74,216,196,0.35); }
    .rb-pill-cal { background: rgba(245,165,74,0.14); color: var(--warn); border-color: rgba(245,165,74,0.35); }
    .rb-meta, .rb-hint, .rb-label { color: var(--muted); font-size: 12px; }
    .rb-stage { position: relative; flex: 1; display: grid; place-items: center; padding: 12px; }
    .rb-canvas { width: min(100%, 1080px); height: auto; aspect-ratio: 960 / 560; border: 1px solid var(--line); border-radius: 10px; background: #0d131b; cursor: grab; }
    .rb-btn { background: #192433; color: var(--txt); border: 1px solid var(--line); border-radius: 7px; padding: 6px 11px; font-size: 13px; cursor: pointer; }
    .rb-btn:hover:not(:disabled) { border-color: var(--acc); }
    .rb-btn:disabled { opacity: 0.4; cursor: not-allowed; }
    .rb-btn-acc { background: rgba(74,216,196,0.15); border-color: rgba(74,216,196,0.45); color: var(--acc); }
    .rb-btn-warn { background: rgba(245,165,74,0.18); border-color: rgba(245,165,74,0.55); color: var(--warn); }
    .rb-btn-sm { padding: 3px 8px; font-size: 12px; }
    .rb-div-badge { position: absolute; top: 22px; left: 50%; transform: translateX(-50%); padding: 5px 12px; border-radius: 999px; font: 12px/1.3 monospace; pointer-events: none; border: 1px solid var(--line); }
    .rb-div-same { background: rgba(18,26,36,0.88); color: var(--muted); }
    .rb-div-diff { background: rgba(245,165,74,0.16); border-color: rgba(245,165,74,0.45); color: #ffd6a1; }
    .rb-verdict-drawer { position: absolute; right: 20px; top: 20px; width: min(440px, calc(100% - 40px)); background: #101822; border: 1px solid var(--line); border-radius: 10px; padding: 12px; box-shadow: 0 12px 32px rgba(0,0,0,0.45); }
    .rb-drawer-head, .rb-drawer-row { display: flex; align-items: center; justify-content: space-between; gap: 8px; margin-bottom: 8px; }
    .rb-drawer-row input, .rb-drawer-row select { flex: 1; background: #0b1017; color: var(--txt); border: 1px solid var(--line); border-radius: 6px; padding: 5px 8px; }
    .rb-verdict-out { margin: 0; max-height: 200px; overflow: auto; font-size: 11px; background: #080c12; padding: 8px; border-radius: 6px; color: #b9cde2; }
  </style>
</head>
<body>
  <div id="app"></div>
  <script>
(() => {
  'use strict';
  const __seam = ${seamMod};
  const __fork = ${forkMod};
  const __ui = ${uiMod};
  const __world = ${worldMod};

  const session = __fork.createLabSession({
    createWorld: __world.createCalibratorWorld,
    createMind: __world.createCalibratorMind,
    seed: 7,
    perceptionMode: __seam.PERCEPTION_MODES.RAW,
    strictSeam: true,
  });

  window.__RB_MICROSCOPE__ = __ui.mountMicroscope({
    root: document.getElementById('app'),
    session,
    probeId: 'P00-kalibrator-mikroskopu',
    bannerText: 'KALIBRATOR APARATURY (P00) · NIE WYNIK AI',
    isCalibrator: true,
    actorId: 'actor-0',
    materialHint: 'Przeciagnij krazek mysza w B = MATERIAL',
  });
})();
  </script>
</body>
</html>
`;
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const distDir = join(__dirname, 'dist');
  const outFile = join(distDir, 'kalibrator-mikroskopu.html');
  const expected = renderCalibratorHtml();

  if (process.argv.includes('--check')) {
    if (!existsSync(outFile)) {
      console.error('build-html: brak dist/kalibrator-mikroskopu.html (uruchom npm run build:kalibrator).');
      process.exit(1);
    }
    const actual = readFileSync(outFile, 'utf8').replace(/\r\n/g, '\n');
    if (actual !== expected.replace(/\r\n/g, '\n')) {
      console.error('build-html: DRYF — dist/kalibrator-mikroskopu.html rozni sie od zrodel! Uruchom npm run build:kalibrator.');
      process.exit(1);
    }
    console.log(`build-html: OK (kalibrator-mikroskopu.html=SYNC, ${(Buffer.byteLength(expected, 'utf8') / 1024).toFixed(1)} KB).`);
  } else {
    mkdirSync(distDir, { recursive: true });
    writeFileSync(outFile, expected, 'utf8');
    console.log(`Zbudowano ${outFile} (${(Buffer.byteLength(expected, 'utf8') / 1024).toFixed(1)} KB).`);
  }
}
