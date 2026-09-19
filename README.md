# ReflexBrain Lab

Experimental laboratory for a **fast local semantic-reflex layer** for embodied game actors.

## Core research question

> Can a small local model continuously interpret an actor's bounded private state well enough to improve attention, appraisal, local reaction and escalation to deeper cognition without becoming the world authority, memory system, planner or motor controller?

The project is inspired by the System One / Jev pattern, but it is **not a Jev clone** and does not use Jev outputs as training data. The intended result is an independently developed local primitive for Jozzpoly embodied-agent projects.

## Current stage

**R0 — Semantic Shadow Probe.**

The first goal is deliberately narrow:

1. build a tiny deterministic temporal micro-world;
2. keep the reflex system at **zero authority**;
3. expose compact actor-private state;
4. compare a simple rule baseline with replaceable semantic providers;
5. inspect raw semantic signals separately from temporal reflex dynamics;
6. only later plug in a local WebGPU model.

Current bootstrap makes no claim that semantic reflexes improve behavior yet.

## Defended boundaries

- World truth is authoritative and independent from model judgement.
- Actor-private state contains only information the actor can legitimately possess.
- Reflex output is probabilistic evidence / preference, not physical fact or command authority.
- Temporal continuity belongs to an explicit reflex-dynamics layer rather than being hidden inside prompts.
- Large-model cognition remains a separate possible System-2 layer.
- Donor code and ideas are reused selectively; sibling repositories are evidence sources, not automatic architecture authority.

## Research ladder

- **R0 — Semantic Probe:** stock small local model, direct constrained scoring, shadow-only comparison.
- **R1 — Reflex Model:** learn/calibrate a dedicated decision/readout layer if R0 earns it.
- **R2 — Embodied Reflex Brain:** train/evaluate on temporal actor/world episodes and counterfactual families.

The immediate target is not a full NPC. It is a falsifiable semantic-reflex experiment.
