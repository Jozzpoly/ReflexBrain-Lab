# MEDIUM-D/R3D — Spatial Interaction Surface Architecture — 2026-10-08

Status: **DESIGN / ARCHITECTURE PROBE · NO UI IMPLEMENTATION**

Parents:
- R3C browser verdict: human-scale MARK/FORK validated live; canvas-only material gesture remained actuator/accessibility opaque;
- R3B: hidden exact shadow MARK PASS;
- R3A: world-first hierarchy survived, short replay-catch-up interaction failed;
- MEDIUM-C/R4/R5: HostBindingId + exact causal moment/fork boundaries.

Primary question:

> How can the Owner still touch the physical thing directly, while the interaction surface remains inspectable/testable/accessibility-visible and does not create a second source of World truth?

---

# 1. Problem statement

Current R3C rendering is honest in one important way:

- the World is drawn from the actual E01 physical state;
- the Owner gesture targets the rendered loose body spatially;
- the material impulse reaches branch B through a HostBindingId-addressed causal seam.

But interaction hit testing exists only inside canvas code.

That creates three separate limitations:

1. browser automation/accessibility trees cannot identify the physical body as an interactable target;
2. the interaction surface cannot be inspected independently from drawing code;
3. future accessibility or alternate input paths would require special-case scenario controls unless a spatial semantic layer exists.

The wrong fix would be:

> add a "Push loose body" button.

That restores R2-style scenario-button grammar.

The desired property is:

> the physical thing in the World remains the thing the Owner touches.

---

# 2. Architecture families considered

## A. Canvas-only hit testing + developer coordinate actuator

Shape:
- keep current canvas pointer hit test;
- add a hidden developer/test API that sends coordinates or impulses.

Advantages:
- minimal product/UI change;
- no visual duplication.

Problems:
- Owner interaction remains opaque to accessibility semantics;
- test actuator and human interaction become two different paths;
- hidden coordinate API can bypass the actual spatial gesture;
- difficult to inspect which thing is actually interactable.

Judgement:

**Useful as test plumbing, weak as medium architecture.**

Do not choose as the primary solution.

---

## B. Full SVG/DOM World rendering

Shape:
- replace canvas bodies/walls with SVG/DOM entities;
- every physical body becomes a directly interactable element.

Advantages:
- excellent inspectability;
- direct semantic elements;
- browser automation naturally targets entities;
- styling/hover/focus straightforward.

Problems:
- large renderer rewrite unrelated to current causal question;
- risks coupling world rendering structure to experiment semantics;
- harder future path if World rendering later needs canvas/WebGL;
- can encourage DOM entity tree to become a semantic World graph;
- unnecessary churn for a single interaction finding.

Judgement:

**Potential future rendering choice, unjustified as R3D response.**

Do not rewrite the World renderer merely to fix interaction semantics.

---

## C. Derived Spatial Interaction Projection over canvas

Shape:
- canvas remains visual renderer;
- an absolute-positioned interaction layer sits over the World viewport;
- selected physical bodies expose derived semantic hit targets;
- each hit target's screen shape/position is recomputed from the same physical snapshot/projection used by rendering;
- hit target owns no position or physics state;
- gestures route through the existing HostBindingId-addressed material intervention seam.

Advantages:
- preserves world-first visual language;
- keeps rendering architecture independent;
- browser automation/accessibility can identify a spatial target;
- human pointer still touches the object at its actual screen position;
- one causal intervention path for humans and automation;
- can be almost visually invisible until hover/focus;
- compatible with future canvas/WebGL renderer changes.

Primary risk:
- derived overlay could drift from rendered geometry and become a competing interaction truth.

This risk can be explicitly constrained/tested.

Judgement:

**Preferred architecture candidate.**

---

# 3. Core invariant: one-way projection only

The interaction layer must obey:

> **World/physics -> snapshot -> screen projection -> interaction proxy**

Never:

> interaction proxy position -> World truth

The proxy may contain:
- current screen-space hit shape;
- HostBindingId of the material body it addresses;
- Owner-facing interaction capabilities;
- accessibility/test metadata.

The proxy must NOT contain authoritative:
- World coordinates as its own state;
- velocity;
- mass;
- semantic actor identity;
- private perception identity;
- branch-independent object meaning.

Its position is recomputed every frame from the actual visible branch.

If the underlying HostBindingId cannot resolve:
- proxy fails closed / disappears;
- no stale target remains interactable.

---

# 4. HostBindingId role

A spatial proxy may address:

> HostBindingId -> current branch-local physical body binding

This is legitimate because HostBindingId is already qualified as host/runtime identity.

It is not:
- P0/P1 object identity;
- actor memory;
- semantic World entity ID.

The Owner/microscope interaction surface may know it.

The actor does not.

---

# 5. Interaction capability descriptor

Do not expose every body automatically.

A specimen/version may provide a small owner-interaction projection such as:

- bindingId;
- projected shape family needed for hit testing;
- allowed Owner authority family.

For R3E candidate only:
- loose body's HostBindingId;
- circular projected hit radius;
- MATERIAL / IMPULSE gesture.

This descriptor is host/microscope metadata.

It does not assert:
- "this is a target";
- "this is important";
- "actor can see it";
- "this is the same object in actor memory".

Future Worlds may expose different Owner-manipulable material objects.

Do not build a universal semantic scene graph from this descriptor.

