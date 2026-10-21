# RB-CREDIT/P0–P1 — execution, confounds and scientific disposition (2026-10-21)

**Engineering: PASS. P0 host-curated training: PASS within its declared scope. Actor-private authorship attribution: UNQUALIFIED / FAIL of stronger claim. P1 actuator readback: positive narrow sensory identifiability result under an explicit NEW body-sensor assumption. Organism life/learned significance: NONE.**

Original pre-execution [P0](RB-CREDIT-P0_ARMED_2026-10-21.md) and later, separately frozen [P1](RB-CREDIT-P1_ARMED_2026-10-21.md). Isolated [research-only draft PR #78](https://github.com/Jozzpoly/ReflexBrain-Lab/pull/78), based on actual D1 physics source. Original `LivingRuntime`, `Occupant`, `PrivateVision`, `LivingWorld` and public Vite entries were **not changed**. Full Vitest+TypeScript+build source-executed in [initial CI run #39519925656](https://github.com/Jozzpoly/ReflexBrain-Lab/actions/runs/39519925656) and [extended adversarial+readback CI #39520630154](https://github.com/Jozzpoly/ReflexBrain-Lab/actions/runs/39520630154), **44 test files / 131 tests PASS** in extended run. Exact log markers: `RB_CREDIT_P0_RESULT`, `RB_CREDIT_ADVERSE`, `RB_CREDIT_AUTHORSHIP_ALIAS`, `RB_CREDIT_P1_RESULT`.

## P0: actual uninterrupted resident composed with a weak OL0 donor

30s existing authored resident in real 120Hz Rapier + 30Hz RGB/touch/proprio + `PrivateVision`. A host-only actuator sign flips at 7.5s; optional manual takeover from 10s to 15s. `MotorCredit` trains on own *actually executed* turn windows only. Original `Occupant` and its cyan-color interests are unchanged.

| Arm | 30s path (not intelligence) | Accepted motor windows | Last turn gain | First negative estimate |
|---|---:|---:|---:|---|
| Fixed old controller | 13.5613 | 0 | +1 | none |
| Sign-only online | 16.3630 | 277 | about -1 | tick1593 |
| Sign-only with 5s human takeover | 24.4194 | 261 | about -1 | tick1813 |

The manually controlled arm's greater path is **NOT** independent improvement by learner — manual motor authority strongly changes the trajectory. Motor credit accepted samples stay **124→124** during 600 ticks of manual takeover (150 complete private sample intervals refused as non-self-executed). After release samples resume and learner eventually estimates inverted steering. An exact state snapshot fork reproduces actual World actor afterstate, Occupant state, PrivateVision state, credit state and physics bytes.

**Scope:** a cheap sensorimotor sign adaptation already succeeded in [OL0 draft PR #58](https://github.com/Jozzpoly/ReflexBrain-Lab/pull/58) and defeated its richer gain estimator; P0 adds integration, takeover-sensitive provenance handling and checkpoint continuity, not a new skill or self-chosen goal. Do not compare path lengths as material competence and do not promote the old color chaser.

## P0 adversarial: hidden supervisory gate is not actor's epistemic achievement

Test #1: true Rapier body receives normal `turn=-0.8` while hypothetical resident intends `+0.8`. An intentionally naive learner trained on INTENT falsely estimates physical gain **-0.999997**, despite unchanged actuator physics. Researcher-gated `MotorCredit` keeps prior gain **+1** and takes **0** contaminated training pairs.

Test #2: two worlds receive *identical* `turn=+0.8`, one chosen internally and one selected by host. Exact original private RGB/touch/proprio matches on **121 samples**. Learner with a host-owned gate accepts **120** windows; the other accepts **0**. As execution traces are identical, original private sensors cannot know who chose the command. The gate uses a host fact to choose training examples and **must not be described as an actor-private recognition of own vs external causation**.

## P1: explicit actuator-signal sensor candidate (not privileged WHO flag)

Two actual Rapier worlds receive **identical true applied turn torque -0.8** for 480 ticks. Both produce identical original RGB/touch/proprio on all 121 compared 30Hz frames.

- World A motor command readback is `-0.8` before normal gain +1 -> signed-gain estimator **+0.999997**.
- World B readback is `+0.8`, hidden actuator gain -1 -> same actual torque `-0.8` -> estimator **-0.999997**.
- Both models accepted 120 windows. No model input receives a host-authorship label or actual hidden gain; **pre-transducer motor command readback is an extra explicitly posited bodily signal**, not part of original `PrivateFrame`.
- Motor readback still does NOT distinguish different selection origins if two sources issue the *same* command, nor resolve unknown environment torques, body shape changes or semantic consequences.

P1 demonstrates *a candidate sensing boundary that makes causal motor response partly identifiable*, under deliberate design assumptions; it does **not** establish ability to infer 'my choice' from experience or consent to augment canonical sensorium.

## Particularly important hidden simplicity

`createE0Body()` builds `ColliderDesc.ball` with **friction=0**, symmetric radius1, no articulated components. Radial contacts through a frictionless disc generally do not exert torque about its center, so learning angular turn polarity is unusually isolated from collisions and material affordances. The nominal damping and E0 angular response constants are available as hardcoded priors. This physical simplification, not sophisticated causal self-modeling, plausibly explains exceptionally accurate ±1 motor estimates. Generalization to the historically intended B1 asymmetric body, actual tangential friction, external torque, manipulation or independently changing load remains **unqualified**.

## Final decision

**Close P0/P1 as sharply scoped integration and epistemic-boundary research.** Do not merge into canonical, scale model, build a bigger turn estimator, or retune the cyan chase. Both original results and all negative/confounded branches should remain legible.

Next genuinely valuable resident experiment must introduce useful bodily/material possibilities with an ongoing process *and compare actual experience-dependent future decisions against an equally cheap reactive controller*. Explicitly choose whether any motor telemetry is an actor-legal body sensor; otherwise give the learner honest uncertainty and never use a host-authorship discriminator as proof of the actor's own understanding. No Owner-visible product success is claimed, and existing Owner S0 FAIL remains binding.
