# RB-WORLD/D1 — Coupled material-affordance discovery result (2026-10-11)

**VERDICT:** **MECHANICAL WORLD COUPLING: PASS (bounded engineering).** **ORGANISM / SELF-DIRECTED LEARNING / ECOLOGICAL ADEQUACY / OWNER EXPERIENCE: NOT QUALIFIED.** Previous S0 filmed Owner FAIL remains binding. Existing D0 opened geometry but lost material pressure after the first minute; D1 specifically tested whether physically grounded pressure can persist and change a route instead of moving a ball once.

Preregistered *before implementation*: [RB_WORLD_D1_ARMED](RB_WORLD_D1_ARMED_2026-10-11.md). This is an isolated **DRAFT [PR #72](https://github.com/Jozzpoly/ReflexBrain-Lab/pull/72)** atop already-isolated D0 draft [PR #70](https://github.com/Jozzpoly/ReflexBrain-Lab/pull/70); do not merge as the new default organism.

## What is actually implemented

- **World mechanism, not AI:** fixed non-colliding Rapier sensor plate overlaps *any dynamic body*, counts real overlap, feeds an explicit authored local load→motor law. A **physical dynamic 12-mass rectangular gate**, with bounded applied forces (no instantaneous movement/teleport), translates x8↔x11.8 at y6.5 and alters the actual upper lane of D0.
- Underlay: same deterministic 120Hz physical World, same bounded-force E0 actor and native RGB retina/touch/proprio at 30Hz. 3 D0 areas remain without perimeter walls; lower route is always available. Sensor plate is **host-only, invisible to 2D retinal rays**, while true moving gate is physically visible and collidable. This omission is **a meaningful perceptual-affordance limitation**, not a sensor oracle we are allowed to add to actor P0.
- A genuine local independent rail mover traverses plate at x12.7,y11.5, y11.5 lane; NO `openAt(tick)`, `gateOpen` actor label, trigger color-ID or privileged target identity. Host load law is still designed, not a naturally emerging mechanism; world geometry and initial placements are authored.
- Separate loose object can sustain plate load until externally or bodily displaced, independent of rail phase. This is an important counterexample to solely clock-phase activation, but in experiment the initial placement/removal was a **researcher host intervention**, not learned action.

## Frozen-world mechanical evidence

**Full [GitHub check #38114813882](https://github.com/Jozzpoly/ReflexBrain-Lab/actions/runs/38114813882), exact source/CI**: 41/41 test files, 126/126 tests, TS+Vite build PASS and actual Chromium/WASM mouse/physics/320px UI PASS.

| Causal test | Observable World result | Interpretation |
| --- | --- | --- |
| Rail dynamic, focal body motor zero, 180s | 65 gate-clear events, 64 later gate-closed events; physical sensor load switched 129 times | **PASS repeated gate effect**, not self-sustaining life |
| Matched rail-disabled World, 180s | 0 plate loads, gate remains x8 | process dependency established |
| Independent mechanical speed holdout | at 1.6 units/s: 7 full gate-clear events in first 30s; at 4.0 units/s: 15; unchanged gate law | not specific to one frozen motor speed; gate timing still an authored oscillator |
| Same otherwise-unloaded plate + host material on/off/on/off | gate x8→11.7995→8.0005→11.7995→8.0005; corresponding loaded false/true/false/true/false | material holds and reverses true gate motion, no fixed ID |
| **Different loose cyan body** replaces originally selected ochre object | opens gate with same contact sensor and closes after removing | no "one key opens one door" actor-semantic ID shortcut |
| Test-only force-driven actor tries upper route, gate closed vs material-held open | closed stops actor at x6.54; open reaches valid cross at tick915 (x9.46,y7.07) | **real body-scale topological consequence**, only by privileged test pilot |
| No rail, true actor uses bounded forces along researcher waypoint route to plate | actor physically loads plate tick1328; gate clears tick1400 | genuine actor→World contact→gate consequence, **NOT agent-chosen route** |
| Same actuator chooses departure from plate later (oracle route) | departs tick1500; gate recloses tick1805; unloaded at final | **actor can physically reverse consequence** |
| World checkpoint restored during cyclic movement | exact World/gate/P0 state matches uninterrupted branch after further560 ticks | causal reproducibility, not memory value |

**Actor-private observability:** with actor staying at origin and no motor commands, the true RGB value of gate appears in 5400/5400 unique private frames in the always-closed control, vs 3070/5400 in the dynamic World with gate displacement/occlusion/out-of-range. Host knows which RGB value corresponds to gate; actor still only receives **96×RGB floats** without identities, load labels, linkage, coordinates or task instruction. Difference is real lawful evidence of a visible change, *not* proof the actor can identify a gate or infer its cause.

## Real Chromium against built page

[Chrome run #38114343546](https://github.com/Jozzpoly/ReflexBrain-Lab/actions/runs/38114343546), later repeated after fixes through [#38114773985](https://github.com/Jozzpoly/ReflexBrain-Lab/actions/runs/38114773985) and [#38114813882](https://github.com/Jozzpoly/ReflexBrain-Lab/actions/runs/38114813882). Real live WebAssembly source preview:
- automatic physics opens gate at tick~122; closes~313; opens again~486;
- host mouse can drag a generic loose body onto plate while static control has no rail, hold real gate open, and release to close;
- no console/page errors; tablet and 390/320px widths have no horizontal overflow;
- honest Owner research view visually shows the machine and annotated plate/gate cause, the actor-private retina, and manual body controls, with explicit **NO AUTONOMOUS BRAIN** warning.
- found browser test false-failure: after selecting 'rail off', test read stale pre-reset canvas dataset before browser RAF rendered the new World. Fixed by awaiting **clock reset crossing** before checking the matched static control; physical World was behaving correctly.
- actual screenshot reviewed. **Qualitative verdict: still sparse, sterile engineering artifact** (thin walls, floating colored bodies, one machine). Avoid claiming this is a good persistent habitat simply because the link is playable.

## Scientific and product red-team

**D1 solves a specific D0 limitation:** the dynamic rail periodically changes a truly consequential passage for >60s; a material mass can hold or release the relation; actual body contact can change it both ways.

**D1 does not solve what Owner complained about:** no ongoing actor-owned matter, no learned sensorimotor contingency, no perception of the plate as a visible floor item, no active causal inquiry, no autonomous discovery, no body/World developmental retention, no richness beyond one mostly periodic authored machine. An actor could still act idiotically, bump into the gate and wander away; it has yet no reason to stay in the machine-yard. D1 is a useful **donor for a capability experiment**, not “birth of the organism”.

Two urgent next axes:
1. **Legally perceivable affordances and honest partial observability.** A plate the host paints in a 2D top-down inspector while a 2D ray retina cannot see it is a serious problem. Explore structural visual cues vs adding non-occluding/floor perception in a research-only channel **without leaking machine names/IDs**, then falsify whether actor can learn causal input through own action.
2. **Cheap baseline vs actor-owned competence** on physically meaningful route change. First compare null/simple bounded reactive behaviour with one clearly observable, private-history-dependent capability: detect blocked passage, stop ineffective motion, observe its opening, choose alternate route or retry, and physically traverse. Require true material action and a difference against cheap control. This is NOT an approval to hardcode a full path-planner or make host gate state an actor-known flag.

Do not turn the success of D1 mechanics into a reason for many more engine modules or more instrumentation. Prioritize an early **OWNER visual assessment** of the next actor/world combination. Owner filmed S0 FAIL is still stronger than any green CI. Until that gate, S0 remains an unaccepted organism, D0 a mechanical map donor, D1 a mechanical coupling donor. None is an organism milestone.

**Release stance:** research D1 source/diagnostic page remain isolated, not yet publicly deployed here. Existing stable S0 Pages must not be broken. If a safe additive preview is later published, label it as a **brainless World-mechanism demo** and verify Chromium on the actual public URL; it is not an Owner-accepted actor.
