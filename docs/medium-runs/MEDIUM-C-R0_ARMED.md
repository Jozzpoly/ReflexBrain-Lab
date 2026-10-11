# MEDIUM-C/R0 — Exact Physics Snapshot + Process Sidecar Boundary — 2026-10-07

Status: **ARMED · ARCHITECTURE PROBE · NO SAVE/LOAD FEATURE**

Base: 7b7e1cd89e90999d777b99be08006a5240639e07
Branch: medium/continuity-snapshot-r0

## Question

Can the current deterministic Rapier substrate be snapshotted and forked so that:

1. the restored physics World is immediately identical;
2. rigid-body/collider identity can be re-bound by restored handles;
3. continuation remains exactly deterministic when the non-physics process state is restored explicitly;
4. continuation diverges when a causally relevant process field is omitted/reset?

This does NOT attempt to serialize Owner Field Lab yet.

## Why E01 is the probe specimen

Use the already-qualified E01 mechanical process because its causal state is small and explicit:
- Rapier World;
- shuttle / loose body / physical end stops;
- JS-side direction;
- previous end-contact edge state;
- tick + audit counters / direction-event provenance.

This lets us determine the snapshot boundary without mixing in the currently broken Field v0 integration.

## Frozen protocol

- create E01 interaction scenario (withLoose=true);
- run to tick **300** (after the known first right reversal, before long continuation);
- record:
  - Rapier World.takeSnapshot();
  - all rigid-body/collider handles needed to reconstruct the E01 wrappers;
  - a full JS sidecar containing all E01State fields outside Rapier ownership;
- restore a new World with World.restoreSnapshot();
- rebind wrappers via getRigidBody(handle) / getCollider(handle);
- require immediate exact physical snapshot equality;
- continue original and restored-with-sidecar for **1200 further ticks** using unchanged stepE01Scenario;
- require exact equality of physical/audit state and direction-event chronology;
- separately restore a second copy but deliberately reset the causally relevant direction field to +1;
- require that this negative-control fork diverges from the correctly restored branch after continuation.

## PASS

All of:
- snapshot bytes non-empty;
- all required handles rebind;
- restored physics immediately equals source physics;
- exact sidecar + restored World continues deterministically for 1200 ticks;
- negative-control missing/wrong direction diverges;
- no production/Field source modified.

## FAIL

Valid API execution but any required identity/continuation property above is false.

## INCONCLUSIVE

Version/API mismatch, test harness cannot legally reconstruct wrappers, or snapshot restoration throws before the architecture question can be evaluated.

## Maximum claim

At most:

> Rapier physics snapshot + explicit external process sidecar is sufficient for exact E01 branching under this deterministic runtime.

It does NOT prove:
- Owner Field Lab save/load;
- browser-storage persistence;
- cross-version snapshot portability;
- long-term compatibility;
- private actor-state completeness;
- event-log schema;
- closed-tab world continuation.

No feature implementation is authorized by PASS.
