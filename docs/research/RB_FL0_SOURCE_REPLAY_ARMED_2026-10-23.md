# FL0 — original Flow-Lenia closed-loop source replay (frozen BEFORE execution)
Date 2026-10-23. Independent research branch from R6 `8d0444ddff`; do not touch R8/#89, Jaskinia, main or owner product. No new organism/learning code.
Upstream pinned original [FlowLenia repository](https://github.com/erwanplantec/FlowLenia) commit `dce428c6b0c5079a06e5606fb7b5ac1fe1323bc5` (author source: `flowlenia/flowlenia.py`, `reintegration_tracking.py`, `utils.py`). This is **whole JAX mass/growth-derived endogenous flow update**, unlike our previous R6/O2 externally set transport operator.

## Question
Can the original code run autonomously on a bounded CPU under its **unaltered rules** and yield a material history with a measurable later response to an exogenous local disturbance? This is a **technical and causal substrate feasibility question**, NOT an individual organism, emergent preference, animal intelligence, self-maintaining body or a solution to Owner's ecological agenda.

## Freeze scenario, no after-results tuning
- Original upstream engine downloaded into ephemeral CI directory at EXACT SHA and imported as Python module, no rewriting, no training, no goal optimization, no extra artificial force.
- Reproduce published author example's connectivity matrix `[[3,1,0],[0,3,1],[1,0,3]]`, three channels, nine kernels and model RNG seed `1111`. Computationally bounded 64×64 (half of example 128×128), original values of `dt`, sigma, transport neighborhood, boundary types and original random initialization law. Explicitly label resolution/initialization reduction as an alteration to example fixture but NOT to physical update law.
- 20×20 centered patch seeded via `jax.random.uniform(PRNGKey(4321))`, no mass outside; 80 genuine full **JAX FlowLenia.__call__** updates.
- Three parallel histories: **blank** zeros, **intact** seeded patch, **wounded** same seeded patch, but at update 20 remove all material from central 8×8 cells by external field intervention (only once). Zero additional interventions during 21–80; same fixed model parameters and initial state across intact/wounded.
- Snapshots at 0, 1, 10, 20(before and after wound), 21, 40, 60, 80. Record total material, total active cell occupancy threshold >0.05, centroid and spatial displacement relative to original seed, frame L1 between intact/wounded, wound material removed; no imposed survival/mobility score, morphological bias or arbitrary target.
- Test actual finite nonnegative original outputs, no spontaneous material in blank, original rule invocation count exactly 80 (per independent arm), and no new mass generation beyond numerical tolerance. If original behavior violates invariant, report FAIL, don't retune.
- CPU runtime cap CI 12 min, maximum 3 arms × 80 source updates; do not expand if a negative outcome.

## Adjudication
- **Engineering PASS** means exact original commit, full JAX update and auditable metrics ran; never equate this with biological life.
- **Self-maintaining individual** only if distinct coherent persistent structure survives disturbance under independently justified morphological criteria; this experiment **does not by itself prove** such a structure (no discovered pattern is selected or maintained). If patch dissipates or settles, call it negative evidence *for this seeded run*, not a universal impossibility theorem.
- **World-alone and causal divergence** can pass if intact/wounded differ under original endogenous update after intervention, but this establishes a continuing material process, not later actor access, significance, ecological interaction or learned ReflexBrain.
- If upstream dependencies are incompatible or clone/install fails, explicitly report **technical blocker**. Do not silently replace original code with home-built imitation or reinterpret R6/O2 as a full replay.
- The next decision depends on actual source traces: discover demonstrably stable preexisting author-approved parameters if raw patch fails, OR change donor if recovering such states is too expensive; no auto-building a bigger physics host.
