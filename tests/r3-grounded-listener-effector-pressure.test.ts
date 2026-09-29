import {
  describe,
  expect,
  it,
} from "vitest";
import {
  createR3ListenerEffectorRun,
  type R3ListenerEffectorMode,
} from "../src/r3/grounded-listener-effector-run";
import {
  auditR3ListenerTemporalRows,
  auditR3SupplierCompletionGrounding,
  buildR3ListenerTemporalRows,
  privateHistoryOracleMatchesRows,
} from "../src/r3/grounded-listener-effector-audit";
import {
  auditR3GroundedSpeechOpportunity,
} from "../src/r3/grounded-speech-opportunity";
import type {
  ResidentPrivateExperience,
} from "../src/r3/life-contracts";

const MODES:
  readonly R3ListenerEffectorMode[] = [
    "supply-ideal",
    "supply-respond-all",
    "reserve-purpose-aware",
    "reserve-purpose-blind",
  ];

describe("R3 grounded listener-effector separation pressure", () => {
  it("tests temporal deconfounding, grounded settlement and paired purpose causality", () => {
    const runs = Object.fromEntries(
      MODES.map((mode) => {
        const run =
          createR3ListenerEffectorRun(
            mode,
          );
        run.runTicks(5400);
        return [mode, run] as const;
      }),
    );

    const metrics = Object.fromEntries(
      MODES.map((mode) => [
        mode,
        runs[mode]!.metrics(),
      ]),
    );

    const janekGrounding =
      Object.fromEntries(
        MODES.map((mode) => {
          const audit =
            auditR3GroundedSpeechOpportunity(
              runs[
                mode
              ]!.privateExperiences(),
            );
          return [
            mode,
            {
              requestCount:
                audit.requestCount,
              groundedCount:
                audit.groundedRequestCount,
              groundedRate:
                audit.groundedRate,
            },
          ];
        }),
      );

    const miraGrounding =
      Object.fromEntries(
        MODES.map((mode) => [
          mode,
          auditR3SupplierCompletionGrounding(
            runs[
              mode
            ]!.privateExperiences(),
          ),
        ]),
      );

    const groundingPass =
      MODES.every(
        (mode) =>
          janekGrounding[
            mode
          ]!.requestCount ===
            janekGrounding[
              mode
            ]!.groundedCount &&
          janekGrounding[
            mode
          ]!.groundedRate === 1 &&
          miraGrounding[
            mode
          ]!.reportCount ===
            miraGrounding[
              mode
            ]!.groundedCount &&
          (
            miraGrounding[
              mode
            ]!.reportCount === 0 ||
            miraGrounding[
              mode
            ]!.groundedRate === 1
          ),
      );

    const supplyExperiences =
      runs[
        "supply-ideal"
      ]!.privateExperiences();
    const rows =
      buildR3ListenerTemporalRows(
        supplyExperiences,
      );
    const audit =
      auditR3ListenerTemporalRows(
        rows,
      );

    const bodyFingerprintOverlap =
      maxBothClassFingerprintCounts(
        rows,
      );

    const temporalGate = {
      rowCount: rows.length,
      positiveCount:
        audit.positiveCount,
      negativeCount:
        audit.negativeCount,
      holdingConstantFalse:
        rows.every(
          (row) =>
            !row.holdingObject,
        ),
      xConstant:
        new Set(
          rows.map(
            (row) =>
              row.listenerX,
          ),
        ).size === 1,
      yConstant:
        new Set(
          rows.map(
            (row) =>
              row.listenerY,
          ),
        ).size === 1,
      activityKindConstant:
        new Set(
          rows.map(
            (row) =>
              row.activityKind,
          ),
        ).size === 1,
      activityPhaseConstant:
        new Set(
          rows.map(
            (row) =>
              row.activityPhase,
          ),
        ).size === 1,
      visibleSourceConstantFalse:
        rows.every(
          (row) =>
            !row.visibleSourceStock,
        ),
      visibleRackConstantFalse:
        rows.every(
          (row) =>
            !row.visibleRackStock,
        ),
      exactTextBA:
        shortcutBA(
          audit,
          "exact-report-text",
        ),
      tickBA:
        shortcutBA(
          audit,
          "absolute-tick-threshold",
        ),
      ordinalBA:
        shortcutBA(
          audit,
          "request-ordinal-threshold",
        ),
      heardCountBA:
        shortcutBA(
          audit,
          "prior-heard-count-threshold",
        ),
      bodyFingerprintOverlap,
      historyOracleExact:
        privateHistoryOracleMatchesRows(
          rows,
          supplyExperiences,
        ),
    };

    const temporalPass =
      temporalGate.rowCount >=
        20 &&
      temporalGate.positiveCount >=
        5 &&
      temporalGate.negativeCount >=
        5 &&
      temporalGate.holdingConstantFalse &&
      temporalGate.xConstant &&
      temporalGate.yConstant &&
      temporalGate.activityKindConstant &&
      temporalGate.activityPhaseConstant &&
      temporalGate.visibleSourceConstantFalse &&
      temporalGate.visibleRackConstantFalse &&
      temporalGate.exactTextBA <=
        0.55 &&
      temporalGate.tickBA < 0.9 &&
      temporalGate.ordinalBA <
        0.9 &&
      temporalGate.heardCountBA <
        0.9 &&
      temporalGate
        .bodyFingerprintOverlap
        .positive >= 5 &&
      temporalGate
        .bodyFingerprintOverlap
        .negative >= 5 &&
      temporalGate.historyOracleExact;

    const supplyFirst =
      firstIdaRequestExperience(
        runs[
          "supply-ideal"
        ]!.privateExperiences(),
      );
    const reserveFirst =
      firstIdaRequestExperience(
        runs[
          "reserve-purpose-aware"
        ]!.privateExperiences(),
      );

    const pairedStateEqual =
      supplyFirst !== null &&
      reserveFirst !== null &&
      JSON.stringify(
        nonPurposeFingerprint(
          supplyFirst,
        ),
      ) ===
        JSON.stringify(
          nonPurposeFingerprint(
            reserveFirst,
          ),
        );

    const firstTick =
      supplyFirst?.tick ??
      null;
    const supplyForwardedFirst =
      firstTick !== null &&
      runs[
        "supply-ideal"
      ]!
        .idaPolicyDebug()
        .forwardedTicks
        .includes(firstTick);
    const reserveForwardedFirst =
      firstTick !== null &&
      runs[
        "reserve-purpose-aware"
      ]!
        .idaPolicyDebug()
        .forwardedTicks
        .includes(firstTick);

    const purposeGate = {
      pairedStateEqual,
      firstTick,
      supplyForwardedFirst,
      reserveForwardedFirst,
      supplyProcessing:
        metrics[
          "supply-ideal"
        ]!
          .processingCompletedCount,
      reserveAwareProcessing:
        metrics[
          "reserve-purpose-aware"
        ]!
          .processingCompletedCount,
      reserveAwareDeficit:
        metrics[
          "reserve-purpose-aware"
        ]!
          .sourceReserveDeficitTicks,
      reserveBlindDeficit:
        metrics[
          "reserve-purpose-blind"
        ]!
          .sourceReserveDeficitTicks,
      reserveAwareForwards:
        metrics[
          "reserve-purpose-aware"
        ]!
          .idaForwardedCount,
      reserveBlindForwards:
        metrics[
          "reserve-purpose-blind"
        ]!
          .idaForwardedCount,
    };

    const purposePass =
      purposeGate.pairedStateEqual &&
      purposeGate.supplyForwardedFirst &&
      !purposeGate.reserveForwardedFirst &&
      purposeGate.supplyProcessing >
        purposeGate.reserveAwareProcessing &&
      purposeGate.reserveAwareDeficit <
        purposeGate.reserveBlindDeficit &&
      purposeGate.reserveAwareForwards <
        purposeGate.reserveBlindForwards;

    const duplicateGate = {
      idealForwards:
        metrics[
          "supply-ideal"
        ]!
          .idaForwardedCount,
      respondAllForwards:
        metrics[
          "supply-respond-all"
        ]!
          .idaForwardedCount,
      idealProcessing:
        metrics[
          "supply-ideal"
        ]!
          .processingCompletedCount,
      respondAllProcessing:
        metrics[
          "supply-respond-all"
        ]!
          .processingCompletedCount,
    };

    const duplicatePass =
      duplicateGate
        .respondAllForwards >
        duplicateGate
          .idealForwards &&
      duplicateGate
        .respondAllProcessing <=
        duplicateGate
          .idealProcessing +
          1;

    let classification:
      | "LISTENER_EFFECTOR_GROUNDING_FAIL"
      | "LISTENER_EFFECTOR_TEMPORAL_PRESSURE_FAIL"
      | "LISTENER_EFFECTOR_PURPOSE_PAIR_INVALID"
      | "LISTENER_EFFECTOR_PURPOSE_NOT_USEFUL"
      | "LISTENER_EFFECTOR_DUPLICATE_PRESSURE_INVALID"
      | "GROUNDED_LISTENER_EFFECTOR_PRESSURE_QUALIFIED";

    if (!groundingPass) {
      classification =
        "LISTENER_EFFECTOR_GROUNDING_FAIL";
    } else if (!temporalPass) {
      classification =
        "LISTENER_EFFECTOR_TEMPORAL_PRESSURE_FAIL";
    } else if (
      !purposeGate.pairedStateEqual
    ) {
      classification =
        "LISTENER_EFFECTOR_PURPOSE_PAIR_INVALID";
    } else if (!purposePass) {
      classification =
        "LISTENER_EFFECTOR_PURPOSE_NOT_USEFUL";
    } else if (!duplicatePass) {
      classification =
        "LISTENER_EFFECTOR_DUPLICATE_PRESSURE_INVALID";
    } else {
      classification =
        "GROUNDED_LISTENER_EFFECTOR_PRESSURE_QUALIFIED";
    }

    console.log(
      "R3_GROUNDED_LISTENER_EFFECTOR_PRESSURE " +
        JSON.stringify({
          metrics,
          janekGrounding,
          miraGrounding,
          groundingPass,
          temporalGate,
          temporalPass,
          purposeGate,
          purposePass,
          duplicateGate,
          duplicatePass,
          topShortcuts:
            audit.bestShortcuts.slice(
              0,
              10,
            ),
          rows,
          classification,
        }),
    );

    expect(
      MODES.every(
        (mode) =>
          metrics[
            mode
          ]!.ticks === 5400,
      ),
    ).toBe(true);
    expect(
      rows.length,
    ).toBeGreaterThan(0);
    expect(
      [
        "LISTENER_EFFECTOR_GROUNDING_FAIL",
        "LISTENER_EFFECTOR_TEMPORAL_PRESSURE_FAIL",
        "LISTENER_EFFECTOR_PURPOSE_PAIR_INVALID",
        "LISTENER_EFFECTOR_PURPOSE_NOT_USEFUL",
        "LISTENER_EFFECTOR_DUPLICATE_PRESSURE_INVALID",
        "GROUNDED_LISTENER_EFFECTOR_PRESSURE_QUALIFIED",
      ],
    ).toContain(
      classification,
    );
  }, 60_000);
});

