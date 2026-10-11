# MEDIUM-C/R5 — Actor-Private Occupant Sidecar in Exact Causal Moment — ARMED — 2026-10-08

Status: **ARMED · ARCHITECTURE PROBE · NO OWNER UI**

Parent evidence:
- MEDIUM-C/R0 PASS — exact physics + explicit non-physics process sidecar;
- MEDIUM-C/R2a PASS — current P02a frame reconstructs at restored causal boundary without stepping;
- MEDIUM-C/R2c FAIL -> R3 PASS — HostBindingId is required for durable host/runtime identity;
- MEDIUM-C/R4 PASS — versioned ExperimentMoment provides exact E01 restore/fork/provenance;
- C01 PASS — legal actor-private last-seen history can initiate later physical CHECK without researcher CHECK-release.

## Primary question

Can an exact causal ExperimentMoment carry a **legitimate actor-private occupant sidecar** such that:

1. source and restored actor continue identically through history-dependent action;
2. current legal P0 is reconstructed from restored physics, but remembered private history is **not** reconstructed from World truth;
3. a fork that changes only private history remains physically identical until that private difference legally reaches motor output;
4. incompatible/missing occupant sidecar fails closed rather than silently defaulting?

## Why not Field v0

Field v0 has known integrity failures:
- broken sweeper integration in long-run soak;
- incomplete/researcher-selected contact seam;
- simple jam-prone controller.

Serializing Field v0 now would fossilize known-bad architecture.

R5 therefore uses a **minimal C01-lineage occupant donor** with the same defended causal shape:
- legal P02a observation;
- private last-seen record;
- private local tick / evidence age;
- bounded authored CHECK;
- no World coordinates/target identity in private state.

This is continuity research, not new organism qualification.

## Frozen moment

Capture at causal tick **200**, after:
- initial legal P0 visibility;
- actor-caused P0 loss;
- hidden World target impulse at tick 155;
- current P0 is empty;
- private last-seen remains from the earlier legal observation;
- CHECK has **not yet** begun.

The crucial condition is:

> World at tick 200 does not contain enough legal current evidence to reconstruct the actor's remembered last-seen record.

## Frozen envelope extension

Do not mutate R4 schema v0 semantics.

Introduce a new developer-only envelope generation, conceptually:

`ExperimentMomentV1<TWorldProcess,TPrivate>`

with:
- schemaVersion v1;
- buildIdentity;
- provenance;
- Rapier snapshot;
- HostBindingRegistry;
- worldProcessState;
- **occupantPrivateStateSchema**;
- **occupantPrivateState**.

The generic medium layer does not interpret actor semantics. An occupant-specific validator/restore seam must validate its payload.

## Frozen actor-private sidecar

R5 private state may contain only causally necessary, actor-owned/control-private fields:

- privateTick;
- bodyOdom;
- lastSeen legal P02a blob + private acquisition tick;
- mode;
- checkDuration;
- lastSelfMotion needed by next private update.

Must NOT contain:
- target/world coordinates;
- HostBindingId;
- Rapier handle;
- hidden impulse tick/flag;
- World event provenance;
- researcher object identity.

## Frozen World/process sidecar

May contain host/runtime facts needed for exact continuation:
- causalTick;
- whether the researcher World impulse has already been applied;
- frozen future World-event schedule;
- host role -> HostBindingId wiring for actor/target/occluder.

This is microscope/runtime state, not actor-private state.

## Protocol

### Source
1. create deterministic C01-lineage world and legal private occupant;
2. run to causal tick 200;
3. require current P0 empty and private lastSeen non-null;
4. capture Moment M200 with exact physics, bindings, World/process sidecar and private occupant sidecar.

### Exact restore
5. restore M200 without physics warm-up;
6. reconstruct current P0 from restored physics;
7. require reconstructed P0 exactly equals source current P0;
8. restore private sidecar directly — do not infer lastSeen from World;
9. continue source/restored identically for **220 ticks**;
10. require identical private decisions, body/target physics and CHECK/reobservation timing.

### Private-history fork
11. create A/B children from M200;
12. A retains exact private sidecar;
13. B receives one declared experimental intervention: clear private lastSeen only; append one branch-local provenance event;
14. before private history reaches motor output, physical World states must remain identical;
15. A must eventually initiate the defended stale-evidence CHECK;
16. B must not initiate equivalent CHECK from missing history;
17. first physical A/B divergence must occur only after the first motor-demand divergence caused by private state.

### Fail-closed controls
18. missing occupantPrivateState -> reject;
19. wrong occupantPrivateStateSchema -> reject;
20. wrong build/schema version -> reject;
21. sidecar containing forbidden host identity field in private payload -> occupant validator rejects.

## PASS — all required

- deterministic repeat;
- exact M200 immediate restore;
- current P0 reconstructs exactly without stepping;
- source/restored private state and later action remain exact for 220 ticks;
- A/B fork physically identical before private-state-driven motor divergence;
- memory-ablation provenance exists only in B;
- A CHECKs; B does not;
- first physical divergence follows, not precedes, private/motor divergence;
- all frozen corruption controls reject.

## FAIL

Any frozen condition fails under valid apparatus.

Do not rescue by:
- reconstructing lastSeen from World position;
- copying World/HostBindingId into private memory;
- adding a warm-up physics step;
- weakening occupant schema validation;
- moving the capture tick after CHECK;
- changing the C01 evidence-age threshold to force divergence.

## Maximum claim

PASS would establish only:

> a versioned causal moment can include an explicit actor-private occupant sidecar strongly enough to restore and fork one history-dependent embodied trajectory without deriving memory from World truth.

Does NOT establish:
- Owner save/fork UX;
- final generic organism snapshot schema;
- Field Lab persistence;
- cross-build migration;
- natural memory/object identity;
- organism continuity/life;
- learned ReflexBrain.

No Pages/UI changes in this run.


---

## Closure

**PASS · CLOSED.** See `docs/medium-runs/MEDIUM-C-R5_RESULT.md`. No capture tick, C01 timing threshold, private-state field set, World event schedule or restore criterion was relaxed after evidence. No Owner-facing save/fork feature is activated.
