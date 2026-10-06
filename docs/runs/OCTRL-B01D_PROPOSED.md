# OCTRL-B01d — Actor-Relative Resistance Signature

Status: **PROPOSED · NOT ACTIVE**

Type: **QUALIFICATION / COMPARISON**

Parent campaign:
O-CTRL host/substrate sufficiency.

Qualified / canonical inputs:
- B01a frozen reusable B0 body seam
- B01b body-scale geometry
- B01c scientific FAIL showing binary geometric BLOCKED != B0 passage impossibility

---

## One question

> Under the same frozen B0 body and the same fixed motor protocol, does placing the same movable blocker in the doorway produce a stable actor-relative effectivity signature — later crossing and more physical contact — across modest held-out blocker positions?

This does **not** ask whether the passage is impossible.

---

## Why now

B01c falsified binary world-side access as actor-effectivity truth.

But B01c also observed a strong quantitative difference:

OPEN vs doorway blocker:
- crossing tick: 122 vs 161
- contact ticks: 53 vs 228

That suggests a candidate graded effectivity distinction.

B01d tests whether that ordering survives positions not previously tested with the actor.

---

## Frozen actor/protocol

Use unchanged B0 seam:

- radius = 1.0
- mass = 1.0
- frozen damping / FMAX / TMAX
- start = (-3.20, 0.00)
- heading = +X
- drive = +1
- turn = 0
- tick budget = 360
- crossing threshold x > 1.25

No planner.
No perception.
No geometry query.
No fixture label to actor.

---

## OPEN reference

Use the same B01c OPEN fixture:
the blocker begins at the qualified B01b open-side material position.

This is the single reference trajectory.

Expected B01c regression:
- crossing tick ~= 122
- contact ticks ~= 53

Exact regression must remain deterministic.

---

## Doorway-position held-out set

B01c already observed only:
- B0 doorway baseline: (0.00,+0.20)

B01d held-out actor cases are predeclared as:

- H1 = (0.00,+0.10)
- H2 = (0.00,+0.30)
- H3 = (0.00,-0.20)
- H4 = (-0.10,+0.20)
- H5 = (+0.10,+0.20)

These positions existed in prior world-side qualification, but were **not tested with actual B0 effectivity**.

Do not replace cases after activation.

---

## Frozen material physics

Do not change:

- blocker radius/mass/damping;
- B01b corridor/doorway geometry;
- B0 body/controller;
- timestep.

The blocker remains dynamic.

---

## Predeclared PASS rule

First:
- OPEN reference must cross deterministically.

For **all five H1-H5**:

1. deterministic repeat passes;
2. actor reaches the same crossing threshold, or remains uncrossed within the fixed budget;
3. effective crossing latency is **strictly greater** than OPEN reference:
   - if case crosses: `crossTick > openCrossTick`;
   - if no crossing: treat as stronger latency (`Infinity`);
4. actor/blocker physical contact ticks are **strictly greater** than OPEN reference contact ticks.

B01d PASS requires all H1-H5 to satisfy both ordering relations.

No arbitrary effect-size threshold is introduced.

---

## PASS scope

If all held-out cases pass:

> for this frozen B0 body and fixed motor protocol, doorway occupancy by the movable blocker produces a stable local effectivity/resistance signature across the declared blocker-position neighborhood: later progress to the same crossing threshold and more physical contact than the OPEN reference.

Do not call this:
- effort;
- reward;
- difficulty scalar;
- semantic affordance.

---

## FAIL

If any held-out position does not preserve the two orderings, the proposed local resistance signature is not stable across the declared neighborhood.

Do not retune the body, blocker, geometry or protocol inside B01d.

---

## INCONCLUSIVE

Only if deterministic execution or crossing/contact instrumentation breaks.

---

## Forbidden scope

No:
- heavier/static blocker;
- changed FMAX;
- doorway tuning;
- steering/recovery;
- B1;
- P0/P1;
- memory;
- Local Brain;
- learned scalar;
- semantic OPEN/BLOCKED input.

---

## Owner touchpoint

none

---

## North-Star relevance

This run probes a key distinction:

> actor-relative meaning may arise from **how material facts change the consequences of action**, not from world-side symbolic labels.

A stable resistance signature would be a candidate future input pressure for ReflexBrain, not a hand-authored semantic label.

---

## Result

Not run.

**Outcome: unset**
