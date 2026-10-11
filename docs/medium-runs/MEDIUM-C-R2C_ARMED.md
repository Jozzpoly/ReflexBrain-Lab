# MEDIUM-C/R2c — Dynamic Binding Map Across Snapshot Restore — 2026-10-07

Status: **ARMED · ARCHITECTURE PROBE · NO SAVE/FORK UI**

Base: 0b2cc9676cc68f1d4361bf3a0f8932eb2b0ea9b8

## Question

After dynamic bodies are created and removed before a snapshot, can a future experiment moment safely rebind the **currently live** physical objects by handle, reject stale removed-object handles, and continue deterministically without relying on collection iteration order?

## Frozen protocol

- create zero-gravity deterministic Rapier world;
- create live dynamic bodies A, B, C with distinct positions;
- advance several ticks;
- record B's rigid-body/collider handles;
- remove B;
- create new dynamic body D;
- apply deterministic distinct impulses to A/C/D and advance 12 ticks;
- capture:
  - physics snapshot;
  - explicit host binding map: A/C/D -> rigid-body + collider handles;
  - stale B handles;
- restore snapshot;
- require all A/C/D handles to rebind to matching immediate physical state;
- require stale B handles not to resolve as B;
- continue source/restored worlds for 300 ticks, applying identical label-addressed forces via the binding map;
- require exact per-label continuation.

## Important identity rule

Host object identity is:

> **versioned host role/binding -> restored physics handle**

not:
- array index;
- iteration order;
- display color;
- previous slot number without generation validity.

## PASS

- A/C/D rebind exactly;
- stale B handles are invalid and do not alias a current live object;
- exact label-addressed continuation for 300 ticks;
- no production source changes.

## FAIL

Valid runtime but stale handle aliases a live object unexpectedly, live binding cannot be restored, or exact continuation fails.

## Maximum claim

Current Rapier handle snapshot semantics are sufficient as the low-level binding key for dynamically created/removed bodies inside one same-version snapshot envelope.

Does NOT prove:
- cross-version handle stability;
- semantic actor object identity;
- World IDs should enter private perception;
- Field save/fork feature readiness.

No UI work authorized.
