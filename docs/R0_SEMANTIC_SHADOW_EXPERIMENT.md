# R0 — Semantic Shadow Experiment

Status: **ACTIVE FIRST EXPERIMENT**

## Question

Can a fast semantic provider add useful judgement between private perception and local execution without controlling the world?

R0 does not attempt to prove that a stock 0.6–0.8B model is the final ReflexBrain.

## First specimen

One actor has an ongoing ordinary task. A player independently moves through the same tiny world and may become visible or speak. The actor's physical behavior remains controlled by the deterministic baseline while shadow providers evaluate the same actor-private state.

The initial family is deliberately about **attention without player-centrality**:

1. actor is occupied with its own task;
2. player enters peripheral visibility;
3. player approaches;
4. player stops nearby;
5. player addresses the actor with low-stakes speech;
6. player leaves;
7. actor should be able to return attention to its own task.

Counterfactual variants will later change one causal fact at a time: addressed vs overheard speech, known vs unknown actor, approach speed, distance, current urgency, content, visibility and competing events.

## Initial signal surface

Continuous scores in [0, 1]:

- attentionPlayer
- interruptCurrent
- socialRelevance
- novelty
- threat
- deeperCognition

Constrained response distribution:

- continue
- orient
- acknowledge
- investigate
- withdraw

The set is intentionally small and provisional.

## Two distinct outputs

R0 records both:

1. **raw provider output** — instantaneous semantic judgement;
2. **stabilized reflex state** — local temporal dynamics applied to raw scores.

This lets us identify whether failures come from semantic judgement or temporal realization.

## Shadow invariant

Provider evaluation must not mutate:

- World state;
- actor physical state;
- actor observations;
- authoritative baseline action;
- episode timing.

Given the same episode and baseline controller, adding or removing a shadow provider must produce the same authoritative world trace.

## Baseline

A small explicit rule provider exists only as a comparison surface. It is not gold truth.

Its purpose is to expose when a semantic provider merely reproduces trivial proximity/speech heuristics versus adding context-sensitive value.

## First provider path

After the apparatus is qualified, add a browser-local WebGPU provider using a small open-weight model. Initial candidate class: Qwen around 0.6–0.8B with constrained/direct option scoring.

Do not call its softmax values calibrated confidence until calibration evidence exists.

## Evidence required before R0 can be called useful

- deterministic replay;
- shadow non-interference;
- raw vs stabilized signals visible over time;
- per-frame compact private-state inspection;
- side-by-side provider comparison on the same state;
- latency measurement for learned providers;
- counterfactual episode families rather than one happy path;
- at least one material judgement where the semantic provider beats the trivial baseline for an explainable reason.

## Failure conditions

R0 should be considered negative or reframed if:

- model output is mostly equivalent to hand-written proximity rules;
- signals thrash too much to become useful under reasonable dynamics;
- useful judgement needs so much context that local latency becomes unattractive;
- provider output repeatedly depends on information the actor should not know;
- benchmark gains do not translate into better embodied attention/interruption behavior;
- the state compiler becomes a hidden hand-authored policy that does most of the intelligence itself.

## Current implementation tranche

1. deterministic episode/state contract;
2. actor-private state compiler;
3. rule baseline provider;
4. explicit reflex dynamics;
5. shadow trace;
6. non-interference and temporal-stability tests;
7. browser workbench;
8. only then local WebGPU model integration.
