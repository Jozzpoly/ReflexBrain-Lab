# R3 Temporal Semantic Consumer Result — 2026-09-25

Status: **SECOND BOUNDED CONSUMER FAMILY QUALIFIED · TEMPORAL/SEMANTIC · ORACLE-ONLY · NO LEARNED CLAIM**

Qualified evidence head:

`bc32c3971f2653816e08d8e2d89f3df84a381c04`

CI:
- Check #242: PASS;
- 24 test files / 171 tests: PASS.

## Question

Does actor-private temporal semantic history provide useful downstream information beyond a static matter↔message match?

The tested consumer asks:

> Has this semantically reported depot status changed since the last status Janek already acknowledged, or is the current utterance only a paraphrased restatement of settled information?

The oracle is hand-authored research instrumentation. It is not a learned ReflexBrain and its internal semantic state is not automatic training supervision.

## Pressure construction

Janek continues ordinary workshop work.

Ida emits forty deterministic report episodes. Each episode:
1. introduces a genuinely changed semantic state, alternating `complete` / `delayed`;
2. one pressure slot later restates the same state with different wording;
3. if no acknowledgement has resolved the state, a final repeat remains as additional World speech pressure.

The second utterance therefore has the same semantic state but a different text surface.

## Controls

- `ignore-all`;
- `respond-all`;
- `exact-text-change` — acknowledge whenever the current string differs from the last acknowledged string;
- `ideal-semantic-state-change` — acknowledge only when the report's semantic state differs from the last semantically acknowledged state.

## Result

| mode | Ida speech | Janek ACK | ordinary worker ticks | activity-id changes | processing completed |
| --- | ---: | ---: | ---: | ---: | ---: |
| ideal semantic state-change | **80** | **40** | **1401** | 131 | 13 |
| exact-text-change | 80 | 80 | 1361 | 204 | 13 |
| respond-all | 80 | 80 | 1361 | 204 | 13 |
| ignore-all | **120** | 0 | 1441 | 54 | 13 |

The ideal temporal oracle resolves every genuinely changed report with one acknowledgement while suppressing every paraphrased duplicate.

The exact-text baseline cannot identify the duplicate relation and behaves exactly like respond-all.

Ignoring reports leaves each episode unresolved long enough to create an additional World speech event.

## Exact qualified claim

Within this authored pressure family, the downstream consumer benefits from a semantic summary of **settled private history**, not only from current message text or current matter meaning.

This is qualitatively different from the earlier static purpose↔message consumer:
- current semantic content matters;
- prior semantic settlement matters;
- a paraphrased duplicate must be treated differently from a genuinely changed state;
- exact string change is insufficient.

## What is NOT qualified

- learned temporal semantic competence;
- a final memory representation;
- a final ReflexBrain recurrent state;
- the oracle's `lastAcknowledgedSemanticState` as architecture;
- throughput gain — all conditions completed 13 processing cycles;
- broad state/domain generalization;
- Owner/product life claims.

## Next falsifier

Before model work, construct a consumer-shaped temporal relation corpus in which:
- current message alone is insufficient;
- prior acknowledged history alone is insufficient;
- exact text/pair memorization is insufficient;
- held-out paraphrases survive;
- at least one semantic state is held out entirely from TRAIN;
- the relation remains actor-private and tied to the already-qualified temporal consumer.

Only if simple controls fail and the relation stays identifiable should a learned joint temporal relation probe be considered.
