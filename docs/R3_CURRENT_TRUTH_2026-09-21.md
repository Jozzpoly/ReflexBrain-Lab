# R3 Current Truth — 2026-09-21

Status: **QUALIFIED CODE HEAD `c54579fc1ca239b6e2fe6710c8137f06700cd2ca` · CHECK #200 PASS · DIRECT-COSINE FAMILY REJECTED · CURRENT 12-EXAMPLE CORPUS NOT TRAINING-QUALIFIED**

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


## Same-actor matter relation probe — PARTIAL SEMANTIC SIGNAL, GENERALIZATION FAIL

The earlier cross-resident matter retrieval target was found to contain a hidden conceptual shortcut: each resident owned only one candidate matter inside an ecology, so choosing among residents' matters partly reduced to identifying which resident/role produced the context.

A stricter target was built using residents that already have two different matters across the two qualified ecologies:

- Janek: material processing vs contact patrol;
- Ida: material delivery vs contact/report.

The candidate set contains only matters owned by the same resident. Actor id, ecology label, matter text, activity labels and future World outcomes remain excluded from the transition query.

### Identifiability

Janek:
- 127 unique transition histories;
- 136 unique labeled queries;
- ambiguity ~7.1%.

Ida:
- 106 unique transition histories;
- 109 unique labeled queries;
- ambiguity ~2.8%.

This is materially cleaner than the earlier cross-resident target.

### Lexical falsifier

Chance is 0.5.

Janek:
- baseline wording: ~0.816 top-1;
- paraphrase wording: ~0.412.

Ida:
- baseline wording: ~0.881;
- paraphrase wording: ~0.349.

Strong paraphrase therefore destroys the simple lexical shortcut.

### Frozen MiniLM live result

Janek:
- baseline / last-transition: ~0.743, positive margin +0.047;
- paraphrase / last-transition: ~0.713, positive margin +0.036;
- baseline / mean-transitions: ~0.662;
- paraphrase / mean-transitions: ~0.654;
- last-transition prediction agreement across wording: ~0.956.

This is the first R3 result where frozen semantic geometry retains useful above-chance relation signal after a wording perturbation that breaks the lexical baseline.

Ida:
- baseline / last-transition: ~0.523;
- paraphrase / last-transition: ~0.486;
- baseline / mean-transitions: ~0.514;
- paraphrase / mean-transitions: ~0.440.

Ida therefore does not reproduce Janek's semantic result.

### Interpretation boundary

Promote only this narrow statement:

> A frozen MiniLM representation can preserve some matter↔private-transition relation across strong wording change for Janek's two existing life domains.

Do **not** promote:
- direct cosine as the ReflexBrain mechanism;
- same-actor retrieval as the final output contract;
- general cross-resident competence;
- learned local authority.

The current same-actor target still has an important limitation: the two matters are sourced from separate ecologies and never coexist as simultaneous matters in one resident state. The probe can therefore still partly reduce to recognizing which life-domain/ecology generated the private transition.

## Current frontier — causal concurrent-matter relevance

The next target should not be another wording variant or a learned head.

Create an actor-private state in which two same-actor matters coexist, while the disposable fixture policy is causally gated by only one of them in a given ecology.

Ground truth should be derived by paired matter ablation:

> matter M is causally relevant to the current local decision iff removing M, while keeping the same exogenous/private setup and other matters, produces the first local decision divergence.

The other simultaneously present matter acts as an inert same-actor negative control.

Requirements:
- both candidate matters are simultaneously actor-owned;
- candidate identity cannot be inferred from actor id;
- wording-only paraphrase must not alter fixture decisions;
- ablation must establish causal responsibility rather than ownership;
- private query remains matter-free;
- no learned model is run until class support, ambiguity and lexical controls qualify the target.

This remains research supervision generated by disposable fixture policy. It is not a proposed final scheduler or matter lifecycle.


## Concurrent-matter causal responsibility — TARGET QUALIFIED, DIRECT COSINE FAIL

A stronger relation target was built after identifying that the earlier same-actor probe still separated matters by ecology.

