# R3 Concurrent-Matter Causal Probe — Live Evidence 2026-09-22

Status: **EXECUTION PASS · CAUSAL TARGET QUALIFIED · DIRECT COSINE FAIL**

Qualified code head:

`02ab58edb826c38c6f2d6bbf5a511d2f97d7ab55`

Live browser path:
- GitHub Pages research preview;
- frozen `Xenova/paraphrase-MiniLM-L3-v2`;
- pinned revision `4b544e74dfc3256b2b56849ea5d7064fee1ac846`;
- q8;
- WebGPU;
- isolated `batchSize=1`;
- 384 dimensions.

Runtime on the recorded live run:
- model load ~1139 ms;
- 88 unique texts;
- embedding pass ~6091 ms.

## Supervision mechanism

Two same-actor matters coexist in the resident.

For a sampled state:

1. replay deterministic baseline prefix with both matters present;
2. derive the matter-free actor-private transition query before intervention;
3. replay the identical prefix for each ablation variant;
4. immediately before the next decision remove exactly one private matter;
5. advance one tick;
6. compare the local decision;
7. retain only states where exactly one matter's removal changes the decision.

This labels causal local responsibility without inventing a scalar relevance score.

## Corpus audit

| Actor | Examples | Label balance | Unique histories | Ambiguity |
| --- | ---: | --- | ---: | ---: |
| Janek | 18 | 9 / 9 | 11 | 1 / 11 (~9.1%) |
| Ida | 18 | 9 / 9 | 7 | 2 / 7 (~28.6%) |

The same counts hold under wording-only paraphrase because fixture decisions are gated by matter identity, not statement text.

## Lexical falsifier

Chance = 0.5.

| Actor | Wording | Lexical top-1 | Tie rate |
| --- | --- | ---: | ---: |
| Janek | baseline | 0.778 | 0.722 |
| Janek | paraphrase | 0.500 | 0.944 |
| Ida | baseline | 0.611 | 0.889 |
| Ida | paraphrase | 0.500 | 1.000 |

The paraphrase variant removes the usable surface-token shortcut.

## Frozen semantic retrieval

| Actor | Wording | Context | Top-1 | Mean responsible margin |
| --- | --- | --- | ---: | ---: |
| Janek | baseline | last-transition | 0.500 | +0.0097 |
| Janek | baseline | mean-transitions | 0.500 | +0.0131 |
| Janek | paraphrase | last-transition | 0.500 | +0.0065 |
| Janek | paraphrase | mean-transitions | 0.500 | +0.0085 |
| Ida | baseline | last-transition | 0.500 | +0.0009 |
| Ida | baseline | mean-transitions | 0.500 | +0.0022 |
| Ida | paraphrase | last-transition | 0.500 | -0.0048 |
| Ida | paraphrase | mean-transitions | 0.500 | -0.0028 |

Every top-1 result is exactly chance.

## Wording stability

Every actor/mode has:
- prediction agreement = 1.0;
- responsible prediction agreement = 0.5.

The semantic geometry is wording-stable but not causally correct.

## Finding

**FAIL** for direct frozen cosine as a causal matter-relevance mechanism.

The earlier same-actor Janek signal remains valid only in its narrower scope: MiniLM preserved domain-level semantic relation after paraphrase. It did not predict causal responsibility here.

## Why not train a head yet

The stronger target still contains a structural confound:

- workshop matter responsibility only occurs in the material-work ecology;
- contact matter responsibility only occurs in the moving-contact ecology.

A learned head can therefore win by learning domain/ecology separation.

The next falsifier must create responsibility switching between concurrently owned matters **within one ecology for one actor**, with paired matter ablation providing labels.
