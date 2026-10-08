# Review of the organism direction and nearest campaign

2026-10-08. Tested behavior source: d3f0ae509561b534e2a87fa0ce382788edc7e3cb.
This review changes priorities; it does not qualify Campaign A or replace its goal.

## Intended outcome versus current result
The goal remains a continuously embodied organism with private experience, continuing
activities, independent material surroundings and meaningful consequences of intervention.
The original campaign specification is REFLEXBRAIN_KAMPANIE_I_PLAN_2026-10-08.md.

Physics, private sensory boundaries, fixed clocks and checkpoint continuation are useful.
The occupant is still a movement baseline: a fixed color detector, direction servo,
timed suppression and varied locomotion. It does not yet investigate change/uncertainty
or maintain a chosen thing in a remembered environmental relation, the two intended
initial authored concerns. Scanning follows a sine clock, not a question the actor needs
to resolve. There is no learned adaptation. This is a substantive scope gap.

The previous run fixed concrete failures, but covered-place counts and movement gates
can reward restless wandering. Stopping to attend can be valuable. Do not impose those
gates unchanged on future activity controllers or treat passing them as organism success.

## New counterevidence
Exact raw data: evidence/living-organism/plan-challenge.json.
Reproduction: probes/living-organism-plan-challenge.ts; no production controller changed.

### Nonuniform retina misread as apparent size
In an otherwise empty physical scene the same stationary radius-.6 object is six units
in front of the stationary body. Its angular extent is about 11.48 degrees in every case.

| Gaze | Matching samples | Requested drive |
| --- | ---: | ---: |
| 0 degrees | 26 | 0 |
| about 30 degrees | 6 | .65 |
| about 60 degrees | 4 | .65 |

The current >=18-pixel threshold mistakes central sampling density for apparent size.
The largest-group selection is also density-biased. A suppression timer made the early
halt finite without correcting this underlying perceptual error. Angular extent is an
appearance cue; even a corrected extent is not distance, identity or true object size.
Partial occlusion and FOV clipping make visible extent incomplete.

### Direction-memory ablation across three controller seeds
Only lastDirection/lastSeenTick are cleared before each new private sample. Heading,
inspection suppression, exploration state, RNG and physics are retained. This is not
an ablation of all temporal state. Each run lasts 180 seconds in the same physical scene.

| Private seed | Full visited cells | Direction memory removed | Full inspect seconds |
| --- | ---: | ---: | ---: |
| 1 | 42 | 40 | 1.07 |
| 42 | 37 | 34 | 3.30 |
| 1831565813 | 38 | 40 | .80 |

History changes actions and sometimes the trajectory. These data establish no uniform
coverage advantage or useful memory competence. The intended memory-dependent activity
is absent, so this scene is a poor task test. Do not tune memory to maximize this table.
Three seeds of one scene are not held-out generalization. These are causal paired
interventions with diverging subsequent observations, not identical-input comparisons.

## Decisions
1. Preserve world/sensors/runtime and d3f0ae5 as comparison controls. Do not discard tested
   infrastructure or promote the present occupant into the default brain architecture.
2. Stop adding timers, thresholds and travel objectives merely to keep it moving.
3. Correct the retinal geometry interpretation as a bounded prerequisite, including
   peripheral/central views, FOV clipping and partial occlusion. Keep true range absent.
4. Then build one material, memory-relevant activity, rather than more mode names:
   attempt to keep a selected visually encountered object in a remembered relation to
   an encountered landmark. Authored motive must remain explicit. Selection/reassociation
   is a fallible private hypothesis, never a world ID. World movement must have actual
   physical consequences. This restores an intended concern from the original plan.
5. Give gaze a local question: inspect disappearance, ambiguity or mismatch between an
   expected and seen relation. Continuous sinusoidal scanning remains a comparison control.
6. Test full state against selective memory reset, active versus fixed gaze, and a simple
   reactive baseline on that activity, including similar objects and unseen intervention.
   Assess relationship retention, mistaken reassociation, recovery and abandonment;
   host truth is allowed only for evaluation and never for inference.
7. Establish a reachable rendered candidate and action/intervention trace before an Owner
   test. Current browser limitation is an open capability problem, not proof that render
   QA is impossible. Existing public frontdoor is not promoted by this review.

## What not to schedule automatically
A new body shape, larger world, additional inhabitants or NN/miniLLM are not requirements
for the next question. They remain possible challengers. Do not equate a larger architecture
with quality, or defer all learning indefinitely until every infrastructure detail is perfect.
Choose a learned predictor/policy after there is a meaningful uncertainty/consequence to
compare against the authored baseline. The current color chase is a poor training objective.

## Preparation and starting loop
- Frame one behavioral claim and its likely counterexample before implementation.
- For perception, reproduce the same physical relation through differing gaze and verify
  angular appearance rather than pixel cardinality; explicitly test clipped observations.
- For the activity, specify success/failure before construction, with memory ablation and
  mistaken identity cases. A dynamic relation matters more than total travelled distance.
- Build the smallest integrated episode on the existing runtime, retain complete traces,
  then decide whether the activity makes this candidate worth extending.
- If the new episode still reduces to color chase and roaming, change the behavioral
  representation; do not convert that failure into an endless sequence of microfixes.

Implementation of this revised activity has not started. This run performs adversarial
measurements and revises the nearest plan; 66 prior production tests are not proof of its
new behavioral claims. Browser validation and completed independent review remain open.

## Preparation update: retinal prerequisite implemented
The angular interpretation correction is now implemented and verified by five additional
tests and the full 71-test suite. Its data are saved separately; the counterevidence above
remains the pre-fix baseline. Current source hashes accompany the new characterization.

Before implementing the relation activity, a physical observability probe established
identical single-frame images for different object size/distance pairs. Equal lateral
body motion disambiguates those two static scenes. Do not grant true range merely to
make the planned activity easier, or infer distance by silently assuming known object size.
Next prototype a fallible private estimate informed by active observations; evaluate it
with similarly appearing things, motion and occlusion before using it for material action.
If the ambiguity cannot be resolved, keep uncertainty and revise action, rather than
inventing a stable object ID. This preparation does not yet establish general triangulation
or learned perception. The material activity remains unimplemented.
