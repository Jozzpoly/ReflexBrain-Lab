import {
  applyE0Demand,
  createE0Body,
  type E0Body,
} from './e0-body-seam';
import {
  createB01bScenario,
  destroyB01bScenario,
  runB01bScenario,
  type B01bState,
} from './b01b-b0-scale-passage';
import {
  B01C_ACTOR_START,
  B01C_CROSS_X,
  B01C_TICKS,
} from './b01c-actual-b0-effectivity';

export const B01D_OPEN_EXPECTED_CROSS_TICK = 122;
export const B01D_OPEN_EXPECTED_CONTACT_TICKS = 53;

export const B01D_HELD_OUT = [
  { id: 'H1', x: 0.00, y: +0.10 },
  { id: 'H2', x: 0.00, y: +0.30 },
  { id: 'H3', x: 0.00, y: -0.20 },
  { id: 'H4', x: -0.10, y: +0.20 },
  { id: 'H5', x: +0.10, y: +0.20 },
] as const;

export type B01dCaseId = 'OPEN' | (typeof B01D_HELD_OUT)[number]['id'];

export type B01dCaseResult = {
  id: B01dCaseId;
  blockerStart: { x: number; y: number };
  crossed: boolean;
  crossedTick: number | null;
  actorBlockerContactTicks: number;
  actorFinal: { x: number; y: number; speed: number };
  blockerFinal: { x: number; y: number };
  blockerDisplacement: number;
};

export type B01dQualifiedCase = {
  id: (typeof B01D_HELD_OUT)[number]['id'];
  result: B01dCaseResult;
  repeat: B01dCaseResult;
  deterministic: boolean;
  laterThanOpen: boolean;
  moreContactThanOpen: boolean;
  pass: boolean;
};

export type B01dCampaignResult = {
  outcome: 'PASS' | 'FAIL' | 'INCONCLUSIVE';
  open: B01dCaseResult;
  openRepeat: B01dCaseResult;
  openDeterministic: boolean;
  openRegressionExact: boolean;
  cases: B01dQualifiedCase[];
  reasons: string[];
};

function hasContact(world: any, a: any, b: any): boolean {
  let found = false;
  world.contactPair(a, b, () => {
    found = true;
  });
  return found;
}

function qualifiedOpenBlockerPosition(): { x: number; y: number } {
  const result = runB01bScenario(true);
  const p = result.blockerAtPersistence;

  if (!p || result.persistenceOpen !== true) {
    throw new Error('qualified B01b OPEN state unavailable');
  }

  return { x: p.x, y: p.y };
}

function removeIrrelevantProcessBody(state: B01bState): void {
  state.e02.base.world.removeRigidBody(state.e02.base.shuttle.rb);
}

function prepareAt(position: { x: number; y: number }): {
  state: B01bState;
  actor: E0Body;
  blockerStart: { x: number; y: number };
} {
  const state = createB01bScenario(false);
  removeIrrelevantProcessBody(state);

  state.e02.blocker.rb.setTranslation(position, true);
  state.e02.blocker.rb.setLinvel({ x: 0, y: 0 }, true);
  state.e02.blocker.rb.setAngvel(0, true);

  const bp = state.e02.blocker.rb.translation();
  const blockerStart = { x: bp.x, y: bp.y };

  const actor = createE0Body(
    state.e02.base.world,
    B01C_ACTOR_START.x,
    B01C_ACTOR_START.y,
  );

  return { state, actor, blockerStart };
}

