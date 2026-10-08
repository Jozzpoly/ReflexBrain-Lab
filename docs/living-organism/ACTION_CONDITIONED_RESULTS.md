# Uczenie następstw własnej komendy — 2026-10-09

**Wniosek:** uczona kalibracja motoru poprawiła krótkie sterowanie wzrokiem.
Bardziej rozbudowany model z historią nie poprawił decyzji ponad tę kalibrację.
Runtime i domyślny organism brain pozostają bez zmian. Nie wykazano nowej motywacji,
rozpoznawania rzeczy ani materialnego sukcesu. To nie NN/LLM, tylko ridge.

## Bogatszy trening nie rozwiązał problemu
75 epizodów:48 train,21 test,6 stress. Nowe trajektorie, frozenOld wagi z poprzedniej
kampanii. Na tych SAMYCH nowych oknach bearing MAE:

| Model | Test | Stress |
|---|---:|---:|
| Frozen stary | .01038 | .01769 |
| Bogatszy motor train | .01257 | .01953 |
| Body/gaze | .01251 | .01746 |

Drugi probe diagnostyczny użył tych samych trajektorii, osobno smooth-only/piecewise-only.
Smooth-only .01057/.01421; piecewise-only .01474/.02227. To analiza po wyniku, bez
nowego qualification set. Zmieniają się również seedy; nie izoluje samej zmienności.
Przed zmianami motoru wszystkie metody cierpią, bo bieżąca komenda nie ujawnia następnej.
Nie strojono lambda i nie zastąpiono starych porażek korzystniejszym wynikiem.

## Rozdzielenie kontraktów przyszłego działania
18 nowych epizodów:12 train,6 test. Dwa restore-fork z każdego z1044 stanów:
harmonogram motoru i utrzymanie bieżącej komendy0.2s. Etykiety z przyszłej prywatnej
retiny, bez hostrange/ID. Wszystkie1044 scheduled endpoints dokładnie zgodne z dalszym
oryginalnym przebiegiem; source frame i physics bytes niezmienione przez fork.
Zero masek, branch-specific rejection counts zachowane;348 wspólnych okien testowych.

| Prognoza held | Bearing MAE | Log extent MAE |
|---|---:|---:|
| Body/gaze | .01306 | .06209 |
| Frozen stary | .01783 | .07653 |
| Uczona na scheduled labels | .01188 | .05172 |
| Uczona na held labels | .00721 | .05112 |
| Held bez dwóch cech historii | .00751 | .05949 |
| Held tylko omega/gaze/turn/gazeRate | .00901 | .06097 |

Held pełna bije body/gaze i scheduled-trained w6/6 testowych epizodów. To tylko3
seedy motoru powtórzone w2 rodzinach;348 nakładających się okien nie jest348 niezależnymi
próbami. Modele trenowane na wspólnych wierszach i tych samych train-only scaler rules.

Na84 oknach przekraczających zmianę komendy prywatne bearing labels obu gałęzi
różnią się średnio .04478rad. Dla scheduled przyszłości model scheduled ma MAE
.03862, hold .03721, model held .04534. Nie rozwiązaliśmy przyszłych nieznanych działań.
Dopasowanie kontraktu jest istotne, ale nie jedyna możliwa przyczyna wcześniejszej regresji.

## Czy model wybiera lepiej czynność?
Nowe9 epizodów /261 stany /2349 przyszłych gałęzi. Dziewięć stałych kandydatów drive.12,
turn±.12/0,gazeRate±.15/0. Wagi zamrożone, seed201..203, static/lateral/reversal.
Przed czytaniem futures każda metoda wybiera minimum przewidywanego |bearing|.
Remis: mniejsze |turn|, potem stały porządek. Host rollback tylko uruchamia fizykę.
Source physics/frame invariance kontrolowana. Brak odrzuconych stanów wspólnej maski9 gałęzi.

| Wybór | Prawdziwy przyszły bearing absolutny | Regret wobec najlepszej gałęzi |
|---|---:|---:|
| Pełny learned | .17948 | .00164 |
| Bez historii | .17939 | .00156 |
| Tylko motor | .17948 | .00165 |
| Body/gaze | .19880 | .02097 |
| Reactive gaze | .19924 | .02141 |

Pełny model wygrywa z body/gaze9/9, ale z motor-only:1 wygrana,6 remisów,2 porażki.
Z no-history:2/5/2. Początkowy zysk nad body/gaze NIE dowodzi wartości sensorycznej historii.
Dodatkowe ablations dodane po pierwszym wyniku; nie retunowano wag pod ranking.
Linear additive ridge ma stały gain komend — nie modeluje interakcji komendy ze stanem.
To lokalna authored czynność centrowania, nie closed-loop ani samodzielny cel organizmu.

## Ciągła pętla podważa mocniejszy brain
12 nowych scen ×3 polityki ×12s: static/lateral/reversal/occlusion, seed401..403.
Każda polityka produkuje własną trajektorię. Model i scaler nie refitowane.
Komenda utrzymywana24ticki, decyzje używają prywatnych frame tick-4/current.
Missing/ambiguous/clipped -> zerowa komenda; istniejący pęd może trwać.
Koszt: |bearing|, a dla niedostępnego obrazu pi/2. To autorska metryka, nie dobrostan.
Każdy przebieg359 próbek z tick4..1436; końcowa próbka1440 poza oknem pomiarowym.

| Polityka | Koszt z karą braków | Coverage | Touch-positive windows |
|---|---:|---:|---:|
| Pełny learned | .08435 | .95822 | 788 |
| Kalibracja motor-only | .08004 | .95822 | 1005 |
| Body/gaze | .10438 | .95822 | 587 |

Pełny przegrywa z motor-only7/12, wygrywa3, remisuje2. Coverage takie samo także
w każdej pojedynczej scenie. Więcej touch-positive windows przy kalibracji nie oznacza
więcej odrębnych kolizji, obrażeń ani sukcesów; liczba nie kwalifikuje bezpieczeństwa.
Centrowanie rzeczy nie jest wystarczającym kryterium materialnej czynności.

## Decyzja i następny ruch
Nie rozbudowywać NN tylko po to, by wygrać obecny prosty cel. Zachować mały uczony
model reakcji motoru jako wymienialny klocek. Następny ważny problem to przerwanie
po touch i sprawdzanie następstw bez terminalnego success/contact i bez porzucenia
czynności na zawsze. Musi porównać koszt, ponowienie i obcy kontakt, nie sam obraz.
Plan: ACTION_CONDITIONED_PLAN.md. Pięć repro probes oraz siedem evidence artifacts
w katalogach probes/ i evidence/living-organism/; wagi stare nie nadpisane.
Trajektorie closed-loop mają sensoryczne hashe i patch/proprio/touch summaries;
pełną retinę można odtworzyć deterministycznym probe. Model provenance zapisany hashem.
Niezależny review sprawdził split, timing, źródła features, fork i zakres wniosków;
uwagi o branch counts, physics invariance i remisach uwzględnione.
Pełny check:37 plików /99 testów, typy/build PASS. Probes wykonane headless.
RenderQA i Owner experience nadal niekwalifikowane; nie publikowano frontdoor.
