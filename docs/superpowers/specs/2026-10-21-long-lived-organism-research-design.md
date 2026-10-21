# ReflexBrain / Living Ontogeny — program długiego życia v0.1
**21 października 2026 · projekt badawczo-decyzyjny do oceny Ownera; NIE zatwierdzona architektura ani plan automatycznego wdrożenia.**

## Decyzja w 60 sekund

**O co walczymy:** o jednego materialnie ucieleśnionego mieszkańca, którego godziny, dni i późniejsze dłuższe etapy życia mogą rzeczywiście zmieniać zachowanie, kompetencje, nawyki, ograniczenia, relacje ze światem i to, co okazuje się istotne dla jego dalszej działalności. Nie o najlepszego agenta do kilkuminutowego zadania ani o zaprogramowany teatr odruchów, emocji i zainteresowań.

**Najważniejsza zmiana:** jednostką pracy i kwalifikacji staje się **rozwijająca się biografia organizmu w współzmieniającym się świecie**, z krótkimi testami jako diagnostyką, nie substytutem życia. Nie utożsamiamy stale rosnącego wyniku, niespodzianki, liczby obiektów, ruchu ani aktualizacji wag z życiem.

**Pierwszy ruch po akceptacji tej koncepcji:** wybrać technicznie uczciwą ścieżkę „jedna żywa historia → trwały checkpoint → wznowienie → rzeczywisty upływ czasu → badawczy odczyt”, bez nowego algorytmu i bez publicznego merge'u. Dopiero potem jedna ograniczona rodzina współzależnych procesów organizm–świat i jej odwracalne porównania. Długie próby początkowo mają odróżniać limit runtime od biologicznie brzmiących claimów.

**Ważne ograniczenie interpretacyjne:** Prawdopodobnie przez długi czas będziemy badać kandydatów na *life-like artificial organisms*, a nie mieć podstaw do stwierdzania biologicznego życia, świadomości czy subiektywnych przeżyć.

## Źródło Owner intent / nie zgubić duszy

Owner potwierdził 21 października, że nie chce najlepszego lokalnego algorytmu ani mechanicznego wykonywania zadania. Interesuje go całościowe zachowanie, które wyrobiony obserwator intuicyjnie nazywa życiem: wielość zmiennych, organiczne plusy i minusy, błędy, zależności, rozwój i realna historia. Horyzont naturalnego badania powinien wyjść daleko poza 30–120 sekund — w godziny, dni i dalej. Nie jest to zgoda na sztuczne dekorowanie `Occupant` emocjonalnymi stanami albo na niekontrolowany wielki refactor.

Nadrzędna wizja: w przyszłości ta linia ma pozwalać rozwijać autentycznie ciągłego, materialnego aktora, z którego doświadczeń może korzystać `ReflexBrain proper` — lokalny mechanizm uczący aktor-relative znaczenia, gdy ma prawdziwego odbiorcę. Praca nad organizmem nie ma być zastępowana pracą nad abstrakcyjnym semantic classifier, ani odwrotnie; skale pozostają rozróżnione.

