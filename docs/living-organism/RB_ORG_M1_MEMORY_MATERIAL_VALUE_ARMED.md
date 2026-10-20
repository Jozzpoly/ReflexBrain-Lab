# RB-ORG/M1 — Existing organism's private memory versus simple amnesia — ARMED 2026-10-11

**Frozen before test execution.** This is a hostile *whole-life audit* of the existing authored LivingRuntime; **not a proposed new learned model or organism architecture**.

## Question

The default autonomous `Occupant` records the direction and time of a seen turquoise visual fragment, then briefly attempts reinspection after vision is lost. Is that private history **materially useful** when the real physical environment changes, compared with the exact same controller with that remembered direction removed?

**Upper bound:** one hand-authored visually grounded continuation rule has real causal material value against its own memory ablation. No learned goal, object identity, true location knowledge, smart navigation, real organism or Owner acceptance follows from a PASS.

## Source, constraints

- Based on immutable pre-run Living Organism A `aa1ce53dc35540f38385dae0be578eb425e8fadd`.
- Run actual `LivingRuntime` (default authored Occupant, `LivingWorld`, active 96 RGB rays, real 120Hz Rapier physics and 30Hz private sensory frames, independent physical sweeper).
- **No production/default source modifications.** Test-only harness + frozen protocol + scientific result.
- Start one normal seeded persistent world; move *one other visible turquoise object* far away at tick0 to remove ambiguous same-color duplicate before seeing. This is an **authored initial scene**, not a discovered object category.
- Let a single intact autonomous runtime evolve for **80 real physical ticks** (no Owner input). At that exact tick capture complete physics, sensory phase, mover and private controller state. Verify it had legally seen the visible turquoise fragment. Fork the exact complete state into two independent worlds and verify exact equality before intervention.
- Apply exactly the same World-side intervention to the *same physical target collider* in both forks (no semantic event notifications, no model World handles): target relocation to one of `(-6,+3),(-6,-3),(6,-3),(6,+3)` or no relocation `(5,+3)`. Both copies continue 40 simulated seconds with no further host actions or Owner input.
- **Control A:** unmodified default `Occupant` with its private remembered direction/time.
- **Control B:** same `Occupant` with only `lastDirection=null,lastSeenTick=null` deleted before every ordinary decision. No replacement map, World facts, special scan or scripted fallback; the ordinary `explore` mechanism continues identically. The targeted memory exists exclusively in private state and is deliberately ablated.
- Scope: a world where World-side dragging is the actor's sole perturbation, not an independent *cause* of relocation; existing sweeper continues genuinely autonomously in both forks. The actor has *no grounded reason why* cyan moved.
- Evaluate only **true actor-target collider contact** and position using host-only microscope; contact ID never goes to either actor. Record first touch tick, final actor→target surface gap, private frame count, path travel, actor visual modes, first motor divergence, and touched-other events.
- One exact rerun of entire frozen five-scene paired audit must produce byte-for-byte stable JSON. No retuning scene coords, actor implementation, loop horizon or thresholds after inspecting outcomes.

## Scientific gate

Primary PASS requires:
1. All 5 matched checkpoint/intervention pairs execute without nonfinite states, with initial full World/private checkpoints identical.
2. Both variants retain the legal 30Hz sensory cadence, and no policy accesses target handle, host position, contact IDs or intervention schedule. Initial private observation must predate relocation.
3. In >=3/4 relocated scenes, **history-retaining** actor truly contacts the relocated physical target within 40s, and has >=2 additional true contacts compared with the memory-ablated actor across the same four scenes.
4. History-retaining actor's median final physical gap in relocated scenes is >=25% smaller than memory-ablated actor's; zeros permitted only from true target collision.
5. In the one unchanged no-relocation scene, memory retention must not turn a successful contact of amnesic actor into a failure.
6. Exact repeat deterministic.

Failing this strict gate means the simple recent-bearing memory **has not earned material value** in this scenario family. It does not prove memory is useless generally; one can revise the biological *problem* with truly actor-owned affordances later, but cannot retune this protocol as if it were a qualification.

## Alternatives / important weaknesses

A true cheap always-scan rival (as in Vision B3), a passive locator, and a bounded dead-reckoning tracker might beat both. Even if positive, this one control comparison does not qualify general memory learning. A negative outcome is high-value because further investment in the old remembered bearing may be unwarranted. The cyan patch is an **authored interest** and appearance category, not a self-selected reason. The 80-tick checkpoint is short-lived history, not long-term memory.

**Hard warning:** World teleport via `moveObject` is an explicit *Owner-like experimental perturbation*, not an autonomous mechanic, and is not part of actor input. This is a causal test, not an organism-life simulation.

Frozen source and evidence must be attached to a distinct draft PR with strict no-code-merge into canonical.