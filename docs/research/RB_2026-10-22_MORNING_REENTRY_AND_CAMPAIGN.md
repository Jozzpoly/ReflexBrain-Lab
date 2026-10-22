# ReflexBrain — START DNIA / odzyskanie całej kampanii · 22.10.2026

> **Rola tego dokumentu:** decyzja badawcza po ponownym czytaniu i podważeniu pracy z 21–22 października; dotyczy wyłącznie gałęzi R6 (PR #87) jako punkt wejścia, **nie** jest nowym finalnym GDD ani automatyczną modyfikacją kierunku innych gałęzi. Świeży live GitHub na początku tej analizy: PR #84 `5d8ca8f`, #86 `29d4506`, #87 `75b910f`, wszystkie draft, bez merge; `main` `75b9572`. Ponownie sprawdź HEAD przed kolejnym commitem.

## Osąd w pięć zdań
1. Mamy **trwały fizyczny czas i checkpoint** (LIFE/L1), ale 2h symulowanego czasu przyspieszonego ≠ 2h autonomicznej biografii lub istnienia działającego przez noc.
2. R0–R5a w PR #86 dały krytyczne negatywne wyniki: równe trajektorie przy różnej materii, ucieczkę w pustkę, martwy obieg materiałowy oraz brak użycia zaprojektowanej pamięci. To nie były wyłącznie „złe algorytmy”; pytanie i jednostka eksperymentu były zbyt ubogie, a kryteria źle reprezentowały cel Ownera.
3. R6/O0–O2 w PR #87 jest dobrym **materiałem donorowym do badania organizacji struktury**: wariant Orbium ginie przy określonej lokalnej ingerencji, ilość masy nie wyznacza trwałości przestrzennej struktury, a transport może zachowywać masę i radykalnie zmieniać układ. Nie ma w tym jeszcze wiarygodnej jednostkowej pamięci, własnego zainteresowania, relacji ekologicznej ani świadomości.
4. O1 zawierał najbardziej wymowny błąd dnia: `total` zostało nadpisane pojemnością pierścienia. Log t500 istniał mimo braku 500 fizycznych aktualizacji. Po naprawie obie zbadane **wewnętrzne** ingerencje neutralne masowo prowadzą do zaniku; relokacja pierścieniowa NIE „przetrwała”. Nadal ważne zabezpieczenie: `executed_updates==500`, bezpośrednia zmiana siatki przy zadanych tickach, pełne CI na R6 `75b910f`.
5. Sama poprawa dyscypliny badań nie wystarcza; projekt powinien odzyskać **jednocześnie** długoterminowy, organiczny Owner intent i pierwotne pytanie ReflexBrain o actor-relative znaczenie prywatnej historii, zanim powstanie następny stos małych technicznych mini-fixtures.

## Jak doszliśmy tutaj — bez spłaszczania wczoraj do końcowego checkpointu
- Poprzednie Proto-Life/Persistent Playground i wątki R0–R3 próbowały odzyskać aktora działającego we własnej rzeczywistości. Zbyt proste stanowiska, małe klatki i programowe cyan following dały działania, ale bez wiarygodnej organiczności.
- O-DEV, ACT/P0 i LIFE/L0 pokazały niedostatki sensomotoryki; „nauka” mogła przegrywać z tanim forward/baseline, a długi run zapętlał te same nawyki.
- LIFE/L1 rozwiązał wąski, ale istotny problem: jedno ciało/świat/lekka pamięć przechodzi przez save, nowy proces i Chrome bez fałszywego przypisywania sprawstwa Ownerowi. Mimo to druga godzina symulacji niemal nic nowego nie wytworzyła.
- L2 R0–R2 przybliżył **prawdziwe materialne konsekwencje**, lecz fizyczne przesunięcie jednego dysku i brama nie prowadziły do dalszego życia. R3 (legalna prywatna siatkówka) odpłynął. R4a (16 obiektów i napęd) miał przez ostatnie 90s całkowity brak widoku materii. R5a (autorska pamięć miejsca ostatniego wzroku) widział bodźce, ale jego stan „re-entry” nie wystąpił ANI RAZU. Zero prawdziwej późnej relacji mimo różnych typów stymulacji.
- R6 zmienił skalę z gotowego ciała na emergentną materię. Rozwiązania autorów Lenia są realne, ale O0/O1 to nasz niezależny NumPy z oryginalnym seed/równaniem, **nie** frame-to-frame uruchomiony oryginalny notebook; O2 to **tylko** jedna warstwa oryginalnego Flow-Lenia, nie całe badania Planteca. Cohort 555 to retrospektywny audyt **wybranych** wytrenowanych wzorców autorów.
- Audyt końca dnia odkrył błąd kłamliwego czasu, powtórzył uruchomienie, zostawił pierwotny artefakt i poprawił dokumentację. Nie nazywać żadnego z tych działań „organizmem PASS”.

## Rozbieżność pomiędzy światem badań a projektem
Dawny [Pre-O0 Project Boundary](https://github.com/Jozzpoly/ReflexBrain-Lab/blob/research/pre-o0-foundations-campaign/docs/PRE_O0_PROJECT_BOUNDARY_EXIT_CONDITION_2026-10-06.md) formułował trwałe pierwotne pytanie: **czy tani lokalny uczący się organ może z prywatnego, czasowego doświadczenia wydobyć przydatne dla konkretnego aktora znaczenie i poprawić już działający Local Brain — bez roli world oracle, totalnej pamięci, planera lub pełnego kontrolera ruchu?**
Nowsza Owner wizja (21.10) istotnie **poszerzyła**, nie unieważniła badań: nie interesuje go najlepszy optymalizator na małym zadaniu, lecz organizm i świat żyjące przez godziny, dni i dłużej, pełne organicznych skutków, wzajemnych ograniczeń, osobniczych zwyczajów, dobrych i złych przemian, nieoczywistej historii.

Tych dwóch pytań NIE spina po prostu diagram API. Potrzebna jest wspólna presja:
- `A` **samodzielne utrzymywanie się/zmiana organizacji**: co tworzy realną trwałość granicy/aktywności bez centralnie podawanej „duszy”, celu czy optymalnego algorytmu?
- `B` **osobnicze znaczenie zdarzeń**: jak ta sama legalna obserwacja staje się inaczej istotna wobec *różnych rzeczywiście przeżytych historii i zobowiązań*, a nie tylko różnego ID, timeru lub współrzędnej?
- `C` **świat dostarczający niezależnych przyszłych możliwości**: co powraca/zanika/przemienia się bez rąk eksperymentatora i jak osobnik swoją działalnością trwale wpływa na późniejsze otoczenie?

Nie potrzebujemy kompletnego biologicznego organizmu przed pierwszą kwalifikacją B. Gdy pojawi się naturalny H7/H8/H9 z dawnego exit-condition, należy **wcześnie** shadow-testować semantyczny ReflexBrain zamiast budować perfekcyjny host bez końca. Również nie wymuszaj H7–H9 sztucznym zadaniem, bo przestanie być dobrą presją.

## Brakującą własność warto nazwać, nie zastępować licznikiem
Proponowana *robocza* kategoria: **powracająca przyczynowa zależność życia od własnej przeszłości**. Nie jest to uniwersalna definicja życia ani pojedynczy score.
W dobrym rzeczywistym teście (1) świat ma własne różne trajektorie, (2) życie/aktywność jednostki może zmienić jego późniejsze możliwości, (3) ukształtowana w ten sposób prywatna historia zmienia co najmniej jedną przyszłą rzeczywistą reakcję, (4) bez pamięci/organizacji różnica zanika lub ma inny charakter, a (5) Owner może fizycznie przeprowadzać inne niż przewidziane scenariusze. Statyczny atrakcyjny ruch czy 500 green ticks to nie dowód żadnego z punktów.

**Krytyczne pytanie:** czy chcemy to jako *pełne jednoczesne wymagania na pierwszą próbę*? NIE. Byłaby to kolejna niemożliwa do domknięcia checklista. Traktować jako mapę luk, stopniowo zbierać source evidence, podważać raz po raz.

## Donor O2 / sensorimotor — tania bramka zamknięta, ale nie absolutny brak danych
Sprawdzone oryginalne [Zenodo 10211741](https://zenodo.org/records/10211741) w Opera: **jeden ZIP 225.5 MB**, wersja **v1.0.1 / 2023**, odpowiada archiwum GitHub `flowersteam/sensorimotor-lenia-search@v1.0.1` (commit `e81c9a6`). Kompletny pinned git tree dla tagu (1240 entries) został sprawdzony; nie zidentyfikowano checkpointów `seed0_crea00107` i `seed0_crea00147` (są m.in. `reached_goal.npy`, `target_goal.npy`, filmy i oceny). Publikacja mówi o udostępnionych wynikowych parametrach, więc możliwe są inne nośniki/formy, ale to **niezidentyfikowane**, a nie „z pewnością niedostępne”. TANI FEASIBILITY STOP: nie pobierać 225MB tylko po to, by powtórzyć już przejrzane repo lub szukać pozornych reprezentacji; nie uruchamiać od zera IMGEP/treningu. Wrócić tylko, gdy konkretny checkpoint/ścieżka zmieni tę ocenę.

## Dzisiaj — jedna aktywna kampania, inne rzeczy jako donorzy
**Kampania: od martwej demonstracji do prawdziwie trwałej sytuacji, która wytwarza znaczenie.** Najpierw przestudiować i porównać istniejące, wiarygodnie fizyczne środowiska/donorów, nie tworzyć nowej technicznej platformy.
1. **Odzyskanie fizycznego Owner experience:** ocena istniejącego faktycznego prywatno-sensorycznego podglądu R3 i L1 jako *narzędzia* (testy Chrome istnieją, Owner nie stwierdził nowego PASS); wypunktować, co jego dotychczasowe narzekanie na więzienie/ślepego robota faktycznie eliminuje. Nie nagradzać green Chrome za „żywość”.
2. **Wybór jednej autentycznej, powtarzalnej presji ekologiczno-osobniczej**, nie kolejnego podążania do kulek: otwarty materialny teren, co najmniej jeden faktycznie niezależny proces, który dalej działa *bez aktora* i nie wyczerpuje całej swojej dynamiki po 30s; organizm może modyfikować jego późniejszy przebieg, a jego prywatna przeszłość potencjalnie wpływa na decyzję wrócenia/przerwania/kontynuacji działalności. Nie projektować przedwcześnie listy interesów/treści potrzeb. To jest **hipoteza przedimplementacyjna** i musi zostać sprowadzona do pojedynczej falsyfikacji.
3. **Smallest honest falsifier:** warunki świata i prywatna historia wariantów są jawnie odseparowane; po perturbacji/zmianie występuje nowy, nieprzewidziany przez scenografię możliwy dalszy przebieg (nie tylko marker przesunięty raz); porównać z ubogim tanim odruchem oraz World-only. Jeżeli nic się nie różni *dla trwającej działalności aktora*, wynik FAIL niezależnie od ilości kroków i odległości. Przebieg musi obejmować realną fizykę, rzeczywisty wykaz wykonanych kroków i prawdziwą aktywność świata.
4. **Wcześnie otworzyć to do swobodnej interwencji człowieka**: zatrzymanie czasu, przesunięcie materii i przejęcie ciała już działa w dawnym viewerze, ale nie jest wystarczające. Dalszy kandydat powinien być zabawką-obserwacją, nie tylko testem CI, a ewaluacja Ownera może unieważnić triumfalną narrację agenta.
5. Po uzyskaniu naturalnych H7–H9 odłożyć resztę World machinery i zainicjować mały oracle/shadow semantic consumer; po niepowodzeniu nie dobijać parametrami, ale zakwestionować podstawową sytuację.

**Granica zasięgu:** w tej turze to przygotowanie badania i sprawdzenie źródeł, NIE jeszcze nowa implementacja działającego życia. Nie wchodzić ze świeżym kodem w PR #84/#86 z rozpędu. Źródłowe FAIL zachować. Nie ma zgody na automatyczny merge PR #87 ani zmianę main/Jaskini.

## Co może jutro po raz kolejny zawieść
- pomylenie dowodu o organizacji *materii* z pojawieniem się org. pamięci lub celu;
- „lepszy” pseudo-self robiący to samo co no-history reactive;
- statyczny świat dekoracyjny i napędzany rail jako udawane ekologiczne odnowienie;
- organizm celowo zablokowany w małym pudełku, by mieć więcej kontaktów;
- klatki i godziny w logu bez fizycznej aktualizacji przy błędnej zmiennej czasu (O1);
- przepisywanie long-form docs, którego nikt nie używa, zamiast realnego testu sprawczości;
- udawanie, że każdy zwyczaj musi być semantyczny, lub odwrotnie wpychanie wszelkiej ontogenezy do pobocznego projektu;
- utożsamienie prawidłowo przesuniętej bryły z radością Ownera z żywego doświadczenia.

**Następne wejście bez Owner promptowania:** wrócić do live PR/CI; zestawić H1–H9 z realnymi istniejącymi kontrolami i problemami użytkownika; wybrać jedno miejsce, gdzie może powstać *prawdziwa historyczna zależność*, i zbudować minimalny, widoczny kandydat z falsyfikatorem. Zakończyć dopiero po ewaluacji, nie po pierwszym compile PASS.
