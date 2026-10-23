# FL1 — original locally transported parameter field P, source result
Date 2026-10-23. Protocol [FL1 ARMED](RB_FL1_EMBEDDED_RULES_ARMED_2026-10-23.md) committed before code. Tested at upstream [FlowLenia](https://github.com/erwanplantec/FlowLenia) SHA `dce428c6b0c5079a06e5606fb7b5ac1fe1323bc5` via **unmodified original `FlowLeniaParams.__call__`**. [Executed source CI #39975573263](https://github.com/Jozzpoly/ReflexBrain-Lab/actions/runs/39975573263) PASS. [Actual JSON evidence artifact](https://github.com/Jozzpoly/ReflexBrain-Lab/actions/runs/39975573263/artifacts/12510443209). Four arms × 80 source JAX updates (320), CPU 64×64, three channels, nine kernels, original authors' 3×3 2+1 connectivity and `mix_rule='stoch'`, `callback=None`. All nonempty arms begin with **identical mass and geometry**. They differ only in initial P: constant key111; key111/key222 split across the patch; zero. Empty whole World is the fourth.

## Source observation
| Genuine field at t80 | blank | uniform_P | split_P | zero_P |
|---|---:|---:|---:|---:|
| Source total mass A | 0 | 595.0249474 | 595.0249425 | 595.0249472 |
| Active cells, A total >0.05 | 0 | **717** | **746** | **1123** |
| Active cells OUTSIDE original seeded square with nonzero carried P | 0 | **319** | **346** | 0 |
| First material-weighted P component variance | 0 | 0 | **0.005665** | 0 |

Same-seed **A final spatial L1** split versus uniform = **290.0180863**. Uniform versus zero-P final A L1 = **608.4085937**. The P spatial L1 split versus uniform = **4502.8970885**. Mass amount remains nearly identical across nonblank arms (few millionths in the reported global totals), while the material distribution differs.

These are concrete independent effects from the author's original updating field, not custom R6 transport. They establish **actual localized P parameter values are carried outside the initial patch with transported material**, and a deliberately heterogeneous initial P field causally influences later source matter spatial distribution.

## Critical qualifications and limits
- `P` is authored externally at **t0**. There are no self-generated mutations (callback deliberately `None`), no individual-determined material rules, no reproduction, heredity across individuals, autobiographical learning or actor-private sense in this experiment. Avoid calling moved P a "gene" that evolved itself.
- Authors' `mix_rule='stoch'` uses a **fixed source PRNGKey(42)** in the per-step mixing operator. Random sampling inside this source is thus not demonstrated as independent stochastic mutation from changing new seeds; do not attribute variation to spontaneous rule discovery.
- Cell counts and L1 are distribution metrics, **not stable bounded individual morphology**. `zero_P` activates more cells here but that does NOT make zero rules 'better life'. 80 source steps cannot establish open-ended evolution or adaptation.
- FL0 separately replayed original `FlowLenia` without P, seeded random patch with real perturbation and conservative material response. The FL0 rerun values differ slightly from its first CI (e.g. removed mass 130.53828 vs 130.53841, wounded final 473.4644 vs 473.4643), despite same named seeds, CPU and pinned upstream SHA. This is a tiny observed **floating/runtime reproducibility variation**, not full bitwise determinism. Use tolerance in scientific comparisons; never promise exact replay from seeds alone.

## Today's narrow but genuine advancement
After earlier R6/O2 (only **externally imposed** flow transport), we now have source-executed demonstrations of both **endogenous growth/material flow** (FL0) and **material-bound localized rule field feedback** (FL1), before adding any local brain or rigid-body host. This is a plausible donor **mechanism** for increasing future expressive possibilities, not an installed ReflexBrain substrate, accepted artificial organism, or solved ecological environment.

**Next decision:** instead of adding more random seeds to FL1, recover one *already selected stable* original research pattern and test the same original law with/without material disturbance and persistence of organization over significantly longer spans. First verify compatible parameter/state artifacts really exist and are economically runnable; if not, stop rather than training/optimizing a model solely to create a pretty "living" demonstration. In parallel an accessible actor/world coupling would require future independent and reciprocal consequences, not a passive field alone.

[R8 Owner test draft #89](https://github.com/Jozzpoly/ReflexBrain-Lab/pull/89) remains unchanged; no Pages/Jaskinia/public deployment or Owner-quality PASS. FL0/FL1 research only in [draft #92](https://github.com/Jozzpoly/ReflexBrain-Lab/pull/92).
