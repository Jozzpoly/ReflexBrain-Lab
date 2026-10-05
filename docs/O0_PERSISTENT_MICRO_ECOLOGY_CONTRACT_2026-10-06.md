# O0 Persistent Micro-Ecology — Frozen First Implementation Contract — 2026-10-06

Status: **FROZEN FOR FIRST IMPLEMENTATION · BOUNDED EXPERIMENT · NOT LONG-TERM ARCHITECTURE**

Parent design evidence:
- `ORGANISM_RECOVERY_CURRENT_TRUTH_2026-10-06.md`
- `ORGANISM_RECOVERY_DONOR_AUDIT_2026-10-06.md`
- `REFLEXBRAIN_SALVAGE_MAP_2026-10-06.md`
- `O0_FIRST_PRINCIPLES_REDESIGN_2026-10-06.md`
- `O0_RED_TEAM_RESOLUTION_2026-10-06.md`

## Question

Can one persistent embodied actor maintain its own material trajectory across several differently arranged micro-worlds using only:

- bounded physical body control;
- actor-private perception;
- actor-private memory/history;
- generic local continuation/recovery competence;

while the Owner can physically perturb the world without becoming the actor's heartbeat or providing semantic debug truth?

This is a host-organism qualification experiment.

It is **not** yet a learned ReflexBrain experiment.

## Main claim that may be earned

At most:

> One unchanged local organism policy can sustain a causally grounded, privately informed, persistent material life across a bounded family of scene layouts and Owner perturbations.

Do not promote:
- general intelligence;
- learned semantics;
- general planning;
- human-like life;
- general affordance learning;
- production-ready character controller.

## Frozen high-level shape

### One actor

One persistent actor.

No crowd and no second cognitive actor in O0.0.

Reason:
- avoid social complexity masking basic organism failures;
- keep first-divergence and private-history analysis tractable.

### One recurring concern

World-grounded maintenance pressure:

> keep at least one usable material token at a maintenance site.

This is an authored concern, not a reward.

The actor may know the stable identity of the maintenance site.

The actor is **not** given:
- current satisfaction truth;
- live material locations;
- source location truth;
- route truth;
- Owner perturbation notifications.

### Material loop

The World:
- contains physical material tokens;
- contains one material source/emitter;
- consumes/removes a token from the maintenance site after a bounded interval;
- can later expose/generate replacement material at the source.

The actor must perceive/check current state.

The recurring process exists to create autonomous pressure, not to define a final game mechanic.

## Scene family

The same organism policy must run unchanged in at least three scene layouts.

All scenes share the same object vocabulary and mechanics.

### Scene A — open baseline

- source and maintenance site separated by meaningful travel distance;
- mostly open path;
- a few passive movable objects;
- enough space to observe movement and turning.

Purpose:
- qualify baseline autonomous material loop;
- finally expose E0-derived locomotion in a larger arena.

### Scene B — occlusion / two-route

- at least two connected spatial areas;
- opaque wall geometry hides source or route from some actor poses;
- two plausible corridors/routes exist;
- line-of-sight differs materially from distance.

Purpose:
- qualify bounded vision, last-known memory and non-omniscient navigation.

### Scene C — obstruction / recovery

- same mechanics;
- one route can be blocked by a movable heavy object or barrier;
- alternate local continuation is physically possible.

Purpose:
- qualify failed progress, local obstacle evidence and recovery without authored scene-specific route switching.

## World truth

Canonical spatial/material truth lives in the physical simulation.

Use deterministic Rapier 2D as the first O0 substrate.

Keep:
- fixed step;
- dynamic actor body;
- static walls;
- material collisions;
- deterministic snapshots where supported.

Do not make movement authoritative through direct position stepping.

## Body

Start from the E0.0 body/controller parameters without tuning them for O0 before evidence.

Reason:
- Owner feedback says the controller appears to have some rules/character;
- E0 arena was too small to judge locomotion;
- O0's larger scenes create the first meaningful locomotion pressure.

Allowed immediate adaptation:
- only changes required to integrate O0 controls/physics cleanly.

Not allowed before evidence:
- body-oriented traction redesign;
- capsule morphology;
- fatigue;
- shared effort budget;
- bilateral actuators;
- force-rate physiology.

