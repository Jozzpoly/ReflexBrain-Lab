# R9B — anatomy versus mass-only causal ablation (ARMED, before new code)
Date 2026-10-23; supplements executed [R9 result](RB_R9_CONTACT_FEASIBILITY_RESULT_2026-10-23.md), does not revise its eight original outcomes.

## Why this matters
R9 showed collision-driven fixed joint and conditional release in pinned deterministic Rapier, but observed trajectories do not isolate *added body geometry* from mere extra mass, collision deflection, physical parts persisting in the world, or the open-loop scripted motor. Before promoting a "new bodily affordance" claim, run one explicit counterfactual.

## Frozen intervention definition
Use same original R9 contact starting actor B0 at origin, cargo at (2.1,1.05) rectangular 0.48×0.44 half-extent, mass 2.1, two gap widths 2.5 and 4.0, no gravity, identical E0 force/torque timetable for 2400 physics steps.
- Baseline **free cargo** as already measured.
- **True body bond** at first physically measured contact impulse (actual fixed Rapier joint) with physical bumper impact release as R9.
- **Mass-only diagnostic:** the actor and a *real initially physical* cargo remain exactly the same and experience the same actual collision until the first impact. At that single event remove cargo's physical body and assign its stated 2.1 additional mass to actor with `setAdditionalMass(2.1,true)`, so there is **no protruding cargo collider** thereafter. This is a deliberately UNPHYSICAL one-time ablation / mechanics control, not proposed gameplay/material transport; it asks whether R9's continuation can be explained by added mass without extra body shape.
- **No-part** unchanged reference trajectory. Other R9 `world-anchor-on-contact` comparator is preserved but not repeated.
- Record first contact tick; immediately pre-contact actor/cargo position+velocity proving all contact-bearing arms share physical provenance, eventual actor max X, contact with physical bumper, 300-tick snapshots of pose+velocity, measured post-contact actor mass, actual joint tenure and any physical rupture. Compare the R9 bond against mass-only in both widths.
- No seed/world motor tuning based on results, no Reward, no NPC goal.
- If `setAdditionalMass` is absent/incompatible in pinned WASM, mark engineering feasibility fail without quietly simulating inertia change by overriding motor force.

## Interpretation limits
A difference between bonded and mass-only shows *something beyond uniformly added mass* changes physical trajectory; it does NOT isolate shape from inertia tensor, center of mass, cargo friction, or solver constraint forces. Lack of difference falsifies the usefulness of this particular geometry/motor; cannot prove general insignificance. A diagnostic ablation is not a naturally reachable world history, so must NEVER be offered as evidence of acquired organism skill.

Stop here after one source-executed A/B test and source-grounded decision. Any future organism experiment must carry its own independently meaningful actor-private history and cheap controls.
