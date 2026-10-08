# Prywatne przewidywanie — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [x]`) syntax for tracking.

**Goal:** Sprawdzić wcześniejszą hipotezę na nowym obrazie, zanim nowe dane poprawią jej dopasowanie; przygotować decyzję o aktywnym zdobywaniu informacji.

**Architecture:** PrivateVision zachowuje osobny wynik jednokrokowej predykcji poprzedniej hipotezy. Obecne dopasowanie pozostaje warunkowe i nie steruje ciałem. Rozwój wielopoziomowego brainu wymaga później wykazania, że prywatna historia zmienia użyteczne działanie, a nie tylko ruch lub narrację.

**Tech Stack:** TypeScript, Vitest, Rapier 2D 0.20.0; istniejący runtime 120 Hz i retina 30 Hz.

**Spec:** docs/living-organism/CAMPAIGN_PRIVATE_MODEL.md

## Global Constraints
- Tylko PrivateFrame jako wejście percepcji; host XY, ID, rozmiary i interwencje wyłącznie w ocenie eksperymentu.
- Kompatybilność przewidywania nie oznacza prawdziwości, nieruchomości ani rozpoznania tożsamości.
- Nie zmieniać obecnej polityki motoru w tym etapie; nie deklarować uczenia.
- Własny układ odometryczny może dryfować; błąd nie identyfikuje automatycznie przyczyny.
- Zmiana kształtu checkpointu wymaga runtime version 4; brak obietnicy migracji R&D.

## Review Focus
- Nowa hipoteza nie może nadpisywać wyniku próby poprzedniej: test przesunięcia rzeczy poniżej istniejącego progu zerwania .35 rad.
- Powtórny odczyt tej samej próbki nie może liczyć się jako nowe potwierdzenie: test pełnej równości stanu.
- Gaze i heading nie mogą udawać ruchu rzeczy: próba obracania gaze przy nieruchomym obiekcie.
- Zniknięcie, wiele plam i clipping nie uprawniają do porównania jednej tożsamości: test braku porównywalnego pomiaru.
- Restore nie może gubić predykcji: istniejący test dokładnego forkowania stanu plus jawny test version 4.

## Krytyka kolejności i bramki dalszej kampanii
Model ruchomy z dodatkowymi parametrami może dopasować niemal wszystko. Najpierw oddzielamy przewidywanie od retrospektywnego fitu. Nawet przewidywanie może przejść dla aliasu: zachowujemy taki wynik zamiast dostrajać próg do jednego przykładu. Próg .08 rad jest roboczą tolerancją, nie skalibrowanym prawdopodobieństwem.

Następne etapy są warunkowe, nie automatyczne zobowiązania:
1. Zamrożona hipoteza i test na niewidzianych próbkach (ten plan).
2. Porównać zmianę kierunku translacji z dalszym ruchem po tej samej linii, na statycznych i ruchomych scenach. Host zadaje ruch w próbie, nie podpowiada percepcji jego sensu. Odrzucić tezę o rozstrzygalności, jeśli oba warianty nadal pasują.
3. Dopiero przy wykazanej różnicy wdrożyć lokalne pytanie i ograniczony wybór czynności informacyjnej. Mierzyć błąd przyszłego obrazu, koszt i niepowodzenia; porównać identyczne starty z fixed gaze oraz occupant. Nie zastępować celu pokryciem mapy.
4. Jeden epizod materialny z konsekwencją i przerwaniem/powrotem do czynności. Wybór epizodu zależy od dostępnej prywatnej informacji; pchanie do landmarku nie jest obligatoryjne.
5. Challenger uczony przewidujący obraz lub wybierający czynność: rozłączne sceny trening/test, identyczny sensory input, budżet pamięci/czasu, model reaktywny jako baseline. NN nie musi rozwiązywać każdego organu; LLM nie blokuje szybkiej pętli. Odrzucić komponent, który tylko opisuje zachowanie.
6. Obserwowalny warsztat i render QA przed Owner test; brak dostępu do renderu jawnie blokuje kwalifikację interfejsu, nie badania headless.

### Task 1: Predykcja wcześniejszej hipotezy i ciągłość runtime
**Files:** Modify src/living-organism/private-vision.ts, src/living-organism/runtime.ts; Test tests/living-organism/private-vision.test.ts, tests/living-organism/runtime.test.ts.
**Interfaces:** VisionState.prediction przechowuje sourceTick, evaluatedTick, predictedBearing, observedBearing, angularError oraz status compatible/inconsistent/unavailable. Brak wcześniejszej hipotezy daje null. Bearing liczony w prywatnym układzie kierunkowym, po integracji ruchu i przed nowym fitem. Unavailable nie ma błędu ani observedBearing; predictedBearing pozostaje dostępne.
- [x] Dodać testy nowego kontraktu i obejrzeć RED: undefined prediction/version 3.
- [x] Wdrożyć sprawdzanie poprzedniego estimate przed refitem, z tolerancją .08 rad i pojedynczą nieuciętą plamą; zachować źródłowy tick.
- [x] Zmienić checkpoint runtime na 4; fork dokładnie zachowuje cały stan.
- [x] Uruchomić npm test -- tests/living-organism/private-vision.test.ts tests/living-organism/runtime.test.ts; oczekiwane PASS.

