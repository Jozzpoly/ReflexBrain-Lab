# C2/R2 — secondary source data integrity QA, frozen BEFORE instrumentation revision

Original first successful native EVO epoch: source SHA `106f2dd...`, observer run [Actions #40217833044](https://github.com/Jozzpoly/ReflexBrain-Lab/actions/runs/40217833044) passed, **same precommitted 1200 ticks**. It reported `totalBirths=471`, `totalDeaths=411`, last live population `68` from initial `60`.

**IMPORTANT SOURCE AUDIT FINDING:** original `engine.ts` lines 278–284 increment `state.totalBirths` on GENERATED `kids`; only at lines 320–325 is `newborns.slice(0, admitCap)` actually admitted into `state.organisms` and `genealogy`. Therefore `totalBirths` cannot simply be called **actual births**. Source-side population balance implies approximately `60+471-411-68 = 52` reported new kids not admitted. Do not promote this inferred exact count until checked against actual native genealogy.

**Before new execution**, freeze observational corrections ONLY:
- At native step1200, output `genealogy.size - 60` as count of actually admitted offspring; `generatedOffspring = state.totalBirths`; `notAdmitted = generated - admitted`; verify exact `initial+admitted-totalDeaths===currentLive`. Do not modify engine or test scenario.
- Output histogram of `genealogy.causeOfDeath` for all actually dead organisms (distinguish `starvation`, `old age`, `killed by`, `disease`, other), verify sum equals source deaths. Do not label anything as feeding because of death counters.
- Retain FIRST frozen configuration **unchanged**, seed `reflexbrain-c2-20261025`, `worldSize=600`, `initialPopulation=60`, `dt=1`, `1200` steps, twin state comparisons every 100 ticks. Retain original success metrics identically; any change => no scientific promotion.
- No new null arms, tuned seeds, physical laws, trained controllers, survival optimization or source changes. This is a correction to the MEASUREMENT instrument, not a second substantive experiment.
