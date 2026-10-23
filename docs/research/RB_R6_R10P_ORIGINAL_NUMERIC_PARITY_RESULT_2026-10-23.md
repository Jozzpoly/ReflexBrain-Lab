# R10P — independent notebook-kernel numerical equivalence result
2026-10-23 · Frozen protocol: [R10P ARMED](RB_R6_R10P_ORIGINAL_NUMERIC_PARITY_ARMED_2026-10-23.md) before separate reference implementation. [Source CI #40000580803](https://github.com/Jozzpoly/ReflexBrain-Lab/actions/runs/40000580803) **PASS**, three 800-step dual-implementation comparisons after earlier R10 six-history execution. Evidence JSON archived in `rb-r6-original-lenia` artifact of the run.

## Critical source qualification
Original [Bert Chan Lenia notebook blob cfc370672c62d03125c0d1b106764402021e25a5](https://github.com/Chakazul/Lenia/blob/master/Jupyter/Lenia.ipynb) was READ, original cells `set_params/kernel_core/kernel_shell`, `calc_kernel`, `calc_once` inspected. The reference script `scripts/r6_r10p_notebook_parity.py` independently implements notebook's **centered-kernel FFT and explicit `np.roll(MID)`** instead of R6's frequency-zero-centered kernel with no roll. It faithfully uses the original polynomial growth and `np.clip` update. **The notebook itself was not executed**, so this is an independent algebraic/numerical parity check, not native upstream runtime verification.

**Important scale:** the actual notebook animation's fixture uses `SIZE=256` and `multiply_cells(4)`, which scales 20×20 seed to 80×80 and `R13` to `R52`. Current R6/R10 experiment uses 128×128 and UNMULTIPLIED 20×20 seed with R13. Both math implementations compare the R6 frozen altered fixture. Claims about "the original 256-grid organism" remain unqualified.

## Actual measured numerical outcomes (reference vs R6)
| Fixture | Max per-cell difference after t5 | Whole-field L1 at t100 | Whole-field L1 at t800 | Reference field mass t800 | Reference large components t800 |
|---|---:|---:|---:|---:|---:|
| Single patch A | 1.44e-15 | 1.15e-12 | 3.29e-12 | 71.56306780 | 1 |
| Shared horizontal | 1.44e-15 | 3.49e-12 | **0.0110** | 145.61273936 | **2** |
| Shared vertical | 1.44e-15 | 0 | 0 | **0.0000** | 0 |

At t100 the notebook-style horizontal case has **one** large component (source R10 has one too), then both implementations have two at t800. At t100 the vertical shared world in both has **zero** material even while separately evolving originals remain alive to t800. All three cases counted exactly 800 real updates per implementation. A 0.011 L1 difference out of field total ~145 at t800 in horizontal case is much larger than early roundoff, consistent with time-amplified numerical sensitivity; it is not bit-for-bit determinism.

## Scientific adjudication
**QUALIFIED**: R10's dramatic shared-world fate contrast is not an obvious artifact of shifted FFT kernel or wrong polynomial update; it reproduces under a separate source-cell-faithful numerical pathway on the SAME altered 128×128 fixture. The null individual remains and vertical pair goes extinct under both. Also horizontal transient connectivity returns to two macroscopic structures in both. This strengthens R10's **nonlinear co-evolution evidence**.

**NOT QUALIFIED**: original-notebook 256×256 demo parity; individuality across contact/merger; two biological organisms; meaningful learned behavior; naturally recurring social/ecological practice; robustness over many relative placements or numeric precisions. Avoid promoting a dramatic mutual collapse into biological rivalry. Other initial orientations/distances might change result and are deliberately not optimized post hoc.

**Route:** STOP this pair/parameter sweep. Next high-value question is whether this field can furnish a causally and temporally trackable individual with a future own opportunity, or whether nonlinear media only reshuffle coherent shapes without a persistent self. Do not bolt ReflexBrain's predictor/motor reward onto anonymous density clusters. Keep Owner R8 #89 independent.
