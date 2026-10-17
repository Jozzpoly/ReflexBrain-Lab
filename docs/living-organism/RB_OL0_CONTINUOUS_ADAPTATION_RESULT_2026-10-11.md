# RB-OL0 — Continuous Actor-Private Actuation Adaptation — RESULT — 2026-10-11

**Frozen scientific outcome: FAIL (no incremental value over cheaper adaptive rule).**  
**Execution: PASS (39/39 test files, 115/115 tests, TypeScript/build), deterministic two complete replays.**

Evidence: [GitHub Actions 38106424756](https://github.com/Jozzpoly/ReflexBrain-Lab/actions/runs/38106424756) at executable source `1d20bd98f74fa598fe3cd8f3c3a4f80e23f77dd5`. Console output: `RB_OL0_RESULT`.

Parent protocol (frozen *before* the code was run): [RB_OL0_CONTINUOUS_ADAPTATION_ARMED_2026-10-11.md](RB_OL0_CONTINUOUS_ADAPTATION_ARMED_2026-10-11.md). Research-only donor branch and [draft PR #58](https://github.com/Jozzpoly/ReflexBrain-Lab/pull/58) based on Living Organism A. Default `LivingRuntime` and `Occupant` unchanged.

## 1. What actually ran

- Each arm executed a *continuous* Rapier 2D physical World and 30Hz private RGB retinal + proprioceptive sampling, with 120Hz motor/body step and one physically collidable turquoise object.
- Physical target at (8,±4), radius .8; body's collision radius 1. Actor never received World position, target handle, hidden turn-gain regime or outcome label.
- Host-only actuation change at tick40, no notification: `turn × gain` where gain ∈ {+1, −1, +.25, −.25}. Two target sides × four gain regimes × three controllers = 24 independent uninterrupted physical runs. Within a run, candidate statistics were updated online from **own commanded turn and next sampled own angular velocity**; no cross-world learner training or training-to-test reset.
- All controllers had the same privately visible cyan-bearing activity, drive schedule and reacquisition; model variants differed only in treatment of turn calibration. This standing activity and physical impairment were researcher-authored.
- Host evaluated only true Rapier contact with that actual object. No generic touch and no retina color match was treated as contact success.

## 2. Frozen result

| Controller | Real contacts, 6 changed actuator scenarios | Unchanged controls (2) |
|---|---:|---:|
| Fixed unadapted steering | 2/6 | 2/2 |
| Cheap online **sign-only** adaptation | **6/6** | 2/2 |
| Online signed **gain+magnitude** estimator | **6/6** | 2/2 |

All 24 arms had finite valid private frames and true physical endpoints, and repeat A/B was byte-for-byte equivalent after JSON serialization.

Among changed cases, median remaining host-measured physical surface gap:
- fixed = **7.74008m**;
- sign-only = **0m** (all six real contact);
- gain+magnitude = **0m** (all six real contact).

For −1.0 reversed actuation, unadapted approach had no physical contact in either side, while both online methods touched at tick224. For −0.25, sign-only touched at tick228 while full estimator touched at tick224; that four-tick difference ≈33ms is not enough to meet frozen competence PASS, and both reach the material target.

The private online estimator changed to approximately −1, +.25 and −.25 in affected episodes, without the host supplying gain, and the frozen-learning control remained unchanged. The sign-only competitor used **the same cheap sensorimotor evidence and online correlation** but discarded magnitude when issuing action: adaptation existed in BOTH nonfixed methods.

## 3. Scientific verdict

FROZEN FAIL reasons:
1. learned contact count **does not exceed the stronger cheap rival by two** (6 vs 6);
2. learned median gap **does not improve by 15%** over the stronger cheap rival (0 vs 0).

Therefore:
- **Defended narrow POSITIVE:** a tiny, legal, actor-private online *direction/sign calibration* corrected the authored actuator reversal and changed real body/world outcome, compared to a nonadapting motor controller (6/6 vs 2/6 in this family).
- **Defended NEGATIVE:** tracking extra magnitude did not improve material contact success beyond cheap sign adaptation. Do not scale model size, increase memory, or retune the same target/actuator scenes to rescue it.
- **NOT earned:** learned self-originated goal, semantic relevance, animal-life emergence, general controller, natural-body robustness, multi-body ecology, 2D transfer, Owner quality or per-episode superiority of richer model.

## 4. Red-team interpretation / limitation

This is a *real closed-loop physical outcome*, but still a narrow researcher-authored contact task: one color class, one free-standing physical object, no independent mover/occlusion/complex contact, one hidden host-controlled gain switch, nominal steering/damping constants available as engineering prior, no new world discovery or reason formation. Sign detection is an exceptionally strong shortcut in this task — **that is the point of the strong baseline**.

It is stronger than offline prediction accuracy in one narrow sense: action selection updates during the same life from private experience, and later physical contact changes. It is weaker than living intelligence: there is no developed, continuing reason to care, no learned material affordance repertoire, and no autonomous broader activity.

## 5. Project-level decision

**STOP OL0 gain-model expansion.** Preserve cheap sign-calibration as a *possible* future motor competence donor. Do NOT merge research-only controller into the authored `LivingRuntime`, the default branch or ReflexBrain canonical foundation.

The highest-value question has moved beyond ‘can this body update one motor coefficient?’ to:

> Can a continuing resident privately discover a material action/outcome relation and later use it to change what it does **while pursuing an ongoing concern**, beating cheap reactive/probing policies in a genuinely different physical situation?

This requires richer causal options than a sign-flipped turn actuator. Prefer a small real ongoing world/actor activity with differentiated consequences before another offline isolated metric sweep. No new experimental architecture is authorized by this report.
