# FL1 — original FlowLeniaParams material-local update rules: pre-execution question
2026-10-23. Research-only companion to independently source-executed FL0. No changes to R8/R9, main/Jaskinia, no learner, no mating, selection, or targeted success rule. This is about the original authors' full dynamic `P` field, not our R6/O2 transport emulation.

## Frozen source and setup
Use exact upstream `erwanplantec/FlowLenia` commit `dce428c6b0c5079a06e5606fb7b5ac1fe1323bc5`, original `FlowLeniaParams` and `ReintegrationTracking`; default author's `mix_rule='stoch'` (source code uses fixed local `PRNGKey(42)` for categorical mixing), `callback=None` (NO externally injected mutations). 64×64, C=3, k=9, original `[[2,1,0],[0,2,1],[1,0,2]]` authors' example connectivity, model key=1, material key=2 and original 20×20 centered random nonzero patch. 80 actual JAX original update calls per arm.
Arms, physically identical initial A:
- `blank`: zero mass and zero P.
- `uniform_P`: 20×20 patch filled with source-like constant 9-vector from `jr.uniform(key111)`, P zero outside; same source mass seed.
- `split_P`: left half of 20×20 patch carries key111 nine-vector, right half key222 nine-vector, same mass and initial geometry. This deliberately authors a simple parameter mosaic; not natural mutation/reproduction. No post-start external P modifications.
- `zero_P`: same mass but all P zero, source transport/no rule effects control. Do not infer it represents organism without regulation.
At t0/1/10/20/40/60/80 measure source A total, occupied cells, P values on mass-weighted cells, material-weighted mean and variance of each P channel, field difference vs uniform arm, and P outside starting footprint in locations containing material. Test real finite source dynamics, zero material remains zero, all source updates counted.

## What exactly can this distinguish?
- If heterogeneous initial P affects later A after the same initial material distribution and original engine, local rules are causally active in source code — NOT learned or intrinsically selected.
- If P values are transported outside original occupied footprint with matter after source-only updates, original authored local rules are carried by mass. The categorical `stoch` source default still uses a **fixed** PRNGKey(42) inside the operator: not proof of noisy independent biological mutation.
- If uniform and split converge or P becomes unstable, record negative / conditional feasibility; don't retune keys for an attractive movie.
- Causal conservation, P spatial variation and occupied-cell differences are NOT agent-owned goals, heredity across generations, robust self-maintaining creature or diversified actual lifestyles.
- Do not instantiate R8 actor, a brain, an imposed reward or an architecture based on this test. Stop after 4×80 source calls and return to broader ecological validity.
