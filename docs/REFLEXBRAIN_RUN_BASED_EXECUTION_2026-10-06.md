# ReflexBrain — Run-Based Execution Architecture — 2026-10-06

Status: **CURRENT EXECUTION METHODOLOGY · IMPLEMENTATION STILL PAUSED**

This document changes **how work is executed**, not the long-term ambition.

Primary design authority remains:

`docs/OCTRL_M0_LITE_IMPLEMENTATION_CONTRACT_2026-10-06.md`

The contract describes the bounded O-CTRL specimen.

It must **not** be treated as one implementation run.

---

# 1. Core correction

ReflexBrain has repeatedly mixed several scales of uncertainty in one experiment.

A single specimen or campaign has often attempted to decide simultaneously:

- what the organism is;
- what world it needs;
- what body it has;
- what it can perceive;
- what it remembers;
- why anything matters;
- how continuation works;
- what learning should do;
- how success is measured.

This creates two failure modes:

1. **causal ambiguity** — if the result changes, we cannot tell which assumption caused it;
2. **scope gravity** — every missing competence is repaired inside the same specimen until the experiment becomes a project/platform.

The correction is:

> **ambition stays global; uncertainty is resolved locally.**

---

# 2. Work hierarchy

## North Star

Long-term ReflexBrain question:

> Can a cheap local learned mechanism extract useful, generalizable actor-relative meaning from temporal private experience inside a genuinely ongoing embodied actor, without becoming World authority, factual memory, the whole planner or motor controller?

This may become more ambitious over time.

Do not shrink it merely to make the next run easy.

## Campaign

A campaign resolves one broad prerequisite or competence family.

Current campaign:
**host/substrate sufficiency**.

Current control sequence:
**O-CTRL -> O-DEV**.

Future campaigns may include:
- semantic-pressure discovery;
- learned ReflexBrain shadow competence;
- causal authority;
- cross-ecology/generalization;
- social/peer pressure.

These are not current implementation commitments.

## Run

The atomic unit of substantial work.

A run asks **one primary causal question**.

A run may contain several engineering steps only when all exist to answer that one question.

A run must have:
- one current qualified input state;
- one main manipulated uncertainty;
- explicit fixed assumptions;
- one decisive falsifier / stop condition;
- bounded artifacts;
- a final PASS / FAIL / INCONCLUSIVE judgement;
- exact recovery state.

## Gate

A gate combines evidence from several runs and decides whether a larger claim/next campaign is earned.

Examples:
- B1 body accepted or fallback to B0;
- private sensor boundary qualified;
- O-CTRL substrate qualified;
- O-DEV warranted;
- learned ReflexBrain pressure exists.

A gate is not a run.

---

# 3. Run rules

## R1 — one primary unknown

If a run asks two questions that can fail independently, split it.

Bad:

> build M0, B1, P1 and autonomous control and see whether organism works.

Good:

> does M0-Lite create legible independent material reconfiguration before cognition exists?

## R2 — preserve a control whenever cheap

Prefer comparisons where only one meaningful dimension changes.

Examples:
- B0 vs B1 body;
- static ecology vs M0-Lite;
- P0 vs P1;
- concern present vs ablated.

Do not make every comparison a permanent product feature.

## R3 — no downstream repair inside current run

If the current run reveals a missing later competence:

record it.

Do not automatically implement it.

Example:
if M0-Lite reveals that later navigation will be hard, do not build navigation during the ecology run.

## R4 — FAIL is completion

A decisive FAIL ends the run.

Do not keep polishing until it passes.

The next run may:
- replace the hypothesis;
- isolate the failure;
- fall back to a control;
- widen/narrow the claim.

## R5 — INCONCLUSIVE is a real result

If instrumentation/ecology cannot answer the question:
mark INCONCLUSIVE.

Do not manufacture a PASS through proxy metrics.

## R6 — Owner plane is scoped per run

Only ask Owner questions the run can support.

Examples:

Body run:
- does movement/contact have coherent rules?

Not:
- does organism feel alive?

O-DEV later may support broader experiential questions.

## R7 — freeze before held-out qualification

Exploration/tuning occurs before policy/mechanism freeze.

Held-out causal evidence comes after freeze.

Do not train on the falsifier.

