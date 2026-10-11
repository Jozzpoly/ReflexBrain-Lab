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

export const B01C_TICKS = 360;
export const B01C_ACTOR_START = { x: -3.20, y: 0.0 };
export const B01C_CROSS_X = 1.25;

export type B01cFixture = 'OPEN' | 'BLOCKED';

export type B01cScenarioResult = {
  fixture: B01cFixture;
  crossed: boolean;
  crossedTick: number | null;
  actorFinal: { x: number; y: number; speed: number };
  blockerStart: { x: number; y: number };
  blockerFinal: { x: number; y: number };
  blockerDisplacement: number;
  actorBlockerContactTicks: number;
};

export type B01cCampaignResult = {
  deterministic: boolean;
  open: B01cScenarioResult;
  blocked: B01cScenarioResult;
  outcome: 'PASS' | 'FAIL' | 'INCONCLUSIVE';
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
  // B01c tests the material passage state against actual B0 effectivity.
  // The world-side process has already been qualified separately.
  // Remove only the shuttle dynamic body so it cannot confound the fixed
  // traversal protocol. The blocker remains fully dynamic.
  state.e02.base.world.removeRigidBody(state.e02.base.shuttle.rb);
}

function prepareFixture(fixture: B01cFixture): {
  state: B01bState;
  actor: E0Body;
  blockerStart: { x: number; y: number };
} {
  const state = createB01bScenario(false);
  removeIrrelevantProcessBody(state);

  if (fixture === 'OPEN') {
    const open = qualifiedOpenBlockerPosition();
    state.e02.blocker.rb.setTranslation(open, true);
    state.e02.blocker.rb.setLinvel({ x: 0, y: 0 }, true);
    state.e02.blocker.rb.setAngvel(0, true);
  }

  const bp = state.e02.blocker.rb.translation();
  const blockerStart = { x: bp.x, y: bp.y };

  const actor = createE0Body(
    state.e02.base.world,
    B01C_ACTOR_START.x,
    B01C_ACTOR_START.y,
  );

  return { state, actor, blockerStart };
}

function runFixtureOnce(fixture: B01cFixture): B01cScenarioResult {
  const { state, actor, blockerStart } = prepareFixture(fixture);

  let crossedTick: number | null = null;
  let actorBlockerContactTicks = 0;

  for (let tick = 1; tick <= B01C_TICKS; tick += 1) {
    applyE0Demand(actor.rb, 1, 0);
    state.e02.base.world.step();

    if (
      hasContact(
        state.e02.base.world,
        actor.co,
        state.e02.blocker.co,
      )
    ) {
      actorBlockerContactTicks += 1;
    }

    if (crossedTick === null && actor.rb.translation().x > B01C_CROSS_X) {
      crossedTick = tick;
    }
  }

  const ap = actor.rb.translation();
  const av = actor.rb.linvel();
  const bp = state.e02.blocker.rb.translation();

  const result: B01cScenarioResult = {
    fixture,
    crossed: crossedTick !== null,
    crossedTick,
    actorFinal: {
      x: ap.x,
      y: ap.y,
      speed: Math.hypot(av.x, av.y),
    },
    blockerStart,
    blockerFinal: { x: bp.x, y: bp.y },
    blockerDisplacement: Math.hypot(
      bp.x - blockerStart.x,
      bp.y - blockerStart.y,
    ),
    actorBlockerContactTicks,
  };

  destroyB01bScenario(state);
  return result;
}

function comparable(r: B01cScenarioResult): unknown {
  return {
    crossed: r.crossed,
    crossedTick: r.crossedTick,
    actorFinal: r.actorFinal,
    blockerStart: r.blockerStart,
    blockerFinal: r.blockerFinal,
    blockerDisplacement: r.blockerDisplacement,
    actorBlockerContactTicks: r.actorBlockerContactTicks,
  };
}

export function runB01cCampaign(): B01cCampaignResult {
  const open = runFixtureOnce('OPEN');
  const blocked = runFixtureOnce('BLOCKED');

  const openRepeat = runFixtureOnce('OPEN');
  const blockedRepeat = runFixtureOnce('BLOCKED');

  const deterministic =
    JSON.stringify(comparable(open)) === JSON.stringify(comparable(openRepeat)) &&
    JSON.stringify(comparable(blocked)) === JSON.stringify(comparable(blockedRepeat));

  const reasons: string[] = [];

  let outcome: B01cCampaignResult['outcome'];

  if (!deterministic) {
    outcome = 'INCONCLUSIVE';
    reasons.push('fixture replay was not deterministic');
  } else if (!open.crossed) {
    outcome = 'FAIL';
    reasons.push('actual B0 failed to cross researcher-labelled OPEN fixture');
  } else if (blocked.crossed) {
    outcome = 'FAIL';
    reasons.push(
      'actual B0 crossed researcher-labelled BLOCKED fixture under the same fixed motor protocol',
    );
  } else {
    outcome = 'PASS';
  }

  return {
    deterministic,
    open,
    blocked,
    outcome,
    reasons,
  };
}
