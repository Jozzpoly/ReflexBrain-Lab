# MEDIUM-D/R3A — Material Interaction-Shape Prototype — RESULT — 2026-10-08

Status: **MIXED · ENGINEERING PASS · INTERACTION-SHAPE FAIL · CLOSED**

Evidence:
- PR #36
- engineering CI 37707308482: PASS
- parent Check after merge: PASS
- Research Preview / Pages deploy: PASS
- live Opera inspection: completed
- prototype: probes/medium-d-r3a-material-fork.html

## What passed

Engineering substrate:
- 21/21 tests;
- MARK capture did not alter source continuation;
- exact A/B catch-up succeeded for tested 120-tick age;
- branch A remained untouched;
- branch B received one HostBindingId-addressed owner-material-impulse;
- provenance remained branch-local;
- catch-up older than frozen 240-tick bound failed closed;
- build and public Pages deployment succeeded.

Initial visual interaction-shape inspection:
- World is clearly the dominant surface;
- permanent right-side dashboard gravity is gone;
- MARK is small and stable;
- utilities are recessed into a compact disclosure;
- causal rail is quiet before a mark exists;
- prototype is visibly labelled unqualified;
- no actor/private semantics are invented.

These are useful surviving design findings.

## Material interaction FAIL

The exact-fork strategy used in R3A is:

1. MARK captures a causal moment;
2. live source keeps running;
3. later FORK restores A/B from MARK;
4. both replay/catch up to current source tick;
5. R3A refuses catch-up older than 240 ticks because that was the frozen defended horizon inherited from R4-style exact continuation.

E01 runs at 120 simulation ticks/second.

Therefore:
- 240 ticks = about **2 seconds at 1x**;
- 0.5x only stretches this to about **4 seconds**.

This is fundamentally incompatible with the intended Owner interaction:

> notice something → MARK → keep watching / think → later decide to FORK.

A human-scale causal bookmark cannot expire after roughly two seconds.

This is not a CSS/usability polish issue. It is an architecture/interaction mismatch.

## What must NOT be done

Do not rescue R3A by:
- pausing the World automatically on MARK;
- turning MARK into a modal experiment state;
- silently allowing unvalidated arbitrarily long replay catch-up;
- hiding the expiry;
- asking Owner to click FORK immediately;
- slowing the whole World merely to buy UI time.

All would violate the world-first interaction goal.

## Stronger architecture candidate

MARK should preserve a future fork opportunity **while World continues**.

Candidate:

### live shadow reference

At MARK:
- capture exact causal moment;
- instantiate one hidden shadow/reference history immediately at the same causal boundary;
- visible source and hidden reference then advance synchronously under identical ordinary inputs;
- MARK remains visually just a quiet bookmark;
- no visible fork/workbench state is required.

Later, when Owner chooses FORK:
- current visible source can become working branch B;
- hidden reference becomes A;
- exact equality at the fork exposure boundary is verified;
- no long replay from an old mark is required.

This changes the cost model:
- more compute/storage begins at MARK;
- but Owner gains human-scale time to think without freezing World.

Important:
the hidden reference must remain non-causal to source and must prove long-run exactness.

## Next falsifier

MEDIUM-D/R3B should test:

> Can one MARK spawn a non-causal hidden shadow reference that stays exactly synchronized with the visible E01 source for a genuinely human-scale interval, so FORK can be exposed much later without replay catch-up?

Candidate pressure:
- at least 10k–50k simulation ticks;
- exact state equality throughout or at strong checkpoints;
- no source provenance changes merely because MARK exists;
- independent shadow World;
- branch exposure later does not perturb either history;
- clear resource ownership/destruction.

Only after R3B should the UI remove the short expiry.

## R3A conclusion

R3A was useful precisely because it failed before becoming a feature.

Surviving interaction insight:

> world-first + contextual tools is promising.

Rejected implementation insight:

> old-mark replay catch-up bounded to 240 ticks is not a viable Owner interaction primitive.

No homepage promotion.
No Owner experimental-value claim.
