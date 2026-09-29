# R3 Grounded Recurrent Report Consumer Result — 2026-09-27

Status: **GROUNDED_TEMPORAL_CONSUMER_VALUE_QUALIFIED · CONSUMER-ONLY · NO LEARNED MODEL · NO PRODUCT CLAIM**

## Frozen contract

`docs/R3_GROUNDED_RECURRENT_REPORT_CONSUMER_CONTRACT_2026-09-27.md`

The contract was frozen before implementation.

Frozen execution:
- Mira + Janek only;
- initial raw source stock: 3;
- source x=4;
- rack x=8;
- Mira starts at source;
- Mira sight 2.5;
- Mira hearing 5;
- Mira speed 0.03/tick;
- ordinary Janek worker policy unchanged;
- ordinary Janek request surface unchanged:
  `The input rack is empty.`;
- 1800 ticks per mode.

Modes:
- `ignore-all`;
- `respond-all`;
- `exact-text-once`;
- `ideal-grounded-episode`.

## Qualified head

Exact evidence head:

`2ba1535b40ed3c7a786e1e3b9a4dbb8bf74a1714`

Qualification:
- Check #314 PASS;
- Research Preview #324 PASS;
- 34/34 test files PASS;
- 197/197 tests PASS;
- build PASS.

The final test also re-runs grounded-speech provenance inside every consumer mode and requires:

`groundedRequestCount === requestCount`

and:

`groundedRate === 1`.

This passed.

## Result

### ignore-all

- requestCount: **15**
- acceptedReportCount: **0**
- rackPlacementCount: **0**
- processingCompletedCount: **0**
- workerBlockedTicks: **1791**
- shortageEpisodeCount: **1**
- requests per episode: `[15]`

The worker never escapes the first shortage.

### respond-all

- requestCount: **9**
- acceptedReportCount: **9**
- rackPlacementCount: **8**
- processingCompletedCount: **7**
- workerBlockedTicks: **1269**
- shortageEpisodeCount: **8**
- requests per episode: `[2,1,1,1,1,1,1,1]`
- responses per episode: `[2,1,1,1,1,1,1,1]`
- first accepted request arrived outside Mira's direct rack sight: **true**

This resolves recurrent shortages but pays one unnecessary duplicate response in the first unresolved episode.

### exact-text-once

- requestCount: **15**
- acceptedReportCount: **1**
- rackPlacementCount: **1**
- processingCompletedCount: **1**
- workerBlockedTicks: **1721**
- shortageEpisodeCount: **2**
- requests per episode: `[2,13]`
- responses per episode: `[1,0]`
- first accepted request arrived outside Mira's direct rack sight: **true**

This mode demonstrates the central temporal failure:

> exact text identity is not a sufficient memory key.

After one real shortage is resolved, the exact same surface later reports a new real shortage. Permanent exact-text suppression therefore destroys useful recurrent communication.

### ideal-grounded-episode

- requestCount: **9**
- acceptedReportCount: **8**
- rackPlacementCount: **8**
- processingCompletedCount: **7**
- workerBlockedTicks: **1269**
- shortageEpisodeCount: **8**
- requests per episode: `[2,1,1,1,1,1,1,1]`
- responses per episode: `[1,1,1,1,1,1,1,1]`
- first accepted request arrived outside Mira's direct rack sight: **true**
- repeat inside unresolved episode: **true**
- same surface after settled episode: **true**
- ignored repeat inside unresolved episode: **true**

The ideal consumer suppresses the duplicate report while the first shortage remains unresolved, then accepts the exact same surface again after private settlement and later recurrence.

## Precommitted gate

The frozen contract required all:

1. out-of-sight first actionable report;
2. repeat inside one unresolved shortage;
3. same surface across at least two distinct shortage episodes;
4. ideal > ignore-all processing;
5. ideal > exact-text-once processing;
6. ideal accepts fewer reports than respond-all;
7. ideal accepts the same surface after private settlement;
8. ideal ignores at least one same-surface repeat while unresolved;
9. settlement uses Mira-private evidence rather than a hidden shortage id.

All are satisfied.

Classification:

**GROUNDED_TEMPORAL_CONSUMER_VALUE_QUALIFIED**

## What is actually qualified

A narrow causal fact:

> In this grounded recurrent-report ecology, useful listener behavior requires temporal settlement of a real private report: the listener must distinguish redundant repetition inside an unresolved episode from a genuinely new recurrence of the exact same report after privately observed settlement.

The distinction is causally useful:
- no response: 0 completed parts;
- permanent exact-text suppression: 1;
- recurrent episode-aware settlement: 7;
- respond-all also reaches 7 but performs one unnecessary duplicate acknowledgement.

The first useful report is genuinely informational to Mira because the rack is outside direct sight when she accepts it.

## Why this is materially stronger than the old temporal benchmark

The old `complete/delayed/suspended` line began from authored semantic states and asked a model to classify equality/change.

The current qualified consumer instead begins from:
- Janek's actual private material shortage;
- Janek's naturally caused speech;
- Mira's own matter;
- Mira's heard evidence;
- Mira's continuing unresolved response state;
- Mira's later private visual confirmation of replenishment;
- real recurrence in World dynamics.

Therefore temporal update-worthiness is now tied to lived causal history rather than an authored state id.

## Boundaries

This does **not** qualify:
- learned semantic competence;
- arbitrary language grounding;
- broad truthfulness;
- a final belief/memory ontology;
- a final output contract;
- `pendingSupply` as the final ReflexBrain architecture;
- the exact acknowledgement behavior as product design;
- Owner/product life;
- learned authority.

The ideal policy is research instrumentation that proves consumer value.

## Next earned step

Do not train a model yet.

Construct the smallest grounded consumer-shaped corpus from actor-private provenance and then try to falsify it before any representation probe.

The corpus must preserve examples where the exact same report surface has different update-worthiness because listener-private history differs.

Mandatory shortcut audits:
- exact report text;
- event id;
- actor id;
- absolute tick / time-since-start;
- listener position;
- fixture activity phase;
- simple request ordinal;
- raw pending-response bit if it merely reproduces the ideal policy rather than representing a learnable relation.

Also require a purpose counterfactual before model work:

> the same grounded report should change usefulness when the listener's matter/purpose changes, without changing the report itself.

If the smallest corpus cannot support this without leaking the ideal policy label, broaden grounded pressure before selecting a model.

No learned ReflexBrain authority exists.
No Owner/product claim changes.
