# O0 First-Principles Redesign — 2026-10-06

Status: **DESIGN RESEARCH / RED TEAM · NOT AN IMPLEMENTATION CONTRACT**

Active branch:

`experiment/organism-recovery-v0`

## Why O0 should not be "Playground v2"

Owner judgement now supports the **persistent embodied-organism direction** demonstrated by Persistent Playground v1.

The old architecture is not promoted.

A central diagnosis is broader:

> several previous ReflexBrain specimens placed a small brain inside a causally poor ecology: tiny empty space, crude perception, weak body/world structure and too few independent things happening.

A sophisticated learner cannot extract rich actor-relative meaning from a world that produces almost no meaningful distinctions.

Therefore O0 must co-design:

- organism;
- body;
- sensorium;
- private history;
- local competence;
- world ecology;
- research microscope.

Do not optimize the brain while leaving the ecology impoverished.

## External lines worth borrowing from — as pressure, not doctrine

### Affordances are organism ↔ environment relations

Ecological/active-inference literature emphasizes that affordances belong to animal-environment relations rather than objects alone.

Useful implication for O0:

A crate, gap, source, obstacle or moving actor should matter differently depending on:
- current body capability;
- relative geometry;
- current concern;
- history;
- local knowledge.

Do not encode "affordance labels" into objects.

### Reafference / corollary discharge

Biological nervous systems widely use motor-related signals to distinguish self-generated sensory change from externally generated change.

Useful implication for O0:

The actor may have access to its own motor demand / actuation state and learn or use a local prediction of expected sensory/body consequence.

Unexpected residual is evidence of an external/unmodelled cause.

Do not provide a semantic `OWNER_PUSHED_ME` flag.

### Intrinsic motivation / learning progress

Developmental robotics shows that intrinsic motivation can organize open-ended exploration.

However prediction-error curiosity has known traps such as repeatedly attending to unpredictable/noisy processes.

The old Playground also demonstrated representation-specific artifacts such as wall-clinging and coarse learning-progress regions.

Useful implication:

Do not make raw novelty, prediction error or learning progress the primary heartbeat of O0.

If intrinsic exploration returns later, subordinate it to the organism's real ecology and test it against:
- noisy/unlearnable stimuli;
- wall/geometry traps;
- irrelevant high-variance events;
- repeated safe attractors.

### Empowerment / controllable futures

Empowerment-like objectives formalize how much influence actions have over later sensed states.

This resonates with the earlier Proto-Life hypothesis of viability-constrained expansion of controllable futures.

Useful implication:

Treat controllability as a possible diagnostic or later pressure, not as the first global reward.

A global empowerment objective could become another elegant scalar that replaces life instead of supporting it.

## O0 design premise

The smallest useful O0 is not an empty arena with an autonomous mover.

It is a **micro-ecology** in which one persistent actor has enough world structure for:
- continuing activity;
- partial knowledge;
- obstruction;
- surprise;
- recovery;
- history-dependent later behaviour.

The world should be small enough to understand completely, but rich enough that actor-private history changes what is rational to do.

## Proposed micro-ecology shape

This is a hypothesis, not a frozen map.

### Material layout

Use a spatial area materially larger than E0.0, with:
- at least two connected subspaces/rooms/areas;
- occluding walls or barriers;
- at least one narrow or constrained passage;
- several movable physical objects;
- one recurring source/process;
- one ongoing maintenance/work site;
- space sufficient to observe locomotion over time rather than immediately collide with a boundary.

The map should not be huge.

The purpose is to create qualitatively different local situations.

### Recurring world process

One simple world process should continue without Owner input.

Candidate:

A work/maintenance site periodically consumes or loses a physical material item. A source can produce or expose replacement material elsewhere.

Important:
- the World owns the process;
- the actor does not receive a global "need" bit from the World;
- the actor must discover current state through legal perception/history;
- moving or blocking material should create real consequences rather than phase changes.

This is not intended as the organism's final "job". It is a pressure generator.

## Sensorium

The old radial/primitive perception is not sufficient as the long-term organism substrate.

O0 should begin with a small but coherent sensorium.

### Proprioception

Actor-private:
- body pose/orientation;
- local linear/angular motion;
- current motor demand/actuation;
- contact/touch evidence.

### Vision

Prefer a body-relative field of view with real occlusion over omnidirectional radius checks.

The actor may receive structured percepts for visible entities rather than pixels.

Required properties:
- bearing;
- approximate distance/relative geometry;
- identity continuity after an entity has been encountered;
- occlusion by material world geometry;
- no observation through walls;
- no automatic knowledge of moved objects outside sight.

Do not add "importance", "threat", "affordance" or task labels to percepts.

### Hearing

Optional but useful when the world contains causal audible events.

Keep it spatial/local and event-based.

No semantic omniscience.

## Private history

Preserve the strongest R3 lesson:

