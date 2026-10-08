# Pierwszy uczony challenger sensoryczny — 2026-10-08

Cel: porównać uczoną predykcję sensorycznych następstw z prostą i analityczną,
bez dalszego odkładania uczenia oraz bez ogłoszenia gotowego brainu.

## Kontrakt i plan wykonania
Model to ridge regression z normalizacją cech wyłącznie na train. Nie jest NN ani LLM.
Regresja jest pierwszym uczonym baseline dla przyszłej małej sieci; nie zakładamy,
że bardziej złożona architektura poprawi organizm. Lambda=.001 zamrożona przed pomiarem.

Wejście: dwa ostatnie pojedyncze, nieucięte fragmenty z osobnych PrivateFrame,
prędkości angular bearing/log extent przeskalowane do horyzontu .2s, bieżące bearing,
log extent, proprio forward/lateral/omega/gaze oraz własna bieżąca komenda motoru.
Wyjście: delta bearing i delta log extent po24 tickach. Żadnych XY/ID/range/contact hosta.
Klasy missing/ambiguous/clipped są maskami; na tym etapie nie przewidujemy ich klas.
To predykcja warunkowa na porównywalny fragment, nie tracker tożsamości ani głębokość.

1. Testy RED→GREEN dla treningu na znanej zależności i predykcji na nowych wejściach,
   niezależności danych capture/restore oraz odrzucania niepoprawnych danych.
2. Model uczony i ekstrakcja cech. Fit nie ma dostępu do eval; scaler także tylko train.
3. Fizyczne przebiegi: train4 rodziny ×6 konfiguracji; test te rodziny ×3 nowe konfiguracje,
   plus unseen reversal/occlusion/similar ×3. Całe episode IDs rozłączne, horyzont8s.
   Parametry train/test różnią się odległością/rozmiarem/startem/dynamiką; świat i zmysły te same.
4. Baseline hold, linear sensory velocity oraz PrivateVision stationary projection.
   Ta ostatnia ma osobny zakres dostępności; porównać wspólny podzbiór i podać fallback.
5. Raportować każdą rodzinę, bearing MAE i log extent MAE, odrzucone maski, liczbę
   przykładów i rozmiar modelu. Nie ukrywać OOD porażki w średniej.
6. Zapis wag, manifest splitu, repro probe, świeży pełny check i niezależny review.
   Bez zmiany runtime, motoru i publikacji frontdoor.

## Krytyka przed pomiarem
Losowe klatki dałyby wyciek niemal tej samej historii. Całe trajektorie nadal mogą
dzielić generator i authored kolor; to nie dowód szerokiej generalizacji. Dwa podobne
fragmenty nie tworzą ID. Cechy są autorską obróbką retiny, nie uczonym wzrokiem.
Przyszłe komendy mogą zmieniać się w horyzoncie; bieżąca komenda nie ujawnia ich planu.
Maskowanie może usuwać najtrudniejsze zdarzenia, dlatego osobno raportujemy braki.
Celowo skorelowany ruch rzeczy pozostaje adversarial fixture, nie naturalny motion prior.
Niższy błąd predykcji nie oznacza lepszej decyzji, samoistnej motywacji ani życia.

Następne wpięcie do działania wymaga poprawy ważnej decyzji na nowych przypadkach,
zwłaszcza false abandonment, wznowienia i sprawdzania następstw kontaktu. Jeżeli challenger
nie pokona prostego sensory velocity, nie dajemy mu wpływu na motor tylko dlatego,
że jego współczynniki są wyuczone.

## Wykonany etap i wynik
Wdrożono SensoryRegressor oraz sensoryFeatures/sensoryTarget. Testy najpierw RED
(brak modułów), potem GREEN. Dodatkowe RED wykazały brak sprawdzania horyzontu
etykiety i wadliwych restored weights; oba przypadki zabezpieczone. Wagi i normalizacja
mają niezależne capture/restore. Model pełny: 11 cech, 24 współczynniki oraz22 wartości
skalera, czyli46 liczb. To mały uczony element predykcyjny, nadal bez motor integration.

51 rzeczywistych przebiegów Rapiera po8s: 24 train, 21 test, 6 późniejszych stress.
Train: 5091 przykładów. Test: 3472 przykładów z4914 możliwych okien;1442 odrzucone
przez maski. Stress: 1022 z1404 okien. Okna nakładają się, nie są niezależnymi próbami.
Manifest episode IDs, parametrów, liczności i hashy danych znajduje się w artefakcie.
Wagi, scaler i lambda nie korzystają z eval. Wzrok/ekstrakcja cech pozostają authored.

