# Pre-O0 Memory and Private Continuity Deep Dive — 2026-10-06

Status: **FOUNDATIONAL MEMORY AUDIT · R3 CHECKED-ABSENCE PRINCIPLE PRESERVED, SYMBOLIC OBJECT MEMORY NOT PROMOTED**

## Core question

What is the minimal private state that allows lived history to matter without giving the actor a hand-authored World database?

---

# 1. Separate memory functions

## episodic sensorimotor history

Recent sequence of:
- private sensory evidence;
- motor demand;
- proprioception/contact;
- local outcomes.

No object ontology required.

Useful for:
- contingency learning;
- self/world prediction;
- temporal causality.

## perceptual continuity memory

Recent tracklets:
- "this percept seems continuous with recent percept X".

Short horizon.

Useful for:
- tracking moving things;
- immediate occlusion.

## relational/entity memory

Longer-lived hypothesis:
- encountered something;
- last known relation/location;
- last seen;
- confidence/staleness.

Useful for:
- object permanence;
- reacquisition;
- checked absence.

Risk:
semantic object database.

## spatial memory

Relations between encountered places/passages/landmarks.

Possible forms:
- egocentric traces;
- topological graph;
- local metric map;
- learned latent.

Risk:
hidden navmesh.

## procedural memory

Learned action/skill/body contingency.

Examples:
- turning response;
- pushing effect;
- interaction routine.

This may live in controller parameters rather than explicit memory records.

## concern/habit memory

Persistent internal organization:
- ongoing commitment;
- current habit;
- unresolved issue.

Risk:
task phases disguised as memory.

---

# 2. Memory writes must have provenance

Private memory may update from:

- current sensory evidence;
- proprioception;
- action attempt/outcome;
- internal state change;
- derived relation between private signals.

It must not update directly because:
- World entity moved;
- debug truth changed;
- Owner performed named action.

Microscope should be able to trace every memory write to private evidence/history.

---

# 3. Checked absence as general principle

R3's strongest memory donor is not its data structure.

The principle is:

> a previously supported private hypothesis can lose support when the actor actively obtains evidence that should have revealed it but does not.

Examples:

- object expected at location, actor checks, absent;
- passage remembered open, actor arrives, blocked;
- other actor expected nearby, no longer observed after search;
- interaction expected to produce effect, repeated action no longer does.

This is **belief revision through absence of expected evidence**.

That is broader than object memory.

---

# 4. Memory confidence / staleness

Do we need explicit confidence?

Possibilities:

### M-A — timestamp only
older memory is older; policy interprets age.

### M-B — deterministic decay
confidence decreases with time.

Risk:
arbitrary half-life.

### M-C — evidence-based confidence
confidence changes through:
- repeated confirmation;
- contradiction;
- occlusion duration;
- causal stability.

### M-D — no explicit confidence
recurrent/latent state handles uncertainty.

Current preference:
do not freeze confidence scalar.

Preserve timestamps/provenance first.

---

# 5. Spatial frame problem

A remembered location can be represented as:

### world coordinate
easy, dangerous.

### actor-local coordinate at observation time
needs integration to use later.

### landmark-relative relation
more private/relational.

### topological relation
"in area near landmark A", "through passage B".

### learned latent
future research.

Absolute World coordinates should remain debug truth unless an actor-private localization mechanism constructs an equivalent estimate.

---

# 6. Self-motion and localization

If actor integrates its own motion:
- proprioception + motor outcome can update relative position estimate.

Potential errors:
- slip;
- collision;
- external shove;
- changed body dynamics.

This makes self/world prediction and memory interact naturally.

Question:
do we want localization drift in first organism?

Probably not by default.

But we should avoid giving perfect global pose if it silently removes the need for self-motion integration.

Possible compromise:
stable actor-private local coordinate initialized at run start and updated from actual proprioceptive body motion, not World teleport truth.

Still a scaffold.

---

# 7. Memory capacity

Unlimited perfect memory can create another hidden superpower.

But arbitrary forgetting can create artificial difficulty.

Candidate early rule:
- bounded recent episodic buffer;
- small set of persistent relational hypotheses;
- explicit provenance/timestamps.

Do not optimize capacity yet.

Use capacity pressure later if relevant.

---

# 8. Identity ambiguity

World identity and remembered identity must be separate.

Tests:

## MI1 — identical swap
Two visually identical entities swap behind occlusion.

Actor should not magically know.

## MI2 — continuous motion
One entity remains continuously visible while moving.

Track continuity should remain strong.

## MI3 — long occlusion
Reappearing matching entity may be uncertain.

## MI4 — physical signature
Interaction history differs despite similar appearance.

Can later memory use lawful differences?

These tests determine whether symbolic stable IDs are too strong.

---

# 9. History dependence falsifiers

## MH1 — same observation, different relevant history

Two runs present same current sensory evidence.

One actor has previously learned that interaction is blocked/heavy/changed.

Behavior may diverge.

## MH2 — irrelevant history control

Different past event with no causal relation.

Behavior should not diverge in the same way.

## MH3 — memory ablation

Researcher removes specific private memory while preserving World/current perception.

Does predicted behavior change at the correct first-divergence plane?

## MH4 — stale memory

World changes unseen.

Actor acts on old memory until legal contradiction.

## MH5 — false memory / mistaken association

If perception tracking can be wrong, can actor later correct?

Important long-term test.

---

# 10. Memory and ReflexBrain

Future ReflexBrain should not own factual memory by default.

It may help interpret:
- which past interaction is analogous;
- whether current event changes significance of a memory;
- whether ambiguous evidence resolves an old concern.

But factual private history should exist independently.

This preserves:
memory != semantic appraisal.

---

# 11. Candidate minimal private memory stack

Not frozen:

### layer H0 — raw recent history
sensor + motor + body + contact + event time.

### layer H1 — temporary perceptual tracks
local continuity while evidence supports it.

### layer H2 — sparse relational hypotheses
only for repeated/relevant encountered entities/landmarks.

No semantic importance field.

### layer H3 — procedural/model parameters
sensorimotor expectations.

This is likely enough for foundational research without a full cognitive memory system.

---

# 12. Current conclusion

Preserve from R3:
- private memory separated from World;
- last-known/stale state;
- checked-absence revision;
- causal provenance.

Re-open:
- object-centric ontology;
- stable IDs;
- exact locations;
- global actor map;
- confidence scalar;
- universal memory schema.

The central requirement is:

> private history must be capable of being incomplete, stale, mistaken, corrected and causally relevant to later ordinary behavior.
