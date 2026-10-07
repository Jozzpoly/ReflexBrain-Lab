# MEDIUM-C/R2a — P0 Reconstructibility After Exact Physics Restore — RESULT — 2026-10-07

Status: **PASS · ARCHITECTURE PROBE CLOSED**

PR: #25
CI: `37660650252`
Job: `112927007053`

## Visible-moving case

Snapshot payload: **3162 bytes**

Pre-snapshot legal P0:

```json
{"bearing":0.21866892048598738,"range":1.9098716912824496,"radialMotion":0.3312134262898081,"apparentRadius":0.18325838410902898}
```

Immediate restore, **no physics step**:

exactly the same P0 blob.

One extra physics step before sensing:

```json
{"bearing":0.2186689137622771,"range":1.9126320269660366,"radialMotion":0.3257836969036377,"apparentRadius":0.18299390320008224}
```

Thus:
- immediate restored P0 equality: **true**;
- after-extra-step equality: **false**.

The negative control is important: a restore-time "query warm-up" step would silently advance causal time and change legal private evidence.

## Hidden-moving case

Snapshot payload: **3162 bytes**

- target remains within P02a range at restored moment: ~4.688806;
- pre-snapshot P0: empty;
- immediate restored P0: empty;
- exact equality: **true**.

No warm-up step required for restored scene queries.

## Defended claim

> For current P02a, the current legal P0 frame is exactly reconstructible from an exact restored physics moment plus the unchanged sensor configuration, without serializing the frame and without advancing simulation time.

## MEDIUM-C consequence

For a future snapshot envelope, `currentFrame` can currently be treated as **derived state**, not authoritative causal state, provided:
- physics snapshot is exact;
- actor/target bindings are restored;
- P02a sensor configuration/version is identical;
- frame is recomputed immediately at the same causal boundary;
- no hidden warm-up step is inserted.

This reduces duplicated truth in save/fork state.

## Important limits

This does NOT establish:
- reconstructibility of future richer sensors;
- reconstructibility of private memory/history;
- generic candidate discovery;
- Field Lab persistence;
- cross-version compatibility;
- contact/proprioception reconstruction.

P02a still has the known host-supplied candidate-list boundary.

Future sensors must earn their own reconstructibility or explicitly serialize temporal state.

## Next continuity pressure

The next higher-value boundary is dynamic binding / process-private state, not another P0 variant.

Field v0 still has MEDIUM-B/R1 failures; do not build Owner-facing save/load yet.
