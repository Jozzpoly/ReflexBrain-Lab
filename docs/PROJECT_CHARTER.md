# ReflexBrain Lab — Project Charter

Status: **CURRENT RESEARCH DIRECTION · NOT A FROZEN ARCHITECTURE**

## Why this lab exists

Two sibling projects expose the same missing competence from different directions.

Llm-Live-NPC already defends causal World truth, private perception/memory, local execution, event-driven cognition pressure and a slower LLM judgement layer. Its local fast brain is still semantically thin: routine execution is much stronger than continuous interpretation of what a moment means to the resident.

Companion-Brain-Lab has deep physical and counterfactual evidence about candidate movement and outcomes, but intentionally stops before treating research evidence as a competent teammate decision policy.

ReflexBrain Lab isolates the missing middle layer instead of patching either project prematurely.

## North star

Investigate a reusable local mechanism with this responsibility:

bounded private actor state -> fast semantic appraisal/preferences -> local controller and/or cognition scheduler

Candidate outputs include:

- attention allocation;
- interruption pressure;
- novelty / anomaly;
- social relevance;
- threat / urgency appraisal;
- local response preference;
- whether deeper cognition is warranted.

The layer should be cheap enough to run frequently and local enough that ordinary embodied life does not depend on a cloud round-trip.

## Hard boundaries

### World truth is not inferred truth

A model may judge that a situation is threatening. It may not create a weapon, collision, relationship, injury, ownership fact or physical outcome.

### Private state is not public debug state

Inputs must be derivable from information available to the actor. Hidden World truth must not leak through convenient test fixtures.

### Reflex judgement is not motor authority

R0 is shadow-only. Even later, semantic outputs should normally inform a controller rather than emit unvalidated body mutations.

### Semantic reflex is not long-horizon deliberation

Planning, difficult reinterpretation, dialogue and open-ended semantic invention may remain a slower System-2 concern.

### A model is replaceable

Rule baselines, stock local models, trained heads and future models must be able to consume the same bounded-state contract.

## Key architecture hypothesis

A useful reflex system probably contains at least two separable mechanisms:

1. **Reflex Core** — fast semantic evaluation of current bounded state.
2. **Reflex Dynamics** — explicit local temporal continuity: inertia, decay, hysteresis, habituation, recent focus and interruption persistence.

This is a hypothesis to falsify, not a permanent architecture law.

## What this project is not

Do not turn the lab into:

- a third living-world game;
- a general agent framework;
- a Jev reimplementation for its own sake;
- a chatbot benchmark;
- a full memory / identity system;
- a navigation stack;
- a combat AI project;
- a benchmark-accuracy exercise disconnected from embodied consequences.

## Donor policy

All Jozzpoly repositories may be used as donors, but reuse must be selective.

Strong donor categories:

- Llm-Live-NPC: private perception, epistemic separation, event/cognition seams, resident-life pressure cases;
- Companion-Brain-Lab: shadow mode, first-divergence evidence, observer non-interference, counterfactual/metamorphic methodology;
- other game repositories: lightweight browser presentation, input, world or test apparatus when genuinely cheaper than rebuilding.

Do not inherit a sibling architecture merely because it is already defended there.

## Research ladder

### R0 — Semantic Shadow Probe

Determine whether semantic information already present in a small stock local language model can produce useful constrained reflex signals from compact actor-private state.

No training required. No model authority.

### R1 — Learned Reflex Readout

Only if R0 is materially useful, test LoRA, dedicated decision heads and calibration approaches against direct token/logit scoring.

### R2 — Embodied Reflex Brain

Only if R1/R0 justify it, develop temporal datasets built from actor-world episodes, counterfactual mutations and causal invariants rather than isolated NLP classification rows.

## Promotion rule

A higher-complexity mechanism is earned only if it improves at least one material property under embodied tests:

- attention quality;
- interruption judgement;
- continuity / anti-thrashing;
- non-player-centric behavior;
- reaction latency;
- escalation quality;
- generalization to counterfactual variants;
- local cost / compute viability;
- causal legibility.

Accuracy alone is insufficient.

## Current next move

Build R0 as a tiny deterministic temporal micro-world with a rule baseline and a provider seam. The first learned provider is added only after shadow non-interference and actor-private state are inspectable and testable.
