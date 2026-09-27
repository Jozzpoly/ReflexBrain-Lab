# R3 Frozen Zero-Shot Grounded Semantic Bridge Contract — 2026-09-27

Status: **FROZEN BEFORE IMPLEMENTATION · ZERO-SHOT ONLY · NO LOCAL ORACLE TRAINING**

## Trigger

The grounded material semantic consumer is qualified:

**GROUNDED_MATERIAL_SEMANTIC_CONSUMER_QUALIFIED**

The supervision provenance audit is also qualified:

**GROUNDED_FACT_SUPERVISION_ONLY**

Therefore:
- the current actor-relative report×purpose relation has causal evaluation value;
- grounded factual supervision is legal;
- no non-circular local supervision source for report×purpose relevance is qualified;
- local training on `domain === purpose`, oracle ACKs or Stage-B retry behavior is blocked.

The cheapest next falsifier is not a trained relation head.

It is:

> can an already-pretrained frozen semantic representation carry the grounded report×purpose relation zero-shot, without fitting anything to the local oracle?

## Frozen encoder

Reuse the already-qualified R3 browser encoder contract unchanged:

- model: `Xenova/paraphrase-MiniLM-L3-v2`;
- revision: `4b544e74dfc3256b2b56849ea5d7064fee1ac846`;
- dtype: `q8`;
- device: `webgpu`;
- pooling: mean;
- normalization: true;
- batch size: **1**;
- expected dimensions: 384.

No model/revision/dtype/device/batch sweep.

## Model-visible inputs

Only natural-language semantic text:

### Report
One grounded factual report wording.

### Purpose
One Ida actor-private matter statement wording.

Forbidden model inputs:
- report-domain id;
- speaker/actor id;
- matter id;
- purpose-domain id;
- World state;
- fixture mode;
- oracle label;
- tick;
- report ordinal;
- acknowledgement history;
- Stage-B retry state.

Deterministic temporal settlement remains outside this probe.

## Zero-shot relation score

For report text `R` and matter statement `P`:

`score(R,P) = cosine(embedding(R), embedding(P))`

Because embeddings are normalized, this is their dot product.

No trainable head.
No learned projection.
No bias.
No threshold.
No temperature.
No calibration.
No fitting on the grounded consumer oracle.

## Decision protocol

Use **ranking**, not threshold classification.

For each report wording:
- compare its cosine score to the rack-purpose candidate and source-purpose candidate;
- success iff the semantically matching purpose scores strictly higher.

Ties count as failures.

This directly avoids threshold tuning on oracle labels.

## Frozen wording sets

### Baseline grounded report surfaces

rack:
- `The input rack is empty.`

source:
- `The raw source is empty.`

### Baseline actor-purpose statements

rack:
- `acknowledge grounded reports about whether the workshop input rack is empty; source-empty reports are not part of this monitoring responsibility`

source:
- `acknowledge grounded reports about whether the raw source is empty; rack-empty reports are not part of this monitoring responsibility`

### Evaluation-only report paraphrases

rack:
1. `No unfinished blank is available at the workshop intake.`
2. `The worker feed point has run out of raw stock.`
3. `There is no raw piece left at the bench input.`

source:
1. `The raw-material reserve has been depleted.`
2. `No unfinished stock remains at the supply point.`
3. `The feedstock store has run dry.`

### Evaluation-only purpose paraphrases

rack pair A:
- `monitor shortages where unfinished stock is presented to the worker; depletion of the upstream reserve is outside this duty`

rack pair B:
- `respond to reports that the workshop feed point lacks raw material, not to upstream storage depletion`

source pair A:
- `monitor depletion of the upstream raw-material reserve; workstation intake shortages are outside this duty`

source pair B:
- `respond to reports that the supply reserve has run out, not to shortages at the worker feed point`

These strings are frozen before embedding.
They remain evaluation counterfactuals, not TRAIN examples.

## Evaluation families

### A. Baseline exact wording

