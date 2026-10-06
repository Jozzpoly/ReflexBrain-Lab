# Pre-O0 N5 — T0 Control Concern Selection — 2026-10-06

Status: **CONVERGENCE DECISION · AUTHORED CONTROL CONCERN SELECTED, NOT CLAIMED AS NORMATIVITY**

Ecology candidate:

`M0 Dynamic Mechanical Yard`

Purpose:

Select one deliberately authored concern that stresses the organism substrate without pretending to solve endogenous normativity.

---

# Candidate T0-A — two-anchor patrol

Concern:

Maintain recent contact/checking with two persistent landmarks.

## Strengths

- simple;
- no object manipulation;
- exercises navigation, occlusion, route change, memory.

## Weaknesses

- easily becomes scripted alternation;
- weak material consequence;
- little body-object affordance pressure;
- "recently checked" relies heavily on authored timer/recency semantics.

Verdict:
too close to patrol FSM.

---

# Candidate T0-B — preserve traversable connection

Concern:

Maintain practical access between two actor-relevant anchor areas.

## Strengths

- body-scaled;
- directly exercises topology change;
- same World can matter differently to different body morphology;
- strong obstruction/recovery pressure.

## Weaknesses

- "is there a traversable connection?" is already a planning/reachability concept;
- tempting to add hidden path oracle/navmesh;
- satisfaction may require solving exactly the capability question we want to study;
- concern can turn navigation system into the smartest module.

Verdict:
high-value later concern, too cognitively loaded for first control.

---

# Candidate T0-C — maintain visual/contact relation to a moving marker

Concern:

Keep a perceptually distinctive body within a preferred near/visible relation.

## Strengths

- strong tracking;
- simple action;
- hidden relocation/reacquisition.

## Weaknesses

- becomes chase/follow bot;
- limited manipulation;
- topology/world mechanisms may be incidental;
- continuous following can dominate all life.

Verdict:
good tracking test, poor whole-substrate control.

---

# Candidate T0-D — restore one marked body to one marked physical dock

Concern:

A particular perceptual signature is bound by the authored concern to a particular physical landmark/dock.

Preferred relation:

> the marked movable body is physically located within / settled at the marked dock.

The concern does **not** provide:
- current World position of either;
- live satisfaction bit;
- route;
- action sequence;
- source location;
- semantic object kind;
- hidden Owner/world events.

The actor must establish and update the relation from its own perception/history.

## Strengths

### materiality

The target is a real dynamic body.

World/actor/shuttle contacts can move it.

Restoration requires body-mediated interaction, not a button.

### dynamic ecology coupling

The M0 shuttle can displace the marked body directly or indirectly.

Loose bodies/gate relation can alter access.

Concern naturally intersects ecology without ecology existing solely for the task.

### private epistemics

The body may move while actor cannot see it.

Actor can:
- remember old relation;
- be wrong;
- check;
- revise;
- reacquire.

### perception pressure

No World ID is needed if first control uses a unique visible signature.

P1 tracklet can support current perceptual continuity.
Long-term identity remains private concern binding/history.

### body pressure

Restoring relation can require:
- approach;
- contact alignment;
- pushing;
- changed route;
- dealing with body/object mass.

No carry system required.

### Owner perturbation

Owner can move:
- target body;
- distractor;
- blocker;
- actor.

Only World changes.

Concern gets no semantic notification.

### visual legibility

Owner can directly understand:
- where target is;
- where dock is;
- whether actor currently seems to know;
- whether world displaced it;
- how actor physically tries to restore relation.

This is valuable for first organism surface.

---

# Main risks of T0-D

## R1 — it is still a maintenance task

Correct.

T0-D is explicitly the **control concern**.

No claim of endogenous normativity.

The developmental challenger T1 exists precisely to test whether a self-directed trajectory adds value beyond this.

## R2 — concern binding gives identity for free

Mitigation:

Concern initially binds to a **distinctive perceptual signature / landmark relation**, not World entity ID.

For O-CTRL first calibration, uniqueness is acceptable.

Later controls can introduce:
- visually identical distractor;
- target appearance change;
- hidden swap.

Do not make identity ambiguity the first substrate blocker.

## R3 — pushing becomes an authored special action

Mitigation:

First interaction should be ordinary rigid-body contact/pushing where possible.

Do not add `push(target)` semantic action.

Actor emits body motion.

World physics produces object motion.

If additional interaction control is needed, scope it explicitly.

## R4 — dock satisfaction leaks from World truth

Mitigation:

World may know exact physical relation for researcher validation.

Actor concern state updates only from legal private evidence.

Actor may believe relation is satisfied after seeing it, then remain stale if world changes unseen.

This is a feature, not bug.

## R5 — task could dominate every moment

Mitigation:

Concern should create **episodic unresolved pressure**, not constant chase.

If actor has recently and confidently observed the relation satisfied, T0 concern can become locally quiescent until:
- actor later checks;
- new private evidence contradicts;
- ordinary exploratory/checking competence revisits it.

Do not provide immediate hidden "dock broken" interrupt.

This allows ecology to continue outside constant task execution.

---

# Concern representation

Do not implement as:

`task = { targetWorldId, dockWorldId, targetPosition, success: worldContains(...) }`.

Research-side truth may use IDs for validation.

Actor-side concern should resemble:

- a bound private target hypothesis / perceptual signature;
- a bound private dock/landmark hypothesis;
- desired qualitative relation between those private hypotheses;
- last private evidence about relation;
- unresolved / believed-satisfied / uncertain causal state derived from private history.

Exact data structure remains V1.

No global urgency/importance scalar required.

---

# Satisfaction and checking

Important distinction:

### World satisfaction

Researcher:
is target physically within dock relation now?

### actor believed satisfaction

Actor:
what does my latest legal evidence/history support?

These may diverge.

This creates a direct private-epistemics test.

Actor should not instantly react when shuttle moves target off dock behind a wall.

Later:
- ordinary revisit;
- active check;
- unexpected percept;

can create contradiction.

---

# Why this concern is better than source/sink workshop

It removes:

- resource generation;
- consumption;
- material kind ontology;
- carry/release;
- explicit supply chain;
- source search;
- "job" semantics.

It retains only:

> one persistent actor-specific desired physical relation.

That is enough to qualify:
- continuation;
- stale memory;
- dynamic world change;
- physical restoration;
- scene rearrangement.

This is a much cleaner T0 control.

---

# Paper verdict

Select **T0-D — marked body ↔ physical dock relation** as the first authored control concern.

Allowed claim:

> The substrate supports an embodied actor maintaining one externally authored, privately evidenced physical relation under independent world change.

Forbidden claims:

- endogenous normativity;
- object understanding;
- affordance learning;
- general planning;
- life;
- learned ReflexBrain competence.

## Important long-term role

T0-D should be easy to remove.

O-DEV later uses the same M0 ecology without relying on this authored relation as its heartbeat.

If substrate architecture becomes inseparable from T0-D, that is a FAIL of substrate neutrality.

---

# Next unresolved bounded decisions

1. B0 disc vs B1 asymmetric first morphology;
2. P1 tracklet exact authority/error scope;
3. smallest C-A controller processes needed for T0-D without phase scripting;
4. O-CTRL decisive falsifiers and exit condition.

Implementation remains paused.
