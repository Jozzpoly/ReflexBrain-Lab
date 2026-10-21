# O-DEV/V0 — first non-cyan continuous resident: result and disposition
**2026-10-21 · native+browser source execution · scientifically narrow, NO organism/ReflexBrain semantic PASS**
**Implementation:** [research-only draft PR #81](https://github.com/Jozzpoly/ReflexBrain-Lab/pull/81), stacked on qualified *scoped* body/sensor contract donor [#80](https://github.com/Jozzpoly/ReflexBrain-Lab/pull/80). Initial frozen [armed design](RB-ODEV-V0_ARMED_2026-10-21.md). No `main` change, no public deployment, no merger; Parent physical runtime is real 120Hz Rapier B0/B1 with legal 30Hz RGB/touch/proprio.

## Scope of new software
- `src/living-organism/dev-resident.ts`: first independently instantiated resident **not importing the turquoise/cyan `Occupant`**, using no semantic color labels, World x/y, collider handles, success triggers, target/dock IDs or routes. It runs bounded (1.5s) authored motor probes, and **only in adaptive mode** incrementally scores local actor-proprioceptive mobility and sensed contact. `frozen` cycles four motor probes without learning, and `random` chooses with a deterministic private PRNG. This is a cheap discrete action-utility learner, **not** learned material meaning, curiosity, homeostasis, or vision.
- `dev-runtime.ts`: one continuing resident, a larger ~52×36 physical yard with two distinct arrangements, B0/B1 bodies and independent rail-driven body. Dedicated host-only `hostMoverHandle` exists ONLY for researcher measurement and is never provided to `DevResident`.
- `dev-field.ts`, `probes/dev-resident-v0.html`: a real single-resident Chrome microscope, not a two-body compare UI. Supports one true physical field, private 96RGB history, B0/B1 switch via resetting experimental run, manual takeover, physical object dragging, full in-tab resident+World checkpoint, pause, return control and different modes/layouts. Mobile has compact experimental setup and body motor sliders adjacent to the world. This is **research instrumentation**, not Owner-approved habitat.
- Native `tests/living-organism/rb-odev-v0-first-resident.test.ts`: actual living 30s × 16 modes/layout/body/null arms, takeover exclusion, exact physics+learned-state replay, same-state skill ablation, and **bidirectional** transfer of *only* learned private parameters to a different ecology. Web `tests/browser/odev-v0-resident.e2e.mjs` + branch-restricted Chrome CI: actual mouse and touch, manual body movement, paused material intervention, retinal pre-intervention notice, full checkpoint restoration, 900/390/320px rendering, no JS errors. Neither fixture injects secret World truth into decisions.

## Native physical result: all relevant quantities are host AUDIT, not learner labels
30s, one deterministic initial physical setup per layout, no scientific uncertainty bars. **Loose-object movement below EXCLUDES independently moving rail body**, unlike the *first uncorrected preliminary readout*.

| Body / layout | Adaptive loose movement | Frozen | Random |
| --- | ---: | ---: | ---: |
| B0 / yard | **15.095** | 8.284 | 11.498 |
| B0 / shifted | **1.067** | 0.571 | **1.955** |
| B1 / yard | **9.066** | 5.216 | 6.831 |
| B1 / shifted | **1.057** | **1.057** | **2.182** |

World-null control, both bodies: yard loose-object movement **0**, rail ~3.700; shifted loose movement **0**, rail ~1.494. Rail movement varies between moving-actor arms in shifted ecology because physical interaction can affect it; it must **not** be silently counted as resident material work. The raw totals had included rail and were **corrected before conclusion**. These numbers reflect realized material afterstate, not competence-normalized task success, energy efficiency or actor knowledge. Counting movements includes physical and possibly secondary interactions, not an intrinsically chosen goal.

Adaptive arms completed 19 actor-private scored trials in every 30s run. Frozen/random completed the same 19 action episodes without updating learned values. No clinical/qualitative user quality tests. In this selected yard geometry adaptive moved more loose matter, but in shifted geometry random moved more. **No robust material success gain is qualified**.

## Exact causal and checkpoint probe
- 45s trained-history checkpoint (actual 5400 physics ticks at 120Hz), then common true World state and seed with versus without recorded action-utility statistics. First motor divergence at tick5400 and future afterstate diverged by 38.912 world units after 3600 further physical ticks. This proves **acquired internal parameters can alter later choices/physics**, NOT that the choices are wise, meaningful or improve continued life.
- Full checkpoint exact restored World afterstate, raw physics snapshot bytes and `DevResident` private state after 1440 independent further simulated ticks. Manual takeover created no contaminated *self-authored* training trials and training resumed after return. **Important epistemic precision:** the manual-control training exclusion is a host research provenance gate, not the organism independently recognizing who authored a command. The actor's normal `decide(frame)` API accepts **only** legal `PrivateFrame`; host provenance is handled outside this method.
- Real `DevResident` training target is movement efficacy (speed/touch), not private observation that any specific loose object moved. A learner could score external forces as effective own activity because its self/world source remains partly unidentifiable.

## No fake sample multiplication: bidirectional material transfer
The first transfer test pretended that two distinct RNG seeds were independent adaptive repeats; the adaptive action selector does not use the PRNG. Their results were **identical**, so that test setup was discarded as pseudoreplication. Replaced with *different actual training/target material layouts* in both directions, B0/B1.

30s in source layout trains action-response preference; only learned action scores are transplanted to recipient's otherwise **identical initial state** versus fresh untrained resident. Both recipient residents continue online learning afterwards, so later World differences are a blend of initial transfer effect and new experiences, not isolated asymptotic transfer skill.

| Body / training → target | Transferred material | Fresh material | First action divergence |
| --- | ---: | ---: | --- |
| B0, yard → shifted | 1.753 | 1.067 | tick 0 |
| B0, shifted → yard | 18.836 | 15.095 | tick 180 |
| B1, yard → shifted | **0.443** | **1.057** | tick 180 |
| B1, shifted → yard | 22.057 | 9.066 | tick 180 |

**Interpretation:** learning-history transplant is demonstrably behaviorally causal and highly context/morphology-sensitive, not a reliable transferable competence yet. The B1 direction reverses the sign of benefit across the two habitats. A single distinct environment per direction and an authored material amount cannot establish cross-ecology generalization. Do NOT retune to amplify B1 shifted→yard 22.057 positive value.

## Browser instrument
Real system Chrome (headless) exercised the built Vite artifact. It physically dragged a loose body **1.581** units while paused; retinal strip remained lawfully last-delivered and visibly labeled `pre-intervention`. Full checkpoint restored physics/body/object to prior tick and old retina; manual takeover then moved body **1.917** units, returning authority to autonomous script; real emulated mobile touch moved the physical body **1.166** units. No JS errors. Screenshots of desktop/320/390/900px and touch saved as `reflexbrain-odev-v0-chrome` Actions artifact. **No verified public playable URL**, browser CI proves only build and interaction integrity.

Visual QA of the actual first Chrome images: reasonably legible research instrumentation but still a sparse grid with giant isolated walls and basic disks. At 320px, initial UI pushed the physical field far below intro/settings; secondary setup was subsequently collapsed and controls moved nearer the visible world, with follow-on Chrome verification required before accepting this refinement. **No Owner experience PASS.** The World is spatially larger than S0 yet is NOT thereby a rich life ecology.

## Scientific disposition
**Technical candidate obtained; developmental competence UNQUALIFIED.** We now have a runnable, swappable, checkpointed new resident not driven by cyan, and actual learned history changes its later motor choices in a shared physical World. This is a real integration step that the previous day lacked. However:
- the *authored* action source is still a four-maneuver probe schedule, not an endogenous personal trajectory or concern;
- the learned target explicitly rewards local body mobility and penalizes touch; it does not learn that specific matter moved or why it matters;
- cheap random already beats adaptive on some changed arrangements;
- transfer benefit is dependent on body/layout; not a general skill;
- current world/retina may not make material displacement attributable from private evidence;
- after a human override, unmeasured external impulses remain confounded with self-caused motion; old P0/P1 warning applies;
- the observer UI is not an Owner-qualified habitat, even if Chrome checks pass.

**Not worth scaling this 2-context 4-action score table or repeatedly tuning its coefficients to win chosen layouts.** The useful next pressure is actor-chosen *information-gathering* action that resolves a causal uncertainty in later privately observed contact/perception, then alters a real continued material interaction, benchmarked against identical-cost fixed look/turn/touch-stall/rand baselines. Demand explicit private observability of consequences first. Also preserve the parallel high-level ReflexBrain meaning frontier (H7–H9), not block it behind a perfect organism.

## Source/recovery
Use [PR #81](https://github.com/Jozzpoly/ReflexBrain-Lab/pull/81) and its **live head SHA**, not an assumed `main` or a cross-branch merge. The code is stacked #80→#81. Original S0 Owner FAIL and standing project charter/2026-10-21 design critique remain binding. All findings above have exact CI log markers `RB_ODEV_V0_LIVE_RESULT`, `RB_ODEV_V0_ABLATION`, `RB_ODEV_V0_TRANSFER`, `RB_ODEV_V0_CHROME`. Do not call this `ReflexBrain V1` or silently ship it.
