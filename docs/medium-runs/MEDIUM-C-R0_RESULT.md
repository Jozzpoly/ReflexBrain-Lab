# MEDIUM-C/R0 — Exact Physics Snapshot + Process Sidecar Boundary — RESULT — 2026-10-07

Status: **PASS · ARCHITECTURE PROBE CLOSED · NO FEATURE IMPLEMENTATION**

Run PR: #23
CI: `37659904678`
Job: `112924472676`

## Frozen result

Snapshot specimen:
- qualified E01 interaction process;
- snapshot taken at tick **300**;
- process direction at snapshot: **-1**;
- Rapier snapshot payload: **5596 bytes**.

Immediate restore:
- required rigid-body/collider handles rebound successfully;
- restored handles matched original handles;
- restored physical/audit state exactly matched source state.

Continuation:
- source and restored-with-complete-sidecar branches were stepped for **1200 additional ticks**;
- first correct divergence: **none**;
- final state at tick 1500 was exactly equal, including:
  - shuttle pose/velocity;
  - loose-body pose/velocity;
  - process direction;
  - right/left reversal chronology;
  - contact counters;
  - direction-event history.

Negative control:
- same physics bytes;
- same handles;
- same sidecar except causally relevant process `direction` deliberately reset to +1;
- first divergence: **continuation tick 1**;
- later reversal chronology materially differed.

Representative correct final direction events:
- right @243;
- left @494;
- right @736;
- left @978;
- right @1213;
- left @1456.

Wrong-direction fork produced a different chronology, including extra/right event @372 and left @630.

## Defended architecture claim

> For this deterministic runtime and E01 specimen, Rapier World snapshot + explicit non-physics process sidecar is sufficient for exact causal fork continuation.

The negative control demonstrates that a visually/physically restored World is **not** enough when causally active process state exists outside Rapier.

## Medium consequence

Future Chronicle/Fork work should treat a saved moment as a versioned envelope, conceptually:

1. **physics snapshot**
   - Rapier-owned body/collider/solver state;

2. **actor-private state**
   - private clocks;
   - memory/history/hypotheses;
   - controller state that causally affects later action;

3. **World-process sidecars**
   - direction/state of authored or independent processes not owned by physics;

4. **experiment provenance**
   - schema/version;
   - branch/build identity;
   - intervention/event ancestry;
   - any RNG state once stochastic mechanisms exist.

A screenshot or list of body positions is not a fork.

## Important limits

PASS does NOT prove:
- Owner Field Lab can yet be snapshotted;
- current Field v0 has a legitimate stable private-state schema;
- browser persistence/storage;
- cross-version snapshot compatibility;
- snapshots remain valid after package/schema upgrades;
- closed-tab time progression;
- event history is complete;
- save/fork UI should be built now.

Current Field v0 is still under MEDIUM-B integrity pressure and has known R1 FAILs.

## Next MEDIUM-C question

Before implementing persistence, define the **minimal canonical Field/organism sidecar** without serializing incidental UI/debug state.

The state boundary should be derived from causal continuation:

> if removing a field can change future legal World/actor trajectory under identical future inputs, that field belongs to continuation state or must be reconstructible from it.

No save/load feature is activated by this PASS.
