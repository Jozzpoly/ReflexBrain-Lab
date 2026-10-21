# LIFE/L1 Durable Continuity — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make a single real physical ReflexBrain resident survive a *process restart* through a portable, validated checkpoint, retain its private history, and accumulate explicitly measured simulated life time without silently inventing elapsed experience or building a new brain.

**Architecture:** Choose the existing executable `DevRuntime` as the only donor; preserve its World/private sensory/controller semantics unchanged. A narrow portable checkpoint codec and Node headless runner save/load full physical + actor state, with exact replay validation and modest actual-time/compute measurement. No background-host service, new physical ecology or learning model in L1.

**Tech Stack:** Current repo TypeScript ES2022, 120 Hz Rapier 2D deterministic compat v0.20.0, 30 Hz cached PrivateFrame, Vite 8.2.2, Vitest 5.0.0, Node 22 (already in existing GitHub CI). No new runtime dependencies without a separately justified tradeoff.

**Spec:** `docs/superpowers/specs/2026-10-21-long-lived-organism-research-design.md` (on *different* canonical-research branch `research/pre-o0-foundations-campaign`; **read first**, not a file assumed to be in the executable working tree). Exact implementation donor [draft PR #81](https://github.com/Jozzpoly/ReflexBrain-Lab/pull/81) `research/rb-odev-first-resident-2026-10-21` HEAD **`010531a0d5996ad70bba25a8b60b8324ec1c77cb`** at plan freeze. Retain all #80/81 qualified source evidence; do not merge the separate Pre-O0 doc branch to get this plan.

## Global Constraints

- Use a **new isolated draft branch from the specified runnable SHA**, with draft PR *base #81*; `main`, existing Owner demos and PR #82/#83 unchanged. Confirm source SHA again before first implementation commit; if changed, compare and correct references.
- Do **not** modify `DevResident` choice/scoring algorithm, `LivingWorld.step`, inherited asset/viewer, physics timestep, sensing cadence or old checkpoint version 3 to make the new feature pass. L1 is continuity infrastructure, not developmental competence.
- One real organism, full private memory + World physics + sensory cache + independent mover + RNG + exact tick; avoid privileged host information entering actor decisions.
- `resume` means process-discontinuous **but simulated time continuous only when the runner actually executes ticks**. A 24-hour wall-clock pause adds zero lived hours. Wall-clock dates belong to researcher metadata, not actor sensory inputs.
- Test exact replay across separate OS processes at matched tick and compare **full** physical snapshot, legal private frame and actor state, not just x/y. Fail loudly on mismatched body, scene, controller policy, version or corrupted data.
- Volatile current in-tab `Zapisz chwilę` remains a *different* feature; do not silently claim browser persistence or cross-version save migration.
- No always-on cloud worker, LOD subsystem, GPU training, hunger/fatigue needs, life-score, automatic multi-day CI run, simulation-step shortcut, hidden world reward labels or public rollout.
- Stop/repair at any RED safety mismatch. Keep old `#81` unmodified for side-by-side baseline and Owner qualitative comparisons later.

## Review Focus

1. **Partial/invalid save file or interrupted write** must never be accepted as live state or overwrite an existing valid checkpoint. Test atomic commit, bad checksum, truncation, destination-exists behavior and restoration from the still-valid previous file in Task 3.
2. **Typed-array identity and numerical exactness** (`Uint8Array` Rapier snapshot; `Float32Array` cached 288-retina / 8-touch / pendingTouch) can be destroyed by naïve JSON. Test exact byte-for-byte arrays and strict finite/length validation in Task 2.
3. **Inconsistent resident after restore** (wrong B0/B1, layout, policy, action phase, PRNG, cached frame, mover body) must throw without silently coercing types or selecting a different identity; prove a restored continuation matches uninterrupted world/actor in Task 4.
4. **Wall-clock outage ≠ simulated history**. Test unchanged `physicsTicks` and no synthetic learning events across an arbitrarily long gap between file writes in Task 4; logged `recordedAt` remains host-only.
5. **Long-running headless load** may leak memory, stall or produce enormous files and logs. Instrument wall duration, CPU estimate, heap/RSS, save size, snapshot cost and 30Hz private sample rate in Task 5, and stop before pretending 24h is viable.

---

## Scope split / source-layout audit

**Reused verbatim:** `src/living-organism/world.ts` (`Checkpoint` v3); `dev-runtime.ts` (`DevRuntime.capture()/restore()` and `DevCheckpoint` v1); `dev-resident.ts` (`DevState` v1, `decide(PrivateFrame)`). `E0_DT=1/120` in `src/e0-body-seam.ts`; `initLivingWorld()` is prerequisite.

**Files created only on future executable L1 draft branch:**

- `src/living-organism/life-l1-codec.ts` — browser/Node-compatible **pure** `DevCheckpoint` ↔ JSON payload converter, schema 1, full typed arrays, no Node libraries. Type-guard and length/finite input checks.
- `tests/living-organism/life-l1-codec.test.ts` — actual Rapier checkpoint serialization, wrong-format/type/length tests.
- `scripts/life-l1-runner.mjs` — Node 22 CLI using current Vite SSR source loader, disk IO and atomic manifest/checkpoint writes, single World process, no integration with browser tab.
- `tests/living-organism/life-l1-cross-process.test.ts` — spawn separate CLI processes to create and resume, compare with uninterrupted matched control; live Rapier private history.
- `tests/living-organism/life-l1-cost.test.ts` or `scripts/life-l1-benchmark.mjs` — bounded CPU/heap/snapshot-size probe (CI-short default), full 10–30min sim only outside ordinary CI after measured feasibility.
- `docs/competence-runs/RB-LIFE-L1_ARMED_2026-10-21.md` — *before-running* pinned negative controls and exact source/CI evidence. Later add `RB-LIFE-L1_RESULT...` only after source execution. Do not create another canonical control-room document.

**Files modified:** `package.json` only if a new **L1-specific** script is necessary; `.github/workflows/check.yml` only for a branch-restricted checkpoint/restart job if ordinary `vitest run` cannot reliably exercise it. Do not modify `dev-field.ts` or `world.ts` merely to add a disk writer.

### Task 1 — Feasibility of clean Node headless execution (first independent gate)

**Files:**
- Create: `scripts/life-l1-runner.mjs` (start small, expand only in later tasks).
- Test: `tests/living-organism/life-l1-cross-process.test.ts` initially only a smoke process test.
- Reference: `src/living-organism/world.ts` / `src/living-organism/dev-runtime.ts`, don't edit.

**Interfaces:**
- Node CLI entry `node scripts/life-l1-runner.mjs smoke` exits 0 only if it initializes real Rapier and runs 480 true physics ticks under `DevRuntime('adaptive','B1','yard',1183)`, reads legal `world.observe()` and reports tick 480. No static mocked fixture.
- Dynamic source load: `import {createServer} from 'vite'`, create Vite in middleware / no HTTP listening, then `server.ssrLoadModule('/src/living-organism/dev-runtime.ts')` and `.../world.ts`; call `initLivingWorld()`; ensure server and World free/close in `finally`. Treat this exact loading approach as a *feasibility hypothesis* to verify, NOT assumed to work with Rapier wasm in Node.

- [ ] **Step 1: Write native RED test** spawning Node 22 smoke subprocess; assert zero exit, exact tick and clean teardown.
- [ ] **Step 2: Verify RED** with `yarn vitest run tests/living-organism/life-l1-cross-process.test.ts` (fails because runner does not yet exist).
- [ ] **Step 3: Write minimal smoke runner** using current Vite SSR; no file saving yet. If Rapier WASM or SSR import fails, stop and capture diagnosis; do not add `tsx`, Babel, custom bundler or other dependencies without comparing `vite build --ssr` and existing available Node capabilities.
- [ ] **Step 4: Verify GREEN** with exact smoke test and `yarn run check`; record wall runtime and module initialization overhead.
- [ ] **Step 5: Commit** separate small reviewable smoke result (no save-file promises).

### Task 2 — Portable, exact, versioned actor+World snapshot representation

**Files:**
- Create: `src/living-organism/life-l1-codec.ts`.
- Test: `tests/living-organism/life-l1-codec.test.ts`.

**Interfaces:**
- `export type LifeL1Payload = { format:'reflexbrain-life-l1'; schemaVersion:1; checkpoint:DevCheckpoint; simHz:120; sensorHz:30 }`.
- `export function encodeLifeL1(cp:DevCheckpoint):string`.
- `export function decodeLifeL1(source:string):DevCheckpoint`.
- Encoding must be **JSON text with explicitly mapped numeric arrays** for `cp.world.physics:Uint8Array`, `cp.world.frame.retina:Float32Array`, `cp.world.frame.touch:Float32Array`, `cp.world.pendingTouch:Float32Array`. No blind `JSON.stringify(typedArray)` conversion. The plain arrays in serialized form must decode to typed arrays before `DevRuntime.restore`. All remaining fields (surfaces, pendingContactEvents, contactSample, mover, gateLink, body metadata, seed, action episode, learned stats) preserved and validated.
- Validation: strict `format`/`schemaVersion`, `world.version=3`, `resident.version=1`, valid B0/B1/layout/mode, consistent `world.bodyShape`, integer `tick`, `world.frame.tick <= world.tick` (30Hz cadence), 288 RGB and 8 touch samples, finite values and valid `0..255` physics bytes; cap suspicious input length in caller (decide concrete cap from snapshot measurement, never silently clip).
- Codec is a **format for the current research source**, not an expensive promise of migration across future changed physical schema.

- [ ] **Step 1: RED** actual Rapier B1 checkpoint taken at tick 977 with nontrivial cached sensory frame and ongoing resident trial; encoded then decoded restored to second runtime; initially fails missing codec.
- [ ] **Step 2: RED corruption boundaries** malformed JSON; wrong schema; wrong body; physics missing/empty; `retina` length 287 instead of 288; NaN/Infinity or a corrupted byte; explicit test expects error not partial World restore.
- [ ] **Step 3: GREEN implement pure codec** with total, narrow validation and typed array reconstruction; avoid `any` leakage to actor-facing code.
- [ ] **Step 4: Verify** full `world.captureCheckpoint().physics` byte equality, cached `world.observe()`, private `resident.capture()` exact equality; node `yarn vitest run tests/living-organism/life-l1-codec.test.ts`.
- [ ] **Step 5: Commit** independently reviewable codec.

### Task 3 — Durable identity, atomic file save, and restart

**Files:** modify `scripts/life-l1-runner.mjs`; expand `tests/living-organism/life-l1-cross-process.test.ts`.

**Interfaces:**
- `node scripts/life-l1-runner.mjs new --ticks 1200 --output /abs/unique.json --shape B1 --layout yard --mode adaptive`.
- `node scripts/life-l1-runner.mjs resume --input /abs/existing.json --ticks 800 --output /abs/next-unique.json`.
- No invisible time catch-up. A successful CLI writes a versioned envelope with `lifeId` (created once by `crypto.randomUUID()` and retained on resume), `createdAt` / `recordedAt` human-readable host timestamps, `physicsTicks`, `simulatedSeconds = physicsTicks/120`, `donorSha` qualified source identifier, and `checkpoint` codec payload. Envelope `sha256` computed over a documented deterministic inner body; corrupted/truncated/wrong-digest file rejected before any `World.restore()` mutations.
- Atomic write to temp filename in same directory, complete write and close, then `rename` to a **previously non-existent explicitly requested destination** (must not overwrite existing destination; use safe exclusive-create/reservation rather than `rename` clobbering across platforms); old source file untouched. After failure best effort remove temp; do not claim disk durability across power loss without file/directory fsync proof.
- Every resume validates `shape/mode/layout` inside checkpoint and life manifest against the runnable class, rejects unknown version/donor mismatches rather than transplanting geometry, and keeps private 30Hz sensory timing.
- `--ticks` means EXACT count of `world.step()`, positive safe integer, bounded per process initially; no interpretation as wall-clock seconds. Real wall elapsed is recorded separately for researcher. A CLI resume does not introduce synthetic experiences during downtime.

- [ ] **Step 1: RED** one CLI `new`, subprocess exit, check real output exists and `physicsTicks=1200`, then second *new OS process* `resume` produces 2000 ticks, same `lifeId` and private history counters carried forward.
- [ ] **Step 2: RED safety** bad digest/truncated file, output already exists, wrong shape/layout/policy, stale/mismatching code donor, negative/NaN/huge ticks: fail loudly; previous checkpoint unmodified.
- [ ] **Step 3: GREEN** implement minimal CLI parsing, Vite source load from Task 1, pure codec from Task 2, Node `fs/promises` atomic writer and `crypto` digests. No job scheduler or global storage layer.
- [ ] **Step 4: Verify** invoke subprocess tests with `yarn vitest run tests/living-organism/life-l1-cross-process.test.ts`; manually inspect compact manifest and save path; no permanent files from tests (use `mkdtemp` under OS tmp).
- [ ] **Step 5: Commit** only I/O and tests.

### Task 4 — Closed-loop deterministic continuation, not merely successful deserialize

**Files:** `tests/living-organism/life-l1-cross-process.test.ts` (same CLI); optional minimal runner `compare` mode only if needed.

**Interfaces:** a matched uninterrupted reference runs N+M physics ticks with fixed initial source/morphology/layout/seed, while split candidate runs N ticks in process A, saves, terminates, then resumes M ticks in process B. Compare exact JSON-encoded `DevCheckpoint` payloads (including full original binary physics as byte arrays, complete 288 RGB and 8 touch floats, pending events, actor-private last action and learned statistics, RNG). Host `recordedAt` may differ; compare only complete causal state and tick.

- [ ] **Step 1: RED comparison** invoke reference and split in independent processes, initially demonstrate drift if the runner resets learned data, truncates Float32 types or injects wall-clock catch-up.
- [ ] **Step 2: GREEN** make full reference vs split evidence match at tick N+M (e.g. N=977, M=1440) for **B0 and B1** and **yard and shifted**; no reinitialization of independent rail state or cached retina.
- [ ] **Step 3: Test downtime** create save, wait a short real wall interval (or patch only host `recordedAt` without invalidating checksum after re-sign) and resume 0 or fixed M ticks. Assert unchanged simulated-life elapsed at restore and strictly additive M/120 only afterwards.
- [ ] **Step 4: Test contamination** manual authority is not silently learned or changed; L1 runner is AUTO-only by design. Reject an envelope that claims unsupported manual-control state, rather than invisibly convert it.
- [ ] **Step 5: Verify** all native suite `yarn run check`, record exact SHA, CI run/negative outcome and commit.

### Task 5 — Measure actual time budget and data growth before claiming long-term life

**Files:** `scripts/life-l1-runner.mjs` (small observer counters), optional `scripts/life-l1-benchmark.mjs`, scoped measured result doc.

**Interfaces:** host-only fields (no actor access) `wallRunMs`, `executedPhysicsTicks`, `nominalSimSeconds`, `physicsStepsPerWallSecond`, `peakRssBytes` or documented sampled RSS, `checkpointBytes`, `saveMs`, `restoreMs`, `retinalFramesDelivered`; avoid claiming exact CPU usage if only wall time measured. Limit logging to periodic, sparse checkpoints and summary; no per-tick full RGB logs.

- [ ] **Step 1: RED** test benchmark summary values exist, finite, conservation of `physicsTicks`, expected 30Hz sampled-frame count to within initial-frame conventions.
- [ ] **Step 2: GREEN** measure real run (first a short ~60s simulated baseline) without altering the 120Hz/30Hz mechanics. If fast and memory stable, separately try 10–30 simulated minutes. Do **not** schedule 24h on a shared CI runner as a guess.
- [ ] **Step 3: Test bounded memory/save growth** compare checkpoint size after short and longer runs, verify no episode history leak from full-frame logs; if memory grows unbounded, fail qualification and isolate reason.
- [ ] **Step 4: Verify native tests, independent process exits and actual artifacts**, record throughput and honest projections for 1h, 6h, 24h with confidence limits, not a claim they ran.
- [ ] **Step 5: Commit** measurement only after it is real.

### Task 6 — Research qualification and recovery

**Files:** create `docs/competence-runs/RB-LIFE-L1_RESULT_2026-10-21.md` on L1 execution branch, update its draft PR description. Update canonical [`Competence Control Room`](https://github.com/Jozzpoly/ReflexBrain-Lab/blob/research/pre-o0-foundations-campaign/docs/REFLEXBRAIN_COMPETENCE_CONTROL_ROOM_2026-10-10.md) **only as a separate documentation-only change on its own branch**, once actual evidence is verified.

- [ ] **Step 1:** record exact parent/execution SHA, CI or externally measured command, process-boundary A/B hashes, codec identity, sim-time vs downtime, real CPU/memory/save bytes.
- [ ] **Step 2:** detail negative runs/failures, limits of determinism, inability to keep living after process stops, in-tab/browser status, unsupported upgrade/migrations.
- [ ] **Step 3:** qualify precisely: *durable restartable research specimen* **if and only if** process-split causal equivalence and safe file IO PASS. Never call L1 an improved organism or proof of days-long evolution.
- [ ] **Step 4:** first Owner-visible checkpoint is a modest CLI headless specimen with an externally loadable file. Visual replay or always-on host is a **separate reviewed** slice; no promise that existing browser UI can load this envelope until that link is actually built.
- [ ] **Step 5:** review PR branch diff/test evidence; leave draft isolated and next campaign L2 open for a *distinct* design review. Do not merge to `main` by inertia.

## Experiment / natural checkpoints

**Checkpoint A:** real Node headless loader works or failed for a documented real reason. No new brain claims.
**Checkpoint B:** full portable snapshot exact, wrong/corrupt data rejected. No simulated continuity claim yet.
**Checkpoint C:** clean OS-process restart reproduces matched physics + private history; previous safe checkpoint never clobbered.
**Checkpoint D:** quantitative runtime/size budget + first bounded simulated-life duration. Longer hours/days only after showing cost and meaningful material processes.
**Checkpoint E:** research report + Owner review of the **next living mechanism** (world/activity coupling), not an automatic scheduler that continues implementing L2–L6.

**Stop / course correction:** if the simple Vite Node SSR path fails, don't buy dependencies or redesign the frontend to compensate without new evidence; if full-state replay fails, pause before long runs; if 10min still is a useless motor loop, this is evidence against V0 behavior, NOT proof the checkpoint feature is broken. As soon as L1 has earned engineering qualification, switch effort toward long-lived causal relations and activity, not platform polish.

## Plan self-review status
- Scoped **only** to L1 from the long-ontogeny program; L2–L6 intentionally remain research campaigns, not hidden implementation tasks.
- Actor-facing `DevResident.decide(frame)` stays untouched; Node host alone handles real file paths, timestamps, restoration and physical inspection.
- Codec interface and CLI signatures consistent across tasks; tests cover all five Review Focus failure classes.
- Source test fixtures and performance results must remain independent of any preferred 'life' narrative. User/Owner review remains explicit before executing this written implementation plan.
