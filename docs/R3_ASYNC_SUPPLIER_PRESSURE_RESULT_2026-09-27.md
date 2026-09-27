# R3 Asynchronous Supplier Pressure Result — 2026-09-27

Status: **ASYNC_SUPPLIER_EPISODE_DIVERSITY_FAIL · TEMPORAL ROW GATE PASS · EPISODE DIVERSITY FAIL · PERIODICITY FAIL · NO MODEL AUTHORIZED**

## Frozen contract

`docs/R3_ASYNC_SUPPLIER_PRESSURE_CONTRACT_2026-09-27.md`

The contract was frozen before implementation.

Preserved:
- Janek persistent grounded reporting at 45/45 blocked ticks;
- Ida as stationary, deconfounded listener at (6,1);
- Mira as separate material effector;
- grounded Mira stocked completion;
- paired purpose counterfactual;
- no hidden shortage id or World truth in listener state.

New:
- Mira continuously patrols source ↔ rack independent of reports;
- frozen dwell: 60 ticks at each endpoint;
- forwarded shortage may queue one service obligation but may not reset, reverse or phase-lock the patrol state deliberately.

## Qualified head

`019097bab11994fdbb8fcfc926d1cb54b41a1eae`

Qualification:
- Check #354 PASS;
- Research Preview #373 PASS;
- 39/39 test files PASS;
- 202/202 tests PASS;
- build PASS;
- preview deploy PASS.

Both runners reproduced the same research result.

## Grounding

Janek shortage reports:
- supply-ideal: **80/80 grounded**;
- supply-respond-all: **80/80 grounded**;
- reserve-purpose-aware: **119/119 grounded**;
- reserve-purpose-blind: **80/80 grounded**.

Mira stocked reports:
- supply-ideal: **16/16 grounded**;
- supply-respond-all: **16/16 grounded**;
- reserve-purpose-aware: none;
- reserve-purpose-blind: **16/16 grounded**.

Grounding gate: **PASS**.

## Listener deconfounding

Across all supply-ideal request rows Ida remains:
- empty-handed;
- fixed X/Y;
- constant activity kind/phase;
- outside direct source/rack visibility;
- constant raw-object belief count.

Listener deconfounding gate: **PASS**.

## Temporal row gate

Supply-ideal:
- total request rows: **80**
- update-worthy: **17**
- redundant: **63**
- shared exact body/activity fingerprint: 17 positive / 63 negative
- exact report text BA: **0.5000**
- absolute tick threshold BA: **0.5430**
- request ordinal threshold BA: **0.5430**
- prior-heard-count threshold BA: **0.5430**
- known raw-belief BA: **0.5000**
- ordered Ida-private history oracle: **exact**

Temporal row gate: **PASS**.

This is the strongest row-level temporal substrate reached so far under ordinary threshold/body shortcut tests.

## Episode diversity

Settled shortage episodes: **16**

Request counts per settled episode:

`[3, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5]`

Distinct lengths:
- 3;
- 5.

Dominant length share:
- 15/16 = **0.9375**.

No single-report episode exists.

Episode diversity gate required:
- >=3 distinct lengths;
- dominant length <=0.60;
- at least one 1-report episode;
- at least one >=3-report episode.

Episode diversity gate: **FAIL**.

## Periodicity falsifier

Precommitted modulo results:

| Shortcut | BA |
| --- | ---: |
| absolute tick mod 120 | **1.0000** |
| absolute tick mod 24 | **1.0000** |
| request ordinal mod 5 | **0.9706** |
| absolute tick mod 60 | **0.8810** |
| absolute tick mod 90 | 0.5644 |
| absolute tick mod 45 | 0.5000 |
| request ordinal mod 2 | 0.5000 |
| request ordinal mod 3 | 0.5000 |
| request ordinal mod 4 | 0.5000 |
| request ordinal mod 6 | 0.5000 |

Periodicity gate: **FAIL**.

The previous modulo-3 lock was replaced, not eliminated.

## Purpose and duplicate-cost gates

Purpose gate: **PASS**.

First paired report:
- same non-purpose Ida-private state;
- supply forwards;
- reserve-aware does not.

Causal result:
- supply processing: **16**;
- reserve-aware processing: **0**;
- reserve-aware reserve deficit: **0**;
- reserve-blind reserve deficit: **1932**;
- reserve-aware forwards: **0**;
- reserve-blind forwards: **17**.

Duplicate-cost gate: **PASS**.

- ideal forwards: **17**
- respond-all forwards: **80**
- ideal processing: **16**
- respond-all processing: **16**
- respond-all accepted physical jobs: **17**

The extra 63 forwards add no throughput.

## Precommitted classification

The overall contract requires episode diversity and periodicity gates to pass.

They do not.

Classification:

**ASYNC_SUPPLIER_EPISODE_DIVERSITY_FAIL**

The periodicity gate also independently fails.

## Mechanism

Making Mira's route independent of requests was not enough.

After one transient episode, the deterministic coupled ecology converges to a stable limit cycle:
- persistent Janek report cadence: 45 ticks;
- supplier patrol/dwell cycle: deterministic;
- worker processing/world timings: deterministic;
- supply completion shifts the next shortage into a repeatable relative phase.

The system therefore settles into almost identical five-report shortage episodes.

This is not:
- a sample-size problem;
- a listener body-state leak;
- a grounding failure;
- a purpose failure;
- a failure of ordered private history.

It is a deterministic apparatus-phase problem.

## Campaign-level consequence

Do **not** keep tuning:
- Janek cadence;
- Mira dwell;
- Mira speed;
- initial phase;
- horizon;

merely to force modulo scores below a gate.

Three successive redesigns now show the same broader pattern in different forms:

1. reactive listener-effector: target leaked through body/activity state;
2. separated fast effector: target leaked through chronology/class imbalance;
3. persistent + asynchronous effector: body/threshold leakage is repaired, but deterministic fixture rhythms encode target through episode periodicity.

Meanwhile a simple ordered private-history rule reconstructs the intended unresolved/settled state exactly in every separated run.

This is evidence against treating row-level `updateWorthy` as the next learned primitive.

## Earned reframing question

The next research decision should test:

> Which part of this consumer problem actually requires learning?

Current evidence suggests a factorization candidate:

- **grounded semantic relation / applicability of a report to an actor's matter** may require learned representation;
- **temporal unresolved/settled bookkeeping from already interpreted private evidence** may be better kept deterministic and inspectable;
- learned output need not imitate the whole ideal consumer policy.

This is a hypothesis, not yet a promotion.

Before another model:
1. audit the qualified evidence supporting this factorization;
2. explicitly compare learned-update-worthiness versus deterministic temporal state + learned semantic relation;
3. require a broader grounded semantic report/matter corpus before selecting a model;
4. stop optimizing one deterministic timing fixture as if its row labels were the capability.

No learned ReflexBrain authority exists.
No Owner/product claim changes.
