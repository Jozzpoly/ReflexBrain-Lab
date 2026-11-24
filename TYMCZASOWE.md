# Tymczasowe — co jest obecnie próbą i kiedy wracamy do oceny

Każda rzecz poniżej jest **próbą**, nie ostatecznym fundamentem. Jeśli nie pomoże kolejnym agentom w realnej pracy bez przymusu, należy ją uprościć albo usunąć.

| Element | Status | Po co istnieje | Kryterium przetrwania (ocena po pierwszych 2–3 eksperymentach) |
| --- | --- | --- | --- |
| `lab/state.json` + generator `WIEDZA.md` ([tools/sprawdz-lab.mjs](tools/sprawdz-lab.mjs)) | Próba (24 XI 2026) | Jedno źródło prawdy bez dryfu między prozą a dokładnymi SHA 6 linii | Nowy agent na zimno odzyskuje stan i negatywny kanon bez powtarzania obalonych ślepych uliczek |
| `tools/drogi.mjs` + `tools/straznik.mjs` | Próba (24 XI 2026) | Zero sierot, zero martwych linków, twarda ochrona granicy publiczne/prywatne | Działają automatycznie w CI i nie generują uciążliwych fałszywych alarmów |
| `kernel/` ([seam](kernel/README.md), `fork-microscope`, `lens-ui`) | Próba (24 XI 2026) | Wspólny szew prywatności i żywy mikroskop `MARK → FORK → INTERVENE → FIRST-DIVERGENCE` | Inny agent (np. Opus, Argon, GPT) dobrowolnie użyje `kernel/` przy własnym eksperymencie, bo realnie oszczędza pracę i ujawnia błędy |
| [P00 — Kalibrator mikroskopu](proby/00-kalibrator-mikroskopu/README.md) | Próba aparatury (24 XI 2026) | Weryfikacja samego jądra i klikalny podgląd gramatyki `MEDIUM-D/R0` dla Właściciela | Zastąpić lub uzupełnić pierwszym prawdziwym okazem badawczym po odbiorze środowiska |