If O0 reveals a concrete body failure, isolate it later.

## Interaction vocabulary

O0.0 may use one simple material interaction: **carry / release**.

Pickup requirements:
- actor must be physically close;
- object must be visible/known in the current interaction moment;
- World validates availability.

While carried:
- the material remains a World entity associated with the actor;
- its position follows a defined physical carry relation;
- actor body movement remains physical.

Release:
- places material into World space.

This is not final inventory architecture.

It exists to make the recurring material loop possible without spending O0 on manipulation mechanics.

## Sensorium

### Proprioception

Actor-private every tick:
- body orientation;
- local linear/angular velocity;
- current motor demand;
- carry state;
- contact summary.

### Vision

Structured semantic vision is allowed.

Required:
- body-relative field of view;
- bounded range;
- real wall occlusion;
- visible entity identity;
- entity kind;
- bearing;
- approximate distance;
- no through-wall truth.

Initial target:
- approximately 120–160 degree forward FOV;
- enough range to perceive meaningful local geometry but not the whole map.

Exact angle/range are implementation parameters, not product constants.

### Local geometry sensing

The Local Brain needs enough legal local spatial evidence to avoid turning vision into a fake navigation oracle.

Allowed:
- short egocentric obstacle rays / local free-space samples;
- body/contact feedback.

Forbidden:
- full hidden scene collision map;
- global navmesh supplied from World truth.

### Hearing

Not required in O0.0.

## Private memory

Minimum actor-owned memory:

### Entity memory

For encountered material/source/site entities:
- stable encountered identity;
- last-known actor-private position/relationship;
- last-seen tick;
- current-known-location may become unknown after checked absence.

### Checked absence

If the actor returns to a location where a remembered entity should be observable and it is absent:
- preserve entity identity/history;
- invalidate current location knowledge;
- do not teleport memory to World truth.

### Passage/local obstacle memory

May store:
- recently observed blocked/free local passage evidence;
- time/age.

Do not give permanent authoritative scene topology.

### History

Keep a compact causal history sufficient to answer:
- what did I recently try?
- what local outcome followed?
- what did I recently observe/check?
- what is my current continuation?

No semantic relevance score required.

## Local Brain

One unchanged deterministic Local Brain is the baseline.

### Motor layer

Consumes local directional/turn demand and actuates E0-derived body.

### Local spatial competence

Generic functions only:
- approach visible/remembered local target;
- steer around immediate local obstacle evidence;
- stop/align for interaction.

No scene-specific coordinates or route tables.

### Continuing concern layer

The concern is structurally:

`maintenance-site needs observed usable material -> obtain material -> deliver -> continue ordinary life`

But the policy must operate from private evidence.

It may not query whether the site is actually satisfied unless currently observed/remembered under explicit rules.

### Search / reacquisition

When a remembered source/material is checked absent:
- enter generic local reacquisition/search;
- use actor-private memory/local geometry;
- allow discovery of a relocated entity;
- update memory from observation.

No `sourceMoved` state.

### Progress / obstruction

Continuation tracks material progress signals such as:
- decreasing target distance;
- successful movement;
- repeated collision/contact;
- elapsed no-progress interval.

When progress fails:
- generic local recovery may alter approach/search;
- persistence must have bounds;
- avoid both framewise thrash and infinite sticky continuation.

Exact policy is implementation detail but must be scene-independent.

## Owner intervention

Owner can:
- drag a free material object;
- drag/move a designated movable obstruction;
- shove the actor;
- temporarily take over actor motor demand;
- release control.

Owner operations modify World truth only.

They must not inject private semantic facts.

The actor learns consequences only through its legal sensorium/history.

## Shadow reafference probe

Include if implementation cost remains bounded.

It begins **shadow-only** and cannot drive behaviour in O0.0.

Inputs:
- recent motor demand;
- proprioceptive/body state;
- local contact state.

Output:
- short-horizon predicted proprioceptive/local sensory delta.

Record:
- prediction;
- actual;
- residual.

Question:
- does residual differ systematically for self-generated motion versus Owner/world perturbation?

Failure of this shadow probe does not fail O0 organism qualification.

## Research microscope

Must remain researcher-only.