For Janek and Ida:
- two matters are simultaneously actor-owned;
- baseline and ablation variants replay an identical deterministic prefix;
- immediately before the sampled next decision, exactly one matter is removed from the variant;
- World truth is not directly mutated by the research intervention;
- an example is retained only when exactly one matter ablation changes the next local decision;
- the matter-free query is derived from actor-private transitions before intervention.

This is research-only causal supervision, not a proposed production matter API.

### Causal corpus qualification

For each actor and wording:
- 18 retained examples;
- responsibility labels are exactly balanced 9/9 across the two candidate matters;
- both material-work and moving-contact contribute examples.

Janek:
- 11 unique transition histories;
- ~9.1% ambiguous histories.

Ida:
- 7 unique transition histories;
- ~28.6% ambiguous histories.

Lexical control:
- baseline Janek ~0.778;
- paraphrase Janek 0.5;
- baseline Ida ~0.611;
- paraphrase Ida 0.5;
- chance 0.5.

Thus strong paraphrase removes the lexical shortcut.

### Frozen MiniLM causal probe

All eight conditions land at exactly chance top-1:

Janek:
- baseline / last-transition: 0.5;
- baseline / mean-transitions: 0.5;
- paraphrase / last-transition: 0.5;
- paraphrase / mean-transitions: 0.5.

Ida:
- baseline / last-transition: 0.5;
- baseline / mean-transitions: 0.5;
- paraphrase / last-transition: 0.5;
- paraphrase / mean-transitions: 0.5.

Mean responsible margins:
- Janek remain slightly positive (+0.0065 to +0.0131) but do not change top-1 accuracy;
- Ida is near zero and becomes negative under paraphrase.

Wording prediction agreement is 1.0 in every condition, while responsible-prediction agreement is exactly 0.5.

### Interpretation

Reject:

> direct cosine similarity between the frozen private-transition embedding and a matter-statement embedding as a mechanism for causal matter responsibility.

This does **not** erase the earlier Janek result. That result demonstrated semantic robustness for distinguishing two life domains after lexical paraphrase. The stronger causal test shows that such domain-level semantic alignment is not sufficient evidence of actor-relative causal relevance.

Do not train a head merely to rescue this exact benchmark yet.

### Remaining benchmark confound

The causal labels are stronger than before, but responsibility is still perfectly associated with the two separate fixture ecologies:
- material matter is causally active in material-work;
- contact matter is causally active in moving-contact.

Therefore a learned relation head could still solve the current target by learning ecology/domain discrimination rather than a reusable relevance relation.

## Next earned target — within-ecology responsibility switching

Before any learned R3 relation head is justified, build a disposable mixed-pressure ecology in which:
- the same resident owns at least two simultaneous matters;
- both matters can become causally responsible at different moments of the **same** ecology;
- responsibility switches due to actor-private local state, not ecology id;
- paired matter ablation remains the ground-truth mechanism;
- the model-facing query still excludes matter text, actor id, fixture policy labels and hidden World state;
- responsibility classes have real support and low enough ambiguity;
- lexical controls are rerun before any learned model.

The ecology is test equipment, not a candidate production architecture.


## Causal probe temporal correction — QUALIFIED

A post-probe audit found that the first causal query ended one private tick before the observation used for the labeled decision.

The harness now enforces `queryEndTick === anchorTick` and includes the current decision-time private observation while continuing to exclude decision and outcome fields.

The corrected probe remained exactly 0.5 top-1 in all Janek/Ida × baseline/paraphrase × last/mean conditions.

Therefore:
- the temporal bug was real;
- it has been corrected;
- the direct-cosine causal FAIL survives correction;
- no learned head is promoted from this evidence.

The next target remains within-one-ecology causal responsibility switching between concurrently held matters.


## Within-one-ecology mixed-pressure causal target — QUALIFIED

The previous concurrent-matter causal probe correctly falsified direct cosine, but its responsibility labels were still structurally aligned with separate ecologies:
- workshop matter active in material-work;
- contact matter active in moving-contact.

That confound is now removed by a disposable mixed-pressure ecology.

Janek simultaneously owns:
- workshop-processing matter;
- local-report-response matter.

Within the same continuous ecology:
- ordinary workshop pressure can make workshop-processing causally responsible;
- private speech/report pressure can make local-report-response causally responsible;
- responsibility is still established by paired one-matter ablation after an identical deterministic prefix.

