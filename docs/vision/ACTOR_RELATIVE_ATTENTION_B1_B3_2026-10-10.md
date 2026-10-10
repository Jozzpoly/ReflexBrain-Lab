# RB-VISION/B1–B3 — attention connected to continuing material activity

**2026-10-10 UTC · ReflexBrain active-vision competence SCOUT · no production modification or learned-policy claim**

Research PR: https://github.com/Jozzpoly/ReflexBrain-Lab/pull/54  
Exact **tested-source** HEAD: `7239fc627032188d8dd05fb7f92b9685588178f8`.  
Exact-head GitHub Actions: https://github.com/Jozzpoly/ReflexBrain-Lab/actions/runs/38095442999 — **48/48 test files; 143/143 tests; TypeScript and Vite build PASS**.  
Source: `tests/living-organism/vision-history-relevant-approach.test.ts`.  
Donor parent: `research/living-organism-runtime-a-2026-10-08`.  
Other Vision sequence on the same branch: L1–L3, A1–A10, in previous reports.

## Executive result: a real step beyond synthetic optical scores, but not actor-owned curiosity

We ran an **existing authored material activity** `ApproachEpisode(true,true)`: react to a lawful turquoise RGB patch, move toward it under the existing body motor, count private actual-progress evidence, suspend/reconsider when it stalls, finish upon private physical touch. Its purpose **is authored**; the actor has not learned or created that purpose. We added test-only eye controllers, not World knowledge, planner instructions or hidden relocation flags to the occupant.

We compared four alternatives:
1. **Native gaze:** ApproachEpisode motor and default eye behavior.
2. **Unconditional scanning:** turn eye back and forth whenever the target is missing.
3. **History-conditional inspection:** only after a prior lawful target sighting, first check old actor-private direction for 80 simulation ticks, then broaden the eye scan if target remains absent.
4. **History freeze:** continue directing eye to remembered bearing without broader search.

All receive the **same real LivingWorld 96-ray RGB retina every 4 physics steps**, body-private gaze and proprioception, and actual Rapier movement/contact. The test-only eye controller never receives target coordinates, World identity, host relocation phase, or the host cost metric. Body movement continues to be dictated by the unchanged ApproachEpisode motor. This is **not A3's hypothetical variable-density retina**.

**Material discoveries:**
- Controlled host-hidden relocation behind the actor causes the original motor to lose sight and cease progress. Broader gaze search can lawfully rediscover the target and resume actual body movement to a private physical contact.
- **Both unconditional scan and memory-conditioned scan contact.** The unconditional scan is **80 physics ticks (2/3 s) faster** in each mirrored relocation. The history-specific stale revisit does not earn its time in this adversarial scenario.
- With a stationary front target, all four variants physically contact at the same time: no additional gaze needed. An independent **real World-force-powered moving target** is likewise contacted with all methods, before any extended loss-of-sight. The historical scan mechanism confers no demonstrated benefit there.
- Without any prior target, unconditional scanning incurs extensive eye control for no demonstrated material target/contact benefit. History-conditional scanning does not activate. This is a **controlled no-target** world, NOT proof that spontaneous exploration is generally pointless: new encounters can themselves create valuable future activities.
- **Matched physical-state fork B3:** two lawful different private visual histories, exactly same current RGB/touch/proprio, actor and target positions, angles, linear/angular velocities, and current World target placement. The actor with a prior sighting uses its authored conditional attention policy to rediscover and touch; the same policy without prior sighting never scans and stays. Crucial ablation: retaining visual-history and motor-controller state but disabling extra gaze also stays. Strong alternative: actor WITHOUT the history but ALWAYS scanning also discovers and contacts, and even sooner. The historical relation selects the *use* of an existing attention mechanism; it does not magically create a unique material capability.

## B1 — continuing original ApproachEpisode in the actual body

The actor initially looks at a turquoise object at x=7m, physically drives toward it, and at tick160 a host-only event either leaves it static or moves it to x=−3m,y=±5m. The relocation is material in Rapier and **not conveyed to the controller**. Target disappearance is first legally apparent in the next 30Hz sample at **tick164**, not immediately at the relocation boundary.

| World | Eye control | First fresh post-loss reacquisition | First private contact | Distance traveled |
|---|---|---:|---:|---:|
| Stationary front target | all 4 | n/a; never lost | **504** | 5.402m |
| Left-rear relocation | native | none | **none through tick4800** | 1.846m |
| Left-rear relocation | unconditional sweep | tick **212** | tick **848** | 7.209m |
| Left-rear relocation | history scan | tick **292** | tick **928** | 7.207m |
| Left-rear relocation | stale old direction | none | none through tick4800 | 1.846m |
| Right-rear relocation | native | none | none through tick4800 | 1.846m |
| Right-rear relocation | unconditional sweep | tick **340** | tick **976** | 7.207m |
| Right-rear relocation | history scan | tick **420** | tick **1056** | 7.207m |
| Right-rear relocation | stale old direction | none | none through tick4800 | 1.846m |

