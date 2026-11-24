// kernel/harness.mjs — lekki runner kampanii wieloseedowych, bramka pre-fork przeciw N9
// oraz dwuwarstwowy test Rozjazd Pamieci + Zbieznosc po Zaburzeniu (Perturbed Re-convergence).
// Zero zewnetrznych zaleznosci, czysty ESM.

import { PERCEPTION_MODES, normalizeExposureMetrics } from './seam.mjs';
import { INTERVENTION_LAYERS, createLabSession } from './fork-microscope.mjs';

function mean(arr) {
  return arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : 0;
}

function std(arr) {
  if (arr.length < 2) return 0;
  const m = mean(arr);
  return Math.sqrt(arr.reduce((s, x) => s + (x - m) * (x - m), 0) / (arr.length - 1));
}

// Bramka pre-fork przeciw N9 (R13: fork po sztywnym t=30s poza scena -> 0 kontaktow!):
// Symuluje do momentu spelnienia `forkPredicate(world, branch)` w oknie [minTick, maxWaitTicks].
export function advanceUntilForkOpportunity(session, { minTick = 1, maxWaitTicks = 600, forkPredicate, stepOptions = {} }) {
  for (let t = 0; t < maxWaitTicks; t++) {
    session.stepBranch(session.main, null, stepOptions);
    if (session.main.tick >= minTick && (!forkPredicate || forkPredicate(session.main.world, session.main))) {
      return { found: true, tick: session.main.tick, mark: session.mark(session.main, `opp@${session.main.tick}`) };
    }
  }
  return { found: false, tick: session.main.tick, mark: null };
}

// Dwuwarstwowy bezpiecznik przeciw iluzji efektu motyla (bilard udajacy prywatne znaczenie):
//   1. Memory Cut Divergence: rozne pamieci (A vs B po PRIVATE_RESEARCH_CUT) musza dac rozjazd zachowania.
//   2. Perturbed Re-convergence: TA SAMA pamiec + drobne fizyczne wytracenie (MATERIAL) -> czy oba blizniaki
//      aktywnie wracaja do tej samej rozpoczetej sprawy (mierzone przez `outcomeDistance(worldA, worldB)`)?
export function runDivergenceAndReconvergence({
  createWorld,
  createMind,
  seed = 1,
  perceptionMode = PERCEPTION_MODES.RAW,
  minTick = 60,
  maxWaitTicks = 400,
  forkPredicate = null,
  evalTicks = 120,
  actorId = 'actor-0',
  perturbPhysical, // ({ world }) => void (delikatne wytracenie ciala w MATERIAL)
  outcomeDistance, // (worldA, worldB) => number (im mniejsza, tym silniejsza zbieznosc do tej samej sprawy)
}) {
  const session = createLabSession({ createWorld, createMind, seed, perceptionMode, strictSeam: true });
  const opp = advanceUntilForkOpportunity(session, {
    minTick,
    maxWaitTicks,
    forkPredicate,
    stepOptions: { recordTrace: false, auditSeam: true, captureLastStep: false },
  });
  if (!opp.found) {
    return { seed, opportunityFound: false, markTick: opp.tick };
  }

  // 1. Test Rozjazdu przy innej pamieci (PRIVATE_RESEARCH_CUT)
  const [cutA, cutB] = session.fork(opp.mark, ['A (intact)', 'B (cut)']);
  session.intervene(cutB, {
    layer: INTERVENTION_LAYERS.PRIVATE_RESEARCH_CUT,
    description: 'harness memory cut',
    apply: ({ resetMind }) => resetMind(actorId),
  });
  const cutDiv = session.runSync(cutA, cutB, evalTicks, { captureLastStep: false });
  const cutDistance = outcomeDistance ? outcomeDistance(cutA.world, cutB.world) : null;

  // 2. Test Zbieznosci po zaburzeniu fizycznym przy TEJ SAMEJ pamieci (MATERIAL)
  const [pertA, pertB] = session.fork(opp.mark, ['A (intact)', 'B (perturbed-same-memory)']);
  if (typeof perturbPhysical === 'function') {
    session.intervene(pertB, {
      layer: INTERVENTION_LAYERS.MATERIAL,
      description: 'harness physical perturbation',
      apply: perturbPhysical,
    });
  }
  const pertDiv = session.runSync(pertA, pertB, evalTicks, { captureLastStep: false });
  const reconvergenceDistance = outcomeDistance ? outcomeDistance(pertA.world, pertB.world) : null;

  return {
    seed,
    opportunityFound: true,
    markTick: opp.tick,
    memoryCut: {
      diverged: cutDiv.diverged,
      earliest: cutDiv.earliest,
      outcomeDistance: cutDistance,
    },
    perturbedReconvergence: {
      diverged: pertDiv.diverged,
      earliest: pertDiv.earliest,
      outcomeDistance: reconvergenceDistance,
      // Dodatni stosunek > 1 oznacza: inna pamiec rozjezdza wynik mocniej niz drobne wytracenie fizyczne!
      attractorRatio:
        cutDistance !== null && reconvergenceDistance !== null
          ? cutDistance / Math.max(1e-6, reconvergenceDistance)
          : null,
    },
  };
}

