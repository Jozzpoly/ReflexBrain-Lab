// tools/sprawdz-lab.mjs — walidator lab/state.json, generator WIEDZA.md oraz 1-ekranowego Cold-Start Briefu.
// Zasada jednego wlasciciela: lab/state.json jest jedynym zrodlem prawdy; WIEDZA.md generuje sie deterministycznie.

import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

const SHA40 = /^[0-9a-f]{40}$/;
const ZERO_SHA = /^0{40}$/;
const REQUIRED_EVIDENCE_CODES = ['KOD', 'TEST', 'SWIAT', 'OWNER', 'HIPOTEZA'];

function isValidSha(sha) {
  return typeof sha === 'string' && SHA40.test(sha) && !ZERO_SHA.test(sha);
}

function escCell(text) {
  return String(text ?? '').replace(/\|/g, '\\|').replace(/\r?\n/g, ' ');
}

export function validateState(state, root) {
  const errors = [];
  if (!state || typeof state !== 'object') return ['lab/state.json nie jest obiektem JSON'];
  if (state.schema !== 'reflexbrain-lab-state/v1') errors.push(`Nieznany schemat: ${state.schema}`);

  if (!state.coreMission || !Array.isArray(state.coreMission.twoQuestions) || state.coreMission.twoQuestions.length < 2) {
    errors.push('coreMission.twoQuestions musi zawierac 2 pytania rdzeniowe');
  }

  const validClasses = new Set((state.evidenceLadder || []).map((e) => e.code));
  for (const code of REQUIRED_EVIDENCE_CODES) {
    if (!validClasses.has(code)) errors.push(`evidenceLadder brakuje wymaganego poziomu: ${code}`);
  }

  if (!Array.isArray(state.lineages) || state.lineages.length < 5) {
    errors.push('lineages musi zawierac co najmniej 5 historycznych linii');
  } else {
    const ids = new Set();
    for (const l of state.lineages) {
      if (!l.id || ids.has(l.id)) errors.push(`Duplikat lub brak id linii: ${l.id}`);
      ids.add(l.id);
      if (!isValidSha(l.sha)) errors.push(`Linia ${l.id}: niepoprawny 40-znakowy SHA (${l.sha})`);
      if (!validClasses.has(l.evidenceClass)) errors.push(`Linia ${l.id}: niepoprawna klasa dowodu (${l.evidenceClass})`);
      if (!l.whatSurvived || !l.whatFailedOrRejected || !l.donorBoundary) {
        errors.push(`Linia ${l.id}: brak pol whatSurvived/whatFailedOrRejected/donorBoundary`);
      }
      if (!l.ref || !['active-branch', 'archive-tag'].includes(l.refKind)) {
        errors.push(`Linia ${l.id}: wymagane pole ref oraz refKind ('active-branch' | 'archive-tag')`);
      }
      for (const sec of l.secondaryRefs || []) {
        if (!isValidSha(sec.sha)) errors.push(`Linia ${l.id} (${sec.label}): niepoprawny 40-znakowy SHA (${sec.sha})`);
      }
    }
  }

  if (!Array.isArray(state.negativeCanon) || state.negativeCanon.length < 10) {
    errors.push('negativeCanon musi zawierac udokumentowane wyniki negatywne');
  } else {
    const nIds = new Set();
    for (const n of state.negativeCanon) {
      if (!n.id || nIds.has(n.id)) errors.push(`Duplikat lub brak id w negativeCanon: ${n.id}`);
      nIds.add(n.id);
      if (!isValidSha(n.sha)) errors.push(`Negatyw ${n.id}: niepoprawny 40-znakowy SHA (${n.sha})`);
      if (!validClasses.has(n.evidenceClass)) errors.push(`Negatyw ${n.id}: niepoprawna klasa dowodu (${n.evidenceClass})`);
    }
  }

  const ovIds = new Set();
  for (const ov of state.ownerVerdicts || []) {
    if (!ov.id || ovIds.has(ov.id)) errors.push(`Duplikat lub brak id werdyktu: ${ov.id}`);
    ovIds.add(ov.id);
    if (!isValidSha(ov.sourceSha)) errors.push(`Werdykt ${ov.id}: niepoprawny 40-znakowy SHA (${ov.sourceSha})`);
  }

  const probeIds = new Set();
  const allProbes = [...(state.apparatusCalibrators || []), ...(state.scientificProbes || [])];
  for (const p of allProbes) {
    if (!p.id || probeIds.has(p.id)) errors.push(`Duplikat lub brak id proby: ${p.id}`);
    probeIds.add(p.id);
    if (!p.path || !existsSync(join(root, p.path))) errors.push(`Zarejestrowana proba ${p.id}: brak pliku ${p.path}`);
    if (p.kind === 'apparatus-calibrator' && p.scientificClaim !== false) {
      errors.push(`Kalibrator ${p.id} nie moze miec scientificClaim !== false`);
    }
  }

  if (!Array.isArray(state.openTensions) || state.openTensions.length < 3) errors.push('Brak openTensions');
  if (!Array.isArray(state.doNotRepeat) || state.doNotRepeat.length < 4) errors.push('Brak doNotRepeat');

  return errors;
}

