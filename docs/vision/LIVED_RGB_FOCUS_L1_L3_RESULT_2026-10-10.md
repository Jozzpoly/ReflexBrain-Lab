# RB-VISION/L1–L3 — real RGB active-gaze and private memory on a continuing organism

**2026-10-10 · Independent Vision scout / executable donor · no actor-life or learned-initiative claim**

Owner vision: An organism might choose its own sight-line focus and retain a temporary record of discoveries from past scans. The previous V1–V7 branch established range-ray information aliases, body-relative geometry, stale observations and dense-fovea/temporal interleaving tradeoffs. This work asks a much narrower but more demanding question: what survives **on an already existing continuous organism with an actual RGB retina**, without silently granting it range, World coordinates or host labels?

**Research branch:** `research/vision-lived-retina-loop-2026-10-10`  
**Draft PR:** https://github.com/Jozzpoly/ReflexBrain-Lab/pull/54  
**Independent donor parent:** `research/living-organism-runtime-a-2026-10-08` (previously audited as executable SCOUT, not canonical brain)  
**Exact test-source head:** `427474ab68c30990f338e339b2553e42b988ea06`  
**CI:** https://github.com/Jozzpoly/ReflexBrain-Lab/actions/runs/38089520247 — **40/40 test files, 119/119 tests, TypeScript PASS, Vite build PASS**. Source test `tests/living-organism/vision-continuous-gaze-donor.test.ts` plus `tests/living-organism/vision-private-rgb-revisit.test.ts`. The subsequent documentation commit does not modify the evaluated tests.

No LivingWorld, Occupant, PrivateVision or canonical ReflexBrain runtime modules were changed.

## 1. Baselines and provenance

Existing actual LivingRuntime:
- 120-Hz physical World; 30-Hz lawful private observation clock;
- 96 quadratic/foveated angular samples, RGB of the nearest visible surface only — **not true depth**;
- actor-private gaze/proprioception, touch, time, actual optional gaze motor with finite slew/clamping;
- existing default `Occupant` with continuing authored exploration/approach/inspect/yield modes, source of 100% of the motion control in L1;
- independent ecology: physical World drives a mover even without user command.

Actor-private focus controller sees exclusively `PrivateFrame` and its own prior state. No `world.inspect()`, object handles, World XY, hidden event phase, collision object labels, or post-branch oracle in its inputs. Host microscope metrics may and do inspect true movement, contact impulses and colors for scientific evaluation only.

**Five rival gaze policies** use the exact same existing 96 RGB rays every frame:
- `native`: original Occupant's gaze command;
- `center`: always return gaze near body forward;
- `clock-sweep`: a deterministic time-based sinusoid, no memory;
- `visible-centering-only`: center the currently visible turquoise patch; otherwise cheap sweep; **no remembered target steering**;
- `private-reacquisition`: same visual centering and sweep, but while a previously seen turquoise patch is lost (bounded to 360 ticks) direct gaze using its last private inertial bearing and integrated private angular velocity.

This is a strong **memory ablation** because the last two use the same current-patch centering and same generic fallback sweep. Only the presence/use of last-seen private direction differs.

The donor's turquoise extraction is an **authored color salience convention**, not autonomous semantic target ownership. The controller is written by a researcher and does NOT learn from the episodes.

## 2. L1 — 60s × 2 environments, real material continuations

**CI:** same exact head `427474ab...`; an earlier check on `895e0d4...` also passed its narrower version with no contact-severity metrics.

Scenes:
- `native-world`: default objects + continuously powered mover;
- `shifted-visible-surface`: host moves one initially visible turquoise object before launch; this is scenario authoring, not a cognition input.

**Each arm**: 7200 physics ticks = 60s continuous no reset, 1800 private RGB frames, identical sample count/capability; physical trajectories are allowed to diverge after gaze affects perception and Occupant's motor decisions. Source starts from same environment configuration within scene. Stats are descriptive and deterministic, **not repeated randomized trials**.

| Policy | Turquoise-visible frames native/shifted | Foveal turquoise frames native/shifted | Host contact sample events native/shifted |
|---|---|---|---|
| native | 1051 / 1086 | 402 / 371 | 57 / 66 |
| center | 994 / 1056 | 483 / 458 | 52 / 53 |
| clock-sweep | 1109 / 1134 | 78 / 63 | 77 / 78 |
| visible-centering-only | **1634 / 1642** | **1021 / 1026** | **49 / 49** |
| private-reacquisition | 1565 / 1484 | 1019 / 952 | 50 / 53 |

