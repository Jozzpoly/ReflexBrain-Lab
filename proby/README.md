# `proby/` — strefa swobodnych prób badawczych

To jest przestrzeń niskiej ceremonii (wzorzec z [Jaskini](https://github.com/Jozzpoly/Jaskinia)):

- Wolno tu szybko sprawdzać śmiałe hipotezy, szkicować mikro-eksperymenty i obalać własne pomysły bez wypełniania tabelek.
- Żadna próba nie jest z automatu fundamentem projektu ani wynikiem `OWNER PASS`.
- Dopiero gdy próba naukowa przyniesie **rzeczywisty, odtwarzalny wynik (pozytywny lub negatywny)**, dopisujesz krótki wpis do `scientificProbes` oraz `negativeCanon`/`lineages` w [lab/state.json](../lab/state.json) i uruchamiasz `npm run render && npm run check:all`.
- Osobną sekcję `apparatusCalibrators` w [lab/state.json](../lab/state.json) stanowią wyłącznie techniczne kalibratory aparatury (`scientificClaim: false`).

## Bieżące zawartości

- **[00-kalibrator-mikroskopu](00-kalibrator-mikroskopu/README.md)** (`P00`) — kalibrator aparatury weryfikujący [kernel/](../kernel/README.md) (`seam`, `fork-microscope`, `lens-ui`). **Nie stanowi twierdzenia naukowego o życiu ani uczeniu.**
