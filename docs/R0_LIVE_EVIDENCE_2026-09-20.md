# R0 Live Evidence — 2026-09-20

Status: **EMPIRICAL CHECKPOINT · NOT A FINAL MODEL VERDICT**

This document records live browser/GPU evidence collected on the Owner's desktop Opera session from the branch `experiment/r0-semantic-shadow-bootstrap`.

## Runtime facts

- Browser runtime: desktop Opera with WebGPU available.
- GPU path exposed no `shader-f16`; `q4f16` failed at inference with:
  - `Gather requires f16 but the device does not support it.`
- Runtime routing was changed to:
  - `shader-f16=true -> q4f16`
  - `shader-f16=false -> q8`
- Qwen backend:
  - `onnx-community/Qwen3-0.6B-ONNX`
  - pinned revision `b1ece21c06dfce3839272e86b7fa12a985d97a7a`
  - live runtime: WebGPU / q8
- SmolLM2 backend:
  - `onnx-community/SmolLM2-135M-Instruct-ONNX`
  - pinned revision `b8a5c0f183b78c55955a5364f610c36668b5e681`
  - live runtime: WebGPU / q8

## Direct-logit probe

Transformers.js 4.3.0 documents generation scores, but its shipped `generate()` implementation still leaves returned scores/logits as TODO. The lab therefore tested direct `model.forward()` next-token logits.

The Qwen ONNX export returned logits shaped approximately:

`[1, 193, 151936]`

despite passing `num_logits_to_keep=1` to the direct forward path. This means the current direct-forward experiment materializes sequence-wide logits and is not an acceptable fast-reflex implementation.

The direct-logit path remains useful for diagnostics but is currently a performance anti-target.

## Qwen choice-only low-stakes matrix

Mechanism:
- one constrained generated token;
- only A–E permitted by a logits processor;
- semantic actions remapped between canonical and reverse option orders;
- zero authority over World or actor motion.

12 runs:
- 3 exposure states: addressed / overheard / none;
- 2 orders: canonical / reverse;
- 2 repetitions.

Observed:
- selected semantic action: **continue in 12/12**;
- canonical emitted `A`;
- reverse emitted `E`;
- therefore the low-stakes case passed a narrow order-remapping check;
- the family did **not** demonstrate exposure sensitivity.

Latency:
- mean: **3195.1 ms**
- median: **3225.1 ms**
- range: **2960.9–3547.5 ms**

Warm repetition did not collapse latency to a reflex-scale regime.

## SmolLM2-135M choice-only matrix

Same 12-run low-stakes protocol.

Observed:
- canonical: token `A` -> semantic `continue`;
- reverse: token `A` -> semantic `withdraw`;
- this happened across addressed / overheard / none and both repetitions.

Interpretation:
- **strong label/first-position bias**;
- semantic remapping FAIL;
- unsuitable as a semantic reflex provider under the current A–E interface.

Latency:
- mean: **1453.3 ms**
- median: **1406.2 ms**
- range: **1296.2–1985.3 ms**

SmolLM2 is materially faster than Qwen here but still far outside a high-frequency reflex target and semantically much less trustworthy.

## Qwen semantic challenge matrix

Five embodied situations, each tested in canonical and reverse order:

1. silent-pass
2. addressed-request
3. overheard-request
4. urgent-warning
5. fast-close

Observed semantic actions:

| challenge | canonical | reverse |
| --- | --- | --- |
| silent-pass | continue | continue |
| addressed-request | continue | continue |
| overheard-request | continue | continue |
| urgent-warning | withdraw | continue |
| fast-close | continue | continue |

The urgent warning changed the canonical decision, proving that prompt content can influence the readout. However that decision did not survive remapping, so this is **not yet robust semantic choice evidence**.

Latency:
- mean: **3265.4 ms**
- median: **3207.8 ms**
- range: **2981.5–3543.0 ms**

## Qwen five-position permutation sweep

Purpose: separate semantic preference from A–E / option-position bias.

Each semantic action occupied every one of the five label positions exactly once.

### silent-pass

| order | selected token | selected semantic action |
| --- | --- | --- |
| canonical | A | continue |
| rotate1 | A | orient |
| rotate2 | D | continue |
| rotate3 | A | investigate |
| rotate4 | A | withdraw |

