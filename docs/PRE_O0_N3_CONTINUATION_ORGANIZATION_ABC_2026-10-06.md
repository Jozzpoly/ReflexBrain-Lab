# Pre-O0 N3 — Continuation Organization Paper A/B/C — 2026-10-06

Status: **CONVERGENCE COMPARISON · BASELINE CANDIDATE MAY BE SELECTED**

## Compared organizations

### C-A — persistent local controller / option

A continuing local activity is an active process with:
- private input;
- internal temporal state;
- local motor/interaction output;
- progress/contradiction evidence;
- termination/recovery conditions.

No global scene truth.

### C-B — parallel behavior layers

Several complete local behavior producers run continuously.

Examples:
- body safety;
- current interaction continuation;
- orient/check unexpected evidence;
- exploration;
- recovery.

Outputs compete/suppress/arbitrate.

### C-C — sensorimotor habit / dynamical organization

Persistent recurrent state and body/world feedback jointly form a continuing pattern.

No explicit option identity is required.

---

# Scenario CO1 — transient distraction

A strong but irrelevant percept appears briefly.

### C-A
Current controller remains active unless contradiction/interrupt boundary is crossed.

Strength:
clear persistence.

Risk:
thresholds/cooldowns become arbitrary.

### C-B
Another behavior may briefly gain authority.

Strength:
natural local responsiveness.

Risk:
oscillation or priority-table semantics.

### C-C
Habit may absorb perturbation if attractor robust.

Strength:
graceful continuity can emerge.

Risk:
apparent robustness may simply be deep attractor inertia.

Verdict:
all can pass; C-A easiest to interpret.

---

# Scenario CO2 — temporary obstruction

Current motion blocked briefly, then clears.

### C-A
Can accumulate stalled-progress evidence but remain committed long enough to resume.

Good explicit test of hysteresis.

### C-B
Avoidance/recovery behavior may temporarily suppress continuation then release.

Potentially elegant.

Risk:
priority coupling produces hidden phase logic.

### C-C
Body/world dynamics may deform trajectory and return.

Strong if genuinely adaptive.

Risk:
same behavior may be fixed limit cycle around obstacle.

Verdict:
C-A and C-B easiest to falsify.

---

# Scenario CO3 — persistent obstruction with alternative route

### C-A
Needs bounded recovery/search sub-process.

Risk:
option becomes mini planner/state machine.

### C-B
Obstacle-following/exploration behavior may create alternate route without explicit planning.

Potentially strong embodied competence.

Risk:
can wander indefinitely.

### C-C
Must reorganize habit enough to escape old attractor.

High-value but hard.

Risk:
sticky failure or chaotic route.

Verdict:
C-B may have strongest natural recovery, C-A strongest interpretability.

---

# Scenario CO4 — hidden target/relation invalidated

Actor reaches remembered relation and expected evidence is absent.

### C-A
Controller receives explicit private contradiction and can transition into check/reacquire process.

Risk:
authored transition graph.

### C-B
Checking/search behavior may emerge through local drives.

Risk:
why should it activate? Arbitration semantics return.

### C-C
Habit loses expected sensory closure, producing instability.

Potentially compelling.

Risk:
prediction/habit state may not produce purposeful reacquisition.

Verdict:
C-A easiest baseline for epistemic causality.

---

# Scenario CO5 — same observation, different recent failure history

### C-A
Internal contradiction/progress state can differ; behavior diverges.

Clear.

### C-B
Behavior activation/inhibition histories can differ.

Possible but attribution harder.

### C-C
Recurrent state naturally differs.

Strong historical dependence, weak semantic interpretability.

Verdict:
all support history; C-A best microscope.

---

# Scenario CO6 — body dynamics changed

### C-A
High-level controller can persist while low-level motor competence degrades/adapts.

Good layer separation.

### C-B
Several behaviors may all be affected.
Potential robustness through coupling.

### C-C
Whole attractor can shift/collapse.
Excellent adaptation test, poor debugging.

Verdict:
C-A cleanest first substrate.

---

# Scenario CO7 — scene rearrangement

### C-A
If controller references generic perceived relations, may transfer.
If it references authored targets/routes, fails.

Good anti-hardcoding test.

### C-B
Local behaviors may generalize well to geometry changes.

Potential strength.

### C-C
Could generalize if habits are truly relation-based; could collapse if scene-specific attractors.

Verdict:
C-B deserves later comparison.

---

# Scenario CO8 — no explicit continuation label

### C-A
Remove debug label but retain controller internal state/process.

Behavior should remain unchanged.

This is an explicit safeguard against L0 error.

### C-B
No central continuation label needed.

### C-C
No label needed by design.

Verdict:
all can satisfy.

---

# Scenario CO9 — explain first divergence

### C-A
Strong:
specific private evidence -> controller state -> demand.

### C-B
Medium:
need inspect competing activations and arbitration.

### C-C
Weak:
recurrent state divergence may be distributed.

Verdict:
C-A best first scientific microscope.

---

# Semantic leakage risk

## C-A
Risk:
controller type/transition labels can encode semantics.

Mitigation:
keep first controllers grounded in generic physical/epistemic relations.

## C-B
Risk:
behavior names/priorities encode significance.

Mitigation:
inspect causal inputs and arbitration.

## C-C
Risk:
less explicit semantics, but hidden learned/dynamical geometry can still encode fixture-specific structure.

No architecture is automatically "more grounded".

---

# Complexity

### C-A
Low-medium.
Can be built incrementally.
Easy unit/causal tests.

### C-B
Medium.
Arbitration and interactions become complexity.

### C-C
High research uncertainty.
Needs dynamical falsifiers before trust.

---

# Paper verdict

For the **first serious substrate**, C-A is currently the strongest baseline candidate:

> a persistent local closed-loop controller/option whose continuity is carried by its active causal state, not by a label.

Why:
- maximizes causal interpretability;
- directly addresses L0;
- clean history dependence;
- clean stale-memory/reacquisition tests;
- can sit above E0-like body without hidden World motion;
- does not require solving arbitration dynamics first.

But C-A must be constrained:

1. no scene-specific route table;
2. no hidden target coordinates;
3. no generic `phase` enum that merely scripts a task;
4. continuation state consists of causal evidence/history needed by the active controller;
5. debug labels are removable;
6. controller failure/recovery must work across rearranged scene geometry.

C-B should be the first alternative if C-A becomes a central task machine.

C-C remains a separate high-risk research family for endogenous continuity and should not be smuggled into the baseline through "recurrent state" without dedicated falsification.

## Research interpretation

Selecting C-A as baseline does **not** claim hierarchical options are the final Local Brain architecture.

It means:

> use the most interpretable causal continuation mechanism first, then let concrete failures earn more distributed organization.
