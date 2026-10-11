# RB-COMP/R1 — Living Organism Runtime A Independent Qualification Audit — RESULT — 2026-10-10

Status: **PASS · EXECUTABLE SCOUT QUALIFIED · ARCHITECTURE NOT PROMOTED**

Audit source:
- `research/living-organism-runtime-a-2026-10-08`

Independent audit PR:
- PR #47
- base = Living Organism source branch itself
- no runtime modifications

Independent exact-source CI:
- workflow `38083838565`
- **38/38 test files PASS**
- **113/113 tests PASS**
- TypeScript PASS
- Vite build PASS

This resolves the first R1 uncertainty:

> Living Organism Runtime A is not merely a self-reported document corpus. Its current source executes cleanly under the repository's normal independent GitHub Actions check.

This does **not** make it canonical ReflexBrain architecture.

---

# 1. Executive judgement

Living Organism Runtime A is now classified as:

> **INDEPENDENTLY EXECUTABLE SCOUT + STRONG DONOR/FALSIFIER CORPUS**

It is not:

- the new canonical organism;
- a qualified learned ReflexBrain;
- an Owner-qualified living creature;
- a replacement for G5;
- evidence that its module/class boundaries are correct architecture.

The campaign's strongest contribution is not a successful brain.

It is a set of **well-bounded failures and domain boundaries** showing where local models, regulators and private evidence are useful—and where they break.

---

# 2. What actually runs by default

Current `LivingRuntime` composes:

- `LivingWorld`
- authored `Occupant`
- analytic `PrivateVision`

The default motor policy is still the authored `Occupant.decide(frame)`.

The learned ridge regressors, approach experiments, touch interruption, braking and body-model campaigns remain separate challengers/probes.

Therefore:

> claims from offline challenger campaigns must not be described as current organism capabilities.

This distinction is source-confirmed.

---

# 3. Donor / failure ledger

## 3.1 Private retinal/proprioceptive substrate

### Mechanism

Actor receives:
- RGB nonuniform angular retina;
- 30 Hz private sensory frames over 120 Hz physics;
- touch accumulation;
- body-local proprioception;
- gaze.

No host object IDs or World positions enter the private frame.

### Evidence

Tests cover:
- retinal geometry;
- clipping/fragmentation;
- sensor cadence;
- directional touch;
- private checkpoint continuation;
- sensory phase/accumulator restore.

### Classification

**EVIDENCE / DONOR**

Useful as:
- richer actor-private substrate;
- active sensing donor;
- checkpointed sensory continuity.

Limits:
- ideal proprioception is authored;
- color categories remain authored appearance channels;
- this does not establish learned perception or natural object identity.

Transfer:
**Organism-frontier compatible.**

---

## 3.2 Continuing authored occupant

### Mechanism

Default `Occupant` implements:
- explore;
- approach;
- inspect;
- yield;
- bounded appearance inspection;
- deterministic private exploration variation;
- touch-driven directional escape.

### Evidence

Ten-minute characterization:
- no permanent close-patch halt after fixes;
- movement occurs in every 60-second window.

### Important negative

The earlier controller permanently stopped because a large visible patch suppressed drive indefinitely.

Later exploration produced movement but poor spatial novelty until further authored correction.

### Classification

**ENGINEERING DONOR / NEGATIVE EVIDENCE**

The long-run gate establishes:
> controller continuation does not deadlock under tested conditions.

It does NOT establish:
- life;
- meaningful activity;
- learned interest;
- owned goals.

Transfer:
**Do not transfer policy architecture.**
Preserve failure modes and long-run regression methodology.

---

## 3.3 PrivateVision

### Mechanism

Analytic private-history estimator.

Uses:
- private integrated proprioceptive motion;
- gaze;
- retinal fragment bearings;
- stationary-fragment assumption.

It does not use host coordinates, object IDs, true sizes or range.

### Positive evidence

