# R3 Grounded Material Semantic Consumer Contract — 2026-09-27

Status: **FROZEN BEFORE IMPLEMENTATION · ORACLE CONSUMER ONLY · NO LEARNED MODEL**

## Trigger

Two campaign decisions are now qualified:

1. row-level temporal `updateWorthy` is not the next learned target; deterministic actor-private settlement is sufficient for the current bounded recurrence problem;
2. the ordinary host contains a grounded semantic diversity seed.

The next question is therefore:

> Does actor-relative semantic routing remain causally useful when the report meanings are grounded in real private material facts rather than authored abstract status classes?

## Why rack-empty × source-empty

The opportunity audit found:
- rack stock changes recurrently and is privately observed by Mira/Janek;
- source stock changes recurrently for Mira;
- both are existing World facts.

For the first material semantic consumer use the two **empty** facts:

### rack-empty
`The input rack is empty.`

Speaker: Janek.

Grounding:
- Janek is within local rack inspection range;
- no free raw blank is privately visible at rack in the same observation.

### source-empty
`The raw source is empty.`

Speaker: Mira.

Grounding:
- Mira is within local source inspection range;
- no free raw blank is privately visible at source in the same observation.

The two surfaces deliberately share the semantic predicate `empty` and differ mainly in what material place they refer to.

`output_has_finished` is preserved as a strong later second-pressure donor rather than mixed into this first consumer.

## World

Research-only material ecology:
- source: x=4,y=0;
- input rack: x=8,y=0;
- workbench: x=10,y=0;
- output: x=12,y=0;
- depot: x=18,y=0;
- source capacity 3;
- source replenish interval 120 ticks;
- processing 24 ticks;
- initial source raw stock 3.

Actors:
- Mira: ordinary steward material behavior plus source-empty reporting instrumentation;
- Janek: ordinary worker material behavior plus rack-empty reporting instrumentation;
- Ida: stationary semantic listener at x=6,y=1.

Ida sensors:
- sight radius 0.75;
- hearing radius 5.

Therefore both source and rack centers are outside Ida's direct sight but inside local hearing range when the reporter is at the inspected place.

Frozen horizon:
- **5400 ticks per run**.

No courier is required for this pressure. Finished output may accumulate; it is not an input to the tested consumer.

## Ida semantic matter

Use one fixed matter id:

`resident:ida:matter:grounded-material-status`

Two matter meanings:

### rack-purpose

> acknowledge grounded reports about whether the workshop input rack is empty; source-empty reports are not part of this monitoring responsibility

### source-purpose

> acknowledge grounded reports about whether the raw source is empty; rack-empty reports are not part of this monitoring responsibility

Only the statement meaning changes.
The matter id remains identical.

Ida's physical state and sensor configuration remain identical.

## Deterministic temporal bookkeeping

Each reporter maintains research-only episode bookkeeping:
- a fact episode opens when the reporter privately observes its fact become true;
- an acknowledgement may mark that report episode handled;
- the episode resets only after the reporter privately observes the fact false again.

This bookkeeping is:
- deterministic;
- speaker-private;
- inspectable;
- not a learned target.

## Stage A — same-pressure relation test

Purpose:
- prove the semantic consumer depends on report meaning × matter meaning, not matter id, speaker id or one fixed report surface.

Reporting:
- each fact episode emits **one** grounded report;
- report emission does not depend on Ida purpose or listener mode;
- no retry after acknowledgement or non-acknowledgement in Stage A.

Modes:
- `ignore-all`;
- `respond-all`;
- `rack-surface-only`;
- `source-surface-only`;
- `rack-speaker-only`;
- `source-speaker-only`;
- `ideal-semantic-oracle`.

The speaker-only controls are intentionally redundant with the current one-speaker-per-domain apparatus; they are kept explicit because speaker identity is a dangerous future shortcut.

Ideal oracle:
- parse Ida matter statement;
- identify grounded report meaning;
- acknowledge iff report domain matches current matter meaning.

The ideal oracle is authored research instrumentation.
It is not training supervision by default.

### Stage-A gates

Across rack-purpose and source-purpose runs:

1. both report domains occur at least 10 times;
2. every report is same-observation privately grounded;
3. Ida directly sees neither source/rack state on report rows;
4. ideal relation accuracy = 1.000;
5. each fixed-surface control aggregated across both purposes <=0.55 relation accuracy;
6. each speaker-only control aggregated across both purposes <=0.55;
7. matter-id-only control = majority baseline because matter id is fixed;
8. report timelines are identical across listener modes within the same purpose world.

If the material trajectories/report timelines change because Ida's acknowledgement alone perturbs reporters in Stage A:

**GROUNDED_MATERIAL_RELATION_PRESSURE_INVALID**

If semantic gates fail:

**GROUNDED_MATERIAL_RELATION_FAIL**

## Stage B — grounded persistent consumer value

Purpose:
- test whether correct semantic routing removes bounded recurring communication pressure without responding to factual decoys.

This stage is a separate pressure regime.

For the current purpose-relevant domain:
- a grounded true fact episode emits a primary report;
- while the same fact remains privately true and unacknowledged, repeat every **45 ticks**;
- correct acknowledgement settles communication for that fact episode;
- fact becoming false also ends the episode naturally.

For the purpose-irrelevant domain:
- emit one grounded report at episode start;
- do not retry it.

This required/decoy persistence assignment is authored pressure instrumentation and is explicitly purpose-aware at the pressure source.
It is **not** a candidate resident architecture and not training-label provenance.

The 45-tick repeat interval is frozen before execution and equals the existing ordinary worker first blocked-report threshold.

Modes:
- same seven listener modes as Stage A.

### Stage-B metrics

Per run:
- grounded rack reports;
- grounded source reports;
- relevant primary reports;
- relevant repeat reports;
- relevant reports acknowledged;
- decoy reports acknowledged;
- total reporter speech events;
- total Ida acknowledgements;
- Janek processing completions.

Aggregate across both purposes.

### Stage-B causal gates

Require:
1. ideal acknowledges all relevant primary episodes that remain true long enough to be heard;
2. ideal acknowledges zero decoy reports;
3. ignore-all leaves strictly more relevant repeat reports than ideal;
4. respond-all resolves relevant repeat pressure but acknowledges strictly more decoys than ideal;
5. rack-surface/rack-speaker control succeeds only in rack-purpose and fails source-purpose;
6. source-surface/source-speaker control succeeds only in source-purpose and fails rack-purpose;
7. ideal total communication actions are lower than respond-all **or**, if physical timing prevents that, ideal must at minimum achieve equal relevant-pressure resolution with strictly fewer listener acknowledgements and zero decoy acknowledgements;
8. no product/throughput superiority is required.

If no real repeat pressure occurs in one required domain:

**GROUNDED_MATERIAL_CONSUMER_PRESSURE_TOO_NARROW**

If pressure exists but oracle has no bounded consumer advantage:

**GROUNDED_MATERIAL_CONSUMER_NOT_USEFUL**

## Grounding audit

For every emitted rack-empty report:
- Janek same-observation private rack inspection;
- zero free raw blanks at rack.

For every emitted source-empty report:
- Mira same-observation private source inspection;
- zero free raw blanks at source.

Require 100% grounding.

Failure:

**GROUNDED_MATERIAL_REPORT_PROVENANCE_FAIL**

## Qualification

### GROUNDED_MATERIAL_SEMANTIC_CONSUMER_QUALIFIED

Only if:
- grounding passes;
- Stage A relation gate passes;
- Stage B persistent causal gate passes.

This qualifies only:

> a bounded grounded material semantic consumer in which same-id private purpose meaning changes which real factual report deserves response.

It does not qualify:
- a learned semantic model;
- the authored oracle as TRAIN truth;
- general language understanding;
- final ReflexBrain outputs;
- learned actor authority;
- Owner/product life.

## No-rescue boundary

After the first valid execution do not change:
- the two report surfaces;
- listener geometry/sensors;
- purpose statements;
- 45-tick Stage-B retry;
- World timings;
- horizon;
- gate thresholds.

A FAIL must be preserved and diagnosed.

## After PASS

Only after consumer qualification:
1. freeze a semantic corpus/supervision provenance audit;
2. retain deterministic temporal episode state outside the learned target;
3. add lexical/paraphrase controls without changing factual meaning;
4. use `output_has_finished` or local contact as a qualitatively different held-out pressure family;
5. then select a learned semantic relation hypothesis.

No learned ReflexBrain authority exists.
