# O-CTRL M0-Lite Contract Red Team — 2026-10-06

Status: **DEDICATED CONTRACT REVIEW · PASS WITH REQUIRED AMENDMENTS**

Target:
`OCTRL_M0_LITE_IMPLEMENTATION_CONTRACT_DRAFT_2026-10-06.md`

No implementation has begun.

---

# Attack 1 — authored concern may still smuggle World identity

Draft allowed a private target/dock binding.

Risk:
implementation creates that binding from World entity IDs at initialization, then claims later privacy.

## Required amendment

Concern specification may contain an **appearance/landmark template** appropriate to an authored task.

But current private binding must be acquired through legal perception.

Do not seed:
- target World ID;
- target position;
- dock World coordinate.

First calibration arrangement should permit legal initial acquisition.

Microscope may know mapping.

### Verdict

Fixed by explicit acquisition boundary.

---

# Attack 2 — hidden-displacement test may tempt adding fake patrol life

If actor sees relation satisfied and stays nearby, hidden displacement may never occur naturally.

Risk:
add idle wandering/patrol only so Q1 can happen.

That would contaminate T0 and create performative autonomy.

## Required amendment

Do **not** add generic wandering/patrol solely for qualification.

G1 may use a controlled World-legal causal setup:
- checkpoint after legal evidence;
- actor/occlusion state changes through a physical permitted intervention/initial arrangement;
- target later moves by M0 process while unobserved.

The test harness may create the condition.
It must not inject semantic knowledge.

Natural O-CTRL is allowed to be quiescent when monitoring evidence remains current.

### Verdict

Important protection.
T0 remains a control, not life theater.

---

# Attack 3 — M0 shuttle may be ornamental

Draft G5 catches this, but contract should require at least one **preplanned lawful causal run** where M0's independent process actually alters relevant material configuration without Owner.

Otherwise implementation can pass most tests while shuttle spins decoratively.

## Required amendment

At least one qualification seed must cause, through ordinary physics:
- shuttle -> loose body/target/blocker -> changed material relation or chokepoint;

while focal actor is not the cause.

No direct teleport.

### Verdict

Add as M0 qualification requirement.

---

# Attack 4 — concern freshness can become a global clock

Draft correctly scopes evidence age to T0.

Still:
same exact periodic interval could make behavior visibly metronomic and encourage global-tick implementation.

## Required amendment

Concern may compare **private evidence age**, but policy cannot use global scenario phase.

Qualification should vary:
- initial evidence age;
- travel/check duration;
- hidden event timing.

Hidden World event must not alter check schedule before perception.

No need to randomize solely for aesthetics.

### Verdict

Adequately bounded after clarification.

---

# Attack 5 — "actor-private odometry" may accidentally read rigid-body World pose

In a simulation, easiest implementation is:
`privatePose = rb.translation()`.

That is practically a World oracle even if called proprioception.

## Required amendment

Define an explicit proprioceptive delta interface.

Private odometry integrates:
- actor-observable body displacement/orientation delta from previous tick.

Research code may derive that delta from physics truth at the **sensor boundary**, but actor never receives arbitrary World positions of external entities.

This is an acknowledged synthetic perfect-proprioception scaffold.

Do not conflate it with learned localization.

### Verdict

Acceptable after boundary is explicit.

---

# Attack 6 — P0/P1 blob generation can use World segmentation invisibly

Any synthetic perceptual system knows which collider generated a ray/blob internally.

Risk:
tracker uses entity pointer to make association perfect.

## Required amendment

Perception implementation may use World geometry to synthesize current sensory returns, but the P1 association algorithm must operate only on the exported P0 sensory features.

Test:
shuffle internal World entity handles while preserving P0 stream.
P1 result must remain invariant.

### Verdict

Add as a perception-boundary unit falsifier.

---

# Attack 7 — RESTORE may quietly become a semantic manipulation primitive

Draft says no `push(target)`, good.

But local desired contact geometry can still query true target/dock pose.

## Required amendment

RESTORE may only derive approach/contact geometry from:
- current P0/P1 target evidence;
- current visible dock evidence;
- private remembered relations/odometry.

If dock is currently hidden and memory is insufficient, controller may CHECK rather than solve from World coordinates.

### Verdict

Add explicit rule.

---

# Attack 8 — REACQUIRE can become the largest system