Motion can disambiguate some single-image size/distance aliases.

Tests show:
- single image remains ambiguous;
- translational baseline can support tentative depth;
- pure rotation does not create depth;
- previous hypothesis is checked before refitting;
- displaced fragment can make prediction inconsistent;
- ambiguous/clipped/missing comparisons fail unavailable.

### Negative evidence

Campaign counterexamples show:
- moving/scale aliases can fit the assumption and remain wrong;
- low angular residual is not calibrated confidence;
- even prediction compatibility can fail to expose a wrong range hypothesis.

### Classification

**DONOR + FALSIFIER**

Strong transferable idea:
> local private models should carry explicit assumptions/domain conditions and remain tentative.

Not established:
- object identity;
- generic depth;
- learned vision;
- calibrated certainty.

Transfer:
**Organism-frontier compatible as epistemic pattern, not architecture.**

---

## 3.4 ApproachEpisode

### Mechanism

Authored contact-seeking controller with optional history and reconsideration.

Source explicitly states:
> authored contact-seeking experiment, not autonomous goal or object tracker.

### Positive evidence

History can detect:
- commanded forward travel without increasing apparent extent;
- repeated non-progress.

A separate reconsideration variant can pause and later retry.

### Negative evidence

It can:
- falsely abandon reachable far targets;
- suspend longer than a useful task horizon;
- stop on unrelated contact;
- conflate external assistance with self-caused progress because travelled motion is still body-local evidence, not action attribution.

### Classification

**FALSIFIER / DONOR**

Key lesson:
> adding temporal history can reduce one kind of futile persistence while creating premature abandonment.

Do not call this general planning or learned persistence.

Transfer:
**Negative/falsifier only unless requalified.**

---

## 3.5 Host contact attribution

### Mechanism

World-side instrumentation records actual solver contacts aligned to private sensory windows.

It can distinguish:
- real obstacle contact;
- nearby intended target that was not touched.

### Evidence

Tests cover:
- actual solver impulse;
- ended contacts retained in aligned window;
- exact checkpoint restore.

### Classification

**EVIDENCE / RESEARCH INSTRUMENT**

Useful for:
- validating whether private touch corresponds to real material cause.

Hard boundary:
- host contact identity is microscope truth;
- it must not enter private actor cognition automatically.

Transfer:
**Foundation-compatible instrumentation.**

---

## 3.6 Learned sensory prediction

### Mechanism

Small ridge regression:
- 11 private/action features;
- predicts future bearing/log-extent delta;
- no host XY/ID/range/contact;
- train-only scaling;
- offline only.

### Positive result

Initial held-out test:
- ridge bearing MAE ~0.01130
- hold ~0.03813
- body/gaze ~0.01285
- no-history ~0.01157

Thus the first attractive "70% improvement over hold" nearly disappears against stronger baselines.

### Stress result

On stress:
- ridge ~0.03769
- body/gaze ~0.02687
- geometry/fallback ~0.01806

Ridge wins only 2/6 stress episodes against body/gaze.

Sudden motor change:
- ridge ~0.05510
- body/gaze ~0.03157
- geometry/fallback ~0.01925

### History ablation

No-history is almost equal or slightly better in several settings.

### Classification

**LEARNED DONOR + STRONG NEGATIVE EVIDENCE**

Defended:
> a small learned predictor can fit ordinary private sensory dynamics.

Not defended:
- history adds robust value;
- model generalizes under action/domain shift;
- lower MAE improves organism behavior;
- learned prediction is superior to simple calibrated baselines.

Transfer:
**Scout baseline only.**

Do not integrate merely because it is learned.

---

## 3.7 Action-conditioned prediction / local action choice

### Mechanism

Separate physical forks evaluate future outcomes under candidate commands.

A learned held-action predictor is compared with:
- body/gaze;
- no-history;
- motor-only;
- existing frozen model.

### Positive evidence

For one authored centering decision:
- learned variants beat body/gaze.

