# MEDIUM-D/R0 — Candidate Owner Experiment Grammar — 2026-10-08

Status: **DESIGN RESEARCH · CANDIDATE GRAMMAR · NO UI IMPLEMENTATION**

Parent evidence:
- Owner experimental-medium verdict on C01 replay: FAIL;
- MEDIUM-A interaction archaeology;
- takeover/release archaeology;
- MEDIUM-C/R4 exact fork/provenance;
- MEDIUM-C/R5 exact actor-private causal moment.

Primary question:

> Can a small, layer-honest set of experiment operations express the real historical/current Owner workflows without turning every experiment into a special-case scenario button?

---

# 1. Default state is WATCH

The Owner should not need to start an "experiment mode".

The normal condition is:

> **a World/specimen is already running.**

Observation is not a command.

This matters because click-driven R2 failed partly by making Owner input the scheduler of interesting events.

The grammar begins only when Owner decides something is worth preserving/challenging.

---

# 2. Candidate verb set

Current candidate:

> **MARK → FORK → INTERVENE → RELEASE → RUN → COMPARE → NOTE → PROMOTE**

Not every experiment uses every verb.

These are conceptual causal operations, not final button labels.

---

## 2.1 MARK

Meaning:

> capture an exact causal moment without changing the trajectory.

Requires:
- versioned causal moment;
- material physics;
- World/process state;
- relevant occupant-private state;
- host bindings;
- provenance.

MARK must not:
- pause by default;
- alter actor memory;
- create a scientific claim;
- copy researcher truth into private state.

Historical relation:
- this is what old debug screenshots/replays could not guarantee.

Current evidence:
- MEDIUM-C/R5 says the underlying exact causal moment is technically plausible in a defended donor.

---

## 2.2 FORK

Meaning:

> instantiate two or more independent future histories from one exact marked moment.

Invariant:
- branches are causally identical at fork;
- branch metadata/provenance itself may not perturb simulation.

A fork is not:
- duplicated screenshots;
- restarting a similar scene;
- re-seeding approximations.

Current evidence:
- R4/R5 provide exact developer-level fork evidence.

---

## 2.3 INTERVENE

Meaning:

> intentionally change one declared causal layer in one history.

Every intervention must declare its **authority layer**.

Candidate layer classes:

### MATERIAL
Changes World/body physically.

Examples:
- external force;
- physical grab/constraint;
- moving a material object;
- adding/removing material obstruction.

Must not automatically:
- change private memory;
- announce what happened to actor;
- label cause.

### MOTOR_AUTHORITY
Changes who/what supplies legal actuator demand.

Examples:
- temporary Owner takeover;
- suppress local motor output;
- substitute commands through the same actuator seam.

Must distinguish:
- host provenance knows Owner acted;
- actor-private knowledge of external authority is not free.

### PRIVATE_RESEARCH_CUT
Directly changes actor-private state for controlled comparison.

Examples:
- memory ablation;
- private-state reset.

This is **research authority**, not an ordinary World event.

It must be visually/provenance-marked as such.

### WORLD_REPLACEMENT
Replace/reset material World while preserving declared occupant-private state.

Useful for historical "same brain, fresh World" question.

This is a major causal intervention, not ordinary environment dynamics.

### OCCUPANT_REPLACEMENT
Replace/reset occupant-private state while preserving material World.

Useful for historical "same World, fresh brain/private state" question.

The actual private reset boundary remains occupant-version-specific.

---

# 3. RELEASE

Meaning:

> end a bounded external intervention and return authority/continuation to ordinary running mechanisms.

RELEASE is first-class because historical Owner value appears strongly tied to:

> intervention → release → autonomous aftermath.

Examples:
- Owner stops dragging/restraining an object;
- motor takeover ends;
- temporary channel cut ends.

RELEASE records:
- causal tick;
- intervention identity;
- what authority ended.

RELEASE must not tell actor:
- "Owner released you";
- "that action was external";
unless the actor can infer that through legal private evidence.

RELEASE is not needed for instantaneous interventions such as one impulse.

---

# 4. RUN

Meaning:

