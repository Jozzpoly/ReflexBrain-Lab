# RB-LIFE/L0 — 120-second ordinary-life pressure audit · result (2026-10-21)
**SOURCE EXECUTION PASS · NORMAL-LIFE DEVELOPMENTAL HOST FAIL / INSUFFICIENT PRESSURE.**
[Research-only draft PR #83](https://github.com/Jozzpoly/ReflexBrain-Lab/pull/83), based on PR #81 source `010531a0...`. [Frozen protocol](RB-LIFE-L0_ARMED_2026-10-21.md). Exact [GitHub Actions #39628178735](https://github.com/Jozzpoly/ReflexBrain-Lab/actions/runs/39628178735) successful: 45/45 test files, 136/136 native tests, TypeScript and Vite build. JSON result marker `RB_LIFE_L0_RESULT`.

## Method and boundaries
6 ordinary life runs, **120 simulated seconds each**, native Rapier 120Hz / actor-private 30Hz 96RGB/touch/proprio, no researcher's prescribed push, no task completion flags, no runtime/agent source change. Same frozen `DevRuntime` initial World as #81: B1 yard adaptive/frozen; B1 shifted adaptive/frozen; B0 yard/shifted adaptive. The actor chooses its existing authored 1.5s four-maneuver probe agenda and the adaptive variant updates private mobility/contact scores; this is not intrinsic concern. Host-only poststates and contact handles classified for research only. Independent mover is **excluded from loose-object movement**, and its own contact count reported separately. Four full 30s quarters, no post-hoc parameter tuning or scene repositioning.

## Material consequence nearly stops after the first quarter
All values below are actual host-measured cumulative displacement of ordinary loose objects, excluding independent rail mover:

| Arm | 30s | 60s | 90s | 120s |
| --- | ---: | ---: | ---: | ---: |
| B1 yard adaptive | 9.07 | 9.07 | 9.07 | 9.07 |
| B1 yard frozen | 5.22 | 5.22 | 5.22 | 5.22 |
| B1 shifted adaptive | 1.06 | 1.06 | 1.06 | 1.06 |
| B1 shifted frozen | 1.06 | 1.06 | 1.06 | 1.06 |
| B0 yard adaptive | 15.09 | 15.15 | 15.15 | 15.15 |
| B0 shifted adaptive | 1.07 | 1.07 | 1.07 | 1.07 |

**Critical:** the learner continues to update (adaptive arms each completed 79 private-scored trials by 120s) even when material consequence is flat. Numerical updates and distance traveled are not learning-to-live or cognition.

## Motion can continue while life has effectively stalled
| Arm | Actor path 120s | Distinct 4m cells | Host windows with contact / 3600 | Private touch / 3600 | sampled loose-body contact events | sampled wall events | independent mover events |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| B1 yard adaptive | 205.4 | 18 | 897 | 780 | 338 | 3041 | 0 |
| B1 yard frozen | 146.3 | 14 | 1669 | 1664 | 138 | 6407 | 0 |
| B1 shifted adaptive | 214.5 | 16 | 124 | 122 | 54 | 0 | 359 |
| B1 shifted frozen | 145.2 | 13 | 1597 | 1595 | 54 | 6202 | 4 |
| B0 yard adaptive | 238.1 | 11 | 392 | 392 | 732 | 926 | 0 |
| B0 shifted adaptive | 218.8 | 23 | 580 | 580 | 19 | 2098 | 41 |

Important distinction: events are **sampled contact solver impulses** accumulated per actor-private 30Hz window; they are not 3041 independent collisions, not an intrinsic reward, and host object-classification is NOT an actor sensor.

At B1 yard adaptive, each of the final two 30-second windows traveled ~51.1 units with **120 stalled-forward sampled windows**, and **zero new loose-body displacement**. B1 yard frozen has growing 30s contact-window counts (229→423→508→509), final two windows nearly identical 28.9 traveled; 0 material change after first quarter. B0 yard adaptive travels ~62.7 units in each late 30s quarter while **new host contacts drop to zero** — motion and coverage are not sustained material experience. In B1 shifted adaptive, all 124 host contact windows happened in the **first 30 seconds**, none for the remaining 90s. The independently moving rail was present but **did not ensure later material engagement**.

All sampled 96RGB views had at least one ray different from background (0 background-only windows), so the result does not establish complete retinal deprivation or prove what could be inferred from frames. The current `DevResident` still *ignores retina entirely* for action decisions, a major causal reason that appearance does not guide new opportunities. The audit did not compare temporal/revisit neural features or show loop recognition.

## Verdict
**Ordinary-life host H6 UNQUALIFIED**, exactly the Owner's persistent criticism: adding a bigger bounded field and a more autonomous-looking local learner did not produce intrinsically diverse, continuing material work. Current 1.5s four-probe activity agenda can generate travel and 79 private model updates with almost no additional consequences for 90s. This does NOT prove life is impossible, and this descriptive sample is not statistical proof about all worlds, but it is strong local evidence against treating #81 as sufficient host for actor-relative semantic learning or adding a curiosity wrapper to #82's predictor.

**Do not respond by just expanding box dimensions, injecting more boxes/rail motion into the actor's exact path, tuning reward toward contact counts, adding a larger predictor, or interpreting cyan pixel presence as a concern.** Instead target the *missing ongoing activity with a revisable physical commitment*. Next bounded design question: what is the actor continuing to try to accomplish in a way that changed material affordances can interrupt and alter? Keep authored minimal developmental activity sources explicit and replaceable; do not call them emergent motives. A cheap Local Brain stabilizer for recurrent wall stalls/repeated movement may be useful but cannot itself become the ReflexBrain semantic organ. If trial's normal life remains dull, let Owner FAIL bind despite CI PASS.

## Preservation / source
PR #81 and PR #82 remain donor evidence, with separate scientific negative outcomes. This #83 branch adds an independent headless diagnostic test and frozen protocol; it does not alter ongoing resident, original E0/World, browser, `main`, nor any public deployment. Relevant canonical [Pre-O0 competence room](https://github.com/Jozzpoly/ReflexBrain-Lab/blob/research/pre-o0-foundations-campaign/docs/REFLEXBRAIN_COMPETENCE_CONTROL_ROOM_2026-10-10.md) should point here as a qualified narrow negative, not promote it to world truth.
