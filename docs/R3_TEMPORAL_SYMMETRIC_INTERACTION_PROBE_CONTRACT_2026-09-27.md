# R3 Temporal Symmetric Interaction Probe Contract — 2026-09-27

Status: **FROZEN BEFORE IMPLEMENTATION / EXECUTION · DIAGNOSTIC TEMPORAL RELATION PROBE**

## Why this probe is earned

The frozen representation-vs-relation falsifier produced:

- Leg A known-state sentence representation: BA 0.875 / AUROC 0.9375 — PASS;
- frozen `abs(H-C)` known-state relation: BA 0.59375 / AUROC 0.66015625 — FAIL;
- single joint-pair sentence embedding + linear head: BA 0.515625 / AUROC 0.5771484375 — FAIL;
- both joint unseen-state directions: FAIL.

Precommitted classification:

**PAIR_RELATION_READOUT_FAIL**

The relevant sentence-level semantic information is therefore recoverable under the bounded known-state diagnostic, while the two tested simple pair formulations do not recover semantic equivalence/change.

The target itself is symmetric:

> respond iff the semantic state represented by current evidence differs from the state already settled in private history.

The old `abs(H-C)` feature contains magnitude-of-coordinate-change information but no multiplicative interaction between corresponding embedding dimensions.

The one tested joint-text encoding is not treated as a genuine cross-encoder architecture. It encodes the complete pair wrapper as one ordinary sentence embedding under the same frozen sentence model.

This probe asks one narrower architecture question:

> Does adding exactly one symmetry-preserving multiplicative interaction to the already-failed independent embedding relation recover the temporal equality/change boundary?

This is not a return to direct cosine and does not compute a cosine scalar.

## Frozen downstream reason

The downstream reason remains the already-qualified oracle consumer:

> distinguish a genuine semantic state change from an equivalent paraphrased restatement of already settled actor-private evidence.

This remains diagnostic-only. No Owner/product claim is at stake.

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

## Frozen corpus

Reuse the existing temporal consumer relation corpus without edits:

TRAIN:
- exactly 16 existing train relation pairs;
- semantic states present: `complete`, `delayed`;
- balanced change/restatement labels.

HELD-OUT KNOWN:
- exactly the existing 64 full-Cartesian known-state paraphrase pairs frozen by the representation-vs-relation falsifier;
- 32 semantic-change positives;
- 32 equivalent-restatement negatives.

HELD-OUT UNSEEN CURRENT:
- exactly the existing 8 `heldout-current-state` examples;
- `suspended` remains absent from TRAIN.

HELD-OUT UNSEEN HISTORY:
- exactly the existing 8 `heldout-history-state` examples;
- `suspended` remains absent from TRAIN.

No text, label, split or semantic state may change after this contract.

## Frozen feature operator

For each pair of independently encoded normalized embeddings `H` and `C`, construct exactly:

`[abs(H-C), H⊙C]`

where:
- `abs(H-C)` is elementwise absolute difference;
- `H⊙C` is elementwise multiplication;
- concatenation order is exactly difference first, product second;
- output dimensions are exactly 768.

No raw `H` or `C` vectors are appended.
No cosine similarity scalar is computed.
No dot-product scalar is computed.
No additional relation feature is allowed.

This preserves symmetry under swapping history/current for the current equality/change target.

## Frozen learner

Use exactly the existing deterministic R3 linear logistic head:

- one linear head;
- 768 input dimensions;
- 1200 iterations;
- base learning rate 0.2;
- L2 0.02;
- fixed threshold 0.5;
- class weighting unchanged;
- zero hidden layers;
- no calibration;
- one run.

TRAIN only on the 16 existing temporal relation TRAIN examples.

No semantic-state labels are model-visible or used to train this head.

## Required reporting

Report separately:

### TRAIN
- BA;
- TPR;
- TNR;
- AUROC.

### HELD-OUT KNOWN
- BA;
- TPR;
- TNR;
- AUROC;
- mean positive probability;
- mean negative probability.

### HELD-OUT UNSEEN CURRENT
- BA;
- TPR;
- TNR;
- AUROC.

### HELD-OUT UNSEEN HISTORY
- BA;
- TPR;
- TNR;
- AUROC.

Preserve the existing majority, exact-pair, current-only, history-only, unigram and cross-token controls for the corresponding splits.

Also report the frozen prior references:
- `abs(H-C)` known-state result;
- Leg A representation result;
- joint-pair known/unseen results.

## Gates

### Known-state interaction gate

HELD-OUT KNOWN must satisfy all:
- BA >= 0.875;
- AUROC >= 0.875;
- TPR >= 0.75;
- TNR >= 0.75.

### Unseen-state interaction gate

Both unseen directions must each satisfy all:
- BA >= 0.875;
- AUROC >= 0.875;
- TPR >= 0.75;
- TNR >= 0.75.

## Precommitted interpretation

### SYMMETRIC_INTERACTION_FAIL_KNOWN

If the known-state interaction gate fails:

- the minimal frozen `[abs(H-C), H⊙C]` relation does not robustly recover equality/change even when both semantic states were represented in TRAIN;
- the bounded Leg A PASS remains valid but is insufficient to make this simple relation family work;
- do not sweep more pair-feature permutations on this corpus;
- do not add hidden layers or a larger encoder as post-hoc rescue;
- the next hypothesis must move beyond feature-combination tinkering and explain what representation/objective/learned projection is actually missing.

### KNOWN_INTERACTION_SUPPORT_UNSEEN_FAIL

If the known-state interaction gate passes but either unseen-state gate fails:

- multiplicative symmetric interaction recovers ordinary held-out paraphrase relation for known semantic states;
- the hard remaining boundary is transfer of equality/change to an unseen semantic state;
- do not return to the full three-way learner yet;
- do not add `suspended` to TRAIN inside this experiment.

### SYMMETRIC_INTERACTION_TEMPORAL_SUPPORT

If the known-state gate and both unseen-state gates pass:

- the pinned frozen sentence representation plus this one minimal symmetric interaction supports the isolated temporal equality/change factor under the frozen corpus;
- the old `abs(H-C)` failure is localized to relation formulation rather than absence of all useful sentence semantics;
- this qualifies only the isolated temporal factor and does not automatically qualify the full purpose × history × current learned relation;
- any return to the full three-way target requires a separate frozen contract.

## No-rescue boundary

After seeing the result do not:

- tune threshold;
- change optimizer hyperparameters;
- add raw `H`/`C`;
- remove either frozen feature block;
- try `H⊙C` alone;
- try squared difference;
- try cosine/dot similarity;
- try another pair wrapper;
- add a hidden layer;
- enlarge or replace the encoder;
- change pooling;
- add `suspended` to TRAIN;
- edit held-out paraphrases;
- weaken gates;
- run a feature sweep.

This probe answers one structural relation question and stops.
