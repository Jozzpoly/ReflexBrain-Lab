// tests/tools.test.mjs — testy pozytywne i negatywne dla straznik.mjs, drogi.mjs i sprawdz-lab.mjs.

import assert from 'node:assert/strict';
import { mkdtempSync, writeFileSync, mkdirSync, rmSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { scanText, scanWorkingTree, parsePatterns, hashTerm, resolvePatternsPath } from '../tools/straznik.mjs';
import { sprawdzDrogi, renderujRaportDrog } from '../tools/drogi.mjs';
import { validateState, renderWiedza, renderBrief } from '../tools/sprawdz-lab.mjs';

const ROOT = resolve(fileURLToPath(new URL('..', import.meta.url)));

console.log('=== TEST 1: straznik.mjs (bez martwych stref!) ===');
{
  const clean = scanText('Czysty opis techniczny w ReflexBrain Lab bez sekretow.');
  assert.equal(clean.length, 0, 'Czysty tekst powinien dac 0 trafien');

  const fakeGh = 'ghp_' + 'A1b2C3d4E5f6G7h8I9j0K1l2M3n4O5p6';
  const fakeWin = 'C:' + '\\Users\\' + 'DemoUser\\secret.txt';
  const fakeGitBash = '/c/' + 'Users/' + 'DemoUser/w.txt';
  const secretHit = scanText(`token=${fakeGh}\nwin=${fakeWin}\ngb=${fakeGitBash}`);
  assert.ok(secretHit.some((h) => h.rule === 'token-github' && h.waga === 'blok'));
  assert.ok(secretHit.some((h) => h.rule === 'sciezka-lokalna-win' && h.waga === 'blok'));
  assert.ok(secretHit.some((h) => h.rule === 'sciezka-lokalna-gitbash' && h.waga === 'blok'));
  assert.ok(!JSON.stringify(secretHit).includes(fakeGh), 'Wynik straznika nie moze zawierac sekretu');

  // Obsluga wielowyrazowych wzorcow SHA-256 (rowniez > 4 slowa) + jednoczesne ostrzezenie w tej samej linii
  const hashed = parsePatterns(`sha256:${hashTerm('bardzo dluga tajna piec slowna lodz')}\nostrzez:uwaga fraza\n`);
  const patHit = scanText('To zawiera Bardzo Długą Tajną Pięć Słowną Łódź oraz uwaga fraza.', hashed);
  assert.ok(patHit.some((h) => h.rule === 'wzorzec-prywatny' && h.waga === 'blok'));
  assert.ok(patHit.some((h) => h.rule === 'wzorzec-do-sprawdzenia' && h.waga === 'ostrzezenie'));

  // Poprawka sciezki Git Bash na Windows (rozbity literal, zeby ten plik tez przechodzil straznika!)
  const sampleGb = '/c/' + 'Users/' + 'test/w.txt';
  const expectedWin = 'C:' + '/Users/' + 'test/w.txt';
  assert.equal(resolvePatternsPath(sampleGb, 'win32'), expectedWin);

  // Test scanWorkingTree na tymczasowym katalogu z wyciekiem
  const tmp = mkdtempSync(join(tmpdir(), 'rb-straznik-'));
  try {
    writeFileSync(join(tmp, 'note.txt'), `leaked ${fakeGh}\n`, 'utf8');
    const hits = scanWorkingTree(tmp);
    assert.ok(hits.some((h) => h.file === 'note.txt' && h.rule === 'token-github'));
  } finally {
    rmSync(tmp, { recursive: true, force: true });
  }
  console.log('[PASS] straznik.mjs (sekrety, sciezki Win/GitBash, SHA-256 >4 slow, scanWorkingTree, 0 martwych stref)');
}

console.log('=== TEST 2: drogi.mjs ===');
{
  const tmp = mkdtempSync(join(tmpdir(), 'rb-drogi-'));
  try {
    mkdirSync(join(tmp, 'lab'), { recursive: true });
    mkdirSync(join(tmp, 'proby'), { recursive: true });
    writeFileSync(
      join(tmp, 'lab', 'state.json'),
      JSON.stringify({ neighbors: [{ name: 'Sas', url: 'https://example.invalid/sas' }] }),
      'utf8'
    );
    writeFileSync(
      join(tmp, 'README.md'),
      '# Test\n[martwy](proby/brak.md)\n[obcy](obce-repo/doc.md)\n```md\n[ignoruj-w-kodzie](nieistnieje.md)\n```\n`[inline-kod](tez-nie.md)`\n',
      'utf8'
    );
    writeFileSync(join(tmp, 'sierota.md'), '# Sierota\n', 'utf8');
    const bad = sprawdzDrogi(tmp);
    assert.ok(bad.sieroty.includes('sierota.md'), 'Musi wykryc sierote');
    assert.ok(bad.martwe.some((m) => m.surowy === 'proby/brak.md'), 'Literowka w istniejacym katalogu to martwy link');
    assert.ok(bad.obce.some((o) => o.surowy === 'obce-repo/doc.md'), 'Brakujacy obcy katalog to obca sciezka');
    assert.ok(!bad.martwe.some((m) => m.surowy === 'nieistnieje.md' || m.surowy === 'tez-nie.md'), 'Linki w kodzie musza byc ignorowane');
    assert.equal(bad.brakSasiadow.length, 1, 'Musi wykryc brak sasiada z state.json');
    assert.ok(renderujRaportDrog(bad).includes('sierota'));
  } finally {
    rmSync(tmp, { recursive: true, force: true });
  }
  console.log('[PASS] drogi.mjs (sieroty, martwe, obce, brak sasiadow, ignorowanie blokow kodu)');
}

console.log('=== TEST 3: sprawdz-lab.mjs ===');
{
  const state = JSON.parse(readFileSync(join(ROOT, 'lab', 'state.json'), 'utf8'));
  const okErrors = validateState(state, ROOT);
  assert.equal(okErrors.length, 0, `lab/state.json ma bledy: ${okErrors.join('; ')}`);

  const broken = structuredClone(state);
  broken.lineages[0].sha = '0'.repeat(40);
  broken.apparatusCalibrators[0].scientificClaim = true;
  const badErrors = validateState(broken, ROOT);
  assert.ok(badErrors.length >= 2, 'Musi odrzucic zerowy SHA i scientificClaim=true dla kalibratora');

  const md = renderWiedza(state);
  assert.ok(md.includes('L-NEON-V3') && md.includes('N19') && md.includes('Granica użycia dawcy') && md.includes('archive-tag'));
  const brief = renderBrief(state);
  assert.ok(brief.includes('WERDYKTY OWNERA') && brief.includes('KANON NEGATYWNY') && brief.includes('[N10 |'));
  console.log('[PASS] sprawdz-lab.mjs (walidacja zerowego SHA, WIEDZA.md z donorBoundary/refKind, kompletny --brief)');
}