Queries:
- 2 baseline reports;
- baseline rack/source purpose pair.

Require correct matching purpose ranking for both.

### B. Report paraphrase → baseline purpose

Queries:
- all 6 report paraphrases;
- baseline rack/source purpose pair.

### C. Baseline report → purpose paraphrase

Two paired candidate sets:
- pair A: rack-A vs source-A;
- pair B: rack-B vs source-B.

Queries:
- 2 baseline reports × 2 pairs = 4.

### D. Cross-paraphrase

Queries:
- all 6 report paraphrases;
- both purpose paraphrase pairs.

Total:
- 12 ranking cases.

This is the strongest current wording-shift family.

## Lexical control

Run the exact same ranking families with token-set Jaccard similarity.

No lexical tuning.

The provenance audit already found:
- original frozen wording lexical accuracy 1.000;
- cross-paraphrase lexical accuracy 8/12 = 0.6667.

Recompute in this probe so the browser result is self-contained.

## Frozen zero-shot gates

### Execution gate

Require:
- exact pinned encoder metadata;
- batch size 1;
- WebGPU;
- dimensions 384;
- all embeddings finite;
- every frozen text embedded exactly once.

### Semantic ranking gate

Require all:

1. baseline exact: **2/2**;
2. report-paraphrase → baseline-purpose: **>=5/6**;
3. baseline-report → purpose-paraphrase: **4/4**;
4. cross-paraphrase: **>=10/12**;
5. cross-paraphrase zero-shot accuracy strictly exceeds lexical cross-paraphrase accuracy;
6. mean matching-minus-nonmatching cosine margin > 0 in every family;
7. no family has a negative median margin.

The `10/12` cross-paraphrase gate is frozen because it requires materially stronger performance than the already-measured lexical 8/12 shortcut while allowing at most two wording failures in the small evaluation family.

No gate may be changed after seeing embeddings.

## Classifications

### ZERO_SHOT_GROUNDED_SEMANTIC_BRIDGE_QUALIFIED

All execution and semantic ranking gates pass.

Bounded claim only:

> the pinned externally pretrained frozen semantic representation carries enough wording-robust grounded report↔purpose geometry to serve as a zero-shot semantic bridge for the qualified material consumer relation.

This is **not** local learned supervision and not local relation training.

### ZERO_SHOT_GROUNDED_SEMANTIC_BRIDGE_PARTIAL

Execution passes and:
- baseline exact passes;
- at least one paraphrase family beats lexical/chance;
- full frozen gates fail.

No promotion.

### ZERO_SHOT_GROUNDED_SEMANTIC_BRIDGE_FAIL

Execution passes but baseline relation is not reliably present or wording-shift performance does not materially exceed lexical controls.

### ZERO_SHOT_GROUNDED_SEMANTIC_BRIDGE_EXECUTION_FAIL

Pinned browser/WebGPU execution does not produce valid embeddings.

Do not reinterpret as semantic failure.

## No-rescue boundary

After first valid embedding result do not:
- fit a threshold;
- train a head;
- choose another projection;
- change model/revision;
- sweep encoders;
- change paraphrases;
- remove failed cases;
- tune prompts/prefixes;
- average multiple templates;
- use oracle labels for calibration.

A semantic FAIL is a valid result.

## After a PASS

Do **not** grant actor authority.

Next:
1. preserve the zero-shot bridge as shadow-only;
2. build a qualitatively different grounded held-out semantic pressure using `output_has_finished` or local contact;
3. require transfer without local relation training;
4. only after cross-family transfer consider bounded shadow insertion into autonomous life.

## After PARTIAL/FAIL

Do not oracle-distill.

Use evidence to choose between:
- broader factual grounding / representation learning from legal fact-level supervision;
- genuine purpose-statement semantic grounding;
- a different externally pretrained representation only in a separately frozen model-family comparison, if justified.

No learned ReflexBrain authority exists.
No Owner/product claim changes.
