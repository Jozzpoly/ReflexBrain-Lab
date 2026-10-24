# OCTRL-B01c Result — Actual B0 Passage Effectivity Falsifier — 2026-10-06

Status: **FAIL · RUN CLOSED · EXECUTION VALID**

Run branch:
`run/octrl-b01c-actual-b0-effectivity`

Base SHA:
`c1a68af56c91c3692c083132ff6ac33e2f6dd4af`

PR:
#12 — OCTRL-B01c actual B0 passage effectivity falsifier

---

# Question

> Does the researcher-only B01b geometry label OPEN/BLOCKED correctly predict the outcome of the same minimal fixed motor protocol for the actual frozen B0 rigid body?

# Scientific outcome

**FAIL**

The researcher-side binary geometry label did not predict actual B0 effectivity.

The actual B0 crossed both fixtures under the same fixed motor protocol.

---

# Execution validity

**PASS**

- deterministic replay: true
- same B0 body mechanics in both fixtures
- same actor start
- same drive demand = +1
- same turn demand = 0
- same 360-tick budget
- no planner
- no geometry query
- no semantic OPEN/BLOCKED input to actor
- no retuning after result

CI remained green because the falsifier was designed to allow either scientific PASS or FAIL.

---

# Evidence

## OPEN fixture

- crossed: **yes**
- crossing tick: **122**
- actor final x: **3.219**
- actor final y: **-0.600**
- actor/blocker contact ticks: **53**
- blocker displacement: **0.880**

## researcher-labelled BLOCKED fixture

- crossed: **yes**
- crossing tick: **161**
- actor final x: **3.219**
- actor final y: **+0.600**
- actor/blocker contact ticks: **228**
- blocker displacement: **5.048**

The B0 body physically pushed the loose blocker and crossed.

---

# Falsified claim

Rejected:

> researcher geometric BLOCKED implies this actor cannot traverse the passage under the fixed protocol.

That implication is false for the current material world.

---

# Important replacement understanding

The result supports a stronger distinction:

## world-side geometric state

Facts such as:
- blocker occupies doorway;
- passive clearance disc cannot fit through the instantaneous geometry.

## actor effectivity

What a particular embodied actor can actually accomplish through action:
- push;
- displace;
- spend more time in contact;
- still cross.

These are not equivalent.

For movable material obstacles:

> static geometric accessibility is not actor-relative capability truth.

---

# Unexpected positive structure

Although both fixtures were traversable, they were not behaviorally equivalent.

BLOCKED relative to OPEN produced:

- crossing delay: **39 ticks** (161 vs 122)
- contact duration increase: **175 ticks** (228 vs 53)
- blocker displacement increase: **4.168** (5.048 vs 0.880)

This suggests a possible **effectivity/resistance distinction** rather than binary access.

This is an observation from B01c, not yet a separately qualified claim.

---

# Do NOT fix inside B01c

Do not respond to this FAIL by:

- increasing blocker mass;
- making blocker static;
- narrowing doorway;
- reducing B0 force;
- adding semantic blocked state;
- adding invisible collision rules.

Those would change the question after observing the result.

---

# Parent-state consequence

B01b remains valid as researcher geometry calibration.

B01c shows that B01b labels must not be promoted to actor affordance truth.

Future actor-facing semantics should prefer:

> material facts + body/action history -> actor-relative effectivity

rather than:

> world says OPEN/BLOCKED.

---

# Next candidate

A scientifically natural next run is:

**OCTRL-B01d — Actor-Relative Resistance Signature**

Question:

> Under the same frozen B0 motor protocol, does the loose-blocker state produce a stable, repeatable reduction in actor progress / increased interaction burden across modest blocker-position variation, even though both states may remain traversable?

This would test the newly observed gradient without trying to make BLOCKED literally impassable.

Do not activate automatically.

---

# Potential SPC / ReflexBrain relevance

This FAIL is strategically important.

A future resident should not be told:
- "this passage is blocked"

when the world fact is only:
- a movable body occupies it.

The resident's own body, force, history and control can change what is possible.

That is exactly the type of actor-relative semantic distinction ReflexBrain may eventually need to learn or represent.
