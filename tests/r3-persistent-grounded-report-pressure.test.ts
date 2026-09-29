import {
  describe,
  expect,
  it,
} from "vitest";
import {
  createR3PersistentGroundedReportRun,
} from "../src/r3/grounded-persistent-report-run";
import {
  auditR3PersistentModuloShortcuts,
} from "../src/r3/grounded-persistent-report-audit";
import {
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

describe("R3 persistent grounded report pressure", () => {
  it("tests persistent same-surface redundancy without listener body leakage", () => {
    const runs = Object.fromEntries(
      MODES.map((mode) => {
        const run =
          createR3PersistentGroundedReportRun(
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
    const modulo =
      auditR3PersistentModuloShortcuts(
        rows,
      );

    const fingerprint =
      exactBodyFingerprintCounts(
        rows,
      );

    const listenerGate = {
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
      knownRawBeliefConstant:
        new Set(
          rows.map(
            (row) =>
              row.knownRawBeliefCount,
          ),
        ).size === 1,
    };

    const listenerPass =
      Object.values(
        listenerGate,
      ).every(Boolean);

    const temporalGate = {
      rowCount:
        rows.length,
      positiveCount:
        audit.positiveCount,
      negativeCount:
        audit.negativeCount,
      sharedFingerprintPositive:
        fingerprint.positive,
      sharedFingerprintNegative:
        fingerprint.negative,
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
      knownRawBeliefBA:
        shortcutBA(
          audit,
          "known-raw-belief-count",
        ),
      historyOracleExact:
        privateHistoryOracleMatchesRows(
          rows,
          supplyExperiences,
        ),
      modulo,
      maxModuloBA:
        modulo.length > 0
          ? Math.max(
              ...modulo.map(
                (item) =>
                  item.balancedAccuracy,
              ),
            )
          : null,
    };

    const temporalPass =
      temporalGate.rowCount >= 30 &&
      temporalGate.positiveCount >= 8 &&
      temporalGate.negativeCount >= 8 &&
      temporalGate
        .sharedFingerprintPositive >=
        8 &&
      temporalGate
        .sharedFingerprintNegative >=
        8 &&
      temporalGate.exactTextBA <=
        0.55 &&
      temporalGate.tickBA <
        0.8 &&
      temporalGate.ordinalBA <
        0.8 &&
      temporalGate.heardCountBA <
        0.8 &&
      temporalGate.knownRawBeliefBA <=
        0.55 &&
      temporalGate.historyOracleExact &&
      temporalGate.maxModuloBA !==
        null &&
      temporalGate.maxModuloBA <
        0.85;

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

    const purposeGate = {
      pairedStateEqual,
      firstTick,
      supplyForwardedFirst:
        firstTick !== null &&
        runs[
          "supply-ideal"
        ]!
          .idaPolicyDebug()
          .forwardedTicks
          .includes(firstTick),
      reserveForwardedFirst:
        firstTick !== null &&
        runs[
          "reserve-purpose-aware"
        ]!
          .idaPolicyDebug()
          .forwardedTicks
          .includes(firstTick),
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
      respondAllAcceptedJobs:
        metrics[
          "supply-respond-all"
        ]!
          .miraAcceptedForwardCount,
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
          1 &&
      duplicateGate
        .respondAllAcceptedJobs <
        duplicateGate
          .respondAllForwards;

    let classification:
      | "PERSISTENT_GROUNDED_REPORT_GROUNDING_FAIL"
      | "PERSISTENT_GROUNDED_REPORT_LISTENER_LEAK"
      | "PERSISTENT_GROUNDED_REPORT_TEMPORAL_FAIL"
      | "PERSISTENT_PURPOSE_PAIR_INVALID"
      | "PERSISTENT_PURPOSE_NOT_USEFUL"
      | "PERSISTENT_DUPLICATE_PRESSURE_INVALID"
      | "GROUNDED_PERSISTENT_REPORT_PRESSURE_QUALIFIED";

    if (!groundingPass) {
      classification =
        "PERSISTENT_GROUNDED_REPORT_GROUNDING_FAIL";
    } else if (!listenerPass) {
      classification =
        "PERSISTENT_GROUNDED_REPORT_LISTENER_LEAK";
    } else if (!temporalPass) {
      classification =
        "PERSISTENT_GROUNDED_REPORT_TEMPORAL_FAIL";
    } else if (
      !purposeGate.pairedStateEqual
    ) {
      classification =
        "PERSISTENT_PURPOSE_PAIR_INVALID";
    } else if (!purposePass) {
      classification =
        "PERSISTENT_PURPOSE_NOT_USEFUL";
    } else if (!duplicatePass) {
      classification =
        "PERSISTENT_DUPLICATE_PRESSURE_INVALID";
    } else {
      classification =
        "GROUNDED_PERSISTENT_REPORT_PRESSURE_QUALIFIED";
    }

    console.log(
      "R3_PERSISTENT_GROUNDED_REPORT_PRESSURE " +
        JSON.stringify({
          metrics,
          janekGrounding,
          miraGrounding,
          groundingPass,
          listenerGate,
          listenerPass,
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
      rows.length,
    ).toBeGreaterThan(0);
    expect(
      [
        "PERSISTENT_GROUNDED_REPORT_GROUNDING_FAIL",
        "PERSISTENT_GROUNDED_REPORT_LISTENER_LEAK",
        "PERSISTENT_GROUNDED_REPORT_TEMPORAL_FAIL",
        "PERSISTENT_PURPOSE_PAIR_INVALID",
        "PERSISTENT_PURPOSE_NOT_USEFUL",
        "PERSISTENT_DUPLICATE_PRESSURE_INVALID",
        "GROUNDED_PERSISTENT_REPORT_PRESSURE_QUALIFIED",
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
    tick:
      experience.tick,
    activityBefore:
      experience.activityBefore,
    observation:
      experience.observation,
    memory:
      experience.memory,
  };
}

function exactBodyFingerprintCounts(
  rows:
    readonly {
      listenerX: number;
      listenerY: number;
      holdingObject: boolean;
      activityKind: string;
      activityPhase: string;
      visibleRackStock: boolean;
      visibleSourceStock: boolean;
      knownRawBeliefCount: number;
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
        rawBeliefs:
          row.knownRawBeliefCount,
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

    groups.set(
      key,
      group,
    );
  }

  return (
    [...groups.values()]
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
    }
  );
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
