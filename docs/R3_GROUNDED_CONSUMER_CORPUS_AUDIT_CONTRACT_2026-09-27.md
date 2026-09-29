# R3 Grounded Consumer Corpus Audit Contract — 2026-09-27

Status: **FROZEN PRE-MODEL AUDIT · NO REPRESENTATION PROBE**

## Trigger

The grounded recurrent-report consumer is qualified:

**GROUNDED_TEMPORAL_CONSUMER_VALUE_QUALIFIED**

That proves a bounded downstream need, not that the current ecology is a valid learned dataset.

The next question is therefore:

> Does the smallest actor-private corpus induced by the qualified ideal consumer contain a learnable temporal relation, or does it merely leak fixture/policy state?

## Source run

Use exactly:
- `ideal-grounded-episode`;
- 1800 ticks;
- frozen grounded recurrent-report consumer ecology;
- no World-hidden state in corpus rows.

## Row definition

One row per Mira-private observation that hears Janek's exact grounded request:

`The input rack is empty.`

For audit provenance only, derive target `updateWorthy` from **Mira-private factual history**, not from the ideal policy's `pendingSupply` field:

- first heard grounded request is update-worthy;
- after a heard request, further identical requests remain non-update-worthy until Mira privately observes settlement;
- settlement requires a later Mira-private observation where:
  - Mira holds no object;
  - Mira is locally able to inspect the input rack;
  - a free `raw_blank` is visible at the rack;
- after such private settlement, the next grounded request is update-worthy again.

The label generator must not inspect:
- hidden World snapshots;
- shortage episode ids;
- the ideal policy's private implementation fields;
- future information beyond already-observed settlement before the current report.

## Audit-only row fields

Record, but do not declare them valid learned inputs:
- current report text;
- speaker id;
- listener matter text/id;
- absolute tick;
- request ordinal;
- listener x/y;
- `activityBefore.kind`;
- `activityBefore.phase`;
- whether listener currently holds an object;
- counts of visible raw blanks at rack/source;
- counts of known raw object beliefs;
- prior heard-event count;
- target `updateWorthy`.

## Mandatory shortcut diagnostics

Report:
- corpus size and class balance;
- number of distinct report surfaces;
- distinct speakers;
- distinct listener matter statements;
- distinct activity phases;
- whether any single activity phase deterministically maps to one class;
- best balanced accuracy of:
  - majority baseline;
  - exact report surface;
  - speaker id;
  - matter id;
  - request ordinal threshold;
  - absolute tick threshold;
  - listener x threshold;
  - listener y threshold;
  - activity kind;
  - activity phase;
  - held/not-held;
  - visible rack-stock bit;
  - visible source-stock bit;
  - prior-heard-count threshold.

All threshold searches are diagnostic only; they do not authorize feature tuning for a future model.

## Purpose counterfactual audit

The current source ecology has one fixed Mira matter.

Therefore explicitly report whether the corpus contains:

> the same grounded report + comparable private temporal state under at least two listener-purpose meanings with opposite update-worthiness.

Do not synthesize this counterfactual inside the corpus audit.

## Classification

### GROUNDED_CONSUMER_CORPUS_EMPTY

No usable rows / both classes absent.

### GROUNDED_CONSUMER_CORPUS_UNDERIDENTIFIED

Any of:
- fewer than 20 rows;
- minority class fewer than 5 rows;
- no purpose counterfactual;
- one fixture/policy-state shortcut reaches BA >= 0.90;
- report/speaker/matter diversity is too narrow to distinguish semantic learning from fixture recognition.

### GROUNDED_CONSUMER_CORPUS_AUDITABLE

Only if:
- >=20 rows;
- >=5 rows per class;
- purpose counterfactual exists;
- no listed trivial shortcut reaches BA >= 0.90;
- current exact surface alone is insufficient;
- labels are derived from listener-private history.

This status still does not authorize model training. It only earns a separately frozen representation hypothesis.

## No-rescue rule

Do not broaden the run, add paraphrases, change timing, add purposes, rebalance rows or modify the consumer after seeing this audit.

If underidentified, record the exact reason and design the next grounded pressure from that evidence.
