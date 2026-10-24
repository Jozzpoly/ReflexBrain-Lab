# OCTRL-P02a — Private Dynamic-Blob Occlusion Null — 2026-10-07

Status: **ARMED**

Base:
`research/pre-o0-foundations-campaign @ df2d6d14da4c941e60a2d9dc745ea3b839feb245`

Run branch:
`run/octrl-p02a-private-occlusion`

Type:
**PROBE**

## Why now

P01a established only that legal actor-private proprioception carries material interaction consequences. It did not create actor-private world perception, stale knowledge, or a reason for later behaviour to depend on history.

A direct history-state probe was considered and rejected before activation because storing a private scalar and then reading it back would mostly prove that software can remember a scalar. It would not create honest history pressure.

The first still-missing authority seam required by G1 is therefore a material P0 visibility boundary with real occlusion.

## Primary question

> Can one minimal P0 dynamic-blob sensor expose body-relative physical evidence when line of sight exists while remaining unchanged during a real physical displacement of the same body behind an occluder, without exposing World coordinates, object identity, collider handles, semantic kinds, or microscope contact truth?

## Frozen inputs

- Rapier 2D deterministic substrate.
- E0/B0 body donor only as the sensing origin/body frame.
- No B01d resistance scalar.
- No P01a contact timing criterion.
- No memory.
- No controller adaptation.
- No ReflexBrain.

## Add only

One minimal sensor boundary:

- bounded range;
- body-relative bearing;
- relative range;
- body-relative radial motion;
- coarse apparent size/radius;
- visibility decided by actual Rapier ray occlusion.

The private output contains no World/entity identity.

A fixed physical occluder is allowed as test geometry.

## Controlled scenarios

### Visible control

A dynamic candidate body is on the actor side of the occluder and must produce one private blob.

### Hidden-change pair

The candidate starts behind the occluder.

1. capture private P0 evidence;
2. apply a physical impulse to the hidden candidate and step the World;
3. require measurable World displacement;
4. require the candidate to remain occluded throughout the declared hidden-motion window;
5. capture private P0 evidence again.

The pre/post private output must remain identical even though microscope World position changed.

This is a P0 authority test, not the full G1 organism gate.

## PASS

PASS only if:

- visible control emits a deterministic legal body-relative blob;
- hidden target produces no blob;
- hidden target undergoes material physical displacement;
- no frame during the hidden-motion window leaks the target into P0;
- pre/post hidden private evidence is identical;
- emitted blob schema contains no handles, IDs, World coordinates, semantic kind, OPEN/BLOCKED state or contact truth;
- deterministic repeat reproduces the same result.

## FAIL

Scientific FAIL if the declared sensor cannot preserve hidden-change noninterference or cannot expose the visible control under the same sensor law.

## INCONCLUSIVE

- Rapier query path is unstable/non-deterministic;
- target is not actually displaced;
- target escapes the intended occlusion region;
- candidate source requires hidden semantic identity in actor output.

## Forbidden repair

Do not:

- add memory;
- add P1 tracklets;
- add target/dock semantics;
- add controller/concern logic;
- expose World coordinates;
- expose collider/entity handles;
- weaken occlusion because the target is inconvenient;
- promote absence of a blob to knowledge that the target does not exist;
- call this G1 PASS.

## Owner touchpoint

**none**

## Maximum claim

> One narrow P0 physical-evidence channel can preserve a real private visibility boundary under hidden material change.

Not:

- stale memory;
- object permanence;
- object identity;
- history causality;
- self/world inference;
- semantic meaning;
- organism continuity.

## Downstream relevance

If this fails, actor-private history pressure cannot yet be grounded in a trustworthy material visibility boundary.

If it passes, a later run may ask whether legally acquired evidence can become stale and causally matter. That later question is not authorized here.


---

## Protocol incident — first execution

The first candidate execution at `afe5ea31308fa7098faaa380acc0aef037358018` was execution-valid but its scientific readout was not interpretable.

Observed preliminary readout:
- visible control: no blob;
- hidden target: no blob before/after;
- hidden target displacement: 0.472197;
- no hidden leak;
- deterministic.

A dedicated query-readiness diagnostic then showed:
- identical visible geometry before first `world.step()`: no ray hit;
- after one neutral `world.step()`: ray hit the intended target;
- actor and target positions were unchanged across that step.

Rapier scene queries use broad-phase/BVH state updated by the simulation step. Therefore the initial no-blob visible control was an apparatus/query-readiness defect, not evidence against the sensor law.

Classification of the first readout:
**INCONCLUSIVE — PROTOCOL DEFECT**

Allowed repair:
one neutral initial `world.step()` after world construction, before any P0 readout.

Frozen:
- geometry;
- sensor fields;
- ray law;
- range;
- occluder;
- target impulse;
- PASS/FAIL criteria.

No scientific threshold or target arrangement is changed.
