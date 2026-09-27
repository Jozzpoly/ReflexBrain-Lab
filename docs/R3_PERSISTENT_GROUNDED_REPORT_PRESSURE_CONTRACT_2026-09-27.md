# R3 Persistent Grounded Report Pressure Contract — 2026-09-27

Status: **FROZEN BEFORE IMPLEMENTATION · PRE-MODEL STRUCTURAL PRESSURE · NO LEARNED MODEL**

## Trigger

The listener–effector separation experiment produced a useful split:

- body/activity/position leakage: repaired;
- grounded shortage/completion channels: valid;
- purpose counterfactual: valid;
- duplicate-cost comparison: valid;
- temporal class pressure: still underidentified.

The remaining source run had 25 shortage reports but only 1 unresolved duplicate. The ordinary 120-tick request cooldown is too sparse relative to the separate supplier's settlement latency.

A second incidental chronology leak also remains: Ida stands on Mira's physical route, so repeated supplier fly-bys accumulate raw-object beliefs over time.

This contract addresses those two observed apparatus problems and nothing else.

## Research question

Can the separated grounded communication ecology produce repeated same-surface unresolved evidence across many real shortage episodes while:

- keeping the listener physically and behaviorally deconfounded;
- preserving speaker-private grounding;
- preserving listener-private settlement through grounded completion reports;
- defeating simple threshold and periodicity shortcuts;
- preserving the already-qualified paired purpose consequence?

## Actors and geometry

### Janek — worker + persistent grounded reporter

Physical worker behavior remains the ordinary workshop processing loop.

Report surface remains exactly:

`The input rack is empty.`

Reporting rule is frozen as:

1. rack must be privately visible and contain no free raw blank;
2. after **45 consecutive blocked ticks**, emit the report;
3. while the rack remains privately observed empty, emit the same report every further **45 blocked ticks**;
4. as soon as a free raw blank becomes privately visible, reset blocked-report persistence.

The 45-tick repeat interval is chosen **before execution** because it equals the existing ordinary first-report blocked threshold. It is not selected from a sweep and is not defined relative to supplier travel time.

All report emissions must remain 100% grounded in Janek's same-observation private empty-rack evidence.

### Ida — listener / interpreter

Position:

- x=6;
- y=1.

Sight radius: **0.75**  
Hearing radius: **5**

Ida remains:
- stationary;
- empty-handed;
- non-material;
- constant activity `grounded_listener / listen`.

The y-offset deliberately keeps Ida outside the supplier's x-axis carrying path so passing raw blanks do not accumulate as incidental private object beliefs.

Ida remains out of direct sight of:
- source x=4,y=0;
- rack x=8,y=0.

### Mira — supplier / effector

Same separated supplier behavior as the prior pressure:
- starts at source;
- hears Ida forward;
- services at most one request at a time;
- carries one raw blank to rack;
- privately confirms rack stock;
- emits exactly one grounded completion report:
  `The input rack is stocked.`
- returns to source.

Mira speed remains 0.03/tick.

## World

Unchanged from the listener–effector pressure:
- source capacity 3;
- source replenish interval 120 ticks;
- processing 24 ticks;
- initial source stock 3;
- source x=4;
- rack x=8;
- workbench x=10;
- output x=12;
- depot x=18.

Frozen horizon:
- **5400 ticks per mode**.

## Ida purposes and modes

Use the same two matter statements and four mode semantics as the prior separated pressure:

- `supply-ideal`;
- `supply-respond-all`;
- `reserve-purpose-aware`;
- `reserve-purpose-blind`.

Purpose statements are unchanged.

Temporal semantics are unchanged:
- first grounded empty report with no unresolved shortage is update-worthy;
- repeats remain redundant until Ida privately hears Mira's grounded stocked report;
- after settlement, later grounded empty report is update-worthy again.

No hidden shortage id or World truth may enter Ida's update state.

## Grounding gates

Require 100%:

### Janek
Every shortage report must be emitted from same-observation private rack-empty evidence.

### Mira
Every stocked report must be emitted from same-observation private sight of a free raw blank at rack.

Any grounding failure:

