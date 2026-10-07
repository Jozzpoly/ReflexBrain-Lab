# OCTRL-C01 — Continuous Private-Evidence Monitoring Null — 2026-10-07

Status: **ARMED · one primary causal question · NO RESULT YET**
Base: `8a82ef10f5282bcda98a3daa932a97df2c5c1b0e`
Run branch: `run/octrl-c01-actor-clock-monitoring`

## Why this run exists
H01 proved that a legal previous observation can causally drive body motion under a controlled memory ablation. But its CHECK was released on a researcher-run phase boundary, leaving the most critical continuation claim unsupported.

## Question
Can a *single uninterrupted* authored local controller use private evidence age to initiate a physical CHECK by its **own local clock**, while external hidden material intervention time varies without notifying it? Does that history-dependent action reacquire legal P0 evidence, and disappear under matched-memory ablation?

## Type
PROBE: self-timed local-control integration null. Not an organism claim.

## Frozen substrates and scene
Reuse exactly the B0/P02b body/world geometry and P02a synthetic sensor:
- actor start (-3, 2), heading -pi/2, radius 1;
- fixed occluder (0,0), half extents (0.16,1.5);
- dynamic target (1.5,2), radius 0.35, damping 2, mass 1;
- P02a sensor law, range 8, body-relative blobs, no identity/World coordinates to controller;
- Rapier step 1/120 s and neutral query-readiness step.

## Authored private controller frozen before execution
One ordinary authored patrol routine and a private monitoring duty:
- initial forward drive +1 while actor's **body-local integrated odometry** is below 3.0; then drive 0;
- P0 visible blob may be stored as one last-seen frame and actor-local clock tick;
- after P0 loss the controller continues patrol until private odometry cap, then idles;
- if the current P0 is empty, a prior legal last-seen exists and its **actor-private age reaches 180 simulation ticks**, initiate CHECK: drive -1 with unchanged heading;
- CHECK continues until a new legal P0 blob appears or 110 CHECK ticks elapse; if time limit hit, yield UNRESOLVED (no retry by fiat);
- after CHECK reacquisition remain quiescent; no multi-concern planner or general navigation.
- controller is called unconditionally at every physics tick and sees only private odometry increments, private age, P0 current blob and stored last-seen; it receives no host phase, hidden event tick, target ID or World position.

## Independent research perturbation / controls
The World applies the same target impulse +x 1.2 at **predeclared absolute simulation tick 95**, or **155**, or never (STATIC). This is still a *researcher-authored external event*, NOT an autonomous ecology process. It is forbidden to notify the actor or use the event tick to trigger CHECK.

Run the same frozen controller with history enabled across all three timings.
Run a *matched complete World* history-ablated control using tick 155, with otherwise identical observations and body mechanics. Ablation prevents retaining last-seen while leaving the current P0 intact.

Total observation: **360 simulation ticks** after neutral readiness.

## PASS requires
1. deterministic exact replay per variation;
2. initial visible P0, first loss from actual body motion, target within range and occluded throughout hidden variations until CHECK;
3. private last-seen persists unchanged across the hidden change; no hidden change leaks into P0;
4. all three history-enabled variations initiate their first CHECK on **the same actor-private evidence age**, hence same simulation tick independent of the World impulse timing;
5. no host CHECK-start or motor-phase instruction reaches the controller;
6. immediately before first CHECK, late-impulse memory-enabled and memory-ablated runs have identical actor body state and identical current legal sensor readings;
7. memory ablation does not issue CHECK, while memory-enabled drive diverges and later moves the physical B0 body;
8. memory-enabled runs obtain a fresh legal P0 blob during their first bounded CHECK, while the ablation does not generate an equivalent reacquisition in the same interval;
9. no World identity, hidden position, event time or semantic label is copied into private history/decision.

## INCONCLUSIVE
Scene, body or P0 parity broken; sensor-query setup inconsistent; target exposure before CHECK due to unintended geometry; physically unmatched memory-ablation comparison; object leaves range during hidden phase; implementation protocol invalid.

## FAIL
Any intended scientific condition fails with valid apparatus. Do not tune sensory law, thresholds, geometric arrangement, patrol distance, impulse ticks, timeout or motor protocol after observing the result. A failure to reacquire is FAIL, not a request to add navigation to save the null.

## Maximum claim
A minimal authored actor-private *ongoing* monitoring procedure can trigger a CHECK based on the age of legitimately acquired evidence, independently of unobserved external event scheduling, and can create actual bodily reacquisition in this one frozen synthetic scene. That is a different claim from H01's researcher-released check.

Still NOT:
- endogenous motivation, natural actor need, learning, object identity, P1, general planning, agency, life;
- truly independent M0 ecology process (impulse remains researcher-authored);
- generic visibility sensor / unbounded reacquisition / G1–G5 qualification;
- any Owner-observed experiential PASS.

## Owner-facing evidence surface
If scientific evidence is valid, a replayable browser canvas may render researcher World truth, the actor-private last-seen vs live sensor, and decision provenance **as distinct layers**, with a clear research-only label. The canvas is not an independent simulator validation.

No Owner action required. This run is a bounded experiment, not a new research road map.

---

## Closure

**SCIENTIFIC PASS · EXECUTION VALID · CLOSED.** Frozen CI evidence and honest limitations: `docs/runs/OCTRL-C01_RESULT.md`. No threshold, control law, World timing or geometry was retuned. Viewer work that follows is presentation only, not a new qualification.
