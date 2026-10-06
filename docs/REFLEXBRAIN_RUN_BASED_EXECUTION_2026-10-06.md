# ReflexBrain — Run-Based Execution Architecture — 2026-10-06

Status: **CURRENT EXECUTION METHODOLOGY · v0.3 · ATOMIC IMPLEMENTATION UNDERWAY**

Primary design authority:

`docs/OCTRL_M0_LITE_IMPLEMENTATION_CONTRACT_2026-10-06.md`

This document defines **how uncertainty is reduced**.

The frozen O-CTRL contract is a bounded specimen design.
It is **not** one implementation task, one run, or a promise that every proposed component survives contact with evidence.

---

# 1. Governing principle

> **Increase ambition at the program level; decrease simultaneous uncertainty at the run level.**

ReflexBrain is allowed to become more ambitious.

A run is not.

The project has repeatedly mixed:
- ecology;
- embodiment;
- perception;
- memory;
- normativity;
- continuation;
- learning;
- evaluation;

inside one specimen.

That created:
1. causal ambiguity;
2. scope gravity;
3. hard-to-finish sessions;
4. recovery loss;
5. apparatus that could grow faster than the organism.

Run decomposition exists to correct those failures without shrinking the North Star.

---

# 2. Work hierarchy

## North Star

> Can a cheap local learned mechanism extract useful, generalizable actor-relative meaning from temporal private experience inside continuous embodied life, without becoming World authority, factual memory, the whole planner or motor controller?

This is deliberately broad.

## Campaign

A broad prerequisite or competence family.

Current campaign:
**host/substrate sufficiency**.

Current research sequence:
**O-CTRL -> O-DEV**.

Campaigns may later be invalidated or reordered by evidence.

## Run

The atomic unit of substantial execution.

A run asks **one primary causal question**.

It may contain several engineering actions only when they are inseparable from answering that one question.

## Gate

A gate combines results from multiple runs and decides whether a larger claim or next campaign is earned.

A gate is not a run.

---

# 2A. Two execution scales: research run vs delivery turn

The project now distinguishes two different atomicities.

## Research run

The scientific unit already defined by this document.

Examples:
- OCTRL-E02b;
- OCTRL-B01d.

A research run asks one primary causal question and may legitimately span more than one assistant response.

## Delivery turn

One assistant execution instance:

> Owner message -> autonomous work -> delivered assistant response.

In Owner terminology this is the practical "run" whose failure is catastrophic when the final response is lost.

A delivery turn is **not required to finish an entire research run**.

This distinction is mandatory.

### Governing rule

> Use the longest useful delivery turn that can still be brought to a recoverable, delivered boundary with reasonable margin. Do not shorten work merely to create more turns, but do not make completion depend on surviving several unknown branches.

The purpose is to maximize useful autonomous work per Owner prompt while minimizing catastrophic loss if the response channel dies.

### Planning before the first substantial action

Before starting, estimate the intended delivery turn from:

- known read/write/tool steps;
- expected CI/build waits;
- debugging uncertainty;
- external-service / browser risk;
- number of result-dependent branches;
- persistence work still required;
- time/complexity reserve needed for an actual delivered response.

The Owner's observed browser behavior suggests a usual upper lifetime around the mid-20-minute range, with rare ~28-minute outliers, but failures can also happen much earlier.

Therefore:
- do **not** plan to consume the apparent lifetime ceiling;
- do **not** solve reliability by collapsing into five-minute micro-turns;
- size by predictability and branching risk, not a fixed stopwatch target;
- preserve margin for persistence and delivery.

### Early externalization

A long delivery turn must not keep all valuable reasoning in the eventual final response.

As soon as the first material state is stable enough to matter, externalize it through a **short progress checkpoint**.

Checkpoint properties:
- 1–3 compact sentences by default;
- no Owner response required;
- state what is now true, what phase comes next, and any scope change;
- avoid duplicating the eventual final report.

Checkpointing is event-driven, not prose-driven and not a rigid timer.

Especially checkpoint:
- after live truth/recovery is established;
- after a material design/falsifier decision;
- before entering debugging, browser/external services, or another risky branch;
- when the original plan materially changes.

