# ReflexBrain Lab — protokół wejścia dla każdego agenta

Ten plik działa niezależnie od modelu, dostawcy i pamięci poprzednich rozmów (Opus, Fable, Argon, Neon, Browser GPT, Codex). **Nie wymagaj od Właściciela odtwarzania historii projektu.**

## 1. Wejście na zimno (4 kroki przed pierwszą edycją)

1. Przeczytaj [README.md](README.md) i [WIEDZA.md](WIEDZA.md) — albo uruchom `npm run brief` (zawiera pełny skrót linii, werdyktów Właściciela, kanonu negatywnego i napięć).
2. Zweryfikuj żywy stan Git (`git status`, `git branch -a`, aktualne SHA) — **żywy Git i uruchomiony kod zawsze wygrywają ze starszą prozą**.
3. Przejrzyj w [WIEDZA.md](WIEDZA.md) sekcje **Kanon wyników negatywnych** i **Twarde blokady (`doNotRepeat`)**. Aby otworzyć historyczną linię oznaczoną jako `archive-tag` (lub dowolny ze 100 archiwalnych tagów), wykonaj wcześniej `git fetch --tags`, a następnie użyj `git worktree` lub `git show <SHA>:<ścieżka>` — nie zgaduj z pamięci.
4. Jeśli pracujesz w powłoce, ustaw jednorazowo hak strażnika: `git config core.hooksPath .githooks`.

## 2. Drabina dowodowa (nie mieszaj pięter!)

Każde twierdzenie oznaczaj jawnie jednym z 5 poziomów zdefiniowanych kanonicznie w [WIEDZA.md](WIEDZA.md) (`KOD`, `TEST`, `SWIAT`, `OWNER`, `HIPOTEZA`). **Żadne zielone CI nie nadpisuje bezpośredniego werdyktu `OWNER` z ręki.**

Nie deklaruj FPS, czasu rolloutów, emergencji ani przewagi pamięci bez powtarzalnego pomiaru i uczciwych kontroli (bezpamięciowej, zamrożonego uczenia, przetasowanej historii, kontroli koincydencji `yoked`, rozdzielonych seedów `held-out`).

## 3. Jeden fakt = jeden właściciel i niska ceremonia

- **Strefa swobodnych prób ([proby/](proby/README.md)):** tu wolno eksperymentować dziko i szybko bez biurokracji. Próba nie staje się fundamentem z automatu.
- **Opcjonalna aparatura ([kernel/](kernel/README.md)):** możesz wpiąć swój świat i organ pod `seam.mjs`, `fork-microscope.mjs` i `lens-ui.mjs`, żeby od ręki dostać strażnika przecieków `obs`, gramatykę `MARK → FORK → INTERVENE → RELEASE → RUN → COMPARE` i klikalny podgląd HTML. Jeśli Twój eksperyment wymaga innego języka lub silnika (np. Rapier/TS, Python), **nie musisz** używać `kernel/` — obowiązuje Cię tylko ten sam rygor dowodowy.
- **Awans wyniku (pozytywnego lub negatywnego):** dopisujesz pojedynczy, zwięzły wpis do [lab/state.json](lab/state.json), regenerujesz wszystkie widoki jednym poleceniem (`npm run render`) i weryfikujesz całość (`npm run check:all`). **Nie edytuj ręcznie `WIEDZA.md`, `DROGI.md` ani `proby/*/dist/*.html`** — wszystkie trzy mają automatyczną bramkę dryfu.
- **Nie używaj jednego PR** jednocześnie jako eksperymentu, dziennika, testu CI i kandydata do scalenia (lekcja `N14`).

## 4. Granica publiczne / prywatne i ochrona historii

- To repozytorium jest **publiczne**. Nigdy nie umieszczaj tu sekretów, tokenów, lokalnych ścieżek dyskowych, prywatnych rozmów ani nazw prywatnych repozytoriów Właściciela. Przed commitem działa `node tools/straznik.mjs --staged` (`.githooks/pre-commit`), a `npm run check:all` skanuje całe bieżące drzewo robocze (`--working`).
- **Uwaga o cudzysłowach:** `tools/straznik.mjs` wyświetla ostrzeżenie dla polskich cudzysłowów drukarskich, ponieważ w ekosystemie Właściciela często oznaczają wklejony cytat z prywatnej rozmowy; w publicznej dokumentacji technicznej używaj zwykłych znaków albo backticków.
- **Nie usuwaj** 100 archiwalnych tagów `archive/reflexbrain-2026-11-10/*`, katalogu `archive/` ani historycznych gałęzi bez wyraźnej decyzji Właściciela.
- **Nie modyfikuj `main`** ani publicznego GitHub Pages bez akceptacji Właściciela. Pracuj na własnej, jasno nazwanej gałęzi badawczej.

## 5. Jak oddać działający okaz Właścicielowi

Właściciel ocenia żywe zjawiska **z ręki w przeglądarce**, nie przez grzebanie w logach CI ani ręczne budowanie w terminalu:
- Preferuj samodzielny plik HTML działający z `file://` po dwukliku (z domyślnym trybem `WATCH`, bez ściany suwaków zasłaniającej świat).
- Gotowy, sprawdzony przez Ciebie okaz (z działającym publicznym adresem HTTPS) możesz zgłosić na pasek **Do obejrzenia** w [Jaskini](https://github.com/Jozzpoly/Jaskinia) zgodnie z jej publicznym sitem zgłoszeń (przez PR, po sprawdzeniu, czy podobne już nie było).
- Dla historycznego warsztatu R8 nadal działają instrukcje `git worktree` opisane w [BADANIA.md](BADANIA.md) i [archive/CLEANUP_2026-11-10.md](archive/CLEANUP_2026-11-10.md).
