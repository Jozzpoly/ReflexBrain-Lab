# OCTRL-P02b — Embodied Occlusion Transition Integration — 2026-10-07

Status: **ARMED**

Base:
`research/pre-o0-foundations-campaign @ d48922688795d16add501c26b34b6ea52ed0d6e3`

Run branch:
`run/octrl-p02b-embodied-occlusion-transition`

Type:
**INTEGRATION**

## Why now

P02a qualified one narrow P0 visibility/occlusion boundary, but only across separately constructed visible and hidden arrangements.

That is not yet lived temporal partial observability.

Before introducing memory or stale hypotheses, the already-qualified B0 body seam and unchanged P02a sensor must demonstrate a continuous physical sequence in one World:

`visible -> actor self-motion -> occluded -> hidden World change remains private`

Otherwise a later "memory" run could merely compare researcher-spliced fixtures.

## Primary question

> Do the already-qualified B0 body seam and unchanged P02a sensor preserve their claims when the actor's own physical motion carries it from a visible relation into occlusion, after which a real hidden target displacement remains absent from external P0 evidence?

## Frozen components

- E0/B0 body/actuation seam;
- P02a sensor implementation and output schema;
- Rapier deterministic substrate;
- fixed physical occluder.

No changes to P02a sensor law are allowed inside this run.

## Precommitted arrangement

Occluder:
- center `(0,0)`
- half-width `0.16`
- half-height `1.5`

Actor:
- start `(-3, 2)`
- initial heading `-pi/2`
- B0 radius unchanged
- fixed motor protocol:
  - 72 ticks: drive `1`, turn `0`
  - 120 ticks: drive `0`, turn `0`

Target:
- dynamic physical ball
- start `(1.5, 2)`
- radius `0.35`
- no force before hidden-displacement phase
- after actor settle phase: one `(+x)` impulse of `1.2`
- 90 hidden-displacement ticks

Sensor range:
- unchanged P02a `8.0`

Geometric precommitment:
- at actor start, center-ray to target crosses `x=0` at `y=2.0`, above the occluder;
- once actor center is below `y=0.5`, the same center-ray intersects the occluder vertical span;
- actor remains at `x=-3`, so the occluder is not part of its locomotion path.

## Evidence trace

Record every tick:

Research-only:
- actor World pose;
- target World pose;
- target displacement;
- motor demand;
- whether target is physically inside sensor range.

Actor-private external P0:
- unchanged P02a blob frame only.

No World coordinate, collider handle, semantic kind or visibility bit enters the actor-private frame.

## PASS

PASS only if all are true:

1. deterministic repeat;
2. initial P0 frame contains exactly one target blob;
3. during actor's own fixed-motor motion, P0 undergoes at least one `1 blob -> 0 blobs` transition;
4. the target has not moved materially before that first occlusion transition;
5. target remains inside P02a range at the transition;
6. after first stable occlusion, target does not reappear before the hidden-displacement phase;
7. actor settles under zero demand without any target/world intervention;
8. hidden target impulse produces material displacement;
9. target stays in declared P02a range during hidden displacement;
10. no hidden-displacement tick emits a target blob.

## FAIL

Scientific FAIL if the already-qualified body seam and unchanged P02a sensor cannot produce the declared lawful visible-to-occluded transition under the frozen arrangement, or hidden target motion leaks into P0.

## INCONCLUSIVE

Use INCONCLUSIVE if:

- the actor trajectory fails for a mechanical reason unrelated to the intended integration question;
- initial heading/pose is not actually applied;
- query readiness is broken despite the P02a correction;
- target moves before occlusion from an unintended physics interaction;
- actor collides with the occluder/target and contaminates the visibility transition.

## Forbidden repair

Do not:

- change P02a sensor logic;
- add FOV/attention;
- add memory;
- add P1 tracklets;
- add concern/controller logic beyond the frozen fixed motor protocol;
- move target after seeing the transition tick;
- change wall geometry after evidence;
- tune the drive duration after evidence;
- add semantic visibility/occlusion state to actor-private data.

## Owner touchpoint

**none**

## Maximum claim

> The qualified B0 body seam and narrow P02a sensor can compose into one continuous embodied visible-to-occluded experience in which later hidden material change remains absent from external private evidence.

Not:

- memory;
- stale belief;
- object permanence;
- checked absence;
- G1;
- history causality;
- semantic meaning;
- organism continuity.

## Downstream consequence if PASS

A later run may legitimately ask whether evidence acquired before occlusion can persist as actor-private history and remain stale through hidden World change.

That later run is not authorized by this card.


---

## Protocol incident — heading validation

First execution was **INCONCLUSIVE** because the setup validator used an unjustified `1e-9` exact-angle tolerance.

Measured:
- requested heading: `-1.5707963267948966`
- Rapier heading: `-1.5707963705062866`
- absolute representation error: `4.371139006309477e-8`

The physical trajectory itself was consistent with the intended downward heading:
- initial blob count: 1
- first occlusion tick: 51
- target displacement at occlusion: 0
- actor self-displacement: 3.242185
- no actor contact contamination
- no reappearance
- hidden target displacement: 0.472197
- no hidden P0 leaks

Classification:
**INCONCLUSIVE — SETUP VALIDATION DEFECT**

Allowed correction:
- heading setup tolerance `1e-9 -> 1e-6`.

This changes only whether the already-applied Rapier angle is recognized as the requested setup. It does not change body state, motor demand, geometry, sensor law, timing, target motion or scientific PASS/FAIL criteria.
