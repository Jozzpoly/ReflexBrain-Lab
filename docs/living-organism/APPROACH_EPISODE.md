# Prywatna historia a kontynuacja działania — 2026-10-08

## Zakres i decyzja
Zrealizowano następny etap kampanii: samodzielny, wymienialny kontroler eksperymentalny
ApproachEpisode oraz parowany benchmark. Nie podłączono go do domyślnego runtime.
Pytanie: czy historia odczuwanego ruchu i wyglądu zmienia użyteczną decyzję bez znajomości
world XY, range, authored ID i intencji hosta? Czynność zbliżenia do kontaktu jest zadana
przez badacza, nie wyłoniona własna potrzeba organizmu. Sterownik nie jest uczony.

Trzy warianty mają to samo sensory input i sterowanie: jedna nieucięta turkusowa plama,
turn od bearing, drive .25 przy bearing <.3 rad, wycentrowanie gaze. Dotyk >.001 przerywa
epizod. Brak plamy, clipping lub wiele fragmentów zatrzymuje sterowanie i kasuje anchor.
- reactive: korzysta z bieżącego wyglądu, nie ocenia postępu;
- permanent: po 1 jednostce odczuwanego ruchu do przodu wymaga 10% wzrostu angular extent,
  inaczej porzuca epizod;
- reconsider: ten sam próg, lecz 2 s przerwy, następnie nowa próba z nowym anchorem.

Travel jest naliczane tylko po poprzedniej dodatniej komendzie drive. To nie pozwala
odróżnić własnej siły od zewnętrznego ruchu zgodnego z komendą. Kopia checkpointu
zachowuje cały stan, także czas przerwy i wariant polityki. Powtórny tick nie dodaje dowodu.
Runtime v4 i jego occupant nie zmienione; ten epizod nie jest nowym default brainem.

## Przebiegi i wyniki
72 rzeczywiste przebiegi Rapiera: 8 rodzin × startowy kąt -0.2/0/+0.2 × 3 polityki.
Każdy podstawowy pomiar trwa 10 s. To trzy deterministyczne starty, nie dowód generalizacji.
Kolumny pokazują przybliżony kontakt z celem w 10 s / 3 starty, a w nawiasie średni
koszt sterowania: całka drive²+turn²+gazeRate², nie energia fizyczna.

| Scena | reactive | permanent | reconsider |
|---|---:|---:|---:|
| Nieruchoma, dystans 6 | 3/3 (.239) | 3/3 (.239) | 3/3 (.239) |
| Ruch poprzeczny .35/s | 3/3 (.263) | 3/3 (.263) | 3/3 (.263) |
| Oddalanie 2.5/s | 0/3 (.371) | 0/3 (.081) | 0/3 (.104) |
| Przeszkoda zasłaniająca | 0/3 (.118) | 0/3 (.118) | 0/3 (.118) |
| Druga podobna plama | 0/3 (.149) | 0/3 (.149) | 0/3 (.149) |
| Rzecz skorelowana z obserwatorem | 0/3 (.647) | 0/3 (.082) | 0/3 (.264) |
| Oddalanie przez 2 s, potem postój | 3/3 (.468) | 0/3 (.081) | 0/3 (.397) |
| Nieruchoma, dystans 11 | 3/3 (.470) | 0/3 (.178) | 1/3 (.421) |

Zapis: evidence/living-organism/approach-episode.json; źródło reprodukcji:
probes/living-organism-approach.ts. Po próbie dodatniej dodano dwa kontrprzykłady
(postój po ucieczce oraz dalszy dystans); nie zmieniono progów wzrostu/travel.
Ruch celów i przeszkód jest interwencją przez teleport, nie kwalifikacją naturalnej dynamiki.

## Co zostało podważone
Historia zmienia działanie i może ograniczyć bezskuteczne komendy, lecz nie daje tu
ogólnej poprawy. Trwałe porzucenie przegrywa z reaktywnym kontrolerem, gdy warunki
zmieniają się na korzystne. Reconsider wznawia, ale ponosi opóźnienie i fałszywe przerwy.
Osobny test potwierdza eventual recovery w 15 s dla startu centralnego; NIE liczymy go
jako sukcesu benchmarku 10 s. Pierwotne żądanie sukcesu reconsider w 10 s nie przeszło;
wydłużono wyłącznie osobny test ciągłości czynności, zostawiając podstawową porażkę.

Próg 1 jednostka/10% myli brak postępu z wolniejszym wzrostem odległej rzeczy i
kwantyzacją obrazu. Niezależny reviewer odtworzył porzucenie także przy dystansach 10/12.
Te warianty nie kwalifikują się do promocji do domyślnego sterownika. Nie dostrajamy ich
do tabeli; zachowujemy jako słabe comparatory i zestaw przypadków dla challengera.

Każda polityka dotknęła przeszkody w scenie occluded i zatrzymała epizod. To nie jest
odzyskanie widzenia ani osiągnięcie rzeczy. Private touch nie zna ID collidera. Ocena
hosta używa range <=1.63 jako tolerancji dla sumy promieni1.6; nie jest zapisem dokładnej
pary kontaktowej i nie wystarcza do oceny selektywności przy gęstych obiektach.

Korespondencja pozostaje krucha: podobna lub zastępująca plama może udawać ten sam
fragment. Stan capture/restore jest checkpointem kontrolera; testy z tym samym światem
nie dowodzą osobnego fizycznego replay całego nowego eksperymentu.

## Walidacja i najbliższa pętla
Testy powstały przed implementacją modułu (RED: missing module). Reconsider powstał
po RED braku ponowienia; jego zbyt mocne oczekiwanie10s ujawniło realną granicę.
Sześć testów: stationary contact, brak postępu, zewnętrzny ruch przy braku obrazu,
nonempty history restore/repeat read, eventual recovery15s oraz paused restore/retry.
Niezależny przegląd potwierdził brak host knowledge leak i duplicate-frame advancement,
a także wskazał kontrprzykłady i ograniczenia. Render QA nie wykonane.

Następny etap powinien badać:
1. Oddzielenie dotyku jako przerwania od realizacji zamierzonej czynności; host rejestruje
   faktyczne pary kontaktowe, lecz kontroler nadal nie dostaje ID.
2. Niepewność przy zmianie angular extent: historia z zakresem błędu i kalibracją na
   odległych/małych plamach. Nie dodawać kolejnego progu pod trzy znane starty.
3. Challenger przewidujący bearing/extent/visibility z prywatnej historii; rozdzielić
   całe trajektorie train/test. Ocena obejmuje także wrongful abandonment i opóźnienie,
   nie tylko oszczędność komend. Pokazać modelowi zarówno osiągalny daleki cel, jak i
   pozorne zbliżanie; nie etykietować każdego małego wzrostu jako porażki.
4. Dopiero lepszy, sprawdzony wybór czynności uzasadnia wpięcie w ciągły organizm.
   Osobne Concern/LLM/NN pozostają wymienialne; bieżący epizod nie definiuje całej wizji.

Końcowa pełna kontrola: 34 pliki, 89 testów, typy i build PASS. Stan pozostaje eksperymentalnym checkpointem; nie merge ani promocja domyślnego brainu.
