# OCTRL-E02b — Composition Robustness / Anti-Fixture

Status: **CLOSED · PASS · RESULT PERSISTED**

Type: **QUALIFICATION / COMPARISON**

Parent campaign:
O-CTRL host/substrate sufficiency.

Required input:
a frozen E02a PASS specimen.

Satisfied by:
- E02a result: `docs/runs/OCTRL-E02A_RESULT.md`
- parent merge SHA: `f74926fdb18d1ee291a7302af69a8d97df390116`

E02b is ACTIVE.

Base SHA:
`38eab07948a272ff865e6bc67fe151400bed3c0a`

Held-out set H1-H5 and all PASS thresholds were frozen on the parent branch **before this run branch was created**.

No case replacement, threshold relaxation or E02a retuning is permitted from this point onward.

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

## Predeclared held-out variation set

E02b tests **only initial blocker position**.

Frozen E02a baseline:
- `B0: x=0.00, y=+0.20`

B0 is a regression sanity check only and does **not** count as held-out evidence.

Held-out cases:

- `H1: x=0.00, y=+0.10`
- `H2: x=0.00, y=+0.30`
- `H3: x=0.00, y=-0.20` — unseen mirror of the tuned asymmetry
- `H4: x=-0.10, y=+0.20`
- `H5: x=+0.10, y=+0.20`

These cases are predeclared before any E02b result is observed.

Do not add, remove or replace held-out cases after activation.

No mass, friction, doorway-geometry or shuttle-phase variation belongs to E02b.

---

## PASS rule

First, frozen baseline B0 must still pass unchanged.

Then **all five held-out cases H1-H5 must pass the exact E02a corrected qualification contract**:

- initial passage BLOCKED;
- real shuttle/blocker contact occurs;
- passage becomes OPEN;
- at least 60 continuous post-contact no-contact ticks are achieved;
- passage remains OPEN at that persistence sample;
- blocker displacement at persistence remains >= 0.9;
- deterministic repeat passes.

Any held-out case failing any of these conditions makes **E02b FAIL**.

Do not weaken the threshold after seeing results.

## PASS scope

If B0 + H1-H5 all pass:

> the frozen E02a composition is not restricted to its single tuned blocker position; it survives the declared modest local initial-position neighborhood and one mirrored asymmetry.

This remains narrow local anti-fixture evidence, not general ecology robustness.

---

## FAIL

If any H1-H5 case fails the frozen contract:

> the E02a composition is **fixture-fragile within the declared held-out initial-position set**.

No retuning is allowed inside E02b.

A later run may investigate the failure if strategically justified.

---

## Forbidden scope

No:
- E02a retuning after held-out evidence begins;
- new mechanisms;
- actor systems;
- sensors;
- planner/task logic;
- mass/friction variation;
- doorway redesign;
- shuttle start/phase variation;
- threshold changes;
- adding replacement held-out cases after observing failures.

---

## Owner touchpoint

**none**

---

## Result

**Outcome: PASS**

Result artifact:

`docs/runs/OCTRL-E02B_RESULT.md`

Frozen baseline B0 and all five predeclared held-out cases H1-H5 passed the unchanged corrected E02a contract in CI and browser runtime.

No E02a retuning occurred after held-out qualification began.

Note:
successful cases report exactly 60 post-contact no-contact ticks because the harness terminates at the first satisfied persistence threshold. This does not measure additional temporal margin.
