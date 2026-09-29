# R3 Grounded Material Semantic Consumer Result — 2026-09-27

Status: **GROUNDED_MATERIAL_SEMANTIC_CONSUMER_QUALIFIED · ORACLE CONSUMER VALUE ONLY · NO LEARNED MODEL · NO TRAINING-PROVENANCE CLAIM**

## Frozen contract

`docs/R3_GROUNDED_MATERIAL_SEMANTIC_CONSUMER_CONTRACT_2026-09-27.md`

The contract was frozen before implementation.

The tested material meanings are:

- rack-empty:
  `The input rack is empty.`
- source-empty:
  `The raw source is empty.`

Ida uses one fixed matter id:

`resident:ida:matter:grounded-material-status`

with two alternate matter meanings:
- rack-purpose;
- source-purpose.

Temporal duplicate settlement remains deterministic and is not the learned target.

## Execution provenance

Implementation head before contract test:
`8949d5da179d53d83e0c0eff28ecc8d818ddd8df`

The first matrix test attempt retained all 28 full 5400-tick runs in memory and caused a Node/Vitest worker OOM near the 4 GB heap limit before the consumer classification was printed.

That run is an **apparatus failure**, not research evidence.

The harness was changed only to:
- execute the same 28 frozen runs sequentially;
- immediately reduce each run to a compact audit;
- release full World/private-history state before the next run;
- retain the same 5400-tick horizon, modes, purposes, metrics and gates.

First qualified recovery head:

`fee885b02d118894fd29a78c7b36e324df36b820`

Qualification:
- Check #372 PASS;
- Research Preview #394 PASS;
- 41/41 test files PASS;
- 204/204 tests PASS;
- build PASS;
- preview deploy PASS.

The semantic consumer matrix test itself completed in the Preview run in about 175 s.

## Strengthened current requalification

After the first qualified recovery, the branch briefly drifted to a later harness variant that preserved the frozen world but dropped two strict Stage-B diagnostics. Before continuing the campaign, the test was restored to the qualified gate set and strengthened with an explicit geometry-based direct-sight exclusion check.

Current strengthened evidence head:

`0f6efb62800f146ebff061d46872b1547a18cc18`

Qualification:
- Check #377 PASS;
- Research Preview #400 PASS;
- 41/41 test files PASS;
- 204/204 tests PASS;
- build PASS;
- preview deploy PASS.

The current harness additionally preserves:
- decision-level acknowledgement provenance for relevant primary reports;
- all report-event -> listener-decision mappings;
- explicit listener distance > sight radius for both source and rack on report rows.

The full Stage-A/Stage-B result reproduced exactly:
- Stage A semantic gate PASS;
- Stage B consumer gate PASS;
- overall classification **GROUNDED_MATERIAL_SEMANTIC_CONSUMER_QUALIFIED**.

This current head supersedes `fee885b...` as the primary qualification reference while preserving it as the first successful recovery evidence.

## Stage A — grounded same-pressure relation

Across the frozen relation regime:

Grounding:
- rack-empty reports: 100% same-observation privately grounded;
- source-empty reports: 100% same-observation privately grounded.

Listener isolation:
- all report events are heard by Ida;
- Ida directly sees neither source nor rack stock on report rows.

Pressure breadth:
- minimum rack reports in any run: **48**;
- minimum source reports in any run: **45**.

Timeline:
- report timelines are identical across listener modes within each purpose world: **PASS**.

Relation accuracy aggregated across rack-purpose + source-purpose:

| Consumer | Accuracy |
| --- | ---: |
| ideal semantic oracle | **1.000** |
| rack-surface-only | **0.500** |
| source-surface-only | **0.500** |
| rack-speaker-only | **0.500** |
| source-speaker-only | **0.500** |
| matter-id-only diagnostic | **0.500** |
| majority baseline | **0.500** |

The matter id is unchanged across both purpose meanings.

Therefore neither:
- one fixed report surface;
- one fixed speaker identity;
- the matter id;

is sufficient for the actor-relative relation across the paired purpose worlds.

Stage-A semantic gate: **PASS**.

## Stage B — grounded persistent consumer value

The purpose-relevant factual domain repeats every 45 ticks while the same true fact episode remains privately true and unacknowledged.

The purpose-irrelevant factual domain emits only one grounded report at episode start.

This required/decoy persistence assignment is authored **research pressure instrumentation**. It is not promoted as training-label provenance.

### Rack-purpose

`ignore-all`
- rack reports: 133;
- source reports: 45;
- rack primary episodes: 48;
- rack unresolved repeats: **85**;
- rack acknowledgements: 0.

