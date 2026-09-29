# R3 Asynchronous Supplier Pressure Contract — 2026-09-27

Status: **FROZEN BEFORE IMPLEMENTATION · PRE-MODEL STRUCTURAL PRESSURE · NO LEARNED MODEL**

## Trigger

The persistent grounded-report pressure repaired:
- class balance;
- listener body/activity leakage;
- monotonic threshold shortcuts;
- incidental listener raw-object memory leakage.

But it failed because fixed reporter cadence and fixed reactive-supplier latency phase-locked into:

`positive, negative, negative`

for every shortage episode.

Precommitted periodicity audit found:
- request ordinal mod 3 BA 1.000;
- mod 6 BA 1.000.

The next pressure must vary **service latency from independent world activity**, not tune the reporter or inject label jitter.

## Research question

Can a separate supplier's independent ongoing activity create naturally variable settlement latency such that:

- grounded persistent reports remain factually identical;
- listener-private temporal semantics remain unchanged;
- shortage episodes contain varying numbers of repeated reports;
- no simple global threshold or precommitted periodicity shortcut recovers update-worthiness;
- purpose remains causally relevant?

## Preserved substrate

Keep from the persistent-report pressure:

### Janek

- ordinary workshop processing behavior;
- grounded empty-rack report:
  `The input rack is empty.`
- first report after 45 blocked ticks;
- repeat every further 45 blocked ticks while rack remains privately observed empty;
- reset persistence when rack stock becomes privately visible.

### Ida

- stationary listener at x=6,y=1;
- sight radius 0.75;
- hearing radius 5;
- constant `grounded_listener / listen` activity;
- no pickup/place/process;
- no direct source/rack visibility;
- same supply/reserve purposes;
- same forwarding surface:
  `Mira, please restock the input rack.`

### Grounded settlement

Ida closes unresolved shortage only from privately heard Mira completion:

`The input rack is stocked.`

Mira may emit that completion only from same-observation private evidence of a free raw blank at rack.

## New supplier background activity

Mira is no longer a reactive actor waiting at source.

She continuously patrols:

`source -> rack -> source -> rack -> ...`

regardless of:
- Janek reports;
- Ida forwarding;
- Ida purpose;
- whether a supply obligation exists.

Frozen supplier parameters:
- starts at source;
- speed 0.03/tick;
- sight radius 2.5;
- hearing radius 5;
- dwell at source: **60 ticks**;
- travel to rack;
- dwell at rack: **60 ticks**;
- travel to source;
- repeat.

The 60-tick dwell is frozen before execution and is not selected by a sweep.

## Route independence

A forward may set one boolean queued service obligation, but may not:
- reset patrol phase;
- reverse travel direction;
- reset dwell countdown;
- teleport Mira;
- start a new independent route timer.

While a queued obligation exists:

### At source opportunity
If Mira is empty-handed and privately sees a free raw blank at source, she picks one.

### At rack opportunity
If Mira holds the raw blank, she places it on rack.

### Completion
On a later private observation at rack with:
- empty hands;
- free raw blank privately visible at rack;

Mira emits exactly one grounded stocked report and clears the service obligation.

Duplicate forwards while a service is queued/in progress do not create parallel physical jobs.

After completion Mira continues the same patrol phase/direction that the background route would otherwise have had.

Endpoint pickup/place/speech may consume a World intent tick, but must not reset the patrol state or dwell schedule.

## World

Unchanged:
- source x=4;
- rack x=8;
- workbench x=10;
- output x=12;
- depot x=18;
- source capacity 3;
- source replenish interval 120;
- processing 24;
- initial source raw stock 3.

Frozen horizon:
- **5400 ticks per mode**.

Modes:
- supply-ideal;
- supply-respond-all;
- reserve-purpose-aware;
- reserve-purpose-blind.

## Grounding gates

Require 100%:
- Janek empty reports grounded in same-observation private rack-empty evidence;
- Mira stocked reports grounded in same-observation private rack-stock evidence.

