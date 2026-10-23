# R9E — actor-retina self-cargo first-hit attribution (ARMED)
Date 2026-10-23. Preserved R9D results show physically bonded body and huge RGB-material occupancy, but the private channel does not label self-attached matter versus independently located material. **Is that occupancy actually mostly self-cargo?** This is the one open ambiguity warranting further instrumentation before learning.

## Frozen setup
- Repeat exact R9D B-mirror yard, seed `0x51babe`, 120s two versions `inert` and `adhesive`, actual unchanged `DevResident('random')`. True R9D law: real contact fixed joint, dynamic rotation unlocked on both worlds, cargo-other material impact >4 physically breaks. Do not change environment/material/motor, use original 30Hz native RGB observation only.
- Extra HOST microscope performs first-hit material attribution at fixed intervals every **16 solver ticks (7.5Hz)**, i.e. 900 observation frames per 120s run. Recompute the SAME 96 quadratic-angle E0 rays with actual actor pose/gaze and find nearest declared physical `surface.handle` from Rapier. Label only in the host: (a) currently attached material, (b) nonattached material, (c) background. Never feed these labels, handles, `isAttached`, exact range or world positions to the controller.
- Require RGB-material pixel equality between computed first-hit type and the actual cached native `PrivateFrame.retina` for every ray in each audited frame (allow 1e-4 float tolerance). A mismatch is a probe/instrumentation FAIL, not a reason to invent source annotations.
- Record mean counts of self-attached versus external first-hit rays in total, and in windows t0–30,30–60,60–90,90–120; fraction of sampled frames seeing at least 1 attached first-hit; fraction with ANY external independent material after t30.
- Compare inert and adhesive. Preserve a pre-attachment identical legal sensory prefix if the physical path is matched. Original R9D already observed B seed `0x51babe` 3 joints and high RGB, but this NEW attribution result must be calculated, not assumed.

## Interpretation
- Dominant self-attachment rays would show **material perception can be saturated by body-owned cargo**. This is actor-relative, legally sensed, but is NOT automatically new environmental opportunity, need, ownership or learning.
- If external rays dominate, abandon self-cargo explanation and examine actual world re-encounter instead.
- No inference about 30Hz full-frame occupancy from only 7.5Hz audited subset; do not use test to claim a learned self/world category.
- Stop research if result is source-executed; no target-specific vision patch or motivational motor retuning. Next ask if the physical development process genuinely renews over time (R9D says not in these histories) and whether broader world ecology rather than new algorithm should come first.
