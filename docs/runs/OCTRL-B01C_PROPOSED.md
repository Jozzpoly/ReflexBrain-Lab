# OCTRL-B01c — Actual B0 Passage Effectivity Falsifier

Status: **CLOSED · SCIENTIFIC FAIL · EXECUTION VALID · RESULT PERSISTED**

Type: **COMPARISON / FALSIFIER**

Parent campaign:
O-CTRL host/substrate sufficiency.

Qualified inputs:
- B01a frozen reusable B0 body seam
- B01b body-scale static geometry

---

## One question

> Does the researcher-only B01b geometry label OPEN/BLOCKED correctly predict the outcome of the same minimal fixed motor protocol for the actual frozen B0 rigid body?

This is deliberately a falsifier of the researcher clearance abstraction.

---

## Why now

B01b only proved geometric clearance for a passive disc envelope.

But the actual B0 body:
- has dynamics;
- applies force;
- can collide with and potentially move the loose blocker.

Therefore static clearance may not equal actor effectivity.

That distinction matters directly to future actor-relative meaning.

---

## Frozen body

Use `src/e0-body-seam.ts` unchanged:

- radius = 1.0
- mass = 1.0
- same damping
- same FMAX/TMAX
- same collider friction/restitution

No body retuning.

---

## Frozen world geometry

Use B01b static geometry unchanged:

- corridor inner half-height = 1.60
- doorway gap half-height = 1.20
- fixed wall half-thickness = 0.12

No geometry tuning.

---

## Two material initial states

### OPEN fixture

Same B01b corridor/doorway.

Loose blocker begins outside the doorway in a previously observed physically valid open-side location, stationary.

No shuttle is required for this run.

### BLOCKED fixture

Same corridor/doorway.

Same loose blocker begins at the B01b blocked location:
`(0.00,+0.20)`

stationary.

The blocker remains a real dynamic body.

Do **not** freeze or semantic-lock it.

---

## Fixed motor protocol

In both cases:

- actual B0 body starts at the same left-side pose;
- heading = +X;
- drive demand = +1;
- turn demand = 0;
- no planner;
- no collision query;
- no passage label;
- no steering correction;
- same fixed tick budget.

The body receives no OPEN/BLOCKED state.

---

## Evidence

Researcher records:

- actor x/y over time;
- doorway crossing tick if any;
- actor/blocker contact;
- blocker displacement;
- actor final position;
- whether body physically crosses to the right side.

---

## Predeclared interpretation

### PASS

The static clearance abstraction predicts the fixed-protocol outcome:

- OPEN: B0 physically crosses the doorway;
- BLOCKED: B0 does **not** cross within the fixed protocol.

Allowed claim:

> for this body and fixed protocol, the B01b geometric OPEN/BLOCKED label predicts actual passage effectivity.

### FAIL

Any mismatch, especially:

- B0 pushes the BLOCKED loose body and crosses;
- B0 fails to cross OPEN despite geometric clearance.

A FAIL is scientifically important.

Do not fix it inside B01c.

### INCONCLUSIVE

Only if:
- fixed protocol itself is invalid/unstable before reaching the passage;
- instrumentation cannot distinguish crossing.

---

## Forbidden scope

Do not:
- change blocker mass/radius;
- change B0 force/damping;
- change doorway size;
- add steering;
- add recovery;
- add P0/P1;
- add semantic access state to actor;
- make blocker static;
- add navigation/pathfinding.

---

## Owner touchpoint

none

---

## North-Star relevance

This run directly tests whether a world-side geometric category can stand in for **actor-relative effectivity**.

If it fails because the actor can materially change the obstacle, that is not noise:

> what is blocked geometrically may still be possible for this actor through action.

That distinction is potentially central to ReflexBrain/SPC semantics.

---

## Result

**Outcome: FAIL**

Execution was deterministic and valid.

Result artifact:

`docs/runs/OCTRL-B01C_RESULT.md`

OPEN crossed at tick 122.

Researcher-labelled BLOCKED also crossed at tick 161 because actual B0 physically pushed the loose blocker.

Therefore static geometric BLOCKED did not predict actual actor effectivity.
