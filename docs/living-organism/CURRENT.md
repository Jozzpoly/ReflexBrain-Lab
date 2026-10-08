# Campaign A — continuing authored occupant checkpoint

2026-10-08. Base: 87d94c84288982dd6c150494b24504097ec4474f.
Previous checkpoints: 819cd669d33a5bce57a480def69d2e528e8b805d (world),
daf818635c5aace756aa52673488a22a23f92908 (initial private continuation).

## Implemented
- E0 disk world with finite summed forces/torque and independent physical mover;
- directional gaze and RGB-only 96-sample nonuniform angular retina across 160 degrees;
- fixed 120 Hz physics, 30 Hz private sensory frames, four-step touch accumulation;
- private controller receives cached retina, touch and ideal body-local proprioception;
- authored turquoise-patch concern, bounded direction memory and directional contact escape;
- exploration uses sensed travelled legs and sensed rotations, with checkpointed private
  deterministic angle variation; no host map or position is supplied;
- bounded angular-appearance inspection followed by ten seconds of visual-concern suppression;
- shared nonuniform retinal calibration, angular fragment selection and explicit FOV clipping;
- manual takeover with private perception continuing; release preserves private state;
- checkpoint restores physical state, sensory phase/accumulator, mover and private continuation;
- separate host world and private retina views, pause, save/restore and object dragging.

## Verified
Full `npm run check`: 32 files, 71 tests PASS; typecheck/build PASS.
Regression tests cover sensory timing, transient contacts, partial-interval restore,
private history affecting identical later images, override/release and 600-step
whole-loop exact continuation after a checkpoint at tick 123.
Ten-minute whole-loop regression requires movement in every 60-second window.

The first authored controller permanently stopped: 600 seconds, approach 72000 ticks,
path 0.7015104235. Cause: a large visible patch suppressed drive indefinitely without
an end to the concern. A failing close-patch continuation test reproduced this.
After adding bounded inspection and suppression: path 327.1490805618;
approach 16964, explore 51536, yield 3500 ticks. Every minute adds movement.
The earlier inspection-fix measurement is retained as `whole-loop-600s-inspection-fix.json`.
The pre-retinal-fix controller's ten-minute path was 274.1153179347; current angular
interpretation gives 287.1342975055, with movement every minute. See the separately
saved whole-loop-600s-after-retinal-fix.json; older runs remain historical controls.
Exact raw measurements: `evidence/living-organism/whole-loop-600s*.json`.

Removing all turquoise objects after sixty seconds exposed a second failure: the old
constant-turn exploration travelled 154.535 units in four minutes but visited only ten
1-unit grid cells, with no new cells after thirty seconds. These are host-only metrics.
A whole-loop regression fails on daf8186 (zero new cells after minute one) and passes
on the current code. Current exploration uses body-local speed integrated over time;
turn completion uses sensed angular motion, not a timer. Authored private angle variation
is deterministic and restored with its state.

| Four minutes after intervention | Old visited cells | Travelled-leg exploration | Plus directional escape |
| --- | ---: | ---: | ---: |
| Control | 24 | 52 | 42 |
| Turquoise removed | 10 | 72 | 78 |
| Five seconds manual rotation | 37 | 55 | 43 |

Directional escape fixes rear contacts causing reverse drive and chooses a turn away
from the strongest contacted sector. The two changes were measured sequentially;
directional escape does not improve coverage uniformly. All results use one initial
scene and fixed private seed. New place counts do not establish meaningful activities.
Raw data: `perturbations-before.json`, `perturbations-after.json`, `perturbations-final.json`.
Reproduction harness: `probes/living-organism-perturbations.ts`.
Six physical touch fixtures pass (four angles, fixed wall, rotated body), plus an
actual rear collision driving the controller forward. Thirty seconds of the independent
mover verify repeated reversals from actual displacement, not a controller flag.
Runtime checkpoint schema is now version 2 for the additional private state.
An opposite sensed rotation could accumulate more than one revolution of turn debt.
A failing regression reproduced this; remaining rotation is now wrapped to the shortest
signed angle, preserving a crossing-of-goal check. Recovery and restore tests pass.
Re-running the three perturbations and ten-minute characterization after this fix
produced identical saved metrics; the adverse sampled-rotation fixture exercises the fix.
Independent review was dispatched as required by requesting-code-review, but the
reviewer hit a usage limit before a final verdict. Its one potential turn-debt finding
was reproduced and fixed. No completed independent review is claimed.
Reproduction harness: `probes/living-organism-characterization.ts`, run from repo root
with Node and a tsx loader (not bundled browser UI).

## Open / not qualified
This is authored control, not learned interests, identity, goals, an NN or an LLM.
Continuing movement is a regression gate, not evidence of meaningful activity.
Patch width is an appearance cue, not true distance; suppression affects all matching
patches, with no object identity. Integrated heading drifts; direction memory lacks
positional correction. No route planning, task completion or Owner-test gate yet.
Touch orientation passed current creation-order fixtures; other collider orderings are not qualified.
Independent mover patrol reversals are tested; persistent obstruction recovery is not qualified.
UI takeover/pause state is outside the organism checkpoint.
Browser QA remains blocked: cloud browser localhost connection refused; local
Playwright has no binary and its official headless-shell download was invalid/truncated.
No rendered screenshot or interaction success claimed. Build retains inherited large
Rapier chunk warning. This checkpoint does not complete Campaign A.

## Rulings and next work
Keep E0 disk as comparison control until sensor/body boundary checks are complete.
Direct collider rays avoid uninitialized broad-phase queries without extra physics steps.
Existing Field/C01, public frontdoor and Pages deployment remain unchanged.
Nearest plan is revised by PLAN_REVIEW.md after actual gaze and direction-memory ablations.
The nonuniform sample-count error is fixed; memory usefulness is still not established.
Next test a material, memory-relevant relation activity with information acquired through motion.
Do not extend the current roaming/color-chase controller merely to increase movement.
Resolve a reachable rendered test surface before promoting the UI.
Do not repeat completed sensory-clock or checkpoint implementation after handoff.

## Retinal correction checkpoint
The same object six units ahead now requests drive .65 at 0, 30 and 60 degree gaze,
instead of 0, .65, .65. New tests cover far/close decisions at central/peripheral gaze,
FOV clipping, separate occluded fragments and ranking by angular rather than pixel extent.
The older close-inspection synthetic fixture was widened to express angular closeness,
rather than accidentally enshrine the faulty pixel-count threshold.
The inspection threshold remains explicitly authored at 20 degrees. Angular cell bounds
are quantized; extent is visible appearance, never true size, distance or identity.
FOV-clipped patches do not complete a close inspection. Occluded fragments remain separate.

Post-fix three-seed direction ablation gives visited cells 38/63, 57/37, 45/34
(full/reset). This is mixed evidence, not a memory competence score.
Measurements include exact production source hashes in plan-challenge-after-retinal-fix.json.

A preparation probe places radius-.3/distance-3 and radius-.6/distance-6 objects in
separate scenes: initial retinas are identical. Equal lateral body movement gives distinct
retinas with identical realized body motion. relation-observability.json records this.
Active motion can disambiguate these fixtures; range inference and a material relation
activity are not implemented. No host coordinates or object sizes were added to policy input.
Browser QA and completed independent review remain open.
