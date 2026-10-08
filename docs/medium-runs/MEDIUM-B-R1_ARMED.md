# MEDIUM-B/R1 — Field Lab v0 Long-Run + Abuse Integrity — 2026-10-07

Status: **ARMED · ENGINEERING ONLY · NO SCIENTIFIC / OWNER-VALUE CLAIM**

Base: `246c6b2d6d8c09326b3dc31eb8f603f56031aac5`
Branch: `medium/field-integrity-soak-r1`

## Why this run exists

Before Field Lab gains save/fork, richer ecology or more controls, its current substrate must survive extended unattended execution and hostile-but-legal Owner intervention.

This run changes **no Field Lab behavior**.

It only observes the exact public v0 implementation through its existing API.

## Track A — unattended soak

Frozen duration: **50,000 simulation ticks**.

No Owner intervention.

Record:
- finiteness and maximum absolute position / velocity;
- room escape beyond a generous catastrophic bound;
- sweeper direction reversals;
- actor private-mode occupancy and transitions;
- P0 visible/hidden occupancy;
- final private evidence age;
- event-buffer bound;
- repeated exact-run determinism.

Engineering FAIL:
- NaN/Infinity;
- any dynamic body escapes beyond absolute coordinate 50;
- sweeper ceases to reverse for the whole long run;
- event list exceeds its declared bound;
- exact repeated unattended run differs.

Behavioral boredom, wall-following, repeated mode loops or lack of rich activity are **findings**, not engineering FAIL.

## Track B — deterministic intervention abuse

Frozen 12,000-tick run with interventions applied at exact ticks through existing public methods only.

Sequence includes:
- target relocation across visible/hidden regions;
- target impulses;
- memory disable/re-enable;
- P0 gate disable/re-enable;
- motor-authority disable/re-enable while World continues;
- independent sweeper disable/re-enable;
- central occluder disable/re-enable;
- fill loose-body capacity, attempt one over-capacity spawn, clear, re-add;
- clear private memory;
- actor impulse;
- repeated target moves near physical boundaries.

PASS requires:
- no exception;
- no non-finite state;
- catastrophic coordinate bound < 50;
- loose-body cap obeyed;
- disabled memory actually clears/stays absent until legal reacquisition after re-enable;
- motor-authority cut allows World sweeper to continue while actor remains materially near-stationary over its check window;
- sweeper disabled interval materially suppresses its motion relative to enabled operation;
- final system can continue stepping after all cuts are restored;
- exact repeated abuse script yields exact same sampled result.

These checks qualify **engineering causal cuts only**.

## Explicit non-claims

PASS does not mean:
- Field Lab is experimentally valuable to Owner;
- actor continuation is interesting or organism-like;
- ecology is meaningful;
- current Actor Lens is honest;
- the controller is robust policy;
- any G1–G5 gate passes;
- World/private reset or snapshot semantics are ready.

## After the run

Persist:
- exact metrics;
- newly exposed defects;
- boredom / degeneracy observations as findings;
- no feature fixes in the same run.

Re-plan MEDIUM-B/C only after evidence is read.