### Critical ablation

Full learned vs:
- motor-only: 1 win / 6 ties / 2 losses;
- no-history: 2 wins / 5 ties / 2 losses.

Continuous closed loop:
- full learned cost: .08435
- motor-only calibration: .08004
- body/gaze: .10438

Full model loses to motor-only in 7/12 scenes.

### Classification

**NEGATIVE EVIDENCE / DONOR**

Key conclusion:

> richer sensory history did not improve the actual local decision beyond a simpler motor calibration.

This is highly important for ReflexBrain architecture discipline.

Transfer:
**Falsifier for unnecessary learned complexity.**

---

## 3.8 TouchInterruption

### Mechanism

Authored regulator:
- active;
- quiet;
- optional backoff;
- optional directional cancellation.

Private touch is an event, not semantic success.

### Positive evidence

Primary campaign:
- touch-positive windows reduced substantially;
- commands can resume after fresh upstream intent.

### Negative evidence

Backoff created real new rear contacts.

Directional cancellation improved some conditions and not others.

### Classification

**FALSIFIER / LOCAL-CONTROL DONOR**

Strong lesson:

> interrupting after contact is not equivalent to solving the contact.

A controller can reduce one visible symptom while creating a delayed physical failure.

Transfer:
**Negative/falsifier; do not promote controller.**

---

## 3.9 Proprioceptive braking

### Mechanism

Optional local braking after withdrawal using measured body motion.

### Positive evidence

Known pinch:
- rear impulse 2.48 -> 0

Holdout:
- rear impulse 1.14 -> 0

### Negative tradeoff

Known:
- front impulse 5.84 -> 9.48

Holdout:
- front impulse 11.73 -> 16.17

### Classification

**STRONG TRADEOFF EVIDENCE**

No safety claim.

Key lesson:
> a locally successful corrective reflex may simply move cost to another causal channel.

Transfer:
**Falsifier / evaluation pattern.**

---

## 3.10 Body-motion model / competence domain

### Mechanism

Private model predicts future self-motion from:
- current and recent proprioception;
- previous own command;
- candidate command.

No host force/contact/position input.

### Prediction result

Test velocity MAE:
- history: .03662
- no-history: .15514
- analytic residual-force baseline: ~0.000000845

History clearly carries useful information about unobserved continuing external influence.

But the stronger analytic private-history competitor predicts far better.

### Closed-loop free motion

History-based controller:
- improves ordinary free-motion reduction relative to no-history.

### Contact-domain failure

At walls:
- history rear impulse ~169.14
- no-history ~55.45
- analytic residual model ~201.06

Thus models that work well in free motion can become much worse at contact.

Mechanism hypothesis:
- contact invalidates the free-motion residual-force assumption;
- a stopped body can be interpreted as external force rather than constraint.

### Touch gate attempt

A private touch gate reduces total impulse:
- ~182.94 -> 116.10

But:
- front impulse ~13.80 -> 69.52
- speed/travel increase.

No promotion.

### Classification

**R1 STRONGEST DONOR / STRONGEST FALSIFIER**

This is the most important Living Organism result for current ReflexBrain competence research.

Defended narrow statement:

> private temporal history can improve a local self-motion model in one regime while the same model becomes actively misleading when the causal regime changes.

This creates a genuine **competence-applicability boundary**.

Transfer:
**HIGH-VALUE ORGANISM-FRONTIER DONOR.**

Do not transfer the ridge architecture.

Transfer the question.

---

# 4. False ontology audit

Several names are potentially stronger than their defended meaning.

## "PrivateVision"

Actual:
- analytic stationary-fragment triangulation + bearing consistency checks.

Not:
- general vision;
- object identity;
- scene understanding.

## "ApproachEpisode"

Actual:
- authored contact-seeking regulator.

Not:
- self-originated purpose;
- planner;
- learned approach competence.

## "TouchInterruption"

