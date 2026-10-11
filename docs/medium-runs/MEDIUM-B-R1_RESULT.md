# MEDIUM-B/R1 — Field Lab v0 Long-Run + Abuse Integrity — RESULT — 2026-10-07

Status: **ENGINEERING FAIL · EXECUTION VALID · NO FIX APPLIED**

Base specimen: `246c6b2d6d8c09326b3dc31eb8f603f56031aac5`
Run PR: #21
CI: `37658809848`
Check job: `112920728856`

The run changed no Field Lab behavior. It only exercised the frozen public v0 implementation.

---

# 1. Unattended 50k soak

Exact metrics from CI:

```json
{
  "ticks": 50000,
  "maxAbsCoord": 6.688135147094727,
  "maxSpeed": 5.606989675939207,
  "sweeperReversals": 0,
  "modeTransitions": 0,
  "modeTicks": {
    "ROAM": 50000,
    "BOUNCE": 0,
    "CHECK": 0,
    "YIELD": 0,
    "PAUSED": 0
  },
  "visibleTicks": 50000,
  "hiddenTicks": 0,
  "finalMode": "ROAM",
  "finalEvidenceAge": 0,
  "finalActor": [-1.9394835233688354, 1.7999999523162842, 0],
  "finalTarget": [-0.559942901134491, 1.7999999523162842],
  "finalSweeper": [6.680057048797607, -3.674325466156006, 1],
  "internalEventCount": 1,
  "publicEventCount": 1
}
```

## FAIL A — the supposed recurring independent sweeper dies

Precommitted engineering requirement:
- long-run sweeper must repeatedly reverse and remain an active physical process.

Observed:
- **0 reversals in 50,000 ticks**;
- final sweeper `(6.6801, -3.6743)`, direction still `+1`;
- the intended lane is y `-2.65`;
- the sweeper therefore left its intended lane and ended near the lower-right room boundary.

This falsifies the current medium-level wording that the Field Lab contains a healthy continuing independent sweeper.

The current physical mechanism is a donor / broken prototype, not a qualified independent ecology process.

No rescue attempted in this run.

---

# 2. Actor/target/occluder jam — causal seam defect exposed

The unattended run also produced:

- actor final center x `-1.93948`, radius 1.0;
- target final center x `-0.55994`, radius 0.38;
- central occluder centered x `0`, half-width 0.18.

Geometrically:
- actor right edge ≈ `-0.93948`;
- target left edge ≈ `-0.93994`;
- target right edge ≈ `-0.17994`;
- occluder left edge = `-0.18`.

This is essentially an exact physical stack:

> **actor -> target -> occluder**

Yet private/controller metrics report:
- `ROAM` for all 50,000 ticks;
- **0 mode transitions**;
- target visible for all 50,000 ticks;
- evidence age always returns to 0.

Source audit had already identified that `actorContact()` includes:
- occluder,
- room walls,
- loose bodies,

but **excludes the target and sweeper**.

Therefore the body can be materially blocked through target contact while the authored monitor never receives generic contact evidence for that blocker.

This is stronger than "the actor is boring."

It is a **body/private-evidence/control seam mismatch**.

Do not fix by adding a UI "stuck" label. The actor must first have a lawful body/contact signal if such contact is intended to matter.

---

# 3. Frozen intervention-abuse run

Exact metrics:

```json
{
  "ticks": 12010,
  "maxAbsCoord": 6.850930213928223,
  "maxSpeed": 5.606989675939207,
  "finalMode": "CHECK",
  "finalMemoryEnabled": true,
  "finalSensorEnabled": true,
  "finalActorEnabled": true,
  "finalSweeperEnabled": true,
  "finalOccluderEnabled": true,
  "finalLoose": 2,
  "capRejected": true,
  "motorCutActorMotion": 0.008109887073797752,
  "motorCutSweeperMotion": 0,
  "sweeperOffMotion": 0.0000457763671875,
  "sweeperOnMotion": 0.000036716461181640625,
  "memoryClearedObserved": true,
  "sensorGateEmptyObserved": true,
  "continuedAfterRestore": true,
  "internalEventCount": 137
}
```

## PASS-like engineering observations inside the failed campaign

These narrow mechanics behaved as expected:
- no NaN / Infinity / catastrophic coordinate escape;
- loose-body capacity rejected the ninth body;
- memory disable cleared private last-seen;
- P0 gate produced empty current P0;
- motor-authority cut left actor near-stationary: displacement `0.0081`;
- all channels could be restored;
- the system continued stepping after restoration;
- event storage stayed within its bound.

These facts do **not** promote the campaign to PASS.

## FAIL B — "World keeps running" did not imply the advertised process remained active

During the 180-tick motor-authority cut:
- actor motion: `0.0081`;
- sweeper motion: **0**.

During explicit sweeper OFF window:
- displacement ≈ `0.0000458`.

After sweeper re-enable:
- displacement ≈ `0.0000367`.

The sweeper was already mechanically stranded. Toggling its force no longer restored the intended process.

Thus the current public demo can truthfully say the physics World continues to step, but **cannot currently use the sweeper as evidence of a healthy independent continuing material process**.

---

# 4. Determinism / execution validity

Both test bodies ran far enough to emit complete deterministic metrics.

The CI failed only at precommitted scientific/engineering assertions:
- sweeper reversals > 10: observed 0;
- sweeper movement while actor control cut > 0.05: observed 0.

No implementation exception or test-infrastructure failure caused the verdict.

Classification:

> **EXECUTION VALID · ENGINEERING FAIL**

---

# 5. Immediate implications

## Medium truth correction required

Public surface currently overstates the sweeper.

Until repaired and re-soaked, treat it as:
- experimental/broken process donor;
- not a healthy independent ecology process.

## Substrate issue requires separate future run

The actor-target contact gap should be handled as a body/private-evidence question:
- define generic contact evidence independent of object semantics;
- decide whether target/sweeper contacts belong in that channel;
- then freeze a minimal test.

Do **not** simply append target to `actorContact()` inside this failed run.

## No Field v0.2 feature work yet

This result strengthens, not weakens, the multi-campaign decision.

Before save/fork or richer medium:
1. preserve current FAIL;
2. correct public wording;
3. design a minimal sweeper/process integrity run;
4. design a separate lawful generic-contact seam run;
5. re-evaluate whether current v0 is worth preserving as Habitat baseline or only as a failure donor.

---

# 6. Campaign outcome

**MEDIUM-B/R1: FAIL**

What survived:
- deterministic long execution;
- numerical stability under current tested bounds;
- several causal cuts;
- event-buffer integrity;
- intervention API stability.

What failed:
- independent-process liveness;
- actor/control awareness of a physically blocking target contact.

No fixes were applied.
