# Campaign A — first runtime checkpoint

2026-10-08. Base: 87d94c84288982dd6c150494b24504097ec4474f.

## Implemented
- isolated world with finite force/torque, summed external force;
- directional gaze, 96 nonuniform angular samples across 160 degrees;
- RGB-only retina, no object IDs/range/world positions in private observation;
- all registered surface contact pairs queried for current touch;
- physical checkpoint with clock, gaze and host surface registry;
- manual scene, separate world/retina views, pause, save/restore and dragging.

## Verified
Eight new tests plus full suite: 24 files, 41 tests PASS; typecheck/build PASS.
Direct collider ray casts work before first physics step and after restore.
240-step continuation matches after restoring checkpoint in tested scene.
Partial occlusion retains visible edge samples; hidden movement does not change retina.

## Open / not qualified
No autonomous occupant, learned brain, task continuity or independent mover yet.
Touch is currently instantaneous; four-tick accumulation is not implemented.
Retina is computed on demand; the planned fixed 30 Hz sensory scheduler is not implemented.
Manual browser scene is not a campaign completion or Owner-test gate.
Browser QA blocked: cloud browser localhost connection refused; local Playwright
has no browser binary, and official headless-shell download yielded invalid/truncated ZIP.
No screenshot/interaction success claimed. Build retains inherited large Rapier chunk warning.

## Rulings
- Initial body remains E0 disk as comparison control; capsule comes after sensor boundary checks.
- Direct collider queries replace uninitialized world broad-phase rays without extra physics steps.
- Force test includes inherited damping; undamped velocity=1 was an incorrect expectation.
- Existing Field/C01 and public frontdoor remain unchanged.

## Next
1. Verify rendered scene through a reachable browser surface before promoting UI.
2. Add four-step touch accumulation and fixed 30 Hz sensor/control clock with checkpoint tests.
3. Add independent mover and test contacts.
4. Add actor-private temporal state and continuing authored concerns.

Do not repeat completed world-senses work after handoff. This is an initial
runtime checkpoint, not completion of Task 1 or Campaign A.
