# ReflexBrain Campaign Working Protocol — interpreting `kontynuuj`

Status: **ACTIVE OPERATING PROTOCOL**

This document defines how an autonomous project run should proceed when the Owner supplies a short continuation command.

## Meaning of `kontynuuj`

`Kontynuuj` does **not** mean:

- execute the next bullet mechanically;
- keep the last plan even if evidence changed;
- add another feature;
- produce another Owner test;
- polish the current scaffold because it exists.

It means:

> recover the current qualified truth, reconsider the nearest objective against the larger project intent, identify the highest-value earned move, execute it carefully, qualify the result, and update direction when evidence changes.

## Start-of-turn recovery

Before material work:

1. resolve active branch / exact HEAD;
2. verify latest CI/qualification state;
3. read the current truth/roadmap section relevant to the frontier;
4. identify unresolved FAILs, blockers and unqualified commits;
5. ask whether the previous planned move is still the right move.

Do not start by blindly editing the file touched last.

## Decision hierarchy

When choosing the next action, prefer in this order:

1. fix a correctness/evidence failure;
2. remove hidden leakage or false authority;
3. falsify a dangerous architectural assumption;
4. close a blocker to the current research question;
5. implement the smallest real capability that advances the frontier;
6. add instrumentation only when it answers a concrete uncertainty;
7. polish/UI last.

A new Owner-test surface is not a default next step.

## Execution loop

For each meaningful increment:

**Hypothesis -> implementation -> deterministic qualification -> red-team -> interpretation -> promote / revise / reject.**

A green test is not automatically promotion.

After PASS ask:
- did the test prove the intended property?
- could the fixture solve it by accident?
- did we encode the answer in labels, geometry, timing or policy?
- did a temporary scaffold silently become a required core?
- does a qualitatively different ecology still work?

After FAIL:
- classify it before fixing:
  - technical/test bug;
  - fixture assumption wrong;
  - host capability missing;
  - model/representation failure;
  - architecture hypothesis falsified.
- fix only at the correct layer.

## Anti-inertia rules

### Temporary means temporary

Every simple mechanism should state whether it is:
- research instrument;
- fixture policy;
- reusable substrate;
- candidate architecture.

Do not silently upgrade categories.

### Second-pressure rule

Before treating a first implementation as generic, pressure it with a qualitatively different ecology/counterfactual.

### No UI compensation

If underlying competence is weak, do not make the interface richer to make progress feel stronger.

### No metric compensation

If the ontology is wrong, do not add training examples, model capacity or better plots just to recover a score.

### No donor cargo cult

Reuse exact invariants/capabilities from SPC, Companion or Feniks. Do not inherit their whole architecture.

## Evidence vocabulary

Use explicit status where useful:

- **QUALIFIED** — exact revision passed its defined gate;
- **PASS** — a specific hypothesis/test passed;
- **FAIL** — a specific hypothesis/test failed;
- **UNPROVEN** — plausible but not demonstrated;
- **REJECTED** — deliberately not promoted;
- **FIXTURE-ONLY** — exists to generate pressure, not candidate product architecture;
- **DONOR** — reusable concept/code with known provenance.

## Documentation rhythm

Do not rewrite strategy docs after every small commit.

Update durable docs when:
- the frontier changes;
- a hypothesis is rejected/promoted;
- a new qualified checkpoint materially changes what is true;
- Owner feedback changes project doctrine;
- a scaffold is reclassified.

The Current Truth document should stay short enough to recover state quickly.

The evidence log/tests carry lower-level detail.

## Owner-attention rule

The campaign should reduce, not manufacture, Owner attention cost.

Do not ask the Owner to manually validate something that deterministic evidence can establish.

Do not request an Owner test until the result can reveal a property unavailable from ordinary CI/research analysis: feel, perceived life, surprising agency, usability, emergent interaction or qualitative value.

## Clean checkpoint rule

Do not stack speculative layers on an unqualified head.

Before a major new layer:
- exact HEAD known;
- CI status known;
- relevant gate green;
- failing evidence either fixed or intentionally recorded.

## Current application

At the 2026-09-24 recovered frontier:

- R2 clicker: **REJECTED as product direction**; retained only as causal research evidence;
- R3 autonomous host: **QUALIFIED research substrate**;
- fixture work/contact/mixed-pressure policies: **FIXTURE-ONLY**;
- actor-private perception/memory and temporal corpus: **research/reusable substrate candidates**;
- actor-owned continuing matters: **QUALIFIED for the current research substrate**;
- coarse direct matter↔context cosine relation: **REJECTED**;
- same-actor two-domain frozen MiniLM result: **PARTIAL SIGNAL / GENERALIZATION FAIL**;
- concurrent-matter causal-responsibility direct cosine: **FAIL at chance**, including after temporal-alignment correction;
- within-one-ecology mixed-pressure causal-responsibility target: **QUALIFIED only as causal feasibility/microscope evidence**;
- frozen MiniLM direct cosine on that target: **FAIL · FAMILY REJECTED**;
- current 12-example mixed-pressure corpus as learned-relation training benchmark: **FAIL · context-only speech shortcut reaches 1.000**;
- paired matter ablation as causal provenance instrumentation: **PRESERVED**;
- current `causallyResponsibleMatterId` as semantic ground truth: **NOT QUALIFIED · policy-wiring falsifier flips the label under identical model-visible baseline life**;
- learned R3 ReflexBrain authority: **does not exist**.

Therefore the next `kontynuuj` must **not** rerun/rescue direct cosine, must **not** train a joint relation model on the current corpus, and must **not** equate intervention-derived policy dependence with semantic meaning.

The earned frontier is:
- define and falsify a semantic-grounding contract before adding training capacity;
- retain paired ablation as provenance, not automatic semantic authority;
- construct counterbalanced pressure where context-only, matter-only, candidate-position and simple structured baselines cannot solve the task;
- require the same semantic relation to survive irrelevant policy rewiring and require different relations under genuinely different actor-private meaning;
- preserve paraphrase controls and add actor/domain/**policy-family** transfer holdouts;
- only after those gates pass consider a small learned **joint relation function** over private temporal evidence + candidate matter.

Do not add capacity/head to the rejected independent-embedding cosine formulation, do not treat corpus row count as progress, and do not interpret a model fitting authored fixture wiring as learned actor-relative meaning.
