# RB-VISION/C1 — Why touching something is not an actor-owned achievement

**2026-10-10 · MATERIAL NEGATIVE FINDING / RELATIONAL-REWARD FALSIFIER · NON-CANONICAL**

Draft Vision PR: https://github.com/Jozzpoly/ReflexBrain-Lab/pull/54  
Source: `tests/living-organism/vision-touch-reward-confound.test.ts`  
Independently exercised real LivingWorld native RGB, ApproachEpisode private touch and Rapier material contact, **not** an external physics-free reward simulator.  
First fully successful evidence run: https://github.com/Jozzpoly/ReflexBrain-Lab/actions/runs/38096557789, source head `343e8537f913df4aef799fe40b512bfe6c755dc7` — **50/50 test files, 147/147 tests, TypeScript/build PASS**. A subsequent source-only clarification renames the decoy orientations and explicitly checks a shared eight-sector touch bin; recheck its exact-head workflow before treating that add-on as qualified.

## Why this test was necessary

B4/B5 had a useful but very limited learning signal: `+1` when the existing author-written `ApproachEpisode` reports `mode=contact`, minus penalties for time and gaze demand. This signal is **lawful actor-private**, but its scalar interpretation is already a researcher-defined notion of success.

Importantly, `ApproachEpisode` ends on **ANY** positive private `touch`; it does not establish which previously observed physical thing was contacted, whether the body obtained what it was pursuing, or whether the encounter caused further favorable material consequences. An optimizer can learn its objective well and still learn the wrong behavior for the actor.

C1 challenged that very interface rather than selecting another fovea geometry or changing the learned bandit.

## Real physical design

The target is a turquoise dynamic circular collider initially ahead at (7,0). Its genuine contact with a moving actor in `ApproachEpisode(true,true)` is the normal control.

The host also creates a separate orange dynamic collider, initially outside the World. In two challenger versions, while the actor is physically travelling toward the turquoise target, the host independently places the orange collider **just within the actor's forward collision envelope**, at ±0.32m lateral offsets. The actor is **not** given the host's object handle, its position, the intervention timestamp, `decoy` semantics, or the identity of the touched material. The normal 96-ray RGB retina, touch and proprioception are all that could inform an upgraded actor.

The host-only analyst attributes actual contact events by Rapier collider handles, measures actor-to-turquoise distance when `ApproachEpisode` stops, and recomputes the **same B4 reward formula** from private positive touch/elapsed tick (gaze effort zero in this test). Reward audit does not enter actor input.

## Core result

| World | Actor reports `contact` at tick | Actual Rapier target collision? | Actual unrelated collision? | Distance to intended target at stop | B4 scalar reward proxy |
|---|---:|---|---|---:|---:|
| Genuine target only | **504** | YES | NO | **1.620m** (contact radius) | **+0.9167** |
| Unrelated frontal contact, above | **84** | **NO** | YES | **6.348m** | **+0.9867** |
| Unrelated frontal contact, below | **84** | **NO** | YES | **6.348m** | **+0.9867** |

The authored motor **mistakes foreign contact for completion of the originally visualized material activity**; the B4 reward classifies both false completions as **better experience than actually reaching the intended turquoise object** because they occurred sooner.

This is **positive measured evidence of a real failure**, not a proposal or synthetic logging quirk.

### Private directional touch does not automatically repair identity/relevance

The genuine target contact registered the actor-private eight-sector touch pattern `[0,0,0,0,0.7348,0,0,0]`.

One unrelated contact registered `[0,0,0,0,0.7205,0,0,0]`; i.e., **the same active touch sector 4, very similar magnitude**. The mirrored unrelated impact occurred in touch sector 3.

**Narrow implication:** not even an elementary "forward vs elsewhere" touch sign is sufficient to certify material success for this contact family. That is not a full private-history alias: at the two very different contact times there may be RGB, trajectory and proprioceptive differences available for an attentive actor to exploit. Do not claim all private modalities are exactly equal.

The F3/D0 directional-touch donor remains useful: its contact-direction feature disambiguated a different mirrored mechanical failure. C1 only demonstrates **directional information is not synonymous with actual standing-matter satisfaction**.

## Scientific failure/correction history

Initial C1 fixture placed the unrelated collider rear-side at a position that did **not** produce an actual solver-contact impulse. CI FAILED correctly, although the actor later touched its intended target. Therefore that initial fixture cannot be cited as an example of false touch.

A follow-up independently placed the collider within the active forward contact envelope. The qualified source proves actor-private touch and positive non-target Rapier solver impulse with no target contact at stopping time. The researcher moved the host-controlled collider as a discrete event, not a free-world-powered mover; this is a **material stress test**, not a natural distribution of collisions.

## Project-level consequence (NOT a new architecture)

Before ReflexBrain treats local eye-value learning as competence, the feedback must be appropriately grounded in what the actor was **already trying to accomplish**. A generic contact/reward, visual novelty, surprise, physical displacement or prediction mismatch cannot alone establish which private experience means a desirable or undesirable outcome.

Candidate lawful evidence to compare empirically:
- last legally seen appearance/direction and its age,
- body-relative contact sector/impulse and intent/motion at contact,
- visual continuity or discontinuity up to contact,
- whether an ongoing actor-private activity actually changed or ceased,
- subsequent body material consequences rather than a single generic event.

These are proposed research channels, not a canonical feature list. The author-defined "target is turquoise" rule is still an unearned relevance prior and cannot simply be promoted to a learned matter model.

The strongest next falsifier would create **multiple physically indistinguishable-looking candidate objects**, partial occlusion and independently moving collisions, then compare whether lawful private action/history can learn a *relation* between touch and standing activity from subsequent consequences. Keep contact identity on the host-only diagnostic side, and compare against strong simple touch/extent/direction baselines. Critically allow genuine target touch that occurs while target appearance is occluded, to avoid an easy but incorrect "must see turquoise at touch" rule.

## Refined ReflexBrain competence truth

- **EVIDENCE:** B3 actor-private history can cause physical follow-up through active gaze.
- **EVIDENCE:** B4/B5 can train a tiny eye-choice preference from actual private feedback; distribution shifts and simpler policies expose failures.
- **FAILED as general semantic assumption:** private touch `>0` means `I accomplished my earlier activity`.
- **OPEN:** actor-relative success/standing concern from lawful relation/sequence, and reliable learning of when extra vision is materially valuable under that concern.
- **NOT QUALIFIED:** an organism-owned reason, intrinsic reward, self-directed curiosity, novel goal formation, or any Owner product-level PASS.

This finding argues for F3 actor-relative relational relevance/feedback **before** attempting to scale F4 active visual RL. More neural capacity on the bad reward would make this mistake more efficiently, not repair what the event means.

**No production, canon or main branch changed.** This is a research-only physical falsifier, not a fixed rule that organisms should ignore contact.
