# R3 Temporal Target Reconsideration and Grounded Supervision Audit — 2026-09-27

Status: **PRE-MODEL TARGET RESET · NEXT ACTION = DETERMINISTIC GROUNDING-OPPORTUNITY AUDIT**

## Trigger

The temporal learned line now has a consistent pattern:

- bounded per-sentence known-state semantic signal exists;
- direct `abs(H-C)` relation fails;
- one joint-pair sentence embedding fails;
- `[abs(H-C), H⊙C]` fails;
- even a deliberately privileged authored-state projection followed by scalar temporal comparison fails the held-out known-state relation.

Latest classification:

**PRIVILEGED_PROJECT_THEN_COMPARE_FAIL_KNOWN**

The correct response is not another pair feature, head, threshold, encoder or TRAIN-state rescue.

## What was probably over-compressed

The qualified downstream consumers do not fundamentally need a generic abstract bit called:

`semanticStateChanged = true/false`

They need an actor to use current private evidence in relation to:

- what the actor currently cares about;
- what the actor already believes/has settled;
- what the current evidence says;
- whether that evidence should revise, reinforce, contradict, or leave alone the actor's current local understanding;
- only later, what action should follow.

The old binary equality/change target collapsed several of those operations into one authored label.

Likewise, `shouldRespond` is a downstream fixture action label. It is useful for consumer qualification but should not become ReflexBrain ontology merely because it is easy to score.

## Supervision sources already falsified or bounded

### Authored semantic teacher

Useful for defining oracle consumers and evaluation pressure.

Not autonomous semantic ground truth.

### ID ablation / causal responsibility

Qualified causal instrumentation.

Rejected as semantic supervision in the current statement-blind fixture because labels track authored policy wiring/identity and remain invariant to semantic statement permutation.

### Future private activity deltas

Previously audited and largely underidentified as first semantic targets.

### Authored state labels (`complete/delayed/suspended`)

Useful privileged diagnostics.

They can prove representation/readout facts, but they import the intended semantic partition rather than derive it from the actor's life.

## Missing ingredient

Current semantic speech pressure is scripted rather than grounded in what the speaker actually privately observed.

Examples:
- contact messenger says a fixed depot-inspection sentence after contact;
- semantic consumer pressure emits fixed depot/courtyard surfaces on authored cadence;
- temporal pressure cycles authored status states;
- joint semantic-temporal pressure cycles authored domain/state combinations.

Therefore the current host does not yet provide a natural training provenance of:

> this utterance meant X because X was a fact privately experienced by an actor.

That is the next gap to attack.

## Candidate legitimate grounding path

The autonomous material ecology already contains a stronger raw substrate:

- persistent world objects;
- actor-private perception of visible/held objects;
- actor-private memory;
- stable object identity inside private observations;
- factual object lifecycle changes;
- multiple residents encountering the same material object at different times;
- causal handoff through ordinary autonomous life.

This may provide **multi-view private factual correspondence** without using hidden World/debug state as model input.

Candidate pattern:

1. actor A privately observes a concrete material fact/event;
2. later actor B privately observes the same object/fact or its factual lifecycle continuation;
3. research instrumentation joins those two private records by provenance;
4. model-visible views exclude hidden join ids and exact World truth;
5. future language/report surfaces can be grounded to one of those private observations rather than invented semantic status labels.

This is only a hypothesis until the host proves that enough such correspondences naturally exist.

## Next pre-model question

> Does the existing qualified autonomous R3 host naturally produce enough cross-actor / cross-time correspondences over the same material objects to support a grounded semantic supervision experiment without authored semantic-state labels?

## Frozen audit scope

Use the existing autonomous material-life run only.

Do not:
- add a model;
- add speech;
- change fixture policies;
- change World dynamics;
- add new semantic labels;
- modify resident matters;
- use future World snapshots as model-visible input.

Run a deterministic ordinary autonomous material specimen long enough to cover repeated material lifecycles.

From **ResidentPrivateExperience only**, collect private material sightings:
- resident id;
- tick;
- object id;
- material kind;
- observation mode: `held` or `visible`.

Research-only joining may use stable object id because the id appears in the actor's own private observation when that object is seen. Object id must not be part of a future model-visible semantic view.

For each object:
- order private sightings by tick;
- identify cross-resident later sightings;
- report unique objects seen by 1 / 2 / 3 residents;
- report ordered resident-pair handoffs;
- report same-kind cross-actor confirmations;
- report cross-kind lifecycle continuations;
- report held→visible / visible→held and other observation-mode transitions;
- report tick-gap distribution/min/median/max;
- deduplicate repeated adjacent sightings by resident + object + kind + mode so stationary visibility does not inflate evidence.

Also report whether at least two qualitatively different material states (`raw_blank`, `finished_part`) participate.

## Audit interpretation

### GROUNDING_OPPORTUNITY_ABSENT

If no meaningful cross-actor correspondences survive deduplication, the current material host does not provide the needed grounding path. Do not build a learner; redesign pressure/substrate first.

### GROUNDING_OPPORTUNITY_TOO_NARROW

If correspondences exist but collapse to one resident pair, one material state, or a trivial repeated visibility pattern, keep the host as donor but do not promote it into semantic supervision.

### GROUNDED_MULTI_VIEW_PRESSURE_AVAILABLE

If multiple objects and multiple actor handoffs/states survive with nontrivial time separation, the current host earns the next design step:

> construct a bounded grounded-report / private-confirmation consumer and corpus where language surfaces are tied to actor-private factual observations, while model inference remains actor-private and hidden join provenance stays evaluation/training instrumentation only.

This still would not qualify a learner.

## Guardrails

Even if the audit passes:
- do not immediately train MiniLM or another model;
- do not treat object identity as semantic content;
- do not make object-id matching the benchmark;
- do not claim cross-actor shared truth from omniscient snapshots;
- preserve separate actor-private observations;
- qualify a downstream grounded semantic consumer before selecting a learned objective;
- keep learned output shadow-only until later causal promotion.