World truth != current observation != private memory.

Minimum useful memory:
- last-known object/place relationship;
- last-seen tick or age;
- checked-absence invalidation;
- recent local outcome/contact history;
- recent self motor-demand history.

An object moved while unobserved may correctly remain at its old last-known location until the actor checks and falsifies that belief.

Do not synchronize private memory from World truth.

## Self-caused vs external change

O0 should create a seam for reafference/exafference without semantic labels.

Candidate research path:

`motor demand / actuation -> predicted local sensory consequence -> actual sensory consequence -> residual`

The predictor can initially be:
- analytic/simple;
- learned in shadow;
- or hybrid.

What matters first is the causal question:

Can an actor distinguish "my own movement explains this" from "something changed beyond my current self-prediction" using legal private signals?

Owner perturbation becomes an especially useful falsifier.

## Local Brain decomposition

Do not build one universal agent function.

### Layer 0 — body controller

Transforms bounded motor demand into physical actuation.

E0.0 is the current donor.

Its feel is under-scoped and may later change.

### Layer 1 — short sensorimotor competence

Cheap continuous competence:
- steer;
- stop;
- avoid immediate collision;
- approach reachable local positions;
- maintain body stability.

This layer should not know the organism's high-level "job".

### Layer 2 — ongoing continuation / recovery

Maintains a currently pursued local matter/continuation across many ticks.

Must support:
- persistence;
- material progress;
- failure;
- blocked/uncertain state;
- recovery/search;
- abandonment or redirection when evidence earns it.

A `continuationId` is allowed as bookkeeping but is never evidence that continuation is real.

### Learned ReflexBrain

Not present in first O0.

It should return only after the living substrate creates repeated residual semantic pressure that simple mechanisms do not resolve.

## Owner role

Owner is not the heartbeat.

Owner may:
- move a physical object;
- block a route;
- shove the actor;
- create an unexpected local event;
- temporarily take over body demand;
- release the actor again.

Removing Owner input must return to autonomous organism life.

No special semantic notification should tell the actor what the Owner did.

## Strong O0 falsifiers

### F1 — zero-input life

After launch, with no Owner action, the actor continues one coherent material trajectory for a meaningful period.

FAIL if it becomes inert or only loops a fixed animation.

### F2 — unseen displacement

Actor has privately learned/observed object/source at A.

While actor cannot see it, move it to B.

Expected:
- actor initially acts from its legal last-known history;
- it does not magically route to B;
- checking A can invalidate stale location;
- later discovery of B can change future ordinary behaviour.

### F3 — irrelevant perturbation control

Apply a matched physical perturbation that does not provide evidence about the object's location.

Expected:
- organism can react physically;
- object-location memory must not update as if relocation had been observed.

### F4 — blocked continuation

Materially block the current route or action.

Expected:
- repeated contact/failed progress can alter local continuation/recovery;
- no omniscient path switch;
- no eternal sticky persistence.

### F5 — Owner takeover and release

Temporarily drive the body elsewhere and release it.

Expected:
- organism remains the same persistent actor;
- it must integrate the resulting lived state;
- it may return, recover, reorient or revise based on its private evidence;
- it must not merely snap back to a hidden scripted phase.

### F6 — matched-history washout

Two runs share current visible state but differ in relevant prior private history.

After a washout interval, test ordinary behaviour.

PASS-worthy evidence requires a later behavioural difference causally traceable to actor-private history.

Matched irrelevant-history control should not create the same effect.

## What O0 does NOT have to prove

O0 is not required to prove:
- human-like life;
- consciousness;
- open-ended general intelligence;
- optimal planning;
- learned semantics;
- true curiosity;
- general affordance learning;
- long-term personality.

O0 should prove something narrower and foundational:

> there exists one persistent embodied actor whose ordinary local life is jointly determined by current material reality, bounded private perception, its own history and continuing local commitments — and the Owner can perturb that life without becoming its source.

## Architectural freedom

Persistent Playground v1 is evidence for direction, not a design constraint.

Allowed:
- redesign perception from zero;
- redesign memory from zero;
- replace region tables entirely;
- discard learning-progress arbitration;
- replace movement/control;
- use a different local-brain decomposition;
- choose a materially different world layout;
- introduce a learned forward model while keeping learned semantics absent;
- use temporary authored Local Brain competence if it isolates the right organism phenomenon.

The project should prefer the architecture that best exposes and survives the causal organism question, not the architecture most similar to prior code.

## Immediate next decision

Do not implement until one final red-team is answered:

> Can the proposed micro-ecology and Local Brain satisfy F1-F6 with a disguised finite-state task bot that uses authored coordinates and scripted recovery?

If yes, O0 still needs a better boundary.

If no — because private perception/history and material uncertainty genuinely determine later behaviour — freeze the first O0 implementation contract and build it on the clean pre-O0 foundation.
