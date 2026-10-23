# R9 — contact-driven body–material coupling: pre-execution falsifier
Date: 2026-10-23. **Research-only isolated branch directly off R8 #89 source 329e1d9.** No R8 Owner pretest/UI/production source changes. No experimental result yet.

## Actual question
After LIFE/X1–X2, motor randomization sometimes allows material re-contact, but is seed-sensitive and no actor privately uses a changed world. Higher-scoring local mobility can make that worse. Bigger map, more randomness, or 79 learning trials do not create qualitatively different bodily capabilities. One candidate missing generative law: a material part, initially independent of an actor, may become mechanically connected after *actual contact* and later become disconnected through physical conditions, changing that individual's material envelope and abilities. This is a hypothesis about a substrate, **NOT life or self-generated motive**.

## Fix what we compare BEFORE running
Reuse pinned `@dimforge/rapier2d-deterministic-compat@0.20.0` / E0 B0 mass, force, torque, timestep `1/120`. Never change existing `LivingWorld` to implement a probe. A minimal separate Rapier physics microscope may use genuine Rapier bodies and local contact events, not predefined success zones or fictional joints.

Four physically distinguished local histories:
A. **No material:** B0 body, same fixed motor input, empty world (movement baseline).
B. **Free material:** one real dynamic solid part with B0 contact and no joining, fixed motor input.
C. **Contact-bonded material:** same initial parts and fixed motor input as B; only when Rapier reports actual body–part contact impulse and a local bounded distance may an explicitly authored host material law create a *true mechanical joint*. No global clock or actor command `attach` may activate the joint. A contact joint should not imply actor intention.
D. **Persisting world-only material:** same initial geometry but no body joint; after actual contact, a local host process may leave the piece fixed at its current physical location. This tests whether a future effect needs body incorporation or just a material obstacle. Explicitly authored world law, not autonomous ecological motivation.

Initial physical geometry and force samples are equal between B/C/D until the first causally observed contact; no collider teleport or replacement to manufacture attachment. Probe open-space motion first. Record genuine Rapier steps, first contact, body+cargo relative distance and angle, actor velocity, actual part motion, finite validity and successful detachment/physical separation after release. If the pinned library fails to implement stable joints this is a **feasibility FAIL**, not permission to silently swap engines.

**Secondary pressure (only if the joint works):** physically constrained passage/turning space or reciprocal load that allows one body configuration and resists another with identical motor input. Compare multiple gap widths incl. wide negative control and no-part baseline. Report a *range of motion/accessibility changes*, not a cherry-picked pass/fail gate. Include at least one harmful or useless effect of added matter, not only a story about benefits. Controls must be counterfactual **same physical initial state**, with correct provenance.

## Interpretation
- A joint that works is only proof of compositional physical change; not acquired skill, genotype, autonomous building, organ, intelligence, reproduction or life's definition.
- If fixed motor inputs produce no actor-relative consequences versus world-only null, the hypothesized law did not earn inclusion.
- If a bond changes movement, still require legal actor-private proprioception/touch and future historical actor choices to establish ReflexBrain meaning. Do not make a free magnetic owner action count as organism-owned decision.
- Keep science negative or inconclusive with zero posthoc task retuning. Debug real implementation errors in a new explicit round; don't alter original frozen claims.
- Early stop: before any larger model or UX work, prove actual contact, actual bond, actual detach, real loss/gain of physical possibility, null/rival; else return to broader options (material memory, ecology, morphology).
- Existing R8 draft #89 stays untouched; R9 is a new research-only PR and not an accepted world/organism.