Failure:
**ASYNC_SUPPLIER_GROUNDING_FAIL**

## Listener deconfounding gate

On every Ida-private Janek request row in supply-ideal require:
- holding=false;
- X constant;
- Y constant;
- activity kind constant;
- activity phase constant;
- visible source stock=false;
- visible rack stock=false;
- known raw-object belief count constant.

Failure:
**ASYNC_SUPPLIER_LISTENER_LEAK**

## Temporal row gate

Derive update-worthiness only from ordered Ida-private:
- Janek empty reports;
- Mira grounded stocked reports.

Require:
1. >=30 rows;
2. >=8 positive;
3. >=8 negative;
4. >=8 positive and >=8 negative under identical listener body/activity fingerprint;
5. exact-text BA <=0.55;
6. absolute-tick threshold BA <0.80;
7. request-ordinal threshold BA <0.80;
8. prior-heard-count threshold BA <0.80;
9. known-raw-belief BA <=0.55;
10. private-history oracle exact.

## Episode-length diversity gate

Partition supply-ideal Janek request rows into shortage episodes using only Ida-private stocked completion reports as settlement boundaries.

For each settled episode count Janek empty reports heard before settlement.

Require:
- at least **8 settled shortage episodes**;
- at least **3 distinct report-count lengths**;
- no single episode length occurs in more than **60%** of settled episodes;
- at least one episode contains exactly 1 report;
- at least one episode contains >=3 reports.

Failure:
**ASYNC_SUPPLIER_EPISODE_DIVERSITY_FAIL**

## Periodicity shortcut gate

Reuse frozen modulo audits:

Request ordinal:
- mod 2;
- mod 3;
- mod 4;
- mod 5;
- mod 6.

Absolute tick:
- mod 24;
- mod 45;
- mod 60;
- mod 90;
- mod 120.

Every modulo shortcut must have:

**BA < 0.85**

Failure:
**ASYNC_SUPPLIER_PERIODICITY_FAIL**

## Purpose gate

Repeat the same paired first-report supply vs reserve counterfactual.

Require:
- identical non-purpose Ida-private state;
- supply forwards;
- reserve-aware does not;
- supply processing > reserve-aware;
- reserve-aware reserve deficit < reserve-blind;
- reserve-aware forwards < reserve-blind.

Failure:
- **ASYNC_SUPPLIER_PURPOSE_PAIR_INVALID**
- **ASYNC_SUPPLIER_PURPOSE_NOT_USEFUL**

## Duplicate-cost gate

Require:
- respond-all forwards > ideal forwards;
- respond-all processing <= ideal + 1;
- respond-all Mira accepted physical jobs < respond-all forwards.

Failure:
**ASYNC_SUPPLIER_DUPLICATE_PRESSURE_INVALID**

## Overall classification

### GROUNDED_ASYNC_SUPPLIER_PRESSURE_QUALIFIED

Only if:
- grounding passes;
- listener deconfounding passes;
- temporal row gate passes;
- episode-length diversity passes;
- periodicity gate passes;
- purpose gate passes;
- duplicate-cost gate passes.

This qualifies only the research pressure substrate.

It does not qualify:
- a corpus;
- a learned target;
- a model;
- an output contract;
- actor authority;
- Owner/product life.

### GROUNDED_ASYNC_SUPPLIER_PRESSURE_FAIL

Any other valid non-infrastructure outcome.

## No-rescue boundary

After first valid execution do not change:
- 45-tick reporter persistence;
- 60-tick supplier dwell;
- supplier route;
- Ida position/sensors;
- Mira speed;
- World timings;
- horizon;
- speech surfaces;
- purpose statements;
- gates.

Do not sweep dwell time or cadence after seeing the result.

## After PASS

Only after pressure qualification:
1. freeze a pooled grounded corpus audit;
2. hold out complete shortage episodes, not random rows;
3. attack lexical, speaker, matter, episode-order, timing and periodicity shortcuts;
4. require purpose and temporal transfer across held-out grounded episodes;
5. only then freeze a learned representation/target hypothesis.
