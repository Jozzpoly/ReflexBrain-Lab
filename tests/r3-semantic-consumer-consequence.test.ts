import { describe, expect, it } from "vitest";
import {
  createR3SemanticConsumerRun,
  R3_SEMANTIC_PRESSURE_MESSAGES,
  type R3SemanticConsumerMode,
  type R3SemanticDomain,
} from "../src/r3/semantic-consumer-oracle-run";
import {
  MIXED_PRESSURE_MATTER_IDS,
  r3MixedPressureJanekMatters,
} from "../src/r3/mixed-pressure-fixture-policy";

interface ConsequenceSummary {
  domain: R3SemanticDomain;
  mode: R3SemanticConsumerMode;
  requiredExposureCount: number;
  decoyExposureCount: number;
  requiredResponseCount: number;
  decoyResponseCount: number;
  idaSpeechCount: number;
  janekAckCount: number;
  ordinaryWorkerDecisionTicks: number;
  activityIdentityChanges: number;
  processingCompleted: number;
}

function mattersForDomain(
  domain: R3SemanticDomain,
) {
  return r3MixedPressureJanekMatters(
    "baseline",
  ).map((matter) =>
    matter.id ===
    MIXED_PRESSURE_MATTER_IDS.reportResponse
      ? {
          ...matter,
          statement:
            domain === "depot"
              ? "acknowledge depot inspection status reports when they arrive"
              : "acknowledge courtyard flower condition reports when they arrive",
        }
      : structuredClone(matter),
  );
}

function messageForDomain(
  domain: R3SemanticDomain,
): string {
  return domain === "depot"
    ? R3_SEMANTIC_PRESSURE_MESSAGES.relevant
    : R3_SEMANTIC_PRESSURE_MESSAGES.irrelevant;
}

function summarize(
  domain: R3SemanticDomain,
  mode: R3SemanticConsumerMode,
): ConsequenceSummary {
  const run = createR3SemanticConsumerRun({
    mode,
    pressureRegime: "persistent-relevant",
    requiredDomain: domain,
    messageIntervalTicks: 12,
    janekMatterOverrides:
      mattersForDomain(domain),
  });

  // 100 pressure slots + one perception tick for the final speech.
  run.runTicks(1201);

  const requiredMessage =
    messageForDomain(domain);
  const decoyMessage =
    messageForDomain(
      domain === "depot"
        ? "courtyard"
        : "depot",
    );

  let requiredExposureCount = 0;
  let decoyExposureCount = 0;
  let requiredResponseCount = 0;
  let decoyResponseCount = 0;
  let ordinaryWorkerDecisionTicks = 0;
  let activityIdentityChanges = 0;
  let previousActivityId: string | null = null;

  for (
    const row of run.privateExperiences()
  ) {
    if (
      row.residentId !== "resident:janek"
    ) {
      continue;
    }

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

    const text =
      heard.payload.text as string;
    if (text === requiredMessage) {
      requiredExposureCount += 1;
      if (responding) {
        requiredResponseCount += 1;
      }
    } else if (text === decoyMessage) {
      decoyExposureCount += 1;
      if (responding) {
        decoyResponseCount += 1;
      }
    }
  }

  const events = run.allEvents();

  return {
    domain,
    mode,
    requiredExposureCount,
    decoyExposureCount,
    requiredResponseCount,
    decoyResponseCount,
    idaSpeechCount: events.filter(
      (event) =>
        event.kind === "speech" &&
        event.actorId ===
          "resident:ida",
    ).length,
    janekAckCount: events.filter(
      (event) =>
        event.kind === "speech" &&
        event.actorId ===
          "resident:janek" &&
        event.payload.text ===
          "Ida, received.",
    ).length,
    ordinaryWorkerDecisionTicks,
    activityIdentityChanges,
    processingCompleted: events.filter(
      (event) =>
        event.kind ===
          "processing_completed" &&
        event.actorId ===
          "resident:janek",
    ).length,
  };
}

