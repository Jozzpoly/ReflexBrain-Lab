# R3 Grounded Consumer Corpus Audit Result — 2026-09-27

Status: **GROUNDED_CONSUMER_CORPUS_UNDERIDENTIFIED · NO MODEL AUTHORIZED**

## Frozen contract

`docs/R3_GROUNDED_CONSUMER_CORPUS_AUDIT_CONTRACT_2026-09-27.md`

The audit was frozen before execution.

Source:
- qualified `ideal-grounded-episode` consumer;
- 1800 ticks;
- one row per Mira-private reception of Janek's grounded empty-rack report;
- target reconstructed from Mira-private heard history + prior private rack-settlement evidence;
- target does not read the ideal policy's `pendingSupply` implementation field or hidden World state.

## Qualified head

Exact audited head:

`89ce3a196360a727ab4142b56fb4415a8ebc07d3`

Qualification:
- Check #320 PASS;
- 35/35 test files PASS;
- 198/198 tests PASS;
- build PASS.

## Corpus facts

Rows: **9**

Target balance:
- update-worthy: **8**
- redundant/unresolved repeat: **1**

Diversity:
- report surfaces: **1**
- speakers: **1**
- listener matter ids: **1**
- listener matter statements: **1**
- activity kinds: **1**
- activity phases: **2**
- same-report purpose counterfactual: **absent**

The one negative row is the second report in the first unresolved shortage episode.

## Shortcut diagnostics

Balanced accuracy on the same frozen rows:

| Diagnostic shortcut | BA |
| --- | ---: |
| activity phase | **1.0000** |
| holding/not holding object | **1.0000** |
| listener X threshold | **1.0000** |
| visible source stock | **1.0000** |
| absolute tick threshold | **0.9375** |
| known raw belief count | **0.9375** |
| prior heard count threshold | **0.9375** |
| request ordinal threshold | **0.9375** |
| activity kind | 0.5000 |
| exact report text | 0.5000 |
| listener Y threshold | 0.5000 |
| majority | 0.5000 |
| matter id | 0.5000 |
| speaker id | 0.5000 |
| visible rack stock | 0.5000 |

The fact that exact report text scores only 0.5 is desirable but insufficient. Multiple fixture-state and timing shortcuts almost perfectly or perfectly reveal the target.

## Why the leakage occurs

All positive reports except the first arise when Mira has returned close to the source and is in `wait_for_report`.

The single negative repeat occurs while she is still carrying the requested raw blank toward the rack:
- activity phase: `carry_requested_raw`;
- holding object: true;
- x ≈ 7.54;
- source stock not visible.

Therefore the present corpus teaches:

> recognize where Mira is inside this one hand-authored response script

far more directly than:

> relate a grounded report to actor-private temporal settlement/history.

## Precommitted classification

The frozen contract requires UNDERIDENTIFIED if any of:
- fewer than 20 rows;
- minority class fewer than 5;
- no purpose counterfactual;
- trivial shortcut BA >= 0.90;
- report/speaker/matter diversity too narrow.

All five failure families occur.

Classification:

**GROUNDED_CONSUMER_CORPUS_UNDERIDENTIFIED**

## What survives

The preceding consumer result remains valid:

**GROUNDED_TEMPORAL_CONSUMER_VALUE_QUALIFIED**

The corpus FAIL does not invalidate the causal need. It shows that the first obvious dataset extracted from that consumer would train on apparatus state rather than the desired relation.

This is exactly why the corpus audit exists before model selection.

## Consequence

Do not:
- train MiniLM or another encoder on these 9 rows;
- extend the same run horizon merely to get more rows;
- rebalance/duplicate rows;
- remove leaking columns and declare the problem solved;
- treat `pendingSupply`, `activity.phase` or position as the desired learned target;
- generate paraphrases before the underlying pressure is identifiable.

The next pressure must structurally break the leak.

Required properties for the next grounded ecology:
1. same grounded report must occur in both update-worthy and redundant contexts at overlapping positions/activity conditions;
2. repeated unresolved reports must sometimes occur when the listener is not physically carrying a response object;
3. new recurrent reports must sometimes occur while the listener is away from the source / in non-idle activity;
4. same report + comparable temporal state must flip usefulness under at least two listener purposes;
5. purpose flip must have a causal downstream consequence, not just an authored label;
6. listener-private settlement/confirmation remains the history authority;
7. report grounding remains speaker-private and factual;
8. no hidden episode id or World truth becomes model input.

Only after a new pressure survives these structural checks should another corpus audit be frozen.

No learned ReflexBrain authority exists.
No Owner/product claim changes.
