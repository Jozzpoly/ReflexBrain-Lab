# O-CTRL M0-Lite — Draft Implementation Contract — 2026-10-06

Status: **DRAFT · NOT IMPLEMENTATION AUTHORITY UNTIL RED-TEAM PASSES**

Source of truth:
- `PRE_O0_CAMPAIGN_CURRENT_STATE_2026-10-06.md`
- `PRE_O0_N12_CAMPAIGN_META_RED_TEAM_2026-10-06.md`

This contract replaces the superseded 2026-10-05 O0 contract if, and only if, the dedicated contract red-team passes.

No organism implementation is authorized from this draft yet.

---

# 1. Question

Can one physically embodied actor carry **one explicitly authored maintain-and-monitor concern** through an independently changing material micro-world using only:

- bounded physical body actuation;
- local actor-private sensory evidence;
- actor-private temporal history;
- a small evidence-driven persistent control process;

without hidden World truth, scene-specific routes, Owner heartbeat or semantic object APIs?

This is a **host-substrate control experiment**.

It is not a learned ReflexBrain experiment and not a claim of endogenous life.

---

# 2. Maximum claim

If qualified:

> One unchanged local control process can maintain and re-check one authored privately evidenced physical relation under independent material change, with behavior causally mediated by body, perception and private history.

Do not claim:

- endogenous normativity;
- open-ended autonomy;
- learned semantics;
- general planning;
- general object understanding;
- life;
- final Local Brain architecture;
- production character controller.

---

# 3. World — M0-Lite

One small deterministic Rapier 2D world.

Required qualitative structure:

- open area large enough to observe locomotion;
- one occluded side area;
- one loop / alternate local route;
- one chokepoint;
- several loose dynamic bodies;
- one independent bounded mechanical shuttle/sweeper.

## Mechanical shuttle

- dynamic physical body;
- constrained to a simple rail/path;
- driven by bounded force/motor;
- reverses from physical end conditions, not global timer phase;
- can collide with and move loose bodies;
- collisions can alter its actual timing/state;
- continues with Owner absent.

Actor receives no shuttle phase or global schedule.

## Dynamic topology

No separate gate/plate subsystem in first specimen.

Topology changes only because physical bodies can occupy/leave the chokepoint.

A loose body may become a real blocker.

Actor/shuttle/world contacts can later change that.

---

# 4. First concern — T0-D maintain-and-monitor

The actor is authored to care about one physical relation:

> one perceptually distinctive movable body should be settled at one perceptually distinctive physical dock/landmark, and the actor should maintain sufficiently recent private evidence about that relation.

This is deliberately an external/control concern.

## Concern does not contain

- World entity IDs;
- live object positions;
- live satisfaction truth;
- route;
- scene ID;
- hidden world-event notifications;
- semantic object kind.

## Concern may contain

- private binding to target appearance/history;
- private binding to dock/landmark appearance/history;
- desired qualitative relation;
- latest private evidence about relation;
- evidence age;
- active local controller state;
- recent contradiction/failure evidence.

Evidence-freshness threshold is T0-specific scaffold, not general memory theory.

---

# 5. Body

## Primary — B1

Minimal asymmetric oriented rigid body:

- one-piece rounded capsule/rounded rectangle;
- length > width;
- bounded forward/back force along heading;
- bounded turn torque;
- physical damping;
- real Rapier collision.

Use E0 actuation concept as starting donor.

No fatigue, damage, articulation, carry, shared effort.

## Control — B0

E0-style disc remains comparison/control.

B0 comparison must not require a second body architecture.

If B1 creates mostly snagging/pathology, O-CTRL may fall back to B0 without invalidating the substrate experiment.

---

# 6. Sensorium

## P0

Actor-private every tick:

- body-local/proprioceptive motion;
- heading/orientation relation;
- contact summary;
- current motor demand;
- coarse egocentric local geometry;
- visible physical blobs/signatures with approximate relative bearing/range/motion;
- real occlusion.

No World coordinates exposed as object truth.

## P1 temporary tracklets

- local token while percept remains continuously/evidence-supported visible;
- adjacent-tick continuity only;
- track expires on meaningful occlusion/loss;
- reappearance creates new current track;
- no World ID;
- no semantic kind;
- no hidden re-identification.

Microscope may map track token to World entity for analysis only.

---

# 7. Private state

Keep minimum needed for O-CTRL:

1. bounded recent sensorimotor/event history;
2. private target hypothesis/binding;
3. private dock/landmark hypothesis/binding;
4. latest supported target↔dock relation and evidence time;
5. actor-private local odometry scaffold;
6. recent active-controller progress/contact/failure evidence.

No generic entity database.

No global scene graph.

## Odometry scaffold

Allowed:

- actor-private local frame;
- updated from actual proprioceptively available body displacement/orientation;
- external body shove changes the estimate because the body actually moved.

Forbidden:

- hidden object position updates;
- hidden collision map;
- World-coordinate object oracle.

Localization learning is out of scope.

---

# 8. Local control

One persistent concern process.

Small generic local controllers only:

## CHECK / OBSERVE

Obtain fresh private evidence about target↔dock relation.

