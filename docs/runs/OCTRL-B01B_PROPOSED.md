# OCTRL-B01b — B0-Scale Passage Calibration

Status: **PROPOSED · NOT ACTIVE**

Type: **PROBE / CALIBRATION**

Parent campaign:
O-CTRL host/substrate sufficiency.

Qualified inputs:
- OCTRL-E01 PASS
- OCTRL-E02a PASS
- OCTRL-E02b PASS
- OCTRL-B01a PASS

---

## One question

> Can the qualified E02 material topology effect be rescaled using only static corridor/doorway geometry so that OPEN/BLOCKED is meaningful for frozen B0 body radius = 1.0, while preserving the same E01 process law and E02 loose-blocker physics?

---

## Why now

E02 was intentionally qualified with researcher clearance radius 0.35.

Frozen B0 body radius is 1.0.

Therefore the existing E02 OPEN state cannot yet be used as a body-scale affordance.

Before inserting an actor, the world geometry must acquire one honest B0-scale interpretation.

---

## Frozen inputs

Do not change:

- E01 shuttle drive law;
- E01 physical end-stop reversal;
- E02 blocker radius = 0.50;
- E02 blocker mass = 1.0;
- E02 blocker damping = 3.0;
- E02 blocker start = (0.00, +0.20);
- B0 research clearance radius = **1.0**;
- deterministic Rapier timestep.

No actor is inserted in B01b.

---

## Manipulated uncertainty

Only **static geometry scale**:

- corridor inner half-height;
- doorway gap half-height;
- positions/sizes of fixed corridor and doorway wall segments.

No dynamic body or controller parameter may change.

---

## Researcher-only audit

Use the same geometry-only passage-clearance logic as E02, but with:

`clearanceRadius = 1.0`

representing frozen B0 disc radius.

The audit is researcher-only and cannot influence physics.

---

## Initial candidate geometry

Start from simple body-scale reasoning:

- corridor inner half-height ~= 1.60
- doorway gap half-height ~= 1.20
- doorway wall half-thickness x = 0.12

This gives a B0 center clearance band around the doorway while retaining static constriction.

These are starting values, not frozen qualification values.

B01b is an existence/calibration probe and may tune static geometry inside the allowed scope.

---

## Evidence

Need one deterministic configuration where:

1. initial passage is **BLOCKED** for clearance radius 1.0;
2. frozen E01 process physically contacts the unchanged E02 blocker;
3. passage becomes **OPEN** for clearance radius 1.0;
4. shuttle/blocker later separate;
5. passage remains OPEN for >=60 continuous post-contact no-contact ticks;
6. matched disabled-process control remains BLOCKED;
7. deterministic repeat passes.

---

## PASS scope

Allowed claim:

> one static geometry scaling exists in which the already-qualified material topology mechanism has a meaningful B0-sized OPEN/BLOCKED interpretation without changing E01 process law or E02 blocker physics.

This is a calibration/existence claim only.

---

## FAIL

FAIL if body-scale topology requires changing:
- shuttle/process law;
- blocker dynamics;
- semantic gate state;
- actor behavior;
- another active mechanism.

---

## INCONCLUSIVE

INCONCLUSIVE if the researcher audit cannot distinguish B0-scale accessibility without embedding pathfinding/actor behavior into the measurement.

---

## Forbidden scope

Do not add:

- actual B0 actor;
- B1;
- navigation;
- P0/P1;
- memory;
- concern;
- Local Brain;
- robustness sweep;
- new ecology mechanism.

---

## Owner touchpoint

none

---

## Next pressure if PASS

A separate run must insert the **actual frozen B0 body** and test real physical traversal/control in BLOCKED vs OPEN states.

Do not promote the research clearance audit itself into actor affordance truth.

---

## Result

Not run.

**Outcome: unset**
