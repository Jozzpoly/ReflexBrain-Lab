# MEDIUM-C/R5 — Actor-Private Occupant Sidecar in Exact Causal Moment — RESULT — 2026-10-08

Status: **PASS · ARCHITECTURE PROBE CLOSED · NO OWNER FEATURE**

PR: #32
CI: `37700673615`
Job: `113063095117`
Evidence head: `0774510a3f7c993e43a02fa6282fbfb26f874316`

## Outcome

**PASS.**

- 19/19 Vitest files/tests: PASS
- TypeScript: PASS
- Vite build: PASS
- deterministic full probe repeat: PASS

Frozen donor timing was reproduced:
- actor-caused P0 loss: tick **51**
- capture moment: tick **200**
- remembered last-seen acquisition: private tick **51**
- current P0 at capture: **empty**
- history-driven CHECK: tick **231**
- fresh legal P0 re-observation: tick **318**

Rapier physics snapshot at M200:
- **3171 bytes**

---

# 1. Exact restore through private-history-dependent action

At causal tick 200:

- current legal P0 was empty;
- World hidden target impulse from tick 155 had already happened;
- private state still contained the earlier legal last-seen blob from private tick 51;
- occupant mode was QUIET;
- CHECK had not begun.

Moment M200 captured:

- versioned ExperimentMoment v1;
- exact Rapier snapshot;
- HostBindingRegistry;
- explicit World/process sidecar;
- explicit C01-lineage actor-private sidecar;
- provenance.

Private sidecar contained only:

- privateTick;
- bodyOdom;
- legal lastSeen blob + private acquisition tick;
- mode;
- checkDuration;
- lastSelfMotion.

It did **not** contain:

- target/World coordinates;
- HostBindingId;
- Rapier handle;
- hidden event tick/flag;
- researcher object identity.

Immediately after restore:

- current P0 was reconstructed from restored physics without stepping;
- reconstructed P0 exactly matched source current P0;
- private remembered lastSeen came from the private sidecar, not World reconstruction;
- complete source/restored snapshot matched.

Source and restored host then continued identically for **220 ticks**.

First CHECK:
- source: **231**
- restored: **231**

First re-observation:
- source: **318**
- restored: **318**

No decision/physics/private-state divergence occurred.

---

# 2. Private-history A/B fork

Two independent children were restored from exact M200.

Before intervention:
- same physics;
- same current P0;
- same World/process state;
- same private state.

Branch A:
- retained private lastSeen.

Branch B:
- one explicit experiment intervention cleared only private `lastSeen`;
- provenance received one branch-local event:
  - `occupant-private-memory-ablation`
  - causal tick **200**.

Immediately after private intervention:
- physical World remained identical.

From tick 201 through 230:
- physical World remained identical;
- motor demands remained identical.

At tick **231**:
- branch A private evidence age reached the authored stale threshold and initiated CHECK;
- branch B had no remembered observation and did not CHECK;
- **first motor-demand divergence: 231**
- **first physical divergence: 231**, after the divergent motor command was applied.

Branch A:
- CHECK: **yes, tick 231**

Branch B:
- CHECK: **never** in the frozen comparison horizon.

Thus:

> the material fork divergence was caused by preserved/private historical state, not hidden World reconstruction or pre-existing physics divergence.

---

# 3. Fail-closed controls

All frozen controls rejected:

- missing `occupantPrivateState`;
- wrong occupant-private schema;
- wrong build identity;
- wrong ExperimentMoment envelope schema;
- private sidecar contaminated with HostBindingId;
- private sidecar contaminated with a World-side field.

The occupant-specific validator rejects unknown fields rather than silently accepting World/runtime identity into private state.

---

# 4. Defended architecture claim

> A versioned ExperimentMoment can include an explicit actor-private occupant sidecar strongly enough to restore and fork one history-dependent embodied trajectory without reconstructing remembered private state from World truth.

This is the first MEDIUM-C result where the exact causal checkpoint contains:

1. material physics state;
2. host/runtime binding state;
3. World/process continuation state;
4. **actor-private causal history**;
5. immutable + branch-local experiment provenance.

World and private history remain separate causal layers.

---

# 5. Important design consequence

A future Owner fork cannot be modeled as:

> physics snapshot + screenshot + event log.

Nor can actor memory be regenerated from whatever the World currently contains.

At least for this defended donor, an exact causal moment requires:

> physics + process state + host bindings + occupant-private state + provenance.

The private state is **occupant-specific and versioned**.

This result explicitly argues against a universal "ReflexBrain memory JSON" schema.

---

# 6. Limits

PASS does NOT establish:

- Owner save/load UI;
- Field Lab persistence;
- final storage encoding;
- browser IndexedDB/localStorage choice;
- cross-build migration;
- closed-tab time;
- generic organism snapshot schema;
- multi-actor state;
- natural/private object identity;
- generic P1 tracklets;
- current Field v0 controller as a legitimate occupant;
- organism continuity/life;
- learned ReflexBrain.

The R5 occupant is still an authored C01-lineage monitor used as a narrow causal donor.

The memory-ablation fork is a researcher intervention, not a naturally distinct lived history.

---

# 7. Medium consequence

MEDIUM-C now has evidence for a causal checkpoint stack:

- **R0 PASS:** exact physics + explicit non-physics process state;
- **R2a PASS:** current P0 may be reconstructed exactly at the same causal boundary;
- **R2c FAIL -> R3 PASS:** durable host binding identity must not equal raw physics handle;
- **R4 PASS:** exact versioned causal moment + fork provenance;
- **R5 PASS:** actor-private history can be an independent versioned sidecar and remain causally effective after restore/fork.

This is enough to stop asking whether exact *developer-level* causal moments are conceptually possible.

It is **not** enough to rush Owner-facing save/fork.

The next MEDIUM-C work should decide which **serialization / storage / migration / failure semantics** are needed for durable moments, while MEDIUM-D can separately research how an Owner should create/fork/compare moments without becoming a programmer.

No UI change is authorized by R5.
