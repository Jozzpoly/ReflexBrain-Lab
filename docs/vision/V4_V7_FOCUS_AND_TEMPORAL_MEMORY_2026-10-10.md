# RB-VISION/V4–V7 — Owner vision: organism-controlled focus and private spatial memory
**2026-10-10 · SCOUT / EXECUTABLE DONOR EVIDENCE · NOT LEARNED-ORGANISM QUALIFICATION**

**Vision branch:** `research/vision-embodied-experience-2026-10-10`  
**Draft PR:** https://github.com/Jozzpoly/ReflexBrain-Lab/pull/53  
**Owner prompt:** What if an organism could control how its finite sight lines focus, and maintain a temporary internal map by saving previous scans?

## 0. High-level corrected conclusion

This is worth deepening, not because it requires a particular pixel map or because more rays make an NPC intelligent, but because **sampling allocation + time-stamped private memory + own body motion** can form a small embodied perception loop.

The loop is not yet a learned reason to look. It has earned only the following narrow distinctions:
1. Rays used now need not cover every future-relevant place.
2. Reorienting or shifting ray locations can acquire information missing from the present frame without increasing immediate sampling budget.
3. Past legally obtained observations can change subsequent physical action, while retaining the ability to be wrong or stale.
4. To revisit a *place* rather than an old *angle*, a moving actor must account for its own motion and sensory uncertainty.
5. A frame-to-frame union is NOT proof that all features existed simultaneously.

The **main evidence frontier still concerns owned relevance and actor-beneficial actions**, not retina resolution. G5A passes lawful hidden World-change→private percept→behavior causality; F2/P0 falsifies generic mismatch→decision incompetence; F3/D0 identifies private relational information alias. Vision V4–V7 remain separate donors, not a solution to F3/F4 or a mandate to merge code.

## 1. Existing donor: important overlooked capability already present

`research/living-organism-runtime-a-2026-10-08/src/living-organism/world.ts` has:
- a private **96-sample RGB retina** with quadratic angular concentration (`retinalAngle(u)=sign(u)*u*u*80°`);
- a controllable `gazeRate`, updating heading-relative gaze at up to approximately 3 rad/s, clamped to ±90°;
- one private retinal frame per **4 physics ticks**: 120 Hz physics / **30 Hz** retina;
- body-local forward/lateral/angular velocity, gaze, and 8-sector private touch;
- authored eye-scanning routines inside `Occupant`, not a learned attention policy.

It **does not** directly give actor-private depth or world XYZ. Its retina carries RGB of nearest visible collider surfaces. The more accurate 2D *range rays* used in V4/V5 are **a richer, hypothetical sense**, not a capability transferred from this existing retina. Full private depth estimation from RGB/visual motion remains a separate problem; the independently audited `PrivateVision` donor demonstrated that a small residual under a stationary-structure assumption can still support a wrong belief.

**Two potentially different control axes** need not be frozen now:
- gaze/view direction (where the current fovea points);
- sample-density allocation (how much angular detail is purchased near selected directions without raising total ray count).
Moving gaze alone already shifts the existing quadratic fovea; changing density independently is additional flexibility and an attention/periphery tradeoff.

## 2. V4 — Focus + short-lived angular observation ledger (ACTUAL PHYSICS)
**Code:** `tests/vision-focus-belief-memory.test.ts`.  
**Qualified source CI:** https://github.com/Jozzpoly/ReflexBrain-Lab/actions/runs/38087921114, exact source `c69910a7dca86bc696d0564458c1345c5bfc6a12`: **32/32 test files, 60/60 tests PASS**, TS and Vite build PASS.

Six deliberately small 2D passage scenes include a large/small disk body, static/narrow and static/wide gaps, and independently closing/opening geometry. The stationary actor receives TWO observations, each **3 focused rays**, before a physical forward-drive/hold decision; all policies spend 6 rays, and their Rapier physical source states are byte-equal within a scene. The World modifies passage geometry at tick 56 without feeding that change to the actor. First observation tick 24, last observation and decision tick 88. A retained record is **64 ticks / ~0.53 s old**.

The private observation ledger explicitly separates:
- **never observed** (no side record);
- **observed clear along this ray** (side record with null distance);
- **observed hit** (side record with measured distance);
- observed tick / derived age.
This is *not* a 2D occupancy map. It is a one-direction observation tape with minimal temporal state.

