# ReflexBrain v3 — Przestrzenny Żywy Biom i Predyktor Skutków Akcji

> **Status gałęzi:** izolowany okaz badawczy (`research/neon-living-biome-v3`, odbity od `main` @ `277d3d5`). **Nie scalono do `main`**; nie zmienia publicznego GitHub Pages (`S0`) ani archiwalnych tagów `archive/reflexbrain-2026-11-10/*`.
> **Granica dowodowa (`AGENTS.md`):** zielone testy automatyczne weryfikują wyłącznie to, co zmierzyły w symulacji. **Nie stanowią** kwalifikacji „Owner-life PASS” — ostateczna ocena jakości życia i estetyki z ręki należy wyłącznie do Ownera.

---

## 1. Falsyfikowalne pytanie badawcze

Czy w rozległym, strefowym biomie z odnawialną ekologią i ciągłą fizyką (`3200×2200`, gradient ryzyka i nagrody `Sanktuarium → Półmrok → Dzicz`, bez męczącej globalnej katastrofy) tani, lokalny, prywatny kontroler bez wiedzy o koordynatach, strefach, nazwach materiałów i tożsamości Gracza — używający jednolitej macierzy predykcji `bodziec × styl interakcji → [ΔE, ΔI, ΔS]` — potrafi:
1. Odkryć z czystej karty odmienne konsekwencje 5 losowo permutowanych materiałów (łagodne jedzenie, bogaty Rdzeń z Dziczy, krucha geoda wymagająca uderzenia, głaz-osłona, parzący minerał) oraz dowolnej nowo namalowanej materii spoza palety,
2. Pokonać uczciwe kontrole bez pamięci (w tym identyczną fizjologię ciała z zamrożonym uczeniem `learningRate = 0` oraz złośliwego `greedyChaser`) na niewidzianych podczas strojenia seedach (`9001..9010`),
3. Wykazać przyczynową użyteczność własnej pamięci w kontrfaktycznym rozwidleniu (`t = 1800 → 3600`)?

---

## 2. Co jest fizjologią / priorem projektu, a co jest uczone online

Zgodnie z rygorem `ReflexBrain-Lab` świadomie rozdzielamy te dwie warstwy bez udawania „czystej tabula rasa”:

| Warstwa | Co zawiera (jawnie zaprogramowane) | Czego NIE zna |
| --- | --- | --- |
| **Fizyka świata (`src/world/`)** | Biom `3200×2200`, strefy `Sanktuarium / Półmrok / Dzicz`, lokalne prądy anomalii tylko w Dziczy, cienie osłonowe za głazami/skałami, uniwersalna malowana materia (`spawnCustomMatter`), łagodne kolizje ciało-ciało (`0.00` obrażeń bez intencjonalnego Dasha/Taranu), równe statystyki Gracza (`+ playerGodMode`), uchwyt `E` (toggle w kierunku kursora) + rzut/dash `Spacja`, opcjonalne rozmnażanie z mutacją rozmiaru. | Nie wstrzykuje żadnych etykiet ani współrzędnych do `obs`. |
| **Wrodzona fizjologia i priory umysłu (`src/mind/predictor-mind.mjs`)** | Transformacja opozycji barwnej `(R-G, B-Y)` niezmiennicza na dystans; sensoryczny filtr ciemnych achromatycznych przeszkód (`isRockRay`, **zero importów z `config.mjs`**); odruch odskoku przy ostrym bólu (`dI < -0.025`, 13 ticków); ślizg po skałach i odblokowanie z zaklinowania; niezależny obrót spojrzenia (`gazeOffset`); pomocnicze cechy `solidVal` i `movingScore` bramkujące próby uderzenia (`worthTestingStrike`) i ulgi (`STAY_NEAR`); 6-gałęziowy wykonawca ruchu (`odskok / schronienie / cel / odpoczynek / PlaceGraph / zwiad`). | **Zero** importów stałych świata (`COLOR_ROCK` usunięty), zero wiedzy o chemii seeda, archetypach, strefach, pozycji `(x, y)` i tożsamości Gracza. |
| **Stan uczony online (`pred` i `PlaceGraph`)** | Dla każdego odkrytego klastra chromatycznego 3 czynne style (`delikatnie`, `uderz`, `blisko`) kontra stały punkt odniesienia `omijaj = 0`, aktualizujące oczekiwane `[ΔE, ΔI, ΔS, trials]` wyłącznie z własnej historii sensoryczno-motorycznej (przy `learningRate = 0` uczenie zamraża się w 100%: `max|dE| = 0`, `max|dI| = 0`, `places = 0`). Adaptacyjne łagodzenie starego strachu po długim czasie bez kary (`lastPainTick > 420`) umożliwia przeuczenie po odwróceniu chemii. Egocentryczna odometria z domknięciem pętli (`PlaceGraph`). | Nie posiada zaprogramowanych slotów „jedzenie / trucizna / geoda / wróg / przyjaciel”. |

