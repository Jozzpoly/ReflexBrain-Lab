# Pre-O0 N11 — O-CTRL End-to-End Walkthrough and Concern Correction — 2026-10-06

Status: **ADVERSARIAL PAPER RUN · ONE MATERIAL DESIGN ISSUE FOUND**

Target:
current O-CTRL convergence state.

## Discovered issue

T0-D was defined as:

> maintain one marked movable body in a preferred physical relation with one marked dock.

Suppose actor privately observes the relation satisfied.

It becomes quiescent.

Later M0 moves the marked body while actor does not perceive it.

Correct epistemic behavior is:
actor continues believing/remembering prior support until new evidence arrives.

But:

> what causes the actor to ever seek new evidence?

If nothing else drives it away/checking, the control agent may sit indefinitely with stale satisfaction.

Adding hidden World notification would violate the project.
Adding arbitrary global exploration would contaminate the control.

This is a real missing part of the **authored concern**, not merely a search bug.

---

# Candidate correction A — global periodic check

Rule:
every N seconds, check dock.

Reject as general architecture.

Problems:
- naked timer;
- easy timing-code behavior;
- concern becomes patrol loop;
- arbitrary N dominates trajectory.

Could be a machine test hook but not preferred control organism.

---

# Candidate correction B — generic memory confidence decay

All memories lose confidence over time.

Potential:
stale evidence naturally triggers checking.

Problem:
- turns one T0 need into a universal memory theory;
- arbitrary decay half-life;
- may cause needless checking everywhere;
- conflates epistemic uncertainty with age.

Reject as global rule for now.

---

# Candidate correction C — concern-specific evidence freshness obligation

Make T0-D explicit:

> maintain the marked-body ↔ dock relation **and maintain sufficiently recent private evidence about that relation**.

This is an authored monitoring concern.

It honestly contains two requirements:

1. desired physical relation;
2. evidence about the relation must not remain indefinitely stale.

Important:

This is **not** claimed as general memory decay or endogenous curiosity.

It is part of the deliberately authored T0 control.

### Why this is cleaner

- no hidden World notification;
- reason to re-check belongs to concern, not perception;
- memory can remain factual/stale without globally decaying into "false";
- actor can carry one monitoring obligation through time;
- hidden displacement can be discovered naturally during concern-driven re-check;
- O-DEV later removes the entire monitoring concern.

### Implementation freedom

"fresh enough" may initially use bounded evidence age.

This is a T0-specific scaffold.

Do not promote its threshold to general cognition.

---

# Candidate correction D — second independent concern

Add:
- patrol;
- rest;
- exploration;
- body state;

so actor naturally leaves and returns.

Reject for O-CTRL.

It contaminates the control with unresolved normativity/arbitration.

Could belong to later organism research.

---

# Candidate correction E — external process physically forces actor away

M0 occasionally displaces actor/blocks view.

Could create hidden changes naturally.

But:
- unreliable as only epistemic driver;
- concern trajectory depends on mechanical accident;
- may make ecology look richer than actor organization.

Useful perturbation, not core solution.

---

# Decision

Promote **C — concern-specific evidence freshness** for O-CTRL.

Revised T0-D control concern:

> Maintain one marked movable body in a preferred physical relation with one marked dock/landmark, and maintain sufficiently recent actor-private evidence about that relation.

This is openly authored.

Allowed claims remain narrow.

---

# Important consequence

O-CTRL now tests two distinct things:

## physical maintenance
Can actor restore relation when privately known violated?

## epistemic maintenance
Can actor re-check a relation because its own evidence is too old to support current confidence, without hidden World truth?

This is scientifically useful.

It makes **checking itself** part of the explicit control task rather than pretending it emerged.

---

# End-to-end paper run after correction

## Stage 1 — initial observation

Actor observes:
- target track/signature;
- dock landmark;
- relation satisfied.

Private relation:
supported-satisfied.
Evidence age:
fresh.

Concern quiescent.

## Stage 2 — ordinary time / world continues

M0 shuttle/process moves elsewhere.
Actor need not continuously patrol.

Evidence age grows.

No hidden relation update.

## Stage 3 — evidence freshness expires

Concern does **not** infer "target moved".

It only changes epistemic status:

supported-satisfied -> stale/needs-check.

CHECK controller becomes legitimate.

This is actor-internal task requirement, not World evidence.

## Stage 4 — actor approaches/re-observes dock relation

Case A:
target still docked.

New evidence refreshes satisfaction.
Concern quiesces again.

Case B:
target absent/displaced.

Current legal evidence contradicts previous relation.
Private state becomes unsatisfied/unknown.

REACQUIRE/RESTORE begins.

## Stage 5 — physical restoration

Actor searches using bounded private history.
Finds marked body.
Pushes it physically toward dock.
May encounter M0 obstruction/process.

Private relation only returns to supported-satisfied after new sensory evidence.

This is a coherent causal loop.

---

# Hidden displacement falsifier improved

Now Q1/Q2 no longer rely on researcher forcing actor into a check.

The concern itself eventually creates a legal reason to re-check.

Machine harness can still control timing/seeds.

Expected first divergence:

1. World target moves hidden.
2. **No private divergence yet** between moved/not-moved pair if private evidence identical.
3. evidence freshness obligation evolves identically in both.
4. both initiate CHECK at same point.
5. sensory evidence diverges when expected relation becomes observable.
6. private relation diverges.
7. local controller/motor behavior diverges.

This is a much stronger causal experiment.

---

# Important control

Run hidden displacement at different times but align both runs at the same concern evidence-age state.

This ensures behavior is not just:
"at tick N search".

The check timing may be age-based, but the **displacement itself must not alter timing before perception**.

---

# Does this make T0 more task-like?

Yes.

That is acceptable.

O-CTRL is explicitly a control task.

The purpose is to qualify:
- epistemic honesty;
- material continuation;
- history;
- dynamic ecology.

O-DEV exists to challenge externally authored trajectory later.

Do not use T0 watchability as evidence of endogenous life.

---

# Additional end-to-end issues checked

## Search competence can dominate

Still true.

Mitigation:
keep M0 bounded enough that local reacquisition is possible.
Do not solve arbitrary search.

## Gate/topology mechanism may be irrelevant to T0

Acceptable if it creates independent rearrangement/route pressure in some layouts.

Q10 ecology ablation will test whether M0 matters.

Do not force T0 to "use the gate" as a puzzle step.

## B1 may make pushing too hard

Covered by mandatory B0 comparison.
Do not tune until evidence.

## unique visual target makes identity easy

Intentional for O-CTRL calibration.

Identity ambiguity belongs to later falsifier/organism pressure.

---

# Current result

One material conceptual gap was found and repaired **without changing the project into a larger architecture**.

T0-D is now more honestly described as a:

**maintain-and-monitor authored physical relation concern.**

This is stronger as a substrate control and weaker as a claim about organism normativity — exactly the desired direction.

No new V0 blocker emerged.

Implementation remains paused.
