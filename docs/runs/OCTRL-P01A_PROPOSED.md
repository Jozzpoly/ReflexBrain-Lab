# OCTRL-P01a — Private Proprioceptive Effectivity Exposure

Status: **CLOSED · SCIENTIFIC FAIL · EXECUTION VALID · RESULT PERSISTED**

Type: **PROBE / AUTHORITY-BOUNDARY**

Parent campaign:
O-CTRL host/substrate sufficiency.

Qualified inputs:
- B01a frozen reusable B0 body seam;
- B01b static geometry family;
- B01d frozen OPEN + H1-H5 material cases and fixed motor protocol.

---

## One question

> Does the B01d-qualified actor-relative effectivity difference appear in a legal actor-private proprioceptive stream, without exposing external-object identity, global World coordinates or semantic OPEN/BLOCKED state?

This is the bridge from researcher-observed consequence to actor-experienced body consequence.

It does **not** add memory, interpretation or behavior change.

---

## Why now

B01d qualified the effect using researcher-side measurements:
- global crossing threshold;
- actor↔blocker pair contact.

Those measurements are not actor-private experience.

Before building external-object perception, tracklets or memory, test whether the body-level consequence is already present in the legal self/proprioceptive channel.

A separate attempted integration idea was rejected before activation:
the frozen B01c/B01d actor start `(-3.20,0)` overlaps the frozen E01 shuttle start `(-3.60,0)` because center distance is 0.40 while radii sum to 1.55.

Do not silently "compose" those fixtures by changing starts ad hoc.

---

## Frozen physical cases

Use unchanged B01d protocol:

- B0 radius/mass/damping/FMAX/TMAX unchanged;
- actor start = `(-3.20,0.00)`;
- heading = +X;
- drive = +1;
- turn = 0;
- 360 tick budget;
- same B01b static geometry;
- same blocker physics;
- same OPEN material reference;
- same H1-H5 blocker starts.

The E01 shuttle remains removed exactly as in B01d.
P01a is **not** the world/body integration pulse.

---

## New authority seam: P0-self only

Add only a synthetic actor-private proprioceptive sensor boundary.

Per tick it may export:

- issued motor demand `drive, turn`;
- body-local translational delta from previous pose:
  - `forwardDelta`
  - `lateralDelta`
- body-local orientation delta `turnDelta`;
- cumulative private odometry from those deltas.

Research code may derive the delta from physics body pose at the sensor boundary, as explicitly allowed by the frozen O-CTRL contract.

The private sample must not export:

- actor World x/y;
- blocker World x/y;
- collider/entity handles;
- blocker identity;
- OPEN/BLOCKED;
- crossing truth;
- actor↔blocker contact identity;
- external-object position/kind.

Microscope may retain those facts separately for qualification only.

---

## Frozen private-evidence audit

The actor does not consume the trace yet.
The trace is research evidence that the legal private channel contains the body consequence.

For every H1-H5 pair against OPEN:

1. deterministic replay of the private trace must pass;
2. motor demand sequence must be identical;
3. microscope must observe a real actor↔blocker contact in H;
4. private proprioceptive trace must **not diverge before** the first physical H actor↔blocker contact;
5. first private divergence must occur no later than one tick after that first contact;
6. at frozen tick **122** (the already-qualified B01d OPEN crossing tick), H cumulative private forward odometry must be strictly less than OPEN cumulative private forward odometry.

No P01a threshold may be tuned after observing results.

Tick 122 is inherited from B01d before P01a activation; it is not selected from P01a traces.

---

## PASS scope

If all cases pass:

> the B01d material effectivity difference has a deterministic body-level signature in legal actor-private proprioceptive history; external-object identity and World-side OPEN/BLOCKED truth are not required for the actor to physically experience the consequence.

This does **not** mean the actor understands the cause.

---

## FAIL

FAIL if the frozen B01d effect does not survive into the declared legal private channel in at least one held-out case.

Do not rescue by adding:
- blocker identity;
- semantic contact labels;
- World coordinates;
- external-object perception;
- memory;
- a resistance score.

---

## INCONCLUSIVE

Use only if:
- deterministic execution breaks;
- the sensor boundary itself is contaminated;
- instrumentation cannot establish first divergence/contact ordering.

---

## Forbidden scope

No:
- P0 external visible blobs;
- P1 tracklets;
- private target/dock binding;
- memory;
- concern;
- controller adaptation;
- learned representation;
- resistance/difficulty scalar;
- E01 shuttle reintegration;
- B1.

---

## Owner touchpoint

**none**

---

## North-Star relevance

P01a asks whether the material relation discovered by B01c/B01d reaches the actor through a legal private channel.

If it passes, the next problem can become temporal private history / interpretation rather than inventing meaning from World labels.

If it fails, external perception or a different body signal may be necessary before actor-relative semantic pressure is plausible.

---

## Activation

Base SHA:
`9a67b1178861fe93e65b681227823254aa007ed5`

Run branch:
`run/octrl-p01a-private-proprioceptive-effectivity`

The B01d physical cases, P0-self schema and qualification criteria above were frozen before implementation evidence.

No sensor broadening, World-coordinate exposure, object identity or threshold tuning is permitted after this point.

---

## Result

**Outcome: FAIL**

Result artifact:

`docs/runs/OCTRL-P01A_RESULT.md`

Execution validity passed, but H2 falsified the frozen immediate-timing criterion:
- first actor↔blocker contact tick = 58
- required private divergence <= 59
- observed first private divergence tick = 60

No threshold or sensor scope was changed after evidence.
