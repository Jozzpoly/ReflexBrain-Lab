# Własny ruch, historia i granica kontaktu — 2026-10-09

## Cel i odzyskany kontekst

Współpraca przeszła od odkrywania możliwości Work na telefonie i PC do ReflexBrain: organizmu w fizycznym środowisku, z prywatnym wzrokiem, dotykiem i propriocepcją oraz szybkim, wielopoziomowym sterowaniem. Sieć neuronowa i mini-LLM są kandydatami na elementy, nie celem samym w sobie. Użytkownik powierzył samodzielne rozwijanie i krytyczne sprawdzanie tej wizji. Widoczna historia zawiera wiele poleceń kontynuacji; nie jest dowodem jakości wcześniejszych implementacji.

Stan projektu: fizyczny świat i prywatne zmysły działają; domyślne czynności nadal są autorskimi regułami. Kolejne kampanie sprawdziły geometrię wzroku, prognozy sensoryczne, następstwa własnych komend, przerwanie po dotyku i hamowanie. Korzyść kalibracji istnieje, lecz lepsze prowadzenie własnych spraw przez organizm pozostaje nieudowodnione. Prognoza, centrowanie obrazu i mała prędkość przy ścianie nie zastępują materialnego wyniku.

## Protokół i wynik modelu

Plan: BODY_MODEL_PLAN.md. Istniejący ridge, lambda .001, skalowanie tylko na train. Prywatne wejścia: bieżąca prędkość, prędkość sprzed czterech ticków, własna poprzednia komenda, komenda rozważana. Pięć kandydatów, horyzont 24 ticki przy fizyce 120 Hz. Uczony model nie otrzymuje siły środowiska, pozycji ani kontaktów hosta.

10 epizodów train, 6 test i 6 stress; 858 stanów / 4290 fizycznych forków. Źródłowa fizyka i prywatna klatka nie zmieniły się podczas forków. Wyboru dokonuje prognoza przed odczytem przyszłej etykiety. Stress zmienia siłę, ale współdzieli seedy i początkowe trajektorie z testem: nie jest niezależnym holdout.

| Test | Historia | Bez historii | Analityczny z resztą |
|---|---:|---:|---:|
| MAE prędkości, m/s | .03662 | .15514 | .000000845 |
| Rzeczywista przyszła prędkość po wyborze, m/s | .08557 | .17943 | .07992 |
| MAE w stress, m/s | .10930 | .18535 | .06114 |

Historia pomaga rozpoznać utrzymujące się nieznane wymuszenie w swobodnym ruchu. Mocny konkurent analityczny zna stałe własnego ciała, a wymuszenie szacuje z prywatnej historii; wygrywa prognozę i wybór na wspólnych stanach. Nie ma dowodu przewagi uczenia nad tym konkurentem. Próba jest jednowymiarowa; wyjście omega jest zerowe, bez kwalifikacji skrętu.

## Rzeczywista pętla i porażka przy ścianie

48 przebiegów po 12 s, cztery zamrożone polityki, trzy siły, profil stały lub zmienny oraz swobodny świat lub dwie bliskie ściany. Sterowanie korzysta tylko z prywatnych danych; pozycja i kontakty hosta służą pomiarowi. To autorski cel redukcji prędkości, nie autonomiczna motywacja.

W swobodnej pętli średnie |v|: historia .10844, bez historii .17649, analityczny z resztą .11966 m/s. Lepsza pętla historii niż dokładniejszego analitycznego modelu nie dowodzi lepszego modelu fizyki: dyskretne działania, krótki horyzont i błąd modelu zmieniają sterowanie.

Przy ścianach historia pogarsza tylny impuls z 55.45 do 169.14 względem wersji bez historii. Analityczny model z resztą również zawodzi: 201.06. Kontakt unieważnia założenie modelu swobodnego ruchu; zatrzymane ciało może prowadzić do błędnej interpretacji wymuszenia. To prawdopodobny mechanizm, nie pełna identyfikacja wszystkich przyczyn.

## Eksploracyjny szybki próg dotyku

84 przebiegi: 48 oryginalnych kontroli i 36 wariantów. Prywatny dotyk > .001 zeruje komendę na kadencji sensorycznej 4 ticki i wstrzymuje wybór wolniejszego modelu. Wagi pozostają zamrożone. Wszystkie 48 kontroli oraz 18 swobodnych odpowiedników zachowały dokładne metryki i ślady decyzji.

| Ściany, model z historią | Bez progu | Z progiem |
|---|---:|---:|
| Średni impuls przodu | 13.80 | 69.52 |
| Średni impuls tyłu | 169.14 | 46.59 |
| Suma obu | 182.94 | 116.10 |
| Średnie |v|, m/s | .01121 | .01404 |
| Droga, m | .13861 | .17353 |

Łączny impuls maleje o około 36.5%, ale przód, prędkość i droga się pogarszają. Wynik pochodzi ze znanych już problematycznych scen: eksploracja, nie niezależna kwalifikacja. Brak dotyku teraz nie dowodzi ważności modelu swobodnego ruchu. Zerowa komenda nie usuwa pędu ani zewnętrznego nacisku. Próg nie planuje wyjścia ani powrotu do czynności. Nie promować do runtime.

## Weryfikacja i następna kampania

Wszystkie trzy headless probes wykonane. Niezależny review sprawdził kolejność informacji, poprzednią własną komendę i brak host-truth w sterowaniu. Poprawiono opis zakresu w artefakcie progu: prywatny dotyk rzeczywiście steruje, host-attribution jest wyłącznie pomiarem. Pełny check: 113 testów, typy i build. Interaktywny render i doświadczenie użytkownika nie były w tej kampanii sprawdzane.

Następny etap powinien przenieść wynik z izolowanych prognoz do jednej ciągłej czynności: żądanie ruchu, zakłócenie, przerwanie, odzyskanie możliwości ruchu i wznowienie. Najpierw zamrozić silnych konkurentów i ustalić nowe sceny, potem badać granicę ważności modelu oraz następstwa wznowienia. Mierzyć wykonany ruch, kontakt i utraconą aktywność razem; nie premiować bezruchu jako sukcesu. Nie dokładać kolejnych timerów bez obalenia prostszej alternatywy. Rozwój 2D i wzroku pozostaje potrzebny, ale obecny model 1D nie kwalifikuje tych zdolności.

Artefakty: body-model.json, body-loop.json, body-contact-gate.json oraz odpowiadające im probes. Produkcyjny runtime i occupant nie zmienione.
