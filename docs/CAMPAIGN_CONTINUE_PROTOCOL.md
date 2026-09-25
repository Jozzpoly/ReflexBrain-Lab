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

## Owner-observed truth precedence

For product-level and experiential claims, explicit Owner-observed behavior and later Owner corrections are authoritative.

If machine evidence and Owner experience disagree:
- preserve the narrower machine fact;
- mark the product/experience claim according to the Owner result;
- do not explain the discrepancy away by internal state, CI, logs, benchmark score or prior roadmap;
- do not re-promote the product claim until new real behavior is explicitly re-evaluated by the Owner.

Examples:
- correct input capture does not prove a control feels functional;
- autonomous ticks do not prove a resident feels alive;
- semantic benchmark accuracy does not prove useful cognition;
- causal instrumentation does not prove product agency.

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

At the 2026-09-25 recovered frontier:

- R2 clicker: **REJECTED as product direction**; retained only as causal research evidence;
- R3 autonomous host: **MACHINE-QUALIFIED causal/private research substrate; NOT Owner-qualified as a living/product specimen**;
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
- current `causallyResponsibleMatterId` as semantic ground truth: **REJECTED for the statement-blind R3 substrate · policy-wiring and statement-permutation falsifiers show that the label tracks authored identity/wiring, not semantic meaning**;
- first bounded semantic consumer value: **QUALIFIED ORACLE-ONLY** — same-id purpose switching plus persistent required pressure show a purpose×current-evidence relation can resolve recurring pressure with fewer unnecessary acknowledgements than respond-all and better resolution than fixed-surface/null controls;
- second bounded temporal semantic consumer: **QUALIFIED ORACLE-ONLY** — semantic state-change settlement uses private history to suppress paraphrased duplicate pressure that exact-text change cannot distinguish;
- current temporal relation corpus: **PARTIAL / NOT YET ACTOR-RELATIVE** — unseen-state and shortcut controls pass, but a matter-dependence audit finds zero counterfactual signatures where purpose meaning can change the label;
- learned R3 ReflexBrain authority: **does not exist**.

Therefore the next `kontynuuj` must **not** rerun/rescue direct cosine, must **not** train a joint relation model on the current corpus, and must **not** equate intervention-derived policy dependence with semantic meaning.

Two bounded consumer utilities are now **QUALIFIED ORACLE-ONLY**: static purpose×evidence routing and temporal semantic settlement. The earned frontier remains pre-model because the two dependencies have not yet been required jointly:

- preserve paired ablation as provenance, not automatic semantic authority;
- preserve both qualified consumer families as evidence that purpose meaning and settled semantic history can each matter downstream;
- do not train the current temporal corpus as the full actor-relative target: its labels do not depend on matter meaning;
- construct one bounded three-way pressure where purpose × settled history × current evidence are each necessary;
- require counterfactual label switches under both purpose changes and history changes while ids remain fixed;
- preserve held-out paraphrase/unseen-state and simple shortcut controls;
- audit supervision provenance explicitly before any oracle output is used for training;
- only after those gates choose what supervision/representation family deserves to approximate the boundary.

Do not add capacity/head to the rejected independent-embedding cosine formulation, do not treat corpus row count as progress, and do not interpret a model fitting authored fixture wiring as learned actor-relative meaning.

Likewise, do not jump directly from failure of the current causal label to CPC/JEPA/predictive/self-supervised learning. A representation objective is not progress unless a useful semantic consumer has first been demonstrated.


### 2026-09-25 statement-semantic identifiability closure

A metamorphic test permuted the semantic statements between Janek's two existing matter ids while keeping ids, fixture wiring and causal life fixed.

Check #209 PASS:
- 19 test files / 162 tests;
- observed/memory/decision trajectory unchanged;
- ablation-responsible id unchanged;
- semantic statement assignment reversed.

The active R3 fixture policies gate on matter ids, not on statement meaning. Therefore current ID-ablation labels cannot identify semantic statement meaning.

For future `kontynuuj`:
- do **not** try to make the current causal label trainable by adding rows or capacity;
- keep paired ablation as causal provenance instrumentation;
- treat actor-owned matter statements as private semantic context, not validated labels;
- first search for a supervision/objective with a real semantic grounding path;
- red-team any proposed target with statement permutation, identity/order, context-only, matter-only, policy-family and leakage controls before model training;
- if semantic supervision requires an authored parser/oracle/teacher, name that source explicitly rather than calling the target intervention-derived ground truth.

The next move is **three-way actor-private consumer/target qualification** — purpose × settled semantic history × current evidence — not immediate model training and not premature selection of a self-supervised objective.


### R3-wide statement inertness

The statement-blind boundary now holds across both existing autonomous R3 ecologies, not only the mixed-pressure tick-41 specimen.

Qualified diagnostic evidence:
- head `1fa1e12214e5c07a10278fc31de449a391034f58`;
- Check #214 PASS;
- 20 test files / 164 tests PASS;
- 420-tick material and contact trajectories remain causally identical after semantic statement permutation across fixed matter ids.

This proves a limitation of the current fixture substrate. It does **not** qualify life, intelligence, semantic competence or Owner value.

For future `kontynuuj`, treat the current host as pressure/instrumentation and recover the real goal before adding another benchmark or learner.


### 2026-09-25 bounded semantic consumer qualification

Evidence head: `3cfff490e9ee02331ace8787aa450be7954320af`

Qualification:
- Check #231 PASS;
- build/deploy PASS;
- 22 test files / 168 tests PASS;
- detailed evidence: `docs/R3_SEMANTIC_CONSUMER_ORACLE_RESULT_2026-09-25.md`.

Exact claim:
- one authored actor-private joint semantic relation has a real downstream consumer;
- across same-id depot/courtyard purpose variants, the oracle routes required responses correctly while fixed message-surface rules reach only 0.500 relation accuracy;
- unresolved required reports recur as World speech pressure;
- oracle resolves all required pressure with 50 acknowledgements;
- respond-all needs 150 acknowledgements for the same pressure resolution;
- ignore-all causes 200 Ida speech events versus 150 for oracle;
- fixed-surface controls cause 175 and resolve only half the required reports across both purpose variants.

Do not inflate this result:
- throughput remained 22 in every condition;
- the oracle is hand-authored;
- no learned model has passed;
- no broad semantic generality or Owner/product value is established.

For future `kontynuuj`, do not regress to “find any target and train it”. First make the consumer-shaped relation resistant to exact-pair/surface shortcuts and test another meaningful pressure boundary.


### 2026-09-25 temporal target matter-dependence audit

The temporal consumer itself remains qualified oracle-only, and the held-out `suspended` state defeats the tested simple memorization controls.

But head `1a14c6cc567ca415366521ff6933e8f00fbb2ac5` / Check #248 shows:
- 32 temporal examples;
- 0 same temporal-evidence signatures with alternative matter meanings;
- 0 matter-dependent label switches.

Therefore a learner can solve the current temporal target while ignoring actor purpose.

For future `kontynuuj`:
- do not promote this corpus into TRAIN as the complete ReflexBrain relation;
- combine the already-qualified static purpose relation with temporal settlement in one bounded consumer/target;
- require purpose, history and current evidence to each have causal/label necessity;
- only after that gate consider the first learned approximation.
