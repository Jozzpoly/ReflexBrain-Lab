# RB-VISION/D1–D4 — Physical affordance before active optical relevance
**2026-10-11 · PRE-REGISTERED RESEARCH PLAN / NOT EXECUTED · Vision/F2→F3→F4**

**Boundary:** This document freezes the next proposed test question and independent controls before observing new D-series results. It does **not** record a successful experiment. PR #54 and previous C2–C7 are executable donor evidence; this document is *SCOUT only*. No production/runtime architecture promoted.

## Why this is a distinct experiment

The previous C1–C7 tests established:
- a generic `touch>0` reward can optimize *unrelated collisions*;
- many simple features (direction, familiar color, travel distance) are false completion certificates;
- a cheap optical discontinuity detector can overfit material teleports (C6) and fail against continuous World-powered interaction (C7);
- same-looking two-object swaps can yield exactly equal complete private histories despite differing hidden identity (C4);
- visual angular quantization can invalidate a motor-progress heuristic on a distant small target even though a simpler motor succeeds (C5).

**D-series inversion:** do *not* teach a good/bad semantic tag for an object. First test whether different *physical action consequences* are lawfully observable through the actor's existing action, proprioception, touch and retinal image. Only then ask whether visual detail learned alongside those consequences predicts them well enough to make expensive reinspection useful.

This belongs to the F2 question **'which local action models apply in this physical regime?'**, and makes a candidate bridge toward F3 actor-relative relevance. It is **not** F3 itself, nor intrinsic reward, curiosity or a full NPC.

## D1 — must establish physical substrate BEFORE any learning or marker

Two collision objects use **exactly identical initial retinal appearance**: same shape (circular), position, size, color and lighting raycast behavior. One is movable by physical contact; another is mechanically anchored/very stiff under the same lawful actor push. A third stress variant uses a movable but much heavier body if Rapier configuration supports it; no claims until solver impulse and body motion are measured.

**Only host experiment design** chooses underlying rigidity, captures solver/world object displacement and snapshots. The actor receives:
- native 96×RGB / 30Hz only;
- own applied drive and clock;
- integrated body-local forward proprioception;
- 8-sector touch impulses;
- optional prior privately experienced consequences.

Prohibit host material label, object handle, true mass, world positions, `fixed` flag or direct target-specific collision IDs as actor inputs.

