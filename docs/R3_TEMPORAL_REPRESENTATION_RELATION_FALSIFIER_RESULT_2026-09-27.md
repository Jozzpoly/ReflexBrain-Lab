# R3 Temporal Representation-vs-Relation Falsifier Result — 2026-09-27

Status: **PAIR_RELATION_READOUT_FAIL · DIAGNOSTIC LOCALIZATION ONLY · NO PROMOTION**

## Execution provenance

Frozen contract:
`docs/R3_TEMPORAL_REPRESENTATION_RELATION_FALSIFIER_CONTRACT_2026-09-27.md`

Implementation/deploy evidence head:
`3622a260029229f8c279f747b7e1721ec21c0be7`

Qualified branch head immediately before execution:
`0114da2e7a048ddf5c5472f0bf366684c8ddca15`

Real execution:
- Opera browser;
- WebGPU;
- page `/r3-temporal-representation-relation-falsifier.html`;
- exactly one page-load execution;
- status `PASS_EXECUTION`;
- no reload, threshold tuning, text/split edits, optimizer changes, alternate wrapper/model, hidden layer, pooling change or second run.

Pinned encoder/runtime:
- `Xenova/paraphrase-MiniLM-L3-v2`;
- revision `4b544e74dfc3256b2b56849ea5d7064fee1ac846`;
- q8;
- WebGPU;
- batch size 1;
- 384 dimensions;
- 110 unique texts;
- load 1407.9 ms;
- embedding 5912.3 ms.

Frozen learner:
- one linear logistic head;
- 1200 iterations;
- base learning rate 0.2;
- L2 0.02;
- threshold 0.5;
- 0 hidden layers;
- sweep count 1.

## Leg A — per-sentence representation

Held-out known-state paraphrases:
- BA **0.875**;
- TPR **1.000**;
- TNR **0.750**;
- AUROC **0.9375**;
- gate: **PASS**.

Controls:
- exact-text BA **0.500**;
- unigram BA **0.625**.

Qualified diagnostic statement:

> The pinned frozen sentence representation carries recoverable information sufficient for the precommitted known-state `complete` vs `delayed` paraphrase diagnostic.

This is not evidence that unseen semantic classes are generally decodable.

## Leg B — frozen `abs(H-C)` relation on known-state paraphrases

Held-out known relation:
- BA **0.59375**;
- TPR **0.9375**;
- TNR **0.2500**;
- AUROC **0.66015625**;
- gate: **FAIL**.

Controls:
- majority BA **0.500**;
- exact-pair memorizer BA **0.500**.

The frozen unseen-state reference remains unchanged:
- held-out current BA 0.750 / AUROC 0.500;
- held-out history BA 0.750 / AUROC 0.500.

Diagnostic statement:

> `abs(H-C)` fails even on held-out paraphrases of semantic states that were already present in TRAIN.

The earlier unseen-`suspended` failure is therefore not required to expose the weakness.

## Leg C — single joint-pair embedding + linear head

Frozen pair wrapper:
`Previous acknowledged report: <H>\nCurrent report: <C>`

### Held-out known-state relation
- BA **0.515625**;
- TPR **0.2500**;
- TNR **0.78125**;
- AUROC **0.5771484375**;
- gate: **FAIL**.

### Held-out current unseen-state
- BA **0.500**;
- TPR **0.000**;
- TNR **1.000**;
- AUROC **0.8125**;
- gate: **FAIL**.

### Held-out history unseen-state
- BA **0.625**;
- TPR **0.2500**;
- TNR **1.000**;
- AUROC **0.8125**;
- gate: **FAIL**.

The joint wrapper therefore does not rescue the known-state relation under the frozen linear readout.

## Precommitted classification

Leg A passes, while both Leg B and Leg C fail the known-state relation gate.

Per the frozen interpretation matrix:

**PAIR_RELATION_READOUT_FAIL**

Exact interpretation:

> Per-sentence semantic-state information is recoverable, but neither tested simple pair-relation/readout formulation recovers semantic equivalence/change robustly across held-out paraphrases.

## What this changes

The prior ambiguity between “MiniLM cannot represent the semantic state” and “the pair relation/readout cannot recover change vs restatement” is materially reduced.

The evidence now supports:
- known-state sentence semantics are present enough for the precommitted linear diagnostic;
- the old independent `abs(H-C)` relation is inadequate;
- the single precommitted joint-pair embedding with the same simple linear readout is also inadequate;
- unseen-state transfer is not the only or necessary failure boundary because the relation already fails on known-state paraphrases.

## What this does NOT prove

This result does not prove:
- broad representation sufficiency of MiniLM;
- that token-level interaction is absent or useless;
- that a larger encoder is needed;
- that a nonlinear head is justified;
- that the full purpose × settled history × current evidence relation is learned;
- any Owner/product life, agency or usefulness claim.

## No-rescue consequence

Do not:
- tune thresholds;
- add `suspended` to TRAIN;
- alter the frozen texts/splits;
- enlarge the encoder;
- add hidden layers as a rescue;
- sweep pair wrappers or relation feature families;
- return to direct cosine;
- promote either learned probe.

The next architecture hypothesis must explain why **pairwise semantic equality/change is not linearly recoverable from either the tested independent sentence-difference geometry or the one tested frozen joint-pair sentence embedding, despite recoverable per-sentence state information**.

The qualified oracle consumer remains the downstream reason for caring about this distinction. The learned actor authority remains nonexistent.
