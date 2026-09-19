# R0 runtime evidence — 2026-09-20

Status: **measured / bounded**, not a ReflexBrain runtime qualification.

This document records the first browser/WebGPU measurements for the R0 local semantic-shadow apparatus. It intentionally separates demonstrated facts from interpretation so later work does not re-open already falsified assumptions.

## Qualified apparatus

- Branch: `experiment/r0-semantic-shadow-bootstrap`
- Evidence boundary before this document: `a8b35aae539d541ca611b14883666bed72dc62ca`
- Browser: Owner Opera session
- Backend: Transformers.js 4.3.0
- Model: `onnx-community/Qwen3-0.6B-ONNX`
- Pinned model revision: `b1ece21c06dfce3839272e86b7fa12a985d97a7a`
- Hardware capability observed by worker: WebGPU available, `shader-f16=false`
- Selected dtype: `q8`
- Learned inference authority: **zero**. The World trajectory remains deterministic and independent of model output.

## Runtime findings

### F16 path

`q4f16` loads but inference fails on the Owner browser/GPU because the WebGPU device does not expose the required f16 shader capability:

`Gather requires f16 but the device does not support it.`

R0 therefore routes no-f16 WebGPU devices to q8. This is a measured hardware/runtime constraint, not a general statement about q4f16.

### Transformers.js generation scores

Transformers.js 4.3.0 exposes `output_scores` / `return_dict_in_generate` in generation configuration, but the exact 4.3.0 implementation does not return generation scores/logits: those fields are still commented TODOs in `generate()`.

Therefore R0 does **not** infer probabilities from a missing generation API. Distributional evidence uses a direct model forward.

### Direct-logit shape

A direct q8 forward for the addressed tick-10 state produced:

- input tokens: 193
- logits shape: `[1, 193, 151936]`

Passing `num_logits_to_keep=1` did not reduce this direct-forward output for this export/path. The evidence probe therefore materializes full-sequence logits and is not a candidate fast runtime path.

## Semantic/order falsifier

The same addressed private state was evaluated with two label mappings:

- canonical: `A=continue, B=orient, C=acknowledge, D=investigate, E=withdraw`
- reverse: `A=withdraw, B=investigate, C=acknowledge, D=orient, E=continue`

Measured results:

| Order | Latency | A–E full-vocab mass | Top token | Top semantic action | P(continue) |
| --- | ---: | ---: | --- | --- | ---: |
| canonical | 3796.2 ms | 98.073% | A | continue | 0.856 |
| reverse | 3261.8 ms | 99.986% | E | continue | 0.999 |

**Demonstrated:** semantic identity moved with the option text when the labels were reversed. The result is not explainable by a fixed preference for A or E.

**Also demonstrated:** the numerical distribution is strongly order-sensitive. The conditional probabilities are therefore not presently usable as calibrated semantic confidence.

## Full direct-logit matrix

Same loaded q8 model session; exposures × two label orders × two deterministic repeats.

| Exposure | Order | Rep 1 | Rep 2 | A–E mass | Top semantic action | P(top) |
| --- | --- | ---: | ---: | ---: | --- | ---: |
| addressed | canonical | 3398.3 ms | 3194.3 ms | 98.073% | continue | 0.8562 |
| addressed | reverse | 3377.6 ms | 3191.1 ms | 99.986% | continue | 0.9990 |
| overheard | canonical | 3436.1 ms | 3171.8 ms | 96.728% | continue | 0.3570 |
| overheard | reverse | 3374.4 ms | 3199.2 ms | 99.845% | continue | 0.9220 |
| none | canonical | 3150.2 ms | 2979.6 ms | 99.792% | continue | 0.8896 |
| none | reverse | 3177.2 ms | 2980.6 ms | 95.957% | continue | 0.9616 |

Latency summary:

- mean: **3219.2 ms**
- median: **3192.7 ms**
- rep-1 mean: **3319.0 ms**
- rep-2 mean: **3119.4 ms**
- min/max: **2979.6 / 3436.1 ms**

The distributions were identical across repeat 1 and repeat 2 for the same state/order.

## Constrained one-token generation falsifier

A second readout path used `generate(max_new_tokens=1, do_sample=false)` with a custom logits processor that leaves only the five A–E token logits finite. The generated letter is mapped back to the semantic action. This avoids extracting or normalizing the full vocabulary in application code and tests whether readout overhead caused the ~3 s latency.

Results:

| Exposure | Order | Rep 1 | Rep 2 | Selected semantic action |
| --- | --- | ---: | ---: | --- |
| addressed | canonical | 3547.5 ms | 3205.2 ms | continue |
| addressed | reverse | 3418.3 ms | 3225.5 ms | continue |
| overheard | canonical | 3236.6 ms | 3225.2 ms | continue |
| overheard | reverse | 3229.4 ms | 3225.1 ms | continue |
| none | canonical | 3088.3 ms | 2979.9 ms | continue |
| none | reverse | 2999.3 ms | 2960.9 ms | continue |

Latency summary:

- mean: **3195.1 ms**
- median: **3225.2 ms**
- rep-1 mean: **3253.2 ms**
- rep-2 mean: **3137.0 ms**
- min/max: **2960.9 / 3547.5 ms**
- difference from direct-logit mean: about **-0.75%**

**Falsified:** application-side full-distribution extraction is not the material latency bottleneck. Choice-only generation is effectively the same speed.

## Current interpretation

### PASS — apparatus

The R0 apparatus now demonstrates:

1. actor-private input is separate from World/debug truth;
2. local model inference has zero World authority;
3. the browser/WebGPU model path works on the Owner machine through q8 fallback;
4. A–E are natural next-token responses in the tested prompts (roughly 96–100% full-vocabulary mass);
5. semantic action identity survives the canonical/reverse label remapping;
6. repeated identical probes are deterministic under this configuration.

### FAIL — current Qwen q8 as a fast reflex backend

Warm same-session decisions remain roughly **3.0–3.3 seconds**. The constrained one-token path does not materially improve this. On the measured Owner hardware/export, this backend is not a fast semantic reflex runtime.

Do not optimize prompt wording as a substitute for solving this backend/runtime problem.

### NOT PROVEN — useful semantic discrimination

All 12 matrix conditions selected `continue` as the top semantic action. The probability landscape changes with exposure, but top-action behavior does not yet demonstrate useful differentiation between addressed, overheard, and no-speech states.

Order sensitivity is also large enough that raw conditional probability should not be treated as confidence.

## Decision gate

The next experiment should keep the **same private-state / action / order-falsification contract** and benchmark smaller or more suitable local semantic decision backends.

Primary question:

> Can a browser-local model preserve the semantic remapping evidence while reducing steady-state decision latency by at least an order of magnitude?

Initial engineering target for candidate screening: **sub-300 ms**, with sub-100 ms desirable. This is an experiment target, not yet a product requirement.

Candidates should be evaluated before deeper prompt tuning. R0 Qwen q8 remains the evidence baseline, not the presumed production architecture.