**Basic controls:** actor holds, actor pushes; confirm at the decision boundary identical legal RGB and (if material isn't currently in contact) touch/proprio, and both classes exist. Evaluate actual material displacement and actor's private post-touch motion separately; a high tactile magnitude alone must NOT be treated as a desirable outcome.

**D1 qualification:** private *consequence* after a real physical push differs measurably by underlying material regime and is stable under at least two ranges/approach speeds. A result of 'both contact, one stuck' without private discriminative signal is **FAILED**, not an affordance-learning success. If difference is only the host object displacement but no private signal, future predictor cannot claim to know it.

## D2 — can a lawful appearance detail acquire a material prediction through actor experience?

Introduce small retinal details or colored marks *near* visually similar objects. The marks are **external appearance cues, not motor rewards or labels injected into cognition**.

Crucial distinction:
- **Hypothesis H0:** coarse native sight cannot reliably resolve two marks at distance. Lawful fine focus/extra rays could help.
- **H1:** only after both observed cues have been associated with actual **private** push outcomes, a simple learned conditional predictor can distinguish likely effects before contact.
- **H2:** if marks are swapped or cease correlating with physics, the predictor must lose or update its competence; host-hidden `marked=good` classes are prohibited.

Prior experience can consist of a small number of separate physical episodes with preserved PRIVATE learned statistics—clearly label this **lab episodic transfer**, not a continuous life. Compare with a version in a persistent World if the host permits reproducible genuine continuation.

Pre-trained/perfect mapping read from the scenario generator is not evidence for learning. The learner should predict **future proprio/tactile consequences under its own action**, not receive a scalar `success=1` from the host. Host-only physical labels may be used for analysis, not training.

**Confound:** tiny cue objects must not physically change push dynamics, distort the collider material class or create a trivial visible difference when the claim is 'fine focus needed'. Validate exact native coarse RGB equivalence at the chosen bearing/pose; if not equal, broad vision is already sufficient and H0 FAILS.

## D3 — does costly attention CHANGE real body behavior?

Test three choices with identical actor/world checkpoint and priors:
1. **ACT** now using ordinary broad retina.
2. **LOOK** (native gaze sweep / intentionally denser lawful optic method, measured as real elapsed ticks, gaze motor command and missed periphery), then ACT if learned prediction warrants it.
3. **PROBE** the object's physical response, paying actual bodily time/contact cost; then ACT/withdraw/continue.

Do NOT compare against a low-resolution blind controller only. Include:
- always push;
- always refrain/hold;
- unconditional scan;
- simple 'same-color' controller;
- last-outcome persistence;
- simple tactile probing with no vision;
- analyst physical oracle (upper bound only, never participant input).

**Primary actor-private prediction outcome:** held-out difference in action→body-relative proprio/touch forecast error, not AUC of host material-class labels. **Primary host-scored material outcome:** bounded physical action regret relative to the best *available actual action*, with declared time/contact/drive costs. If the actor has no standing activity that assigns value to forward motion vs retreat, report *conditional affordance prediction only*; do not fabricate personally owned utility from this metric.

**Important risk:** if the tiny mark is itself associated with an authored reward `red=push`, the test is merely color-conditioned command classification and does not advance ReflexBrain. Require learning from prior *material consequences* first.

## D4 — falsifiers that MUST travel with any positive test

- **Perfect optical alias:** visually indistinguishable objects with different physical affordances. Before contact, their priors and legal optical histories may be identical. No model can claim certain pre-contact identity; physical probing is required, or uncertainty must remain.
- **Cue reversal / distribution shift:** cue appearance–material mapping reverses with no host signal. Does the actor continue damaging/stalling or lawfully acquire counterevidence? Never tune a new threshold on the held-out reversal.
- **Uncorrelated marks:** information-rich fine cue with NO relation to material consequence. A rational extra glance need not be useful; no artificial reward for more pixels.
- **No actual choice divergence:** if all policies choose the same motor action, there is no qualified evidence that finer vision affected behavior, however good the RGB classifier looks.
- **Real unrelated mover/contact:** World-powered physical intervention (not timed host teleport) may spoil stale visual association and produce irrelevant touch; retain C7 as challenge.
- **Hidden individual identity:** repeated like-objects may be physically equivalent but differently labeled by host. Do not reward knowing unobservable handles (C4).
- **Distance/quantization:** small far cues may fail native ray sampling and make simple motor/calibration outperform a more elaborate estimator (C5).
- **Peripheral event:** extra fine focus must have opportunity cost; A4 found 15/40 small-periphery misses in the sparse-periphery static family. Do not universalize the exact 80/16 retina layout.

## Freeze/anti-overfit requirements

1. Choose physical ranges, action duration and cost coefficients BEFORE viewing confirmation outcomes. Report raw proprio/touch data, not only a scalar reward.
2. Whole-episode split; no train/test leakage through repeated orientations or identical four-tuples at varied names.
3. Distinct checks for *sensor discrimination*, *private consequence discrimination*, *predictive generalization*, *real material action improvement* and *organism-owned relevance*. A PASS on one never promotes the rest.
4. Failed attempts, non-contact genuine targets and badly chosen geometry remain in the ledger (do not delete as 'broken fixtures' unless the apparatus itself is invalid).
5. Canonical ReflexBrain remains on `research/pre-o0-foundations-campaign` and controls evidence promotion; draft PR #55 is a documentation-only reconciliation.
6. STOP adding new complexity if simpler purely motor/tactile baselines outperform detail-driven learning. In particular, a learned gaze model is not justified by attention-induced new pixels alone.

## Live implementation status / blocker

At 2026-10-11 session, attempts to create a new TypeScript physical-probe test through the available GitHub connector returned an explicit **tool-safeguard rejection**; no D-series test source was created or executed. A research plan file was successfully created. Do not claim D1–D4 PASS, do not switch to a covert file-write route; resume implementation only via a legitimate available path or permitted direct tool operation. Current last fully qualified source remains the C2–C7 suite at [CI 38097711306](https://github.com/Jozzpoly/ReflexBrain-Lab/actions/runs/38097711306) for PR #54 (53/53 files,153/153 tests), and [CI 38097736095](https://github.com/Jozzpoly/ReflexBrain-Lab/actions/runs/38097736095) for documentation-only PR #55 (27/27 files,42/42 tests).

## External research to orient experiments, not evidence of ReflexBrain results

- Mandil & Ghalamzan-E (2026), **SPOTS**, *Robotics and Autonomous Systems*, experiments on visually identical objects with different physical properties; multimodal prediction is particularly useful under genuine physical ambiguity: https://doi.org/10.1016/j.robot.2026.105512 .
- Dutta, Burdet & Kaboli (2025), **Predictive Visuo-Tactile Interactive Perception Framework for Object Properties Inference**, *IEEE Transactions on Robotics*: active physical probing and visual/tactile inference of unobserved mechanical properties: https://doi.org/10.1109/TRO.2025.3531816 .
- Deng et al. (2025), **Coarse-to-Fine Robotic Pushing Using Touch, Vision and Proprioception**, *IEEE Robotics and Automation Letters*: combines visual localization and contact/proprio for pushing, rather than treating vision-alone appearance as mechanical knowledge: https://doi.org/10.1109/LRA.2024.3511378 .

These are supporting precedent for the *question and experiment structure*. Their methods or measured improvement are NOT transplanted ReflexBrain evidence.

## Resume/decision

**Current question:** Is there an actor-private, physical-experience-founded prediction of a previously unseen object's useful reaction to one's own action, and if so does paying for finer vision actually improve real subsequent behavior over simple probing or always-doing?

**Next valid step:** run the D1 paired-physics probe and verify at the same decision boundary identical private optical input; classify FAIL early if no lawful post-contact difference; only then build D2 fine appearance link and D3 attention policy. Explicitly involve the project's canonical F2 model-validity failure and C4 impossible hidden-token identity as falsifiers.

No new architecture, reward schema, or claimed living organ was approved by this plan.
