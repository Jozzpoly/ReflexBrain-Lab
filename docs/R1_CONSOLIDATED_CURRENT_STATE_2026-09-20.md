# ReflexBrain Lab — Consolidated Current State — 2026-09-20

## Purpose

ReflexBrain Lab is a deliberately separate experiment, not an integration project for the unfinished SPC or Companion runtimes.

The core research question is:

> Can a cheap, local, continuous semantic-reflex layer sit between actor-private embodied state and higher-level deliberation, adding meaningful appraisal without owning World truth, memory, deliberation, body control, or direct side effects?

The intended long-term stack remains conceptually:

`World/physics -> private perception -> local motor/routine brain -> semantic reflex/appraisal -> executive/cognition scheduler -> larger LLM when earned`

ReflexBrain must remain:

- actor-private;
- zero-authority during research;
- bounded and replaceable;
- fast/local enough for continuous or event-driven use;
- evidence-driven rather than benchmark-shaped.

## Hard boundaries

- World truth != actor perception != actor belief != remembered belief.
- Semantic evaluators never mutate World state directly.
- Hidden/unperceived World facts must not affect semantic output.
- Exact physical/directness facts should not be forced through language when actor-private structured state already contains them.
- DEV/TEST/OOD labels must never update TRAIN-only heads.
- OOD failures are falsifiers, not training labels.
- No LoRA, larger backbone, MLP, SPC/Companion integration, or direct authority is currently earned.

## R0 result

The first local-Qwen semantic/action readout campaign established useful runtime and methodology evidence but failed as the semantic reflex solution.

Stock/direct readouts investigated variants including:

- A–E immediate-response choice;
- semantic action selection;
- yes/no appraisal;
- bipolar poles.

They were not robust enough under label/order/prompt semantics to promote.

What R0 did validate:

- browser/WebGPU local inference path;
- actor-private serialization boundary;
- zero-authority shadow execution;
- same-state/counterfactual methodology;
- need to separate raw semantic appraisal from temporal Reflex Dynamics.

This motivated R1: stop asking a small generative LM to directly behave like the reflex; test whether a frozen semantic representation can support bounded learned appraisal.

## R1 representation

Current frozen semantic encoder:

- MiniLM-L3 ONNX q8;
- 384D semantic embedding;
- WebGPU browser execution.

Current useful hybrid representation:

- 384D semantic embedding;
- 12 explicit actor-private structured channels;
- total 396D.

The structured channels are justified for exact actor-private facts such as direct addressing and kinematics. Their demonstrated purpose is not generic quality improvement; they prevent semantic text embeddings from carrying information the local world model already knows exactly.

## Critical methodology corrections

### Lexical leakage

Early OOD results were too optimistic because several semantic pairs could be solved by exact-token memorization.

The benchmark was rebuilt with:

- matched physical/addressee state;
- same-token/bag-of-words constructions where possible;
- exact-token negative controls;
- hidden-World invariants.

Any pre-hardening pass-rate claims are historical only.

### Batch-layout confound

Embedding multiple states together in chunks of 8 changed tiny semantic margins when unrelated states were inserted before OOD.

Correctness qualification now uses:

`R1_LEARNED_HEAD_EMBEDDING_BATCH_SIZE = 1`

Per-state isolated embedding proved invariance: adding cognition-only states no longer changes unrelated attention/social/interrupt/threat OOD margins.

Any cross-layout conclusions produced with chunkSize=8 are superseded.

## Isolated evidence authority before OOD v3

With hardened OOD v2:

| representation | supervision | TRAIN | DEV | TEST | OOD |
| --- | --- | ---: | ---: | ---: | ---: |
| encoder-only | base | 11/11 | 11/11 | 10/11 | 14/18 |
| hybrid | base | 11/11 | 11/11 | 11/11 | 12/18 |
| encoder-only | expanded semantic | 16/16 | 10/11 | 10/11 | 17/18 |
| hybrid | expanded semantic | **16/16** | **11/11** | **11/11** | **18/18** |
| hybrid | cognition breadth | 19/19 | 10/11 | 10/11 | 18/18 |

The useful checkpoint was therefore:

**frozen MiniLM + isolated embedding + hybrid structured representation + expanded 16-relation TRAIN + prototype direction head**

Cognition-breadth was a negative experiment: more heterogeneous cognition positives regressed DEV/TEST rather than improving the already-passing OOD.

## OOD v3 falsification

The useful checkpoint was frozen before OOD v3.

OOD expanded to:

- 30 OOD states;
- 26 OOD relations;
- 18 semantic directional OOD relations resistant to the exact-token negative control.

Frozen current-best on OOD v3:

- TRAIN 16/16;
- DEV 11/11;
- TEST 11/11;
- OOD **21/26**.

The five failures were:

- operative/current order > archived order, interrupt;
- negation-scope unsafe > safe, interrupt;
- negation-scope unsafe > safe, threat;
- physical hazard > administrative deadline, threat;
- unresolved routing > established routing, cognition.

The deterministic regularized linear-ranking head also produced **21/26** and the same five qualitative failures.

Conclusion: prototype averaging versus pairwise logistic linear optimization is not the material bottleneck.

## Pragmatic TRAIN breadth experiment

Independent TRAIN-only pragmatic families were added without training on OOD v3:

- active directive > retired directive, interrupt;
- unsafe circuit > safe circuit, interrupt;
- unsafe circuit > safe circuit, threat;
- immediate injury > immediate filing, threat.

### Prototype

- TRAIN 20/20;
- DEV **10/11**;
- TEST 11/11;
- OOD **20/26**.

DEV regression:

- `dev:warning-interrupt-over-request`: -1.264e-2.

OOD failures:

- warning interrupt > secured control: -3.3122e-3;
- warning threat > secured control: -1.0214e-2;
- indirect-warning threat > earlier control: -2.4651e-3;
- operative-order interrupt > archived: -7.1675e-4;
- hazard threat > deadline: -6.7868e-3;
- routing cognition: -1.4546e-3.

### Linear-ranking control

- TRAIN 20/20;
- DEV **10/11**;
- TEST 11/11;
- OOD **20/26**.

It shows the same qualitative failure pattern and the same DEV warning-interrupt regression.

Therefore pragmatic breadth is **not promoted**.

## TRAIN-direction coherence

The latest evaluation-only audit measures pairwise cosine between normalized TRAIN directional deltas.

Pragmatic-breadth geometry:

| dimension | directions | pairs | min | mean | max |
| --- | ---: | ---: | ---: | ---: | ---: |
| attention | 1 | 0 | n/a | n/a | n/a |
| interrupt | 5 | 10 | **-0.090** | **+0.022** | **+0.183** |
| social | 1 | 0 | n/a | n/a | n/a |
| threat | 6 | 15 | **-0.090** | **+0.011** | **+0.169** |
| cognition | 2 | 1 | **+0.166** | **+0.166** | **+0.166** |

Multiple nominally same-axis interrupt/threat examples are approximately orthogonal or negatively aligned.

This explains the observed pattern:

- adding one kind of semantic supervision can repair a related OOD family;
- the same added direction can rotate the aggregate scorer away from older DEV/OOD families;
- switching prototype -> regularized linear ranking does not fix the conceptual conflict.

## Current strongest interpretation

The project has produced positive evidence for the **existence and usefulness of a local semantic layer**, but not for the current five-score ontology as the final reflex representation.

Supported:

1. a tiny frozen encoder can carry reusable semantic information;
2. independent pairwise supervision can expose real held-out semantics;
3. explicit actor-private structured features are valuable for exact embodied facts;
4. hidden World truth can remain strictly excluded;
5. isolated local inference is practical enough for continued research;
6. simple transparent heads are sufficient to expose representation/supervision failures.

Not supported:

1. that `attention / interrupt / social / threat / cognition` are five clean one-dimensional semantic axes;
2. that more heterogeneous examples monotonically improve those axes;
3. that a more powerful head would solve the current conflict;
4. calibrated probabilities;
5. temporal/embodied robustness;
6. production integration or actor authority.

## Current research frontier

The earned next investigation is an **appraisal-ontology audit**, not another capacity increase.

Questions to resolve:

- What does each current signal actually control downstream?
- Which concepts are semantic appraisal versus scheduler/executive consequences?
- Is `interrupt` improperly collapsing:
  - attention capture;
  - task-switch pressure;
  - operative-command relevance;
  - temporal urgency?
- Is `threat` improperly collapsing:
  - perceived physical danger;
  - caution;
  - urgency;
  - uncertainty?
- Which counterfactual families are truly commensurable enough to share one scalar direction?
- Should the semantic layer emit several narrower latent/appraisal factors and let deterministic Reflex Dynamics / executive logic combine them later?

Do not use frozen OOD failures as direct TRAIN labels while answering those questions.

## Repository state

Repository: `Jozzpoly/ReflexBrain-Lab`

Active research branch at consolidation:

`experiment/r1-expanded-representation-ab-v1`

Qualified pre-consolidation HEAD:

`dddd7752406027c6b4cd51777f367ca088fb0c89`

Latest evidence log:

`docs/R0_LIVE_EVIDENCE_2026-09-20.md`

The project remains a research lab. No merge into a production NPC project is intended at this stage.
