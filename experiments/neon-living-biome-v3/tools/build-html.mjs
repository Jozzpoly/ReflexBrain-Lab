// tools/build-html.mjs — Zero-dependency standalone file:// HTML bundler for ReflexBrain v3
// Wraps each ESM source file in an isolated module factory so internal helper names never collide!
// Run: node tools/build-html.mjs

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, '..');

const MODULES = [
  { id: 'world/config', file: 'src/world/config.mjs' },
  { id: 'world/biome', file: 'src/world/biome.mjs' },
  { id: 'mind/predictor-mind', file: 'src/mind/predictor-mind.mjs' },
  { id: 'mind/baselines', file: 'src/mind/baselines.mjs' },
  { id: 'render/biome-renderer', file: 'src/render/biome-renderer.mjs' },
  { id: 'ui/app', file: 'src/ui/app.mjs' },
];

function resolveModuleId(fromId, spec) {
  const fromDir = path.posix.dirname(fromId);
  const joined = path.posix.normalize(path.posix.join(fromDir, spec));
  return joined.replace(/\.mjs$/, '');
}

function transformModule(modId, rawSource) {
  const exportedNames = new Set();

  // 1. Transform multi-line or single-line named imports -> destructuring from __require(...)
  let code = rawSource.replace(
    /import\s*\{([\s\S]*?)\}\s*from\s*['"]([^'"]+)['"]\s*;/g,
    (_m, names, spec) => {
      const targetId = resolveModuleId(modId, spec);
      const cleaned = names
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean)
        .map((s) => s.replace(/\s+as\s+/, ': '))
        .join(', ');
      return `const { ${cleaned} } = __require('${targetId}');`;
    }
  );

  // 2. Capture and strip `export const/let/var/function/class`
  code = code.replace(/^export\s+(const|let|var)\s+([A-Za-z_$][\w$]*)/gm, (_m, kw, name) => {
    exportedNames.add(name);
    return `${kw} ${name}`;
  });
  code = code.replace(/^export\s+function\s+([A-Za-z_$][\w$]*)/gm, (_m, name) => {
    exportedNames.add(name);
    return `function ${name}`;
  });
  code = code.replace(/^export\s+class\s+([A-Za-z_$][\w$]*)/gm, (_m, name) => {
    exportedNames.add(name);
    return `class ${name}`;
  });

  // Safety check: no lingering unrewritten import/export statements
  const leftover = code.match(/^(import|export)\s+/gm);
  if (leftover) {
    throw new Error(`Unsupported import/export syntax in ${modId}: ${leftover.join(', ')}`);
  }

  const returnObj = `{ ${[...exportedNames].join(', ')} }`;
  return `  __modules['${modId}'] = function(__require) {\n${code}\n    return ${returnObj};\n  };`;
}

