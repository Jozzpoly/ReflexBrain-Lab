# R3 Grounded Purpose Pressure Diagnosis Result — 2026-09-29

Status: **BACKGROUND_PRESSURE_DIAGNOSIS_MIXED · ROUTE STARVATION NOT SUPPORTED · PICKUP EXECUTION NOT SUPPORTED · RACK MAINTAINER RECOVERY NOW PRIMARY OPEN MECHANISM**

## Frozen contract

`docs/R3_GROUNDED_PURPOSE_PRESSURE_DIAGNOSIS_CONTRACT_2026-09-28.md`

No behavior was changed.

Two initial executions failed before runtime because TypeScript did not narrow one diagnostic window index. Recovery changed only the read-only metric implementation.

Qualified head:

`3ae2e189a1b927a395fa396e3dc31eca722f8106`

Qualification:
- Check #414 PASS;
- Research Preview #442 PASS;
- 46/46 test files PASS;
- 212/212 tests PASS;
- build PASS;
- preview deploy PASS.

## Rack-purpose world

1800 ticks.

Neutral Janek route:

input_rack:
- near-target ticks: **23**;
- near-target episodes: **21**;
- stock-visible ticks: **1**;
- stock-visible episodes: **1**;
- pickups: **1**;
- first visit: tick **32**;
- last visit: tick **1775**.

output:
- near-target ticks: **21**;
- near-target episodes: **20**;
- stock-visible episodes: **0**;
- pickups: **0**;
- first visit: tick **76**;
- last visit: tick **1732**.

Other:
- depot-near episodes: **2**;
- Janek motion events: **1798**;
- Ida rack placements: **1**.

## Output-purpose control world

output:
- near-target ticks: **32**;
- near-target episodes: **16**;
- stock-visible ticks/episodes: **16/16**;
- pickups: **16**;
- first visit: tick **76**;
- last visit: tick **1697**.

input_rack:
- near-target episodes: **17**;
- stock-visible episodes: **0**.

Other:
- depot-near episodes: **17**;
- Janek motion events: **1768**;
- Ida output placements: **17**.

## Precommitted classification

**BACKGROUND_PRESSURE_DIAGNOSIS_MIXED**

## What is now ruled out

### Background route starvation

Not supported.

In rack-purpose Janek reaches:
- rack **21** separate times;
- output **20** separate times.

The failing target is therefore not starved of route opportunities.

### Background pickup execution failure

Not supported by current evidence.

Janek sees rack stock in exactly **1** visit episode and produces exactly **1** rack pickup.

There is no evidence of recurrent privately visible target stock that the depleter fails to pick up.

## Stronger localization

The neutral background actor repeatedly reaches the failing rack, but after the first depletion there is almost never stock there to remove.

This converges with the original ecology metrics:
- Ida rack placements: **1**;
- private rack satisfaction: 1 satisfied episode / 3 unsatisfied episodes.

Therefore the current leading mechanical gap is upstream of depleter pickup:

> after rack stock is removed, Ida does not successfully complete recurrent target replenishment even though later empty observations occur.

This is a diagnosis direction, not yet a proven specific bug.

Possible remaining mechanisms include:
- maintainer internal recovery state/lifecycle;
- source acquisition;
- return/place execution;
- observation-phase interaction around depletion.

Do not choose between them without actor-private lifecycle evidence.

## Next bounded audit

Read-only maintainer lifecycle diagnosis in the same frozen rack-purpose run:

For each privately observed empty-target episode, measure whether Ida subsequently:
1. enters `respond_to_empty_target`;
2. reaches source;
3. privately sees source stock;
4. issues / completes raw pickup;
5. carries raw toward rack;
6. issues / completes rack placement;
7. returns to privately observed satisfied state.

No behavior change.
No semantic change.
No gate change.
No model.

After that diagnosis:
- if one mechanical transition cleanly fails, freeze one minimal recovery delta;
- otherwise stop at a mixed lifecycle gap and hand off without tuning.

No learned ReflexBrain authority exists.
No Owner/product claim changes.