### Task 2: Kontrprzykład i plan następnej interwencji
**Files:** Create probes/living-organism-prediction.ts, evidence/living-organism/private-prediction.json; Modify docs/living-organism/CURRENT.md.
**Interfaces:** Pobiera capture().prediction oraz estimate; host range tylko w osobnej kolumnie oceny.
- [x] W trzech rzeczywistych scenach static-near/static-far/moving-alias policzyć zgodne i sprzeczne przewidywania, błędy oraz faktyczną odległość. Nie zmieniać tolerancji po wyniku.
- [x] Sprawdzić także zamrożony fit z tick 60 na późniejszych próbkach, bez aktualizacji jego XY. Rozróżnić od jednokrokowego refitu.
- [x] Uruchomić npm run check; oczekiwane wszystkie testy, typy i build PASS.
- [x] Zapisać wyniki i ograniczenia, przejrzeć diff oraz utrwalić research checkpoint. Nie merge ani publikacja frontdoor.

## Samokontrola planu
Zakres implementacji to dwa zadania powyżej. Dalsze sześć bramek wyznacza kierunek kampanii, nie udaje gotowej specyfikacji NN lub zachowania. Testy obejmują wszystkie pięć klas Review Focus. Nie dopisujemy confidence ani automatycznej diagnozy ruchu obiektu. Kryterium wartości przyszłego etapu: informacja zmienia ważne działanie w porównaniu z kontrolą; sama liczba zgodnych predykcji nie wystarcza.

## Wynik wykonania i korekta następnego kroku
Task 1: RED 4 nowych testów, potem GREEN 14/14 testów modułu i runtime. Pełny check: 33 pliki, 83 testy, typy i build PASS. Checkpoint v4.
Task 2: wykonano 4 sceny, 30 nowych próbek każdej. Po tick 60 zmieniono oś siły; osobno oceniano jednokrokowo aktualizowany model i nieruchomy fit zamrożony na tick 60. Każda scena miała 23 kompatybilne predykcje, 0 sprzecznych. Pozostałe próbki nie miały wcześniejszej hipotezy, więc nie są sukcesami ani porażkami. Zamrożone błędy maksymalne wyniosły .0356/.0254/.0561/.0219 rad. Najgorsza odległość: host 4.200, hipoteza 8.125. Także walidacja poza fitem nie daje tu prawdy o dystansie.

Nie wykazano, że krótka zmiana osi rozstrzyga ruch rzeczy. Nie obniżamy progu .08 po wyniku. Wariant observer-correlated jest celowym adwersarzem; nie stanowi modelu typowego autonomicznego ruchu. Retiny scale-alias i static-far nie były dokładnie identyczne: aktualizacja hosta po kroku pozostawia różnicę fazy względem cached frame. Równość jest mierzona i zapisana jako false. Przechowywane hashe próbek służą odtwarzalności, nie interpretacji obrazu.

**Ważniejsza korekta:** nie można uzależniać całego organizmu od rozwiązania dokładnej głębokości monokularnej. Następny etap ograniczamy do decyzji jakościowej: czy kontynuować bezpieczne zbliżenie, zatrzymać je czy sprawdzić kontakt. Prywatny dotyk i zmiana rozmiaru plamy mogą zmienić działanie nawet bez znanej liczby metrów. Hipotezy nie mogą przechodzić w pewność; niepewność nie musi też oznaczać bezczynności.

### Przygotowany protokół kolejnego etapu (do zamknięcia specyfikacji przed kodem)
- Pytanie: czy użycie prywatnej historii pozwala wcześniej przerwać nieudane zbliżenie lub kontynuować udane, w porównaniu z samym bieżącym obrazem?
- Sześć rodzin scen: nieruchoma rzecz, stała prędkość poprzeczna, oddalanie, zasłonięcie, podobny fragment oraz skorelowany alias jako granica. Oddzielić przypisany ruch świata od sztucznego powiązania z ciałem.
- Trzy parowane starty orientacji; te same sceny i sensory input dla polityki reaktywnej oraz polityki z historią. Każdy epizod 10 s; koniec epizodu to ograniczenie pomiaru, nie kasowanie pamięci organizmu w docelowym runtime.
- Wynik: dotarcie do kontaktu, czas, energia sterowania, niepotrzebne zderzenia i zwłoka po utracie sensu zbliżenia. Nie premiować samej liczby komend ani komórek mapy.
- Dokładna definicja sensu czynności musi być jawnie authored; nie ogłaszać jej samoistnym celem organizmu. Jeden epizod nie określa całego przyszłego brainu.
- Challenger uczony: predykcja następnego bearing/visibility z ostatnich prywatnych próbek i ruchu, bez host range jako label. Rozłączyć całe sceny i trajektorie train/test, nie losowe sąsiednie klatki. Porównać z ostatnim bearing oraz istniejącą geometrią, z kosztem pamięci i inferencji. Jeśli nie poprawia istotnej decyzji, nie włączać go tylko dlatego, że jest NN.
- Bramką do testu Przemka jest działający, obserwowalny warsztat; headless wynik nie kwalifikuje jakości doświadczenia.

## Przegląd i domknięcie tego etapu
Niezależny reviewer nie znalazł konkretnego błędu Critical/Important w implementacji. Wskazał lukę: dotychczasowy test restore mógł porównywać puste prediction. Dodano test z rzeczywiście niepustą predykcją, restore i kolejnymi obserwacjami; końcowy pełny check 83/83 PASS. To uzupełnienie dowodu, nie naprawa zaobserwowanego błędu kopiowania. Brak kwalifikacji renderu nadal jawny.
