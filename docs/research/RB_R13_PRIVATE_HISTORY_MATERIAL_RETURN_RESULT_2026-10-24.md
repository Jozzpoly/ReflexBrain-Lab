# RB-R13 — source-executed result, host failure, honest causal boundary (24 Oct 2026)

## Verdict

**ENGINEERING PASS; research hypothesis of sustained actor-relative use of altered matter NOT QUALIFIED in current R8 host. Strong negative for ordinary material persistence under these four low-cost controls. Memory usefulness under a later *genuine opportunity* remains UNKNOWN, because the 30s counterfactual fork occurs after this actor has already left the material scene.**

Frozen protocol was committed **before** any code/test output: `4bd9f4060ad0de644e7fd0832ff6a1959e78a268`. Source target original R8 `329e1d99e6c2f78c052fdd25e7bf22dc3d219ec6`, separate from R12. First candidate code `61c76bad` failed **TypeScript compilation only** on spreading a readonly positional tuple, before any Vitest execution; one literal type-safe argument passing correction produced code commit `78c9a8945e3568dbb04b2ea38a055c929c98ce84`. No geometry, learning, reward, time, outcome gate or seed changed.

**Source-executed proof**: [GitHub Actions Check #40042886804](https://github.com/Jozzpoly/ReflexBrain-Lab/actions/runs/40042886804), 55/55 test files, 162/162 tests PASS, TypeScript and Vite build PASS. Exact new test took ~15.4s; full suite ~64.6s. Full raw host tracing appears under `RB_R13_FULL_120S` and `RB_R13_FORK_30_TO_60` in job logs of `check`.

## Five ordinary 120-second arms, unchanged seven-part R8 habitat

Same B0 physics and parts, real 120Hz Rapier, source 30Hz private retina/touch/proprio. No scripted motor sequence for autonomous residents, no hidden world coordinates to agent. Source `Occupant` is a **different fully authored controller** from O-DEV; it provides context, not an equivalent learned baseline.

| Controller | Learned completed trials | Touch-contact 30Hz sample windows (host per-part contact event) | Discrete host per-part episodes, separated by >1s | Returns to an already >0.15-displaced *dynamic* part | Net dynamic-part displacement from t0 | Actor X at 30s → 120s |
|---|---:|---:|---:|---:|---:|---:|
| Original R8 authored `Occupant` | 0 | 23 | 14 | **4** | **1.15948** | 6.84 → -12.33 |
| O-DEV adaptive | **79** | 181 | 4 | **1** | **14.51782** | **55.61 → 322.99** |
| O-DEV frozen motor schedule | 0 | 153 | 4 | **0** | 9.19962 | 28.79 → 124.63 |
| O-DEV random seed1183 | 0 | 194 | 4 | **1** | 8.90873 | 4.11 → 19.12 |
| World null (motor zero) | 0 | 0 | 0 | 0 | 0 | 0 → 0 |

**Important measurement boundary:** `Occupant` **23** uses the host `inspectContactSample().contacts` deduplicated per part per 30Hz window. Earlier R8's **22** counted private touch channel `touch>.001`. These are different measurement definitions; do not silently announce a numerical contradiction nor equate internal actor input with host attribution. Collider handles like `5e-324` are lawful Rapier identifiers and are used only by host, not brain.

Cumulative adaptive material movement reached **14.51782 by 30s**, then remained exactly 14.51782 at 60, 90 and 120s in the instrument's *net-position* measure. It did not meaningfully change its material surroundings during later recorded periods. 181 positive host material-contact sampled windows, 4 episodes (only 2 dynamic), all occurred before 30s. The sole return to previously shifted dynamic matter was at tick **964 (~8.03s)**, not late. Its O-DEV action counts across 120s: **[72,3,3,2]**, overwhelmingly forward (not proof that exact physical path is a circle). By 30s the actor had already escaped to X=55.61, far from authored positions (~-4.4 to +7.1); by 120s X=322.99.

The **non-learning random** control also returned once to previously shifted matter, while original authored turquoise-related `Occupant` returned **four** times with less overall displacement. Neither is an organism or semantic learner. Raw 'amount shifted' is not a fitness or meaningful-use score. An episode's further net displacement after returning may be due to accumulated motion / repeated impacts, and is not itself proof that the return *caused* a valuable lasting consequence.

## True shared-physics private memory intervention — 30 → 60s

At the **same exact captured 30s Rapier bytes, actor-private frame, body pose and unfinished motor commitment**, fork (A) retained original learned stats, (B) reset acquired stats only; frozen and random as cheap policy-change controls. Original learned trials by fork: **19**.

- First differing *motor command* intact vs memory-ablated: **tick 3600**, immediately after fork; first private sample was identical, worlds were byte-identical at start.
- After 30s continuation, actors were **14.041** spatial units apart. Thus learning parameters are **causal for movement**, as already shown in #81.
- **All four** futures had **zero new per-part sampled material contacts, zero new material-return episodes, and identical material net displacement 14.51782** at t60.
- Final actor X: intact **144.71**; ablated **131.66**; frozen **80.42**; random **61.16**. They pursued different paths **away from the material scene**.
- Therefore, preserved learned history did not produce *any observed material consequence* in this fork. Because all agents began ~50 units past the finite scene and private retinal range is only 12 units, **this was not a fair material re-encounter opportunity**. The fork is a real causal motor-history control but **does not identify** the ability/inability to recognize previously experienced matter when it is presented again.

## Falsification and interpretive stop

1. **FAIL**: Current open-material R8 + unchanged O-DEV does not support sustained normal-life material interaction in this source 120s scene.
2. **FAIL**: The existing O-DEV four-action body's mobility proxy does not demonstrate a material-relevant history *advantage* versus cheap schedules here; late material effects disappear in every arm.
3. **PASS (known)**: Private score history causally changes motor output under identical current physics/senses.
4. **UNKNOWN**: Whether any agent can develop grounded repeated material use given a viable re-encounter opportunity; the current fork is materially barren. **Do not infer an impossibility theorem from this failure**.
5. The actor's large initial push is **not** life, resource use or benefit, nor is a stationary world intrinsically wrong.
6. **Do not** artificially attach a 'stay in the arena' reward, multiply colorful boxes, enlarge the blank World, add a rail under the actor, make a new locomotion score, or call it a cure. Further 4-maneuver tuning violates the intended scientific stop.

### New research direction, not implemented

The missing variable is more fundamental than old memory weights: **why should this actor return to, depend upon, or repair a particular material relationship?** Current R8 has only inert, permanent matter and an actor whose future viability is effectively unchanged by leaving every part behind. A serious next host should have physically legitimate recurring relations that *alter the organism's continuing possible actions*, without scripting success at individual puzzles.

At least two competing designs deserve analysis before implementation:
- **Ecological recurrence:** independent/relational material processes make prior traces relevant at later times; requires no magically attracting the actor to the original box.
- **Embodied need or dependence:** changing material affordances genuinely alters body support, safety, sensing or continued action; a cheap hardcoded survival loop must be treated as a competing explanation, not dismissed.

Do not assume a fictitious 'energy bar' or constantly motorized obstacles are necessary; pressure can arise from constraint/shape, contact and persistent opportunities. The Owner's gameplay/experience has veto over paper simulation complexity. Open world should be **substantively open, not merely unbounded empty coordinates**.

No main, R8, R12, Pages, Jaskinia or public deployment changed. This remains a draft research finding, not product qualification.
