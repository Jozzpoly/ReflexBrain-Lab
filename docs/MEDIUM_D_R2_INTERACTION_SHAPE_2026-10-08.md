# MEDIUM-D/R2 — Interaction Shape for a World-First Experimental Medium — 2026-10-08

Status: DESIGN RESEARCH · NO FIELD FEATURE · NO WORKBENCH UI

Inputs:
- live Owner Field Lab v0 inspection in Opera;
- MEDIUM-A interaction archaeology;
- takeover/release archaeology;
- MEDIUM-C exact causal moment stack through R5;
- MEDIUM-D/R0 grammar;
- MEDIUM-D/R1 first-divergence microprobe.

Primary question:

How can MARK / FORK / INTERVENE / RELEASE / COMPARE exist around a living World without turning the Habitat into a dashboard, wizard, scenario launcher, or form?

---

# 1. Live v0 finding: world-first in area, panel-first in behavior

Current Field v0 already gives the World most of the pixels.

But the interaction grammar still visually says:

pause / reset / choose speed / choose lens / push shortcut / toggle channel / inspect cards.

The right column constantly advertises operations.

This has two consequences:

1. Owner attention is pulled toward choosing an operation rather than watching what the specimen does;
2. the medium suggests that interesting events are expected to originate from controls.

This is not solved by making the canvas 10% larger.

It is an interaction-shape problem.

---

# 2. Desired default: WATCH has almost no ceremony

Ordinary state should be:

- World occupies nearly the whole meaningful viewport;
- specimen continues without Owner input;
- no experiment must be started;
- no branch panel is visible before a branch exists;
- no causal diff is visible before a comparison exists;
- microscope details are collapsed by default;
- interaction hints are spatial / contextual, not a permanent instruction wall.

Persistent UI may be limited to:
- specimen status / qualification badge;
- small causal tick / live indicator;
- unobtrusive MARK affordance;
- a compact utility drawer for reset/speed/lenses.

This keeps the primary loop:

watch → notice → touch or mark → release → watch again.

---

# 3. MARK should feel like dropping a bookmark into reality

MARK must not pause the World by default.

Candidate shape:
- one small “◆ Mark” affordance near the edge of the World;
- keyboard shortcut may exist, but must not be required;
- clicking creates a tiny marker on a thin causal rail;
- marker briefly pulses, then becomes quiet;
- World continues.

Visible result:
- one mark glyph with causal tick;
- no modal;
- no new side panel.

Under the hood:
- exact ExperimentMoment if current specimen version supports it;
- otherwise visibly unqualified approximate/bookmark mode must be distinct.

Important:

MARK is observation infrastructure, not an intervention.

It must not enter actor-private state.

---

# 4. FORK should appear only because a MARK exists

Do not show a permanent Fork button before there is something worth forking.

Candidate:
- select/hover a mark;
- small contextual “⑂ Fork” action appears;
- after fork, a minimal branch strip appears:

A · reference    B · working

No branch inspector yet.

Default branch semantics:
- A and B begin at the exact same causal moment;
- both run under fixed simulation ticks;
- B becomes the active visible branch for Owner intervention;
- A continues as untouched reference under the same causal schedule.

Why only one visible World initially:
- split-screen immediately doubles cognitive load;
- most of the time Owner wants to do something to B, not stare at two copies;
- comparison is useful after a divergence exists.

Trust requirement:
- branch strip must show whether A/B are running synchronously, paused, or independently running.

A hidden reference branch is acceptable only if its state is explicit.

---

# 5. INTERVENE should emerge from direct contact with the World

Primary intervention shape:

interact with material/body directly, not through scenario buttons.

Examples:
- drag / physical grab;
- impulse / shove;
- motor takeover;
- add/remove a material blocker when the World substrate supports it.

On intervention start:
- provenance epoch opens automatically;
- a small local label appears, e.g.:
  - OWNER · MATERIAL · POSE EDIT
  - OWNER · MATERIAL · GRAB
  - OWNER · MOTOR AUTHORITY

This label is microscope/host truth.

It must never imply actor knowledge.

---

# 6. Direct drag has to tell the truth about its physics

Current Field v0 drag is an authoritative setTranslation pose edit.

