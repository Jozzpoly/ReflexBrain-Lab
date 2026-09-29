# R3 First Learned Joint Relation Probe Result — 2026-09-25

Status: **SYNTHETIC PARTIAL SIGNAL · CONSUMER-REACHABLE RELATION FAIL · NO PROMOTION**

Executed candidate head:

`3e40edbf7f21269eab054cb65336f10765a16923`

Execution:
- real Opera browser;
- real WebGPU;
- pinned frozen `Xenova/paraphrase-MiniLM-L3-v2`;
- revision `4b544e74dfc3256b2b56849ea5d7064fee1ac846`;
- q8;
- batch size 1;
- 384 dimensions;
- 24 unique texts;
- encoder load ~1512 ms;
- embedding pass ~1585 ms.

The precommitted contract is:

`docs/R3_FIRST_LEARNED_JOINT_PROBE_CONTRACT_2026-09-25.md`

No threshold, feature family, model, split or hyperparameter was changed after observing the result.

## Supervision boundary

This experiment approximates an authored, causally useful three-way semantic consumer boundary.

Label provenance:

`authored-semantic-teacher`

TRAIN:
- 128 examples;
- complete/delayed semantic states only.

HELD-OUT:
- 288 examples;
- different purpose/history/current wording;
- includes entirely unseen `suspended` semantic state;
- not used for fitting or calibration.

Model-visible inputs:
- actor-private purpose statement;
- prior acknowledged private semantic evidence;
- current private evidence.

No matter id, split id, latent authored domain/state metadata, fixture identity or label enters the learned feature vector.

## Frozen learned mechanism

Frozen representation:
- `P` = purpose embedding;
- `H` = settled-history embedding;
- `C` = current-evidence embedding.

Frozen feature family:

`[abs(P - C), abs(H - C)]`

Learned head:
- one linear logistic classifier;
- 768 features;
- no hidden layer;
- fixed threshold 0.5;
- one precommitted training run;
- no sweep.

## Result

### TRAIN

- accuracy: **0.9844**
- balanced accuracy: **0.9875**
- TPR: **1.000**
- TNR: **0.975**
- TP / TN / FP / FN: **48 / 78 / 2 / 0**

The head can fit the TRAIN relation.

### HELD-OUT

- accuracy: **0.7569**
- balanced accuracy: **0.7167**
- TPR: **0.475**
- TNR: **0.9583**
- TP / TN / FP / FN: **57 / 161 / 7 / 63**

The dominant failure is false negatives: most held-out positive relations are missed.

### Privileged partial semantic baselines

These controls use authored latent semantics unavailable to the learned model:

- purpose-only BA: **0.9286**
- temporal-only BA: **0.6429**
- exact-text + purpose BA: **0.9643**

The frozen learned head does **not** beat the strongest privileged partial baseline.

### Held-out label-flipping counterfactual pairs

Each family contains 120 positive/counterfactual pairs.

- purpose counterfactual success: **56 / 120 = 0.4667**
- history counterfactual success: **46 / 120 = 0.3833**
- current-evidence counterfactual success: **57 / 120 = 0.4750**

The model therefore does not reliably preserve the required three-way relation under any of the three explicit counterfactual axes.

## Precommitted gate result

Required:
- held-out BA > 0.9642857143;
- TPR >= 0.90;
- TNR >= 0.90;
- purpose CF >= 0.90;
- history CF >= 0.90;
- current CF >= 0.90;
- real Opera/WebGPU pinned runtime.

Observed:
- runtime gate: **PASS**;
- TNR gate: **PASS**;
- every other qualification gate: **FAIL**.

Classification:

> **PARTIAL_SIGNAL_NO_PROMOTION**

## Interpretation

Promote only the following narrow evidence:

> The frozen MiniLM representation plus one deterministic linear head carries substantial ranking signal on the **full authored Cartesian stress set**, but that aggregate signal is dominated by synthetic cross-purpose-history combinations. On the subset compatible with the currently qualified causal consumer trajectory, the learned relation is weak and fails the useful three-way boundary.

Do **not** promote:
- the linear head as ReflexBrain;
- this feature family as the correct architecture;
- the authored teacher as semantic ground truth from life;
- learned actor authority;
- autonomous learning;
- general semantic competence;
- Owner/product life quality.

## No-rescue rule

Do not recover this score inside the same experiment by:
- changing threshold;
- adding hidden layers;
- increasing encoder size;
- feature-family sweep;
- hyperparameter sweep;
- deleting hard held-out cases;
- moving held-out wording/state into TRAIN;
- weakening the precommitted gate.

Any later architecture hypothesis must be justified by a diagnosed failure of this exact frozen mechanism.

## Diagnostic hardening without model changes

After the precommitted gate failed, the exact same frozen encoder/head/features/TRAIN/HELD-OUT/threshold were rerun with diagnostic-only reporting.

No model or decision rule changed.

Diagnostic heads:
- `389b3e5703db3058f6c641cf92a78395007436c8` — state/domain stratification;
- `5b01561954edcbd22420c9bc0ae41dfdf2e77eed` — threshold-free AUROC and pair ordering;
- `a5a405f25592e466aa2a18e63f0079efc26b30d9` — consumer-reachable versus synthetic Cartesian support.