> allow one or more histories to continue under their ordinary rules.

Modes are experiment-host choices, not actor knowledge:

### independent
branches run freely.

### synchronized causal steps
A/B advance equal tick counts for clean comparison.

Potential future stop conditions:
- manual stop;
- elapsed causal ticks;
- first divergence in selected layer;
- first actor-private event;
- first material event;
- bounded timeout.

Danger:

A "run until interesting" oracle could become hidden researcher semantics.

Stop conditions must use declared microscope criteria and must not alter actor behavior.

---

# 5. COMPARE

Meaning:

> inspect how two causal histories diverged.

The primary comparison should not be "diff every variable".

Prefer **first-divergence ladder**:

1. intervention/provenance difference;
2. actor-private state/evidence divergence;
3. motor-demand divergence;
4. body/material divergence;
5. later private consequence;
6. longer trajectory difference.

This directly supports ReflexBrain questions such as:
- did private history diverge before action?
- did World change without actor knowing?
- did Owner-caused motion get misattributed?
- did two identical current observations produce different future behavior?

COMPARE must keep layers visually distinct.

---

# 6. NOTE

Meaning:

> attach Owner interpretation/verdict to a moment, interval or comparison.

Examples:
- "this looks like wall-clinging";
- "I think the actor noticed the obstruction";
- "branch B feels more purposeful";
- "this behavior is experimentally worthless";
- "repeat this with body X".

NOTE is:
- valuable qualitative evidence;
- project truth about Owner observation when explicitly framed as such.

NOTE is not:
- causal state;
- actor knowledge;
- machine PASS.

Owner verdict may override product/experiential claims but does not erase narrower mechanistic evidence.

---

# 7. PROMOTE

Meaning:

> turn a free-play observation into a candidate reproducible scientific question.

PROMOTE should produce a **candidate falsifier package**, not a PASS.

Candidate package may contain:
- root moment ID/build/schema;
- branch ancestry;
- declared intervention;
- bounded observation window;
- observed first divergence;
- Owner note;
- candidate hypothesis;
- unresolved controls.

A later research run still needs:
- frozen question;
- PASS/FAIL/INCONCLUSIVE criteria;
- independent CI/evidence.

PROMOTE must never silently convert exploration into qualification.

---

# 8. Red-team against real workflows

## Workflow A — material perturb + release

Desired:
Owner moves/grabs a body, stops touching it, watches later consequence.

Grammar:

`WATCH → MARK? → INTERVENE[MATERIAL] → RELEASE → RUN → NOTE`

Optional:
`FORK` before intervention to compare untouched history.

No new verb required.

**ADEQUATE.**

---

## Workflow B — historical motor takeover

Desired:
Owner temporarily drives the body through actuator seam, then gives control back.

Grammar:

`MARK → FORK? → INTERVENE[MOTOR_AUTHORITY] → RUN → RELEASE → RUN → COMPARE → NOTE`

Research provenance knows authority changed.
Actor-private state receives only its legal motor/proprioceptive/sensory consequences.

No semantic "Owner controlling you" operation required.

**ADEQUATE as grammar; organism self/world semantics remain open.**

---

## Workflow C — C01/R5 memory ablation

Desired:
same World/current P0, one history retains private memory, one does not.

Grammar:

`MARK → FORK(A,B) → INTERVENE[B:PRIVATE_RESEARCH_CUT] → RUN[sync] → COMPARE[first divergence]`

Observed R5:
- private intervention tick 200;
- motor/physical divergence tick 231.

No scenario-specific "disable C01 memory" verb needed.

**ADEQUATE.**

---

## Workflow D — same brain/private state, fresh World

Historical Playground donor:
reset World while preserving brain.

Grammar:

`MARK → FORK → INTERVENE[B:WORLD_REPLACEMENT] → RUN → COMPARE → NOTE`

Open issue:
what exact World replacement/reset means for each specimen version.

Grammar does not solve snapshot semantics; it only names the causal layer.

**ADEQUATE conceptually, implementation unresolved.**

---

## Workflow E — same World, fresh private state

Grammar:

`MARK → FORK → INTERVENE[B:OCCUPANT_REPLACEMENT] → RUN → COMPARE → NOTE`

Open issue:
occupant-specific reset constructor/schema.

R5 argues against generic "clear all memory" assumptions.

**ADEQUATE conceptually, implementation unresolved.**

---

## Workflow F — actor motor paused, ecology continues

Current Field donor:
motor authority disabled while World process steps.

Grammar:

`INTERVENE[MOTOR_AUTHORITY:suppress] → RUN → RELEASE → RUN → COMPARE?`

This correctly exposes why current Field label "Actor control OFF" was too broad:
the intervention targets motor authority, not sensor/private clock.

**ADEQUATE and clarifying.**

---

## Workflow G — evidence replay only

C01 synchronized replay has no new intervention.

Grammar:

`MARK(existing frozen run) → COMPARE → NOTE`

This explains why it is useful evidence but weak Owner experimental agency:
it begins after the causal questions/interventions are already fixed.

**ADEQUATE explanatory distinction.**

---

# 9. Anti-special-case test

Current candidate grammar expresses all tested workflows without adding:

- HIDE_TARGET;
- START_CHECK;
- RESET_BRAIN button semantics;
- TAKEOVER as a magical monolithic mode;
- ORGANISM_PASS;
- "make actor know";
- "reacquire object";
- "trigger curiosity".

This is a positive result.

But INTERVENE is intentionally constrained by declared causal layer so it does not become a meaningless "do anything" escape hatch.

---

# 10. Dangerous ambiguities still open

## 10.1 MATERIAL drag vs physical grab

Direct setTranslation/teleport and a real physical grab are different interventions.

Both can fit MATERIAL, but provenance must distinguish:
- authoritative pose edit;
- force;
- impulse;
- constraint/grab.

Do not hide these under one visual gesture if causal interpretation matters.

## 10.2 MOTOR_AUTHORITY vs external physical manipulation

Owner pushing actor's body is MATERIAL.

Owner supplying actuator demand is MOTOR_AUTHORITY.

They produce different self/world evidence.

Do not merge.

## 10.3 private cut vs actor experience

A memory ablation is a microscope/research operation.

It is not something the actor "experiences" unless the architecture itself includes such an internal process.

## 10.4 reset semantics

WORLD_REPLACEMENT / OCCUPANT_REPLACEMENT name causal ownership, not universal reset implementation.

Every specimen version must declare what state is replaced/preserved.

---

# 11. First-divergence ladder as core workbench primitive

The strongest cross-project mechanism emerging from R3/R4/R5 is not a dashboard.

It is:

> **show me the first point at which these two histories stop being the same, and tell me which causal layer diverged first.**

Candidate layer ordering:
1. provenance/intervention;
2. private evidence/history;
3. local decision/motor demand;
4. body/material World;
5. subsequent perception/history;
6. long-horizon trajectory.

This directly serves Owner falsification.

It may deserve priority over:
- graphs;
- full event timeline;
- generic telemetry inspector.

---

# 12. Candidate minimal Owner workflow

Not a UI spec.

Potential natural flow:

1. **watch**
2. something interesting happens
3. **mark**
4. **fork**
5. change one thing in B
6. **release / run**
7. medium automatically surfaces first divergence
8. Owner opens microscope only if useful
9. **note**
10. optionally **promote** as candidate research question

This is close to the long-term medium North Star and uses the causal machinery already defended by MEDIUM-C.

---

# 13. R0 judgement

**CANDIDATE GRAMMAR: ADEQUATE ENOUGH TO CONTINUE DESIGN RESEARCH.**

It has not been Owner-tested.

It is not frozen.

No UI implementation follows automatically.

The next MEDIUM-D pressure should test whether this grammar can support:
- low attention burden;
- direct spatial interaction;
- unscripted Owner question generation;
- clear first-divergence comparison;

without turning the Habitat into an experiment form/dashboard.

A useful next run is likely a **paper/live interaction storyboard or developer-only micro-prototype of MARK/FORK/COMPARE**, not a full Workbench.

Do not implement PROMOTE, storage or complex UI yet.
