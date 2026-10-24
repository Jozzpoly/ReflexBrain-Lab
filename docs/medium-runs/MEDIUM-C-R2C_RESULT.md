# MEDIUM-C/R2c — Dynamic Binding Map Across Snapshot Restore — RESULT — 2026-10-07

Status: **FAIL · EXECUTION VALID · RUN CLOSED**

PR: #27
CI: `37661374267`
Job: `112929464793`

## Frozen question

Can live dynamically-created bodies be rebound across snapshot restore by raw Rapier handle **while stale removed-body handles remain safely invalid/non-aliasing**?

## Outcome

**FAIL.**

The live-binding half worked perfectly.

The stale-handle safety half was falsified.

---

# 1. Live bindings survived exactly

At snapshot time the explicit host binding map was:

- A -> rb/co handle `0`;
- C -> rb/co handle `1e-323`;
- D -> rb/co handle `2.1219957915e-314`.

Snapshot payload:
- **3208 bytes**.

After restore:
- A/C/D all rebound successfully from their current recorded handles;
- immediate per-label physical state matched exactly;
- source/restored branches received identical label-addressed forces for **300 ticks**;
- first continuation divergence: **none**;
- final A/C/D pose/velocity state matched exactly.

Thus an **explicit map of current live host bindings -> current physics handles** is viable inside one same-version snapshot moment.

---

# 2. Stale B handle aliased a new live body

B was created, its handles recorded, then B was removed.

Recorded stale B handles:
- rigid body: `5e-324`;
- collider: `5e-324`.

D was then created.

D's reported current handles:
- rigid body: `2.1219957915e-314`;
- collider: `2.1219957915e-314`.

The numeric handles are not equal.

However, querying the World with B's stale raw handle after D allocation returned a live object whose reported handle was D's current handle:

- stale B rb lookup -> live rb handle `2.1219957915e-314`;
- stale B collider lookup -> live collider handle `2.1219957915e-314`.

The same aliasing behavior persisted after snapshot restore.

Therefore the precommitted condition:

> stale removed-object raw handle must not resolve as a current live object

is false in the tested JS runtime/API path.

No threshold or expectation was changed after evidence.

---

# 3. Architectural consequence

Raw Rapier handles are suitable here as:

> **current low-level binding coordinates inside one exact live snapshot envelope**

but NOT as:

> **durable host identity across object removal/reallocation history**.

A future Chronicle/Fork system needs a host-owned binding identity that is separate from:
- actor-private object identity;
- Rapier raw handle;
- array index;
- display identity.

Conceptually:

```
HostBindingId -> current Rapier handle(s)
```

When a body is removed:
- its HostBindingId becomes retired;
- a newly-created body receives a new HostBindingId;
- provenance may retain the retired binding record;
- stale Rapier handles must never be used to resolve historical identity.

This host identity is **research/runtime plumbing** only.

It must not leak into P0/P1 or become actor knowledge.

---

# 4. Important distinction

This FAIL does NOT invalidate MEDIUM-C/R0.

R0 asked:
- can current live handles from one snapshot be rebound after exact restore?

Answer remains **yes**.

R2c asked a stronger question:
- can a raw handle remain a safe durable identity across remove/recreate churn?

Answer is **no under the tested runtime path**.

Both facts must be preserved.

---

# 5. Why this matters for Owner medium

Without this distinction, a future event history could silently say:

> "the object you interacted with earlier"

while resolving the stored raw handle to an entirely different body created later.

That would corrupt:
- fork ancestry;
- event provenance;
- Owner annotations;
- A/B comparisons;
- later debugging.

The medium must solve host provenance identity before exposing save/fork as trustworthy.

---

# 6. Next continuity pressure

Do not patch Rapier or wrap handles blindly.

Next design/probe should define a minimal **HostBindingId lifecycle**:
- monotonic/versioned host identifier;
- current physics-handle mapping;
- explicit retirement;
- snapshot serialization;
- fork inheritance;
- no actor access.

Then test:
- create/remove/recreate;
- snapshot/restore;
- event provenance across fork;
- no stale alias.

No Owner-facing save/fork feature is authorized yet.
