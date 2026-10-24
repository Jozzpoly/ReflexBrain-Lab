# Pre-O0 Body, Morphology and Effectivity Deep Dive — 2026-10-06

Status: **FOUNDATIONAL BODY AUDIT · E0 CONTROLLER PRESERVED AS DONOR, MORPHOLOGY OPEN**

## What E0 actually is

E0 actuation is not direct position stepping.

Current seam:
- forward/back force is applied along actor heading;
- turn demand applies bounded torque;
- linear/angular damping create finite response;
- rigid-body contact resolves through Rapier;
- external impulses produce real body motion.

Therefore orientation already matters for **actuation**.

However:
- actor collider is a circle;
- visual nose has no collision geometry;
- orientation does not alter body envelope/passability/contact shape.

This explains Owner impression:
the controller can have coherent rules while the body still feels like a physical puck.

---

# 1. Distinguish controller from morphology

## controller
How motor demand becomes force/torque.

## morphology
Shape, mass distribution, contact geometry, articulation/compliance.

## effectivity
What actions are physically possible for this body in this environment.

A good organism substrate may preserve E0 controller while changing morphology.

Do not conflate:
"controller feels okay"
with
"body is sufficient for organism research".

---

# 2. What body morphology can contribute cognitively

A body can create distinctions without brain labels.

Examples:

- fits / does not fit;
- can rotate through / cannot;
- stable orientation / awkward orientation;
- can push light object / stalls on heavy object;
- carrying object changes width/mass;
- contact from front differs from side;
- turning radius and inertia alter path;
- object/body geometry creates natural alignment.

These are body-scaled/action-scaled affordances.

They become actor-relative because another body could have different possibilities in the same World.

---

# 3. Body candidates

## B0 — E0 symmetric disc

Keep exact donor.

Strengths:
- mechanically qualified;
- robust contact;
- simple causal analysis;
- clean locomotion baseline.

Weaknesses:
- no orientation-dependent collision;
- no width/length affordance;
- easy to treat body as point-with-radius.

Use:
control.

## B1 — minimal asymmetric rigid body

Candidate:
capsule / rounded rectangle / short wedge.

Keep:
same forward-force + torque controller initially.

Adds:
- real front/back orientation;
- doorway/body-angle interactions;
- turning envelope;
- directional contact geometry.

Risks:
- wall snagging;
- controller parameters may no longer transfer;
- apparent intelligence from shape alone.

High-value A/B candidate.

## B2 — asymmetric body + carried envelope

Carrying a physical item changes:
- total mass/inertia;
- effective collision envelope;
- possibly center of mass.

Adds:
- action capability depends on current world relation;
- passage affordance changes through interaction.

Risk:
manipulation complexity dominates first experiment.

Do not add until carrying is independently justified.

## B3 — compliant/articulated body

Potential:
rich morphological computation.

Cost:
huge new problem.

Not justified yet.

---

# 4. Proprioception boundary

Actor should likely know body-local state more directly than external World state.

Candidate legal signals:

- heading-relative linear velocity;
- angular velocity;
- current motor demand;
- perhaps achieved acceleration;
- contact/touch distribution;
- carried load relationship;
- internal actuator/load state if normativity research uses it.

Question:
should actor receive exact heading angle?

Possible:
- body-relative forward direction is intrinsic;
- absolute World angle need not be exposed.

Likewise:
exact World x/y should remain researcher truth unless an actor-private localization process earns it.

---

# 5. Effort must remain grounded

E0 already exposed:

solver contact impulse != organism effort.

Future candidate effort/load should come from:
- motor demand;
- achieved vs demanded motion;
- actuator work/force;
- sustained load;
- internal body state.

Do not infer "effort" directly from obstacle contact.

This matters for future:
- fatigue/load;
- controllability;
- body capability learning;
- ReflexBrain interpretation.

---

# 6. Morphology research questions

## MB1 — doorway scaling

Same controller.
Disc vs asymmetric body.
Several passage widths/orientations.

Ask:
does body shape create qualitatively useful action distinctions?

## MB2 — orientation relevance

Same target relation but different body heading.

Does B1 require meaningful reorientation while B0 does not?

## MB3 — object pushing

Light/heavy objects at different contact angles.

Does morphology create stable directional interaction differences?

## MB4 — body perturbation

External shove from front/side.

Does proprioceptive/contact history carry different actor-private evidence?

## MB5 — changed body

Alter mass/turn dynamics after history.

Can controller/self-model detect that old action expectations are stale?

## MB6 — same world, different body

Two body morphologies in identical ecology.

Do available continuations differ without any semantic affordance labels?

This is a strong affordance test.

---

# 7. Morphological computation caution

Body can simplify control.

That is desirable.

But if B1 "solves" navigation because its shape passively aligns in corridors, do not automatically call that cognition.

Correct claim:
**the coupled body-environment system reduced required control complexity.**

This is still valuable.

The future Local Brain should exploit, not fight, useful physical dynamics.

---

# 8. Controller adaptation question

Do not tune E0 controller before larger-world evidence.

Possible later paths:

### fixed donor controller
best for causal comparison.

### parameter adaptation
actor learns body response changes.

### learned low-level controller
much larger scope.

Current preference:
keep E0-style actuation fixed initially when comparing morphology.

Reason:
avoid changing controller and body simultaneously.

---

# 9. Normativity link

A particularly promising future direction is **capability-mediated internal state**.

Example:
sustained actuation load changes available force/turn authority.

Then internal state alters actual effectivity rather than a reward score.

But:
- no fatigue/load system is qualified yet;
- do not add it to body until normativity campaign earns it.

---

# 10. Current body judgement

Preserve:
- E0 force/torque seam;
- deterministic physical contact;
- external impulse support;
- replay.

Re-open:
- collider shape;
- body envelope;
- mass distribution;
- orientation-dependent contact;
- carrying interaction.

Strongest next body comparison on paper / later tiny probe:

> **B0 disc vs B1 minimal asymmetric rigid body under the exact same controller and ecology.**

Do not choose B1 merely because it seems more creature-like.

Choose it only if it creates useful body-scaled distinctions or reduces control pathology.
