# R9B — mass-only versus actual body-shaped joint: result
Date 2026-10-23. Hypothesis fixed in [R9B ARMED](RB_R9B_MASS_GEOMETRY_ARMED_2026-10-23.md) before source. Source `44ca2ed32020f5c7612c22e714cbc57dd7a26a8c`: [Actions #39879027840](https://github.com/Jozzpoly/ReflexBrain-Lab/actions/runs/39879027840) **56 test files / 176 tests PASS, TypeScript/Vite PASS**.

All physical-contact arms **exactly share the same first 37 Rapier solver steps** and the same actor/cargo vectors at t37: actor (0.83172059,0), cargo (2.09999990,1.04999995), actor velocity (4.17160559,0), cargo velocity (0,0). First physically confirmed contact is t38 in ALL three arms for BOTH widths. No hidden different motor state prior to intervention.

**Mass-only diagnostic**, deliberately not a naturally possible material law: removes physical cargo after first actual collision and transfers cargo mass 2.1 to actor through real Rapier `setAdditionalMass(2.1,true)`. Actor real mass becomes 3.0999999 from 1; no cargo collider remains. This isolates a crude point of comparison for uniform added mass, **not** identical inertia tensor/center of mass, no conservation of momentum or environmental mass, and no physically reachable organism history. Do not use this arm for actor-private history/learning evidence.

| Passage gap | No cargo max X | Free cargo max X | Mass-only max X | True contact-fixed-joint max X |
|---:|---:|---:|---:|---:|
| 2.5 | 41.851 | 6.505 | **18.365** | **28.137**; physical break t195 |
| 4.0 | 41.851 | 35.207 | **22.821** | **50.236**; joint remains valid |

Mass-only arm first contacts t38, yields 86 actor/bumper collision records at gap2.5 and zero at gap4. True bond yields 26 and zero respectively. The apparently "improving" travel score of true bond is NOT a product gate or robust physical access measure: prescribed steering, a chosen corridor and one initial piece geometry. In particular max X can be influenced by passing around a post, not through the nominal clearance.

**Bounded scientific result:** actual body–material connection has physical consequences *beyond simply adding 2.1 mass units* in these source-frozen scenarios; this cannot yet resolve body envelope versus center-of-mass, altered angular inertia, friction, solver forces, initial deflection. Bonded geometry is nondecorative. The side piece changes real future physical trajectories; still NO resident choice, learned meaning, biological self-maintenance, acquired desire, independent chemistry or new form of life.

**Priority implication:** this mechanism warrants one final bridge test to actual lawful 30 Hz actor-private proprioceptive change, not a bigger physics editor. If this sensory distinction is present under otherwise matched control history, test a small private history consumer later with cheap rivals. Do not reward movement range. If there is no private distinction, no semantic learner could justly infer this event from the existing channels; add only the narrowest lawful missing sensor when justified. Keep R8 Owner pretest and all existing failure evidence untouched.
