# P00 — Kalibrator mikroskopu (`00-kalibrator-mikroskopu`)

> **UWAGA — GRANICA DOWODOWA:** to jest **wyłącznie kalibrator aparatury (`scientificClaim: false`)**. Sterownik zwiadowcy w `world.mjs` jest prostym, jawnie zaprogramowanym automatem z krótką prywatną pamięcią ostatniego punktu zwrotnego. **Nie udowadnia** uczenia się, prywatnego znaczenia ani życia.

## Po co istnieje

Zanim na tym środowisku badawczym powstanie jakikolwiek nowy eksperyment naukowy (np. rozstrzygnięcie napięć `T1..T5` z [WIEDZA.md](../../WIEDZA.md)), ta próbka pozwala **Tobie z ręki** oraz automatycznym testom zweryfikować, że samo laboratorium działa bez błędów:

1. Domyślnie świat działa w cichym trybie **`WATCH`** (zero ściany suwaków).
2. Kliknięcie **`MARK`** (`M`) i **`FORK A/B`** (`F`) tworzy dwie identyczne co do bitu przyszłości (`A` kontrola i `B` interwencja).
3. Wszystkie 3 interaktywne warstwy z `MEDIUM-D/R0` działają na żywo tylko w `B`:
   - przeciągnięcie krążka myszą (`MATERIAL`),
   - przejęcie sterowania WASD i oddanie go z powrotem (`MOTOR_AUTHORITY` → `RELEASE`),
   - wyzerowanie krótkiej pamięci sterownika (`PRIVATE_RESEARCH_CUT`, klawisz `R`).
4. **Drabina Pierwszego Rozjazdu** na żywo raportuje dokładny tick i najniższą warstwę pierwszego rozjazdu (`observation`, `privateState`, `action`, `worldAfterstate`).

## Jak uruchomić

```sh
npm run build:kalibrator
node tests/kalibrator-smoke.test.mjs
```

Gotowy samodzielny plik do otwarcia dwuklikiem w przeglądarce (`file://`): `proby/00-kalibrator-mikroskopu/dist/kalibrator-mikroskopu.html`.
