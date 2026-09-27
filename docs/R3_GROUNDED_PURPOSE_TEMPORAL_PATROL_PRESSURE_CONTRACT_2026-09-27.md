# R3 Grounded Purpose × Temporal Patrol Pressure Contract — 2026-09-27

Status: **FROZEN BEFORE IMPLEMENTATION · PRESSURE REDESIGN · NO LEARNED MODEL**

## Trigger

Two facts are now simultaneously true:

1. **GROUNDED_TEMPORAL_CONSUMER_VALUE_QUALIFIED**
2. **GROUNDED_CONSUMER_CORPUS_UNDERIDENTIFIED**

The first proves a real consumer need.
The second proves the first obvious dataset mostly fingerprints Mira's scripted response state.

This contract changes the **pressure geometry and listener activity**, not the learned model.

## Research question

Can grounded recurrent-report pressure be made structurally identifiable enough that:

- update-worthy and redundant instances of the same report occur under overlapping listener activity/position conditions;
- the same grounded report has different causal usefulness under two listener purposes;
- the purpose counterfactual starts from the same private non-purpose state;
- speaker grounding and listener-private settlement remain intact?

## Frozen world

Residents:
- Mira = listener / patrol actor;
- Janek = ordinary worker / grounded reporter;
- Ida disabled.

Places:
- source: x=4, y=0;
- rack: x=8, y=0;
- workbench: x=10, y=0;
- output: x=12, y=0;
- depot: x=18, y=0.

World:
- source capacity 3;
- source replenish interval 120 ticks;
- processing 24 ticks;
- ordinary World action range;
- initial source stock 3.

Janek:
- ordinary `WorkerFixturePolicy` unchanged;
- ordinary request threshold/cooldown unchanged;
- exact grounded request unchanged:
  `The input rack is empty.`

Mira:
- sight radius 2.5;
- hearing radius 5;
- speed 0.03/tick;
- starts at source;
- continuous patrol is independent of request state and purpose:
  1. dwell at source for 90 ticks;
  2. travel to rack;
  3. dwell at rack for 90 ticks;
  4. travel to source;
  5. repeat.

A report may affect what Mira does **at the next endpoint opportunity**, but must never reverse, restart or otherwise change the patrol route.

Frozen horizon:
- **5400 ticks per mode**.

## Listener purposes

### supply-rack

Matter statement:

> keep workshop processing supplied by moving a raw blank from source to the input rack when grounded evidence indicates the rack needs supply

A newly actionable report may open one unresolved supply need.

### preserve-source-reserve

Matter statement:

> preserve the three raw blanks at the source as an emergency reserve; do not spend reserve stock to replenish the workshop rack

The same rack-empty report is factual but is not a reason to consume reserve stock.

The purpose difference is research-authored actor-private intent. It is not World truth.

## Purpose-independent patrol policy

Patrol phase must be determined only by:
- current endpoint;
- fixed dwell countdown;
- current travel direction;
- physical holding state needed to complete an already accepted endpoint action.

The route schedule may not inspect:
- report text;
- purpose;
- pending supply;
- shortage episode.

This is required so activity/position cease to be a direct label carrier.

## Supply behavior

When purpose permits supply and one unresolved need exists:

At source endpoint:
- if empty-handed and free raw is privately visible, pick one raw blank.

During patrol:
- continue normal route toward rack.

At rack endpoint:
- if holding the raw blank, place it on the rack.

Settlement:
- unresolved need closes only from Mira-private evidence:
  - Mira holds no object;
  - Mira is within local rack sight;
  - a free raw blank is visible at the rack.

Repeated reports before settlement are redundant.
After settlement, a later same-surface report may open a new need.

## Modes

### supply-ideal

Purpose: `supply-rack`.

Accept a grounded report iff there is no unresolved privately unsettled supply need.

### supply-respond-all

Purpose: `supply-rack`.

Acknowledge every grounded report, including redundant repeats.
Physical supply need remains idempotent: duplicate reports do not create multiple simultaneous cargo obligations.

