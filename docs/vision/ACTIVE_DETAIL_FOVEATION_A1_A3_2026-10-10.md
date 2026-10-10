# RB-VISION/A1–A3 — Owner correction: focus buys detail, not time-on-target
**2026-10-10 · Independently executable RGB research · no learned attention or canonical implementation**

**Branch:** `research/vision-lived-retina-loop-2026-10-10`  
**Draft PR:** https://github.com/Jozzpoly/ReflexBrain-Lab/pull/54  
**Exact tested source head:** `b6a2eb5d48e75f29323bfe751c6eb50d89a537fc`  
**Qualified full CI:** https://github.com/Jozzpoly/ReflexBrain-Lab/actions/runs/38091169630 — **43/43 test files, 126/126 tests PASS**, TypeScript & Vite build PASS.  
**Source:** `tests/living-organism/vision-distant-fine-acuity.test.ts`, `vision-two-feature-acuity.test.ts`, `vision-dual-band-sampling.test.ts` in `tests/living-organism/`. No original LivingWorld/Occupant/PrivateVision production modules modified.

## 1. Correction to scientific question

The Owner's focus idea is **not** fundamentally "keeping a salient object in the retinal center for more frames". The intended utility is **seeing small, distant or fine-grained differences that broad vision cannot resolve**, at a known opportunity cost elsewhere.

Correct target chain:
**broad, cheap cue → choose where to spend finer angular samples → acquire new discriminable *detail* → check whether that information has value relative to continuing activity → optionally retain a tentative time-stamped trace**.

"Focus" currently conflates at least four different control problems:
1. **Gaze steering:** turning the existing high-acuity center toward a point; implemented as finite-slew `gazeRate` in LivingWorld.
2. **Spatial sample allocation / zoom:** redistributing fixed ray budget among central detail and peripheral sentinels; *not supported by current native retina*, but researched in A3 without editing it.
3. **Temporal accumulation:** acquiring different fine details across time and deciding when they can be integrated without falsely treating different epochs as one scene.
4. **Physical focal depth / optical magnification / maximum detection distance:** absent from this simple 2D RGB raycast model. None of A1–A3 establishes a lens's depth of field or biological accommodation.

The earlier L1–L3 tests remain valid as **eye-motor/memory and closed-loop contact-pressure evidence**, but the previous primary "more turquoise-centered frames" metric was a misleading stand-in for the Owner's real aim.

## 2. Real existing sensor substrate

The Living Organism source retina has:
- **96 RGB rays** concentrated near current gaze by quadratic angular spacing across approximately ±80°;
- **30-Hz frames over 120-Hz physical dynamics**;
- legal actor-private proprioception and gaze; finite eye slew (up to ~3 rad/s);
- **12-metre hard optical cast range** in the source's `sample()`;
- colored nearest-hit surfaces, *not* privileged identity, guaranteed object identity, actual depth, texture shader, true world XY or learned semantics.

The new A1 source includes an explicit cap test: a 0.5m colored object with its center 10m away was observed through gaze over 160 ticks; at 14m it was not. **Higher angular acuity does NOT extend the 12m hard sensor reach**. Any genuine beyond-cap long-range vision requires changing the legal sensor law, not pretending more foveation can recover samples that never exist.

## 3. A1 — detail visible only after redirecting the same 96 rays

The host creates a larger identical gray cue with a *tiny colored surface fragment* near it (red or cyan), at range **6, 9 or 10.4m**, bearings **42°,48°,55°** and several angular phases. Two real LivingWorld cases differ in the tiny colored feature; no World identity/range or "look here" directive is delivered to the gaze chooser. The choice of where to look comes only from the existing coarse gray RGB samples. An independent orange object temporarily enters the opposite peripheral field as a host event.

**54 cue-then-detail cases, 96 rays per frame for both controls:**

| Optical outcome | Fixed gaze | Gaze guided by legal gray cue |
|---|---:|---:|
| Initial frame: gray cue but fine feature not sensed | 54/54 | 54/54 |
| Feature detected at least once during the run | 8/54 | **54/54** |
| Transient opposite-side orange object detected | **54/54** | 0/54 |

