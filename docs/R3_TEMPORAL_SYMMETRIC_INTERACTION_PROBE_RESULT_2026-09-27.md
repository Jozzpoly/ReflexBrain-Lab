# R3 Temporal Symmetric Interaction Probe Result — 2026-09-27

Status: **SYMMETRIC_INTERACTION_FAIL_KNOWN · SIMPLE PAIR-FEATURE TINKERING CLOSED · NO PROMOTION**

## Execution provenance

Frozen contract:
`docs/R3_TEMPORAL_SYMMETRIC_INTERACTION_PROBE_CONTRACT_2026-09-27.md`

Implementation/deploy head:
`a4d03a4f689326daf8d3fa550d2516f038c81ef5`

Qualification before browser execution:
- Check #289 PASS;
- 30/30 test files PASS;
- 191/191 tests PASS;
- build PASS;
- Research Preview / deploy PASS.

Real execution:
- Opera browser;
- WebGPU;
- page `/r3-temporal-symmetric-interaction-probe.html`;
- exactly one page-load execution;
- status `PASS_EXECUTION`;
- no reload, threshold tuning, text/split edits, alternate feature operator, model change or second run.

Pinned encoder/runtime:
- `Xenova/paraphrase-MiniLM-L3-v2`;
- revision `4b544e74dfc3256b2b56849ea5d7064fee1ac846`;
- q8;
- WebGPU;
- batch size 1;
- 384 dimensions;
- 18 unique sentence texts;
- load 2035.8 ms;
- embedding 1126.1 ms.

Frozen relation feature:
- `[abs(H-C), H⊙C]`;
- 768 dimensions;
- symmetric;
- no cosine scalar;
- no dot-product scalar.

Frozen learner:
- one linear logistic head;
- 1200 iterations;
- base learning rate 0.2;
- L2 0.02;
- threshold 0.5;
- 0 hidden layers;
- sweep count 1.

## TRAIN

- count: 16;
- BA **1.000**;
- TPR **1.000**;
- TNR **1.000**;
- AUROC **1.000**.

The probe fits TRAIN perfectly. This is not qualification.

## HELD-OUT KNOWN

- count: 64;
- BA **0.59375**;
- TPR **0.9375**;
- TNR **0.2500**;
- AUROC **0.66015625**;
- mean positive probability **0.67030818**;
- mean negative probability **0.56648065**;
- gate: **FAIL**.

Controls:
- majority BA **0.500**;
- exact-pair memorizer BA **0.500**.

This fails on paraphrases of semantic states already present in TRAIN.

## HELD-OUT UNSEEN CURRENT

- count: 8;
- BA **0.750**;
- TPR **1.000**;
- TNR **0.500**;
- AUROC **0.500**;
- gate: **FAIL**.

## HELD-OUT UNSEEN HISTORY

- count: 8;
- BA **0.750**;
- TPR **1.000**;
- TNR **0.500**;
- AUROC **0.500**;
- gate: **FAIL**.

## Comparison to frozen references

Per-sentence Leg A remains:
- BA 0.875;
- AUROC 0.9375;
- **PASS**.

Prior `abs(H-C)` known relation:
- BA 0.59375;
- TPR 0.9375;
- TNR 0.2500;
- AUROC 0.66015625;
- **FAIL**.

New `[abs(H-C), H⊙C]` known relation:
- BA 0.59375;
- TPR 0.9375;
- TNR 0.2500;
- AUROC 0.66015625;
- **FAIL**.

The new frozen operator therefore does not improve the qualified known-state metrics over the already-failed `abs(H-C)` probe.

This exact numerical equality does not by itself prove that the product block received zero learned weight or contains zero information. No post-hoc weight inspection or feature ablation was part of the contract.

## Precommitted classification

The known-state interaction gate fails.

Per the frozen contract:

**SYMMETRIC_INTERACTION_FAIL_KNOWN**

## Interpretation

The evidence now supports a stronger bounded conclusion than the previous `PAIR_RELATION_READOUT_FAIL` alone:

- the pinned frozen representation contains recoverable known-state semantic information under a direct per-sentence linear diagnostic;
- `abs(H-C)` does not robustly turn that information into semantic equality/change;
- adding one standard symmetry-preserving multiplicative interaction `H⊙C` under the same linear readout also does not recover the relation;
- the one tested joint-pair sentence embedding also failed;
- unseen-state transfer is not required to expose the problem because all tested simple relation formulations already fail on known-state paraphrases.

This does **not** establish that MiniLM lacks all useful semantic representation. It establishes that the current strategy of taking frozen generic sentence embeddings and trying simple fixed pair operators plus one linear head is not earning the temporal relation.

## Architecture consequence

Simple pair-feature tinkering on this frozen temporal corpus is now closed.

Do not try:
- `H⊙C` alone;
- squared difference;
- raw `H,V` concatenation variants;
- cosine/dot rescue;
- another pair wrapper;
- threshold tuning;
- hidden layers merely as extra capacity;
- a larger encoder merely to recover score;
- adding `suspended` to TRAIN.

The next hypothesis must explain **why sentence-level state information can be linearly decoded, while semantic equality/change is not robustly available to fixed pair operators**.

The most relevant open architecture class is no longer “which pair feature?” but whether an actor-relative learned projection/representation must be formed **before** temporal comparison, rather than comparing generic frozen sentence embeddings directly.

That class is not qualified by this result and must be independently specified/falsified before implementation.

## Larger project boundary

The qualified oracle consumer remains the reason this distinction matters downstream.

No learned ReflexBrain authority exists.
No Owner/product life or usefulness claim changes.
R3 remains a research host.
