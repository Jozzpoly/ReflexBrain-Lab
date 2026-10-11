# OCTRL-P02a Result — Private Dynamic-Blob Occlusion Null — 2026-10-07

Status: **PASS · RUN CLOSED**

Run branch:
`run/octrl-p02a-private-occlusion`

Base:
`research/pre-o0-foundations-campaign @ df2d6d14da4c941e60a2d9dc745ea3b839feb245`

Draft PR:
#15 — OCTRL-P02a private occlusion null

## Question

> Can one minimal P0 dynamic-blob sensor expose body-relative physical evidence when line of sight exists while remaining unchanged during a real physical displacement of the same body behind an occluder, without exposing World coordinates, object identity, collider handles, semantic kinds, or microscope contact truth?

## Outcome

**PASS**

Final frozen-outcome CI:
- branch state: `9d40930ec669dfb14db1b91b76789d61ba0445cc`
- workflow run: `37554918083`
- job: `112578816316`
- TypeScript / Vitest / Vite build: PASS
- the P02a test was configured to fail CI for any scientific outcome other than PASS.

## Qualified evidence

Under the frozen P02a arrangement and unchanged sensor law:

- visible control produced exactly one private physical blob;
- private blob schema contained only:
  - body-relative bearing;
  - relative range;
  - radial motion;
  - apparent radius;
- hidden target produced no private blob before displacement;
- a real physical impulse displaced the hidden target;
- target remained inside the declared sensor range during the hidden-motion window;
- no hidden-motion tick exposed the target through P0;
- private P0 evidence before and after hidden displacement remained identical;
- visible and hidden runs repeated deterministically.

Allowed claim:

> One narrow synthetic P0 physical-evidence channel can preserve a real actor-private visibility boundary under hidden material change.

## Protocol incident preserved

The first execution was **INCONCLUSIVE**, not FAIL.

At `afe5ea31308fa7098faaa380acc0aef037358018`:
- the implementation compiled and executed;
- visible control emitted no blob;
- hidden side also emitted no blob while the target moved.

A dedicated diagnostic at `66da16c6a88a53c05bd7fac04aefcb9e97be69a2` showed why:

- before the first Rapier `world.step()`, the identical visible ray returned no hit;
- after one neutral `world.step()`, it hit the intended target;
- actor and target positions were unchanged.

This matched Rapier scene-query semantics: fresh collider insertions are not guaranteed to be present in the broad-phase query structure before a simulation-step/query refresh.

Allowed protocol correction:
- one neutral initial `world.step()` after constructing the zero-gravity scene and before the first P0 readout.

Frozen through the correction:
- sensor fields;
- sensor ray law;
- geometry;
- range;
- occluder;
- target impulse;
- PASS/FAIL criteria.

No threshold or arrangement was tuned against the scientific result.

## Important limits

This PASS does **not** establish:

- generic scene discovery;
- object identity;
- P1 tracklets;
- memory or stale knowledge;
- checked absence;
- concern/controller behavior;
- G1 as a whole;
- history causality;
- self/world inference;
- semantic meaning;
- organism continuity;
- learned ReflexBrain.

The current sensor is deliberately minimal:
- center-ray visibility approximation;
- candidate bodies are enumerated inside the synthetic sensor boundary;
- actor-private output receives no candidate identity or World authority.

Therefore do not promote this run into a general perception system.

## Parent-state consequence

Before P02a:
- P01a showed that legal private proprioception can carry material body consequences, while falsifying researcher contact time as actor-experiential time.

After P02a:
- the project additionally has one qualified, narrow **external physical visibility/occlusion boundary**.

This makes later stale/private-history pressure possible without pretending that hidden World change is already actor knowledge.

No next run is activated by this result.
