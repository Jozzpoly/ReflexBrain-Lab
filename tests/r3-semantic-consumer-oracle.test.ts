import { describe, expect, it } from "vitest";
import {
  createR3SemanticConsumerRun,
  R3_SEMANTIC_PRESSURE_MESSAGES,
  type R3SemanticConsumerMode,
} from "../src/r3/semantic-consumer-oracle-run";

interface ConsumerSummary {
  mode: R3SemanticConsumerMode;
  relevantExposureCount: number;
  irrelevantExposureCount: number;
  relevantResponseCount: number;
  irrelevantResponseCount: number;
  ordinaryWorkerDecisionTicks: number;
  activityIdentityChanges: number;
  processingCompleted: number;
  pressureTimeline: readonly {
    tick: number;
    text: string;
  }[];
}

function summarize(
  mode: R3SemanticConsumerMode,
): ConsumerSummary {
  const run = createR3SemanticConsumerRun({
    mode,
    messageIntervalTicks: 16,
  });
  // One extra perception tick lets Janek observe the final pressure event.
  run.runTicks(1601);

  const janek = run
    .privateExperiences()
    .filter(
      (experience) =>
        experience.residentId ===
        "resident:janek",
    );

  let relevantExposureCount = 0;
  let irrelevantExposureCount = 0;
  let relevantResponseCount = 0;
  let irrelevantResponseCount = 0;
  let ordinaryWorkerDecisionTicks = 0;
  let activityIdentityChanges = 0;
  let previousActivityId: string | null = null;

  for (const row of janek) {
    const activityId =
      row.decision.activity?.id ?? null;
    if (
      previousActivityId !== null &&
      activityId !== previousActivityId
    ) {
      activityIdentityChanges += 1;
    }
    previousActivityId = activityId;

    const responding =
      row.decision.activity?.kind ===
      "respond_to_semantic_pressure";
    if (!responding) {
      ordinaryWorkerDecisionTicks += 1;
    }

    const heard = row.observation.heardEvents.find(
      (event) =>
        event.kind === "speech" &&
        event.actorId === "resident:ida" &&
        typeof event.payload.text === "string",
    );
    if (!heard) continue;

    const text = heard.payload.text as string;
    if (
      text ===
      R3_SEMANTIC_PRESSURE_MESSAGES.relevant
    ) {
      relevantExposureCount += 1;
      if (responding) relevantResponseCount += 1;
    } else if (
      text ===
      R3_SEMANTIC_PRESSURE_MESSAGES.irrelevant
    ) {
      irrelevantExposureCount += 1;
      if (responding) irrelevantResponseCount += 1;
    }
  }

  const pressureTimeline = run
    .allEvents()
    .filter(
      (event) =>
        event.kind === "speech" &&
        event.actorId === "resident:ida" &&
        typeof event.payload.text === "string",
    )
    .map((event) => ({
      tick: event.tick,
      text: event.payload.text as string,
    }));

  return {
    mode,
    relevantExposureCount,
    irrelevantExposureCount,
    relevantResponseCount,
    irrelevantResponseCount,
    ordinaryWorkerDecisionTicks,
    activityIdentityChanges,
    processingCompleted: run
      .allEvents()
      .filter(
        (event) =>
          event.kind ===
          "processing_completed" &&
          event.actorId === "resident:janek",
      ).length,
    pressureTimeline,
  };
}

describe("R3 semantic consumer oracle feasibility", () => {
  it("shows that ideal actor-private semantic selectivity has a bounded downstream consumer advantage over ignore-all and respond-all", () => {
    // Execute independently/sequentially so disposable fixture globals reset
    // cleanly at each paired-run boundary.
    const ignoreAll = summarize("ignore-all");
    const respondAll = summarize("respond-all");
    const cadenceOnly = summarize("cadence-only");
    const oracle = summarize(
      "ideal-semantic-oracle",
    );

    expect(respondAll.pressureTimeline).toEqual(
      ignoreAll.pressureTimeline,
    );
    expect(cadenceOnly.pressureTimeline).toEqual(
      ignoreAll.pressureTimeline,
    );
    expect(oracle.pressureTimeline).toEqual(
      ignoreAll.pressureTimeline,
    );

    for (const summary of [
      ignoreAll,
      respondAll,
      cadenceOnly,
      oracle,
    ]) {
      expect(
        summary.relevantExposureCount,
      ).toBeGreaterThan(20);
      expect(
        summary.irrelevantExposureCount,
      ).toBe(summary.relevantExposureCount);
    }

    expect(ignoreAll.relevantResponseCount).toBe(0);
    expect(ignoreAll.irrelevantResponseCount).toBe(0);

    expect(respondAll.relevantResponseCount).toBe(
      respondAll.relevantExposureCount,
    );
    expect(respondAll.irrelevantResponseCount).toBe(
      respondAll.irrelevantExposureCount,
    );

    expect(
      cadenceOnly.relevantResponseCount,
    ).toBeGreaterThan(0);
    expect(
      cadenceOnly.relevantResponseCount,
    ).toBeLessThan(
      cadenceOnly.relevantExposureCount,
    );
    expect(
      cadenceOnly.irrelevantResponseCount,
    ).toBeGreaterThan(0);

    expect(oracle.relevantResponseCount).toBe(
      oracle.relevantExposureCount,
    );
    expect(oracle.irrelevantResponseCount).toBe(0);

    // Cadence-only spends the same response budget as the oracle but cannot
    // allocate it by meaning under the irregular balanced pressure pattern.
    expect(
      cadenceOnly.relevantResponseCount +
        cadenceOnly.irrelevantResponseCount,
    ).toBe(
      oracle.relevantResponseCount +
        oracle.irrelevantResponseCount,
    );
    expect(
      oracle.relevantResponseCount,
    ).toBeGreaterThan(
      cadenceOnly.relevantResponseCount,
    );
    expect(
      oracle.irrelevantResponseCount,
    ).toBeLessThan(
      cadenceOnly.irrelevantResponseCount,
    );

    // The semantic consumer preserves the useful response behavior of
    // respond-all while avoiding its irrelevant interruption cost.
    expect(
      oracle.ordinaryWorkerDecisionTicks,
    ).toBeGreaterThan(
      respondAll.ordinaryWorkerDecisionTicks,
    );
    expect(
      oracle.activityIdentityChanges,
    ).toBeLessThan(
      respondAll.activityIdentityChanges,
    );

    // It also preserves the relevant response behavior that ignore-all loses.
    expect(
      oracle.relevantResponseCount,
    ).toBeGreaterThan(
      ignoreAll.relevantResponseCount,
    );

    // Throughput is a secondary diagnostic, not the qualification target.
    expect(oracle.processingCompleted).toBeGreaterThanOrEqual(
      respondAll.processingCompleted,
    );

    console.info(
      "R3_SEMANTIC_CONSUMER_ORACLE",
      JSON.stringify({
        ignoreAll,
        respondAll,
        cadenceOnly,
        oracle,
      }),
    );
  }, 30_000);
});
