# RB-ACT/P0 — actor-private forward-effects: native-result and rejection of premature probe authority
**2026-10-21 | SCIENTIFICALLY CLOSED · engineered & source-executed PASS · learned action knowledge NOT QUALIFIED.**
Isolated [stacked draft PR #82](https://github.com/Jozzpoly/ReflexBrain-Lab/pull/82) from #81. Original [frozen, pre-execution protocol](RB-ACT-P0_ARMED_2026-10-21.md); no public deployment, no canonical merge, no modification to V0 live resident or default page.

## Evidence and procedure
Source-executed [GitHub Actions #39626907082](https://github.com/Jozzpoly/ReflexBrain-Lab/actions/runs/39626907082): 45/45 files, 137/137 native Vitest tests, TypeScript and Vite build PASS. Exact marker `RB_ACT_P0_PREDICTION`. Actual Rapier 120Hz, legal `LivingWorld.observe()` 30Hz. Four source *training* geometries (free, loose disk, hard backstop, corridor), three **physical heldout** geometries (shifted backstop, large loose disk, alternate obstacle). Same prespecified 32-tick motor-probe schedule independent of scenario and World coordinates. 224 lawful action→sensation samples retained per morphology B0/B1. Each heldout layout has 56 evaluation samples. All targets are **future private forward/lateral velocity and touch sum**, never World object movement, actor x/y, collider handle or hidden 'blocked' label. The K=7 bounded memory retains max384, has legal proprio/touch, central raw RGB lightness and chosen drive/turn features. Cost-equivalent/global action mean and much cheaper sensor persistence/contact rule controls are compared, not just a weak zero model.

## Frozen aggregate result (lower private predictive error is better)
| Morphology, heldout real geometry | Learned KNN | Simple persistence | Motor-conditioned global mean | Fixed touch-contact rule | Contact windows/56 |
|---|---:|---:|---:|---:|---:|
| B0 shifted backstop | 0.06999 | 0.08785 | 0.15586 | 0.09300 | 48 |
| B0 larger disk | 0.08231 | 0.10186 | 0.14112 | 0.11019 | 44 |
| B0 alternate obstacle | 0.11013 | **0.08107** | 0.16031 | 0.08707 | 48 |
| B1 shifted backstop | 0.16178 | **0.08040** | 0.18801 | 0.08570 | 15 |
| B1 larger disk | **0.00252** | 0.14759 | 0.02914 | 0.15616 | 5 |
| B1 alternate obstacle | 0.16934 | **0.07939** | 0.19510 | 0.07939 | 8 |

If taking best of the three separately fixed alternatives per case, learned wins only **3/6** (two B0 conditions and one low-contact B1 condition). One 56-window trajectory per physical arrangement, not independent repeated population evidence. This is an outcome-prediction trial, no autonomous choice, goal or reward.

## Post-result diagnostic — clearly NOT a new preregistered success metric
Because the spectacular B1 large-disk aggregate score had only five contact windows, a later *descriptive* commit stratified the same frozen windows by presence of contact and by observed speed. This changed neither sensor, model, training examples, scenarios, baselines nor aggregate verdict; it cannot be retroactively used to declare another winner.

| Across six heldout trajectories | Windows | Learned MAE | Persistence MAE | Fixed-contact MAE |
|---|---:|---:|---:|---:|
| Contact at start or end | 168 | **0.10620** | **0.07408** | 0.08519 |
| No contact | 168 | **0.09249** | **0.11864** | 0.11864 |
| Observed final |forward| > 0.5 | 147 | **0.02596** | 0.13003 | 0.14257 |
| Observed final |forward| <= 0.5 | 189 | **0.15642** | **0.07018** | 0.07030 |

**Qualitative finding:** the predictor excels mainly in moving/free-effect regimes and fares significantly worse where contact/slowdown makes the matter consequential. In all three B0 heldout cases the learned model's contact-only MAE is worse than persistence's (0.0764 vs 0.0725; 0.0979 vs 0.0794; 0.1238 vs 0.0610). The spectacular B1 large-disk result (0.00252) occurs in a nearly contact-free sample (5/56 contacts, mean |forward| 2.48), thus must not be advertised as understanding material resistance. Motion/contact groupings here use true lawful sensor measurements but **after-the-fact partition choice**, so use only for diagnosis; do not claim statistical significance or full generality.

## Additional epistemic limits
- The camera frame is lawful to the actor but **retinal lightness is not material consequence understanding**. No object persistently tracked, no attribution of actor vs independent object motion, no choice between active probes.
- The training/evaluation motor actions were chosen by the *research harness*, not by a self-directed learner. Do not claim the model learned where it should investigate.
- The three cheap baselines are transparent fixed comparators, not optimal cheap policies. Beating them would have been a weak lower bar, not a decisive proof. Here the learned model frequently loses even that weak bar.
- Heldout geometry differs but action schedule and its ordinal position repeat; temporal/inertial shortcuts remain a plausible confound. Independent actors' body morphologies alter contact density, so comparing B0 and B1 error without distribution control is unsafe.
- World afterstates and ability to manipulate matter were NOT evaluated as learned policy benefit, and must not be inferred from numeric prediction quality. Existing older forward-model pilot already warned lower offline error can worsen real control.
- Long-term personal significance H7/H8/H9 remains unqualified. O-DEV/V0 itself merely optimizes motion; neither layer supplies a good continuing concern.

## Verdict, next action
**NO PROMOTION to action/probe authority. Stop tuning this KNN family.** It is a useful controlled negative donor: legal sensor→sensation learning was implemented but did not earn useful contact/physical insight or consistent superiority even to sensor persistence.

Critical design correction: before further "active curiosity" coding, identify a **specific continuing real-world activity** that a privately observable material ambiguity can actually interrupt or improve. The actor needs a downstream consumer for new knowledge; mere prediction accuracy or the ability to do another authored experiment is insufficient. Such a consumer can initially be a narrowly authored host commitment, but must be distinguished from the learned ReflexBrain semantic mechanism, have physical consequences, and be tested against stall/retry/random/host oracle controls. Do not create another tiny wall box or fake goal-completion counter. Use independent real physical process and open material alternatives. If the only difference is a trivial speed threshold, classify that as ordinary Local Brain/H6 competence, not ReflexBrain proper.

**Research boundary:** this closes *this model family*, not the Owner-approved developing-resident R&D. PR #81 remains an important executable negative baseline; #82 is an additional isolated donor, not the default resident. Do not merge either into `main` by inertia.
