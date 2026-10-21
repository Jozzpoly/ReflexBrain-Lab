# RB-CREDIT/P0 — private actuation learning inside an uninterrupted existing resident
**PRE-EXECUTION scope freeze · 2026-10-21 · deliberately modest R&D pilot**

## Why this is not another OL0
OL0 already established online turn-sign recovery against a weak fixed controller; its richer magnitude estimate failed versus the **cheap online sign learner**. Do not retrain or claim the same narrow result as new AI. This pilot instead asks whether we can insert a **checkpointable, causally attributable online motor competence into the actual persistent `Occupant`+ `PrivateVision`+ `LivingWorld` loop** without silently training it on action/outcome pairs where Owner takeover replaces its motor commands.

The old program's `LivingRuntime.step(manual)` currently calls `occupant.decide(frame)` even while `world.step(manual??autonomous)` executes the other command. This is lawful for world/private continuity but invalid for naive 'my intention caused that motion' learning.

## Strict boundary
- **Research-only additive pilot**, no edits to canonical `LivingRuntime`, `Occupant`, existing World, UI/Pages or old OL0 code.
- Use same authored Occupant and Vision, same true Rapier physics and full checkpoint. This is NOT a newly intelligent actor or improved life feel.
- One 30Hz local gain/sign statistic from own *completed* actuator windows: prior self-issued **executed** turn and next legal angular velocity. No World coordinates, body IDs, objective, force/gain switch, gate phase, contact handles, researcher truth or Owner command semantics enter estimator.
- When takeover replaces actuator command, host **abstains from collecting 'self-executed' learner training pairs**, but private vision and resident's ordinary policy history still advance. This is *data provenance gating*, not an `OWNER_PUSHED` semantic label or proof of actor's causal omniscience. Unknown external physical influences may still confound apparent actuator response. Do not falsely advertise this as solving full self/world attribution.
- A gain sign correction is allowed to affect the pilot's local motor seam; no new concern or fixed reward is introduced.
- The invert-turn intervention is host-owned physics perturbation, not a request to the resident.
- Cross-frame inference requires an intact, all-self-executed 4-tick actuator window and sufficient turn excitation. Mismatched/partial windows abstain.
- Retain pause/fork/restart continuity in full checkpoint, and compare fixed vs sign-only plus takeover cases using host-only instrumentation.

## Frozen experiment / limits
One uninterrupted 30Hz/120Hz physical resident in existing boxed World, then host inversion of turn dynamics after 10 simulated seconds. Compare no learning, sign-only, and sign-only with 5 seconds of Owner manual takeover, all 25–30 s; no tuning on the results. Report learned parameter, accepted/abstained training windows, private frame continuity, physical distance/contact and recovery after release. Snapshot/fork deterministic equality and training ablation are separate qualification gates.
No 'life' score or trained-meaning claim. Outcome can be poor. New material capabilities and O-DEV remain separate, unimplemented questions. This is **infrastructure for honest continuous learning**, not an answer to organism motivation.

## Anti-goals
Do NOT use results to re-promote OL0, make cyan chasing a goal, compare rich gain-model over sign-only (already failed), infer general learned motor skills, override Owner S0 product FAIL, or merge/promote by default. If the assembled pilot offers no new technical value over existing OL0 and `LivingRuntime`, stop and report scientific redundancy.
