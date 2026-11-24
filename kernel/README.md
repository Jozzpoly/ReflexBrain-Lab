# `kernel/` — opcjonalna aparatura laboratoryjna ReflexBrain

> **Zasada z Gloopipelago:** żywy świat i pytanie badawcze są pierwszorzędne. Ta aparatura jest wyłącznie lekkim narzędziem falsyfikacji i podglądu — **nie jest** architekturą mózgu, ontologią organizmu ani obowiązkową klatką dla kolejnych eksperymentów.

Jeśli Twój eksperyment jest pisany w czystym JavaScript/ESM (Node lub przeglądarka), możesz skorzystać z całości albo dowolnego pojedynczego pliku:

1. **[seam.mjs](seam.mjs)** — deterministyczny PRNG (`createRng`, rozróżnia `seed = 0` i `1`), audyt szczelności `obs` (`auditObservation`, `sealObservation` — bezpieczny dla `TypedArray`, `Map`, `Set` i cykli), kanoniczny skrót `stableDigest` (sortuje klucze, rozróżnia `NaN`/`Infinity`/`null`/`undefined`), obsługę 3 poziomów ablacji percepcji (`raw` / `tracklet` / `entity-oracle`) oraz metryki wolne od błędu demograficznego (`normalizeExposureMetrics`: `per1kAliveTicks` i `per100Exposures`).
2. **[fork-microscope.mjs](fork-microscope.mjs)** — gramatyka przyczynowa z `MEDIUM-D/R0`: `MARK → FORK → INTERVENE(warstwa) → RELEASE → RUN → COMPARE` z **5 działającymi warstwami autorytetu** (`MATERIAL`, `MOTOR_AUTHORITY`, `PRIVATE_RESEARCH_CUT`, `WORLD_REPLACEMENT`, `OCCUPANT_REPLACEMENT`), obsługą dynamicznych narodzin/śmierci aktorów oraz **trwałą Drabiną Pierwszego Rozjazdu O(1)** (`createDivergenceTracker` — nie traci pierwszego rozjazdu nawet po tysiącach ticków).
3. **[lens-ui.mjs](lens-ui.mjs)** — cichy, reużywalny mikroskop przeglądarkowy działający z `file://`: domyślny stan to `WATCH` (bez ciężkich digestów w tle), a w trybie `FORK` zachowuje proporcje 1:1 w obu widokach (`GHOST` i `SPLIT`) i pozwala wyeksportować kartę werdyktu Ownera.

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
