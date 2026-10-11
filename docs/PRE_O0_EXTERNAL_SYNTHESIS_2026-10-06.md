# Pre-O0 External Synthesis — 2026-10-06

Status: **F1 COMPARATIVE SYNTHESIS · DONOR MECHANISMS, NOT ARCHITECTURE IMPORT**

Parent:
`PRE_O0_FOUNDATIONS_CAMPAIGN_2026-10-06.md`

This note summarizes external research lines as pressure on ReflexBrain's organism substrate. No school is treated as authority.

## 1. Behavior-based robotics — complete creatures before cognitive decomposition

Rodney Brooks' behavior-based work argues for incrementally building complete situated creatures and warns that central representations can become artificial interfaces between subproblems.

Useful for ReflexBrain:
- build complete perception-action loops at each stage;
- evaluate behavior in the coupled world;
- do not assume a central world model is necessary;
- competence layers can coexist without one planner owning all intelligence.

Conflict with current ReflexBrain direction:
- we explicitly care about private history, semantic meaning and later learned cognition;
- purely representation-light behavior may not scale to those questions;
- a Brooks-like architecture can hide arbitration complexity in layer interactions.

Research pressure:

> prove which representations are actually needed by failures of complete organisms rather than by architectural preference.

## 2. Ecological psychology — affordance is relational

Ecological approaches treat affordances as relations between organism capabilities and environmental structure.

Useful:
- "object meaning" should depend on body capability, geometry, current activity and history;
- body-scaled and action-scaled possibilities are central;
- morphology and control cannot be separated completely from perception.

Implication:
- a disc body plus semantic `kind=crate` perception may erase exactly the relation we hope ReflexBrain eventually learns;
- material layout should create opportunities whose availability changes with body/world relation.

Risk:
- treating "affordance" as another hidden label would reproduce the old semantic shortcut.

Research pressure:

> expose measurable body-environment relations without handing the actor named affordances.

## 3. Enactivism / adaptive autonomy — normativity comes from organization

Enactive work emphasizes autonomy, adaptivity and sense-making: environmental events gain significance relative to the organism's own continued organization.

Useful:
- highlights the weakness of purely externally assigned tasks;
- separates "an event happened" from "this matters for this actor";
- suggests normativity can arise from maintenance of an organization or sensorimotor identity.

Conflict:
- biological autopoiesis is not directly available in a software creature;
- fake metabolism can become arbitrary reward engineering;
- strong philosophical claims are not engineering evidence.

Research pressure:

> compare externally authored concerns with internal self-maintaining dynamics and see whether the latter actually produce better actor-relative meaning rather than prettier language.

## 4. Sensorimotor contingency theory / developmental robotics

This line emphasizes lawful relations between action and resulting sensory change.

Useful:
- body knowledge can emerge from action-outcome contingencies;
- memory/generalization/goal-directedness can develop from repeated contingencies;
- the organism need not begin with a fully semantic model of its body/world.

Strong relevance:
- supports treating motor->sensory coupling as a foundation, not merely a later debug probe;
- offers a path between raw pixels and hand-authored semantic object tables.

Research pressure:

> determine whether a small artificial organism can build useful self/world distinctions from repeated action-consequence structure before semantic categories exist.

## 5. Corollary discharge / efference copy — self-generated vs external change

Across animals, motor-related signals inform sensory processing about expected consequences of self-action.

Useful:
- gives a biologically grounded answer to a problem already discovered by Proto-Life;
- same sensory change can mean different things depending on whether current motor output predicts it;
- mismatch can be evidence of exogenous/unmodelled change.

Important boundary:
- residual/mismatch is not automatically "novelty", "importance" or reward;
- prediction must not simply reproduce World truth.

Research pressure:

> test matched sensory displacements caused by self-motion vs external motion and ask what minimal private signals distinguish them.

## 6. Intrinsic motivation / learning progress

Developmental robotics shows learning-progress-based exploration can self-organize developmental trajectories.

Useful:
- potential source of self-directed exploration without external task;
- can focus learning on regions neither trivial nor impossible;
- relevant to open-ended skill acquisition.

Our own warning:
- old Playground produced wall/representation artifacts;
- region choice determines what "progress" means;
- curiosity can optimize the measurement system.

External warning:
- prediction-error curiosity can become trapped by unpredictable/noisy processes.

Research pressure:

> intrinsic motivation should be evaluated as a candidate developmental mechanism only after the representation and controllability boundaries are explicit.

Do not use raw prediction error as organism heartbeat.

## 7. Empowerment / controllable futures

Information-theoretic empowerment-like ideas ask how much influence an agent's actions can have on later sensed states.

Useful:
- resonates with the old Proto-Life "expand controllable futures" intuition;
- could characterize agency without a task-specific reward;
- naturally links body capability to environment structure.

Risks:
- expensive/abstract;
- can reward control for its own sake;
- can become another universal scalar that replaces qualitative organism structure.

Research pressure:

> consider empowerment primarily as diagnostic or local pressure, not as first global objective.

## 8. Partial observability / belief-state robotics

POMDP work formalizes action under uncertain hidden state.

Useful:
- reminds us that stale/private knowledge is a normal control problem;
- separates true world state from belief;
- active information gathering may be rational.

Risk for ReflexBrain:
- adopting a full explicit belief-state planner could solve our organism problem by importing a mature planning formalism;
- belief distributions over authored state variables may encode the ontology we wanted the organism to develop.

Research pressure:

> use partial-observability theory to design falsifiers and uncertainty cases, not automatically as runtime architecture.

## 9. Morphological computation

Embodied robotics shows body/environment dynamics can perform work that otherwise falls on control.

Useful:
- body shape, compliance, inertia and contacts can simplify behavior;
- morphology can create action possibilities and constraints directly.

Strong implication:
- body choice should be part of the cognitive experiment;
- a symmetric disc may be an unusually weak organism substrate.

Risk:
- simulation fetish / excessive physical complexity.

Research pressure:

> compare minimal morphologies based on whether they reduce control complexity and create useful observable distinctions.

## 10. Autotelic / goal-generating agents

Autotelic learning studies agents that represent, generate and pursue their own goals.

Useful:
- directly addresses self-generated skill repertoires;
- separates goal discovery from externally fixed tasks.

Risk:
- goal representation/achievement functions are themselves major authored design choices;
- self-generated goals can still be benchmark-shaped abstractions.

Research pressure:

> do not ask "can the agent invent goals?" before understanding what a goal can be grounded in within its body/world/private history.

## 11. Artificial Life / synthetic modeling warning

Artificial-life research repeatedly notes that synthetic agents are often born with prepacked rules in designer-controlled simplified environments.

This is highly relevant.

A micro-world can appear autonomous while every meaningful possibility was preselected by the experimenter.

Research pressure:

> vary environments and interventions enough to reveal whether behavior depends on local organization or on designer alignment with one fixture.

## 12. Social / multi-agent development

Independent agents can create causal events no single task designer scheduled at runtime.

Useful:
- naturally actor-relative events;
- different knowledge histories;
- coordination/conflict;
- rich exafference;
- world continues elsewhere.

Risk:
- complexity and observer anthropomorphism can make weak mechanisms look rich;
- failure attribution becomes harder.

Research pressure:

> treat another actor as a possible ecology generator, not as a shortcut to "life feel".

---

# Cross-school tensions that ReflexBrain should experimentally resolve

## Tension A — representation vs direct coupling

Brooks/ecological approaches warn against central models.
POMDP/developmental approaches often rely on explicit or learned internal state.

ReflexBrain question:

> which internal representations become necessary only after simpler direct coupling fails under partial observability/history?

## Tension B — external task vs endogenous normativity

Engineering tasks are easy to test.
Enactive autonomy says meaning should derive from the organism's own organization.

ReflexBrain question:

> what minimum self-maintaining process produces useful normativity without turning into fake metabolism?

## Tension C — curiosity vs stability

Intrinsic motivation supports developmental exploration.
Organisms also need continuity/habits and should not chase every unpredictable event.

ReflexBrain question:

> how can exploration pressure coexist with persistent concerns without a global scheduler scorecard?

## Tension D — rich perception vs learned perception

Structured percepts isolate cognition from computer vision.
But semantic percepts can solve the meaning problem upstream.

ReflexBrain question:

> what is the lowest perceptual abstraction that makes organism research tractable without giving away object/affordance semantics?

## Tension E — one organism vs relational/social ecology

One actor gives clean causal attribution.
Multiple independent trajectories may generate the very actor-relative meaning we need.

ReflexBrain question:

> can environmental dynamics alone create enough independent causal lines, or is another autonomous actor a qualitatively different requirement?

## Tension F — body null vs morphology

A simple disc isolates control.
Morphology may be part of cognition and affordance.

ReflexBrain question:

> when does adding minimal body asymmetry reduce brain complexity enough to justify the additional substrate?

---

# Highest-value mechanisms to bring into paper prototypes

Not architecture decisions:

1. action->predicted sensory consequence->actual consequence comparison;
2. body-scaled affordance tests without affordance labels;
3. stale private knowledge + active checking;
4. environment rearrangement without policy edits;
5. actor-private history pair with matched current observation;
6. local self-maintaining/habit process as alternative to authored task;
7. learning-progress exploration under noisy/unlearnable controls;
8. simple empowerment/controllability diagnostic;
9. one-actor vs independent-process vs two-actor ecology comparison;
10. morphology A/B under identical Local Brain pressure.

## F1 conclusion

No external research line justifies implementing yesterday's O0 as-is.

The strongest convergence is instead:

> build and compare complete embodied organism-environment loops, preserve private partial knowledge, study action-consequence regularities, and let representational/motivational architecture earn itself through concrete failures.

Next:
construct several qualitatively different organism families and attack them with the same causal walkthroughs.
