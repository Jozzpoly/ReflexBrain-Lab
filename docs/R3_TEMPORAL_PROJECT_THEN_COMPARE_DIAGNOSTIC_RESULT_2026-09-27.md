# R3 Temporal Project-Then-Compare Diagnostic Result — 2026-09-27

Status: **PRIVILEGED_PROJECT_THEN_COMPARE_FAIL_KNOWN · PROJECTED-STATE SCALAR HYPOTHESIS FAIL · NO PROMOTION**

## Execution provenance

Frozen contract:
`docs/R3_TEMPORAL_PROJECT_THEN_COMPARE_DIAGNOSTIC_CONTRACT_2026-09-27.md`

Initial qualified implementation head:
`b51da418a718f060da37771eb0aa8b0d6ee07bab`

An Opera reconnect mistake created three auto-running page instances before any result was read. That apparatus violation is recorded separately:

`docs/R3_TEMPORAL_PROJECT_THEN_COMPARE_EXECUTION_PROTOCOL_INCIDENT_2026-09-27.md`

Those three executions were closed without reading `tab_content`, metrics, JSON or classification and are **INVALIDATED / UNOBSERVED**.

Recovery apparatus head:
`08982be95426718f422661ab7fafd3dccf23fcbe`

Recovery qualification:
- Check #295 PASS;
- 31/31 test files PASS;
- 193/193 tests PASS;
- build PASS;
- Research Preview #301 / deploy PASS.

The semantic/model experiment remained unchanged. Recovery added only the predeclared persistent execution lock:
`r3-temporal-project-then-compare-recovery-20260927-a`.

Clean recovery execution:
- no pre-existing target tab;
- exactly one navigation call;
- executing tab `631130117`;
- Opera browser / WebGPU;
- status `PASS_EXECUTION`;
- no reload, second navigation, alternate feature, model change, threshold tuning or second interpreted run.

## Frozen runtime

- model: `Xenova/paraphrase-MiniLM-L3-v2`;
- revision: `4b544e74dfc3256b2b56849ea5d7064fee1ac846`;
- q8;
- WebGPU;
- batch size 1;
- dimensions 384;
- 18 unique sentence texts;
- load 1351.3 ms;
- embedding 1014 ms.

## Stage 1 — privileged semantic state projection

Coordinate:

`z(E) = P(complete | E)`

TRAIN:
- 4 sentences;
- BA **1.000**;
- TPR **1.000**;
- TNR **1.000**;
- AUROC **1.000**.

HELD-OUT known-state paraphrases:
- 8 sentences;
- BA **0.875**;
- TPR **1.000**;
- TNR **0.750**;
- AUROC **0.9375**;
- gate: **PASS**.

Held-out coordinate means:
- complete: **0.5857607449**;
- delayed: **0.3983677223**.

This exactly reproduces the prior bounded sentence-representation support.

## Stage 2 — compare in privileged projected space

Frozen feature:

`d = abs(z(H) - z(C))`

One-dimensional relation head; same deterministic optimizer contract.

### TRAIN

- count 16;
- BA **1.000**;
- TPR **1.000**;
- TNR **1.000**;
- AUROC **1.000**.

Mean projected distance:
- semantic-change positives: **0.4633213389**;
- equivalent-restatement negatives: **0.0131982936**.

TRAIN is cleanly separable. This is not qualification.

### HELD-OUT KNOWN

- count 64;
- BA **0.5625**;
- TPR **0.2500**;
- TNR **0.8750**;
- AUROC **0.73828125**;
- gate: **FAIL**.

Mean projected distance:
- semantic-change positives: **0.1906299684**;
- equivalent-restatement negatives: **0.0872099533**.

The held-out projected geometry retains some ranking signal but does not robustly separate semantic state change from within-state paraphrase variation.

### HELD-OUT UNSEEN CURRENT

- count 8;
- BA **0.500**;
- TPR **0.000**;
- TNR **1.000**;
- AUROC **0.750**;
- gate: **FAIL**.

Mean projected distance:
- positives: **0.1203516332**;
- negatives: **0.0471619495**.

### HELD-OUT UNSEEN HISTORY

- count 8;
- BA **0.500**;
- TPR **0.000**;
- TNR **1.000**;
- AUROC **0.750**;
- gate: **FAIL**.

Mean projected distances match the held-out-current direction.

## Precommitted classification

Stage 1 passes, but the Stage-2 known-state relation gate fails.

Per the frozen interpretation matrix:

**PRIVILEGED_PROJECT_THEN_COMPARE_FAIL_KNOWN**

## What this changes

The earlier hypothesis was:

> perhaps generic frozen sentence embeddings contain useful semantic state information, but temporal comparison must happen only after projecting each sentence into an actor-relevant semantic coordinate.

This diagnostic gave that hypothesis a deliberately privileged advantage by training the projection directly from authored `complete` / `delayed` labels.

Even then, the one-dimensional probability-coordinate difference does not robustly generalize the known-state equality/change relation.

Therefore the evidence does **not** earn a pair-supervised learned-projection implementation as an automatic next step.

The key distinction is now:

- per-sentence binary state classification can pass;
- pairwise equality/change over paraphrases can still fail;
- a classification probability is not automatically a stable semantic state coordinate or metric;
- successful hard classification at one threshold does not imply within-class compactness / between-class relation geometry suitable for temporal comparison.

## What survives

- the bounded oracle temporal consumer remains qualified;
- the three-way oracle consumer remains qualified;
- pinned MiniLM still carries bounded recoverable per-sentence semantic state information;
- the causal/private R3 host and instrumentation remain useful research substrate.

## What does not survive

- direct cosine;
- `abs(H-C)` relation;
- the tested joint-pair sentence embedding;
- `[abs(H-C), H⊙C]`;
- the privileged scalar probability project-then-compare hypothesis;
- any claim that a direct state classifier automatically yields a useful temporal metric;
- any learned ReflexBrain authority;
- any Owner/product life claim.

## Research consequence

Stop treating the immediate problem as “find a pair feature that converts sentence embeddings into change/not-change.”

Before more model work, reconsider:
1. whether `semantic state equality/change` is the right primitive learned target at all;
2. whether the target should instead preserve richer actor-relative relations such as contradiction, entailment, update-worthiness, relevance-to-purpose or evidence-to-belief transition;
3. whether the current authored state labels collapse distinctions that a living actor actually needs;
4. what legitimate supervision/objective could make actor-relative temporal meaning emerge without importing the oracle answer.

Any next learned architecture must be earned from that reconsideration, not from capacity escalation.

No Owner/product claim changes.
