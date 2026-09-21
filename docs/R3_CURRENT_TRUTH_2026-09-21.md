# R3 Current Truth — 2026-09-21

Status: **QUALIFIED HEAD `a90666678d3cabd8dbecbbb225678db2e9db66be` · CHECK PASS**

Branch:

`experiment/r3-autonomous-life-pressure-v0`

PR:

`#3 R3 autonomous life pressure host` — draft research PR.

## Live truth

R3 is no longer the R2 clicker line.

The current branch starts from the pre-clicker research checkpoint and contains no R2 live-intervention UI.

Two autonomous ecologies run on the same headless host.

### Ecology A — material work chain

Residents:

- Mira — keeps workshop input supplied;
- Janek — processes raw blanks into finished parts;
- Ida — moves finished parts to depot.

Qualified properties:

- zero Owner input during the run;
- fixed-step autonomous World;
- World-owned movement, pickup, place and processing outcomes;
- local private sight/hearing;
- private object memory;
- checked absence invalidates stale free-object location;
- persistent activity identity across physical progress;
- removing Mira materially collapses downstream production;
- delivered material carries causal event lineage across source -> Mira -> Janek -> Ida -> depot;
- worker blockage can create speech from state rather than a scripted `tick === N`.

### Ecology B — moving contact

No material work chain is active.

Janek patrols independently. Ida has her own cycle, periodically needs physical contact, searches using private sight / last-known contact and speaks only after real encounter.

Qualified properties:

- zero Owner input;
- no pickup/place/processing dependency;
- private actor-contact acquisition;
- factual speech reaches the other resident through hearing;
- Ida and Janek separate after contact rather than forming a permanent follower pair;
- last-known contact can become active local search pressure.

This is the first anti-core qualification showing that workshop/material logic is not required by the host.

## Private state currently qualified

Each resident owns:

- current physical self observation;
- locally visible actors;
- locally visible material objects;
- locally heard speech events;
- held object;
- private object beliefs;
- private last-known actor contacts;
- heard-event identity history;
- persistent current activity.

The World may know more than the resident.

## Private temporal corpus

R3 records actor-private experience rows containing:

- current private observation;
- current private memory;
- previous continuing activity;
- fixture decision;
- factual same-tick outcome kept separately from inference input.

Temporal windows can be built without `threat / interrupt / attention / cognition / significance` labels.

A semantic serializer already excludes resident identity and absolute tick shortcuts.

## Actor-owned continuing matters — QUALIFIED

The former runner-only `standingMatter` field has been removed from the learning path.

Each resident now owns a private list of continuing matters.

Current minimal contract:
- actor-owned matter id;
- semantic statement;
- establishment tick;
- authored origin;
- multiple matters supported by the contract;
- no status lifecycle;
- no priority;
- no salience;
- no interruption score.

Ecology runners may author initial matters when constructing a resident, but private experience reads them back from the resident itself. The corpus no longer appends semantic purpose after the fact.

Both autonomous ecologies remain green after this change.

## What is still fixture-only

The following are disposable research policies:

- steward material policy;
- worker material policy;
- courier material policy;
- patrol policy;
- contact messenger policy;
- workshop place layout;
- exact thresholds/cooldowns;
- English blockage/report sentences.

They are pressure generators, not target intelligence.

## What R3 does not prove

- no R3 learned model exists;
- no semantic generalization has been shown;
- no temporal learned dynamics have been shown;
- no learned output affects actor behavior;
- no model authority is earned;
- the two ecologies are not the final product world;
- green tests do not mean the residents are broadly intelligent or alive in the Owner sense.

## Reusable evidence from R1

Potentially reusable after private-state correction:

- frozen MiniLM-L3 q8 encoder;
- WebGPU local execution;
- isolated per-state embedding (`batchSize=1`) for correctness;
- cosine/relation-geometry diagnostics;
- strict hidden-World leakage methodology.

Do not reuse by default:

- old `ActorPrivateState` serialization;
- `sort crates` assumptions;
- old twelve structured features;
- prototype five-score head;
- linear five-score head;
- the five appraisal labels as ontology.

## Cross-ecology learning boundary — QUALIFIED

A new learning-corpus layer builds one schema from both autonomous ecologies.

The model-facing input is explicitly separated from evaluation metadata.

Model input may contain:
- actor-owned semantic matter statements;
- privately heard speech;
- privately visible material kinds;
- small exact private structured counts/state.

It deliberately excludes:
- resident identity;
- ecology label;
- absolute tick;
- fixture activity ids/kinds/phases;
- future World outcome names.

Evaluation metadata retains ecology/actor/tick and factual future deltas so later experiments can be audited without leaking those facts into inference.

Strict ecology holdout is now mechanically available.

## Current blocker / frontier

The project is **not** blocked on infrastructure anymore.

It is blocked on defining a first learning question that is both:
- derivable from real autonomous trajectories;
- not merely another hand-authored appraisal ontology.

Before training MiniLM or any head, Phase B still needs a strong negative-control story for surface-token/ecology leakage and a defensible relation/target construction.

The next earned move is therefore **corpus falsification**, not model capacity:
- audit surface shortcuts across ecologies;
- identify naturally occurring matched/counterfactual relationships;
- prove that a future target cannot be solved by actor/ecology/token identity alone;
- only then instantiate the first representation probe.