Token `A` won **4/5** rotations.

### urgent-warning

| order | selected token | selected semantic action |
| --- | --- | --- |
| canonical | E | withdraw |
| rotate1 | E | continue |
| rotate2 | E | orient |
| rotate3 | E | acknowledge |
| rotate4 | A | withdraw |

Token `E` won **4/5** rotations.

Latency:
- mean: **3330.9 ms**
- median: **3301.9 ms**
- range: **3221.5–3473.2 ms**

## Current verdicts

### PASS

- WebGPU local inference works on the Owner machine using q8 fallback.
- Backend/model revisions are pinned.
- Actor-private state remains separated from World debug truth.
- Learned inference remains zero-authority.
- Qwen contains non-zero semantic signal: prompt meaning changes token preference.
- The lab can detect label/position bias instead of mistaking it for intelligence.

### FAIL / NOT ADEQUATE

- A–E constrained-choice generation is **not a trustworthy semantic action interface**.
- Qwen3-0.6B WebGPU/q8 at ~3.0–3.5 s per decision is **not a fast reflex brain**.
- SmolLM2-135M at ~1.3–1.5 s warm is also **not reflex-scale** in this browser path.
- SmolLM2 A–E behavior is dominated by first-label bias.
- Qwen semantic decisions are materially confounded by label/position bias.

## Next hypothesis

Do **not** tune the A–E prompt further as the primary route.

Next test:
- constrain generation directly to **semantic single-token action words**, not arbitrary letters;
- proposed semantic surfaces: `work / look / reply / inspect / leave`;
- dynamically verify that each chosen surface is a distinct single tokenizer token;
- map token identity directly to semantic action;
- repeat challenge and permutation/order tests;
- only if semantic-token readout survives bias checks should latency optimization become the next priority.

Longer-term alternatives if semantic-token generation remains unstable:
- candidate-wise yes/no scoring;
- batched semantic scoring;
- dedicated learned decision/readout head;
- LoRA / task-specific local reflex model;
- non-browser runtime if WebGPU overhead remains dominant.


## Semantic-token permutation sweep

The next hypothesis removed arbitrary A–E labels entirely.

Runtime dynamically resolved five distinct single-token semantic surfaces on Qwen:

- `work` -> continue
- `look` -> orient
- `reply` -> acknowledge
- `inspect` -> investigate
- `leave` -> withdraw

All five resolved as bare one-token surfaces on the live Qwen tokenizer.

The same two situations were tested across the five cyclic presentation orders.

### silent-pass

| order | selected keyword | selected action | latency |
| --- | --- | --- | ---: |
| canonical | work | continue | 3299.1 ms |
| rotate1 | look | orient | 3019.4 ms |
| rotate2 | look | orient | 2971.8 ms |
| rotate3 | look | orient | 3060.3 ms |
| rotate4 | look | orient | 3076.8 ms |

### urgent-warning

| order | selected keyword | selected action | latency |
| --- | --- | --- | ---: |
| canonical | reply | acknowledge | 3193.9 ms |
| rotate1 | look | orient | 3157.9 ms |
| rotate2 | reply | acknowledge | 3128.7 ms |
| rotate3 | look | orient | 3088.1 ms |
| rotate4 | leave | withdraw | 3114.6 ms |

Latency:
- mean: **3111.1 ms**
- median: **3101.4 ms**
- range: **2971.8–3299.1 ms**

### Interpretation

Removing A–E removes the arbitrary letter-token failure mode, but it does **not** make single-choice action selection robust.

The same private state changes its selected semantic action when only the presentation order changes. The model carries real semantic information, but the single mutually-exclusive choice interface remains materially confounded by contextual / presentation-order effects.

**Verdict: semantic-token single-choice path is NOT ADEQUATE as a trusted ReflexBrain action selector.**

This strengthens a broader architectural correction:

> R0 should stop treating “pick the next action” as the primary primitive.

The original ReflexBrain hypothesis was richer: fast independent appraisal signals such as attention, interruption pressure, threat, social relevance and deeper-cognition pressure. Those signals should not need to suppress one another inside one five-way softmax.

## Revised next hypothesis — independent semantic judgements

Next experiment should be closer to Jev Noul / appraisal than Jev Choice:

- evaluate bounded semantic propositions independently;
- use direct semantic `yes / no` token identities rather than arbitrary letters;
- capture the pre-mask yes/no logits inside the generation logits processor;
- convert the two captured values to a bounded conditional probability;
- keep each judgement independent from the other judgement labels;
- test proposition inversion / counterfactual pairs to expose yes/no or framing bias.

Initial candidate judgements:

- player deserves attention;
- current task should be interrupted;
- situation is socially relevant;
- situation may be immediately dangerous;
- deeper cognition is warranted.

This is not yet a claim that these are the final ReflexBrain dimensions. They are an R0 probe surface.

Important implementation opportunity: Transformers.js generation already computes only the next-token logits for sampling. A custom logits processor can capture the allowed `yes/no` scores **before masking**, avoiding the sequence-wide direct-forward tensor used by the earlier diagnostic path.


## Independent binary appraisal matrix — live result

The first Noul-like appraisal experiment evaluated five independent semantic propositions:

- attention;
- interrupt;
- social relevance;
- threat;
- deeper cognition.

Two embodied situations were used:

- `silent-pass`;
- `urgent-warning`.

Each appraisal was evaluated twice against the exact same private state:

1. positive proposition framing;
2. explicitly negated proposition framing.

The worker captured the **pre-mask yes/no logits** and normalized them to `P(yes)`. For the negative framing, the workbench converts the result back onto `P(positive) = 1 - P(yes)`, so positive and negated formulations should approximately agree if the binary semantic judgement is stable.

### Live Qwen result

All 20 evaluations selected **yes** — both for every positive proposition and for every explicitly negated proposition.

| situation | appraisal | P+ positive frame | P+ negative frame | framing Δ |
| --- | --- | ---: | ---: | ---: |
| silent-pass | attention | 0.963 | 0.001 | 0.962 |
| silent-pass | interrupt | 0.977 | 0.000 | 0.977 |
| silent-pass | social | 1.000 | 0.001 | 0.999 |
| silent-pass | threat | 1.000 | 0.000 | 1.000 |
| silent-pass | cognition | 1.000 | 0.056 | 0.944 |
| urgent-warning | attention | 1.000 | 0.000 | 1.000 |
| urgent-warning | interrupt | 0.995 | 0.000 | 0.995 |
| urgent-warning | social | 1.000 | 0.001 | 0.999 |
| urgent-warning | threat | 1.000 | 0.000 | 1.000 |
| urgent-warning | cognition | 1.000 | 0.008 | 0.992 |

Aggregate:

- mean framing disagreement: **0.9868**;
- mean normalized `P(positive)` across paired frames: **0.5001**;
- latency mean: **2624.7 ms**;
- latency median: **2638 ms**;
- latency range: **2380–2963 ms**.

### Interpretation

**FAIL — proposition + yes/no is not presently a trustworthy appraisal primitive for this stock Qwen path.**

The inversion test did exactly what it was intended to do: it exposed severe acquiescence / framing dependence that would have looked like extremely high confidence if only the positive prompts had been measured.

This result does **not** falsify independent appraisals as an architecture. It falsifies this particular readout:

`natural-language proposition -> is this true? -> yes/no logits`

under the current stock Qwen3-0.6B instruction model and browser runtime.

### Architectural consequence

The broader R0 evidence now rejects three naive stock-model interfaces as trusted ReflexBrain primitives:

1. arbitrary A–E multi-action choice — strong label / position confounds;
2. semantic-token multi-action choice — presentation-order instability remains;
3. independent proposition yes/no — severe acquiescence / negation framing failure.

The remaining hypothesis should stay close to **independent semantic dimensions**, but remove the yes/no proposition framing itself.

A stronger next falsifier is a **bipolar semantic appraisal** where each dimension is represented directly by opposed semantic token identities rather than a proposition plus generic yes/no answer, e.g.:

- relevant / irrelevant;
- interrupt / continue;
- social / unrelated;
- danger / safe;
- think / routine.

Each pair must be tokenizer-verified, counterbalanced with wording/order/synonym mutations, and evaluated as a bounded semantic contrast rather than as an instruction-following affirmation task.

If that also fails to provide stable counterfactual discrimination, R0 should stop trying to extract a trustworthy reflex primitive from an untrained stock instruction LM interface and move toward a dedicated learned readout/head or task-specific model.