---

## 3. Wyniki (Observed / Falsified / Unknown)

### A. Observed — Zweryfikowane własnymi uruchomieniami

#### 1. Główny zestaw naukowy (`node tests/eval-v3.mjs` — **15/15 PASS**)
- **Test 0 (Inwarianty, kolorymetria, mechaniki — 9/9 PASS):**
  - Separacja w przestrzeni opozycji barwnej `(R-G, B-Y)`: `minDist = 0.610` (`> 2×` promień klastra `0.26`) przy zachowaniu naturalnej, nie-neonowej palety; `isRockRay`: `truePos = true`, `falsePos = []` na wszystkich dystansach.
  - Szczelność `obs`: klucze `body,retina,touch`, `leaked = []`, `immutable = true`.
  - Delikatny kontakt vs celowy Dash: 40 ticków ocierania Gracza o Zwiadowcę = **`0.0000` obrażeń** (`50` łagodnych kontaktów); świadomy Dash `Spacją` = **`0.0900` obrażeń**.
  - Ergonomia Gracza: pojedyncze `E` łapie głaz i obraca go w stronę kursora (`northAng = -1.58 rad`), `Spacja` rzuca głazem i rozłupuje geodę na `3` odłamki; bez `godMode` anomalia Dziczy obniża integralność Gracza (`1.00 → 0.882`), z `godMode` pozostaje `1.00`.
  - Malowana materia spoza palety (`[0.95, 0.25, 0.72]`): ten sam nowy kolor pomalowany jako toksyna daje wyuczone `pred[delikatnie].dI = -0.719`, a jako jedzenie `pred[delikatnie].dE = +0.902`.
  - Emergentna relacja z Graczem (bez `if (isPlayer)`): Gracz-Pomocnik → `pred[blisko].dE = +0.307`; Gracz-Agresor → `min(dI) = -0.294`.
  - Rozmnażanie z callbackiem `onBirth` i wydajność: `7` narodzin (`pop = 14`), `1.265 ms/tick`.

- **Test A (16 seedów `101..356` × 3600 ticków, nieznana permutowana chemia, `allowReproduction: false`):**

| Kontroler | Viability | Jagody/ag | Rdzenie/ag | Geody (suma) | Oparzenia (1→2 poł.) | Śr. E | Śr. I | Odpocz.% | Strefy S/T/D | Pętle |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| `predictorMindV3` | **27.01** | 13.25 | 5.67 | 12.4 | 0.94 (0.59→0.35) | 0.81 | 0.96 | 6.5% | 28/45/27% | 13.6 |
| `blindBraitenberg` | -74.38 | 2.83 | 1.79 | 4.4 | 31.66 (12.9→18.8) | 0.32 | 0.78 | 0.0% | 24/54/21% | 0.0 |
| `randomWalk` | 6.01 | 3.37 | 0.74 | 2.5 | 0.76 (0.3→0.4) | 0.44 | 0.98 | 0.0% | 32/54/14% | 0.0 |
| `oracleReflex` *(nielegalna wyrocznia)* | 39.69 | 11.30 | 10.77 | 19.1 | 0.14 (0.1→0.1) | 0.74 | 0.99 | 0.0% | 18/41/41% | 0.0 |

  - Sparowane zwycięstwa: **`16/16`** vs `blindBraitenberg`, **`16/16`** vs `randomWalk`.

- **Test B (Kontrfaktyczny fork pamięci `t = 1800 → 3600`, 16 seedów, determinizm `16/16`):**