const CSS = `
:root {
  --bg: #0a0e13;
  --glass: rgba(15, 20, 27, 0.86);
  --glass-border: rgba(146, 168, 184, 0.18);
  --text: #e4e8ec;
  --muted: #93a1ae;
  --accent: #68b89b;
  --accent-dim: rgba(104, 184, 155, 0.2);
  --gold: #d4b46a;
  --danger: #d96b63;
}
* { box-sizing: border-box; }
html, body, #app {
  margin: 0; padding: 0; width: 100vw; height: 100vh; overflow: hidden;
  background: var(--bg); color: var(--text);
  font-family: "Segoe UI", system-ui, -apple-system, sans-serif;
  font-size: 12px; user-select: none;
}
#biome-canvas {
  position: fixed; inset: 0; width: 100vw; height: 100vh; display: block;
}
.rb-hidden { display: none !important; }
.rb-mono { font-family: ui-monospace, SFMono-Regular, Consolas, monospace; font-size: 11px; }
.rb-muted { color: var(--muted); font-size: 11px; padding: 4px 0; }

/* Compact Blender-style top bar */
.rb-topbar {
  position: fixed; top: 8px; left: 10px; right: 10px; z-index: 30;
  height: 40px; padding: 0 10px;
  display: flex; align-items: center; justify-content: space-between; gap: 8px;
  background: var(--glass); backdrop-filter: blur(10px);
  border: 1px solid var(--glass-border); border-radius: 9px;
  box-shadow: 0 8px 24px rgba(0,0,0,0.42);
}
.rb-group { display: flex; align-items: center; gap: 5px; }
.rb-title { font-weight: 600; letter-spacing: 0.3px; color: #eef3f0; margin-right: 4px; }
.rb-pill {
  padding: 2px 7px; border-radius: 5px; background: rgba(255,255,255,0.06);
  border: 1px solid rgba(255,255,255,0.08); color: #cfd8df; font-size: 11px;
}
.rb-zone-pill { color: #a9d9c8; }
.rb-pill-gold { color: #f0d797; border-color: rgba(212,180,106,0.35); background: rgba(212,180,106,0.14); }
.rb-pill-hold { color: #c8f084; border-color: rgba(176,222,94,0.35); background: rgba(176,222,94,0.12); }

.rb-btn {
  appearance: none; background: rgba(255,255,255,0.055); color: var(--text);
  border: 1px solid rgba(255,255,255,0.12); border-radius: 6px;
  padding: 4px 8px; font-size: 11.5px; cursor: pointer; transition: background 0.12s, border-color 0.12s;
}
.rb-btn:hover { background: rgba(255,255,255,0.12); border-color: rgba(255,255,255,0.22); }
.rb-btn.rb-active { background: var(--accent-dim); border-color: var(--accent); color: #eefaf5; }
.rb-btn-accent { border-color: rgba(164, 212, 108, 0.38); color: #d9f2b4; }
.rb-btn-accent.rb-active { background: rgba(146, 204, 78, 0.24); border-color: #a6e056; }
.rb-speed-btn { padding: 4px 6px; font-size: 11px; }

/* Collapsible floating drawers */
.rb-drawer {
  position: fixed; z-index: 25; background: var(--glass); backdrop-filter: blur(12px);
  border: 1px solid var(--glass-border); border-radius: 9px;
  box-shadow: 0 12px 32px rgba(0,0,0,0.52); display: flex; flex-direction: column;
}
.rb-drawer-right { top: 56px; right: 10px; width: 314px; max-height: calc(100vh - 205px); }
.rb-drawer-left { top: 56px; left: 10px; width: 288px; max-height: calc(100vh - 72px); }
.rb-drawer-bottom {
  bottom: 10px; left: 10px; width: min(760px, calc(100vw - 210px)); max-height: 280px;
}
.rb-drawer-head {
  display: flex; align-items: center; justify-content: space-between;
  padding: 7px 10px; border-bottom: 1px solid var(--glass-border);
  font-weight: 600; font-size: 12px; color: #eef2f5;
}
.rb-drawer-body { overflow-y: auto; padding: 8px 10px; display: flex; flex-direction: column; gap: 10px; }
.rb-x {
  background: none; border: none; color: var(--muted); font-size: 16px; line-height: 1;
  cursor: pointer; padding: 0 4px;
}
.rb-x:hover { color: #fff; }

.rb-warn {
  margin: 6px 10px 0; padding: 5px 8px; border-radius: 6px;
  background: rgba(212,180,106,0.16); border: 1px solid rgba(212,180,106,0.4);
  color: #f3dc9e; font-size: 11px;
}
.rb-sec { display: flex; flex-direction: column; gap: 6px; }
.rb-sec h4 {
  margin: 0; font-size: 10.5px; text-transform: uppercase; letter-spacing: 0.7px;
  color: var(--muted); border-bottom: 1px solid rgba(255,255,255,0.07); padding-bottom: 3px;
}
.rb-param { display: flex; flex-direction: column; gap: 2px; }
.rb-param-top { display: flex; align-items: center; justify-content: space-between; gap: 6px; }
.rb-param-top label { color: #ccd5dd; font-size: 11px; }
.rb-num {
  width: 74px; padding: 2px 5px; border-radius: 4px;
  background: rgba(0,0,0,0.35); border: 1px solid rgba(255,255,255,0.14);
  color: #eef3f7; font-size: 11px; text-align: right; user-select: text;
}
.rb-slider { width: 100%; accent-color: var(--accent); margin: 0; height: 14px; }
.rb-check { display: flex; align-items: center; gap: 6px; font-size: 11.5px; color: #d5dee6; cursor: pointer; }
.rb-check-sm { display: flex; align-items: center; gap: 4px; font-size: 11px; color: #c4cfd8; cursor: pointer; }
.rb-inline-checks { display: flex; align-items: center; gap: 10px; }
.rb-btn-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 5px; }
.rb-seg { display: grid; grid-template-columns: repeat(3, 1fr); gap: 4px; }
.rb-textarea {
  width: 100%; background: rgba(0,0,0,0.35); color: #dce4eb;
  border: 1px solid rgba(255,255,255,0.14); border-radius: 5px;
  padding: 5px; font-family: ui-monospace, Consolas, monospace; font-size: 10.5px;
  resize: vertical; user-select: text;
}

/* Matter Forge */
.rb-brush-list { display: flex; flex-direction: column; gap: 4px; }
.rb-brush-btn {
  display: flex; align-items: center; gap: 8px; padding: 5px 8px;
  background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.1);
  border-radius: 6px; color: var(--text); font-size: 11.5px; cursor: pointer; text-align: left;
}
.rb-brush-btn:hover { background: rgba(255,255,255,0.09); }
.rb-brush-btn.rb-active { background: var(--accent-dim); border-color: var(--accent); }
.rb-dot { width: 11px; height: 11px; border-radius: 50%; flex-shrink: 0; border: 1px solid rgba(255,255,255,0.35); }
.rb-custom-head { display: flex; align-items: center; gap: 10px; }
.rb-preview-canvas {
  background: rgba(0,0,0,0.32); border: 1px solid rgba(255,255,255,0.12); border-radius: 7px; flex-shrink: 0;
}
.rb-custom-col { display: flex; flex-direction: column; gap: 4px; flex: 1; }
.rb-color { width: 100%; height: 26px; border: none; background: none; cursor: pointer; }

/* Mind X-Ray */
.rb-xray-grid { display: grid; grid-template-columns: 295px 1fr; gap: 10px; padding: 8px 10px; overflow-y: auto; }
.rb-xray-col { display: flex; flex-direction: column; gap: 5px; min-width: 0; }
.rb-sublabel { font-size: 10px; text-transform: uppercase; letter-spacing: 0.6px; color: var(--muted); }
.rb-retina-strip { width: 100%; height: 18px; border-radius: 4px; border: 1px solid rgba(255,255,255,0.16); image-rendering: pixelated; }
.rb-xray-stats { display: flex; flex-wrap: wrap; gap: 6px 10px; font-size: 11px; color: #ccd6de; }
.rb-xray-bio { display: flex; flex-direction: column; gap: 3px; max-height: 92px; overflow-y: auto; }
.rb-bio-row { font-size: 10.5px; color: #c7d1da; line-height: 1.3; }
.rb-swatch { display: inline-block; width: 10px; height: 10px; border-radius: 3px; vertical-align: -1px; margin-right: 5px; border: 1px solid rgba(255,255,255,0.3); }
.rb-swatch-sm { display: inline-block; width: 8px; height: 8px; border-radius: 2px; vertical-align: 0; margin-right: 4px; }
.rb-table { width: 100%; border-collapse: collapse; font-size: 10.5px; }
.rb-table th { text-align: left; color: var(--muted); font-weight: 600; padding: 3px 5px; border-bottom: 1px solid rgba(255,255,255,0.1); }
.rb-table td { padding: 3px 5px; border-bottom: 1px solid rgba(255,255,255,0.05); vertical-align: middle; }
.rb-table small { display: block; color: var(--muted); font-size: 9.5px; }
.rb-m-empty { color: rgba(147,161,174,0.45); text-align: center; }
.rb-m-pos { background: rgba(88, 178, 132, 0.16); color: #cdeedb; border-radius: 3px; }
.rb-m-neg { background: rgba(214, 96, 90, 0.18); color: #f6cac7; border-radius: 3px; }
.rb-m-neu { background: rgba(255, 255, 255, 0.04); color: #cfd8e0; border-radius: 3px; }

/* Player HUD */
.rb-player-hud {
  position: fixed; bottom: 12px; left: 50%; transform: translateX(-50%); z-index: 26;
  background: var(--glass); backdrop-filter: blur(10px);
  border: 1px solid rgba(166, 224, 86, 0.3); border-radius: 9px;
  padding: 7px 12px; min-width: 390px; box-shadow: 0 10px 26px rgba(0,0,0,0.48);
  display: flex; flex-direction: column; gap: 5px;
}
.rb-phud-top { display: flex; align-items: center; gap: 6px; font-size: 11.5px; }
.rb-phud-bars { display: grid; grid-template-columns: repeat(4, 1fr); gap: 8px; }
.rb-hbar { display: flex; flex-direction: column; gap: 2px; font-size: 10px; color: var(--muted); }
.rb-track { height: 5px; background: rgba(255,255,255,0.09); border-radius: 3px; overflow: hidden; }
.rb-fill { height: 100%; border-radius: 3px; transition: width 0.08s; }
.rb-fill.c-e { background: #72c496; }
.rb-fill.c-i { background: #6aa8d6; }
.rb-fill.c-k { background: #d6ba6e; }
.rb-fill.c-s { background: #d6716a; }
.rb-phud-hint { font-size: 10.5px; color: #b5c3ce; text-align: center; }

/* Minimap */
.rb-minimap-wrap {
  position: fixed; right: 10px; bottom: 10px; z-index: 24;
  background: var(--glass); border: 1px solid var(--glass-border); border-radius: 8px;
  padding: 4px; box-shadow: 0 8px 22px rgba(0,0,0,0.48); display: flex; flex-direction: column; gap: 3px;
}
#minimap-canvas { display: block; border-radius: 5px; cursor: pointer; }
.rb-minimap-label { font-size: 9.5px; color: var(--muted); text-align: center; letter-spacing: 0.4px; }
`;

