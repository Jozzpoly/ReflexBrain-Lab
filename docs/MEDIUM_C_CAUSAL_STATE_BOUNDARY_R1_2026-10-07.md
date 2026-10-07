# MEDIUM-C/R1 — Field/Organism Causal State Boundary Inventory — 2026-10-07

Status: **DESIGN RESEARCH · NO SERIALIZATION FEATURE**

Parent evidence:
- MEDIUM-C/R0 PASS: physics snapshot + explicit E01 process sidecar can fork exactly;
- MEDIUM-B/R1 FAIL: current Field v0 has known process/contact defects, so this inventory must not freeze its architecture by accident.

Question:

> Which current fields can change future legal World/actor trajectory under identical future inputs, and therefore belong to continuation state or must be reconstructible from it?

The goal is **not** to serialize every JS field.

---

# 1. Layer 0 — physics-owned state

Owned by Rapier snapshot:
- rigid-body poses;
- linear/angular velocities;
- sleeping/active state;
- collider shapes/attachments;
- contact/solver state represented by Rapier snapshot;
- integration parameters/world physics internals.

MEDIUM-C/R0 verified:
- snapshot/restore works in the deterministic package;
- body/collider handles can be rebound;
- exact continuation is possible when non-physics state is also restored.

Do not duplicate body pose/velocity into a second authoritative JSON state unless needed for inspection only.

---

# 2. Layer 1 — actor-private causal state

Current FieldMonitor fields that can affect future action:

## definitely causal

- `privateTick`
  - controls evidence age and YIELD timing.

- `bodyOdom`
  - currently exposed and potentially part of future policy state; in v0 ROAM logic does not use it, but C01 lineage did.
  - should not be assumed disposable merely because v0 currently underuses it.

- `lastSeen`
  - directly gates stale-evidence CHECK;
  - contains only legal P0 blob + private acquisition tick.

- `mode`
  - determines which branch of authored controller executes.

- `checkTicks`
  - bounds CHECK duration.

- `bounceTicks`
  - bounds current BOUNCE continuation.

- `yieldUntil`
  - determines when YIELD ends.

- `checkDirection`
  - changes future turn command during CHECK.

- `memoryEnabled`
  - controls future acquisition/retention and clear semantics.

- `sensorEnabled`
  - controls future P0 input.

- `actorEnabled`
  - currently means motor/control authority enabled; does not stop private clock.

These fields are part of the **current authored controller continuation**, not necessarily a future organism schema.

## important warning

Serializing FieldMonitor wholesale would accidentally canonize:
- ROAM/BOUNCE/CHECK/YIELD implementation;
- current toggle semantics;
- current timer representation.

A future snapshot envelope needs a **versioned occupant-specific private-state payload**, not a universal ReflexBrain schema.

---

# 3. Layer 2 — one-step causal caches

These fields sit outside FieldMonitor but can change the *next* decision.

## `currentFrame`

Current controller decides from the previous post-step P0 frame.

Options:
- serialize exact frame;
- or prove it can be reconstructed from restored World + sensor state without changing the next tick.

Do not assume reconstruction is equivalent until tested.

Potential hazard:
the sensor pipeline may have query-readiness / timing semantics. P02a historically required an explicit neutral World step for query readiness.

Therefore a post-restore extra physics step to "refresh sensing" would itself alter history and is not an acceptable silent reconstruction.

## `lastSelfMotion`

Fed into the next monitor decision and then integrated into private odometry.

It is the actor-private consequence of the immediately preceding physical tick.

Options:
- preserve as sidecar;
- or derive from a stored prior private pose/history.

Current Field v0 has no clean prior-private-pose state exposed separately.

Therefore **preserve it for exact v0 continuation**.

## `lastActorContact`

Fed directly into next controller decision.

Current implementation is already epistemically suspect because the contact boolean is researcher-selected and incomplete.

For exact v0 replay it is causal state.
For future medium architecture it should probably be replaced by a lawful generic body/private contact signal.

Do not make this broken boolean a permanent snapshot contract.

---

# 4. Layer 3 — World-process state outside physics

## definitely causal

- `sweeperDirection`
  - determines next applied force.
  - MEDIUM-C/R0 negative control already demonstrated the general pattern: a direction field outside physics can diverge a fork on the first tick.

- `sweeperEnabled`
  - gates future force application.

- `prevLeftTouch`
- `prevRightTouch`
  - edge-trigger reversal logic depends on whether contact is newly entered.
  - physics snapshot alone may know current manifold but not this authored edge-history bit.

## state with mixed causal/provenance role

- `occluderEnabled`
  - current physical position of occluder is physics-owned.
  - boolean affects future UI/toggle semantics and snapshot flags, not ordinary stepping.
  - if the same future Owner command sequence is replayed, this flag may affect command interpretation.
  - likely belongs to **environment control state**, not actor/world material state proper.

---

# 5. Layer 4 — binding / topology metadata

Required after restore to reconnect code to restored physics objects:

- actor rigid-body/collider handles;
- target handles;
- occluder handles;
- room-wall handles;
- sweeper handles;
- sweeper end-stop handles;
- loose-body handles and their ordering;
- any future joint/process handles.

This metadata is not "memory" or "World truth for the actor".

