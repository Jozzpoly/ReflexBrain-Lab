# MEDIUM-D/R3B — Human-Scale MARK via Hidden Exact Shadow — RESULT — 2026-10-08

Status: **PASS · ARCHITECTURE PROBE CLOSED · NO UI**

PR: #38

Execution history:
- first CI `37708041679`: harness timeout after ~8.5 s; the full R3B result had already been produced and showed no causal failure;
- only the Vitest per-test timeout was increased from default 5 s to 20 s;
- frozen 36,000-tick duration, protocol and criteria were unchanged;
- final CI `37708123920`: PASS;
- 22/22 test files PASS;
- TypeScript PASS;
- Vite build PASS.

## Frozen result

- MARK tick: **300**
- hidden-human-scale continuation: **36,000 ticks**
- semantic FORK exposure tick: **36,300**
- mark age at exposure: **36,000 ticks**
- equivalent wall-clock at 1× / 120 Hz: **300 s (~5 min)**
- reference provenance events before intervention: **0**
- working branch provenance events after intervention: **1**
- late material intervention tick: **36,300**
- hidden reference still matched untouched control after intervention: **true**
- working B diverged after intervention: **true**
- deterministic full repeat: **true**

## What MARK actually did

At tick 300 the session:

1. captured an exact E01 causal moment;
2. instantiated hidden reference A;
3. instantiated replacement visible working B;
4. required A == B == pre-MARK visible state;
5. destroyed the old visible host only after exact replacement succeeded.

The visible trajectory therefore continued from an exact restored B.

This is runtime preparation, not an Owner causal intervention.

No experiment event was emitted merely because MARK existed.

## Long hidden continuation

For 36,000 post-MARK ticks:

- untouched control C;
- hidden reference A;
- visible working B;

advanced under the same ordinary E01 rules.

Every tick:
- stable causal state A == B == C.

At regular checkpoints:
- exact Rapier snapshot bytes A == B == C.

Thus the hidden reference did not drift and MARK did not perturb the visible causal trajectory for the frozen five-minute interval.

## Late semantic FORK

Only after the full 36,000-tick interval did the host expose semantic FORK.

Exposure itself:
- changed no physics;
- changed no process state;
- emitted no causal provenance event;
- preserved A == B exactly.

This demonstrates the key separation:

> **runtime latent branch preparation can happen at MARK while Owner-visible FORK can happen much later.**

The implementation may prepare causal infrastructure before the Owner decides to use it, as long as that preparation is demonstrably non-causal to the specimen trajectory.

## Late material intervention

After semantic FORK exposure:

- one HostBindingId-addressed material impulse was applied only to B;
- B received one branch-local `owner-material-impulse` provenance event;
- A received no event;
- untouched C received no event;
- A remained exact with C;
- B diverged.

Thus late FORK exposure did not consume or corrupt the reference history.

## Defended claim

> In the deterministic E01 donor, one in-memory MARK can prepare a hidden exact reference/working pair and preserve a future exact fork opportunity for at least five minutes of simulated runtime without pausing the visible World, replaying from an old mark, or perturbing the visible trajectory.

This directly resolves the specific interaction-architecture failure found in R3A.

## Important semantic distinction

The project grammar still uses:

WATCH → MARK → FORK → INTERVENE …

But the runtime may implement MARK by preparing latent branches immediately.

Therefore:

- **MARK semantic meaning:** preserve this causal opportunity;
- **latent branch preparation:** host implementation detail;
- **FORK semantic meaning:** Owner chooses to expose/use the alternative history.

Do not confuse internal allocation time with Owner causal intent.

## Limits

PASS does NOT establish:
- multiple simultaneous marks;
- long-term memory/storage persistence;
- closed-tab persistence;
- arbitrary numbers of branches;
- resource budgeting;
- garbage collection strategy for unused marks;
- browser UI usability;
- actor-private occupant sidecars in the same long shadow run;
- cross-build migration;
- production architecture.

The donor is still E01 without an actor occupant.

## Medium consequence

R3A rejected:

> old-mark replay catch-up with a short evidence horizon.

R3B supports:

> **human-scale MARK through non-causal hidden continuation.**

This is now the preferred interaction architecture for the next prototype slice.

Next:
- MEDIUM-D/R3C should replace R3A's expiring replay-catch-up mechanism with latent shadow MARK;
- preserve the world-first UI shape;
- no homepage promotion;
- Opera live inspection again;
- Owner usability remains unqualified.