## R8 — write checkpoint before moving on

A material run result must be committed before the next run starts.

The conversation is never the only copy of:
- result;
- decision;
- surprise;
- next uncertainty.

---

# 4. Run lifecycle

Every run should fit this lifecycle.

## A. Recover

Read:
- `docs/CONTINUE_HERE.md`;
- this run architecture;
- current run card;
- only the deeper evidence needed for the question.

Do not front-load the entire project corpus.

## B. Frame

Write a compact run card:

### Question
one sentence.

### Why now
which current uncertainty it removes.

### Frozen inputs
what must not change.

### Manipulated variable
what is allowed to change.

### Evidence
what observation can answer the question.

### Falsifier
what ends the run as FAIL.

### Forbidden scope
what must not be solved inside this run.

### Output
what artifact/result must exist at completion.

## C. Execute

Work directly toward the evidence.

Avoid infrastructure unless required by the run question.

For long runs:
checkpoint after each material boundary.

## D. Judge

Return exactly one:

- **PASS**
- **FAIL**
- **INCONCLUSIVE**

Then state:
- evidence;
- scope of claim;
- unexpected findings;
- debt created;
- whether the parent contract needs correction.

## E. Persist

Commit:
- result;
- exact SHA;
- artifacts;
- next candidate question.

## F. Stop

Do not automatically start the next run in the same momentum.

Re-evaluate direction first.

---

# 5. O-CTRL contract decomposition

The frozen O-CTRL contract remains campaign-level design authority.

Its old S0-S4 staging is now interpreted as **groups of runs**, not monolithic implementation phases.

The later run map below is provisional.

Only the first three runs are currently shaped tightly.

---

# 6. First three implementation runs — proposed, NOT YET AUTHORIZED

Implementation remains paused by Owner direction.

These are the first runs **if/when** execution is deliberately authorized.

## OCTRL-R01 — M0-Lite Ecology Null

### Question

Can the smallest M0-Lite world produce **legible, persistent, independent material reconfiguration** without any organism intelligence?

### Build only

- Rapier M0-Lite geometry;
- occlusion-relevant layout;
- loop/chokepoint;
- loose bodies;
- one bounded physical shuttle;
- simple visual surface.

Use B0/E0 body only if an actor/body is needed for manual observation; autonomous Local Brain is absent.

### Required evidence

At least one lawful causal chain:

`shuttle -> loose body / target / blocker -> persistent changed relation or chokepoint`

with no Owner/focal-actor causation.

### Controls

Static-shuttle ablation.

### FAIL if

- shuttle is decorative;
- world change reduces to timer choreography;
- material reconfiguration is visually illegible;
- achieving independent change requires a second mechanism family.

### Forbidden

- B1 redesign;
- P0/P1;
- memory;
- concern;
- Local Brain;
- learning;
- gate/plate subsystem.

### Output

One qualified physical ecology specimen or a rejection/correction of M0-Lite.

---

## OCTRL-R02 — Body Morphology A/B

Runs only if R01 leaves an ecology worth inhabiting.

### Question

Does minimal asymmetric morphology B1 add **useful orientation/body-scaled physical distinctions** under the same actuation seam without introducing dominant mechanical pathology?

### Frozen

- R01 ecology;
- E0-style drive/turn actuation concept;
- no cognition/perception changes.

### Compare

- B0 E0 disc;
- B1 minimal asymmetric rounded rigid body.

### Evidence cases

- open locomotion;
- passage/alignment;
- one physical push/contact;
- basic external shove if useful.

### PASS scope

B1 creates legible body-scaled relations while remaining mechanically stable enough for later organism work.

### FAIL

B1 mainly adds:
- snagging;
- instability;
- tuning burden;

without useful new distinctions.

Then O-CTRL uses B0.
Morphology moves to a separate future probe.

### Forbidden

- tuning separate intelligent controllers;
- concern logic;
- P1;
- navigation/recovery.

---

## OCTRL-R03 — Private Sensor Boundary

Runs only from the qualified R01 + selected R02 body state.

### Question

Can the actor receive useful **local physical evidence and occlusion** without private state learning hidden World identity/position?

### Build only

P0:
- proprioceptive delta;
- contact;
- coarse egocentric geometry;
- visible physical signatures/motion;
- occlusion.