## bounded REACQUIRE

If expected target evidence is absent:
- check last-known vicinity;
- scan local occluded space;
- expand only through privately observed local free directions.

No global search guarantee.

## RESTORE

When private evidence supports relation violation:
- approach;
- establish physical contact;
- use body motion to move target toward dock;
- continually observe actual outcome.

No semantic `push(target)` World action.

## RECOVER

When active approach produces repeated local failure:
- back off;
- reorient;
- alter contact side/approach;
- try bounded local detour;
- yield if unresolved.

Must avoid both:
- framewise thrash;
- infinite identical pushing.

Debug labels may name active controller.
Labels must not drive behavior.

---

# 9. Private epistemic rule

Hidden World change must not alter:

- concern belief;
- target hypothesis;
- controller choice;
- motor demand;

until legal private evidence/history differs.

The maintain-and-monitor concern may independently decide that old evidence is too stale and trigger CHECK.

Hidden displacement itself must not change check timing/state before perception.

---

# 10. Self/world signals

Record, but do not yet use as a learned subsystem:

- motor demand;
- body response;
- contact;
- P0/P1 sensory consequence.

No learned forward model required in O-CTRL.

No prediction-error reward.

---

# 11. Five causal gates

## G1 — epistemic integrity

Paired hidden-displacement experiment:

- World changes target while actor cannot perceive it.
- private state remains matched before legal check.
- both runs trigger CHECK from the same private evidence-age state.
- sensory evidence diverges when relation becomes observable.
- private belief diverges only then.
- irrelevant matched disturbance does not produce target-memory rewrite.

FAIL on any hidden leak.

## G2 — material continuation and recovery

Actor observes relation violated.

Required:
- restoration through body/contact;
- temporary obstruction does not cause thrash;
- persistent obstruction accumulates failure evidence;
- recovery uses only local/private evidence;
- no hidden alternate-route instruction;
- honest unresolved state is allowed.

FAIL on teleport/success-by-intent/infinite identical pushing.

## G3 — private-history causality

Paired runs reach closely matched current sensory/body state but differ in relevant private history.

Required:
- first meaningful divergence appears in private state/controller before motor/output;
- matched irrelevant-history control does not reproduce same divergence.

Claim:
private history causally affects ordinary behavior.

Not learning.

## G4 — anti-fixture transfer

Freeze controller logic.

Run:
- one development arrangement;
- at least one materially rearranged M0-Lite arrangement;
- one legal Owner-created held-out arrangement unknown when control logic was authored.

No scene ID or new waypoint/branch.

Bounded failure is acceptable.
Scene-specific code edits are not.

## G5 — independent ecology value

Compare:
- normal M0-Lite;
- static ablation where shuttle/world independent process is disabled.

Normal world should create qualitatively real:
- off-screen material change;
- stale-evidence opportunity;
- dynamic obstruction/reconfiguration;

that static control lacks.

If not, the ecology process is ornamental.

---

# 12. Supporting checks

Not equal-weight benchmarks:

- P1 never consumes World ID;
- track expires under full occlusion;
- replay/provenance for controlled paired runs;
- concern ablation removes T0-specific trajectory honestly;
- B1/B0 comparison documents morphology effects;
- no scene-global timer enters actor policy.

---

# 13. Owner surface

Before Owner contact:

- machine causal boundaries pass;
- agent performs open browser observation and hunts obvious artifacts.

Owner view should show:

- visually legible body orientation;
- walls/occlusion;
- shuttle;
- loose bodies;
- marked target;
- dock;
- physical pushing/contact.

Debug/microscope off by default.

Owner is not asked whether the control is "alive".

Questions:

- Are body/world rules coherent?
- Is unseen change handled with believable ignorance?
- Does checking/reacquisition look non-omniscient?
- Does physical restoration/recovery feel systemic?
- Is anything obviously scripted, fake, tedious or mechanically broken?

Owner FAIL on these claims blocks O-DEV.

---

# 14. Stop conditions

Stop and reclassify rather than add complexity if:

- M0-Lite rarely affects actor history;
- REACQUIRE becomes a general navigation project;
- P1 needs World IDs to function;
- B1 contact pathology dominates behavior;
- concern/controller becomes a scripted phase sequence;
- machine tests pass but organism surface remains causally illegible;
- hidden World state enters policy;
- fixing O-CTRL requires learned semantics.

---

# 15. O-CTRL exit

O-CTRL is done when:

- G1–G5 are sufficiently qualified;
- body/world/private-history coupling is coherent;
- one authored concern can persist through modest rearrangement without hidden truth;
- ordinary search/recovery is adequate enough not to dominate the next experiment;
- Owner sees coherent rules and honest ignorance.

Then:

**stop improving T0.**

Freeze substrate enough and move to O-DEV.

Do not add:
- second concern;
- social actor;
- richer planner;
- semantic ReflexBrain;
- polish for entertainment.

---

# 16. Contract status rule

This draft becomes **FROZEN FOR FIRST IMPLEMENTATION** only after one dedicated contract-level red-team finds no material missing assumption or scope leak.

Until then:

**NO O-CTRL IMPLEMENTATION.**