### Audit

Per wording variant:
- 12 retained causal examples;
- 6 workshop-responsible;
- 6 report-responsible;
- 9 unique transition histories;
- 0 ambiguous histories;
- chance top-1 = 0.5.

Lexical controls:
- baseline wording: ~0.333 top-1;
- paraphrase wording: ~0.583 top-1.

Interpretation:
- the target is balanced;
- responsibility switches inside one ecology;
- actor identity and ecology identity no longer determine the label;
- model-visible transition histories are label-identifiable in the retained set;
- lexical overlap is not a dominant solver, though the paraphrase sample is small and 0.583 must not be overinterpreted.

This is currently the strongest R3 supervision target.

### Promotion boundary

QUALIFIED:
- mixed-pressure ecology as research test equipment;
- within-one-ecology causal responsibility switching;
- paired matter ablation as supervision;
- zero observed transition-history ambiguity in the retained 12-example set.

NOT YET QUALIFIED:
- frozen MiniLM on this target;
- any learned relation head;
- any ReflexBrain output contract;
- any actor authority;
- any claim that 12 examples constitute a benchmark.

## Clean next move

The next experiment, in a new completed iteration, may evaluate the existing frozen semantic representation against this mixed-pressure causal target.

Required controls:
- baseline and paraphrase wording;
- last-transition and short-history variants;
- lexical baseline reported alongside semantic result;
- no training;
- no learned head;
- no authority.

If frozen direct cosine remains at chance, the entire direct-cosine matter-relevance family stays rejected and the project should move toward a jointly learned relation function only after expanding the causal corpus.

If it shows robust paraphrase-resistant signal, treat that only as representation evidence, not as ReflexBrain architecture.


## Mixed-pressure frozen MiniLM falsifier — IMPLEMENTED, LIVE EXECUTION BLOCKED

The qualified within-one-ecology mixed-pressure causal target now has a dedicated, isolated frozen-representation probe.

Implementation head:

`696ffcc5e4083727be3d3cfd6b710b6379c55786`

Qualified:
- TypeScript/tests/build: PASS;
- Research Preview build/deploy: PASS;
- dedicated `r3-mixed-pressure-probe.html`;
- frozen pinned MiniLM-L3 q8 path;
- isolated `batchSize=1`;
- baseline + paraphrase wording;
- last-transition + mean-transitions;
- lexical audit emitted alongside semantic metrics;
- per-matter accuracy and wording stability included;
- no training;
- no learned head;
- no actor authority.

The intended live Opera/WebGPU execution could not be completed because the Opera Browser Connector was disconnected.

A single bounded cloud-browser attempt was used only as a runtime check. The page reached terminal `FAIL_EXECUTION` with:

`Failed to get GPU adapter`

Therefore that run is **not model evidence** and must not be interpreted as a MiniLM FAIL.

A container Chromium check also failed to provide a trustworthy WebGPU backend and was rejected as a substitute.

### Current exact frontier

No further implementation is required before the model falsifier.

The next action is only:

1. restore a browser with a working WebGPU adapter;
2. open the already-deployed dedicated mixed-pressure probe;
3. capture `causalAudit`, `semanticRetrieval`, and `wordingStability`;
4. classify direct cosine as PASS/FAIL only from that valid execution;
5. record the result before beginning any new mechanism.

Do not train a relation head while this falsifier is unresolved.


## Mixed-pressure frozen MiniLM falsifier — LIVE RESULT: DIRECT-COSINE FAMILY REJECTED

The already-qualified dedicated mixed-pressure probe was executed in a real Opera/WebGPU browser against the deployed checkpoint.

Runtime:
- model: `Xenova/paraphrase-MiniLM-L3-v2`;
- revision: `4b544e74dfc3256b2b56849ea5d7064fee1ac846`;
- q8;
- WebGPU;
- isolated `batchSize=1`;
- 384 dimensions;
- 17 unique texts;
- model load ~2.02 s;
- embedding pass ~1.84 s.

Target remained unchanged:
- one continuous mixed-pressure ecology;
- one Janek;
- two simultaneously-owned matters;
- causal responsibility from paired one-matter ablation;
- 12 examples per wording;
- balanced 6/6 responsibility;
- 9 unique transition histories;
- 0 ambiguous histories.

