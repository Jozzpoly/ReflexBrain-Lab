# R3 Purpose Semantic Grounding Audit Contract — 2026-09-28

Status: **FROZEN PRE-MODEL AUDIT · PURPOSE MEANING VS MATTER IDENTITY · NO NEW LEARNER**

## Trigger

The frozen zero-shot grounded semantic bridge produced:

**ZERO_SHOT_GROUNDED_SEMANTIC_BRIDGE_PARTIAL**

The failure is purpose-side:
- report factual wording generalizes partially;
- purpose paraphrases collapse;
- local oracle distillation is blocked by the qualified supervision-provenance audit.

The next question is therefore not which encoder/head to try.

It is:

> does the current actor-private life contain any legal causal structure that grounds the meaning of a purpose statement independently of matter identity?

## Scope

Audit only already-existing R3 life machinery.

Do not:
- add a new purpose ontology;
- add semantic tags;
- parse statements into fixture fields;
- train a model;
- use the consumer oracle as grounding;
- use hidden World/debug truth as actor input.

## Candidate purpose-bearing state

Current `ResidentMatter` fields:
- `id`;
- `statement`;
- `establishedTick`;
- `source`.

Current actor-private downstream state:
- activity;
- observation;
- private memory;
- decision;
- factual outcome events.

The audit must distinguish:

1. **statement semantics** — meaning carried by natural language;
2. **matter identity / presence** — fixture slot that policies may gate on;
3. **lived trajectory** — downstream behavior and private experience;
4. **evaluation oracle** — research-only semantic interpretation.

## Test A — policy identity wiring

Inspect behavior empirically, not by source text alone.

For ordinary material and contact ecologies:
- run baseline;
- run a paired world with semantic statements permuted across fixed matter ids;
- preserve ids, source and established tick;
- compare full World steps and actor-private causal projection with statement text removed.

Require at least 420 ticks.

If trajectories are identical while statements are semantically exchanged, statement meaning is causally inert in that ecology.

## Test B — wording-only paraphrase invariance

Use existing baseline vs paraphrase matter statements with the same ids.

For:
- material ecology;
- contact ecology;

require:
- identical World steps;
- identical actor-private causal projection excluding statement text;
- changed statement text;
- unchanged matter ids.

This establishes wording invariance of the fixture behavior.

Important:
- wording invariance alone is not semantic grounding;
- if behavior is invariant because policy ignores statement text, classify it as identity wiring, not successful semantic abstraction.

## Test C — identity/presence causality

For representative material and contact residents:
- run to a deterministic decision point with the fixture matter present;
- remove only the matter from actor-private state using the research seam;
- advance one tick from the paired prefix;
- require the next decision/activity to diverge from the baseline.

This establishes that matter presence/id is causally consumed.

It does not establish statement semantics.

## Test D — intrinsic purpose representation inventory

Audit whether any actor-private field besides statement text and matter identity can encode purpose content.

The current candidate structured fields are:
- `establishedTick`;
- `source`;
- current activity;
- private memory;
- observation.

A field cannot count as purpose-semantic grounding if:
- it is identical across semantic statement counterfactuals;
- it is downstream of identity-gated fixture policy;
- it merely identifies actor/matter/fixture;
- it is produced by the evaluation oracle.

## Test E — semantic consumer boundary

Use the already-qualified grounded material semantic consumer relation regime only as a boundary check.

Require:
- same Ida matter id across rack-purpose/source-purpose;
- purpose statement differs;
- non-matter Ida-private trajectory remains identical under `ignore-all`;
- grounded report timeline remains identical.

Interpretation:
- the evaluation relation can change with statement meaning;
- ordinary private life still supplies no non-oracle causal purpose structure if Test A-D show identity-only wiring.

## Qualification criteria

A nonlinguistic/structured purpose grounding channel is qualified only if all are true:

1. actor-private at inference time;
2. not matter/actor/fixture identity;
3. not evaluation-oracle generated;
4. changes materially when purpose meaning changes;
5. remains stable under wording-only paraphrase of the same meaning;
6. has causal relation to ordinary lived behavior or outcomes;
7. is available before the decision it is meant to inform.

## Precommitted classifications

### PURPOSE_SEMANTIC_GROUNDING_AVAILABLE

At least one channel satisfies all seven criteria.

This does not authorize relation training yet.

### PURPOSE_COMMITMENT_IDENTITY_ONLY

Require:
- statement permutation leaves ordinary causal trajectories unchanged;
- wording-only paraphrase leaves ordinary causal trajectories unchanged;
- matter removal/identity intervention changes behavior;
- no non-identity actor-private channel satisfies all seven grounding criteria;
- semantic consumer purpose counterfactual remains an evaluation-only distinction.

Interpretation:

> current R3 life contains causal commitment slots, but their natural-language purpose meaning is not grounded by the ordinary life machinery.

### PURPOSE_GROUNDING_AUDIT_INVALID

Use if paired trajectories cannot be cleanly compared or the interventions do not isolate statement vs identity.

## No-rescue boundary

After execution do not:
- call activity kind/phase semantic grounding merely because it correlates with matter id;
- treat matter ablation as statement-semantic evidence;
- parse the statement into a hand-authored domain tag;
- create a purpose label from the consumer oracle;
- train a purpose encoder from authored purpose classes;
- sweep pretrained encoders on the existing relation.

A negative result is expected to be useful.

## After PURPOSE_COMMITMENT_IDENTITY_ONLY

The next earned design problem becomes:

> construct the smallest causal ecology in which purpose meaning itself is grounded through actor-private experience/consequence, rather than attached as descriptive text to an identity-gated slot.

That future ecology must be frozen separately before implementation.

No learned ReflexBrain authority exists.
No Owner/product claim changes.