| Wariant po `t = 1800` | dScore | dJagody | dRdzenie | dOparzenia | dGeody | Wygrane `intact` |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| `intact` (własna pamięć) | **13.21** | 5.63 | 3.54 | 0.35 | 6.3 | — |
| `ablated` (amnezja w `t=1800`) | 9.35 | 4.50 | 2.80 | 0.72 | 3.9 | **13/16** |
| `transplant INNA chemia` | 8.73 | 2.45 | 3.17 | 0.51 | 3.1 | **14/16** |
| `transplant TA SAMA chemia` *(inny układ mapy)* | 13.01 | 5.99 | 3.31 | 0.36 | 6.0 | **8/16** *(brak przewagi!)* |

#### 2. Niezależny audyt przeciwniczy (`node tests/attack-v3.mjs` — 10 held-out seedów `9001..9010`, z rozmnażaniem)
- **Atak 1 (Ablacja uczenia na tej samej fizjologii ciała, 3000 ticków):**
  - `predictorMindV3 (lr=0.48)`: `Viab = +11.60 (±1.27)`, `Ber/1k = 2.70`, `Cor/1k = 0.98`, `Geo/1k = 0.25`, `Brn/1k = 0.31`, `Pop = 17.8`.
  - `lr=0` i `trueFrozenMind`: oba **identyczne co do znaku** `Viab = -15.09 (±18.22)`, `Ber/1k = 0.86`, `Cor/1k = 0.09`, `Geo/1k = 0.05`, `Brn/1k = 2.81`, `Pop = 8.9`, `max|dE| = 0.00`, `max|dI| = 0.00`, `places = 0.0`.
  - Sparowane wygrane `predictorMindV3` vs `trueFrozenMind` / `lr=0`: **`10/10` Viability (`+26.70`)**, **`10/10` Cores (`10.9×`)**, **`9/10` Geodes (`5×`)**, **`9/10` Burns (`9×` mniej)**.
- **Atak 2 (Bezpamięciowy przeciwnik `greedyChaser` z identycznym odskokiem bólowym i ślizgiem po skałach):**
  - `predictorMindV3 (+11.60)` vs `greedyChaser (-17.52)` → **`10/10` Viability (`+29.12`)**, **`10/10` Burns**, **`10/10` Cores**, **`10/10` Berries**, **`10/10` Geodes**, **`9/10` MeanI**.
- **Atak 3 (Odwrócenie chemii w połowie biegu `t = 1500` — stary parzący minerał staje się nową jagodą):**
  - Przed poprawką audytową: `32/32 (100%)` osobników z utrwalonym strachem pozostało sparaliżowanych do `t = 3600` (`dI: -0.505 → -0.503`).
  - Po wdrożeniu czasowego mięknięcia starego strachu (`lastPainTick`): **`18/31 (58.1%)`** osobników przełamało strach i wygasiło lęk (`dI: -0.444 → -0.149`), a zjedzone jagody nowego koloru wzrosły z `0.19` do `0.55 / agent` (wobec `3.90 / agent` po pełnej amnezji).
- **Atak 4 (Przecieki kontraktu i integralność bundla):**
  - `imports from world/config`: `NONE`; `lr=0 clamp bug`: `NO`; `biome.mjs obs seal`: `OK` (`noRefLeak=OK`); `ui/app.mjs isolation`: `OK`; `dist/reflexbrain-v3.html`: `221.0 KB`, `syntax=OK`, `mindHasWindow=CLEAN`, `rawImportExport=CLEAN`.

#### 3. Test uruchomieniowy UI / Canvas / 60Hz vs 144Hz (`node tests/smoke-v3.mjs` — **8/8 PASS**)
- Samodzielny plik `dist/reflexbrain-v3.html` uruchamia się z 0 wyjątkami; wszystkie 3 szuflady (`Władza`, `Kuźnia Materii`, `Rentgen Umysłu`) są domyślnie zwinięte; renderer wykonuje `6118` wywołań Canvas 2D na normalnym i bliskim zoomie LOD (`> 1.35`) bez błędów; akumulator `FIXED_DT = 1/60` daje dokładną parzystość **`60Hz → 60 ticków/s`** i **`144Hz → 60 ticków/s`**; wpisanie ręcznej wartości `42` w `Władzy` nie jest cicho przycinane; `Kuźnia Materii` maluje customową materię; ciało Gracza + `E` + `Tryb Architekta` oraz żywa tabela 4-akcyjnej macierzy predykcji działają poprawnie.

