# `kernel/` — opcjonalna aparatura laboratoryjna ReflexBrain

> **Zasada z Gloopipelago:** żywy świat i pytanie badawcze są pierwszorzędne. Ta aparatura jest wyłącznie lekkim narzędziem falsyfikacji i podglądu — **nie jest** architekturą mózgu, ontologią organizmu ani obowiązkową klatką dla kolejnych eksperymentów.

Jeśli Twój eksperyment jest pisany w czystym JavaScript/ESM (Node lub przeglądarka), możesz skorzystać z całości albo dowolnego pojedynczego pliku:

1. **[seam.mjs](seam.mjs)** — deterministyczny PRNG (`createRng`), audyt szczelności `obs` (`auditObservation`, `sealObservation`), kanoniczny skrót `stableDigest`, **sonda ciągłości sygnału `sweepSensoryGradient`** (szczepionka przeciw `N10` / błędowi interpolacji nieba z V3), 3 tryby ablacji percepcji (`raw` / `tracklet` / `entity-oracle`) oraz metryki `normalizeExposureMetrics`.
2. **[fork-microscope.mjs](fork-microscope.mjs)** — gramatyka przyczynowa z `MEDIUM-D/R0`: `MARK → FORK → INTERVENE(warstwa) → RELEASE → RUN → COMPARE` z 5 działającymi warstwami autorytetu, obsługą dynamicznych aktorów, migawką `lastStep` O(1) dla podglądu zmysłów oraz trwałą Drabiną Pierwszego Rozjazdu O(1) (`createDivergenceTracker`).
3. **[harness.mjs](harness.mjs)** — runner kampanii wieloseedowych (`runCampaign` z twardym zakazem pokrywania `devSeeds` i `heldOutSeeds`), bramka pre-fork `advanceUntilForkOpportunity` (przeciw `N9` / R13) oraz dwuwarstwowy test **`runDivergenceAndReconvergence`** (rozjazd po cięciu pamięci + zbieżność do tej samej sprawy po fizycznym wytrąceniu przeciw iluzji efektu motyla).
4. **[lens-ui.mjs](lens-ui.mjs)** — cichy, ostry (HiDPI), reużywalny mikroskop przeglądarkowy działający z `file://`: domyślny `WATCH`, 1-klik `FORK teraz (F)`, `+1 tick` przy pauzie, proporcje 1:1 w `GHOST` i `SPLIT`, opcjonalna szuflada **`Oko i wnętrze (I)`** (lustro A vs B z linią różnicy `|A − B|`) oraz eksport `.verdict.json`.

## Jawny kontrakt (dwa poziomy, zero ukrytych wymagań)

### Poziom 1 — Kontrakt headless (`seam.mjs` + `fork-microscope.mjs`)
- **Świat (`world`):** `snapshot()`, `restore(snap)`, `observe(actorId, perceptionMode)`, `step(actions, externalInput)`, opcjonalnie `digest()` i `getActorIds()`.
- **Organ (`mind`):** `snapshot()`, `restore(snap)`, `reset()`, `step(obs)` → `{ action, appraisal?, prediction? }`, opcjonalnie `digest()`.
- **Szybkie przebiegi wieloseedowe:** wywołuj `stepBranch(branch, input, { recordTrace: false, auditSeam: false })` po wczesnym przejściu testu szczelności `auditObservation` — unikasz narzutu `deepFreeze` i digestów w pętli treningowej.

### Poziom 2 — Dodatkowy kontrakt opcjonalnego UI (`lens-ui.mjs`)
Jeśli chcesz wpiąć świat do przeglądarkowego mikroskopu `mountMicroscope(...)`, świat powinien dodatkowo udostępniać:
- `width`, `height` (rozmiar logiczny sceny; `lens-ui` automatycznie dopasowuje proporcje 1:1 w `GHOST` i `SPLIT`),
- `render(ctx, view)` (`view = { x, y, w, h, tint, ghost, overlay?, label }`),
- opcjonalnie `pickMovable(wx, wy)` i `moveMovable(id, wx, wy)` dla interwencji `MATERIAL` myszą,
- opcjonalny parametr `mapKeysToAction(keys)` i `materialHint` w `mountMicroscope(...)` dopasowany do akcji Twojego organizmu (domyślnie `{ thrust, turn }`).

## Działający przykład weryfikujący aparaturę

Zobacz [P00 — kalibrator mikroskopu](../proby/00-kalibrator-mikroskopu/README.md) (wyłącznie test aparatury, bez twierdzenia badawczego o AI).
