# Pre-O0 Normativity Deep Dive — 2026-10-06

Status: **FOUNDATIONAL OPEN QUESTION · NO CHOSEN MOTIVATION SYSTEM**

Why this matters:

ReflexBrain ultimately targets actor-relative meaning.

If the actor has no actor-relative "better / worse / worth continuing / worth checking" structure, learned semantic appraisal can only inherit significance authored elsewhere.

The project does not need philosophical proof of genuine life.

It needs an operationally grounded source of actor-relative consequence rich enough to create nontrivial behavior and later semantic pressure.

---

# 1. Distinguish six things often collapsed into "motivation"

## 1. task specification

Example:
`keep object at site`.

Defines desired external condition.

It may be useful without being endogenous normativity.

## 2. reward / utility scalar

A number used to optimize policy.

It can encode value but does not explain where value comes from.

## 3. internal regulated state

Energy, temperature, integrity, charge, prediction/calibration state.

World interaction changes it.

## 4. capability

What the body can currently do.

Examples:
- available force;
- turn authority;
- sensor quality;
- reachable space;
- stable action repertoire.

## 5. habit / continuing organization

A persistent pattern of perception-action that can be disrupted, restored or reorganized.

## 6. competence / controllability

How reliably the actor can produce/predict outcomes.

These may interact but should not be treated as synonyms.

---

# 2. External research pressure

## Adaptive autonomy / enactive agency

One influential agency framework emphasizes:
- individuality;
- interactional asymmetry;
- normativity.

The key useful idea is not that software must imitate metabolism.

It is:

> an agent regulates its coupling with the environment relative to norms connected to its own organization.

For ReflexBrain this suggests a test:
does "what matters" alter because the actor itself is in a different organizational/body/history state?

## Homeostatic RL

Homeostatic reinforcement learning formalizes rewards relative to internal physiological state.

Useful:
- same external outcome can have different value depending on internal state;
- behavior can become anticipatory;
- internal regulation can modulate learned action values.

Risk:
- desired setpoints and internal dimensions are authored;
- RL reward may merely relocate task design into physiology;
- simplest policy can become direct drive reduction.

## Empowerment

Empowerment measures the information-theoretic capacity from actions to future sensed states.

Useful:
- agent-centric and task-independent;
- explicitly depends on body/sensors/environment;
- potentially captures "keep options open";
- body/environment modifications can change empowerment.

Risk:
- maximizing control may become universal utility;
- computationally expensive;
- may prefer strange high-control states;
- control is not identical to care, identity or viability.

## Intrinsic learning progress

Learning progress can organize developmental exploration.

Useful:
- self-directed skill acquisition;
- focuses on learnable rather than merely surprising regions.

Risk:
- representation determines what progress exists;
- progress can be gamed by context partition;
- does not by itself create persistent self-maintenance.

---

# 3. Proposed operational criterion — capability-grounded normativity

A promising neutral criterion:

> An internal/world relation has organism-level normative relevance if changing it alters the actor's future set or quality of possible sensorimotor continuations, and the actor can regulate that relation through its own actions.

This is weaker than biological autonomy and stronger than a reward label.

Examples:

- low actuator charge reduces force and reachable futures;
- damage changes locomotion/control;
- overheating reduces sustained actuation;
- learned loss of control makes certain interactions less available;
- a stable habit's disruption changes what organized continuations are possible.

Important:

This criterion does **not** say the actor must explicitly compute empowerment or future option count.

It is a researcher lens.

---

# 4. Requirements for a useful artificial normative variable

Candidate internal variable/process should satisfy most:

### NQ1 — causal embodiment
World/body interactions actually change it.

Not:
`reward += 1`.

### NQ2 — future consequence
Its state changes future capability/continuation, not only score.

### NQ3 — actor regulation
Actor actions can influence it, at least indirectly.

### NQ4 — contextual value
Same world event can matter differently at different internal states/history.

### NQ5 — nontrivial mediation
It does not directly prescribe a unique action.

### NQ6 — no hidden world answer
Regulation still requires private evidence.

### NQ7 — anti-idle
Trivial permanent inactivity must not dominate unless the ecology actually makes inactivity the rational actor-owned state.

### NQ8 — anti-self-stimulation
Actor must not gain "value" by manipulating the metric while degrading actual future capability.

### NQ9 — persistence
Effects survive beyond one tick/event.

### NQ10 — inspectability
Researcher can trace how it changed without turning that trace into actor authority.

---

# 5. Candidate normative substrates

## N-A — authored grounded concern

Example:
maintain physical condition X.

Passes:
- NQ6 if privately sensed;
- NQ9;
- good causal testability.

Weak:
- NQ1/2 only indirectly;
- source of "care" external.