function aggregate(
  ...summaries: readonly ConsequenceSummary[]
) {
  return summaries.reduce(
    (total, summary) => ({
      requiredExposureCount:
        total.requiredExposureCount +
        summary.requiredExposureCount,
      decoyExposureCount:
        total.decoyExposureCount +
        summary.decoyExposureCount,
      requiredResponseCount:
        total.requiredResponseCount +
        summary.requiredResponseCount,
      decoyResponseCount:
        total.decoyResponseCount +
        summary.decoyResponseCount,
      idaSpeechCount:
        total.idaSpeechCount +
        summary.idaSpeechCount,
      janekAckCount:
        total.janekAckCount +
        summary.janekAckCount,
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
      requiredExposureCount: 0,
      decoyExposureCount: 0,
      requiredResponseCount: 0,
      decoyResponseCount: 0,
      idaSpeechCount: 0,
      janekAckCount: 0,
      ordinaryWorkerDecisionTicks: 0,
      activityIdentityChanges: 0,
      processingCompleted: 0,
    },
  );
}

describe(
  "R3 semantic consumer causal consequence",
  () => {
    it("lets a joint semantic relation resolve required pressure without paying respond-all or fixed-surface costs", () => {
      const depotOracle = summarize(
        "depot",
        "ideal-semantic-oracle",
      );
      const courtyardOracle = summarize(
        "courtyard",
        "ideal-semantic-oracle",
      );

      const depotIgnore = summarize(
        "depot",
        "ignore-all",
      );
      const courtyardIgnore = summarize(
        "courtyard",
        "ignore-all",
      );

      const depotRespondAll = summarize(
        "depot",
        "respond-all",
      );
      const courtyardRespondAll = summarize(
        "courtyard",
        "respond-all",
      );

      const depotSurfaceDepot = summarize(
        "depot",
        "surface-depot-only",
      );
      const courtyardSurfaceDepot = summarize(
        "courtyard",
        "surface-depot-only",
      );

      const depotSurfaceCourtyard = summarize(
        "depot",
        "surface-courtyard-only",
      );
      const courtyardSurfaceCourtyard = summarize(
        "courtyard",
        "surface-courtyard-only",
      );

      for (const oracle of [
        depotOracle,
        courtyardOracle,
      ]) {
        expect(
          oracle.requiredResponseCount,
        ).toBe(
          oracle.requiredExposureCount,
        );
        expect(
          oracle.decoyResponseCount,
        ).toBe(0);
      }

      const oracle = aggregate(
        depotOracle,
        courtyardOracle,
      );
      const ignoreAll = aggregate(
        depotIgnore,
        courtyardIgnore,
      );
      const respondAll = aggregate(
        depotRespondAll,
        courtyardRespondAll,
      );
      const surfaceDepot = aggregate(
        depotSurfaceDepot,
        courtyardSurfaceDepot,
      );
      const surfaceCourtyard = aggregate(
        depotSurfaceCourtyard,
        courtyardSurfaceCourtyard,
      );

      // Ignoring required meaning leaves autonomous pressure unresolved,
      // so Ida must emit extra required-report World events.
      expect(
        oracle.idaSpeechCount,
      ).toBeLessThan(
        ignoreAll.idaSpeechCount,
      );

      // Respond-all resolves the required reports too, but pays for every
      // decoy with an unnecessary acknowledgement/interruption.
      expect(
        oracle.idaSpeechCount,
      ).toBe(
        respondAll.idaSpeechCount,
      );
      expect(
        oracle.janekAckCount,
      ).toBeLessThan(
        respondAll.janekAckCount,
      );
      expect(
        oracle.decoyResponseCount,
      ).toBe(0);
      expect(
        respondAll.decoyResponseCount,
      ).toBeGreaterThan(0);

      // A fixed surface rule works in only one semantic world. Across both
      // same-id matter meanings it leaves more required pressure unresolved
      // and also spends responses on the wrong surface in the other world.
      for (const surface of [
        surfaceDepot,
        surfaceCourtyard,
      ]) {
        expect(
          oracle.idaSpeechCount,
        ).toBeLessThan(
          surface.idaSpeechCount,
        );
        expect(
          oracle.requiredResponseCount,
        ).toBeGreaterThan(
          surface.requiredResponseCount,
        );
        expect(
          oracle.decoyResponseCount,
        ).toBeLessThan(
          surface.decoyResponseCount,
        );
      }

      console.info(
        "R3_SEMANTIC_CONSUMER_CAUSAL_CONSEQUENCE",
        JSON.stringify({
          oracle,
          ignoreAll,
          respondAll,
          surfaceDepot,
          surfaceCourtyard,
          exactClaim:
            "ideal joint semantic routing resolves recurring required pressure across both same-id matter meanings while avoiding respond-all decoy interruptions",
        }),
      );
    }, 30_000);
  },
);