export function renderWiedza(state) {
  const repoUrl = `https://github.com/${state.repository}`;
  const shaLink = (sha, path = null) =>
    path ? `[\`${sha.slice(0, 10)}\`](${repoUrl}/blob/${sha}/${path})` : `[\`${sha.slice(0, 10)}\`](${repoUrl}/tree/${sha})`;

  const calList = state.apparatusCalibrators || [];
  const sciList = state.scientificProbes || [];

  const lines = [
    '<!-- generowane deterministycznie z lab/state.json przez tools/sprawdz-lab.mjs --render-wiedza; edytuj lab/state.json, nie ten plik -->',
    '# ReflexBrain Lab — mapa wiedzy, linii i wyników negatywnych',
    '',
    `**Aktualizacja źródła:** ${state.updatedAt} · **Stan:** \`${state.status}\` · **Owner Life PASS:** \`${state.coreMission.ownerLifePassEarned}\``,
    '',
    `> ${state.authorityRule}`,
    '',
    '## 1. Drabina dowodowa (5 rozdzielnych poziomów)',
    '',
    '| Kod | Znaczenie |',
    '| --- | --- |',
    ...state.evidenceLadder.map((e) => `| \`${escCell(e.code)}\` | ${escCell(e.meaning)} |`),
    '',
    '## 2. Werdykty Właściciela (najwyższa płaszczyzna jakości życia)',
    '',
    '| ID | Data | Obiekt | Werdykt | Zakres i granica | Źródło / obiekt |',
    '| --- | --- | --- | --- | --- | --- |',
    ...state.ownerVerdicts.map(
      (v) =>
        `| \`${escCell(v.id)}\` | ${escCell(v.date)} | ${escCell(v.target)} | **${escCell(v.verdict)}** | ${escCell(v.scope)} | ${shaLink(v.sourceSha, v.sourcePath || null)} (${escCell(v.sourceBasis || 'commit')}) |`
    ),
    '',
    `## 3. Konkurujące linie badawcze (${state.lineages.length} linii — nie jedna oś V1→V3)`,
    '',
    'Aby odzyskać historyczną linię z tagiem `archive-tag`, uruchom wcześniej `git fetch --tags` i użyj `git worktree` lub `git show <SHA>:<plik>`.',
    '',
    '| Linia | Status | Ref i SHA | Klasa | Co przetrwało jako dawca | Co zawiodło / odrzucono | Granica użycia dawcy |',
    '| --- | --- | --- | --- | --- | --- | --- |',
    ...state.lineages.map((l) => {
      const refBadge = l.refKind === 'archive-tag' ? `tag: \`${escCell(l.ref)}\`` : `branch: \`${escCell(l.ref)}\``;
      const sec = (l.secondaryRefs || []).map((s) => `${escCell(s.label)}: ${shaLink(s.sha)}`).join('<br>');
      const shaCell = `${refBadge}<br>${shaLink(l.sha)}${sec ? '<br>' + sec : ''}`;
      return `| **${escCell(l.name)}** (\`${escCell(l.id)}\`) | \`${escCell(l.status)}\` | ${shaCell} | \`${escCell(l.evidenceClass)}\` | ${escCell(l.whatSurvived)} | ${escCell(l.whatFailedOrRejected)} | ${escCell(l.donorBoundary)} |`;
    }),
    '',
    `## 4. Kanon wyników negatywnych i granic (${state.negativeCanon.length} zweryfikowanych lekcji)`,
    '',
    '| ID | Zweryfikowana lekcja negatywna lub granica | Źródło | SHA | Klasa |',
    '| --- | --- | --- | --- | --- |',
    ...state.negativeCanon.map(
      (n) => `| \`${escCell(n.id)}\` | ${escCell(n.lesson)} | ${escCell(n.source)} | ${shaLink(n.sha)} | \`${escCell(n.evidenceClass)}\` |`
    ),
    '',
    `## 5. Otwarte napięcia badawcze (${state.openTensions.length})`,
    '',
    ...state.openTensions.map((t) => `- **${escCell(t.id)} — ${escCell(t.title)}:** ${escCell(t.question)}`),
    '',
    `## 6. Twarde blokady (\`doNotRepeat\`, ${state.doNotRepeat.length})`,
    '',
    ...state.doNotRepeat.map((d) => `- ${escCell(d)}`),
    '',
    '## 7. Kalibratory aparatury i zarejestrowane próby naukowe',
    '',
    '### Kalibratory aparatury (`scientificClaim: false`)',
    '',
    '| ID | Dokumentacja | Weryfikacja | Artefakt HTML | Uwaga |',
    '| --- | --- | --- | --- | --- |',
    ...calList.map(
      (p) =>
        `| \`${escCell(p.id)}\` | [${escCell(p.path)}](${p.path}) | \`${escCell(p.verifyCmd)}\` | \`${escCell(p.htmlArtifact || '-')}\` | ${escCell(p.note)} |`
    ),
    '',
    '### Zarejestrowane próby naukowe',
    '',
    ...(sciList.length
      ? [
          '| ID | Status | Dokumentacja | Weryfikacja | Uwaga |',
          '| --- | --- | --- | --- | --- |',
          ...sciList.map(
            (p) =>
              `| \`${escCell(p.id)}\` | \`${escCell(p.status)}\` | [${escCell(p.path)}](${p.path}) | \`${escCell(p.verifyCmd)}\` | ${escCell(p.note)} |`
          ),
        ]
      : ['Brak jeszcze nowej próby naukowej w tym drzewie roboczym — środowisko czeka na pierwsze eksperymenty celujące w napięcia `T1..T5`.']),
    '',
  ];
  return lines.join('\n');
}

