# RB-COMP/VISION B1–B5 + C1 — Competence reconciliation (2026-10-11)

**Status: PROPOSED CROSS-LAB EVIDENCE RECONCILIATION · NO ARCHITECTURE PROMOTION · NO MERGE**

**Purpose:** keep ReflexBrain's native competence frontier coherent with the fast independent active-retina laboratory without importing its eye code, learned bandit or authored target/reward ontology wholesale.

**Source donor:** draft [ReflexBrain PR #54](https://github.com/Jozzpoly/ReflexBrain-Lab/pull/54), `research/vision-lived-retina-loop-2026-10-10`; parent branch `research/living-organism-runtime-a-2026-10-08`.  
Source reports:
- `docs/vision/LIVED_RGB_FOCUS_L1_L3_RESULT_2026-10-10.md`,
- `docs/vision/ACTIVE_DETAIL_FOVEATION_A1_A3_2026-10-10.md`,
- `docs/vision/FOCUS_A4_A7_PERIPHERY_PARALLAX_ACTIVE_QUERY_2026-10-10.md`,
- `docs/vision/DYNAMIC_INSPECTION_A8_A10_2026-10-10.md`,
- `docs/vision/ACTOR_RELATIVE_ATTENTION_B1_B3_2026-10-10.md`,
- `docs/vision/ATTENTION_LEARNING_B4_B5_2026-10-10.md`,
- `docs/vision/TOUCH_REWARD_RELEVANCE_C1_2026-10-10.md`.

**Verified source evidence:** [B4/B5 exact-source CI](https://github.com/Jozzpoly/ReflexBrain-Lab/actions/runs/38096382941) on `e9088de2bec0d394a00e207320b2096877030790`, 49/49 files, 146/146 tests PASS; [C1 corrected source CI](https://github.com/Jozzpoly/ReflexBrain-Lab/actions/runs/38096690386) on `46eed114afda266cdda1657a96ac83582800964e`, 50/50 files, 147/147 tests PASS. GitHub Actions also reports TypeScript/Vite build success. These certify test-only narrow mechanics, not self-directed organism intelligence, Owner-experienced life, adaptive generality, or any future merge.

## 1. Scientific reinterpretation triggered by Owner correction

The intended value of focus is *to resolve a fine/distant appearance that broad sight cannot resolve, by paying a price elsewhere* — **not** to keep a salient object at the retina center for more frames.

- **EVIDENCE / sensory:** legal native 96 RGB rays plus changing gaze direction can reveal otherwise missed ordered fine details at range (A1/A2).
- **DONOR / test-only:** redistributing the same 96 raycasts between detailed patches and peripheral sentinels can retain some wide detection, but naive sparse periphery missed 15/40 small peripheral stimuli that uniform wide vision saw; simple phase dither succeeded in one family and failed on held-out moving episodes (A3/A4).
- **EVIDENCE / material geometry:** two focused RGB edge views plus own sensed forward displacement improved subsequent real motor choices in a static gate family (A6), but 8 directed queries nearly matched 192 extra focused rays (A7). A World gate changing during the measurement caused those predictions to become dangerously stale (A8). Three views raised a usable *inconsistency alarm* in a narrow family but left genuinely opened opportunities unused (A9). An event **after the last legal sensory sample** creates an unavoidable actor-private action-value alias (A10).

Therefore acuity, sample allocation, body-relative history, model validity, actor-relevant uncertainty and actual material consequences are distinct scientific dimensions. No preferred `80+16`, `48+48`, special ray-query API or memory map earned canonical status.

## 2. B3 — exact-current actor-private material relevance bridge

Two physically real worlds have:
- exactly the same present actor/target Rapier pose, velocity and rotation;
- exactly the same currently available legal RGB, touch, gaze and proprio;
- different **lawful prior visual encounters**, recorded only privately.

An authored, history-conditional eye controller in the prior-sighting branch re-looks, rediscovers the target, and drives the existing `ApproachEpisode` to physical contact. The no-sighting branch does not. Ablating the extra eye action with retained sighting history also blocks the contact.

**Narrow EVIDENCE:** private prior encounter + authored relevant standing activity can *cause later sensory inquiry and physical behavioral divergence* without World-label leakage.

**Crucial strong baseline:** no-history actor with unconditional scanning also found the target and touched it **sooner**. Thus the historical attention rule is not yet a superior competence, and the existing turquoise target/activity is researcher-authored.

## 3. B4/B5 — a learned policy without the learning of what matters

The mini contextual bandit trains over **32 physical Rapier trials**, holding its statistics across lab resets. The reward depends solely on actor-private touch, elapsed time and issued gaze-demand magnitude—not privileged target labels. The input contexts, however, are explicitly handwritten: current turquoise seen; turquoise previously seen but now absent; turquoise never seen. The goal and scalar reward are handwritten too.

Held-out result (7 scenes):
- learned: **3/7** contacts, exactly same actions/value as cheap authored history gate;
- unconditional scan: **5/7** contacts, higher mean artificial reward;
- no scan: 1/7.

**A genuine learning effect** was observed under distribution shift: after host made unseen novelty common across 36 new episodes, a greedy learner kept choosing no scan, experienced no counterevidence and made **0/36** contacts. A learner with an **investigator-fixed 24% exploration probability** first found a previously unseen target through a non-greedy scan on trial10, updated its own empirical action value and subsequently obtained **22/36** contacts. But the even simpler unconditional scan produced **30/36**, with higher reward. When the world became empty again, the learned mean responded sluggishly and the policy wasted gaze effort for **12/12** further trials.

**Classification:**
- **EVIDENCE (narrow):** a simple eye action preference can update from legal physical touch/time/effort consequences.
- **FAILED broad claim:** it reliably outperforms simple gaze; it reliably generalizes to hidden novelty; it rapidly tracks changes in the environment.
- **NOT EVIDENCE:** spontaneous attention, agent-owned reasons, self-discovered reward, or training within a single life. Resets/curriculum and persistent learner statistics belong to the lab; one fixed random seed and narrow authored contexts are insufficient for robust population claims.

Two actor-private observation aliases delimit any policy's certainty:
1. never-seen, no object vs never-seen, unseen reachable object; same available RGB, opposite relative value of scanning;
2. previously-seen target now outside sight vs gone entirely; same actor-private history at choice time, opposite return on continued search.

More capacity on the same private evidence cannot identify hidden realities without legally acquiring further information. An assumption about their expected frequency is itself uncertain and context-dependent.

## 4. C1 — **material FAIL: generic touch is not completion of a personal activity**

The existing `ApproachEpisode` ends on **any** actor-private positive touch. A real World/Rapier unrelated dynamic collider, inserted in the forward physical contact envelope while actor approaches turquoise, can make the same private controller report completion at **tick84**, while it is **6.35m away from the turquoise target**. Host contact attribution verifies unrelated collision, not target touch.

| Genuine actor activity outcome | Contact time | Real target touched? | B4-style scalar training reward |
|---|---:|---|---:|
| Actual turquoise target | tick504 | YES | +0.9167 |
| Unrelated object in physical path | tick84 | **NO** | **+0.9867** |

One unrelated impact and the real target impact both activate exactly the same body-private touch sector **4**, with similar impulse (~0.72 vs ~0.73). This is an alias of a **narrow touch feature**, *not* of entire visual/proprioceptive histories. Do not infer no lawful discrimination is possible; an actor may need temporal visual/body-relative correspondence and post-contact continuation.

This is stronger than an ordinary prediction-performance concern:

> Even if an attention learner optimizes its own scalar training reward perfectly, the reward may encode the wrong interpretation of the organism's materially continuing activity.

**FAILED:** `private_touch_positive => my previously observed target/matter was fulfilled`. This is the single most important negative finding in this reconnaissance.

## 5. How it relates to canonical ReflexBrain frontiers

### F2 — competence domain validity: SUPPORTED MOTIVATION

A competent eye/action choice in one material regime can become harmful or reward-confounded when target appearance, causality, contact or world dynamics differ. This directly reinforces canonical F2/P0's negative finding that generic mismatch is not local competence value. Do not substitute a scalar retinal surprise for F2.

### F3 — genuinely actor-relative relevance/standing matter: **PRIORITY UP**

B3 supplies a causal bridge from **prior private encounter** to later material continuation. But C1 shows why a visually defined target and any touch still do not establish satisfaction of an owned concern. ReflexBrain needs to test *a personally relevant relation between its former intended action, later lawful sensory evidence and the consequences actually experienced*, not a host-coded `CONTACTED_TARGET` or a premade social `Matter` label.

Do not build an elaborate learned attention governor atop an unevaluated generic reward. That risks training the brain to efficiently maximize false completion signals.

### F4 — active information acquisition: OPEN, but better localized

A local system can learn that looking sometimes produces physical benefits, but it needs:
- a genuinely continuing relation/concern whose satisfaction/failure it can privately evaluate with defensible evidence;
- uncertainty about whether a new observation will change real subsequent action;
- a real opportunity cost of looking or probing, not a sole reward for seeing color;
- held-out nonstationary/no-target/false-touch/missed-periphery tests and cheap baselines.

An actor-private attention controller **might** subsequently select glance / narrow query / foveation / body movement; B4/B5 does not yet license that architecture.

### G5A — independent ecology/privacy: UNCHANGED

G5A foundation stays distinct. The Vision donor uses host-translated target pressure in some arms and a true World-powered moving target in others; all claims must state that difference. Do not blend Vision's authored target/reward into G5's independent private-authority contract.

## 6. Next ReflexBrain-native test recommended

**RB-F3/F4-CANDIDATE (not frozen): personally grounded continuation vs counterfeit touch**

An actor already pursuing an activity acquires real private evidence of its current material relationship to the environment. A second independent physical process produces ambiguous contact *while that activity remains unresolved*. On ordinary subsequent actor steps, does it:
- persist/verify the original concern only when its personally available evidence actually supports it,
- sometimes decide additional looking/body exploration is worthwhile rather than always or never,
- remain uncertain if the legal private channels cannot distinguish an unrelated collider from its former goal,
- update its local competence after the world actually contradicts its earlier expectation?

**Frozen comparison would require:**
- only lawful actor-private touch direction/impulse, RGB with time/gaze bearing, action/proprio history (no privileged collider ID);
- actual physical continuation and multiple distinct object shapes/positions/motions;
- ablations: generic touch terminal; direction-only touch; appearance-only confirmation; recent-history/relational competitor; trivial always-verify/no-verify;
- independent host-only truth audit, matched forks, held-out occlusion and a control where real target touch is initially visually occluded;
- no learner promotion when performance is achieved by a new researcher-authored `is_target` flag.

This is a research *question*, not an implementation specification or permission to freeze a new architecture. It should be chosen against other still-open competence-frontier priorities, not launched solely because Vision is the newest laboratory.

## 7. Ownership, source truth, limits

This document is a **cross-lab stewardship addendum** proposing how to interpret PR #54. It changes **no executable main code or canonical contracts**. Vision PR #54 remains draft/SCOUT with test-only changes and its own reports. This reconciliation PR should also remain DRAFT pending proper review; do not auto-merge it into `research/pre-o0-foundations-campaign`.

Owner-observed organism life/game quality remains unqualified and cannot be overwritten by green unit tests. Stronger simple baselines and falsifiers are binding counterevidence, not reasons to hunt for another hand-picked favorable setup.

One-sentence current truth:

> **Private experience can train a local decision about where to look, but ReflexBrain has not yet learned what material outcome makes that decision personally worth taking — and generic touch can actively mislead it.**

## Recovery anchors

1. Live PR #54 and current qualified source, especially `vision-private-attention-learning.test.ts` and `vision-touch-reward-confound.test.ts`.
2. `docs/vision/ATTENTION_LEARNING_B4_B5_2026-10-10.md` and `docs/vision/TOUCH_REWARD_RELEVANCE_C1_2026-10-10.md` on its research branch.
3. The canonical Control Room on this addendum PR's base branch.
4. Previous F2/P0 and F3/D0 canonical negative experiments: generic prediction error is not competence, and body-relative directional touch may break a *particular* alias but not confer universal meaning.

Decide project work based on the live frontier and Owner intent, not the number of passing test files.


---

## 8. Independent C2–C7 falsification update (2026-10-11)

**Origin:** Vision [draft PR #54](https://github.com/Jozzpoly/ReflexBrain-Lab/pull/54), full source report `docs/vision/CONTACT_IDENTITY_F2_F3_C2_C7_2026-10-11.md`.  
**Exact-source CI:** [38097582954](https://github.com/Jozzpoly/ReflexBrain-Lab/actions/runs/38097582954), 53/53 files and 153/153 tests, TypeScript/Vite PASS, source `110a010311a9cbccd6b88d1533799eb8bfd7310e`. Test code only; no production organism modification.

These results sharpen the original C1 claim rather than proposing a new ontology:

**C2 and C3 · More private cues are not automatically material meaning.** On 20 actual unintended Rapier contacts spanning five event times, two sides and orange / same-turquoise appearance, the actor had really observed and approached an earlier turquoise object. Every elementary researcher-authored private success rule falsely accepted some decoys: generic touch 20/20, forward touch 10/20, visible familiar-color 14/20, persistent color 20/20, large familiar patch 10/20, 4m accumulated travel 8/20. Eleven additional genuine contacts across varying physical target distances and sizes reject an easy `contactTime` explanation. A twelfth genuine distant-small target was never reached by the progress-history motor and remains an explicit *not contacted* case.

**C4 · Exact legal-historical identity alias, not a model-capacity problem.** Two fully physical branches began with the same lawfully seen target, then experienced an unobserved adversarial exchange of two physically/visually identical turquoise bodies. The actor's *entire* native RGB, eight-sector touch, tick, gaze and proprio history was **22/22 samples exactly identical**, actual contact time tick84 identical, but the host knew it contacted its previous individual in only one World (in the other, a lookalike while original remained 6.344m away). A model cannot infer a hidden, unobserved individual identity from exact identical lawful inputs.

**Anti-claim for C4:** this is a hidden host-defined *identity distinction*, not automatically a material difference to an actor if the two bodies are functionally indistinguishable in all further consequences. Therefore it proves an epistemic limit, not the intrinsic meaning of target attachment or the need to solve unobservable identity. The setup swaps colliders by host intervention; natural material motion is a separate falsifier.

**C5 · Strong simple motor beats unreliable visual-progress history in an adverse sensor regime.** For a genuine target center 9.4m away, radius0.45m, authored image-size-progress reconsideration made the existing ApproachEpisode stall ~4.936m short despite actual body travel ~4.464m. Disabling the progress-history complication in otherwise identical World and sensor allowed **real target touch at tick732**. This is **material negative F2 evidence** of a competence rule outside its angular-quantization domain; not proof that body history never helps.

**C6 → C7 · Why passing a hand-engineered world distribution is not semantics.** A cheap lawful recent-retinal-patch smoothness test correctly accepted 5/5 true contacts and rejected 20/20 off-target contacts, mainly by detecting sudden **host teleports**. The same frozen .15rad criterion falsely accepted two off-target collisions when an independent, force-driven **World mover** caught the actor from behind at tick312, with original goal still 3.777m away. The native turquoise visual patch was present and its recent angular extent jump was **exactly zero**. This is **domain-specific failure of a superficially perfect rule**, not an arbitrary stricter threshold problem. C7's rear contact is legally direction-distinguishable; C2/C1's frontal contacts make direction alone insufficient overall.

### Updated prioritization for canonical Control Room

- **F2 (competence applicability) rises:** direct executable material counterexample to learned-looking progress inference based on a limited retina; simple rival actual-contact PASS.
- **F3 (owned reason and success) remains crucial:** the actual activity's object relation and its desirable future consequences are not conferred by scalar tactile activation, identical color, hidden handle ID, or pre-authored familiar-object labels. The C4 alias means some identity questions cannot be answered without distinct lawful evidence, or may not even be materially worth answering.
- **F4 (active scrutiny) gains a stronger selection criterion:** *what lawful distinguishing information could another glance/body motion obtain, and could it change a personal material outcome?* Variable-density foveal features, temporal private correspondence and tactile causality are competing hypotheses, not earned canon.
- **G5A and other foundational truth stay unchanged**, no source/contract/production merge.

**Recommended next high-value experiment:** two materially consequential objects with *otherwise similar cheap appearance* but **subtle legally resolvable differences** whose relevance must be acquired from prior actual interaction, not provided by World target IDs or a hand-coded `rewardForMarkedColor`. A future sensorimotor activity should have the option of investing in costly inspection, proceeding on partial evidence or declining to act; evaluate against strong no-look/always-look/learned simple baselines and an explicitly unknowable identical-token control.

**Do not freeze** a `.15` image-jump constant, a universal directional touch heuristic, a physical identity tracker, a replacement reward scalar or another actor `Matter` record solely from these fixtures.

PR #55 remains a **documentary draft**. Owner experiential judgement and real autonomous organism continuity, not GitHub CI, determine if any donated competence materially improves the living organism.
