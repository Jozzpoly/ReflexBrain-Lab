# Pre-O0 N8 — Minimal C-A Continuation Scope for O-CTRL — 2026-10-06

Status: **V1 CONVERGENCE DECISION · EXPLICIT DIAGNOSTIC BASELINE, NOT FINAL LOCAL BRAIN**

Context:
- M0 Dynamic Mechanical Yard;
- T0-D marked-body ↔ dock concern;
- P1 temporary tracklets;
- B1 primary / B0 control.

## Core decision

Use one persistent **concern process** plus a small set of generic closed-loop local controllers.

Do not pretend explicit controller state is forbidden.

The boundary is:

> controller state may organize action across time, but every transition and output must be causally supported by actor-private evidence/history rather than hidden scene truth or authored scenario phase.

---

# 1. Persistent concern process

The T0-D concern persists independently of current local controller.

Actor-private concern state may contain only:

- private target hypothesis/binding;
- private dock/landmark hypothesis/binding;
- latest privately supported relation belief;
- evidence/provenance timestamps;
- uncertainty/unknown state represented minimally;
- current active local controller reference;
- unresolved contradiction/failure evidence.

No:
- World IDs;
- true target/dock coordinates;
- live satisfaction bit;
- scene ID;
- precomputed route;
- global urgency score.

## Relation belief

At minimum:

- **supported-satisfied** — current/recent legal evidence supports desired relation;
- **supported-unsatisfied** — legal evidence supports violation;
- **unknown** — current private state cannot support either.

This is a private epistemic classification, not World truth.

Do not update it merely because the World changed unseen.

---

# 2. Local controller A — CHECK / OBSERVE

Purpose:

Obtain evidence about the concern relation when private support is stale/unknown.

May:
- orient body;
- approach a privately remembered relation/landmark;
- expose occluded area;
- scan local free directions.

Consumes:
- private memory;
- current P0/P1 evidence;
- actor-private odometry/localization scaffold.

Produces:
- motor demand only.

Termination evidence:
- target/dock percept acquired;
- expected relation checked and contradicted;
- local search exhausted enough to escalate to REACQUIRE;
- physical progress failure.

No hidden "check complete" flag from World.

---

# 3. Local controller B — REACQUIRE

Purpose:

Find a concern-bound percept/hypothesis after checked absence or lost evidence.

This is **not** a global search planner.

First O-CTRL scaffold may use generic local coverage behavior:

- search around last-known relation first;
- rotate/scan to expose occluded local space;
- expand through actor-known reachable local passages;
- prefer least-recently observed nearby accessible direction;
- use local obstacle/contact evidence.

No scene-specific route table.

No World target coordinate.

## Bound on first specimen

O-CTRL need not solve arbitrary lost-object search.

The M0/scene family should keep relocation within a bounded micro-world where generic local reacquisition is possible.

If reacquisition requires a full planner, substrate scope is wrong.

---

# 4. Local controller C — RESTORE RELATION

Purpose:

When current private evidence supports:
- target percept/hypothesis;
- dock/landmark relation;
- desired relation currently violated;

physically restore the marked body toward the dock.

No semantic `push(target)` action.

Mechanism:

1. derive local desired contact geometry from current/remembered target-dock relation;
2. move actor toward an approach pose using local body controller;
3. make physical contact;
4. emit body motor demand that tends to move target toward dock;
5. continually re-evaluate actual percept/contact consequence.

Important:

This is an actual closed-loop controller.

If target does not move as expected:
- accumulated contradiction/progress evidence changes controller state;
- do not teleport object;
- do not declare success from intended action.

---

# 5. Local controller D — RECOVER

Purpose:

Handle temporary/persistent local failure without resetting concern.

Inputs:
- repeated demand with low achieved motion;
- contact;
- target relation not progressing;
- local obstacle evidence;
- prediction mismatch if available.

Possible bounded actions:
- back off;
- reorient;
- change contact side/approach angle;
- make a short local detour;
- return control to CHECK/RESTORE with updated evidence.

