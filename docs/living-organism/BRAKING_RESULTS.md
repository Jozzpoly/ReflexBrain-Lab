# Przerwanie komendy a pęd ciała — 2026-10-09

**Wynik:** opcjonalne hamowanie proprioceptywne usuwa część późnych kontaktów z tyłu,
lecz może zwiększyć impulsy z przodu. Regulator pozostaje eksperymentalny, poza runtime.
Wariant nie nauczył się celu ani przyczyny kontaktu; to autorski szybki odruch.

## Kontrakt i implementacja
TouchInterruption(cancelOppositeTouch,brakeAfterBackoff), obie opcje domyślnie false.
Po końcu/cancellation backoff mierzy prywatne forward velocity. Jeśli prędkość w
kierunku wycofania>.03, przeciwny drive.12 do wygaśnięcia tego ruchu lub deadline30ticków.
Rzeczywisty deadline na cadence4ticki może trwać32ticki; potem quiet60.
Koniec oznacza stary kierunek ruchu<=.03, nie gwarantuje zerowej prędkości całego ciała.
Touch, proprio, własny wcześniejszy drive i historia trybu są jedynymi wejściami.
Nie zerujemy velocity ani nie usuwamy externalforce. Brak terminalnego success.
Capture/restore zachowuje kierunek hamowania, deadline, opcje i liczniki timeoutu.

## Poprzednie kontrole zachowane
45 przebiegów mechanical12s: wszystkie36 poprzednich warunków/control oraz9 braking.
Programowo potwierdzono DOKŁADNĄ zgodność10 metryk każdej z36 powtórzonych kontroli,
m.in. impulse, touch, cost, położenie i coverage. Nie zmieniono progów pod wyniki.
Oryginalne artifacts i source checkpoint84c8a85 pozostają dostępne.

| Pinch force | Wariant | Rear impulse | Front impulse |
|---|---|---:|---:|
| .5 | Wycofanie | 5.4115 | 6.3957 |
| .5 | Cancellation | 3.5502 | 6.8976 |
| .5 | Cancellation + brake | 3.5502 | 6.8976 |
| 1.5 | Wycofanie/cancellation | 2.4826 | 5.8442 |
| 1.5 | Cancellation + brake | 0 | 9.4770 |
| 4 | Każdy wariant wycofania | 0 | 40.0127 |

Przy małej sile contact jest wcześniejszy niż hamowanie; po wykryciu prywatna prędkość
już nie jest w dawnym kierunku, więc brake nie uruchamia się. Pierwszego zderzenia
nie przewidujemy. Przy1.5 kontakt powodowany pędem po zerowej komendzie zniknął,
lecz przód dostał większy sumowany impulse. Przy4 reverse nie pokonuje externalforce.
31 uruchomień brake w całym zestawie,0 timeoutów. Nie jest to safety guarantee.

## Nowy, uprzednio ustalony holdout
18 przebiegów12s: front/pinch, frontwallx1.13,rearwallx-1.10,force.8/2.1/3.8,
trzy polityki wycofanie/cancellation/brake. Progi i amplitude nie refitowane.

| Pinch force | Backoff rear/front | Brake rear/front |
|---|---:|---:|
| .8 | 1.1378 /9.6775 | 0 /8.4964 |
| 2.1 | 0 /11.7266 | 0 /16.1688 |
| 3.8 | 0 /37.3447 | 0 /37.3447 |

To jedna nowa dodatnia kontrpróba dotycząca rear impulse, jedna regresja front impulse
oraz jeden brak różnicy. Nie18 niezależnych dowodów szerokiej generalizacji: wspólne
fixture generator i3 konfiguracje.40 brake attempts,0 timeoutów; nigdzie nie pojawia
się sukces czynności ani rozpoznanie dotykanej rzeczy.

## Obserwowalny dowód
[touch-braking.png](../../evidence/living-organism/touch-braking.png) powstał z rzeczywistych
próbek30Hz, nie z ilustracji. Wykres pokazuje x, własną forward velocity i drive przez
pierwsze4s fixture1.5. Czerwone znaczniki pochodzą z rzeczywistych host rear contact pairs,
użytych tylko do oceny. Wariant cancellation w tej scenie pokrywa się z baseline.
Pełne dane12s: touch-braking-trace.json. Figure sprawdzona wizualnie, bez nakładania etykiet.

## Weryfikacja i decyzja
3 nowe testy najpierw RED, potem GREEN: brake po reverse momentum, brake po nowym touch,
finite timeout. Dodatkowe testy obu znaków ruchu i restored physical mid-brake fork.
Mutation restore->no-op wywołała4 rzeczywiste failures; po przywróceniu pełny check:
38 plików /113 testów, typy/build PASS. Niezależny review: brak blokujących defektów
znaku, czasu i persistence; wnioski ograniczone do rozkładu impulsów, nie safety.

Default organism, occupant i runtimev5 niezmienione. Nie promować żadnego regulatora.
Wycofanie/hamowanie nie rozwiązuje przejścia obok ściany, rozpoznania przeszkody,
zachowania ciągłości czynności ani planowania przy persistent force.

Następny sensowny uczony klocek: model własnego ruchu i następstw komend z propriocepcji
oraz historii własnych komend, z oceną na nowych perturbacjach. Nie wybierać NN/LLM
przed mocnym prostym porównaniem. Powinien poprawić rzeczywistą decyzję o przerwaniu,
zrównoważeniu siły lub wznowieniu; nie tylko retinal MAE. Do porównania zatrzymać
obecne ridge i authored regulatory. Celu organizmu nie sprowadzać do visual centering.
