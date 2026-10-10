# RB-VISION/V3 — Gaze-only information ablation, 2026-10-10

**Research status: EXECUTABLE AUTHORED SENSOR→BEHAVIOR EVIDENCE; NOT ACTIVE CURIOSITY / LEARNED COMPETENCE / FINAL SENSOR**

**PR** https://github.com/Jozzpoly/ReflexBrain-Lab/pull/53  
**Branch** `research/vision-embodied-experience-2026-10-10`  
**Test** `tests/vision-gaze-information-ablation.test.ts`  
**Independent CI** [workflow 38087135297](https://github.com/Jozzpoly/ReflexBrain-Lab/actions/runs/38087135297), exact tested source `0aa82e060ba1676d8a60297bc2499668435d3687`: **30/30 test files, 53/53 tests, TypeScript and Vite build PASS**. Initial implementation already passed workflow `38087056551`, but subsequent source correction explicitly recorded the commanded gaze state before final evidence.

## Question
In a synthetic world where a body can look sideways without moving, can we isolate a later **physical behavioral consequence of a fresh lawful optical sample** from a change in the physical state merely caused by looking?

This is a narrower causal-instrument question than F4. The actor does **not** autonomously originate a desire to look; the view-change is researcher-commanded. We also ask whether an authored optical affordance shortcut survives optical/physical mismatch.

## Controlled conditions
Five synthetic scenes (actual E0 deterministic Rapier):
1. big solid body, narrow visible/physical passage;
2. big solid body, wide visible/physical passage;
3. small solid body, narrow visible/physical passage;
4. big body, **visibly narrow but mechanically intangible** passage;
5. big body, **optically invisible but physically blocking** narrow passage.

For each scene three variants:
- **CENTER**: fresh center ray at tick 28, no gaze turn;
- **GAZE+WITHHELD**: explicit internal gaze state commands 0→+0.28 rad at tick 25; still only actor-private cached center observation from tick 24;
- **GAZE+FRESH**: exact same gaze command, but lawful side-ray sampled and delivered at tick 28.

All variants execute the **same zero-drive physical motion through tick 28**. Full Rapier source snapshots are bitwise equal across conditions *within each scene*, so there is no incidental locomotion/scene-change advantage from the gaze intervention.

Important: this gaze change is a **cost-free idealized virtual sensor orientation**, not a biomechanical head/eye motor, and does not yet consume energy/time in a realistic actor. Only the subsequent physical motor continuation is simulated with real contact.

A deliberately authored `choose(frame,radius)` heuristic:
- small radius <0.7: push;
- otherwise, without recent side observation: hold conservatively;
- with fresh lawful side observation: push if ray reports no optical wall, else hold.

The policy has no World IDs, collision labels or future outcomes, but **the rule and its values are authored**, not learned or self-created.

Both motor branches (push for 180 ticks or hold) use actual solver. Analysis uses the same authored forward-progress/contact cost as V2.

## Executed physical results
| Scene | CENTER drive/cost | GAZE+WITHHELD drive/cost | GAZE+FRESH drive/cost |
|---|---|---|---|
| Big narrow solid | hold / 0 | hold / 0 | hold / 0 |
| Big wide solid | hold / 0 | hold / 0 | **push / −7.055903** |
| Small narrow solid | push / −7.055903 | push / −7.055903 | push / −7.055903 |
| Big narrow visually present, mechanically phantom | hold / 0 | hold / 0 | hold / 0 |
| Big narrow invisible physical wall | hold / 0 | hold / 0 | **push / +17.722714** |

In the *three optics↔collision-aligned scenes*, fresh gaze improves average policy cost by **2.351968** relative to the same fixed controller without the new sample (same physical state before branch). The change comes from the lawful sample at tick 28, not from moving the body or merely issuing a gaze demand.

In the *five-scene adversarial mixture*, equal scene weights give the opposite: GAZE+FRESH is **worse by +2.133362 mean cost units** than CENTER, because the invisible obstruction triggers a strongly harmful push. This is descriptive post hoc analysis of the declared fixture family, not a prospective statistical result and not a general estimate for the real world.

The **phantom** and **solid narrow** side samples are exactly equal despite different mechanical consequences. The **invisible wall** and **wide open passage** also yield the same empty optical sample despite opposite consequences. Extra visual detail cannot recover a physical property that the defined optical law does not encode.

## Interpretation
1. **A real subsequent motor/material difference can be caused by new lawful private visual evidence under an unchanged physical state.** This does not establish learned value of information.
2. **More fresh information does not guarantee a better action for a fixed heuristic.** The apparent gain in the aligned three-scene family turns into harm under explicit optical-mechanical decoupling. A Bayes-optimal agent with correct observation law could ignore harmful extra information; this test instead shows the failure of an authored mistaken interpretation of information.
3. **Gaze command, private sampled frame and physical consequences must be logged distinctly.** A delayed/cached frame cannot be mislabeled as a fresh lateral observation even if the gaze command has executed. In the withheld variant, actual gaze is +0.28 rad but the private frame still has the old center orientation/tick.
4. A controller can be programmed to use a useful sensory observation without owning the *reason to seek it*. This remains the genuine ReflexBrain/F3/F4 gap.

## Not proven
- Endogenous motivation, uncertainty resolution chosen by organism, curiosity, learning, long-run activities, material identity, calibrated perception, history usefulness, or Owner-qualified life.
- Any net gain after realistic gaze costs, sensing cadence, allocation cost, sample noise, ego-motion, occlusion dynamics, static-memory drift or changing geometry.
- Suitability of specific ray angles, image/raster/multiscale layout, a shared Feniks/Combat runtime or LOD's World engine policy.
- Scenario generalization, since all fixture placements and heuristic rules are authored and narrow.

## Research decision
V1 (optics/physics alias), V2 (body-scaled and ray-resolution aliases) and V3 (gaze-only sensory causal separation) jointly justify **one sharper next question**:

> Can a continuing actor establish, from lawful embodied history, when a candidate sensor observation will change the expected *material value* of an ongoing action, while avoiding the optical→mechanical and no-hit→no-obstacle shortcuts?

Answering this likely requires private history and better hypothesis/calibration, not simply more pixels. But **do not automatically commission a model, larger optical stack or another authored goal script.**

### Work process decision
The Vision branch should now stop multiplying these synthetic fixtures unless new evidence identifies a material unknown. Its next *high-value* work is to reconcile the above negatives with the main control room's F3/F4 frontier, and seek a non-scripted organism-originated information need that existing sensors/controllers demonstrably cannot service.

This is a bounded prototype/evidence donor, not a finished playable demonstration. No source in this Vision PR should be merged into canonical pre-O0 merely because it passed CI.