Contract already bounds it, but "expand along observed free directions" could grow into full map/search.

## Required amendment

First specimen must define a **failure envelope**:

O-CTRL is not required to recover a target displaced arbitrarily anywhere in world.

Qualification relocation distance/occlusion must remain within a declared local search scale.

Held-out arrangement can cause honest unresolved failure.

Do not expand search architecture merely to improve success rate.

### Verdict

Strong protection.

---

# Attack 9 — G4 Owner-created arrangement may be non-reproducible

Owner rearrangement is excellent anti-fixture evidence, but causal diagnosis needs replay.

## Required amendment

When Owner creates held-out arrangement:
- snapshot/save initial World configuration before run;
- record intervention/rearrangement;
- reuse exact configuration for mechanistic follow-up.

Owner arrangement is unknown to policy authoring logic, not lost to science.

### Verdict

Add.

---

# Attack 10 — B1 primary may fail before organism question starts

Contract already allows B0 fallback.

Need prevent weeks of body tuning.

## Required amendment

Early B1 acceptance test must be tiny:

- stable open locomotion;
- basic passage;
- one physical push.

If B1 fails mechanically under shared E0-style controller and requires broad redesign:
use B0 for first O-CTRL and move morphology to separate probe.

### Verdict

Add explicit early escape.

---

# Attack 11 — qualification gates can train the policy

Even five gates can become development fixtures.

## Required amendment

During implementation distinguish:

### build-up checks
unit/mechanism correctness.

### frozen causal gates
G1–G5.

Do not repeatedly tune policy against every gate after freeze.

Before final qualification:
- freeze policy/controller parameters;
- run held-out arrangement after freeze.

### Verdict

Add.

---

# Attack 12 — first implementation may still become framework construction

Even reduced contract mentions:
- world;
- sensors;
- tracklets;
- memory;
- controllers;
- microscope.

Risk:
generic interfaces everywhere.

## Required staged build

Implementation should proceed as one vertical specimen, not a platform.

### S0 — physical world/body surface
M0-Lite + B1 + visual legibility.

No Local Brain.

Purpose:
qualify mechanics and causal readability.

### S1 — sensor/private trace
P0/P1 + private odometry/history trace.

No concern behavior yet.

Purpose:
prove authority boundary and hidden-change privacy.

### S2 — concern/private state
T0 maintain-and-monitor state only.

No rich controller.

Purpose:
prove concern can be privately supported/stale/contradicted.

### S3 — closed-loop local control
CHECK/REACQUIRE/RESTORE/RECOVER.

Purpose:
first full O-CTRL organism surface.

### S4 — freeze + G1–G5
Only after exploratory artifacts are addressed.

Do not create generic subsystem framework between stages.

### Verdict

This staging materially reduces risk.

---

# Attack 13 — O-CTRL may still be boring

Yes.

That is not a contract failure.

O-CTRL is a control organism.

Do not add:
- random idle motion;
- social animation;
- curiosity;
- extra goals;

to improve life feel.

Broader organism/watchability question moves to O-DEV.

### Verdict

Explicitly preserve boredom.

---

# Attack 14 — does this still answer ReflexBrain's larger need?

Yes, if scope discipline holds.

O-CTRL qualifies:
- material host;
- private epistemics;
- temporal concern;
- local continuation;
- independent ecology.

O-DEV then tests self-directed developmental trajectory.

The host campaign must stop when repeated semantic residual pressure appears.

### Verdict

Project boundary intact.

---

# Contract red-team conclusion

**PASS WITH AMENDMENTS.**

No material V0 assumption is missing.

The remaining uncertainties are implementation parameters or honest competence limits.

The contract may be promoted to:

**FROZEN FOR FIRST O-CTRL IMPLEMENTATION**

only after incorporating the required amendments:

1. legal perceptual concern binding;
2. no patrol/wandering added for hidden-change test;
3. one lawful M0 causal chain qualification seed;
4. explicit private evidence-age boundary;
5. synthetic proprioceptive-delta boundary;
6. P1 association invariant to World handles;
7. RESTORE uses only private geometry;
8. bounded REACQUIRE failure envelope;
9. replayable Owner held-out arrangement snapshot;
10. early B1 escape to B0;
11. policy freeze before causal gates;
12. S0–S4 vertical build order.

No code should begin before the contract is updated and status promoted.