This is a positive **optical information-acquisition** discovery, NOT a recognition/learning or behavior-value claim. A "detail detection" here could be as little as *one* correctly colored ray and could be helped by sampling-phase shifts during gaze motion. Hence A2 explicitly strengthens the criterion.

**Range-cap control:** `RB_VISION_A1_RANGE_CAP` = 160 visible frame checks at 10m, 0 at 14m, under otherwise matched eye sweep, further disallowing "focus increases maximum physical vision range".

## 4. A2 — simultaneous two-part discrimination, not lucky single-ray contact

Host-visible feature is **two small colored spots** with swapped left/right red/cyan order on the same gray distant cue. Classifier works ONLY on legal RGB and each ray's known angular geometry. It requires:
- at least two same-color ray samples for each part in the **same** retinal frame;
- separation of their observed angular centroids;
- correct red-left/cyan-left order;
- optional stability across **three consecutive frames**.

On **36 independent finite configurations (2 ranges × 3 bearings × 3 phases × 2 patterns)**:

| Method | ≥1 correct qualified frame | ≥3 consecutive correct frames | Opposite-side orange event seen |
|---|---:|---:|---:|
| Keep gaze fixed | 0/36 | 0/36 | 36/36 |
| Blind authored gaze sweep | 34/36 | **0/36** | 36/36 |
| **Gray-cue-guided finite gaze** | **36/36** | **36/36** | 0/36 |

Guided sensor frequently continues to see correctly ordered parts for dozens of successive frames; blind sweep often sees them briefly but cannot sustain a detailed view. In a grounded paired example, the initial RGB is **identical across opposite color orders**, yet legal guided gaze distinguishes red-left and cyan-left after ~36 simulation ticks. This comparison is a very narrow prototype of genuinely inspecting something distant rather than merely watching it.

**Caveats:** the "inspection question" (read these two authored color marks) and the color classifier were designed by the researcher, not autonomously valued or learned. Surfaces are simple ideal-colored collision circles without lighting/texture or visual noise. Ranges up to ~10m with a 12m ray cap; no robust far-distance recognition beyond this.

## 5. A3 — candidate *redistribution* of the 96 rays without losing all peripheral monitoring

**Status: research-only hypothetical RGB transducer against frozen *real* LivingWorld/Rapier snapshots. NOT the existing Live retina.**

Three non-mutating ray schedules all cast exactly **96 legal nearest-surface RGB rays in the same fixed physical scene**, after the actor had acquired the gray cue from the original native retina:
- `native-shifted`: quadratic ±80° fovea oriented toward the cue;
- `wide-uniform`: 96 rays spread uniformly across body-forward ±80°;
- `dual-band-80-16`: 80 rays in the narrow ±9° cone centered on the cue; 16 rays sparsely monitoring the wider body-forward ±80° domain.

For the mixed sample geometry the transducer also outputs **the known actor-private angular direction of each RGB sample**; otherwise a mixed-order array could be misinterpreted as one contiguous image. No per-ray World identity, real range or hidden labels reach the classifier.

**54 cases (3 ranges × 3 bearings × 3 phases × 2 fine-detail orders), single extra inspection sample:**

| Allocation profile | Correct simultaneous two-part detail | Large opposite-side orange observed |
|---|---:|---:|
| Native shifted 96-ray fovea | **18/54** | 0/54 |
| Uniform 96-ray wide | 0/54 | **54/54** |
| Experimental 80 focused + 16 sentinels | **48/54** | **54/54** |

This suggests there may be a useful **multi-band point on the sensory Pareto frontier**. It does NOT establish a free improvement or the best adaptive allocation. In 6/54 details still alias under the split. Earlier A2's higher performance is not contradicted: A2 moves gaze through multiple real sampling phases over time, whereas A3 compares a **single frozen** sample at a cue-estimated direction. Angular phase affects fine detection substantially.

**Pre-view alias honesty:** of 27 red-left/cyan-left base pairs, **13** had exactly identical full initial 96×RGB previews; 14 had some already-different raw samples without satisfying the multi-ray classifier. Distinguish "not yet recognized" from "information mathematically absent" rather than inventing identical evidence for every scene.

