# R3 Frozen Zero-Shot Grounded Semantic Bridge Result — 2026-09-27

Status: **ZERO_SHOT_GROUNDED_SEMANTIC_BRIDGE_PARTIAL · PURPOSE-SIDE WORDING ROBUSTNESS FAIL · NO LOCAL ORACLE TRAINING**

## Frozen contract

`docs/R3_FROZEN_ZERO_SHOT_GROUNDED_SEMANTIC_BRIDGE_CONTRACT_2026-09-27.md`

The contract was frozen before implementation and browser execution.

## Qualified implementation head

`5958e49b6b9c927c262ec60847ac9f6b8cf8ddc5`

Qualification:
- Check #393 PASS;
- 43/43 test files PASS;
- 209/209 tests PASS;
- build PASS;
- Research Preview #418 build + deploy PASS.

One prior head failed only on a duplicate TypeScript object property in result serialization. Recovery changed no model, text, gate, score or semantic apparatus.

## Real browser/WebGPU execution

Live page:

`r3-zero-shot-grounded-semantic-bridge.html`

Runtime:
- model: `Xenova/paraphrase-MiniLM-L3-v2`;
- revision: `4b544e74dfc3256b2b56849ea5d7064fee1ac846`;
- dtype: q8;
- device: WebGPU;
- batch size: 1;
- dimensions: 384;
- unique texts: 14;
- load time: ~1859 ms;
- embedding time: ~1654 ms.

All execution gates PASS.

No local relation training occurred:
- oracle labels used for fit: false;
- threshold tuned: false;
- projection trained: false;
- model sweep count: 1.

## Frozen zero-shot result

### A. Baseline exact wording

- correct: **2/2**
- accuracy: **1.000**
- mean matching-minus-nonmatching cosine margin: **+0.2079**
- median margin: **+0.2079**

PASS.

Baseline examples:
- rack report margin: +0.1711;
- source report margin: +0.2447.

### B. Report paraphrase -> baseline purpose

- correct: **5/6**
- accuracy: **0.8333**
- mean margin: **+0.03685**
- median margin: **+0.02709**

Frozen gate requires >=5/6.

PASS.

Lexical control on the same family:
- 4/6 = **0.6667**.

The frozen semantic encoder therefore adds real report-side wording robustness over token overlap in this family.

One failed rack paraphrase:

`The worker feed point has run out of raw stock.`

It ranks source-purpose above rack-purpose.

### C. Baseline report -> purpose paraphrase

- correct: **2/4**
- accuracy: **0.500**
- mean margin: **-0.03666**
- median margin: **+0.00407**

Frozen gate requires 4/4.

FAIL.

Lexical control:
- 3/4 = **0.750**.

Failures occur on both domains across different purpose paraphrase pairs.

### D. Cross-paraphrase

- correct: **6/12**
- accuracy: **0.500**
- mean margin: **-0.002864**
- median margin: **+0.003823**

Frozen gate requires >=10/12 and strict improvement over lexical.

FAIL.

Lexical control:
- 8/12 = **0.6667**.

The frozen MiniLM geometry performs **worse than lexical overlap** on the strongest wording-shift family.

## Gate result

Execution:
- model id PASS;
- revision PASS;
- dtype PASS;
- WebGPU PASS;
- batch size PASS;
- dimensions PASS;
- item count PASS;
- finite embeddings PASS.

Semantic:
- baseline exact: PASS;
- report paraphrase -> baseline purpose: PASS;
- baseline report -> purpose paraphrase: FAIL;
- cross paraphrase: FAIL;
- cross beats lexical: FAIL;
- positive mean margins in every family: FAIL;
- nonnegative median margins: PASS.

Precommitted classification:

**ZERO_SHOT_GROUNDED_SEMANTIC_BRIDGE_PARTIAL**

## What the result means

The pinned pretrained representation does contain a bounded zero-shot semantic signal:

- exact grounded rack/source report meaning is correctly ranked;
- five of six substantially reworded factual reports still select the correct original purpose;
- this report-side paraphrase family beats lexical overlap.

But it does **not** provide a wording-robust actor-relative bridge when the purpose language itself changes.

The dominant weakness is purpose-side representation:
- original report -> reworded purposes collapses to chance;
- both sides reworded collapses to chance;
- cross-paraphrase mean margin becomes slightly negative.

This is consistent with the supervision-provenance result:

> grounded factual meaning has legal local supervision, while purpose-statement semantics does not yet have an equivalent grounded local channel.

It is also consistent with the linguistic form of the purpose statements: each contains both a positive responsibility and an explicit excluded domain. A generic paraphrase sentence embedding may represent both topics without robustly encoding which clause defines responsibility.

That explanation is a supported hypothesis, not yet a proven mechanism.

## What this does NOT establish

It does not establish:
- that MiniLM is globally unsuitable;
- that another frozen model would pass;
- that a locally trained relation head is justified;
- that purpose clause splitting is valid architecture;
- broad grounded language understanding;
- cross-family semantic transfer;
- actor authority;
- Owner/product success.

## No-rescue consequence

Do not:
- train on `domain === purpose`;
- fit a threshold;
- train a projection/head;
- change the frozen paraphrases;
- add prompt prefixes after seeing the result;
- sweep sentence encoders on the same 24 cases;
- call baseline 2/2 semantic competence.

## Next earned problem

The evidence now isolates the missing side:

> **purpose meaning needs a better grounded/structured representation before actor-relative relevance can be expected to generalize.**

The next experiment should therefore target purpose semantics, not report semantics and not another timing fixture.

Preferred direction:

### grounded purpose representation audit

Before another model:
1. inspect whether a purpose can be represented by legal actor-private, nonlinguistic/causal structure already present in life rather than matter id;
2. test whether that structure is stable under wording-only paraphrase;
3. keep report factual grounding as the already-qualified semantic donor;
4. evaluate whether report factual representation can relate to grounded purpose structure without oracle labels.

If no honest purpose-side grounding exists, record that gap rather than manufacturing labels.

A separately frozen relation-model comparison is only justified later if purpose representation is adequate and the remaining failure is clearly model-formulation-specific.

No learned ReflexBrain authority exists.
No Owner/product claim changes.
