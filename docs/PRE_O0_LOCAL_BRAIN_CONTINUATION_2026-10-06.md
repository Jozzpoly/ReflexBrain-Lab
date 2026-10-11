# Pre-O0 Local Brain and Continuation Deep Dive — 2026-10-06

Status: **FOUNDATIONAL CONTROL-ORGANIZATION QUESTION · NO LOCAL BRAIN ARCHITECTURE FROZEN**

## Historical trigger

L0 demonstrated two pathologies:

- framewise recomputation produced continuation thrash;
- more continuation authority reduced thrash but produced sticky stupidity.

The key diagnosis:

`continuationId` was bookkeeping above motor recomputation.

Therefore:

> continuation must be defined by causal organization across time, not by persistence of a label.

---

# 1. Observable definition of continuation

A local activity is meaningfully continuing if:

1. it persists across multiple perception-action cycles;
2. current action is constrained by prior unresolved history;
3. progress/failure evidence updates the activity;
4. momentary sensory noise does not fully reset it;
5. sufficiently strong contradiction/failure can reorganize or terminate it;
6. its motor consequences are mediated through body/world dynamics;
7. removing the bookkeeping label while preserving the causal state would not destroy the phenomenon.

This definition is implementation-neutral.

---

# 2. Continuation is not necessarily a goal

Possible continuing organizations:

- approaching/reacquiring something;
- manipulating an object;
- maintaining a body orientation;
- exploring a local sensorimotor contingency;
- preserving a habit;
- recovering from obstruction;
- waiting for a world process;
- maintaining internal capability;
- following another actor.

Some can be goal-like.
Some are dynamical.

Do not force all into `target + successCondition`.

---

# 3. Candidate action organizations

## C-A — explicit option / local controller

A continuing activity is a closed-loop controller with:
- initiation context;
- persistent internal state;
- legal actor-private observations;
- motor demand production;
- progress evidence;
- termination/abandonment conditions.

Advantages:
- inspectable;
- real temporal authority;
- easy causal testing.

Risks:
- authored phase machine;
- ontology hard-coded into option library;
- central selector becomes planner.

Good baseline.

## C-B — Brooks-like parallel behaviors

Several complete activity producers run in parallel.

Examples:
- collision avoidance;
- orient to unresolved percept;
- continue current interaction;
- capability recovery;
- exploration.

They interact through inhibition/suppression or demand arbitration.

Advantages:
- no single world-model planner;
- fast coupling;
- ordinary competence can remain local.

Risks:
- arbitration becomes opaque scheduler;
- priorities encode meaning;
- oscillation between layers.

## C-C — predictive controller

Controller chooses local actions based on predicted short-horizon sensory/body consequences.

Advantages:
- directly grounded in sensorimotor loop;
- natural self/world model seam;
- can adapt to changed body.

Risks:
- local model can become hidden planner;
- objective still needed;
- computation/microscope can dominate organism.

## C-D — dynamical/habit organization

Recurrent state creates stable sensorimotor patterns.

Advantages:
- persistence emerges naturally;
- no explicit phase labels.

Risks:
- limit cycles;
- sticky attractors;
- difficult semantics;
- earlier Proto-Life warning.

## C-E — small actor-private planner

Search over actor-known local state only.

Advantages:
- can handle alternate routes/uncertainty;
- easy to express delayed consequences.

Risks:
- planner becomes entire intelligence;
- actor-known "state" may already encode World ontology;
- loses embodied immediacy.

## C-F — hybrid

Likely long-term reality:
low-level reactive competence + persistent local controllers + predictive state + occasional deliberation.

Do not start here.
Hybridization hides causal value of components.

---

# 4. Progress must not be a hidden goal oracle

Yesterday used examples such as decreasing target distance.

Risk:
exact target distance may require:
- target identity;
- target location;
- localization;
- metric geometry.

This can pre-solve uncertainty.

Better distinction:

### motor progress
is commanded action producing expected body change?

### relational progress
is a currently observed/reliably remembered relation changing as expected?

### epistemic progress
did action reduce uncertainty/check a hypothesis?

### organizational progress
is current concern/habit/capability returning toward a viable organization?

Different continuations may use different local evidence.

No universal progress scalar is assumed.

---

# 5. Stall / contradiction

A continuation should accumulate evidence that its current organization no longer works.

