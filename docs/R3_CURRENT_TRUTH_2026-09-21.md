# R3 Current Truth — 2026-09-21

Status: **QUALIFIED CODE HEAD `420f7d70ee03593b0346db10f5b33a0c03ae57e7` · CHECK PASS · LIVE WEBGPU PROBE EXECUTED**

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

## Phase B finding — current future factual deltas rejected as first probe family

Cross-ecology shortcut controls and identifiability audits now exist before any R3 encoder experiment.

The surveyed family included:
- future activity identity change;
- future activity phase change;
- future held-object change;
- future visible-object-kind change;
- future speech arrival.

None currently qualifies as the first cross-ecology semantic representation probe.

Key evidence:
- identity / held-object / visible-object changes have no positive class in the moving-contact ecology;
- phase change has both classes but is badly underidentified in moving-contact: over 90% of examples belong to legal input signatures that map to both labels, and a same-ecology signature oracle reaches only ~0.54 balanced accuracy;
- future speech arrival is extremely rare and underidentified in both ecologies;
- exact-input and bag-of-token controls do not explain away the phase-change failure.

Interpretation: these future deltas are largely downstream execution/trajectory consequences, not a defensible first semantic ReflexBrain question.

Do not add hidden position, cooldown or fixture execution state merely to rescue those labels.

## Counterfactual evidence — QUALIFIED DONOR

Paired autonomous runs now support first-divergence evidence.

Qualified findings include:
- hidden World perturbations do not alter resident decisions before private state diverges;
- authoritative World outcomes may legitimately diverge before cognition when the same private decision receives a different physical result;
- removing an actor-owned matter causally changes that resident's local life and later reaches other residents through the world;
- changing only the wording of a matter can leave fixture decisions/outcomes invariant.

Important boundary: fixture policies currently gate on matter identity, not on semantic statement meaning. Therefore wording invariance is useful representation evidence, but it is not evidence that semantic wording already controls behavior.

## Current frontier

Phase B now moves from **future-label hunting** to a matter↔lived-context relation probe.

Candidate question:

> given a matter-free temporal fragment of private life, can a semantic representation align it with the actor's own continuing matter better than with other matters from the same ecology?

This is a representation probe, not a proposed ReflexBrain output contract.

Before MiniLM is used:
- keep matter text out of the trajectory query;
- pair baseline and strongly paraphrased wording variants that produce identical fixture life;
- deduplicate repeated query signatures;
- measure lexical-overlap shortcuts on baseline and paraphrase variants;
- inspect changing/eventful windows separately;
- reject or harden the probe if surface overlap already solves it.


## Frozen MiniLM matter-relation probe — REJECTED AS DIRECT RELATION MECHANISM

A live browser/WebGPU run was executed on the deployed R3 research probe.

Encoder:
- `Xenova/paraphrase-MiniLM-L3-v2`;
- revision `4b544e74dfc3256b2b56849ea5d7064fee1ac846`;
- q8;
- WebGPU;
- isolated `batchSize=1`;
- 384 dimensions;
- 43 unique texts;
- load ~1.86 s;
- embedding pass ~2.64 s.

### Semantic diversity audit

Material-work:
- 3576 raw windows;
- 445 unique labeled queries;
- 395 unique model-visible semantic histories;
- 32 unique semantic frames;
- ~12.4% dedup compression ratio;
- ~10.4% semantic-history ambiguity.

Moving-contact:
- 2384 raw windows;
- 18 unique labeled queries;
- 9 unique model-visible semantic histories;
- only 2 unique semantic frames;
- ~0.76% dedup compression ratio;
- **100% semantic-history ambiguity** between candidate matters.

Therefore moving-contact remains useful host/causal evidence but is currently **not a valid semantic benchmark** under the present serializer.

### Lexical baseline after model-visible deduplication

Material-work:
- baseline wording: top-1 ~0.108;
- paraphrase wording: top-1 ~0.236;
- chance ~0.333.

Moving-contact:
- baseline/paraphrase: 0.5;
- chance 0.5;
- paraphrase tie rate 1.0.

Surface overlap does not solve the material relation task.

### Frozen semantic retrieval

Material-work:
- baseline / last-frame: top-1 ~0.124;
- baseline / mean-history: ~0.126;
- paraphrase / last-frame: ~0.290;
- paraphrase / mean-history: ~0.265;
- chance ~0.333;
- mean positive margins are negative in all four material conditions.

Wording stability in material-work collapses:
- last-frame prediction agreement ~0.009;
- mean-history prediction agreement 0;
- positive agreement approximately 0.

Moving-contact:
- all variants exactly 0.5 with mean margin 0, which is uninterpretable because the semantic input is fully ambiguous.

### Interpretation

Reject:

> direct cosine similarity between a coarse matter-free private snapshot/history embedding and a matter-statement embedding as the first R3 semantic relation mechanism.

Do **not** interpret this as evidence that MiniLM is generally useless.

The experiment falsifies a much narrower hypothesis:
- the current model-visible private representation is too coarse for moving-contact;
- direct sentence-similarity geometry does not encode the desired actor-relative matter relation in material-work;
- simply averaging short history does not fix the problem.

The next earned question is whether a **private transition/event representation**, derived only from changes the actor itself can observe/remember, produces materially better semantic diversity without leaking fixture policy or World truth.

If it does not, retire the whole matter↔lived-context retrieval family instead of adding a learned head to rescue it.
