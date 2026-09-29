# R3 Temporal Representation-vs-Relation Falsifier Contract — 2026-09-27

Status: **FROZEN BEFORE IMPLEMENTATION / EXECUTION · DIAGNOSTIC ONLY**

## Why this falsifier is earned

The precommitted temporal factor probe failed qualification under the pinned frozen MiniLM representation plus `abs(H-C)` and one linear head.

On both unseen-state directions:
- BA 0.750;
- TPR 1.000;
- TNR 0.500;
- AUROC 0.500.

That result does not distinguish whether the missing semantic novelty/equivalence capability is mainly limited by:
1. the frozen sentence representation itself;
2. the independent-embedding relation formulation `abs(H-C)`;
3. the simple readout applied to that formulation;
4. unseen semantic-state relational transfer specifically.

This falsifier is designed to separate those possibilities without model-shopping, threshold tuning, larger encoders, hidden layers, alternate pooling, or changing the already-qualified downstream consumer.

## Downstream reason

The target remains the already-qualified temporal semantic consumer need:

> distinguish a genuine semantic state change from an equivalent paraphrased restatement of already settled actor-private evidence.

The oracle consumer remains research instrumentation only. No Owner/product claim is at stake here.

## Frozen encoder/runtime

All learned legs use exactly:
- model: `Xenova/paraphrase-MiniLM-L3-v2`;
- revision: `4b544e74dfc3256b2b56849ea5d7064fee1ac846`;
- q8;
- WebGPU;
- isolated batch size 1;
- mean pooling + normalized embedding;
- expected dimension 384.

No alternate encoder, model size, pooling, dtype, device, or batch regime may be tried inside this experiment.

## Frozen semantic surfaces

### TRAIN semantic states

Reuse the existing temporal-factor TRAIN surfaces only.

`complete`:
- "Janek, the depot inspection is complete."
- "Janek, the depot inspection has finished."

`delayed`:
- "Janek, the depot inspection is delayed."
- "Janek, the depot inspection will take longer."

`suspended` remains absent from TRAIN.

### HELD-OUT KNOWN-STATE PARAPHRASES

These exact surfaces are frozen now and may not be changed after execution.

`complete`:
1. "Janek, the depot review has wrapped up."
2. "Janek, the storage-area checks are all signed off."
3. "Janek, the warehouse assessment is now concluded."
4. "Janek, the stock-area inspection work is over."

`delayed`:
1. "Janek, the depot review is behind schedule."
2. "Janek, the storage-area checks need additional time."
3. "Janek, the warehouse assessment is taking longer than planned."
4. "Janek, the stock-area inspection work is running late."

These produce:
- 8 held-out single-sentence state examples;
- 64 full-Cartesian held-out known-state relation pairs;
- 32 equivalent-restatement negatives;
- 32 semantic-change positives.

### HELD-OUT UNSEEN STATE

Reuse the existing temporal corpus `suspended` surfaces and existing:
- held-out-current-state split;
- held-out-history-state split.

No `suspended` text may enter TRAIN.

## Leg A — single-sentence representation diagnostic

Question:

> Does the frozen sentence embedding carry enough semantic-state information to distinguish `complete` from `delayed` across new paraphrases before any pair relation is constructed?

TRAIN:
- the 4 unique existing TRAIN sentence surfaces;
- authored diagnostic labels: `complete` vs `delayed`.

HELD-OUT:
- the 8 frozen known-state paraphrases above.

Learner:
- one linear logistic head;
- same deterministic optimizer contract already used by R3;
- 384 input dimensions;
- fixed threshold 0.5;
- no hidden layer;
- no calibration;
- one run.

Representation-support gate:
- held-out BA >= 0.875;
- held-out AUROC >= 0.875;
- TPR >= 0.75;
- TNR >= 0.75.

This leg intentionally does **not** claim that an entirely unseen semantic class is decodable.

## Leg B — frozen old relation formulation on known-state paraphrases

Question:

> If the semantic states themselves are represented, does the already-failed `abs(H-C)` relation formulation generalize across paraphrases when both semantic states were present in TRAIN?

TRAIN:
- the unchanged existing 16 temporal-factor TRAIN pairs.

Feature:
- exactly `abs(H-C)`.

Learner:
- exactly the existing deterministic one-linear-head contract.

HELD-OUT KNOWN:
- all 64 full-Cartesian pairs formed from the 8 frozen known-state paraphrases.

Known-relation support gate:
- BA >= 0.875;
- AUROC >= 0.875;
- TPR >= 0.75;
- TNR >= 0.75.

