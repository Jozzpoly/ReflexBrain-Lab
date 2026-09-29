import { describe, expect, it } from "vitest";
import {
  createR3JointSemanticTemporalRun,
  R3_JOINT_STATUS_MESSAGES,
  r3JointPurposeMatters,
  type R3JointSemanticDomain,
  type R3JointSemanticState,
  type R3JointSemanticTemporalMode,
} from "../src/r3/joint-semantic-temporal-consumer-run";
import {
  MIXED_PRESSURE_MATTER_IDS,
} from "../src/r3/mixed-pressure-fixture-policy";

interface JointConsumerSummary {
  purposeDomain: R3JointSemanticDomain;
  mode: R3JointSemanticTemporalMode;
  idaSpeechCount: number;
  janekAckCount: number;
  decoyExposureCount: number;
  decoyResponseCount: number;
  requiredParaphraseExposureCount: number;
  requiredParaphraseResponseCount: number;
  ordinaryWorkerDecisionTicks: number;
  activityIdentityChanges: number;
  processingCompleted: number;
}

function classifyMessage(
  text: string,
):
  | {
      domain: R3JointSemanticDomain;
      state: R3JointSemanticState;
      variant: 0 | 1;
    }
  | null {
  for (
    const domain of [
      "depot",
      "courtyard",
    ] as const
  ) {
    for (
      const state of [
        "complete",
        "delayed",
        "suspended",
      ] as const
    ) {
      const messages =
        R3_JOINT_STATUS_MESSAGES[
          domain
        ][state];
      if (text === messages[0]) {
        return {
          domain,
          state,
          variant: 0,
        };
      }
      if (text === messages[1]) {
        return {
          domain,
          state,
          variant: 1,
        };
      }
    }
  }

  return null;
}

function summarize(
  purposeDomain:
    R3JointSemanticDomain,
  mode:
    R3JointSemanticTemporalMode,
): JointConsumerSummary {
  const run =
    createR3JointSemanticTemporalRun({
      mode,
      purposeDomain,
      pressureIntervalTicks: 12,
    });

  // 100 pressure slots plus one perception tick for the final emitted event.
  run.runTicks(1201);

  let decoyExposureCount = 0;
  let decoyResponseCount = 0;
  let requiredParaphraseExposureCount = 0;
  let requiredParaphraseResponseCount = 0;
  let ordinaryWorkerDecisionTicks = 0;
  let activityIdentityChanges = 0;
  let previousActivityId:
    string | null = null;

  for (
    const row of run.privateExperiences()
  ) {
    if (
      row.residentId !==
      "resident:janek"
    ) {
      continue;
    }

    const activityId =
      row.decision.activity?.id ??
      null;
    if (
      previousActivityId !==
        null &&
      activityId !==
        previousActivityId
    ) {
      activityIdentityChanges += 1;
    }
    previousActivityId =
      activityId;

    const responding =
      row.decision.activity?.kind ===
      "respond_to_joint_semantic_pressure";
    if (!responding) {
      ordinaryWorkerDecisionTicks += 1;
    }

    const heard =
      row.observation.heardEvents.find(
        (event) =>
          event.kind === "speech" &&
          event.actorId ===
            "resident:ida" &&
          typeof event.payload.text ===
            "string",
      );
    if (!heard) continue;

    const meaning =
      classifyMessage(
        heard.payload.text as string,
      );
    expect(meaning).not.toBeNull();
    if (!meaning) continue;

    if (
      meaning.domain !==
      purposeDomain
    ) {
      decoyExposureCount += 1;
      if (responding) {
        decoyResponseCount += 1;
      }
    }

    if (
      meaning.domain ===
        purposeDomain &&
      meaning.variant === 1
    ) {
      requiredParaphraseExposureCount += 1;
      if (responding) {
        requiredParaphraseResponseCount += 1;
      }
    }
  }

  const events =
    run.allEvents();

  return {
    purposeDomain,
    mode,
    idaSpeechCount:
      events.filter(
        (event) =>
          event.kind === "speech" &&
          event.actorId ===
            "resident:ida",
      ).length,
    janekAckCount:
      events.filter(
        (event) =>
          event.kind === "speech" &&
          event.actorId ===
            "resident:janek" &&
          event.payload.text ===
            "Ida, joint status received.",
      ).length,
    decoyExposureCount,
    decoyResponseCount,
    requiredParaphraseExposureCount,
    requiredParaphraseResponseCount,
    ordinaryWorkerDecisionTicks,
    activityIdentityChanges,
    processingCompleted:
      events.filter(
        (event) =>
          event.kind ===
            "processing_completed" &&
          event.actorId ===
            "resident:janek",
      ).length,
  };
}

function aggregate(
  ...summaries:
    readonly JointConsumerSummary[]
) {
  return summaries.reduce(
    (total, summary) => ({
      idaSpeechCount:
        total.idaSpeechCount +
        summary.idaSpeechCount,
      janekAckCount:
        total.janekAckCount +
        summary.janekAckCount,
      decoyExposureCount:
        total.decoyExposureCount +
        summary.decoyExposureCount,
      decoyResponseCount:
        total.decoyResponseCount +
        summary.decoyResponseCount,
      requiredParaphraseExposureCount:
        total.requiredParaphraseExposureCount +
        summary.requiredParaphraseExposureCount,
      requiredParaphraseResponseCount:
        total.requiredParaphraseResponseCount +
        summary.requiredParaphraseResponseCount,
      ordinaryWorkerDecisionTicks:
        total.ordinaryWorkerDecisionTicks +
        summary.ordinaryWorkerDecisionTicks,
      activityIdentityChanges:
        total.activityIdentityChanges +
        summary.activityIdentityChanges,
      processingCompleted:
        total.processingCompleted +
        summary.processingCompleted,
    }),
    {
      idaSpeechCount: 0,
      janekAckCount: 0,
      decoyExposureCount: 0,
      decoyResponseCount: 0,
      requiredParaphraseExposureCount: 0,
      requiredParaphraseResponseCount: 0,
      ordinaryWorkerDecisionTicks: 0,
      activityIdentityChanges: 0,
      processingCompleted: 0,
    },
  );
}

