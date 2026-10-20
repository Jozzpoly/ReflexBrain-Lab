# RB-HOST/X0 — Unretuned Occupant across native boxed / D0 / D1 (2026-10-20)

**Result: EXECUTION PASS; descriptive HOST/ACTOR MATERIAL COUPLING WEAK in D0, D1. NO SCIENTIFIC ORGANISM PASS.**

Pre-execution protocol: [RB-HOST-X0_ARMED_2026-10-20.md](RB-HOST-X0_ARMED_2026-10-20.md).
Test-only source: [rb-host-x0-transfer-null.test.ts](../../tests/living-organism/rb-host-x0-transfer-null.test.ts).
Full exact test result in Actions [run 39502658374](https://github.com/Jozzpoly/ReflexBrain-Lab/actions/runs/39502658374), test job 118903752513, source commit 6b76970b7fa27a3c5f74f21107216b6a2812090f.
Job conclusion **SUCCESS**; full check (TypeScript, Vitest, Vite build) PASS. The log marker is RB_HOST_X0_RESULT. This report is written *after* the first execution; it does not change any source policy, scene, metric or scenario schedule.

## Conditions

9 World/arm combinations, 7200 true Rapier steps each (60 simulated seconds), 1800 private frames each. Arm choices: no actor motor, cheap constant drive=0.12, **the exact frozen source Occupant**. Worlds: boxed native LivingWorld(true), open D0, coupled D1. All material measurements belong only to the external evaluator. **Important baseline distinction:** boxed native LivingWorld(true) is NOT the exact S0 Material Playmat shown in the Owner video; the latter's experiential FAIL remains independent and binding.

## Actual actor outcome

| World | Frozen Occupant path | 2m cells visited | Seen-cyan frames out of 1800 | Contact-sample windows with ANY movable body | Final actor XY |
|---|---:|---:|---:|---:|---|
| boxed native | 30.4195 | 11 | 1311 | 16 | (6.3524, 0.8493) |
| D0 | 37.1670 | 13 | 824 | **0** | (11.7199, 4.6945) |
| D1 | 37.5790 | 14 | 99 | **4** | (3.4304, 6.7429) |

Temporal detail by 15-second quarters:
- boxed path: 9.8111 / 7.7636 / 6.6459 / 6.1989 units; cyan-visible 350 / 186 / 325 / 450 frames.
- D0 path: 8.9549 / 10.4618 / 8.1568 / 9.5935; cyan-visible 0 / 309 / 208 / 307; contact windows all surfaces 0 / 5 / 4 / 0; MOVABLE contact windows 0 total.
- D1 path: 8.9549 / 10.7303 / 9.4168 / 8.4771; cyan-visible 0 / 99 / 0 / 0; contact windows all surfaces 0 / 20 / 9 / 4; MOVABLE contact windows 4 total.

The frozen Occupant is NOT stationary in D0 or D1. However ongoing travel does NOT produce material competence here. D0 sees cyan in 824 legal private frames after initial exploration yet never registers a sampled physical movable-body contact. D1 scarcely sees cyan and physically contacts movable matter on only four sensory windows. A sample window is NOT an independent collision/impact event.

## Frozen cheap and no-motor controls

Cheap forward (drive 0.12, no turn) across D0 and D1: total path **6.6500** and then no motion in the final 45 seconds, final (6.65,0), contact windows by quarter 137/450/450/450. It remains blocked against material geometry. The authored Occupant therefore improves mobility and reduces wall trapping relative to this minimal cheap comparator; **do not misstate it as useless**.

No-motor actor remains at (0,0), path=0 and no contacts in all worlds. Nevertheless independent World dynamics move material:
- boxed: independent purple mover ends 10.1988 units from its start in both null and Occupant runs.
- D0: moving rail ends 8.5117 units from start, another material body 2.3566 units, and their final states match null vs Occupant. Frozen Occupant does not produce a measured material-body displacement beyond autonomous dynamics.
- D1: powered gate ends 3.5082 units from start, linked rail 2.5331 units, matching null vs Occupant endpoint values; a separate movable object near (1,8) is displaced 0.4233 units in Occupant run, whereas null has no such observed displacement. These are endpoint comparisons, **not** proof of absence of all transient actor effects.

## Interpretation and adverse alternatives

**Narrow supported finding:** merely replacing the initial boxed scene with an open, physically dynamic environment does NOT, for THIS unchanged authored appearance-driven Occupant in 60s, demonstrate rich actor-owned material activity. More travel and more visual encounters were not sufficient. The D1 mechanism remains a World mechanics donor, not a resident competence milestone.

**Do NOT infer:** a learning failure, intrinsic uselessness of D0/D1, the causal effect of map size, absence of curiosity, inability of a new body/controller to inhabit these scenes, general long-term life limitations, that cyan contact is the organism's proper reward, or direct Owner acceptance.

Potential causes of weak material coupling include: controller's handcrafted turquoise fixation; the lack of an ongoing personally consequential physical activity; geometry/access; private perception occlusion/range; timescale and 60s duration; and contact/action control. Different D0/D1 trajectories do not identify any one cause.

Initial visibility mismatch is source-grounded: at (0,0), D0/D1 cyan objects (-15,3) and (17,4) lie outside 12-unit retina range, while boxed native has cyan at (5,0). It is nonetheless FALSE to say cyan remains unobserved through life: D0 later has 824 seeing frames.

## Decision / stop

**Close X0. Do not tune the unchanged Occupant toward cyan contacts, artificially reposition scene objects, or promote this fixture to a new reward.** It shows movement alone is not enough and tests a specifically weak World+Occupant pairing. The next substantive host study must select an activity and body-world affordance that actually has continuing physical consequences; compare it against cheap and World-only controls and show Owner meaningful new behavior early.

Do not merge this draft into canonical; no World, Occupant, LivingRuntime or public Pages source was modified. Preserve original Owner S0 FAIL.