function build() {
  const parts = [];
  for (const mod of MODULES) {
    const abs = path.join(rootDir, mod.file);
    const src = fs.readFileSync(abs, 'utf8');
    parts.push(transformModule(mod.id, src));
  }

  const bundleJs = `(function() {
  'use strict';
  const __modules = Object.create(null);
  const __cache = Object.create(null);
  function __require(id) {
    if (__cache[id]) return __cache[id];
    const fn = __modules[id];
    if (!fn) throw new Error('Missing bundled module: ' + id);
    const out = fn(__require);
    __cache[id] = out;
    return out;
  }
${parts.join('\n\n')}

  __require('ui/app');
})();`;

  // Syntax-check the bundled JS immediately in Node!
  try {
    new Function(bundleJs);
  } catch (err) {
    console.error('SYNTAX CHECK FAILED:', err);
    process.exit(1);
  }

  // Prevent accidental </script> termination inside HTML
  const safeJs = bundleJs.replace(/<\/script>/gi, '<\\/script>');

  const html = `<!DOCTYPE html>
<html lang="pl">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>ReflexBrain v3 — Żywy Biom i Predyktor Skutków</title>
  <style>${CSS}</style>
</head>
<body>
  <div id="app"></div>
  <script>${safeJs}</script>
</body>
</html>
`;

  const distDir = path.join(rootDir, 'dist');
  fs.mkdirSync(distDir, { recursive: true });
  const outPath = path.join(distDir, 'reflexbrain-v3.html');
  fs.writeFileSync(outPath, html, 'utf8');
  console.log(`Built ${outPath} (${(html.length / 1024).toFixed(1)} KB, syntax=OK, modules=${MODULES.length})`);
}

build();
