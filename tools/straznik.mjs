// tools/straznik.mjs — straznik granicy publiczne/prywatne dla ReflexBrain Lab.
// Adaptacja sprawdzonego wzorca z Jaskini (Node >= 20, zero zaleznosci, 0% martwych stref).
// Nigdy nie wypisuje dopasowanej tresci, poniewaz logi publicznego CI sa jawne.

import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { join, relative, resolve, sep } from 'node:path';
import { pathToFileURL } from 'node:url';
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';

export const SECRET_RULES = [
  { id: 'token-github', re: /\b(?:gh[pousr]_[A-Za-z0-9]{30,}|github_pat_[A-Za-z0-9_]{40,})\b/, waga: 'blok' },
  { id: 'klucz-prywatny', re: /-----BEGIN [A-Z ]*PRIVATE KEY-----/, waga: 'blok' },
  { id: 'klucz-aws', re: /\bAKIA[0-9A-Z]{16}\b/, waga: 'blok' },
  { id: 'klucz-api-sk', re: /\bsk-[A-Za-z0-9_-]{20,}\b/, waga: 'blok' },
  { id: 'token-cloudflare', re: /CLOUDFLARE_API_TOKEN\s*[=:]\s*['"]?[A-Za-z0-9_-]{30,}/, waga: 'blok' },
  { id: 'sciezka-lokalna-win', re: /(?:file:\/\/\/)?[A-Za-z]:[\\/]+(?:Users|Desktop|Documents|OneDrive|AppData)[\\/]+[A-Za-z0-9._-]+/i, waga: 'blok' },
  { id: 'sciezka-lokalna-gitbash', re: /(?:^|[\s"'`(=])\/[a-zA-Z]\/Users\/[A-Za-z0-9._-]+/, waga: 'blok' },
  { id: 'sciezka-lokalna-unix', re: /(?:^|[\s"'`(=])\/(?:home|Users)\/[A-Za-z0-9._-]+\//, waga: 'blok' },
];

export const QUOTE_RULE = { id: 'cytat-w-cudzyslowie', re: /\u201e[^\u201d\n]{3,}\u201d/, waga: 'ostrzezenie' };

const PL = { '\u0142': 'l', '\u0141': 'l' };
export function normalize(s) {
  return s
    .replace(/[\u0142\u0141]/g, (c) => PL[c])
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

export const hashTerm = (s) => createHash('sha256').update(normalize(s)).digest('hex').slice(0, 32);

export function parsePatterns(text) {
  const plain = [];
  const hashes = new Set();
  const warnPlain = [];
  const warnHashes = new Set();
  for (const raw of text.split(/\r?\n/)) {
    let l = raw.trim();
    if (!l || l.startsWith('#')) continue;
    const warn = l.startsWith('ostrzez:');
    if (warn) l = l.slice(8).trim();
    if (l.startsWith('sha256:')) (warn ? warnHashes : hashes).add(l.slice(7).toLowerCase());
    else (warn ? warnPlain : plain).push(normalize(l));
  }
  const cleanPlain = plain.filter(Boolean);
  const cleanWarnPlain = warnPlain.filter(Boolean);
  return {
    plain: cleanPlain,
    hashes,
    warnPlain: cleanWarnPlain,
    warnHashes,
    count: cleanPlain.length + hashes.size + cleanWarnPlain.length + warnHashes.size,
  };
}

export function resolvePatternsPath(p, platform = process.platform) {
  if (!p) return p;
  const m = /^\/([a-zA-Z])\/(.*)$/.exec(p);
  return platform === 'win32' && m ? `${m[1].toUpperCase()}:/${m[2]}` : p;
}

export function loadPatterns(p) {
  if (!p || !existsSync(p)) {
    return { plain: [], hashes: new Set(), warnPlain: [], warnHashes: new Set(), count: 0, loadedFrom: null };
  }
  return { ...parsePatterns(readFileSync(p, 'utf8')), loadedFrom: p };
}

function* ngrams(words, max = 8) {
  const cap = Math.min(max, words.length);
  for (let i = 0; i < words.length; i++) {
    for (let n = 1; n <= cap && i + n <= words.length; n++) {
      yield words.slice(i, i + n).join(' ');
    }
  }
}

function matches(norm, plain = [], hashes = new Set()) {
  if (plain.some((p) => norm.includes(' ' + p + ' '))) return true;
  if (!hashes.size) return false;
  const words = norm.trim().split(' ').filter(Boolean);
  for (const g of ngrams(words, 8)) {
    if (hashes.has(createHash('sha256').update(g).digest('hex').slice(0, 32))) return true;
  }
  return false;
}

export function scanText(text, pats = { plain: [], hashes: new Set(), warnPlain: [], warnHashes: new Set() }, { quotes = true } = {}) {
  const out = [];
  const lines = text.split(/\r?\n/);
  lines.forEach((line, i) => {
    for (const r of SECRET_RULES) {
      if (r.re.test(line)) out.push({ rule: r.id, line: i + 1, waga: r.waga });
    }
    if (quotes && QUOTE_RULE.re.test(line)) out.push({ rule: QUOTE_RULE.id, line: i + 1, waga: QUOTE_RULE.waga });
    const norm = ' ' + normalize(line) + ' ';
    if (matches(norm, pats.plain, pats.hashes)) out.push({ rule: 'wzorzec-prywatny', line: i + 1, waga: 'blok' });
    if (matches(norm, pats.warnPlain, pats.warnHashes)) out.push({ rule: 'wzorzec-do-sprawdzenia', line: i + 1, waga: 'ostrzezenie' });
  });
  return out;
}

const looksBinary = (s) => s.includes('\u0000');
const IGNORE_DIRS = new Set(['.git', 'node_modules', '.wrangler']);

function walkFiles(dir, root = dir, acc = []) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    if (IGNORE_DIRS.has(entry.name)) continue;
    const full = join(dir, entry.name);
    if (entry.isDirectory()) walkFiles(full, root, acc);
    else acc.push(relative(root, full).split(sep).join('/'));
  }
  return acc;
}

export function scanWorkingTree(root, pats) {
  const files = walkFiles(root);
  const findings = [];
  for (const f of files) {
    const raw = readFileSync(join(root, f), 'utf8');
    if (looksBinary(raw)) continue;
    for (const hit of scanText(raw, pats)) findings.push({ file: f, ...hit });
  }
  return findings;
}

function gitRun(cwd, ...args) {
  return execFileSync('git', ['-c', 'core.quotePath=false', ...args], { cwd, encoding: 'utf8', maxBuffer: 64 << 20 });
}

export function scanStaged(cwd, pats) {
  const files = gitRun(cwd, 'diff', '--cached', '--name-only', '--diff-filter=ACMR').split('\n').filter(Boolean);
  return files.flatMap((f) => {
    const t = gitRun(cwd, 'show', ':' + f);
    return looksBinary(t) ? [] : scanText(t, pats).map((x) => ({ file: f, ...x }));
  });
}

export function scanTree(cwd, pats, rev = 'HEAD') {
  const files = gitRun(cwd, 'ls-tree', '-r', '--name-only', rev).split('\n').filter(Boolean);
  return files.flatMap((f) => {
    const t = gitRun(cwd, 'show', `${rev}:${f}`);
    return looksBinary(t) ? [] : scanText(t, pats).map((x) => ({ file: f, ...x }));
  });
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const args = process.argv.slice(2);
  const wi = args.indexOf('--wzorce');
  const given = wi >= 0 ? args[wi + 1] : process.env.REFLEXBRAIN_WZORCE || process.env.JASKINIA_WZORCE;
  const patsPath = resolvePatternsPath(given);
  if (given && !existsSync(patsPath)) {
    console.error(`Straznik: wskazany plik wzorcow nie istnieje (${patsPath}). Przerywam zamiast udawac sprawdzenie.`);
    process.exit(2);
  }
  const pats = loadPatterns(patsPath);
  const cwd = resolve('.');
  let findings = [];
  let modeLabel = 'working';
  if (args.includes('--staged')) {
    modeLabel = 'staged';
    findings = scanStaged(cwd, pats);
  } else if (args.includes('--tree')) {
    const ti = args.indexOf('--tree');
    const rev = args[ti + 1] && !args[ti + 1].startsWith('--') ? args[ti + 1] : 'HEAD';
    modeLabel = `tree:${rev}`;
    findings = scanTree(cwd, pats, rev);
  } else {
    findings = scanWorkingTree(cwd, pats);
  }

  const blocks = findings.filter((f) => f.waga === 'blok');
  const warns = findings.filter((f) => f.waga !== 'blok');
  for (const w of warns) console.warn(`  [ostrzezenie] ${w.file}:${w.line} (${w.rule})`);
  for (const b of blocks) console.error(`  [BLOK] ${b.file}:${b.line} (${b.rule})`);

  const extInfo = `wzorce prywatne: ${pats.count || 0} (plik zewnetrzny: ${pats.loadedFrom ? 'tak' : 'nie'})`;
  if (blocks.length > 0) {
    console.error(`Straznik [${modeLabel}]: ${blocks.length} blokujacych znalezisk (${extInfo}; tresc ukryta).`);
    process.exit(1);
  }
  console.log(`Straznik [${modeLabel}]: CZYSTO (bloki: 0, ostrzezenia: ${warns.length}, ${extInfo}).`);
}
