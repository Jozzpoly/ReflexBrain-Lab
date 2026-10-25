# C2/R3 external-validity correction — original UI-default EVO world

Frozen 25 Oct 2026 **AFTER** observing small stress-world result (1200 ticks, `worldSize=600,pop=60`) and BEFORE implementing or executing this genuinely independent UI-default arm.

## Why warranted
Original donor `Ayanokoji12786/EVO` SHA `106f2dd478945debae0e03b237ba7e610a6d80ca`, source `src/ui/Opening/CreateWorld.tsx` lines 20–26 and 42–54 defines:
- default `worldSize=3200`, minimum UI world 1200
- default `initialPopulation=400`
- default `foodAbundance=1`, `mutationRate=.04`, `climate='temperate'`, `initialTemperatureC=15`, `initialRainfall=1`
- gridResolution = round(clamp(worldSize/18,64,200)) = **178** at 3200.

Our first native 600/60 world was smaller than UI minimum, and donor code has source initial food field empty and population capacity scaled by world area (1600 at 3200, ~56 at 600). **The 410 starvation deaths / 1 kill cannot be promoted as representative EVO product ecology.** The first small-source trial is still valid in its own scope, but is a poor proxy for the user's desired free world. This is a source-based EXTERNAL-VALIDITY falsifier, not outcome-based parameter search.

## One replacement witness, frozen before code
- SAME original external SHA, original `createWorld`, `stepWorld`, inherited NN and source events unchanged.
- ONE seed reused from prior: `reflexbrain-c2-20261025`; same `dt=1`, `1200` source ticks, no initial food injection/genome tuning, no forced predation.
- Exactly author's UI-default config: `{seed:'reflexbrain-c2-20261025',worldSize:3200,gridResolution:178,initialPopulation:400,foodAbundance:1,mutationRate:.04,climate:'temperate',initialTemperatureC:15,initialRainfall:1}`.
- Same observational counters/twin SHA method and genealogical **admitted vs generated births** correction. Report first food supply, death causes, natural predation, carcass uptake (only unambiguous source assignments), actual same-individual multiple practices, and interpretation limits.
- First ecological t1200 witness and this default witness are NOT matched-factor causal comparisons (two dimensions changed), not a controlled test of world size or density. The purpose is NORMAL-USE REPRESENTATIVENESS, not attribution.
- If source ecology cannot finish within existing CI timeout, mark engineering INCONCLUSIVE. **No timeouts/step count/pop tuning based on result**, and no selective survivor presentations.
- No import/reuse of original external code beyond temporary read-only CI clone (no LICENSE found). Stop after this one UI-default witness and synthesize.
