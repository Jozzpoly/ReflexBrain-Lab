# RB-MAT/S0 — First material standing-activity integration — RESULTS 2026-10-11

**Status: ENGINEERING DISCOVERY VALID / MATERIAL RESTORATION NEGATIVE.**  
**NOT a preregistered general scientific qualification**: one fixed scene, no frozen multi-scene PASS threshold, no Owner browser observation. **Do not promote the controller into a default organism.**

Research donor branch/pr: [#62](https://github.com/Jozzpoly/ReflexBrain-Lab/pull/62), based on Living Organism A `aa1ce53`, no `LivingRuntime` or `Occupant` modifications.  
Before execution: [RB_MAT_S0_MATERIAL_RELATION_ARMED.md](RB_MAT_S0_MATERIAL_RELATION_ARMED.md).  
Verified final executable source `426d121b1918172d4dc536ff9212e50bfe927466`, [GitHub Actions #38108103778](https://github.com/Jozzpoly/ReflexBrain-Lab/actions/runs/38108103778): 39/39 test files, 115/115 tests, TypeScript/Vite build PASS, **complete three-world campaign deterministic twice**. Log has `RB_MATERIAL_S0_RESULT`.

## 1. What was actually exercised

Three separately initialized but identical fixed initial native Rapier 2D Worlds (120Hz), each with a real independent sweeper active throughout, movable target disc (cyan), physically fixed dock (amber), body and obstacle collisions. 7,200 uninterrupted physics steps each (60 simulated seconds). No Owner heartbeat, semantic World event, midrun teleport, training reset or target/dock handle exposed to any controller.

All actors saw exclusively *legal actor-relative 30Hz 96-ray RGB patches, touch and own proprioception*. The material-concern challenger used explicitly hand-authored **approximate known apparent-size priors** to estimate egocentric relative target and dock positions and private integrated body motion; this is NOT range-learning, true target identity or general vision. It tried to get behind the cyan object and push it toward the dock. The cheaper comparator simply drove at the seen cyan color, with no dock concern or remembered relational map. A physical World-only control had actor motor demand zero while independent sweeper continued.

Host only measures exact material position/contact IDs. Every initial moving thing and physics law is the same across the three arms.

## 2. Real physical afterstates

At tick 0 target **(2,−3)**, dock **(5.5,−4)**, initial target→dock center distance **3.6401m**; surface gap metric subtracts known world geometry proxy radius .55 and dock halfwidth .5, initial **2.5901m**. This surface-gap metric is an intentionally coarse host-only geometric proxy (the dock is rectangular), NOT exact collision clearance.

| 60-second World | Final target (x,y) | End center distance to dock | Coarse surface gap | Total target travel from starting point | Actor traveled | True target-contact sensory windows |
|---|---|---:|---:|---:|---:|---:|
| World only, sweeper active | (8.8305, −3.0000) | 3.4774m | 2.4274m | 6.8305m | 0m | 0 |
| Cheap cyan chase | (7.5325, −5.2500) | **2.3861m** | **1.3361m** | 5.9725m | 7.0189m | 66 |
| Authored material relation | (9.2500, −5.2500) | **3.9529m (worse)** | **2.9029m (worse)** | 7.5911m | 13.4482m | **1,586** |

**Actor influence is real, but harmful under this target-to-dock criterion.** Relative to the independent World-only afterstate, the cheap actor leaves the target **2.5976m away** from where it would have ended without that motor activity; the material actor's target ends **2.2888m away**. These are *paired terminal state vector separations*, not a difference of path-length magnitudes. They establish bodily physical influence under source-matched controls, NOT improved matter handling.

The material actor made *many more actual target-contact sensory samples* while producing worse target-dock relation; do not treat those 1,586 windows as independent collision events, physical welfare or useful work.

## 3. Mechanism diagnostic — legal information was lost

All three worlds have **1,800 distinct 30Hz percept frames** over 60s (not 7,200: the frame is cached for four physics ticks). Fixed instrumentation error caught after first CI run: the first counter counted the same cached frame four times. An instrumentation-only correction and stronger tests did not change real actor/world results, and the second full CI re-executed all outcomes to the same coordinates.

Distinct visual sample counts:
- World-only observer sees cyan in **185/1800**, dock in **1617/1800**.
- Cheap cyan chaser sees both in **1800/1800**.
- Material actor sees cyan **1800/1800**, dock only **150/1800**.

The material actor's 1,800 unique internal decisions:
- `reacquire` **1478** (82.1%);
- `reposition` 250;
- `push` 45;
- `monitor` 27.

At the end material actor remembered current cyan evidence (`seenTargetAge=0`) but had **no retained dock hypothesis** (`seenDockAge=null` after declared bounded expiration).

This is an important project-level failure pattern:

> actuator, vision and contact can all work, with abundant World displacement, while the standing *relation that gives action purpose* is no longer privately supported. A controller that keeps moving can therefore do more physical work while making its material concern worse.

This is not yet proof that loss of dock perception alone *caused* all poor performance; inaccurate apparent-size priors, occlusion, target pushing direction, external sweeper, and controller organization are all viable explanations. No after-result retuning was performed.

## 4. Strong scientific boundaries / follow-on decision

- This **does not** meet the official O-CTRL M0-Lite concern qualification: relation not restored, scene not varied, Owner interaction/visual QA not tested, continued ecology pressure limited.
- This **does not** show learnable relevance, self-originated goals, life, useful memory or qualified active attention.
- It **does** show an honest native physical end-to-end attempt and two strong cheap controls. The simpler cyan chase improves the material relation more than explicitly relational control in this one world.
- Even the **World-only** process displaces cyan significantly. Any future “organism helped” claim MUST compare against autonomous ecology, not a frozen static scene.
- The camera's private bearing/size prior is NOT an exact 2D relative range sensor. Merely importing P02a's host-filtered candidate list as an actor's perception would hide the semantic problem.

**Stop extending S0 by tuning push-point thresholds or dock positions after looking at these results.** Treat this source as a falsified first material-control idea and a valid donor host test. The next value-adding work must restore **actual actor-owned continuing material relation** with an honest *information-gathering/monitoring* path, validate minimal physical affordances first, and show the Owner a running World rather than only console metrics.

A credible next design comparison should be:
1. **minimal cheap re-inspect-before-push** policy (can private observation reliably recover the dock without World IDs?);
2. a genuinely **different material activity** if 96 RGB rays + approximate-range scaffold require unrealistic semantics;
3. only then a learned action/relevance mechanism with strong cheap controls.

Do not mistake more sensory sampling, more reaching or more ticks of motor actuation for goal satisfaction.