### Persistence boundary

If losing a new finding would alter interpretation of the project or force the Owner to reconstruct work, persist it **before** entering the next risky phase.

Do not defer all canonical truth updates to the end of a long delivery turn.

### Branch explosion rule

If a result opens a new substantial decision branch, do not automatically consume it inside the same delivery turn.

Choose among:
- finish the current bounded phase and deliver;
- persist the discovery as a future research-run question;
- continue only when the branch was already anticipated and still fits the reserved delivery margin.

### Delivery is part of completion

A delivery turn is not complete merely because:
- code exists;
- CI passed;
- a commit/PR exists;
- an internal conclusion was reached.

Completion also requires a delivered state summary that makes clear:
- what became true;
- what remains unexecuted;
- what was persisted;
- whether the research run itself is still ACTIVE or CLOSED.

A lost final response cannot be recovered by a later `kontynuuj`.
A later turn may continue from persisted state, but the lost wording, observations and reasoning are gone.

### Attention-cost constraint

Reliability must not be bought by multiplying Owner interactions.

Intermediate checkpoints do not request acknowledgement.
The assistant continues autonomously unless:
- Owner judgement is genuinely required by the evidence plane;
- authorization is required;
- a hard ambiguity cannot be resolved safely.

The optimization target is:

> maximum useful autonomous work per Owner prompt, subject to recoverability and delivery risk.

---

# 3. Atomicity test — split before activation

A proposed run is too large if **any** of the following is true:

### A1 — independent failure
Two parts can fail independently and would lead to different next decisions.

Split them.

### A2 — multiple new authority seams
The run simultaneously introduces more than one of:
- new World process;
- new body authority;
- new sensor authority;
- new memory authority;
- new action authority;
- new learned mechanism.

Default: split.

### A3 — downstream repair temptation
A likely failure would tempt us to implement a later competence inside the same run.

Split or explicitly forbid that repair.

### A4 — ambiguous attribution
A PASS would not tell us which changed assumption produced the useful phenomenon.

Split.

### A5 — session-fit failure
The run cannot reasonably reach a persistent evidence checkpoint inside one normal conversation/tool session.

Split before starting.

A long calculation or build is allowed.
An unbounded chain of conceptual/implementation decisions is not.

### A6 — recovery burden
A fresh agent would need to reload most of the campaign to understand the unfinished run.

Split or improve the run card.

---

# 4. Run budget

Default run budget:

- **1 primary causal question**
- **1 manipulated uncertainty**
- **0–1 new authority seam**
- **1 main artifact family**
- **1 decisive result**
- **1 next-decision boundary**

Controls and instrumentation are allowed only when they directly answer the question.

This is a default, not bureaucracy.
A justified exception must be written in the run card before activation.

---

# 5. Run classes

Do not silently mix these roles.

## PROBE

Question:
does a candidate mechanism/phenomenon exist at all?

Exploration is allowed.

Claims remain narrow.

## COMPARISON

Question:
does changing one controlled dimension materially alter the phenomenon?

Examples:
B0 vs B1, static vs dynamic process.

## INTEGRATION

Question:
do already-qualified pieces remain coherent when coupled?

No new major competence should be invented here.

If integration needs a new competence, stop and open a separate probe.

## QUALIFICATION

Candidate is frozen first.

Run held-out/falsifying pressure.

Do not tune on the held-out result.

## OWNER CONTACT

Used only when the claim genuinely requires experiential/product judgement.

Machine evidence is prepared first.

Owner contact is not used as a substitute for missing mechanism evidence.

One run may transition from PROBE to later QUALIFICATION only through an explicit freeze boundary.
Do not pretend exploratory tuning was already held-out evidence.

---

# 6. Run lifecycle

## 0. PROPOSED

A compact run card exists.

No implementation work yet.

## 1. ARMED

Before activation record:

- exact base SHA;
- question;
- why now;
- frozen inputs;
- manipulated variable;
- allowed changes;
- forbidden scope;
- evidence;
- falsifier;
- expected output;
- Owner touchpoint: none / optional / required;
- downstream/SPC relevance as a **non-success criterion**.

If this cannot fit compactly, the run is probably too broad.

