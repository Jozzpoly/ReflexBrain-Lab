import {
  rerunG5D0Config,
  runG5D0Variant,
  type G5D0Config,
  type G5D0PrivateRow,
  type G5D0Run,
} from './g5d0-independent-ecology-discovery';

export const G5A_CONFIG: G5D0Config = Object.freeze({
  targetY: 2.0,
  shuttleY: 2.3,
  shuttleStartX: 4.6,
  leftEndX: 0.8,
  rightEndX: 5.8,
});

export type G5AGate = {
  outcome: 'PASS' | 'FAIL' | 'INCONCLUSIVE';
  reasons: string[];
};

export type G5AResult = {
  deterministic: boolean;
  d0Parity: boolean;
  dynamicHistory: G5D0Run;
  staticHistory: G5D0Run;
  dynamicAblated: G5D0Run;
  firstPrivateDivergenceTick: number | null;
  firstMotorDivergenceTick: number | null;
  firstBodyOdomDivergenceTick: number | null;
  gate1: G5AGate;
  gate2: G5AGate;
};

function privateKey(row: G5D0PrivateRow): string {
  return JSON.stringify({
    frame: row.frame,
    state: row.state,
  });
}

function firstDifference(
  a: G5D0PrivateRow[],
  b: G5D0PrivateRow[],
  key: (row: G5D0PrivateRow) => unknown,
): number | null {
  const n = Math.min(a.length, b.length);
  for (let i = 0; i < n; i += 1) {
    if (JSON.stringify(key(a[i])) !== JSON.stringify(key(b[i]))) {
      return a[i].tick;
    }
  }
  return a.length === b.length ? null : n;
}

function evaluateGate1(args: {
  dynamicHistory: G5D0Run;
  staticHistory: G5D0Run;
  dynamicAblated: G5D0Run;
  firstPrivateDivergenceTick: number | null;
  deterministic: boolean;
  d0Parity: boolean;
}): G5AGate {
  const {
    dynamicHistory: d,
    staticHistory: s,
    dynamicAblated: a,
    firstPrivateDivergenceTick,
    deterministic,
    d0Parity,
  } = args;
  const reasons: string[] = [];

  if (!deterministic) reasons.push('nondeterministic G5A replay');
  if (!d0Parity) reasons.push('G5A dynamic/static drifted from frozen D0 candidate');

  if (d.initialBlobCount !== 1 || s.initialBlobCount !== 1 || a.initialBlobCount !== 1) {
    reasons.push('initial legal P0 is not exactly one blob in all variants');
  }

  if (d.firstLostTick === null || s.firstLostTick === null) {
    reasons.push('history variants do not produce actor-caused P0 loss');
  } else if (d.firstLostTick !== s.firstLostTick) {
    reasons.push('process changes history-variant P0-loss timing');
  }

  if (
    d.firstProcessTargetContactTick === null ||
    d.firstLostTick === null ||
    d.firstCheckTick === null ||
    d.firstProcessTargetContactTick <= d.firstLostTick ||
    d.firstProcessTargetContactTick >= d.firstCheckTick
  ) {
    reasons.push('dynamic process contact is not strictly between P0 loss and CHECK');
  }

  if (s.firstProcessTargetContactTick !== null) {
    reasons.push('static process unexpectedly contacts target');
  }

  if (
    d.targetDisplacementAtCheck === null ||
    d.targetDisplacementAtCheck <= 1e-6
  ) {
    reasons.push('dynamic target has no hidden displacement at CHECK');
  }

  if (
    s.targetDisplacementAtCheck === null ||
    s.targetDisplacementAtCheck > 1e-6
  ) {
    reasons.push('static target does not remain static at CHECK');
  }

  if (d.hiddenLeakTicks.length > 0 || s.hiddenLeakTicks.length > 0) {
    reasons.push('history variant leaks P0 before CHECK');
  }

  if (!d.targetStayedWithinRangeBeforeCheck || !s.targetStayedWithinRangeBeforeCheck) {
    reasons.push('target leaves legal sensor range before CHECK');
  }

  if (
    d.actorProcessContactTicks.length > 0 ||
    s.actorProcessContactTicks.length > 0 ||
    a.actorProcessContactTicks.length > 0
  ) {
    reasons.push('actor physically contacts ecology/process fixture');
  }

  if (
    d.firstCheckTick === null ||
    s.firstCheckTick === null ||
    d.firstCheckTick !== s.firstCheckTick
  ) {
    reasons.push('dynamic/static CHECK timing is not matched');
  }

  if (a.firstCheckTick !== null) {
    reasons.push('history-ablated dynamic actor unexpectedly CHECKs');
  }

  if (a.privateTrace.some((row) => row.state.lastSeen !== null)) {
    reasons.push('history-ablated variant contains private lastSeen');
  }

  const earliestFresh = Math.min(
    d.firstReobservedTick ?? Number.POSITIVE_INFINITY,
    s.firstReobservedTick ?? Number.POSITIVE_INFINITY,
  );

  if (firstPrivateDivergenceTick === null) {
    reasons.push('dynamic/static histories never lawfully diverge');
  } else if (firstPrivateDivergenceTick < earliestFresh) {
    reasons.push('dynamic/static private divergence precedes lawful fresh P0');
  }

  const outcome: G5AGate['outcome'] =
    !deterministic || !d0Parity
      ? 'INCONCLUSIVE'
      : reasons.length === 0
        ? 'PASS'
        : 'FAIL';

  return { outcome, reasons };
}

