# R3 Grounded Purpose Maintainer Lifecycle Diagnosis Contract — 2026-09-29

Status: **FROZEN DIAGNOSTIC ONLY · RACK-PURPOSE RUN · NO BEHAVIOR CHANGE · HANDOFF-BOUND**

## Trigger

The neutral background-pressure diagnosis classified:

**BACKGROUND_PRESSURE_DIAGNOSIS_MIXED**

while showing:
- rack receives 21 Janek visit episodes;
- only 1 rack stock-visible visit / 1 pickup;
- Ida performs only 1 rack replenishment;
- later privately observed empty rack episodes still occur.

Route starvation and pickup execution are therefore not supported as the primary failure.

## Frozen behavior

Use exactly:
- `createR3GroundedPurposeStructureRun("input_rack", "baseline")`;
- horizon 1800 ticks;
- current maintainer;
- current depleter;
- current World;
- current source behavior;
- current purpose structure and matter;
- no policy/state/gate changes.

Only derive metrics from Ida-private experience and factual Ida events.

## Empty episode anchor

An empty-target observation is legal only when:
- Ida is within sight radius of input_rack;
- no free `raw_blank` is privately visible at input_rack.

Group contiguous privately observed empty rows into episodes.

For every episode, record the first empty tick.

## Forward lifecycle

After each first-empty tick, before the next privately observed satisfied target state, determine whether Ida reaches:

1. `respond_to_empty_target`;
2. `go_to_source`;
3. source-near private observation;
4. source raw privately visible;
5. pickup intent for a raw blank;
6. factual raw pickup event;
7. `carry_stock_to_target`;
8. rack-near while holding raw;
9. place intent at rack;
10. factual rack place event;
11. later privately observed satisfied rack state.

For each stage record first tick or null.

## Aggregate interpretation

### MAINTAINER_EMPTY_RESPONSE_FAIL

At least one later empty episode is observed but `respond_to_empty_target` is absent.

### MAINTAINER_SOURCE_ACQUISITION_FAIL

Empty response occurs, but source is reached and no raw pickup succeeds despite source stock being privately visible.

### MAINTAINER_SOURCE_AVAILABILITY_FAIL

Empty response occurs and source is reached, but source stock is not privately available often enough to recover.

### MAINTAINER_RETURN_OR_PLACE_FAIL

Raw pickup succeeds but return/place does not.

### MAINTAINER_RECOVERY_LIFECYCLE_COMPLETE

At least 3 separate empty episodes fully traverse to later satisfied state.

### MAINTAINER_RECOVERY_DIAGNOSIS_MIXED

No single class above explains the failure cleanly.

## No-rescue boundary

Diagnostic only.

Do not:
- mutate `needsSupply`;
- expose internal state as truth;
- alter source capacity/replenishment;
- alter route;
- alter speeds/positions;
- add semantic labels;
- change recurrent qualification gates.

## Handoff rule

After this diagnostic:
- if one mechanical failure is clean, record it and optionally freeze one minimal recovery delta;
- otherwise stop implementation and hand off with the unresolved lifecycle evidence.

No learned ReflexBrain authority exists.
No Owner/product claim changes.
