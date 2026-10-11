# MEDIUM-D/R1 — Developer-Only Experiment Grammar Microprobe — RESULT — 2026-10-08

Status: **PASS · DESIGN/ARCHITECTURE PROBE CLOSED · NO OWNER UI**

PR: #34

Execution history:
- first CI `37701638918`: **EXECUTION FAIL** before experiment start;
  - test imported `beforeAll/initE0Rapier` but the actual `beforeAll` initialization block was accidentally omitted;
  - failure occurred in `C01MomentHost.create()` before MARK;
  - no scientific/design criterion was exercised.
- harness-only correction: add the missing Rapier initialization block;
- second CI `37701826399`: **PASS**
- 20/20 test files PASS
- TypeScript PASS
- Vite build PASS

No donor, capture tick, intervention, run horizon, divergence criterion or grammar vocabulary changed after evidence.

---

# 1. Frozen transcript

The successful microprobe used only:

> MARK → FORK → INTERVENE → RUN → COMPARE → NOTE

No Workbench runtime framework was introduced.

No scenario-specific verb was introduced.

### MARK
Exact R5 C01-lineage causal moment at tick 200.

### FORK
Exact sibling histories A/B.

### INTERVENE
Branch B only:

- declared layer: `PRIVATE_RESEARCH_CUT`
- operation: clear private `lastSeen`
- branch-local provenance event at causal tick 200.

### RUN
A/B advanced synchronously for the frozen 180-tick horizon.

### COMPARE
First divergence tracked independently across:
- private state;
- motor demand;
- material body/target state;
- current legal P0.

### NOTE
One Owner-style qualitative note attached outside causal/provenance state.

---

# 2. First-divergence ladder

Deterministic repeat: **yes**

Measured:

| Layer | First divergence |
|---|---:|
| actor-private state | **200** |
| motor demand | **231** |
| material World/body | **231** |
| current legal P0 | **318** |

This is the desired causal ordering for this donor:

> private intervention -> later decision/motor divergence -> material divergence -> later sensory divergence

The material branch did not diverge before the motor command that caused it.

Current P0 remained the same long after private history diverged, then diverged only after the different bodily history eventually produced different legal perception.

---

# 3. NOTE-only control

A second A/B fork received:
- no causal intervention;
- one NOTE metadata entry only.

After the same 180-tick horizon:
- private state: exact;
- motor demand: exact;
- material World: exact;
- current P0: exact.

Thus:

> Owner qualitative annotation can remain useful project evidence without becoming causal simulation state.

This is an important Workbench boundary.

---

# 4. Provenance boundary

Only branch B contained the experiment intervention event:

- kind: `experiment-intervention`
- layer: `PRIVATE_RESEARCH_CUT`
- operation: `clear-lastSeen`
- causal tick: 200.

The event described researcher authority.

It was not actor-private knowledge and did not itself drive the simulation.

---

# 5. Defended design claim

> The MEDIUM-D candidate grammar can represent one real exact history-ablation experiment and expose a useful layer-specific first-divergence ladder without scenario-specific UI semantics or causal Owner annotations.

This is stronger than a generic state diff because it preserves causal ownership:

1. what researcher/Owner changed;
2. when private histories became different;
3. when action became different;
4. when matter became different;
5. when later legal perception became different.

---

# 6. Why this matters for medium design

The likely high-value Workbench primitive is not:

> "show all branch variables side by side."

It is closer to:

> **"show me the earliest divergence in each causal layer, then let me drill down."**

For ReflexBrain this directly attacks common errors:
- World change mistaken for actor knowledge;
- private-state difference discovered only after body behavior;
- motor differences hidden inside a final trajectory;
- UI interpretation presented as causal evidence.

This should remain a priority candidate for future Owner-facing comparison design.

---

# 7. Limits

PASS does NOT establish:
- Owner usability;
- final Workbench UX;
- direct spatial interaction grammar;
- MATERIAL or MOTOR_AUTHORITY implementation through the grammar;
- RELEASE UX;
- PROMOTE/falsifier packaging;
- browser storage;
- multi-branch scalability;
- long-run comparison performance;
- organism scientific value.

The tested intervention was a research-only private-memory ablation on a C01-lineage donor.

No Pages/UI change follows automatically.

---

# 8. Next pressure

Do not immediately build a Workbench dashboard.

The next MEDIUM-D research should focus on **interaction shape**:

- how MARK/FORK can stay almost invisible during ordinary Habitat observation;
- how a direct spatial MATERIAL intervention can coexist with exact provenance;
- how RELEASE becomes visible without becoming a modal workflow;
- how first-divergence surfacing can remain low-attention and expandable;
- how Owner NOTE/verdict attaches naturally;
- whether one minimal low-fidelity storyboard/prototype can express this without turning the World into a form.

A future implementation should begin with the smallest interaction slice, not all verbs.
