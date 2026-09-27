# R3 Grounded Purpose × Temporal Patrol Pressure Result — 2026-09-27

Status: **GROUNDED_PURPOSE_TEMPORAL_PRESSURE_FAIL · PURPOSE COUNTERFACTUAL GATE PASS · TEMPORAL STRUCTURAL GATE FAIL · NO MODEL AUTHORIZED**

## Frozen contract

`docs/R3_GROUNDED_PURPOSE_TEMPORAL_PATROL_PRESSURE_CONTRACT_2026-09-27.md`

The contract was frozen before implementation.

Two pre-execution apparatus corrections were made before any patrol result was interpreted:

1. accepted-report instrumentation was changed from a speech acknowledgement to a research-only counter because World permits one intent per actor per tick and speech would itself perturb the supposedly purpose/report-independent patrol;
2. current direct private evidence was given precedence over one-step-delayed speech, so a heard older empty-rack report cannot reopen a need in the same observation where Mira directly sees the rack already stocked.

Neither correction changed the frozen geometry, timings, horizon, purpose statements or pass gates.

## Execution incident and recovery

The first execution completed the research calculation and printed a result, but Vitest terminated the test on its default 5-second timeout.

That run is treated as an **apparatus timeout**, not as qualified research authority.

Recovery changed only the test timeout to 30 seconds.

Clean qualified recovery head:

`40606e400dc3d48a82d2caad87a8b78fa6e1d6ec`

Qualification:
- Check #333 PASS;
- Research Preview #345 PASS;
- 36/36 test files PASS;
- 199/199 tests PASS;
- build PASS.

No semantic fixture, metric or gate was changed for recovery.

## Grounding provenance

All Janek rack-empty reports remained privately grounded:

- supply-ideal: 41/41;
- supply-respond-all: 41/41;
- reserve-purpose-aware: 45/45;
- reserve-purpose-blind: 41/41.

Grounded rate in every mode: **1.000**.

## Frozen 5400-tick mode results

### supply-ideal

- requests: **41**
- accepted reports: **14**
- Mira rack placements: **14**
- Janek processing completions: **13**
- Janek blocked ticks: **4467**
- source-reserve deficit ticks: **1680**

### supply-respond-all

- requests: **41**
- accepted reports: **41**
- Mira rack placements: **14**
- Janek processing completions: **13**
- Janek blocked ticks: **4467**
- source-reserve deficit ticks: **1680**

Respond-all therefore adds report acceptance cost without improving physical throughput.

### reserve-purpose-aware

- requests: **45**
- accepted reports: **0**
- Mira rack placements: **0**
- Janek processing completions: **0**
- Janek blocked ticks: **5391**
- source-reserve deficit ticks: **0**

### reserve-purpose-blind

- requests: **41**
- accepted reports: **14**
- Mira rack placements: **14**
- Janek processing completions: **13**
- Janek blocked ticks: **4467**
- source-reserve deficit ticks: **1680**

The blind control violates the reserve purpose and spends source stock.

## Purpose counterfactual gate

The first grounded Janek report occurs at tick **54**.

Across `supply-ideal` and `reserve-purpose-aware`, the full non-purpose private fingerprint at that report is identical:
- same tick;
- same Mira position;
- same held state;
- same visible objects;
- same heard non-matter evidence;
- same activity kind/phase;
- same private object/actor memory.

Only Mira's matter differs.

At that same report:
- supply-ideal accepts: **true**;
- reserve-purpose-aware accepts: **false**.

Causal consequence:
- supply-ideal processing completions: **13**;
- reserve-purpose-aware processing completions: **0**;
- reserve-purpose-aware source-reserve deficit ticks: **0**;
- reserve-purpose-blind source-reserve deficit ticks: **1680**;
- reserve-purpose-aware accepted reports: **0**;
- reserve-purpose-blind accepted reports: **14**.

The frozen purpose gate therefore **PASSES**.

Bounded finding:

> the exact same grounded report under the exact same non-purpose private state can have different causal usefulness solely because the listener's actor-private purpose differs.

This is stronger than the earlier authored purpose-only oracle in one important respect: the report itself is grounded in another actor's real private material condition.

It still does not qualify a learner.

## Temporal structural-identifiability gate

The supply-ideal report corpus now has:

- rows: **41**
- update-worthy: **14**
- redundant/stale: **27**

So the earlier sample-size/class-balance failure is repaired.

Some structural conditions also improve:
- at least one patrol phase contains both classes: **true**;
- at least one 1-unit listener-X bin contains both classes: **true**.

But the crucial leakage remains.

### Shortcut results

- holding/not holding object BA: **1.000000**
- activity phase BA: **0.964286**
- listener X threshold BA: **0.964286**
- visible source stock BA: **0.964286**
- known raw belief count BA: **0.740741**
- absolute tick threshold BA: **0.552910**
- prior heard count threshold BA: **0.552910**
- request ordinal threshold BA: **0.552910**

The frozen gate required the first four to remain below 0.90.

They fail.

The required condition that both classes occur with `holdingObject=false` also fails.

Temporal gate: **FAIL**.

## Why patrol deconfounding failed

The patrol route is independent of report acceptance, but the listener is still the material effector.

That creates a deeper causal coupling:

1. an update-worthy report opens a supply need;
2. Mira reaches source and picks a raw blank;
3. while that need remains unresolved she physically carries the raw blank;
4. Janek continues to emit repeated grounded reports during that interval;
5. settlement occurs only after Mira reaches rack and places/privately confirms stock;
6. later new shortages recur after she has completed the material cycle.

As a result, redundant reports are overwhelmingly observed while Mira is carrying the response object, while new update-worthy recurrences appear after that physical cycle has ended.

The learner would therefore be offered a nearly perfect shortcut:

> `holding raw blank => report is redundant`

rather than being forced to represent the intended relation between grounded evidence, private settlement history and purpose.

The patrol did not remove the confound because **listener cognition and physical effectuation remain the same actor**.

## Overall precommitted classification

The contract requires both the temporal structural gate and purpose gate to pass.

Purpose gate: **PASS**  
Temporal structural gate: **FAIL**

Overall:

**GROUNDED_PURPOSE_TEMPORAL_PRESSURE_FAIL**

## What survives

The following earlier evidence remains valid:

- **GROUNDED_TEMPORAL_CONSUMER_VALUE_QUALIFIED**
- grounded private report seed;
- material multi-view grounding donor;
- the first obvious grounded corpus is underidentified.

This experiment adds one new positive bounded result:

> a grounded same-report purpose counterfactual can be perfectly paired and causally consequential.

It also identifies the next structural blocker:

> listener-as-effector couples temporal belief/update state to body/material state strongly enough to leak the target.

## Next earned redesign

Do not tune:
- patrol dwell time;
- patrol speed;
- Janek cooldown;
- geometry;
- thresholds;
- horizon.

Do not simply remove `holdingObject` from future model input; phase/position/source-stock remain near-perfect and arise from the same causal coupling.

Instead separate:

**listener / interpreter**  
from  
**material effector / supplier**.

Candidate structure:
- stationary or otherwise behaviorally independent listener hears Janek's grounded empty-rack report;
- listener purpose determines whether it forwards/acts on the report;
- a separate supplier performs the physical replenishment;
- supplier later emits a grounded completion/stocked report from its own private evidence;
- listener uses that privately heard completion as settlement evidence;
- listener never carries the raw object and need not move with the supply cycle.

This directly targets the discovered confound rather than adding rows.

No learned ReflexBrain authority exists.
No Owner/product claim changes.
