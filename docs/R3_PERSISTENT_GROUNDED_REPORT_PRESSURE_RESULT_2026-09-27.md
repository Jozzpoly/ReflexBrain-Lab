# R3 Persistent Grounded Report Pressure Result — 2026-09-27

Status: **PERSISTENT_GROUNDED_REPORT_TEMPORAL_FAIL · CLASS BALANCE PASS · LISTENER DECONFOUNDING PASS · PERIODICITY SHORTCUT FAIL · NO MODEL AUTHORIZED**

## Frozen contract

`docs/R3_PERSISTENT_GROUNDED_REPORT_PRESSURE_CONTRACT_2026-09-27.md`

The pressure was frozen before implementation.

Changes relative to the previous separated listener–effector pressure:
- Janek repeats the same grounded empty-rack report after each further 45 blocked ticks;
- the 45-tick repeat cadence equals the already-existing first-report blocked threshold and was frozen before execution;
- Ida moves from (6,0) to (6,1), off Mira's material carrying line, while remaining in hearing range;
- listener–supplier separation, purpose statements, speech surfaces, World timings and horizon otherwise remain unchanged.

## Qualified head

`a5c17b5c193c8f80dd166742d1d7f93245e5bdfb`

Qualification:
- Check #347 PASS;
- Research Preview #364 PASS;
- 38/38 test files PASS;
- 201/201 tests PASS;
- build PASS;
- preview deploy PASS.

## Grounding

Janek empty-rack reports:
- supply-ideal: **72/72 grounded**;
- supply-respond-all: **72/72 grounded**;
- reserve-purpose-aware: **119/119 grounded**;
- reserve-purpose-blind: **72/72 grounded**.

Mira stocked reports:
- supply-ideal: **24/24 grounded**;
- supply-respond-all: **24/24 grounded**;
- reserve-purpose-aware: no reports;
- reserve-purpose-blind: **24/24 grounded**.

Grounding gate: **PASS**.

## Listener deconfounding

On all 72 supply-ideal Janek request rows, Ida has:
- holding=false always;
- constant X;
- constant Y;
- constant activity kind;
- constant activity phase;
- no visible source stock;
- no visible rack stock;
- constant raw-object belief count.

Listener leak gate: **PASS**.

The off-route listener position successfully removes the incidental supplier fly-by memory clock seen previously.

## Temporal class pressure

Rows:
- total: **72**
- update-worthy: **24**
- redundant/unresolved: **48**

Exact body/activity fingerprint overlap:
- positive: **24**
- negative: **48**

Private ordered history reconstructs every target exactly.

Ordinary shortcut BA:
- exact report text: **0.5000**
- absolute tick threshold: **0.5208**
- request ordinal threshold: **0.5208**
- prior heard-count threshold: **0.5208**
- known raw-belief count: **0.5000**
- body/activity/position shortcuts: **0.5000**

This is materially stronger than the previous corpus:
- class balance is adequate;
- listener state is deconfounded;
- monotonic threshold shortcuts collapse near chance.

## Periodicity falsifier

The precommitted modulo audit exposes a fatal apparatus rhythm:

| Shortcut | BA |
| --- | ---: |
| request ordinal mod 3 | **1.0000** |
| request ordinal mod 6 | **1.0000** |
| absolute tick mod 120 | **0.9167** |
| absolute tick mod 90 | 0.7500 |
| absolute tick mod 24 | 0.5417 |
| absolute tick mod 45 | 0.5000 |
| request ordinal mod 2 | 0.5000 |
| request ordinal mod 4 | 0.5000 |
| request ordinal mod 5 | 0.5000 |

The actual row sequence is mechanically regular:

> update-worthy → redundant → redundant → update-worthy → redundant → redundant → ...

Every shortage episode yields exactly three reports under the frozen ecology.

Therefore a trivial `requestOrdinal % 3` classifier recovers the target perfectly without representing:
- private settlement history;
- grounded completion evidence;
- recurrence semantics;
- purpose.

Temporal gate: **FAIL**.

Classification:

**PERSISTENT_GROUNDED_REPORT_TEMPORAL_FAIL**

## Purpose counterfactual

Purpose gate remains **PASS**.

At the same first grounded Janek report:
- supply-ideal forwards;
- reserve-purpose-aware does not.

Causal outcome:
- supply processing completions: **23**;
- reserve-aware processing: **0**;
- reserve-aware source-reserve deficit: **0**;
- reserve-blind source-reserve deficit: **2872**;
- reserve-aware forwards: **0**;
- reserve-blind forwards: **24**.

## Duplicate-cost gate

- supply-ideal forwards: **24**
- supply-respond-all forwards: **72**
- supply-ideal processing completions: **23**
- supply-respond-all processing completions: **23**
- supply-respond-all physical jobs accepted by Mira: **24**

Duplicate-cost gate: **PASS**.

The extra 48 forwards produce no physical throughput benefit.

## Interpretation

Persistent grounded reporting repaired the previous sample-size problem, but exposed a stronger version of the same methodological lesson:

> balanced labels are not enough if deterministic apparatus timing turns history into a trivial periodic code.

This is not a reason to:
- randomize labels;
- hide ordinal/tick fields and train anyway;
- sweep report cadence until modulo BA happens to fall;
- weaken the periodicity gate;
- declare the corpus qualified because conventional threshold shortcuts are low.

The problem is structural.

## Next earned redesign

Keep:
- Ida as deconfounded listener;
- Janek's persistent same-surface grounded reports;
- Mira as separate material effector;
- grounded Mira completion evidence;
- purpose counterfactual.

Change the source of **service latency**, not the label.

Mira should have an independent ongoing background activity/patrol that exists regardless of reports. A forwarded shortage should create one queued supply obligation, but should not reset or phase-lock Mira's background route.

Desired effect:
- some shortages settle after 1 repeat;
- some after 2;
- some after 3+;
- variation emerges from where the independent supplier already is in her own activity cycle, not from post-hoc random jitter.

The next pressure must:
- freeze supplier background route before execution;
- keep Ida's body/activity invariants;
- retain periodicity audits;
- additionally report the distribution of request counts per real shortage episode;
- require at least three distinct episode lengths and no single request-ordinal modulo shortcut >=0.85;
- avoid using supplier phase as listener input.

Only after that pressure survives should a pooled grounded corpus audit be attempted.

No learned ReflexBrain authority exists.
No Owner/product claim changes.
