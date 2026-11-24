// tools/render-atlas.mjs — generuje spokojny, samowystarczalny atlas.html 1:1 z lab/state.json.
// Zero backendu, zero zewnetrznych skryptow, dziala z file:// po dwukliku i wystawia #rb-lab-state dla Jaskini.

import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

function escJsonForScript(obj) {
  return JSON.stringify(obj).replace(/</g, '\\u003c').replace(/>/g, '\\u003e');
}

export function renderAtlasHtml(state) {
  const safeJson = escJsonForScript(state);
  return `<!doctype html>
<html lang="pl">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>ReflexBrain Lab — Atlas Stołu Okazów</title>
  <style>
    :root {
      color-scheme: dark;
      --bg: #0b1017; --surf: #111923; --surf2: #162130; --line: rgba(148,175,204,0.16);
      --txt: #e6eff8; --muted: #8ea3ba; --acc: #4ad8c4; --warn: #f5a54a; --bad: #f07178;
    }
    * { box-sizing: border-box; }
    body { margin: 0; background: var(--bg); color: var(--txt); font: 14px/1.5 system-ui, -apple-system, sans-serif; }
    a { color: var(--acc); text-decoration: none; }
    a:hover { text-decoration: underline; }
    .page { max-width: 1260px; margin: 0 auto; padding: 20px 18px 48px; display: flex; flex-direction: column; gap: 22px; }
    .truth-bar { background: var(--surf); border: 1px solid var(--line); border-radius: 12px; padding: 16px 18px; display: flex; flex-direction: column; gap: 12px; }
    .truth-top { display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; gap: 10px; }
    .title-row { display: flex; flex-wrap: wrap; align-items: center; gap: 10px; }
    h1 { margin: 0; font-size: 20px; font-weight: 700; letter-spacing: -0.01em; }
    h2 { margin: 0 0 10px; font-size: 14px; text-transform: uppercase; letter-spacing: 0.06em; color: var(--muted); }
    .seal { padding: 4px 10px; border-radius: 999px; font-size: 12px; font-weight: 600; border: 1px solid rgba(245,165,74,0.4); background: rgba(245,165,74,0.12); color: var(--warn); }
    .seal-ok { border-color: rgba(74,216,196,0.45); background: rgba(74,216,196,0.14); color: var(--acc); }
    .btn { background: var(--surf2); color: var(--txt); border: 1px solid var(--line); border-radius: 8px; padding: 6px 12px; font-size: 12.5px; cursor: pointer; }
    .btn:hover { border-color: var(--acc); }
    .btn-acc { background: rgba(74,216,196,0.14); border-color: rgba(74,216,196,0.45); color: var(--acc); }
    .questions { display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 10px; }
    .q-card { background: #0d141d; border: 1px solid var(--line); border-radius: 9px; padding: 10px 12px; font-size: 13px; color: #d5e3f2; }
    .horizon { font-size: 12.5px; color: var(--muted); }
    .shelf { display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 12px; }
    .probe-card { background: var(--surf); border: 1px solid var(--line); border-radius: 11px; padding: 14px; display: flex; flex-direction: column; gap: 8px; }
    .probe-empty { border-style: dashed; color: var(--muted); justify-content: center; }
    .tag { display: inline-block; width: fit-content; font-size: 11px; font-weight: 600; padding: 2px 8px; border-radius: 999px; }
    .tag-cal { background: rgba(245,165,74,0.14); color: var(--warn); border: 1px solid rgba(245,165,74,0.35); }
    .tag-acc { background: rgba(74,216,196,0.14); color: var(--acc); border: 1px solid rgba(74,216,196,0.35); }
    .tag-muted { background: rgba(142,163,186,0.12); color: var(--muted); border: 1px solid var(--line); }
    .verdict-strip { display: flex; flex-wrap: wrap; gap: 8px; }
    .ov-chip { background: var(--surf); border: 1px solid var(--line); border-radius: 9px; padding: 7px 10px; font-size: 12px; cursor: pointer; text-align: left; color: var(--txt); }
    .ov-chip strong { color: var(--warn); }
    .ov-chip.active { border-color: var(--warn); background: rgba(245,165,74,0.1); }
    .grid-core { display: grid; grid-template-columns: 1.45fr 1fr; gap: 16px; align-items: start; }
    @media (max-width: 920px) { .grid-core { grid-template-columns: 1fr; } }
    .stack { display: flex; flex-direction: column; gap: 10px; }
    .lineage-card, .tension-card { background: var(--surf); border: 1px solid var(--line); border-radius: 11px; padding: 13px 14px; transition: border-color 140ms, background 140ms; }
    .tension-card { cursor: pointer; }
    .lineage-card.hl, .tension-card.active { border-color: var(--acc); background: #14212e; }
    .card-head { display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; gap: 6px; margin-bottom: 6px; }
    .card-title { font-weight: 600; font-size: 14px; }
    .bands { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin-top: 8px; font-size: 12.5px; }
    @media (max-width: 640px) { .bands { grid-template-columns: 1fr; } }
    .band-ok { background: rgba(74,216,196,0.06); border-left: 3px solid var(--acc); padding: 7px 9px; border-radius: 6px; }
    .band-no { background: rgba(240,113,120,0.06); border-left: 3px solid var(--bad); padding: 7px 9px; border-radius: 6px; color: #c7d4e2; }
    .band-label { font-size: 11px; text-transform: uppercase; letter-spacing: 0.04em; color: var(--muted); display: block; margin-bottom: 2px; }
    .tech-only { display: none; margin-top: 7px; font: 11.5px/1.4 monospace; color: var(--muted); }
    body.show-tech .tech-only { display: block; }
    .reef-wrap { display: grid; grid-template-columns: 1.45fr 1fr; gap: 16px; align-items: start; }
    @media (max-width: 920px) { .reef-wrap { grid-template-columns: 1fr; } }
    .pills { display: flex; flex-wrap: wrap; gap: 7px; }
    .n-pill { background: var(--surf); border: 1px solid var(--line); color: var(--txt); border-radius: 999px; padding: 5px 10px; font-size: 12px; cursor: pointer; }
    .n-pill:hover, .n-pill.active { border-color: var(--warn); color: #ffd9a8; }
    .n-pill.hl { border-color: var(--acc); background: rgba(74,216,196,0.12); }
    .n-detail { margin-top: 10px; background: #0d141d; border: 1px solid var(--line); border-radius: 9px; padding: 11px 13px; font-size: 13px; }
    .dont-box { background: rgba(240,113,120,0.06); border: 1px solid rgba(240,113,120,0.32); border-radius: 11px; padding: 13px 15px; }
    .dont-box ul { margin: 8px 0 0; padding-left: 18px; display: flex; flex-direction: column; gap: 6px; font-size: 12.5px; color: #e8cdd0; }
    .sketch-box { background: var(--surf); border: 1px solid var(--line); border-radius: 12px; padding: 14px 16px; display: flex; flex-direction: column; gap: 10px; }
    .sketch-row { display: flex; flex-wrap: wrap; gap: 8px; align-items: center; }
    .sketch-row select, .sketch-row input { background: #0b1017; color: var(--txt); border: 1px solid var(--line); border-radius: 7px; padding: 7px 10px; font-size: 13px; }
    .sketch-row input { flex: 1; min-width: 220px; }
    .neighbors { display: flex; flex-wrap: wrap; gap: 10px; font-size: 12.5px; color: var(--muted); }
    .mono { font-family: monospace; }
  </style>
</head>
<body>
  <script id="rb-lab-state" type="application/json">${safeJson}</script>
  <div class="page" id="atlas-root"></div>
  <script>
(() => {
  'use strict';
  const state = JSON.parse(document.getElementById('rb-lab-state').textContent);
  const root = document.getElementById('atlas-root');
  const repoUrl = 'https://github.com/' + state.repository;

  const tensionLinks = {
    T1: { lineages: ['L-R2-R3', 'L-NEON-V3'], negatives: ['N4', 'N6', 'N11', 'N15'] },
    T2: { lineages: ['L-R8-R13', 'L-R2-R3'], negatives: ['N5', 'N7', 'N8', 'N9', 'N16', 'N18', 'N19'] },
    T3: { lineages: ['L-NEON-V3', 'L-PREO0-E0'], negatives: ['N11', 'N16'] },
    T4: { lineages: ['L-NEON-V3', 'L-R0-R1'], negatives: ['N10', 'N13'] },
    T5: { lineages: ['L-MEDIUM-D', 'L-R8-R13', 'L-NEON-V3'], negatives: ['N14', 'N17'] },
  };

  let activeTension = null;
  let activeNegative = state.negativeCanon[0] ? state.negativeCanon[0].id : null;
  let activeVerdictFilter = null;

  function esc(s) {
    return String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  }

  function shortLabel(text) {
    return text.split(/[:—.,(]/)[0].trim().split(/\s+/).slice(0, 4).join(' ');
  }

  function render() {
    const tMap = activeTension ? tensionLinks[activeTension] || { lineages: [], negatives: [] } : { lineages: [], negatives: [] };
    const negObj = state.negativeCanon.find((n) => n.id === activeNegative) || state.negativeCanon[0];

    const verdictCards = state.ownerVerdicts.map((v) =>
      '<button class="ov-chip ' + (activeVerdictFilter === v.id ? 'active' : '') + '" data-ov="' + esc(v.id) + '">' +
      '<span class="mono">' + esc(v.id) + '</span> · ' + esc(v.target) + '<br><strong>' + esc(v.verdict) + '</strong> (' + esc(v.date) + ')' +
      '</button>'
    ).join('');

    const probeCards = [
      ...(state.scientificProbes || []).map((p) =>
        '<div class="probe-card">' +
        '<span class="tag tag-acc">PROBA NAUKOWA · ' + esc(p.status) + '</span>' +
        '<strong>' + esc(p.id) + '</strong>' +
        '<div class="horizon">' + esc(p.note) + '</div>' +
        (p.htmlArtifact ? '<a class="btn btn-acc" href="./' + esc(p.htmlArtifact) + '">Otworz z reki (HTML)</a>' : '') +
        '</div>'
      ),
      ...(state.scientificProbes && state.scientificProbes.length === 0
        ? ['<div class="probe-card probe-empty"><strong>0 aktywnych prob naukowych — stol czysty</strong><div class="horizon">Srodowisko jest gotowe na pierwsze podejscie od nowa celujace w napiecia T1..T5.</div></div>']
        : []),
      ...(state.apparatusCalibrators || []).map((p) =>
        '<div class="probe-card">' +
        '<span class="tag tag-cal">KALIBRATOR APARATURY · NIE WYNIK AI</span>' +
        '<strong>' + esc(p.id) + '</strong>' +
        '<div class="horizon">' + esc(p.note) + '</div>' +
        '<div class="sketch-row">' +
        (p.htmlArtifact ? '<a class="btn btn-acc" href="./' + esc(p.htmlArtifact) + '">Otworz mikroskop P00</a>' : '') +
        '<span class="tech-only mono">' + esc(p.verifyCmd) + '</span>' +
        '</div></div>'
      ),
    ].join('');

    const lineageHtml = state.lineages.map((l) => {
      const ovMatch = activeVerdictFilter && state.ownerVerdicts.some((v) => v.id === activeVerdictFilter && (v.sourceSha === l.sha || (l.secondaryRefs || []).some((s) => s.sha === v.sourceSha)));
      const hl = tMap.lineages.includes(l.id) || ovMatch;
      return '<article class="lineage-card ' + (hl ? 'hl' : '') + '">' +
        '<div class="card-head">' +
        '<span class="card-title">' + esc(l.name) + '</span>' +
        '<span class="tag tag-muted">' + esc(l.status) + '</span>' +
        '</div>' +
        '<div class="bands">' +
        '<div class="band-ok"><span class="band-label">Co ocalalo (dawca)</span>' + esc(l.whatSurvived) + '</div>' +
        '<div class="band-no"><span class="band-label">Co upadlo / odrzucono</span>' + esc(l.whatFailedOrRejected) + '</div>' +
        '</div>' +
        '<div class="horizon" style="margin-top:7px"><strong>Granica dawcy:</strong> ' + esc(l.donorBoundary) + '</div>' +
        '<div class="tech-only">[' + esc(l.id) + ' | ' + esc(l.evidenceClass) + ' | ' + esc(l.refKind) + ': ' + esc(l.ref) + '] · <a href="' + repoUrl + '/tree/' + esc(l.sha) + '" target="_blank">' + esc(l.sha.slice(0, 10)) + '</a></div>' +
        '</article>';
    }).join('');

    const tensionHtml = state.openTensions.map((t) =>
      '<article class="tension-card ' + (activeTension === t.id ? 'active' : '') + '" data-tension="' + esc(t.id) + '">' +
      '<div class="card-head"><span class="card-title">' + esc(t.id) + ' — ' + esc(t.title) + '</span>' +
      '<span class="tag tag-acc">' + (activeTension === t.id ? 'podswietlone' : 'kliknij') + '</span></div>' +
      '<div class="horizon">' + esc(t.question) + '</div>' +
      '</article>'
    ).join('');

    const negPills = state.negativeCanon.map((n) => {
      const cls = ['n-pill', activeNegative === n.id ? 'active' : '', tMap.negatives.includes(n.id) ? 'hl' : ''].filter(Boolean).join(' ');
      return '<button class="' + cls + '" data-neg="' + esc(n.id) + '"><strong>' + esc(n.id) + '</strong> ' + esc(shortLabel(n.lesson)) + '</button>';
    }).join('');

    const negDetail = negObj
      ? '<div class="n-detail"><strong>' + esc(negObj.id) + '</strong> (' + esc(negObj.source) + '): ' + esc(negObj.lesson) +
        '<div class="tech-only">klasa: ' + esc(negObj.evidenceClass) + ' · commit: <a href="' + repoUrl + '/tree/' + esc(negObj.sha) + '" target="_blank">' + esc(negObj.sha) + '</a></div></div>'
      : '';

    const savedDraft = (() => { try { return localStorage.getItem('rb_atlas_draft_note') || ''; } catch { return ''; } })();

    root.innerHTML =
      '<section class="truth-bar">' +
        '<div class="truth-top">' +
          '<div class="title-row">' +
            '<h1>ReflexBrain Lab — Atlas Stolu Okazow</h1>' +
            '<span class="seal ' + (state.coreMission.ownerLifePassEarned ? 'seal-ok' : '') + '">LIFE PASS OWNERA: ' + (state.coreMission.ownerLifePassEarned ? 'ZDOBYTY' : 'BRAK') + '</span>' +
            '<span class="tag tag-muted">stan: ' + esc(state.updatedAt) + '</span>' +
          '</div>' +
          '<button class="btn" id="btn-tech">' + (document.body.classList.contains('show-tech') ? 'Widok Ownera (prosty)' : '+ SHA i klasy dowodow') + '</button>' +
        '</div>' +
        '<div class="questions">' +
          state.coreMission.twoQuestions.map((q, i) => '<div class="q-card"><strong>Pytanie ' + (i + 1) + ':</strong> ' + esc(q) + '</div>').join('') +
        '</div>' +
        '<div class="horizon"><strong>Daleki horyzont:</strong> ' + esc(state.coreMission.longHorizon) + '</div>' +
        '<div class="verdict-strip">' + verdictCards + '</div>' +
      '</section>' +

      '<section><h2>Na stole — otworz z reki</h2><div class="shelf">' + probeCards + '</div></section>' +

      '<section class="grid-core">' +
        '<div><h2>Konkurujace linie badawcze (' + state.lineages.length + ' — nie jedna os)</h2><div class="stack">' + lineageHtml + '</div></div>' +
        '<div><h2>Otwarte napiecia badawcze (' + state.openTensions.length + ' — kliknij, by podswietlic powiazania)</h2><div class="stack">' + tensionHtml + '</div></div>' +
      '</section>' +

      '<section class="reef-wrap">' +
        '<div><h2>Rafa wynikow negatywnych (' + state.negativeCanon.length + ' lekcji — kliknij pastylke)</h2><div class="pills">' + negPills + '</div>' + negDetail + '</div>' +
        '<div class="dont-box"><h2>Twarde blokady (doNotRepeat)</h2><ul>' + state.doNotRepeat.map((d) => '<li>' + esc(d) + '</li>').join('') + '</ul></div>' +
      '</section>' +

      '<section class="sketch-box">' +
        '<h2>Szkicownik werdyktu z reki (szkic lokalny przegladarki -> eksport .verdict.json)</h2>' +
        '<div class="sketch-row">' +
          '<select id="sk-target">' +
            '<option value="srodowisko-lab-v2">Srodowisko Lab v2</option>' +
            state.openTensions.map((t) => '<option value="' + esc(t.id) + '">' + esc(t.id + ' — ' + t.title) + '</option>').join('') +
            state.lineages.map((l) => '<option value="' + esc(l.id) + '">' + esc(l.id + ' — ' + l.name) + '</option>').join('') +
          '</select>' +
          '<select id="sk-verdict">' +
            '<option value="KIERUNEK_WARTY_DRAZENIA">KIERUNEK_WARTY_DRAZENIA</option>' +
            '<option value="APARATURA_OK">APARATURA_OK</option>' +
            '<option value="OTWARTE">OTWARTE</option>' +
            '<option value="OWNER_LIFE_FAIL">OWNER_LIFE_FAIL</option>' +
          '</select>' +
          '<input id="sk-note" type="text" value="' + esc(savedDraft) + '" placeholder="Wpisz swoja intuicje lub korekte kierunku..." />' +
          '<button class="btn btn-acc" id="sk-download">Pobierz .verdict.json</button>' +
        '</div>' +
        '<div class="horizon" id="sk-status"></div>' +
      '</section>' +

      '<footer class="neighbors">' +
        '<span>Sasiedzi ekosystemu:</span>' +
        state.neighbors.map((n) => '<a href="' + esc(n.url) + '" target="_blank">' + esc(n.name) + '</a>').join(' · ') +
      '</footer>';

    document.getElementById('btn-tech').onclick = () => {
      document.body.classList.toggle('show-tech');
      render();
    };
    root.querySelectorAll('[data-tension]').forEach((el) => {
      el.onclick = () => {
        activeTension = activeTension === el.dataset.tension ? null : el.dataset.tension;
        render();
      };
    });
    root.querySelectorAll('[data-neg]').forEach((el) => {
      el.onclick = () => {
        activeNegative = el.dataset.neg;
        render();
      };
    });
    root.querySelectorAll('[data-ov]').forEach((el) => {
      el.onclick = () => {
        activeVerdictFilter = activeVerdictFilter === el.dataset.ov ? null : el.dataset.ov;
        render();
      };
    });
    const noteEl = document.getElementById('sk-note');
    noteEl.oninput = () => { try { localStorage.setItem('rb_atlas_draft_note', noteEl.value); } catch {} };
    document.getElementById('sk-download').onclick = () => {
      const card = {
        schema: 'reflexbrain-owner-verdict/v1',
        timestamp: new Date().toISOString(),
        probeId: document.getElementById('sk-target').value,
        verdict: document.getElementById('sk-verdict').value,
        note: noteEl.value,
      };
      const blob = new Blob([JSON.stringify(card, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = card.probeId + '-verdict.json';
      a.click();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
      document.getElementById('sk-status').textContent = 'Pobrano karte ' + a.download + '.';
    };
  }

  render();
})();
  </script>
</body>
</html>
`;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const root = resolve('.');
  const statePath = join(root, 'lab', 'state.json');
  const outPath = join(root, 'atlas.html');
  const state = JSON.parse(readFileSync(statePath, 'utf8'));
  const expected = renderAtlasHtml(state);

  if (process.argv.includes('--check')) {
    if (!existsSync(outPath)) {
      console.error('render-atlas: brak atlas.html (uruchom npm run render).');
      process.exit(1);
    }
    const actual = readFileSync(outPath, 'utf8').replace(/\r\n/g, '\n');
    if (actual !== expected.replace(/\r\n/g, '\n')) {
      console.error('render-atlas: DRYF — atlas.html rozni sie od lab/state.json! Uruchom npm run render.');
      process.exit(1);
    }
    console.log(`render-atlas: OK (atlas.html=SYNC, ${(Buffer.byteLength(expected, 'utf8') / 1024).toFixed(1)} KB).`);
  } else {
    writeFileSync(outPath, expected, 'utf8');
    console.log(`render-atlas: wygenerowano atlas.html (${(Buffer.byteLength(expected, 'utf8') / 1024).toFixed(1)} KB).`);
  }
}