Actual:
- authored finite-state regulator around private touch.

Not:
- understanding obstruction;
- recovery competence.

## "Braking"

Actual:
- local counter-command against measured momentum.

Not:
- safety;
- physical recovery policy.

## "SensoryRegressor"

Actual:
- ridge baseline on authored private features.

Not:
- learned perception or ReflexBrain.

## "Body model"

Actual:
- one-dimensional short-horizon self-motion predictor under authored candidate commands.

Not:
- general body schema.

R1 therefore rejects architecture promotion from naming.

---

# 5. R1 transfer table

| Family | Classification | Transfer |
|---|---|---|
| private retina/sensory clock | EVIDENCE / DONOR | organism-frontier substrate |
| exact private checkpointing | EVIDENCE | foundation-compatible |
| PrivateVision assumptions | DONOR / FALSIFIER | assumption-aware local model |
| ApproachEpisode | FALSIFIER | temporal-action failure patterns only |
| host contact attribution | EVIDENCE instrument | foundation microscope |
| sensory ridge | LEARNED DONOR / NEGATIVE | baseline only |
| action-conditioned learned model | NEGATIVE EVIDENCE | complexity falsifier |
| touch interruption | FALSIFIER | local-control counterexamples |
| braking | TRADEOFF EVIDENCE | evaluation pattern |
| body-motion history model | STRONG DONOR/FALSIFIER | competence-domain research |
| default authored Occupant | engineering baseline | do not transfer as brain |

---

# 6. Frontier impact

R1 materially strengthens **F2 — local competence applicability / failure**.

Before R1:
- F2 was a plausible scout-derived idea.

After R1:
- source executes independently;
- the domain-switch failure is backed by a full passing source suite;
- multiple simpler/control models expose the same general issue;
- the failure produces material consequences, not only metric drift.

Therefore F2 is promoted to:

> **HIGH-CONFIDENCE ORGANISM-FRONTIER QUESTION**

But R1 explicitly rejects:

> prediction error = semantic meaning.

The next ReflexBrain question must be causal:

> can privately detectable evidence that a local model/skill has left its competent regime change what the actor does next, without a World-side CONTACT/BLOCKED label or researcher-authored "uncertainty" flag?

Possible downstream behaviors:
- pause one failing local strategy;
- seek information;
- switch among already-available local skills;
- escalate an unresolved compact problem.

Which response is appropriate remains open.

---

# 7. Relation to F3 owned-reason formation

R1 does not demote F3.

LLM Live NPC shows:
- more perception alone does not create owned reasons;
- existing owned matters make the same percept relevant;
- typed commitment can create future reconsideration.

But importing R6 `Matter` as the answer would insert ontology.

F2 offers a different route:

> actor-relative pressure may first arise from **failure of its own ongoing competence/prediction**, before any named matter exists.

This is now one of the most promising bridges between:
- body/world causality;
- private history;
- local competence;
- eventual significance.

---

# 8. Relation to G5A

G5A remains valuable and should not be replaced.

G5A asks:
> can independent ecology create later behaviorally meaningful private-history pressure under controlled counterfactuals?

F2 asks:
> can the actor detect, privately, that a local competence no longer applies and change strategy without semantic labels?

These are complementary.

Recommended two-speed posture:

- Foundation: **G5A**
- Organism frontier: **F2 competence-boundary experiment design**

Do not force them into one run.

---

# 9. R1 closure

**PASS.**

Living Organism Runtime A is independently executable and scientifically valuable as a scout.

Its strongest contribution is a **competence-boundary falsifier**, not a finished learned brain.

Canonical consequence:

> ReflexBrain should investigate not only what private history predicts, but whether an actor can recognize when a local model/skill has become unreliable in its current causal regime.

No Living Organism runtime/module is promoted into canonical architecture.

Next:
**RB-COMP/R2 — frontier selection and first ReflexBrain-native competence-boundary falsifier design.**
