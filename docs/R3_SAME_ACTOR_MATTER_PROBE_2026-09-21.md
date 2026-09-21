# R3 Same-Actor Matter Probe — Live Evidence 2026-09-21

Status: **EXECUTION PASS · PARTIAL REPRESENTATION SIGNAL · GENERALIZATION FAIL**

Qualified code head:

`339913c72f7215e3802f1a35b4102e3199193fce`

The probe ran in-browser with the pinned frozen MiniLM-L3 q8 WebGPU path, isolated `batchSize=1`.

## Why this probe exists

The prior matter-retrieval experiment used matters belonging to different residents as negatives. That could reward role recognition.

This stricter probe asks, independently for Janek and Ida:

> Which of this same actor's two known matters is better aligned with the current matter-free private transition history?

The two matters come from the already-qualified material and moving-contact ecologies.

## Corpus identifiability

| Actor | Unique labeled queries | Unique histories | Ambiguous histories |
| --- | ---: | ---: | ---: |
| Janek | 136 | 127 | 9 (~7.1%) |
| Ida | 109 | 106 | 3 (~2.8%) |

Both candidate sets contain exactly two matters owned by the same actor.

## Lexical control

Chance top-1 = 0.5.

| Actor | Wording | Lexical top-1 |
| --- | --- | ---: |
| Janek | baseline | 0.816 |
| Janek | paraphrase | 0.412 |
| Ida | baseline | 0.881 |
| Ida | paraphrase | 0.349 |

Strong paraphrase destroys the surface-token shortcut.

## Frozen semantic retrieval

| Actor | Wording | Context | Top-1 | Mean positive margin |
| --- | --- | --- | ---: | ---: |
| Janek | baseline | last-transition | 0.743 | +0.0470 |
| Janek | paraphrase | last-transition | 0.713 | +0.0364 |
| Janek | baseline | mean-transitions | 0.662 | +0.0326 |
| Janek | paraphrase | mean-transitions | 0.654 | +0.0238 |
| Ida | baseline | last-transition | 0.523 | +0.0155 |
| Ida | paraphrase | last-transition | 0.486 | +0.0066 |
| Ida | baseline | mean-transitions | 0.514 | +0.0138 |
| Ida | paraphrase | mean-transitions | 0.440 | +0.0036 |

Eventful-only numbers are essentially the same.

## Wording stability

| Actor | Context | Prediction agreement | Both-positive agreement |
| --- | --- | ---: | ---: |
| Janek | last-transition | 0.956 | 0.706 |
| Janek | mean-transitions | 0.919 | 0.618 |
| Ida | last-transition | 0.963 | 0.486 |
| Ida | mean-transitions | 0.927 | 0.440 |

High Ida prediction agreement is not success: it is largely stable repetition of the same wrong preference under paraphrase.

## Finding

Janek provides the first positive R3 semantic representation evidence:

- lexical paraphrase performance collapses below chance;
- frozen embedding retrieval remains around 0.71;
- positive margins remain positive;
- predictions are highly stable across wording.

Ida falsifies generalization of that result.

Therefore the correct classification is:

**PARTIAL SIGNAL, NOT PROMOTION.**

## Remaining target flaw

The two same-actor matters never coexist in the same actor state. They originate from separate ecologies.

Thus the probe still partially asks:

> Which life-domain generated this private trajectory?

rather than the stronger:

> Of my concurrently held matters, which one is causally relevant to what is happening now?

The next probe must use concurrent same-actor matters and causal ablation to establish supervision.
