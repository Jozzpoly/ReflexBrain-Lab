# OCTRL-P01a Result — Private Proprioceptive Effectivity Exposure — 2026-10-07

Status: **SCIENTIFIC FAIL · EXECUTION VALID · RUN CLOSED**

Run branch:
`run/octrl-p01a-private-proprioceptive-effectivity`

Base SHA:
`9a67b1178861fe93e65b681227823254aa007ed5`

PR:
#14 — OCTRL-P01a private proprioceptive effectivity exposure

---

# Question

> Does the B01d-qualified actor-relative effectivity difference appear in a legal actor-private proprioceptive stream, without exposing external-object identity, global World coordinates or semantic OPEN/BLOCKED state?

# Outcome

**FAIL**

The broad body-level signal is present in the legal private stream, but the frozen qualification contract required that the first private proprioceptive divergence appear no later than one tick after the microscope-observed first actor↔blocker contact.

H2 violated that timing requirement.

No threshold was changed after evidence.

---

# Execution validity

**PASS**

- B01d physical regressions reproduced exactly;
- all private traces replayed deterministically;
- motor-demand sequences were identical;
- private sample schema contained only:
  - drive/turn demand;
  - body-local forward/lateral delta;
  - body-local turn delta;
  - cumulative private odometry;
- no external-object identity;
- no blocker World position;
- no actor World position;
- no collider/entity handle;
- no OPEN/BLOCKED label;
- no learned scalar;
- no memory/controller adaptation.

CI:
- TypeScript: PASS
- Vitest: PASS
- Vite build: PASS
- 8 test files / 8 tests: PASS

The test intentionally permits scientific PASS/FAIL while requiring execution validity.

---

# Frozen audit evidence

OPEN private forward odometry at frozen audit tick 122:

**4.493144**

Held-out cases:

| Case | first blocker contact | first private divergence | private forward odom @122 | ordering @122 | timing contract |
| --- | ---: | ---: | ---: | --- | --- |
| H1 | 58 | 59 | 3.316701 | lower than OPEN | PASS |
| H2 | 58 | **60** | 3.376581 | lower than OPEN | **FAIL** |
| H3 | 58 | 59 | 3.333731 | lower than OPEN | PASS |
| H4 | 56 | 57 | 3.294149 | lower than OPEN | PASS |
| H5 | 61 | 62 | 3.368709 | lower than OPEN | PASS |

All five:
- deterministic replay PASS;
- B01d physical-regression parity PASS;
- identical motor demand PASS;
- no private divergence before physical contact PASS;
- private forward odometry at tick 122 lower than OPEN PASS.

Only H2 failed:
`first private divergence <= first contact + 1`.

For H2:
- contact = 58
- allowed latest divergence = 59
- observed divergence = 60

---

# Falsified claim

Rejected as written:

> the declared legal proprioceptive channel exposes the body consequence no later than one tick after the first microscope-observed actor↔blocker contact in every B01d held-out case.

That timing claim is false.

---

# Important replacement understanding

P01a exposes another evidence-plane distinction:

## microscope physical contact

A researcher can observe a collider-pair contact manifold/event.

## actor-private body consequence

The actor can observe only the resulting change in its own sensorimotor/proprioceptive stream.

These need not become distinguishable on the same tick or the immediately following tick.

H2 shows a two-tick gap under the frozen sampling protocol.

Therefore:

> **researcher-observed contact time must not be promoted to actor-experienced consequence time.**

This is analogous to the earlier B01c correction:
World-side geometric truth was not actor-effectivity truth.

Now:
microscope contact truth is not identical to actor-private experiential timing.

---

# Positive structure that survived the FAIL

Do not discard the rest of the evidence.

Across all H1-H5:

- private trace was identical to OPEN before physical interaction;
- private trace later diverged deterministically;
- at the already-frozen B01d OPEN crossing tick 122, every held-out case had materially less private forward odometry than OPEN.

Thus the evidence strongly supports, but does not yet separately qualify:

> the B01d effectivity difference reaches the legal actor-private proprioceptive stream without World labels or object identity.

What failed is the over-specific immediate timing contract.

Do not retrospectively relabel P01a PASS.

A later run may ask a better question with a criterion defined independently of microscope contact tick.

---

# Do NOT repair inside P01a

No:
- change `contact+1` to `contact+2`;
- tune epsilon;
- add contact identity;
- expose blocker state;
- add external perception;
- add memory;
- create a resistance score.

P01a remains FAIL.

---

# Parent-state consequence

Preserve both facts:

1. **P01a scientific FAIL** — one-tick contact-to-proprioception timing claim rejected.
2. **Strong surviving evidence** — all B01d held-out effectivity cases produce later legal private proprioceptive divergence and lower private progress at frozen tick 122.

The next question should be selected from the North Star, not by repairing P01a's threshold.

A plausible future direction is to define actor-experienced consequence from the private stream itself rather than synchronize it to a researcher contact event.

No next run is activated here.

---

# Potential ReflexBrain/SPC donor value

A future resident should not be told that an external contact event was "experienced" merely because the physics microscope saw a manifold.

Actor experience begins when its legal private channel changes.

This distinction matters for:
- causal provenance;
- private history;
- self/world interpretation;
- later learned semantic pressure.

It does not establish memory, interpretation or learning.
