# R3 First Learned Joint Relation Probe Contract — 2026-09-25

Status: **FROZEN BEFORE MODEL EXECUTION**

## Why this probe is now earned

Model work was blocked until both conditions existed:

1. a bounded downstream consumer where semantic judgement has causal value;
2. a held-out target where purpose, settled semantic history and current evidence are each structurally necessary.

Both now exist.

The consumer remains oracle-only. The relation corpus declares its supervision source explicitly as:

`authored-semantic-teacher`

This probe therefore tests **supervised approximation of a useful authored semantic boundary**. It does not claim intervention-derived semantic ground truth or autonomous self-learning from life.

## Frozen target

Corpus:
`src/r3/joint-consumer-relation-corpus.ts`

TRAIN:
- 128 examples;
- complete/delayed semantic states only;
- TRAIN purpose/history/current wording only.

HELD-OUT:
- 288 examples;
- different purpose wording;
- different history/current wording;
- includes entirely unseen `suspended` semantic state;
- not used for fitting, threshold selection, feature selection or hyperparameter tuning.

Model-visible text only:
- purpose statement;
- prior acknowledged private evidence;
- current private evidence.

No ids, split names, latent domain/state metadata or labels enter inference features.

## Frozen encoder

- model: `Xenova/paraphrase-MiniLM-L3-v2`;
- revision: `4b544e74dfc3256b2b56849ea5d7064fee1ac846`;
- dtype: q8;
- device: WebGPU;
- batch size: 1;
- mean pooling + normalized embedding;
- expected dimension: 384.

The encoder is frozen and is a donor representation, not the learned mechanism.

## Frozen learned mechanism

For each example embed the three segments separately:

- `P` = purpose;
- `H` = settled private history;
- `C` = current private evidence.

Feature vector:

`[abs(P - C), abs(H - C)]`

No raw text tokens, ids or latent authored domain/state features are appended.

Head:
- one linear logistic classifier;
- one scalar bias;
- deterministic zero initialization;
- full-batch class-balanced binary cross-entropy;
- L2 on weights only;
- 1200 iterations;
- learning rate `0.2 / sqrt(1 + iteration / 100)`;
- L2 coefficient `0.02`;
- decision threshold fixed at 0.5.

No hidden layer.
No alternate feature family.
No optimizer/model/hyperparameter sweep.
No held-out calibration.

## Frozen negative controls already established

On the same held-out relation:
- majority BA: 0.500;
- exact full-tuple memorizer BA: 0.500;
- exact no-purpose BA: 0.500;
- exact no-history BA: 0.500;
- exact no-current BA: 0.500;
- unigram BA: 0.500;
- cross-segment token-pair BA: ~0.502;
- privileged purpose-only semantic oracle BA: ~0.929;
- privileged temporal-only semantic oracle BA: ~0.643;
- privileged exact-text + purpose semantic oracle BA: ~0.964.

The privileged baselines use authored latent semantics unavailable to the learned model. They are intentionally strong partial-relation controls.

## Evaluation

Report:
- TRAIN accuracy / balanced accuracy;
- HELD-OUT accuracy / balanced accuracy / TPR / TNR;
- confusion counts;
- 120 purpose counterfactual pairs;
- 120 history counterfactual pairs;
- 120 current-evidence counterfactual pairs.

For each counterfactual family, pair success means:
- the positive member is predicted positive; and
- its matched label-flipping counterfactual is predicted negative.

No examples may be removed after seeing predictions.

## Precommitted interpretation

### QUALIFIED first learned three-way relation

All must hold:

1. HELD-OUT balanced accuracy is **strictly greater than 0.9642857142857143**, the strongest privileged partial semantic baseline;
2. purpose-counterfactual pair success >= 0.90;
3. history-counterfactual pair success >= 0.90;
4. current-evidence-counterfactual pair success >= 0.90;
5. TPR >= 0.90 and TNR >= 0.90;
6. real Opera/WebGPU execution uses the pinned encoder contract above.

Passing this gate would establish only:

> a tiny learned linear relation over a frozen local semantic representation can approximate this bounded, causally useful, authored actor-private three-way semantic boundary and transfer to held-out wording plus an unseen semantic state.

It would **not** establish autonomous learning from life, final memory/ontology/API, actor authority, cross-world generality, or Owner/product life quality.

### PARTIAL SIGNAL / NO PROMOTION

If held-out BA > 0.5 but any qualification gate above fails:
- record the exact evidence;
- do not tune to recover the score;
- classify which relation/counterfactual failed;
- keep the model unpromoted.

### FAIL / HYPOTHESIS REJECTED

If held-out BA is near chance or the mechanism collapses systematically on held-out relation structure:
- reject this exact frozen-feature linear-head hypothesis;
- do not rescue it by hidden layers, larger encoder, threshold tuning or target alteration in the same experiment.

Any later architecture change requires a new explicit hypothesis justified by the failure.