It is host binding state.

MEDIUM-C/R0 showed stable handles are sufficient for E01 rebinding under the current runtime.

Need future test:
- whether dynamically created/removed loose bodies preserve reliable handle mapping across snapshot restore in Field-scale cases.

---

# 6. Layer 5 — provenance that does NOT drive physics

## `events`

Current event log is not consumed by controller or World.

Therefore:
- it is **not causal continuation state**;
- but it is important experimental provenance.

Fork semantics should decide whether a child branch:
- inherits ancestry up to fork point;
- then appends branch-local events;
- receives a stable parent/fork identifier.

Do not inject event history back into actor state.

## `lastVisible`

Current use:
- determines whether to emit P0 acquire/loss log events.

It does not drive motor behavior.

Thus:
- not required for physical continuation;
- required for exact event-log continuation unless reconstructed from currentFrame.

This is a useful example of **provenance state**, not organism state.

## `lastActorPos`

Current source updates it but does not use it to decide or log.

Candidate classification:
- dead/incidental state;
- should not enter snapshot envelope merely because it exists in the JS object.

This is exactly why serializing the whole class is wrong.

---

# 7. Proposed snapshot envelope — conceptual only

Not a frozen schema.

```
ExperimentMoment {
  schemaVersion
  buildIdentity
  physicsSnapshot

  bindings {
    actor
    target
    occluder
    worldBodies...
  }

  occupant {
    type/version
    privateState
    oneStepCausalCaches
  }

  worldProcesses {
    processType/version
    processSidecar
  }

  environmentControlState {
    enabled/disabled intervention channels
  }

  provenance {
    worldTick
    parentMomentId
    forkReason?
    eventAncestry
    OwnerNote?
  }
}
```

Critical:
- `physicsSnapshot` is authoritative for material state;
- occupant-private state is authoritative only for actor-owned continuation;
- provenance is research history;
- UI layout/settings are outside this envelope unless they affect experiment semantics.

---

# 8. What must NOT be serialized as causal truth

Unless future evidence changes this:

- canvas zoom/pan;
- selected lens;
- open/closed panels;
- UI color/state;
- explanatory labels;
- researcher semantic categories;
- current PASS/FAIL badge;
- microscope-only derived labels;
- chart buffers;
- animation timing;
- page scroll position.

These may be saved as workspace preferences separately.

Do not let workspace restoration become organism restoration.

---

# 9. Fork semantics

A future fork should mean:

> same causal moment up to T, then two independently advancing copies.

For a scientifically useful fork:
- physics snapshot identical;
- actor-private state identical;
- process sidecars identical;
- provenance shares ancestry;
- future Owner intervention differs only after fork.

A/B comparison must not secretly:
- rebuild from initial scene;
- re-run history approximately;
- recompute private memory from World truth;
- inject event labels;
- take an extra physics step to "warm up" sensors.

---

# 10. Save/return semantics

First continuity milestone should be **exact paused-state restore**, not simulated offline life.

When the browser tab is closed:
- static GitHub Pages does not run;
- no time should be claimed to have passed in the specimen.

A later "world lived while I was away" feature would require a different execution substrate or an explicit catch-up model and separate scientific validation.

Do not fake it with wall-clock delta.

---

# 11. Candidate MEDIUM-C/R2 experiments

No run active yet.

## C-R2a — currentFrame reconstructibility
At a snapshot point:
- restore World + all other sidecar;
- compare exact continuation with:
  A. serialized currentFrame;
  B. currentFrame recomputed without stepping physics.

Question:
is P0 frame truly reconstructible from restored material state, or is it part of causal temporal state?

## C-R2b — lastActorContact reconstructibility
Same pattern:
- preserve vs recompute current contact;
- determine whether current contact manifold query after restore is sufficient without an extra step.

Important because current contact seam itself is known-invalid for future architecture. Probe only if useful for v0 exactness.

## C-R2c — dynamic binding map
Snapshot after spawning/removing multiple loose bodies.
Restore and verify:
- handle rebinding;
- ordering/role binding;
- future exact continuation.

## C-R2d — fork identity/provenance
Pure architecture:
- parent moment;
- branch A/B;
- event ancestry;
- Owner annotation;
- no actor access to branch metadata.

---

# 12. Current recommendation

Do not implement save/load yet.

The first future implementation candidate should likely be a **developer-only exact moment serializer** after C-R2a/C-R2c, not a polished Owner UI.

Reason:
- medium needs to prove exactness before it turns persistence into a user affordance;
- Field v0 still has MEDIUM-B substrate FAILs;
- snapshot schema must remain occupant-versioned and replaceable.

MEDIUM-C is viable.

It is not ready for productization.


---

# R2c correction — 2026-10-07

The earlier R1 wording that stable Rapier handles are sufficient as a binding key needs a narrower interpretation.

MEDIUM-C/R2c showed:
- **current live handles** rebind exactly across same-version snapshot restore;
- **stale removed handles may alias a newly-created live object** after allocator churn in the tested JS path.

Therefore future binding metadata must use:

`HostBindingId -> current Rapier handle(s)`

with explicit retirement.

Raw handle must not be used as durable event/provenance identity.

HostBindingId is not actor-private object identity and must not enter P0/P1.