That is useful.

It is not a physical hand.

Therefore the medium should not use one visual gesture to silently conflate:
- POSE EDIT;
- IMPULSE;
- FORCE;
- CONSTRAINT / GRAB.

Candidate interaction:
- default direct drag may stay a fast POSE EDIT research intervention;
- later a distinct grab tool can provide material constraint physics;
- provenance records intervention kind.

The gesture can remain natural while the microscope truth stays precise.

---

# 7. RELEASE should usually be automatic and physical

RELEASE is a causal epoch boundary, not a dialog confirmation.

For direct manipulation:
- pointer down / grab begins intervention;
- pointer up ends it;
- RELEASE is recorded automatically.

For motor takeover:
- press/hold authority control begins takeover;
- key/button release ends takeover.

For persistent causal cuts:
- explicit toggle end is RELEASE.

After RELEASE:
- ordinary World/actor mechanisms continue immediately;
- no result modal;
- no “experiment complete” screen.

This protects the historically valuable loop:

intervene → let go → stand beside the aftermath.

---

# 8. COMPARE should surface only when histories actually differ

Do not open a diff dashboard immediately after FORK.

When first divergence occurs, show a compact causal ribbon.

Example from R1:

B changed private state @200 → motor @231 → material @231 → P0 @318

Visual semantics candidate:
- pink — Owner/research intervention/provenance;
- green/cyan — actor-private evidence/history;
- amber — decision / motor authority;
- blue — material World/body;
- purple — microscope-only / research infrastructure.

The ribbon answers one question:

where did these histories first stop being the same?

Each node can expand into deeper microscope evidence.

No node should be shown if the specimen lacks that causal layer.

---

# 9. Split view is a microscope action, not the default Habitat

Owner may click a divergence node or Compare A/B.

Only then:
- split-screen or synchronized replay appears;
- both branches can be scrubbed around the selected divergence;
- private / motor / World layers can be expanded.

Closing compare returns to the single World.

This keeps two cognitive modes distinct:

Habitat:
“I am beside the organism.”

Microscope:
“I am comparing two causal histories.”

A permanent two-pane laboratory would collapse them.

---

# 10. NOTE should attach to what Owner was looking at

Candidate:
- select mark / release / divergence;
- quick inline note;
- note chip appears on causal rail.

Possible Owner notes:
- “looks like wall-clinging”;
- “this surprised me”;
- “branch B seems to compensate”;
- “worth falsifying”;
- “experimentally useless”.

NOTE:
- is project/Owner evidence;
- is never actor-private state;
- is never simulation provenance that drives behavior.

The distinction tested in D/R1 remains visible.

---

# 11. PROMOTE stays out of the first UI slice

PROMOTE is dangerous because it can turn the medium into a scientific form.

Do not implement early.

A later candidate can gather:
- root mark;
- fork;
- intervention;
- observed divergence;
- Owner note;
- bounded interval.

Then generate a candidate falsifier brief, not a PASS.

For now:
- record enough provenance so promotion remains possible later.

---

# 12. Utility controls should retreat

Current permanent toolbar:
- pause;
- reset;
- speed;
- Actor Lens.

Current permanent right-side controls:
- fast intervention buttons;
- causal cuts;
- material playground;
- event history.

Candidate hierarchy:

Always visible:
- live status;
- causal tick;
- mark;
- active branch state only if a fork exists.

Contextual:
- intervention type label while Owner acts;
- release marker;
- causal ribbon only after divergence;
- note editor only when invoked.

Drawer / microscope:
- reset;
- speed;
- lens selection;
- causal cuts;
- event history;
- qualification details.

This is not a final layout.
It is an attention budget.

---

# 13. Actor Lens should not be part of D/R2 implementation

Current Actor Lens is known epistemically impure.

Do not redesign it inside this run.

Interaction-shape rule:
- a future actor-private view is a microscope/lens operation;
- it must be built from legally private layers;
- it does not need to be permanently visible.

The existing defect remains routed to MEDIUM-B.

---

# 14. Three concrete storyboards

## Storyboard A — material perturb / release