### reserve-purpose-aware

Purpose: `preserve-source-reserve`.

Do not open a rack-supply need from the grounded rack-empty report.

Continue the identical patrol.

### reserve-purpose-blind

Purpose: `preserve-source-reserve`.

Incorrect control: treat rack-empty reports exactly like `supply-ideal`, consuming reserve stock despite the current matter.

Continue the identical patrol.

## Acknowledgement

Every accepted report emits:

`I'll handle the rack report.`

This makes accepted reports countable.
Speech is instrumentation, not product design.

## Evaluation-only metrics

Allowed to use World/public snapshots for evaluation metrics, never as listener input.

Per mode report:
- Janek grounded request count;
- Mira accepted report count;
- rack raw placements by Mira;
- Janek processing completions;
- Janek blocked ticks;
- source-reserve deficit ticks: ticks with fewer than 3 free raw blanks within source radius 0.75;
- request rows per patrol phase;
- update-worthy/redundant rows per patrol phase;
- holding/not-holding by class;
- listener x/y by class;
- visible source/rack stock by class.

Re-run grounded speech provenance and require 100% of Janek requests to be privately grounded.

## Temporal structural-identifiability gate

Using only `supply-ideal` 5400-tick private report rows, derive `updateWorthy` from listener-private settlement history exactly as in the previous corpus audit.

Require:

1. at least 20 report rows;
2. at least 5 update-worthy and 5 redundant rows;
3. at least one patrol phase contains both classes;
4. at least one update-worthy and one redundant row occur with `holdingObject=false`;
5. at least one 1.0-unit listener-X bin contains both classes;
6. categorical activity-phase shortcut BA < 0.90;
7. holding-object shortcut BA < 0.90;
8. listener-X threshold shortcut BA < 0.90;
9. visible-source-stock shortcut BA < 0.90.

If any fails:

**PATROL_TEMPORAL_PRESSURE_STILL_LEAKY**

Do not tune after the result.

## Frozen paired purpose counterfactual

The first Janek request in `supply-ideal` and `reserve-purpose-aware` must occur from identical non-purpose private state.

Before comparing, require equality of:
- report text;
- tick;
- Mira position;
- Mira held object;
- visible objects;
- heard non-matter evidence;
- activity kind/phase;
- private object/actor memory;

while allowing only listener matter to differ.

At that same grounded report:
- `supply-ideal` must accept;
- `reserve-purpose-aware` must not accept.

Causal consequence gates over the full frozen runs:
- `supply-ideal` processing completions > `reserve-purpose-aware`;
- `reserve-purpose-aware` source-reserve deficit ticks < `reserve-purpose-blind`;
- `reserve-purpose-aware` accepts fewer rack reports than `reserve-purpose-blind`.

If the first-report private state differs for any non-purpose reason:

**PURPOSE_COUNTERFACTUAL_INVALID**

If state is paired but causal consequence gates fail:

**GROUNDED_PURPOSE_CONSUMER_NOT_USEFUL**

## Overall classification

### GROUNDED_PURPOSE_TEMPORAL_PRESSURE_QUALIFIED

Only if:
- speech grounding remains 100%;
- temporal structural-identifiability gate passes;
- paired purpose counterfactual is valid;
- purpose causal consequence gate passes.

This qualifies the **pressure**, not a corpus and not a learner.

### GROUNDED_PURPOSE_TEMPORAL_PRESSURE_FAIL

Any other non-infrastructure outcome.

## No-rescue boundary

After first execution do not change:
- 90-tick dwell;
- speed;
- geometry;
- 5400 horizon;
- request cooldown/threshold;
- source capacity/replenish interval;
- purpose statements;
- patrol routing;
- gates.

A failure is evidence for the next redesign.

## After PASS

Only after pressure qualification:
1. freeze a new pooled grounded corpus audit across purpose and temporal contexts;
2. include held-out matter/report surfaces later if needed;
3. attack purpose-id/text, phase, position, timing and ordinal shortcuts again;
4. only then consider a learned representation hypothesis.
