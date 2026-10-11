# OCTRL-B01b Result — B0-Scale Passage Calibration — 2026-10-06

Status: **PASS · RUN CLOSED**

Run branch:
`run/octrl-b01b-b0-scale-passage`

Base SHA:
`0693203d5d245c0c219c3cd7d6e501995f0b5f90`

PR:
#11 — OCTRL-B01b B0-scale passage calibration

---

# Question

> Can the qualified E02 material topology effect be rescaled using only static corridor/doorway geometry so that OPEN/BLOCKED is meaningful for frozen B0 body radius = 1.0, while preserving the same E01 process law and E02 loose-blocker physics?

# Outcome

**PASS**

One static geometry calibration exists that preserves the material topology effect under researcher clearance radius **1.0**, matching frozen B0 body radius.

---

# Frozen inputs preserved

No changes were made to:

- E01 shuttle drive law;
- E01 physical end-stop reversal;
- E02 blocker radius = 0.50;
- E02 blocker mass = 1.0;
- E02 blocker damping = 3.0;
- E02 blocker start = (0.00,+0.20);
- deterministic Rapier timestep;
- E0/B0 mechanics.

No actor was inserted.

---

# Qualified static geometry

Final B01b geometry:

- B0 research clearance radius = **1.00**
- corridor inner half-height = **1.60**
- doorway gap half-height = **1.20**
- fixed wall half-thickness = **0.12**

The final geometry was achieved without changing any dynamic process/body parameter.

---

# Evidence

## Automated deterministic campaign

B01b PASS:

- deterministic repeat = true
- control initial passage = BLOCKED
- control first-open tick = null
- interaction initial passage = BLOCKED
- first physical contact tick = 121
- first B0-scale OPEN tick = 211
- post-contact no-contact persistence = 60 ticks
- passage at persistence sample = OPEN
- blocker displacement at persistence = 3.282

## Live browser observation

At approximately tick 1774:

- control = **BLOCKED**
- interaction = **OPEN**
- shuttle = x -3.141, y -0.164
- blocker = x 3.253, y 1.024
- accumulated contact ticks = 132
- continuous post-contact no-contact ticks = 1522
- persistence OPEN = true

The researcher-only B0-sized clearance disc visually fit within the OPEN doorway without clipping or impossible geometry.

No visual artifact undermining the narrow calibration claim was observed.

---

# Causal interpretation

The same world-side mechanism remains:

`frozen E01 process -> physical blocker displacement -> local access state changes`

B01b changes only the static geometry scale so that the researcher clearance test is now evaluated at:

`radius = 1.0`

rather than E02's earlier `0.35`.

No semantic gate state or actor behavior was introduced.

---

# Claim scope

Allowed claim:

> One static corridor/doorway geometry exists in which the already-qualified E01/E02 material topology mechanism has a coherent OPEN/BLOCKED interpretation for a circular clearance equal to frozen B0 body radius 1.0.

This resolves the **research geometry scale mismatch**.

---

# This does NOT establish

B01b does not establish:

- that an actual B0 rigid body can traverse the OPEN passage;
- that it cannot traverse the BLOCKED passage;
- controller stability near the doorway;
- turning/alignment behavior;
- B1 morphology value;
- body/ecology integration as a whole;
- navigation competence;
- perception/memory;
- actor-relative meaning;
- living-world behavior.

The clearance audit remains researcher truth.

---

# Next falsifier

The next natural run should replace the abstract clearance disc with the **actual frozen B0 body**.

Candidate:

**OCTRL-B01c — Actual B0 Passage Traversal**

Question:

> Under the frozen B01b geometry, can the unchanged B0 body seam physically traverse the OPEN state and fail to traverse the BLOCKED state under a minimal fixed motor protocol, without hidden navigation or geometry queries?

This should be a separate run.

---

# Potential SPC donor value

Narrow donor value:

> world-side material topology can be scaled to a known resident body envelope without semantic affordance labels.

Actual resident capability remains unproven until B01c.
