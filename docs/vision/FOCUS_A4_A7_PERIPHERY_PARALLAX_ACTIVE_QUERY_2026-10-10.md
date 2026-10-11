# RB-VISION/A4–A7: Foveal detail, peripheral blindness and body-scaled visual inquiry

**2026-10-10 · VISION SCOUT / EXECUTABLE EVIDENCE · NOT A LEARNED OR LIVING BRAIN QUALIFICATION**

**Research draft PR:** https://github.com/Jozzpoly/ReflexBrain-Lab/pull/54  
**Branch:** `research/vision-lived-retina-loop-2026-10-10` (from audited `research/living-organism-runtime-a-2026-10-08`)  
**Fully qualified test-source HEAD:** `694e307abc065d209af77676978af7aaaf9e83fb`.  
**Exact-source full check:** https://github.com/Jozzpoly/ReflexBrain-Lab/actions/runs/38093117234 **PASS: 46/46 test files, 135/135 tests, TypeScript and Vite build**. Prior exact-source A3 blind-zone CI `38092547472`, A4 original `38092630422`, A4 held-out-motion `38092749908`, A5 physics `38092840409`, A6 parallax `38092983763` also passed. Later docs commits do not requalify tests.

**Direct Owner relevance:** Fine focus should produce otherwise inaccessible detail, including distant/near-threshold geometry, **at a visible cost elsewhere**. Retinal centering frequency is NOT the measure of success. The Owner also envisaged an organism controlling its own sight lines and retaining temporary traces of earlier scans.

This report supersedes the tempting architectural inference "80+16 rays is a sensible default" from A3. Its own counterexamples invalidate that promotion. Keep A1–A3 documented in `docs/vision/ACTIVE_DETAIL_FOVEATION_A1_A3_2026-10-10.md`.

## Executive scientific conclusion

**One universal spatial eye layout is not yet justified.** Under a 96-ray RGB budget, a sharp center and sparse peripheral sentinels trade detailed recognition against the probability and timing of seeing short, small events. Phase dithering can either help or catastrophically miss a particular held-out event geometry.

For a simple passage-affordance question, two precise views and private self-motion substantially improved subsequent actual physics decisions compared with a broad eye; but the best insight is the cost-aware counterexample: **just 8–16 carefully directed, sequential RGB queries across two viewpoints almost reproduced the material benefit of 192 extra high-density rays**. Continuing error of ~3cm was increasingly dominated by private odometry, not angular sample budget.

This is **mechanistic research about lawful sampling and physical interpretation**. An authored "choose whether to drive into this passage" goal is not an organism-owned reason, and no trained policy/model appears in this PR.

## A4/1: The peripheral coverage trap (real Rapier RGB)

**Code:** `tests/living-organism/vision-dual-band-sampling.test.ts`.  
**CI:** `38092547472`: **43 files / 127 tests PASS**.

A3 originally reported a large orange peripheral collider (radius 0.76m at distance 6m, bearing close to a selected -55° sentinel). All **54/54** cases were visible through 16 peripheral rays, incorrectly flattering the 80/16 split.

The adversarial follow-up inspected **40 configurations**: peripheral bearing -63° to -47° in 2° or smaller increments and radius 0.12, 0.25, 0.45, 0.76m. Real nearest-surface RGB casts from Rapier states:

| Retinal angular coverage | Seen/40 |
|---|---:|
| 96 uniform broad rays | **40/40** |
| 80 focused + 16 peripheral | **25/40** |
| 96 quadratic rays rotated to distant detail | **0/40** |

**15 physical instances** detectable by wide vision were **blind** under the 16-sentinel profile. This is not artificial loss due to different total ray counts: every profile cast 96 rays. In short, a sparse sentinel bank is not guaranteed a peripheral warning channel, especially for small or near-grid-boundary appearances.

## A4/2: Six-frame time pressure and held-out appearance motion

**Code:** `tests/living-organism/vision-dual-band-temporal-stress.test.ts`.  
**CI:** `38092749908`: **44 files / 130 tests PASS**.

Actual LivingWorld/Rapier physics checkpoints and the native optical color/range law are the basis for an independent experimental RGB sampler. **This variable-density retina is not yet implemented in the LivingWorld production sensor**. The World/host independently moves and flashes the orange collider; the actor sensor receives only its RGB rays and corresponding known ray angles.

All policies cast **96 RGB rays per frame, six frames (576 total)**. The main fixture uses a distant two-color feature near a gray cue and a brief peripheral object visible for 1–3 frames, in **81 combinations** of angle, radius and duration.

