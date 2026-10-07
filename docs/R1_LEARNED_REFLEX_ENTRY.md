# R1 — Learned Reflex Entry

Status: **ENTRY HYPOTHESIS · NOT A FROZEN MODEL ARCHITECTURE**

## Why R1 exists

R0 has now falsified four stock-instruction-model readout interfaces as trusted ReflexBrain primitives:

1. arbitrary A–E action choice;
2. semantic-token multi-action choice;
3. proposition + yes/no appraisal;
4. bipolar semantic appraisal.

The failures differ, but converge on the same problem: token-generation/readout behavior is materially entangled with presentation form, instruction-following priors or saturation. Qwen3-0.6B is also far outside the desired fast-reflex latency regime in the measured browser/WebGPU path.

R1 therefore stops asking how to prompt an untrained instruction model into behaving like a reflex model.

## R1 research question

> Can a dedicated learned readout learn stable semantic appraisal relations from actor-private embodied counterfactuals while remaining local, inspectable, zero-authority and materially faster than the R0 generative baselines?

## Supervision principle

Do **not** begin by inventing target probabilities such as `threat=0.83`.

The first supervision substrate is relational:

- state A should score higher than state B on one named dimension; or
- two states must score equally because the actor cannot distinguish them.

Examples:

- addressed request > identical overheard request on social relevance;
- fast close > ordinary silent pass on threat;
- urgent warning > silent pass on interruption pressure;
- hidden unperceived World event == control on every semantic dimension.

This preserves causal meaning without pretending we already know calibrated absolute values.

## Preserved R0 falsifiers

Every learned candidate must keep:

- actor-private input only;
- hidden-World non-leakage;
- same-state deterministic comparison;
- counterfactual family provenance;
- presentation/order/surface permutation tests where the candidate exposes options;
- repeatability;
- runtime latency;
- zero World authority.

R1 may replace the model architecture completely. It may not relax these evidence boundaries to make a model look better.

## Donor findings

### kev

Useful architectural ideas, not authority:

- language backbone used as a feature model rather than a text generator;
- one state prefill can answer multiple typed questions;
- a dedicated pointer/readout head produces option logits directly;
- LoRA adapts the backbone;
- option-isolation can make candidate permutation invariance structural rather than merely hoped for;
- training includes explicit permutation augmentation / symmetric-KL support.

This directly addresses several R0 failure modes.

### NanoJev

Useful methodological ideas:

- train direct conditional decision distributions;
- keep complete question/candidate groups intact;
- distinguish independent gold, observed outcomes and teacher targets;
- audit split/family provenance instead of leaking near-duplicate states across train/test.

## Architecture candidates

R1 deliberately keeps at least two candidates alive:

### A — tiny encoder + learned appraisal head

A small encoder/cross-encoder with five query-conditioned scalar outputs or a shared scalar head.

Purpose:
- establish whether dedicated training can solve the semantic invariance problem at genuinely small runtime cost;
- provide a browser-speed lower bound.

### B — Jev-like LM backbone + dedicated readout

A small base language model plus LoRA/readout head, no output-token decoding.

Purpose:
- test whether richer language representations materially improve embodied semantic generalization after removing generation-interface bias.

Do not assume candidate B wins merely because it resembles Jev.

## First gate

Before training a substantial model:

1. freeze the R1 counterfactual supervision contract;
2. add train/dev/test family grouping rules;
3. create enough causal mutation families that the model cannot pass by memorizing five scene IDs;
4. benchmark candidate backbone inference cost independently of head quality;
5. only then train the first learned readout.

## Promotion criterion

A learned candidate earns further work only if it simultaneously demonstrates:

- correct direction on held-out counterfactual relations;
- hard epistemic equalities remain equal within a declared tolerance;
- materially lower presentation/order sensitivity than R0 stock readouts;
- no debug/World leakage;
- deterministic or bounded-repeat behavior;
- plausible local runtime cost.

Calibration and final action authority remain later questions.
