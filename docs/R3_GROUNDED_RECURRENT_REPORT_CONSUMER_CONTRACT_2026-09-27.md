# R3 Grounded Recurrent Report Consumer Contract — 2026-09-27

Status: **FROZEN BEFORE IMPLEMENTATION · CONSUMER-ONLY · NO LEARNED MODEL**

## Why this consumer is earned

The old temporal line used authored semantic states and repeatedly failed to produce a useful learned equality/change relation.

A later grounding audit found a materially different seed already present in ordinary R3 life:

`The input rack is empty.`

In an ordinary 1200-tick material run:
- Janek emitted it twice;
- both 2/2 utterances were true under Janek's same-tick private perception;
- the same surface occurred in two distinct real shortage episodes separated by replenishment;
- Mira heard one and privately corroborated the empty rack.

This earns a consumer test around **grounded recurrent evidence**, not another model probe.

## Question

Can a listener make causally useful use of a report caused by another actor's real private factual condition, while distinguishing:

- repeated evidence from the same still-unresolved episode;
- the exact same language surface recurring after the earlier condition was resolved and later became true again?

This tests temporal actor-relative update-worthiness, not generic sentence-state equality.

## Research-only ecology

Reuse ordinary material-world mechanics and the existing Janek `WorkerFixturePolicy`.

Keep:
- input rack at x=8;
- workbench at x=10;
- output at x=12;
- depot at x=18;
- Janek worker policy unchanged;
- Janek request text unchanged: `The input rack is empty.`;
- Janek request cooldown/blocked timing unchanged;
- World truth and action validation unchanged.

For this consumer fixture only:
- enabled residents: Mira + Janek only;
- initial source raw objects: 3;
- move material source to x=4;
- start Mira at x=4, y=0;
- start Janek at x=9.6, y=0.6;
- Mira sight radius: 2.5;
- Mira hearing radius: 5;
- Mira speed: 0.03 per tick;
- Janek uses ordinary default sight/hearing/speed;
- Janek remains able to speak at radius 5;
- frozen execution horizon: **1800 ticks per mode**.

Reason:
- source→rack distance is 4, so Mira can hear Janek from source while the rack is outside direct sight;
- slow supply transit is deliberately longer than Janek's request cooldown, allowing at least one repeated report during an unresolved shortage.

This geometry is research pressure, not production world design.

## Mira's bounded consumer

Mira has one authored research matter:

> keep the workshop input rack supplied with raw blanks when credible local evidence indicates supply is needed

The consumer may use only Mira-private inputs:
- her matter;
- heard speech;
- self position;
- held object;
- visible objects;
- her own continuing consumer state;
- ordinary known places.

No hidden World truth, Janek internal state, shortage episode id or future outcome enters Mira's decision.

## Modes

### ignore-all

Ignore all grounded requests.

Purpose:
- causal lower bound;
- shows worker pressure without communication-driven supply.

### respond-all

Treat every heard exact request surface as a fresh request, including repeats while supply is already pending.

The consumer may continue the same physical supply task, but each accepted repeated report produces another acknowledgement/response cost.

Purpose:
- tests lack of temporal settlement.

### exact-text-once

Accept the request surface only the first time it is ever heard.

Later identical surfaces are ignored permanently, even after a real shortage was resolved and later recurred.

Purpose:
- tests a brittle exact-text memory that confuses recurrent reality with duplication.

### ideal-grounded-episode

Accept the request when no supply response is currently unresolved.

While supply is pending:
- repeated identical requests are treated as redundant evidence;
- they do not trigger a second acknowledgement or restart the task.

A pending episode is considered settled only after Mira obtains private evidence of successful replenishment:
- she no longer holds the delivered raw object; and
- while locally able to see the rack, she sees a free `raw_blank` at the rack.

After settlement, a later identical report may become actionable again.

Purpose:
- ideal bounded temporal consumer using actor-private evidence/history, not authored semantic state ids.

## Consumer acknowledgement

Every accepted report emits exactly one short Mira speech acknowledgement before the physical supply action continues:

`I'll restock the input rack.`

This makes repeated accepted reports observable as a concrete local cost.

The acknowledgement itself is research instrumentation, not a proposed product behavior.

## Required controls and metrics

Run all four modes under identical deterministic initial conditions.

Report:
- total Janek grounded request speeches;
- Mira accepted/acknowledged requests;
- raw placements by Mira at the input rack;
- Janek `processing_completed` events;
- Janek blocked/waiting-for-input ticks;
- number of shortage episodes separated by successful rack replenishment;
- request count per shortage episode;
- Mira response count per shortage episode;
- whether the first accepted request in responding modes arrived while Mira could **not** directly see the rack;
- whether repeated same-surface requests occur inside one unresolved episode;
- whether the same surface recurs after at least one settled episode.

## Precommitted consumer-value interpretation

### CONSUMER_PRESSURE_INVALID

If the pressure fails to produce:
- an out-of-sight first actionable report;
- at least one repeated request inside an unresolved shortage;
- at least two distinct shortage episodes carrying the same request surface;

then do not interpret mode comparisons. Repair pressure before any semantic claim.

### GROUNDED_TEMPORAL_CONSUMER_NOT_USEFUL

If the pressure is valid but the ideal consumer does not improve material causal outcome over `ignore-all` / `exact-text-once`, or cannot avoid redundant responses relative to `respond-all`, then this consumer hypothesis is not qualified.

### GROUNDED_TEMPORAL_CONSUMER_VALUE_QUALIFIED

Require all:

1. pressure validity conditions above hold;
2. ideal mode completes more processing than `ignore-all`;
3. ideal mode completes more processing than `exact-text-once` over recurrent shortages;
4. ideal accepts fewer reports than `respond-all`;
5. ideal still accepts the same exact request surface again after a prior episode was privately settled;
6. ideal ignores at least one same-surface repeat while the earlier episode remains unresolved;
7. ideal settlement depends on Mira-private confirmation, not a hidden shortage id.

Passing this qualifies only:

> bounded causal value for actor-private temporal settlement of a naturally grounded recurrent report.

It does not qualify a learned representation, final memory ontology, general language understanding, or product behavior.

## What comes after a PASS

Do **not** immediately train a model.

After consumer value is qualified:
1. construct the smallest corpus where training/evaluation provenance comes from grounded report episodes and listener-private confirmation/settlement;
2. falsify exact text, event-id, actor-id, timing, position and fixture-policy shortcuts;
3. preserve report recurrence so identical language can have different update-worthiness across histories;
4. only then select a learned approximation.

## No-rescue boundary

Do not change after seeing the first result:
- Janek request text;
- blocked threshold/cooldown;
- source/rack distance;
- Mira speed/sight/hearing;
- mode definitions;
- settlement rule;
- run horizon chosen before execution;
- metric gates.

If the pressure is invalid, record it as apparatus/pressure failure before designing a new contract.
