# OCTRL-B01d Result — Actor-Relative Resistance Signature — 2026-10-06

Status: **PASS · RUN CLOSED**

Run branch:
`run/octrl-b01d-actor-relative-resistance`

Base SHA:
`6a0aeca5bb18ece6292e0bdfc7b8f76837c97b18`

PR:
#13 — OCTRL-B01d actor-relative resistance signature

---

# Question

> Under the same frozen B0 body and the same fixed motor protocol, does placing the same movable blocker in the doorway produce a stable actor-relative effectivity signature — later crossing and more physical contact — across modest held-out blocker positions?

# Outcome

**PASS**

The narrow local resistance/effectivity ordering survived all five predeclared actor-effectivity cases without retuning.

---

# Frozen protocol

Unchanged from B01c:

- B0 radius = 1.0
- B0 mass = 1.0
- frozen E0 damping / FMAX / TMAX
- actor start = (-3.20, 0.00)
- heading = +X
- drive = +1
- turn = 0
- tick budget = 360
- crossing threshold x > 1.25
- B01b static geometry unchanged
- E02 blocker radius/mass/damping unchanged
- no planner
- no perception
- no geometry query
- no semantic OPEN/BLOCKED input

---

# OPEN regression

Qualified B01b OPEN material position:

- blocker start x = 3.184146
- blocker start y = 0.993543
- crossing tick = **122**
- actor/blocker contact ticks = **53**
- deterministic repeat = **PASS**

This exactly reproduces the frozen B01c OPEN regression.

---

# Held-out evidence

| Case | blocker start | crossing tick | contact ticks | later than OPEN | more contact than OPEN |
| --- | --- | ---: | ---: | --- | --- |
| H1 | (0.00,+0.10) | **163** | **255** | PASS | PASS |
| H2 | (0.00,+0.30) | **157** | **166** | PASS | PASS |
| H3 | (0.00,-0.20) | **161** | **228** | PASS | PASS |
| H4 | (-0.10,+0.20) | **163** | **203** | PASS | PASS |
| H5 | (+0.10,+0.20) | **160** | **219** | PASS | PASS |

All five cases replayed deterministically.

Every case crossed within the fixed budget; none required the Infinity branch of the predeclared latency rule.

Observed crossing delay relative to OPEN:
- H1: +41 ticks
- H2: +35 ticks
- H3: +39 ticks
- H4: +41 ticks
- H5: +38 ticks

Observed contact increase relative to OPEN:
- H1: +202 ticks
- H2: +113 ticks
- H3: +175 ticks
- H4: +150 ticks
- H5: +166 ticks

CI:
- Check workflow: **PASS**
- 7 test files / 7 tests: **PASS**
- TypeScript + Vitest + Vite build: **PASS**

No browser/TinyFish qualification was required by the frozen B01d contract and none was used.

---

# Qualified claim

Allowed:

> For this frozen B0 body and fixed motor protocol, doorway occupancy by the same movable blocker produces a stable local actor-relative resistance/effectivity signature across the declared blocker-position neighborhood: progress to the same crossing threshold is later and physical actor/blocker contact is greater than in the qualified OPEN reference.

This is a narrow effectivity relation between:
- material configuration;
- one body;
- one fixed action protocol.

It is not a world-side binary accessibility label.

---

# This does NOT establish

Do not promote B01d into:

- effort;
- reward;
- generic difficulty;
- semantic affordance;
- learned representation;
- actor perception of resistance;
- controller adaptation;
- body-independent accessibility;
- general topology competence;
- living-world behavior;
- ReflexBrain semantic competence.

It also does not show that crossing latency/contact are the right long-term sufficient statistics.

They are qualified only as two observable consequences that preserve the declared ordering in this local comparison.

---

# Scientific consequence

B01c and B01d together sharpen the current model:

> world-side geometry and actor-relative effectivity are different evidence planes.

The movable blocker did not make the passage impossible for B0.

It did, however, reliably change the consequences of the same action:
- slower progress to the same spatial threshold;
- more sustained physical interaction.

This is materially closer to the project's actor-relative meaning question than a researcher-authored OPEN/BLOCKED bit, while still remaining purely mechanistic evidence.

---

# Process consequence

The run remained atomic:

- one manipulated uncertainty: blocker initial position;
- one frozen body/protocol;
- one predeclared held-out set;
- no parameter rescue;
- no next-run implementation.

**STOP after merge and re-plan from parent truth.**
