# MEDIUM-C/R3 — Fork-Safe HostBindingId Lifecycle — RESULT — 2026-10-07

Status: **PASS · ARCHITECTURE PROBE CLOSED · NO OWNER FEATURE**

PR: #30
CI: `37674917231`
Job: `112975822748`
Scientific/engineering branch head at evidence: `f11cfa383d52c67629164e887b97e6353fe24d8a`

## Frozen question

Can host-owned material binding identity survive:
- create/remove/recreate;
- raw physics-handle aliasing;
- exact physics restore;
- A/B fork inheritance;
- branch-local births;
- branch-local retirement;

without treating Rapier raw handles as durable provenance identity?

## Outcome

**PASS.**

All 17 test files / 17 tests, TypeScript and Vite build passed.

The dedicated R3 probe repeated exactly.

---

# 1. Root lifecycle

Allocated:
- A -> `hb:root:0`
- B -> `hb:root:1`
- C -> `hb:root:2`

B was explicitly retired at tick 8 and physically removed.

D was then created:
- D -> `hb:root:3`

No retired HostBindingId was reused.

## Parent R2c failure reproduced

B's stale raw Rapier handle:
- rb/co: `5e-324`

After allocator churn, querying that stale raw handle resolved to a newly live body whose reported handle was:
- `2.1219957915e-314`

Therefore the runtime still exhibits the exact hazard found by R2c:

> stale raw physics handle can alias another live body.

However:
- HostBindingId B remained **retired**;
- registry resolution for B returned **null** in source and in both restored forks;
- the registry never followed the stale raw handle.

This is the key defended distinction.

---

# 2. Exact fork inheritance

Physics snapshot:
- **3208 bytes**

Two Worlds were restored from the same bytes.

Inherited live HostBindingIds:
- A `hb:root:0`
- C `hb:root:2`
- D `hb:root:3`

were identical in both child histories and rebound to the corresponding current physics objects.

Immediate restored physical state matched the root moment exactly.

Both child Worlds were then advanced under identical HostBindingId-addressed forces for **60 ticks**.

First pre-intervention divergence:
- **none**

Thus host identity plumbing did not itself perturb the physical fork.

---

# 3. Branch-local births

After fork:

Branch A created:
- `hb:root/A:0`

Branch B created:
- `hb:root/B:0`

The two independently restored physics Worlds assigned the newly born bodies the **same current raw physics handles**.

Despite that:
- HostBindingIds were distinct by birth lineage;
- no cross-branch identity collision occurred.

This is precisely why raw handle equality across two forked Worlds cannot serve as experiment identity.

---

# 4. Branch-local retirement

Inherited D was retired only in branch A.

After that:
- branch A D resolution -> **null**
- branch B D resolution -> **live**

Retirement did not leak across sibling histories.

A later second birth in branch A received:
- `hb:root/A:1`

It did not reuse:
- retired root B identity;
- retired inherited D identity;
- first branch-local birth identity.

---

# 5. HostBindingId-addressed interventions

Branch-local impulses were addressed through each branch's new HostBindingId.

After continuation:
- branch A intended body x velocity: **+0.2550528347**
- branch B intended body x velocity: **-0.1734359562**

The opposite signed results confirm that branch-local host identity resolved the intended distinct bodies.

No actor/private sensor or controller participated in this probe.

---

# 6. Defended architecture claim

> A minimal host-owned, fork-lineage-aware binding registry can provide durable runtime/provenance identity across the tested Rapier handle churn, exact snapshot restore, sibling forks, branch-local births and branch-local retirement.

The defended identity relation is:

`HostBindingId -> current live Rapier handle(s)`

with explicit retirement.

Not:

`Rapier handle == durable object identity`

---

# 7. Epistemic boundary

HostBindingId is:
- experiment/runtime plumbing;
- snapshot/fork binding metadata;
- eligible for microscope/provenance use.

HostBindingId is **not**:
- P0/P1 identity;
- actor memory;
- object permanence;
- a semantic World entity ID exposed to Local Brain.

A future actor must earn its own identity/re-identification from legal private evidence.

---

# 8. Important limits

PASS does NOT establish:
- final HostBindingId string format;
- distributed/global uniqueness;
- cross-build/cross-version migration;
- whole Field Lab exact save;
- current flawed Field actor/process state as a canonical snapshot schema;
- event ancestry format;
- persistent browser storage;
- Owner-facing save/fork UI;
- actor-private object identity;
- organism continuity.

The registry primitive remains replaceable infrastructure.

---

# 9. Medium consequence

MEDIUM-C now has evidence for three separate continuity requirements:

1. **R0 PASS**
   - exact physics + explicit causally relevant non-physics sidecar;

2. **R2a PASS**
   - current P02a frame can be reconstructed at the same restored causal boundary without advancing time;

3. **R2c FAIL -> R3 PASS**
   - raw physics handles are not durable identity;
   - host-owned live binding identity with explicit retirement can survive the tested churn/fork case.

This is enough to begin designing a **developer-only versioned ExperimentMoment envelope**.

It is still **not** enough to expose save/fork to Owner.

Before productization, the envelope must prove:
- explicit provenance ancestry;
- occupant-private sidecar boundaries on a legitimate occupant;
- build/schema identity;
- branch intervention recording;
- restoration failure behavior when version/binding requirements cannot be satisfied.

Do not serialize current Field v0 wholesale merely to reach a UI milestone.
