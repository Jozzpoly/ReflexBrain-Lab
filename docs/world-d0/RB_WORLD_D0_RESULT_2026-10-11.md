# RB-WORLD/D0 — Open physical ecology feasibility — RESULT 2026-10-11

**Host mechanics engineering: PASS in a narrow scope. Ecology/organism/watchability: NOT QUALIFIED. A declared long-run ecological consequence test is NEGATIVE.**

This research arose directly from filmed public S0 **Owner experiential FAIL**. S0's actor was dumb ball pursuit in a tiny closed cage despite green Chromium/CI tests. D0 does **not** supersede that Owner FAIL and must NOT be presented as a new living organism.

## Frozen before execution

[RB_WORLD_D0_ARMED_2026-10-11.md](RB_WORLD_D0_ARMED_2026-10-11.md), branched from unchanged Living Organism A `aa1ce53`, separate [draft PR #70](https://github.com/Jozzpoly/ReflexBrain-Lab/pull/70). Qualified body and existing 120Hz fixed Rapier physics / 30Hz actor-private 96-ray RGB, touch and proprio. No new learned or authored autonomous goal/policy. No alteration to canonical/main, S0 Pages or S0 negative policy.

### What actually exists

- **No enclosing perimeter**, only local 12 wall segments; prototype approximately 50×32 units in first overview camera but body can move out without a teleport or invisible physical boundary.
- Two real 5-unit passages through each of two dividing columns; actor true diameter approx 2 units. Three loose areas and physically occluding obstacles. Two routes differ spatially (upper/lower, not a dotted line on a map).
- Loose bodies retain true physical positions.
- One bounded-force independent shuttle at y−10 on local x11..20 rail, and loose material at (15,−10). Mechanism dynamics do not depend on experimenter schedule or focal actor motor input. `LivingWorld(false)` is the ordinary base; optional rail-generalization does NOT change the original `LivingWorld(true)` default force law.
- **Test-only** global-waypoint controller physically steers the existing body through passage; not a learned neural navigator or proof of private actor map understanding.
- Browser-only `probes/world-ecology-d0.html` with host-only labels, actual RGB retina, manual force-driven body control, pointer dragging, camera overview/follow, independent rail on/off. **Not publicly deployed**, not Owner-tested. All screens remain research truth view, not evidence of natural life.

## Actual 120Hz World evidence

Final executable D0 source and browser: [GitHub Actions #38113609007](https://github.com/Jozzpoly/ReflexBrain-Lab/actions/runs/38113609007) at `66b1338ee5fb176bd7e6394b639b9939de618e26` (source and tests consistent; report/doc changes later do not alter them). **40/40 test files, 117/117 tests, TypeScript and Vite build PASS.** One exact repeat of 7200-step ecology world matches source World afterstate.

### True actor passage

**Upper and lower** test-only controlled body trajectories reach their separate goals by tick627 (≈5.225 simulated seconds), first cross opposite divider at tick553 (crossing y≈+7.083 vs−7.083). Motor is *ordinary bounded actual Rapier force/torque*, no position teleport, true physical collisions. Both get 157 distinct legal private retinal frames by arrival. This does not indicate autonomously discovering the path.

### Actual independent material effect (focal motor = zero)

At 60s: moving process leaves tracked loose body **(23.5117,−10)** vs start **(15,−10)**, displacement **8.5117 world units**. Same World but with rail motor process absent, tracked loose body stays **(15,−10)**, displacement **0**. Both have 1800 distinct actor-private visual frames in 7200 steps. Dynamic World remains deterministic.

### Temporal red-team: source of actual ecological insufficiency

At **180s** in the independent-process World, tracked body remains at **exactly the same physical position** (23.5117,−10). Additional material change **from 60 to180s is 0**. The rail mechanically continues but after pushing matter outside its reach it supplies no *recurrent material consequence for this tracked relation*. This is a real NEGATIVE for the hypothesis that adding a rail plus more spacious geometry already makes a consequential persistent micro-ecology.

The world can move, and one thing can change, but that is not the same as a world generating successive meaningful opportunities to perceive, respond, check and learn.

## Real Chromium observation and debugging

- [Chrome #38113508868](https://github.com/Jozzpoly/ReflexBrain-Lab/actions/runs/38113508868): actual WebAssembly/Rapier, autonomous World >420 real steps (target moves ~4.48), actor stays still without command, pause, physical pointer drag, rail-disabled control, manual body movement ~3 units, tracking camera, 900px/390px/320px responsive layout. Eight actual screenshots, zero browser errors.
- Significant real browser defect found: clicking lower-half World material triggered `canvas.focus()` scrolling the page before World coordinate conversion. Physical pointer delta ~1.4 units, no collider selection. Fixed by computing physical hit coordinates before focus and `focus({preventScroll:true})` plus suppression of implicit native focus scroll. Its World math was not at fault.
- Visually inspected real Chrome screenshot. **Critical qualitative warning:** three zones and some colored objects still LOOK LIKE a sterile mechanical demo on a grid. The absence of an outer prison wall does not give an organism actual life or long-term meaningful interaction. A status banner claiming “not another cage” is not in itself evidence. Qualitative adequacy **not established** even though the source/geometry gates pass.

## Why this is not yet an ecology / proposed next falsifier

The original pre-O0 ecology criteria (EC1–EC8) required *persistent, partly unseen, independently changing, controllable, heterogeneous consequences that materially alter subsequent action options*. D0 now shows:

| Item | Status |
| --- | --- |
| World state persists; actor does not dictate process | narrow PASS |
| Body can physically reach two genuine routes | narrow PASS with privileged test controller |
| Occlusion by real surfaces / legal private retina | substrate PASS, behavior NOT tested |
| Independent process displaces loose material | PASS once |
| Repeated materially consequential World pressure | **FAIL for the tracked material** from 60–180s |
| Dynamic topology change / coupled processes / distinct timescales | NOT IMPLEMENTED |
| Actor-private discovery, memory correction, navigation, endogenous interest | NOT IMPLEMENTED |
| Owner finding activity worth watching | NOT EVALUATED; prior S0 Owner FAIL still active |

**Do not publish or promote D0 as a “much better organism”** because of screenshot polish or the open edges. D0 is a mechanically feasible donor.

Provisional D1 direction: select **one compositional World process** where independent material movement **changes a second material affordance** (e.g. local passage ability) *and the process can be reversed or modified by ordinary World action rather than timer phase*. A gate linked to physically sensed material position is one test candidate, not a frozen implementation or "key puzzle" objective. Another candidate is a genuinely recurrent material source/transform cycle. These must be compared against their puzzle/theme-park failure modes before implementation.

**Highest priority for D1** remains two-way actor/World causal possibility and real Owner watchability. Prefer a very early independent World + actor feedback slice and a clear difference from cheap visual reflex before any fancy learned model. Retain the private-eye/local-agent truth seam; do not add host semantic target IDs to the brain to make a demonstration look clever.

Do not merge D0 source into canonical/main by inertia. No user-visible public deployment of D0 was claimed in this run; preserve Owner's existing stable S0 website while the next organism/world design is re-grounded.
