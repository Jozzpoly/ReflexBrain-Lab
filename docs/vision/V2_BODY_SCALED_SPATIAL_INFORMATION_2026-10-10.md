# RB-VISION/V2 — Body-scaled gap and sparse precontact sensing, 2026-10-10

**Research result: EXECUTED DISCOVERY / INFORMATION-LIMIT EVIDENCE · NOT LEARNED COMPETENCE · NO ARCHITECTURE PROMOTION**

**Branch:** `research/vision-embodied-experience-2026-10-10`  
**PR:** https://github.com/Jozzpoly/ReflexBrain-Lab/pull/53  
**Source under test:** `tests/vision-body-scaled-gap.test.ts`  
**Evidence:** GitHub Actions `38086851637`, exact test source head `20872ddda39a4ffdcbda500ad890dd3d1c226b2a`. Full check **29 test files, 50 tests PASS**, TypeScript PASS, Vite build PASS. The earlier V2-D0 and D1 runs also independently passed before D2 was added. The newer docs-only commit, if any, is not a new physics/test qualification.

## Why this branch has an experiment
Combat Lab's local multiscale images inspired a possible spatial sensation interface. Feniks adds body-scale affordances, 2.5D, occlusion and LOD's World. Main ReflexBrain G5A established lawful sensory divergence after hidden World change. F2/P0 falsified "model mismatch = bad decision", while F3/D0 found opposite action value under exactly aliased scalar private traces, with directional touch as a possible lawful discriminator.

This Vision run asks **how much action-relevant distinction is carried by cheap lawful precontact geometry, relative to body size and actual dynamics**. It is not testing whether pixels, rays, any one sampling pattern or cognition should become final architecture.

## Fixture and scope
- Deterministic actual E0/Rapier contact physics, world timestep 1/120 s.
- Two immutable symmetric wall segments at x=3, creating an open straight passage. Gap half-width varies by scenario. Walls are fixed.
- Body starts at (0,0), mass=1, radius varied; E0 motor force/damping scheme unchanged.
- 24 ticks of private zero-demand, zero-contact sensorimotor history, matched across scenarios; no World coordinates or fixture identifiers in the candidate optical observation.
- Legal synthetic optical sampling from the body center. **Only ray ranges** (null when no hit) at 0, ±0.28, ±0.36 radians; no `can-pass` label or collision flag. These scenes deliberately author optics to coincide with mechanical geometry; the independent V1-D0 result shows this correlation cannot be assumed universally.
- Physical action branches: 180 ticks of drive +1 or drive 0 from the same source snapshot. Analyst evaluates actual displacement and accumulated solver impulses.
- **Analyst-only** cost (lower better): `-displacement / E0_RADIUS + 2 * summedContactImpulse / (E0_MASS * E0_VMAX)`. This is a deliberately selected progress/contact tradeoff, not an actor reward or welfare criterion.
- No trained policy, learned interests, active curiosity, gaze actuator, sensory cadence measurement, LLM or runtime insertion. Claim is about information *present in this bounded fixture*.

## V2-D0: the basic four worlds
Body radii 1.0 and 0.42; gap half-widths 0.72 and 1.5. In every case, the **central ray returns no hit** and private pre-history is matched.

| Body | Gap half-width | Rays ±0.28 | +1 drive displacement | +1 impulse sum | +1 cost | Best among +1/0 |
|---|---:|---|---:|---:|---:|---|
| radius 1.0 | 0.72 | hit at 2.96549 | 2.15622 | 52.31298 | +17.72271 | hold |
| radius 1.0 | 1.50 | clear | 7.05590 | 0 | −7.05590 | push |
| radius 0.42 | 0.72 | hit at 2.96549 | 7.05590 | 0 | −7.05590 | push |
| radius 0.42 | 1.50 | clear | 7.05590 | 0 | −7.05590 | push |

Therefore:
- Geometry visible from a sensor is not itself an actor-specific action value.
- The same optical hit can be compatible with both successful and unsuccessful crossing, depending on morphology.
- A central ray aliases physically different possibilities; a small peripheral sample breaks *some* geometry alias.
- In this local authored physics setting, there is possible conditional decision value beyond a central ray; that does not yet prove learned visual competence.

## V2-D1: post-D0 deliberate adversarial stress
New (untrained/unqualified) gaps 0.92 and 1.12 for body radius 1:
- Both return **no hit** at 0 and ±0.28 rad.
- Both return **hit** at ±0.36 rad if compressed to a one-bit hit/miss.
- Physical +1 regret sign reverses: gap 0.92 +1 cost **+30.23631** (blocking, impulse 86.03389), gap 1.12 cost **−7.05590** (free).
- At ±0.36 the actual range differs: **3.045207 m vs 3.179341 m**. The extra range precision can disambiguate this *particular* pair, whereas the corresponding binary channel cannot.

This is an **intentional attack on V2-D0's attractive conclusion**. It demonstrates that both angular coverage *and the precision/aggregation of measured distance* can determine whether two action-relevant worlds alias. A hand-picked tiny fan is not robust morphology understanding.

It does not qualify that every measured difference is reliable under noise, moving occluders or viewpoint changes.

