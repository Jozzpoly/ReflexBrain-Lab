# MEDIUM-C/R4 — Versioned ExperimentMoment + Exact Fork Provenance — RESULT — 2026-10-07

Status: **PASS · ARCHITECTURE PROBE CLOSED · NO OWNER FEATURE**

PR: #31
CI: `37675768385`
Job: `112978743049`
Evidence head: `18b3310e4a223cac073f287eaa313b29c97d88dc`

## Outcome

**PASS.**

18/18 test files/tests, TypeScript and Vite build passed.

---

# 1. Root causal moment

E01 interaction scenario at tick **300** was captured as a versioned `ExperimentMomentV0`.

Envelope contained:
- schema version;
- build identity;
- provenance;
- Rapier snapshot bytes;
- HostBindingRegistry snapshot;
- complete causally relevant E01 process sidecar, including local role -> HostBindingId wiring.

Snapshot size:
- **5596 bytes**

Immediate restore:
- exact physical state equality;
- exact process-sidecar equality;
- no physics warm-up step;
- no divergence.

Source and restored root were then continued for **240 ticks**.

First restore divergence:
- **none**

---

# 2. Exact A/B fork

Two independent children were restored from the exact same root moment.

Before intervention:
- branch paths differed only as host/provenance lineage;
- inherited material HostBindingIds remained the same;
- both Worlds advanced under identical E01 stepping for **120 ticks**;
- first physical/process divergence: **none**.

This demonstrates that the fork metadata itself did not perturb the causal simulation.

---

# 3. Branch-local intervention

At causal tick **420**, branch B alone received:

- kind: `owner-material-impulse`
- target: HostBindingId `hb:root:1`
- impulse: `(+1.1, -0.35)`

The event was appended only to B provenance.

Root provenance remained immutable.

First A/B material/process divergence after intervention:
- **fork-relative tick 1**

No pre-intervention divergence existed.

The intervention addressed the material target through HostBindingId, not raw Rapier handle.

---

# 4. Child causal moments

After 360 post-intervention ticks, both diverged histories were captured:

### A1
- momentId: `moment:A1`
- parent: `moment:root:300`
- root: `moment:root:300`
- branchPath: `root/A`
- branch-local events: **0**

### B1
- momentId: `moment:B1`
- parent: `moment:root:300`
- root: `moment:root:300`
- branchPath: `root/B`
- branch-local events: **1**
- event target: `hb:root:1`

Each child moment was independently restored.

Immediate restore equality:
- A1: **true**
- B1: **true**

Each source/restored child pair then advanced for **300 ticks**.

First restore divergence:
- A1: **none**
- B1: **none**

Thus the already-diverged histories remained individually exact causal checkpoints.

---

# 5. Fail-closed controls

All frozen corruption controls were rejected:

- wrong `schemaVersion`: **rejected**
- wrong `buildIdentity`: **rejected**
- missing `worldProcessState`: **rejected**
- required live role HostBindingId marked retired: **rejected**

The restore path did not silently continue with weakened assumptions.

---

# 6. Important role-mapping finding

HostBindingRegistry alone is not enough to reconstruct E01.

The process also needs local runtime wiring:

- which HostBindingId is shuttle;
- which is loose body;
- which are end-stops;
- which are walls.

This wiring is part of **E01 process sidecar**, not a global semantic scene graph and not actor-private identity.

This distinction prevents a dangerous shortcut:

> durable host identity does not automatically imply universal semantic World roles.

---

# 7. Defended architecture claim

> In this deterministic E01 donor, a versioned developer-only ExperimentMoment can compose exact physics state, explicit non-physics process state, fork-safe host binding identity and immutable/branch-local provenance strongly enough for exact root restore, exact pre-intervention fork, branch-local divergence and exact restore of both diverged child histories.

This is now the strongest MEDIUM-C continuity result.

---

# 8. Still NOT proven

R4 does not establish:
- Field Lab save/load;
- actor-private occupant state in a moment envelope;
- final provenance schema;
- browser storage format;
- closed-tab time;
- cross-build/schema migration;
- merged histories;
- collaborative/distributed IDs;
- Owner Workbench usability;
- organism continuity;
- actor object identity.

E01 has no occupant-private state.

Therefore the next meaningful MEDIUM-C pressure is:

> can the same causal moment idea include a **legitimate actor-private occupant sidecar** without reconstructing it from World truth or freezing the known-bad Field v0 controller as architecture?

Do not expose Owner save/fork before that is earned.
