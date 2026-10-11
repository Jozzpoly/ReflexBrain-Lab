# RB-VISION/C2–C7 — Physical contact is not personally meaningful completion

**2026-10-11 · Organism competence SCOUT · material falsification and identifiability limits · NOT a canonical brain**

**Draft donor:** https://github.com/Jozzpoly/ReflexBrain-Lab/pull/54  
**Qualified exact source:** `110a010311a9cbccd6b88d1533799eb8bfd7310e`  
**Exact-source full CI:** https://github.com/Jozzpoly/ReflexBrain-Lab/actions/runs/38097582954 — **53/53 test files, 153/153 tests PASS, TypeScript and Vite PASS**.  
**Source tests:**
- `tests/living-organism/vision-contact-relation-competitors.test.ts` (C2/C3/C5/C6);
- `tests/living-organism/vision-indistinguishable-material-replacement.test.ts` (C4);
- `tests/living-organism/vision-world-mover-false-contact.test.ts` (C7).

**No `src/living-organism` modifications. No authored retina/controller/learner has been promoted to production.**

This report continues `docs/vision/TOUCH_REWARD_RELEVANCE_C1_2026-10-10.md` and `docs/vision/ATTENTION_LEARNING_B4_B5_2026-10-10.md`. Source of project-level interpretation: draft [PR #55](https://github.com/Jozzpoly/ReflexBrain-Lab/pull/55), separate canonical competence reconciliation.

## Executive scientific result

**Simply enriching the positive-touch signal with direction, familiar color, patch size, physical travel or short-term color continuity does not reliably establish that the actor contacted *what it was previously pursuing*.** C2/C3 falsifies those cheap rules in real Rapier/96-RGB scenes. C6 finds a superficially perfect rule detecting sudden contour changes—but C7 immediately breaks it in genuinely World-force-driven motion without visual discontinuity. More fundamentally, C4 proves an **exact private-information identity alias**: the actor's entire lawful visual/tactile/proprioceptive history can remain identical while the physically touched object is either the originally encountered individual or an indistinguishable replacement. Such hidden physical identity cannot be known from those identical observations.

A second independent problem (C5) shows that a supposedly more careful *visual progress* routine can fail to reach a small, distant visible target while a cheaper motor without that progress-history test succeeds.

**Caution:** None of this proves physical "success" must always mean touching the exact individual originally seen. If two objects are physically indistinguishable in all consequences, the owner's or researcher's hidden individual-identity label may not be a materially important distinction to an actual organism. C4 is an **identifiability bound on object identity**, not a discovered intrinsic value ontology. Defining what the activity was for remains an F3 question.

## C2 — 20 fully physical false contacts, actor-private cheap tests

The existing authored `ApproachEpisode(true,true)` lawfully sees a turquoise target at (7,0), moves through actual 120Hz Rapier physics and ends on its **first private positive touch**. The host inserts an unrelated decoy within its forward collision envelope at one of **five times** (ticks 80,160,300,420,468), on either side (lateral ±0.32m), colored either orange or **the same turquoise as the visually encountered target**. This yields **5 × 2 × 2 = 20** real off-target contacts, host-confirmed by a different collider handle. Native RGB (96 rays/30Hz), eight-sector touch, proprio and actor's own motor commands are the sole sources of candidate private rules.

The source test includes one real target-contact positive. All naïve comparators detect that one positive but also falsely accept:

| Lawful, researcher-authored shortcut | Off-target contacts falsely accepted / 20 |
|---|---:|
| Generic positive touch | **20** |
| Contact in the forward touch sector | **10** |
| Familiar turquoise visible at touch | **14** |
| Familiar color repeatedly visible in recent frames | **20** |
| Large familiar-color patch at touch | **10** |
| Over 4m body travel already achieved | **8** |

The same-color decoy can falsely appear as a large close familiar surface, even when the actor spent several meters approaching the actual distant target. C2 does **not** prove no richer combination can discriminate; it is a controlled explicit falsifier of the individual simple rules. The target at exactly 7m alone is a weak positive benchmark, motivating C3.

## C3 — 12 additional genuine target configurations, an additional locomotor negative

Hold nominal turquoise goal *real* and vary genuine target center distance **3.3,4.2,5.1,6.4,8.2,9.4m** and actual collider radius **0.45 / 0.85m**. Across twelve fully physical positive-intent worlds, **11** have host-confirmed real target contact at varying ticks **152–864**, and one is a *genuine intended target that is not reached* by the existing controller in the evaluated 900-tick horizon.

Adding the 11 positive contact variants to the 20 decoys gives material classification results:

| Cheap private rule | Genuine contacts accepted / 11 | Foreign contacts falsely accepted / 20 |
|---|---:|---:|
| Any touch | 11 | 20 |
| Forward-sector touch | 10 | 10 |
| Familiar turquoise currently visible | 11 | 14 |
| Familiar RGB patch present for recent frames | 11 | 20 |
| Large familiar-color patch | 11 | 10 |
| More than 4m own body travel | **5** | 8 |

Single-range true-contact timestamp is no longer a credible identity oracle: genuine contacts appear *before and after* many unrelated touches. Still, **this is authored grid variation, not independent randomized generalization or population statistics**.

Failure case: real turquoise **x=9.4m, radius 0.45m**, initially sensed at very small extent, is not contacted by the progress-history controller. That is a real competence negative, not an off-target event, and must not be silently dropped or counted as a classification negative.

## C4 — exact actor-private history alias after unseen same-colored material replacement

Independent **Worlds A and B** start with exactly the same two real turquoise physical objects of equal mass/radius/color. The native 96-ray retina lawfully shows the originally encountered front target, with the duplicate initially far away.

At tick80, the host makes one unobservable counterfactual alteration:
- **Branch LOOKALIKE:** physically move the distant copy to the actor's forward collision envelope; original remains at the previous distant position;
- **Branch ORIGINAL:** physically move the original encountered object into that same collision envelope; place the visually identical copy into the original's previous distant position.

The two branches thus have **exactly the same spatial material appearance and collision geometry** and one evolving motor controller. They differ only in **hidden physical individual identity**, not legal light/touch/proprio signals.

**Measured:**
- All **22/22 native `PrivateFrame` samples** (retina RGB, eight-sector tactile values, tick, forward/lateral/angular proprio and gaze) were exactly equal, including contact.
- First material touch at **tick84** in both.
- Actual host contact attribution: Branch LOOKALIKE touches copy, original remains **6.344m** away; Branch ORIGINAL touches original, about **1.524m** from actor center. The original is physically contacted only in the second branch.
- No private divergence was detected by the tester.

This is an **exact causal identifiability limit**, not bad model generalization. An actor using only the same complete legally available history cannot determine which original object was touched at that moment. A host `contacted_original=true` injected into private state would cheat.

**Major anti-claim:** a hidden *individual-identity label* is an analyst distinction, not necessarily materially valuable to an organism when both bodies are identical in every consequence. Also the World changes are adversarial *teleports/swaps*, not organically physically driven. This is a boundary on what can be known, not an argument to give up object correspondence, tagging, long-term memory or meaningful material relationships.

## C5 — sophisticated visual-progress history can impair ordinary successful pursuit

The above genuine x=9.4m, radius=.45m failure was isolated against a cheaper authentic `ApproachEpisode` competitor using the **same World, 96 RGB rays and 120Hz physics**, but disabling the authored history/progress reconsideration routine.

| Same distant genuine turquoise object | Actual contact | Final physical outcome |
|---|---|---|
| Approach history/progress enabled | **NO** | Stalled/paused; ~4.936m away; ~4.464m body path |
| Simpler visible-target following without that history test | **YES**, tick732 | True target collider touched; 7.971m path |

Narrow interpretation: the visible-color fragment stayed quantized/small at range, and the progress routine did not correctly interpret this sensor limitation; it inferred insufficient useful progress and stopped. Do not claim the baseline is globally superior (it can fail differently at obstacles). **F2 local competence applicability** is the right project classification, not proof that history is undesirable.

## C6 — a too-good shortcut, then its falsification by C7

Cheap `recentSmooth` compares actor-private turquoise angular patch extent across the last four native 30Hz snapshots, and accepts positive touch if its biggest absolute extent jump is below **0.15 radians**.

**In the host-teleport decoy family:**
- on the 20 off-target intrusions, 20/20 are correctly rejected;
- on five genuine near/far targets, 5/5 are correctly accepted.
- threshold sensitivity: **.07/.10/.15 rad** all reject 20/20 and accept 5/5 in this small family; higher thresholds .25/.4/.7 progressively accept 4/8/20 false contacts.

This apparent perfection is primarily **exploiting the host's artificial sudden object appearance**, not learning the contacted object's identity. C4 exact history alias already proves that some identity substitutions cannot be detected by any such short-term patch rule.

### C7 — physically World-powered challenge: no teleport after initialization

Instead of placing foreign material at a researcher-selected instant, C7 starts with a real dynamic decoy behind the body and enables the **existing finite-force World mover**. The whole test lane is initialized physically at y=-3m to match the pre-existing mover's desired y-position. The actor lawfully sees its turquoise target and begins regular existing `ApproachEpisode` pursuit. No hidden collision ID, motion regime label, timer event or object handle enters the actor.

In **two** specimens (mover start x=-3, colors orange or same turquoise), the World force-driven mover catches the body from behind at tick **312**:
- actor's generic private touch causes `ApproachEpisode` to stop;
- host verifies it was decoy contact only, original target **3.777m** away;
- the real target remains legally visible in the native RGB retina;
- the private turquoise angular extent over the last four snapshots changes by **0.000 rad**;
- the exact C6 `recentSmooth` criterion thus **falsely accepts both foreign contacts**.

In the other **four** specimens (mover starts x=-4/-5m, two colors), target collision occurs earlier at tick508; the original is truly contacted; the same cheap smoothness rule accepts those too.

**New material falsification:** C6's perfect synthetic performance does not transfer to this independently force-driven, continuous scene. The cheap rule detects teleport discontinuity, not actor-relational completion. Importantly, these C7 off-target collisions were **from behind (touch sector 0)**; the simpler directional-tactile shortcut would distinguish this particular scenario. Earlier C2/C1 frontal off-target cases, including same-sector contacts, falsify the idea that *direction alone* is universally sufficient. Competence is domain-conditional.

## Source execution / failed attempts

CI outcomes from source snapshots:
- C2 first authored fixture initially had a TypeScript color tuple/indexing error, correctly FAIL; fixed without changing the measured physical questions.
- C3 initial assertion incorrectly assumed all 12 true targets would be reached. The far-small x=9.4, radius=.45 counterexample **disproved** that. Instead of deleting the case, the source now explicitly verifies the **NO CONTACT** result as material negative evidence and uses 11/12 genuine contacts for classification.
- [C2 source](https://github.com/Jozzpoly/ReflexBrain-Lab/actions/runs/38097078505), 51/51, 148/148 PASS.
- [C3 qualified correction](https://github.com/Jozzpoly/ReflexBrain-Lab/actions/runs/38097253837) PASS.
- [C4 exact alias](https://github.com/Jozzpoly/ReflexBrain-Lab/actions/runs/38097290537), 52/52, 150/150 PASS.
- [C5 distant target](https://github.com/Jozzpoly/ReflexBrain-Lab/actions/runs/38097362014), 52/52, 151/151 PASS.
- [C6 shortcut](https://github.com/Jozzpoly/ReflexBrain-Lab/actions/runs/38097429597), 52/52, 152/152 PASS.
- [C7 final smoothness falsifier](https://github.com/Jozzpoly/ReflexBrain-Lab/actions/runs/38097582954), 53/53, 153/153 PASS.

The last run is the exact HEAD qualification for all C2–C7 source and prior Vision donor test code, not a qualification of a learned semantic agent or Owner-facing lived organism.

## Cross-competence interpretation

**F2 — model applicability: EVIDENCE, negative.** Sensor angular quantization at distance invalidates an authored progress heuristic even as a simpler visible-target motor reaches the correct object. Any richer body self-model must learn its reliability domain; high prediction performance elsewhere is irrelevant.

**F3 — personal material significance: critically OPEN.** C2 shows no one of several cheap legal touch/vision/progress cues certifies personal target completion across physical situations. C4 establishes a real information-theoretic limit about indistinguishable tokens. C7 prevents us from "solving" F3 by noticing the artificial host relocation schedule. **Neither generic contact nor a researcher's hidden identity bit can themselves become an actor-owned reason.**

**F4 — active information acquisition: OPEN, more precise boundary.** Additional looking or moving is useful only if it can obtain discriminative *lawful* evidence that bears on a real continuing activity. Foveal identity features, temporal visual registration, body positioning or other sensory modalities might do so in some ecologies, but this sequence has NOT implemented or validated such a mechanism.

**Do not propose a universal solution consisting of a contact threshold, specific color-matching feature, world `isTarget` flag, pre-authored `Matter`, perfect object-tracking promise or larger neural net trained on C1's reward.** Such a “fix” only relocates researcher authority.

## What becomes worth testing next

A physically material relation whose value is *not solely an assigned identity label*: two surfaces may look alike at low acuity but differ in their **lawfully learnable tactile, motor or persistent environmental consequences**. An actor can probe, compare experiences, and maybe learn to distinguish them through private causal histories. Verify that any decision about more scrutiny changes actual continuing action vs strong no-inspection, broad always-scan and simple touch-based alternatives. Include cases where no lawful evidence exists—explicitly UNKNOWN rather than imaginary omniscience.

An attractive next candidate in the Owner's corrected Vision direction is a **subtle sensor-resolvable mark or microgeometry on an otherwise lookalike material**, with focus incurring real lost peripheral opportunity. Crucially do not declare red-vs-cyan or “marked=important” a host-authoritative success predicate; the mark should first have to acquire a relation to the actor's actual prior experience or material consequences.

**No source merges, no canonical changes.** The research branch remains a disposable/transferable SCOUT and the ReflexBrain Control Room decides what deserves later promotion. Update [draft reconciliation PR #55](https://github.com/Jozzpoly/ReflexBrain-Lab/pull/55) separately and leave the Owner free to re-evaluate direction without losing evidence.