No P1 yet unless P0 cannot be evaluated without temporary continuity.

### Evidence

Paired visible/occluded World changes.

Actor-facing P0 must:
- change only when lawful sensor relation changes;
- not expose World IDs;
- not update hidden object position;
- preserve the required body/self signals.

### FAIL

Any actor-facing path depends on:
- hidden external-object World coordinate;
- scene identity;
- World entity ID;
- hidden collision map.

### Forbidden

- concern;
- long-term memory;
- search;
- RESTORE;
- learning;
- semantic object roles.

### Output

Qualified P0 sensor boundary or a redesign before higher cognition exists.

---

# 7. Later O-CTRL run map — deliberately provisional

Do **not** freeze these now.

Their exact shape must be updated from R01-R03 evidence.

Likely sequence:

### R04 — P1 temporary continuity
Question:
does adjacent-tick tracklet scaffolding add needed tractability without World-ID leakage?

### R05 — private concern acquisition / memory semantics
Question:
can T0 target/dock binding and relation support/staleness/contradiction exist from legal evidence only, without autonomous movement?

### R06 — CHECK / monitoring
Question:
can evidence freshness produce a legal re-check without hidden World notification or performative wandering?

### R07 — visible RESTORE
Question:
can one currently visible violated relation be restored through material body/contact without semantic push authority?

### R08 — local REACQUIRE
Question:
can a checked-absent target be found within a declared local search envelope without global map/route oracle?

### R09 — RECOVER
Question:
can temporary and persistent obstruction alter ongoing local control without thrash or sticky infinite pushing?

### R10 — integrated O-CTRL
Question:
do individually qualified pieces remain coherent when coupled?

### R11 — frozen G1-G5 qualification
Question:
does the integrated control organism survive the campaign-level causal gates after policy freeze?

These are hypotheses about execution order, not commitments.

A run may disappear if earlier evidence makes it unnecessary.

A new run may be inserted only when a newly discovered uncertainty has material veto power.

---

# 8. O-DEV should be a new campaign sequence, not "next feature"

If O-CTRL qualifies:

stop.

Do not simply append learning-progress code.

Open an O-DEV campaign with its own runs.

Likely questions later:

- what is the minimal sensorimotor representation for competence learning?
- can learning progress beat random/fixed exploration under noisy-TV controls?
- does developmental history change ordinary later behavior?
- is representation doing the motivation's work?
- does O-DEV create new actor-relative semantic pressure absent from O-CTRL?

O-DEV may invalidate parts of the O-CTRL substrate.

That is allowed.

O-CTRL is a control, not architecture destiny.

---

# 9. Larger program ambition

Run decomposition must not shrink the program.

The intended long arc is more ambitious than one O-CTRL organism:

1. **honest embodied host**
2. **self-directed developmental organism**
3. **naturally recurring actor-relative semantic pressure**
4. **learned ReflexBrain in shadow**
5. **causal downstream value under bounded authority**
6. **cross-ecology / cross-actor generalization**
7. **eventual integration into richer SPC/Feniks-like living worlds**

The sequence is not a fixed roadmap.

Each level must earn the next.

The ambition is:

> understand how reusable actor-relative meaning can arise inside continuous embodied life strongly enough that a small learned mechanism becomes a real organ rather than a classifier, scheduler or prompt trick.

---

# 10. Anti-fragmentation rule

Smaller runs must not become disconnected micro-benchmarks.

Every run must explicitly answer:

> Which uncertainty in the North Star does this remove?

If the answer is weak:
do not run it.

The campaign/gate layer preserves the larger organism question.

---

# 11. Anti-overplanning rule

Only the next **1–3 runs** should be specified tightly.

Later runs remain provisional.

Reason:

The organism should be allowed to falsify our roadmap.

A plan that survives every experiment unchanged is probably not learning enough from the experiments.

---

# 12. Current execution state

No run is active.

Implementation remains **PAUSED**.

If/when Owner deliberately authorizes implementation, the proposed first run is:

**OCTRL-R01 — M0-Lite Ecology Null**

—not “implement O-CTRL”, not “start S0”, and not “build the organism”.

After R01:
stop, judge, persist, reconsider.