**Important falsifier:** memory-assisted focus did NOT beat the no-memory visible-centering policy on either visible-frame count, foveal samples, or lower physical contact-event count in these two scenes. It truly used memory in 90 and 180 of the 1800 private frames, respectively, so the added mechanism was active rather than dead code. More samples of a salient color are also not evidence of richer exploration, agency, actor-owned motives, or world comprehension.

Incidental RGB color coverage did NOT establish the simple predicted peripheral starvation: the visible-centering-only policy actually captured **more** orange and purple frames than private-reacquisition in the 60s test. Thus do not claim a general biological tunnel-vision result merely from narrower attentional design.

The world's physical continuation is causally changed via retina→authored Occupant demand; no inference about improved life follows.

## 3. L1 180s without-reset stress, and contact-event correction

**Arms**: native, visible-centering-only, private-reacquisition; one default world for 21600 physics ticks (3 minutes) each, still no reset. Exact CI `38089520247`.

| Measure | native | visible-centering-only | private-reacquisition |
|---|---:|---:|---:|
| Total physical distance, m | 87.178 | 86.692 | 89.104 |
| Distinct sampled World cells (rough host metric) | 44 | 46 | 39 |
| RGB frames with foveal turquoise | 1080 | 2601 | 2717 |
| Host **per-step** contact-event records | 175 | 248 | 349 |
| Sum of actual solver contact impulses | 28.504 | 28.017 | 31.812 |
| Private touch-positive **30Hz frames** | 93 | 110 | 132 |
| **Distinct contiguous touch episodes** | 43 | 39 | 43 |
| Longest touch run (30Hz frames) | 12 | 38 | 49 |
| Per-minute travelled distance, m | 30.42 / 30.28 / 26.48 | 29.69 / 29.40 / 27.61 | 31.04 / 30.00 / 28.06 |

**Critical correction:** `349 vs 175` is **not** 349 independent collisions vs 175. Contact event instrumentation records solver events during contact; same collision can persist over many physics steps. Distinct touch episodes are tied (43/43) between native and memory policy, while touch-positive frames and maximum continuous contact length increase. The summed impulse is only ~11.6% higher in private-reacquisition than native, not twice as large.

The observed issue is therefore **longer contact persistence** and a modest increase in total physical impulse in this specific deterministic World, rather than a validated doubling of material harm.

The three strategies all continued locomotion throughout their three 60-second windows, so this is not a total deadlock regression. No broad efficiency, gameplay feel or ecological generalization follows.

**Working implication:** maximizing foveal visibility can change the entire closed-loop body behavior and may increase *time stuck in contact* even when the eye controller never sees World collision metadata. Merely measuring target frames is an inadequate evaluation criterion.

## 4. L2 — identical present RGB; mirror-image lawful private history

**Code:** `tests/living-organism/vision-private-rgb-revisit.test.ts`.  
**CI:** `38089235298`, 40/40 test files, 117/117 tests PASS at source `f36a98c...`, superseded by final L3 qualification at `38089520247`.

A single turquoise body is at private initial bearing approximately **±1.93 rad** (±111°), outside the default forward retina FOV. The actor acquires it by legal gaze rotation, retains its estimated **bearing/time only**, then returns gaze to center. The actor's **current retinal RGB and physical body state at the decision boundary are equal** for left- and right-history variants; its previous sensory history is different.

At tick 120, from actual World snapshots:
- **memory-guided gaze** reacquires the old target at tick **148**, both mirrored sides;
- a hardcoded right-only scan reacquires only the right target; left-only only the left; center-only neither in the test horizon;
- thus private historical information has real value **for the sensory choice** in this bounded geometry, even with **no range channel and no World ID**.

A host-only **unseen relocation** at the decision boundary moves the target to the opposite side. Current private evidence is still empty, and the actor did not receive this event. Naive memory-guided gaze now misses the target. This is **not** actor material benefit, since the body is stationary. It is an epistemic eye-actuation demonstration.

## 5. L3 — lawful negative evidence can redirect search

**CI** `38089342940`, subsequently included in `38089520247`: 40/40 files, 118/118 tests PASS on first L3 qualification.

An authored `memory-verify-search` policy keeps L2's initial memory-guided search. If the actor has aligned its fovea where a previously seen fragment *should* plausibly appear, but sees no matching patch in a fresh private sample, the current memory hypothesis becomes **disconfirmed for that expectation** (not proven false as material truth). It then switches to an opposite-side sweep.

In mirrored `hiddenMoved` cases:
- first private negative-evidence boundary: tick **180**;
- reacquisition after broader search: tick **268**;
- naive unbounded pursuit of previous bearing: **no reacquisition**;
- in static-control cases: target reacquired at tick **148**, no false memory disconfirmation.

