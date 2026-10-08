# Dotyk bez terminalnego sukcesu — 2026-10-09

Wprowadzono eksperymentalny TouchInterruption poza default runtime. Authored regulator
przerywa własną komendę, obserwuje dalszy touch, ponawia upstream intent i opcjonalnie
wycofuje. Nie zna ID, XY, koloru ani celu; nie rozpoznaje przyczyny kontaktu.
Nie deklaruje success/contact terminal. To prywatny szybki regulator, nie learned brain.

## Pierwszy benchmark: mniej napierania, brak kwalifikacji wycofania
36 nowych scen ×2 polityki ×18s, frozen motor-only centering. Obie mają te same
początkowe warunki; późniejsze trajektorie zależą od polityki.539 sensory samples
na scenę, tick4..2156. Host rzeczywiste contact pairs służą ocenie, nie sterowaniu.

| Metryka | Continuous | Interruption |
|---|---:|---:|
| Touch-positive sensory windows | 6237 | 655 |
| Suma impulse z turkusowym target | 296.33 | 70.56 |
| Suma impulse z innymi colliderami | 22.66 | 5.21 |
| Coverage | .65698 | .65693 |
| Penalized bearing | .55035 | .54960 |
| Średnia droga | 6.502 | 4.920 |
| Średni koszt drive-command | 1.403 | .949 |
| Wznowienia upstream | 0 | 266 |

Touch windows nie są liczbą odrębnych zderzeń. Mniejszy impulse i droga nie dowodzą
lepszej materialnej czynności. Obstacle i similar nie podejmują ruchu, bo wzrok jest
od początku missing/ambiguous; rear-obstacle nie został dotknięty. Pierwszy zestaw
uruchomił0 wycofań. Korzystna średnia nie kwalifikuje backoff ani bezpieczeństwa.

## Mechanical challenge: wycofanie tworzy nowy kontakt
27 przebiegów12s: front-force/pinch-force/side-obstacle ×3 config ×3 polityki.
Stała upstream drive.12, bez visual selection; externalforce .5/1.5/4 w front/pinch.
Quiet-only zachowuje automat i terminy, ale suppresses reverse actuation.
Counter withdrawal oznacza w tym ablation zamiar, a nie wykonanie ruchu.

Pinch-force rear impulse dla continuous i quiet-only wynosi0. Backoff:
- force.5: rear5.41, front6.40;
- force1.5: rear2.48, front5.84;
- force4: rear0, front40.01; wycofanie nie pokonuje perturbacji.

W side-obstacle: continuous front impulse23.2–23.5, droga w osi x~3.88.
Interruption impulse~2.99 i x~1.60. Redukcja napierania oznacza również brak dalszej
sprawności przejścia obok przeszkody. Ten regulator nie planuje objazdu.

Nominalny backoff42ticki przy fresh sensor co4ticki trwa44physics ticki. Tests
dopasowane do realnego cadence; nie retunowano parametrów po wyniku.
Baselines zamrożone w touch-interruption-baseline.ts; primary/control probes korzystają
z tego modułu. Capture/restore kopiuje stan, duplicate frames nie liczą dowodów podwójnie.
Fizyczny test porównuje oryginalną kontynuację częściowego quiet z restored fork.
Primary probe dodatkowo sprawdza deterministyczność dwóch restored forks.

## Opcjonalne anulowanie po przeciwległym touch
Wariant zachowuje początkowy dominujący sektor dotyku; podczas wycofania dowolny
nowy touch>.001 oddalony kołowo≥3/8 sektorów zeruje komendę i wraca do quiet.
Nie wnioskuje tożsamości przeszkody i nie zapobiega pierwszemu dotknięciu jej.
36 ponowionych mechanical runs: wszystkie27 kontroli +9 wariantu; znany zestaw,
nie unseen qualification. Force.5 rear impulse spada5.41 ->3.55,8 anulowań.
Force1.5 pozostaje2.48 i0 anulowań. Pozostałe wyniki kontrolne nie zmieniły się.

Osobny diagnostyczny ślad force1.5: backoff kończy się tick124 z vx=-.291;
rear touch pojawia się tick132, kiedy komenda już jest zerowa i tryb quiet.
Tak samo następne cykle. Ciało nie zatrzymuje się razem z zerową komendą.
Następny test ma sprawdzić hamowanie mierzonego ruchu, nie kolejne założenie o stop.

## Granice i zapis
Default runtimev5, occupant, World i sensory API bez zmian. Żadna polityka niepromowana.
Regulator może opóźniać czynność i zmniejszać przesunięcie przedmiotu. Nie rozpoznaje
materialnych następstw poza niedawnym touch ani nie odróżnia celu od przeszkody.
Nie należy traktować266 wznowień jako autonomicznej motywacji.

Tests: missing-module RED, potem4 assertion failures dla stub; restore mutation
wywołała2 failures,3 cancellation tests najpierw RED, potem GREEN. Pełny check:
38 plików /108 testów, typy/build PASS. Niezależny review potwierdził timing i brak
terminalnego sukcesu; wskazał kwantyzację44ticki, ryzyko reverse i granice forks.
Dane: touch-interruption.json, touch-challenge.json, touch-cancellation.json,
touch-cancellation-lag.json. Repro probes o odpowiednich nazwach. RenderQA otwarte.
