# RB Owner Material Playmat — isolated executable Owner-facing research surface (2026-10-11)


> **STABILIZATION / CHROMIUM RED-TEAM · 2026-10-11.** The original owner playmat became public without StackBlitz at [GitHub Pages /playmat-s0/](https://jozzpoly.github.io/ReflexBrain-Lab/playmat-s0/) after [canonical publication PR #66](https://github.com/Jozzpoly/ReflexBrain-Lab/pull/66), with real public-Chrome QA. A separate UI/source stabilization on **this research draft PR #64** has passed [exact-source GitHub CI #38111558699](https://github.com/Jozzpoly/ReflexBrain-Lab/actions/runs/38111558699). The public static package is pinned to an older source commit until the additive Pages builder's fixed source ref is updated and redeployed; **do not call these newer UI fixes live before readback verification**.

## Stabilization audit: what was found and defended

**No control law, reward, World dynamics, material controller, S0 scene, evaluation gate or 120/30Hz physics clock was changed.** All 6 research-source / static mirror pairs were re-read from GitHub and compared byte-for-byte (entry HTML only differs in module path). Full original 3× 60-second actual Rapier endpoint: **material actor 2.90m, cheap cyan 1.34m, ecology only 2.43m**.

**Concrete interface defects fixed:**

1. Owner manually taking over the body was NOT permanently reflected in `interventions` after releasing control. This falsely suggested a frozen S0-comparable run. Entering manual control now taints provenance even after release; ordinary microscope/tempo/pause operations do not. Fresh reset/controller selection clears the provenance.
2. Physical pointer dragging permitted throwing a body outside the visible wall yard permanently. The host pointer interface now clamps movable object centers within the wall geometry with collider radius margin. This is a **new Owner-only manipulation limit**, not a controller/world change.
3. A 7200-step accelerated replay was not cancelable; it awaited browser animation frames and could stall when tab visibility changed. It can now be interrupted while preserving genuine intermediate world/brain state and resumed **without loss of exact frozen 60-second physical afterstate**. Background tab stops acceleration instead of silently running an unobservable heavy batch.
4. A simulation error status could be overwritten by subsequent paused frame updates. It is now persistent and can be recovered by a new world/reset.
5. Researcher microscope previously failed to distinguish the **second amber movable body** from the actual **fixed amber dock**. Both can match the controller's amber filter. Viewer-only `PODOBNY KOLOR` annotation and explicit epistemic warning were added. This is **not** fixed by removing or renaming the physical distractor because that would change the frozen S0 scene and its science.
6. Actual Chromium 320px layout overflow by ~35px was found in new red-team QA; fixed status badge wrapping and narrow-column rules. **320px,390px,900px viewport no-horizontal-overflow now PASS.** This does not claim full-touch mobile-body input support; keyboard controls remain desktop-first.

**Expanded Chromium suite** `tests/browser/material-owner-robustness.e2e.mjs`: real WASM boot, native RGB, ordinary pause preserving scientific comparability, true pointer capture/clamping while paused, persistent Owner takeover provenance, clean reset, cancel at physical tick ~1344 and resume through actual tick7200 to original material endpoint, continuation beyond frozen 60 seconds with explicit UI boundary, repeated controller resets (7 cycles), and 900/390/320px layouts. All PASS, zero browser page errors at exact-source [CI #38111558699](https://github.com/Jozzpoly/ReflexBrain-Lab/actions/runs/38111558699). [Raw browser QA/screenshot evidence](https://github.com/Jozzpoly/ReflexBrain-Lab/actions/runs/38111558699).

**What is not defended:** the actor's private range reconstruction is authored size-based approximation; recognizing a golden-colored patch as a *specific real dock* is unfounded in the presence of the second amber movable object; camera reacquisition remains poor (original dock visible 150/1800 distinct frames). The lab is still authored, physically real and scientifically negative. More debugging UI, synthetic training, or code PASS cannot promote actual livingness or learned significance.

**Public rollout gate:** after pinning the newer stable source SHA in canonical Pages workflow, require:
- additive SHA-preservation of old Pages root and existing Field Lab;
- real Chrome smoke+robustness on assembled `/playmat-s0/` subpath;
- successful Pages deployment AND independent public readback;
- final Chromium run on the actual public URL;
- preserve all existing labs and keep original research PRs DRAFT.


**Status:** source implemented and visually exercised in real Chromium/WASM. **NOT yet Owner-observed/approved**; no canonical code/main changes; separate research PR #64 based on **S0 research PR #62** (both remain isolated, draft).

## What it deliberately shows

This is not an animation or replay of a story. Its canvas renders `LivingWorld`'s actual Rapier physics at 120 Hz, with continuous independent mechanical sweeper, movable cyan body and physical dock; the private Local Brain receives the original cached 30 Hz RGB retina, touch and proprioception. The viewer's *host microscope* computes approximate true target-dock gap, target contact windows, true body/object positions. **No host labels/World IDs/target-dock gap go into decision code.**

There are three actual autonomous modes, each resetting the same World seed:
1. `world-only` — all independent ecology lives but focal actor motor input is zero;
2. `cheap-cyan-chase` — RGB-only simple visual follower;
3. `private-material-concern` — the S0 authored controller using privately reconstructed tentative target/dock appearance geometry.

UI controls: mode switching on clean reset, pause/resume, 1×/2×/4× time, **Przelicz do 60 s** (simulates every actual physics step, no teleport/time skipping), pointer-dragging movable World material as host-only intervention, WASD/QE body takeover and release while private perception/state continues, optional researcher microscope overlay and private raw 96RGB retina. Intervention indicator warns any interactive run may no longer be compared with frozen S0 source evidence.

The branch landing page `index.html` links to `probes/material-organism.html` as its leading card. No deployment or GH Pages overwrite.

## Why Owner experience is still unqualified

The original S0 does not improve World material relation: initial coarse target-dock gap 2.590m; after 60 s the independent World-only result 2.427m, cheap RGB-chaser 1.336m, authored material concern 2.903m (worse than both). The playmat **preserves** the previously failed policy and same real World fixture; `tests/living-organism/material-relation-scout.test.ts` pins all original exact target-to-dock afterstates after extraction into a shared scenario factory. The new visual presentation is a way for the Owner to understand and critique that failure, not a claim of success.

Known limitations:
- apparent retinal patch width uses an explicitly **authored size prior**; not learned range, identity, ontology or confidence;
- default organism still has no self-originated goal, and the related concern is assigned by the experimenter;
- single authored target-dock arrangement is not robust transfer evidence;
- the dock appears in only 150/1800 native legal retinal frames in the original relational policy's 60 s trajectory; it ends with no live dock hypothesis;
- live mouse drags are World-side Owner interventions, not background autonomous source events;
- no browser run can substitute for an Owner qualitative test.

## Evidence and exact boundaries

- Physical S0 result [PR #62](https://github.com/Jozzpoly/ReflexBrain-Lab/pull/62), [CI #38108103778](https://github.com/Jozzpoly/ReflexBrain-Lab/actions/runs/38108103778), result `docs/living-organism/RB_MAT_S0_MATERIAL_RELATION_RESULT.md`.
- Initial actual Chrome Owner UI check [CI #38108856839](https://github.com/Jozzpoly/ReflexBrain-Lab/actions/runs/38108856839) on `1cc68ac607670211eed7daa7dc2ee52abbf3180b`: real World >30 ticks, native retina nonblank, pause exact physics ticks, physical object drag, reset between policies, WASD manual takeover/release, zero browser errors, four screenshot artifact; **BROWSER ENGINEERING PASS**.
- Subsequent extension adds "full physics 60 s" for every mode, with real Chrome assertions against frozen source afterstate and seven screenshot artifact. Require exact-source successful run before claiming it verified.
- Browser UI independent of `main`, existing Pages/public preview deployment and canonical O-CTRL branch. Research-specific Chrome smoke job is conditioned on this exact PR head ref only.

## Direct Owner exercise (when a live URL is verified)

1. Observe **material-concern** at 1× briefly. Inspect World and private RGB: cyan and dock are separate colors, true target-dock gap is a researcher-only measurement.
2. Hit **Przelicz do 60 s**: inspect final outcome and compare the same full 60s for cheap cyan chase and independent World baseline.
3. Restart material controller, drag the cyan ball, and observe whether the actor genuinely re-acquires the dock; manual body takeover and release can probe perception continuity.
4. Describe what you actually saw: did it look like an actor maintaining its matter, or just bumping into things? Any Owner FAIL has priority over a machine/UI PASS.

**Do not start another A/B learner or model sweep from this view yet.** First identify from the Owner visible case why stable actor-relative material concern breaks: sensory availability, occlusion, apparent-range assumption, push-side geometry, physical world ecology, or action organization. Use small serious falsifiers only once that actual failure is reproduced and causally bounded.
