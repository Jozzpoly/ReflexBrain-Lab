# O0 Red-Team Resolution — 2026-10-06

Status: **RED-TEAM RESOLVED ENOUGH TO GUIDE FIRST IMPLEMENTATION CONTRACT · ARCHITECTURE STILL OPEN**

This note resolves the final question in `O0_FIRST_PRINCIPLES_REDESIGN_2026-10-06.md`.

## The wrong falsifier

Question:

> Can O0 be reproduced by a finite-state task bot?

This is not a useful boundary.

Any finite digital controller can ultimately be represented as a state machine. A deterministic Local Brain is not disqualified merely because its implementation is explicit.

The actual failure mode is:

> authored situation ontology or hidden World knowledge does the work that should emerge from actor-private sensing, body interaction and history.

## Correct boundary — scene-general causal competence

O0 may use simple deterministic mechanisms.

But those mechanisms must operate on generic actor-private quantities and survive scene reconfiguration without policy edits.

The policy must not contain:
- hard-coded route sequences;
- hidden object coordinates;
- "source moved" notifications;
- omniscient obstacle map;
- authored phase transitions for specific Owner perturbations;
- special cases keyed to a particular scene layout;
- debug/oracle truth.

Allowed:
- generic locomotion competence;
- generic object/landmark identity after perception;
- actor-private last-known state;
- generic search/reacquisition;
- generic continuation/recovery rules;
- a small authored ongoing concern;
- a known interaction vocabulary such as carry/place/use, if World-valid.

## Stronger O0 requirement

One implementation must run unchanged across a bounded family of materially different scenes.

Scenes may vary:
- location of source/site;
- obstacle and wall layout;
- object placement;
- which corridor is open;
- initial actor pose;
- Owner interventions during runtime.

The Local Brain receives only what the actor can legally perceive/remember.

No code or policy parameters are changed to fit a particular arrangement.

This is not a benchmark leaderboard.

It is an anti-hardcoding falsifier.

## Scene family

Do not generate dozens of abstract datasets.

Use a small number of understandable micro-world arrangements sharing the same physical vocabulary.

Suggested first family:

- 2–3 connected areas;
- opaque/occluding walls;
- movable objects;
- one source;
- one maintenance/use site;
- at least two plausible routes in some layouts;
- at least one arrangement where remembered direct route becomes physically blocked.

Owner should also be able to create an unplanned rearrangement by dragging physical objects during a run.

## Private spatial model

Do not give the actor the scene graph.

The actor can maintain a local/private spatial model built from experience.

First O0 need not solve SLAM.

A minimal model may preserve:
- encountered landmarks/objects;
- last-known relative/world-local position derived from legal sensing and self motion;
- checked absence;
- locally observed blocked/free passage evidence;
- staleness/age.

Absolute simulation coordinates may exist internally in the World and renderer.

The actor should not consume them as hidden truth.

If an actor-private coordinate frame is used, it must be derived from its own proprioceptive/localization substrate.

## Concern grounding

An authored concern is allowed.

Example structure:

> maintain one material of kind K at encountered/known site S.

But:
- the concern does not contain the live location of K;
- it does not reveal whether S is currently satisfied;
- satisfaction used by the actor must come from private evidence/history;
- World truth may validate physical actions/outcomes but does not feed the decision policy.

This preserves a reason for action without authoring the answer.

## Navigation / locomotion boundary

Do not let high-level policy output instantaneous positions.

Desired layering:

`continuation -> local spatial target / relation -> motor demand -> E0-like body -> physical outcome`

A navigation helper may exist if:
- it uses only actor-known local geometry;
- it produces local guidance, not authoritative movement;
- collisions/contacts remain physical;
- stale knowledge can make its guidance wrong.

This allows ordinary competence without making the World a hidden autopilot.

## History test — stronger formulation

The key evidence is not merely that "history exists".

Require:

1. two runs reach closely matched current visible/body state;
2. their relevant private histories differ;
3. the same unchanged policy later behaves differently;
4. the difference disappears under a matched irrelevant-history control;
5. first-divergence evidence traces the difference to private state before decision/output divergence.

This imports the best R3 first-divergence methodology without importing the R3 world architecture.

## Reafference test — candidate shadow capability

A motor-to-sensory forward predictor is now a high-value candidate for O0, but it should begin shadow-only.

Inputs may include:
- recent motor demand/actuation;
- recent proprioceptive state;
- local contact context.

Outputs:
- predicted short-horizon proprioceptive/contact/egocentric sensory delta.

Compare predicted vs actual.

Research question:

> does the residual help distinguish self-explained change from external/unmodelled perturbation across new scene arrangements?

Do not use the residual as a global curiosity reward yet.

## What counts as O0 success

O0 does not need to be intelligent in an impressive sense.

A successful O0 establishes a substrate in which:

- the actor owns an ongoing trajectory;
- body/world interaction is material;
- perception is bounded and occluded;
- private memory can be stale and corrected;
- local competence works across several scene arrangements without policy edits;
- Owner physical intervention is absorbed as lived history rather than debug truth;
- current behaviour can causally depend on private history;
- microscope/replay can explain first divergence without driving the organism.

This is substantially stronger than R3's abstract position-stepping host and substantially richer than E0.0's body null.

## Implication for learned ReflexBrain

Only after this substrate exists should we ask:

> where does the unchanged deterministic Local Brain repeatedly fail because actor-relative meaning is ambiguous, context-dependent or requires generalization?

Those naturally recurring residual failures become candidate ReflexBrain pressure.

Do not predefine semantic axes before observing them.

## Immediate next step

The project is now ready for one bounded **O0 implementation contract**.

That contract should freeze:
- the first micro-ecology;
- legal perception channels;
- private-memory boundary;
- local-brain authority;
- E0 body seam;
- Owner intervention seam;
- 3–5 decisive causal scenarios.

It should *not* freeze the long-term architecture.

Build only after that contract is written and red-teamed once.
