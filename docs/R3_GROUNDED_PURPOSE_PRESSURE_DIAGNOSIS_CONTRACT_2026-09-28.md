# R3 Grounded Purpose Pressure Diagnosis Contract — 2026-09-28

Status: **FROZEN DIAGNOSTIC ONLY · NO BEHAVIOR CHANGE · NO MODEL**

## Trigger

The grounded purpose-structure donor classified:

**GROUNDED_PURPOSE_STRUCTURE_PRESSURE_FAIL**

while:
- causal structured-purpose gate PASS;
- wording invariance PASS;
- provenance PASS.

Raw asymmetry over 1800 ticks:
- rack-purpose: 1 Ida replenishment / 1 background pickup;
- output-purpose: 17 replenishments / 16 pickups.

Do not tune the ecology before localizing this asymmetry.

## Frozen behavior

The diagnostic must not change:
- purpose structures;
- matter id or statements;
- maintainer policy;
- depleter policy;
- initial World;
- positions/speeds/sight;
- source generation;
- horizon;
- any qualification gate.

It may only derive additional metrics from already-recorded actor-private experiences and factual World events.

## Background route metrics

For Janek in each purpose world, measure separately for `input_rack` and `output`:

1. **near-target ticks** — Janek self position within 0.38 of target.
2. **near-target episodes** — contiguous visits, counting a new episode after at least one non-near tick.
3. **stock-visible ticks** — while near target, a free `raw_blank` at that target is privately visible.
4. **stock-visible episodes** — visit episodes in which stock is observed at least once.
5. **pickup events** — factual Janek `pickup` events at that target.

Also measure:
- Janek depot-near episodes;
- total route motion events;
- Ida target placements;
- first and last background target visit tick.

## Interpretation classes

### BACKGROUND_ROUTE_STARVATION

One candidate target receives materially fewer visit episodes than the other in the failing world.

### BACKGROUND_STOCK_PHASE_MISS

Visit episodes recur at both targets, but the failing target is usually visited when no stock is present despite recurrent Ida placements.

### BACKGROUND_PICKUP_EXECUTION_FAIL

Stock is privately visible during recurrent near-target episodes but pickup events do not follow.

### BACKGROUND_PRESSURE_DIAGNOSIS_MIXED

No single mechanism above cleanly explains the asymmetry.

## No-rescue boundary

This audit is explanatory only.

After the result:
- do not alter purpose semantics;
- do not give the depleter purpose access;
- do not add hidden World deletion;
- do not change the recurrent gates;
- freeze any recovery delta separately.

No learned ReflexBrain authority exists.
No Owner/product claim changes.
