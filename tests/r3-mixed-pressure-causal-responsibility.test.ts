import { describe, expect, it } from "vitest";
import {
  auditR3MixedPressureCausalResponsibility,
  auditR3MixedPressureContextShortcuts,
  buildR3MixedPressureCausalCorpus,
} from "../src/r3/mixed-pressure-causal-responsibility";
import {
  MIXED_PRESSURE_MATTER_IDS,
  r3MixedPressureJanekMatters,
} from "../src/r3/mixed-pressure-fixture-policy";
import {
  createR3MixedPressureRun,
} from "../src/r3/mixed-pressure-run";
import {
  MATERIAL_FIXTURE_MATTER_IDS,
} from "../src/r3/life-fixture-policies";

describe("R3 mixed-pressure causal responsibility", () => {
  const corpus =
    buildR3MixedPressureCausalCorpus({
      scanTicks: 700,
      historyLength: 8,
      maxPerMatter: 6,
    });

  it("switches causal responsibility between two simultaneous Janek matters inside one ecology", () => {
    for (const wording of [
      "baseline",
      "paraphrase",
    ] as const) {
      const examples = corpus.examples.filter(
        (example) =>
          example.wording === wording,
      );

      expect(examples.length).toBeGreaterThanOrEqual(4);
      expect(
        new Set(
          examples.map(
            (example) =>
              example.causallyResponsibleMatterId,
          ),
        ),
      ).toEqual(
        new Set([
          MATERIAL_FIXTURE_MATTER_IDS.worker,
          MIXED_PRESSURE_MATTER_IDS.reportResponse,
        ]),
      );

      for (const example of examples) {
        expect(example.queryEndTick).toBe(
          example.anchorTick,
        );
        expect(example.candidateMatters).toHaveLength(2);

        const changed =
          example.candidateMatters.filter(
            (matter) =>
              JSON.stringify(
                example.ablationDecisionByMatterId[
                  matter.id
                ],
              ) !==
              JSON.stringify(
                example.baselineDecision,
              ),
          );

        expect(changed).toHaveLength(1);
        expect(changed[0]!.id).toBe(
          example.causallyResponsibleMatterId,
        );
      }
    }
  }, 30_000);

  it("keeps wording-only counterfactuals paired on identical private transition histories and causal labels", () => {
    const baseline = new Map(
      corpus.examples
        .filter(
          (example) =>
            example.wording === "baseline",
        )
        .map((example) => [
          example.anchorTick,
          example,
        ]),
    );

    const paraphrase = corpus.examples.filter(
      (example) =>
        example.wording === "paraphrase",
    );

    let paired = 0;
    for (const example of paraphrase) {
      const other = baseline.get(
        example.anchorTick,
      );
      if (!other) continue;
      paired += 1;

      expect(
        example.transitionHistory,
      ).toEqual(other.transitionHistory);
      expect(
        example.causallyResponsibleMatterId,
      ).toBe(
        other.causallyResponsibleMatterId,
      );
      expect(
        example.candidateMatters.map(
          (matter) => matter.statement,
        ),
      ).not.toEqual(
        other.candidateMatters.map(
          (matter) => matter.statement,
        ),
      );
    }

    expect(paired).toBeGreaterThanOrEqual(4);
  }, 30_000);

  it("makes report-responsible queries visibly contain decision-time private speech evidence", () => {
    const reportExamples = corpus.examples.filter(
      (example) =>
        example.causallyResponsibleMatterId ===
        MIXED_PRESSURE_MATTER_IDS.reportResponse,
    );

    expect(reportExamples.length).toBeGreaterThan(0);

    for (const example of reportExamples) {
      expect(
        example.transitionHistory[
          example.transitionHistory.length - 1
        ],
      ).toContain("heard speech");
    }
  });

  it("exposes the current context-only speech shortcut before any learned relation training", () => {
    for (const wording of [
      "baseline",
      "paraphrase",
    ] as const) {
      const audit =
        auditR3MixedPressureContextShortcuts(
          corpus,
          wording,
        );

      console.info(
        "R3_MIXED_PRESSURE_CONTEXT_SHORTCUT",
        JSON.stringify(audit),
      );

      expect(
        audit.majorityBaselineAccuracy,
      ).toBe(0.5);
      expect(
        audit.lastTransitionSpeechGateAccuracy,
      ).toBe(1);
      expect(
        audit.reportWithLastTransitionSpeech,
      ).toBeGreaterThan(0);
      expect(
        audit.reportWithoutLastTransitionSpeech,
      ).toBe(0);
      expect(
        audit.workshopWithLastTransitionSpeech,
      ).toBe(0);
      expect(
        audit.workshopWithoutLastTransitionSpeech,
      ).toBeGreaterThan(0);
    }
  }, 30_000);

  it("shows that causal-responsibility labels can flip under hidden fixture matter wiring while baseline private life stays identical", () => {
    const candidates =
      r3MixedPressureJanekMatters("baseline");

    const survey = createR3MixedPressureRun({
      janekMatterOverrides: candidates,
    });
    survey.runTicks(700);

    const reportRow =
      survey.privateExperiences().find(
        (experience) =>
          experience.residentId ===
            "resident:janek" &&
          experience.observation.heardEvents.some(
            (event) =>
              event.kind === "speech" &&
              event.actorId === "resident:ida",
          ),
      );

    expect(reportRow).toBeDefined();
    const anchorTick = reportRow!.tick;

    function rowAfter(
      reportGateMatterId: string,
      retainedMatters:
        readonly (typeof candidates)[number][],
    ) {
      const run = createR3MixedPressureRun({
        janekMatterOverrides: candidates,
        janekReportGateMatterId:
          reportGateMatterId,
      });
      run.runTicks(anchorTick);
      run.researchReplaceResidentMatters(
        "resident:janek",
        retainedMatters,
      );
      run.advanceOneTick();

      const row =
        run.privateExperiences().find(
          (experience) =>
            experience.residentId ===
              "resident:janek" &&
            experience.tick === anchorTick,
        );
      expect(row).toBeDefined();
      return row!;
    }

    const defaultBaseline = rowAfter(
      MIXED_PRESSURE_MATTER_IDS.reportResponse,
      candidates,
    );
    const swappedBaseline = rowAfter(
      MATERIAL_FIXTURE_MATTER_IDS.worker,
      candidates,
    );

    expect(
      swappedBaseline.observation,
    ).toEqual(defaultBaseline.observation);
    expect(swappedBaseline.memory).toEqual(
      defaultBaseline.memory,
    );
    expect(swappedBaseline.matters).toEqual(
      defaultBaseline.matters,
    );
    expect(swappedBaseline.decision).toEqual(
      defaultBaseline.decision,
    );

    const withoutReport = candidates.filter(
      (matter) =>
        matter.id !==
        MIXED_PRESSURE_MATTER_IDS.reportResponse,
    );
    const withoutWorker = candidates.filter(
      (matter) =>
        matter.id !==
        MATERIAL_FIXTURE_MATTER_IDS.worker,
    );

    const defaultWithoutReport = rowAfter(
      MIXED_PRESSURE_MATTER_IDS.reportResponse,
      withoutReport,
    );
    const defaultWithoutWorker = rowAfter(
      MIXED_PRESSURE_MATTER_IDS.reportResponse,
      withoutWorker,
    );
    const swappedWithoutReport = rowAfter(
      MATERIAL_FIXTURE_MATTER_IDS.worker,
      withoutReport,
    );
    const swappedWithoutWorker = rowAfter(
      MATERIAL_FIXTURE_MATTER_IDS.worker,
      withoutWorker,
    );

    const baselineDecision =
      JSON.stringify(defaultBaseline.decision);

    const defaultResponsible =
      JSON.stringify(
        defaultWithoutReport.decision,
      ) !== baselineDecision
        ? MIXED_PRESSURE_MATTER_IDS.reportResponse
        : MATERIAL_FIXTURE_MATTER_IDS.worker;

    const swappedResponsible =
      JSON.stringify(
        swappedWithoutWorker.decision,
      ) !== baselineDecision
        ? MATERIAL_FIXTURE_MATTER_IDS.worker
        : MIXED_PRESSURE_MATTER_IDS.reportResponse;

    expect(
      JSON.stringify(
        defaultWithoutReport.decision,
      ),
    ).not.toBe(baselineDecision);
    expect(
      JSON.stringify(
        defaultWithoutWorker.decision,
      ),
    ).toBe(baselineDecision);

    expect(
      JSON.stringify(
        swappedWithoutWorker.decision,
      ),
    ).not.toBe(baselineDecision);
    expect(
      JSON.stringify(
        swappedWithoutReport.decision,
      ),
    ).toBe(baselineDecision);

    expect(defaultResponsible).toBe(
      MIXED_PRESSURE_MATTER_IDS.reportResponse,
    );
    expect(swappedResponsible).toBe(
      MATERIAL_FIXTURE_MATTER_IDS.worker,
    );

    console.info(
      "R3_MIXED_PRESSURE_POLICY_WIRING_FALSIFIER",
      JSON.stringify({
        anchorTick,
        baselinePrivateObservationEqual: true,
        baselineDecisionEqual: true,
        defaultResponsible,
        swappedResponsible,
      }),
    );
  }, 30_000);

  it("audits identifiability and lexical shortcuts before any mixed-pressure model run", () => {
    const audits = [
      auditR3MixedPressureCausalResponsibility(
        corpus,
        "baseline",
      ),
      auditR3MixedPressureCausalResponsibility(
        corpus,
        "paraphrase",
      ),
    ];

    console.info(
      "R3_MIXED_PRESSURE_CAUSAL_RESPONSIBILITY",
      JSON.stringify(audits),
    );

    for (const audit of audits) {
      expect(audit.exampleCount).toBeGreaterThanOrEqual(4);
      expect(audit.reportResponsibleCount).toBe(
        audit.workshopResponsibleCount,
      );
      expect(audit.reportResponsibleCount).toBeGreaterThan(0);
      expect(audit.chanceTop1).toBe(0.5);
      expect(
        audit.uniqueTransitionHistoryCount,
      ).toBeGreaterThan(2);
    }
  }, 30_000);
});
