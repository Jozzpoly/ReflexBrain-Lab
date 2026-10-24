import { beforeAll, describe, expect, it } from 'vitest';
import { initE0Rapier } from '../src/e0-body-seam';
import { C01_PRIVATE_EVIDENCE_AGE } from '../src/c01-private-evidence-monitor';
import { runG5ACampaign } from '../src/g5a-independent-ecology-value';

beforeAll(async () => {
  await initE0Rapier();
});

function compact() {
  const result = runG5ACampaign();
  return {
    deterministic: result.deterministic,
    d0Parity: result.d0Parity,
    gate1: result.gate1,
    gate2: result.gate2,
    firstPrivateDivergenceTick: result.firstPrivateDivergenceTick,
    firstMotorDivergenceTick: result.firstMotorDivergenceTick,
    firstBodyOdomDivergenceTick: result.firstBodyOdomDivergenceTick,
    dynamic: {
      firstLostTick: result.dynamicHistory.firstLostTick,
      firstProcessTargetContactTick:
        result.dynamicHistory.firstProcessTargetContactTick,
      firstCheckTick: result.dynamicHistory.firstCheckTick,
      firstReobservedTick: result.dynamicHistory.firstReobservedTick,
      targetDisplacementAtCheck:
        result.dynamicHistory.targetDisplacementAtCheck,
      hiddenLeakTicks: result.dynamicHistory.hiddenLeakTicks,
      actorProcessContactTicks: result.dynamicHistory.actorProcessContactTicks,
      finalMode: result.dynamicHistory.finalMode,
    },
    staticWorld: {
      firstLostTick: result.staticHistory.firstLostTick,
      firstProcessTargetContactTick:
        result.staticHistory.firstProcessTargetContactTick,
      firstCheckTick: result.staticHistory.firstCheckTick,
      firstReobservedTick: result.staticHistory.firstReobservedTick,
      targetDisplacementAtCheck:
        result.staticHistory.targetDisplacementAtCheck,
      hiddenLeakTicks: result.staticHistory.hiddenLeakTicks,
      actorProcessContactTicks: result.staticHistory.actorProcessContactTicks,
      finalMode: result.staticHistory.finalMode,
    },
    ablated: {
      firstLostTick: result.dynamicAblated.firstLostTick,
      firstProcessTargetContactTick:
        result.dynamicAblated.firstProcessTargetContactTick,
      firstCheckTick: result.dynamicAblated.firstCheckTick,
      firstReobservedTick: result.dynamicAblated.firstReobservedTick,
      hiddenLeakTicks: result.dynamicAblated.hiddenLeakTicks,
      actorProcessContactTicks: result.dynamicAblated.actorProcessContactTicks,
      finalMode: result.dynamicAblated.finalMode,
      hasAnyLastSeen: result.dynamicAblated.privateTrace.some(
        (row) => row.state.lastSeen !== null,
      ),
    },
  };
}

describe('O-CTRL/G5A independent ecology value', () => {
  it('reproduces the frozen D0 composition before evaluating scientific gates', () => {
    const first = compact();
    const second = compact();

    expect(second).toEqual(first);
    expect(first.deterministic).toBe(true);
    expect(first.d0Parity).toBe(true);

    // Frozen execution-validity facts from G5-D0 selected candidate.
    expect(first.dynamic.firstLostTick).toBe(51);
    expect(first.staticWorld.firstLostTick).toBe(51);
    expect(first.dynamic.firstProcessTargetContactTick).toBe(111);
    expect(first.staticWorld.firstProcessTargetContactTick).toBeNull();
    expect(first.dynamic.firstCheckTick).toBe(231);
    expect(first.staticWorld.firstCheckTick).toBe(231);
    expect(first.dynamic.firstReobservedTick).toBe(325);
    expect(first.staticWorld.firstReobservedTick).toBe(313);
    expect(first.firstPrivateDivergenceTick).toBe(313);

    expect(first.dynamic.targetDisplacementAtCheck).toBeCloseTo(
      0.9440,
      3,
    );
    expect(first.staticWorld.targetDisplacementAtCheck).toBeCloseTo(0, 6);

    expect(first.dynamic.hiddenLeakTicks).toEqual([]);
    expect(first.staticWorld.hiddenLeakTicks).toEqual([]);
    expect(first.dynamic.actorProcessContactTicks).toEqual([]);
    expect(first.staticWorld.actorProcessContactTicks).toEqual([]);
    expect(first.ablated.actorProcessContactTicks).toEqual([]);

    // Legal-history ablation is from start, not a mid-run memory edit.
    expect(first.ablated.firstCheckTick).toBeNull();
    expect(first.ablated.hasAnyLastSeen).toBe(false);

    console.log('OCTRL_G5A_RESULT ' + JSON.stringify(first));
  });

  it('keeps CHECK timing private-history driven in both history variants', () => {
    const result = runG5ACampaign();

    const dynamicCheckRow =
      result.dynamicHistory.privateTrace[result.dynamicHistory.firstCheckTick!];
    const staticCheckRow =
      result.staticHistory.privateTrace[result.staticHistory.firstCheckTick!];

    expect(dynamicCheckRow.state.mode).toBe('CHECK');
    expect(staticCheckRow.state.mode).toBe('CHECK');
    expect(
      dynamicCheckRow.state.privateTick -
        dynamicCheckRow.state.lastSeen!.privateTick,
    ).toBe(C01_PRIVATE_EVIDENCE_AGE);
    expect(
      staticCheckRow.state.privateTick -
        staticCheckRow.state.lastSeen!.privateTick,
    ).toBe(C01_PRIVATE_EVIDENCE_AGE);
  });

  it('does not turn a scientific FAIL into a CI failure', () => {
    const result = runG5ACampaign();

    expect(['PASS', 'FAIL', 'INCONCLUSIVE']).toContain(result.gate1.outcome);
    expect(['PASS', 'FAIL', 'INCONCLUSIVE']).toContain(result.gate2.outcome);

    if (result.gate1.outcome !== 'PASS') {
      expect(result.gate2.outcome).toBe('INCONCLUSIVE');
    }
  });
});
