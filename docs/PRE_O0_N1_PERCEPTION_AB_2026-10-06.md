# Pre-O0 N1 — Perception Abstraction Paper A/B — 2026-10-06

Status: **CONVERGENCE COMPARISON · FIRST CANDIDATE MAY BE SELECTED, STILL REVERSIBLE**

## Compared levels

### P0 — local geometric evidence only

Actor receives:
- egocentric obstacle/depth samples;
- coarse motion/optic-flow-like evidence;
- proprioception;
- contact.

No percept tokens or object identity.

### P1 — temporary perceptual tracklets

P0 plus:
- temporary actor-private track token for a locally coherent perceptual structure;
- approximate relative pose/motion;
- simple visible physical signature;
- continuity only while evidence supports it;
- token may be lost/split/merged under occlusion/ambiguity.

No World ID.
No semantic role/kind.

### P2 — stable structured objects

Actor receives:
- stable object identity;
- object kind/class;
- bearing/distance;
- persistent identity across occlusion.

This resembles R3-style object percepts/memory.

---

# Scenario PA1 — continuous visible motion

One physical body moves continuously across field of view.

### P0
Actor sees changing local geometry/motion but must infer all continuity through raw temporal pattern.

Value:
purest sensorimotor evidence.

Cost:
every higher competence must solve tracking.

### P1
Track continuity is available while evidence remains coherent.

Value:
ordinary Local Brain can reason about "that currently moving thing" without World identity.

### P2
Trivial.

Risk:
gives identity stronger than evidence warrants.

Verdict:
P1 offers strongest tractability/epistemic honesty balance.

---

# Scenario PA2 — short occlusion

Body passes behind wall and reappears.

### P0
No persistent identity.
History may still predict expected sensory return.

Scientifically rich but expensive.

### P1
Track can:
- expire;
- remain tentative;
- create a new token on reappearance;
- allow a higher memory layer to hypothesize continuity.

This exposes the right uncertainty.

### P2
Stable object ID silently solves the problem.

Verdict:
P2 leaks object permanence.
P1 exposes it as a memory/history question.

---

# Scenario PA3 — identical hidden swap

Two visually identical bodies swap while both are occluded.

### P0
No identity claim; correct ignorance.

### P1
Track associations may become ambiguous/wrong.

This is useful:
actor-private identity can diverge from World identity.

### P2
World ID makes swap magically visible to cognition even if perceptual evidence is identical.

Verdict:
P2 fails private epistemic integrity unless ID is explicitly declared a perception oracle.

---

# Scenario PA4 — visually similar, physically different mass

Actor can see two similar bodies.

One is light, one heavy.

### P0
No object continuity makes cross-interaction learning hard but possible via local episode history.

### P1
Actor can associate interaction history with a track/hypothesis without being told mass.

This creates body-relative affordance learning.

### P2
If `kind` correlates with mass, ontology leaks.
If not, stable identity still simplifies history substantially.

Verdict:
P1 best preserves the desired perception->interaction->history chain.

---

# Scenario PA5 — hidden relocation

Previously encountered object moves while unseen.

### P0
Need spatial/episodic memory independent of object identity.
Hard but principled.

### P1
Long-term memory may reference a historical perceptual hypothesis derived from prior track.
Current track absent.
Checked absence can invalidate expected relation.

### P2
Object table naturally stores last-known location, but risks becoming mini World database.

Verdict:
P1 supports checked-absence without World ID if memory layer is carefully separated.

---

# Scenario PA6 — independent moving mechanism

A mechanism changes topology.

### P0
Actor sees geometry only.
May learn action-consequence/temporal relation.

### P1
Can maintain short-term continuity of moving physical part.

### P2
Semantic class such as `gate` can pre-solve expected interaction.

Verdict:
P1 preferred.

---

# Scenario PA7 — ordinary locomotion

Actor needs not hit walls constantly.

### P0
Sufficient for low-level navigation.

### P1
Adds no harm if track layer is separate.

### P2
Unnecessary.

Verdict:
P0 remains excellent low-level substrate under P1.

---

# Complexity / research debt

## P0 cost

Pros:
- minimal ontology;
- clean grounding.

Cons:
- forces organism project to solve:
  tracking;
  identity;
  relational memory;
  perhaps scene understanding;
  before reaching ReflexBrain pressure.

Risk:
ReflexBrain Lab becomes perception lab.

## P2 cost

Pros:
- easy cognition;
- easy debugging.

Cons:
- pre-solves:
  identity;
  object permanence;
  category;
  some affordance distinctions.

Risk:
future "intelligence" is carried by perception API.

## P1 cost

Pros:
- enough local continuity for ordinary competence;
- no permanent World identity;
- uncertainty/occlusion remain real;
- stable abstraction boundary for later memory.

Cons:
- synthetic tracker is itself authored competence;
- tracker errors require honest modeling;
- appearance signature design can leak category.

Risk:
tracker becomes hidden object recognizer.

---

# P1 authority boundary

If selected, tracklet may contain only properties recoverable from current/recent sensory structure:

- temporary token;
- current egocentric bearing/range estimate;
- relative motion estimate;
- visible extent/shape signature;
- simple appearance signature;
- continuity confidence only if based on perceptual evidence.

Forbidden:
- World entity ID;
- semantic role;
- mass;
- ownership;
- usefulness;
- source/site identity;
- off-screen current position.

Microscope may map trackToken -> World entity for analysis only.

---

# Long-term identity

Long-term remembered identity belongs above tracklet layer.

Possible memory hypothesis:
`memoryEntity: H7`
was once associated with track T3.

After occlusion:
H7 remains private history;
there is no current track.

Reappearance may:
- support H7 association;
- remain ambiguous;
- create H8.

This gives object permanence without pretending it is infallible.

---

# Paper verdict

For the **first serious organism candidate**, P1 is currently the highest-information / lowest-contamination choice:

> low-level body-relative synthetic physical sensing + temporary perceptual tracklets, with long-term identity remaining a private memory hypothesis rather than World truth.

This is a **V1 candidate**, not an ontology claim.

P0 remains the underlying sensor substrate and falsifier.
P2 remains a useful perception-oracle control.

## Reversibility requirement

Implementation, when it eventually happens, should make P1 removable:

`World physics -> P0 sensory evidence -> [P1 tracklet scaffold] -> private memory/Local Brain`

A later experiment can bypass P1 or replace it with learned perception without rewriting World/body authority.