Material contact is marked by the actual existing `ApproachEpisode` private-touch state; the host records actual impulse in the range ~0.71 in the successful relocated cases. The moved physical target is the relevant reachable collider. The eye does not know the location or occurrence of the host intervention.

**Instrumentation correction:** an earlier exploratory test counted tick160 as a reacquisition simply because the `PrivateFrame` was still cached from BEFORE the host's physical move. That false recapture timestamp was repaired; the qualified final test only counts reacquisition *after* a fresh absent frame at tick164. Past shorter-source CI does not validate the corrected claim. A separate initial no-history fixture accidentally let unconditional scanning see the off-axis target early, invalidating the “never had a relevant past” precondition; the final test uses a truly unseen/out-of-range target and independent orange non-target stimuli for this specific cost control. Two intermediary CI failures were genuine fixture failures and were not promoted as evidence.

## B1 negative control — active scanning when no personal prior relation

Two no-target controls include an unrelated peripheral orange flash later in the run (placed on alternate sides). The turquoise object never enters the sensor's 12m range; there is no actor-private turquoise target history, or reason for `ApproachEpisode` to begin.

In both:
- native / history-conditional / history-freeze: **0 commanded gaze effort**, no motor travel or touch;
- unconditional sweep: **38 units of integral absolute normalized gaze command**, still no motor travel or touch;
- on one side, the flash is seen in **8 vs 10** RGB samples by unconditional vs stationary gaze; on the other side both see 10.

**Do not label 38 as joules, CPU savings or actual retinal cost**. It is only a command-integration proxy; gaze movement itself obeys the same real motor rate/limits, but no energetic measurement exists.

A critical ambiguity remains: broad exploration without an existing concern can be useful for *discovering new activities*. These controls only prove that this **specific no-target, authored existing activity** did not benefit materially from 40s of incessant scanning.

## B2 — truly independent World-powered target

Rather than the host teleporting a target on a schedule, this pressure arm supplies the existing **World mover** a dynamic turquoise target. The World continuously applies finite physical force to it; the gaze controller sees no mover state/identity/intent.

All four rival methods reached touch **at tick304**, with roughly 3.146m body path and ~77 native retinal frames of visible target. No meaningful loss/reacquisition occurred. No target-search advantage was present. Small contact-impulse differences (~0.878 with native centered gaze vs ~0.686 with other gaze variants) alone are not a learned competence or physically meaningful benefit without broader contact evidence.

This is a **material negative control** against the attractive notion that an elaborate search mechanism improves every dynamic target encounter.

## B3 — exactly matched present, different lawful past; positive local causal bridge

B3 creates separate lawful sensory histories from real World:
- World A initially legally shows a turquoise target in the native RGB retina, and the existing ApproachEpisode and attention cache its previous lived visual relation.
- World B initially has the target outside FOV and no previous relation.
- Before physical actuation, the host moves A's target to exactly B's identical behind/left position. Both bodies then receive four identical idle 120Hz steps until their next lawful RGB frames.
- **At the decision boundary**, A and B match exactly in every current private field (tick, 96×3 RGB, eight-touch values, gaze, forward/lateral/angular proprioception). A host-only Rapier snapshot check ALSO confirms identical actor+target positions, linear and angular velocities and angles. Physical equality is audited by host but not provided to either eye/actor.

We then test four distinct, privately initiated continuations with the same **matched current material World**:

| Lawful prior target? | Gaze policy | Later result in actual Rapier World |
|---|---|---|
| yes | history-conditional scan | Reacquired tick **120**, physical touch tick **644**, 4.232m path |
| no | history-conditional scan | No search, no touch, no body travel |
| yes | original non-scanning eye | No search, no touch, no body travel |
| no | unconditional scanning | Discovers and physically touches at tick **564**, 4.232m path |

In the third arm the earlier private motor/attention history exists yet the extra gaze is ablated: that alone kills resumption. In the fourth arm scanning itself is sufficient to discover previously unknown turquoise even without prior personal history. Thus:

**narrow defended causal chain:** `lawful earlier visual evidence → private standing relation → authored attention gate → different lawful future gaze → new RGB evidence → existing ApproachEpisode motor continuation → real material contact`.

**NOT defended:** learning an attentional policy, organism-origin curiosity, self-created reasons, object identity, semantic understanding of turquoise, or a general optimal value-of-information governor.