## 2. ACTIVE

Work only toward the run evidence.

### Conversation survival rule

During active work:
- give a short progress checkpoint after a material boundary or roughly every 2–3 substantial tool actions;
- persist code/evidence at natural stable boundaries;
- never leave a material decision only in chat;
- before a risky/long action, make sure the latest meaningful state is recoverable.

Do not create commits for meaningless microsteps.
Do externalize any decision whose loss would change interpretation of the run.

## 3. EVIDENCE-READY

The candidate is stable enough to answer the question.

If the run is qualification:
freeze relevant parameters before held-out evidence.

## 4. JUDGED

Exactly one scientific outcome:

- **PASS**
- **FAIL**
- **INCONCLUSIVE**

A protocol breach or confound is **INCONCLUSIVE**, not FAIL.

Record:
- supporting evidence;
- claim scope;
- first important surprise;
- known confounds;
- debt introduced;
- whether parent contract/current truth must change.

## 5. PERSISTED

Commit:
- result;
- artifact references;
- exact SHA;
- next open uncertainty.

## 6. CLOSED

Stop.

Do not continue into the next run through momentum.

The next run is re-selected from the updated state.

---

# 7. FAIL and INCONCLUSIVE discipline

## FAIL is successful completion

If the falsifier fires:
stop the run.

Do not repair until it passes.

A new run may investigate:
- replacement mechanism;
- narrower claim;
- identified failure cause;
- fallback control.

## INCONCLUSIVE protects truth

Use INCONCLUSIVE when:
- instrumentation cannot distinguish hypotheses;
- protocol was contaminated;
- evidence is too weak;
- an upstream defect invalidates interpretation.

Do not convert uncertainty into a proxy PASS.

---

# 8. Qualified-baseline discipline

Future implementation should prefer:

- one **qualified baseline** branch/state;
- one isolated active run branch derived from its exact SHA.

A failed or inconclusive run should not silently contaminate the qualified baseline.

A PASS does **not** automatically become architectural truth.

Promotion occurs only when the parent gate/current campaign state explicitly accepts the result.

This preserves:
- clean recovery;
- cheap rollback;
- scientific provenance.

Exact branch naming can be chosen when implementation begins.
Do not create branch machinery merely for documentation work.

---

# 9. Owner-attention discipline

Owner attention is a scarce evidence channel.

Each run card declares:

### none
No Owner judgement is needed.

### optional
Owner interaction may reveal artifacts but is not needed for the run claim.

### required
The claim is experiential/product-level and cannot be promoted without Owner observation.

Do not ask Owner to:
- validate JSON;
- perform fixture campaigns;
- manually manufacture pressure;
- judge claims outside the run's evidence plane.

When Owner contact is required, provide the smallest natural surface that answers the question.

---

# 10. SPC / downstream strategic relevance

ReflexBrain may become a major donor to SPC.

That raises the required rigor.
It must **not** cause SPC-specific architecture to leak into every run.

Every completed run may record:

### Potential donor value
What invariant or competence might later transfer to SPC?

### What this does NOT establish
Which SPC claim remains completely open?

This field is informational only.

A run never PASSes because it looks strategically useful to SPC.

The best donor is a mechanism that survived its own honest pressure, not one designed around downstream expectations.

---

# 11. Anti-fragmentation rule

Small runs must still serve the North Star.

Before activation ask:

> Which material uncertainty in the current campaign/North Star does this run remove?

If the answer is weak:
do not run it.

We are not building a benchmark collection.

---

# 12. Anti-overplanning rule

Specify tightly only the next **1–3 runs**.

Everything later is a provisional pressure map.

A run may:
- remove a planned run;
- insert a new prerequisite;
- invalidate the parent specimen;
- reopen a supposedly settled V1 choice.

That is expected.

> A roadmap that never changes under experimental evidence is probably not learning enough.

## WIP limit

At any moment:

- **1 ACTIVE run maximum**
- **up to 2 PROPOSED next runs**
- everything else stays an uncommitted pressure map

Do not maintain parallel active research threads inside the same campaign unless Owner explicitly opens a separate independent campaign.

A newly discovered problem becomes:
- a note in the current result;
- or a future proposed run;

