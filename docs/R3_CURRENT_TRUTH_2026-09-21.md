# R3 Current Truth — 2026-09-21

Status: **QUALIFIED HEAD `3580335a5fee66fd0dae7a070c64d3d888555c54` · CHECK PASS**

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

## Material finding

The field currently called `standingMatter` is **not yet valid actor-private state**.

It is injected by the ecology runner when the experience row is written.

That means it is useful research metadata but is not yet legitimate learned-model input.

Do not train an R3 model using it until this is corrected.

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

## Current blocker

The first learned experiment is blocked on **actor-owned continuing matter/purpose**.

The actor must formally possess the context that future learned semantics are evaluated against.

The runner may author initial matters when constructing an actor, but the corpus may only read them back from actor-private state. It must not append semantic purpose after the fact.

## Next earned move

Create a deliberately minimal actor-private matter representation with these constraints:

- actor-owned;
- visible to local policy / future learned provider;
- captured into private experience from the agent itself;
- able to hold more than one matter in principle;
- no copied SPC lifecycle unless evidence earns it;
- no priority/salience score yet;
- no interruption ontology yet;
- stable across both qualified ecologies.

Then rerun both ecologies and the full test suite before changing the learning problem.
