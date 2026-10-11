# MEDIUM-B — Owner Field Lab v0 Integrity Audit — Checkpoint 01 — 2026-10-07

Status: **SOURCE + LIVE-SURFACE AUDIT · NO FIXES APPLIED**

Audited:
- `src/owner-field-lab.ts`
- `probes/owner-field-lab.html`
- live GitHub Pages v0 surface
- current medium campaign invariants

Purpose:

> identify what is genuinely wrong with the medium, what is merely an honest limitation of the current specimen, and what would become a dangerous UI-side fake if "fixed" at the presentation layer.

---

# 1. Highest-severity medium defects

## M-B01 — Actor Lens is epistemically dishonest

**Severity: MATERIAL**

Current Actor Lens hides the target only when no legal P0 blob exists, but continues rendering:
- central occluder;
- room geometry;
- independent sweeper;
- loose bodies;
- world-space layout.

The actual P0 private channel does not provide those facts in that form.

Therefore current "Actor Lens" is **not** an actor-private view. It is a World view with one target visibility mask.

Why it matters:
- project core depends on World truth != private evidence;
- the medium currently violates the distinction visually while claiming to illustrate it;
- Owner could infer actor knowledge from researcher geometry.

Do not fix by arbitrary hiding until Actor Lens semantics are frozen.

Candidate semantic alternatives to research:
1. raw P0 only;
2. raw P0 + proprioception;
3. current private evidence + remembered history;
4. layered actor reconstruction / hypothesis view.

These should likely be separate lenses, not one overloaded toggle.

---

## M-B02 — "Actor control OFF" label hides the actual causal cut

**Severity: MATERIAL / UI-SEMANTIC**

Implementation:
- motor demand becomes zero;
- private tick still advances;
- sensor/history processing continues;
- the monitor can continue acquiring legal P0.

Thus the control is closer to:

> **motor authority disabled / body actuation paused**

than:
> actor paused.

This distinction is scientifically useful, but the current label obscures it.

Do not change semantics casually. First decide whether medium needs separate cuts for:
- motor output;
- sensor input;
- private state update;
- entire organism clock.

---

## M-B03 — drag is a teleport intervention, not continuous physical grabbing

**Severity: IMPORTANT / HONESTY**

Canvas drag calls `setTranslation()` each pointer move and zeros target velocity.

Benefits:
- open direct manipulation;
- easy Owner perturbation;
- does not notify actor memory directly.

But:
- object can cross walls during drag;
- no physical hand/grab body exists;
- path/contact history is not physically simulated;
- "Owner moved target" is an external intervention authority, not ordinary material action.

This may be completely valid for research.

The medium must make it explicit rather than visually implying a physical grab.

Future alternatives:
- keep teleport intervention as microscope-level manipulation;
- add optional physical grab/constraint tool later;
- compare the two if self/world attribution becomes important.

Do not silently convert all dragging to physical grabbing; they answer different questions.

---

# 2. Causal-substrate gaps exposed by medium

These are **NOT primarily UI bugs**.

## S-B01 — actor's external sensor world is still almost one-object

P02a sensing receives only the target as its candidate body.

The actor does **not** privately perceive:
- sweeper;
- loose bodies;
- walls as external blob entities.

It may physically collide with some of them, but current external sensory meaning is very narrow.

Medium risk:
a visually rich World can make Owner believe the actor inhabits a richer perceived ecology than it actually does.

Correct response:
expose the narrowness honestly.

Wrong response:
fake extra actor-visible objects in UI before a lawful sensor channel exists.

---

## S-B02 — contact evidence is incomplete

`actorContact()` currently includes:
- occluder;
- room walls;
- loose bodies.

It excludes:
- target;
- independent sweeper.

Physics may still produce those contacts, but the monitor's contact flag will not report them.

This is a substrate/interface seam finding.

Before expanding contact:
- decide whether the actor should have generic body-contact evidence independent of object identity;
- test whether adding target/sweeper contact changes current authored controller behavior;
- preserve distinction between physical contact and semantic object role.

---

## S-B03 — ecology is spatially partitioned

Independent sweeper lives in a lower lane.

By default:
- actor activity is mainly upper field;
- sweeper activity is mainly lower lane;
- they become coupled largely when Owner places target/loose matter into the lane.

This makes the process real but potentially **ornamental**.

That is exactly the G5-style concern:
does ecology create ordinary pressure without Owner staging the interaction?

Do not solve through UI.

This belongs to future organism/ecology research.

---

## S-B04 — ordinary actor continuation is still weak

Current authored monitor:
- forward ROAM;
- fixed bounce routine after contact;
- stale-evidence CHECK;
- bounded YIELD.

This is intentionally simple.

Risks:
- wall-driven repetitive motion;
- false impression of life from persistence alone;
- old Persistent Playground wall-clinging family may reappear in new form.

Do not add:
- random wander;
- extra state labels;
- canned animations;

merely to improve life-feel.

The medium should make boring/simple behavior legible. Organism research must earn richer continuation.

---

# 3. Medium-experience weaknesses

## X-B01 — dashboard gravity

