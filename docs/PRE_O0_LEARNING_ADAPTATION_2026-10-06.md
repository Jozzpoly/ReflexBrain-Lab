# Pre-O0 Learning and Adaptation Deep Dive — 2026-10-06

Status: **FOUNDATIONAL ADAPTATION AUDIT · ONLINE LEARNING NOT ASSUMED**

## Core distinction

A system can behave differently after history for several fundamentally different reasons.

Do not call all of them "learning".

---

# 1. Memory

Example:
"I last saw the object there."

State changes, policy stays the same.

Later behavior differs because current input includes different private history.

This is history dependence without changing competence.

---

# 2. Calibration / system identification

Example:
"the same turn demand now produces less angular response."

A local body/sensor model updates.

Competence remains conceptually the same, but parameters describing the actor/world coupling change.

This is a strong candidate for early adaptation.

---

# 3. Skill learning

Example:
discovering a more effective sensorimotor pattern for pushing, passing a gap, orienting, manipulating.

The mapping from situation to action organization improves.

This changes competence.

---

# 4. Predictive model learning

Example:
learning that a moving mechanism tends to produce a certain future sensory consequence.

This changes the actor's expectations about the world.

Can support:
- active checking;
- timing;
- self/world distinction;
- later planning.

---

# 5. Representation learning

Example:
several perceptual histories become represented as similar because they share action-consequence structure.

Potentially creates:
- object-like continuity;
- affordance clusters;
- event categories.

High research value, but much harder to qualify.

---

# 6. Motivation / value learning

Example:
an experience changes what future states/interactions are worth pursuing.

This is not the same as learning how the world behaves.

Very dangerous to mix with competence learning.

---

# 7. Semantic ReflexBrain learning

Later:
actor-private temporal experience maps to reusable actor-relative meaning.

This is the project's long-term learned layer.

It should not be invoked to compensate for missing calibration, memory or ordinary sensorimotor competence.

---

# 8. Why early online learning can be harmful

Online plasticity creates a causal-credit problem:

When outcome changes, what should update?

- body model?
- sensor model?
- object expectation?
- local skill?
- concern?
- representation?
- semantic appraisal?

Proto-Life reversible-tester failures already showed:
global "something went wrong -> change self" is unsafe.

Therefore:

> adaptation must have a scoped hypothesis about what relation is being learned.

---

# 9. Update authority

A learned subsystem should only update from evidence inside its causal scope.

Examples:

### body model
updates from repeated relation:
motor demand -> proprioceptive body consequence.

Should not absorb:
object moving independently.

### object/process model
updates from repeated:
observed context/action -> external sensory consequence.

Should not absorb:
body calibration failure as object behavior.

### perceptual tracker
updates identity/continuity from appearance/motion evidence.

Should not receive World ID.

### semantic ReflexBrain
later updates from qualified actor-relative supervision, not debug labels.

This is a general anti-circularity rule.

---

# 10. Adaptation timescales

Potentially useful separation:

## fast state
milliseconds/seconds:
controller state, contact, current sensory evidence.

## short memory
seconds:
recent action/outcome history.

## adaptation
tens of seconds/minutes:
body calibration, local contingency model, skill parameter.

## developmental learning
many interactions:
representation/skill repertoire.

## semantic learning
many varied causal situations.

These are not fixed numerical bands.

The point is:
one event should not rewrite every layer.

---

# 11. Plasticity gating

Possible evidence gates:

### repetition
same relation fails/succeeds across several instances.

### intervention
actor or researcher produces a controlled action that isolates relation.

### confidence
update more when relevant private evidence is strong.

### novelty-with-learnability
update if prediction error decreases with exposure.

### counterfactual/replay
research-only validation before promoting a learning rule.

No one gate is universally correct.

---

# 12. Reversible adaptation as research method

Proto-Life's reversible tester should be salvaged as **methodology**, not organism architecture.

For candidate adaptation:
1. clone/checkpoint private state;
2. apply candidate update;
3. evaluate under controlled pressure;
4. compare to no-update baseline;
5. preserve/reject update rule at researcher level.

This helps qualify learning mechanisms.

The live organism need not literally revert its memories after every mistake.

---

# 13. Learning vs scene generalization

A fixed policy that works across scenes demonstrates structural generality.

An adapting policy may instead relearn each scene.

Both are valuable but distinct.

Qualification should report:

- zero-shot transfer;
- within-run adaptation;
- asymptotic competence;
- retained competence after scene change;
- interference with prior skill.

Do not let rapid relearning masquerade as generalization.

---

# 14. Catastrophic history interpretation

A bad adaptive system can rewrite itself because of one Owner perturbation.

Tests:

## LA1 — one-off shove
body/world model should not globally change.

## LA2 — persistent body change
repeated same-action mismatch should eventually recalibrate.

## LA3 — object-specific change
only object/process model should adapt.

## LA4 — sensor remap
sensor relation changes; body physics does not.

## LA5 — return to old condition
does adaptation revert, generalize contextually, or catastrophically forget?

These directly probe causal credit.

---

# 15. Developmental learning without "random exploration"

A developing organism needs data.

Possible sources:
- ordinary ongoing activity;
- world perturbations;
- small low-cost probes;
- play/exploration pressure;
- social observation later.

Random wandering should remain a baseline, not default developmental engine.

An important design criterion:

> useful learning should arise substantially from ordinary life, not only from dedicated training mode.

This helps preserve continuity between research organism and future actor.

---

# 16. Self-supervision sources

Potential actor-private supervision:

### prediction
did expected sensory/body consequence occur?

### controllability
did action reliably change relevant local relation?

### consistency
do multiple observations support same track/model?

### checked absence
did expected evidence fail to appear?

### body calibration
did commanded/actual motion match?

### temporal recurrence
did a relation remain stable across revisits?

These avoid hand-authored semantic labels.

But they supervise different things.

Do not merge them into one generic loss without evidence.

---

# 17. When learning is unnecessary

Prefer non-learning mechanism when:
- relation is exact and engineered;
- simple local control solves it robustly;
- the distinction is factual, not semantic;
- adaptation would add instability without generalization value.

Examples:
- rigid-body integration;
- hard interaction validation;
- fixed body collision geometry;
- stable actuator command format.

Learn only where variation/uncertainty/generalization creates real pressure.

---

# 18. Return condition for learned ReflexBrain

A learned semantic layer becomes earned when:

1. organism already has ordinary material competence;
2. private history/perception are legal and causally useful;
3. repeated situations remain ambiguous/context-dependent;
4. simple factual memory/control cannot resolve them;
5. a reusable relation must generalize across surface form/ecology;
6. downstream behavior has a real consumer for the learned distinction.

This extends the best R3 lesson:
**consumer value before learned replacement.**

---

# Current judgement

For first serious organism research:

### likely safe
- persistent memory;
- perhaps local body-model calibration;
- perhaps shadow forward-model learning.

### research candidates
- sensorimotor contingency learning;
- competence learning;
- perceptual track learning.

### postpone
- broad semantic learning;
- universal intrinsic-motivation learning;
- value learning;
- architecture-wide plasticity.

The first organism does not need to learn everything.

It needs enough plasticity that history can alter capability where evidence earns it, without turning every surprise into self-rewrite.
