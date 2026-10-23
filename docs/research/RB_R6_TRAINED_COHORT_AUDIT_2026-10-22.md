# R6 — trained Sensorimotor Lenia benchmark audit; changing environments matter
**2026-10-22. RETROSPECTIVE descriptive re-analysis of author-provided published files, not our own simulation run and not preregistered.**

## Exact material and methodology
Public MIT-licensed [flowersteam/sensorimotor-lenia-search](https://github.com/flowersteam/sensorimotor-lenia-search) at immutable source commit `f29a064f8bc18877269df56661a290fc29e485bb`.
Ten existing JSON files: `data/imgep_exploration/perfs_seed{0..9}_b.json`.
The author corpus stores `robustness_obstacles`, `robustness_moving_obstacles1`, `robustness_moving_obstacles2`, `speed_no_obs`, `speed_obs`; each named specimen has a score. This audit read and aggregated original numeric values **without executing the trained source**, without simulating any pattern and without assuming a machine benchmark implies a living biography. The numeric labels moving1/moving2 remain as **original column names**: their exact movement-speed definitions were not independently tied to these JSON exports; do not assert they mean a specific speed. The [generalization experiment source](https://github.com/flowersteam/sensorimotor-lenia-search/blob/f29a064f8bc18877269df56661a290fc29e485bb/expe/generalization_test/obstacle_speed/experiment_config.py) separately evaluates a speed grid `[1/3,1/2,1,2,3]`; **a direct mapping of these two JSON column names is still an open source-tracing task**.

## Retrospective results from all 555 supplied entries
Per-seed record counts: **[107,64,33,18,35,66,54,30,44,104]**, for 10 seeds. These are selected recorded creatures, not a random sample of all possible CA structures.
| Author robustness field | Weighted by entry count (pooled 555) mean | Median entry | Equal weight across 10 discovery seeds mean | Highest/lowest seed mean |
|---|---:|---:|---:|---:|
| basic/static-obstacle benchmark | **0.6834** | 1.000 | **0.5478** | 0.9903 / 0.0697 |
| moving-obstacles1 | **0.4464** | 0.400 | **0.2887** | 0.9204 / 0.0089 |
| moving-obstacles2 | **0.2185** | 0.100 | **0.1460** | 0.6590 / 0.0009 |

Additional signed comparison using the same specimens: **318/555** with basic-obstacle robustness >=.95; of those **173** score <.25 on moving-obstacles2 (**54.4%** among basic-high-scoring specimens). **79/555** show a slightly higher `moving_obstacles2` than `moving_obstacles1`, so this finite per-pattern dataset should NOT be described as universally monotonic for each individual. The different pooled vs seed-equal means reveal **strong run composition effects**: seed0 contributes107 generally high-scoring patterns, seed9 contributes104 high; seed2/6/8 have much weaker means. Both averaging schemes are legitimate for distinct sampling questions; neither estimates universal CA survivability.

Two **post hoc illustration candidates**, not pre-selected before opening the published data:
- `seed0_crea00107`: basic1.00, moving1 **1.00**, moving2 **.70**, speed_obs **1.2384**.
- `seed0_crea00147`: basic1.00, moving1 **.02**, moving2 **.08**, speed_obs **1.0721**.
A similarity in basic challenge and gross speed does **not** prove identical intrinsic construction or controlled morphology. Any controlled replication must freeze source rules, initial states and perturbation distribution and recover author's original checkpoint/parameter files first.

## Scientific relevance to ReflexBrain
The authors' actual paper [Science Advances, 2025](https://pmc.ncbi.nlm.nih.gov/articles/PMC12577699/) describes survival filters and robustness averages over sampled externally configured environments (basic obstacle trials use 50 rollouts × 2000 timesteps), trained through gradient optimization, IMGEP and curriculum. It is legitimate evidence of **selected, impressive sensorimotor robustness**, not evidence of organism-generated goals or self-developing biographies. As seen above, difficulty and sample/run selection materially change numeric conclusions. This resonates with R0–R5 negative evidence: green motor/vision/survival checks may still imply poor living relations in the Owner's real time experience. The authors' extra attraction to a cyan-like cue was separately designed/searched, so never credit it as spontaneously self-chosen meaning.

**Next technical gate before full model replication:** locate immutable **actual trained parameter files** for two illustrative patterns (possibly through author Zenodo record 10211741 rather than GitHub path), verify source dependencies (PyTorch/cv2, 256×256×2000 step trial), assess CPU/GPU/time budget. If there is no cheap reproducible parameter source, do NOT rerun author training or invent an approximation called Sensorimotor Lenia. Keep the whole original paper's category data strictly separate from experiments we truly executed (O0/O1 canonical unoptimized Orbium, O2 NumPy transport-only). Doing so enables later exploration of real boundary maintenance versus prescribed optimization.
