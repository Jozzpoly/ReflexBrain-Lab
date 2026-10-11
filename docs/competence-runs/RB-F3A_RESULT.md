# RB-F3A — Frozen Actor-Private Action × Directional-Touch Qualification — RESULT — 2026-10-11

**Scientific status: PASS (strictly bounded, authored-physics competence precursor).**  
**Execution: PASS; not Owner/product/living-organism qualification.**

- Existing frozen protocol: [RB-F3A_ARMED.md](RB-F3A_ARMED.md) (written before executable F3A results).
- Draft [PR #56](https://github.com/Jozzpoly/ReflexBrain-Lab/pull/56) against canonical pre-O0; **remain draft; do not merge by inertia**.
- Exact executable evidence head: `bd0b95bddc97df3392001aba0e1b47309adf5a96`.
- [GitHub Actions run 38103402752](https://github.com/Jozzpoly/ReflexBrain-Lab/actions/runs/38103402752): **28/28 files, 45/45 tests, TypeScript and Vite build PASS**.
- CI console source: `RB_F3A_RESULT`. Full deterministic rerun identical; no after-the-fact phase, force, threshold or classification change.

## 1. Frozen result

The F3/D0 discovery pair (phase 0, 1.05 × Fmax) was **excluded**.

F3A ran the exactly frozen six mirrored contact pairs (phases 2/4/6/8/10/12; force magnitudes 0.95/0.95/1.05/1.05/1.15/1.15) and six corresponding free/no-wall controls, all in Rapier/E0.

| Criterion | Result |
|---|---:|
| Nonzero actor-owned contact in held-out episodes | **12/12**; 24/24 final private samples each |
| Informative episodes (M != F and regret not tie) | **12/12** |
| Host-side M_WORSE / M_BETTER | **6 / 6** |
| Frozen `Q = mean_signed_body_local_touch × M_drive` AUC | **1.0000** |
| F2 mismatch R AUC | 0.5000 |
| Binary touch fraction AUC | 0.5000 |
| Signed touch ALONE AUC | 0.2222 |
| M drive alone AUC | 0.5000 |
| |M drive| alone AUC | 0.5000 |
| Unfitted `Q > 0 => M_WORSE; Q < 0 => M_BETTER` | **12/12 correct** |
| Free controls, no fabricated touch/Q | **6/6** |
| Independent replay matches all F2 private-history rows | **18/18** |
| Frozen scientific outcome | **PASS; reasons = []** |

The right/left labels and external-force signs exist only to construct physical host scenes. The candidate feature Q contains neither. All scenes preserve unchanged F2 M/F algorithm, F2 counterfactual host cost and untouched frozen D0/P0 source.

## 2. Critical provenance correction verified

F3/D0 used `contactPair(actor.co, wall.co)` to inspect one known wall. That was acceptable as a narrow discovery but insufficient to prove a general actor-owned touch transducer in an arbitrary multi-object World.

F3A uses `world.contactPairsWith(actorCollider,...)`, enumerating contacts of the **actor's own body**, `contactPair(actorCollider, other,...)`, solver impulse, `flipped` orientation correction and rotation into actor-local coordinates. No wall handle, object label, host regret, world X or external-force sign is passed to the sensor.

Independent tests verified:
- actor-local contact sign right/left survives reversing the **collider creation order**;
- rotating the actor frame by π reverses the local X component under the same world-side impact;
- all 24 private contact/velocity/demand history samples agree with F2's original replay for every one of 18 runs.

This establishes lawful **readout availability in the tested Rapier world**; it does not establish a finished collision-sensing organ under simultaneous contacts, mixed shapes or damaged sensing.

## 3. Why this is real progress — and why it remains narrow

A contact magnitude, model mismatch and own motor direction individually were not enough. Their **actor-relative relation** separated cases where the **same frozen M vs F motor choice** had opposite host-measured material value. The sign of M's drive actually changed across predeclared held-out phases, so signed contact alone is not a substitute for Q in this case.

Shadow decision `F when Q>0, M when Q<0` would have selected the cheaper evaluated F2 branch in **12/12** held-out contact cases. This was **not** wired into continuing organism control, and would not automatically be safe in any other contact regime.

The calculation of Q is **handcrafted**, not learned; the task, world distribution, source actions, baseline and host-side cost are **researcher-authored**. In this specimen F happened to choose zero drive in all contact episodes, so Q is not yet a general `(M-F) × touch` competence with a moving fallback. The host's immediate cost penalizes collision impulse and terminal speed, so the contact-direction relation is naturally advantaged in this narrow 1D test. It is an informative mechanical result, **not self-originated purpose or meaning**.

AUC=1 is on a small, symmetrical, predeclared fixture family; not population generalization. No new independent 2D contact topology, competing goal, changing material affordance, multiple simultaneous contacts, partial occlusion or longer-lived actor activity was tested. No learned or experiential claim was earned.

## 4. Qualifying next pressure (DO NOT RETUNE F3A)

The next useful falsifier is qualitatively different, not another phase/force sweep:

1. **Action-relative portability:** two nonzero alternative motor candidates, changed actor heading and off-axis contacts; see whether a legal private `(candidate - fallback) × contact` relation predicts *actual* regret, without simply transferring the F3A answer.
2. **Contact ambiguity:** multi-collider contact and independent movers, where signed contact aggregates can cancel, mislead, or be dominated by irrelevant body impacts; compare naive relation with truthful cheap physical baselines.
3. **Continuing activity:** only then expose a shadow signal to a standing local physical activity. Demonstrate actual useful continuation against always-M/F and elementary collision-avoidance, without inventing a host goal-bit.
4. **Owner reality:** never promote a fixture PASS to a living organism or accepted game feel.

No Vision runtime import, donor merge, `main` normalization, PR #53/#54 modification or frozen P0/D0 result edit followed from F3A.

## 5. Decision

**Scientific F3A qualification PASS at plane: bounded causal action-value discrimination.**

Preserve as a narrow donor. The project-level frontier is still **personally relevant continuing action and owned significance**, not a universal salience scalar. Next work should challenge this relation in a different causal ecology before promotion or use in an organism.
