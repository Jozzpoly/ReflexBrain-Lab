# OCTRL-E01 Result — Independent Mechanical Process Null — 2026-10-06

Status: **PASS · RUN CLOSED**

Run branch:
`run/octrl-e01-independent-mechanical-process`

Base SHA:
`e5404792021962ea1cc01124a94106a8f26ae1da`

PR:
#7 — OCTRL-E01 independent mechanical process

---

# Question

> Can one bounded, locally driven physical process continue without Owner/focal-agent input and produce persistent material displacement without reducing to global timer choreography?

# Outcome

**PASS**

The narrow E01 hypothesis survived its declared falsifiers.

---

# Evidence

## Automated deterministic qualification

GitHub Check passed on the implemented E01 mechanism.

Observed automated evidence from the deployed probe:

- deterministic repeat: **PASS**
- control right reversal tick: **232**
- interaction right reversal tick: **243**
- interaction delay: **11 ticks**
- first shuttle/loose-body contact: **tick 123**
- loose-body contact duration: **66 ticks**
- persistent loose-body displacement: **1.137**
- first interaction reversal cause: **right-end physical contact @ tick 243**
- subsequent left reversal: **left-end physical contact @ tick 494**

The direction controller changes direction only after physical contact with the corresponding end-stop.

No global scenario timer/phase decides reversal.

## Long live observation

The deployed probe was allowed to run beyond **8936 ticks**.

Observed:

- repeated alternating physical end-stop reversals;
- control and interaction trajectories remained observably phase-separated;
- loose body remained displaced and at rest after interaction;
- independent mechanical process continued without Owner or focal-agent control.

Representative late observation:

- control shuttle x = 0.340, dir = +1
- interaction shuttle x = 3.334, dir = -1
- loose body x = 1.003, y = 0.760, speed = 0
- loose contact ticks remained 66

No visual artifact was observed that contradicted the automated causal claim.

---

# What caused the PASS

The useful causal chain exists using only:

`bounded local drive -> shuttle motion -> rigid-body contact -> loose-body displacement -> persistent changed material state`

The loose-body interaction also changes later shuttle timing/state relative to the no-loose-body control.

This establishes that the process is not merely a visual animation with an independent clock.

---

# Instrumentation incident

The first browser observation attempt returned 404 because the E01 nested HTML probe had not been included as a Vite build entrypoint.

This was an **observation-infrastructure defect**, not evidence about E01.

The fix only added the E01 HTML probe as a Vite build input.

No E01 physical mechanism, force law, collision rule, initial condition or qualification threshold was changed.

After redeploy:
- Check passed;
- Research Preview passed;
- live browser observation succeeded.

The temporary run-branch preview trigger was removed before closure.

---

# Claim scope

Allowed claim:

> A minimal bounded non-agent physical process can create deterministic, persistent exogenous material change through ordinary local physical coupling, and interaction with loose material can causally alter the process's later timing/state.

This is enough to qualify the **independent-process primitive** for the next ecology question.

---

# This does NOT establish

E01 does **not** establish:

- M0-Lite ecology as a whole;
- useful topology/chokepoint pressure;
- partial observability;
- living world;
- autonomous actor;
- body suitability;
- actor-relative meaning;
- private memory pressure;
- ReflexBrain semantic pressure;
- SPC resident competence;
- social causality.

In particular:

> E01 PASS does not mean "the world is alive".

It means one minimal source of independent material causality is real enough to reuse.

---

# Unexpected findings

## Positive

A single loose-body interaction produced an **11-tick deterministic phase shift** in the shuttle trajectory while also leaving a persistent material displacement.

This is more useful than a process whose path is physically decorative but temporally invariant.

## Process finding

The new atomic-run discipline worked as intended.

E01 could be completed without adding:
- topology;
- body morphology;
- perception;
- memory;
- concern;
- Local Brain.

The run produced a bounded claim rather than an unfinished mini-platform.

---

# Debt / open questions

Not resolved here:

- can this process compose with static geometry so its material consequences change locally relevant accessibility?
- does that composition remain robust rather than puzzle-shaped?
- is the process visually useful once embedded in a small ecology?
- how should a body inhabit that ecology?

These belong to future runs.

---

# Parent-state consequence

E01 supports keeping the current **M0-Lite independent process hypothesis** alive.

It does not yet qualify M0-Lite.

The most natural next candidate question remains:

**OCTRL-E02 — Material Composition / Topology**

But E02 is not automatically activated by this PASS.

The parent campaign must first persist/accept E01 and reconsider the next run.

---

# Potential SPC donor value

Narrow donor principle:

> world pressure can originate from ordinary non-cognitive material dynamics rather than requiring LLM decisions, Owner input or explicit scripted events.

This may later matter for SPC because residents can encounter consequences generated by the World itself.

This result does **not** show that an SPC actor can perceive, interpret or respond to those consequences.