export function renderBrief(state) {
  const out = [];
  out.push(`=== REFLEXBRAIN LAB — COLD-START BRIEF (${state.updatedAt} | ${state.status}) ===`);
  out.push(`Owner Life PASS: ${state.coreMission.ownerLifePassEarned ? 'TAK' : 'NIE'}`);
  out.push('');
  out.push('2 PYTANIA RDZENIOWE:');
  state.coreMission.twoQuestions.forEach((q, i) => out.push(`  ${i + 1}. ${q}`));
  out.push('');
  out.push(`WERDYKTY OWNERA (${state.ownerVerdicts.length}):`);
  for (const v of state.ownerVerdicts) {
    out.push(`  - [${v.id}] ${v.target}: ${v.verdict} (${v.date}) @ ${v.sourceSha.slice(0, 10)}`);
  }
  out.push('');
  out.push(`LINIE BADAWCZE (${state.lineages.length} konkurujacych, NIE jedna os):`);
  for (const l of state.lineages) {
    out.push(`  - [${l.id}] ${l.name} (${l.status} | ${l.refKind}: ${l.ref}) @ ${l.sha.slice(0, 10)}`);
  }
  out.push('');
  out.push(`KANON NEGATYWNY (${state.negativeCanon.length} lekcji — NIE powtarzac):`);
  for (const n of state.negativeCanon) {
    out.push(`  - [${n.id} | ${n.evidenceClass} | ${n.sha.slice(0, 10)}] ${n.lesson}`);
  }
  out.push('');
  out.push(`OTWARTE NAPIECIA (${state.openTensions.length}):`);
  for (const t of state.openTensions) out.push(`  - ${t.id} (${t.title}): ${t.question}`);
  out.push('');
  out.push(`KLUCZOWE BLOKADY (${state.doNotRepeat.length}):`);
  for (const d of state.doNotRepeat) out.push(`  - ${d}`);
  out.push('');
  out.push('KOMENDY: npm run check:all | npm run brief | npm run render');
  return out.join('\n');
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const args = process.argv.slice(2);
  const root = resolve('.');
  const statePath = join(root, 'lab', 'state.json');
  const wiedzPath = join(root, 'WIEDZA.md');

  if (!existsSync(statePath)) {
    console.error('sprawdz-lab: brak pliku lab/state.json');
    process.exit(1);
  }
  const state = JSON.parse(readFileSync(statePath, 'utf8'));
  const errors = validateState(state, root);
  if (errors.length > 0) {
    console.error('sprawdz-lab: bledy walidacji lab/state.json:');
    for (const e of errors) console.error('  - ' + e);
    process.exit(1);
  }

  if (args.includes('--render-wiedza')) {
    writeFileSync(wiedzPath, renderWiedza(state), 'utf8');
    console.log('sprawdz-lab: wygenerowano WIEDZA.md z lab/state.json.');
  }

  if (args.includes('--brief')) {
    console.log(renderBrief(state));
  }

  if (args.includes('--check') || (!args.includes('--render-wiedza') && !args.includes('--brief'))) {
    if (!existsSync(wiedzPath)) {
      console.error('sprawdz-lab: brak WIEDZA.md (uruchom npm run render).');
      process.exit(1);
    }
    const expected = renderWiedza(state).replace(/\r\n/g, '\n');
    const actual = readFileSync(wiedzPath, 'utf8').replace(/\r\n/g, '\n');
    if (expected !== actual) {
      console.error('sprawdz-lab: DRYF — WIEDZA.md rozni sie od lab/state.json! Uruchom: npm run render');
      process.exit(1);
    }
    console.log(
      `sprawdz-lab: OK (linie=${state.lineages.length}, negatywy=${state.negativeCanon.length}, napiecia=${state.openTensions.length}, WIEDZA.md=SYNC).`
    );
  }
}
