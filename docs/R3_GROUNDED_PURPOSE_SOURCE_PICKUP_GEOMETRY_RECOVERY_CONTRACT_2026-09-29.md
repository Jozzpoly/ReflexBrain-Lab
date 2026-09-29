# R3 Grounded Purpose Source-Pickup Geometry Recovery Contract — 2026-09-29

Status: **FROZEN MINIMAL MECHANICAL RECOVERY · PURPOSE-INDEPENDENT · NO SEMANTIC CHANGE · NO MODEL**

## Trigger

The grounded-purpose donor remains:

**GROUNDED_PURPOSE_STRUCTURE_PRESSURE_FAIL**

Read-only diagnostics localized the rack-side failure.

Neutral depleter route:
- rack-purpose rack visits: 21;
- stock-visible visits: 1;
- pickups: 1.

Maintainer lifecycle:
- post-depletion empty response at tick 120;
- source reached at tick 139;
- selected raw: `object:raw_blank:1`;
- Ida→raw distance: **0.4600000000000003**;
- World pickup action range: **0.45**;
- factual `pickup_rejected` repeats from tick 139 through horizon.

The asymmetry is geometric:
- maintainer considers itself near source using center-distance <=0.38;
- source raw objects may be offset from source center;
- approaching from the rack side can leave the first selected visible raw just outside pickup range;
- output-side approach happens to remain reachable.

## Frozen recovery delta

Change only the grounded-purpose maintainer's source-acquisition behavior.

When source stock is privately visible:

1. choose the same first visible free raw candidate as before;
2. if Ida is within World action range of that concrete object, issue pickup;
3. otherwise issue `move_to` that object's actual observed free position;
4. keep `needsSupply` and every purpose/pressure parameter unchanged.

No:
- source capacity change;
- source replenish timing change;
- speed change;
- place repositioning;
- depleter change;
- purpose-aware pressure;
- target/gate change;
- semantic/model change.

## Why this is permitted

This is not pressure tuning.

It repairs a mismatch between:
- policy navigation criterion;
- World action geometry.

The fix uses only:
- Ida-private visible object position;
- existing World action semantics.

It is purpose-independent and would apply identically for rack/output purposes.

## Requalification

Run the original frozen grounded-purpose structure audit unchanged.

Require:
- Stage A causal structure PASS;
- Stage B wording invariance PASS;
- Stage C recurrent private grounding PASS in both worlds;
- Stage D provenance PASS.

No threshold/gate changes.

Also require lifecycle evidence:
- later source pickup succeeds;
- repeated pickup rejection deadlock is absent.

## Classifications

### GROUNDED_PURPOSE_STRUCTURE_RECOVERED

Original frozen ecology classification becomes:

**GROUNDED_PURPOSE_STRUCTURE_QUALIFIED**

with no semantic/pressure/gate changes.

### GROUNDED_PURPOSE_STRUCTURE_RECOVERY_FAIL

Original Stage C remains failed or another mechanical asymmetry appears.

Do not add a second recovery delta in this conversation.

## Handoff boundary

After this one delta and requalification:
- record result;
- synchronize canonical docs / PR;
- prepare handoff to a new conversation.

No new model.
No statement→structure experiment yet.
No learned ReflexBrain authority.
No Owner/product claim changes.