Possible local evidence:
- demand with little achieved motion;
- repeated contact;
- predicted consequence mismatch;
- target/percept lost;
- remembered relation actively falsified;
- internal capability deteriorated;
- competing concern crossed a meaningful boundary.

Important:
one event should rarely force immediate global reset.

Use temporal evidence/hysteresis.

But:
do not solve this by arbitrary cooldowns alone.

---

# 6. Abandonment and recovery

Avoid two extremes:

## thrash
small perturbation chooses new continuation every frame.

## sticky stupidity
current continuation persists despite repeated material evidence of failure.

Research question:

> what evidence threshold / dynamical organization creates graceful persistence?

Candidate mechanisms:

- accumulating contradiction evidence;
- decaying confidence;
- local recovery sub-behavior;
- alternative action sampling;
- predictive comparison;
- competing controller gradually gains authority.

These are hypotheses.

---

# 7. Search is not one behavior

"Generic search" can hide a planner.

Break it down:

### re-check
move to test a remembered relation.

### local scan
change orientation/position to reveal occluded area.

### boundary following
systematic local exploration.

### return to landmark
use private spatial history.

### novelty/competence-driven exploration
developmental mechanism.

### random walk
baseline only.

A good organism may compose several.

Do not call the bundle "search" and assume competence exists.

---

# 8. Action arbitration and meaning

If multiple activities compete, the arbiter can accidentally become ReflexBrain.

Examples of dangerous global scores:
- importance;
- urgency;
- salience;
- threat;
- utility;
- interrupt pressure.

R1 already showed broad semantic axes are unstable.

Alternative:
allow conflicts to be resolved closer to causal mechanisms:
- physical incompatibility;
- concern-specific local state;
- temporal commitment;
- body capability;
- explicit resource constraints;
- later learned semantic relation only when earned.

This does not eliminate arbitration.
It keeps its inputs grounded.

---

# 9. Local Brain authority boundary

Local Brain may own:
- ordinary movement;
- local checking;
- simple object interaction;
- persistence/recovery;
- private memory updates;
- simple learned sensorimotor models.

Local Brain should not automatically own:
- open-ended language reasoning;
- arbitrary long-horizon planning;
- World truth;
- social omniscience;
- global narrative goals;
- semantic interpretation that later belongs to ReflexBrain/LLM.

This is a pressure boundary, not module API.

---

# 10. Candidate continuation falsifiers

## CF1 — distractor

Introduce salient but irrelevant event during a continuing activity.

Does activity survive appropriately?

## CF2 — genuine contradiction

Current assumed relation becomes false.

Does activity reorganize after legal evidence?

## CF3 — temporary obstruction

Progress fails briefly, then route clears.

Does organism avoid unnecessary abandonment?

## CF4 — persistent obstruction

Same local strategy repeatedly fails.

Does organism escape sticky persistence?

## CF5 — equivalent perturbation histories

Two runs end in same current observation but one contains repeated recent failure.

Can continuation confidence/state differ?

## CF6 — body dynamics change

Old motor strategy becomes less effective.

Can local control adapt without redefining high-level concern?

## CF7 — no label

Remove explicit continuation ID from debug representation while preserving controller state.

Does behavior remain the same?

If not, label may be doing more than bookkeeping.

---

# 11. A promising neutral baseline

Not frozen:

**persistent local controller / option as active process**, not state label.

Properties:
- owns its own temporal internal state;
- consumes only private evidence;
- produces local motor/interaction demand;
- maintains contradiction/progress evidence;
- can invoke bounded recovery;
- terminates through causal evidence.

Higher arbitration remains minimal.

Why this is promising:
it directly addresses L0 failure while staying inspectable.

Why it may still fail:
authored option library can become task architecture.

Use as baseline, not destiny.

---

# 12. Future learned pressure

ReflexBrain becomes relevant when ordinary controllers repeatedly face questions like:

- Which continuing concern does this ambiguous event relate to?
- Is this novel percept evidence worth interrupting for?
- Does this message change the meaning of current physical situation?
- Is repeated prediction error a body change, external cause, or irrelevant novelty?
- Which remembered interaction is analogous enough to matter now?

Do not predefine these outputs.

Let residual failures reveal them.

---

# Current conclusion

The campaign should treat **continuation as an observable causal property** before choosing its representation.

The strongest baseline candidate is a persistent local closed-loop controller with legal private evidence and explicit failure/recovery dynamics.

But parallel behavior and habit-based alternatives remain open.

Do not freeze a central planner or score-based arbiter.
