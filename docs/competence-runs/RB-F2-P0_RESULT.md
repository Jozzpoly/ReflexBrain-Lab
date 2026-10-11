# RB-F2/P0 — Private Competence Reliability Falsifier — RESULT — 2026-10-10

Status: **SCIENTIFIC FAIL · EXECUTION VALID · CLOSED**

PR: #51  
CI: `38085177499`  
Evidence head: `8866b7b12d99dec1a35ac0f1b306c882271b38e4`

Execution:
- **26/26 test files PASS**
- **40/40 tests PASS**
- TypeScript PASS
- Vite build PASS
- complete 30-episode replay deterministic
- exact source snapshots remained unchanged by counterfactual evaluation

No episode family, model, fallback, demand schedule, threshold or PASS criterion was changed after activation.

---

# 1. Primary question

> Can actor-private recent action→body-response history predict when one bounded local action model should not be trusted relative to a frozen simpler fallback, without World contact/blockage/regime labels?

Candidate evidence R:

> normalized dependence of the model's inferred residual on the actor's own recent motor demand.

If the residual were truly an action-independent external effect, it should not systematically change with own drive.

---

# 2. Scientific outcome

**FAIL**

The apparatus was informative:
- 30 frozen whole episodes;
- 21 informative M/F-different non-tie episodes;
- 4 M-worse;
- 17 M-better;
- 9 same-action/tie episodes;
- both outcome classes existed.

R looked strong in aggregate:

- R AUC: **0.94118**
- speed AUC: **0.05882**
- recent delta-V AUC: **0.05882**
- |last demand| AUC: **0.61029**
- touch fraction AUC: **0.94118**
- touch recency AUC: **0.94118**

But the frozen non-contact competence criterion failed:

- altered-dynamics, touch-free, M-worse episodes: **0**
- required: at least 2

Therefore R did not establish a general private competence-reliability signal beyond contact/constraint.

---

# 3. Family-level result

## A — familiar free dynamics

R was effectively zero:
~2e-7 to 3e-7.

Where M/F choices differed, M was consistently better.

Representative regrets:
- -0.1704
- -0.1808
- -0.3198

This is expected and useful apparatus evidence:
the private residual model can exploit stable external influence in its familiar free regime.

---

## B — free-force change

After the force change had settled into the frozen private history window:

R again remained effectively zero:
~2e-8 to 2e-7.

Where choices differed, M remained better.

Thus:

> R does not simply report "something changed in the World."

This negative control passed.

---

## C — altered body dynamics, no contact

Damping differed substantially from the nominal body model.

R rose clearly:
- ~0.0108
- ~0.0151
- ~0.0193
- ~0.0250
- ~0.0284
- ~0.0311

So the private statistic **did detect violation of the nominal action→motion relation**.

However:

- 5/6 episodes: M and F chose the same action / tied
- 1/6: M chose differently and was **better**
- touch fraction: 0 in all

Touch-free M-worse count:
**0**

This is the central P0 falsifier.

> Detecting that the model's structural assumption is violated did not imply that trusting the model produced a worse action.

Thus:

> **model mismatch ≠ decision incompetence**

under this bounded specimen.

---

## D — contact / constraint

R was approximately exactly **1.0** in all six episodes.

Touch fraction and touch recency were also exactly maximally positive.

Outcomes:

- 4/6: M worse
- 2/6: M better

Thus even the strongest R state did not uniquely determine the sign of model regret.

R's global AUC equaled the simple touch baselines.

Interpretation:

> R is a strong signature of this contact/constraint regime, but it did not earn a separate competence-reliability role.

This is not a failure of R to detect contact.

It is a failure of the stronger claim:
> high R tells the actor it should not trust M.

---

## E — recovery

After the constraint was removed and enough new private free-motion history accumulated:

R returned to near zero:
~3e-8 to 1.6e-7.

All six informative recovery episodes favored M.

Median recovery R:
~7.54e-8

Median contact R:
~1.0

Thus the statistic is temporally reversible and does not remain permanently "alarmed".

That is useful mechanism evidence, but it does not rescue the competence-reliability claim.

---

# 4. Mean policy cost

Across all 30 frozen episodes:

- always M mean cost: **0.44859**
- always F mean cost: **0.44202**

Neither policy dominates enough to trivialize the comparison.

The scientific question therefore cannot be reduced to:
- "always trust history"
or
- "always use fallback".

---

# 5. Strongest new finding

The most important result is not the failed threshold.

It is the separation:

> **private evidence that a local model's assumptions are violated is not the same thing as private evidence that the model's action choice has become worse.**

This matters directly for ReflexBrain.

A system can legitimately detect:
- unexpected dynamics;
- action-dependent residuals;
- prediction mismatch;

without that mismatch yet meaning:
- stop;
- switch skill;
- escalate;
- pay attention;
- create a reason.

That additional actor-relative relation still has to be earned.

This is a direct warning against turning:
- prediction error,
- surprise,
- uncertainty,
- novelty,

into a semantic importance scalar.

---

# 6. Relation to Living Organism donor

R1's Living Organism donor showed:

> one local history-based model worked well in free motion and became materially harmful at contact.

P0 reproduces a related contact-boundary phenomenon, but also shows why that donor cannot be generalized naively.

The new R statistic:
- strongly marks contact;
- rises under altered body dynamics;
- yet only contact produced M-worse cases in this frozen specimen;
- and even contact did not make M worse in every mirrored/phase case.

Therefore the useful donor is narrower:

> local competence can be domain-bounded.

But:

> a generic private "domain violation" statistic is not yet a competence-value signal.

---

# 7. Why P0 must remain FAIL

Do not repair P0 by:

- increasing altered damping until M becomes worse;
- adding new non-contact failure episodes after seeing the result;
- changing the demand pattern;
- adding a learned reliability classifier;
- adding contact semantics;
- tuning an R threshold;
- changing the cost weights;
- removing the two contact episodes where M was better.

Those would answer a different post-hoc question.

P0's frozen question was answered.

---

# 8. Consequence for the competence frontier

F2 splits into two distinct questions that were previously conflated.

## F2a — domain-assumption evidence

Can private history expose that a local model's assumptions no longer match current action→consequence dynamics?

P0 evidence:
**YES, narrowly.**

The altered-dynamics family produced a clear R increase without contact.

## F2b — competence-value evidence

Does that private assumption violation predict whether using the model is worse than an available fallback?

P0:
**NO — FAIL.**

This distinction should become canonical.

---

# 9. What becomes more important now

P0 increases the importance of F3:

> **what makes a private difference relevant to something the actor is actually doing?**

The missing bridge may not be a better generic reliability estimator.

The same mismatch may matter differently depending on:
- the ongoing action;
- expected consequence;
- owned concern;
- available alternatives;
- cost of being wrong.

LLM Live NPC donors #156/#158/#159 become more relevant here:
- more perception is not a reason;
- the same evidence can matter only because of an existing actor-owned relation.

Do not import their Matter ontology.

But the relational lesson survives.

---

# 10. Recommended next control-room move

Do not activate F2/P1 by tuning P0.

Return to frontier selection.

Strong candidate:

**F3/D0 — endogenous relevance precursor discovery**

Question shape:

> can the same lawful private mismatch/event have different later causal value depending only on an actor-private ongoing relation established by its own prior activity, without a host-authored Matter/Goal label?

This would directly test the relational bridge exposed by:
- G5A;
- F2/P0 FAIL;
- R6 donors.

A small donor/discovery run should precede qualification.

No LLM.
No Medium work.