function runAt(
  id: B01dCaseId,
  position: { x: number; y: number },
): B01dCaseResult {
  const { state, actor, blockerStart } = prepareAt(position);

  let crossedTick: number | null = null;
  let actorBlockerContactTicks = 0;

  for (let tick = 1; tick <= B01C_TICKS; tick += 1) {
    applyE0Demand(actor.rb, 1, 0);
    state.e02.base.world.step();

    if (hasContact(state.e02.base.world, actor.co, state.e02.blocker.co)) {
      actorBlockerContactTicks += 1;
    }

    if (crossedTick === null && actor.rb.translation().x > B01C_CROSS_X) {
      crossedTick = tick;
    }
  }

  const ap = actor.rb.translation();
  const av = actor.rb.linvel();
  const bp = state.e02.blocker.rb.translation();

  const result: B01dCaseResult = {
    id,
    blockerStart,
    crossed: crossedTick !== null,
    crossedTick,
    actorBlockerContactTicks,
    actorFinal: {
      x: ap.x,
      y: ap.y,
      speed: Math.hypot(av.x, av.y),
    },
    blockerFinal: { x: bp.x, y: bp.y },
    blockerDisplacement: Math.hypot(
      bp.x - blockerStart.x,
      bp.y - blockerStart.y,
    ),
  };

  destroyB01bScenario(state);
  return result;
}

function comparable(r: B01dCaseResult): unknown {
  return {
    id: r.id,
    blockerStart: r.blockerStart,
    crossed: r.crossed,
    crossedTick: r.crossedTick,
    actorBlockerContactTicks: r.actorBlockerContactTicks,
    actorFinal: r.actorFinal,
    blockerFinal: r.blockerFinal,
    blockerDisplacement: r.blockerDisplacement,
  };
}

function same(a: B01dCaseResult, b: B01dCaseResult): boolean {
  return JSON.stringify(comparable(a)) === JSON.stringify(comparable(b));
}

export function runB01dCampaign(): B01dCampaignResult {
  const openPosition = qualifiedOpenBlockerPosition();
  const open = runAt('OPEN', openPosition);
  const openRepeat = runAt('OPEN', openPosition);
  const openDeterministic = same(open, openRepeat);

  const openRegressionExact =
    open.crossedTick === B01D_OPEN_EXPECTED_CROSS_TICK &&
    open.actorBlockerContactTicks === B01D_OPEN_EXPECTED_CONTACT_TICKS;

  const cases: B01dQualifiedCase[] = B01D_HELD_OUT.map((spec) => {
    const result = runAt(spec.id, spec);
    const repeat = runAt(spec.id, spec);
    const deterministic = same(result, repeat);

    const laterThanOpen =
      open.crossedTick !== null &&
      (result.crossedTick === null || result.crossedTick > open.crossedTick);

    const moreContactThanOpen =
      result.actorBlockerContactTicks > open.actorBlockerContactTicks;

    return {
      id: spec.id,
      result,
      repeat,
      deterministic,
      laterThanOpen,
      moreContactThanOpen,
      pass: deterministic && laterThanOpen && moreContactThanOpen,
    };
  });

  const reasons: string[] = [];

  let outcome: B01dCampaignResult['outcome'];

  if (!openDeterministic || cases.some((c) => !c.deterministic)) {
    outcome = 'INCONCLUSIVE';
    reasons.push('deterministic replay failed for OPEN or at least one held-out case');
  } else {
    if (!open.crossed) {
      reasons.push('OPEN reference did not cross within the frozen budget');
    }
    if (!openRegressionExact) {
      reasons.push(
        `OPEN regression drifted from B01c: expected crossing/contact ${B01D_OPEN_EXPECTED_CROSS_TICK}/${B01D_OPEN_EXPECTED_CONTACT_TICKS}, got ${open.crossedTick}/${open.actorBlockerContactTicks}`,
      );
    }

    for (const c of cases) {
      if (!c.laterThanOpen) {
        reasons.push(`${c.id} did not preserve later-crossing ordering versus OPEN`);
      }
      if (!c.moreContactThanOpen) {
        reasons.push(`${c.id} did not preserve greater-contact ordering versus OPEN`);
      }
    }

    outcome = reasons.length === 0 ? 'PASS' : 'FAIL';
  }

  return {
    outcome,
    open,
    openRepeat,
    openDeterministic,
    openRegressionExact,
    cases,
    reasons,
  };
}