## V2-D2: 32-world information-ceiling landscape
Radii: `[0.42, 0.75, 1.0, 1.3]`.  
Gap half-widths: `[0.55, 0.72, 0.9, 1.0, 1.12, 1.3, 1.5, 1.8]`.  
No parameter search/tuning to force a PASS; this is a **post-D0 exploratory landscape**, not held-out model qualification.

Pass/fail of **physical preferred action** among +1 and 0, ordered by the eight gaps:

| Radius | Preferred sequence (P = push, H = hold) |
|---|---|
| 0.42 | PPPPPPPP |
| 0.75 | HHPPPPPP |
| 1.00 | HHHHPPPP |
| 1.30 | HHHHHHPP |

For each candidate observation encoding, partition the 32 cases into groups with *identical represented inputs*, then let a hypothetical **in-sample omniscient group selector** choose the lower total physical cost, push or hold, for each group. Equal case weights; zero sensor-time/energy/compute charges. This is the **best possible conditional decision cost given that partition on this chosen finite distribution**, not the outcome of a trained organism.

| Inputs available to decision rule | Mean group-optimal cost ↓ | Groups with both preferred actions |
|---|---:|---:|
| None (one fixed action) | 0 | 1 |
| Body radius only | −1.763976 | 3 |
| Visual binary ±0.28, *without* radius | −0.581407 | 2 |
| Body radius + central ray | −1.763976 | 3 |
| Body radius + binary ±0.28 | −2.968710 | 3 |
| Body radius + exact ranges ±0.28 | −3.189207 | 2 |
| Body radius + binary ±0.28, ±0.36 | −3.527951 | 3 |
| Body radius + 0.5m-quantized ranges, four rays | −3.748448 | 2 |
| Body radius + exact ranges, four rays | **−3.968945** | **1** |
| World-specific analyst oracle | **−4.409939** | 0 |

The exact four-ray representation still leaves **0.440994** mean cost of information deficit relative to an oracle in this synthetic distribution. It cannot resolve all action-relevant distinctions; in its final aliased group some different physical worlds demand opposite actions.

**Separate four-world demonstration**: authored body-only decision cost −3.527951, authored radius+side-ray decision cost −5.291927, whereas a naive `any side ray hit = stop` also costs −3.527951. Improvement 1.763976 cost units *before sensor charges*, but these decision rules were chosen after observing this tiny dataset. The four-world decision result is not a held-out policy/generalization PASS.

### Critical epistemic limitations
1. The grouped selector uses **outcomes from every tested world** to choose group actions. This is deliberate analyst ORACLE computation, not an actor-accessible inference mechanism; higher capacity may *not* realize this upper bound from limited experience.
2. The distribution is artificial and **uniform**. Change environment frequency, activity value, injury costs or body sizes and the value ranking may change.
3. The cost has **authored** weights and one narrow task (forward progress). A different activity (sheltering, observation, waiting for a companion, pushing a movable obstruction) may reverse what counts as success.
4. Sensor sampling/processing, gaze movement, actor time, energy, Raycast CPU and memory are not charged. More channels mathematically refine the partition but do not guarantee better net decisions under compute or learning constraints.
5. All physical walls are fixed and visibly correlated with collision in V2. V1 separately proves the risk of optical/physical dissociation.
6. The body is a disk, not an articulated Feniks/Combat actor. Its radius is treated as a **known body morphology descriptor**, not magically learned self-calibration. Real actors may estimate body extent and reach only approximately.
7. All samples are pre-contact and static; no hidden moving World, sensor delay, stale memory, noise, 2.5D visibility, sound or social permission.
8. All tested policy evaluation is offline branching, not an autonomous organism. The 32-point table does not qualify a final policy, exploration motive or curiosity.

## Decision — what is actually learned
**Defended narrow conclusions:**
- A single clear line of sight and a conventional visibility mask can be insufficient to distinguish passage feasibility.
- Shape/range sampling, morphology and real contact consequences can be relevant in different ways.
- Sensor quantization and angular sparseness can erase action-distinguishing information.
- Additional *lawful* information improves an **in-sample ORACLE information bound** on this test distribution, but more rays ≠ learned/better organism.
- No universal spatial resolution or RGBA packing has been earned.

**Not learned:** the right number of rays, a raster winning a comparison, a learned affordance model, an NPC with owned reasons, a general LOD framework, social meaning, or the value of multiscale images.

**Next high-value falsifier:** ask whether time-indexed pre-contact perception can produce *causally useful actor-selected information-seeking* under moving/occluded geometry and held-out body morphology, controlling the benefit of viewpoint motion itself. The actor-originated relevance/commitment question remains separate; a programmed look routine is merely a strong authored baseline. If rays + proprioception cover useful cases, do not force a spatial raster.

## Relevant research (external, NOT proof of the implementation)
- Feng et al., body size and perceived affordance boundary, eLife (2024): https://elifesciences.org/articles/90583
- Satsangi et al., survey of reactive vs active sensing in decision-theoretic planning, ACM Computing Surveys (2023): https://doi.org/10.1145/3583068
- The Living Organism retinal donor and G5A private-knowledge evidence remain separate from this E0 artifact.
