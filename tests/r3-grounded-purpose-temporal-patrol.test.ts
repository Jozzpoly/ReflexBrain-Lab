import {
  describe,
  expect,
  it,
} from "vitest";
import {
  createR3GroundedPatrolRun,
  type R3GroundedPatrolMode,
} from "../src/r3/grounded-purpose-temporal-patrol-run";
import {
  auditR3GroundedConsumerCorpus,
  buildR3GroundedConsumerCorpus,
} from "../src/r3/grounded-consumer-corpus-audit";
import {
  auditR3GroundedSpeechOpportunity,
} from "../src/r3/grounded-speech-opportunity";
import type {
  ResidentPrivateExperience,
} from "../src/r3/life-contracts";

const MODES:
  readonly R3GroundedPatrolMode[] = [
    "supply-ideal",
    "supply-respond-all",
    "reserve-purpose-aware",
    "reserve-purpose-blind",
  ];

describe("R3 grounded purpose temporal patrol pressure", () => {
  it("tests deconfounded temporal pressure and paired purpose causality without a learner", () => {
    const runs = Object.fromEntries(
      MODES.map((mode) => {
        const run = createR3GroundedPatrolRun(mode);
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

    const grounding = Object.fromEntries(
      MODES.map((mode) => {
        const audit =
          auditR3GroundedSpeechOpportunity(
            runs[mode]!.privateExperiences(),
          );
        return [
          mode,
          {
            requestCount: audit.requestCount,
            groundedRequestCount:
              audit.groundedRequestCount,
            groundedRate: audit.groundedRate,
          },
        ];
      }),
    );

    for (const mode of MODES) {
      expect(
        grounding[mode]!.groundedRequestCount,
      ).toBe(metrics[mode]!.requestCount);
      expect(
        grounding[mode]!.groundedRate,
      ).toBe(1);
    }

    const supplyRows =
      buildR3GroundedConsumerCorpus(
        runs["supply-ideal"]!.privateExperiences(),
        {
          currentRackStockBlocksUpdate: true,
        },
      );
    const supplyAudit =
      auditR3GroundedConsumerCorpus(
        supplyRows,
      );

    const phaseHasBoth =
      categoricalHasBoth(
        supplyRows,
        (row) => row.activityPhase,
      );
    const falseHoldingHasBoth =
      hasBothLabels(
        supplyRows.filter(
          (row) => !row.holdingObject,
        ),
      );
    const xBinHasBoth =
      categoricalHasBoth(
        supplyRows,
        (row) =>
          String(
            Math.floor(row.listenerX),
          ),
      );

    const phaseBA =
      shortcutBA(
        supplyAudit,
        "activity-phase",
      );
    const holdingBA =
      shortcutBA(
        supplyAudit,
        "holding-object",
      );
    const xBA =
      shortcutBA(
        supplyAudit,
        "listener-x-threshold",
      );
    const sourceStockBA =
      shortcutBA(
        supplyAudit,
        "visible-source-stock",
      );

    const supplyFirst =
      firstMiraRequestExperience(
        runs["supply-ideal"]!.privateExperiences(),
      );
    const reserveFirst =
      firstMiraRequestExperience(
        runs["reserve-purpose-aware"]!.privateExperiences(),
      );

    expect(supplyFirst).not.toBeNull();
    expect(reserveFirst).not.toBeNull();

    const pairedPurposeStateEqual =
      JSON.stringify(
        nonPurposeFingerprint(
          supplyFirst!,
        ),
      ) ===
      JSON.stringify(
        nonPurposeFingerprint(
          reserveFirst!,
        ),
      );

    const firstTick =
      supplyFirst!.tick;
    const supplyAcceptedFirst =
      runs[
        "supply-ideal"
      ]!
        .miraPolicyDebug()
        .acceptedReportTicks
        .includes(firstTick);
    const reserveAcceptedFirst =
      runs[
        "reserve-purpose-aware"
      ]!
        .miraPolicyDebug()
        .acceptedReportTicks
        .includes(firstTick);

    const temporalGate = {
      rowCount: supplyRows.length,
      positiveCount:
        supplyAudit.positiveCount,
      negativeCount:
        supplyAudit.negativeCount,
      phaseHasBoth,
      falseHoldingHasBoth,
      xBinHasBoth,
      phaseBA,
      holdingBA,
      xBA,
      sourceStockBA,
      pass:
        supplyRows.length >= 20 &&
        supplyAudit.positiveCount >= 5 &&
        supplyAudit.negativeCount >= 5 &&
        phaseHasBoth &&
        falseHoldingHasBoth &&
        xBinHasBoth &&
        phaseBA < 0.9 &&
        holdingBA < 0.9 &&
        xBA < 0.9 &&
        sourceStockBA < 0.9,
    };

    const purposeGate = {
      pairedPurposeStateEqual,
      firstTick,
      supplyAcceptedFirst,
      reserveAcceptedFirst,
      supplyProcessing:
        metrics["supply-ideal"]!
          .processingCompletedCount,
      reserveAwareProcessing:
        metrics["reserve-purpose-aware"]!
          .processingCompletedCount,
      reserveAwareDeficit:
        metrics["reserve-purpose-aware"]!
          .sourceReserveDeficitTicks,
      reserveBlindDeficit:
        metrics["reserve-purpose-blind"]!
          .sourceReserveDeficitTicks,
      reserveAwareAccepted:
        metrics["reserve-purpose-aware"]!
          .acceptedReportCount,
      reserveBlindAccepted:
        metrics["reserve-purpose-blind"]!
          .acceptedReportCount,
      pass:
        pairedPurposeStateEqual &&
        supplyAcceptedFirst &&
        !reserveAcceptedFirst &&
        metrics["supply-ideal"]!
          .processingCompletedCount >
          metrics["reserve-purpose-aware"]!
            .processingCompletedCount &&
        metrics["reserve-purpose-aware"]!
          .sourceReserveDeficitTicks <
          metrics["reserve-purpose-blind"]!
            .sourceReserveDeficitTicks &&
        metrics["reserve-purpose-aware"]!
          .acceptedReportCount <
          metrics["reserve-purpose-blind"]!
            .acceptedReportCount,
    };

    const classification =
      temporalGate.pass &&
      purposeGate.pass
        ? "GROUNDED_PURPOSE_TEMPORAL_PRESSURE_QUALIFIED"
        : "GROUNDED_PURPOSE_TEMPORAL_PRESSURE_FAIL";

    console.log(
      "R3_GROUNDED_PURPOSE_TEMPORAL_PATROL " +
        JSON.stringify({
          metrics,
          grounding,
          temporalGate,
          purposeGate,
          topShortcuts:
            supplyAudit.bestShortcuts.slice(
              0,
              8,
            ),
          supplyRows,
          classification,
        }),
    );

    if (!temporalGate.pass) {
      expect(classification).toBe(
        "GROUNDED_PURPOSE_TEMPORAL_PRESSURE_FAIL",
      );
      return;
    }

    if (!purposeGate.pass) {
      expect(classification).toBe(
        "GROUNDED_PURPOSE_TEMPORAL_PRESSURE_FAIL",
      );
      return;
    }

    expect(classification).toBe(
      "GROUNDED_PURPOSE_TEMPORAL_PRESSURE_QUALIFIED",
    );
  }, 30_000);
});

function firstMiraRequestExperience(
  experiences:
    readonly ResidentPrivateExperience[],
): ResidentPrivateExperience | null {
  return (
    experiences.find(
      (experience) =>
        experience.residentId ===
          "resident:mira" &&
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

function hasBothLabels(
  rows:
    readonly {
      updateWorthy: boolean;
    }[],
): boolean {
  return (
    rows.some(
      (row) =>
        row.updateWorthy,
    ) &&
    rows.some(
      (row) =>
        !row.updateWorthy,
    )
  );
}

function categoricalHasBoth<T>(
  rows:
    readonly {
      updateWorthy: boolean;
    }[],
  select:
    (row: any) => T,
): boolean {
  const byValue =
    new Map<
      T,
      {
        positive: boolean;
        negative: boolean;
      }
    >();

  for (const row of rows) {
    const value = select(row);
    const state =
      byValue.get(value) ?? {
        positive: false,
        negative: false,
      };

    if (row.updateWorthy) {
      state.positive = true;
    } else {
      state.negative = true;
    }

    byValue.set(value, state);
  }

  return [...byValue.values()].some(
    (state) =>
      state.positive &&
      state.negative,
  );
}

function shortcutBA(
  audit:
    ReturnType<
      typeof auditR3GroundedConsumerCorpus
    >,
  name: string,
): number {
  const result =
    audit.bestShortcuts.find(
      (item) =>
        item.name === name,
    );

  if (!result) {
    throw new Error(
      "missing shortcut: " +
        name,
    );
  }

  return result.balancedAccuracy;
}
