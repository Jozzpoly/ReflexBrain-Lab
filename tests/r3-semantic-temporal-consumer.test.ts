import { describe, expect, it } from "vitest";
import {
  createR3SemanticTemporalConsumerRun,
  R3_TEMPORAL_STATUS_MESSAGES,
  type R3TemporalConsumerMode,
  type R3TemporalReportState,
} from "../src/r3/semantic-temporal-consumer-run";

interface TemporalSummary {
  mode: R3TemporalConsumerMode;
  idaSpeechCount: number;
  janekAckCount: number;
  ordinaryWorkerDecisionTicks: number;
  activityIdentityChanges: number;
  processingCompleted: number;
  completeExposureCount: number;
  delayedExposureCount: number;
  firstSurfaceExposureCount: number;
  paraphraseExposureCount: number;
}

function classifyStatus(
  text: string,
): R3TemporalReportState | null {
  for (
    const state of [
      "complete",
      "delayed",
    ] as const
  ) {
    if (
      R3_TEMPORAL_STATUS_MESSAGES[
        state
      ].includes(
        text as never,
      )
    ) {
      return state;
    }
  }
  return null;
}

function summarize(
  mode: R3TemporalConsumerMode,
): TemporalSummary {
  const run =
    createR3SemanticTemporalConsumerRun({
      mode,
      pressureIntervalTicks: 12,
    });

  // 120 pressure slots = 40 complete three-slot report episodes.
  // One extra tick lets Janek privately observe the final emitted report.
  run.runTicks(1441);

  let ordinaryWorkerDecisionTicks = 0;
  let activityIdentityChanges = 0;
  let previousActivityId:
    string | null = null;
  let completeExposureCount = 0;
  let delayedExposureCount = 0;
  let firstSurfaceExposureCount = 0;
  let paraphraseExposureCount = 0;

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
      previousActivityId !== null &&
      activityId !==
        previousActivityId
    ) {
      activityIdentityChanges += 1;
    }
    previousActivityId =
      activityId;

    if (
      row.decision.activity?.kind !==
      "respond_to_status_change"
    ) {
      ordinaryWorkerDecisionTicks += 1;
    }

    for (
      const event of
        row.observation.heardEvents
    ) {
      if (
        event.kind !== "speech" ||
        event.actorId !==
          "resident:ida" ||
        typeof event.payload.text !==
          "string"
      ) {
        continue;
      }

      const text =
        event.payload.text;
      const state =
        classifyStatus(text);
      if (state === "complete") {
        completeExposureCount += 1;
      } else if (
        state === "delayed"
      ) {
        delayedExposureCount += 1;
      }

      if (
        state &&
        text ===
          R3_TEMPORAL_STATUS_MESSAGES[
            state
          ][0]
      ) {
        firstSurfaceExposureCount += 1;
      } else if (
        state &&
        text ===
          R3_TEMPORAL_STATUS_MESSAGES[
            state
          ][1]
      ) {
        paraphraseExposureCount += 1;
      }
    }
  }

  const events = run.allEvents();

  return {
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
            "Ida, status received.",
      ).length,
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
    completeExposureCount,
    delayedExposureCount,
    firstSurfaceExposureCount,
    paraphraseExposureCount,
  };
}

describe(
  "R3 temporal semantic consumer",
  () => {
    it("uses semantic settlement history to resolve changed status without re-acknowledging paraphrase duplicates", () => {
      const ignoreAll =
        summarize("ignore-all");
      const respondAll =
        summarize("respond-all");
      const exactText =
        summarize(
          "exact-text-change",
        );
      const semantic =
        summarize(
          "ideal-semantic-state-change",
        );

      for (const summary of [
        ignoreAll,
        respondAll,
        exactText,
        semantic,
      ]) {
        expect(
          summary.completeExposureCount,
        ).toBeGreaterThan(0);
        expect(
          summary.delayedExposureCount,
        ).toBeGreaterThan(0);
        expect(
          summary.paraphraseExposureCount,
        ).toBeGreaterThan(0);
      }

      // Every episode begins with a genuinely changed semantic state because
      // the source alternates complete/delayed. The ideal temporal oracle
      // acknowledges it once and ignores the semantically equivalent
      // restatement even though its text surface is different.
      expect(
        semantic.janekAckCount,
      ).toBe(40);

      // A missed semantic change remains unresolved and produces an extra
      // third World speech event in every episode.
      expect(
        ignoreAll.idaSpeechCount,
      ).toBe(120);
      expect(
        semantic.idaSpeechCount,
      ).toBe(80);
      expect(
        semantic.idaSpeechCount,
      ).toBeLessThan(
        ignoreAll.idaSpeechCount,
      );

      // Reacting to every surface resolves the required pressure but pays for
      // each paraphrase duplicate. Exact-text dedupe fails for the same reason:
      // the duplicate deliberately uses a different string.
      expect(
        respondAll.idaSpeechCount,
      ).toBe(
        semantic.idaSpeechCount,
      );
      expect(
        exactText.idaSpeechCount,
      ).toBe(
        semantic.idaSpeechCount,
      );
      expect(
        respondAll.janekAckCount,
      ).toBe(80);
      expect(
        exactText.janekAckCount,
      ).toBe(80);
      expect(
        semantic.janekAckCount,
      ).toBeLessThan(
        respondAll.janekAckCount,
      );
      expect(
        semantic.janekAckCount,
      ).toBeLessThan(
        exactText.janekAckCount,
      );

      // Semantic settlement preserves more ordinary work decision slots than
      // the two over-responsive controls. Throughput remains diagnostic only.
      expect(
        semantic.ordinaryWorkerDecisionTicks,
      ).toBeGreaterThan(
        respondAll.ordinaryWorkerDecisionTicks,
      );
      expect(
        semantic.ordinaryWorkerDecisionTicks,
      ).toBeGreaterThan(
        exactText.ordinaryWorkerDecisionTicks,
      );

      console.info(
        "R3_TEMPORAL_SEMANTIC_CONSUMER",
        JSON.stringify({
          ignoreAll,
          respondAll,
          exactText,
          semantic,
          exactClaim:
            "semantic state-change settlement resolves every new report state while suppressing paraphrased duplicates that exact-text dedupe cannot identify",
        }),
      );
    }, 30_000);
  },
);
