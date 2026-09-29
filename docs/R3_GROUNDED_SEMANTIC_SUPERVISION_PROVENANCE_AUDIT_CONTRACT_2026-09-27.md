# R3 Grounded Semantic Supervision Provenance Audit Contract — 2026-09-27

Status: **FROZEN PRE-MODEL AUDIT · SEPARATE FACT GROUNDING FROM PURPOSE RELATION · NO LEARNED MODEL**

## Trigger

The grounded material semantic consumer is qualified:

**GROUNDED_MATERIAL_SEMANTIC_CONSUMER_QUALIFIED**

That result proves a bounded downstream need:

> the usefulness of a grounded factual report depends on the meaning of the listener's actor-private purpose.

It does **not** prove that the authored consumer oracle is a legitimate training label.

The next task is therefore supervision provenance, not model selection.

## Core question

For the current grounded semantic relation, which signals can be used for learning without importing the answer from:

- the ideal semantic oracle;
- purpose-aware pressure generation;
- fixture matter identity;
- actor/speaker identity;
- hidden World truth;
- future information unavailable to the actor?

The audit must distinguish at least:

1. **grounded factual meaning** — what factual situation a report refers to;
2. **actor-private purpose meaning** — what the actor's own matter means;
3. **actor-relative relation** — whether this grounded evidence is semantically relevant to that purpose;
4. **deterministic temporal state** — whether the current fact episode is already handled/unresolved.

Only (3) is the current learned frontier.
(4) remains deterministic by prior decision.

## Evidence source

Use already-qualified R3 machinery.

Primary empirical source:
- Stage-A `relation` regime;
- mode `ignore-all`;
- rack-purpose and source-purpose;
- 5400 ticks each.

This regime is chosen because:
- reporters emit one grounded report per fact episode;
- report generation is independent of listener acknowledgement;
- report generation does not depend on purpose under `relation`;
- listener action is inert under `ignore-all`.

Secondary diagnostic source:
- Stage-B `persistent` regime;
- mode `ignore-all`;
- rack-purpose and source-purpose;
- 5400 ticks each.

This source is used **only** to prove whether purpose-aware retry pressure leaks the evaluation relation into the environment.
It is never candidate TRAIN data.

## Four provenance layers

### A. Actor-private grounded evidence

Legitimate raw evidence includes:
- the report text the listener actually hears;
- speaker-private observation used to emit the report;
- actor-private matter statement;
- legal private history/memory.

Hidden World/debug truth is evaluation instrumentation only.

### B. Evaluation oracle

For the current consumer:

`relationTarget = reportDomainMeaning matches matterMeaning`

This target is allowed for:
- scoring;
- counterfactual gates;
- held-out evaluation.

It is **not** automatically allowed into TRAIN.

### C. Candidate supervision

A candidate training/self-supervision signal must be generated without consulting the evaluation oracle.

### D. Research pressure

Authored fixture mechanisms may create useful pressure.
If a pressure generator already knows which domain is purpose-relevant, its consequences cannot be reused as independent supervision for that relation.

## Candidate supervision channels

The audit must classify each channel.

### 1. Same-observation report ↔ private fact correspondence

Example:
- Janek privately sees rack empty;
- Janek emits `The input rack is empty.`

Properties:
- actor-private factual grounding;
- no listener-purpose oracle required;
- available as offline grounded positive correspondence;
- potentially available online to the speaker itself.

Candidate use:
- factual semantic grounding / representation learning.

Boundary:
- does not determine whether another actor's current purpose makes the fact relevant.

### 2. Cross-actor / multi-view factual correspondence

Previously qualified material donor:
- same real material objects/facts enter multiple actors' private experience.

Candidate use:
- factual representation consistency.

Boundary:
- no purpose relation label.

### 3. Matter statement ↔ ordinary lived trajectory co-occurrence

Existing ordinary host associates authored matters with continuing life.

Boundary:
- fixture policies gate on matter id;
- wording-only matter paraphrases can leave behavior invariant;
- therefore trajectory co-occurrence is not proof that statement **meaning** caused behavior.

Classify as:
- useful representation/context donor;
- not yet qualified semantic-purpose supervision.

### 4. Paired matter-ablation causal responsibility

Existing research can show that removing a matter id causes first local decision divergence.

Boundary:
- current fixture policies consume matter identity rather than statement meaning;
- ablation therefore proves causal responsibility of the matter slot/id in that fixture, not semantic truth of the statement.

Classify as:
- research causal supervision for fixture responsibility;
- not yet grounded statement-meaning supervision.

### 5. Stage-A ideal semantic relation

The oracle directly computes the target relation.

Classify:

**EVALUATION ONLY — CIRCULAR FOR TRAIN**

### 6. Stage-B relevant retry / acknowledgement consequence

In Stage B, reporters are explicitly constructed with the current purpose so only the purpose-relevant domain retries persistently.

Therefore retry count, cessation after acknowledgement, and purpose-conditioned communication pressure already contain the oracle answer in the pressure generator.

Classify:

**CIRCULAR PRESSURE — REJECT FOR TRAIN**

### 7. Ida acknowledgement action

In ideal mode the acknowledgement is produced by the authored semantic oracle.

Classify:

**ORACLE ACTION — REJECT FOR TRAIN**