**PERSISTENT_GROUNDED_REPORT_GROUNDING_FAIL**

## Listener deconfounding invariants

On all Ida-private Janek request rows in `supply-ideal` require:

- listener holding = false for all rows;
- listener X constant;
- listener Y constant;
- activity kind constant;
- activity phase constant;
- visible source-stock bit false for all rows;
- visible rack-stock bit false for all rows;
- known raw-object belief count constant across all rows.

Any violation:

**PERSISTENT_GROUNDED_REPORT_LISTENER_LEAK**

## Temporal class gate

Build rows only from Ida-private receptions of Janek's shortage report.

Derive target only from ordered Ida-private evidence:
- empty report opens unresolved;
- grounded Mira stocked report closes unresolved;
- empty while unresolved = redundant.

Require:

1. >=30 total rows;
2. >=8 update-worthy rows;
3. >=8 redundant rows;
4. at least 8/8 positive/negative rows share the exact same listener body/activity fingerprint;
5. exact report text BA <=0.55;
6. absolute tick threshold BA <0.80;
7. request ordinal threshold BA <0.80;
8. prior-heard-count threshold BA <0.80;
9. known-raw-belief-count BA <=0.55;
10. ordered private-history oracle reconstructs every label exactly.

## Frozen periodicity shortcut audit

Because persistent reporting has an authored cadence, also attack simple periodic shortcuts.

For request ordinal categorical modulo:
- mod 2;
- mod 3;
- mod 4;
- mod 5;
- mod 6.

For absolute tick categorical modulo:
- mod 24;
- mod 45;
- mod 90;
- mod 120.

For each precommitted modulo feature, fit the best per-category majority label on the frozen rows and compute balanced accuracy.

Require every modulo shortcut:

**BA < 0.85**

If any temporal or periodicity gate fails:

**PERSISTENT_GROUNDED_REPORT_TEMPORAL_FAIL**

No post-run cadence tuning is allowed.

## Purpose gate

Repeat the exact paired first-report counterfactual:

Compare:
- `supply-ideal`;
- `reserve-purpose-aware`.

Require identical non-purpose Ida-private state at first Janek report.

Only matter may differ.

Require:
- supply forwards;
- reserve-aware does not;
- supply processing > reserve-aware processing;
- reserve-aware reserve-deficit ticks < reserve-blind;
- reserve-aware forwards < reserve-blind.

Failure classifications:
- **PERSISTENT_PURPOSE_PAIR_INVALID**
- **PERSISTENT_PURPOSE_NOT_USEFUL**

## Duplicate-cost gate

Require:
- respond-all forwards more reports than ideal;
- respond-all processing completions <= ideal + 1;
- Mira accepts fewer physical jobs than respond-all forwards.

This proves communication redundancy has cost without equivalent material benefit.

Failure:

**PERSISTENT_DUPLICATE_PRESSURE_INVALID**

## Overall classification

### GROUNDED_PERSISTENT_REPORT_PRESSURE_QUALIFIED

Only if:
- grounding gates pass;
- listener deconfounding invariants pass;
- temporal class gate passes;
- all periodicity shortcuts remain below 0.85;
- purpose gate passes;
- duplicate-cost gate passes.

This qualifies only the **pressure substrate**.

It does not qualify:
- a learned corpus;
- a learned target;
- a representation;
- an output contract;
- learned actor authority;
- Owner/product life.

### GROUNDED_PERSISTENT_REPORT_PRESSURE_FAIL

Any other valid non-infrastructure outcome.

## No-rescue boundary

After first valid execution do not change:
- 45-tick persistence threshold/repeat cadence;
- Ida position/sensors;
- Mira speed;
- geometry;
- horizon;
- source/processing timings;
- speech surfaces;
- purpose statements;
- gates.

A failure must be recorded and used to decide the next redesign.

## After PASS

Only after pressure qualification:
1. freeze a pooled grounded corpus audit across temporal + purpose contexts;
2. distinguish research provenance fields from candidate learned inputs;
3. attack speaker id, matter id/text, lexical form, event counts, timing, modulo and episode-order shortcuts;
4. require held-out grounded situations before a learner;
5. only then decide what learned primitive is justified.
