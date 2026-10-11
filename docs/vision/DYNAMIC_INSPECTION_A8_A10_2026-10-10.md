# RB-VISION/A8–A10 — Dynamic world, three-view belief consistency and the limits of looking

**2026-10-10 · Independent research DONOR / falsification, not canonical organ implementation**  
Draft: https://github.com/Jozzpoly/ReflexBrain-Lab/pull/54  
Branch: `research/vision-lived-retina-loop-2026-10-10`  
**Qualified exact test-source HEAD:** `8935c6b2bccb605ae13e97935b0c4d4bbe37f25c`  
**Full CI:** https://github.com/Jozzpoly/ReflexBrain-Lab/actions/runs/38094479705 — **47/47 test files, 138/138 tests PASS**, TypeScript and Vite build PASS.  
Source: `tests/living-organism/vision-changing-aperture-during-inspection.test.ts`. Production `LivingWorld` / `Occupant` untouched.

## Decision in one paragraph

The previous A6/A7 results (focused RGB views + private proprioception yield better material decisions, and 8–16 targeted rays can nearly match 192 fine rays in a fixed gate) **do not survive without qualification** when the object of observation changes during an inspection. RGB measurements can be accurate per instant while their inferred geometry is false because multiple epochs were treated as one static world. Even three views cannot identify the cause of inconsistency, and events after the most recent legal sample create an unavoidable private-information alias. **More acuity is not knowledge freshness or actor-owned relevance.** Do not promote a fixed fovea, static parallax or serial binary-search logic to canonical ReflexBrain.

This report continues:
- `docs/vision/FOCUS_A4_A7_PERIPHERY_PARALLAX_ACTIVE_QUERY_2026-10-10.md`;
- `docs/vision/ACTIVE_DETAIL_FOVEATION_A1_A3_2026-10-10.md`;
- `docs/vision/LIVED_RGB_FOCUS_L1_L3_RESULT_2026-10-10.md`.

The Owner's clarified focus aspiration remains: *careful fine/distant inspection at a real opportunity cost*, not minimizing distance between an arbitrary salient color and the center of the retina.

## A8 — Host-changing material aperture during a serial eye inspection

18 actual Rapier/LivingWorld gate experiments: wall distances **2.7, 3.0, 3.3m**, near-body gate half-widths **0.94m (blocked)** / **1.06m (open)**. Each distance includes 2 static controls, 2 transitions **between** first and second viewpoint, and 2 transitions **during** four sequential RGB questions at the second viewpoint.

**Host-only material intervention:** two physically fixed-wall colliders are translated in real Rapier snapshot during World continuation. This is scripted externally (not free physically moving ecology), but their presence, dimensions, collision and motor consequences are real. The actor gets no `moved` flag, collider ID, gap width or World coordinates.

**Lawful input:** existing 96 RGB quadratic retinal snapshots plus own forward velocity sampled at 30Hz, and optional research-only hypothetical RGB inspection rays with known actor-local angles. Motor action `push` or `hold` is an authored activity, and the material evaluator uses actual subsequent displacement and contact impulses. The comparison is not learned.

**Important implementation correction:** the body continues moving due to momentum while asking sequential questions. The experiment now integrates its private proprioceptive motion **during those query intervals**, rather than falsely treating looking as a pose freeze. The 4 one-ray questions per view each advance **4 actual 120Hz ticks**. The World may independently change in the middle. The dense comparator takes a fresh final snapshot; schedules are not identical in latency, which is part of the risk being exposed. Each variant's physical outcome is evaluated from the same final Rapier checkpoint.

| Variant | True lower-cost action / 18 | Static / 6 | Change between views / 6 | Change during second queries / 6 | Mean regret vs oracle |
|---|---:|---:|---:|---:|---:|
| 2 dense RGB edge inspections (192 extra rays) | **6** | 6 | 0 | 0 | 11.826 |
| serial 4+4 focused RGB questions (8 extra rays) | **6** | 3 | 0 | 3 | 15.387 |
| unconditional hold (0 extra rays) | **9** | 3 | 3 | 3 | **3.529** |
| unconditional push (0 extra rays) | **9** | 3 | 3 | 3 | 14.211 |

