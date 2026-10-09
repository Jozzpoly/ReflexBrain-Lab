# Odzyskanie kierunku i prywatny model ruchu — 2026-10-09

Cel rozmowy: organizm w materialnym świecie, z własną ciągłością czynności i wymienialnym
wielopoziomowym brainem. Neuron, mały LLM czy ridge są kandydatami, nie definicją celu.
Dotychczas wykonano ciało/zmysły, autorską eksplorację, prywatną geometrię/predykcję,
epizody zbliżenia, rzeczywistą ocenę contact, uczone prognozy i regulatory przerwania.
Uczona kalibracja motoru pomaga; historia wzroku nie poprawiła ważnej decyzji. Contact
nie oznacza sukcesu. Quiet ogranicza napieranie; backoff/brake przenosi część kontaktów.
Default occupant nadal autorski. Warsztat Przemka i własne sprawy organizmu nieuzyskane.

Ryzyko flow: rozrost benchmarków i odruchów może zastąpić rozwój zachowania. Nie będziemy
promować komponentu tylko dlatego, że ma wyuczone wagi. Obecna próba ma zbadać potrzebę
historii w decyzji materialnej, zanim zaczniemy większy brain lub kolejne wyjątki.

Ustalono przed wynikiem: tylko swobodny ruch1D, torque0, horyzont24ticki. Cechy historyczne:
current forward,previous forward(tick-4),previous own drive,candidate drive. Ablacja:
current forward,candidate drive. Wyjścia: future private forward/omega. Hostforce nie
jest cechą/etykietą; służy wyłącznie fizycznym fixtures. Ridge lambda.001 i train-only scaler.
Train10 epizodów8s:force{-3,-1,0,1,3}×2 seed. Eval6:force{-2.2,.7,2.4}×2 nowe seedy.
Stress6:te same początkowe force, znak zmieniany co1.1s w fizyce. Future zmiana siły
niewidoczna dla modelu; nie udawać zdolności jej antycypacji.

Co24ticki:5 gałęzi held-drive{-.2,-.1,0,.1,.2} po24ticki z tego samego snapshotu.
Samoistny harmonogram source motoru deterministyczny, losowany w segmentach. Model
predict wybiera najmniejsze |future velocity| PRZED czytaniem futures. Wspólne stany.
Mocne baselines: passive current velocity; analityczny model znanej własnej dynamiki;
analityczny residual z historycznej prędkości i własnej komendy, bez czytania force.
Body constants są authored prior tego baseline; uczony model ich nie otrzymuje.
Osobno MAE, stop-cost i regret najlepszej gałęzi, per episode i stress.
Nie stroić modelu po wyniku. Stan/fizyka source nie zmieniane przez gałęzie.

Jeżeli historia pomoże: następna kontrola w ciągłej pętli, potem dopiero kontakt/zmiana
dynamiki. Nie włączać prostego wolnoprzestrzennego modelu do regulatora kolizji na podstawie
MAE. Ta próba nie ustanawia nowego celu organizmu ani sensorimotor competence w2D.

## Kontrola ciągłej pętli po wyniku forecast
History poprawia eval velocity MAE .15514->.03662 i matched stop-cost .17943->.08557.
AnalyticResidual daje~8.45e-7 MAE i0regret; wagi nie mają nad nim przewagi.
Następna próba ustalona przed odczytem:6 nowych force profiles ×4 polityki
(history/noHistory/analyticFree/analyticResidual),12s. Force stała .8/-1.7/2.1 oraz
odwrócona w t2.3/6.7; geometry wolna oraz constrained (frontwallx1.1,rear-1.08,hx.05).
Łącznie48 przebiegów. Celem autorskim jest mała własna forward velocity, nie sukces
czynności ani unikanie ścian. Te same5 drives, decyzja co24ticki, initialdrive0.
History: aktualny/previousframe4ticks i własna ostatnia komenda. Wagi/scaler frozen.
Raport średnie|velocity|, droga/drift, rzeczywiste target-less contact impulses osobno
front/rear i decyzje. Kontakt może zależeć od komendy, więc residual siły nie musi
zachowywać się jak stała externalforce. Zachować tę granicę, nie dopasować na walls.

## Granica modelu: kontakt (po wyniku loop)
Free history|v| .10844 vs noHistory .17649; analyticResidual .11966 w dyskretnej pętli.
Przy walls history rear impulse169.14 vs noHistory55.45; analyticResidual201.06.
Brak ruchu przy własnej komendzie może być błędnie uznany za utrzymywaną zewnętrzną siłę,
bo model trenowano bez ograniczeń. Cel małe|v| sam nie wykrywa tego błędu: ściana zatrzymuje.
Zachowujemy48 oryginalnych prób. Nowy probe84 prób:wszystkie48controls +36variants,
contact guard na history/noHistory/analyticResidual. Kiedy aktualny private touch>.001,
komenda drive0 ma priorytet (sensor4ticki), bez terminalnego success. Po wygaśnięciu
wraca zwykły dobór co24ticki. To gate zakresu stosowalności free modelu, nie planner.
Mierzyć contact impulses, |v|, exposure i takie same controls. Wariant dodany po wyniku;
nie jest fresh independent qualification. Nie trenować wag ponownie pod guards.