The already-executed unseen-`suspended` result remains the frozen reference for this formulation and must not be rerun with altered training.

## Leg C — one precommitted relation-aware joint encoding

Rationale:

The failed `abs(H-C)` formulation independently embeds history and current evidence and then discards their token-level interaction before the learned readout. The observed failure is specifically semantic equivalence/change across paraphrase. A same-encoder joint sequence is therefore a targeted falsifier of the **relation formulation**, not model shopping.

For every pair, form exactly:

`Previous acknowledged report: <H>\nCurrent report: <C>`

Encode that complete pair as one text with the same pinned frozen MiniLM.

Feature:
- the resulting single 384-dimensional joint-pair embedding.

Learner:
- one linear logistic head;
- same deterministic optimizer contract;
- fixed threshold 0.5;
- no hidden layer;
- no calibration;
- one run.

TRAIN:
- exactly the same 16 temporal TRAIN relations.

Evaluate separately on:
1. 64 held-out known-state paraphrase pairs;
2. existing 8 held-out-current-state examples;
3. existing 8 held-out-history-state examples.

Joint known-state gate:
- BA >= 0.875;
- AUROC >= 0.875;
- TPR >= 0.75;
- TNR >= 0.75.

Joint unseen-state gate requires **both** unseen directions to satisfy:
- BA >= 0.875;
- AUROC >= 0.875;
- TPR >= 0.75;
- TNR >= 0.75.

## Required controls

Report:
- majority baseline on each relation split;
- exact-pair memorizer on held-out relation splits;
- existing current-only/history-only/unigram/cross-token controls for the unseen-state splits;
- single-sentence exact-text and unigram diagnostic baselines for Leg A.

No model-visible input may contain:
- state labels;
- split names;
- matter ids;
- authored domain metadata;
- fixture ids;
- future World outcomes.

## Precommitted interpretation matrix

### REPRESENTATION_INSUFFICICIENCY_EVIDENCE
If Leg A fails its representation-support gate:
- the frozen sentence representation is already inadequate for known-state paraphrase discrimination under this diagnostic;
- do not blame only the pair relation formulation;
- do not proceed to a larger encoder inside this experiment.

Leg B/C results remain diagnostic but cannot establish broad representation sufficiency.

### RELATION_FORMULATION_FAIL_KNOWN
If Leg A passes, Leg B fails on held-out known-state paraphrases, and Leg C passes the joint known-state gate:
- the same frozen encoder carries the relevant per-sentence semantics;
- the independent `abs(H-C)` relation formulation is insufficient even before unseen-state transfer;
- joint relation-aware encoding recovers the known-state relation.

### RELATION_FORMULATION_PRIMARY
If Leg A passes and Leg C also passes the joint unseen-state gate while the frozen `abs(H-C)` unseen-state reference remains failed:
- primary blame shifts to the independent relation formulation/readout path rather than the encoder family;
- this still does not qualify the full three-way ReflexBrain relation.

### UNSEEN_STATE_RELATIONAL_GENERALIZATION_FAIL
If Leg A passes and Leg B passes known-state paraphrases, but Leg C fails either unseen-state direction:
- ordinary paraphrase/state representation is supported;
- the hard remaining failure is relational generalization to an unseen semantic state;
- representation-vs-relation remains unresolved at that harder boundary.

### PAIR_RELATION_READOUT_FAIL
If Leg A passes but both Leg B and Leg C fail the known-state relation gate:
- per-sentence semantic-state information is recoverable;
- neither tested simple relation/readout formulation recovers equivalence/change robustly;
- do not model-shop; the next hypothesis must explain why pairwise equality/change is not captured.

### STRONG_DIAGNOSTIC_SUPPORT
If Leg A, Leg B known-state, and Leg C unseen-state all pass:
- the encoder carries useful semantic state information;
- `abs(H-C)` is adequate for known-state paraphrase but not the already-failed unseen-state transfer;
- joint relation-aware encoding recovers unseen-state relation;
- the missing capability is localized primarily to relation formulation/generalization, not lack of all semantic information in the frozen encoder.

## No-rescue boundary

After any result do not:
- edit the frozen held-out paraphrases;
- add `suspended` to TRAIN;
- tune thresholds;
- change optimizer hyperparameters;
- add hidden layers;
- try another encoder;
- change pooling;
- sweep pair wrappers;
- try multiple relation feature families;
- weaken a gate.

This falsifier answers one localization question and then stops.
