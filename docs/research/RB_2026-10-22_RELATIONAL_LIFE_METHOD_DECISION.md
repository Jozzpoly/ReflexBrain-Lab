# ReflexBrain — ZMIANA METODY PRACY: relacja życiowa zamiast serii mini-zadań
**22.10.2026 · badawczy decision memo, bez zmiany silnika ani architektury; wyłącznie gałąź R6 / PR #87.**
Wstęp: [poranne odzyskanie celu](RB_2026-10-22_MORNING_REENTRY_AND_CAMPAIGN.md), historyczne FAIL R0–R5a w [PR #86](https://github.com/Jozzpoly/ReflexBrain-Lab/pull/86), LIFE/L1 infrastructure w [PR #84](https://github.com/Jozzpoly/ReflexBrain-Lab/pull/84), pierwotna [granica Pre-O0](https://github.com/Jozzpoly/ReflexBrain-Lab/blob/research/pre-o0-foundations-campaign/docs/PRE_O0_PROJECT_BOUNDARY_EXIT_CONDITION_2026-10-06.md).
To **nie jest lista zadań do automatycznego wykonania**. To korekta sposobu rozpoznawania rzeczywistych okazji do pracy. Nie zastępuje późniejszego osądu Ownera i nie rozstrzyga, czym definitywnie jest życie.

## 1. Najmocniejsza diagnoza dotąd niewyrażona
Wiele prób miało fizycznie poprawną law, prawidłową prywatną percepcję i prawidłowy update. Zawiodło coś wcześniejszego od inteligencji: **nie istniała spójna, nawracająca relacja w czasie pomiędzy aktywnością osobnika, materialną dostępnością i skutkiem jego historii**.

To jest błąd *niedopasowania skal i wzajemnej dostępności*, a nie pojedynczy źle dobrany algorytm:
- R3: samotna czynna jednostka oddalała się o ~247 jednostek w 80s, bez kontaktów; prywatna pamięć uczenia pozostawała zerowa.
- R4a: 16 porozrzucanych obiektów i dynamiczny rail ruchły materię (~18.5 jednostki) na początku; w kolejnych 90s wszystkie wybrane arm miały **zero niepustych klatek wzroku** i zero odnowionych kontaktów. Materialny world ON/OFF dawał identyczne trajektorie aktora mimo różnej dynamiki materii.
- R5a: odwrotny rodzaj pomyłki — oko widziało 694/764/774/773 klatek w czterech oknach, ale kontaktów było zero; „pamiętany powrót” nie uruchomił się ani razu, a ruch zwykłych przedmiotów wyniósł [5.44,0,0,0] w kolejnych oknach 30s. Sam wzrok i prywatna zmienna pamięci nie implikują przydatnej działalności.
- R6/O1: „czas 500 kroków” okazał się etykietą; po nadpisaniu zmiennej wykonanie stanęło, lecz zielone testy potwierdzały fałszywą narrację. Dopiero bezpośredni licznik fizycznych update'ów i zmiany siatki ujawniły błąd. Jedna technicznie prawdziwa liczba **nie może w zastępstwie obserwować zjawiska**.

**Wniosek roboczy:** bez spotkania *własnej przeszłości w zmienionym przez siebie świecie* nie da się zaobserwować ani głębokiej ontogenezy, ani użytecznego, actor-relative znaczenia. Nie wymagamy literalnej pętli powrotu do tego samego miejsca; „powrót” może być pośredni, społeczny, materiałowy, percepcyjny, opóźniony. Nie narzucać go motorem „jedź do punktu X”.

## 1a. KRITICZNA AUTOKOREKTA — ruch świata nie jest wymaganym tempem jego życia
W poprzedniej kampanii R4/R5 potraktowaliśmy poruszanie się luźnych przedmiotów w późnych 30-sekundowych oknach jako ważny test „odnawiającej się ekologii”. To jest **ważny wąski test** konkretnego silnika/rail, ale zbyt agresywny **ogólny warunek życia**. Prawdziwe następstwa działania organizmu mogą trwać w formie *spokojnego stanu*: gniazdo/nora, porzucona przeszkoda, ślad, zniszczona droga, nabyta lokalna własność materiału, niedostępne po eksploatacji miejsce. Materia w tym czasie nie musi stale się poruszać. Ważne jest, czy ta zmiana **przeżywa sprawcę, pozostaje osiągalna, zmienia dalsze możliwe interakcje i może zostać rzeczywiście ponownie doświadczona**, a nie ile metrów przebyła.
Trzy różne procesy, nie jeden `worldMovement`:
- **autonomiczny proces**: świat może wytwarzać nowe stany pod nieobecność jednostki;
- **materialna pamięć**: wykonane zmiany pozostają i mogą później działać, nawet przy zerowej aktywności;
- **powrotna przyczynowość**: jednostka/inna jednostka rzeczywiście spotyka te zmienione możliwości i coś dalej się wydarza.

R4a / R5a nadal **FAIL ich jawnie zamrożone hipotezy**; nic w oryginalnych CI i ich braku późnych spotkań nie uległo zmianie. Jednak nasz szerszy wniosek „world nie ma ekologii, bo przez 90s nic nie porusza zwykłych obiektów” był **nieuzasadnionym uogólnieniem**. Nie ulepszać testu przez wymuszenie ruchliwości; potrzebujemy **potencjalnie doniosłego stanu i późniejszego zetknięcia**, czasem po długiej ciszy. Nieużyta osadź śladu sama też nie dowodzi życia; to musi mieć związek z dalszą działalnością, nie tylko atrakcyjny efekt w renderze.

## 2. Cztery rozdzielone poziomy — nie wpisywać z góry w jeden KPI
(A) **Dostępność i wzajemność**: czy proces świata działa na skali, którą aktywność osoby może w ogóle ponownie spotkać, i czy indywidualne działanie zmienia dalsze możliwości świata? Obserwacja to nie to samo co sprawczość.
(B) **Trwałość organizacji**: czy struktura/uwarunkowania osobnika są realnie utrzymywane, zmieniane lub tracone w interakcji, zamiast mieć zawsze-niezniszczalny bazowy actor rigid body lub biologiczny health meter?
(C) **Biografia i adaptacyjna praktyka**: czy wcześniejsze konsekwencje przekształcają to, co osobnik robi później, w tym także złe nawyki, okresy spokoju, przerwania i nieudane przystosowania? Inny numer pamięci ≠ inna działalność.
(D) **Lokalne znaczenie ReflexBrain**: czy istnieje powtarzalna niejednoznaczna sytuacja H7–H9, której rola dla *tej* jednostki i jej bieżącej działalności wykracza poza wykrycie kolizji, położenia, trasy i ID? Jeśli TAK, zamrozić host wystarczająco wcześnie i testować semantyczny organ. Nie czekać na pełne ALife.

Nie wolno uznać jednej własności za dowód pozostałych. W szczególności `continuous motion` ≠ A, `mass conserved` ≠ B, `memory updates` ≠ C, `retina sees` ≠ D.

## 3. Nowa JEDNOSTKA badania: trwający układ możliwości, nie „scenariusz do zaliczenia”
Podmiotem obserwacji jest **relacja między co najmniej jednym trwającym indywidualnym procesem a innymi działającymi niezależnie procesami materialnymi**.

Aby w ogóle zacząć kosztowną implementację nowego świata, potrzebujemy odpowiedzi na cztery rzeczy:
1. Co w świecie istnieje lub rozwija się niezależnie od organizmu, a co **pozostaje jako konsekwencja** jego wcześniejszej działalności? Zależność może być opóźniona lub statyczna; nie wymaga nieprzerwanej ruchliwości świata. Nie wolno podmieniać jej na cykliczny ruch silnika ani na dekoracyjny ślad.
2. Co organizm może *fizycznie* zmienić w dalszym przebiegu tego procesu, także przypadkowo albo niekorzystnie, a nie wyłącznie ukończyć puzzle?
3. Skąd w jednostce bierze się kontynuacja/przerwanie działalności? Można użyć jasno podpisanego `authored practice` jako scaffold, ale ani odruchu, ani jego autorstwa nie przypisywać „własnej potrzeby”.
4. Jak wcześniejsza zmiana świata może wrócić do jednostki przez **legalną percepcję** (także za pośrednictwem innych aktorów, z opóźnieniem)? Nie wstawiać magicznych World coords/gate labels/score do mózgu.

Jeśli nie potrafimy tego opisać jednym rzeczowym związkiem przyczynowym, kolejny złożony świat oznacza najpewniej dalszą produkcję dekoracji. **NIE wymagać czterech bogatych demonstracji jako bramki na pierwszą próbną hipotezę**; są to kontrolne pytania o jej sens.

## 4. Asymetria przyczynowa: co powinno być niezależne, a co splecione
- World może mieć prawidłowe niezależne mechanizmy. Nie musi być pusty pod nieobecność aktora.
- Jednostka może mieć własne podtrzymywane „praktyki” o jeszcze niewyjaśnionym pochodzeniu; nie każdy dobry scaffold jest fałszerstwem, o ile pochodzenie jest jawne.
- **Powinny się splatać skutki, a nie wszystkie źródła.** Tylko wtedy world z obecnym i nieobecnym aktorem rozwija się różnie, a równocześnie aktor bez świata nie wykonuje tej samej bezcelowej taśmy. Istotna jest przyszłość dostępna po wielu zdarzeniach, nie jednorazowo pchnięta kulka.
- Brak symetrii nie jest sam w sobie porażką. Przemiana osobnika może być na początku bardzo skromna; układ nie musi składać się od razu z całej społeczności lub autopoietycznej chemii.

**Trop literaturowy (nie nasz wynik):** niche construction + ecological inheritance ujmują modyfikację środowiska przez organizmy i późniejsze działanie jego dziedzictwa jako sprzężone zjawiska (Odling-Smee et al., 2013, https://doi.org/10.1086/669266; Laland et al. 2016, https://pmc.ncbi.nlm.nih.gov/articles/PMC4922671/). Di Paolo (2005) rozróżnia samo utrzymywanie formy od *adaptivity*, czyli zmiany relacji do warunków viability (https://doi.org/10.1007/s11097-005-9002-y). To **hipotezy konstrukcyjne / soczewki**, nie dowód, że istnieje jeden prawdziwy algorytm życia, ani upoważnienie do zrobienia autora ukrytej wyroczni.

## 5. Groźne złudzenia w projektowaniu badań
- **Scenografia wyprzedza ontologię**: szybszy silnik + większa mapa + więcej obiektów + więcej modeli może zwiększyć ruch, ale nie stworzyć ponawialnego źródła znaczenia. Przed rozwojem oceń *czasy spotkań, czasy regeneracji, czasy doświadczenia i powrotu* jako wielkości z natury sceny, nie nową pojedynczą punktację.
- **Kontakt ≠ przyczyna**: w R4 źródło wprawiło w ruch przedmioty, ale trajektoria aktora była identyczna z null. Prawdziwe world action ≠ world outcome *istotny dla aktora*.
- **Stan pamięci ≠ biografia**: identyczne lub przeciwne komendy przy wymuszonej ablacji nie wystarczą. Eksperymentalnie tworzony, niemożliwy do osiągnięcia miks World/private history to tylko diagnostyka kodu, NIE dowód naturalnej kompetencji. Oddzielać (a) replay fizycznej historii, (b) interwencję w możliwej historii, (c) sztuczny splice stanów.
- **Ochrona przed red-green wishful thinking**: test uprzednio zadanej dobrej własności może naukowo FAIL; po zapisaniu źródłowej porażki zakwalifikować ją jako regresję negatywną. PASS regresji nie odwraca porażki naukowej. Każdy raport czasu ma odpowiadać realnie wykonanym krokom.
- **Owner witness jako osobny dowód**: obietnica „żywy” na podstawie machine PASS nie przejdzie. Użytkownik musi mieć możliwość psucia i swobodnej zabawy, nie tylko oglądania filmu sukcesu.
- **Nie zamykać rozwoju w jednej definicji życia**: istnieją formy nieprzewidzianej aktywności, także pozornie bezproduktywnej. Konwencjonalna funkcja celu może je zabić. Nawet liczne zielone testy nie powinny automatycznie zamykać falsyfikacji.
- **R6 nie jest drogą obowiązkową**: bottom-up forma daje cenną naukę o utrzymywaniu organizacji, ale nie zastąpi automatycznie prywatnych historii, uwagi czy świata. Nie migrować Rapier na nowe CA dlatego, że wzorce są atrakcyjne.

## 6. Kampania badawcza w krótkich, autonomicznych krokach bez blokowania Ownera
**Przed kodem**: odtworzyć naturalną możliwość z istniejących donorów i wymienić NAJWĘŻSZĄ brakującą zależność; preferować jedną materialną relację, nie nowy generator świata. Nie projektować ostatniego architektonicznego modelu danych.

**Pierwszy ograniczony przebieg**: *najpierw world-alone*: czy świat ma trwałą, dostępną historię i/lub autonomiczne procesy po wyjściu aktora (a nie tylko działający zegar)? Brak bieżącego ruchu nie wystarcza do uznania tego za FAIL; *potem actor+world*: czy aktor ma do nich fizyczny i percepcyjny dostęp bez host-guidance? Najtańszy naiwno-odruchowy rival od początku. Jeśli już tu fail, nie eskalować.

**Drugi przebieg tylko gdy pierwszy wnosi wartość**: realne oddziaływanie jednostki na późniejszy world; dwa różne osiągalne przebiegi; prywatne historie legalne, oddzielona ingerencja badacza. Test powrotnej przyczynowości i możliwe H7–H9, nie improwizowana jedna nagroda. Dopiero wtedy długa ciągłość mierzona w godzinach i wizualny Owner test.

**W każdym punkcie:** pytać, czy nowy test zmniejsza największą nierozstrzygniętą niepewność o realnym długim życiu. Jeśli nie, powstrzymać elegancką serię. Rygor może zwiększyć scope w ważnym momencie, ale nie wymuszać mnożenia małych fixtures. Pracę prowadzić w długich runach z krótkimi checkpointami Git/CI, bez czekania na ręczne „kontynuuj”.

## 7. Ważny donor znaleziony w naszych własnych projektach — bez kopiowania ich architektury
**Gloopipelago**, źródło: [Owner M4 product FAIL](https://github.com/Jozzpoly/Gloopipelago/blob/m4b-living-world-legibility-2026-09-10/evidence/owner/M4_COMPOSITE_OWNER_FAIL_2026-09-10.md) oraz [current state / M4 evidence](https://github.com/Jozzpoly/Gloopipelago/blob/m5a-dynamic-habitat-memory-audit-2026-09-10/docs/CURRENT_STATE.md). Wariant M4a miał prawdziwe, wielopokoleniowe 1800s/3600s przebiegi, 8 siedlisk i mierzalne lokalne różnice fenotypów przy tym samym globalnym budżecie. Zatem **samo trwanie i ekologiczna selekcja są technicznie dostępne jako donor doświadczeń**. Mimo to osobny Owner test (~6:38 nagrania) zakończył się jednoznacznym FAIL: ruch, geny, jedzenie i reprodukcja pozostawały różnymi ilościami parametrów w **jednym i tym samym bazowym repertuarze** „szukaj pokarmu→jedz→rozmnażaj się→umrzyj”. Krytyczna nazwana luka: **low expressive rank of genotype-to-life map**. Znaczenie: więcej osobników, mutacji, food patchy, x40 ani strategii proxy nie wyczaruje jakościowo odmiennych sposobów życia.

W osobnym [M5a audit plan](https://github.com/Jozzpoly/Gloopipelago/blob/m5a-dynamic-habitat-memory-audit-2026-09-10/evidence/post-m4/POST_M4_DYNAMIC_HABITAT_MEMORY_PROBE_PLAN_2026-09-10.md) autorzy laboratorium rozważyli lokalną produktywność zależną od historii eksploatacji siedliska. To jest uczciwy przykład ekologicznego **scaffold**, którego skutki można odróżnić od jednorazowej szyny R5, ale jego implementacja byłaby nadal zaprogramowanym `p(t)` / budżetem żywności. Sam taki mechanizm nie dowodzi samoorganizacji, nowych kompetencji ani przemiany sensu zdarzenia dla osobnika. M5a na wskazanym branchu pozostawał planem/audytem, NIE zakwalifikowanym nowym organizmem.

**Cognitive-Ecology-Lab**, [work/r1-incident-cell](https://github.com/Jozzpoly/Cognitive-Ecology-Lab/tree/work/r1-incident-cell): rozgrywa rzeczywistą współbieżność czterech różnie opóźnionych, konkurujących o jeden aktuator **jawnie hand-authored** komponentów; cenny donor prowadzonych kontroli cheap baseline i źródeł sprawstwa. To nie jest wyuczone życie, a wypadki/pożary są authored task-events, więc samo skopiowanie tego świata sfabrykowałoby semantyczną presję H7–H9.

**Splot Next** [PR #5](https://github.com/Jozzpoly/Splot/pull/5): realna bezpośrednia manipulacja materią i ludzkie „feel” jako trafne referencje *doświadczenia*, lecz repo samodzielnie stwierdza, że wiele donorów geometrii/Box3D jest eksperymentalnych i Owner gameplay gate nie został zaliczony. Nie przenosić całego engine ani sterowania tylko dlatego, że to rodzeństwo.

**Wniosek donor-audit:** mamy bardzo dobre doświadczenia na osi (a) długie eco-runy z selekcją, (b) złożona konkurencja modułów czynności, (c) swobodne fizyczne działanie Ownera — ale **żadne z nich nie jest świadectwem integralnej biografii**. Integracja wszystkich trzech jako monolit byłaby drogim błędem. Najpierw pytać, czy najmniejsza nowa relacja w jednym świecie udostępnia więcej niż ten bardzo mocny, już istniejący zestaw *negatywnych kontroli*.

## 8. Co naprawdę znaczy „różne sposoby życia”
Nie chodzi o 20 preprogramowanych klas zachowania lub złożone genome JSON. W Gloop ograniczeniem był **jeden schemat działalności** o parametrach zmienianych przez geny. Przyszły świat powinien otwierać realne kombinacje i konflikty możliwości: to, co jest materialnie łatwe dla jednej jednostki lub jej historii, może być trudne dla innej; działalność może tworzyć nowe miejsca/warunki i zamykać inne. Nie zakładać, że same liczby morfologii lub diet wystarczą. Nie wymagać na starcie pełnej ewolucji „wszystkiego” — już jeden rzeczywisty nowy tryb wzajemnej przyczynowości jest mocniejszy niż tysiąc płynnie zróżnicowanych wersji tej samej pętli.

## 9. Decyzja na dziś / czego świadomie NIE robić
W aktualnym stanie projekt nie potrzebuje kolejnej liczbowej odporności, nowej Lenii, lepszego zero-reward motoru ani wymyślania w tej chwili „prawdziwego metabolism”. Potrzebuje *jednej* dobrze wybranej, źródłowo obronionej wzajemnej zależności, którą można później badać **w działającym świecie i w prawdziwym doświadczeniu Ownera**.
Zanim zaczniemy implementację, zrobić krytyczną ocenę istniejących donorów: które elementy mają ciągłą materialną przyczynowość, które są skryptową jednorazowością, które dają genuine private historical pressure? Nie zakładać, że jeśli donor został z innego projektu, powinien stać się jego nowym foundational subsystem.

**Najbliższy techniczny ruch po tej notatce:** przeprowadzić donor audit i rozstrzygnąć jeden scenariusz nacisku; jeśli nie ma realnej ekologii gotowej do użycia, przygotować możliwie mały autorski scaffold z jawnym pochodzeniem, zamiast znowu rozpędzać R7 w wielkie repo. Dwa sensowne wąskie rezultaty na koniec runu to (a) obserwowalne naturalne źródło trwających wzajemnych skutków, albo (b) jasny, źródłowo udokumentowany FAIL i zmiana założenia. Unikać „mamy dużo nowych plików, a nic się nie wydarzyło”.

**Gwarancja continuity:** PR #84 LIFE/L1 i #86 L2 pozostają odrębne drafty; R6 #87 pozostaje donor draft. Nowy memo to decyzja badawcza w dokumentacji PR #87, NIE implementacja świata ani deklaracja, że powstał żywy organizm.
