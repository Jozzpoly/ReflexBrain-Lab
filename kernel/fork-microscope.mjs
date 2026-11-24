// kernel/fork-microscope.mjs — realizacja gramatyki MEDIUM-D/R0:
// WATCH -> MARK -> FORK -> INTERVENE(warstwa) -> RELEASE -> RUN -> COMPARE (trwala Drabina Pierwszego Rozjazdu).
// Czysty ESM (Node >= 20 i przegladarka), zero zaleznosci.

import { PERCEPTION_MODES, deepClone, shallowCopyAction, sealObservation, stableDigest } from './seam.mjs';

export const INTERVENTION_LAYERS = Object.freeze({
  MATERIAL: 'MATERIAL',
  MOTOR_AUTHORITY: 'MOTOR_AUTHORITY',
  PRIVATE_RESEARCH_CUT: 'PRIVATE_RESEARCH_CUT',
  WORLD_REPLACEMENT: 'WORLD_REPLACEMENT',
  OCCUPANT_REPLACEMENT: 'OCCUPANT_REPLACEMENT',
});

const VALID_LAYERS = new Set(Object.values(INTERVENTION_LAYERS));

function makeBranch({ label, world, worldFactory, minds, mindFactories, defaultMindFactory, perceptionMode, strictSeam, startTick, forkSeed }) {
  return {
    label,
    world,
    worldFactory,
    minds,
    mindFactories,
    defaultMindFactory,
    perceptionMode,
    strictSeam,
    forkSeed,
    tick: startTick || 0,
    provenance: [],
    trace: [],
    traceTruncated: false,
    lastStep: null, // O(1) bezpieczna migawka ostatniego kroku dla podgladu Oko/Wnetrze (bez wywolywania observe w renderze!)
    motorOverrides: new Map(), // actorId -> fn(obs, defaultAction) | actionObj
  };
}

// Trwaly rejestrator Pierwszego Rozjazdu o pamieci O(1): nigdy nie traci najwczesniejszego ticku,
// nawet gdy bieg trwa tysiace tickow i okno trace zostanie przyciete.
export function createDivergenceTracker(startTick = 0) {
  const firstByLayer = {
    observation: null,
    privateState: null,
    action: null,
    worldAfterstate: null,
  };
  let earliest = null;
  let comparedTicks = 0;

  function recordPair(frameA, frameB) {
    if (!frameA || !frameB || frameA.tick !== frameB.tick) return;
    comparedTicks += 1;
    const checks = [
      ['observation', frameA.obsDigest !== frameB.obsDigest],
      ['privateState', frameA.privateDigest !== frameB.privateDigest],
      ['action', frameA.actionDigest !== frameB.actionDigest],
      ['worldAfterstate', frameA.worldDigest !== frameB.worldDigest],
    ];
    for (const [layer, diff] of checks) {
      if (diff && firstByLayer[layer] === null) {
        firstByLayer[layer] = frameA.tick;
        if (!earliest) earliest = { tick: frameA.tick, layer };
      }
    }
  }

  function summary(branchA = null, branchB = null) {
    return {
      startTick,
      comparedTicks,
      diverged: earliest !== null,
      earliest: earliest ? { ...earliest } : null,
      firstByLayer: { ...firstByLayer },
      interventionsA: branchA ? branchA.provenance.slice() : [],
      interventionsB: branchB ? branchB.provenance.slice() : [],
    };
  }

  return { recordPair, summary };
}

