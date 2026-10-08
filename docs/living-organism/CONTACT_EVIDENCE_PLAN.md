# Kontakt jako zdarzenie, nie realizacja czynności — 2026-10-08

Cel najbliższego etapu: kwalifikować zdarzenia materialne bez pomylenia bliskości,
dotyku i intencji. Sterownik nadal ma tylko PrivateFrame. Host rejestruje rzeczywiste
pary colliderów z dodatnim impulsem kontaktowym w tej samej czterokrokowej paczce,
którą odwzorowuje prywatny touch. Nie dopisujemy tej wiedzy do brainu ani jego sukcesu.

## Kontrakt i wykonanie
1. LivingWorld.inspectContactSample() -> {tick, contacts:[{tick,handle,impulse}]}.
   Tick zdarzenia jest fizyczny; tick paczki zgadza się z observe().tick. Dodatni
   solver impulse oznacza impuls fizyczny, nie każdy bezimpulsowy geometryczny styk.
2. Osobno pendingContactEvents i opublikowany contactSample. Snapshot świata v3,
   runtime v5 zachowują oba; sensor API pozostaje bez handles.
3. Testy najpierw: odróżnienie celu/przeszkody, utrzymanie krótkiego impulsu,
   brak ponownego publikowania w kolejnej paczce, dokładna kontynuacja po restore
   przed publikacją, brak nowej wiedzy w PrivateFrame. Nie zmieniać fizyki.
4. Probe ocenia terminalny contact przez zestaw rzeczywistych par, zapisuje source
   events. Gdy są cel i inna rzecz, raportuje obydwa; nie nazywa tego wyłącznością.
5. Odtworzyć 72 epizody bez zmiany startów, progów, czasów i komend. Porównać wyniki
   z wcześniejszą oceną range<=1.63. Pełny check i niezależny review przed checkpointem.

## Krytyka i dalszy cel
To poprawa wiarygodności laboratorium, nie nowa inteligencja. Nawet poprawny collider
contact nie dowodzi prywatnego rozpoznania rzeczy, zamiaru ani satysfakcji organizmu.
Epizod zbliżenia nadal kończy na dowolnym dotyku; jego niepowodzenie ma zostać widoczne.
W następnym badaniu potrzebny jest stan przerwania i prywatne sprawdzanie następstw,
a nie success=true po contact. Rozszerzanie samej instrumentacji nie zastąpi rozwoju
brainu: zapis ma służyć porównaniu reaktywnego, historycznego i uczonego challengera.

## Kryteria zatrzymania promocji
- Pary hosta pojawiają się w PrivateFrame lub wejściu sterownika.
- Próba ocenia inny tick niż ten, na którym sterownik zareagował.
- Restore gubi kontakt w częściowym oknie.
- Dane porównuje się po cichej zmianie polityki lub przebiegu.
- Potwierdzony kontakt nazywa się dowodem tożsamości w pamięci organizmu.

## Wykonanie i wynik
Wdrożono cały kontrakt. Nowe testy najpierw RED (brak inspectContactSample i starsze
wersje snapshotów), potem GREEN. Trzy testy kontaktów obejmują też deep copy i
mutację danych checkpointu po restore. Pełny check: 35 plików, 92 testy, typy/build PASS.
Niezależny reviewer nie znalazł błędu blokującego i sam uruchomił testy kontaktów.

72 ponowione epizody mają ten sam końcowy stan sterownika, długość drogi, koszt oraz
zapisane snapshoty2Hz/zmian trybu. Zgodność tych danych NIE jest dowodem identyczności
każdej komendy i każdej ramki; takiego pełnego śladu wcześniejszy zapis nie przechowywał.
Nowa atrybucja nie zmieniła klasyfikacji żadnego z72 epizodów. W occluded rzeczywiste
pary potwierdzają dotknięcie przeszkody; nie jest to osiągnięcie zadanej rzeczy.

Osobny test podważa proxy: cel w odległości <=1.63 nie ma dodatniego impulsu z ciałem,
podczas gdy przeszkoda ma. Dawna reguła zaliczyłaby tu kontakt z celem błędnie.
Zatem zgodność tabeli72 nie kwalifikuje dawnego proxy poza tym zestawem.

Nowe dane: evidence/living-organism/approach-contact-attribution.json, reprodukcja:
probes/living-organism-contact-attribution.ts. Poprzedni probe i artifact pozostawiono
do porównania; nie nadpisano wcześniejszego kontrprzykładu. Sterowniki nie zmienione.

## Następny etap: sprawdzanie następstw oraz uczony challenger
Instrumentacja kontaktu jest zakończonym klockiem; dalsza kampania ma wrócić do brainu.
Pierwszy uczony komponent powinien przewidywać sensoryczne następstwa z krótkiej prywatnej
historii, nie czytać hostowych labels sukcesu ani worldrange. Minimalny protokół:
- Wyjście: przyszła widoczność plamy oraz bearing/extent warunkowe na pojedynczy fragment.
  Missing/ambiguous/clipped to osobne maski; nie tworzą automatycznej tożsamości.
- Wejście: kilka wcześniejszych zmysłowych próbek, proprio i własne komendy. Actor/object XY,
  handles i pola contactEvidence nie mogą być cechami ani etykietą prywatnego rozpoznania.
- Rozdzielić całe rodziny/parametry trajektorii między trening i test; sąsiednie klatki tego
  samego przebiegu nie mogą trafiać losowo do obu zbiorów. Zachować held-out far oraz zmianę
  dynamiki w trakcie czynności. Adwersarz observer-correlated pozostaje jawnie odrębny.
- Baseline: ostatni obraz bez zmiany i obecny analityczny model z jawnymi założeniami.
  Ocena predykcji poprzedza refit/trening na nowym obrazie; raportować błąd i maski.
- Następnie jeden prywatny stan touch-interruption: dotyk zatrzymuje/przerywa czynność,
  a nowe obrazy i proprio służą ocenie następstw. Bez success=true z host handle.
- Wpięcie do działania dopiero po poprawie ważnej decyzji na nowych przypadkach. Sama
  nazwa NN, mniejszy średni błąd lub narracja LLM nie spełniają tej bramki.

RenderQA i obserwowalny warsztat pozostają do wykonania; headless evidence nie jest
kwalifikacją doświadczenia Przemka. Nie publikowano ani nie zmieniono domyślnego brainu.