One consistent, **researcher-authored forward-motion policy** decides using body radius and its own side observation. Research analyst scores real solver displacement and summed contact impulse; the score is not actor reward or subjective wellbeing.

| Equal-budget policy across six authored scenes | Mean physical cost ↓ |
|---|---:|
| Always center; no side memory | -2.351968 |
| Side then center, forget previous scan | -2.351968 |
| Side then center, trust retained old scan | **-0.574162** |
| Center then fresh side observation | **-4.703935** |
| Side then refresh side observation | **-4.703935** |
| Side then center; fixed short record expiry | -2.351968 |
| **Actor-private conditional focus selection** | **-3.527951** |

The conditional-focus controller **chooses the next sampling direction by reading only prior own observation and body radius**, NOT scenario ID, hidden event flag or World coordinates:
- large body previously saw clear side ray → chooses SIDE at next observation to recheck before drive;
- large body previously saw blocked side ray → chooses CENTER, thus risks missing an independently opened opportunity;
- small body → chooses CENTER in this fixed specimen because its authored physical tolerance covers both gaps.

It avoids the hidden closure collision, but can fail to exploit an opening. It is an **authored local attention rule**; it is not learned attention, curiosity, self-originated goal, or an earned policy on held-out worlds.

**Critical negative:** no amount of encoding/model capacity can make the actor know a hidden independent closure from an unchanged past sample and unchanged current center rays. Static-wide and secretly-closed states have observationally aliased actor history until a fresh relevant observation. A TTL can hedge, not detect the particular hidden event. Expiring aggressively prevents the collision but also loses the value of reliable static memory.

**Fixture correction provenance:** Initial V4 CI failed on a TypeScript check; a subsequent run failed the physical closure assertion because the host moved the wall centres as though half-heights changed. The real fixed-wall inner edges were then explicitly corrected to `wallCenterY - originalHalfHeight = desiredGapHalf`, with a host-only invariant. The *corrected* physical experiment was rerun and qualified by CI above. Failed earlier runs are not supporting evidence.

## 3. V5 — remembering a place, not merely an old angle (REAL SELF-MOTION)
**Code:** `tests/vision-odometry-reprojection.test.ts`.  
**CI:** https://github.com/Jozzpoly/ReflexBrain-Lab/actions/runs/38087741564, **32/32 files, 59/59 tests PASS** at source `d0dabd09fb323f9c048104239ac3c4cd61a032bf`.

The actor initially samples a geometric surface at body-relative angle **0.28 rad**, ideal measured range **2.965490 m**. It then applies its own forward motor for 40 actual 120Hz physics ticks, travelling **0.940703 m** by host truth without touching the wall.

It integrates **body-local velocity only** into a private estimate of movement, **0.911004 m**. The 2.97 cm discrepancy is important: even in this clean fixture, private odometric integration is not exact.

- Looking again at the **old 0.28 rad** bearing now misses the remembered surface.
- Reprojecting the old *ray endpoint* into the body's estimated new local frame predicts gaze **0.399884 rad**; a fresh ray finds a surface and its measured range differs from the predicted range by **0.032242 m**.
- If the wall physically opens outside the actor's sight during locomotion, the prior private motion/sighting stay identical, but a fresh reprojected look returns **no hit**.

**Claim:** one ephemeral body-relative point belief, combined with private estimated displacement, can guide future optical sampling and can be contradicted by lawful new evidence. This is a *fragment* of spatial memory, NOT a map, object identity or proven dynamic scene model. Reprojection needs geometric depth; a RGB-only eye must instead estimate it from motion/multiple views or use different lawful sense.

**Important falsifier for future memory systems:** odometric error and material scene change can both yield a prediction residual. A low/high residual alone does not identify the cause or justify declaring a reason to act (consistent with F2/P0 and the Living PrivateVision donor).

## 4. V6 — equal-budget foveal redistribution
**Code:** `tests/vision-foveation-density-budget.test.ts`.  
**CI:** https://github.com/Jozzpoly/ReflexBrain-Lab/actions/runs/38088077845, **33/33 files, 63/63 tests PASS**, tested source `66840d11ee4d3837b462985ebbef37bce147c34a`.

Real Rapier collider rays inspect a single anonymous visible spot at range 4 m. All samples use **96 rays per frame** across the same ±80° half-FOV; compare angular density exponent 1 (uniform), 2 (existing Living-style quadratic), 3 (more concentrated), and a concentrated lens shifted by +45° gaze.

