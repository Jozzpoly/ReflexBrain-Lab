# MEDIUM-C/R3 — Fork-Safe HostBindingId Lifecycle — 2026-10-07

Status: **ARMED · ARCHITECTURE PROBE · NO OWNER SAVE/FORK UI**

Base: 4dc2c761c1fe1fca2e87a118abdfb9053d50e2d9

## Parent falsifier

MEDIUM-C/R2c showed:
- current live Rapier handles can be rebound exactly after snapshot restore;
- a raw handle retained from removed body B can later resolve to newly-created body D.

Therefore raw physics handles cannot be durable experiment/provenance identity.

## Question

Can a minimal host-owned binding registry preserve object ancestry across:

- create;
- remove/retire;
- allocator handle reuse;
- exact physics snapshot;
- fork A/B;
- branch-local post-fork births;
- branch-local retirement;

while keeping HostBindingId completely outside actor-private state?

## Identity model under test

A HostBindingId identifies one **host/research material binding lineage**, not an actor concept.

Inherited pre-fork objects keep the same HostBindingId in both child histories.

Objects born after fork receive an ID namespaced by their birth branch:

`hb:<birth-lineage>:<ordinal>`

Example:
- inherited: `hb:root:0`
- born after fork A: `hb:root/A:0`
- born after fork B: `hb:root/B:0`

The exact string format is probe-local. The invariant matters, not the syntax.

## Registry rules

- monotonic ordinal inside one birth lineage;
- never reuse a retired HostBindingId;
- live mapping stores current Rapier body/collider handles;
- retirement removes live resolution but keeps retired provenance;
- raw handles may be numerically reused without changing identity;
- fork clones inherited live/retired history but changes the namespace used for future births;
- branch-local retirement does not retire the inherited identity in sibling branch;
- HostBindingId is not serialized into P0/P1/private actor evidence.

## Frozen protocol

1. Create root deterministic World.
2. Host-register A, B, C.
3. Retire/remove B.
4. Create/register D.
5. Demonstrate allocator churn can make B's stale raw handle unsafe without using it as identity.
6. Snapshot physics and registry at fork moment M.
7. Restore two physics children A and B from same bytes.
8. Clone registry into child lineages `root/A`, `root/B`.
9. Require inherited A/C/D HostBindingIds identical across both branches and rebind to each branch's corresponding current physics handles.
10. Create one new body in each child.
    - physical allocator may assign same raw handle in both child Worlds;
    - HostBindingIds MUST differ by branch birth lineage.
11. Retire inherited D only in branch A.
    - D must remain live/resolvable in branch B.
12. Address live objects only through HostBindingId and apply different branch-local impulses.
13. Advance both worlds; require interventions reach the intended bodies.
14. Ensure retired B never resolves through registry even if its raw handle now aliases another body.

## PASS

All frozen registry/lifecycle invariants hold.

## FAIL

Any:
- retired HostBindingId resolves live;
- post-fork new HostBindingIds collide;
- retirement leaks across sibling branch;
- host registry resolves stale B to D due raw-handle alias;
- intended HBID-addressed action hits wrong body.

## Maximum claim

At most:

> A host-owned, fork-lineage-aware binding registry can provide durable experiment/provenance identity over current Rapier handle churn without introducing identity into actor-private perception.

Does NOT establish:
- actor object permanence;
- P1 identity;
- generic scene graph;
- persistent product save files;
- cross-version migration;
- final ID syntax/format.

No production Field source is modified in this run.
