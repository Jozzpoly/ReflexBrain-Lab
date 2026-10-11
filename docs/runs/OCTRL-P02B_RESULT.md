# OCTRL-P02b Result — Embodied Occlusion Transition Integration — 2026-10-07

Status: **PASS · RUN CLOSED**

Run branch:
`run/octrl-p02b-embodied-occlusion-transition`

Base:
`research/pre-o0-foundations-campaign @ d48922688795d16add501c26b34b6ea52ed0d6e3`

Draft PR:
#16 — OCTRL-P02b embodied occlusion transition integration

## Question

> Do the already-qualified B0 body seam and unchanged P02a sensor preserve their claims when the actor's own physical motion carries it from a visible relation into occlusion, after which a real hidden target displacement remains absent from external P0 evidence?

## Outcome

**PASS**

Final frozen-outcome CI:
- branch state: `4e83c12a30648c6df1f14aaf6a81aafcc328177e`
- workflow run: `37556198959`
- job: `112582884555`
- TypeScript / Vitest / Vite build: PASS
- P02b scientific gate: PASS

## Exact observed evidence

- deterministic repeat: PASS
- initial private blob count: 1
- requested actor heading: `-1.5707963267948966`
- Rapier actor heading: `-1.5707963705062866`
- heading representation error: `4.371139006309477e-8`
- first visible -> occluded transition: tick 51
- actor y at first occlusion: `0.6355983018875122`
- target displacement at first occlusion: `0`
- target range at first occlusion: `4.702296459583576`
- actor total self-displacement: `3.2421847581863403`
- target reappearance ticks after first occlusion: none
- target displacement before hidden phase: `0`
- hidden target displacement: `0.4721970558166504`
- hidden target stayed within declared P02a range: yes
- hidden P0 leak ticks: none
- actor contact contamination with target/occluder: none
- reasons: none

## Qualified narrow claim

> The qualified B0 body seam and unchanged narrow P02a sensor can compose into one continuous embodied visible-to-occluded sequence in which later hidden material change remains absent from external actor-private evidence.

This is materially stronger than the separate P02a visible/hidden fixtures because the visibility loss is produced inside one continuous World by the actor's own physical motion.

## Protocol incident preserved

The first execution was **INCONCLUSIVE**, not FAIL.

The setup validator required the initial angle to match the requested `-pi/2` within `1e-9`.

Measured representation error was `4.371139006309477e-8`, while the actual physical trajectory was already the intended downward motion and all scientific evidence-plane checks behaved coherently.

Allowed correction:
- setup-validation tolerance `1e-9 -> 1e-6`.

Frozen through that correction:
- actual actor rotation state;
- motor protocol;
- P02a sensor implementation;
- geometry;
- target motion;
- timing;
- scientific PASS/FAIL conditions.

No scientific threshold or arrangement was tuned against the result.

## Important limits

This PASS does **not** establish:

- memory;
- stale belief;
- object permanence;
- checked absence;
- P1 identity/tracklets;
- G1;
- history causality;
- concern/controller continuation;
- semantic meaning;
- organism continuity.

The target is still researcher-known at the synthetic sensor boundary; the actor-private output receives no World identity.

## Parent-state consequence

The project now has, in one continuous physical trajectory:

`legal visible external evidence -> actor self-motion -> legal loss of evidence through occlusion -> hidden material change with no private external update`

This is the first qualified substrate on which an actor-private record could become genuinely stale through lived time instead of being compared across researcher-spliced fixtures.

No next run is activated by this result.
