# Pre-O0 N7 — P1 Tracklet Authority and Error Scope — 2026-10-06

Status: **V1 CONVERGENCE DECISION · TEMPORARY PERCEPTUAL CONTINUITY ONLY**

## Purpose

Define a synthetic perception scaffold that is useful enough for Local Brain research without becoming a hidden object database.

P1 is not "object perception".

It is only:

> temporary actor-private continuity of currently/recently visible physical sensory structure.

---

# Authority boundary

## P0 sensory substrate

Derived from current body/world geometry and actor sensor pose.

May expose:
- coarse egocentric bearing;
- coarse/approximate range;
- angular/visible extent;
- local relative motion estimate;
- appearance signature;
- occlusion;
- proprioception/contact separately.

No World ID.

## P1 tracklet

A temporary token associated with a locally coherent P0 percept over adjacent ticks.

May expose:
- `trackToken`;
- current P0 evidence;
- track age;
- recent local motion continuity;
- local confidence that **current perceptual continuity** holds.

P1 may not expose:
- World entity ID;
- semantic object kind;
- ownership;
- mass;
- usefulness;
- target/dock role;
- hidden/off-screen position;
- persistent identity across arbitrary occlusion.

---

# Token lifetime

## visible continuity

While perceptual evidence remains locally consistent:
same track token may persist.

## short partial occlusion

A tiny implementation grace is allowed only to prevent one-frame rendering/sampling flicker.

It must not become semantic hidden tracking.

## full occlusion / evidence loss

Track expires.

After meaningful loss of sensory evidence:
reappearance creates a **new current track token**.

Any claim that it is "the same thing as before" belongs to actor-private memory/hypothesis above P1.

This is the key anti-object-database rule.

---

# Association cues

Allowed local cues:

- appearance signature similarity;
- predicted short-horizon relative motion;
- spatial continuity;
- visible shape/extent continuity.

Forbidden:
- true World entity pointer;
- hidden trajectory;
- future position oracle;
- semantic role.

The tracker can be deterministic.

It need not imitate computer-vision failure distributions.

But it must be scoped honestly.

---

# Appearance signature

For first substrate, synthetic appearance may be intentionally simple.

Examples:
- coarse color/material visual channel;
- coarse visible shape class;
- approximate apparent size.

Important:

Appearance signature is **perceptual evidence**, not semantic kind.

A visually marked T0-D target can therefore be distinctive without actor receiving:
`role = target`.

The authored concern can bind to a signature/hypothesis.

---

# Error model

Do not invent noise for realism.

Require only the following meaningful error/uncertainty cases:

## PE1 — occlusion loss

Track ends when evidence disappears.

## PE2 — ambiguous similar percepts

If two current percepts are too similar and cross/overlap, association may be uncertain or restart.

Do not use World ID to make it perfect.

## PE3 — hidden swap

Two visually identical bodies swap while unseen.

P1 has no mechanism to know.

Correct outcome:
new tracks on reappearance.

## PE4 — changing appearance

If a body's visible signature changes enough, continuity can weaken/break.

No hidden identity rescue.

These are enough to prevent ontological leakage.

---

# Relation to T0-D concern

Concern must not store:
`targetWorldId`.

Instead it may bind to a private historical hypothesis such as:

- distinctive appearance signature;
- prior track episode;
- prior relation to dock;
- last-known private evidence.

When a new current track appears after occlusion:

Actor-side memory may judge:
- plausible match;
- uncertain;
- unrelated.

For first O-CTRL calibration, make the concern target **perceptually distinctive enough** that re-association is usually easy.

Reason:
O-CTRL is not an identity-disambiguation experiment.

Later controls can add visually identical distractors.

---

# Relation to dock / landmark

A static dock/landmark need not be represented as a dynamic object track if it is better modeled as persistent local sensory geometry/appearance.

Still:
- no hidden global position;
- no semantic `dock=true` in perception.

Concern can be authored to recognize a distinctive landmark signature.

Current visibility/history determine believed relation.

---

# Researcher mapping

Microscope may record:

`trackToken -> WorldEntityId`

for causal analysis.

This mapping is strictly researcher-only.

It enables:
- tracking accuracy audit;
- hidden-swap verification;
- first-divergence analysis.

No actor subsystem may access it.

---

# Tracklet ablation

P1 must remain replaceable.

Required research modes:

### mode P1
Local Brain receives temporary tracks.

### ablation P0
Local Brain receives only lower-level current sensory evidence.

Purpose:
determine how much competence is supplied by tracklet scaffold.

Do not necessarily make P0 support full O-CTRL behavior.
The comparison is diagnostic.

---

# Why P1 is acceptable

It deliberately gives the actor one bounded competence:

> short-term perceptual continuity while evidence is continuously available.

It does **not** give:
- object permanence;
- semantic identity;
- long-term memory;
- affordance;
- relevance;
- World truth.

This is a tractable boundary between raw sensing and cognition.

---

# Reject conditions

P1 should be reconsidered if:

- Local Brain depends on token persistence through long occlusion;
- tracker requires World ID for stability;
- appearance signature effectively encodes semantic role;
- re-identification after absence is perfect without private reasoning/history;
- policy treats track token as permanent object identity.

---

# Current decision

Promote P1 with the narrow authority above as the first perceptual scaffold candidate.

Long-term identity belongs to private memory/hypothesis.

Implementation remains paused until C-A and O-CTRL qualification boundaries are equally scoped.
