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


## Post-result hardening — unseen state PASS, actor-relative matter dependence FAIL

The temporal consumer was extended beyond the original complete/delayed two-state specimen.

Live oracle pressure now also includes a third semantic state, `suspended`, with two distinct surface realizations. The oracle-only behavioral result remains qualitatively stable:
- new semantic states are acknowledged once;
- paraphrased restatements of an already settled state are suppressed;
- exact-text change still over-responds;
- throughput remains diagnostic only.

A separate temporal relation corpus then held `suspended` entirely out of TRAIN.

Evidence at `edb7a26f9a11e4286556a408e7dc555aa541f58e` / Check #247:
- TRAIN: 16 examples using only complete/delayed;
- held-out current-state: 8 examples where current state is unseen `suspended`;
- held-out history-state: 8 examples where acknowledged history is unseen `suspended`;
- all splits balanced 0.5 / 0.5;
- majority, exact-triple, current-only and history-only controls: 0.500 balanced accuracy;
- unigram and cross-token-pair controls: <= 0.600, in the qualified run exactly 0.500.

This is useful evidence that the bounded temporal relation is not reducible to the tested string/pair memorization shortcuts.

However, a stronger structural audit then exposed a scope failure.

Evidence head:
`1a14c6cc567ca415366521ff6933e8f00fbb2ac5`

CI:
- Check #248: PASS;
- build: PASS;
- deploy: PASS;
- 25 test files / 174 tests PASS.

Result:
- temporal examples: 32;
- temporal-evidence signatures with more than one matter meaning: **0**;
- matter-dependent label switches: **0**.

The temporal label is constructed from semantic-state change:
`priorAcknowledgedState !== currentState`.

Therefore the current temporal training target can be solved without actor-relative matter meaning. Matter text is present in the input, but no counterfactual in this corpus ever requires it to change the answer.

### Reclassification

**QUALIFIED**
- bounded temporal semantic consumer value, oracle-only;
- semantic settlement/history can matter downstream;
- unseen-state temporal evaluation defeats the tested simple memorization controls.

**NOT QUALIFIED**
- the current temporal corpus as a complete actor-relative ReflexBrain target;
- evidence that a learner must use actor purpose;
- a learner trained on this corpus as proof of actor-relative meaning.

The next target must require all three:
1. actor-private purpose/matter meaning;
2. actor-private settled semantic history;
3. current private evidence.

The same history/current pair must be able to change label when purpose changes, and the same purpose/current pair must be able to change label when history changes.

Do not train the current temporal corpus as if it already demonstrates the full actor-relative relation.
