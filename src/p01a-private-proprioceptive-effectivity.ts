import {
  applyE0Demand,
  createE0Body,
  wrapE0Pi,
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
import {
  B01D_HELD_OUT,
  runB01dCampaign,
  type B01dCaseId,
} from './b01d-actor-relative-resistance';

export const P01A_AUDIT_TICK = 122;
export const P01A_TRACE_EPSILON = 1e-9;

export type P01aPrivateSample = {
  tick: number;
  demand: {
    drive: number;
    turn: number;
  };
  forwardDelta: number;
  lateralDelta: number;
  turnDelta: number;
  forwardOdom: number;
  lateralOdom: number;
  turnOdom: number;
};

export type P01aScenarioResult = {
  id: B01dCaseId;
  privateTrace: P01aPrivateSample[];

  // Microscope-only evidence. None of these fields are present in privateTrace.
  firstActorBlockerContactTick: number | null;
  actorBlockerContactTicks: number;
  crossedTick: number | null;
};

export type P01aPairResult = {
  id: Exclude<B01dCaseId, 'OPEN'>;
  deterministic: boolean;
  physicalRegressionMatchesB01d: boolean;
  demandSequenceIdentical: boolean;
  firstPrivateDivergenceTick: number | null;
  firstActorBlockerContactTick: number | null;
  noPrivateDivergenceBeforeContact: boolean;
  privateDivergenceByContactPlusOne: boolean;
  openForwardOdomAtAuditTick: number;
  heldForwardOdomAtAuditTick: number;
  heldHasLessForwardOdomAtAuditTick: boolean;
  pass: boolean;
};

export type P01aCampaignResult = {
  outcome: 'PASS' | 'FAIL' | 'INCONCLUSIVE';
  openDeterministic: boolean;
  openPhysicalRegressionMatchesB01d: boolean;
  privateSchemaClean: boolean;
  pairs: P01aPairResult[];
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
} {
  const state = createB01bScenario(false);
  removeIrrelevantProcessBody(state);

  state.e02.blocker.rb.setTranslation(position, true);
  state.e02.blocker.rb.setLinvel({ x: 0, y: 0 }, true);
  state.e02.blocker.rb.setAngvel(0, true);

  const actor = createE0Body(
    state.e02.base.world,
    B01C_ACTOR_START.x,
    B01C_ACTOR_START.y,
  );

  return { state, actor };
}

function localDelta(
  prev: { x: number; y: number; angle: number },
  next: { x: number; y: number; angle: number },
): { forward: number; lateral: number; turn: number } {
  const dx = next.x - prev.x;
  const dy = next.y - prev.y;
  const c = Math.cos(prev.angle);
  const s = Math.sin(prev.angle);

  return {
    forward: c * dx + s * dy,
    lateral: -s * dx + c * dy,
    turn: wrapE0Pi(next.angle - prev.angle),
  };
}

function runPrivateScenario(
  id: B01dCaseId,
  blockerStart: { x: number; y: number },
): P01aScenarioResult {
  const { state, actor } = prepareAt(blockerStart);

  const trace: P01aPrivateSample[] = [];

  let prev = {
    x: actor.rb.translation().x,
    y: actor.rb.translation().y,
    angle: actor.rb.rotation(),
  };

  let forwardOdom = 0;
  let lateralOdom = 0;
  let turnOdom = 0;

  let firstActorBlockerContactTick: number | null = null;
  let actorBlockerContactTicks = 0;
  let crossedTick: number | null = null;

  for (let tick = 1; tick <= B01C_TICKS; tick += 1) {
    const drive = 1;
    const turn = 0;

    applyE0Demand(actor.rb, drive, turn);
    state.e02.base.world.step();

    const next = {
      x: actor.rb.translation().x,
      y: actor.rb.translation().y,
      angle: actor.rb.rotation(),
    };

    const d = localDelta(prev, next);
    forwardOdom += d.forward;
    lateralOdom += d.lateral;
    turnOdom = wrapE0Pi(turnOdom + d.turn);

    trace.push({
      tick,
      demand: { drive, turn },
      forwardDelta: d.forward,
      lateralDelta: d.lateral,
      turnDelta: d.turn,
      forwardOdom,
      lateralOdom,
      turnOdom,
    });

    const contact = hasContact(
      state.e02.base.world,
      actor.co,
      state.e02.blocker.co,
    );

    if (contact) {
      actorBlockerContactTicks += 1;
      if (firstActorBlockerContactTick === null) {
        firstActorBlockerContactTick = tick;
      }
    }

    if (crossedTick === null && next.x > B01C_CROSS_X) {
      crossedTick = tick;
    }

    prev = next;
  }

  const result: P01aScenarioResult = {
    id,
    privateTrace: trace,
    firstActorBlockerContactTick,
    actorBlockerContactTicks,
    crossedTick,
  };

  destroyB01bScenario(state);
  return result;
}

function stablePrivateComparable(result: P01aScenarioResult): unknown {
  return {
    id: result.id,
    privateTrace: result.privateTrace,
    firstActorBlockerContactTick: result.firstActorBlockerContactTick,
    actorBlockerContactTicks: result.actorBlockerContactTicks,
    crossedTick: result.crossedTick,
  };
}

function deterministicEqual(
  a: P01aScenarioResult,
  b: P01aScenarioResult,
): boolean {
  return JSON.stringify(stablePrivateComparable(a)) ===
    JSON.stringify(stablePrivateComparable(b));
}

function privateSamplesDiffer(
  a: P01aPrivateSample,
  b: P01aPrivateSample,
): boolean {
  return (
    Math.abs(a.forwardDelta - b.forwardDelta) > P01A_TRACE_EPSILON ||
    Math.abs(a.lateralDelta - b.lateralDelta) > P01A_TRACE_EPSILON ||
    Math.abs(a.turnDelta - b.turnDelta) > P01A_TRACE_EPSILON ||
    Math.abs(a.forwardOdom - b.forwardOdom) > P01A_TRACE_EPSILON ||
    Math.abs(a.lateralOdom - b.lateralOdom) > P01A_TRACE_EPSILON ||
    Math.abs(a.turnOdom - b.turnOdom) > P01A_TRACE_EPSILON
  );
}

function firstPrivateDivergenceTick(
  open: P01aPrivateSample[],
  held: P01aPrivateSample[],
): number | null {
  const n = Math.min(open.length, held.length);

  for (let i = 0; i < n; i += 1) {
    if (privateSamplesDiffer(open[i], held[i])) {
      return open[i].tick;
    }
  }

  return open.length === held.length ? null : n + 1;
}

function demandSequenceIdentical(
  open: P01aPrivateSample[],
  held: P01aPrivateSample[],
): boolean {
  if (open.length !== held.length) return false;

  return open.every(
    (sample, i) =>
      sample.demand.drive === held[i].demand.drive &&
      sample.demand.turn === held[i].demand.turn,
  );
}

function auditForward(
  trace: P01aPrivateSample[],
  tick: number,
): number {
  const sample = trace[tick - 1];
  if (!sample || sample.tick !== tick) {
    throw new Error(`private trace missing audit tick ${tick}`);
  }
  return sample.forwardOdom;
}

function schemaIsPrivate(sample: P01aPrivateSample): boolean {
  const top = Object.keys(sample).sort();
  const expectedTop = [
    'demand',
    'forwardDelta',
    'forwardOdom',
    'lateralDelta',
    'lateralOdom',
    'tick',
    'turnDelta',
    'turnOdom',
  ].sort();

  const demand = Object.keys(sample.demand).sort();

  return (
    JSON.stringify(top) === JSON.stringify(expectedTop) &&
    JSON.stringify(demand) === JSON.stringify(['drive', 'turn'])
  );
}

export function runP01aCampaign(): P01aCampaignResult {
  const b01d = runB01dCampaign();

  const expected = new Map<B01dCaseId, {
    crossedTick: number | null;
    actorBlockerContactTicks: number;
  }>();

  expected.set('OPEN', {
    crossedTick: b01d.open.crossedTick,
    actorBlockerContactTicks: b01d.open.actorBlockerContactTicks,
  });

  for (const c of b01d.cases) {
    expected.set(c.id, {
      crossedTick: c.result.crossedTick,
      actorBlockerContactTicks: c.result.actorBlockerContactTicks,
    });
  }

  const openPosition = qualifiedOpenBlockerPosition();
  const open = runPrivateScenario('OPEN', openPosition);
  const openRepeat = runPrivateScenario('OPEN', openPosition);
  const openDeterministic = deterministicEqual(open, openRepeat);

  const openExpected = expected.get('OPEN')!;
  const openPhysicalRegressionMatchesB01d =
    open.crossedTick === openExpected.crossedTick &&
    open.actorBlockerContactTicks === openExpected.actorBlockerContactTicks;

  const privateSchemaClean =
    open.privateTrace.length > 0 &&
    open.privateTrace.every(schemaIsPrivate);

  const pairs: P01aPairResult[] = B01D_HELD_OUT.map((spec) => {
    const held = runPrivateScenario(spec.id, spec);
    const repeat = runPrivateScenario(spec.id, spec);
    const deterministic = deterministicEqual(held, repeat);

    const heldExpected = expected.get(spec.id)!;
    const physicalRegressionMatchesB01d =
      held.crossedTick === heldExpected.crossedTick &&
      held.actorBlockerContactTicks === heldExpected.actorBlockerContactTicks;

    const sameDemand = demandSequenceIdentical(open.privateTrace, held.privateTrace);
    const firstPrivate = firstPrivateDivergenceTick(
      open.privateTrace,
      held.privateTrace,
    );

    const firstContact = held.firstActorBlockerContactTick;

    const noPrivateDivergenceBeforeContact =
      firstContact !== null &&
      (firstPrivate === null || firstPrivate >= firstContact);

    const privateDivergenceByContactPlusOne =
      firstContact !== null &&
      firstPrivate !== null &&
      firstPrivate <= firstContact + 1;

    const openForwardOdomAtAuditTick = auditForward(
      open.privateTrace,
      P01A_AUDIT_TICK,
    );
    const heldForwardOdomAtAuditTick = auditForward(
      held.privateTrace,
      P01A_AUDIT_TICK,
    );

    const heldHasLessForwardOdomAtAuditTick =
      heldForwardOdomAtAuditTick < openForwardOdomAtAuditTick;

    return {
      id: spec.id,
      deterministic,
      physicalRegressionMatchesB01d,
      demandSequenceIdentical: sameDemand,
      firstPrivateDivergenceTick: firstPrivate,
      firstActorBlockerContactTick: firstContact,
      noPrivateDivergenceBeforeContact,
      privateDivergenceByContactPlusOne,
      openForwardOdomAtAuditTick,
      heldForwardOdomAtAuditTick,
      heldHasLessForwardOdomAtAuditTick,
      pass:
        deterministic &&
        physicalRegressionMatchesB01d &&
        sameDemand &&
        noPrivateDivergenceBeforeContact &&
        privateDivergenceByContactPlusOne &&
        heldHasLessForwardOdomAtAuditTick,
    };
  });

  const reasons: string[] = [];

  const protocolInvalid =
    b01d.outcome !== 'PASS' ||
    !openDeterministic ||
    !openPhysicalRegressionMatchesB01d ||
    !privateSchemaClean ||
    pairs.some(
      (p) =>
        !p.deterministic ||
        !p.physicalRegressionMatchesB01d ||
        !p.demandSequenceIdentical ||
        p.firstActorBlockerContactTick === null ||
        !p.noPrivateDivergenceBeforeContact,
    );

  let outcome: P01aCampaignResult['outcome'];

  if (protocolInvalid) {
    outcome = 'INCONCLUSIVE';

    if (b01d.outcome !== 'PASS') reasons.push('frozen B01d regression no longer passes');
    if (!openDeterministic) reasons.push('OPEN private trace replay is not deterministic');
    if (!openPhysicalRegressionMatchesB01d) reasons.push('OPEN physical regression drifted from B01d');
    if (!privateSchemaClean) reasons.push('private sensor schema is contaminated');

    for (const p of pairs) {
      if (!p.deterministic) reasons.push(`${p.id} private trace replay is not deterministic`);
      if (!p.physicalRegressionMatchesB01d) reasons.push(`${p.id} physical regression drifted from B01d`);
      if (!p.demandSequenceIdentical) reasons.push(`${p.id} motor-demand sequence differs from OPEN`);
      if (p.firstActorBlockerContactTick === null) reasons.push(`${p.id} lacks expected actor-blocker contact`);
      if (!p.noPrivateDivergenceBeforeContact) reasons.push(`${p.id} private trace diverges before physical contact`);
    }
  } else {
    for (const p of pairs) {
      if (!p.privateDivergenceByContactPlusOne) {
        reasons.push(`${p.id} legal private trace does not expose the body consequence by contact+1`);
      }
      if (!p.heldHasLessForwardOdomAtAuditTick) {
        reasons.push(`${p.id} private forward odometry is not lower than OPEN at tick ${P01A_AUDIT_TICK}`);
      }
    }

    outcome = reasons.length === 0 ? 'PASS' : 'FAIL';
  }

  return {
    outcome,
    openDeterministic,
    openPhysicalRegressionMatchesB01d,
    privateSchemaClean,
    pairs,
    reasons,
  };
}