// Wieloseedowy runner kampanii wymuszajacy rozdzial devSeeds vs heldOutSeeds,
// sparowane porownanie z kontrolami i uczciwe metryki per1kAliveTicks / per100Exposures (lekcja N12).
export function runCampaign({
  name = 'campaign',
  createWorld,
  controllers, // { [controllerName]: (actorId, seed) => mind }
  primaryController,
  devSeeds = [],
  heldOutSeeds = [],
  ticks = 600,
  perceptionMode = PERCEPTION_MODES.RAW,
  extractRecords, // (world, branch) => [{ aliveTicks, exposures, events: { ... } }]
  scoreMetric, // (normalizedMetrics, world, branch) => number
  auditFirstTicks = 15,
}) {
  const overlap = devSeeds.filter((s) => heldOutSeeds.includes(s));
  if (overlap.length > 0) {
    throw new Error(`Campaign '${name}': devSeeds i heldOutSeeds nie moga sie pokrywac (overlap=${overlap.join(',')})!`);
  }
  if (!controllers || !controllers[primaryController]) {
    throw new Error(`Campaign '${name}': brak glownego kontrolera '${primaryController}'.`);
  }

  function runSplit(splitName, seeds) {
    const byController = {};
    for (const ctrlName of Object.keys(controllers)) {
      const rows = [];
      for (const seed of seeds) {
        const session = createLabSession({
          createWorld,
          createMind: controllers[ctrlName],
          seed,
          perceptionMode,
          strictSeam: true,
        });
        for (let t = 0; t < ticks; t++) {
          const doAudit = t < auditFirstTicks || t === ticks - 1;
          session.stepBranch(session.main, null, {
            recordTrace: false,
            auditSeam: doAudit,
            captureLastStep: false,
          });
        }
        const recs = extractRecords ? extractRecords(session.main.world, session.main) : [];
        const metrics = normalizeExposureMetrics(recs);
        const score = scoreMetric ? scoreMetric(metrics, session.main.world, session.main) : 0;
        rows.push({ seed, score, metrics });
      }
      byController[ctrlName] = {
        rows,
        meanScore: mean(rows.map((r) => r.score)),
        stdScore: std(rows.map((r) => r.score)),
      };
    }

    const pairedVsPrimary = {};
    const pRows = byController[primaryController].rows;
    for (const ctrlName of Object.keys(controllers)) {
      if (ctrlName === primaryController) continue;
      const cRows = byController[ctrlName].rows;
      let wins = 0;
      let ties = 0;
      const deltas = [];
      for (let i = 0; i < pRows.length; i++) {
        const d = pRows[i].score - cRows[i].score;
        deltas.push(d);
        if (d > 1e-9) wins++;
        else if (Math.abs(d) <= 1e-9) ties++;
      }
      pairedVsPrimary[ctrlName] = {
        wins,
        ties,
        losses: pRows.length - wins - ties,
        total: pRows.length,
        meanDelta: mean(deltas),
      };
    }

    return { splitName, seeds: seeds.slice(), byController, pairedVsPrimary };
  }

  return {
    name,
    primaryController,
    perceptionMode,
    ticks,
    dev: runSplit('dev', devSeeds),
    heldOut: runSplit('heldOut', heldOutSeeds),
  };
}
