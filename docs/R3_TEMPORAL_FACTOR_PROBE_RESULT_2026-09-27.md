# R3 Temporal Semantic Factor Probe Result — 2026-09-27

Status: **PARTIAL TEMPORAL FACTOR SIGNAL · QUALIFICATION FAIL · NO PROMOTION**

Executed candidate head:

`7e764eb4828a0c9c1cb03afbd516c94029124383`

Execution:
- real Opera browser;
- real WebGPU;
- pinned frozen `Xenova/paraphrase-MiniLM-L3-v2`;
- revision `4b544e74dfc3256b2b56849ea5d7064fee1ac846`;
- q8;
- batch size 1;
- 384 dimensions;
- 10 unique texts;
- encoder load ~1777.9 ms;
- embedding pass ~722.8 ms.

Frozen contract:

`docs/R3_TEMPORAL_FACTOR_PROBE_CONTRACT_2026-09-26.md`

No threshold, feature family, encoder, split or hyperparameter was changed after observing the result.

## Diagnostic question

Can the pinned frozen semantic representation plus one transparent learned difference relation support the isolated same-domain temporal semantic novelty factor:

> prior settled semantic evidence × current semantic evidence -> changed meaning vs equivalent restatement?

This is a factor diagnostic only. Actor purpose is intentionally excluded because the temporal corpus label does not depend on purpose.

## Frozen mechanism

Representation:
- `H` = prior acknowledged semantic evidence embedding;
- `C` = current evidence embedding.

Feature:

`abs(H - C)`

Head:
- one linear logistic classifier;
- 384 features;
- zero initialization;
- full-batch class-balanced BCE;
- 1200 iterations;
- base learning rate 0.2;
- L2 0.02;
- fixed threshold 0.5;
- no hidden layer;
- one run;
- no sweep.

## TRAIN

- count: 16;
- positives / negatives: 8 / 8;
- accuracy: **1.000**;
- balanced accuracy: **1.000**;
- TPR: **1.000**;
- TNR: **1.000**;
- AUROC: **1.000**;
- mean positive probability: **0.6734**;
- mean negative probability: **0.3300**.

The frozen factor can fit TRAIN.

## HELD-OUT CURRENT

Current semantic state is unseen `suspended`.

- count: 8;
- positives / negatives: 4 / 4;
- TP / TN / FP / FN: 4 / 2 / 2 / 0;
- accuracy: **0.750**;
- balanced accuracy: **0.750**;
- TPR: **1.000**;
- TNR: **0.500**;
- AUROC: **0.500**;
- mean positive probability: **0.6615**;
- mean negative probability: **0.4708**.

## HELD-OUT HISTORY

Prior settled semantic state is unseen `suspended`.

- count: 8;
- positives / negatives: 4 / 4;
- TP / TN / FP / FN: 4 / 2 / 2 / 0;
- accuracy: **0.750**;
- balanced accuracy: **0.750**;
- TPR: **1.000**;
- TNR: **0.500**;
- AUROC: **0.500**;
- mean positive probability: **0.6615**;
- mean negative probability: **0.4708**.

## COMBINED HELD-OUT

- count: 16;
- positives / negatives: 8 / 8;
- TP / TN / FP / FN: 8 / 4 / 4 / 0;
- accuracy: **0.750**;
- balanced accuracy: **0.750**;
- TPR: **1.000**;
- TNR: **0.500**;
- AUROC: **0.500**.

## Negative controls

On both held-out splits:
- majority BA: 0.500;
- exact-triple BA: 0.500;
- current-only BA: 0.500;
- history-only BA: 0.500;
- unigram BA: 0.500;
- cross-token-pair BA: 0.500.

## Precommitted gate

Required on both held-out splits:
- BA >= 0.875;
- AUROC >= 0.875;
- TPR >= 0.75;
- TNR >= 0.75;
- real pinned Opera/WebGPU execution.

Observed:
- runtime: **PASS**;
- TPR: **PASS**;
- BA: **FAIL**;
- TNR: **FAIL**;
- AUROC: **FAIL**.

Precommitted classification:

> **PARTIAL_TEMPORAL_FACTOR_SIGNAL**

## Interpretation

The result does not support `QUALIFIED_TEMPORAL_FACTOR_SUPPORT`.

The thresholded classifier detects all held-out positives but also accepts half of held-out negatives. More importantly, AUROC is exactly chance on both unseen-state directions. Therefore there is no qualified threshold-free held-out ranking evidence for the temporal novelty relation.

Because the isolated temporal factor itself fails its precommitted transfer gate, the earlier consumer-reachable three-way failure cannot be attributed only to combining purpose with history/current evidence or to threshold calibration.

Current evidence now implicates at least one of:
- the frozen sentence representation for this semantic-equivalence/change distinction;
- the `abs(H-C)` relation formulation;
- the linear readout over that formulation;
- or the small authored semantic-state family as insufficient support for the intended transfer.

This experiment does not distinguish those possibilities.

## What survives

- bounded temporal semantic consumer value remains qualified at the oracle plane;
- the temporal corpus still defeats the tested simple string/token controls;
- the pinned MiniLM runtime remains a valid donor/runtime method;
- TRAIN fit demonstrates that the head can express the training relation;
- there is some thresholded held-out signal, hence the precommitted PARTIAL classification.

## What does not survive

- qualification of the isolated temporal factor;
- the hypothesis that three-way composition alone explains the earlier learned failure;
- promotion of `abs(H-C)` + linear head;
- any learned ReflexBrain competence;
- any actor authority;
- any Owner/product claim.

## No-rescue consequence

Do not rescue this exact probe by:
- threshold tuning;
- moving `suspended` into TRAIN;
- adding more authored states inside the same experiment;
- larger encoder;
- hidden layers;
- alternate pooling;
- alternate relation features;
- weakening the gate.

Any next architecture hypothesis must explicitly explain why it should recover semantic novelty/equivalence beyond the failed frozen sentence-difference geometry.

A future diagnostic may separate **representation sufficiency** from **relation/readout sufficiency**, but that is a new hypothesis and must be frozen independently before execution.