| 96-ray division | Distant two-part detail at least once / 81 | Short peripheral event seen / 81 | Both / 81 |
|---|---:|---:|---:|
| 96 uniform wide | 0 | **81** | 0 |
| 96 focused on cue | **81** | 0 | 0 |
| 80 focus / 16 periphery | **81** | 39 | 39 |
| 80/16 with alternating ±2.5° sentinel phases | **81** | 52 | 52 |
| 64 focus / 32 periphery | **81** | 60 | 60 |
| 48 focus / 48 periphery | **81** | **75** | **75** |

A **post-D0 adversarial set of 32** adds different detail range, bearing, angular phase, feature order, and host-driven movement of the peripheral appearance between 30Hz samples. Again 576 rays per case and no changed physics between sensor variants:

| Division | Distant detail / 32 | Peripheral object / 32 | Both / 32 |
|---|---:|---:|---:|
| 96 uniform wide | 0 | 32 | 0 |
| 96 concentrated | 24 | 0 | 0 |
| 80/16 | **32** | 16 | 16 |
| 80/16 phase alternating | **32** | **0** | **0** |
| 64/32 | **32** | **32** | **32** |
| 48/48 | **32** | **32** | **32** |

**Material negative:** The very interleaving that improved A4's original 80/16 fixture (39→52) yielded **0/32 peripheral events** in the adversarial set. This is aliasing with scene/sample phase, not a proof dither is universally harmful. Neither 48/48 nor 64/32 should be promoted to canonical defaults from these nonrandom authored fixtures.

**Boundary:** the peripheral object is repositioned by an independent host schedule at observation intervals, not simulated as an independently force-driven free body on a calibrated distribution of trajectories. Alert detection here is *optical event evidence*, not proven collision avoidance. No decision/action uses the sensed orange threat.

## A5: Material consequence from visual detail vs one calibrated ray

**Code:** `tests/living-organism/vision-physical-clearance-action.test.ts`.  
**CI:** `38092840409`: **45 files / 132 tests PASS**.

Actor's actual physical disk radius: **1m**. Two fixed, thin solid walls form an opening of half-width 0.92–1.08m. Wall locations x=2.7, 3.0, 3.3m give **24 scenarios**. A real LivingWorld 120Hz physics branch applies forward motor demand or holds for 200 ticks. Host analyzes actual displacement and accumulated collision impulses using the explicitly authored cost `-displacement/E0_RADIUS + 2*solverContactImpulse/(E0_MASS*E0_VMAX)`. The actor/controller receives no physical future outcome or gap labels.

The frozen **initial native 96×RGB image** is exactly equal for an adversarial pair at x=3 with gaps 0.97 and 1.03m, although *trying to move* has opposite material value. A researcher-authored RGB angular-sample rule chooses push/hold from whether an upper-wall color is encountered near the actor-radius clearance line. No learned action policy or physical reason.

**When wall distance is the calibrated x=3 only (8 half-gaps):**

| Sampling | Correct lower-cost motor branch / 8 |
|---|---:|
| 96 broad uniform | 6 |
| 96 fine rays around observed edge | **8** |
| 80/16 split | 7 |
| 95 broad rays + one precisely aimed ray | **8** |

**Critical strong cheap baseline:** a single appropriately placed legal ray, with the other 95 left for broad observation, matched the full 96-ray fovea on the narrow calibration family. Detailed optics should not be celebrated for a problem solved by a targeted one-bit query.

**Adversarial range shift (x=2.7 and 3.3 added):**

| Sampling | Correct / 24 | Mean regret vs per-scene future-cost oracle |
|---|---:|---:|
| broad 96 | 15 | 5.837 |
| fine 96 | 16 | 6.130 |
| mixed 80/16 | 15 | 6.461 |
| 95 broad + one fixed-range query | 16 | 6.130 |

The one-ray rule's hidden assumption that the opening is precisely x=3m is **not actor-earned**. Moving the same physical geometry undermines both full fovea and probe choices. More rays do not automatically infer material clearance without body-relative geometric interpretation.

## A6: Two focused views + private self-motion, genuinely consequential

**Code:** `tests/living-organism/vision-private-parallax-clearance.test.ts`.  
**CI:** `38092983763`: **46 files / 134 tests PASS**.

