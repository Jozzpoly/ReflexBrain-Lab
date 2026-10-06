# OCTRL-B01a Result — E0 Body Seam Extraction / Parity — 2026-10-06

Status: **PASS · RUN CLOSED**

Run branch:
`run/octrl-b01a-e0-body-seam-parity`

Base SHA:
`43b7a167e589055935643f8315a590f1b418d6c7`

PR:
#10 — OCTRL-B01a E0 body seam extraction parity

---

# Question

> Can the qualified E0/B0 body-actuation seam be extracted from the monolithic browser probe into a reusable module without materially changing its qualified mechanical behavior?

# Outcome

**PASS**

The reusable seam reproduces the frozen E0 mechanical signature within the predeclared tight parity tolerances.

---

# Extracted seam

New reusable module:

`src/e0-body-seam.ts`

Preserved donor mechanics:

- deterministic Rapier 2D;
- DT = 1/120;
- B0 disc radius = 1;
- mass = 1;
- forward/back force along heading;
- bounded turn torque;
- E0 historical damping formulas;
- collider friction = 0;
- restitution = 0;
- no planner, navigation or hidden position authority.

Frozen constants preserved:

- VMAX = 5.2631578947
- TAU_MOVE = 0.196
- OMEGA_MAX = 2.0
- TAU_TURN = 0.143

---

# Parity evidence

The module-level campaign reproduced the frozen E0 reference signature, including:

## Free response / reverse

Frozen reference:
- steady = 5.26298
- after-one-reverse = 4.82482
- zero-cross tick = 17
- overshootR = 0.31856

Parity: **PASS**

## Transient inertial contrast

Frozen reference:
- light actorV = 0.114299
- heavy actorV = 0.045720
- ratio = 2.500

Parity: **PASS**

## Sustained mass + damping contrast

Frozen reference:
- light speed = 2.63158
- heavy speed = 1.05263
- ratio = 2.500
- contact ticks = 480 / 480

Parity: **PASS**

## Passive shove decay

Frozen reference:
- vy0 = 3.83350
- vy1s = 0.02332
- ratio = 0.00608
- maxRise = 0

Parity: **PASS**

## Isotropic curve signature

Frozen reference:
- speed = 4.87544
- omega = 2.00000
- slip = 22.63 deg
- predicted = 20.99 deg

Parity: **PASS**

## Long bracing soak

Frozen reference:
- actor drift = 0
- heavy drift = 0
- max actor speed = 2.355e-5
- max heavy speed = 0
- final impulses ~= 0.28574771 / 0.28574771

Parity: **PASS**

## Causal replay / bracing checkpoint

Frozen reference:
- identical replay branch PASS
- single-tick perturbation divergence PASS
- state delta = 2.712e-4
- actor-heavy impulse = 0.28574875
- heavy-wall impulse = 0.28574875
- bracing checkpoint PASS

Parity: **PASS**

---

# Important intermediate failure

The first parity attempt failed at the bracing checkpoint.

Cause:

the extracted helper `e0PairImpulse` initially accepted collider objects, while the historical E0 helper contract accepted **collider handles** and resolved them through `world.getCollider(handle)`.

The parity harness passed historical handles into the new helper, so contact instrumentation reported no reciprocal contact and `braced=false`.

This was a **harness/API-contract extraction bug**, not a body-physics drift.

Correction:

- restore the historical helper contract:
  `handle -> world.getCollider(handle) -> contactPair`;
- update long-bracing harness to use collider handles consistently.

No physical parameter, controller rule or parity tolerance was changed.

After correction:
**full parity Check PASS**.

---

# Claim scope

Allowed claim:

> The qualified E0/B0 mechanical body-actuation seam can be represented as a reusable TypeScript module without material drift from the frozen E0 mechanical campaign.

This removes code-organization/extraction uncertainty before ecology integration.

---

# This does NOT establish

B01a does not establish:

- E0 body compatibility with E02 ecology;
- passage fit;
- body-scaled accessibility;
- pushing usefulness in the ecology;
- B1 morphology value;
- good character-control feel in the new world;
- actor perception;
- private memory;
- Local Brain;
- organism continuity;
- ReflexBrain semantic pressure.

---

# Important integration finding retained

Current qualified E02 doorway geometry was measured with researcher clearance radius **0.35**.

Frozen E0 B0 physical radius is **1.0**.

Therefore:

> E02's qualified "OPEN" state is not evidence that B0 can physically traverse that doorway.

This is not an E02 failure because E02 explicitly excluded actual actor traversability.

It means body/ecology integration must decide body-scaled geometry in a separate run rather than silently reusing the E02 research-clearance fixture.

---

# Parent-state consequence

E0/B0 is now available as a clean reusable donor seam.

The next body/ecology integration question should not be the old broad B01.

A smaller next candidate should isolate one of:

1. **body-scale ecology geometry compatibility**; or
2. **open-area E0 seam integration into the ecology substrate before passage questions**.

The next run must be selected after parent-level reconsideration.

Do not automatically start B1 or passage redesign.

---

# Potential SPC donor value

Narrow donor value:

> a mechanically qualified body-actuation seam can be reused as an independent substrate component without silently changing its behavior during extraction.

This remains infrastructure/body evidence, not resident intelligence.