All exact diagnostic revisions passed check/build/deploy before real Opera/WebGPU execution.

### Unseen-state hypothesis — REJECTED as primary explanation

The unseen `suspended` state is **not** the main source of failure.

Held-out examples using only TRAIN-known states:
- count 128;
- BA **0.6979**;
- TPR **0.4583**;
- TNR **0.9375**;
- AUROC **0.8563**.

Held-out examples containing `suspended`:
- count 160;
- BA **0.7317**;
- TPR **0.4861**;
- TNR **0.9773**;
- AUROC **0.8805**.

The frozen mechanism fails similarly without the unseen state.

### Threshold-free aggregate diagnostics

Across the full 288-example held-out Cartesian set:
- AUROC **0.8669**;
- mean positive probability **0.4929**;
- mean negative probability **0.4041**.

Matched counterfactual ordering:
- purpose: **1.0000**;
- history: **0.8083**;
- current evidence: **0.7833**.

This shows that the model contains meaningful ranking information even though the frozen 0.5 decision boundary transfers poorly.

This does **not** authorize threshold calibration: the threshold was part of the frozen contract and its gate remains failed.

### Target-support audit — MATERIAL FINDING

The authored Cartesian relation corpus is broader than the settled-history trajectories produced by the currently qualified ideal consumer.

Under the current oracle consumer:
- actor purpose is fixed for a run;
- Janek only acknowledges status in the purpose-relevant domain;
- therefore on-policy settled acknowledged history has the same domain as current actor purpose.

The full Cartesian corpus also contains examples where:

`priorAcknowledgedDomain !== matterDomain`

These are legitimate authored compositional stress cases, but they are **not directly supported by the currently demonstrated causal consumer trajectory**.

The held-out set was therefore split diagnostically without retraining.

#### Consumer-reachable history subset

Predicate:

`priorAcknowledgedDomain === matterDomain`

Result:
- count **144**;
- positives / negatives: **48 / 96**;
- TP / TN / FP / FN: **9 / 89 / 7 / 39**;
- accuracy **0.6806**;
- balanced accuracy **0.5573**;
- TPR **0.1875**;
- TNR **0.9271**;
- AUROC **0.6797**;
- mean positive probability **0.4675**;
- mean negative probability **0.4266**.

Matched counterfactuals from consumer-reachable positives:
- purpose fixed-threshold success **0.1875**; ordering **1.0000**;
- history fixed-threshold success **0.1458**; ordering **0.6667**;
- current-evidence fixed-threshold success **0.1875**; ordering **0.5208**;
- current-evidence mean probability margin only **+0.0052**.

This is the relation that matters most to the currently demonstrated causal consumer.

It **fails**.

#### Synthetic cross-purpose-history subset

Predicate:

`priorAcknowledgedDomain !== matterDomain`

Result:
- count **144**;
- positives / negatives: **72 / 72**;
- TP / TN / FP / FN: **48 / 72 / 0 / 24**;
- accuracy **0.8333**;
- balanced accuracy **0.8333**;
- TPR **0.6667**;
- TNR **1.0000**;
- AUROC **0.9689**.

Matched counterfactual ordering:
- purpose **1.0000**;
- history **0.9028**;
- current evidence **0.9583**.

This synthetic half contributes disproportionately to the attractive aggregate ranking metrics.

## Reclassification

The earlier phrase:

> non-chance held-out signal for this authored three-way actor-private relation

is too broad if read as evidence about the **causally demonstrated consumer relation**.

Current classification:

> **SYNTHETIC PARTIAL SIGNAL / CONSUMER-REACHABLE RELATION FAIL / NO PROMOTION**

What survives:
- purpose applicability is strongly represented: purpose counterfactual ordering is 1.0 even in the consumer-reachable subset;
- the frozen representation/head can exploit broad cross-domain relational structure;
- aggregate threshold-free ranking on the authored Cartesian stress set is real.

What does **not** survive:
- strong learned approximation of the currently useful three-way consumer boundary;
- reliable same-domain semantic novelty / settled-history discrimination;
- current-evidence counterfactual transfer on the consumer-reachable subset;
- any learned ReflexBrain promotion.

The most important missing learned factor is now localized as:

> **same-domain settled semantic history × current semantic evidence: has meaning changed, or is this an equivalent restatement?**

That is exactly the bounded capability already established as useful by the temporal oracle consumer.

## Next earned question

Do **not** tune or replace the three-way model yet.

First isolate whether the pinned frozen semantic representation contains enough information for the missing same-domain temporal novelty relation at all.

The existing temporal consumer relation corpus is appropriate as a **diagnostic factor target**, not as the final ReflexBrain target:
- it isolates prior settled semantic evidence × current evidence;
- it defeats tested exact/current/history/token memorization shortcuts;
- it contains held-out paraphrases and unseen `suspended`;
- its label does not depend on actor purpose, so passing it would diagnose one missing factor only.

Any next probe must be frozen before execution and must not be presented as rescuing direct cosine or as proving the complete actor-relative mechanism.