not an automatic second ACTIVE thread.

This is an attention/continuity safeguard, not a productivity metric.

---

# 13. Integration-pulse rule

Atomic runs can create integration debt.

Therefore the campaign must periodically ask whether already-qualified pieces still compose.

An **integration pulse** is a small INTEGRATION run with one question:

> Do the currently qualified pieces still preserve their claimed behavior when coupled, without inventing a new competence?

Rules:

- integrate only already-qualified pieces;
- add no new major authority seam;
- no polishing;
- no new problem-solving subsystem;
- if coupling reveals a missing competence, stop and open a separate future probe;
- integration FAIL does not erase the local PASSes; it proves the composition is unqualified.

Default cadence:

> after roughly 2–4 meaningful component runs, or earlier when a new interface could materially invalidate upstream evidence.

This is not a hard count.
The trigger is **new coupling risk**.

Examples:

- ecology + E0 body can be an early pulse;
- body + P0 sensorium can be another;
- concern + memory + CHECK requires another;
- full O-CTRL remains a later integration gate, not the first time components ever meet.

The purpose is to keep the organism visible throughout the campaign without turning every component run back into a full-stack experiment.

---

# 14. Revised first execution sequence — proposed, NOT AUTHORIZED

No implementation run is active.

The previous `OCTRL-R01 — M0-Lite Ecology Null` was still too broad because it mixed independent-process qualification, material composition, topology and legibility.

It is superseded by the smaller sequence below.

---

## OCTRL-E01 — Independent Mechanical Process Null

Type:
**PROBE**

### Primary question

Can one bounded, locally driven physical process continue without Owner/focal-agent input and produce persistent material displacement **without reducing to global timer choreography**?

### Build only

- minimal Rapier physical area sufficient for the mechanism;
- one shuttle/sweeper body;
- physical end conditions / rail constraints;
- one or a very small number of loose bodies;
- minimal visual observation surface.

No chokepoint.
No loop.
No actor cognition.
No B1 work.
No perception/memory.

### Manipulated uncertainty

The independent process itself.

### Evidence

Need at least one run where:

`bounded local drive -> physical shuttle motion -> contact -> loose-body displacement -> persistent changed material state`

and where interaction can alter actual shuttle timing/state relative to an unperturbed run.

### Control

Unperturbed/no-loose-body or static-process comparison as needed.

### PASS scope

A minimal non-agent physical process can create real persistent exogenous material change without a scenario-global phase oracle.

### FAIL

- motion is effectively open-loop timer choreography;
- persistent material effect requires another mechanism family;
- collisions are mechanically unstable/unusable;
- independent process cannot be made legible without solving broader ecology.

### Forbidden

- chokepoint/topology design;
- occlusion design;
- B1;
- P0/P1;
- concern;
- Local Brain;
- learning;
- plate/gate.

### Owner touchpoint

**none**

### Potential SPC donor value

Evidence that useful world pressure can originate from ordinary non-cognitive material processes rather than LLM/script events.

Does **not** establish a living world, resident agency or semantic pressure.

### Output

E01 PASS/FAIL/INCONCLUSIVE result + qualified/rejected mechanism SHA/artifact.

---

## OCTRL-E02 — SUPERSEDED BY E02a + E02b

The original E02 proposal was too broad because existence and robustness can fail independently.

See the concrete run cards under `docs/runs/`.

Historical text below is retained only as rationale, not activation authority.

Type:
**SUPERSEDED**

### Primary question

Can the qualified E01 process compose with only static geometry + loose bodies so that its ordinary physical consequences **persistently change a locally relevant passage/relation**, without introducing a second authored mechanism?

### Frozen

- E01 process mechanism;
- its drive law;
- no cognition.

### Add only

- minimal static geometry;
- one chokepoint or equivalent local passage;
- enough spatial structure to allow a blocker to matter;
- occlusion only if required to observe the intended material distinction, not yet as a cognition pressure.

### Evidence

Example causal chain:

`shuttle -> loose blocker -> chokepoint blocked/unblocked`

with persistent state after the immediate collision.

### Control

Same geometry with independent process disabled or blocker absent.

### PASS scope