Required:
- deterministic tick counter;
- World truth snapshot;
- actor-private observation snapshot;
- actor-private memory snapshot;
- current continuation/local-brain state;
- motor demand;
- physical outcome/contact;
- Owner intervention events;
- replayable event stream where practical.

Preserve first-divergence comparison capability conceptually:
- observation divergence;
- private-state divergence;
- decision/continuation divergence;
- physical outcome divergence.

Do not expose debug truth to Local Brain.

## Separate resets

Provide:
- reset whole run;
- reset private brain/memory while preserving current World where technically safe;
- reset World to scene seed while resetting actor state.

A full arbitrary "reset brain while moving" need not be perfect in first UI, but the architecture must keep World and actor-private state separable.

## Frozen causal scenarios

### C0 — autonomous baseline

For each Scene A/B/C:
- no Owner input for a fixed meaningful interval;
- actor must produce continued state change and engage with recurring material pressure.

FAIL if:
- inert;
- fixed short animation;
- scene-specific policy exception required.

### C1 — unseen source/material relocation

Precondition:
- actor has privately observed/used source/material at A.

Owner moves relevant entity to B outside current FOV.

Required sequence:
- actor initially acts from legal old memory;
- it does not know B immediately;
- checking A can create checked-absence evidence;
- generic search may later discover B;
- subsequent ordinary maintenance can use updated private history.

### C2 — irrelevant matched perturbation

Apply comparable Owner physical disturbance without evidence about source/material location.

Required:
- actor may react locally;
- relevant location memory must not update as though C1 occurred.

### C3 — blocked continuation

Block current direct route after actor has begun a continuation.

Required:
- actor experiences loss of progress/contact locally;
- recovery occurs without hidden alternate-route instruction;
- no perpetual direct pushing if a legal local alternative is discoverable;
- no framewise left/right thrash.

### C4 — takeover / release

Owner takes motor control long enough to relocate/reorient actor, then releases.

Required:
- actor continues from the resulting lived body/world/private state;
- no teleport/snapback to a scripted phase;
- concern/history continuity survives unless evidence legitimately invalidates it.

### C5 — private-history pair

Construct two deterministic runs with closely matched current visible/body state but different relevant private history.

Required:
- unchanged Local Brain may diverge because private state differs;
- first divergence must appear in private state before decision/output divergence;
- matched irrelevant-history control should not reproduce the same decision difference.

## Machine qualification

Before Owner organism review:

PASS required:
- deterministic build/test;
- FOV occlusion tests;
- hidden relocation does not leak;
- checked absence works;
- same Local Brain code/config across scene family;
- scene-specific hidden coordinates absent from policy;
- replay/event trace is internally consistent;
- C0–C5 automated or bounded deterministic harnesses pass where machine-testable.

Do not require a machine "LIFE_PASS".

## Owner review

Owner review is deliberately open-ended.

Show:
- one running organism;
- ability to watch without acting;
- ability to perturb physically;
- ability to take over/release;
- optional private/debug lens after natural observation.

Do not prime with expected "alive" behaviours.

Owner may judge:
- whether there is finally something worth watching;
- whether the world is rich enough;
- whether movement/body feel has meaningful rules on a larger map;
- whether the organism appears to own a trajectory rather than perform a demo.

Owner FAIL cannot be overridden by machine qualification.

## Stop conditions

Stop and reconsider rather than adding complexity if:
- micro-ecology still feels causally empty;
- visual/perceptual poverty prevents meaningful distinctions;
- generic search is effectively random wandering;
- hidden World truth enters policy;
- scene-general requirement forces a giant authored planner;
- O0 becomes mostly instrumentation again;
- we start adding learned semantics to compensate for missing ordinary competence.

## Implementation branch rule

Implement O0 on a fresh branch from the clean recovery checkpoint.

Do not restore old R0/R1/R2/R3 files wholesale.

If a historical donor is needed:
1. name the exact donor;
2. state the invariant being reused;
3. cherry-pick/reimplement only the minimum needed;
4. test it against the new O0 boundary.

## Promotion boundary

If O0 qualifies, the next question is **not automatically "add ReflexBrain"**.

First inspect residual organism failures.

Only recurrent actor-relative ambiguities that survive simpler local mechanisms become candidates for learned ReflexBrain pressure.
