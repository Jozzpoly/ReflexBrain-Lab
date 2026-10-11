# MEDIUM-B/R2 — Field Findings Routing / Ecology-Composition Red Team — 2026-10-07

Status: **CROSS-BOUNDARY DESIGN FINDING · NO MECHANISM FIX**

Parent evidence:
- MEDIUM-B/R1: Field v0 engineering FAIL;
- E01 qualified independent-process donor;
- P01a private-proprioception evidence;
- current Field v0 source.

Purpose:

> decide which Field failures belong to the medium, which belong to organism/world substrate research, and prevent the interactive medium from silently becoming the architecture owner.

---

# 1. Finding A — the Field sweeper is not E01 reuse

Field v0 copied:
- dynamic ball radius 0.55;
- mass 4;
- drive force 28;
- damping 1.15;
- two fixed ball end-stops;
- edge-trigger direction reversal code.

It did **not** copy the full physical constraint environment that made E01 work.

Qualified E01 also had:
- two long parallel physical walls at y = ±1.2;
- shuttle centerline y = 0;
- a bounded corridor preventing the shuttle from physically sliding around the small circular end stops.

E01 evidence:
- first right reversal @243 with loose material;
- left reversal @494;
- live observation beyond 8936 ticks with repeated alternating reversals.

Field v0 evidence:
- 0 reversals in 50,000 ticks;
- final sweeper approx (6.68, -3.67);
- intended line y = -2.65.

Therefore:

> Field v0 is an **incomplete reimplementation** of the E01 process, not a failed reuse of the qualified donor.

---

# 2. Why "just add the two missing walls" is not a legitimate fix

The Field has:
- room y walls at ±4.35;
- central vertical occluder spanning y = -2.15 .. +2.15;
- current process centerline y = -2.65.

A literal E01 corridor translated to y = -2.65 would put its guide walls at:
- y = -3.85;
- y = -1.45.

The free center corridor would then intersect the central occluder's lower extent.

The central occluder would become an unintended participant in the process corridor.

That changes:
- process topology;
- loose-material trajectories;
- reversal timing;
- actor accessibility;
- the meaning of the current map.

Thus the omission is a root cause, but restoring the omitted geometry is **not** a local patch.

It is an ecology-composition decision.

---

# 3. Candidate ecology compositions — not chosen

These are research candidates, not implementation instructions.

## A. Dedicated E01 process cell

Keep a nearly exact E01 corridor in a bounded sub-area.

Pros:
- strongest continuity with qualified donor;
- clear process liveness;
- easy control vs interaction comparisons.

Risks:
- can become ornamental workshop machinery;
- may require an aperture/material path to affect the actor's ordinary ecology;
- Owner may have to stage every interaction, failing G5-style value.

## B. Reoriented boundary process

Rotate/translate the physical principle along a room edge.

Pros:
- less interference with central actor topology;
- can create natural material traffic into shared space.

Risks:
- no longer exact E01 geometry;
- must be re-qualified;
- can become a conveyor/gimmick rather than ecology.

## C. Redesign the habitat around an embedded process

Treat the independent process as a real part of terrain/world generation.

Pros:
- strongest chance of ordinary pressure;
- medium becomes a habitat rather than a demo rig.

Risks:
- largest scope;
- can accidentally design a puzzle around the process;
- risks changing organism research to serve the visualization.

## D. Invisible/kinematic rail

Constrain shuttle mechanically through a joint/kinematic axis.

Pros:
- compact.

Risks:
- new mechanism family;
- weaker ordinary-material character;
- may solve a UI layout problem by hiding causal structure.

No reason yet to prefer D.

---

# 4. Medium's responsibility

The interactive medium may require:
- a process that is visibly and mechanically honest;
- clear observation of whether it is alive/stalled;
- no UI claim stronger than qualification.

The medium should **not** decide:
- the final M0 topology;
- which independent process is canonical;
- how the organism receives ecology pressure.

Those are organism/world research decisions.

Therefore MEDIUM-B routes Finding A to a future **M0/ecology composition run**.

No Field v0 sweeper repair is authorized here.

---

# 5. Finding B — current contact seam is researcher-selected

Field v0 passes an `actorContact` boolean into the authored monitor.

The function checks contact against:
- central occluder;
- room walls;
- loose bodies.

It excludes:
- target;
- sweeper.

This produced the 50k actor -> target -> occluder jam while the monitor remained ROAM forever.

More importantly, the seam itself is conceptually suspect:

> the host decides which researcher-known objects count as "contact" for the actor.

That is not the same thing as a lawful generic body sensation.

---

# 6. Why P01a does not justify this contact bit

P01a preserved a clean legal private trace consisting of:
- motor demand;
- body-local forward/lateral motion deltas;
- body-local turn delta;
- cumulative private odometry.

It deliberately kept researcher contact timing outside the private trace.

P01a's major lesson was:

> microscope contact time != actor-private experiential consequence time.

Therefore Field v0 cannot cite P01a as authority for a semantic/generic instantaneous contact boolean.

The current contact seam is **new unqualified scaffolding**.

---

# 7. Candidate lawful body evidence — not chosen

Future organism research may compare:

## A. pure body-motion consequence

Use only legal proprioceptive motion/odometry differences.

Advantage:
- strongest continuity with P01a.

Risk:
- slow/ambiguous detection of jam;
- cannot distinguish many causes.

## B. aggregate generic contact pressure

Expose body-level contact/impulse magnitude without external object identity.

Advantage:
- material and local;
- can report "my body is being loaded/contacted" without "target contact".

Risk:
- new sensor primitive requiring its own falsifier;
- timing must be defined from actor-side availability, not microscope labels.

## C. local tactile sectors

Body-relative contact evidence by approximate sector, still no object ID.

Advantage:
- richer embodiment.

Risk:
- larger sensor design;
- may overbuild before need is demonstrated.

These belong to body/private-sensor research, not medium UI.

---

# 8. Immediate scope ruling

**Do not modify Field v0 controller/process to fix R1 inside MEDIUM-B.**

Public Field v0 remains:
- UNQUALIFIED;
- known long-run sweeper FAIL;
- known contact-seam mismatch;
- useful failure/interaction baseline.

Medium work may continue on:
- exact experimental continuity;
- fork/provenance architecture;
- honest lenses;
- interaction archaeology;
- abuse/recoverability.

Organism/world research must eventually provide a better process/contact substrate for the Habitat to consume.

---

# 9. Deeper architectural lesson

Interactive medium has a dangerous power:

> because it owns the place where everything becomes visible and manipulable, it is tempted to invent missing causal mechanisms for convenience.

That must be resisted.

Correct loop:

`medium reveals substrate deficiency -> deficiency becomes explicit research pressure -> organism/world run qualifies a mechanism -> medium integrates the qualified mechanism -> Owner attacks it again`

Not:

`medium needs nicer behavior -> UI branch invents hidden mechanism -> organism appears better`.

This boundary is now part of the project method.
