# RB-OL0 — continuous private actuator adaptation in a material organism (2026-10-11)

**Status: PRE-REGISTERED SCOUT · no result · no architecture authority**

## Project purpose

This is the smallest useful end-to-end challenge to the current split between an executable LivingWorld and offline learned models. It must not be promoted into a living-organism success or ReflexBrain semantic learning claim.

**Question:** in an ordinary, uninterrupted embodied visual approach, can a cheap learner update the relationship between *its own commanded turn* and *its own later proprioceptive rotation*, then use that experience to cause a genuinely better World contact outcome when the material turn response changes without any semantic notification?

The living body + actual ray retina + actual collision are required. No host target coordinates, object ID, gain/regime or contact-success label may enter the local decision/learner. The evaluator alone reads host afterstates.

## Implementation choice and limitations

- Base **Living Organism A** source at `aa1ce53dc35540f38385dae0be578eb425e8fadd`. No O-CTRL code merge. Default LivingRuntime / Occupant untouched.
- Use its real `LivingWorld(false)`: E0 Rapier body, 120Hz material physics, cached 30Hz 96-ray RGB private frame and body-local proprioception.
- One real cyan object/target in the world, at (8, +4) or (8, -4) with physical radius .8. The object label/handle is retained **only** by the host evaluator.
- Each arm is a single **continuous world/life**, from initial sensor observation until tick 900 or first true material contact; no offline training resets, replay-label injection or cross-arm learner statistics.
- At physical tick 40, host-only actuator transducer changes the actual turn fraction `physical_turn = clamp(issued_private_turn × gain)`. The actor is never given gain/change timing. Candidate receives only its own issued turn and subsequent ordinary proprio+RGB. This is **an authored impairment**, not emergent physical ecology, and is an acknowledged limitation.
- Gain after perturbation: +1.0 (unchanged control), -1.0 (reversed), +0.25 (sluggish), -0.25 (sluggish+reversed). Two visual target sides; 8 frozen scenarios.
- Fixed controller, cheap private **sign-only** adaptation, and magnitude+sign online estimator receive the same sensor/action API. Their trajectories may differ; their afterstates must not leak into other arms.
- Controller's *standing authored activity* is approach the currently visible cyan surface. No claim of self-born goals or natural target importance.
- All three modes use the SAME private visible bearing, forward speed / heading policy and visual reacquisition; differ only in conversion of a bearing/omega command to turn. Do not give the learned arm any special access to future frames.
- At 30Hz update the private motor calibration from the previous commanded turn and the observed change in body-local angular velocity; use forgetful normalized correlation, **not** the host gain. Sign-only uses the same private history but discards magnitude. Learned arm applies inverse measured gain, bounded by the physical actuator limits. If a trivial sign controller does as well, learning has NOT earned extra machinery.

## Frozen evaluation

Primary: **actual Rapier target contact** across six changed-gain scenarios, checked by host-only collider contact attribution and source tick. Secondary: first-contact tick, terminal body-target distance measured only by host afterstate, and deterministic rerun equality.

Pass only if all hold:

1. All 24 runs and deterministic repeats execute with finite private state, no host truth entering any candidate.
2. The online estimator's private parameters change after the physical perturbation; disable-update ablation does not.
3. Real material contact in at least 4/6 changed-gain learner scenarios.
4. Learned arm achieves **at least 2 more true changed-gain contacts than the stronger cheap competitor** (best of fixed, sign-only), *and* at least 15% lower median final distance over changed-gain scenes than that competitor.
5. Unchanged-gain controls do not show systematic learner harm vs the better simple competitor (no lost contact where both cheap arms contact).
6. Any sensor failure or no-visible-target situation is recorded explicitly, not silently discarded.

If some runs fail physically or no arm contacts the target, record **FAIL or INCONCLUSIVE with causes**, not tune the frozen scenes/gates afterward. You may fix a technical harness bug only if the intended source and frozen physics/target conditions are unchanged; disclose it. A code/CI PASS is not scientific PASS.

**Scientific upper bound if PASS:** one online, cheap, actor-private local motor calibration improves physical contact in these pre-authored impairment/target cases over both inexpensive competitors.

**If FAIL:** preserve the narrow mechanism information and **do not scale the learner/model**. Reconsider whether this adaptation problem is already solved more cheaply and whether ReflexBrain should instead work on a genuinely actor-owned continuation/relevance pressure.

## Excluded claims

- endogenous motivation, value learning, interest in cyan, learned object semantics, actual organism life;
- general movement, 2D robotics generalization, contact target identity or safe navigation;
- superior performance in natural body physics without authored motor failure;
- manual/world-teleport supervision during decision;
- current donor architecture recommended for canonical ReflexBrain.

Source-only scout, isolated draft PR; never merge into canonical or modify main by inertia.