No hidden `moved` flag or coordinates drive the policy. The failed look is the actor-private causal cue. This is *authored belief-revision logic*, not learned uncertainty estimation or an internally selected meaningful commitment.

Tradeoff: more search time and gaze travel; stationary visible history shows no demonstrated need to search.

## 6. Scientific interpretation and explicit anti-claims

**Defended as EVIDENCE / DONOR**
1. Real RGB-and-proprio memory can steer lawful gaze differently despite identical current retinal frames.
2. Actor-private failed reacquisition can alter subsequent gaze without awareness of hidden World event.
3. More foveal sighting does not imply material locomotion benefit; extended continuous physical behavior can show longer contact persistence.
4. Sensory motor value must be evaluated on physical afterstates, and contact counts separated from duration and impulse.
5. A strong simple **visible-centering-only** policy must be kept as comparator; the memory add-on has not earned general usefulness.

**NOT established / OPEN**
- learned selection of gaze/focus, actor-originated reasons, curiosity, memory confidence calibration, identity, depth, full spatial map or world LOD;
- a learned organ inside canonical ReflexBrain, any particular architectural format or shared simulator;
- cross-world robustness beyond two authored 60s scenes and one 180s scene;
- benefit after realistic gaze energy/CPU budget: angle motion is bounded physically by the donor but not charged energetic cost;
- Owner-qualified life or Feniks gameplay quality. CI validates mechanism, never supersedes Owner judgement.

**Specific confounds**
- Existing `Occupant` is an authored motor controller with color-salient `turquoise` behavior; gaze and motor share the same view, so later physical differences are downstream of the same authored motor.
- A face/eye movement is not free for every morphology even if this donor does not meter energy.
- Private inertial heading from integrated omega drifts; memory is just one old bearing, not object identity, place or rich temporal scene.
- L2/L3 mirrored stationary scenes are controlled **sensory** tests; no self-motion, goal choice, or task value.
- One moving default ecology and one initial placement variant do not provide stochastic confidence intervals or distribution-level guarantees.
- Private nonappearance can mean movement, occlusion, missed samples, changed appearance or mistaken correspondence; an authored opposite sweep is not a universal epistemic update.

## 7. Decision: do not build a larger retina or a map as a reaction

At this point the limiting piece is **why and when acquiring a particular observation matters to the ongoing physical activity**.

The minimum discriminating future competence test should require:
- a continuing locally embodied activity with genuine material consequence, where its significance is evidenced by an existing actor-private history/relation rather than an event-clock script;
- independent World changes with no hidden leakage;
- actor-available visual observations through the **real RGB law**, plus body-local proprioception and touch;
- two matched cases where the same currently visible stimulus merits different looking/action because of different private history/standing material concern;
- matched strong baselines: native Occupant, visual centering without memory, scripted scanning, private memory + finite revisitation, simple touch/proprio/event alternatives;
- learned sensor/controller challenger **only when** candidate target/reward and lawful training data are properly grounded; do not count analytical ORACLE labels as actor learning;
- explicit outcome: actual material improvement, missed peripheral events, contact duration and impulse, gaze energy/sample/compute, and counterfactual explanations.

If that test cannot be framed without **planting a test-authored reason** at exactly the desired sensory moment, report F3/F4 OPEN and keep Vision as a bounded donor. Do not solve by replacing a scripted look with a neural net that merely imitates it.

### Relationship to externally established approaches
- Shang & Ryoo, *Active Vision Reinforcement Learning under Limited Visual Observability*, NeurIPS 2023: https://proceedings.neurips.cc/paper_files/paper/2023/hash/20e6b4dd2b1f82bc599c593882f67f75-Abstract-Conference.html — research precedent for motor vs sensory policies learned together, **not proof that ReflexBrain should copy SUGARL**.
- Pedamonti et al., *Hippocampus supports multi-task reinforcement learning under partial observability*, Nature Communications 2025: https://www.nature.com/articles/s41467-025-64591-9 — supports testing memory in different observability conditions; architecture transfer unearned.

### Operational recovery
Owner requested longer autonomous runs and natural new-chat recovery with minimal manual prompting. This branch is **a real-RGB/Living donor**, separate from `research/vision-embodied-experience-2026-10-10` (PR #53, earlier V1–V7 range-ray hypotheses). The two must not be confused. Neither is canonical and neither should be merged by inertia. For next conversation first check live GitHub PR #54 head and Control Room status, then recover THIS doc, source tests and exact CI verdict. Preserve narrow scientific negatives over attractive visuals.
