# R3 Temporal Project-Then-Compare Diagnostic Contract — 2026-09-27

Status: **FROZEN BEFORE IMPLEMENTATION / EXECUTION · PRIVILEGED MECHANISTIC DIAGNOSTIC ONLY**

## Why this diagnostic is earned

The current temporal frontier contains an apparent asymmetry:

1. a direct per-sentence linear probe on the pinned frozen MiniLM representation recovers the known semantic state distinction `complete` vs `delayed` across held-out paraphrases:
   - BA 0.875;
   - AUROC 0.9375;
   - PASS;

2. three simple pair/readout routes fail the equality/change relation on held-out paraphrases of those same known states:
   - `abs(H-C)` + linear head;
   - one joint-pair sentence embedding + linear head;
   - `[abs(H-C), H⊙C]` + linear head.

The latest frozen symmetric interaction result is:

**SYMMETRIC_INTERACTION_FAIL_KNOWN**

Simple fixed pair-feature permutation is now closed.

The next architecture question is therefore not “which feature combination?” but:

> Is the useful semantic direction only exposed after a learned semantic projection of each sentence, such that temporal comparison should happen in that projected actor-relevant space rather than in the generic frozen embedding coordinates?

This diagnostic tests an intentionally privileged upper bound before any pair-supervised learned-projection architecture is allowed.

## Privileged boundary

The first projection stage is trained from authored semantic state labels:
- `complete`;
- `delayed`.

That supervision is **not** available as ordinary ReflexBrain authority and must not be presented as a learned actor-relative solution.

This diagnostic may only answer whether **project-then-compare is mechanistically plausible** under the pinned representation.

No result from this diagnostic qualifies:
- learned ReflexBrain competence;
- acceptable supervision provenance;
- the full purpose × history × current relation;
- Owner/product life or usefulness.

## Frozen encoder/runtime

Use exactly:
- model: `Xenova/paraphrase-MiniLM-L3-v2`;
- revision: `4b544e74dfc3256b2b56849ea5d7064fee1ac846`;
- q8;
- WebGPU;
- isolated batch size 1;
- mean pooling + normalized embedding;
- 384 dimensions.

No alternate encoder, model size, pooling, dtype, device or batch regime.

## Stage 1 — frozen privileged state projection

Reuse exactly the Leg A training/evaluation construction from:
`docs/R3_TEMPORAL_REPRESENTATION_RELATION_FALSIFIER_CONTRACT_2026-09-27.md`

TRAIN:
- exactly 4 unique existing TRAIN sentence surfaces;
- 2 `complete`;
- 2 `delayed`;
- authored diagnostic label `complete = true`, `delayed = false`.

State projection learner:
- exactly the existing deterministic one-linear-head contract;
- 384 input dimensions;
- 1200 iterations;
- base learning rate 0.2;
- L2 0.02;
- threshold 0.5;
- no hidden layer;
- no calibration;
- one training run.

HELD-OUT STATE:
- exactly the 8 frozen known-state paraphrases from the representation-vs-relation falsifier.

State projection gate must reproduce the original bounded support:
- BA >= 0.875;
- AUROC >= 0.875;
- TPR >= 0.75;
- TNR >= 0.75.

For every sentence embedding `E`, define the projected scalar coordinate exactly as:

`z(E) = P(complete | E)`

where the probability is returned by the frozen Stage-1 logistic head.

Do not use:
- hard predicted state;
- raw logit;
- a second projection;
- more than one scalar;
- authored state ids at pair-comparison time.

## Stage 2 — frozen projected temporal relation

Reuse exactly:
- the existing 16 temporal relation TRAIN pairs;
- the existing 64 held-out known-state paraphrase relation pairs;
- the existing 8 held-out-current-state examples;
- the existing 8 held-out-history-state examples.

No text, labels, splits or states may change.

For every pair `H,C`, form exactly one scalar relation feature:

`d = abs(z(H) - z(C))`

Train exactly one existing deterministic linear logistic head on the 16 relation TRAIN examples:
- 1 input dimension;
- 1200 iterations;
- base learning rate 0.2;
- L2 0.02;
- fixed threshold 0.5;
- class weighting unchanged;
- zero hidden layers;
- no calibration;
- one run.

The Stage-2 head receives only `d` and the temporal relation label.
It does not receive semantic state labels, raw embeddings, matter ids, statements, split ids or authored metadata.

## Required reporting

Report:
- Stage-1 TRAIN and held-out state metrics/AUROC;
- Stage-1 mean `z` for held-out `complete` and `delayed`;
- Stage-2 TRAIN metrics/AUROC;
- Stage-2 held-out known BA/TPR/TNR/AUROC;
- Stage-2 held-out current BA/TPR/TNR/AUROC;
- Stage-2 held-out history BA/TPR/TNR/AUROC;
- mean relation feature `d` for positive and negative examples in each split;
- existing majority/exact/simple shortcut controls;
- frozen previous references.

## Relation gates

Known-state relation gate:
- BA >= 0.875;
- AUROC >= 0.875;
- TPR >= 0.75;
- TNR >= 0.75.

Unseen-state relation gate requires both unseen directions to each satisfy:
- BA >= 0.875;
- AUROC >= 0.875;
- TPR >= 0.75;
- TNR >= 0.75.

## Precommitted interpretation

### PRIVILEGED_STATE_PROJECTION_REPRO_FAIL

If Stage 1 fails its frozen representation-support gate:
- the diagnostic apparatus does not reproduce the prerequisite bounded sentence-level result;
- do not interpret Stage 2 architecturally;
- stop and inspect provenance/runtime, not model capacity.

### PRIVILEGED_PROJECT_THEN_COMPARE_FAIL_KNOWN

If Stage 1 passes but the Stage-2 known-state relation gate fails:
- even an explicitly supervised semantic state projection does not robustly turn the pinned representation into the required known-state equality/change relation under this scalar project-then-compare construction;
- the current Leg A PASS is insufficient evidence for the proposed projected-relation architecture;
- do not build a pair-supervised learned projection as the automatic next rescue;
- reconsider representation, target granularity and temporal objective before more model work.

### PRIVILEGED_PROJECTED_KNOWN_SUPPORT_UNSEEN_FAIL

If Stage 1 and the known-state relation gate pass but either unseen-state relation gate fails:
- project-then-compare is mechanistically supported for known semantic states;
- transfer of that relation to an unseen semantic state remains unqualified;
- this earns investigation of how an actor-relative projection could be learned from legitimate supervision, but not a full three-way learner.

### PRIVILEGED_PROJECTED_TEMPORAL_SUPPORT

If Stage 1, the known-state relation gate and both unseen-state gates pass:
- the pinned representation can support the isolated temporal relation when each sentence is first mapped through the privileged semantic projection;
- the failure of fixed pair operators is localized to operating in the wrong relation space/order of operations;
- this strongly motivates, but does not qualify, a future actor-relative learned projection trained without authored state labels.

## No-rescue boundary

After seeing the result do not:
- replace probabilities with logits;
- hard-decode states;
- add projection dimensions;
- change the Stage-1 labels;
- add `suspended` to Stage-1 or relation TRAIN;
- tune either threshold;
- change optimizer hyperparameters;
- append raw embeddings or pair features;
- add hidden layers;
- fine-tune the encoder;
- try another encoder;
- change pooling;
- weaken gates;
- rerun alternate project-then-compare variants.

This diagnostic answers one mechanistic question and stops.
