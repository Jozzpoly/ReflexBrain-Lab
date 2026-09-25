# R3 Mixed-Pressure Frozen MiniLM Probe — Live Evidence 2026-09-25

Status: **EXECUTION PASS · DIRECT-COSINE FAMILY FAIL / REJECTED**

Qualified implementation checkpoint:

`e3e00cf7b0fca04196e2292422a97022e7aab77f`

Execution environment:
- real Opera browser;
- WebGPU;
- `Xenova/paraphrase-MiniLM-L3-v2`;
- revision `4b544e74dfc3256b2b56849ea5d7064fee1ac846`;
- q8;
- isolated batchSize=1;
- 384 dimensions;
- 17 unique texts;
- load ~2021 ms;
- embedding ~1843 ms.

## Target

One Janek in one continuous mixed-pressure ecology holds two matters concurrently:
- workshop processing;
- local report response.

Causal responsibility is derived by paired matter ablation after an identical deterministic prefix.

Per wording:
- 12 examples;
- 6 workshop-responsible;
- 6 report-responsible;
- 9 unique transition histories;
- 0 ambiguous histories;
- chance top-1 = 0.5.

Lexical controls:
- baseline: 0.333;
- paraphrase: 0.583.

## Frozen semantic retrieval

| wording | context | top-1 | margin |
| --- | --- | ---: | ---: |
| baseline | last-transition | 0.417 | +0.0213 |
| baseline | mean-transitions | 0.500 | +0.0109 |
| paraphrase | last-transition | 0.500 | -0.0150 |
| paraphrase | mean-transitions | 0.500 | +0.0049 |

### Per-matter accuracy

Baseline / last-transition:
- workshop: 0.667;
- report: 0.167.

Baseline / mean-transitions:
- workshop: 0.833;
- report: 0.167.

Paraphrase / last-transition:
- workshop: 0.000;
- report: 1.000.

Paraphrase / mean-transitions:
- workshop: 0.000;
- report: 1.000.

The paraphrase conditions are therefore not balanced 50/50 competence. They are a complete one-class collapse.

## Wording stability

Last-transition:
- paired queries: 12;
- prediction agreement: 0.250;
- responsible-prediction agreement: 0.0833.

Mean-transitions:
- paired queries: 12;
- prediction agreement: 0.167;
- responsible-prediction agreement: 0.0833.

Only one of twelve paired queries remains correct under both wordings.

## Conclusion

**Reject direct cosine as the R3 matter-relevance relation mechanism.**

This result closes the main remaining confound in prior failures:
- actor is fixed;
- ecology is fixed;
- both candidate matters coexist;
- responsibility switches within the ecology;
- ground truth is intervention-derived;
- retained query histories are label-unambiguous.

Independent embedding similarity does not track causal responsibility.

No rescue by:
- larger encoder capacity;
- a learned head on this tiny target;
- wording tuning;
- changing the target solely to recover a score.

The frozen encoder may remain useful as a donor representation inside a later joint relation model, but cosine nearest-matter is closed.
