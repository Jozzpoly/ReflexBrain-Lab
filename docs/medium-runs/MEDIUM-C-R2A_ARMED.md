# MEDIUM-C/R2a — P0 Frame Reconstructibility After Exact Physics Restore — 2026-10-07

Status: **ARMED · ARCHITECTURE PROBE · NO PERSISTENCE FEATURE**

Base: 3f6132e35cba8c1bdec08c4883d5d9ee05bc93fd
Branch: medium/continuity-p0-reconstruct-r2a

## Question

At a saved causal moment, is the current legal P02a P0 frame a pure reconstructible function of the restored physics state + sensor configuration, or must the exact frame itself be serialized as causal sidecar state?

## Frozen protocol

Use the unchanged P02a sensing law in two exact physical cases:

### VISIBLE-MOVING
- actor at (-3, 0);
- target initially visible at (-1.2, 0.4);
- standard P02a occluder;
- neutral initial query-readiness step;
- apply a deterministic target impulse and advance 20 ticks;
- acquire current P0;
- snapshot physics;
- restore physics;
- rebind actor/target/occluder by handles;
- call senseP02aFrame **immediately, with no physics step**.

Require exact P0 equality.

Also create a second restore, perform one extra physics step before sensing, and require the resulting moving-target P0 to differ. This negative control protects against a future "warm up restored queries with a step" shortcut.

### HIDDEN-MOVING
- actor at (-3, 0);
- target on the far side of the same occluder;
- same query-readiness discipline;
- target undergoes material hidden motion;
- snapshot while still within range and occluded;
- immediate restore + immediate P0 query must reproduce the exact empty frame.

## PASS

- handles rebind;
- visible-moving immediate restored frame exactly equals pre-snapshot current frame;
- hidden-moving immediate restored frame exactly equals pre-snapshot current frame;
- no extra physics step is required to make scene queries valid;
- extra-step negative control changes visible-moving P0, demonstrating that a warm-up step would alter causal time.

## FAIL

API executes validly but immediate restored P0 differs or query state is unavailable without stepping.

## INCONCLUSIVE

Harness does not recreate the frozen P02a geometry/law or snapshot restoration cannot rebind required bodies.

## Maximum claim

At most:

> For current P02a, current P0 can be reconstructed exactly from an exact restored physics moment without serializing the frame or advancing simulation time.

This does NOT prove:
- all future sensors are reconstructible;
- private memory/history is reconstructible;
- Field Lab save/fork is ready;
- candidate enumeration is solved;
- P02a is a general perception system.

No production sensor/source modification is allowed in this run.