export function createLabSession({
  createWorld,
  createMind,
  seed = 1,
  perceptionMode = PERCEPTION_MODES.RAW,
  strictSeam = true,
  extraAllowedObsKeys = [],
}) {
  const world = createWorld(seed);
  const actorIds = world.getActorIds ? world.getActorIds() : ['actor-0'];
  const minds = new Map();
  const mindFactories = new Map();
  for (let i = 0; i < actorIds.length; i++) {
    const id = actorIds[i];
    minds.set(id, createMind(id, seed * 31 + i));
    mindFactories.set(id, createMind);
  }

  const main = makeBranch({
    label: 'A (oryginal)',
    world,
    worldFactory: createWorld,
    minds,
    mindFactories,
    defaultMindFactory: createMind,
    perceptionMode,
    strictSeam,
    startTick: 0,
    forkSeed: seed,
  });

  function syncDynamicActors(branch) {
    const ids = branch.world.getActorIds ? branch.world.getActorIds() : [...branch.minds.keys()];
    // Szybka sciezka bez alokacji Set, gdy liczba i kolejnosc aktorow sie nie zmienila (wieloseedowe rollouty!)
    if (ids.length === branch.minds.size) {
      let same = true;
      for (let i = 0; i < ids.length; i++) {
        if (!branch.minds.has(ids[i])) { same = false; break; }
      }
      if (same) return ids;
    }

    const activeSet = new Set(ids);
    for (let i = 0; i < ids.length; i++) {
      const id = ids[i];
      if (!branch.minds.has(id)) {
        const factory = branch.mindFactories.get(id) || branch.defaultMindFactory;
        const actorSeed = ((branch.forkSeed * 31 + branch.tick * 13 + i) >>> 0);
        branch.minds.set(id, factory(id, actorSeed));
        branch.mindFactories.set(id, factory);
      }
    }
    for (const existingId of [...branch.minds.keys()]) {
      if (!activeSet.has(existingId)) {
        branch.minds.delete(existingId);
        branch.mindFactories.delete(existingId);
        branch.motorOverrides.delete(existingId);
      }
    }
    return ids;
  }

  function stepBranch(branch, externalInput = null, options = {}) {
    const maxTrace = options.maxTrace ?? 600;
    const recordTrace = options.recordTrace !== false;
    const auditSeam = options.auditSeam !== false;
    const captureLastStep = options.captureLastStep !== false;

    const ids = syncDynamicActors(branch);
    const obsByActor = recordTrace ? {} : null;
    const mindDigestByActor = recordTrace ? {} : null;
    const appraisalByActor = recordTrace ? {} : null;
    const predictionByActor = recordTrace ? {} : null;
    const actionDigests = recordTrace ? {} : null;
    const actionsForWorld = {};
    const stepSnapshotByActor = captureLastStep ? {} : null;

    for (let i = 0; i < ids.length; i++) {
      const id = ids[i];
      const rawObs = branch.world.observe(id, branch.perceptionMode);
      const obs = auditSeam
        ? sealObservation(rawObs, {
            perceptionMode: branch.perceptionMode,
            strict: branch.strictSeam,
            extraAllowedKeys: extraAllowedObsKeys,
          })
        : rawObs;

      if (recordTrace) obsByActor[id] = stableDigest(obs);

      const mind = branch.minds.get(id);
      const out = mind ? mind.step(obs) : { action: {} };
      let action = out && out.action !== undefined ? out.action : out;
      const motorOverridden = branch.motorOverrides.has(id);

      // Jawne przejecie autorytetu motoru (MOTOR_AUTHORITY) — host wie, umysl nie dostaje etykiety
      if (motorOverridden) {
        const ov = branch.motorOverrides.get(id);
        action = typeof ov === 'function' ? ov(obs, action) : shallowCopyAction(ov);
      }

      // W szybkim trybie (auditSeam=false, recordTrace=false) unikamy ciezkiego structuredClone co tick
      const safeAction = auditSeam || recordTrace ? deepClone(action) : shallowCopyAction(action);
      actionsForWorld[id] = safeAction;

      if (captureLastStep) {
        stepSnapshotByActor[id] = {
          obs,
          appraisal: out && out.appraisal !== undefined ? out.appraisal : null,
          prediction: out && out.prediction !== undefined ? out.prediction : null,
          action: safeAction,
          motorOverridden,
        };
      }

      if (recordTrace) {
        actionDigests[id] = stableDigest(safeAction);
        appraisalByActor[id] = out && out.appraisal !== undefined ? stableDigest(out.appraisal) : null;
        predictionByActor[id] = out && out.prediction !== undefined ? stableDigest(out.prediction) : null;
        mindDigestByActor[id] = mind && mind.digest ? mind.digest() : stableDigest(mind ? mind.snapshot() : null);
      }
    }

    branch.world.step(actionsForWorld, externalInput);
    branch.tick += 1;

    if (captureLastStep) {
      branch.lastStep = { tick: branch.tick, byActor: stepSnapshotByActor };
    }

    if (!recordTrace) return { tick: branch.tick };

    const frame = {
      tick: branch.tick,
      obsDigest: stableDigest(obsByActor),
      privateDigest: stableDigest({ mindDigestByActor, appraisalByActor, predictionByActor }),
      actionDigest: stableDigest(actionDigests),
      worldDigest: branch.world.digest ? branch.world.digest() : stableDigest(branch.world.snapshot()),
    };
    branch.trace.push(frame);
    if (branch.trace.length > maxTrace) {
      branch.trace.shift();
      branch.traceTruncated = true;
    }
    return frame;
  }

  function mark(branch = main, label = 'mark') {
    const mindSnaps = {};
    const factoriesRef = new Map();
    for (const [id, m] of branch.minds.entries()) {
      mindSnaps[id] = deepClone(m.snapshot());
      factoriesRef.set(id, branch.mindFactories.get(id) || branch.defaultMindFactory);
    }
    return {
      label,
      tick: branch.tick,
      perceptionMode: branch.perceptionMode,
      worldSnap: deepClone(branch.world.snapshot()),
      worldFactory: branch.worldFactory,
      mindSnaps,
      mindFactories: factoriesRef,
      defaultMindFactory: branch.defaultMindFactory,
    };
  }

  function fork(capturedMark, labels = ['A (kontrola)', 'B (interwencja)']) {
    return labels.map((label) => {
      const wf = capturedMark.worldFactory || createWorld;
      const w = wf(seed);
      w.restore(deepClone(capturedMark.worldSnap));
      const ms = new Map();
      const mf = new Map();
      const ids = w.getActorIds ? w.getActorIds() : Object.keys(capturedMark.mindSnaps);
      for (let i = 0; i < ids.length; i++) {
        const id = ids[i];
        const factory = (capturedMark.mindFactories && capturedMark.mindFactories.get(id)) || capturedMark.defaultMindFactory || createMind;
        const m = factory(id, seed * 31 + i);
        if (capturedMark.mindSnaps[id] !== undefined) m.restore(deepClone(capturedMark.mindSnaps[id]));
        ms.set(id, m);
        mf.set(id, factory);
      }
      return makeBranch({
        label,
        world: w,
        worldFactory: wf,
        minds: ms,
        mindFactories: mf,
        defaultMindFactory: capturedMark.defaultMindFactory || createMind,
        perceptionMode: capturedMark.perceptionMode,
        strictSeam,
        startTick: capturedMark.tick,
        forkSeed: seed,
      });
    });
  }

  function intervene(branch, { layer, description = '', apply }) {
    if (!VALID_LAYERS.has(layer)) {
      throw new Error(`Unknown intervention layer: ${layer}. Allowed: ${[...VALID_LAYERS].join(', ')}`);
    }
    if (typeof apply === 'function') {
      apply({
        world: branch.world,
        minds: branch.minds,
        setMotorOverride: (actorId, fnOrAction) => branch.motorOverrides.set(actorId, fnOrAction),
        resetMind: (actorId) => {
          const m = branch.minds.get(actorId);
          if (m && typeof m.reset === 'function') m.reset();
        },
        replaceWorld: (newWorld, newWorldFactory = null) => {
          branch.world = newWorld;
          if (newWorldFactory) branch.worldFactory = newWorldFactory;
        },
        replaceMind: (actorId, newMind, newMindFactory = null) => {
          branch.minds.set(actorId, newMind);
          if (newMindFactory) branch.mindFactories.set(actorId, newMindFactory);
        },
      });
    }
    const event = { kind: 'INTERVENE', tick: branch.tick, layer, description };
    branch.provenance.push(event);
    return event;
  }

  function release(
    branch,
    { layer = INTERVENTION_LAYERS.MOTOR_AUTHORITY, description = 'zwolnienie autorytetu', actorId = null, apply = null } = {}
  ) {
    if (!VALID_LAYERS.has(layer)) throw new Error(`Unknown release layer: ${layer}`);
    if (layer === INTERVENTION_LAYERS.MOTOR_AUTHORITY) {
      if (actorId !== null) branch.motorOverrides.delete(actorId);
      else branch.motorOverrides.clear();
    }
    if (typeof apply === 'function') apply({ world: branch.world, minds: branch.minds });
    const event = { kind: 'RELEASE', tick: branch.tick, layer, description };
    branch.provenance.push(event);
    return event;
  }

  function runSync(branchA, branchB, steps, options = {}) {
    const tracker = options.tracker || createDivergenceTracker(branchA.tick);
    const inputA = options.inputA || null;
    const inputB = options.inputB || null;
    const sharedInput = options.sharedInput || null;

    for (let s = 0; s < steps; s++) {
      const aIn = typeof inputA === 'function' ? inputA(s, branchA) : sharedInput ? deepClone(sharedInput) : inputA;
      const bIn = typeof inputB === 'function' ? inputB(s, branchB) : sharedInput ? deepClone(sharedInput) : inputB;
      const fa = stepBranch(branchA, aIn, options);
      const fb = stepBranch(branchB, bIn, options);
      tracker.recordPair(fa, fb);
    }
    return tracker.summary(branchA, branchB);
  }

  return { main, stepBranch, mark, fork, intervene, release, runSync };
}