---

# 6. Visual behavior

Default:
- proxy is visually invisible;
- canvas remains the World.

On pointer hover:
- minimal ring / cursor change may reveal that the thing can be touched.

On keyboard focus:
- visible focus ring required.

During gesture:
- existing material impulse vector preview remains in canvas or overlay;
- local causal chip may say:
  - OWNER · MATERIAL · IMPULSE

After release:
- proxy remains attached to the continuing body;
- causal rail records intervention;
- no scenario panel appears.

This preserves:

> World first, affordance second.

---

# 7. Pointer semantics

For the R3E candidate impulse gesture:

1. pointerdown must start on the derived loose-body proxy;
2. proxy captures pointer;
3. the World continues;
4. pointer position defines a world-space impulse vector relative to the body's **current** physical position/projection;
5. preview updates while body moves;
6. pointerup applies one clamped impulse through the branch-B HostBindingId seam;
7. release is the causal intervention boundary;
8. no physical-grab claim.

This keeps the gesture causally identical to R3C's intended impulse interaction.

Do not pause World on pointerdown.

---

# 8. Automation/accessibility semantics

R3D does not freeze final ARIA roles.

Required properties:
- the material body appears as a distinct focusable/interactable element in the accessibility/DOM surface;
- it has a non-anthropomorphic Owner-facing label, e.g.:
  - "movable material body — drag to define impulse";
- DOM/test identity may use HostBindingId or a stable proxy id;
- accessibility metadata remains presentation-only;
- automation must use the same pointer gesture path as a human, not a hidden "apply impulse" button.

Keyboard-accessible material intervention may need a separate later design run.

Do not invent keyboard scenario commands in R3D.

---

# 9. Geometry alignment contract

The largest architecture hazard is overlay/render drift.

R3E must use **one shared projection function** for:
- canvas body rendering;
- proxy screen position;
- pointer -> world conversion.

No duplicated projection math.

At any frame:
- proxy center must map to rendered body center within a tiny screen-space tolerance;
- proxy hit radius may be slightly larger than rendered body for usability, but the expansion is presentation-only and explicit.

On:
- resize;
- DPR change;
- branch switch;
- compare open/close;

the proxy must be recomputed from current visible branch state.

---

# 10. Branch semantics

Before semantic FORK:
- if MARK exists, hidden A/B are runtime infrastructure;
- only visible working history gets an interaction proxy;
- hidden reference has none.

After FORK exposure:
- single Habitat view still exposes proxy only for active B;
- reference A stays read-only.

In Compare split:
- first R3E candidate should make both A/B views read-only;
- no spatial proxy in Compare.

Reason:
- comparison is microscope mode, not intervention mode;
- prevents accidental branch editing while comparing.

Future multi-branch editing can be researched separately.

---

# 11. Causal integrity

Proxy presence must be provably non-causal.

Adding/removing/updating the proxy must not:
- mutate Rapier state;
- append provenance;
- alter process state;
- step simulation;
- alter actor/private state.

Only completed Owner gesture may call the intervention seam.

Hover/focus/pointermove without release:
- no material intervention;
- no provenance event.

A cancelled gesture:
- no impulse;
- no event.

---

# 12. Why not use the overlay as a universal inspector

The proxy layer should stay narrow.

Do not attach:
- mass tooltips everywhere;
- IDs everywhere;
- velocity arrows everywhere;
- semantic role labels;
- debug menus to every body.

Those belong to optional microscope tooling.

R3D spatial proxies exist to preserve direct manipulation semantics and testability.

If they become a general DOM mirror of the World, the architecture has failed.

---

# 13. R3D decision

Preferred next architecture:

> **Derived Spatial Interaction Projection over the existing canvas.**

Reason:
- smallest change that preserves world-first interaction;
- one human/automation causal path;
- no renderer rewrite;
- no scenario-button regression;
- no second World authority if one-way projection invariant holds.

---

# 14. R3E candidate falsifier / prototype

Separate hidden page derived from R3C.

Required:
1. canvas rendering unchanged in causal meaning;
2. loose E01 body has one derived semantic spatial proxy;
3. proxy placement uses same projection math as rendering;
4. pointer drag on proxy routes into the same B-only HostBindingId impulse seam;
5. hover/focus/cancel are non-causal;
6. hidden A remains untouched;
7. material divergence ribbon appears after completed gesture;
8. Compare A/B remains microscope-on-demand and read-only;
9. live browser actuator can identify the material body, drag it, open Compare, return to Habitat;
10. no permanent dashboard appears.

Engineering tests:
- proxy center alignment for several body states / viewport sizes;
- proxy does not mutate host;
- cancelled gesture causes no provenance;
- completed gesture produces exactly one B event;
- A untouched;
- missing/retired HostBindingId fails closed.

Live validation:
- Opera screenshot/tree;
- browser actuator full R3C flow including real spatial drag.

No homepage promotion.
No Owner usability PASS.

---

# 15. What remains outside this run

- keyboard intervention design;
- mobile/touch ergonomics beyond pointer compatibility;
- arbitrary shapes;
- many interactive bodies;
- multiple marks;
- actor-private lens;
- Field v0 integration;
- organism semantics;
- production accessibility audit;
- final rendering stack.

R3D only chooses the spatial interaction architecture strongly enough to justify one narrow R3E prototype.