describe(
  "R3 joint purpose × history × evidence consumer",
  () => {
    it("keeps the same matter id while purpose meaning changes", () => {
      const depot =
        r3JointPurposeMatters(
          "depot",
        );
      const courtyard =
        r3JointPurposeMatters(
          "courtyard",
        );

      expect(
        depot.map(
          (matter) => matter.id,
        ),
      ).toEqual(
        courtyard.map(
          (matter) => matter.id,
        ),
      );

      const depotReport =
        depot.find(
          (matter) =>
            matter.id ===
            MIXED_PRESSURE_MATTER_IDS.reportResponse,
        )!;
      const courtyardReport =
        courtyard.find(
          (matter) =>
            matter.id ===
            MIXED_PRESSURE_MATTER_IDS.reportResponse,
        )!;

      expect(
        depotReport.statement,
      ).not.toBe(
        courtyardReport.statement,
      );
    });

    it("requires purpose, settled semantic history and current evidence together to minimize unresolved pressure and unnecessary responses", () => {
      const modes:
        readonly R3JointSemanticTemporalMode[] =
        [
          "ignore-all",
          "respond-all",
          "purpose-only",
          "temporal-only",
          "exact-text-purpose",
          "ideal-joint-oracle",
        ];

      const summaries =
        new Map<
          R3JointSemanticTemporalMode,
          ReturnType<typeof aggregate>
        >();

      for (const mode of modes) {
        summaries.set(
          mode,
          aggregate(
            summarize(
              "depot",
              mode,
            ),
            summarize(
              "courtyard",
              mode,
            ),
          ),
        );
      }

      const ignore =
        summaries.get(
          "ignore-all",
        )!;
      const respondAll =
        summaries.get(
          "respond-all",
        )!;
      const purposeOnly =
        summaries.get(
          "purpose-only",
        )!;
      const temporalOnly =
        summaries.get(
          "temporal-only",
        )!;
      const exactTextPurpose =
        summaries.get(
          "exact-text-purpose",
        )!;
      const ideal =
        summaries.get(
          "ideal-joint-oracle",
        )!;

      expect(
        ideal.decoyResponseCount,
      ).toBe(0);
      expect(
        ideal.requiredParaphraseResponseCount,
      ).toBe(0);

      // Missing current semantic applicability leaves recurring required
      // pressure unresolved.
      expect(
        ideal.idaSpeechCount,
      ).toBeLessThan(
        ignore.idaSpeechCount,
      );

      // Purpose without settled semantic history responds again to the
      // paraphrased restatement.
      expect(
        purposeOnly.decoyResponseCount,
      ).toBe(0);
      expect(
        purposeOnly.requiredParaphraseResponseCount,
      ).toBe(
        purposeOnly.requiredParaphraseExposureCount,
      );
      expect(
        ideal.janekAckCount,
      ).toBeLessThan(
        purposeOnly.janekAckCount,
      );

      // Exact-text memory plus purpose still cannot recognize semantic
      // equivalence across paraphrases.
      expect(
        exactTextPurpose.decoyResponseCount,
      ).toBe(0);
      expect(
        exactTextPurpose.requiredParaphraseResponseCount,
      ).toBe(
        exactTextPurpose.requiredParaphraseExposureCount,
      );
      expect(
        ideal.janekAckCount,
      ).toBeLessThan(
        exactTextPurpose.janekAckCount,
      );

      // Temporal state-change without private purpose spends responses on the
      // semantically changing decoy domain.
      expect(
        temporalOnly.decoyResponseCount,
      ).toBeGreaterThan(0);
      expect(
        ideal.decoyResponseCount,
      ).toBeLessThan(
        temporalOnly.decoyResponseCount,
      );

      // Respond-all pays both error classes.
      expect(
        respondAll.decoyResponseCount,
      ).toBeGreaterThan(0);
      expect(
        respondAll.requiredParaphraseResponseCount,
      ).toBeGreaterThan(0);
      expect(
        ideal.janekAckCount,
      ).toBeLessThan(
        respondAll.janekAckCount,
      );

      // The ideal relation preserves more ordinary worker decision slots than
      // every over-responsive partial semantic rule.
      for (const partial of [
        purposeOnly,
        temporalOnly,
        exactTextPurpose,
        respondAll,
      ]) {
        expect(
          ideal.ordinaryWorkerDecisionTicks,
        ).toBeGreaterThan(
          partial.ordinaryWorkerDecisionTicks,
        );
      }

      // Throughput is diagnostic only; semantic utility must not be claimed
      // from production count.
      expect(
        ideal.processingCompleted,
      ).toBeGreaterThanOrEqual(
        respondAll.processingCompleted,
      );

      console.info(
        "R3_JOINT_SEMANTIC_TEMPORAL_CONSUMER",
        JSON.stringify({
          ignore,
          respondAll,
          purposeOnly,
          temporalOnly,
          exactTextPurpose,
          ideal,
          exactClaim:
            "ideal purpose×settled-history×current-evidence routing resolves required pressure while avoiding both irrelevant-domain responses and paraphrased duplicate acknowledgements",
        }),
      );
    }, 40_000);
  },
);
