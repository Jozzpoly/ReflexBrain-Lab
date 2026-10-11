# MEDIUM-D/R3E — Derived Spatial Interaction Proxy — ARMED — 2026-10-08

Status: **ARMED · LOW-FIDELITY INTERACTION PROBE · NO OWNER QUALIFICATION**

Parents:
- R3C: human-scale shadow MARK/FORK validated live; canvas-only material gesture remained browser-actuator/accessibility opaque;
- R3D: chose a one-way derived spatial interaction projection over canvas;
- R3B: hidden exact shadow MARK remains causal-exact for human-scale delay;
- R4/R3A host path: branch-B material impulse is HostBindingId-addressed and branch-local.

## Primary question

Can one material body in the R3C world expose a real spatial interaction target that:

- stays visually attached to the actual rendered body;
- is discoverable as an interactable DOM/accessibility element;
- uses the same world-to-screen projection as rendering;
- routes the same pointer gesture into the existing B-only HostBindingId impulse seam;
- adds no scenario button/dashboard;
- owns no authoritative World geometry/state;
- remains non-causal until a completed Owner gesture?

## Prototype

Hidden page:
`probes/medium-d-r3e-spatial-proxy.html`

No homepage link.

Reuse R3C:
- E01 donor;
- R3B shadow MARK;
- contextual semantic FORK;
- one visible Habitat World;
- optional Compare after divergence.

## Spatial proxy

After FORK exposure, visible working B's loose material body gets exactly one derived proxy element.

Proxy rules:
- absolute-positioned over the World viewport;
- center derived every paint from current B physical snapshot;
- radius derived from the same shared projection used for canvas rendering;
- may enlarge hit radius modestly for pointer usability;
- visual body remains canvas-rendered;
- proxy is transparent by default;
- hover/focus may show a thin ring;
- proxy disappears / disables in Compare mode;
- proxy disappears if required material binding cannot resolve.

Owner-facing accessible label may say:
`movable material body — drag to define impulse`.

The label is presentation metadata only.

## One-way truth invariant

Allowed:

`physics -> snapshot -> shared projection -> proxy geometry`

Forbidden:

`proxy geometry -> authoritative World position`

Proxy DOM style/position must never be read back as World truth.

## Shared projection

Introduce one reusable pure projection helper used by:
- canvas rendering;
- proxy placement;
- pointer client coordinate -> World conversion.

No duplicated projection constants/math across those paths.

## Gesture

After FORK:
1. pointerdown begins only on the loose-body proxy;
2. pointer capture starts;
3. World continues running;
4. pointermove changes preview vector only;
5. pointerup computes vector against current physical loose-body position;
6. vector is clamped through the same pure impulse mapping;
7. one B-only HostBindingId material impulse is applied;
8. one branch-B provenance event is created;
9. RELEASE is implicit at pointerup;
10. divergence ribbon appears once branch material states differ.

Cancelled pointer gesture:
- no impulse;
- no provenance.

Tiny gesture below frozen threshold:
- no impulse;
- no provenance.

## Compare

After divergence:
- Compare A/B may open;
- proxies are disabled/hidden in Compare;
- split view is read-only;
- Return to Habitat restores single B view and proxy.

## Frozen engineering tests

PASS requires:

### Projection
- world -> screen -> world round-trip within numerical tolerance for several points/viewports;
- rendered body center and proxy center derive from the identical helper result;
- resize produces recalculated proxy geometry without causal mutation.

### Gesture mapping
- sub-threshold vector => no impulse;
- large vector clamps to frozen maximum magnitude;
- finite vector only;
- mapping is deterministic.

### Causal host
- hover/focus/proxy-update/cancel produce no provenance and no host state mutation;
- before completed gesture A == B;
- completed gesture creates exactly one event only in B;
- A remains event-free;
- B diverges materially;
- repeated deterministic host-level gesture gives same result.

### Build
- TypeScript, tests, Vite build PASS.

## Live browser validation

After hidden Pages deploy:

1. Opera screenshot/accessibility tree:
   - World remains dominant;
   - proxy appears as an interactable semantic element after FORK;
   - no permanent dashboard.

2. Browser actuator:
   - MARK;
   - wait >240 ticks;
   - FORK;
   - identify the material-body proxy by semantic element;
   - drag it spatially and release;
   - verify B-only material divergence ribbon;
   - open Compare;
   - verify split A/B;
   - Return to Habitat;
   - verify proxy returns to active B.

PASS requires the full flow to be executable through the actual spatial proxy, not a hidden impulse button/API.

## FAIL

- proxy drifts from rendered body;
- duplicated projection math disagrees;
- proxy state becomes authoritative;
- interaction must fall back to scenario button;
- automation uses a hidden direct impulse API instead of the same pointer path;
- hover/cancel emits causal event;
- A receives intervention;
- proxy appears in Compare and allows accidental edit;
- page becomes dashboard-heavy.

## Maximum claim

PASS would establish only:

> one exact material entity can expose a derived, inspectable spatial interaction surface over the world-first canvas and use the same causal gesture path for human/browser interaction without creating a second World authority.

Does NOT establish:
- final accessibility architecture;
- arbitrary material shapes;
- many-object scaling;
- keyboard manipulation;
- Owner experimental-value PASS;
- Field integration;
- organism semantics;
- final rendering technology.

No homepage promotion.