**Very important negative-control limitation:** the orange object is large (radius 0.76m, range 6m) and appears near -56°, which aligns closely with a coarse sentinel around -55°. This explains the flattering 54/54. A small object between sentinel angles can disappear. Geometric check (NOT a physical CI qualification): 16 uniform rays across ±80° are ~10° apart; a radius 0.12m object 6m away subtends only ~1.15° half-width. Positioned at -60°, it falls between sentinel bearings -65° and -55° and is unobserved, while the 96-ray uniform schedule (approx. 1.67° spacing) detects it. A simple 40-case angular/radius ideal-circle screening gives 15 cases where the 96-wide schedule detects an object the 16-sentinel schedule misses. This is **analytical geometry**, not an independently executed Rapier event test or a natural-world detection estimate.

The 80/16 partition also ignores real accommodation, eye-actuator slew, gaze/sample-update time and dynamic attention costs. The same number of rays does not guarantee equivalent real CPU/GPU/energetic cost.

## 6. What this changes in the ReflexBrain Vision agenda

**EVIDENCE:**
- Real RGB broad appearance can legally guide the organism's gaze to recover previously undetectable distant detail at the same per-frame budget.
- True multi-part feature discrimination can be made stable by focus, compared with a broad authored sweep.
- A research-only 80/16 alternative can preserve large peripheral alerts while sampling detailed appearance in many finite fixtures; its cheap sentinel bank is fragile for small events.
- Detail acuity and retinal gaze steering are distinct from hard maximum sensing range.
- Actor-private sampling geometry must travel with nonuniform/mixed retinal evidence for legitimate spatial interpretation.

**FAILED / NOT QUALIFIED:**
- Fixed single-color-centering as a proxy for fine sight.
- A universal preferred retina profile: the synthetic sample geometry and phase are narrow; 18/54 or 48/54 must not be turned into an architectural selection.
- Automatic equivalence of "more visual pixels/rays" and better movement/agency; previous L1–L3 180-second evidence falsified that shortcut.
- A "free" mixed retina or general peripheral event robustness.
- Learned preferences, self-organized inspection questions, owned reasons, learned recognition, semantic object identity, or any Owner-level organism life.

**Next meaningful adversarial sequence, not an implementation commitment:**
1. Move the farther-detail question to held-out appearance/shape families, feature scales, occlusions, scene/actor motion and short flash peripheral events. Test against a strong no-foveation wide sensor and temporal dither.
2. Vary the budget of peripheral sentinels and **what the actor can miss**, not merely how many focal hits it gains. Compare at matched full ray count and wall-time CPU/cadence.
3. Let the actor allocate focal attention for a **materially continuing activity**, and measure whether the acquired detailed distinction changes competent next action under private lawfully learned/existing relevance. Do not pre-label every small red/cyan dot as a task goal.
4. Only then compare learned attention against simple fixed and scripted baselines.

The earlier PR #53 Vision range-ray study remains independent; this document and PR #54 use the *actual* 96 RGB Living Organism eye wherever possible.

## 7. External research context (inspiration, not qualification)
- CVPR 2025, *Seeing More With Less: Human-like Representations in Vision Models*, https://doi.org/10.1109/CVPR52734.2025.00416 — fixed pixel budgets and foveated resolution.
- Autonomous Robots 2023, overview of space-variant active robotic vision, https://link.springer.com/article/10.1007/s10514-023-10107-7 — separate detail/attention/peripheral constraints.
- PLOS Computational Biology 2017, *Object detection through search with a foveated visual system*, https://journals.plos.org/ploscompbiol/article?id=10.1371/journal.pcbi.1005743 — saccadic sampling and constrained search.
- Adaptive foveated single-pixel imaging, https://pmc.ncbi.nlm.nih.gov/articles/PMC5400451/ — dynamic supersampling across fixations.

## 8. Continuity / ownership
The Owner clarified the primary point of focus mid-campaign. **That correction takes precedence over the previous assistant's interpretation** of L1 "more centered frames." Keep L1–L3 as relevant negative physical consequences and memory mechanisms, but select A1–A3's detail-vs-cost question for this branch's next vision trajectory.

All code changes so far are test-only on the research branch. PR #54 remains a DRAFT donor against `research/living-organism-runtime-a-2026-10-08`; do not merge into canonical ReflexBrain or import into Feniks/Combat by inertia. Source/test CI validates narrow mechanics, never owner-observed life.