Few physical rules compose into a materially meaningful topology/access change.

### FAIL

- requires plate/gate or another authored mechanism;
- topology changes are fragile/special-case;
- shuttle remains largely ornamental;
- result depends on hidden scripted state.

### Forbidden

- actor concern;
- search;
- perception system;
- B1 morphology redesign;
- semantic gate state.

### Owner touchpoint

**none** by default.

Optional only if causal legibility remains ambiguous after agent observation.

### Potential SPC donor value

Shows that autonomous pressure can emerge from world composition rather than explicit cognition events.

Does not establish actor-relative meaning.

---

## OCTRL-B01 — E0 Body Seam Transfer

Type:
**PROBE**

Runs only after the ecology gate accepts enough of E01/E02 to justify inhabiting it.

### Primary question

Can the already-qualified E0-style B0 body/actuation seam inhabit the new physical ecology **without controller redesign**, providing a clean body baseline before morphology experimentation?

### Frozen

- qualified ecology state;
- E0-style disc morphology;
- bounded forward force + turn torque concept.

### Build only

The minimum transplant/integration needed for:
- open locomotion;
- contact with loose body;
- passage through the qualified ecology.

Manual/agent driving is enough.

No autonomous Local Brain.

### PASS scope

The E0 body seam remains mechanically usable in the new ecology and can serve as the body control baseline.

### FAIL

The ecology/body integration itself requires material controller redesign.

Then body transfer becomes its own deeper problem before B1 comparison.

### Forbidden

- B1;
- P0/P1;
- concern;
- memory;
- autonomous navigation;
- recovery logic.

### Owner touchpoint

**optional**

Only for narrow controller/body-rule feel if machine/agent observation cannot resolve it.

### Potential SPC donor value

A stable embodied action seam that can later support Local Brain / SPC resident actuation.

Does not establish organism continuity or intelligence.

---

# 15. Near-future pressure map — deliberately NOT frozen

If E01/E02/B01 qualify, plausible next questions include:

- B02: B0 vs B1 morphology;
- P01: P0 private sensor authority;
- P02: P1 temporary continuity if P0 alone is insufficient;
- M01: minimal private relation memory;
- C01: concern acquisition/staleness without movement;
- C02: monitoring CHECK;
- C03: visible RESTORE;
- C04: bounded REACQUIRE;
- C05: RECOVER;
- I01: integrated O-CTRL;
- Q01: frozen G1–G5 qualification.

This is not a queue.

Do not execute it mechanically.

---

# 16. O-DEV is a new campaign, not a feature after O-CTRL

If O-CTRL qualifies:
stop.

O-DEV begins with new run framing.

Do not append learning-progress code to the integrated control organism by momentum.

O-DEV may reject parts of the O-CTRL substrate.

That is allowed.

---

# 17. Larger program ambition

Run decomposition must increase, not shrink, what we can responsibly attempt.

The current long arc remains:

1. honest embodied host;
2. self-directed developmental organism;
3. naturally recurring actor-relative semantic pressure;
4. learned ReflexBrain in shadow;
5. real downstream consumer value;
6. bounded causal authority;
7. cross-ecology / cross-actor generalization;
8. eventual donor value inside richer SPC/Feniks-like living worlds.

This is a direction, not a fixed roadmap.

The aim is not to ship a clever classifier.

It is to understand how reusable actor-relative meaning can become a **real organ of continuous embodied life**.

---

# 18. Current execution state

**NO RUN ACTIVE.**

Completed:
- OCTRL-E01 — PASS
- OCTRL-E02a — PASS
- OCTRL-E02b — PASS
- OCTRL-B01a — PASS
- OCTRL-B01b — PASS
- OCTRL-B01c — SCIENTIFIC FAIL / EXECUTION VALID

Canonical correction from B01c:

> researcher geometric OPEN/BLOCKED is not actor-relative effectivity truth for a movable obstacle.

Current next candidate:
- **OCTRL-B01d — Actor-Relative Resistance Signature — PROPOSED**

B01d should keep world/body/controller frozen and ask whether the material obstacle produces a stable difference in actual B0 progress/contact burden across a predeclared modest obstacle-position set.

Do not repair B01c by modifying physics.
