# MEDIUM-C/R4 — Versioned ExperimentMoment + Exact Fork Provenance — ARMED — 2026-10-07

Status: **ARMED · ARCHITECTURE PROBE · NO OWNER UI**

Parent evidence:
- MEDIUM-C/R0 PASS — exact Rapier snapshot + explicit non-physics process sidecar;
- MEDIUM-C/R2a PASS — current P02a can be reconstructed at same restored causal boundary without stepping;
- MEDIUM-C/R2c FAIL — raw Rapier handle is not durable identity;
- MEDIUM-C/R3 PASS — host-owned fork-lineage binding identity survives tested handle churn/restore/fork.

## Primary question

Can one **versioned developer-only ExperimentMoment envelope** capture a causal moment strongly enough that:

1. it restores exactly;
2. forks A/B remain identical until a declared branch-local intervention;
3. provenance records shared ancestry + branch-local events without driving physics;
4. each diverged child moment can itself be restored and continued exactly;
5. incompatible schema/build identity fails closed before silent continuation?

## Why E01 again

Use the qualified E01 mechanical process as the occupant-free causal donor because:
- it has real material interaction;
- it has causally relevant JS sidecar outside Rapier;
- its deterministic dynamics are already qualified;
- it avoids serializing current Field v0's known-bad controller/contact seams.

This run is about **medium causal continuity**, not organism semantics.

## Frozen envelope layers

Conceptual v0 envelope:

```
ExperimentMomentV0 {
  schemaVersion
  buildIdentity

  provenance {
    momentId
    parentMomentId
    rootMomentId
    branchPath
    causalTick
    events[]
  }

  physicsSnapshot

  hostBindings
  worldProcessState
}
```

No actor-private payload is included in this run because E01 has no actor occupant.

## Frozen provenance rules

- root moment has no parent;
- fork children share root moment and parent moment;
- branch path becomes distinct only after fork;
- branch-local intervention is appended only to the affected child history;
- provenance/event data is **not consumed by E01 stepping**;
- HostBindingId may appear in provenance as runtime/material reference;
- raw Rapier handle must not be the event identity;
- ancestry is immutable by child append operations.

## Frozen protocol

### Root
1. create E01 interaction scenario;
2. register shuttle, loose body, end-stops and walls with HostBindingIds;
3. run to tick 300;
4. capture root ExperimentMoment M0:
   - exact Rapier bytes;
   - HostBindingRegistry snapshot;
   - complete causally relevant E01 process sidecar;
   - provenance root.

### Root restore
5. restore M0 once;
6. require exact physical/process state equality at the same causal tick;
7. continue source + restored copy identically for 240 ticks;
8. require no divergence.

### A/B fork
9. restore two independent children from M0;
10. clone host registry into branch birth lineages root/A and root/B;
11. continue both under identical process stepping for 120 ticks;
12. require no divergence before intervention.

### Branch intervention
13. at identical fork-relative tick 121:
   - branch A: no intervention;
   - branch B: apply one fixed impulse to the loose body, addressed by its HostBindingId;
   - append exactly one provenance event only to B;
14. continue both for 360 ticks;
15. require first material divergence only after the branch-B intervention.

### Child moments
16. capture Moment A1 and B1 from the two diverged children;
17. both child moments:
   - parentMomentId = M0;
   - same rootMomentId;
   - distinct momentId / branchPath;
   - inherited HostBindingIds for pre-fork bodies;
18. restore A1 and B1 independently;
19. continue each source/restored pair for 300 ticks;
20. require exact continuation inside each branch.

### Fail-closed validation
21. corrupt schemaVersion -> restore must throw before continuation;
22. corrupt buildIdentity -> restore must throw before continuation;
23. remove required process sidecar -> restore must reject;
24. retire or invalidate one required live HostBindingId in envelope -> restore must reject rather than silently rebind by stale raw handle.

## PASS — all required

- deterministic repeat;
- exact M0 immediate restore;
- exact source/restored continuation;
- exact A/B equality before intervention;
- first A/B material divergence occurs only after B intervention;
- B event references HostBindingId, not raw handle;
- provenance ancestry correct and branch-local;
- A1 and B1 each restore + continue exactly;
- all fail-closed corruption controls reject.

## FAIL

Any frozen condition fails under valid apparatus.

Do not rescue by:
- taking an extra physics step after restore;
- recomputing process history from World position;
- omitting failed provenance checks;
- weakening build/schema validation;
- storing raw physics handles as durable event identity.

## Maximum claim

PASS would establish only:

> a versioned developer-only causal moment envelope can compose exact physics state, explicit non-physics process state, host binding identity and branch provenance sufficiently for exact restore/fork/child-restore in this deterministic E01 donor.

Does NOT establish:
- Field Lab save/load;
- occupant-private state serialization;
- closed-tab persistence;
- cross-version migration;
- final storage format;
- Owner workbench usability;
- organism continuity;
- actor object identity.

No Pages/UI changes in this run.

---

## Closure

**PASS · CLOSED.** See `docs/medium-runs/MEDIUM-C-R4_RESULT.md`. No restore criterion, version gate or provenance rule was relaxed after evidence. No Owner-facing persistence/workbench feature is activated.