Lexical controls:
- baseline: 0.333 top-1;
- paraphrase: 0.583;
- chance: 0.500.

### Frozen direct-cosine result

| wording | context | top-1 | chance | mean responsible margin |
| --- | --- | ---: | ---: | ---: |
| baseline | last-transition | 0.417 | 0.500 | +0.0213 |
| baseline | mean-transitions | 0.500 | 0.500 | +0.0109 |
| paraphrase | last-transition | 0.500 | 0.500 | -0.0150 |
| paraphrase | mean-transitions | 0.500 | 0.500 | +0.0049 |

Per-matter behavior reveals collapse rather than balanced competence.

Baseline / last-transition:
- workshop matter: 0.667;
- report matter: 0.167.

Baseline / mean-transitions:
- workshop matter: 0.833;
- report matter: 0.167.

Paraphrase / both context modes:
- workshop matter: **0.000**;
- report matter: **1.000**.

Wording stability:
- last-transition prediction agreement: 0.250;
- mean-transitions prediction agreement: 0.167;
- responsible prediction agreement in both modes: **0.0833**.

### Interpretation

This falsifies the remaining direct-cosine escape hatch.

The strongest current target removes the major prior confounds:
- same actor;
- same ecology;
- both matters simultaneously owned;
- responsibility switches inside that ecology;
- ground truth comes from causal ablation;
- transition histories have zero label ambiguity in the retained corpus.

Yet independent sentence embeddings compared by cosine do not track which matter is causally responsible.

The paraphrase condition is especially decisive: the model collapses to always selecting the report matter while the true labels remain balanced 6/6.

### Promotion decision

**REJECTED FAMILY**

Reject as candidate ReflexBrain relation mechanism:
- direct cosine between matter text and private snapshot;
- direct cosine between matter text and private transition;
- last-transition cosine;
- mean-history / mean-transition cosine;
- treating earlier Janek same-actor signal as causal relevance evidence.

Do not rescue this family with:
- larger capacity;
- a trained classifier/head on top of the same weak 12-example target;
- new wording chosen to make cosine look better;
- a different target introduced solely because this one failed.

Preserve:
- frozen semantic encoder as a representation donor;
- causal-ablation supervision;
- mixed-pressure target;
- actor-private transition representation;
- paraphrase controls;
- lexical/ambiguity controls.

## New frontier after rejection

The next question is no longer whether cosine can retrieve the right matter.

It is whether actor-relative causal relevance requires a **joint relation function** over private temporal evidence and candidate matter, rather than independent sentence similarity.

Before training such a relation function:
1. expand causal supervision beyond the current 12-example feasibility sample;
2. create explicit null/simple structured baselines;
3. preserve same-actor, same-ecology responsibility switching;
4. preserve paraphrase holdout;
5. design actor/domain holdouts where feasible;
6. only then test a small learned relation mechanism.

Direct cosine is closed unless genuinely new evidence reopens it.


## Post-rejection causal-supervision readiness — MATERIAL FINDING

The mixed-pressure target survives the direct-cosine rejection, but its current 12-example corpus does **not** survive a training-readiness audit.

New deterministic baseline evidence at qualified code head `c54579fc1ca239b6e2fe6710c8137f06700cd2ca`:

- balanced majority baseline: **0.500**;
- context-only rule `last transition contains heard speech -> report matter, otherwise workshop matter`: **1.000** for baseline wording;
- the same rule: **1.000** for paraphrase wording.

The cause is structural, not accidental: the disposable mixed-pressure fixture routes direct Ida speech to the report branch, while ordinary candidate sampling excludes direct Ida speech.

Interpretation:

- **causal-ablation supervision: PRESERVED**;
- **same-actor/same-ecology responsibility switching: PRESERVED**;
- **direct-cosine rejection: PRESERVED**;
- **current 12-example corpus as learned-relation training benchmark: FAIL**.

Do not train a joint relation model on this corpus.

The next earned move is to build broader, counterbalanced intervention-derived supervision where context-only and matter-only baselines cannot solve the label, then require paraphrase plus actor/domain transfer holdouts before any learned relation mechanism is allowed to claim useful actor-relative meaning.
