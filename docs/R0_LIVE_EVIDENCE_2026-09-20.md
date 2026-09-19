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