Across 93 radius/bearing configurations at **one fixed angular phase**:
- uniform centre detection **66.7%**, peripheral detection **66.7%**;
- quadratic centre **71.4%**, peripheral **66.7%**;
- cubic centre **81.0%**, peripheral **33.3%**.

But a pre-specified AFTER-D0 fractional-degree shift sensitivity test at offsets 0°, 0.29°, 0.71°, 1.13° exposed **severe sampling-phase aliasing**: uniform overall detection jumped from **66.7%** to **100%** solely due to sub-degree scene shifts; other lens scores also moved materially.

**Therefore these numbers are NOT a qualified retina ranking.** The robust conceptual observation is merely an information-allocation tradeoff: highly concentrated sampling can resolve subtler central appearance but may leave peripheral gaps; redirecting gaze changes which regions get detail and which lose coverage. Use random/stratified angular conditions before any statistical or model-selection claim.

**Critical engineering difference:** reallocating the SAME 96 rays changes spatial sample placement but **does not automatically lower CPU cost**; it may cost additional gaze control or memory. Only reducing actual raycasts, updating some rays less frequently, using broadphase acceleration, or other measured runtime changes can qualify cost wins.

## 5. V7 — temporal supersampling and false simultaneous memory
**Code:** `tests/vision-temporal-ray-interleave.test.ts`.  
**CI:** https://github.com/Jozzpoly/ReflexBrain-Lab/actions/runs/38088178972, exact source `a159c821ee41c3e4d5dd28b8b10c566874b269db`: **34/34 files, 65/65 tests PASS**, TS/build PASS.

Hypothesis: with a fixed 96-ray frame budget, a small change in ray angular phase on the **next** frame can cover otherwise permanent alias gaps. Two observations cost exactly **192 rays** either way. Store a time-stamped *ever-seen* evidence bit, not a live map.

Across 372 static synthetic spot configurations **per lens**, aggregating four angular phases:
| Lens distribution | Repeat same 96 directions twice: observed at least once | Interleave different directions: observed at least once |
|---|---:|---:|
| uniform exponent 1 | **83.33%** | **100%** |
| Living-style quadratic exponent 2 | **71.24%** | **90.05%** |

The results are **finite-fixture recall**, not natural-world detection estimates. Two views are at fixed observer pose with a static object, no sampling-time/latency cost. A moving agent, moving objects, retinal noise, occlusion and changing illumination make integration harder.

**Critical adversarial test:** one and the same moving spot is seen on the negative side at tick 10 (4 hit rays) and positive side at tick 20 (3 hit rays). A naive union gives the apparent *current* occupancy of both sectors although only one physical spot was there at each tick. Proper private memory retains timestamps and treats old observations as old evidence. It does **not** magically infer that these observations refer to one object; that identity remains unearned.

Thus the attractive mechanism is not simply "stack 2 frames": it is **temporally coordinated sensing + physically/epistemically scoped memory + selective updating**.

