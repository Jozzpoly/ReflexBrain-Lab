# RB-CREDIT/P1 — actuator readback vs unidentifiable control authorship
**Frozen before execution · 2026-10-21 · follow-up to P0 first PASS and adversarial tests**

## Adverse P0 finding (already source-executed)
With **UNCHANGED** true motor polarity, motor input -0.8 during a host takeover, a naive model mistakenly trained against its hypothetical own +0.8 intention infers **-1** gain. A provenance-gated model avoids that error by using a HOST-WITNESS of whether it controlled the motor. Two otherwise identical physics/PrivateFrame histories differing only in who supplied identical motor inputs are demonstrably indistinguishable to actor's original RGB/touch/proprio. Accordingly P0 is NOT actor-private causal source identification.

## P1 alternative question
What if the embodied actor can legally sense a **physical actuator command readback** (signal sent to its motor *before any hidden actuator gain*), without knowing who selected that signal? This is a deliberately **new sensory affordance**, not a recovery of a capability already present in PrivateFrame. Is that motor-copy channel sufficient to calibrate action-effect polarity when otherwise identical proprioceptive histories arise from (1) manual negative turn with normal motor physics vs (2) positive turn request with hidden inverse motor response?

## Frozen design
- Native true Rapier empty-body E0 World, 480 continuous 120Hz steps per world and 121 30Hz samples, no passive retina difference.
- Both worlds receive the same **actual** turn torque command -0.8 per physics step and must have identical body/retina/touch trajectory.
- World A motor-copy reports -0.8 (manual negative turn, normal actuator).
- World B motor-copy reports +0.8 (self motor request +0.8, actual hidden actuator gain -1); the model never sees hidden gain or manual identity.
- One identical tiny signed-gain estimator using only pre-actuator motor-copy plus subsequent actor proprioceptive angular speed estimates gain in both worlds.
- Naive *intention-only* estimator in world A is already shown to hallucinate; P1 may NOT silently use manual flag, World identity, hidden gain, host labels or external forces in the model input.
- A frozen estimator is the cheap control; evaluate only factual sign estimate, not organism motivation or behavior.
- No changes to existing `LivingWorld` or `PrivateFrame`, no promotion to standard sense until independently justified.
- This is physically an *assumed body actuator telemetry channel*, and it does not solve hidden contact impulses, uninstrumented external forces, action ownership when requests happen to be identical, or semantic significance.

## Decision
If P1 functions as expected, preserve it as a **candidate sensor specification**. Do not treat a host-provided `owned=true` provenance gate as a learned component or default actuator information. A future integrated body must explicitly choose between measuring actual drive, inference/abstention under partial observability, and privileged researcher-side sample selection. No self/world attribution claim follows automatically.
