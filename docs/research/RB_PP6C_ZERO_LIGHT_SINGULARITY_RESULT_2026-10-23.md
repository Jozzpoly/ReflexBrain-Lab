# PP6C — CONFIRMED numerical singularity in original zero-light world (RESULT)
23 Oct 2026. Preregistered [PP6C check](RB_PP6C_ORIGINAL_ZERO_LIGHT_SINGULARITY_ARMED_2026-10-23.md) before a new no-step diagnostic. Original author Fortran `A5size/OpenPraparat@e9e105d48ab597612d1749a5f169663559b12287`. **[PP6C actual original source CI #40025189492 PASS](https://github.com/Jozzpoly/ReflexBrain-Lab/actions/runs/40025189492)**. This independently streamed the FULL exact native PP6 A/B archived t80/160/240 source files, verified 15,000 original slots and raw source SHA/INFO_TRANS counters; did NOT run new source steps beyond source PP6 and did not change engine or world.

## CONFIRMED counterfactual confound
Original `praparat.f90:3972–4020` `sub_light_calculation` emits `nint(INFO_TRANS_EMI_C * r²)` = 16 light information particles from source sun `r=0.4, INFO_TRANS_EMI_C=100`, including when `SUN_IOLr/g/b=0`. The original `create_information_transmitter` at lines 4032–4063 computes `Imax=max(Ir,Ig,Ib)`, then normalizes `cr=Ir/Imax`, `cg=Ig/Imax`, `cb=Ib/Imax`, `ar=1-Ir/Imax` etc WITHOUT checking `Imax==0`. So our PP6 `SUN_IOLr=SUN_IOLg=SUN_IOLb=0` produces **0/0** for each sun information-particle color and alpha.

| Actual original source state | Native sunlit control: nonfinite information-particle color | SUN RGB-zero treatment: nonfinite information-particle color | Dark zero-RGB info particles |
|---|---:|---:|---:|
| Native t80 | 0 | **16** | 16 |
| Native t160 | 0 | **16** | 16 |
| Native t240 | 0 | **16** | 16 |

In every dark snapshot, source native serialized values include `NaN NaN NaN` for both original `cr/cg/cb` and `ar/ag/ab` for those **same 16** zero-intensity info particles. Original saved source SUN slot1 color attributes remain finite, but its `IOLr/g/b` are exactly zero as intended. Source light-on comparator had no nonfinite particle color in the sampled native states.

**Scientific implication:** Prior PP6 and PP6B evidence still genuinely establishes that **changing SUN_IOL world parameters** under matched original saved cells/seed changes original physics and correlated native matched physical cells. But **it is NOT a clean ordinary sunlight-on vs sunlight-off world comparison**, because the source introduces nonfinite photon state in the zero-valued arm. Downstream numerical/contact effects MAY include this invalid original state; source does not prove which later differences are from decreased energy/light versus NaN. We must **downgrade** previous "environment light causes healthy organism adaptation" type narratives. Specifically a previously observed decrease from ~7.5k to ~4.3k active source slots was overwhelmingly information-transmission particle loss; never describe ~3.2k as organism deaths. Matched physical-cell response and neural-output deltas are valid **observations in the contaminated arm** but not clean comparative effect of darkness.

**STOP this PP6 zero-light arm**. Do not 'fix' the original source with `epsilon`, silence NaNs, or pretend a zero-emitter is a well-defined native physical condition. One separately preregistered nonzero-intensity control (for instance **exactly half source RGB: 5,5,4 versus 10,10,8**), with explicit finite-info guard, could test whether source environmental perturbation still causes matched physical-cell consequences **without this singularity**. If that does not work, respect the negative/no-accessibility evidence; no more seed fishing.

This is **material scientific falsification**, not an engineering regression. PP6C normal Check/CI green signals only that the audit successfully identified invalid original numerical data, not that biological success passed.
