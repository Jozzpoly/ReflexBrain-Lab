import { beforeAll, describe, expect, it } from 'vitest';
import * as RapierModule from '@dimforge/rapier2d-deterministic-compat';
import {
  createE01Scenario,
  destroyE01Scenario,
  initE01Rapier,
  snapshotE01Scenario,
  stepE01Scenario,
  type E01State,
} from '../src/e01-mechanical';

const RAPIER: any = (RapierModule as any).default ?? RapierModule;

type BodyHandles = { rb: number; co: number };
type E01Handles = {
  shuttle: BodyHandles;
  loose: BodyHandles | null;
  leftEnd: BodyHandles;
  rightEnd: BodyHandles;
  walls: BodyHandles[];
};

type E01Sidecar = Omit<E01State, 'world' | 'shuttle' | 'loose' | 'leftEnd' | 'rightEnd' | 'walls'>;

beforeAll(async () => {
  await initE01Rapier();
});

function handlesOf(state: E01State): E01Handles {
  const pair = (body: { rb: any; co: any }): BodyHandles => ({
    rb: body.rb.handle,
    co: body.co.handle,
  });
  return {
    shuttle: pair(state.shuttle),
    loose: state.loose ? pair(state.loose) : null,
    leftEnd: pair(state.leftEnd),
    rightEnd: pair(state.rightEnd),
    walls: state.walls.map(pair),
  };
}

function sidecarOf(state: E01State): E01Sidecar {
  return {
    direction: state.direction,
    tick: state.tick,
    prevLeftTouch: state.prevLeftTouch,
    prevRightTouch: state.prevRightTouch,
    rightReversalTick: state.rightReversalTick,
    leftReversalTick: state.leftReversalTick,
    firstLooseContactTick: state.firstLooseContactTick,
    looseContactTicks: state.looseContactTicks,
    directionEvents: state.directionEvents.map((e) => ({ ...e })),
  };
}

function cloneSidecar(s: E01Sidecar): E01Sidecar {
  return {
    ...s,
    directionEvents: s.directionEvents.map((e) => ({ ...e })),
  };
}

function bindBody(world: any, h: BodyHandles) {
  const rb = world.getRigidBody(h.rb);
  const co = world.getCollider(h.co);
  if (!rb || !co) throw new Error(`failed to rebind body handles rb=${h.rb} co=${h.co}`);
  return { rb, co };
}

function restoreE01(bytes: Uint8Array, handles: E01Handles, sidecar: E01Sidecar): E01State {
  const world = RAPIER.World.restoreSnapshot(bytes);
  if (!world) throw new Error('World.restoreSnapshot returned no world');

  return {
    world,
    shuttle: bindBody(world, handles.shuttle),
    loose: handles.loose ? bindBody(world, handles.loose) : null,
    leftEnd: bindBody(world, handles.leftEnd),
    rightEnd: bindBody(world, handles.rightEnd),
    walls: handles.walls.map((h) => bindBody(world, h)),
    ...cloneSidecar(sidecar),
  };
}

function stableState(state: E01State) {
  return {
    physical: snapshotE01Scenario(state),
    direction: state.direction,
    tick: state.tick,
    prevLeftTouch: state.prevLeftTouch,
    prevRightTouch: state.prevRightTouch,
    rightReversalTick: state.rightReversalTick,
    leftReversalTick: state.leftReversalTick,
    firstLooseContactTick: state.firstLooseContactTick,
    looseContactTicks: state.looseContactTicks,
    directionEvents: state.directionEvents.map((e) => ({ ...e })),
  };
}

describe('MEDIUM-C/R0 exact snapshot + process sidecar boundary', () => {
  it('forks E01 exactly only when causally relevant non-physics state is restored', () => {
    const original = createE01Scenario(true);
    let restored: E01State | null = null;
    let wrongDirection: E01State | null = null;

    try {
      for (let i = 0; i < 300; i += 1) stepE01Scenario(original);

      expect(original.tick).toBe(300);
      expect(original.rightReversalTick).not.toBeNull();
      expect(original.direction).toBe(-1);

      const handles = handlesOf(original);
      const sidecar = sidecarOf(original);
      const bytes = original.world.takeSnapshot();

      expect(bytes).toBeInstanceOf(Uint8Array);
      expect(bytes.byteLength).toBeGreaterThan(100);

      restored = restoreE01(bytes, handles, sidecar);

      const wrongSidecar = cloneSidecar(sidecar);
      wrongSidecar.direction = 1;
      wrongDirection = restoreE01(bytes, handles, wrongSidecar);

      const immediateOriginal = stableState(original);
      const immediateRestored = stableState(restored);

      expect(immediateRestored).toEqual(immediateOriginal);

      // Handles must still identify the same restored physics objects.
      expect(restored.shuttle.rb.handle).toBe(handles.shuttle.rb);
      expect(restored.shuttle.co.handle).toBe(handles.shuttle.co);
      expect(restored.loose?.rb.handle).toBe(handles.loose?.rb);
      expect(restored.leftEnd.rb.handle).toBe(handles.leftEnd.rb);
      expect(restored.rightEnd.rb.handle).toBe(handles.rightEnd.rb);
      expect(restored.walls.map((w) => w.rb.handle)).toEqual(handles.walls.map((w) => w.rb));

      let firstCorrectDivergence: number | null = null;
      let firstWrongDirectionDivergence: number | null = null;

      for (let i = 1; i <= 1200; i += 1) {
        stepE01Scenario(original);
        stepE01Scenario(restored);
        stepE01Scenario(wrongDirection);

        const a = stableState(original);
        const b = stableState(restored);
        const c = stableState(wrongDirection);

        if (firstCorrectDivergence === null && JSON.stringify(a) !== JSON.stringify(b)) {
          firstCorrectDivergence = i;
        }
        if (firstWrongDirectionDivergence === null && JSON.stringify(a) !== JSON.stringify(c)) {
          firstWrongDirectionDivergence = i;
        }
      }

      const result = {
        snapshotBytes: bytes.byteLength,
        snapshotTick: sidecar.tick,
        snapshotDirection: sidecar.direction,
        handlesStable: true,
        firstCorrectDivergence,
        firstWrongDirectionDivergence,
        finalOriginal: stableState(original),
        finalRestored: stableState(restored),
        finalWrongDirection: stableState(wrongDirection),
      };

      console.log('MEDIUM_C_R0_RESULT ' + JSON.stringify(result));

      expect(firstCorrectDivergence).toBeNull();
      expect(stableState(restored)).toEqual(stableState(original));
      expect(firstWrongDirectionDivergence).not.toBeNull();
      expect(firstWrongDirectionDivergence).toBeLessThanOrEqual(2);
    } finally {
      destroyE01Scenario(original);
      if (restored) destroyE01Scenario(restored);
      if (wrongDirection) destroyE01Scenario(wrongDirection);
    }
  }, 20_000);
});