## 6. Literature synthesis: competing methods, no copied architecture
- [Shang & Ryoo, NeurIPS 2023](https://proceedings.neurips.cc/paper_files/paper/2023/hash/20e6b4dd2b1f82bc599c593882f67f75-Abstract-Conference.html) explicitly investigates separate motor and sensory policies with jointly learned active vision under limited observability; useful legitimacy for the *research question*, not qualification for an NPC organ.
- [Henriques & Vedaldi, MapNet, CVPR 2018](https://openaccess.thecvf.com/content_cvpr_2018/html/Henriques_MapNet_An_Allocentric_CVPR_2018_paper.html) confronts allocentric memory, localization and registration; warns that a map requires grounding across own pose changes.
- [Yang et al., Theoretical perspectives on active sensing](https://pmc.ncbi.nlm.nih.gov/articles/PMC6116896/) treats sensing as an action-observation loop; generic information gain is not the same as situated value for a particular actor.
- [Kurniawati, POMDPs and Robotics, 2022](https://www.annualreviews.org/doi/10.1146/annurev-control-042920-092451) grounds the challenge in partially observed decisions and costly approximation, not a silver-bullet architecture.

These sources are conceptual neighbors, NOT proof that our synthetic V4–V7 cases establish generalizable active learning or learned embodied value.

## 7. Rival representational hypotheses for future Feniks / ReflexBrain
**R1 — Timed sensory tape**: minimal samples (direction, appearance, available range if lawful, confidence/quality, observedAt, private proprioception). Cheap, falsifiable, easy to preserve epistemic boundaries, but awkward for spatial queries.

**R2 — Short body-relative panoramic working memory**: accumulate old angular/appearance observations, with explicit *unknown vs seen empty vs occluded vs stale*; periodically reproject via privately integrated movement. Risks smear, parallax alias, moving objects and loop closure failure.

**R3 — Sparse remembered surface/landmark hypotheses**: local rays and movement support tentative positions and identities, with uncertainty and supporting observation provenance. Useful if actor revisits places; can hallucinate exact metric depth from RGB.

**R4 — Spatial grid or multiscale local belief**: potentially useful for many simultaneous spatial relationships; expensive to update correctly after body movement, dynamic change, occlusion or 2.5D layering. A map's pretty pixels do not prove learned meaning.

**R5 — Learned recurrent/latent belief**: may compress history into features relevant to next action and observation, but can lose causal interpretability or overfit narrow color/material regularities. Must beat strong nonlearned memory baselines on held-out material outcomes.

These are **competitors and possible mixtures**, not a hierarchy to implement wholesale. In particular: world simulation LOD, sensory detail LOD, memory compression and cognition update rates are separate, only connected through explicit causal continuity, not one global distance-based LOD switch.

## 8. Strongest falsifiers and what an earned next step would require

**No fixed "focus is good" claim**: high central sampling may miss a peripheral contact, another actor, an attack, or a changing event. A peripheral sentinel and event-driven allocation may be better than narrowing the whole retina.

**No perfect "mental map"**: yesterday's wall can be gone, a body may self-mislocalize by centimetres, a line of sight that missed a collider says nothing about occluded space beyond, and two successive color fragments may belong to one moving object or two different objects.

**No extra range from RGB by fiat**: the depth-enabled V4/V5 experiment is a *separate sensor law*, not a feature switch that the Living Organism 96 RGB samples already support.

**No "surprise creates a reason" shortcut**: F2/P0's failure distinguishes mismatch from decision loss; F3 needs relation to an ongoing actor-owned activity. An authored controller selecting `side` after seeing `clear` is not self-generated attention or spontaneous curiosity.

**No fixed TTL or globally monotonic memory confidence**: hazard may depend on actor-private exposure to change, world/process dynamics, sensor noise and an action's stakes. A host-provided `static wall` vs `volatile object` category would leak a research conclusion unless lawfully earned by the actor.

**Next meaningful vertical slice**, not automatically authorized as canonical:
1. An actually continuing locally embodied actor, in a small but independently evolving world where it encounters legitimate activities or relations *not solely scripted to validate focus*.
2. A bounded sensory budget and an explicit actor-owned eye/focus actuator, with attention, sampling and movement costs.
3. Temporally grounded private memory preserving provenance, age and uncertainty under self-motion and hidden events.
4. Compare strong rival policies under identical lawful sensor opportunity: wide static retina; steerable focus with no memory; memory without focus; coupled focus+memory; cheap ray/event/touch baseline; learned challenger *only if necessary*.
5. Held-out physical and appearance variations, alternate body morphologies, changing occluders, delayed reinspection, static/dynamic world changes. Report both improved continuity and failures/missed peripheral events.
6. Classify outcomes as **engineering substrate**, **actor-private causal competence**, **earned information-seeking**, or **Owner-observed organism life**. A PASS in one does not promote the others.

The Vision branch can donate V4–V7 instrumentation and negative examples. **Do not merge whole research harness into canonical ReflexBrain by inertia, and do not lock Feniks into any particular mental map or retina format.** The next worthy research question is whether a real ongoing activity causes the organism to allocate and refresh sensory evidence *for its own reasons*, rather than our test scheduler.

## 9. Recovery for a new conversation
- Read this file and `docs/vision/EMBODIED_EXPERIENCE_RESEARCH_2026-10-10.md` before proposing anything new.
- Check live GitHub PR #53, current branch head, and the main ReflexBrain Control Room PRs/merged state; prior written truth may be behind active parallel agents.
- Owner prefers materially longer self-contained runs with low attention/reading cost and natural conversation handoffs. Prioritize real research/programming over a commit/message cadence.
- V4 early test failure **was corrected**; read qualified CI, not failed initial attempts, and preserve the failure provenance.
- V4 through V7 are valid mechanistic scout results; nothing here makes a learned living NPC.
- No automatic integration, no feature backlog and no hardcoded final "mental map architecture".