---

### B. Falsified — Co NIE zadziałało / zostało sfalsyfikowane

1. **Przewaga pamięci przestrzennej `PlaceGraph` nad samą pamięcią chemii — SFALSYFIKOWANA w obecnym kształcie:** w teście B porównanie `intact (13.21)` vs `transplant TA SAMA chemia, inny układ mapy (13.01)` dało **`8/16`** (remis statystyczny). Cała silna przewaga kontrfaktyczna pochodzi z **pamięci semantycznej materii** (`14/16` vs inna chemia, `13/16` vs amnezja), a nie z nawigacji do zapamiętanych współrzędnych `PlaceGraph`.
2. **Pełna plastyczność po nagłym odwróceniu chemii — CZĘŚCIOWA:** nawet po poprawce `13/31 (41.9%)` osobników nadal unikało przez 35 s dawnego parzącego koloru zamienionego w jagodę (realny kompromis między ochroną przed natychmiastowym zapominaniem bólu a szybkością przeuczania).
3. **Efektor `grip` dla stworzeń — NIEUŻYWANY:** fizyka ciągnięcia/noszenia głazów przez stworzenia istnieje w `biome.mjs`, ale `predictor-mind.mjs` ma na stałe `grip = false` (budowanie własnych osłon z głazów przez autonomiczne istoty nie zostało tu wykazane).

### C. Unknown — Co pozostaje otwarte

1. **Subiektywna ocena Ownera (wizualność, „czucie życia”, ergonomia w realnej przeglądarce):** testy DOM/Canvas były uruchomione w headless mocku w Node, nie w realnym Chrome/Edge przez człowieka.
2. **Długie horyzonty (`> 100 000` ticków) i otwarta ewolucja strategii:** w obecnym modelu dziedziczony jest wyłącznie parametr morfologiczny `sizeScale`, a nie architektura czy hiperparametry umysłu.
3. **Aktywne użycie narzędzi / przesuwanie głazów przez same istoty (`grip = true`)** wyuczone bez hardkodowanego skryptu.

---

## 4. Jak odtworzyć wyniki i uruchomić plik grywalny

Z katalogu `experiments/neon-living-biome-v3/` (wymagany wyłącznie Node.js ≥ 20, zero `npm install`):

```bash
# 1. Zbuduj samodzielny plik HTML (działa bezpośrednio z file:// po dwukliku)
node tools/build-html.mjs

# 2. Smoke test DOM / Canvas / 60Hz vs 144Hz / UI (ok. 6 s)
node tests/smoke-v3.mjs

# 3. Główny pakiet naukowy — Test 0, Test A (16 seedów), Test B (kontrfaktyczny fork, ok. 90 s)
node tests/eval-v3.mjs

# 4. Niezależny audyt przeciwniczy — 10 held-out seedów 9001..9010 (ok. 115 s)
node tests/attack-v3.mjs
```

Gotowy, samodzielny plik do otwarcia w dowolnej przeglądarce: `experiments/neon-living-biome-v3/dist/reflexbrain-v3.html`.

---

## 5. Atrybucja pracy agentów (proweniencja)
- **Silnik biomu, predyktor, kalibracja, integracja UI/bundlera, weryfikacja i dokumentacja:** Gemini Neon (`Gemini 4 Neon`).
- **Proceduralny fundament renderera 2D (teren z izobatami, fasetowany bazalt z porostami, 6 stylów materii, szkielet `spine` i oczy):** zaprojektowany wspólnie z workerem `Claude Opus 5.5` (przerwany limitem 429 podczas zapisu, dokończony i zintegrowany przez Gemini Neon).
- **Niezależny audyt przeciwniczy (`tests/attack-v3.mjs`):** osobny worker `audytor` (`Gemini 4 Neon`), który wykrył bug `lr=0`, import `COLOR_ROCK` i 100% paraliż po odwróceniu chemii (wszystkie trzy naprawione i ponownie zmierzone).
