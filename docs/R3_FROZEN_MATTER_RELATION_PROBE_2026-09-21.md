# R3 Frozen Matter-Relation Probe — Live Evidence 2026-09-21

Status: **EXECUTION PASS · HYPOTHESIS FAIL**

Evidence source code head:

`420f7d70ee03593b0346db10f5b33a0c03ae57e7`

Live surface:

`r3-probe.html` on the deployed GitHub Pages research preview.

This was an internal autonomous research probe, not an Owner test.

## Question

Given a matter-free temporal fragment of actor-private life, can a frozen semantic encoder align that fragment with the actor's own continuing matter better than with other same-ecology matters?

Controls:
- matter text excluded from context query;
- actor id excluded;
- ecology label excluded;
- absolute tick excluded;
- fixture activity id/kind/phase excluded;
- future outcomes excluded;
- baseline wording paired with strong paraphrase wording;
- wording-only counterfactual leaves fixture life invariant;
- lexical Jaccard baseline measured first;
- semantic queries deduplicated by the actual model-visible semantic history.

## Runtime

- model: `Xenova/paraphrase-MiniLM-L3-v2`;
- revision: `4b544e74dfc3256b2b56849ea5d7064fee1ac846`;
- dtype: q8;
- device: WebGPU;
- batch size: 1;
- embedding dimensions: 384;
- unique texts: 43;
- load time: ~1863 ms;
- embedding time: ~2643 ms.

## Corpus reality after model-visible deduplication

| Ecology | Raw windows | Unique labeled queries | Unique semantic histories | Unique semantic frames | Ambiguous histories |
| --- | ---: | ---: | ---: | ---: | ---: |
| material-work | 3576 | 445 | 395 | 32 | 41 (~10.4%) |
| moving-contact | 2384 | 18 | 9 | 2 | 9 (100%) |

The large raw tick counts were misleading. Moving-contact currently exposes almost no model-visible semantic variety.

## Lexical control

| Ecology | Wording | Top-1 | Chance |
| --- | --- | ---: | ---: |
| material-work | baseline | 0.108 | 0.333 |
| material-work | paraphrase | 0.236 | 0.333 |
| moving-contact | baseline | 0.500 | 0.500 |
| moving-contact | paraphrase | 0.500 | 0.500 |

The material probe is not solved by trivial token overlap.

## Frozen MiniLM retrieval

| Ecology | Wording | Context | Top-1 | Chance | Mean positive margin |
| --- | --- | --- | ---: | ---: | ---: |
| material-work | baseline | last-frame | 0.124 | 0.333 | -0.0367 |
| material-work | baseline | mean-history | 0.126 | 0.333 | -0.0310 |
| material-work | paraphrase | last-frame | 0.290 | 0.333 | -0.0171 |
| material-work | paraphrase | mean-history | 0.265 | 0.333 | -0.0172 |
| moving-contact | baseline | last-frame | 0.500 | 0.500 | 0 |
| moving-contact | baseline | mean-history | 0.500 | 0.500 | 0 |
| moving-contact | paraphrase | last-frame | 0.500 | 0.500 | 0 |
| moving-contact | paraphrase | mean-history | 0.500 | 0.500 | 0 |

Material eventful-only results are essentially the same as aggregate results.

## Wording stability

Material-work:
- last-frame prediction agreement: ~0.009;
- last-frame both-positive agreement: ~0.002;
- mean-history prediction agreement: 0;
- mean-history both-positive agreement: 0.

Moving-contact:
- high apparent prediction agreement is not evidence of semantic robustness because the semantic histories are fully ambiguous and retrieval is at chance.

## Finding

**FAIL** for the direct relation hypothesis.

The correct conclusion is not "MiniLM failed the project."

The supported conclusion is:

> Direct sentence-embedding similarity between the current coarse private context and a continuing-matter statement is not a valid R3 semantic relation mechanism.

Potential causes that remain open:
- the static semantic frame omits important legitimate private transitions;
- actor-relative relevance is not equivalent to sentence similarity;
- exact relational facts may need a structured channel;
- the retrieval target may itself be the wrong abstraction.

## Next falsifier

Before training any head:

1. derive transition/event descriptions only from consecutive actor-private states;
2. keep World truth, policy labels and matter text excluded;
3. measure semantic diversity and ambiguity again;
4. rerun lexical control;
5. only rerun frozen encoder if the transition view adds real information.

If transition representation does not materially improve the evidence base, retire this relation-probe family.
