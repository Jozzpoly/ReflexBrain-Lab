# ReflexBrain Lab — start here / wejście dla każdego agenta

**Stan badań: 10 listopada 2026.** Ten plik i [AGENTS.md](AGENTS.md) są niezależne od ChatGPT, Clauda, Codexa, Groka i pamięci rozmów. Właściciel może przez pewien czas nie korzystać z GPT. **Nie wymagaj od niego ręcznego odtwarzania historii projektu.**

> **UWAGA: gałąź `main` jest tylko indeksem i historycznym R0. Nie zawiera aktualnego, uruchamialnego ReflexBrain.** Badania nigdy nie zostały scalone do jednego programu. Nie utożsamiaj domyślnego branche'a z najnowszą nauką i nie scalaj eksperymentów hurtowo, aby to „naprawić”.

**Stan po krytycznym sprzątaniu:** **15 gałęzi**, **10 otwartych PR-ów**, **100 zweryfikowanych tagów archiwalnych**. Zacznij od **[MAPY BADAŃ — wyniki, obalone hipotezy, źródła](BADANIA.md)**, potem [raportu porządków i instrukcji odzyskania historycznych eksperymentów](archive/CLEANUP_2026-11-10.md). Archiwizacja nie oznacza akceptacji naukowej ani scalenia kodu.

## Po co istnieje ReflexBrain

Dwa powiązane, lecz odrębne problemy badawcze:

1. **Żyjący mieszkaniec:** czy materialnie ucieleśniona istota potrafi rozwijać własne, różnorodne i ciągłe sposoby działania w świecie, zamiast wykonywać scenariusz badacza?
2. **Tani prywatny mózg:** czy mały mechanizm uczenia może z rzeczywiście dostępnej mu historii zmysłowo-ruchowej odkrywać przydatne znaczenie, lepiej niż proste odruchy i automaty stanów?

**Stan dowodów:** istnieją prawdziwe eksperymenty fizyczne, ekologiczne, sensoryczne i pamięciowe, również nieudane. **Nie udowodniono trwałego rozwoju własnych praktyk mieszkańca, ani przewagi uczącego się mózgu w takim życiu. Nie ma akceptacji jakości życia przez Ownera.**

## Gdzie jest rzeczywisty dorobek

