import {
  E02A_MAX_TICKS,
  createE02aScenario,
  destroyE02aScenario,
  initE02aRapier,
  isE02aPassageOpen,
  stepE02aScenario,
  type E02aScenarioResult,
  type E02aState,
} from './e02a-passage';

export const E02B_REQUIRED_NO_CONTACT_TICKS = 60;
export const E02B_MIN_DISPLACEMENT = 0.9;

export type E02bCase = {
  id: 'B0' | 'H1' | 'H2' | 'H3' | 'H4' | 'H5';
  x: number;
  y: number;
  heldOut: boolean;
};

export const E02B_CASES: readonly E02bCase[] = [
  { id: 'B0', x: 0.00, y: +0.20, heldOut: false },
  { id: 'H1', x: 0.00, y: +0.10, heldOut: true },
  { id: 'H2', x: 0.00, y: +0.30, heldOut: true },
  { id: 'H3', x: 0.00, y: -0.20, heldOut: true },
  { id: 'H4', x: -0.10, y: +0.20, heldOut: true },
  { id: 'H5', x: +0.10, y: +0.20, heldOut: true },
] as const;

export type E02bCaseResult = {
  id: E02bCase['id'];
  heldOut: boolean;
  start: { x: number; y: number };
  deterministic: boolean;
  pass: boolean;
  reasons: string[];
  run: E02aScenarioResult;
};

export type E02bCampaignResult = {
  pass: boolean;
  baselinePass: boolean;
  heldOutPassCount: number;
  heldOutTotal: number;
  cases: E02bCaseResult[];
  reasons: string[];
};

export async function initE02bRapier(): Promise<void> {
  await initE02aRapier();
}

function resetToCaseStart(state: E02aState, c: E02bCase): void {
  state.blocker.rb.setTranslation({ x: c.x, y: c.y }, true);
  state.blocker.rb.setLinvel({ x: 0, y: 0 }, true);
  state.blocker.rb.setAngvel(0, true);

  state.initialOpen = isE02aPassageOpen(state);
  state.firstOpenTick = null;
  state.firstBlockerContactTick = null;
  state.blockerContactTicks = 0;
  state.hadBlockerContact = false;
  state.postContactNoContactTicks = 0;
  state.persistenceOpen = null;
  state.blockerAtFirstOpen = null;
  state.blockerAtPersistence = null;
}

function runFrozenCaseOnce(c: E02bCase): E02aScenarioResult {
  const state = createE02aScenario(true);
  resetToCaseStart(state, c);

  for (let i = 0; i < E02A_MAX_TICKS; i += 1) {
    stepE02aScenario(state);

    if (
      state.firstOpenTick !== null &&
      state.persistenceOpen !== null
    ) {
      break;
    }
  }

  const bp = state.blocker.rb.translation();
  const sp = state.base.shuttle.rb.translation();

  const result: E02aScenarioResult = {
    processEnabled: true,
    ticks: state.base.tick,
    initialOpen: state.initialOpen,
    firstOpenTick: state.firstOpenTick,
    firstBlockerContactTick: state.firstBlockerContactTick,
    blockerContactTicks: state.blockerContactTicks,
    postContactNoContactTicks: state.postContactNoContactTicks,
    persistenceOpen: state.persistenceOpen,
    blockerStart: { x: c.x, y: c.y },
    blockerAtFirstOpen: state.blockerAtFirstOpen,
    blockerAtPersistence: state.blockerAtPersistence,
    blockerFinal: { x: bp.x, y: bp.y },
    finalOpen: isE02aPassageOpen(state),
    shuttleFinal: {
      x: sp.x,
      y: sp.y,
      direction: state.base.direction,
    },
  };

  destroyE02aScenario(state);
  return result;
}

function comparable(result: E02aScenarioResult): unknown {
  return {
    ticks: result.ticks,
    initialOpen: result.initialOpen,
    firstOpenTick: result.firstOpenTick,
    firstBlockerContactTick: result.firstBlockerContactTick,
    blockerContactTicks: result.blockerContactTicks,
    postContactNoContactTicks: result.postContactNoContactTicks,
    persistenceOpen: result.persistenceOpen,
    blockerAtFirstOpen: result.blockerAtFirstOpen,
    blockerAtPersistence: result.blockerAtPersistence,
    blockerFinal: result.blockerFinal,
    finalOpen: result.finalOpen,
    shuttleFinal: result.shuttleFinal,
  };
}

function qualifyCase(c: E02bCase): E02bCaseResult {
  const run = runFrozenCaseOnce(c);
  const repeat = runFrozenCaseOnce(c);
  const deterministic =
    JSON.stringify(comparable(run)) === JSON.stringify(comparable(repeat));

  const displacement =
    run.blockerAtPersistence
      ? Math.hypot(
          run.blockerAtPersistence.x - c.x,
          run.blockerAtPersistence.y - c.y,
        )
      : null;

  const reasons: string[] = [];

  if (run.initialOpen) reasons.push('initial passage was OPEN instead of BLOCKED');
  if (run.firstBlockerContactTick === null) reasons.push('no shuttle/blocker contact');
  if (run.firstOpenTick === null) reasons.push('passage never became OPEN');
  if (run.postContactNoContactTicks < E02B_REQUIRED_NO_CONTACT_TICKS) {
    reasons.push(
      `only ${run.postContactNoContactTicks} post-contact no-contact ticks; requires ${E02B_REQUIRED_NO_CONTACT_TICKS}`,
    );
  }
  if (run.persistenceOpen !== true) {
    reasons.push('passage was not OPEN at the post-contact persistence sample');
  }
  if (displacement === null || displacement < E02B_MIN_DISPLACEMENT) {
    reasons.push(
      `blocker displacement at persistence was ${displacement ?? 'null'}; requires >= ${E02B_MIN_DISPLACEMENT}`,
    );
  }
  if (!deterministic) reasons.push('repeat was not deterministic');

  return {
    id: c.id,
    heldOut: c.heldOut,
    start: { x: c.x, y: c.y },
    deterministic,
    pass: reasons.length === 0,
    reasons,
    run,
  };
}

export function runE02bCampaign(): E02bCampaignResult {
  const cases = E02B_CASES.map(qualifyCase);
  const baseline = cases.find((c) => c.id === 'B0');
  const heldOut = cases.filter((c) => c.heldOut);

  const baselinePass = baseline?.pass === true;
  const heldOutPassCount = heldOut.filter((c) => c.pass).length;
  const heldOutTotal = heldOut.length;

  const reasons: string[] = [];

  if (!baselinePass) {
    reasons.push('frozen E02a baseline B0 regressed');
  }

  for (const c of heldOut) {
    if (!c.pass) {
      reasons.push(
        `${c.id} failed: ${c.reasons.join('; ')}`,
      );
    }
  }

  return {
    pass: baselinePass && heldOutPassCount === heldOutTotal,
    baselinePass,
    heldOutPassCount,
    heldOutTotal,
    cases,
    reasons,
  };
}
