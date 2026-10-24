# Pre-O0 Self / World Distinction Deep Dive — 2026-10-06

Status: **FOUNDATIONAL SENSORIMOTOR AXIS · REAFFERENCE PROMOTED TO PRIMARY RESEARCH QUESTION, NOT RUNTIME ARCHITECTURE**

## Core question

How can an artificial organism distinguish:

- sensory change plausibly explained by its own action;
- sensory change not explained by its current self-action model;

without receiving semantic cause labels from the World?

This distinction is foundational for:
- agency;
- adaptation;
- private causal history;
- Owner perturbation;
- body-model learning;
- later semantic ReflexBrain pressure.

---

# 1. Separate the causal chain

Do not collapse:

`motor demand`
-> `physical actuation`
-> `body motion/contact`
-> `sensory consequence`.

Each can diverge.

Examples:

### demand without motion
blocked body.

### motion not explained by demand
external shove.

### expected body motion but surprising visual change
object moved independently.

### same demand, changed motion
body mass/traction changed.

### same body motion, changed sensor
sensor mapping changed.

This is why a single "prediction error" is ambiguous.

---

# 2. What actor may legally know

Likely actor-private:
- recent motor demand;
- perhaps actual actuator output;
- proprioceptive/body state;
- contact evidence;
- sensory stream/history.

Not actor-private by default:
- external force source;
- Owner event label;
- true object velocity;
- hidden body parameter change;
- World cause graph.

Research microscope may know all.

---

# 3. Minimal forward relation

Candidate:

`P(private sensory/body delta | recent private body state, motor demand, local context)`.

This is a relation model, not necessarily a neural network.

Variants:

### SW-A — analytic body predictor
Uses known controller/body equations.

Strength:
clean body-motion expectation.

Weakness:
actor begins with privileged self-model.

### SW-B — learned local forward model
Learns demand->proprioception/sensory consequences.

Strength:
developmental;
can adapt to body change.

Weakness:
needs exploration/data;
model error confounds exogenous change.

### SW-C — hybrid
analytic immediate proprioception + learned environmental sensory consequence.

Potentially practical.

Do not choose yet.

---

# 4. Residual semantics

Define carefully:

`residual = observed consequence - currently predicted self-generated consequence`.

Researcher interpretation:

- small residual: current self-model can explain observation;
- large residual: observation is not well explained by current self-model.

Do **not** equate:

large residual = external cause.

Alternative explanations:
- body dynamics changed;
- model inaccurate;
- sensor changed;
- action interacted with unexpected obstacle;
- external world changed.

The residual is evidence of **unexplained causal structure**.

That may later be exactly the kind of pressure ReflexBrain helps interpret.

---

# 5. Matched causal experiments

## SW1 — same visual displacement, different cause

Condition A:
actor moves past static object.

Condition B:
actor remains still; object/world moves to create similar retinal/egocentric displacement.

Question:
does motor/proprioceptive context distinguish them?

## SW2 — external shove

Same initial state and motor demand.
External impulse added in one run.

Question:
does predictor detect unexplained body motion?

## SW3 — obstruction

Same motor demand.
One run has hidden obstacle/contact.

Question:
does residual localize to failed expected motion/contact?

## SW4 — changed body

Mass/damping altered without semantic notification.

Question:
does repeated mismatch drive self-model update rather than "world event" interpretation?

## SW5 — sensor remapping

Invert/rotate a sensor relation.

Question:
can system distinguish sensor-model failure from body failure over history?

## SW6 — independently moving object

Actor action unchanged.
Object moves due to world process.

Question:
can perceptual change remain exafferent without global novelty reward?

---

# 6. Learning update danger

If every residual updates the self-model:
external world events may be incorrectly absorbed as "this is how my body works".

If self-model never updates:
body/sensor changes remain permanent surprise.

Need causal credit / update gating.

Candidate strategies:

### repeated contingency
update self-model only when residual systematically covaries with own motor demand/body context.

### controlled probe
occasionally repeat action under changed external conditions.

### confidence-weighted update
high-confidence self-generated contexts update faster.

### research-only reversible tester
compare candidate model update before promotion.

No strategy is frozen.

---

# 7. Relation to private history

Self/world evidence should be temporal.

A single unexplained displacement is weak.

Repeated pattern:
- same demand;
- same body state;
- same type of mismatch;

can support stronger internal change.

This creates:
- body calibration history;
- external event hypotheses;
- uncertainty.

Do not immediately convert it into semantic cause categories.

---

# 8. Relation to Owner

Owner interventions become valuable because they create real external causes.

Owner can:
- shove actor;
- move visible object;
- move hidden object;
- block route;
- alter body control during takeover.

Actor receives only consequences.

Microscope knows intervention source.

This gives clean paired research evidence without feeding the answer to actor.

---

# 9. Relation to morphology

Different bodies create different self-predictions.

A body model is not independent from morphology.

Interesting test:
same environment and high-level action demand, B0 disc vs B1 asymmetric body.

The expected contact/motion consequences differ.

This makes self-model research genuinely embodied.

---

# 10. Relation to active perception

Unexplained sensory change may trigger **checking**, not immediate global adaptation.

Examples:
- turn toward unexpected sound/motion;
- reposition to test occluded object;
- repeat low-cost action;
- inspect body/object relation.

This suggests a possible future ReflexBrain pressure:

> which unexplained events are worth spending action/time to investigate?

Do not solve this with a global novelty threshold yet.

---

# 11. Relation to agency

Interactional asymmetry requires the actor to be a source of environmental change.

Self/world distinction lets the actor estimate which observed changes are plausibly linked to its own actions.

This does not prove agency.

It supplies one missing internal distinction that earlier specimens lacked.

---

# 12. Current judgement

Promote from "optional shadow probe" to:

**primary foundational research axis**.

Do not yet promote any specific predictor architecture.

The strongest paper-level commitment is:

> Future organism design should preserve motor-side and sensory-side information so that self-generated consequence can be studied separately from external/unexplained change.

This requirement should influence:
- logging;
- sensorium;
- body seam;
- Owner perturbation design;
- private history.

No global reward, curiosity or semantic cause label should be attached to residual by default.
