# ReflexBrain Interactive Medium — Campaign Program — 2026-10-07

Status: **ACTIVE DESIGN / RESEARCH PROGRAM · NOT A FROZEN UI SPEC**

This document defines the purpose and research program for the **interactive medium of the whole ReflexBrain project**. It is intentionally broader than Owner Field Lab v0.

It does not authorize a feature sprint.

---

# 1. Why the medium exists

ReflexBrain needs more than tests, logs and explanatory replays.

The Owner needs a low-friction way to:

> enter the actual research substrate, perturb it, leave it alone, watch what persists, compare consequences, expose fakery, discover questions the researcher did not pre-author, and return to exact evidence when something interesting happened.

The medium therefore sits between four things:

1. **the specimen / World** — what materially continues;
2. **the actor-private experience** — what the actor could legally sense or remember;
3. **the Owner** — who may intervene, observe, challenge and form new hypotheses;
4. **scientific evidence** — frozen runs, controls, failures and qualification boundaries.

None may substitute for another.

The medium is successful only if it lowers the cost of genuine inquiry without making the World more fake.

---

# 2. Current Owner truth

## Strong positive signal

Owner explicitly approves and strengthens the development of the **project-wide interactive medium**.

The direction itself is valuable.

## Current negative / caution signal

Owner judged the C01 synchronized replay:

> interesting as an experiment, but without experimental value to the Owner.

Owner then explicitly asked that **the Field Lab itself not be rushed**. Its analysis, planning and implementation should be developed over many runs or several campaigns, without shortcuts.

Therefore:

- project-medium development: **STRONGLY CONTINUE**;
- C01 as main Owner medium: **FAIL**;
- Field Lab v0: **UNQUALIFIED CANDIDATE**, not a direction to polish rapidly;
- implementation tempo: **deliberate, campaign-based, evidence-driven**.

---

# 3. What the medium is NOT

Do not drift into:

- a dashboard with an animated specimen attached;
- a replay browser presented as experimentation;
- a growing wall of toggles;
- a level editor disconnected from actor/world causality;
- a visual debugger that exposes World truth as actor truth;
- a game-like toy polished before its causal substrate is worth playing with;
- a feature checklist whose completion is confused with Owner value;
- a second source of scientific truth competing with canonical run evidence;
- a mechanism for making weak organisms *look* alive;
- a requirement to preserve old Persistent Playground architecture.

A beautiful false medium is still failure.

---

# 4. The four medium surfaces

These surfaces may share code and visual language, but their epistemic roles must remain distinct.

## A. Habitat / Field

Primary question:

> What can the Owner actually do to the living material situation, and what does the specimen then do without being hand-held?

Properties:
- World-first visual hierarchy;
- direct material intervention;
- continuous physical time while the page is running;
- actor can continue without Owner input;
- Owner may stop the actor while leaving World processes alive;
- open-ended perturbation rather than only pre-authored scenario buttons;
- instrumentation secondary and hideable;
- explicit **UNQUALIFIED** status until Owner validates experimental value.

Current donor:
- `probes/owner-field-lab.html` v0.

## B. Microscope / Evidence Atlas

Primary question:

> What exactly happened, and what narrow causal claim did a frozen experiment support or falsify?

Properties:
- deterministic replay;
- matched controls / ablations;
- actor-private vs researcher truth;
- frozen qualification boundary;
- direct links to run evidence;
- failed experiments preserved;
- no implication that replay controls constitute Owner experimental agency.

Current donor:
- C01 synchronized replay;
- E01/E02/B01 probes.

## C. Chronicle / Experimental Continuity

Primary question:

> Can the Owner leave an interesting state, return to it, and recover the exact causal history rather than only remembering a vibe?

Needed capabilities, to research before implementation:
- exact specimen snapshot;
- actor-private state snapshot;
- material World state;
- event history;
- named/bookmarked moments;
- deterministic restoration where possible;
- explicit version/schema identity;
- fork-from-snapshot.

Critical truth:

> A static GitHub Pages tab does **not** keep simulating after it is closed.

Do not fake persistence. "Return later" initially means exact save/restore. Background/catch-up world evolution is a separate future research problem and must be explicitly modeled before claimed.

## D. Experiment Workbench

Primary question:

> Can the Owner turn an observation into a controlled comparison without becoming a programmer?

Candidate capabilities:
- fork current state into A/B;
- apply one intervention to one fork;
- run both forward;
- compare trajectory and actor-private histories;
- mark "interesting moment";
- save a minimal reproducible experiment;
- attach Owner note / verdict;
- promote a discovery into a future frozen scientific run.

The Workbench must not automatically treat Owner free-play as qualification evidence.

---

# 5. Core epistemic invariants

## Truth layers stay separate

At minimum:

- **World / microscope truth**
- **actor-private current evidence**
- **actor-private history / hypothesis**
- **Owner intervention**
- **scientific qualification**

The UI may visually relate them but must never silently collapse them.

Example:
an Actor Lens may not render an occluded target, World wall, sweeper or event merely because the browser knows it exists.

## Owner intervention is an event in the World, not actor knowledge

Dragging a target may change physical reality.

It may not:
- update actor memory;
- notify concern state;
- create object identity;
- trigger a check directly.

Any actor consequence must arrive through legal causal channels.

## Debug labels do not drive behavior

ROAM / CHECK / YIELD or later richer labels are explanations of state, never authority for state transitions.

## Medium PASS != organism PASS

A useful medium may exist around an unqualified organism.

An interesting organism may expose a poor medium.

They must be judged separately.

---

# 6. Owner experimental value — proposed gates