No hidden alternate route.

No scene-specific "if wall 2 blocked, go left".

## Persistence boundary

RECOVER must have:
- evidence accumulation before activation;
- bounded attempts;
- ability to yield/abandon current local approach.

This is specifically designed against:
- L0 thrash;
- sticky stupidity.

---

# 6. QUIESCENT concern state

If private evidence strongly supports the desired relation:

Concern need not emit continuous task motion.

The actor may:
- remain locally idle;
- execute ordinary non-concern movement if a later developmental system exists;
- periodically check through an explicitly scoped evidence-freshness policy;
- react when new legal evidence contradicts the relation.

For O-CTRL, do not add a rich idle/exploration system merely to look alive.

This is important:

> O-CTRL is a substrate-control agent, not the final self-directed organism.

Its watchability is not the main promotion criterion.

---

# 7. Actor-private localization scaffold

O-CTRL needs enough spatial continuity to make CHECK/REACQUIRE meaningful without turning into SLAM research.

Allowed V1 scaffold:

- actor-private local coordinate frame initialized at run start;
- updated from **actual proprioceptively available body displacement/orientation**, including externally caused body motion;
- does not read hidden object positions;
- local observed landmarks/track relations may be stored in that frame.

This is intentionally idealized odometry.

It is not:
- World position oracle for objects;
- global scene graph;
- pathfinding truth.

Why acceptable:
the ReflexBrain question is not localization.

Later body/sensor-model research can perturb this scaffold if needed.

---

# 8. Navigation helper boundary

A minimal local navigation helper may convert:

`private local target relation + currently known local geometry`

into:
- desired heading/turn;
- forward demand;
- short local detour.

Forbidden:
- hidden navmesh;
- A* over World collision truth;
- full unseen scene map;
- scene-specific waypoints.

If ordinary navigation becomes the dominant research burden:
use a bounded donor/scaffold, but keep its knowledge actor-private.

---

# 9. No phase-script guarantee

The following is forbidden:

```
phase = GO_TARGET
if arrived: phase = PUSH
if pushed: phase = GO_HOME
if done: phase = WAIT
```

as the authoritative causal story.

Allowed:

```
concern private evidence
  -> active local controller
  -> physical action
  -> new private evidence
  -> controller continues / contradicts / yields
```

Debug UI may label the currently active controller.

Removing the labels must not alter behavior.

---

# 10. Controller selection

O-CTRL can use explicit evidence-driven selection logic.

Priority is not a semantic score.

Example qualitative relation:

1. immediate body safety/local collision competence;
2. active controller continues while evidence supports it;
3. contradiction can invoke RECOVER/CHECK;
4. concern relation currently violated can support RESTORE;
5. unknown concern evidence can support CHECK/REACQUIRE;
6. supported satisfaction permits quiescence.

This is a transparent baseline, not final arbitration architecture.

No global `importance` or `urgency` scalar.

---

# 11. History dependence

Required:

Two runs may have the same current P0/P1 percept but different:

- last-known target relation;
- checked-absence history;
- recent failed approach/contact;
- current active controller causal state.

Behavior may then legitimately differ.

This is intentional private-history competence.

Do not call it learning.

---

# 12. First-divergence visibility

Microscope must be able to trace:

private evidence/history
-> concern/controller state
-> motor demand
-> body/contact outcome.

If behavior changes after hidden World event **before** private evidence diverges, O-CTRL FAILs epistemic boundary.

---

# 13. Current decision

Promote this small C-A process set as the **first diagnostic Local Brain baseline for O-CTRL**.

It is deliberately authored and explicit.

Allowed claim:

> private causal evidence can sustain and reorganize one persistent physical concern through real body/world dynamics.

Not allowed:
- general intelligence;
- endogenous motivation;
- learned planning;
- final Local Brain architecture.

## Remaining pre-contract task

Define decisive O-CTRL falsifiers and promotion/exit criteria.

Implementation remains paused.
