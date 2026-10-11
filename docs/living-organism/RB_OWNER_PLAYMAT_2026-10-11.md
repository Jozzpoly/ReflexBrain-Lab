# RB Owner Material Playmat — isolated executable Owner-facing research surface (2026-10-11)

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