`ideal-semantic-oracle`
- rack reports: 48;
- source reports: 45;
- rack unresolved repeats: **0**;
- relevant acknowledgements: 48;
- decoy acknowledgements: **0**;
- total communication actions: 141.

`respond-all`
- rack reports: 48;
- source reports: 45;
- relevant acknowledgements: 48;
- decoy acknowledgements: 45;
- total communication actions: 186.

Fixed rack surface/speaker controls behave like ideal in rack-purpose.
Fixed source surface/speaker controls fail to settle the rack pressure and leave 85 rack repeats while acknowledging the source decoys.

### Source-purpose

`ignore-all`
- rack reports: 48;
- source reports: 130;
- source primary episodes: 45;
- source unresolved repeats: **85**;
- source acknowledgements: 0.

`ideal-semantic-oracle`
- rack reports: 48;
- source reports: 45;
- source unresolved repeats: **0**;
- relevant acknowledgements: 45;
- decoy acknowledgements: **0**;
- total communication actions: 138.

`respond-all`
- rack reports: 48;
- source reports: 45;
- relevant acknowledgements: 45;
- decoy acknowledgements: 48;
- total communication actions: 186.

Fixed source surface/speaker controls behave like ideal in source-purpose.
Fixed rack surface/speaker controls fail to settle source pressure and leave 85 source repeats while acknowledging rack decoys.

### Aggregate ideal vs respond-all

Ideal semantic oracle:
- relevant unresolved repeats: **0**;
- decoy acknowledgements: **0**;
- listener acknowledgements: **93**;
- total communication actions: **279**.

Respond-all:
- relevant unresolved repeats: **0**;
- decoy acknowledgements: **93**;
- listener acknowledgements: **186**;
- total communication actions: **372**.

Both preserve the same physical workshop throughput:
- Janek processing completions: **47 per run**.

This is expected and allowed by the contract. The qualified consumer advantage is selective communication-pressure resolution, not fabricated product throughput superiority.

Stage-B repeat-pressure gate: **PASS**.  
Stage-B consumer-value gate: **PASS**.

## Precommitted classification

Grounding: **PASS**  
Stage A relation: **PASS**  
Stage B persistent causal consumer value: **PASS**

Overall:

**GROUNDED_MATERIAL_SEMANTIC_CONSUMER_QUALIFIED**

## What is actually qualified

A bounded causal statement:

> grounded material report meaning × same-id actor-private purpose meaning is a useful relation for a local consumer.

The same two factual reports are not globally relevant or irrelevant.

Which report deserves acknowledgement changes with Ida's current purpose statement even though:
- the matter id is identical;
- speaker identities are unchanged;
- factual report surfaces are unchanged;
- Stage-A report timelines are unchanged.

The relation has a downstream consumer:
- correct semantic routing settles relevant persistent communication pressure;
- ignoring all leaves repeat pressure;
- responding to all wastes acknowledgements on factual decoys;
- fixed surface/speaker routing works only in the purpose world it happens to match.

## What is NOT qualified

This does not qualify:
- the authored ideal oracle as learned competence;
- `domain === purpose` as legitimate training supervision;
- report-domain ids as model inputs;
- speaker identity as semantic meaning;
- arbitrary language understanding;
- a final semantic ontology;
- a learned output contract;
- learned actor authority;
- Owner/product life.

The Stage-B purpose-aware reporter persistence is intentionally authored evaluation pressure. It cannot be reused silently as training-label provenance.

## Next earned step

Remain pre-model.

Freeze a **semantic corpus + supervision provenance audit**.

The audit must keep at least three layers separate:

1. **grounded factual evidence**
   - private report surfaces tied to real material facts;
2. **actor-private purpose/context**
   - natural-language matter meaning, with the same matter id across alternate meanings;
3. **evaluation oracle**
   - the known consumer relation used to measure whether a candidate distinction would be useful.

Then ask separately:

> what legal signal from actor-private life could actually supervise or self-supervise a learned relation without importing the evaluation oracle?

Before any model run:
- reject report-domain ids / speaker ids / matter ids as supervision shortcuts;
- audit lexical-overlap and exact-surface shortcuts;
- add paraphrases preserving grounded factual meaning;
- preserve deterministic temporal episode state outside the learned target;
- keep `output_has_finished` and local contact as qualitatively different held-out pressure families;
- distinguish offline research labels from runtime-available learning signals;
- if no honest supervision source exists, do not train merely because the consumer target is easy to label.

No learned ReflexBrain authority exists.
No Owner/product claim changes.
