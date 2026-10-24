# RB-F3/D0 — Private Alias / Relational Relevance Discovery — ARMED — 2026-10-10

Status: **ARMED · DISCOVERY ONLY · NO OWNED-REASON CLAIM**

Parents:
- O-CTRL/G5A Gate 1 PASS / Gate 2 PASS;
- RB-F2/P0 scientific FAIL;
- LLM Live NPC relational-relevance donors (#156/#158/#159);
- Living Organism directional-touch donor.

## Why this run exists

F2/P0 showed:

- a generic private mismatch statistic R can become very large;
- yet the same high-R contact family contained both M-better and M-worse decisions;
- simple binary touch had the same aggregate AUC as R;
- altered non-contact dynamics could violate the model assumption without making M worse.

The next question is therefore more basic than "how do reasons form?":

> Does the current private representation even contain enough relational information to distinguish situations where the same action has opposite causal value?

D0 searches for one exact private alias.

No qualification is available from this run.

---

# 1. Frozen mirrored pair

Use the already-qualified/executed RB-F2/P0 contact specimen.

Construct two contact episodes with:

- identical nominal body;
- identical deterministic demand history;
- identical phase;
- identical absolute external-force magnitude;
- identical wall geometry mirrored around the actor;
- right case:
  - wall on +X side;
  - external force pushes +X into wall;
- left case:
  - wall on -X side;
  - external force pushes -X into wall.

Use the same F2 decision tick, history window, candidate set, model M, fallback F and counterfactual cost.

No parameter search.

Frozen pair:
- phase = 0;
- force magnitude = 1.05 * E0_FMAX;
- right wall side = +1;
- left wall side = -1.

---

# 2. Private representation under audit

The F2/P0 actor-private competence evidence contains only:

- recent own drive demand;
- recent body-local forward velocity before/after;
- derived action-independent residual history;
- binary private touch presence.

No wall side.
No contact normal.
No World position.
No collider identity.

D0 asks whether the final 24-transition private histories of the mirrored pair are exactly equal under this representation.

If not equal:
- D0 returns NO-ALIAS;
- do not tune until equal.

If equal:
- compare the same M/F decisions and host-side regrets.

---

# 3. Strong alias criterion

A **material private alias** exists only if all are true:

1. mirrored private history is exactly equal under the F2-private representation;
2. derived F2 signals are exactly equal within numeric tolerance;
3. M chooses the same drive in both worlds;
4. F chooses the same drive in both worlds;
5. M-vs-F regret has opposite sign across the pair.

If 1–4 hold but regret does not reverse:
- no useful alias for this candidate.

No search over phase/force after activation.

---

# 4. Why an alias matters

If the exact same legal private state/history maps to opposite action value, then:

> no deterministic decision rule that receives only that private representation can correctly decide whether M should be trusted in both worlds.

This is an information/identifiability result.

It does NOT imply:
- the actor needs semantic object identity;
- the actor needs a host wall label;
- the actor needs an explicit Matter;
- directional touch is the final solution.

It only establishes that the existing private representation is insufficient.

---

# 5. Candidate missing lawful relation: directional touch

After the alias test, D0 may additionally inspect a lawful **body-local directional touch** channel derived from solver contact normal/impulse.

Allowed form:
- body-local angular/sector touch;
- no collider identity;
- no World coordinates;
- no wall label.

This is already a donor pattern in the independently audited Living Organism scout.

D0 only asks:

> does directional touch differ between the mirrored alias worlds in the physically expected way?

It does NOT feed that channel into M/F.
It does NOT qualify a new policy.

If directional touch separates the worlds:
- classify it as a candidate relational evidence donor.

If it does not:
- remain unresolved.

---

# 6. Discovery outcomes

## MATERIAL ALIAS FOUND

Requirements 1–5 pass.

Maximum discovery statement:

> the F2 private representation aliases two causal situations with opposite local action value.

This is not a scientific competence PASS.

## NO ALIAS

Frozen mirrored pair fails one of requirements 1–5.

No parameter search in D0.

## APPARATUS FAIL

Mirrored physical scenes are not deterministic or do not remain in the intended bounded contact regime.

---

# 7. Relationship to F3

F3 remains:

> what makes the same lawful private event relevant to something the actor is already doing/undergoing?

D0 does not answer that.

It tests a prerequisite:

> **relevance cannot be computed from distinctions absent from private experience.**

If an alias is found and directional touch separates it, a later F3A may ask whether an actor-private relation between:
- own intended action direction,
- body-local contact direction,
- expected consequence

can predict local action value without a host-authored Matter/Goal label.

That later relation would still be a competence/relevance precursor, not a full owned reason.

---

# 8. Anti-goals

Do not add:
- target/object identity;
- wall/contact semantic label;
- reward;
- R6 Matter/Commitment;
- LLM;
- learned classifier;
- new medium UI;
- geometry/phase/force search;
- larger sensory stack.

One mirrored pair is sufficient for D0.


---

## Closure

**MATERIAL ALIAS FOUND · DISCOVERY CLOSED**

See `docs/competence-runs/RB-F3-D0_RESULT.md`.

Frozen pair produced:
- exactly equal F2-private histories;
- exactly equal F2 signals;
- same M drive (+0.5);
- same F drive (0);
- opposite regret sign:
  - right: +0.64608 (M worse)
  - left: −0.64608 (M better)

Directional body-local touch separated the pair:
- right mean signed impulse +0.30123
- left mean signed impulse −0.29885

No phase/force search was performed after activation.
