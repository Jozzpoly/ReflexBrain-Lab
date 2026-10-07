# MEDIUM-D/R1 — Developer-Only Experiment Grammar Microprobe — ARMED — 2026-10-08

Status: **ARMED · DESIGN/ARCHITECTURE PROBE · NO OWNER UI**

Parent evidence:
- MEDIUM-D/R0 candidate grammar;
- MEDIUM-C/R5 exact actor-private causal moment.

## Primary question

Can the candidate experiment grammar execute one real causal comparison on an exact R5 moment using only:

> MARK → FORK → INTERVENE → RUN → COMPARE → NOTE

without:
- scenario-specific commands;
- changing the actor/World mechanism;
- letting notes/provenance drive simulation;
- collapsing private, motor and material divergence into one generic "changed" state?

## Frozen donor

Use the R5 C01-lineage moment at tick 200:
- current P0 empty;
- private lastSeen from tick 51;
- World event already applied;
- no CHECK yet.

## Frozen experiment

### MARK
Capture M200 exactly.

### FORK
Restore A and B from M200.

### INTERVENE
Branch B only:
- layer = PRIVATE_RESEARCH_CUT
- operation = clear private lastSeen
- provenance event at tick 200.

Branch A unchanged.

No scenario-specific "disable C01 memory" command is permitted in the transcript vocabulary.

### RUN
Advance A/B synchronously for 180 ticks.

### COMPARE
Track first divergence separately for:
1. private state;
2. motor demand;
3. material body/target state;
4. current legal P0.

Expected qualitative causal ordering:
- private divergence exists at intervention tick 200;
- motor divergence occurs later, when A's stale-evidence concern reaches CHECK;
- material divergence does not precede motor divergence;
- P0 divergence, if any, occurs no earlier than the physical consequences that create it.

The test does **not** precommit the exact P0-divergence tick.

### NOTE
Attach one Owner-style qualitative note to the comparison record after the run.

The note must not:
- enter ExperimentMoment provenance;
- alter either branch;
- alter first-divergence results.

## Control

Create a second A/B fork from the same M200 with:
- no causal intervention;
- one NOTE on branch B / comparison metadata only.

Run synchronously for the same horizon.

PASS requires:
- no private/motor/material/P0 divergence from note-only metadata.

## PASS

All required:
- donor remains deterministic;
- transcript uses only R0 grammar verbs;
- no special scenario verb appears;
- private first divergence = tick 200;
- first motor divergence exists and is > 200;
- first material divergence >= first motor divergence;
- P0 divergence, if present, >= first material divergence;
- branch-B intervention provenance is branch-local;
- Owner NOTE is non-causal;
- note-only control remains exact;
- repeated full microprobe yields same transcript/ladder.

## FAIL

Any required property fails under valid R5 apparatus.

Do not rescue by:
- changing C01 threshold/capture tick;
- adding a C01-specific grammar verb;
- treating NOTE as provenance/causal state;
- merging layers into one generic diff;
- retuning branch run duration after result.

## Maximum claim

PASS would establish only:

> the candidate MEDIUM-D grammar can represent one real exact history-ablation experiment with a useful first-divergence ladder and non-causal Owner annotation, without scenario-specific UI semantics.

Does NOT establish:
- Owner usability;
- final Workbench UX;
- material/takeover workflows in implementation;
- PROMOTE semantics;
- storage;
- organism value;
- scientific qualification of free play.

No Pages/UI changes.
