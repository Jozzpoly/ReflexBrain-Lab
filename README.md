# ReflexBrain Lab — środowisko badawcze

Otwarte laboratorium badawcze szukające odpowiedzi na dwa powiązane, ale rozdzielne pytania:

1. **Żyjący mieszkaniec:** czy materialnie ucieleśniona istota potrafi rozwijać własne, ciągłe i zróżnicowane praktyki w świecie zamiast wykonywać scenariusz badacza?
2. **Tani prywatny organ znaczenia:** czy mały, lokalny mechanizm potrafi z legalnej historii zmysłowo-ruchowej nadawać sytuacjom prywatne znaczenie, które realnie zmienia późniejsze możliwości i działanie?

*Daleki horyzont:* w przyszłości taki szybki, ucieleśniony układ nerwowy ma też pozwolić agentom AI wspólnie z Właścicielem doświadczać i grać w jego światach. Dziś linia LLM pozostaje świadomie odcięta od jądra badań.

> **Uczciwy stan prawdy:** do dziś **nie wykazano** samorozwijającego się żyjącego mieszkańca ani autonomicznie wyuczonego prywatnego znaczenia wykraczającego poza proste skojarzenia cech. **Nie ma akceptacji jakości życia przez Właściciela** — bieżące statusy i werdykty są w [WIEDZA.md](WIEDZA.md).

## Drzwi wejściowe (zacznij tutaj)

- **[WIEDZA.md](WIEDZA.md)** — jedyna aktualna mapa wszystkich konkurujących linii, kanonu wyników negatywnych, otwartych napięć, werdyktów Właściciela i blokad `doNotRepeat` (generowana deterministycznie z [lab/state.json](lab/state.json)).
- **[AGENTS.md](AGENTS.md)** — krótki protokół wejścia na zimno dla każdego silnika AI (Opus, Fable, Argon, Neon, Browser GPT, Codex) oraz zasady oddawania okazów Właścicielowi.
- **[kernel/README.md](kernel/README.md)** — lekka, opcjonalna aparatura laboratoryjna (`seam.mjs`, `fork-microscope.mjs`, `lens-ui.mjs`): szew prywatności `obs`, gramatyka `MARK → FORK → INTERVENE → RELEASE → RUN → COMPARE` i trwała drabina pierwszego rozjazdu.
- **[proby/README.md](proby/README.md)** — strefa swobodnego eksperymentowania bez biurokracji (w tym [kalibrator mikroskopu P00](proby/00-kalibrator-mikroskopu/README.md) z gotowym plikiem HTML).
- **[TYMCZASOWE.md](TYMCZASOWE.md)** — co jest aktualną próbą i kiedy wracamy do oceny.
- **[DROGI.md](DROGI.md)** — wynik automatycznego sprawdzenia osiągalności wszystkich dokumentów od tych drzwi.

## Historia i archiwum (nienaruszone)

- **[BADANIA.md](BADANIA.md)** — zachowany historyczny indeks wyników z 11 listopada 2026 (skonsumowany do [WIEDZA.md](WIEDZA.md)).
- **[archive/CLEANUP_2026-11-10.md](archive/CLEANUP_2026-11-10.md)** oraz [inwentarz 115 gałęzi](archive/branch-inventory-2026-11-10.json) — raport z archiwizacji i dokładne SHA dla 100 zweryfikowanych tagów `archive/reflexbrain-2026-11-10/*`.

## Szybkie polecenia (Node >= 20, zero `npm install`)

```sh
npm run brief       # samowystarczalny skrót na zimno (linie, werdykty, kanon negatywny, napięcia, blokady)
npm run check:all   # pełna weryfikacja: dryf WIEDZA/DROGI/HTML, strażnik na working tree, wszystkie testy
npm run render      # regeneruje WIEDZA.md, DROGI.md i samodzielny plik HTML kalibratora P00
```

## Sąsiednie repozytoria ekosystemu

| Projekt | Adres | Rola obok ReflexBrain |
| --- | --- | --- |
| **Jaskinia** | [Jozzpoly/Jaskinia](https://github.com/Jozzpoly/Jaskinia) | Wspólny dom Właściciela, strażnicy (`straznik`, `drogi`) i pasek Do obejrzenia |
| **Shared-Work-Medium-Lab** | [Jozzpoly/Shared-Work-Medium-Lab](https://github.com/Jozzpoly/Shared-Work-Medium-Lab) | Badania nad wspólnym medium pracy agentów i drabiną osiągalności |
| **PROJECT-ANVIL** | [Jozzpoly/PROJECT-ANVIL-Machine-Matter-Physical-Fabric-Laboratory](https://github.com/Jozzpoly/PROJECT-ANVIL-Machine-Matter-Physical-Fabric-Laboratory) | Laboratorium materii maszynowej i dyscyplina jeden-fakt-jeden-właściciel |
| **Gloopipelago** | [Jozzpoly/Gloopipelago](https://github.com/Jozzpoly/Gloopipelago) | Obserwatorium żywej ewolucji: żywy świat jest pierwszorzędny, aparatura służy jemu |

Prywatne notatki i rozmowy Właściciela żyją poza tym publicznym repozytorium.
