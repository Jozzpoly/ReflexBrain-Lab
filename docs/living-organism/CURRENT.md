# Campaign A — continuing authored occupant checkpoint

2026-10-08. Base: 87d94c84288982dd6c150494b24504097ec4474f.
Previous runtime checkpoint: 819cd669d33a5bce57a480def69d2e528e8b805d.

## Implemented
- E0 disk world with finite summed forces/torque and independent physical mover;
- directional gaze and RGB-only 96-sample nonuniform angular retina across 160 degrees;
- fixed 120 Hz physics, 30 Hz private sensory frames, four-step touch accumulation;
- private controller receives cached retina, touch and ideal body-local proprioception;
- authored turquoise-patch concern, bounded direction memory, contact retreat;
- bounded close inspection followed by ten seconds of visual-concern suppression;
- manual takeover with private perception continuing; release preserves private state;
- checkpoint restores physical state, sensory phase/accumulator, mover and private continuation;
- separate host world and private retina views, pause, save/restore and object dragging.

## Verified
Full `npm run check`: 28 files, 54 tests PASS; typecheck/build PASS.
Regression tests cover sensory timing, transient contacts, partial-interval restore,
private history affecting identical later images, override/release and 600-step
whole-loop exact continuation after a checkpoint at tick 123.
Ten-minute whole-loop regression requires movement in every 60-second window.

The first authored controller permanently stopped: 600 seconds, approach 72000 ticks,
path 0.7015104235. Cause: a large visible patch suppressed drive indefinitely without
an end to the concern. A failing close-patch continuation test reproduced this.
After adding bounded inspection and suppression: path 327.1490805618;
approach 16964, explore 51536, yield 3500 ticks. Every minute adds movement.
Exact raw before/after measurements: `evidence/living-organism/whole-loop-600s*.json`.
Reproduction harness: `probes/living-organism-characterization.ts`, run from repo root
with Node and a tsx loader (not bundled browser UI).

## Open / not qualified
This is authored control, not learned interests, identity, goals, an NN or an LLM.
Continuing movement is a regression gate, not evidence of meaningful activity.
Patch width is an appearance cue, not true distance; suppression affects all matching
patches, with no object identity. Integrated heading drifts; direction memory lacks
positional correction. No route planning, task completion or Owner-test gate yet.
Touch sectors/contact-normal orientation need dedicated directional validation.
Independent mover displacement is tested, not long-run patrol quality under obstruction.
UI takeover/pause state is outside the organism checkpoint.
Browser QA remains blocked: cloud browser localhost connection refused; local
Playwright has no binary and its official headless-shell download was invalid/truncated.
No rendered screenshot or interaction success claimed. Build retains inherited large
Rapier chunk warning. This checkpoint does not complete Campaign A.

## Rulings and next work
Keep E0 disk as comparison control until sensor/body boundary checks are complete.
Direct collider rays avoid uninitialized broad-phase queries without extra physics steps.
Existing Field/C01, public frontdoor and Pages deployment remain unchanged.
Next: validate directional touch, perturb visual continuity and independent motion,
measure recovery/loops rather than total path, then compare a richer activity controller.
Resolve a reachable rendered test surface before promoting the UI.
Do not repeat completed sensory-clock or checkpoint implementation after handoff.
