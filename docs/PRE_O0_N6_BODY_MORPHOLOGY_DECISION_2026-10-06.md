# Pre-O0 N6 — First Body Morphology Decision — 2026-10-06

Status: **V1 CONVERGENCE DECISION · B1 PRIMARY, B0 CONTROL · CONTROLLER SEAM PRESERVED**

Context:
- M0 Dynamic Mechanical Yard selected;
- T0-D marked-body ↔ physical-dock control concern selected;
- E0 controller/body-null remains qualified donor.

---

# Decision

Use:

## B1 — minimal asymmetric oriented rigid body
as the **primary first-organism morphology**;

and retain:

## B0 — E0 symmetric disc
as a **mandatory comparison/control morphology**.

Both should use the same initial actuation concept:

- bounded forward/back force along heading;
- bounded turn torque;
- physical damping;
- rigid-body contact.

Do not tune separate "smart" controllers for B0 and B1 before comparison.

---

# Why B1 primary is now justified

## 1. Orientation already matters to E0 actuation

E0 applies drive along heading.

The disc therefore has:
- oriented motor demand;
- orientation-neutral contact geometry.

B1 makes the same heading materially relevant to:
- collision envelope;
- passage alignment;
- pushing contact;
- turning clearance.

This closes an artificial mismatch.

## 2. T0-D requires physical pushing

Restoring a dynamic body to a dock should expose:
- approach angle;
- front/side contact;
- alignment;
- pushing stability.

A disc suppresses much of this structure.

## 3. M0 contains chokepoints/topology

An asymmetric body creates body-scaled relations:
- fits while aligned;
- clips/stalls while angled;
- rotation matters before passage.

These are natural affordance pressures.

## 4. B0 remains essential evidence

If B1 looks "smarter" only because:
- it passively aligns;
- snags;
- funnels objects;
- creates more dramatic motion;

B0 comparison will expose some of that.

Claim should remain:
morphology changes coupled dynamics/control requirements,
not "B1 is more intelligent".

---

# Minimal B1 requirements

Do not freeze exact dimensions yet.

Qualitative requirements:

- one-piece rigid body;
- clear front/back orientation;
- length > width enough to affect passage/contact;
- rounded collision geometry to reduce pathological snagging;
- no articulation;
- no suspension/compliance system;
- no hidden directional collision exceptions.

Candidate:
short capsule or rounded rectangle.

Avoid sharp polygon corners as first specimen.

---

# Mass/inertia comparison discipline

B0 and B1 cannot have identical geometry/inertia simultaneously.

For comparison:

- keep total mass matched where practical;
- document moment-of-inertia difference rather than hiding it;
- keep controller demand limits initially shared;
- report if different inertia alone changes turn feel materially.

Do not normalize away all physical consequences of morphology.

The point is to observe them.

---

# Required body A/B probes

## BQ1 — open locomotion

Larger open M0 area.

Question:
does B1 preserve coherent movement without pathological oscillation/snags?

## BQ2 — passage alignment

Several passage widths.

Question:
does orientation create legible body-scaled access?

## BQ3 — marked-body push

Same target/body relation.

Compare:
- approach;
- contact;
- pushing stability;
- accidental side slip.

## BQ4 — obstruction recovery

Body partially enters/contacts blocked passage.

Question:
does Local Brain failure differ because of morphology?

## BQ5 — external shove

Same impulse directions relative to heading.

Question:
does asymmetric morphology produce useful contact/proprioceptive distinctions?

## BQ6 — same controller

No policy/controller specialization between B0/B1 for the initial A/B.

If B1 requires major custom logic before it functions at all, morphology may be premature.

---

# Promotion / rejection rule

B1 earns primary status only if:

- it remains mechanically stable;
- it creates useful orientation/body-scaled distinctions;
- those distinctions are legible in organism behavior;
- control complexity does not explode.

If B1 mainly adds:
- snagging;
- contact instability;
- controller tuning burden;

fall back to B0 for O-CTRL and revisit morphology later.

---

# Current scope

No:
- fatigue;
- shared drive/turn resource;
- articulation;
- carried-envelope change;
- damage;
- body learning;

as part of this decision.

Those remain separate pressures.

## Implementation remains paused

This decision only reduces V1 uncertainty.