Physical regret is host-only: chosen physical cost minus the lower of `push` and `hold`, with cost `-forward_displacement/E0_RADIUS + 2*contact_impulse/(E0_MASS*E0_VMAX)`.

**WHY DENSE FAILED:** the two-view inference explicitly assumes `gap` did not change between views. When the gate opens, combining the old narrow angle with the new wide angle can paradoxically imply a smaller clearance; when it closes, inference may imply a larger clearance and cause damaging push. A precise *fresh angle* does not validate a stale *static-scene model*.

**WHY SERIAL FAILED EVEN FOR SOME STATIC CONTROLS:** the actor can translate between individual narrow RGB rays. Treating the four temporally distinct angular answers as if they belonged to one pose builds a phantom edge; even correcting the total own-odom displacement after the fact is insufficient to spatially register each query. If the object also changes halfway through the questions, data mix both old and new material edges.

**Anti-claim:** `hold` beat both sighted heuristics on this specific symmetric set with an asymmetric heavy contact penalty. This does not prove that organisms should usually stop, or that seeing less is inherently better. It proves **sensor richness without a valid context-dependent interpretation can increase action regret**.

## A9 — Third lawful view and a weak sensorimotor model-conflict signal

12 real material outcomes: at each of **x=2.7, 3.0, 3.3m**, static blocked/open cases and hidden opening/closure between the second and third physical viewpoint. Actor moves through two 24-tick forward motor segments, accumulates body-private velocity odometry, and acquires **three 96-ray focused RGB edge observations**. The host selects changes but never sends that knowledge to the actor. The controller compares:
- `g01` — geometric aperture inference from views 0→1,
- `g12` — independent inference from views 1→2,
- `g02` — naive two-view inference across views 0→2.

An authored conflict heuristic flags `abs(g01 - g12) > 0.12m` (or missing estimate), and falls back to hold when conflict is high. This threshold was **preselected**, not learned or optimized by a network.

| Property | Static 6 scenes | Changed 6 scenes |
|---|---:|---:|
| Flagged as conflicting (0.12m threshold) | **0** | **5** |
| Heuristic conflict-gated chosen action vs true lower-cost branch | **6/6** | **3/6** |
| Naive two-view action vs true lower-cost branch | 6/6 | **0/6** |
| Conflict-gated mean regret | **0** | **3.528** |
| Naive two-view mean regret | 0 | **18.681** |
| Mean absolute disagreement between consecutive geometric estimates | ~0.030m | ~0.255m |

This is positive **evidence of a private consistency signal**, but not proof that actor knows why models conflict. It could be independent material change, odometric error, occlusion or correspondence failure.

Important negative: all 3 hidden closures were handled conservatively; all 3 hidden openings were left unused. In changed scenes, mean regret equaled the **always-hold** baseline. So an apparent 5/6 "scene-change detector" does not yet yield selective, generally valuable active inspection.

### Threshold sensitivity (POST-result analysis, not a promoted optimization)

| Authored conflict threshold | False alarms in 6 static scenes | Changed scenes flagged / 6 | True action decisions / 12 |
|---|---:|---:|---:|
| 0.04m | 1 | 6 | 9 |
| 0.08m | 0 | 6 | 9 |
| **0.12m** (original) | 0 | **5** | **9** |
| 0.16m | 0 | 3 | 9 |
| 0.24m | 0 | 3 | 9 |
| 0.35m | 0 | 2 | 8 |

**The small fixture contains a lucky separation around 0.08m**; choosing 0.08 after reading these results would be post-hoc overfitting. Changing the threshold can substantially change the detector without improving physical decisions. Neither conflict magnitude nor a generic "prediction error" should be mistaken for actor-relative significance; this aligns with the canonical F2/P0 negative.

## A10 — Exact actor-private ambiguity for a late independent material event

Start with a single shared real LivingWorld history and an actual 40-tick forward motor episode. Capture the actor's legal `PrivateFrame` (RGB retina, eight-sector touch, body-proprio and gaze) at tick 40.

**The host then changes the real gate from 0.94m (blocked) to 1.06m (open) AFTER the latest legal retina frame, but BEFORE a new sensory tick.** The newly captured `PrivateFrame` is bit-for-bit equal in both worlds. No actor-permitted information about the transition exists at that instant. Branch each World forward with exactly the same `drive=1` or `drive=0` motor policy.

