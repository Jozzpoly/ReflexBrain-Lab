# RB-F3/D0 — Private Alias / Relational Relevance Discovery — RESULT — 2026-10-10

Status: **MATERIAL ALIAS FOUND · DISCOVERY CLOSED · NO POLICY QUALIFICATION**

PR: #52  
CI: `38085574709`  
Evidence head: `6d184be3fa35bd8d34ce25bb19cbe3e47dc10061`

Execution:
- **27/27 test files PASS**
- **42/42 tests PASS**
- TypeScript PASS
- Vite build PASS
- deterministic repeat PASS
- no parameter search after activation

Frozen pair:
- phase = 0
- |external force| = 1.05 × E0_FMAX
- right wall vs mirrored left wall
- same F2 model M, fallback F, private history representation and cost.

---

# 1. Strong alias result

The two mirrored worlds produced **exactly the same F2-private representation** over the final 24-transition history window.

Matched:

- own motor-demand sequence;
- body-local forward velocity before/after;
- inferred residual history;
- binary private touch history;
- every derived F2 private signal.

Measured:

| Quantity | Right wall | Left wall |
|---|---:|---:|
| R | ~1.0 | ~1.0 |
| binary touch fraction | 1.0 | 1.0 |
| M drive | +0.5 | +0.5 |
| F drive | 0 | 0 |
| M cost | 2.01696 | 0.71937 |
| F cost | 1.37088 | 1.36545 |
| regret M−F | **+0.64608** | **−0.64608** |
| outcome | M WORSE | M BETTER |

Thus all frozen alias criteria passed:

1. private histories equal;
2. derived signals equal;
3. same M drive;
4. same F drive;
5. regret sign reverses.

---

# 2. Information-theoretic consequence

For the audited F2 private representation:

> the two causal worlds are observationally aliased for the actor but assign opposite local action value to the same model choice.

Therefore no deterministic policy, classifier, threshold or larger learned model receiving only that private representation can correctly decide M-vs-F trust in both worlds.

This is stronger than:
- "R was not good enough";
- "we need a better threshold";
- "the model needs more capacity".

The missing information is absent from the representation.

This directly explains part of F2/P0's contact-family ambiguity.

---

# 3. Directional touch donor

D0 separately measured body-local directional contact without feeding it into M/F.

Over the same final history window:

| Directional-touch evidence | Right wall | Left wall |
|---|---:|---:|
| nonzero ticks | 24 | 24 |
| mean signed impulse | **+0.30123** | **−0.29885** |
| sign | +1 | −1 |

The lawful body-local touch relation cleanly separates the mirrored alias.

It contains:
- no World position;
- no collider identity;
- no wall semantic label;
- no object identity.

It is derived from solver contact normal/impulse in the body's frame.

Therefore:

> a lawful private relational channel exists in the same physics that can break the alias without importing World semantics.

This is a **candidate donor**, not a qualified decision rule.

---

# 4. Why this matters for ReflexBrain

F2/P0 showed:

> mismatch does not imply incompetence.

F3/D0 now shows a reason why.

A scalar mismatch/touch magnitude can erase a relation that determines causal value.

The same event magnitude:
- "strong mismatch";
- "touch";
- "body not moving as expected";

can mean opposite things depending on how it is related to:
- body direction;
- intended action;
- local consequence.

This is an important correction to any plan that tries to produce actor-relative meaning by compressing private events into one salience/surprise scalar.

---

# 5. Relationship to owned reasons

D0 does NOT establish an owned reason or matter.

It establishes a prerequisite:

> **relevance requires distinctions that are present in private experience.**

A later actor may care about:
- contact in the direction it is trying to move;
- contact behind while trying to retreat;
- change to something it previously acted on;
- an event relevant to an ongoing commitment.

But the relation itself must be represented lawfully before any local system can learn/use its relevance.

This parallels the LLM Live NPC donor:

> the same re-encounter can matter or not matter depending on actor-owned relation/history.

F3/D0 demonstrates an embodied lower-level analogue without importing the R6 `Matter` ontology.

---

# 6. What D0 does NOT prove

- directional touch is sufficient for general relevance;
- directional touch should be a final ReflexBrain input;
- contact should always matter;
- every action should create a relation;
- actor has goals;
- actor understands walls;
- actor owns a reason;
- learned meaning exists.

The pair is deliberately narrow and fixture-like.

Its purpose was identifiability.

---

# 7. Next falsifier

A justified F3A question is now available:

> Can a frozen actor-private relation between **intended local action direction** and **body-local directional touch** predict the sign of local model regret across held-out mirrored contact episodes, while generic mismatch magnitude/binary touch cannot?

Important:
- qualification set must exclude the D0 phase/force pair;
- no wall-side label;
- no World coordinates;
- no contact identity;
- no learned classifier required;
- relation should be computed directly from private action + directional touch;
- include free/no-contact controls where relation remains neutral;
- compare against R and binary touch.

Maximum future claim, if PASS:

> one lawful actor-private relational feature carries action-value information lost by non-relational event magnitudes.

Still not "meaning".

---

# 8. D0 closure

**MATERIAL ALIAS FOUND.**

The current competence-frontier picture is now:

1. G5A: lawful private difference can change later behavior;
2. F2/P0: generic mismatch does not equal competence value;
3. F3/D0: part of that ambiguity is an information alias caused by missing relational private evidence;
4. directional body-local evidence can break the alias.

This makes relational private structure a stronger next target than a larger mismatch/reliability model.
