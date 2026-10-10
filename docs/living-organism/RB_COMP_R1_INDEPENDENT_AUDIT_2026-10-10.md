# RB-COMP/R1 — Living Organism Runtime A Independent Qualification Audit — ARMED — 2026-10-10

Status: **ARMED · AUDIT-ONLY · NO RUNTIME CHANGE · NO CANONICAL MERGE INTENT**

Source under audit:
- branch `research/living-organism-runtime-a-2026-10-08`
- audit branch created directly from that source;
- this PR targets the source branch itself, not canonical ReflexBrain.

## Purpose

Independently determine what Living Organism Runtime A actually establishes.

The campaign contains a broad set of promising and negative findings, but its source head had no GitHub Actions evidence before this audit.

R1 must separate:

- executable source truth;
- deterministic/mechanistic evidence;
- self-authored campaign interpretation;
- transferable donors;
- architecture-specific implementation;
- negative evidence;
- unqualified claims.

## Frozen audit questions

### Q1 — execution

Does the unchanged Living Organism source pass the repository's normal full `yarn run check` under GitHub Actions?

Required:
- TypeScript;
- full Vitest suite;
- Vite build.

No test exclusions.

### Q2 — donor decomposition

For each major campaign family, identify:

- actual mechanism;
- positive narrow evidence;
- negative/control evidence;
- domain limits;
- whether the finding is transferable without importing architecture.

Families:
1. retinal/private sensory substrate;
2. sensory clock/history;
3. active inspection/private vision;
4. approach/contact episode representation;
5. sensory prediction;
6. action-conditioned prediction;
7. body-motion prediction;
8. contact/touch interruption;
9. proprioceptive braking;
10. recovery/continuation.

### Q3 — false ontology risk

Identify places where names such as:
- concern;
- approach;
- prediction;
- body model;
- interruption;
- inspection;
could overstate what the mechanism actually knows.

No abstraction is promoted merely because a type/class exists.

### Q4 — transfer candidates

For each transferable donor, classify potential use:

- Foundation-compatible;
- Organism-frontier only;
- Negative/falsifier only;
- Do not transfer.

### Q5 — current best new ReflexBrain question

After source verification and decomposition, decide whether the strongest new ReflexBrain-native pressure is:

- competence-domain failure;
- actor-relative relevance;
- owned-reason formation;
- active information acquisition;
- another question revealed by the audit.

Do not choose by novelty.

## Hard boundaries

This audit does NOT authorize:
- merging Living Organism A into canonical ReflexBrain;
- making its runtime the new organism;
- treating all passing tests as product/life evidence;
- replacing G5A;
- importing learned models before controls/baselines are reviewed;
- preserving class/module boundaries as architecture.

Owner product judgement remains superior to machine PASS.

## PASS

R1 audit PASS requires:
- independent exact-source CI evidence;
- source/document/test claims reconciled;
- major positive and negative findings decomposed;
- donor/failure ledger produced;
- no architecture promotion by inertia.

## FAIL / INCONCLUSIVE

FAIL if:
- source no longer builds/tests;
- key reported finding is contradicted by executable evidence;
- donor boundaries cannot be separated from architecture without new experiments.

INCONCLUSIVE if:
- source executes but available tests cannot distinguish a major claimed mechanism from a simpler baseline.

A FAIL/INCONCLUSIVE is a successful audit outcome if it protects truth.