| Host-only material state at same private instant | Cost of push | Cost of hold | Best |
|---|---:|---:|---|
| Blocked 0.94m | **+27.499** | −0.860 | HOLD |
| Opened 1.06m | **−7.917** | −0.860 | PUSH |

This is a true **private information alias** even though the future physical value of the motor choice reverses. It is *not* proof that a competent actor could never discover the change: a subsequent legal observation could distinguish it. The narrow claim is that **no policy using only the identical history available at that exact boundary can be right in both counterfactuals**. It should not be implemented with a privileged host signal.

This directly echoes F3/D0's relational-information alias and distinguishes a sensor's limit from a learned-model-capacity problem.

## The revised high-level vision for ReflexBrain

Owner idea: organisms might control the focus of finite sight lines and keep temporary private discoveries. The corrected research trajectory is **not** to maximize instantaneous ray density or to compile a certain visual map format.

The emerging subsystem boundary is an **active, temporally grounded uncertainty loop**:
1. A continuing embodied actor faces some *actor-relative* question about what it can do, or what in its existing activity matters.
2. It makes a lawful decision about **where, how and when** to allocate scarce detail, peripheral coverage, serial inquiries or body motion.
3. Each observation is bound to its own sampling time, body-relative direction, possible motion and confidence; old observations are not current World truth.
4. It checks whether the sensed evidence supports the assumed spatial/material model **under its real domain of validity**, and can defer/seek more lawful evidence when not.
5. It acts; actual material consequences may refute its competence hypothesis, feeding later locally grounded adaptation.

Only parts **2/3** are demonstrated mechanistically in A1–A10. Part **4** is a researcher-authored model conflict example, not learned. Parts **1/5** as actor-originated reason and learned adaptation remain **OPEN**.

There is a distinction between:
- **Detection:** did some ray sample orange/red/grey?
- **Recognition:** could the actor distinguish a stable two-part feature?
- **Geometric grounding:** can self-motion transform successive RGB angular views into body-scaled predictions?
- **Epistemic validity:** are those predictions about the same world/object and time interval?
- **Material relevance:** does resolving this uncertainty justify spending attention or risking contact now?
- **Organism-owned agency:** did the actor's continuing local interests *produce the reason to look*, rather than the host scheduling an inspection?

A rising score on one is not a PASS for the next.

## Unresolved falsifiers and next actual task

1. The current scene change is a **host-scripted physical collider translation**, not independently force-driven mass/ecology with gradual observed motion. That is sufficient to break the static assumption, not sufficient to qualify natural-world behavior.
2. The A8 serial eye sampler is a research-only sidecar; native LivingWorld already has a 96-ray retina and gaze, but not adaptive per-ray sampling.
3. Lateral motion, rotation, occlusion, multiple similar-looking surfaces, self-deformation, contact-born learned corrections and genuine 2.5D topology are not qualified.
4. For serial queries, visual bearings should be tied to each individual **private pose estimate**, not combined at one static center; this re-registration itself creates complexity/cost.
5. The next valuable experiment should be **continuing actor-owned local activity with real independent ecology and competition between information gathering, peripheral monitoring and material action**, strong no-information baselines and held-out cases. Do not further multiply rectangular gate fixtures solely to improve a threshold.
6. When using donor evidence in the main ReflexBrain Control Room, stay within classes: A8/A9 = **mechanistic EVIDENCE, negative model-validity evidence, DONOR**; A10 = **EVIDENCE for a narrow private alias**; learned active vision, value of information and living organism = **OPEN**.

**No production or canonical merge implied.** Keep this donor separate from the canonical `research/pre-o0-foundations-campaign`, from the early vision V1–V7 PR #53, and from Combat/Feniks local engineering without an explicit reuse decision. Owner-observed behavior remains the final product-quality judge.

## Resume

First inspect live PR #54 and exact HEAD/CI. Read this document, A4–A7, A1–A3 and L1–L3 as needed. Avoid turning the controlled 0.08m separation into a global knowledge-confidence threshold. Resolve main competence frontier F3/F4 before promoting any sensory mechanics. Next run should move the test closer to *owned material activity*, not add another stationary gate test.
