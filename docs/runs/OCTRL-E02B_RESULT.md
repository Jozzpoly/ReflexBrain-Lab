# OCTRL-E02b Result — Composition Robustness / Anti-Fixture — 2026-10-06

Status: **PASS · RUN CLOSED**

Run branch:
`run/octrl-e02b-composition-robustness`

Base SHA:
`38eab07948a272ff865e6bc67fe151400bed3c0a`

PR:
#9 — OCTRL-E02b composition robustness qualification

---

# Question

> After freezing the E02a composition, does the geometry-driven passage-state effect survive modest held-out initial-condition variation rather than existing only as one tuned fixture?

# Outcome

**PASS**

The frozen E02a composition survived the exact predeclared held-out initial-position set without retuning.

---

# Frozen qualification design

Baseline sanity:
- B0 = `(x=0.00, y=+0.20)`

Held-out cases:
- H1 = `(0.00, +0.10)`
- H2 = `(0.00, +0.30)`
- H3 = `(0.00, -0.20)`
- H4 = `(-0.10, +0.20)`
- H5 = `(+0.10, +0.20)`

The set and thresholds were committed on the parent branch before the run branch was created.

No held-out case was added, removed or replaced after activation.

No E02a mechanism was retuned.

---

# Frozen PASS contract

Each case had to satisfy:

- initial passage BLOCKED;
- real shuttle/blocker contact;
- passage becomes OPEN;
- >= 60 continuous post-contact no-contact ticks;
- passage OPEN at persistence sample;
- blocker displacement at persistence >= 0.9;
- deterministic repeat PASS.

E02b PASS required:

> B0 regression PASS + all five held-out H1-H5 PASS.

---

# Evidence

## CI qualification

GitHub Check passed with:

- baselinePass = true
- heldOutPassCount = 5
- heldOutTotal = 5
- campaignPass = true

## Browser runtime qualification

The deployed frozen qualification surface reproduced PASS for all six cases:

| case | start x | start y | contact | first OPEN | no-contact at stop | displacement | persistence OPEN | deterministic |
|---|---:|---:|---:|---:|---:|---:|---|---|
| B0 | 0.00 | +0.20 | 121 | 191 | 60 | 3.847 | true | PASS |
| H1 | 0.00 | +0.10 | 121 | 192 | 60 | 3.752 | true | PASS |
| H2 | 0.00 | +0.30 | 119 | 191 | 60 | 3.804 | true | PASS |
| H3 | 0.00 | -0.20 | 121 | 191 | 60 | 3.847 | true | PASS |
| H4 | -0.10 | +0.20 | 119 | 192 | 60 | 3.947 | true | PASS |
| H5 | +0.10 | +0.20 | 123 | 190 | 60 | 3.748 | true | PASS |

No held-out case required case-specific retuning.

---

# Important interpretation correction

The browser observer flagged that every case reports exactly `60` post-contact no-contact ticks and suggested this means zero robustness margin.

That interpretation is **not supported by the harness design**.

Each frozen case terminates as soon as the corrected persistence condition is first satisfied:

> `postContactNoContactTicks >= 60` while passage remains OPEN.

Therefore the recorded value is expected to be exactly 60 for successful cases.

The table does **not** measure how long separation would continue beyond the qualification threshold.

Consequently:

- exact `60` is not evidence of fragility;
- it is also not evidence of extra temporal margin.

No broader margin claim is promoted.

---

# Qualified claim

Allowed claim:

> The frozen E02a material composition is not restricted to its single tuned blocker position. It survives the declared modest local initial-position neighborhood and one mirrored asymmetry under the unchanged corrected E02a qualification contract.

This rejects the strongest explanation that E02a existed only at the single tuned start position `(0.00,+0.20)`.

---

# This does NOT establish

E02b does not establish:

- general parameter robustness;
- mass/friction robustness;
- shuttle phase robustness;
- arbitrary blocker placement robustness;
- arbitrary world-layout robustness;
- actual B0/B1 actor traversability;
- occlusion/private epistemics;
- navigation value;
- M0-Lite ecology as a whole;
- actor-relative meaning;
- living-world behavior;
- ReflexBrain semantic pressure;
- SPC resident competence.

---

# Process finding

E02a and E02b together demonstrate a useful separation:

- **E02a** was allowed to discover/tune one existence specimen.
- **E02b** froze that specimen and independently tested a predeclared local neighborhood.

This avoided both opposite errors:

1. calling one tuned fixture "robust";
2. trying to discover and qualify robustness in the same run.

---

# Parent-state consequence

The dynamic-material-topology hypothesis is strengthened from:

- one qualified existence specimen

to:

- one frozen composition surviving a declared modest initial-position held-out set.

This is enough to stop polishing this ecology primitive.

The next natural campaign question is no longer "make the shuttle more robust".

The next candidate should return to the organism substrate and test whether an existing qualified body seam can inhabit this physical ecology without redesign.

Suggested next run:

**OCTRL-B01 — E0 Body Seam Transfer / Early Integration Pulse**

Do not activate automatically.

---

# Potential SPC donor value

Narrow donor principle:

> ordinary non-cognitive world dynamics can create local physical opportunity changes that are not tied to one exact authored initial placement.

This remains only world-side donor evidence.

It does not establish that an SPC resident can perceive, remember, interpret or exploit those changes.
