# R3 Grounded Listener–Effector Separation Pressure Contract — 2026-09-27

Status: **FROZEN BEFORE IMPLEMENTATION · STRUCTURAL PRESSURE REDESIGN · NO LEARNED MODEL**

## Trigger

The grounded patrol experiment produced a split result:

- grounded same-report purpose counterfactual: **PASS**;
- temporal structural-identifiability gate: **FAIL**.

The remaining confound is structural:

> the same actor interprets the report and physically performs the material response.

That makes unresolved listener state strongly visible through body/material state such as holding a raw blank.

This contract removes that coupling instead of hiding leaked features.

## Research question

Can the qualified grounded temporal/purpose problem survive when:

- one actor only interprets/forwards grounded evidence;
- a second actor performs the physical replenishment;
- settlement returns to the listener through a second privately heard grounded factual report;
- listener position, held state and background activity are invariant across temporal classes?

## Actors

### Janek — grounded shortage reporter

Use ordinary `WorkerFixturePolicy` unchanged.

Grounded report remains:

`The input rack is empty.`

Its ordinary private shortage condition, request threshold and cooldown remain unchanged.

### Ida — listener / interpreter

Ida is the actor whose private update state is under test.

Fixed physical state:
- position x=6, y=0;
- sight radius **0.75**;
- hearing radius **5**;
- no material pickup/place/process behavior;
- constant background activity kind/phase:
  `grounded_listener / listen`.

At x=6 with sight 0.75:
- source x=4 is outside direct sight;
- rack x=8 is outside direct sight;
- Janek's rack report is audible;
- Mira's source/rack communication is audible.

Ida never physically carries the supply response.

### Mira — material supplier / effector

Mira starts at source x=4.

- sight radius 2.5;
- hearing radius 5;
- speed 0.03/tick;
- no autonomous steward replenishment.

Mira reacts only to Ida's forwarding request.

Ida forwarding surface:

`Mira, please restock the input rack.`

When accepted:
1. Mira privately hears the forwarding request;
2. if not already servicing one, she picks a free raw blank at source;
3. she carries it to rack;
4. she places it;
5. on a later private observation, while at rack and directly seeing a free raw blank at rack, she emits exactly one grounded completion report:

`The input rack is stocked.`

6. she returns to source.

Completion report validity is audited from Mira-private same-tick evidence.

## World

Places:
- source x=4;
- input rack x=8;
- workbench x=10;
- output x=12;
- depot x=18.

World:
- source capacity 3;
- replenish interval 120 ticks;
- processing 24 ticks;
- ordinary action range;
- initial source raw blanks: 3.

Enabled:
- Mira;
- Janek;
- Ida.

Frozen horizon:
- **5400 ticks per mode**.

## Ida purposes

### supply-rack

Matter:

> keep workshop processing supplied by forwarding credible grounded rack-shortage reports to the supplier when the shortage is not already being handled

### preserve-source-reserve

Matter:

> preserve the three source raw blanks as emergency reserve; do not request supplier replenishment of the workshop rack from reserve stock

Only Ida's matter differs in the paired purpose counterfactual.

## Ida temporal semantics

Ida's model-free research oracle may use only Ida-private evidence.

For `supply-rack`:

### Open

A grounded Janek empty-rack report is update-worthy when Ida has no unresolved forwarded shortage.

Ida forwards exactly one supplier request.

### Unresolved

Further identical Janek reports are redundant until settlement.

They are heard and retained as private evidence but are not forwarded again in ideal mode.

### Settlement

The unresolved shortage closes only when Ida later privately hears Mira's grounded completion report:

`The input rack is stocked.`

Ida has no hidden shortage id and no direct World access.

A later Janek empty-rack report after settlement becomes update-worthy again.

### Current evidence ordering

If the same Ida observation contains both:
- Janek empty-rack report; and
- Mira stocked completion report;

the stocked completion is integrated first for historical settlement, then the empty report is evaluated as the newer/current shortage evidence only if event ordering within the previous World step proves the empty report occurred after the completion.

If ordering is simultaneous/ambiguous, do not create a new need from that pair.

This prevents an event-batching artifact from manufacturing recurrence.

## Modes

### supply-ideal

Purpose: `supply-rack`.

Forward first grounded shortage report of an unresolved episode.
Suppress repeats until grounded completion is heard.
Then allow later recurrence.

### supply-respond-all

Purpose: `supply-rack`.

Forward every grounded Janek shortage report.
Mira's physical service remains idempotent: duplicate forwards while already servicing do not create parallel cargo obligations.