Średni błąd przyszłego bearing w radianach, horyzont0.2s:

| Predykcja | Test21 przebiegów | Stress6 przebiegów |
|---|---:|---:|
| Niezmieniony obraz | .03813 | .04775 |
| Ostatnia sensory velocity | .04739 | .04764 |
| Kompensacja body/gaze | .01285 | .02687 |
| Uczona ridge pełna | .01130 | .03769 |
| Uczona bez dwóch cech historii | .01157 | .03643 |
| Uczona tylko appearance/history | .02866 | .03600 |
| Stationary geometry lub hold | .03402 | .01806 |

Na wspólnym podzbiorze1258 testowych okien z dostępną geometrią: ridge .01134,
geometry .03369, body/gaze .01617. Geometry coverage1258/3472; poza coverage baseline
jawnie korzysta z hold. Wszystkie metody mają te same okna oceny.

Pełna ridge ma testowy log-extent MAE .06675 przy hold .07500 i no-history .07054.
W stress: .05840 przy hold .06504, geometry .05638. Nie jest to błąd w metrach ani
skalibrowana pewność; świat obserwowany jest kwantyzowaną retiną.

## Podważenie korzystnej średniej
Pierwsze porównanie z hold wyglądało jak70% poprawy bearing. Po dodaniu body/gaze
przewaga wynosi tylko około12%; po ablacji historii różnica około2% bearing i5% log
extent. Te dodatkowe kontrole dodano po pierwszym odczycie; progi/model nie strojone
pod wynik. Raport nie udaje prerejestrowanego potwierdzenia przewagi historii.

Ridge pokonała body/gaze w14/21 pojedynczych testowych przebiegów, ale tylko2/6 stress.
Rozpiętość bearing MAE ridge na test .00505–.02285, na stress .01059–.07247.
Body/gaze w stress .01573–.03394. To opis generatora i małej liczby scen, nie istotność
statystyczna czy niezależne3472 dowody.

Nagła zmiana motoru (3 przebiegi, rodzina dodana po pierwszym pomiarze): ridge .05510,
body/gaze .03157, geometry/fallback .01925. Wyuczone korelacje łagodnej polityki
nie kwalifikują się do swobodnego działania. External push: ridge .01741, geometry
.01667, body/gaze .02139. Ponowne dopasowanie nie używało żadnych przykładów stress.

Maski usuwają widoczne zasłonięcia, wielość i clipping również w środku horyzontu.
Nie nazywamy tej oceny kompetencją przechodzenia przez occlusion ani rozpoznania ID.
Model przewiduje warunkową zmianę wyglądu; nie przewiduje klasy visibility. Część
obiektów mogła się fizycznie poruszać i zmieniać kontakt; labels nadal pochodzą tylko
z przyszłej retiny. Bieżąca komenda nie ujawnia następnych komend w horyzoncie.

## Decyzja i dalsza kampania
Nie włączono modelu do istniejącego runtime; checkpoint v5 i occupant nie zmienione.
Warto zachować ten challenger jako wyuczony baseline i jawny kontrprzykład OOD.
Następny uczony model musi dostać bogatszy repertuar własnych czynności na train,
po czym mieć NOWE trajektorie i zmiany na test. Włączenie dotychczasowego stress do
train i ponowne pokazanie poprawy na nim nie byłoby naprawą kwalifikacji.

Przed rozbudową NN: porównać dobrze dobrane proste cechy/filtr historii, przetestować
różne skale fragmentów i odróżnić ruch kamery od ruchu rzeczy. Następnie wrócić do
touch-interruption i decyzji o sprawdzaniu następstw: ważna jest strata błędnego
przerwania/wznowienia, nie sam MAE. Uczony moduł ma być wymienialny organ brainu;
ten benchmark nie ustanawia definicji organizmu ani nowej motywacji.

Niezależny review nie znalazł blokującego błędu fit/split/leakage. Zwrócił uwagę na
zależne okna i niewielką przewagę wobec mocniejszych baseline; dodano wyniki per
episode i granice kwalifikacji. Pełny check:37 plików /99 testów, typy/build PASS.
RenderQA nadal nie wykonane. Reprodukcja: probes/living-organism-learned-prediction.ts.
Dane: evidence/living-organism/learned-prediction.json; pełne wagi:
evidence/living-organism/sensory-regressor-weights.json.
