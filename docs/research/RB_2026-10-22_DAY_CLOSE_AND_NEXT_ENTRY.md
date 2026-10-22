# ReflexBrain — zamknięcie dnia i odzyskanie kierunku (22.10.2026)

**STATUS:** zapis dla **gałęzi R6 / PR #87**, nie globalny `main`; żadna nowa formacja nie została zakwalifikowana jako „żywy organizm”. Rozdzielić rzeczywisty wynik, uprzednio zamrożoną hipotezę i interpretację.

## Mapa jednej minuty
- **Marzenie Ownera:** organizm, którego działalność ma organiczne plusy i minusy, historię, materialne i środowiskowe przyczyny, własną zmieniającą się organizację i długą ciągłość. Nie chodzi o najlepszy algorytm wykonujący zadanie. Nawet perfekcyjny robot szukający kulki nie jest sukcesem.
- **LIFE/L1 — [PR #84](https://github.com/Jozzpoly/ReflexBrain-Lab/pull/84):** trwałe wznowienie ciała i stanu pomiędzy procesami. Osiągnięcie infrastrukturalne, **nie** biologiczne, psychologiczne ani produktowy PASS.
- **LIFE/L2 R0–R5a — [PR #86](https://github.com/Jozzpoly/ReflexBrain-Lab/pull/86):** celowane pytania technicznie uruchomione, ale wyraźna rodzina **negatywnych wyników przyrodniczych**. R0/R1a: prawidłowa brama i tani ślepy ruch; R2a/R2b: trwałość przesuniętej materii, ale wspólne przemieszczenie z tym samym ciałem; R3: mieszkaniec oddala się w pustkę i nie tworzy nawyku; R4a: w bogatszej przestrzeni zanika późniejsza percepcja i materialne kontakty; R5a: wzrok widzi, ale pamiętany „powrót” nie uruchamia się nigdy, a własna materia mechanicznego obiegu porusza się tylko na początku. **Stop dopasowywania kolejnych bram, kolorów, dysków i małych skryptowych potrzeb**.
- **R6 O0–O2 — [PR #87](https://github.com/Jozzpoly/ReflexBrain-Lab/pull/87):** odrębny eksperyment donorów bottom-up. O0: jedna źródłowa odmiana Orbium z Lenii utrzymywała się 500 kroków, ale usunięcie 6,4% masy ze środka spowodowało zanik. O1: jednakowa masa po ingerencji nie gwarantuje jednakowego losu — permutacja struktury 7×7 zabiła wzorzec, inne przemieszczenie zachowało go. O2: własna implementacja TYLKO operatora transportu Flow-Lenii zachowała łączną masę, ale przy narzuconych zewnętrznie przepływach powstawały różne przestrzenne struktury. Nie ma tu biologicznej samonaprawy, wiarygodnej indywidualnej pamięci ani prawdziwej ekologii.
- **Dane autorów:** [audyt 555 wybranych wzorców Sensorimotor Lenia](RB_R6_TRAINED_COHORT_AUDIT_2026-10-22.md) z 10 plików; różna odporność na różne rodzaje przeszkód, duży efekt selekcji/seedów. To **retrospektywny audyt oryginalnych danych**, nie nasza symulacja wytrenowanych wzorców.

## Evidence ledger — nie pomylić kategorii
| Przeprowadzono | Czego wniosek nie obejmuje |
|---|---|
| [O0 wynik](RB_R6_O0_RESULT_2026-10-22.md), [O1 wynik](RB_R6_O1_RESULT_2026-10-22.md) — NumPy, komplet przypadków i CI | Oryginalny seed/parametry/równania według notebooka, ale **brak uruchomionej oryginalnej implementacji do klatka-po-klatce cross-checku**; „reprodukcja exact” odnosi się do źródłowych danych wejściowych i zadanej reguły, nie do niezależnie udowodnionej identyczności pośrednich stanów. Bez osobnego pomiaru integralności morfologicznej |
| [O2 wynik](RB_R6_O2_RESULT_2026-10-22.md) — source-aligned NumPy operator transportu, 2 brzegi × 5 pól, 20 kroków | Nie cała Flow-Lenia, nie endogenny przepływ ani ewolucja parametrów; zachowanie ilości ≠ przetrwanie jednostki |
| [Audyt kohorty](RB_R6_TRAINED_COHORT_AUDIT_2026-10-22.md) | Źródłowe rekordy autorów, bez uruchamiania ich wytrenowanych checkpointów w tym repo |
| [Audyt sprawstwa](RB_R6_CAUSAL_AGENCY_LEDGER_2026-10-22.md) | Gdzie regułę/trening/wybór/mutację dostarcza eksperymentator, a nie osobnik |

**Ważna korekta protokołu O2:** w pierwszym rzeczywistym przebiegu [#39698770240](https://github.com/Jozzpoly/ReflexBrain-Lab/actions/runs/39698770240) przypadek nazwany „blank with nonzero flow” miał w rzeczywistości `F=0` — odchylenie od zamrożonej hipotezy. Pusty świat pozostał pusty, ale węższy test nie sprawdził wymaganej perturbacji. Zmiana na niezerowy przepływ i egzekwujący test są w późniejszym commicie. **Zanim uznasz tę konkretną naprawę za kwalifikowaną, odczytaj CI aktualnego HEAD.** Oryginalnych śladów nie nadpisano; pozostałe warianty O2 bez zmian.

## Rozpoznanie po spojrzeniu na cały dzień
Dotąd usiłowaliśmy stworzyć „życie”, składając zmysły, silnik, świat, prywatną pamięć i zadania; poprawne mechanizmy funkcjonowały, ale nie wytwarzały własnej, trwającej działalności. R6 skorygował to przez zbadanie **zależności samej organizacji materialnej**, jednak równie łatwo moglibyśmy ugrzęznąć w nieskończonym polerowaniu atrakcyjnych automatycznych wzorków. To nie daje organizmu posiadającego znaczącą historię. Trwałość formy, odporność na konkretne uszkodzenie, zachowanie masy, „własne” sprawstwo, indywidualna biografia i Owner-observed żywość to różne fakty, a nie etapy jednej punktacji.

### Pięć pułapek, których jutro uniknąć
1. **Research jako cel sam w sobie.** Jeden świetny protokół znowu może przybliżyć nas do publikacji, a nie do żywego mieszkańca; należy wrócić do wizji świata i osobnika, w którym wydarzenia mają dalsze konsekwencje.
2. **Podkradanie sprawstwa.** Aktywność sterownika/rail, preselekcja seedów, trening, curriculum, przetrwanie zdefiniowane przez badacza, mutation callback, sensor-derived attraction do koloru to nie endogenne zainteresowania i normy jednostki.
3. **Nieuprawniony „organizm PASS”.** Machine green tylko potwierdza dane wąskie, Owner FAIL jest nadrzędny dla jakości rzeczywistego doświadczenia.
4. **Porównywanie nieporównywalnych skal.** 500 kroków oryginalnego Orbium, 20 kroków operatora Flow, 2h Rapier/wall-clock to inne eksperymenty.
5. **Nieaktualne wejście.** Bazowe `README.md` i `docs/CONTINUE_HERE.md` dziedziczą stan Pre-O0/6 października. Na gałęzi R6 powinny skierować do tej notatki; **nie** modyfikować na ślepo analogicznych plików `main` i PR #84.

## Decyzja na następny dzień
Wstrzymać tworzenie nowego aparatu i kolejnych małych testów „odporności”. **Jedno tanie rozpoznanie wykonalności:** czy istnieją gotowe, odtwarzalne oryginalne checkpointy dla dwóch wzorców z audytu o podobnej podstawowej odporności, lecz różnej odporności w zmiennym świecie? Weryfikować po **konkretnej ścieżce pliku i faktycznej możliwości odtworzenia**, nie tylko po legendzie publikacji. Nie uruchamiać kosztownego IMGEP/treningu JAX/PyTorch z rozpędu. Jeśli brak dowodów lub dostępu, zakończyć ten trop.

Następnie potrzebujemy **przeformułowania samej jednostki eksperymentu**: prawdziwe, długie, swobodnie zaburzane współistnienie indywidualnej organizacji z niezależnymi materialnymi procesami, gdzie doświadczenie nie tylko odzwierciedla świat, ale zmienia przyszłe możliwości działania. Zacząć od rzeczywistego fizycznego doświadczenia i możliwości ingerencji Ownera, nie od 100 kolejnych unit testów. Nie zapisywać konkretnej architektury jako obowiązującej, dopóki pressure nie wymusi wyboru.

## Granice operacyjne i otwarte zobowiązania
- R6 PR #87 ma bazę w LIFE/L1 PR #84; R0–R5a PR #86 to równoległy draft. Niczego nie scalać automatycznie ani nie publikować do Pages/Jaskini.
- Właściwy `main` historycznie bywa bardzo nieaktualny — zawsze sprawdzać branch, HEAD i CI, a nie zakładać, że jest źródłem najnowszej prawdy.
- Rapier2D zachować; decyzja „nie migrować na Box2D bez materialnie udowodnionego zysku” nie wymaga ponownego otwierania.
- Utrzymać źródłowe `ARMED`/wyniki, również FAIL, bez nadpisywania. Nie utożsamiać całego projektu ReflexBrain z wyłącznie automatem komórkowym.
- Dla Ownera krótkie polskie warstwy: **stan / co rzeczywiście zaszło / największe ryzyko / dalszy ruch**. Długa, techniczna dokumentacja służy agentom, nie jako przeszkoda dla Ownera.
