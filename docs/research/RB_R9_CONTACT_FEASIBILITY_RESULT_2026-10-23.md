# R9 — SOURCE-EXECUTED body–material coupling feasibility result
Date 2026-10-23. Frozen [pre-execution protocol](RB_R9_EMBODIED_CONTACT_ARMED_2026-10-23.md), source code: [isolated R9 draft #91](https://github.com/Jozzpoly/ReflexBrain-Lab/pull/91). **[Check #39878430172](https://github.com/Jozzpoly/ReflexBrain-Lab/actions/runs/39878430172) 55 test files / 168 tests, TS + Vite PASS**. No R8 Owner-test branch, main, Pages or Jaskinia changed.

## Actual physical result: a real joint, a real collision-conditioned break, two width controls
The same pinned `@dimforge/rapier2d-deterministic-compat@0.20.0` and E0 B0 120Hz force/torque were used for **four** physical arms × **two** passage gaps (2.5 and 4.0 world units), 2,400 actual Rapier solver steps per arm (19,200 aggregate). Fixed motor input sequences; no changed controller, agent/World oracle or gameplay goal. Material begins identical in three nonempty arms. All three first experience the **same physical actor–material contact at step 38**, then diverge only by declared material law.

| Passage gap | Law after actual contact | Bond formed | Bond broken by cargo–wall impact | Max actor X (not a path-quality score) | Simulation advanced past wall X=7.5? |
|---:|---|---:|---:|---:|---|
| 2.5 | no part | — | — | 41.851 | yes |
| 2.5 | free movable part | — | — | 6.505 | **no** |
| 2.5 | **contact-conditioned fixed joint** | step **38** | step **195** | 28.137 | **yes, after break** |
| 2.5 | first contact makes world part anchored, NO body bond | — | — | 5.131 | **no** |
| 4.0 | no part | — | — | 41.851 | yes |
| 4.0 | free movable part | — | — | 35.207 | yes |
| 4.0 | **contact-conditioned fixed joint** | step **38** | **no break** in 2,400 steps | 50.236 | yes |
| 4.0 | first contact anchors world part, NO body bond | — | — | 6.330 | **no** |

While bonded, true actor–cargo relative geometry stays approximately stable: **max relative-position deviation 0.00269** before break in narrow scene, **0.000234** throughout wide. Narrow break occurred only after **actual cargo–fixed-obstacle contact impulse > 4**. It was not a time-triggered release or agent-issued `detach` command. Wide scene has no cargo–wall impacts and retains a real `isValid()` Rapier joint. The actor's natural B0 body was not teleported/resized.

**Interpretation:** In this *one narrow physics geometry with one scripted motor tape*, a local body–material connection can yield qualitatively different possible motion and different material persistence; the same contact may create a durable side appendage in open space or lead to detachment at real obstruction. It is stronger than decorative cargo or invented body mass, but only a bounded physical-mechanics feasibility result. Neither x max nor passage threshold proves robust navigational capability (trajectories may turn around posts rather than through nominal gap), much less a new life form.

## Instrumentation defect honestly repaired, no scientific retune
Original `f0d68a0` had a TS test callback typing error, fixed at `4dc12c7`. The first physics-executing run `4dc12c7` produced all eight meaningful real Rapier traces, including a stable joint/break, **but the author mistakenly demanded exact JavaScript float equality** `world.timestep === 1/120`. The pinned WASM value was `0.008333333767950535`, so all eight tests failed artificially with `steps:-1`. Correction at `541eee6` counts actual `world.step()` calls (2,400 per arm), retaining identical physical environment/motor/contact thresholds. Original engineering failures remain visible in CI history; [post-fix run #39878430172](https://github.com/Jozzpoly/ReflexBrain-Lab/actions/runs/39878430172) passed all eight and whole inherited suite. No visual/product test claimed.

## Scientific boundary and next falsifier
- **Mechanical attachment is host-authored material law**, conditional on physical collision. There is no agent request or autonomous decision to carry, bond, protect or release, and no material-dependent adhesion cost, lifecycle, diet, ecology or self-organization.
- The world-only anchored control performs very differently from bond and no-part arms; it is not a mass-matched rival and cannot isolate added mass, shape envelope, torque inertia, friction, damping or contact geometry. More attribution is needed before promoting this mechanic.
- A fixed motor tape can show access differences but cannot qualify learned actor-relative *meaning*. The actor did not alter its subsequent decision based on novel proprio/touch information.
- A single passage configuration could yield an impressive anecdote without broad expressive rank. A near-future test should isolate **load-only versus geometrically off-axis bonded part** and include an explicitly adverse outcome without inventing a new objective. Then stop unless the physics generates a meaningful recurring opportunity for different private histories.
- Technical acceptability of fixed joints and impact-driven detachment in this pinned runtime is empirically established here. **No permission to rewrite R8, switch engines, or claim LIFE/O0 PASS.**
