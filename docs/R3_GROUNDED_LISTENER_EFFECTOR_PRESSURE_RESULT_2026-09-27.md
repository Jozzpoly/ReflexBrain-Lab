# R3 Grounded Listener–Effector Separation Pressure Result — 2026-09-27

Status: **LISTENER_EFFECTOR_TEMPORAL_PRESSURE_FAIL · BODY/ACTIVITY DECONFOUNDING PASS · PURPOSE PASS · GROUNDED SETTLEMENT PASS · DUPLICATE-COST PASS · NO MODEL AUTHORIZED**

## Frozen contract

`docs/R3_GROUNDED_LISTENER_EFFECTOR_PRESSURE_CONTRACT_2026-09-27.md`

The contract was frozen before implementation.

## Execution and qualification

Initial semantic head:

`c71417920482ebb350ce67a253ec924fbdb357b0`

At that head:
- Check #339 PASS;
- Research Preview #353 computed the same research result but exceeded the 30-second Vitest timeout on the slower runner after printing the result.

This was classified as runner variance / apparatus timeout, not semantic disagreement.

Recovery changed **only** the per-test timeout from 30 seconds to 60 seconds.

Qualified recovery head:

`e8dab1a4b817045c7e9c1233263dcb0a70cb5cd2`

Qualification:
- Check #340 PASS;
- Research Preview #354 PASS;
- 37/37 test files PASS;
- 200/200 tests PASS;
- build PASS;
- preview deploy PASS.

The research numbers reproduced.

## Grounding

Janek shortage reports:
- supply-ideal: 25/25 grounded;
- supply-respond-all: 25/25 grounded;
- reserve-purpose-aware: 45/45 grounded;
- reserve-purpose-blind: 25/25 grounded.

Grounded rate: **1.000** in every mode.

Mira stocked-completion reports:
- supply-ideal: 23/23 grounded;
- supply-respond-all: 23/23 grounded;
- reserve-purpose-aware: 0 reports;
- reserve-purpose-blind: 23/23 grounded.

Every emitted completion report was based on Mira-private same-observation evidence of a free raw blank at the rack.

Grounding gate: **PASS**.

## Frozen 5400-tick mode results

### supply-ideal

- Janek requests: **25**
- Ida forwards: **24**
- Mira accepted forwards: **24**
- Mira stocked reports: **23**
- rack placements: **24**
- processing completions: **23**
- worker blocked ticks: **3781**
- source reserve deficit ticks: **2871**

### supply-respond-all

- Janek requests: **25**
- Ida forwards: **25**
- Mira accepted forwards: **24**
- Mira stocked reports: **23**
- rack placements: **24**
- processing completions: **23**
- worker blocked ticks: **3781**
- source reserve deficit ticks: **2871**

Respond-all pays one extra forward without improving physical throughput.

### reserve-purpose-aware

- Janek requests: **45**
- Ida forwards: **0**
- Mira accepted forwards: **0**
- Mira stocked reports: **0**
- rack placements: **0**
- processing completions: **0**
- worker blocked ticks: **5391**
- source reserve deficit ticks: **0**

### reserve-purpose-blind

- Janek requests: **25**
- Ida forwards: **24**
- Mira accepted forwards: **24**
- Mira stocked reports: **23**
- rack placements: **24**
- processing completions: **23**
- worker blocked ticks: **3781**
- source reserve deficit ticks: **2871**

## What listener–effector separation fixed

On Ida's `supply-ideal` request rows:

- holding state is always false;
- listener X is constant;
- listener Y is constant;
- activity kind is constant;
- activity phase is constant;
- visible source-stock bit is always false;
- visible rack-stock bit is always false.

Corresponding shortcut BA:
- activity kind: **0.500**
- activity phase: **0.500**
- exact report text: **0.500**
- holding object: **0.500**
- listener X threshold: **0.500**
- listener Y threshold: **0.500**

This is a real structural improvement over the patrol pressure.

The previous listener-as-effector leak has been removed:

> unresolved report state is no longer encoded in the listener's carried object, route phase, position, or direct rack/source visibility.

## Purpose counterfactual

The first Ida-private Janek shortage report remains perfectly paired between:
- `supply-ideal`;
- `reserve-purpose-aware`.

Only Ida's matter differs.

At the same first grounded report:
- supply forwards;
- reserve-aware does not.

Causal consequences:
- supply processing completions: **23**;
- reserve-aware processing completions: **0**;
- reserve-aware reserve-deficit ticks: **0**;
- reserve-blind reserve-deficit ticks: **2871**;
- reserve-aware forwards: **0**;
- reserve-blind forwards: **24**.

Purpose gate: **PASS**.

## Respond-all duplicate-cost gate

- supply-ideal forwards: **24**
- supply-respond-all forwards: **25**
- supply-ideal processing: **23**
- supply-respond-all processing: **23**

Duplicate-cost gate: **PASS**.

## Remaining temporal failure

The `supply-ideal` request corpus contains:

- rows: **25**
- update-worthy: **24**
- redundant/unresolved: **1**

Only the first shortage episode produces a repeated Janek report before Mira's grounded completion reaches Ida.

After that, the separate supplier usually completes service and returns a grounded stocked report before Janek's next 120-tick request cooldown fires.

Therefore class balance remains structurally inadequate.

The remaining shortcuts are now chronology/frequency shortcuts rather than body-state shortcuts:

- absolute tick threshold BA: **0.979167**
- request ordinal threshold BA: **0.979167**
- prior heard-count threshold BA: **0.979167**
- known raw belief count BA: **0.958333**

Private ordered history still exactly reconstructs the target, but the corpus does not force a learner to use it because almost every report after the first duplicate is update-worthy.

Temporal gate: **FAIL**.

Overall classification:

**LISTENER_EFFECTOR_TEMPORAL_PRESSURE_FAIL**

## Interpretation

This result narrows the blocker substantially.

The previous failure was:

> listener cognition and material effectuation are the same body.

That confound is now removed.

The new failure is:

> the naturally occurring report cadence is too sparse relative to separate-supplier settlement latency, so recurrent unresolved duplicates are not sufficiently represented.

This is not a reason to:
- merge listener and supplier again;
- reintroduce listener body state;
- hide tick/ordinal features and train anyway;
- extend the same 5400-tick run;
- rebalance or duplicate the one negative row;
- call the pressure qualified.

## Next earned redesign

Create **persistent grounded reporting pressure** while preserving the successful separation architecture.

The reporter should:
- remain grounded in the same real empty-rack private observation;
- repeat the same shortage report after another meaningful blocked interval while the shortage remains physically unresolved;
- stop naturally once rack stock is privately visible again.

The repeat cadence must be frozen before execution and justified as reporter persistence, not selected after a sweep.

The new pressure must additionally audit:
- request-ordinal modulo shortcuts;
- tick modulo / periodicity shortcuts;
- class balance across many shortage episodes;
- same listener body/activity fingerprint for both classes;
- exact private-history reconstruction;
- unchanged purpose counterfactual and grounded completion channel.

Only after a persistent-report pressure survives should a pooled grounded corpus audit be frozen.

No learned ReflexBrain authority exists.
No Owner/product claim changes.
