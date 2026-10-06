# OCTRL-B01a — E0 Body Seam Extraction / Parity

Status: **PROPOSED · NOT ACTIVE**

Type: **PROBE / EXTRACTION**

Parent campaign:
O-CTRL host/substrate sufficiency.

Qualified donor:
frozen E0.0 authoritative body probe.

---

## One question

> Can the qualified E0/B0 body-actuation seam be extracted from the monolithic browser probe into a reusable module without materially changing its qualified mechanical behavior?

---

## Why now

The next integration pressure is body + ecology.

But current qualified E0 mechanics live inside a monolithic HTML probe, while E02 ecology is modular.

Integrating them directly would mix:
- body extraction;
- body/world coupling;
- passage scaling;
- material pushing.

B01a isolates the extraction/parity uncertainty first.

---

## Frozen donor facts

E0 B0:
- disc radius = 1
- mass = 1
- drive along heading via bounded force
- bounded turn torque
- deterministic Rapier 2D contact
- linear/angular damping derived from historical v1 lineage priors
- no hidden locomotion planner

Frozen constants from E0 probe:
- VMAX = 5.2631578947
- TAU_MOVE = 0.196
- OMEGA_MAX = 2.0
- TAU_TURN = 0.143
- DT = 1/120

---

## Exact parity reference

Frozen E0 browser probe currently reports:

- free steady speed = 5.26298
- after one reverse tick = 4.82482
- zero-cross tick = 17
- reverse overshootR = 0.31856

Transient inertial contrast:
- light actorV = 0.114299
- heavy actorV = 0.045720
- ratio = 2.500

Sustained mass+damping contrast:
- light speed = 2.63158
- heavy speed = 1.05263
- ratio = 2.500
- contact ticks = 480 / 480

Passive shove:
- vy0 = 3.83350
- vy1s = 0.02332
- ratio = 0.00608
- maxRise = 0

Curve signature:
- speed = 4.87544
- omega = 2.00000
- slipDeg = 22.63
- predictedDeg = 20.99

Long bracing:
- actor drift = 0
- heavy drift = 0
- max actor speed = 2.355e-5
- max heavy speed = 0
- final impulses ~= 0.28574771 / 0.28574771

Causal apparatus:
- identical replay branch PASS
- single-tick perturbation bytes/state divergence PASS
- state delta = 2.712e-4
- bracing checkpoint PASS
- actor-heavy impulse = 0.28574875
- heavy-wall impulse = 0.28574875

Synthetic event replay:
- physics PASS
- controls PASS
- events = 7
- ticks = 360

---

## Manipulated uncertainty

Only code organization / extraction.

Move the E0 body constants, body creation and demand->force/torque seam into a reusable TypeScript module.

---

## Allowed changes

- reusable TypeScript API shape;
- test harness organization;
- numeric tolerance needed to compare displayed rounded donor values.

---

## Forbidden scope

Do not change:
- body radius/mass;
- damping formula;
- FMAX/TMAX formulas;
- controller semantics;
- collider friction/restitution;
- Rapier timestep;
- ecology geometry;
- E02 mechanism;
- B1 morphology;
- perception/memory/Local Brain.

Do not "improve" E0.

---

## Evidence

A new module-level parity campaign must reproduce the frozen E0 mechanical signature within explicit tight tolerances.

The existing frozen browser E0 probe remains unchanged.

---

## PASS

All declared parity checks pass and no donor constant/controller rule changed.

## FAIL

Extraction requires changing donor mechanics or parity materially diverges.

## INCONCLUSIVE

Historical browser signature cannot be reconstructed precisely enough to distinguish extraction drift from display rounding.

---

## Owner touchpoint

none

---

## Result

Not run.

**Outcome: unset**