B3 is stronger than a fake synthetic frame test because both actual earlier RGB observations and the later full World/Rapier continuations are executable and physical. However its actor "meaning" still derives from the built-in authored turquoise-target convention, and the initial prior encounter had not yet executed forward motion before the host changed the object. B1 supplies longer enacted motor history; B3 supplies exact-current-state identifiability. Neither alone establishes life.

## Reconciliation with main ReflexBrain competence Control Room

Canonical Control Room: `docs/REFLEXBRAIN_COMPETENCE_CONTROL_ROOM_2026-10-10.md` on `research/pre-o0-foundations-campaign`; do **not** mutate it by inertia. Prior F3/D0 established a private alias where identical low-dimensional touch/mismatch histories yield opposite model costs; directional contact breaks the alias. A10 established a distinct alias: late material change with identical available private RGB/touch/proprio but opposite motor value.

B3 adds a complementary distinction:

- The **same current situation** can justify DIFFERENT internal gaze decisions because of an actor's *lawful lived history*, even when no current sensory channel differs.
- Those gaze decisions can cause real future material divergence; an ablation can establish that the extra inspection, not history alone, is necessary.
- Yet a generic always-scan policy can discover the target as well, often faster. Therefore `history-relative relevance` must be evaluated against **strong simpler behavior**, not accepted just because two forks diverge.
- Competing attention opportunity costs include time-to-contact, gaze motor effort, missed peripheral events, risks while looking, and the fact that *novel* rather than *already relevant* discoveries may be useful.

**Classification:** B1 and B3 = narrow **EVIDENCE** for lawful actor-private history→active visual inquiry→actual material consequences, and a **DONOR** for F3/F4; B1 unconditional beating history scan and B2 no-need moving target = **NEGATIVE EVIDENCE** about preferring historical search; learned value of information, owned reasons, attentive curiosity and general life = **OPEN**.

## What to test next — a genuine competence frontier, not another branded visual effect

The valuable unanswered question is not “Can an authored old-target rule turn the eye?” That now has narrow evidence.

It is:

> Can a continuing embodied agent **learn when and where a supplementary observation is worth sacrificing other opportunities**, using only its own sensed action outcomes, without a host clock or target-ID event script?

Minimum serious comparator:
1. A *pre-existing actor-relative activity or consequence* that genuinely persists through loss of immediate visibility.
2. Two or more worlds observationally aliased at attention choice, but with different hidden subsequent outcomes — checking another direction may pay off or be useless.
3. Explicit cost of looking: real motor gaze/retinal time, peripheral misses, foregone physical progress; do not equate same 96 rays with same CPU or energy.
4. Strong rivals: native no-scan; unconditional scanning; efficient finite revisit; exploration-for-novelty; actor-private learned policy; hidden-state ORACLE only for analyst.
5. **Hold out** environments with World-powered movers, occlusion, interruption and no-target controls after any training or rule selection. Test learned policy vs simple history gate, not just vs no-scan.
6. If the actor cannot form a relevant concern without test-authored turquoise semantics, report **OPEN** and investigate the F3/F4 question of whether actual prior contact, motor difficulty or other personal material feedback can seed a question.
7. Keep author-controlled `ApproachEpisode` concerns distinct from genuine actor-owned motives, and learned eye allocation distinct from a whole NPC planner.

External corroboration for the *research question* (not for our result): Kerr et al., **Eye, Robot: Learning to Look to Act with a BC-RL Perception-Action Loop**, CoRL/PMLR 2025, https://proceedings.mlr.press/v305/kerr25a.html. Its gaze policy is optimized through downstream action ability; ReflexBrain has **not** reproduced that training/learning. The 2024 active-perception information-cost research https://www.frontiersin.org/journals/robotics-and-ai/articles/10.3389/frobt.2024.1384609/full likewise cautions that cheap extra sensing can be suboptimal once observation has an opportunity cost.

## Operational continuity

- PR #54 is still a **DRAFT** atop the independent Living Organism donor branch, and all changes are tests/docs (not canonical modules).
- Prior PR #53 V1–V7 is independent range-ray research, not a drop-in replacement for the real RGB retina.
- No merge to canonical branch, no assumed import into Feniks/Combat/LLM Live NPC.
- Re-read PR #54, this report and A8–A10 for the specific dynamic-validity boundary if continuing. CI success supports only the narrow test result, never overrides Owner-observed organism/game-life FAIL.
- Next agent should avoid stacking endlessly similar target fixtures. Preferred next move: reconcile B3 with the *current* ReflexBrain F3/F4 competence frontier and build a **held-out embodied actor-private information-value test** with a nontrivial learning or personally grounded continuation criterion, or explicitly falsify the feasibility of such a test without a richer activity substrate.