| Punkt | Rola | Status |
| --- | --- | --- |
| [PR #6 — indeks badań i krytyczne korekty](https://github.com/Jozzpoly/ReflexBrain-Lab/pull/6) | Punkt odzyskania historii, [wspólne badanie „biografii świata i organizmu”](https://github.com/Jozzpoly/ReflexBrain-Lab/pull/6#issuecomment-6754317044) | Nie jest runtime ani schedulerem |
| [PR #3 — R3](https://github.com/Jozzpoly/ReflexBrain-Lab/pull/3) | Causal pressure, authored-world donor | Nie jest żywym organizmem |
| [PR #84 — LIFE/L1](https://github.com/Jozzpoly/ReflexBrain-Lab/pull/84) | Przerwanie i wznowienie wykonywania symulacji, rzeczywista fizyka | Ciągłość wykonania ≠ wartość życia |
| [PR #89 — R8](https://github.com/Jozzpoly/ReflexBrain-Lab/pull/89) | Najbardziej bezpośredni otwarty warsztat materii, ciała i prywatnych zmysłów | Testy fizyczne i Chrome PASS, **nie** life PASS |
| [Audyt R8 z 6 XI](https://github.com/Jozzpoly/ReflexBrain-Lab/pull/89#issuecomment-6674491039) | Brakujące połączenie: `part` → płyta → brama | Poprawiono **tylko wariant testowy**, nie oryginalny R8 |
| [Archiwalny inwentarz wszystkich 115 branchy](archive/branch-inventory-2026-11-10.json) | SHA, stary PR, zależności, pochodzenie przed sprzątaniem | Historyczny snapshot, nie live GitHub |

**Uwaga:** fizyczne współdziałanie mechanizmów, zapis symulacji i prywatne doświadczenie mieszkańca są **różnymi** poziomami dowodu. W R8 sterownik `Occupant` pozostaje autorskim śledzeniem turkusowych obiektów; Owner może ręcznie zmieniać świat, ale nie jest to działanie AI.

## Jak uruchomić działający egzemplarz R8

```sh
git clone https://github.com/Jozzpoly/ReflexBrain-Lab.git
cd ReflexBrain-Lab
git fetch --tags
git worktree add -b investigate-r8 ../ReflexBrain-R8 329e1d99e6c2f78c052fdd25e7bf22dc3d219ec6
cd ../ReflexBrain-R8
yarn install --non-interactive
yarn run check
yarn run dev
```

**Ważne dla nowych agentów:** `git worktree` pozostawia `README.md`, `AGENTS.md` i `BADANIA.md` dostępne w pierwszym katalogu, obok oddzielnej kopii kodu R8. Samo `git switch` w katalogu głównym spowodowałoby zniknięcie tych instrukcji ze starej gałęzi. Nowy agent powinien pracować w oddzielnym katalogu z kodem, a główny traktować jako czytelną mapę. Wersja R8 nie posiada lockfile'a; polecenia wyżej odpowiadają historycznemu CI (Node 22 / Yarn Classic). Otwórz lokalną stronę `/probes/material-workbench-r8.html`. To przypięta, niemergowana wersja badawcza; nie publikuj jej jako nowego oficjalnego ReflexBrain bez oceny. Źródła są pod [dokładnym commitem R8](https://github.com/Jozzpoly/ReflexBrain-Lab/tree/329e1d99e6c2f78c052fdd25e7bf22dc3d219ec6).

Dla użytkownika Windows istnieje [odrębnie zweryfikowana paczka lokalna z Actions](https://github.com/Jozzpoly/ReflexBrain-Lab/actions/runs/40330314009) (artefakt wygaśnie **25 listopada 2026**); [branch do jej odtworzenia](https://github.com/Jozzpoly/ReflexBrain-Lab/tree/delivery/r8-private-windows-playtest-2026-10-26) jest osobny.

**Publiczna [strona Pages](https://jozzpoly.github.io/ReflexBrain-Lab/) prowadzi do starego S0**, znanego jako niezadowalający eksperyment; **nie** jest publicznym adresem R8. Jaskinia nie jest prerequisite do badania ReflexBrain.

## Jeśli przejmujesz projekt jako nowy AI

1. Przeczytaj [AGENTS.md](AGENTS.md) i ten README; wybierz rzeczywiste źródło ze wskazanym SHA. Nie zakładaj dostępu do dawnych rozmów.
2. Zajrzyj do [inwentarza branchy](archive/branch-inventory-2026-11-10.json). Jeśli gałąź zniknęła w porządkach, sprawdź jej znacznik `refs/tags/archive/reflexbrain-2026-11-10/<oryginalna-nazwa-brancha>` na GitHubie. **Sam SHA bez znacznika nie gwarantuje zachowania historii Git.**
3. Następne wartościowe badanie: **samodzielny kontakt → fizyczna zmiana świata → późniejsze, legalne zetknięcie z konsekwencją → ewentualna zmiana praktyki dzięki własnej pamięci**. Nie odtwarzaj w kółko 120-sekundowego testu ruchu R8; ten już istnieje.
4. Nowe wykonanie prowadź na osobnej, jasno nazwanej gałęzi; dołącz odtwarzalny test, tanią kontrolę i granice interpretacji. Zostaw historyczne źródła bez zmian, zachowaj możliwość błyskawicznego Owner-testu.

**Przed przebudową:** ochrona prawdziwych danych i unikalnych wyników jest ważniejsza niż liczba PR-ów czy zielonych testów. Nie przenoś prywatnych rozmów, tokenów ani tajnych materiałów do publicznego repo. **Nie zamieniaj eksperymentalnego kodu lub planu w obowiązującą architekturę z samego faktu, że istnieje.**