function evaluateGate2(args: {
  gate1: G5AGate;
  dynamicHistory: G5D0Run;
  staticHistory: G5D0Run;
  firstPrivateDivergenceTick: number | null;
  firstMotorDivergenceTick: number | null;
  firstBodyOdomDivergenceTick: number | null;
}): G5AGate {
  const {
    gate1,
    dynamicHistory: d,
    staticHistory: s,
    firstPrivateDivergenceTick,
    firstMotorDivergenceTick,
    firstBodyOdomDivergenceTick,
  } = args;
  if (gate1.outcome !== 'PASS') {
    return {
      outcome: 'INCONCLUSIVE',
      reasons: ['Gate 1 did not pass; behavioral value is not interpretable'],
    };
  }

  const reasons: string[] = [];

  if (firstPrivateDivergenceTick === null) {
    reasons.push('no lawful private divergence exists');
  }

  if (firstMotorDivergenceTick === null) {
    reasons.push('lawful ecology-induced private difference never changes motor demand');
  } else if (
    firstPrivateDivergenceTick !== null &&
    firstMotorDivergenceTick < firstPrivateDivergenceTick
  ) {
    reasons.push('motor demand diverges before lawful private evidence diverges');
  }

  if (
    firstBodyOdomDivergenceTick !== null &&
    firstMotorDivergenceTick !== null &&
    firstBodyOdomDivergenceTick < firstMotorDivergenceTick
  ) {
    reasons.push('private body-motion history diverges before motor demand');
  }

  if (d.actorProcessContactTicks.length > 0 || s.actorProcessContactTicks.length > 0) {
    reasons.push('behavioral divergence is contaminated by actor-process contact');
  }

  return {
    outcome: reasons.length === 0 ? 'PASS' : 'FAIL',
    reasons,
  };
}

export function runG5ACampaign(): G5AResult {
  const d0 = rerunG5D0Config(G5A_CONFIG);

  const dynamicHistory = runG5D0Variant(G5A_CONFIG, true, true);
  const staticHistory = runG5D0Variant(G5A_CONFIG, false, true);
  const dynamicAblated = runG5D0Variant(G5A_CONFIG, true, false);

  const repeatDynamic = runG5D0Variant(G5A_CONFIG, true, true);
  const repeatStatic = runG5D0Variant(G5A_CONFIG, false, true);
  const repeatAblated = runG5D0Variant(G5A_CONFIG, true, false);

  const deterministic =
    JSON.stringify(dynamicHistory) === JSON.stringify(repeatDynamic) &&
    JSON.stringify(staticHistory) === JSON.stringify(repeatStatic) &&
    JSON.stringify(dynamicAblated) === JSON.stringify(repeatAblated);

  const d0Parity =
    JSON.stringify(dynamicHistory) === JSON.stringify(d0.dynamic) &&
    JSON.stringify(staticHistory) === JSON.stringify(d0.staticWorld);

  const firstPrivateDivergenceTick = firstDifference(
    dynamicHistory.privateTrace,
    staticHistory.privateTrace,
    privateKey,
  );

  const firstMotorDivergenceTick = firstDifference(
    dynamicHistory.privateTrace,
    staticHistory.privateTrace,
    (row) => row.demand,
  );

  const firstBodyOdomDivergenceTick = firstDifference(
    dynamicHistory.privateTrace,
    staticHistory.privateTrace,
    (row) => row.state.bodyOdom,
  );

  const gate1 = evaluateGate1({
    dynamicHistory,
    staticHistory,
    dynamicAblated,
    firstPrivateDivergenceTick,
    deterministic,
    d0Parity,
  });

  const gate2 = evaluateGate2({
    gate1,
    dynamicHistory,
    staticHistory,
    firstPrivateDivergenceTick,
    firstMotorDivergenceTick,
    firstBodyOdomDivergenceTick,
  });

  return {
    deterministic,
    d0Parity,
    dynamicHistory,
    staticHistory,
    dynamicAblated,
    firstPrivateDivergenceTick,
    firstMotorDivergenceTick,
    firstBodyOdomDivergenceTick,
    gate1,
    gate2,
  };
}
