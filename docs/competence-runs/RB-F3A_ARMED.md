# RB-F3A — Action × Directional-Touch Relational Value — ARMED — 2026-10-10

Status: **ARMED · QUALIFICATION RUN · NO OWNED-REASON CLAIM**

Parents:
- RB-F2/P0 scientific FAIL;
- RB-F3/D0 MATERIAL ALIAS FOUND.

## Primary question

> Does a lawful actor-private relation between intended local action direction and body-local directional touch predict the sign of local M-vs-F action value on held-out mirrored contact episodes, where generic mismatch magnitude and binary touch cannot?

This is a relational relevance precursor.

It is not:
- wall recognition;
- semantic contact;
- a goal/matter;
- meaning;
- a learned classifier;
- a final controller.

---

# 1. Frozen private relation

For each decision state:

- M is the frozen F2 local model;
- F is the frozen F2 fallback;
- M selects a candidate drive exactly as in P0;
- directional touch is measured in the body frame from legal solver contact normal/impulse.

Define:

`Q = mean_signed_directional_touch_impulse * M_drive`

Interpretation for analysis only:

- Q > 0: M drive points toward / reinforces the currently touched direction;
- Q < 0: M drive points against / relieves the currently touched direction;
- Q = 0: no directional relation or zero M drive.

No fitted threshold.
No learned weights.
No World-side wall direction.

The actor-private ingredients are:
- own candidate local motor demand;
- body-local touch direction/magnitude.

---

# 2. Held-out qualification set

The D0 discovery pair is excluded:

- D0: phase 0, |external| = 1.05 Fmax

F3A uses six new mirrored pairs = **12 contact episodes**.

Frozen pairs:

| Pair | phase | |external| / Fmax |
|---|---:|---:|
| P1 | 2 | 0.95 |
| P2 | 4 | 0.95 |
| P3 | 6 | 1.05 |
| P4 | 8 | 1.05 |
| P5 | 10 | 1.15 |
| P6 | 12 | 1.15 |

Each pair contains:
- right wall / +external;
- left wall / −external;
- identical body, demand history and absolute force magnitude.

No search after activation.

---

# 3. Free controls

Add six no-wall controls using the same phase set:

- phases 2, 4, 6, 8, 10, 12;
- nominal body dynamics;
- external force magnitudes alternating ±0.25 Fmax.

Purpose:
- directional touch must remain zero;
- Q must remain zero;
- the relation should not fabricate relevance in free space.

These controls are not used to fit anything.

---

# 4. Directional touch implementation

Use the lawful body-local pattern already independently audited in Living Organism:

- contact manifold normal;
- solver impulse magnitude;
- rotate into body frame;
- no collider identity;
- no World coordinate;
- no wall label.

For this 1D specimen, the signed X component is sufficient.

Qualification code must reproduce the F2 episode's ordinary/private history and counterfactual M/F outcome.

Directional touch is sampled over the same final 24-transition history window.

---

# 5. Primary evaluation

Informative contact episode:
- M and F choose different drives;
- host-side regret is not a tie.

Binary label:
- M_WORSE: regret > 1e-6
- M_BETTER: regret < -1e-6

Signals:

### Candidate relational signal
- Q = signed touch × M drive

### Baselines
- F2 R magnitude;
- binary touch fraction;
- signed directional touch alone;
- M drive alone;
- absolute M drive.

Higher Q means "M more likely worse".

Compute pairwise ROC AUC on informative held-out contact episodes.

---

# 6. PASS

All required:

1. deterministic full rerun;
2. all 12 held-out contact scenes have nonzero lawful directional touch;
3. at least 8/12 contact episodes are informative;
4. both M_WORSE and M_BETTER classes are present;
5. Q AUC >= **0.90**;
6. Q AUC exceeds R magnitude AUC by at least **0.25**;
7. Q AUC exceeds binary-touch AUC by at least **0.25**;
8. Q AUC exceeds directional-touch-alone AUC by at least **0.10**;
9. sign rule `Q > 0 => M_WORSE; Q < 0 => M_BETTER` is correct on at least **80%** of informative contact episodes;
10. all six free controls have zero directional touch / Q within tolerance;
11. no wall side, World X, collider identity, external force sign or host regret enters Q.

## FAIL

Execution valid but one or more requirements fail.

Important valid FAILs:
- directional touch alone already explains everything;
- Q only works for one force magnitude/phase;
- sign relation flips across held-out pairs;
- many M/F choices tie;
- free controls produce nonzero relation;
- R remains equally predictive.

No rescue by:
- changing held-out phases;
- adding more pairs after result;
- fitting a classifier;
- adding wall-side label;
- changing M/F/cost.

## INCONCLUSIVE

Only if:
- fewer than 4 informative episodes;
- one regret class absent;
- apparatus fails mirrored contact.

---

# 7. Maximum claim

PASS would establish only:

> In this bounded contact competence specimen, a lawful relation between the actor's intended local action direction and body-local directional contact carries action-value information that generic mismatch magnitude and non-relational touch do not.

It would NOT establish:
- semantic meaning;
- owned reason;
- goal;
- general affordance;
- general contact competence;
- learned ReflexBrain.

---

# 8. Why this matters for F3

F3 is about actor-relative relevance.

D0 established:
> private event magnitudes can alias opposite action value.

F3A asks:
> can adding a **relation to the actor's own action** resolve that ambiguity?

If PASS, the next F3 question is not "make Q a salience scalar".

It becomes:

> how can such relational evidence matter only while a relevant local activity/expectation is actually ongoing, rather than globally?

That is the bridge toward endogenous owned relevance.