function firstIdaRequestExperience(
  experiences:
    readonly ResidentPrivateExperience[],
): ResidentPrivateExperience | null {
  return (
    experiences.find(
      (experience) =>
        experience.residentId ===
          "resident:ida" &&
        experience.observation
          .heardEvents.some(
            (event) =>
              event.kind ===
                "speech" &&
              event.actorId ===
                "resident:janek" &&
              event.payload.text ===
                "The input rack is empty.",
          ),
    ) ?? null
  );
}

function nonPurposeFingerprint(
  experience:
    ResidentPrivateExperience,
): unknown {
  return {
    tick: experience.tick,
    activityBefore:
      experience.activityBefore,
    observation:
      experience.observation,
    memory:
      experience.memory,
  };
}

function maxBothClassFingerprintCounts(
  rows:
    readonly {
      listenerX: number;
      listenerY: number;
      holdingObject: boolean;
      activityKind: string;
      activityPhase: string;
      visibleRackStock: boolean;
      visibleSourceStock: boolean;
      updateWorthy: boolean;
    }[],
): {
  positive: number;
  negative: number;
} {
  const groups =
    new Map<
      string,
      {
        positive: number;
        negative: number;
      }
    >();

  for (const row of rows) {
    const key =
      JSON.stringify({
        x: row.listenerX,
        y: row.listenerY,
        holding:
          row.holdingObject,
        kind:
          row.activityKind,
        phase:
          row.activityPhase,
        rack:
          row.visibleRackStock,
        source:
          row.visibleSourceStock,
      });

    const group =
      groups.get(key) ?? {
        positive: 0,
        negative: 0,
      };

    if (row.updateWorthy) {
      group.positive += 1;
    } else {
      group.negative += 1;
    }

    groups.set(key, group);
  }

  return [...groups.values()]
    .sort(
      (left, right) =>
        Math.min(
          right.positive,
          right.negative,
        ) -
        Math.min(
          left.positive,
          left.negative,
        ),
    )[0] ?? {
    positive: 0,
    negative: 0,
  };
}

function shortcutBA(
  audit:
    ReturnType<
      typeof auditR3ListenerTemporalRows
    >,
  name: string,
): number {
  const item =
    audit.bestShortcuts.find(
      (candidate) =>
        candidate.name === name,
    );

  if (!item) {
    throw new Error(
      "missing shortcut: " +
        name,
    );
  }

  return item.balancedAccuracy;
}