These are **not frozen scoring metrics**. They are design questions that should guide campaigns and later be challenged by Owner use.

### V1 — Intervention agency
Can Owner materially create situations that were not enumerated as scenario buttons?

### V2 — Consequence legibility
Can Owner tell what changed in the World, what the actor experienced, and what is only researcher knowledge?

### V3 — Autonomous continuation
After intervention, can Owner stop touching the system and obtain meaningful continued trajectory?

### V4 — Surprise / question generation
Can the surface generate observations that lead to questions not pre-authored in its UI?

### V5 — Recoverability
Can an interesting moment be reproduced, saved or forked rather than lost?

### V6 — Comparative power
Can Owner distinguish causal effects by comparing nearby alternative histories without scripting code?

### V7 — Low attention burden
Can the medium expose useful state without requiring constant supervision, dense dashboards or manual bookkeeping?

### V8 — Honest boundaries
Does the medium make it difficult, rather than easy, to confuse microscope truth, actor knowledge and qualification status?

Only Owner use can ultimately qualify "experimentally valuable to Owner".

---

# 7. Campaign sequence

The campaigns are intentionally allowed to overlap in research, but implementation should not collapse them into one sprint.

## MEDIUM-A — Ground truth / interaction archaeology

Purpose:
understand **which forms of interaction previously produced real Owner value** and which only looked sophisticated.

Work:
- recover concrete Persistent Playground moments and other historical Owner observations;
- inspect current C01 and Field Lab v0 as experiences, not only code;
- catalogue "open intervention" vs "pre-authored question";
- identify what created desire to keep watching;
- identify what made older systems feel dead, fixture-shaped or fake;
- establish medium anti-goals and vocabulary.

Deliverable:
small evidence-backed interaction map, not a redesign.

Exit:
we can explain *why* a proposed interaction is likely to improve inquiry, not merely why it is technically possible.

## MEDIUM-B — Field integrity

Purpose:
make the Habitat trustworthy before making it feature-rich.

Questions:
- Is Actor Lens epistemically honest?
- Is the World visually primary?
- Are direct interventions physically real?
- Does the independent process matter outside a decorative lane?
- Does the authored actor continue coherently for long periods?
- What breaks after 1k / 10k / 100k ticks?
- Can Owner create softlocks / pathological contacts / sensor artifacts?
- Does pause-actor / continue-world reveal useful causal distinctions?

Likely work:
- fix current Actor Lens leakage;
- long-run soak / NaN / escape / collision tests;
- simplify or hide dashboard controls;
- improve direct manipulation before adding more intervention buttons;
- add only instrumentation needed to explain discovered failures.

Exit:
Field v1 is mechanically credible enough that Owner feedback concerns the specimen, not obvious UI/physics defects.

## MEDIUM-C — Continuity / save / fork

Purpose:
make interesting states durable.

Research:
- exact Rapier/world snapshot strategy;
- serializable private-state boundary;
- versioned specimen state;
- restoration determinism;
- event provenance;
- bookmark/fork UX.

No fake "world lived while page was closed".

Candidate milestone:
Owner can save an interesting moment, reload it exactly, create A/B forks and run both forward.

Exit:
interesting evidence no longer dies with a tab/reset.

## MEDIUM-D — Experimental grammar

Purpose:
turn play into fast causal inquiry without turning Owner into a programmer.

Research:
- one-click fork;
- intervention delta;
- synchronized / unsynchronized forward run;
- actor-private diff;
- material trajectory diff;
- annotation / Owner verdict;
- promote-to-scientific-run path.

Important:
the medium should help formulate **new falsifiers**, not auto-label free play as PASS.

Exit:
Owner can discover "I think X caused Y" and test that thought directly in the medium.

## MEDIUM-E — Organism observatory

Purpose:
only once the organism itself has richer continuing behavior, expose its trajectory without reducing it to telemetry.

Possible future surfaces:
- long unattended run;
- event bookmarks;
- rare-transition surfacing;
- expandable private-history trace;
- causal ancestry for decisions;
- "what changed since I left?" summary;
- multiple organism/world forks.

This campaign must wait for real organism pressure. Do not invent dashboards for nonexistent cognition.

---

# 8. Relationship to organism research

Medium development and organism science are parallel, not sequential.

A useful cycle is:

1. organism research creates a new real causal capability;
2. medium exposes it to Owner without overclaiming;
3. Owner intervention finds artifacts / surprises / new questions;
4. those observations become candidates for frozen scientific falsifiers;
5. scientific results update the organism substrate;
6. medium evolves only where new pressure justifies it.

This is a **bidirectional research instrument**, not a visualization afterthought.

---

# 9. Immediate decision after this document

Do **not** immediately implement Field Lab v0.2 features.

The already-created branch `medium/owner-field-v0.2` becomes a staging branch for MEDIUM-A/B investigation, not a feature sprint.

First work:
1. preserve today's live Field Lab v0 as a baseline;
2. audit its epistemic/interaction failures;
3. recover historical Owner-value evidence;
4. run long mechanical/interaction soak tests;
5. only then choose the smallest v0.2 change.

Known issue already found:
- current Actor Lens still exposes World-side geometry/process bodies and therefore is not yet a truthful actor-private projection.

This is a **finding**, not permission to redesign everything at once.

---

# 10. Long-term picture

The desired medium is not "a website about ReflexBrain".

It should gradually become:

> **a place where the Owner can visit a continuing artificial creature and its material world, touch that world, leave evidence behind, come back, understand why something happened, fork reality when unsure, and turn surprise into science — without the medium secretly becoming the creature's brain or the researcher's answer key.**

That is a long-term research artifact.

Treat it accordingly.
