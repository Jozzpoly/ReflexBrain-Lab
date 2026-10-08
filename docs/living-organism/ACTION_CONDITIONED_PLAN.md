# Kontrola komendy utrzymywanej — 2026-10-09

Cel organizmu: przewidywać następstwa własnych możliwych działań, z prywatnych
zmysłów, tak by później poprawić decyzję. Ten etap nadal nie wybiera działań.

Po ujemnym wyniku varied-motor rozdzielamy dwa problemy: prognozę pod nieznanymi
przyszłymi komendami i prognozę po utrzymaniu zadanej komendy przez0.2s.
Hipoteza: mieszanie tych etykiet szkodzi uczeniu action-conditioned modelu.
Nie zakładamy, że jest jedyną przyczyną wcześniejszej regresji.

Przed wynikiem ustalone: static/lateral,12 train +6 eval przebiegów po6s, rozłączne
seedy; pseudolosowe segmenty motoru0.4s z niezależnymi kanałami. Co12 ticków zapis
fizyki i dwie gałęzie po24 ticki: dalszy harmonogram oraz bieżąca komenda utrzymana.
Obiekty obu gałęzi zachowują ten sam harmonogram ruchu, bez external push.
Host checkpoint i handle służą tylko uruchomieniu świata; features/labels wyłącznie
PrivateFrame, jak wcześniej. Dla obu gałęzi wspólna maska single/unclipped wszystkich
klatek i osobna liczność odrzuceń. Normalizacja oraz ridge lambda.001 wyłącznie train.

Porównania na tych samych oknach: frozenOld, model train scheduled, model train held,
body/gaze oraz hold. Raport: wszystkie okna i okna przekraczające zmianę komendy;
MAE bearing/log extent, per-episode, różnica samych prywatnych etykiet gałęzi.
Sprawdzić gałąź scheduled względem oryginalnego przebiegu oraz brak mutacji oryginału.
Jeżeli kontrola nie pomaga, zachować wynik bez retuningu. To mały nowy generator,
nie szeroka generalizacja. Nawet poprawa nie kwalifikuje brainu, ID czy motywacji.

## Następna kontrola decyzji (ustalona po pierwszym wyniku, przed jej odczytem)
Przewidywanie held dało .00721 vs body/gaze .01306 rad. Sprawdzamy tylko lokalny wybór
spośród9 komend: drive.12, turn{- .12,0,.12}, gazeRate{- .15,0,.15} utrzymane0.2s.
Cel autorski: minimalizować bezwzględny przyszły bearing pojedynczego fragmentu.
To test organu wyboru czynności, nie motywacja organizmu. Nowe seedy201..203,
static/lateral/reversal ×3 przebiegi po6s. Model i scaler zamrożone z poprzedniego
train; nie dopasowywać wag na tych próbach. Co24ticki stan biernego harmonogramu,
9 identycznych restore-fork; learned/body-gaze/reactive wybierają bez czytania wyników.
Ocena osobno: prawdziwy prywatny przyszły |bearing|, regret względem najlepszej gałęzi,
liczba wygranych per episode. Wspólna maska wszystkich9 widocznych gałęzi — podać
straty, nie udawać kompetencji visibility. Reactive minimalizuje bieżący bearing minus
zmiana gaze; body/gaze dodatkowo uwzględnia obecną omega. Przed odczytem wyniku doprecyzowano remisy: najmniejsze |turn|, potem stały
porządek komend. Bez tego baseline ignorujący turn wybierałby arbitralnie skręt-.12. Runtime nadal bez zmian. Brak sukcesu bez przewagi
nad silniejszym body/gaze na tych samych stanach. Ranking to nie closed-loop wynik.

## Kontrola ciągłej pętli (po ranking, przed wynikiem pętli)
Ranking pokazał praktycznie identyczną jakość full/noHistory/motorOnly. Nie przypisujemy
zysku historii. Teraz12 nowych scen (static/lateral/reversal/occlusion ×3 starty,
seedy401..403),12s każda,3 polityki full/motorOnly/bodyGaze. Od tick24 wybór co24ticki,
te same9 komend i tie-break. Każda polityka generuje własną trajektorię.
Brak fragmentu/ambiguous/clipped zatrzymuje motor. To ograniczenie widzenia, nie sukces.
Średni |bearing| liczymy także z karą pi/2 dla każdej niedostępnej próbki, osobno
coverage i bearing warunkowy; sensoryczne touch liczymy osobno. Cel nadal autorski.
Wagi zamrożone. Nie zmieniać parametrów po wynikach, nie promować do runtime automatycznie.
