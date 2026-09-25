# R3 First Learned Joint Relation Probe Result — 2026-09-25

Status: **PARTIAL SIGNAL · NO PROMOTION · FROZEN LINEAR JOINT-RELATION HYPOTHESIS FAILS QUALIFICATION GATE**

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

> The frozen MiniLM representation plus one deterministic linear joint-relation head carries non-chance held-out signal for this authored three-way actor-private relation, but it fails badly on positive transfer and explicit purpose/history/current counterfactual structure.

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

## Next diagnostic

The next move is **failure localization without model changes**.

Using the exact same frozen model/run contract, report held-out performance stratified by:
- current semantic state;
- prior semantic state;
- whether `suspended` occurs in current or history;
- matter domain;
- each counterfactual family.

The purpose is to determine whether failure is dominated by unseen-state representation transfer, by failure to compose the three semantic relations, or both.

This diagnostic must not tune or select the model.