export function findFirstDivergence(branchA, branchB, tracker = null) {
  if (tracker) return tracker.summary(branchA, branchB);
  const byTickB = new Map(branchB.trace.map((f) => [f.tick, f]));
  const tmp = createDivergenceTracker(branchA.trace[0]?.tick ?? branchA.tick);
  for (const fa of branchA.trace) {
    const fb = byTickB.get(fa.tick);
    if (fb) tmp.recordPair(fa, fb);
  }
  return {
    ...tmp.summary(branchA, branchB),
    windowTruncated: Boolean(branchA.traceTruncated || branchB.traceTruncated),
  };
}

export function formatOwnerVerdictCard({
  probeId,
  verdict = 'OTWARTE',
  markTick = null,
  divergence = null,
  note = '',
  commitSha = null,
  publicUrl = null,
  controlsPassed = null,
}) {
  return {
    schema: 'reflexbrain-owner-verdict/v1',
    timestamp: new Date().toISOString(),
    probeId,
    verdict,
    markTick,
    commitSha,
    publicUrl,
    controlsPassed,
    firstDivergence: divergence && divergence.earliest ? divergence.earliest : null,
    firstByLayer: divergence ? divergence.firstByLayer : null,
    interventionsB: divergence ? divergence.interventionsB : [],
    note,
  };
}
