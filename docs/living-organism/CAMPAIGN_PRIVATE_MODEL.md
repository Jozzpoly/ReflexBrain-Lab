# Kampania: prywatny model sytuacji i zdobywanie informacji działaniem

Aktualizacja: pierwsza część niżej opisuje start v3 / 78 testów. Etap predykcji
jest w runtime v4; bieżący stan i wyniki kontrpróby opisuje CURRENT.md oraz
docs/superpowers/plans/2026-10-08-private-prediction.md. Zgodność przyszłego bearing
nie potwierdziła prawdziwego dystansu; kierunek obejmuje decyzje jakościowe i kontakt,
bez oczekiwania na nieomylną monokularną głębokość.

2026-10-08. Start z c30e4541ec11fbb625f9c2e641bd5ee5bfe5733e.
Cel projektu pozostaje szeroki: ciągły organizm w interesującym świecie, ze zmysłami,
pamięcią, własną organizacją działania i możliwością porównania szybkich lokalnych,
uczonych oraz wolniejszych poziomów brainu. Żaden dzisiejszy regulator nie ma prawa
stać się jego definicją tylko dlatego, że już istnieje.

## Korekta kierunku
Utrzymywanie rzeczy przy zapamiętanym punkcie to jeden możliwy epizod badawczy.
Nie ustanawiam go obowiązkową przyszłością organizmu. Wymaga informacji i kompetencji,
których jeszcze nie mamy. Nie dołożymy wiedzy hosta, aby pozornie wykonać ten plan.
Obecny occupant pozostaje porównawczym sterownikiem ruchu i koloru.

## Trzy powiązane tory
1. Prywatny model: co obserwacje rzeczywiście pozwalają wnioskować, jakie założenia
   wspierają wniosek, jak znika aktualność i kiedy podobieństwo nie daje tożsamości.
2. Działanie i uwaga: wybór spojrzenia/ruchu potrzebnego do rozstrzygnięcia lokalnego
   pytania, kontynuacja i zmiana zajęcia. Najpierw jeden zintegrowany epizod, którego
   wynik zależy od historii i ma następstwa; zakres epizodu można zmienić po pomiarach.
3. Challenger uczony: porównać predykcję lub politykę z modelem analitycznym i reaktywnym
   baseline. NN, miniLLM lub komponent zewnętrzny pozostają opcjami, bez deklaracji ich
   dostępności czy użyteczności. Nie odkładać uczenia bez końca; najpierw wskazać konkretną
   kompetencję, którą porównanie może obalić. Wolny poziom nie zatrzymuje fizyki i refleksów.

## Rozpoczęty krok: PrivateVision
Moduł otrzymuje tylko PrivateFrame: retinę, gaze, lokalną prędkość i obrót ciała oraz czas.
Integruje własny układ odniesienia i zbiera kierunki widocznego pojedynczego fragmentu.
Nie dostaje world XY, collider ID, prawdziwego rozmiaru rzeczy ani jej odległości.
Po co najmniej trzech obserwacjach i dostatecznym ruchu poprzecznym może dopasować
hipotezę położenia. Sam obraz, sam obrót i zdegenerowana geometria nie dają odległości.

To dopasowanie geometrii, nie uczenie sieci. Hipoteza zawsze ma jawne założenie
stationary-fragment i status tentative. Podobne równoczesne plamy, ucięcie pola widzenia,
utrata obrazu i duża nieciągłość zrywają bieżące powiązanie. Nie tworzymy stabilnego ID.
Moduł działa przy runtime i zachowuje stan w checkpoint v3, także podczas takeover.
Nie steruje jeszcze motorem. Nie jest gotową pamięcią obiektów ani modelem świata.

## Wynik i jego obalenie
Rzeczywiste sceny Rapiera po bocznym ruchu:
- nieruchoma rzecz blisko: dystans hosta 3.548, hipoteza 3.551;
- nieruchoma rzecz daleko: dystans hosta 6.292, hipoteza 6.296;
- celowo poruszona rzecz: dystans hosta 3.146, hipoteza 6.229.
Ostatnia, błędna hipoteza ma nawet mniejszy residual kątowy niż poprawne.
Surowe dane: evidence/living-organism/private-vision-characterization.json.
Wniosek: niski błąd dopasowania nie dowodzi nieruchomości, tożsamości ani prawdy.
Ruch obiektu może imitować inną głębokość. Nie wolno automatycznie zamienić tentative
w pewność ani użyć takiej odległości jako nieomylnej podstawy pchania.

Sześć testów modułu obejmuje niejednoznaczny pojedynczy obraz, blisko/daleko, obrót
bez translacji, podobne plamy, restore/powtórne odczyty oraz odbudowę po przemieszczeniu. Test integracyjny
obejmuje kontynuację prywatnego modelu po ręcznym ruchu i odtworzeniu runtime.
Pełne npm run check: 33 pliki, 78 testów; typy i build PASS.

## Najbliższa pętla kampanii
1. Zachować obecny model jako słaby challenger z jawnym założeniem, nie finalną percepcję.
2. Przygotować epizod z nieruchomą i ruchomą rzeczą, zasłonięciem i sobowtórem. Rozdzielić
   aktualny pomiar, przewidywanie, utraconą aktualność i hipotezę ponownego powiązania.
3. Zestawić co najmniej modele nieruchomości/ruchu oraz przypadek nierozstrzygalny.
   Pytaniem jest redukcja błędnej pewności, a nie najładniejsza wartość dystansu.
4. Dać uwagę i ruchowi lokalne pytanie: gdzie jeszcze spojrzeć albo jak zmienić punkt
   obserwacji. Porównać z nieruchomym gaze i zwykłym roamingiem na identycznych startach.
   Aktywne patrzenie nie gwarantuje usunięcia każdego aliasu.
5. Dopiero użyteczny stan i informacyjna interwencja uzasadniają połączenie z materialną
   czynnością. W razie porażki zmienić reprezentację lub epizod, bez dodawania tajnej prawdy.
6. Przygotować obserwowalny warsztat z zapisem sensory/private/action/intervention tych
   samych przebiegów. Dostępny render i sprawdzony interfejs poprzedzają Owner test.

## Warunki korygowania planu
Jeżeli model utrzymuje pozorną pewność w nierozstrzygalnych sytuacjach, zatrzymać jego
wpływ na czynność i poprawić organizację hipotez. Jeżeli informacje nie zmieniają ważnego
działania, zmienić epizod; nie optymalizować pokrycia planszy. Jeżeli uczony komponent
rozwiązuje konkretne pytanie lepiej, może zastąpić analityczny. Wymienialność dotyczy też
obecnego occupant i nie wymaga zachowania wszystkich jego trybów.

Przegląd niezależny i QA przeglądarkowe pozostają otwarte. Ta kampania jest rozpoczęta,
nie ukończona. Nie ogłasza nowych własnych celów, uczenia ani inteligentnego życia.
