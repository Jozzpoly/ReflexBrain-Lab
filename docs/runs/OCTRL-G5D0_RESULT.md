# O-CTRL/G5-D0 — Independent Ecology Pressure Composition Discovery — RESULT — 2026-10-08

Status: **DISCOVERY FEASIBLE · NO SCIENTIFIC PASS · CLOSED**

PR: #45

## Question

Can the already-qualified C01 private-evidence monitor and E01-style independent mechanical law be placed into one non-overlapping physical scene such that:

- actor first has legal P0 evidence;
- actor's own ordinary motion causes P0 loss;
- an independent material process later changes the hidden target;
- the process acts after P0 loss and before self-initiated CHECK;
- no hidden change leaks into P0;
- no process body contacts the actor;
- target stays within sensor range;
- CHECK timing remains private-history driven;
- CHECK can later obtain fresh lawful evidence?

This was a **composition discovery**, not qualification.

No scientific PASS was available.

---

# Frozen discovery dimensions

Unchanged through the search:

- E0/B0 body and actuator seam;
- C01 authored monitor logic;
- C01 private evidence-age threshold;
- C01 patrol odometry;
- C01 CHECK duration bound;
- P02a sensor law / range;
- target radius/mass/damping;
- E01 shuttle radius/mass/force/damping;
- local end-contact reversal law;
- fixed timestep.

Search dimensions only:

- target Y;
- shuttle lane Y relative to target;
- shuttle start X;
- left end-stop X.

Right end-stop X remained 5.8.

The process was initialized in the mirrored/right-side phase, driving left and reversing only on physical local end-stop contact. No global event tick or scenario phase was introduced.

---

# Search result

Tested configurations: **108**

Viable discovery configurations: **30**

Execution:
- deterministic rerun of top candidates: PASS
- TypeScript/Vitest/Vite: PASS
- no scientific outcome assertion in D0.

Viable landscape:

| dimension | viable count |
|---|---:|
| target Y = 1.9 | 6 |
| target Y = 2.0 | 9 |
| target Y = 2.1 | 9 |
| target Y = 2.2 | 6 |
| shuttle offset = -0.3 | 9 |
| shuttle offset = 0.0 | 0 |
| shuttle offset = +0.3 | 21 |
| shuttle start X = 4.2 | 10 |
| shuttle start X = 4.6 | 10 |
| shuttle start X = 5.0 | 10 |
| left end X = 0.4 | 9 |
| left end X = 0.8 | 21 |
| left end X = 1.2 | 0 |

Thus feasibility is not one isolated exact placement.

---

# Discovery freeze candidate for a later G5A

Selected candidate:

- target: **(1.5, 2.0)**
- shuttle lane Y: **2.3**
- shuttle start X: **4.6**
- left end-stop X: **0.8**
- right end-stop X: **5.8**
- process initial direction: **left**
- local lane walls use the unchanged E01 donor offset/thickness.

Selection priority was **not maximum discovery score**.

This candidate was preferred because:

1. target Y remains exactly the original C01 target Y = 2.0;
2. original C01 timing is recovered:
   - P0 loss = **51**
   - CHECK = **231**
3. both DYNAMIC and STATIC histories finish REOBSERVED;
4. the candidate has **5 direct viable grid neighbors**, the maximum observed neighborhood count;
5. the process has comfortable timing separation from both P0 loss and CHECK.

Measured D0 timing:

| event | DYNAMIC | STATIC |
|---|---:|---:|
| initial P0 blobs | 1 | 1 |
| first P0 loss | **51** | **51** |
| shuttle→target contact | **111** | none |
| CHECK | **231** | **231** |
| target displacement at CHECK | **0.9440** | **0** |
| first fresh P0 | **325** | **313** |
| final mode | REOBSERVED | REOBSERVED |

Additional DYNAMIC facts:

- hidden P0 leak ticks: **none**
- target remained within range before CHECK: **yes**
- actor↔process/target contact ticks: **none**
- process end-stop reversal events:
  - left-end contact @ **139**
  - right-end contact @ **285**
- target final displacement: **1.0393**

First DYNAMIC-vs-STATIC private divergence:

**tick 313**

That is exactly the STATIC branch's first fresh lawful P0.

Therefore the independent process produced no private difference merely because it acted at tick 111 or moved the hidden target.

The private histories remained matched until lawful sensory evidence actually differed.

---

# Important interpretation

The discovery found the desired causal ordering:

> legal evidence → actor-caused occlusion → independent hidden material change → same private-age CHECK → later lawful evidence difference

Critically:

- process contact tick **111** is microscope truth;
- target displacement is World truth;
- neither is actor experience time;
- actor-private histories do not diverge at process contact;
- they diverge only when legal P0 differs later.

This composes the methodological correction from P01a directly into G5.

---

# What D0 does NOT establish

D0 does not establish:

- G5 PASS;
- independent ecology value;
- robustness;
- organism continuity;
- a general ecology;
- target identity;
- P1 tracking;
- semantic checked absence;
- learned meaning;
- Owner experiential value.

The geometry was selected using researcher-side search.

It must now be frozen before scientific testing.

---

# Next

Create **G5A on a separate post-D0 branch**.

G5A must use the selected geometry unchanged and include at least:

1. DYNAMIC + HISTORY
2. STATIC + HISTORY
3. DYNAMIC + HISTORY ABLATED

Core falsifiers:

- DYNAMIC and STATIC CHECK timing remains determined by private evidence age;
- only DYNAMIC receives independent hidden material displacement;
- hidden change never leaks to P0;
- ablated history does not CHECK;
- DYNAMIC/STATIC private histories remain equal until fresh lawful evidence differs;
- process/world event timing/identity never enters actor-private state;
- no process body contacts actor.

D0 scanner/search score must not participate in G5A runtime or qualification.
