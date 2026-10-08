# MEDIUM-D/R3B — Human-Scale MARK via Hidden Exact Shadow — ARMED — 2026-10-08

Status: **ARMED · ARCHITECTURE PROBE · NO UI**

Parent finding:
- R3A engineering mechanics PASS;
- R3A interaction-shape FAIL because old-mark replay catch-up was limited to 240 ticks (~2 s at 1×).

## Primary question

Can MARK preserve a future exact fork opportunity for **human-scale time** without pausing the visible World and without replaying an old mark later?

Candidate implementation:

> MARK immediately prepares a hidden exact reference A and visible working B at the same causal boundary; both continue synchronously and identically until Owner later chooses to expose/use the fork.

Runtime preparation is not itself an Owner causal intervention.

## Frozen donor

E01 interaction donor through the R3A exact host.

No actor/private cognition.
No Field v0.

## Frozen protocol

### Before MARK
1. create untouched control C;
2. create visible session S;
3. run both identically to tick 300;
4. require exact stable state equality.

### MARK @300
5. capture exact causal moment from S;
6. restore hidden A and replacement visible B from that same moment;
7. require immediate:
   - A == B == pre-MARK S == untouched C;
   - no branch-local experiment events;
   - MARK itself does not alter World/process state;
8. destroy old S instance after exact replacement.

This is **latent branch preparation**.

Owner-visible semantic FORK has not yet occurred.

### Human-scale continuation
9. continue:
   - untouched control C;
   - hidden A;
   - visible B;
   under identical ordinary E01 stepping for **36,000 ticks** after MARK.

At 120 Hz this represents ~5 minutes at 1×.

10. require every tick:
   - stable causal state A == B == C;
11. at regular checkpoints require exact Rapier snapshot bytes A == B == C.

No interaction/provenance event may be added merely because MARK exists.

### Late FORK exposure
12. after 36,000 ticks, invoke semantic FORK exposure;
13. require:
   - no physics/process change;
   - A == B remains exact;
   - mark age = 36,000 ticks;
   - no causal event emitted by exposure itself.

### Material intervention after late FORK
14. apply one HostBindingId-addressed impulse only to B;
15. append one B-local owner-material-impulse event;
16. require:
   - A remains untouched;
   - C remains untouched;
   - B diverges only after intervention;
   - A and C remain exact controls.

## PASS

All required:
- deterministic repeat;
- immediate MARK replacement exactness;
- 36k-tick A/B/C equality;
- periodic exact physics snapshot byte equality;
- no MARK/FORK-exposure causal provenance event;
- late exposure at 36k ticks does not perturb state;
- branch-B intervention remains local and produces divergence;
- clean destruction of all Worlds.

## FAIL

Any required property fails.

Do not rescue by:
- pausing World at MARK;
- replay catch-up;
- shortening 36k duration after observing failure;
- treating hidden A as actor knowledge;
- emitting semantic FORK into simulation state;
- hiding drift with approximate comparisons.

## Maximum claim

PASS would establish only:

> a single in-memory MARK can preserve a non-causal hidden exact reference for at least ~5 minutes of E01 runtime, allowing later semantic FORK exposure without replay catch-up.

Does NOT establish:
- multiple simultaneous marks;
- storage/tab-close persistence;
- resource scalability;
- Owner UX;
- actor-private occupant continuity;
- production architecture.

No Pages/UI changes in R3B.