### reserve-purpose-aware

Purpose: `preserve-source-reserve`.

Do not forward the shortage report.

### reserve-purpose-blind

Purpose: `preserve-source-reserve`.

Incorrect control: apply the `supply-ideal` forwarding rule despite the reserve matter.

## One-intent communication constraint

Ida is stationary.

On a tick where an accepted Janek report is heard, her single intent may be the forwarding speech.

On all other ticks she idles.

Because Ida never moves, holds or manipulates material, forwarding does not alter body position or physical task phase.

Her activity remains `grounded_listener / listen` regardless of forwarding.

## Grounding audits

Require:

### Janek shortage reports

100% privately grounded:
- Janek locally inspects rack;
- no free raw blank visible at rack at emission.

### Mira completion reports

100% privately grounded:
- Mira locally sees at least one free raw blank at rack in the same private observation used to decide to speak;
- completion speech is emitted no more than once per serviced forward.

If either grounding rate <1:

**LISTENER_EFFECTOR_GROUNDING_FAIL**

## Temporal structural gate

Build one row for every Ida-private reception of Janek's grounded empty-rack report in `supply-ideal`.

Derive `updateWorthy` from Ida-private heard history only:
- first empty after no unresolved episode = true;
- first accepted empty opens unresolved;
- Mira grounded stocked completion closes unresolved;
- repeated empties while unresolved = false.

Do not read Ida policy private fields.

Require:
1. >=20 rows;
2. >=5 positive and >=5 negative;
3. listener holding state is constant false;
4. listener X/Y are constant;
5. activity kind/phase are constant;
6. visible source/rack stock bits are constant false;
7. exact report text alone BA <=0.55;
8. absolute tick threshold BA <0.90;
9. request ordinal threshold BA <0.90;
10. prior heard-count threshold BA <0.90;
11. at least 5 positive and 5 negative rows have identical body/activity fingerprint;
12. a private heard-history oracle using only ordered `empty` / grounded `stocked` reports recovers the target exactly.

If any fails:

**LISTENER_EFFECTOR_TEMPORAL_PRESSURE_FAIL**

## Paired purpose counterfactual

Compare first Ida-private Janek request in:
- `supply-ideal`;
- `reserve-purpose-aware`.

Require identical non-purpose private state:
- tick;
- position;
- held object;
- visible objects/actors;
- heard events;
- activity;
- private memory excluding matters.

Only Ida matter may differ.

At that report:
- supply-ideal forwards;
- reserve-purpose-aware does not.

Full-run causal gates:
- supply-ideal processing completions > reserve-purpose-aware;
- reserve-purpose-aware source-reserve deficit ticks < reserve-purpose-blind;
- reserve-purpose-aware forwards fewer reports than reserve-purpose-blind.

If pairing fails:

**LISTENER_EFFECTOR_PURPOSE_PAIR_INVALID**

If paired but causal gates fail:

**LISTENER_EFFECTOR_PURPOSE_NOT_USEFUL**

## Respond-all cost gate

Require:
- supply-respond-all forwards more reports than supply-ideal;
- physical processing completions in respond-all do not exceed ideal by more than 1;
- duplicate forwarding therefore has measurable communication cost without material causal benefit.

If not:

**LISTENER_EFFECTOR_DUPLICATE_PRESSURE_INVALID**

## Overall classification

### GROUNDED_LISTENER_EFFECTOR_PRESSURE_QUALIFIED

Only if:
- both report families are 100% privately grounded;
- temporal structural gate passes;
- paired purpose gate passes;
- respond-all duplicate-cost gate passes.

This qualifies a **research pressure substrate only**.

It does not qualify:
- a corpus;
- a learned target;
- an encoder;
- an output contract;
- product behavior;
- learned authority.

### GROUNDED_LISTENER_EFFECTOR_PRESSURE_FAIL

Any other non-infrastructure result.

## No-rescue boundary

After first valid execution do not change:
- actor positions;
- Ida sight/hearing;
- Mira speed;
- world timings;
- 5400 horizon;
- speech surfaces;
- matter statements;
- Janek policy;
- gates.

If the pressure fails, preserve the exact failure and redesign from evidence.

## After PASS

Only after pressure PASS:
1. freeze a pooled grounded corpus audit;
2. include purpose and temporal factors without collapsing them prematurely into one opaque action label;
3. falsify lexical, matter-id, speaker-id, event-count and timing shortcuts;
4. only then decide whether the first learned target should be factorized relation state, update-worthiness, or another consumer-supported primitive.