### Fakty z live repo (21 Oct, bez promocji PASS)
- [#81 O-DEV/V0](https://github.com/Jozzpoly/ReflexBrain-Lab/pull/81): 120 Hz Rapier, legalne 30 Hz RGB/touch/proprio, B0/B1, realny `DevRuntime`, checkpoint fizyki + `DevResident`, browser microscope, ręczne przejęcie, dwie większe areny. Nowy `DevResident` aktualizuje dwukontekstową ocenę czterech 1,5-sekundowych manewrów za prędkość ciała pomniejszoną o kontakt. To adaptacja, nie życie. Siatkówka nie wpływa na decyzje.
- [#83 LIFE/L0](https://github.com/Jozzpoly/ReflexBrain-Lab/pull/83): sześć normalnych przebiegów po 120 sekund, luźna materia niemal całkowicie przestała zmieniać położenie po pierwszych 30 sekundach; uczeń dalej poruszał się i naliczał 79 aktualizacji. W B1 dominacja przód/tył, w B0 zafiksowanie na jednym skręcie. H6 ordinary-life quality FAIL.
- [#82 ACT/P0](https://github.com/Jozzpoly/ReflexBrain-Lab/pull/82): przy konsekwentnym kontakcie predyktor przyszłego proprio/touch przegrywał z tanią pamięcią ostatniej prędkości. Brak prawa do sterowania epistemicznego.
- [#80](https://github.com/Jozzpoly/ReflexBrain-Lab/pull/80) naprawia lokalny kontrakt odtwarzania morfologii, stale retina i własności sterowania; `dev-field.ts` przechowuje `saved` tylko w RAM strony. Browser przestaje symulować po ukryciu karty (`document.hidden`), a `requestAnimationFrame` ma ograniczone nadrabianie czasu. **Dzisiejszy browser to NIE bezobsługowy wielogodzinny silnik życia.**
- Tor dokumentacji Pre-O0 i uruchamialny stos #80–#83 mają rozbieżne historie Git; wybierać jawny runnable donor SHA, nie scalać wszystkiego w ciemno.

## 1. Antycele — rzeczy, których nie chcemy sobie sprzedać

1. **Perfekcyjny benchmark-bot:** wynik zadania/efektywność/latencja mierzą wycinek, nie całość życia.
2. **Teatr życia:** losowe „humory”, hunger-meter, state machine eksploruję/odpoczywam/boję się, migające potrzeby i arbitralne cooldowny są możliwe jako authored scaffolding, ale nie kwalifikują emergentnej osobowości.
3. **Niewidzialny opiekun:** host nie może podpowiadać celów, ukrytych odległości, klasyfikacji przyczyn, ani teleportować nagród/naprawiać świata, żeby eksperyment wyglądał dobrze.
4. **Wymóg nieustannej aktywności:** odpoczynek, utrwalona rutyna, brak postępu lub okres stagnacji NIE są z definicji FAIL. Kluczowe: czy zachowanie ma przyczynę i pozostaje zdolne do zmiany wobec istotnego zaburzenia. W obecnym V0 brak nowej materii wraz z wyborem tych samych działań jest podejrzany, ale sam brak przesunięć nie jest uniwersalną miarą.
5. **Magiczne przedłużenie 120 s → 24 h:** dłuższy run tej samej krótkiej maszyny nie staje się życiem; potrzeba procesów i pamięci działających na odmiennych skalach czasu.
6. **Symulacyjne muzeum:** systemów fizyki, ekologii, genetyki i energii nie budować przedwcześnie dla samej elegancji. Każdy nowy proces musi wnosić obserwowalną przyczynową różnicę albo konkretne future leverage.
7. **Jedna architektura z obowiązku:** dopiero porównanie rodzin i eksperyment z długą historią może awansować mechanizm. Nie utożsamiać kilkudziesięciu „wymiarów życia” z kilkudziesięcioma licznikami.
8. **Perfekcyjny host jako warunek ReflexBrain proper:** z chwilą realnej powtarzalnej presji H7/H8/H9 można równolegle badać actor-relative meaning; rozwój organizmu nie musi wtedy stanąć.

## 2. Czego powinno móc dotyczyć „życie”

Trzy współzależne procesy, NIE trzy konieczne moduły implementacji:
- **Organizm:** ucieleśnione możliwości i ograniczenia; coś trwa między chwilami (umiejętności, oczekiwania, nawyki, skłonności, uwaga, aktywność). Proces może coś zyskiwać i coś tracić; musi móc skorygować historię, nie być tylko kolekcją świeżych postępów.
- **Świat:** prawdziwa materia, persistence i niezależne zmiany, które tworzą oraz odbierają możliwości; pozostają ślady działań aktora. Nie tylko losowe spawny kul i state-independent ruch szyny. Świat nie czeka na aktora.
- **Relacja:** doświadczenie aktualnego aktora wpływa na jego przyszłe możliwości/wybory, a jego czynności wpływają na dalszy stan świata. Jeżeli można wyłączyć pamięć aktora lub usunąć ślady materialne bez praktycznie żadnej różnicy, „biografia” jest tylko logiem.

**Napięcia badawcze**, nie reward vector: nawyk–plastyczność, ciekawość–koszt, działanie–odzyskiwanie możliwości, stabilność–zmiana, specjalizacja–adaptacja, informacja–relewancja, trwanie–rozpad. Nie zakładać, że każda para wymaga scalar metryki czy stałego „trade-off 50/50”.

## 3. Konkurencyjne źródła ciągłości — porównywać, nie mieszać w ciemno

**A. Proceduralna biografia (najtańsza kontrola).** Lokalny organizm ma rzeczywistą historię sprawności/nawyków i proste, jasno authored źródło aktywności. Testujemy, czy sama trwałość umiejętności zmienia jego późniejsze interakcje. Ryzyko: zamknięcie w utrwalonym ruchu, jak V0; wystarcza tani odruch.

**B. Materialne samopodtrzymywanie możliwości (silna hipoteza, ale nie domyślny hunger bar).** Działanie wpływa na realne warunki dalszego działania: np. fizyczna zdolność manipulacji, dostęp do miejsca, wykorzystanie/zużycie przedmiotu lub właściwości ciała. Ograniczenie ma być częścią wspólnej materii, nie ukrytym quest timerem. Ryzyko: trywialny resource shuttle, bezczynny bezpieczny stan i sztucznie ustawiona optymalizacja jednej liczby.

**C. Trwała praktyka / nawyk / relacja z miejscem i materią.** Organizm rozwija sposoby działania, które stają się jego bieżącą działalnością i mogą być naruszone lub zrewidowane. Niech prawdziwe światowe perturbacje, a nie event „goal_failed”, tworzą presję do interpretacji. Ryzyko: ręcznie napisana pseudo-osobowość z przypisaną rolą i ukrytym preferowanym celem.

**Wybór wstępny:** A jako kontrola niekwalifikująca; B i C jako niezależni kandydaci do niedużych próbek długiego życia. W szczególności B nie może stać się obowiązkowym warunkiem wszelkiego życia, a C nie może polegać na losowym udawaniu nastrojów.

## 4. Plan kampanii — program rozgałęziony z realnymi exitami

### Kampania I — rzeczywista ciągłość, bez nowego „mózgu”
**Pierwsza przeznaczona do implementacji po recenzji projektu.**

Minimalne wymaganie: jeden żyjący `World`+aktor+prywatna historia; jawne niezależne zegary symulacji i prezentacji; headless stepping bez aktywnej karty; trwały plik/paczka checkpointu obejmująca fizykę Rapiera, jednostki, lokalny stan brain, controller authority, sensory frame/cache, RNG, procesy niezależne, zegary i numer wersji. `Resume` musi działać po restarcie *procesu*, nie tylko po przycisku w tej samej karcie. Weryfikuj przywrócenie dokładnego stanu oraz dalszy przebieg, z jawnymi wyjątkami gdy silnik/sensor or RNG nie daje determinizmu. Nie przebudowywać naraz istniejącego frontendu ani publikować hostingu.

**Warunek stopu:** wielogodzinny test życia nie może startować, dopóki po przerwaniu i przywróceniu nie wiemy, co faktycznie zachowaliśmy; jednak brak idealnej długoterminowej kompatybilności między patchami NIE blokuje wczesnego R&D (`nowa wersja = nowe życie` jest dopuszczalne). Lekka migracja tylko wtedy, gdy nie składa architektury w ofierze starym save'om.

**Instrumentation minimal:** rzadkie zdarzenia i okresowe snapshoty, odczyty kontrolne z legalnej percepcji, osobne researcher afterstates, wersjonowane źródła. Nie nagrywać bezrefleksyjnie wszystkich klatek RGB/całego świata przez tygodnie. Dziennik jest indeksem do historii, nie substytutem rzeczywistych checkpointów.

### Kampania II — świat, który nie jest tylko sceną
Odcinamy eksperyment małych pudełek i chronionych zagadek. Najpierw sprawdzamy, jakie **minimalne dwa niezależne procesy materialne** mogą wytwarzać zmieniające się możliwości i ślady, które aktor legalnie może dostrzegać z różnych pozycji. Kandydaty wybieramy przez realne A/B grywalne/obserwacyjne próby; żaden nie jest canonical mechaniką. Celem jest **życiowy ekosystem przyczyn**, nie ogromna arena ani mechanizm nieustannego spawnienia kolejnych kul.

Świat nie musi sztucznie reagować na każdą czynność, ale powinien zachować wynik: przedmiot przeniesiony gdzieś przez mieszkańca nie resetuje się co 30 s. Możliwy naturalny brak aktywności jest dozwolony. Materia i przyczyna są ground truth; prywatne doświadczenie aktora nie zawiera hostowego objaśnienia.

**Falsifier:** świat pełen autonomicznego ruchu, który nie zmienia przyszłych wyborów ani możliwości aktora, pozostaje dekoracją.

### Kampania III — minimalny organizm i prawdziwe napięcia
Oddzielnie uruchomić co najmniej A oraz jeden B albo C. Nie wprowadzać od razu głodu+energii+zmęczenia+bezpieczeństwa+curiosity reward. Każdy mechanizm dostaje niewielką liczbę prawdziwych, sprawdzalnych zależności i pełny opis authored contribution. Prosty kontroler bazowy ma mieć prawo pokonać wyuczony. Bardziej interesuje nas **powstanie nowych wzorców i ich późniejsza rewizja** niż liczba skompilowanych subsystemów.

Prawidłowe normalne zachowanie może być wielogodzinną rutyną, jeśli jej przyczyna jest konsekwentna, ma wartość dla działalności i potrafi reagować na odpowiednią zmianę. Fail przy uporczywym mechanicznym krążeniu mimo dostępnych i znaczących alternatyw — nie przy samym powtarzaniu.

### Kampania IV — pierwsza biografia o mierzalnej przyczynowości
Pracować na **tym samym początkowym organizmie** w co najmniej dwóch autentycznie odmiennych historiach, nie na dwóch różnych specjalistycznych algorytmach. Przykładowo jedna historia ma dostęp do innego materialnego doświadczenia, niezależnie od ukrytych 'labeli'. Dopiero potem dwie kontrolowane próby:
- **Wspólny świat po rozbieżnej biografii:** odtworzyć porównywalne fizyczne warunki i różnicować wyłącznie historię/stany prywatne, w miarę zgodności dopuszczonej przez definicję interwencji.
- **Wspólna pamięć w dwóch światach:** ten sam aktor-private learned state, odmienne materialne otoczenie — mierzy zależność od aktualnej ekologii, nie wyłącznie różnice checkpointu.
- **Konieczne kontrole:** historia wyzerowana/przetasowana, oryginalny pełny checkpoint, autorowany scripted control, zrównany koszt informacji, odruch i niezależny seed, o ile seed faktycznie wpływa na mechanizm. Nie używać pseudoreplikatów.

Dopóki przebiegi mają identyczną kontrolowaną historię, prawowity jest matched prefix; po pierwszym rozjechaniu decyzji **nie twierdzić, że obserwacje pozostają równoważne**. Wiedza badacza o World jest tylko do audytu, nie treningowego ground truth.

### Kampania V — długie życie i współrozwój
**Horyzonty docelowe, zależne od wydajności i pierwszej jakości życia:**
- Krótkie sekundy/minuty: regresje sensomotoryczne, identyczny replay, testy zmysłów. Nie życiowe KPI.
- ~10–30 minut symulacji: praktyczne wykrywanie zamrożonych zachowań, dryfu, pamięci i świata.
- ~1–6 godzin: pierwszy sprawdzian trwałości procesów/nawyków, zmienności sytuacji, samodzielnych powrotów do niektórych doświadczeń i innych skutków opóźnionych.
- ~24 godzin i wielosesyjne dni: sprawdzenie istotnej historycznej ciągłości, zmian po restarcie, późniejszych konsekwencji materialnych, stabilności oraz możliwości modyfikacji skłonności.
- Później: wiele dni/tygodni i więcej wirtualnych godzin tylko gdy tempo runtime i wartość nowych zjawisk to uzasadniają.

To nie jest gwarancja, że 24h symulacji wykona się natychmiast na CI. Najpierw **zmierzyć wydajność na obecnym CPU**, czas na liczbę ticków, zmienność pamięci, koszty snapshotów, rozmiar logu, dryf i stabilność. CUDA/RTX A4500 dopiero do uzasadnionego modelu R&D, nie do maskowania nieumiejętności świata. Headless physics ma pozostać prawdziwym 120Hz modelem (albo innym świadomie zweryfikowanym czasowym modelem) — nie udawać tej samej przyczynowości po zmianie rozdzielczości czasu.

### Kampania VI — ReflexBrain proper wśród naturalnych spraw organizmu
Gdy zwykłe życie dostarcza powtarzalnych, **niebanalnych actor-relative** sytuacji, których wartość zależy od lokalnej działalności (H7/H8/H9), uruchomić równoległy, wymienialny organ interpretacji znaczenia: realna percepcja ≠ przekonanie ≠ pamięć ≠ world truth. Najpierw shadow i łatwe reguły; później, jeśli zasłuży, wpływ na aktywność. Nie czekać, aż reszta ciała będzie „idealna”; nie zastępować rozwijającego się organizmu samą klasyfikacją znaczenia.

## 5. Trzy komplementarne typy dowodu

**Inżynieryjny** — stale działający proces, fizyka, legalna percepcja, wersjonowane checkpointy, ręczne interwencje, autentyczne wznowienia. Niezbędny; *nie kwalifikuje życia*.

**Przyczynowy** — opóźniona zmiana zachowania rzeczywiście wyjaśniana przez poprzednią historię, skłonności, możliwości lub ślady w świecie. History swap, ablation, shared post-checkpoint environment; nie mylić tego z różnymi trajektoriami po różnych losowych seedach.

**Doświadczeniowy / Owner** — możliwość wrócenia do tego samego świata, zobaczenia nowych następstw po długiej nieobecności, zaobserwowania utrzymujących się i rewidowalnych wzorców, przyczynowo czytelnych „plusów i minusów”. Nie budować artificial life score. Wspierać czasem ślepe porównanie krótkich fragmentów, bez mówienia która polityka wytrenowana; potem researcher traceback wyjaśnia co faktycznie zaszło. Owner FAIL jest nadrzędnym falsifierem jakości nawet gdy CI PASS.

**Wskaźniki pomocnicze:** miejsca, kontakt, materia, rozkład czasu aktywności, entropia decyzji, zmiany pamięci, nawyki/ich rewizje, powtarzane/podjęte na nowo praktyki, przyczynowe ślady, stale/błędne przekonania. Zawsze kontekst i obejście gaming; żadnego sumowania do jednego maksymalizowanego life-score.

## 6. Najgroźniejsze falsyfikatory

- Szybka saturacja prostego rewardu tworzy równy motoryczny attractor, jak dziś; wydłużenie życia daje tylko więcej tego samego.
- Biografie różnią się wyłącznie początkowym RNG/motorem/pozycją albo po prostu wpływem różnych światów; historia aktora nie ma przyczynowego efektu.
- Dodane potrzeby są niezależnymi authored timerami; organizm działa jak rozkład jazdy, nie jak ciągły układ.
- Ruch świata tworzy spektakl dla obserwatora, ale prywatne czujniki i przyszłe możliwości aktora niczego nie rejestrują.
- Im więcej „ciekawości”, tym więcej oscylacji przy ścianie, hałasie lub predykcyjnym artefakcie.
- Organizm nigdy nie nabywa później wykorzystywanej pamięci; World sprawdza się jako fizyka, ale nie ma osobistej biografii.
- Mimo 100% testów właściciel widzi identyczną martwą automatyzację; system próbuje ratować claim metrykami.
- In-memory save znika po reload/ukryciu karty; długi „czas życia” tak naprawdę był liczbą zgadniętych ticków lub resztkowym browser loopem.
- Wobec problemu z jedną godziną symulacji agenci zaczynają projektować ogólny scheduler/LOD/cloud AI platform, zanim ich potrzebę wykazał pomiar.
- Trwające tygodniami dokumentowanie „życia” ponownie wypiera zobaczenie choć jednego realnego, samodzielnego mieszkańca. **Stop i wróć do runnable doświadczenia**, nie do kolejnego GDD.

## 7. Naturalne bramki i plan pierwszej wykonywalnej iteracji

**L0 — projekt i baseline teraz (w tej turze):** repo, wyniki #81–83 i wymagania potwierdzone; nie przeprowadzać nieuprawnionej przebudowy. Zamknąć tę specyfikację jako hipotezę dla Owner review.

**L1 — continuity vertical slice (najbliższa kampania po akceptacji):** wybrać jeden jawny runnable SHA z #80/#81, prowadzić jeden headless World/actor przez kilkanaście minut symulacji, zrobić fizyczny + prywatny checkpoint, wyłączyć/uruchomić proces i udowodnić identyczne sensomotoryczne przedłużenie; jawny identyfikator życia + manifest wersji + licznik czasu. **Nie** nowa inteligencja; bezpieczne narzędzie do rzeczywistych biografii.

**L2 — dwie konkurencyjne mini-ekologie:** wybrać 1–2 zwykłe fizyczne możliwości, które (a) zachowują materialne konsekwencje, (b) niezależnie zmieniają warunki, (c) mogą być dostrzeżone legalnie; wykonać Owner demo z fizyczną ingerencją. Porównać wariant z/bez procesu świata i sprawdzić, czy różnica może kiedykolwiek wpływać na aktora.

**L3 — dwa alternatywne organizmy na tym samym podłożu:** najtańsza kontrola A kontra jeden kandydat B lub C. Dopiero po opanowaniu checkpointów i epistemicznego interfejsu wybrać model uczony. Wyróżnić jego nieautomatyczną aktywność; bez perfekcyjnego targetu i gold reward.

**L4 — pierwsze długożyciowe A/B:** nie 60 s, lecz od 10–30min do godzin; późniejsze odtworzenie rzeczywiście odmiennych historii w wspólnych warunkach; wymaga realnej rewizji/utrzymania skłonności. Pozytywne świadectwo historycznej przyczynowości, nawet jeśli jedna biografia ma zły nawyk.

**L5 — wiele dni, jeśli materiał to uzasadnia:** długotrwały koszt, okresy nieobecności obserwatora, world metabolism, wielosesyjne powroty. Uruchamiać ReflexBrain-proper równolegle, gdy pojawią się prawdziwe H7/H8/H9.

**Korekta:** każda bramka może podważyć poprzedni mechanizm; nie wymaga zachowania save'ów starych eksperymentów ani obrony napisanej architektury. Twarde zobowiązanie dotyczy uczciwych powodów zmiany i czytelnego source of truth, a nie zachowania każdego historycznego komponentu.

## 8. Repo, role i definicja zakończenia planowania

- Jedynym nowym dokumentem programu jest **ten plik**, a punkt wejścia do niego pozostaje w istniejącym `Competence Control Room` i `CONTINUE_HERE`, nie w nowym konkurującym „CURRENT”.
- Repo source of truth: plan jest na dokumentacyjnej gałęzi Pre-O0; runnable fizyka i uczeń na rozbieżnych draft PR #80–83; bez automatycznego merge. Przy kolejnym kroku wybrać konkretny SHA, zachować izolację i kwalifikację donorów.
- Agent może bez dodatkowych pytań kontynuować research, analizę i precyzowanie planu w już znanych granicach; **pełne przeprojektowanie runtime wymaga świadomego przeglądu koncepcji i uzgodnienia wykonywalnego zakresu**. Owner nie musi zatwierdzać każdej mikroczynności.
- Przed implementacją ciągłości długiego życia konkretny plan techniczny ma określić interfejs pliku checkpointu, życiowy zegar i rozdzielenie headless/render, testy cross-process restore, wyjście ze starym źródłem V0, koszty storage/sim. Nie pisz rozbudowanej platformy na podstawie tego programu.
- **Uczciwe zakończenie tej rundy:** zweryfikowana koncepcja wielopoziomowego programu i pierwszy sensowny zakres L1. Nie nazywać tego nową generacją mózgu lub żywym organizmem; bez testów wdrożeniowych nie promować żadnych nowości.

## 9. Otwarte pytania do krytycznego Owner judgement (nie blokują dalszego researchu)
1. Czy pierwszy obiekt zachowania powinien mieć materialne ograniczenie możliwości utrzymania aktywności, czy zaczynamy od kontynuowanej praktyki/nawyku bez zewnętrznego 'przeżycia'?
2. Na ile mieszkaniec ma móc zmieniać swoje ciało i środowisko, zanim stanie się to oddzielnym biomechanicznym/ekologicznym projektem?
3. Jak różny może być obserwowany stan dwóch „biografii”, aby uznać je za rozwój, a nie tylko za losową dywergencję? Czy wielogodzinne pozostawanie przy jednej praktyce bywa dla Ownera interesujące, gdy ma czytelną przyczynę?
4. Co naprawdę chcesz zobaczyć, kiedy otworzysz życie po dobie nieobecności — ślady, nawyk, nową umiejętność, reakcję na znaczącą zmianę, czy coś, czego dziś nie umiemy przewidzieć?

Nie trzeba odpowiadać na wszystkie naraz. Pytania są materiałem dla eksperymentów, nie formularzem blokującym działanie.