Current desktop layout gives the World most space, but five side cards remain continuously visible:
- Actor Private;
- Microscope;
- Fast Interventions;
- Causal Cuts;
- Material Playground;
- Event History below.

This is already better than a pure dashboard, but the visual grammar still suggests:

> use controls to make experiment happen.

Research questions:
- can microscope/details collapse by default?
- can Owner enter "watch mode" with almost no telemetry?
- should interventions appear contextually near physical objects?
- can the world remain the dominant reading surface even during diagnosis?

No redesign yet.

---

## X-B02 — pre-authored setup buttons remain prominent

`Reveal`, `Hide`, `Sweeper lane` are useful shortcuts.

They are also direct descendants of the clicker failure mode if they become the primary way to create interesting situations.

Current direct target dragging partially counters this.

Campaign question:
should these remain:
- quick calibration setups;
- hidden under "setup";
- or be replaced by spatial interactions once direct manipulation is strong enough?

---

## X-B03 — no first-class RELEASE transition

Historically valuable donor:
- Owner takeover / manipulation;
- then return autonomy;
- observe aftermath.

Current target drag has pointer release, but medium does not mark:
- intervention start;
- release moment;
- post-release epoch.

The event log records final target move, but RELEASE is not a first-class experimental boundary.

This may be one of the highest-value future medium concepts.

Do not implement until takeover/direct-manipulation semantics are understood.

---

## X-B04 — no orthogonal World / private-state reset

Current `Reset specimen` resets everything.

Historical Playground donor showed unusual causal value in:
- reset World, preserve brain/history;
- reset brain/history, preserve World.

Current architecture does not have a single legitimate "brain reset" seam yet.

Need to define current private-state boundary before restoring this interaction.

---

## X-B05 — no durable experiment continuity

Current:
- no save;
- no fork;
- no exact bookmark;
- no export/import;
- no reproducible state ID.

Therefore an interesting Owner-created state can still die on reset/tab closure.

This is a major medium gap, but implementing persistence before state-boundary analysis would fossilize the wrong representation.

---

# 4. Engineering unknowns

## E-B01 — long-run soak insufficient

Existing Field Lab engineering test runs only hundreds of ticks.

Unknown:
- 10k+ tick stability;
- actor/wall pathological loops;
- sweeper end-stop stability over long duration;
- accumulation of event/history state;
- dynamic-body sleeping/wake edge cases;
- escaped bodies / NaN / extreme angular state.

This is a good candidate for a dedicated **engineering run**, not scientific qualification.

## E-B02 — intervention stress untested

Unknown sequences:
- repeated drag through geometry;
- rapid memory/sensor toggling;
- many loose bodies;
- actor pause/resume during collision;
- occluder teleport while bodies overlap;
- target placed inside actor/wall/sweeper.

Medium should survive abuse or fail visibly.

## E-B03 — current event history is observationally incomplete

Logged:
- Owner interventions;
- P0 acquisition/loss;
- sweeper reversals;
- private monitor transitions.

Not logged:
- many physical contacts;
- target displacement due non-Owner process;
- sleep/wake;
- pathological repeated collision;
- bounded controller failures in a structured way.

Do not log everything. First determine which events matter for experimental navigation.

---

# 5. Findings that should NOT trigger immediate fixes

Important anti-sprint list:

- Actor behavior is simplistic -> **organism research pressure**, not UI-polish task.
- Sweeper lane is contrived -> **ecology composition question**, not "make prettier map".
- Sensor sees one target -> **private-evidence research**, not render more actor icons.
- no brain reset -> **state-boundary question**, not add Reset Brain button.
- no save/fork -> **snapshot architecture question**, not serialize random JS objects.
- Actor Lens wrong -> real medium defect, but semantics still need one short design run before code.

---

# 6. Candidate next runs after MEDIUM-A

No run activated yet.

## Candidate B-R1 — Field long-run soak
Engineering-only:
- deterministic 10k–100k tick runs;
- no new behaviors;
- detect non-finite state, body escape, repeated stuck contact, process death.

## Candidate B-R2 — intervention abuse matrix
Engineering-only:
- frozen sequence of Owner interventions;
- ensure medium fails visibly, not silently corrupts.

## Candidate A-R2 — takeover/release archaeology
Research-only:
- recover exact old takeover semantics and Owner observations;
- separate useful "I take the body" from self/world-causality contamination.

## Candidate C-R0 — snapshot boundary
Design/research:
- enumerate minimal canonical state required to save/fork:
  - physics state,
  - private state,
  - process state,
  - RNG/clock,
  - event provenance;
- test whether exact restore is technically possible before UX work.

## Candidate B-R3 — Actor Lens semantics
Design + one implementation probe:
- freeze what raw-private view means;
- then implement only that one lens and verify no World leakage.

---

# 7. Current judgement

Field Lab v0 is **a useful medium donor and live baseline**.

It is not yet:
- a trusted actor-private observatory;
- a durable experiment workbench;
- a qualified Owner laboratory;
- evidence that the organism is alive.

The current correct move is **more understanding before more interface**.