Across the **same 24 material gate variants**, actor begins with lawful native RGB, then physically drives **40 ticks at 120Hz**, travelling **0.9407m host-truth** and integrating its own 30Hz forward proprioception to infer **0.9091m** (a **3.16cm systematic underestimate** in this clean specimen). It captures the upper-wall visual edge from **two different body-relative viewpoints** without receiving World coordinates, x-distance or a depth channel.

The hypothetical optic transducer makes TWO additional 96-ray inspections (192 extra rays) after local native coarse previews; the only difference is broad sampling vs dense edge-directed sampling. At the same post-motion physics snapshot, candidate push/hold motor branches yield actual displacement/contact outcomes for an analyst-only cost. Decision rule uses `gapEstimate = privateMove * tan(edge0)*tan(edge1)/(tan(edge1)-tan(edge0))` and compares with own known disk radius.

| Two-view inference | Lower-cost decision / 24 | Mean absolute half-gap error | Mean material regret |
|---|---:|---:|---:|
| Wide RGB twice + proprio | 11 | 0.1057m | 11.999 |
| **Fine RGB twice + proprio** | **19** | **0.0306m** | **1.470** |
| Strong 1-ray probe with assumed fixed x=3 | 16 | no metric estimate | 6.985 |

**Qualification:** This is a real, temporally prior **private sensory-memory + own motion → inferred geometry → chosen motor demand → actual physical consequence** chain. It provides a meaningful, limited benefit to *an authored movement activity* under narrow geometric constraints. It is NOT self-originated appraisal, a learned affordance model, or independent body/goal commitment. 5/24 choices still fail, mostly close to true radius threshold, due both private odometry drift and angular uncertainty.

## A7: The economical alternative—two-view iterative RGB edge queries

**Code:** additional test in `tests/living-organism/vision-private-parallax-clearance.test.ts`.  
**CI:** `38093117234`: **46 files / 135 tests PASS**.

For a single simple color boundary, begin with **the same legal coarse RGB bracket**, then narrow its angular hit/miss interval through iterative one-ray RGB queries at each of two viewpoints. Queries get only legal appearance; no range or hidden World label. Actor still integrates its own 40-tick motion, and push/hold material outcomes are measured identically.

| Additional query rays over both viewpoints | Correct actual physical decisions /24 | Mean absolute half-gap error | Mean material regret |
|---|---:|---:|---:|
| 4 = 2 queries per view | 18 | 0.0357m | 3.292 |
| **8 = 4 queries per view** | **18** | **0.0324m** | **1.764** |
| 12 = 6 queries per view | 18 | 0.0333m | 1.764 |
| 16 = 8 queries per view | 18 | 0.0337m | 1.764 |
| Two extra 96-ray dense scans (A6) | **19** | **0.0306m** | **1.470** |

**Result:** 8 additional legal directed rays almost reproduce the material decision gain of 192 additional dense rays *for this one-color, monotone, quasi-static threshold*. After about 4 queries per viewpoint, further angular precision ceases to significantly improve the decision: the limiting factors have shifted toward **private proprioceptive/odometric bias, scene geometry/model calibration and near-threshold uncertainty**.

**Do not call this an automatic ~24× runtime speedup.** Both methods also use the baseline native RGB retina and the motion history, and no CPU/energy/latency benchmark is taken. The adaptive measurements are sequential ray queries against an artificially frozen state at each pose; in dynamic scenes, the world may evolve between such questions. A feature with fragmented edges, occlusion or multiple similar-looking surfaces violates the monotone hit/miss assumption; a rich retinal patch could then be necessary. The actor does NOT learn to choose query angles.

## Falsifiers left open / danger of overpromotion

1. **Occlusion/multiple fragments:** upper-wall color boundary is simple and monotonic. The binary-search optic would break or ask the wrong question if foreground appearance aliases multiple surfaces, or if walls are texture-rich, sloped, layered, destructible or 2.5D-occluded.
2. **Temporal concurrency:** A4 peripheral appearance was updated independently by the host; A5/A6/A7 gates stayed physically static during sensing. No valid argument yet that parallax plus sequential queries work under unknown independent wall motion or multisensory latency.
3. **Sensor law differences:** A6/A7 use RGB surface sampling plus known ray bearing (lawful), *not* RGBD, host coordinates or object identity, but the extra dynamically steered ray-angle sensor is a **research-only sidecar**. Native LivingWorld does NOT expose such per-ray allocation API to its occupant.
4. **Body estimate:** actor is a circle of known radius. It did not learn that radius, joint reach, physical collision envelope or gait-dependent body dynamics.
5. **Question and motivation:** the relevant environmental quantity "can my radius pass that gate" and cost of progress/contact are **researcher-authored**. The organism has not generated the need to inspect, learned to distrust an old estimate, or owned a persistent material activity/goal through the test.
6. **Cost:** raycasts per frame are controlled, but computation overhead, simulation wall time, query-latency, gaze actuator energy, shifting perspective costs, risk while approaching and missed concurrent threats are not costed. A7 samples a frozen World during adaptive serial queries.
7. **Generalization:** all variants are engineered synthetic 2D environments. The 24 gates are a small structured grid, not 24 random levels or an independent real-world generalization corpus. The A4 81/32 counts also have controlled generated structure. Do not infer confidence intervals or universal preferred ratios.
8. **Owner experience:** CI PASS is mechanical/test PASS only; no Owner play/behavior observed. Existing LivingWorld cognition remains an authored Occupant routine.

