# OCTRL-E02b — Composition Robustness / Anti-Fixture

Status: **PROPOSED · ELIGIBLE AFTER E02a PASS · NOT ACTIVE**

Type: **QUALIFICATION / COMPARISON**

Parent campaign:
O-CTRL host/substrate sufficiency.

Required input:
a frozen E02a PASS specimen.

Satisfied by:
- E02a result: `docs/runs/OCTRL-E02A_RESULT.md`
- parent merge SHA: `f74926fdb18d1ee291a7302af69a8d97df390116`

E02b is eligible but must be explicitly ARMED before activation.

---

## One question

> After freezing the E02a composition, does the geometry-driven passage-state effect survive modest held-out initial-condition variation rather than existing only as one tuned fixture?

---

## Why separate from E02a

Existence and robustness can fail independently.

E02a is allowed to tune one specimen until the mechanism exists or is rejected.

E02b begins only **after freeze** and must not feed held-out cases back into E02a tuning.

---

## Frozen before activation

- E01 process law;
- E02a static geometry family;
- blocker physical type;
- passage-clearance measurement;
- pass/fail interpretation.

Exact frozen SHA must be recorded on activation.

---

## Held-out variation candidates

Choose a small predeclared set only after E02a closes, for example:
- modest blocker initial-position offsets;
- modest shuttle initial phase/position offsets;
- modest blocker mass variation if it does not redefine the mechanism.

Do not expand into a parameter sweep benchmark.

---

## PASS scope

The same frozen mechanism continues to produce the intended geometry-driven accessibility change across the predeclared modest variations at a level sufficient to reject the strongest "single fixture coincidence" explanation.

This is still not general ecology robustness.

---

## FAIL

The qualified E02a effect disappears under small plausible variations and requires case-specific retuning.

That would reclassify the composition as fixture-fragile.

---

## Forbidden scope

No new mechanisms, actor systems, sensors, planner, task logic, or E02a retuning after held-out evidence begins.

---

## Owner touchpoint

**none**

---

## Result

Eligible; not run.

**Outcome: unset**
