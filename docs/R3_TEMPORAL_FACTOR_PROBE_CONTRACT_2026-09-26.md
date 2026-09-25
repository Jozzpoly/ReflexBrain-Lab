# R3 Temporal Semantic Factor Probe Contract — 2026-09-26

Status: **FROZEN BEFORE EXECUTION · DIAGNOSTIC FACTOR ONLY**

## Why this probe is earned

The first frozen three-way learned relation probe failed promotion.

Post-failure diagnostics show that its strongest aggregate signal comes from synthetic Cartesian cross-purpose-history combinations. On the subset compatible with the currently demonstrated causal consumer trajectory:

- balanced accuracy: 0.5573;
- TPR: 0.1875;
- AUROC: 0.6797;
- purpose counterfactual ordering: 1.0000;
- history ordering: 0.6667;
- current-evidence ordering: 0.5208.

This localizes the missing learned capability to:

> same-domain settled semantic history × current semantic evidence:
> has meaning changed, or is the current utterance an equivalent restatement of already settled information?

That exact factor already has bounded downstream oracle value in the temporal semantic consumer.

The purpose of this probe is **failure localization**, not architecture promotion.

## Diagnostic target

Corpus:

`src/r3/temporal-consumer-relation-corpus.ts`

The label is:

`priorAcknowledgedState !== currentState`

The actor-purpose/matter statement is deliberately excluded from model features because the corpus has already been audited to show that purpose does not affect this factor label.

This is therefore **not** the full actor-relative ReflexBrain relation.

### TRAIN

- 16 examples;
- semantic states: `complete`, `delayed`;
- two surface realizations per state;
- balanced positive/negative relation.

### HELD-OUT CURRENT

- 8 examples;
- current semantic state is unseen `suspended`;
- balanced 4 positive / 4 negative;
- held-out wording.

### HELD-OUT HISTORY

- 8 examples;
- prior settled semantic state is unseen `suspended`;
- balanced 4 positive / 4 negative;
- held-out wording.

Existing controls on both held-out splits:
- majority BA: 0.500;
- exact tuple BA: 0.500;
- current-only BA: 0.500;
- history-only BA: 0.500;
- unigram BA <= 0.600;
- cross-token-pair BA <= 0.600.

## Frozen representation

Use the same pinned representation as the failed three-way probe:

- model: `Xenova/paraphrase-MiniLM-L3-v2`;
- revision: `4b544e74dfc3256b2b56849ea5d7064fee1ac846`;
- q8;
- WebGPU;
- isolated batch size 1;
- mean pooling + normalized embedding;
- expected dimension: 384.

Embed separately:

- `H` = prior settled semantic evidence;
- `C` = current private evidence.

## Frozen relation feature

Feature vector:

`abs(H - C)`

No:
- purpose embedding;
- raw token features;
- ids;
- authored state/domain metadata;
- split names;
- future World facts.

This is **not a resurrection of the rejected direct-cosine family**. It is a bounded representation diagnostic using a learned transparent relation over the isolated temporal factor.

## Frozen learner

Reuse the already-qualified deterministic linear training implementation from:

`src/r3/joint-relation-linear-head.ts`

Unchanged optimization contract:
- one linear logistic classifier;
- zero initialization;
- full-batch class-balanced BCE;
- 1200 iterations;
- learning rate `0.2 / sqrt(1 + iteration / 100)`;
- L2 coefficient `0.02`;
- fixed decision threshold 0.5;
- no hidden layer;
- no threshold calibration;
- no feature/model/hyperparameter sweep.

Only feature dimensionality changes naturally from 768 to 384 because this diagnostic has one relation leg rather than two.

## Evaluation

Report separately for:
- TRAIN;
- HELD-OUT CURRENT;
- HELD-OUT HISTORY;
- combined held-out.

For every evaluation set report:
- accuracy;
- balanced accuracy;
- TPR;
- TNR;
- TP/TN/FP/FN;
- threshold-free AUROC;
- mean positive probability;
- mean negative probability.

No held-out example may be removed or used for fitting.

## Precommitted classification

### QUALIFIED_TEMPORAL_FACTOR_SUPPORT

All must hold:

1. held-out-current BA >= **0.875**;
2. held-out-history BA >= **0.875**;
3. held-out-current AUROC >= **0.875**;
4. held-out-history AUROC >= **0.875**;
5. TPR >= **0.75** and TNR >= **0.75** on each held-out split;
6. real Opera/WebGPU execution uses the pinned encoder contract.

Passing would establish only:

> the pinned frozen semantic representation plus one transparent learned difference relation can support the isolated same-domain semantic novelty factor across held-out wording and an unseen semantic state.

It would shift suspicion for the earlier three-way failure toward composition / combining purpose with temporal novelty / decision calibration.

It would **not** qualify:
- the full three-way relation;
- actor purpose;
- autonomous learning from life;
- actor authority;
- final ReflexBrain architecture;
- Owner/product value.

### PARTIAL_TEMPORAL_FACTOR_SIGNAL

If either held-out split has:
- BA > 0.60 or
- AUROC > 0.65,

but the full qualification gate fails:

- record the exact result;
- do not tune;
- localize which direction of unseen-state transfer fails.

### FAIL_TEMPORAL_FACTOR_HYPOTHESIS

If both held-out splits remain near chance in fixed-threshold and threshold-free evaluation:

- reject this exact frozen representation + `abs(H-C)` linear-factor hypothesis;
- do not rescue it inside the experiment with threshold tuning, more states, larger encoder, hidden layers or alternate features.

Any later hypothesis must be justified by this result.

## No-rescue boundary

After execution do not:
- alter TRAIN/held-out membership;
- move `suspended` into TRAIN;
- tune the 0.5 threshold;
- add purpose back into the factor probe;
- add hidden layers;
- try alternate pooling/model sizes;
- weaken the gate.

This probe exists to answer one diagnostic question and then stop.