### 8. Physical workshop throughput

Qualified consumer result shows the semantic modes retain equal material throughput.

Classify:
- current relation supervision: non-informative.

### 9. Wording/paraphrase invariance

Authored paraphrases can be useful:
- as held-out evaluation;
- as invariance regularization only if the semantic equivalence assumption is explicitly authored.

They are not an independent source of factual or relevance truth.

### 10. Actor-private indistinguishability invariants

If two World variants produce identical actor-private state, learned output should remain equal.

Classify:
- legitimate hard invariance constraint;
- does not supply positive direction for fact×purpose relevance.

## Empirical purpose-counterfactual test

Run Stage-A rack-purpose and source-purpose under identical `ignore-all` pressure.

Require:

1. same matter id;
2. different matter statements;
3. identical non-matter Ida-private observation/memory/activity/decision-intent trajectory;
4. identical grounded report timeline;
5. for every rack/source report event, the evaluation target flips under the alternate purpose.

Interpretation:

> grounded fact evidence alone cannot determine actor-relative relevance; the purpose meaning is causally necessary to the evaluation relation.

## Stage-B leakage test

Run persistent `ignore-all` for both purposes.

Compare report counts/timelines by domain.

If the purpose changes which domain repeats despite the listener ignoring everything, then the pressure source itself encodes relevance.

That evidence permanently forbids using:
- repeat count;
- report persistence;
- report cessation;
- reporter retry latency;

as independent semantic-relevance TRAIN labels in this fixture.

## Lexical shortcut audit

The current 2×2 relation is semantically meaningful but may be lexically easy.

Audit a token-overlap relation baseline over:
- frozen consumer report surfaces;
- frozen consumer matter statements.

Report:
- 2×2 baseline accuracy / balanced accuracy.

Also freeze **evaluation-only** paraphrase sets preserving the same grounded meanings.

### Report paraphrases

Rack-empty:
- `No unfinished blank is available at the workshop intake.`
- `The worker feed point has run out of raw stock.`
- `There is no raw piece left at the bench input.`

Source-empty:
- `The raw-material reserve has been depleted.`
- `No unfinished stock remains at the supply point.`
- `The feedstock store has run dry.`

### Matter paraphrases

Rack-purpose:
- `monitor shortages where unfinished stock is presented to the worker; depletion of the upstream reserve is outside this duty`
- `respond to reports that the workshop feed point lacks raw material, not to upstream storage depletion`

Source-purpose:
- `monitor depletion of the upstream raw-material reserve; workstation intake shortages are outside this duty`
- `respond to reports that the supply reserve has run out, not to shortages at the worker feed point`

These strings are **evaluation counterfactuals**, not TRAIN examples by default.

Audit:
- baseline-surface lexical relation accuracy;
- cross-paraphrase lexical relation accuracy;
- tie rate.

No quality claim follows merely from lexical failure.

## Empirical support requirements

For same-observation fact grounding:
- >=20 grounded rack-empty episodes;
- >=20 grounded source-empty episodes;
- grounding rate 1.000.

For purpose counterfactual:
- >=20 paired report events;
- all paired non-purpose private state/timelines invariant;
- relation label flip rate 1.000.

## Precommitted classifications

### SEMANTIC_SUPERVISION_PROVENANCE_INVALID

Use if:
- grounded factual provenance itself fails;
- Stage-A purpose counterfactual is not clean;
- hidden state is required to reconstruct the purported actor-private evidence.

### GROUNDED_RELATION_SUPERVISION_AVAILABLE

Only if the audit identifies at least one supervision channel that:
- does not consult the evaluation oracle;
- is not generated by purpose-aware pressure;
- is not matter/actor/speaker identity;
- distinguishes positive vs negative fact×purpose relevance;
- is grounded in legal actor-private/causal evidence.

### GROUNDED_FACT_SUPERVISION_ONLY

Use if:
- legitimate grounded fact/self-consistency supervision exists;
- but no non-circular actor-relative purpose relation supervision exists.

This is a valid research result and **must block local relation-head training from oracle labels**.

### SEMANTIC_SUPERVISION_EMPTY

Use if even factual grounding/self-consistency is not sufficient to form a legal learning signal.

## Consequence of GROUNDED_FACT_SUPERVISION_ONLY

Do not train:

`(report, matter) -> relevance`

from oracle labels.

Instead the next architecture question becomes:

> can a learned factual/purpose representation be built from legal grounding/invariance signals and then evaluated zero-shot or with a separately justified relation mechanism, without local oracle distillation?

Possible next candidates, not yet authorized:
- factual report ↔ private fact representation learning;
- multi-view factual alignment;
- externally pretrained semantic representation evaluated zero-shot;
- purpose representation learned only after a genuine statement-semantic grounding source is created.

A later grounded action/outcome ecology may create honest relevance supervision, but it must be independently qualified.

## No-rescue boundary

After audit execution:
- do not reclassify Stage-B retry as supervision;
- do not call oracle labels "pseudo-ground-truth";
- do not treat matter-id ablation as statement semantics;
- do not use report/speaker/matter ids as semantic answers;
- do not train because the 2×2 target is easy.

No learned ReflexBrain authority exists.
No Owner/product claim changes.
