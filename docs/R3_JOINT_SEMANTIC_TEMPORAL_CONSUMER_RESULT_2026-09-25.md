# R3 Joint Semantic-Temporal Consumer Result — 2026-09-25

Status: **THREE-WAY BOUNDED CONSUMER VALUE QUALIFIED · ORACLE-ONLY · NO LEARNED CLAIM · NO OWNER/PRODUCT CLAIM**

Qualified evidence head:

`ffe580a82a66507981e84e5014893dc4cc9beb61`

CI:
- Check #252: PASS;
- build: PASS;
- deploy: PASS;
- 26 test files / 176 tests PASS.

## Question

Do the two previously separate useful semantic boundaries still have downstream value when the correct response requires them **together**?

The tested relation is:

> current actor-private purpose × settled private semantic history × current heard evidence

Janek continues ordinary workshop work. The semantic consumer decides whether to acknowledge Ida's report pressure.

The ideal oracle is hand-authored research instrumentation. It is not ReflexBrain, not a final API and not automatic training supervision.

## Pressure construction

Two purpose variants use the same Janek matter ids:
- depot-status purpose;
- courtyard flower-condition purpose.

Only the report matter statement changes its meaning.

Each report episode contains:
1. a primary report in the actor-relevant domain with a semantic state cycling through `complete / delayed / suspended`;
2. a report from the other domain;
3. a differently worded restatement of the relevant domain's same semantic state;
4. an extra required repeat only if the relevant report remained unresolved.

Acknowledging the primary required report removes the extra unresolved-pressure speech event.

The paraphrased restatement remains present even after settlement so temporal duplicate suppression can be tested independently.

## Controls

- `ignore-all`;
- `respond-all`;
- `purpose-only` — uses actor purpose but ignores settled semantic history;
- `temporal-only` — uses semantic state change but ignores actor purpose;
- `exact-text-purpose` — uses actor purpose and exact text memory, but not semantic equivalence;
- `ideal-joint-oracle` — requires purpose match and semantic state change.

## Result

Aggregated over depot-purpose and courtyard-purpose runs:

| mode | Ida speech | Janek ACK | decoy responses | relevant paraphrase responses | ordinary worker ticks | activity-id changes | processing completed |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| ideal joint oracle | **150** | **50** | **0** | **0** | **2352** | 192 | 22 |
| ignore-all | **200** | 0 | 0 | 0 | **2402** | 92 | 22 |
| respond-all | 150 | 150 | 50 | 50 | 2252 | 388 | 22 |
| purpose-only | 150 | 100 | 0 | 50 | 2302 | 290 | 22 |
| temporal-only | 150 | 150 | 50 | 50 | 2252 | 388 | 22 |
| exact-text + purpose | 150 | 100 | 0 | 50 | 2302 | 290 | 22 |

## Exact qualified claim

Within this authored autonomous pressure family, useful response routing can require all three information sources together:

- **purpose is necessary**: temporal-only responds to the semantically changing decoy domain;
- **settled semantic history is necessary**: purpose-only responds again to an equivalent paraphrased restatement;
- **semantic equivalence is necessary**: exact-text + purpose behaves like purpose-only on paraphrased duplicates;
- **current evidence is necessary**: ignore-all leaves additional unresolved World speech pressure.

The ideal oracle resolves the required pressure with one acknowledgement per episode while avoiding both irrelevant-domain responses and paraphrased duplicate acknowledgements.

This is stronger than either previous consumer family in isolation.

## What this does NOT prove

It does not prove:
- learned three-way semantic competence;
- that the current text representation is sufficient;
- that oracle answers may be used as TRAIN labels without an explicit supervision decision;
- that the authored semantic parsers are candidate architecture;
- throughput improvement — all tested modes complete 22 processing cycles;
- cross-actor, cross-policy or broad world generalization;
- mid-life purpose switching inside one continuous actor trajectory;
- identical exogenous pressure timelines across the two purpose variants in this consequence fixture;
- Owner/product life quality.

The earlier static same-id 2×2 consumer remains the stronger evidence that identical pressure can demand different responses when private purpose meaning changes.

## Next earned falsifier

Before any learned model, construct a **three-way relation corpus** tied to this qualified consumer where:

- model-visible input is purpose statement + prior acknowledged semantic evidence + current evidence;
- the label source is explicitly declared as an authored semantic teacher, not intervention-derived ground truth;
- same history/current evidence can flip label under purpose counterfactual;
- same purpose/current evidence can flip label under history counterfactual;
- current evidence counterfactuals also flip label;
- `suspended` or another semantic state is absent from TRAIN;
- held-out purpose/message/history paraphrases are used;
- exact-tuple, no-purpose, no-history, no-current, surface/token and majority controls cannot solve the held-out relation.

Only after that target survives should the first learned joint relation mechanism be selected.