1. World already running.
2. Owner notices an object in an interesting place.
3. Optional MARK.
4. Optional FORK from mark.
5. Owner grabs / pose-edits object in active B.
6. Tiny local chip says OWNER · MATERIAL · POSE EDIT.
7. Pointer release records RELEASE.
8. Both histories continue.
9. A compact causal ribbon appears only when divergence occurs.
10. Owner keeps watching.
11. If curious, opens compare at first material/private consequence.

No experiment setup form.

## Storyboard B — motor takeover / release

1. Actor already moving under its own control.
2. Owner marks/forks optionally.
3. Hold takeover control.
4. Badge appears: OWNER · MOTOR AUTHORITY.
5. Owner drives via same actuator seam.
6. Release control.
7. Badge disappears; release mark remains on causal rail.
8. Actor resumes ordinary local controller.
9. Owner watches aftermath.
10. Compare only if useful.

The actor is never semantically told:
- Owner took over;
- Owner released me.

## Storyboard C — private research cut

This is microscope/research workflow, not ordinary Habitat play.

1. MARK interesting moment.
2. FORK.
3. Open microscope drawer.
4. Apply explicit PRIVATE_RESEARCH_CUT to B.
5. Pink research intervention marker appears.
6. RUN synchronized.
7. causal ribbon surfaces first divergence.
8. Owner note attaches to comparison.

The invasive nature of the cut must be visually obvious.

---

# 15. Red-team

Risk: invisible UI becomes undiscoverable.

Mitigation:
- lightweight onboarding hint on first visit;
- contextual affordances on hover/focus;
- small stable MARK affordance.

Do not restore a permanent control wall just for discoverability.

Risk: hidden reference branch reduces trust.

Mitigation:
- branch strip must always state A/B tick, run mode, and whether reference is advancing.

Risk: causal ribbon becomes pseudo-explanation.

The ribbon only states first measured divergence by layer.

It must not say:
- because;
- wanted;
- noticed;
unless separately supported.

Risk: automatic RELEASE hides intervention duration.

Record:
- intervention start tick;
- release tick;
- kind;
- authority layer.

Show duration on hover/microscope.

Risk: branch A consumes too much compute.

Not an immediate blocker for current small donors.

Future medium may need branch sleep, bounded compare windows, or replay from mark, but must not sacrifice causal exactness silently.

Risk: MARK/FORK encourages constant experiment mode.

The UI should make WATCH cheaper than FORK.

A mark is cheap.
A fork is contextual.
A compare is earned by divergence.

---

# 16. What D/R2 rejects

Do not build next:
- permanent multi-panel Workbench;
- always-visible event log;
- universal causal graph;
- generic inspector tree;
- Run experiment wizard;
- PROMOTE button;
- storage/import/export UI;
- full Field v0.2 redesign.

These are downstream possibilities, not current needs.

---

# 17. Smallest implementation slice suggested by this run

Not authorized automatically, but the strongest candidate is:

a separate low-fidelity interaction-shape probe using a qualified exact donor, with one World, MARK, contextual FORK, one direct MATERIAL intervention, automatic RELEASE, and a compact first-divergence ribbon.

Important:
- use a donor whose material intervention is already exact/qualified;
- do not use current broken Field v0 as the causal substrate;
- do not add actor semantics merely to make the prototype richer.

Best current donor candidate:
- E01/R4 for first spatial/material interaction-shape probe.

Why E01/R4:
- exact causal moment/fork already defended;
- real material process;
- branch-local material impulse already defended;
- avoids Field v0 process/contact defects.

Limitation:
- no actor-private layer.

That is acceptable for the first interaction-shape probe.
A later R5-based slice can test private divergence UI separately.

---

# 18. R2 judgement

DIRECTION: STRONG ENOUGH FOR ONE SMALL PROTOTYPE SLICE.

The run does not qualify Owner usability.

It establishes a design constraint:

experimental power should appear contextually around a living World, not as a permanent apparatus the Owner must operate.

Next proposed run:
- MEDIUM-D/R3A — low-fidelity material interaction-shape prototype on E01/R4 exact donor;
- separate page, not promoted to main Habitat;
- Opera inspection first;
- Owner evaluation only after the prototype is mechanically honest.