## Strategic consequence for ReflexBrain

The earlier Owner idea of an organism directing **its own sight lines and remembering earlier scans** should now be split into two distinct experimental capabilities:

**Optical question formation (still authored):** choose whether to spend more rays at a place, alter spatial density, perform a sequence of narrow RGB queries, or inspect from a different physical pose. The correct selection depends on *what material uncertainty is relevant*, not one preferred pixel/ray count.

**Privately situated belief revision (partly demonstrated):** remember time-stamped RGB edges, integrate proprioceptive movement, estimate a geometric relation rather than using a host-provided `passable` flag, and update action. The next limiting dimension is uncertainty calibration and independent change, not merely retina density.

**No new canonical feature is earned.** Do not bake 48/48, 64/32, 80/16, the calibrated 1-ray oracle or A7 binary-search geometry into the organism architecture. A future eye could have multiple simultaneous sampling modes or adaptive attention over time, but that remains a hypothesis for the Owner and ReflexBrain Control Room.

**A material next falsifier before architecture promotion:**
- independently moving, occluding or destructible physical geometry through *the same two-view inspection window*;
- competing peripheral signals during a continuing actor activity;
- query latency and gaze/sampling costs measured, with same legal RGB history and alternative motor policies;
- a strong cheap RGB ray/touch/proprio/event comparator;
- ultimately a continued actor reason to ask the question, not an experimenter's hand-coded `if gate then query` script.

Do not use a neural network merely to imitate these authored query schedules and call it curiosity. F2/P0's negative result remains a warning that visual surprise/mismatch alone does not establish material competence.

## Relevant external research / not source proof

- [Blauch, Alvarez & Konkle, FOVI, ICML 2026](https://proceedings.mlr.press/v306/blauch26a.html): receptive-field-based foveated model interfaces and variable-resolution manifolds. A promising *representation competitor*, not a directive to copy into ReflexBrain.
- [Ludwig, Davies & Eckstein, foveal analysis and peripheral selection](https://pmc.ncbi.nlm.nih.gov/articles/PMC3896144/): parallel foveal detail and peripheral selection as separately evaluated functions.
- [Anton-Erxleben & Carrasco, attentional resolution](https://doi.org/10.1038/nrn3443): attention can change spatial resolution and ignored-region information.
- [Shang & Ryoo, active vision RL, NeurIPS 2023](https://proceedings.neurips.cc/paper_files/paper/2023/hash/20e6b4dd2b1f82bc599c593882f67f75-Abstract-Conference.html): joint sensory/motor policy study, no direct qualification for our organism.

## Recovery in the next conversation

Read this report and the two predecessor docs:
- `docs/vision/ACTIVE_DETAIL_FOVEATION_A1_A3_2026-10-10.md` (Owner-corrected focus question);
- `docs/vision/LIVED_RGB_FOCUS_L1_L3_RESULT_2026-10-10.md` (real retinal/behavioral donor and contact-pressure negatives).

Verify live GitHub PR #54 branch/HEAD/CI before any further action. PR #53 is an independent early V1–V7 range-ray donor and links here. Main canonical ReflexBrain is separately maintained; do not edit it or Feniks/Combat automatically. This research lab's central unresolved boundary remains **organism-owned material need to direct/refresh lawful perception**, with cost and counterfactual qualification. Long autonomous runs should minimize Owner interruption and avoid uncontrolled commit proliferation.

**Next direction after this bounded study is NOT another synthetic passability test for its own sake.** Prefer an experiment falsifying the observed material benefit when visually relevant geometry changes during inspection or when competing peripheral activity forces a real allocation tradeoff—then reconcile with main Control Room's F3/F4 competence frontier.