Role:
baseline/control.

## N-B — energy/charge capability

Energy is not reward.

It physically limits:
- max sustained force;
- available high-effort actions;
- perhaps sensing/processing frequency.

World interactions can replenish it.

Potential value:
events matter because they affect future effectivity.

Risks:
- charger-bot;
- safe idle;
- arbitrary metabolism.

Better than abstract energy if:
energy expenditure/recovery is tied to actual actuation and body performance.

## N-C — thermal/load state

Actuation generates heat/load.
Recovery occurs through time/environment.
High load changes performance.

Potential value:
creates pacing and temporal tradeoffs.

Weak:
does not naturally create world exploration.

Role:
body-level normativity donor, not full motivation.

## N-D — integrity / damage

Impacts/contact alter body capability.

Potential:
material events acquire long-lived consequences.

Risks:
- simple collision avoidance;
- hard to recover;
- can make experimentation unattractive.

## N-E — controllability / empowerment-like state

Prefer local situations with greater action->future sensory influence.

Potential:
task-independent;
body/world relational;
can favor maintaining options.

Risks:
- universal scalar;
- control-seeking weirdness;
- future-computation apparatus becomes smarter than organism.

Role:
diagnostic first.

## N-F — learning-progress / competence

Prefer contexts where predictive/control competence improves.

Potential:
development/open-endedness.

Risks:
known Playground artifacts;
representation dependence;
noisy/unlearnable traps.

Role:
developmental pressure, not sole norm.

## N-G — sensorimotor habit identity

Certain ongoing perception-action patterns become dynamically self-maintaining.
Disruption creates pressure for compensation/reorganization.

Potential:
continuity without explicit task;
meaning relative to ongoing organization.

Risks:
limit cycles;
sticky attractors;
difficult causal interpretation.

Role:
high-value research family.

## N-H — plural heterogeneous constraints

Small combination, e.g.:
- capability preservation;
- learned competence;
- one persistent concern.

Potential:
richer context-dependent significance.

Risk:
scheduler scorecard reappears;
attribution weak.

Role:
only after components independently earn value.

---

# 6. Paper tests for normativity

No code required yet.

## NT1 — same world, different internal state

World observation identical.

Actor internal normative substrate differs.

Question:
would the same event rationally lead to different local continuations?

If no, the substrate may not create actor-relative meaning.

## NT2 — same scalar, different capability

Construct states with same nominal "energy/drive" but different actual action capability.

Question:
does metric track capability or only its own label?

## NT3 — metric hacking

Can actor maximize/minimize the normative quantity while reducing its actual future options?

Reject global use if yes.

## NT4 — safe-idle

Run long horizon with no explicit task.

Does the proposed norm collapse into inactivity?

If inactivity is selected, is it genuinely good for future capability or merely an objective loophole?

## NT5 — perturb-and-recover

External perturbation changes internal/capability state.

Can actor produce adaptive recovery through legal evidence rather than direct threshold script?

## NT6 — delayed consequence

Two actions look locally similar but differ later in capability.

Can history/learning make that distinction matter?

## NT7 — irrelevant event

Large sensory surprise with no consequence for organization/capability.

A good norm should not automatically treat it as important.

## NT8 — novel opportunity

New interaction increases future capabilities but has no authored task value.

Can candidate norm detect/use value without explicit label?

---

# 7. Important distinction for ReflexBrain

ReflexBrain should not necessarily **compute normativity**.

A future learned semantic organ may instead estimate relations such as:

- this event threatens an ongoing capability;
- this object may resolve current uncertainty;
- this interaction conflicts with another concern;
- this novel event changes predicted controllability;
- this message is relevant to a persistent commitment.

For that to be grounded, the organism substrate must already contain real consequences and actor-private history.

Therefore:

> normativity is substrate pressure; ReflexBrain later learns actor-relative interpretation of that pressure.

---

# 8. Current judgement

Do not choose one normative system yet.

Strong current ranking for research value:

1. **capability-grounded internal variables** (energy/load/integrity tied to actual effectivity);
2. **sensorimotor contingency / controllability diagnostics**;
3. **habit/self-maintaining organization**;
4. **authored concern as control baseline**;
5. **learning progress as developmental pressure**.

Do not combine them yet.

The maintenance-site architecture should no longer be treated as the default organism.

It remains a useful N-A control condition.

## Most important next question

Can we define a tiny internal state whose deterioration changes **what the body can really do**, rather than merely changing a score, while avoiding a trivial charger/idle bot?

If yes, that would give the project a cleaner source of actor-relative normativity than any previous ReflexBrain specimen.

If no, do not force fake metabolism; return to habit/competence/relational alternatives.
