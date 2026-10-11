# OCTRL-C01 — Continuous Private-Evidence Monitoring Null — 2026-10-07

Status: **SCIENTIFIC PASS · EXECUTION VALID · RUN SCIENTIFICALLY CLOSED**
Run branch: `run/octrl-c01-actor-clock-monitoring`
Precommitted contract: `docs/runs/OCTRL-C01_ARMED.md`
Draft PR: #18

## Exact causal question
Does an uninterrupted authored local controller self-initiate a bounded physical CHECK using legal actor-private evidence age, independently of the timing of hidden researcher-controlled World interventions, and does this action disappear in a matched memory-ablation run?

## Frozen outcome
**PASS (narrow control mechanism).**

- CI `37563305143`, check job `112605255761`, head `78e65fdeeddb77eb823b3f5dce85f594e7726c72`
- TypeScript, Vitest **13/13 tests**, Vite build: PASS
- deterministic exact replay of four variants: PASS
- current P0 at CHECK: matched and empty between late-impulse and memory-ablation runs;
- actor World pose/velocity immediately before CHECK: matched across late-impulse and memory ablation;
- neither hidden event produced a premature P0 target blob; target remained within sensor range;
- no World event notification, identity, World position or researcher-motor phase entered the controller.

## Decisive numeric evidence

| Variation | P0 loss | World impulse | CHECK start | private age | New legal blob | Result |
|---|---:|---:|---:|---:|---:|---|
| EARLY | 51 | 95 | 231 | 180 | 318 | PASS |
| LATE | 51 | 155 | 231 | 180 | 318 | PASS |
| STATIC | 51 | none | 231 | 180 | 313 | PASS |
| HISTORY ABLATED | 51 | 155 | never | N/A | never | correct negative |

- hidden physical displacement: EARLY 0.591659, LATE 0.589746, STATIC 0;
- prior last-seen evidence at actor-private tick 51 remained unchanged until CHECK in each enabled variant;
- CHECK initial E0 drive demand -1;
- physical movement by end of observation: EARLY/LATE 3.789278, STATIC 3.597861;
- memory-ablated run became QUIET and never CHECKed;
- all four end-states and replay traces were deterministic.

The two hidden-event timings were *predeclared* before the run. Neither timing is an input to the private controller. The actor monitors an authored private freshness obligation (180 of its own local simulation ticks after last legal P0 observation).

## Why this is materially beyond H01
H01 let the researcher release a CHECK phase after an external freeze/settle sequence. C01 runs the controller on every physics tick with no CHECK-release function or scenario-phase input: body-local odometry drives an initial bounded patrol; private last-seen age initiates CHECK; legal P0 reacquisition stops it.

This establishes a small physically continuing authored monitor, not merely copying P0 into a memory field.

## Strongest missing evidence / limitations
1. **Concern is authored.** 'Remember one blob and periodically inspect' is explicit coded behavior. No learned cognition, endogenous motivation or genuine normativity has appeared.
2. **External disturbance is authored by research.** World applies +x impulse at frozen ticks 95/155, or none. Unlike qualified E01, it is not yet produced by a recurring independent material process. Thus G5 remains open.
3. **Synthetic sensory candidate enumeration.** P02a sensor receives a World-candidate list internally. Only its output is private. This is not generic perception.
4. **No actor-owned external identity.** The later fresh blob was not recognized as 'the same object' through P1/private hypothesis. The scene only contains one candidate; researcher knows its identity.
5. **Single frozen arrangement.** This is neither robust cross-scene transfer nor general navigation/reacquisition. The predeclared patrol and reverse CHECK were selected for this null.
6. **Timed local obligation.** Although the actor receives no researcher phase or World event time, the local 180-tick evidence-age rule is manually authored and the entire simulation has a World step heartbeat. Calling it self-sustaining life would be incorrect.
7. **No open-ended trajectory.** Run is 360 simulation ticks; no honest sustained organism-level demonstration exists. Public replay is a microscope, not a separate qualified World implementation.
8. **No Owner experiential qualification.** PASS is local mechanism evidence, not a product claim.

## Methodological correction
The most dangerous next move would be to treat a successful check as 'organism born'. The still-open question is whether a persistent concern in an *independently developing material ecology* produces nontrivial, varied, responsive continuation beyond a single programmed patrol/inspection. Repeated PASSes with slightly altered age thresholds would not improve that claim.

A visual replay may be built as an observation surface and must distinguish World/research truth from private P0, last-seen age and authored controller. Visual appeal cannot promote scientific evidence.

## Run closure
Scientific result: **PASS**.
Execution valid: **yes**.
Controller/physics/sensor/scene/thresholds unchanged since freeze: **yes**.
This run itself is CLOSED; no next research run automatically activated by suffix.
