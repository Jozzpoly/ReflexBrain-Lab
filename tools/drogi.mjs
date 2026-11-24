// tools/drogi.mjs — sprawdza osiagalnosc dokumentow od drzwi, martwe odnosniki, obce sciezki, sasiadow i dryf DROGI.md.
// Adaptacja wzorca z Jaskini dla ReflexBrain Lab (Node >= 20, zero zaleznosci).

import { readFileSync, readdirSync, statSync, writeFileSync, existsSync } from 'node:fs';
import { join, dirname, relative, resolve, sep } from 'node:path';
import { pathToFileURL } from 'node:url';

const DRZWI = ['README.md', 'AGENTS.md'];
const POMIJANE = new Set(['.git', 'node_modules', 'dist', '.wrangler']);
const ODNOSNIK = /\[[^\]]*\]\(\s*([^)\s]+?)\s*(?:"[^"]*")?\)/g;

const ukosniki = (p) => p.split(sep).join('/');

function usunBlokiKodu(tresc) {
  return tresc
    .replace(/```[\s\S]*?```/g, '')
    .replace(/`[^`\n]+`/g, '');
}

function zbierzDokumenty(root, dir = root, acc = []) {
  for (const wpis of readdirSync(dir, { withFileTypes: true })) {
    if (POMIJANE.has(wpis.name)) continue;
    const pelna = join(dir, wpis.name);
    if (wpis.isDirectory()) zbierzDokumenty(root, pelna, acc);
    else if (wpis.name.toLowerCase().endsWith('.md')) acc.push(ukosniki(relative(root, pelna)));
  }
  return acc;
}

function istnieje(root, sciezka) {
  try { statSync(join(root, sciezka)); return true; } catch { return false; }
}

function jestKatalogiem(root, sciezka) {
  try { return statSync(join(root, sciezka)).isDirectory(); } catch { return false; }
}

function znajdzOdnosniki(root, dokument) {
  const tresc = usunBlokiKodu(readFileSync(join(root, dokument), 'utf8'));
  const out = [];
  for (const m of tresc.matchAll(ODNOSNIK)) {
    const surowy = m[1];
    if (/^(https?:|mailto:|#|data:)/i.test(surowy)) continue;
    const bezKotwicy = surowy.split('#')[0];
    if (!bezKotwicy) continue;
    out.push({ surowy, cel: ukosniki(relative(root, resolve(root, dirname(dokument), bezKotwicy))) });
  }
  return out;
}

export function sprawdzDrogi(root) {
  const wszystkie = zbierzDokumenty(root).sort();
  const zbior = new Set(wszystkie);
  const graf = new Map();
  const martwe = [];
  const obce = [];

  for (const d of wszystkie) {
    const dalej = new Set();
    for (const { surowy, cel } of znajdzOdnosniki(root, d)) {
      if (cel.startsWith('..')) {
        obce.push({ d, surowy, powod: 'sciezka wychodzaca poza repozytorium (podaj pelny adres URL)' });
        continue;
      }
      if (!istnieje(root, cel)) {
        const pierwszySegment = cel.split('/')[0];
        const maTakiKatalog = pierwszySegment && istnieje(root, pierwszySegment);
        const wygladaNaObce = /\.md$/i.test(cel) && cel.includes('/') && !maTakiKatalog;
        (wygladaNaObce ? obce : martwe).push({
          d,
          surowy,
          powod: wygladaNaObce ? 'dokument spoza repo podany jak sciezka lokalna' : 'nie ma takiego pliku',
        });
        continue;
      }
      if (jestKatalogiem(root, cel)) continue;
      if (zbior.has(cel)) dalej.add(cel);
    }
    graf.set(d, dalej);
  }

  const drzwi = DRZWI.filter((d) => zbior.has(d));
  const widziane = new Set(drzwi);
  const kolejka = [...drzwi];
  while (kolejka.length) {
    for (const cel of graf.get(kolejka.shift()) ?? []) {
      if (!widziane.has(cel)) {
        widziane.add(cel);
        kolejka.push(cel);
      }
    }
  }
  const sieroty = wszystkie.filter((d) => !widziane.has(d));

  let sasiedzi = [];
  const statePath = join(root, 'lab', 'state.json');
  if (existsSync(statePath)) {
    const state = JSON.parse(readFileSync(statePath, 'utf8'));
    sasiedzi = Array.isArray(state.neighbors) ? state.neighbors : [];
  }
  const trescDrzwi = drzwi.map((d) => readFileSync(join(root, d), 'utf8')).join('\n');
  const brakSasiadow = sasiedzi.filter((s) => !trescDrzwi.includes(s.url));

  const procent = wszystkie.length ? Math.round((widziane.size / wszystkie.length) * 100) : 100;
  const bledy = sieroty.length + martwe.length + obce.length + brakSasiadow.length;
  return { wszystkie, widziane: [...widziane], sieroty, martwe, obce, brakSasiadow, procent, bledy };
}

export function renderujRaportDrog(res) {
  const linie = [];
  for (const s of res.sieroty) linie.push(`- sierota · \`${s}\` · nie prowadzi do niego żaden odnośnik od drzwi`);
  for (const m of res.martwe) linie.push(`- martwy · \`${m.d}\` → \`${m.surowy}\` · ${m.powod}`);
  for (const o of res.obce) linie.push(`- obca ścieżka · \`${o.d}\` → \`${o.surowy}\` · ${o.powod}`);
  for (const s of res.brakSasiadow) linie.push(`- sąsiad · drzwi nie podają adresu: ${s.name} (${s.url})`);
  return (
    `<!-- generowane przez tools/drogi.mjs, nie poprawiaj ręcznie -->\n` +
    `# Drogi\n\n` +
    `${res.procent}% dokumentów (${res.widziane.length} z ${res.wszystkie.length}) jest osiągalnych od drzwi (\`README.md\`, \`AGENTS.md\`).\n\n` +
    (linie.length ? linie.join('\n') + '\n' : 'Nic nie leży w pustce — wszystkie odnośniki prowadzą dokądś i sąsiedzi ekosystemu są podani na drzwiach.\n')
  );
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const args = process.argv.slice(2);
  const rootArg = args[0] && !args[0].startsWith('--') ? args[0] : '.';
  const root = resolve(rootArg);

  const ri = args.indexOf('--raport');
  const ci = args.indexOf('--check-raport');
  const raportRel = ri >= 0 ? args[ri + 1] : null;
  const checkRel = ci >= 0 ? args[ci + 1] : null;

  // Jesli zapisujemy --raport i plik jeszcze nie istnieje, tworzymy go przed finalnym sprawdzeniem
  if (raportRel) {
    const pre = sprawdzDrogi(root);
    writeFileSync(join(root, raportRel), renderujRaportDrog(pre), 'utf8');
  }

  const res = sprawdzDrogi(root);
  if (raportRel) {
    writeFileSync(join(root, raportRel), renderujRaportDrog(res), 'utf8');
  }

  console.log(`Drogi: ${res.widziane.length} z ${res.wszystkie.length} dokumentow osiagalnych od drzwi (${res.procent}%).`);
  for (const s of res.sieroty) console.log(`  sierota · ${s}`);
  for (const m of res.martwe) console.log(`  martwy · ${m.d} -> ${m.surowy} (${m.powod})`);
  for (const o of res.obce) console.log(`  obca sciezka · ${o.d} -> ${o.surowy} (${o.powod})`);
  for (const s of res.brakSasiadow) console.log(`  sasiad · brak na drzwiach: ${s.name} (${s.url})`);

  if (checkRel) {
    const checkPath = join(root, checkRel);
    if (!existsSync(checkPath)) {
      console.error(`Drogi: brak raportu ${checkRel} (uruchom npm run drogi).`);
      process.exit(1);
    }
    const actual = readFileSync(checkPath, 'utf8').replace(/\r\n/g, '\n');
    const expected = renderujRaportDrog(res).replace(/\r\n/g, '\n');
    if (actual !== expected) {
      console.error(`Drogi: DRYF — ${checkRel} jest nieaktualny! Uruchom npm run drogi.`);
      process.exit(1);
    }
  }

  if (res.bledy > 0) {
    console.error(`Drogi: wykryto ${res.bledy} problemow.`);
    process.exit(1);
  }
  console.log(`Drogi: OK (0 sierot, 0 martwych odnosnikow, sasiedzi obecni${checkRel ? `, ${checkRel}=SYNC` : ''}).`);
}
